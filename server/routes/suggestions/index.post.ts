import executeQuery from "../../../lib/db";

export default eventHandler(async (event) => {
    try {
        // Request-Body einlesen (per Nitro kann man z.B. `readBody(event)` verwenden)
        const body = await readBody(event);
        const { question, answer } = body;

        // Validierung (z.B. Frage ist Pflicht)
        if (!question) {
            return Response.json(
                { error: "Missing 'question' field" },
                { status: 400 }
            );
        }

        // Insert-Query vorbereiten
        const query = `INSERT INTO suggestions (question, answer) VALUES (?, ?)`;
        const values = [question, answer || null];

        // Insert ausführen
        const result = await executeQuery({ query, values });

        // Fehlerbehandlung
        if (result.error) {
            throw new Error("Error inserting suggestion: " + result.error);
        }

        // Erfolgsantwort
        return Response.json(
            {
                success: true,
                message: "Suggestion saved successfully!",
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error in POST /suggestions:", error);
        return Response.json(
            { error: error.message || "Unknown error while saving suggestion" },
            { status: 500 }
        );
    }
});
