import executeQuery from "../../../lib/db";
import { generateSession } from "../../../lib/jwt";
import { v4 as uuidv4 } from "uuid"; // UUID-Bibliothek für die Sitzungs-ID
import OpenAI from 'openai';

export default eventHandler(async (event) => {
    // Hole die IP-Adresse und den User-Agent aus der Anfrage
    const ipAddress = getRequestHeader(event, "x-forwarded-for") || event.node.req.socket.remoteAddress;
    const userAgent = getRequestHeader(event, "user-agent") || "Unknown";

    try {
        // Generiere den JWT-Token
        const token = await generateSession({}); // Leere Nutzlast, da keine user_id benötigt wird

        // Generiere eine eindeutige Sitzungs-ID
        const sessionId = uuidv4();

        // Aktuelles Datum und Ablaufdatum
        const createdAt = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(createdAt.getDate() + 7); // Ablauf in 7 Tagen

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

        // Initialisiere OpenAI und erstelle einen neuen Thread
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const thread = await openai.beta.threads.create();

        const vectorStoreIds = ['vs_pA0tzm1u3bBjQ5QrknVXOsab']; // Ersetzen Sie diese durch Ihre tatsächlichen IDs

        // Aktualisieren Sie den Thread mit den gewünschten Vektorspeichern
        await openai.beta.threads.update(thread.id, {
            tool_resources: {
                file_search: {
                    vector_store_ids: vectorStoreIds,
                },
            },
        });

        // Rückgabe des Tokens, der Sitzungs-ID und der Thread-ID im Response-Body
        return {
            success: true,
            message: "Session and thread created successfully",
            token: token, // Token wird an den Client gesendet
            sessionId: sessionId,
            threadId: thread.id,
        };
    } catch (error) {
        console.error("Error generating session or saving to database or creating thread:", error);
        return {
            success: false,
            message: "Failed to create session or thread",
        };
    }
});
