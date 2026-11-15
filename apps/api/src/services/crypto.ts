import crypto from 'crypto';
import { config } from '../config';
const key=()=>crypto.createHash('sha256').update(process.env.ENCRYPTION_KEY||config.jwt).digest();
/** AES-256-GCM for secrets at rest (TOTP seeds). Set ENCRYPTION_KEY separately from JWT_SECRET in production. */
export function encrypt(plain:string){const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key(),iv);
 const enc=Buffer.concat([c.update(plain,'utf8'),c.final()]);return [iv,c.getAuthTag(),enc].map(b=>b.toString('base64')).join('.');}
export function decrypt(blob:string){const [iv,tag,enc]=blob.split('.').map(x=>Buffer.from(x,'base64'));const d=crypto.createDecipheriv('aes-256-gcm',key(),iv);d.setAuthTag(tag);
 return Buffer.concat([d.update(enc),d.final()]).toString('utf8');}
export const hmac=(s:string)=>crypto.createHmac('sha256',key()).update(s).digest('hex');
export const safeEq=(a:string,b:string)=>a.length===b.length&&crypto.timingSafeEqual(Buffer.from(a),Buffer.from(b));
