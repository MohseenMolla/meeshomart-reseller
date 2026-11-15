import { Request,Response,NextFunction } from 'express';
import { config } from '../config';
const UNSAFE=new Set(['POST','PUT','PATCH','DELETE']);
const originOf=(u:string)=>{try{return new URL(u).origin;}catch{return '';}};
const allowed=()=>new Set([originOf(config.origin),originOf(config.apiUrl)]);
/** CSRF defence for cookie auth: state-changing requests that carry the session cookie must come from our own origin. */
export function csrfOriginGuard(req:Request,res:Response,next:NextFunction){
 if(!UNSAFE.has(req.method)||!req.cookies?.token||req.originalUrl?.includes('/auth/logout')||req.path?.includes('/logout'))return next();
 const o=req.headers.origin?String(req.headers.origin):originOf(String(req.headers.referer||''));
 if(o&&allowed().has(o))return next();
 res.status(403).json({success:false,error:'Cross-site request blocked'});}
/** Rejects Mongo operator injection ($where, {"$ne":..}) and dotted keys in body/query/params. */
const bad=(v:any,d=0):boolean=>d>8||(v&&typeof v==='object'&&Object.entries(v).some(([k,x])=>k.startsWith('$')||k.includes('.')||bad(x,d+1)));
export function noSqlGuard(req:Request,res:Response,next:NextFunction){
 if(bad(req.body)||bad(req.query)||bad(req.params))return res.status(400).json({success:false,error:'Invalid input'});next();}
/** One JSON line per request: no bodies, no cookies, no query strings (avoids logging secrets/PII). */
export function requestLog(req:Request,res:Response,next:NextFunction){
 const t=Date.now();res.on('finish',()=>{if(process.env.NODE_ENV!=='test')console.log(JSON.stringify({t:new Date().toISOString(),m:req.method,p:req.path,s:res.statusCode,ms:Date.now()-t}));});next();}
