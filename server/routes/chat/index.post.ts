import OpenAI from 'openai';
import executeQuery from "~~/lib/db";

export default eventHandler(async (event) => {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    // Lese die Frage aus dem Request-Body
    const body = await readBody(event);
    const userQuestion = body?.question;
    const threadId = body?.threadId;

    if (!userQuestion) {
        return Response.json({ error: "No question provided in request body." }, { status: 400 });
    }
    if (!threadId) {
        return Response.json({ error: "ThreadId is missing." }, { status: 400 });
    }

    async function chatWithAssistant(threadId: string) {
        // Überprüfe, ob der Thread existiert
        const thread = await openai.beta.threads.retrieve(threadId);

        if (!thread) {
            throw new Error("Thread not found.");
        }

        // Füge die Nutzerfrage als Nachricht hinzu


        const userMessage = await openai.beta.threads.messages.create(thread.id, {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: userQuestion,
                }
            ],
        });

        await executeQuery({
            query: `INSERT INTO messages (message_id, thread_id, userType, message_text, isResponse) VALUES (?, ?, ?, ?, ?)`,
            values: [userMessage.id, threadId, 'USER', userQuestion, 0],
        });
        const encoder = new TextEncoder();

        // Erstellen Sie einen ReadableStream für die Antwort
        return new ReadableStream({
            async start(controller) {
                try {
                    // Stream der Antwort von OpenAI
                    const run = openai.beta.threads.runs.stream(thread.id, {
                        assistant_id: 'asst_TpSCnmEDecxR9gWDLdkQ7b34',
                        model: 'gpt-4o-mini',
                    });


                    // Event-Listener für den TextDelta, der kontinuierlich Text vom Assistant liefert
                    run.on('textDelta', (delta) => {
                        console.log(delta.value);
                        controller.enqueue(encoder.encode(delta.value)); // Enqueue Text in den Stream
                    });

                    // Wenn der Text komplett ist, wird der Stream geschlossen
                    run.on('textDone', async (msg) => {
                        controller.close(); // Schließe den Stream, wenn der Text komplett ist
                        console.log("controller closed");

                        // Prüfe, ob msg ein String ist

                        // Generiere die Bot-Message-ID
                        const botMessageId = run.currentRun().id;
                        const botMsg = await openai.beta.threads.messages.list(threadId);
                        console.log(botMsg.data[0].content);
                        try {
                            // Speichere die Nachricht des Bots in der Datenbank
                            await executeQuery({
                                query: 'INSERT INTO messages (message_id, thread_id, userType, message_text, isResponse) VALUES (?, ?, ?, ?, ?)',
                                values: [botMessageId, threadId, 'BOT', msg.value, 1],
                            });
                        } catch (error) {
                            console.error("SQL Error:", error);
                        }
                    });

                    // Fehlerbehandlung für den Stream
                    run.on('error', (err) => {
                        console.error('Stream Error:', err);
                        controller.error(err); // Fehler behandeln und Stream schließen
                    });
                } catch (error) {
                    console.error('Stream Initialization Error:', error);
                    controller.error(error); // Fehler bei der Initialisierung des Streams
                }
            },
        });
    }

    try {
        // Aufruf der Funktion, die den Stream zurückgibt
        const stream = await chatWithAssistant(threadId);

        // Rückgabe des Streams als HTTP-Antwort
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',  // Content-Type für Event-Streaming
                'Cache-Control': 'no-cache',         // Verhindert Caching
                'Connection': 'keep-alive',          // Hält die Verbindung offen
            },
        });
    } catch (error) {
        console.error('Error:', error);
        return Response.json({ error: "Failed to process the request." }, { status: 500 });
    }
});
