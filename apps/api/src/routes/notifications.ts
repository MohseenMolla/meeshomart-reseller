import { Router } from 'express';
import { requireAuth,requireRole,AuthReq } from '../middleware/auth';
import { Notification } from '../models';
export const notifications=Router();
notifications.use(requireAuth,requireRole('seller'));
notifications.get('/',async(req:AuthReq,res)=>{const f={sellerId:req.auth!.sellerId};
 const [data,unread]=await Promise.all([Notification.find(f).sort({createdAt:-1}).limit(30).lean(),Notification.countDocuments({...f,readAt:{$exists:false}})]);
 res.json({success:true,data:{items:data,unread}});});
notifications.post('/read-all',async(req:AuthReq,res)=>{await Notification.updateMany({sellerId:req.auth!.sellerId,readAt:{$exists:false}},{readAt:new Date()});res.json({success:true});});
