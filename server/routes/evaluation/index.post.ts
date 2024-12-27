import executeQuery from "~~/lib/db";

export default eventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const { threadId, messageId, evaluation } = body || {};

        // Validate input
        if (!threadId || !messageId || !evaluation) {
            return Response.json({
                error: `Missing required fields: ${!threadId ? 'threadId ' : ''}${!messageId ? 'messageId ' : ''}${!evaluation ? 'evaluation ' : ''}`.trim()
            }, { status: 400 });
        }

        if (!["positive", "negative"].includes(evaluation)) {
            return Response.json({ error: "Evaluation must be either 'positive' or 'negative'." }, { status: 400 });
        }

        const evaluationSql = evaluation === "positive" ? 'UP' : 'DOWN';
        console.log(messageId, threadId, evaluationSql);
        // Check message existence and validation
        const result = await executeQuery({ query: 'SELECT * FROM messages WHERE message_id = ?', values: [messageId] });

        if (result.length === 0) {
            return Response.json({ error: "Message not found." }, { status: 404 });
        }

        const message = result[0];

        if (message.thread_id !== threadId) {
            return Response.json({ error: "Message not found in thread." }, { status: 404 });
        }

        if (message.evaluation !== null) {
            return Response.json({ error: "Message already evaluated." }, { status: 400 });
        }

        if (message.userType === 'USER') {
            return Response.json({ error: "Cannot evaluate user messages." }, { status: 400 });
        }

        // Update evaluation
        await executeQuery({
            query: "UPDATE messages SET evaluation = ? WHERE message_id = ?",
            values: [evaluationSql, messageId],
        });

        return Response.json({ success: true }, { status: 200 });
    } catch (err) {
        console.error('Error:', err);

        // Differentiate SQL error
        if (err.message.includes('SQL')) {
            return Response.json({ error: "SQL error occurred." }, { status: 500 });
        }

        return Response.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
});
