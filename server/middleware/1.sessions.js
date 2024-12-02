import { generateSession } from "../../lib/jwt";
export default defineEventHandler(async (event) => {
    if(event.req.headers['session']){
        event.context.session = JSON.parse(event.req.headers['session']);
        console.log("Session: " + event.context.session)
    }else{
        const session = await generateSession();
        event.res.setHeader('session', JSON.stringify({session}));
        console.log("new Session: " + session)
    }
        
})