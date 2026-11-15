import nodemailer from 'nodemailer';
/** Production requires SMTP_URL (e.g. smtps://user:pass@smtp.provider.com). In development codes are printed to the console instead. */
export async function sendMail(to:string,subject:string,text:string){
 const url=process.env.SMTP_URL;
 if(!url){if(process.env.NODE_ENV==='production')throw new Error('SMTP_URL is not configured');console.log(`[dev mail] to=${to} subject="${subject}"\n${text}`);return;}
 await nodemailer.createTransport(url).sendMail({from:process.env.MAIL_FROM||'no-reply@localhost',to,subject,text});}
