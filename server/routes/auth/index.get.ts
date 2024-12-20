import executeQuery from "../../../lib/db";
import { generateSession } from "../../../lib/jwt";
import { v4 as uuidv4 } from "uuid"; // UUID-Bibliothek für die Sitzungs-ID

export default eventHandler(async (event) => {
    // Hole die IP-Adresse und den User-Agent aus der Anfrage
    const ipAddress = getRequestHeader(event, "x-forwarded-for") || event.node.req.socket.remoteAddress;
    const userAgent = getRequestHeader(event, "user-agent") || "Unknown";

    try {


        // Generiere eine eindeutige Sitzungs-ID
        const sessionId = uuidv4();

        // Generiere den JWT-Token
        const token = await generateSession({sessionId: sessionId}); // Leere Nutzlast, da keine user_id benötigt wird
        // Aktuelles Datum und Ablaufdatum
        const createdAt = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(createdAt.getDate() + 1); // Ablauf in 1 Tag

        // Schreibe die Sitzung in die Datenbank
        const result = await executeQuery({
            query: `
                INSERT INTO sessions (session_id, ip_address, user_agent, created_at, expires_at, is_active)
                VALUES (?, ?, ?, ?, ?, ?)
            `,
            values: [
                sessionId,
                ipAddress,
                userAgent,
                createdAt,
                expiresAt,
                true, // is_active
            ],
        });

        if (result.error) {
            throw new Error("Failed to save session to database");
        }

        // Rückgabe des Tokens und der Sitzungs-ID im Response-Body
        return {
            success: true,
            message: "Session created successfully",
            token: token, // Token wird an den Client gesendet
            sessionId: sessionId,
        };
    } catch (error) {
        console.error("Error generating session or saving to database:", error);
        return {
            success: false,
            message: "Failed to create session",
        };
    }
});
