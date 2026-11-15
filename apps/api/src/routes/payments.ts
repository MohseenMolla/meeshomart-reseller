import { Router } from 'express';
import { z } from 'zod';
import { requireAuth,requireRole,AuthReq } from '../middleware/auth';
import { Payment,SubscriptionPlan,User } from '../models';
import { initSslcommerz,verifyAndActivate } from '../services/payment';
import { code } from '../utils';
import { config } from '../config';
export const payments=Router();
payments.post('/checkout',requireAuth,requireRole('seller'),async(req:AuthReq,res)=>{
 const {planId}=z.object({planId:z.string()}).parse(req.body);
 const plan=await SubscriptionPlan.findOne({_id:planId,active:true});if(!plan)return res.status(404).json({success:false,error:'Plan not found'});
 const user=await User.findById(req.auth!.userId);if(!user?.verified)return res.status(403).json({success:false,error:'Verify your email before purchasing a plan'});
 const p=await Payment.create({userId:user!._id,planId:plan._id,tranId:code('TX',10),amount:plan.priceBDT});
 const g=await initSslcommerz(p,user);res.json({success:true,data:{gatewayUrl:g.GatewayPageURL,tranId:p.tranId}});});
payments.post('/ssl/callback',async(req,res)=>{
 const {tran_id,val_id}=req.body;
 try{if(val_id)await verifyAndActivate(String(tran_id),String(val_id));}catch{}
 res.redirect(`${config.origin}/seller/payment-result?tran=${encodeURIComponent(String(tran_id))}`);});
payments.post('/ssl/ipn',async(req,res)=>{
 try{await verifyAndActivate(String(req.body.tran_id),String(req.body.val_id));}catch{}res.sendStatus(200);});
payments.get('/status/:tranId',requireAuth,async(req:AuthReq,res)=>{
 const p=await Payment.findOne({tranId:req.params.tranId,userId:req.auth!.userId}).select('status amount').lean();
 p?res.json({success:true,data:p}):res.status(404).json({success:false,error:'Not found'});});
