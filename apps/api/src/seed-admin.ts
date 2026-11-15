import mongoose from 'mongoose';
import argon2 from 'argon2';
import { config } from './config';
import { User } from './models';
(async()=>{const email=process.env.ADMIN_EMAIL,pw=process.env.ADMIN_PASSWORD;if(!email||!pw||pw.length<12)throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (12+ chars)');
 await mongoose.connect(config.mongo);await User.updateOne({email},{$setOnInsert:{name:'Super Admin',email,passwordHash:await argon2.hash(pw),role:'super_admin',verified:true}},{upsert:true});
 console.log('Admin ready:',email);process.exit(0);})();
