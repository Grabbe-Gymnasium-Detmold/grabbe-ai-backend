import { defineEventHandler, getRequestHeader, getRequestURL } from "h3";
import { decryptJWT } from "../../lib/jwt";

const excludedRoutes = [
  "/auth",
  "/_nitro/*",
    "/examples/*",
];

export default defineEventHandler(async (event) => {
  const requestPath = getRequestURL(event).pathname;

  // Überprüfe, ob die aktuelle Route ausgeschlossen ist
  const isExcluded = excludedRoutes.some((route) => {
    if (route.endsWith("*")) {
      const prefix = route.slice(0, -1);
      return requestPath.startsWith(prefix);
    }
    return requestPath === route;
  });

  // Extrahiere das JWT-Token aus dem Authorization-Header
  const authHeader = getRequestHeader(event, "authorization");
  let jwt = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    jwt = authHeader.substring(7); // Entferne "Bearer " vom Header
  }

  if (jwt) {
    try {
      const user = await decryptJWT(jwt); // JWT entschlüsseln
      event.context.user = JSON.parse(user); // Benutzerinformationen im Kontext speichern
      event.context.jwt = jwt; // JWT im Kontext speichern
    } catch (error) {
      console.error("Invalid Session:", error.message);
      return Response.json({ error: "Invalid Session" }, { status: 401 });
    }
  } else if (!isExcluded) {
    // Wenn kein JWT vorhanden ist und die Route nicht ausgeschlossen ist, verweigern
    console.log("No JWT token found for protected route");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
});
