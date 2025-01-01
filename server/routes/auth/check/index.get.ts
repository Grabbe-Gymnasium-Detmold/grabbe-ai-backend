import executeQuery from "~~/lib/db";
export default eventHandler(async (event) => {
    try {
        const sessionId:String = event.context.user.data.sessionId;
        try {
            const result = await executeQuery({query: 'SELECT * FROM sessions WHERE session_id = ?', values: [sessionId]})
            if(result[0].isActive == true){
                return Response.json({"success": true, "session_id": result[0].session_id});
            }else{
                return Response.json({"success": false, "session_id": result[0].session_id});
            }
        }catch (err){
            return Response.json({ error: "Failed to create a thread. SQL Connection failed" }, { status: 500 });
        }
    } catch (error) {
        console.error('Error:', error);
        return Response.json({ error: "Failed to create a thread." }, { status: 500 });
    }
});