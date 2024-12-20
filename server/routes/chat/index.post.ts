import OpenAI from 'openai';
import executeQuery from "~~/lib/db";

class CustomError extends Error {
    private code: string;
    private details: {};
    constructor(message, code = 'UNKNOWN', details = {}) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.details = details;
        this.stack = (new Error()).stack;
    }
}

export default eventHandler(async (event) => {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

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

    async function chatWithAssistant(threadId: string) {
        let thread;
        try {
            thread = await openai.beta.threads.retrieve(threadId);
        } catch (error) {
            console.error(new CustomError("Failed to retrieve thread", 'THREAD_RETRIEVE_ERROR', { threadId }));
            throw new CustomError("Thread not found.", 'THREAD_NOT_FOUND');
        }

        if (!thread) {
            throw new CustomError("Thread not found.", 'THREAD_NOT_FOUND');
        }

        let userMessage;
        try {
            userMessage = await openai.beta.threads.messages.create(thread.id, {
                role: 'user',
                content: [
                    { type: 'text', text: userQuestion },
                ],
            });
        } catch (error) {
            console.error(new CustomError("Failed to send user message", 'MESSAGE_CREATE_ERROR', { threadId, userQuestion }));
            throw new CustomError("Error sending user message.", 'MESSAGE_CREATE_ERROR');
        }

        // Datenbank-Operation für die Benutzer-Nachricht
        try {
            await executeQuery({
                query: `INSERT INTO messages (message_id, thread_id, userType, message_text, isResponse) VALUES (?, ?, ?, ?, ?)`,
                values: [userMessage.id, threadId, 'USER', userQuestion, 0],
            });
        } catch (error) {
            console.error(new CustomError("SQL Error during user message insert", 'SQL_INSERT_ERROR', { threadId, userMessage: userQuestion, error: error.message }));
            throw new CustomError("Database error: Could not insert user message.", 'SQL_INSERT_ERROR');
        }

        const encoder = new TextEncoder();

        return new ReadableStream({
            async start(controller) {
                let run;
                try {
                    run = openai.beta.threads.runs.stream(thread.id, {
                        assistant_id: 'asst_TpSCnmEDecxR9gWDLdkQ7b34',
                        model: 'gpt-4o-mini',
                        max_completion_tokens: 150
                    });
                } catch (error) {
                    console.error(new CustomError("Failed to start stream", 'STREAM_INIT_ERROR', { threadId }));
                    controller.error(new CustomError("Stream initialization error.", 'STREAM_INIT_ERROR'));
                    return;
                }

                // Event-Listener für den TextDelta
                run.on('textDelta', (delta) => {
                    controller.enqueue(encoder.encode(delta.value));
                });

                // Stream schließen, wenn der Text fertig ist
                run.on('textDone', async (msg) => {
                    controller.close();
                    const botMsg = await openai.beta.threads.messages.list(threadId);
                    const botMessageId = botMsg.data[0].id;

                    try {
                        // Speichere die Antwort des Bots in der DB
                        await executeQuery({
                            query: 'INSERT INTO messages (message_id, thread_id, userType, message_text, isResponse, responseTo) VALUES (?, ?, ?, ?, ?, ?)',
                            values: [botMessageId, threadId, 'BOT', msg.value, 1, userMessage.id],
                        });
                    } catch (error) {
                        console.error(new CustomError("SQL Error during bot message insert", 'SQL_INSERT_ERROR', { threadId, msg: msg.value }));
                        controller.error(new CustomError("Database error: Could not insert bot message.", 'SQL_INSERT_ERROR'));
                    }
                });

                // Fehler im Stream
                run.on('error', (err) => {
                    console.error(new CustomError("Stream error", 'STREAM_ERROR', { threadId, error: err.message }));
                    controller.error(new CustomError("Stream error.", 'STREAM_ERROR'));
                });
            },
        });
    }

    try {
        const stream = await chatWithAssistant(threadId);

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error(error);  // Fehler intern protokollieren
        return Response.json({ error: error.message }, { status: 500 });
    }
});
