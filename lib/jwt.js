import * as jose from 'jose';
export async function generateSession() {
    const secret = jose.base64url.decode(process.env.JWT_SECRET);
    const jwt = await new jose.EncryptJWT({"session": "session"})
        .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
        .setIssuedAt()
        .setIssuer('grabbeai:backend')
        .setAudience('grabbeai:user')
        .setExpirationTime('1w')
        .encrypt(secret)

    return jwt;
}