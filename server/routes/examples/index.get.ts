import executeQuery from "../../../lib/db";


export default eventHandler(async (event) => {

    try {
        // Schreibe die Sitzung in die Datenbank
        const result = await executeQuery({
            query: `SELECT value FROM settings WHERE setting = ?`,
            values: ["frontend.exampleQuestions"],
        });

        if (result.error) {
            throw new Error("Failed to Load example Questions");
        }

        return  Response.json({"success": true, questions: JSON.stringify(result[0].value)});
    } catch (error) {
        console.error("Error loading questions from datatabase:", error);
        return Response.json({"error": error.message}, {status: 500});
    }
});
