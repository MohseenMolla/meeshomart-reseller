import mongoose from 'mongoose';
import { config } from '../config';
import { Payment,SellerProfile,SubscriptionPlan,Wallet,WalletTransaction,AuditLog } from '../models';
import { code,referralCommission } from '../utils';
import { computeNewExpiry } from './subscription';
import { notify } from './notify';
const base=()=>config.ssl.sandbox?'https://sandbox.sslcommerz.com':'https://securepay.sslcommerz.com';
export async function initSslcommerz(p:any,user:any){
 const body=new URLSearchParams({store_id:config.ssl.id,store_passwd:config.ssl.pass,total_amount:String(p.amount),currency:'BDT',tran_id:p.tranId,
  success_url:`${config.apiUrl}/api/v1/payments/ssl/callback`,fail_url:`${config.apiUrl}/api/v1/payments/ssl/callback`,cancel_url:`${config.apiUrl}/api/v1/payments/ssl/callback`,
  ipn_url:`${config.apiUrl}/api/v1/payments/ssl/ipn`,cus_name:user.name||'Seller',cus_email:user.email,cus_add1:'Bangladesh',cus_phone:user.phone||'01700000000',
  shipping_method:'NO',product_name:'Reseller plan',product_category:'subscription',product_profile:'non-physical-goods'});
 const r=await fetch(`${base()}/gwprocess/v4/api.php`,{method:'POST',body});return r.json() as Promise<any>;}
/** Server-side verification with the gateway. Never trusts callback body for status. */
export async function verifyAndActivate(tranId:string,valId:string){
 const p=await Payment.findOne({tranId});if(!p)throw new Error('Unknown payment');
 if(p.status==='paid')return p;
 const url=`${base()}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}&store_id=${config.ssl.id}&store_passwd=${config.ssl.pass}&format=json`;
 const g:any=await (await fetch(url)).json();
 const ok=['VALID','VALIDATED'].includes(g.status)&&g.tran_id===tranId&&Number(g.currency_amount??g.amount)===p.amount&&(g.currency_type||g.currency)==='BDT';
 if(!ok){await Payment.updateOne({_id:p._id,status:'pending'},{status:'failed',raw:g});throw new Error('Verification failed');}
 const claimed=await Payment.findOneAndUpdate({_id:p._id,status:{$in:['pending','needs_reconcile']}},{status:'paid',gatewayValId:valId,raw:g},{new:true});
 if(!claimed)return Payment.findById(p._id);
 try{await activateSeller(claimed);}catch(e){console.error('activation failed, queued for reconciliation',e);await Payment.updateOne({_id:claimed._id},{status:'needs_reconcile'});throw e;}
 return claimed;}
export async function activateSeller(p:any){
 const s=await mongoose.startSession();
 try{await s.withTransaction(async()=>{
  const plan=await SubscriptionPlan.findById(p.planId).session(s);if(!plan)throw new Error('Plan missing');
  const sp=await SellerProfile.findOne({userId:p.userId}).session(s);if(!sp)throw new Error('Seller missing');
  const wasActive=sp.status==='active';sp.planId=plan._id;sp.sellerCode=sp.sellerCode||code('S');sp.referralCode=sp.referralCode||code('R');
  sp.status='active';sp.subscriptionEndsAt=computeNewExpiry(wasActive?sp.subscriptionEndsAt:undefined,new Date(),plan) as any;await sp.save({session:s});
  await Wallet.updateOne({sellerId:sp._id},{$setOnInsert:{sellerId:sp._id}},{upsert:true,session:s});
  if(sp.referredBy&&!sp.referredBy.equals(sp._id)){
   await WalletTransaction.updateOne({sellerId:sp.referredBy,type:'referral_commission',ref:String(p._id)},
    {$setOnInsert:{amount:referralCommission(plan.priceBDT!,10),status:'pending'}},{upsert:true,session:s});}
  await Payment.updateOne({_id:p._id},{activatedAt:new Date()},{session:s});
  await notify(sp._id,'payment_confirmed','Payment confirmed',`Your ${plan.name} plan is active.`,'pay:'+p._id);
  await AuditLog.create([{action:'seller.activated',target:String(sp._id),meta:{paymentId:p._id}}],{session:s});
 });}finally{await s.endSession();}}
