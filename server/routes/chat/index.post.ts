import OpenAI from 'openai';

export default eventHandler(async (event) => {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    // Lese die Frage aus dem Request-Body
    const body = await readBody(event);
    const userQuestion = body?.question;

    if (!userQuestion) {
        return Response.json({error: "No question provided in request body."}, {status: 400});
    }

    async function chatWithAssistant() {
        // Erstelle einen neuen Thread
        const thread = await openai.beta.threads.create();

        // Fügen Sie die spezifischen Vektorspeicher-IDs hinzu, die die gewünschten Dateien enthalten
        const vectorStoreIds = ['vs_pA0tzm1u3bBjQ5QrknVXOsab']; // Ersetzen Sie diese durch Ihre tatsächlichen IDs

        // Aktualisieren Sie den Thread mit den gewünschten Vektorspeichern
        await openai.beta.threads.update(thread.id, {
            tool_resources: {
                file_search: {
                    vector_store_ids: vectorStoreIds,
                },
            },
        });

        // Fügen Sie die Nutzerfrage als Nachricht hinzu
        await openai.beta.threads.messages.create(thread.id, {
            role: 'user',

            content: [
                {
                    type: 'text',
                    text: userQuestion,
                }],
        });

        const encoder = new TextEncoder();

        // Erstellen Sie einen ReadableStream für die Antwort
        const stream = new ReadableStream({
            async start(controller) {
                const run = openai.beta.threads.runs.stream(thread.id, {
                    assistant_id: 'asst_TpSCnmEDecxR9gWDLdkQ7b34',
                    model: 'gpt-4o-mini',
                });

                run.on('textDelta', (delta) => {
                    controller.enqueue(encoder.encode(delta.value));
                });

                run.on('textDone', () => {
                    controller.close();
                });
            },
        });

        return {threadId: thread.id, stream};
    }

    try {
        const {threadId, stream} = await chatWithAssistant();

        // Setze die Thread-ID als Header
        setResponseHeader(event, 'X-Thread-ID', threadId);

        // Rückgabe des Streams
        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
            },
        });
    } catch (error) {
        console.error('Error:', error);
        return Response.json({error: "Failed to process the request."}, {status: 500});
    }
});

