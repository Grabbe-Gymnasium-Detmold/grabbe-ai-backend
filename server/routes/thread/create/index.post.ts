import OpenAI from 'openai';
import executeQuery from "~~/lib/db";

export default eventHandler(async (event) => {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const thread = await openai.beta.threads.create();

        const vectorStoreIds = ['vs_h2EOQE1UVgYz6FeFOOvsN2Cy']; // Ersetzen Sie diese durch Ihre tatsächlichen IDs

        // Aktualisieren Sie den Thread mit den gewünschten Vektorspeichern
        await openai.beta.threads.update(thread.id, {
            tool_resources: {
                file_search: {
                    vector_store_ids: vectorStoreIds,
                },
            },
        });
        const sessionId:String = event.context.user.sessionId;
        await executeQuery({query: 'INSERT INTO threads (session_id, tthread_id) VALUES (?,?)', values: [sessionId, thread.id]},)

        return Response.json({ threadId: thread.id });
    } catch (error) {
        console.error('Error:', error);
        return Response.json({ error: "Failed to create a thread." }, { status: 500 });
    }
});
