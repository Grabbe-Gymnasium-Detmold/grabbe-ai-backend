import OpenAI from 'openai';
import executeQuery from "~~/lib/db";

export default eventHandler(async (event) => {
    const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });

    try {
        const thread = await openai.beta.threads.create();

        const vectorStoreIds = ['vs_aISnXuyx3qVySKPH11bU7D0y']; // Ersetzen Sie diese durch Ihre tatsächlichen IDs

        // Aktualisieren Sie den Thread mit den gewünschten Vektorspeichern
        await openai.beta.threads.update(thread.id, {
            tool_resources: {
                file_search: {
                    vector_store_ids: vectorStoreIds,
                },
            },
        });
        const sessionId:String = event.context.user.data.sessionId;
        try {
            await executeQuery({query: 'INSERT INTO threads (session_id, thread_id) VALUES (?,?)', values: [sessionId, thread.id]},)
            return Response.json({ threadId: thread.id });

        }catch (err){
            return Response.json({ error: "Failed to create a thread. SQL Connection failed" }, { status: 500 });
        }

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ error: "Failed to create a thread." }, { status: 500 });
    }
});
