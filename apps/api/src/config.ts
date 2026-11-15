import 'dotenv/config';
const req=(k:string)=>{const v=process.env[k];if(!v)throw new Error(`Missing env ${k}`);return v;};
if(process.env.NODE_ENV==='production'&&(process.env.JWT_SECRET||'').length<32)throw new Error('JWT_SECRET must be at least 32 characters in production');
export const config={port:+(process.env.PORT||4000),mongo:req('MONGO_URI'),jwt:req('JWT_SECRET'),
origin:process.env.CLIENT_ORIGIN||'http://localhost:3000',prod:process.env.NODE_ENV==='production',
ssl:{id:process.env.SSLCZ_STORE_ID||'',pass:process.env.SSLCZ_STORE_PASS||'',sandbox:process.env.SSLCZ_SANDBOX!=='false'},
apiUrl:process.env.API_PUBLIC_URL||'http://localhost:4000',
cloudinary:{cloud:process.env.CLOUDINARY_CLOUD_NAME||'',key:process.env.CLOUDINARY_API_KEY||'',secret:process.env.CLOUDINARY_API_SECRET||''}};
