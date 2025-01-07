const fetch = require("node-fetch");
require("dotenv").config(); // Lädt die Umgebungsvariablen aus der .env-Datei

const ipInfoToken = process.env.IPINFO_API_KEY; // API-Key aus der .env-Datei

async function getGeoInfoFromIP(ipAddress) {
    if (!ipInfoToken) {
        throw new Error("IPINFO_API_KEY is not defined in .env file");
    }

    const url = `https://ipinfo.io/${ipAddress}?token=${ipInfoToken}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch geo info for IP: ${ipAddress}`);
        }
        const data = await response.json();
        const [latitude, longitude] = data.loc ? data.loc.split(",") : [null, null];

        return {
            country: data.country || null,
            city: data.city || null,
            latitude: latitude || null,
            longitude: longitude || null,
        };
    } catch (error) {
        console.error("Error fetching geo info:", error);
        return {
            country: null,
            city: null,
            latitude: null,
            longitude: null,
        };
    }
}

module.exports = { getGeoInfoFromIP };