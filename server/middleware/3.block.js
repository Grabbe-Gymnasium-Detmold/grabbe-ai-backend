import {checkDatacenter, checkVPN} from "~~/lib/blockIPs";

export default defineEventHandler(async (event) => {
    const ip = getRequestHeader(event, "x-forwarded-for") || event.node.req.socket.remoteAddress
    if(await checkVPN(ip) || await checkDatacenter(ip)) {
        return Response.json({"status": "error", "message": "Nice try, but we don´t allow VPNS!"}, {status: 451});

    }


});
