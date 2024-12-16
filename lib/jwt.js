import * as jose from 'jose';
export async function generateSession(data) {
    console.log(process.env.JWT_SECRET);
    const secret = jose.base64url.decode(process.env.JWT_SECRET);
    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }
    const jwt = await new jose.EncryptJWT({ data })
        .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
        .setIssuedAt()
        .setIssuer('grabbeai:backend')
        .setAudience('grabbeai:user')
        .setExpirationTime('1w')
        .encrypt(secret);
    return jwt;
}

export async function decryptJWT(jwt) {
    const secret = jose.base64url.decode(process.env.JWT_SECRET);
    if (!secret) {
        throw new Error("JWT_SECRET is not defined");
    }
    const { payload, protectedHeader } = await jose.jwtDecrypt(jwt, secret, {
        issuer: 'grabbeai:backend',
        audience: 'grabbeai:user',
    })
    return JSON.stringify(payload);
}