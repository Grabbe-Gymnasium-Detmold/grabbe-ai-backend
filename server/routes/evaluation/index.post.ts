import executeQuery from "~~/lib/db";

export default eventHandler(async (event) => {

    const body = await readBody(event);
    const threadId:String = body?.threadId;
    const messageId:String = body?.messageId;
    const evaluation:String = body?.evaluation;

    if (!threadId) {
        return Response.json({ error: "ThreadId is missing." }, { status: 400 });
    }
    if(!messageId){
        return Response.json({ error: "MessageId is missing." }, { status: 400 });
    }
    if(!evaluation){
        return Response.json({ error: "Evaluation is missing." }, { status: 400 });
    }
    if(evaluation != "positive" && evaluation != "negative"){
        return Response.json({ error: "Evaluation must be either 'positive' or 'negative'." }, { status: 400 });
    }
    const evaluation_sql:String = evaluation == "positive" ? 'UP' : 'DOWN';
    try {
        const result = await executeQuery({query: 'SELECT * FROM messages WHERE message_id = ?', values: [messageId]})
        if(result.length == 0){
            return Response.json({ error: "Message not found." }, { status: 404 });
        }
        if(result[0].thread_id != threadId){
            return Response.json({ error: "Message not found in thread." }, { status: 404 });
        }
        if(result[0].evaluation != null) {
            return Response.json({error: "Message already evaluated."}, {status: 400});
        }
        if(result[0].userType == 'USER'){
            return Response.json({ error: "Cannot evaluate user messages." }, { status: 400 });
        }
    }catch (err){
        return Response.json({ error: "Failed to set evaluation. SQL Connection failed" }, { status: 500 });
    }
    try {
        try {
            await executeQuery({query: "UPDATE messages SET evaluation = ? WHERE message_id = ?", values: [evaluation_sql, messageId]})

            return Response.json({ success: true }, { status: 200 });
        }catch (err){
            return Response.json({ error: "Failed to set evaluation. SQL Update Failed" }, { status: 500 });
        }

    } catch (error) {
        console.error('Error:', error);
        return Response.json({ error: "Failed to set evaluation" }, { status: 500 });
    }
});
