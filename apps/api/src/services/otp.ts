import crypto from 'crypto';
import { OtpCode } from '../models';
import { hmac,safeEq } from './crypto';
import { sendMail } from './mailer';
export const OTP_TTL_MS=10*60e3,OTP_MAX_ATTEMPTS=5,OTP_COOLDOWN_MS=+(process.env.OTP_COOLDOWN_MS??60e3);
type Purpose='verify_email'|'reset_password';
const hash=(uid:any,purpose:string,code:string)=>hmac(`${purpose}:${uid}:${code}`);
/** Returns false if throttled (cooldown) — callers keep the HTTP response generic. */
export async function issueOtp(user:{_id:any;email:string},purpose:Purpose){
 const last=await OtpCode.findOne({userId:user._id,purpose}).sort({createdAt:-1}).lean();
 if(last&&Date.now()-(last as any).createdAt.getTime()<OTP_COOLDOWN_MS)return false;
 const code=String(crypto.randomInt(0,1_000_000)).padStart(6,'0');
 await OtpCode.deleteMany({userId:user._id,purpose}); // only the newest code is ever valid
 await OtpCode.create({userId:user._id,purpose,codeHash:hash(user._id,purpose,code),expiresAt:new Date(Date.now()+OTP_TTL_MS)});
 await sendMail(user.email,purpose==='verify_email'?'Verify your email':'Reset your password',
  `Your code is ${code}. It expires in 10 minutes. If you did not request this, ignore this message and never share the code.`);return true;}
export async function verifyOtp(userId:any,purpose:Purpose,code:string){
 const rec=await OtpCode.findOne({userId,purpose,expiresAt:{$gt:new Date()}});if(!rec)return false;
 if(rec.attempts>=OTP_MAX_ATTEMPTS){return false;}
 if(!/^\d{6}$/.test(code)||!safeEq(rec.codeHash!,hash(userId,purpose,code))){await OtpCode.updateOne({_id:rec._id},{$inc:{attempts:1}});return false;}
 const r=await OtpCode.deleteOne({_id:rec._id});return r.deletedCount===1;} // single use, atomic
