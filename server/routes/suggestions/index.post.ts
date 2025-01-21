import executeQuery from "~~/lib/db";

export default eventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const userQuestion = body?.question;
        const userAnswer = body?.answer; // optional
        const threadId = body?.sessionId;

        // 1) Validierung
        if (!userQuestion) {
            return Response.json(
                { error: "No question provided in request body." },
                { status: 400 }
            );
        }
        // Beispiel: Länge max. 150 Zeichen (analog zu /chat/index.post.ts)
        if (userQuestion.length > 150) {
            return Response.json(
                { error: "Question exceeds 150 characters." },
                { status: 400 }
            );
        }
        if (!threadId) {
            return Response.json(
                { error: "ThreadId is missing." },
                { status: 400 }
            );
        }

        // 2) In DB speichern
        // created_at wird automatisch per DEFAULT CURRENT_TIMESTAMP gefüllt
        const insertQuery = `
      INSERT INTO suggestions (question, answer, thread_id)
      VALUES (?, ?, ?)
    `;
        const values = [userQuestion, userAnswer || null, threadId];

        const result = await executeQuery({ query: insertQuery, values });

        if (result.error) {
            throw new Error("Failed to insert suggestion: " + result.error);
        }

        // 3) Erfolgsmeldung zurück
        return Response.json(
            { success: true, message: "Suggestion saved successfully!" },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Error in POST /suggestions:", error);
        return Response.json(
            { error: error.message || "Failed to save suggestion." },
            { status: 500 }
        );
    }
});
