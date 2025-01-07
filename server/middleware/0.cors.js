export default defineEventHandler(async (event) => {
  // Hole den Ursprung der Anfrage oder verwende einen Standardwert für die lokale Entwicklung
  const origin = getRequestHeader(event, 'origin') || 'http://localhost:3000';

  // Definiere eine Funktion, um Wildcards dynamisch zu überprüfen
  const allowedOrigins = ['https://grabbe.site', 'https://subdomain.grabbe.site', 'https://grabbe.tech'];

  const isAllowedOrigin = (origin) => {
    return allowedOrigins.some((allowedOrigin) => {
      if (allowedOrigin.includes('*')) {
        // Wildcards verarbeiten
        const regex = new RegExp(`^${allowedOrigin.replace('*.', '.*')}$`);
        return regex.test(origin);
      }
      return allowedOrigin === origin;
    });
  };

  // Überprüfe, ob der Ursprung erlaubt ist
  if (isAllowedOrigin(origin)) {
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': origin, // Setze den erlaubten Ursprung
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Erlaube spezifische HTTP-Methoden
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With, Accept', // Erlaube spezifische Header
      'Access-Control-Allow-Credentials': 'true', // Erforderlich, wenn Anmeldeinformationen wie Cookies gesendet werden
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

  // Füge hier zusätzlichen Code für die Verarbeitung anderer Anfragen hinzu (falls erforderlich)
});