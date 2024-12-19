import OpenAI from 'openai';

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
        // Erstelle einen neuen Thread, falls nicht vorhanden
        const thread = await openai.beta.threads.retrieve(threadId);

        if (!thread) {
            throw new Error("Thread not found.");
        }

        // Füge die Nutzerfrage als Nachricht hinzu
        await openai.beta.threads.messages.create(thread.id, {
            role: 'user',
            content: [
                {
                    type: 'text',
                    text: userQuestion,
                }
            ],
        });

        const encoder = new TextEncoder();

        // Erstellen Sie einen ReadableStream für die Antwort
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    // Stream der Antwort von OpenAI
                    const run = openai.beta.threads.runs.stream(thread.id, {
                        assistant_id: 'asst_TpSCnmEDecxR9gWDLdkQ7b34',
                        model: 'gpt-4o-mini',
                    });

                    run.on('textDelta', (delta) => {
                        console.log(delta.value);
                        controller.enqueue(encoder.encode(delta.value)); // Sende den Text in den Stream
                    });

                    run.on('textDone', () => {
                        controller.close(); // Schließe den Stream, wenn der Text komplett ist
                        console.log("controller closed");
                    });

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

        return { stream };
    }

    try {
        const { stream } = await chatWithAssistant(threadId);

        return stream;


    } catch (error) {
        console.error('Error:', error);
        return Response.json({ error: "Failed to process the request." }, { status: 500 });
    }
});
