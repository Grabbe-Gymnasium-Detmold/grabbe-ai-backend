export default defineEventHandler(async (event) => {
  // Hole den Ursprung der Anfrage oder verwende einen Standardwert für die lokale Entwicklung
  const origin = getRequestHeader(event, 'origin') || 'http://localhost:3000';

  // Definiere die Hauptdomain und erlaube alle Subdomains
  const allowedOrigins = ['https://grabbe.site', 'https://*.grabbe.site', 'https://grabbe.tech'];

  // Überprüfe, ob der Ursprung erlaubt ist (inkl. Wildcard für Subdomains)
  const isAllowedOrigin = (origin) => {
    return allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin.includes('*')) {
        // Erstelle einen Regex für Wildcard-Verarbeitung
        const regex = new RegExp(`^${allowedOrigin.replace(/\*\./g, '.*')}$`);
        return regex.test(origin);
      }
      return allowedOrigin === origin;
    });
  };

  if (isAllowedOrigin(origin)) {
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': origin, // Erlaube den Ursprung dynamisch
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Erlaube HTTP-Methoden
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With, Accept', // Erlaube Header
      'Access-Control-Allow-Credentials': 'true', // Anmeldeinformationen zulassen
    });
  } else {
    // Blockiere nicht erlaubte Ursprünge
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': 'null',
    });
  }

  // Behandle OPTIONS-Preflight-Anfragen
  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204); // Kein Inhalt
    setResponseHeaders(event, {
      'Content-Length': '0',
    });
    return ''; // Beende die Verarbeitung der Anfrage
  }

  // Weitere Verarbeitung der Anfrage, falls notwendig
});