import { Notification } from '../models';
/** Idempotent per (seller,key): the same event never notifies twice. */
export async function notify(sellerId:any,type:string,title:string,body:string,key?:string){
 try{await Notification.updateOne({sellerId,key:key||`${type}:${Date.now()}:${Math.random()}`},{$setOnInsert:{type,title,body}},{upsert:true});}catch(e:any){if(e.code!==11000)throw e;}}
