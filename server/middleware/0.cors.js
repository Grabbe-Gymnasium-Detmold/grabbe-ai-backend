export default defineEventHandler(async (event) => {
    const origin = getRequestHeader(event, 'origin') || 'http://localhost:3000'; // Standard-URL für Entwicklung
  
    // Erlaube spezifische Ursprünge oder alle (*)
    setResponseHeaders(event, {
      'Access-Control-Allow-Origin': origin, // Für spezifische URLs: 'https://example.com'
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Credentials': 'true', // Wenn Cookies/Token verwendet werden
    });
  
    // Behandle OPTIONS-Preflight-Anfragen
    if (getMethod(event) === 'OPTIONS') {
      setResponseStatus(event, 204); // Kein Inhalt
      return ''; // Beende die Verarbeitung für OPTIONS
    }
  });
  