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
    if (userQuestion.length > 150) {
        return Response.json({ error: "Question exceeds 150 characters." }, { status: 400 });
    }
    if (!threadId) {
        return Response.json({ error: "ThreadId is missing." }, { status: 400 });
    }

    async function chatWithAssistant(threadId) {
        // Überprüfe, ob der Thread existiert
        const thread = await openai.beta.threads.retrieve(threadId);
        if (!thread) {
            throw new Error("Thread not found.");
        }

        let responseTo = null;

        try {
            // Prüfe, ob es bereits Nachrichten im Thread gibt
            const existingMessages = await executeQuery({
                query: `SELECT message_id FROM messages WHERE thread_id = ? ORDER BY created_at DESC LIMIT 1`,
                values: [threadId],
            });

            if (existingMessages.length > 0) {
                responseTo = existingMessages[0].message_id;
            }
        } catch (error) {
            console.error("SQL Error while checking for existing messages:", error);
            throw new Error("Failed to check for existing messages in the database.");
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

        try {
            // Speichere die Nutzer-Nachricht
            await executeQuery({
                query: `INSERT INTO messages (message_id, thread_id, userType, message_text, isResponse, responseTo) VALUES (?, ?, ?, ?, ?, ?)`,
                values: [userMessage.id, threadId, 'USER', userQuestion, responseTo ? 1 : 0, responseTo],
            });
        } catch (error) {
            console.error("SQL Error while saving user message:", error);
            throw new Error("Failed to save user message to the database.");
        }

        const encoder = new TextEncoder();
        // Erstellen Sie einen ReadableStream für die Antwort
        return new Response(new ReadableStream({
                async start(controller) {
                    try {
                        // Stream der Antwort von OpenAI
                        const run = openai.beta.threads.runs.stream(thread.id, {
                            assistant_id: 'asst_TpSCnmEDecxR9gWDLdkQ7b34',
                            model: 'gpt-4o-mini',
                            max_completion_tokens: 250
                        });
                        // Event-Listener für den TextDelta
                        run.on('textDelta', (delta) => {
                            const regex = /【\d+:\d+†source】/g;
                            const cleanedText = delta.value.replace(regex, "");

                            console.log(cleanedText);
                            controller.enqueue(encoder.encode(cleanedText));
                        });
                        run.on('textDone', async (msg) => {
                            const botMsg = await openai.beta.threads.messages.list(threadId);
                            const botMessageId = botMsg.data[0].id;
                            controller.enqueue(encoder.encode(JSON.stringify({done: true, messageId: botMessageId})));
                            controller.close();
                            console.log("controller closed");
                            try {
                                await executeQuery({
                                    query: 'INSERT INTO messages (message_id, thread_id, userType, message_text, isResponse, responseTo) VALUES (?, ?, ?, ?, ?, ?)',
                                    values: [botMessageId, threadId, 'BOT', msg.value, 1, userMessage.id],
                                });
                                // Aktualisiere isResponse für die User-Nachricht
                                await executeQuery({
                                    query: 'UPDATE messages SET isResponse = ? WHERE message_id = ?',
                                    values: [1, userMessage.id],
                                });
                            } catch (error) {
                                console.error("SQL Error while saving bot message:", error);
                                controller.error(error);
                            }
                        });
                        run.on('error', (err) => {
                            console.error('Stream Error:', err);
                            controller.error(err);
                        });
                    } catch (error) {
                        console.error('Stream Initialization Error:', error);
                        controller.error(error);
                    }
                },
            }),
            { headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                }}
        );
    }

    try {
        return await chatWithAssistant(threadId);

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ error: error.message || "Failed to process the request." }, { status: 500 });
    }
});
