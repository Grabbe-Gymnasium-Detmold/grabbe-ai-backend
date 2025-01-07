// /server/routes/auth/index.get.ts

import executeQuery from "../../../lib/db";
import { generateSession } from "../../../lib/jwt";
import { v4 as uuidv4 } from "uuid"; // UUID-Bibliothek für die Sitzungs-ID
import fetch from 'node-fetch'; // HTTP-Client, falls nicht bereits verfügbar
import dotenv from 'dotenv';

dotenv.config(); // Lädt Umgebungsvariablen aus der .env-Datei

export default eventHandler(async (event) => {
    // Hole die IP-Adresse und den User-Agent aus der Anfrage
    const ipAddress = getRequestHeader(event, "x-forwarded-for") || event.node.req.socket.remoteAddress;
    const userAgent = getRequestHeader(event, "user-agent") || "Unknown";

    // Initialisiere Geodaten als null
    let country: string | null = null;
    let city: string | null = null;
    let latitude: number | null = null;
    let longitude: number | null = null;

    try {
        // Prüfe, ob eine gültige IP-Adresse vorliegt
        if (ipAddress && ipAddress !== '::1' && ipAddress !== '127.0.0.1') { // Exkludiere lokale Adressen
            const apiKey = process.env.IPINFO_API_KEY;
            if (apiKey) {
                const geoResponse = await fetch(`https://ipinfo.io/${ipAddress}/json?token=${apiKey}`);

                if (geoResponse.ok) {
                    const geoData = await geoResponse.json();
                    country = geoData.country || null;
                    city = geoData.city || null;

                    if (geoData.loc) {
                        const [lat, lon] = geoData.loc.split(',');
                        latitude = parseFloat(lat);
                        longitude = parseFloat(lon);
                    }
                } else {
                    console.warn(`IpInfo API responded with status: ${geoResponse.status}`);
                }
            } else {
                console.warn("IPINFO_API_KEY is not set in the environment variables.");
            }
        } else {
            console.warn("Invalid or local IP address, skipping geolocation.");
        }
    } catch (error) {
        console.error("Error fetching geolocation data:", error);
        // Geodaten bleiben null, Sitzung wird trotzdem erstellt
    }

    try {
        // Generiere eine eindeutige Sitzungs-ID
        const sessionId = uuidv4();

        // Generiere den JWT-Token
        const token = await generateSession({ sessionId: sessionId }); // Leere Nutzlast, da keine user_id benötigt wird

        // Aktuelles Datum und Ablaufdatum
        const createdAt = new Date();
        const expiresAt = new Date();
        expiresAt.setDate(createdAt.getDate() + 1); // Ablauf in 1 Tag

        // Schreibe die Sitzung in die Datenbank
        const result = await executeQuery({
            query: `
                INSERT INTO sessions 
                (session_id, ip_address, user_agent, country, city, latitude, longitude, created_at, expires_at, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            values: [
                sessionId,
                ipAddress,
                userAgent,
                country,
                city,
                latitude,
                longitude,
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