import fs from 'fs/promises';
import CIDRMatcher from 'cidr-matcher';

export async function checkVPN(ip) {
    try {
        // Pfad zur Datei, die die IP-Netze enthält
        const filePath = './assets/vpn.txt';

        // Datei einlesen
        const data = await fs.readFile(filePath, 'utf-8');

        // IP-Netze aus der Datei in ein Array umwandeln
        const nets = data.split('\n').map(net => net.trim()).filter(net => net);

        // CIDRMatcher initialisieren
        const matcher = new CIDRMatcher(nets);

        // Prüfen, ob die IP-Adresse in den Netzen enthalten ist
        const isMatch = matcher.contains(ip);

        return isMatch;
    } catch (error) {
        console.error('Fehler beim Überprüfen der IP-Adresse:', error);
        throw error;
    }
}
export async function checkDatacenter(ip) {
    try {
        // Pfad zur Datei, die die IP-Netze enthält
        const filePath = './assets/datacenter.txt';

        // Datei einlesen
        const data = await fs.readFile(filePath, 'utf-8');

        // IP-Netze aus der Datei in ein Array umwandeln
        const nets = data.split('\n').map(net => net.trim()).filter(net => net);

        // CIDRMatcher initialisieren
        const matcher = new CIDRMatcher(nets);

        // Prüfen, ob die IP-Adresse in den Netzen enthalten ist
        const isMatch = matcher.contains(ip);

        return isMatch;
    } catch (error) {
        console.error('Fehler beim Überprüfen der IP-Adresse:', error);
        throw error;
    }
}