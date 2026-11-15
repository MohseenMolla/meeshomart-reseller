import { Router,Request } from 'express';
import { z } from 'zod';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { requireAuth,requireRole,requireActiveSeller,AuthReq } from '../middleware/auth';
import { Store,StoreProduct,Product,SellerProfile,Order } from '../models';
import { validateSellingPrice,validSlug } from '../services/pricing';
import { orderProfit,orderTotal,code } from '../utils';
import { notify } from '../services/notify';

// ---------- Seller-side store management (sellerId always from session) ----------
export const myStore=Router();
myStore.use(requireAuth,requireRole('seller'),requireActiveSeller);
const storeSchema=z.object({slug:z.string().refine(validSlug,'Invalid or reserved slug'),name:z.string().min(2),description:z.string().max(1000).optional(),
 logo:z.string().url().optional(),banner:z.string().url().optional(),phone:z.string().regex(/^01[3-9]\d{8}$/).optional(),
 social:z.object({facebook:z.string().url().optional(),instagram:z.string().url().optional(),whatsapp:z.string().optional()}).optional(),
 seo:z.object({title:z.string().max(70).optional(),description:z.string().max(160).optional()}).optional()});
myStore.get('/',async(req:AuthReq,res)=>res.json({success:true,data:await Store.findOne({sellerId:req.auth!.sellerId}).lean()}));
myStore.put('/',async(req:AuthReq,res)=>{
 const d=storeSchema.parse(req.body);
 try{const s=await Store.findOneAndUpdate({sellerId:req.auth!.sellerId},{$set:d},{upsert:true,new:true,setDefaultsOnInsert:true});res.json({success:true,data:s});}
 catch(e:any){if(e.code===11000)return res.status(409).json({success:false,error:'Slug already taken'});throw e;}});
myStore.get('/products',async(req:AuthReq,res)=>{
 const rows=await StoreProduct.find({sellerId:req.auth!.sellerId}).populate('productId','name sku images retailPrice wholesalePrice stock').lean();
 res.json({success:true,data:rows.map((r:any)=>({...r,expectedProfit:r.price-(r.productId?.wholesalePrice||0)}))});});
myStore.put('/products/:productId',async(req:AuthReq,res)=>{
 const d=z.object({price:z.number().positive(),visible:z.boolean().optional(),featured:z.boolean().optional()}).parse(req.body);
 const p=await Product.findOne({_id:req.params.productId,active:true}).lean();if(!p)return res.status(404).json({success:false,error:'Product not found'});
 const err=validateSellingPrice(d.price,p.wholesalePrice!,p.retailPrice!);if(err)return res.status(400).json({success:false,error:err});
 const sp=await StoreProduct.findOneAndUpdate({sellerId:req.auth!.sellerId,productId:p._id},{$set:d},{upsert:true,new:true});
 res.json({success:true,data:{...sp.toObject(),expectedProfit:d.price-p.wholesalePrice!}});});
myStore.delete('/products/:productId',async(req:AuthReq,res)=>{await StoreProduct.deleteOne({sellerId:req.auth!.sellerId,productId:req.params.productId});res.json({success:true});});
// Customers derived from this seller's own orders only.
myStore.get('/customers',async(req:AuthReq,res)=>{
 const rows=await Order.aggregate([{$match:{sellerId:new mongoose.Types.ObjectId(req.auth!.sellerId)}},
  {$group:{_id:'$customer.phone',name:{$last:'$customer.name'},address:{$last:'$customer.address'},orders:{$sum:1},totalSpent:{$sum:'$total'},lastOrderAt:{$max:'$createdAt'}}},
  {$sort:{totalSpent:-1}},{$limit:100}]);res.json({success:true,data:rows});});

// ---------- Public storefront ----------
export const publicStore=Router();
async function resolveStore(slug:string){
 const store=await Store.findOne({slug:slug.toLowerCase(),active:true}).lean();if(!store)return null;
 const sp=await SellerProfile.findById(store.sellerId).lean();
 if(!sp||sp.status!=='active'||(sp.subscriptionEndsAt&&sp.subscriptionEndsAt<new Date()))return null; // expired/suspended stores go dark
 return store;}
publicStore.get('/:slug',async(req,res)=>{const s=await resolveStore(req.params.slug);
 s?res.json({success:true,data:{slug:s.slug,name:s.name,description:s.description,logo:s.logo,banner:s.banner,social:s.social,seo:s.seo,phone:s.phone}}):res.status(404).json({success:false,error:'Store not found'});});
publicStore.get('/:slug/products',async(req,res)=>{
 const s=await resolveStore(req.params.slug);if(!s)return res.status(404).json({success:false,error:'Store not found'});
 const page=Math.max(1,+(req.query.page||1));const rows=await StoreProduct.find({sellerId:s.sellerId,visible:true}).sort({featured:-1,createdAt:-1}).skip((page-1)*20).limit(20)
  .populate('productId','name sku images stock reserved active').lean();
 res.json({success:true,data:rows.filter((r:any)=>r.productId?.active).map((r:any)=>({productId:r.productId._id,name:r.productId.name,images:(r.productId.images||[]).map((i:any)=>i.url),price:r.price,
  inStock:r.productId.stock-r.productId.reserved>0,featured:r.featured}))});}); // wholesale never exposed
const checkout=z.object({items:z.array(z.object({productId:z.string(),qty:z.number().int().min(1).max(20)})).min(1).max(30),
 customer:z.object({name:z.string().min(2),phone:z.string().regex(/^01[3-9]\d{8}$/),address:z.string().min(5),district:z.string().min(2)}),
 paymentMethod:z.literal('cod'),idemKey:z.string().min(8).max(64)});
publicStore.post('/:slug/orders',rateLimit({skip:()=>process.env.NODE_ENV==='test',windowMs:10*60e3,limit:15}),async(req,res)=>{
 const s=await resolveStore(req.params.slug);if(!s)return res.status(404).json({success:false,error:'Store not found'});
 const d=checkout.parse(req.body);const sellerId=s.sellerId;
 const ex=await Order.findOne({sellerId,idemKey:d.idemKey}).select('orderNo status total').lean();if(ex)return res.json({success:true,data:ex});
 const ses=await mongoose.startSession();let order:any;
 try{await ses.withTransaction(async()=>{const items=[];
  for(const i of d.items){
   const sp=await StoreProduct.findOne({sellerId,productId:i.productId,visible:true}).session(ses).lean(); // price from DB only
   if(!sp)throw new Error('Product not available in this store');
   const p=await Product.findOneAndUpdate({_id:i.productId,active:true,$expr:{$gte:[{$subtract:['$stock','$reserved']},i.qty]}},{$inc:{reserved:i.qty}},{new:true,session:ses});
   if(!p)throw new Error('Insufficient stock');
   items.push({productId:p._id,qty:i.qty,unitPrice:sp.price!,wholesale:p.wholesalePrice!});}
  [order]=await Order.create([{orderNo:code('ORD',8),sellerId,items,customer:d.customer,total:orderTotal(items),profit:orderProfit(items),source:'storefront',
   history:[{status:'pending',at:new Date()}],idemKey:d.idemKey}],{session:ses});});}
 catch(e:any){return res.status(409).json({success:false,error:e.message});}finally{await ses.endSession();}
 notify(sellerId,'new_order','New order',`Order ${order.orderNo} for ${order.total} BDT`,'order:'+order._id).catch(()=>{});
 res.status(201).json({success:true,data:{orderNo:order.orderNo,status:order.status,total:order.total}});});
// Tracking needs order number AND the phone used at checkout.
publicStore.post('/track/lookup',rateLimit({skip:()=>process.env.NODE_ENV==='test',windowMs:10*60e3,limit:30}),async(req,res)=>{
 const {orderNo,phone}=z.object({orderNo:z.string(),phone:z.string()}).parse(req.body);
 const o=await Order.findOne({orderNo,'customer.phone':phone}).select('orderNo status history total createdAt').lean();
 o?res.json({success:true,data:{orderNo:o.orderNo,status:o.status,total:o.total,timeline:o.history}}):res.status(404).json({success:false,error:'Order not found'});});
