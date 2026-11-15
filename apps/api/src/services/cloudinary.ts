import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config';
export const cloudinaryConfigured=()=>!!(config.cloudinary.cloud&&config.cloudinary.key&&config.cloudinary.secret);
let ready=false;
function init(){if(ready)return;cloudinary.config({cloud_name:config.cloudinary.cloud,api_key:config.cloudinary.key,api_secret:config.cloudinary.secret,secure:true});ready=true;}
/** Server-side upload: the API secret never reaches the browser. Images are capped at 1600px and auto-optimised. */
export function uploadImage(buffer:Buffer,folder:string):Promise<{url:string;publicId:string}>{
 init();return new Promise((resolve,reject)=>{
  cloudinary.uploader.upload_stream({folder,resource_type:'image',allowed_formats:['jpg','png','webp'],
   transformation:[{width:1600,height:1600,crop:'limit',quality:'auto'}]},(err,r)=>err||!r?reject(err||new Error('Upload failed')):resolve({url:r.secure_url,publicId:r.public_id})).end(buffer);});}
export async function deleteImage(publicId:string){init();await cloudinary.uploader.destroy(publicId,{resource_type:'image',invalidate:true});}
