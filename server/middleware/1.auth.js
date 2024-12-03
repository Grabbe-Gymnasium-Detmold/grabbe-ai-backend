import { defineEventHandler, getCookie, getRequestURL } from "h3";
import { decryptJWT } from "../../lib/jwt";

const excludedRoutes = [
  "/auth/*",
  "/_nitro/*"
];

export default defineEventHandler(async (event) => {
  const requestPath = getRequestURL(event).pathname;

  const isExcluded = excludedRoutes.some((route) => {
    if (route.endsWith("*")) {
      const prefix = route.slice(0, -1);
      return requestPath.startsWith(prefix);
    }
    return requestPath === route;
  });

  const jwt = getCookie(event, "session_token");

  if (jwt) {
    try {
      const user = await decryptJWT(jwt);
      event.context.user = JSON.parse(user);
      event.context.jwt = jwt; 
    } catch (error) {
      console.error("Invalid Session:", error.message);
      return Response.json({ error: "Invalid Session" }, { status: 401 });
    }
  } else if (!isExcluded) {
    console.log("No JWT token found for protected route");
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
});
