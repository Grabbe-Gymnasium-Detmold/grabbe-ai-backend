import { v4 as uuidv4 } from 'uuid';


export default defineEventHandler(async (event) => {
    console.log("Request at Path: " + event.path + " from " + "unknown with method " + event.method);
    
    const agent = event.req.headers['user-agent'];
    const ip = event.req.headers['x-forwarded-for'];
    const requestID = await uuidv4();
    //const getISP = async (ip) => {
    //    if(!await redisClient.has('ip:'+ip)){
    //    const response = await fetch(`https://stat.ripe.net/data/whois/data.json?resource=${ip}`);
    //    const data = await response.json();
    //    if (data && data.data && data.data.records && data.data.records.length > 0) {
    //        for (const record of data.data.records) {
    //            for (const attribute of record) {
    //                if (attribute.key === 'descr') {
    //                    await redisClient.setExpire('ip:' + ip, attribute.value, 18000)
    //                    return attribute.value;
    //                }
    //            }
    //        }
    //    }
    //    return 'Unknown ISP';
    //}else{
    //    return await redisClient.get('ip:'+ip)
    //}
    //};
    //const isp = await getISP(ip);
    //const data = event.req;
//
    //executeQuery({
    //    query: 'INSERT INTO user_actions (user, action, request_id, agent, ip, isp, data) VALUES (?,?,?,?,?,?,?)',
    //    values: [null, "LOG", requestID, agent, ip, isp, "" ]//Fill in event data
    //});
   event.context.requestID = requestID;
});
