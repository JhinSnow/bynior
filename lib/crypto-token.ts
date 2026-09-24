import crypto from 'crypto';

const SECRET_KEY = process.env.QR_HMAC_SECRET || 'bynior-secret-qr-key-change-in-production-1234567890';

export interface QRPayload {
  uid: string; // User ID
  cid: string; // Coupon ID
  exp: number; // Expiration epoch (seconds)
  nonce: string; // Anti-replay nonce
}

export function generateDynamicQRToken(userId: string, couponId: string): { token: string; expiresAt: number } {
  const expiresAt = Math.floor(Date.now() / 1000) + 45; // 45 วินาที
  const nonce = crypto.randomBytes(8).toString('hex');
  const payload: QRPayload = { uid: userId, cid: couponId, exp: expiresAt, nonce };
  
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadBase64)
    .digest('base64url');

  return {
    token: `${payloadBase64}.${signature}`,
    expiresAt,
  };
}

export function verifyDynamicQRToken(token: string): QRPayload {
  const parts = token.split('.');
  if (parts.length !== 2) throw new Error('MALFORMED_TOKEN');

  const [payloadBase64, signature] = parts;

  const expectedSignature = crypto
    .createHmac('sha256', SECRET_KEY)
    .update(payloadBase64)
    .digest('base64url');

  // ป้องกัน Timing attacks
  const bufSig = Buffer.from(signature);
  const bufExp = Buffer.from(expectedSignature);
  if (bufSig.length !== bufExp.length || !crypto.timingSafeEqual(bufSig, bufExp)) {
    throw new Error('INVALID_SIGNATURE');
  }

  const payload: QRPayload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf8'));
  const now = Math.floor(Date.now() / 1000);

  if (now > payload.exp) {
    throw new Error('TOKEN_EXPIRED');
  }

  return payload;
}
