import { SellerProfile,Payment,User } from '../models';
import { classify,GRACE_DAYS } from './subscription';
import { notify } from './notify';
import { activateSeller } from './payment';
export async function runSubscriptionSweep(now=new Date()){
 let reminded=0,expired=0;
 const sellers=await SellerProfile.find({status:'active',subscriptionEndsAt:{$exists:true,$ne:null}}).lean();
 for(const s of sellers){const st=classify(s.subscriptionEndsAt,now);
  if(st==='remind'){await notify(s._id,'subscription_expiring','Subscription expiring soon',`Your plan ends on ${s.subscriptionEndsAt!.toDateString()}. Renew to keep your store online.`,`remind:${s.subscriptionEndsAt!.toISOString().slice(0,10)}`);reminded++;}
  if(st==='grace'){await notify(s._id,'subscription_grace','Subscription ended',`Your store is offline. Renew within ${GRACE_DAYS} days to keep your account active.`,`grace:${s.subscriptionEndsAt!.toISOString().slice(0,10)}`);}
  if(st==='expired'){const r=await SellerProfile.updateOne({_id:s._id,status:'active'},{status:'expired'});if(r.modifiedCount){expired++;
   await notify(s._id,'subscription_expired','Account expired','Your reseller account has expired. Choose a plan to reactivate.',`expired:${s.subscriptionEndsAt!.toISOString().slice(0,10)}`);}}}
 return {reminded,expired};}
/** Retries activation for payments the gateway confirmed but whose activation failed. Safe to repeat: activation is one transaction. */
export async function runReconciliation(now=new Date()){
 let fixed=0,cancelled=0;
 for(const p of await Payment.find({status:'needs_reconcile',activatedAt:{$exists:false}}).limit(50)){
  try{await activateSeller(p);await Payment.updateOne({_id:p._id},{status:'paid'});fixed++;}catch(e){console.error('reconcile failed',p.tranId,e);}}
 const r=await Payment.updateMany({status:'pending',createdAt:{$lt:new Date(now.getTime()-24*36e5)}},{status:'cancelled'});cancelled=r.modifiedCount;
 return {fixed,cancelled};}
