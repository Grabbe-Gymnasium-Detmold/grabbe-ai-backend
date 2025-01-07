const executeQuery = require("../../../lib/db");
const { generateSession } = require("../../../lib/jwt");
const { v4: uuidv4 } = require("uuid"); // UUID-Bibliothek für die Sitzungs-ID
const { getGeoInfoFromIP } = require("../../../lib/ipinfo"); // Importiere die Geo-Funktion

module.exports = async (event) => {
    const ipAddress = event.node.req.headers["x-forwarded-for"] || event.node.req.socket.remoteAddress;
    const userAgent = event.node.req.headers["user-agent"] || "Unknown";

    try {
        const sessionId = uuidv4();
        const token = await generateSession({ sessionId });

        const createdAt = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(createdAt.getDate() + 1); // Ablauf in 1 Tag

        // Hole Geo-Informationen
        const geoInfo = await getGeoInfoFromIP(ipAddress);

        // Schreibe die Sitzung in die Datenbank
        const result = await executeQuery({
            query: `
                INSERT INTO sessions (session_id, ip_address, user_agent, created_at, expires_at, is_active, country, city, latitude, longitude)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            values: [
                sessionId,
                ipAddress,
                userAgent,
                createdAt,
                expiresAt,
                true, // is_active
                geoInfo.country,
                geoInfo.city,
                geoInfo.latitude,
                geoInfo.longitude,
            ],
        });

        if (result.error) {
            throw new Error("Failed to save session to database");
        }

        return {
            success: true,
            message: "Session created successfully",
            token,
            sessionId,
        };
    } catch (error) {
        console.error("Error generating session or saving to database:", error);
        return {
            success: false,
            message: "Failed to create session",
        };
    }
};