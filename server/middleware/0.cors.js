export default defineEventHandler(async (event) => {
  const origin = getRequestHeader(event, 'origin') || 'http://localhost:3000'; // Standard-Origin für lokale Entwicklung
  const allowedOrigins = ['https://example.com', 'https://anotherdomain.com']; // Liste erlaubter Domains

  if (allowedOrigins.includes(origin)) {
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Requested-With, Accept',
      'Access-Control-Allow-Credentials': 'true', // Nur, wenn Anmeldeinformationen erforderlich sind
    });
  } else {
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': 'null', // Blockiere nicht erlaubte Ursprünge
    });
  }

  // Behandle OPTIONS-Preflight-Anfragen
  if (getMethod(event) === 'OPTIONS') {
    setResponseStatus(event, 204); // Kein Inhalt
    setResponseHeaders(event, {
      'Content-Length': '0',
    });
    return ''; // Beende die Verarbeitung
  }
});