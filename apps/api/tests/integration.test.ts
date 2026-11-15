import { describe,it,expect,beforeAll,afterAll,vi } from 'vitest';
import request from 'supertest';
import argon2 from 'argon2';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

vi.mock('../src/services/cloudinary',()=>({cloudinaryConfigured:()=>true,
 uploadImage:vi.fn(async(_b:Buffer,folder:string)=>{const id=Math.random().toString(36).slice(2);return {url:`https://res.cloudinary.com/testcloud/image/upload/v1/${folder}/${id}.png`,publicId:`${folder}/${id}`};}),
 deleteImage:vi.fn(async()=>{})}));
vi.mock('../src/services/mailer',()=>({sendMail:vi.fn(async(to:string,_s:string,text:string)=>{const g=globalThis as any;(g.__mails=g.__mails||[]).push({to,text});})}));
let repl:MongoMemoryReplSet,app:any,M:any,pay:any;
const PW='Passw0rd!long';let n=0;
const planDoc={name:'Monthly',priceBDT:1000,durationDays:30};
beforeAll(async()=>{
 repl=await MongoMemoryReplSet.create({replSet:{count:1}});
 Object.assign(process.env,{MONGO_URI:repl.getUri(),JWT_SECRET:'test-secret-test-secret-test-secret-123456',SSLCZ_STORE_ID:'t',SSLCZ_STORE_PASS:'t',NODE_ENV:'test',OTP_COOLDOWN_MS:'0',CLOUDINARY_CLOUD_NAME:'testcloud',CLOUDINARY_API_KEY:'k',CLOUDINARY_API_SECRET:'s'});
 await mongoose.connect(repl.getUri());
 M=await import('../src/models');pay=await import('../src/services/payment');app=(await import('../src/app')).app;
 await Promise.all(Object.values(M).map((m:any)=>m.init?.()));
});
afterAll(async()=>{await mongoose.disconnect();await repl.stop();vi.unstubAllGlobals();});

const gateway=(over:Record<string,any>={})=>vi.stubGlobal('fetch',async()=>({json:async()=>({status:'VALID',currency_type:'BDT',...over})}));
async function newPlan(){return M.SubscriptionPlan.create(planDoc);}
async function seller(ref?:string){
 const i=++n,email=`s${i}@t.test`,phone=`0171000${String(i).padStart(4,'0')}`;
 await request(app).post('/api/v1/auth/register').send({name:'Seller '+i,shopName:'Shop '+i,email,phone,password:PW,address:'Dhaka, BD',terms:true,referralCode:ref}).expect(201);
 const ag=request.agent(app).set('Origin','http://localhost:3000');await ag.post('/api/v1/auth/login').send({email,password:PW}).expect(200);
 const user=await M.User.findOne({email});const sp=await M.SellerProfile.findOne({userId:user._id});return {ag,user,sp};}
async function activate(s:any,plan:any,amount=plan.priceBDT){
 const p=await M.Payment.create({userId:s.user._id,planId:plan._id,tranId:'TX'+Math.random().toString(36).slice(2),amount});
 gateway({tran_id:p.tranId,currency_amount:String(amount)});return {p,res:await pay.verifyAndActivate(p.tranId,'VAL'+p.tranId)};}
async function activeSeller(ref?:string){const s=await seller(ref),plan=await newPlan();await activate(s,plan);s.sp=await M.SellerProfile.findById(s.sp._id);return s;}
async function admin(){const email=`admin${++n}@t.test`;await M.User.create({email,name:'A',passwordHash:await argon2.hash(PW),role:'super_admin'});
 const ag=request.agent(app).set('Origin','http://localhost:3000');await ag.post('/api/v1/auth/login').send({email,password:PW}).expect(200);return ag;}
const product=(stock=50)=>M.Product.create({name:'P'+(++n),sku:'SKU'+n,retailPrice:500,wholesalePrice:400,stock});
const order=(ag:any,pid:string,qty=1,price=500,key?:string)=>ag.post('/api/v1/orders').send({items:[{productId:String(pid),qty,unitPrice:price}],
 customer:{name:'C',phone:'01712345678',address:'Road 1, Dhaka',district:'Dhaka'},idemKey:key});

describe('payment verification & activation',()=>{
 it('activates only after gateway-verified payment',async()=>{
  const s=await seller(),plan=await newPlan();expect(s.sp.status).toBe('pending');
  await request(app).post('/api/v1/payments/ssl/callback').type('form').send({tran_id:'X',val_id:'Y',status:'VALID'}); // forged callback does nothing
  expect((await M.SellerProfile.findById(s.sp._id)).status).toBe('pending');
  await activate(s,plan);const sp=await M.SellerProfile.findById(s.sp._id);
  expect(sp.status).toBe('active');expect(sp.sellerCode).toMatch(/^S/);expect(sp.referralCode).toMatch(/^R/);expect(await M.Wallet.countDocuments({sellerId:sp._id})).toBe(1);});
 it('rejects amount mismatch and leaves seller pending',async()=>{
  const s=await seller(),plan=await newPlan();const p=await M.Payment.create({userId:s.user._id,planId:plan._id,tranId:'TXBAD'+n,amount:1000});
  gateway({tran_id:p.tranId,currency_amount:'1'});await expect(pay.verifyAndActivate(p.tranId,'V')).rejects.toThrow();
  expect((await M.Payment.findById(p._id)).status).toBe('failed');expect((await M.SellerProfile.findById(s.sp._id)).status).toBe('pending');});
 it('duplicate/concurrent callbacks activate once (no double expiry, one commission)',async()=>{
  const A=await activeSeller();const B=await seller(A.sp.referralCode),plan=await newPlan();
  const p=await M.Payment.create({userId:B.user._id,planId:plan._id,tranId:'TXDUP'+n,amount:1000});gateway({tran_id:p.tranId,currency_amount:'1000'});
  await Promise.allSettled([pay.verifyAndActivate(p.tranId,'V1'),pay.verifyAndActivate(p.tranId,'V1'),pay.verifyAndActivate(p.tranId,'V1')]);
  const sp=await M.SellerProfile.findById(B.sp._id);const days=(sp.subscriptionEndsAt.getTime()-Date.now())/864e5;
  expect(days).toBeGreaterThan(29);expect(days).toBeLessThan(31);
  expect(await M.WalletTransaction.countDocuments({sellerId:A.sp._id,type:'referral_commission'})).toBe(1);
  expect(await M.Payment.countDocuments({tranId:p.tranId,status:'paid'})).toBe(1);});
 it('early renewal extends from current end date',async()=>{
  const S=await activeSeller(),before=S.sp.subscriptionEndsAt.getTime();await activate(S,await newPlan());
  const after=(await M.SellerProfile.findById(S.sp._id)).subscriptionEndsAt.getTime();expect(Math.round((after-before)/864e5)).toBe(30);});
});

describe('access control & data isolation',()=>{
 it('requires auth, role and active subscription',async()=>{
  await request(app).get('/api/v1/orders').expect(401);
  const pending=await seller();await pending.ag.get('/api/v1/products/wholesale').expect(402);
  await pending.ag.get('/api/v1/admin/overview').expect(403);
  const act=await activeSeller();await act.ag.get('/api/v1/products/wholesale').expect(200);await act.ag.get('/api/v1/admin/overview').expect(403);});
 it('never leaks wholesale price publicly',async()=>{await product();const r=await request(app).get('/api/v1/products').expect(200);
  expect(JSON.stringify(r.body)).not.toContain('wholesalePrice');});
 it("seller cannot read or list another seller's orders",async()=>{
  const A=await activeSeller(),B=await activeSeller(),p=await product();const o=(await order(A.ag,p._id).expect(201)).body.data;
  await B.ag.get(`/api/v1/orders/${o._id}`).expect(404);const list=await B.ag.get('/api/v1/orders').expect(200);expect(list.body.data).toHaveLength(0);
  await A.ag.get(`/api/v1/orders/${o._id}`).expect(200);
  const own=await B.ag.get('/api/v1/wallet').expect(200);expect(own.body.data).toEqual({available:0,pending:0});});
 it('sellerId in the request body cannot redirect an order to another seller',async()=>{
  const A=await activeSeller(),B=await activeSeller(),p=await product();
  const r=await B.ag.post('/api/v1/orders').send({sellerId:String(A.sp._id),items:[{productId:String(p._id),qty:1,unitPrice:500}],customer:{name:'C',phone:'01712345678',address:'Road 1',district:'Dhaka'}}).expect(201);
  expect(String(r.body.data.sellerId)).toBe(String(B.sp._id));});
 it('locks the account after repeated failed logins',async()=>{
  const S=await seller();for(let i=0;i<5;i++)await request(app).post('/api/v1/auth/login').send({email:S.user.email,password:'wrong-password'}).expect(401);
  await request(app).post('/api/v1/auth/login').send({email:S.user.email,password:PW}).expect(423);});
});

describe('security hardening',()=>{
 it('blocks cross-site state-changing requests that carry the session cookie (CSRF)',async()=>{
  const S=await activeSeller();const evil=request.agent(app);await evil.post('/api/v1/auth/login').send({email:S.user.email,password:PW}).expect(200);
  await evil.set('Origin','https://evil.example').post('/api/v1/withdrawals').send({amount:500,method:'bkash',account:'01712345678'}).expect(403);
  await evil.set('Origin','').post('/api/v1/auth/logout').expect(403);});
 it('rejects NoSQL operator injection in body and query',async()=>{
  await request(app).post('/api/v1/auth/login').send({email:{$ne:null},password:{$ne:null}}).expect(400);
  const adm=await admin();await adm.get('/api/v1/admin/orders?status[$ne]=x').expect(400);
  await request(app).post('/api/v1/stores/track/lookup').send({orderNo:{$gt:''},phone:{$gt:''}}).expect(400);});
 it('rejects forged or tampered session cookies',async()=>{
  await request(app).get('/api/v1/auth/me').set('Cookie','token=not.a.jwt').expect(401);
  const jwt=(await import('jsonwebtoken')).default;const S=await activeSeller();
  await request(app).get('/api/v1/auth/me').set('Cookie',`token=${jwt.sign({sub:String(S.user._id)},'wrong-secret')}`).expect(401);});
 it('sets security headers and hides the framework',async()=>{
  const r=await request(app).get('/health');expect(r.headers['x-powered-by']).toBeUndefined();expect(r.headers['x-content-type-options']).toBe('nosniff');expect(r.status).toBe(200);});
});

describe('input validation',()=>{
 it('returns 400 (not a hang or crash) for invalid input in async routes',async()=>{
  const S=await activeSeller();await S.ag.put('/api/v1/stores/me').send({slug:'admin',name:'X'}).expect(400);
  await S.ag.post('/api/v1/withdrawals').send({amount:5}).expect(400);
  await request(app).post('/api/v1/auth/register').send({email:'bad'}).expect(400);});
});

describe('orders, stock and pricing',()=>{
 it('prevents overselling under concurrency',async()=>{
  const S=await activeSeller(),p=await product(5);
  const rs=await Promise.all(Array.from({length:10},(_,i)=>order(S.ag,p._id,1,500,'k'+n+'-'+i)));
  expect(rs.filter(r=>r.status===201)).toHaveLength(5);expect(rs.filter(r=>r.status===409)).toHaveLength(5);
  expect((await M.Product.findById(p._id)).reserved).toBe(5);});
 it('rejects selling below wholesale and replays idempotency keys',async()=>{
  const S=await activeSeller(),p=await product();await order(S.ag,p._id,1,399).expect(409);
  const a=await order(S.ag,p._id,1,500,'same-key-123'),b=await order(S.ag,p._id,1,500,'same-key-123');
  expect(a.body.data._id).toBe(b.body.data._id);expect(await M.Order.countDocuments({sellerId:S.sp._id,idemKey:'same-key-123'})).toBe(1);});
 it('storefront uses DB prices, credits the right seller, and tracking needs the phone',async()=>{
  const S=await activeSeller(),other=await activeSeller(),p=await product(),slug='shop-'+n;
  await S.ag.put('/api/v1/stores/me').send({slug,name:'My Shop'}).expect(200);
  await S.ag.put(`/api/v1/stores/me/products/${p._id}`).send({price:100}).expect(400); // below wholesale
  await S.ag.put(`/api/v1/stores/me/products/${p._id}`).send({price:550}).expect(200);
  const body={items:[{productId:String(p._id),qty:2,unitPrice:1}],paymentMethod:'cod',idemKey:'store-key-12345',customer:{name:'Rafi',phone:'01811111111',address:'House 5, Dhaka',district:'Dhaka'}};
  const r=await request(app).post(`/api/v1/stores/${slug}/orders`).send(body).expect(201);expect(r.body.data.total).toBe(1100); // client price ignored
  const saved=await M.Order.findOne({orderNo:r.body.data.orderNo});expect(String(saved.sellerId)).toBe(String(S.sp._id));expect(saved.profit).toBe(300);
  await request(app).post(`/api/v1/stores/${slug}/orders`).send(body).expect(200);expect(await M.Order.countDocuments({idemKey:'store-key-12345'})).toBe(1);
  await request(app).post('/api/v1/stores/track/lookup').send({orderNo:saved.orderNo,phone:'01899999999'}).expect(404);
  await request(app).post('/api/v1/stores/track/lookup').send({orderNo:saved.orderNo,phone:'01811111111'}).expect(200);
  expect((await other.ag.get('/api/v1/orders').expect(200)).body.data).toHaveLength(0);});
 it('storefront goes dark when the subscription has expired',async()=>{
  const S=await activeSeller(),slug='dark-'+n;await S.ag.put('/api/v1/stores/me').send({slug,name:'Dark Shop'}).expect(200);
  await request(app).get(`/api/v1/stores/${slug}`).expect(200);await M.SellerProfile.updateOne({_id:S.sp._id},{subscriptionEndsAt:new Date(Date.now()-864e5)});
  await request(app).get(`/api/v1/stores/${slug}`).expect(404);});
});

describe('fulfilment, ledger and withdrawals',()=>{
 const flow=['confirmed','processing','ready_to_ship','shipped','out_for_delivery','delivered'];
 it('enforces the state machine and credits profit exactly once on delivery',async()=>{
  const adm=await admin(),S=await activeSeller(),p=await product(20);const o=(await order(S.ag,p._id,6).expect(201)).body.data;
  await adm.post(`/api/v1/admin/orders/${o._id}/status`).send({status:'delivered'}).expect(409);
  for(const st of flow)await adm.post(`/api/v1/admin/orders/${o._id}/status`).send({status:st}).expect(200);
  await adm.post(`/api/v1/admin/orders/${o._id}/status`).send({status:'delivered'}).expect(409);
  expect((await S.ag.get('/api/v1/wallet').expect(200)).body.data.available).toBe(600);
  const prod=await M.Product.findById(p._id);expect(prod.stock).toBe(14);expect(prod.reserved).toBe(0);
  expect((await M.Order.findById(o._id)).history.length).toBe(7);});
 it('cancelling releases reserved stock',async()=>{
  const adm=await admin(),S=await activeSeller(),p=await product(10);const o=(await order(S.ag,p._id,4).expect(201)).body.data;
  expect((await M.Product.findById(p._id)).reserved).toBe(4);await adm.post(`/api/v1/admin/orders/${o._id}/status`).send({status:'cancelled'}).expect(200);
  expect((await M.Product.findById(p._id)).reserved).toBe(0);});
 it('blocks over-withdrawal, ignores pending funds, and survives concurrent requests',async()=>{
  const adm=await admin(),S=await activeSeller(),p=await product(20);
  const wd=(amt:number)=>S.ag.post('/api/v1/withdrawals').send({amount:amt,method:'bkash',account:'01712345678'});
  await wd(500).expect(409); // nothing available
  const o=(await order(S.ag,p._id,6).expect(201)).body.data;for(const st of flow)await adm.post(`/api/v1/admin/orders/${o._id}/status`).send({status:st}).expect(200);
  await M.WalletTransaction.create({sellerId:S.sp._id,type:'adjustment',amount:5000,status:'pending',ref:'pend'+n}); // pending must never be withdrawable
  await wd(601).expect(409);
  const rs=await Promise.all([wd(600),wd(600),wd(600)]);expect(rs.filter(r=>r.status===201)).toHaveLength(1);
  expect((await S.ag.get('/api/v1/wallet').expect(200)).body.data.available).toBe(0);
  const w=await M.Withdrawal.findOne({sellerId:S.sp._id});
  await adm.post(`/api/v1/admin/withdrawals/${w._id}/review`).send({decision:'approved'}).expect(400); // reference required
  await adm.post(`/api/v1/admin/withdrawals/${w._id}/review`).send({decision:'rejected'}).expect(200);
  await adm.post(`/api/v1/admin/withdrawals/${w._id}/review`).send({decision:'rejected'}).expect(409); // no double refund
  expect((await S.ag.get('/api/v1/wallet').expect(200)).body.data.available).toBe(600);});
 it('refunds after delivery deduct the profit once; ledger rows are immutable',async()=>{
  const adm=await admin(),S=await activeSeller(),p=await product(20);const o=(await order(S.ag,p._id,6).expect(201)).body.data;
  for(const st of [...flow,'returned','refunded'])await adm.post(`/api/v1/admin/orders/${o._id}/status`).send({status:st}).expect(200);
  expect((await S.ag.get('/api/v1/wallet').expect(200)).body.data.available).toBe(0);
  await expect(M.WalletTransaction.updateOne({sellerId:S.sp._id},{amount:1})).rejects.toThrow(/immutable/);
  await expect(M.WalletTransaction.deleteMany({sellerId:S.sp._id})).rejects.toThrow(/immutable/);});
 it('referral commission is withdrawable only after admin approval, once',async()=>{
  const adm=await admin(),A=await activeSeller();await activeSeller(A.sp.referralCode);
  expect((await A.ag.get('/api/v1/wallet').expect(200)).body.data).toEqual({available:0,pending:100});
  const c=(await adm.get('/api/v1/admin/commissions').expect(200)).body.data.find((x:any)=>String(x.sellerId)===String(A.sp._id));
  await adm.post(`/api/v1/admin/commissions/${c._id}/approve`).expect(200);await adm.post(`/api/v1/admin/commissions/${c._id}/approve`).expect(409);
  expect((await A.ag.get('/api/v1/wallet').expect(200)).body.data).toEqual({available:100,pending:0});});
});

describe('product images (Cloudinary)',()=>{
 const PNG=Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]),Buffer.alloc(64)]);
 const prod=(images:any[]=[])=>({name:'Widget '+(++n),sku:'W'+n,retailPrice:500,wholesalePrice:400,stock:10,images});
 it('only admins can upload',async()=>{
  await request(app).post('/api/v1/uploads/product-images').attach('files',PNG,{filename:'a.png',contentType:'image/png'}).expect(401);
  const S=await activeSeller();await S.ag.post('/api/v1/uploads/product-images').attach('files',PNG,{filename:'a.png',contentType:'image/png'}).expect(403);});
 it('accepts real images and returns Cloudinary URLs',async()=>{
  const adm=await admin();const r=await adm.post('/api/v1/uploads/product-images').attach('files',PNG,{filename:'a.png',contentType:'image/png'}).attach('files',PNG,{filename:'b.png',contentType:'image/png'}).expect(201);
  expect(r.body.data).toHaveLength(2);expect(r.body.data[0].url).toMatch(/^https:\/\/res\.cloudinary\.com\/testcloud\//);});
 it('rejects disguised files, wrong types and oversize files',async()=>{
  const adm=await admin();
  await adm.post('/api/v1/uploads/product-images').attach('files',Buffer.from('<script>alert(1)</script>'+' '.repeat(30)),{filename:'evil.png',contentType:'image/png'}).expect(400); // lies about type
  await adm.post('/api/v1/uploads/product-images').attach('files',Buffer.from('hello'),{filename:'a.txt',contentType:'text/plain'}).expect(400);
  await adm.post('/api/v1/uploads/product-images').attach('files',Buffer.concat([PNG,Buffer.alloc(5*1024*1024)]),{filename:'big.png',contentType:'image/png'}).expect(413);});
 it('rejects image URLs that are not from our Cloudinary account',async()=>{
  const adm=await admin();await adm.post('/api/v1/products').send(prod([{url:'https://evil.example/x.png',publicId:'reseller/products/x'}])).expect(400);
  await adm.post('/api/v1/products').send(prod([{url:'https://res.cloudinary.com/someone-else/image/upload/reseller/products/x.png',publicId:'reseller/products/x'}])).expect(400);});
 it('validates products, hides publicIds publicly, and deletes dropped images from Cloudinary on save',async()=>{
  const adm=await admin();const cld:any=await import('../src/services/cloudinary');
  const up=(await adm.post('/api/v1/uploads/product-images').attach('files',PNG,{filename:'a.png',contentType:'image/png'}).attach('files',PNG,{filename:'b.png',contentType:'image/png'}).expect(201)).body.data;
  await adm.post('/api/v1/products').send({...prod(),wholesalePrice:900}).expect(400); // wholesale > retail
  const c=(await adm.post('/api/v1/products').send(prod(up)).expect(201)).body.data;
  const pub=(await request(app).get('/api/v1/products').expect(200)).body.data.find((x:any)=>x._id===c._id);
  expect(pub.images).toEqual([up[0].url,up[1].url]);expect(JSON.stringify(pub)).not.toContain('publicId');
  await adm.put(`/api/v1/products/${c._id}`).send(prod([up[0]])).expect(200);
  expect(cld.deleteImage).toHaveBeenCalledWith(up[1].publicId);expect(cld.deleteImage).not.toHaveBeenCalledWith(up[0].publicId);
  await adm.post('/api/v1/uploads/product-images/delete').send({publicId:up[0].publicId}).expect(409); // still attached
  await adm.delete(`/api/v1/products/${c._id}`).expect(200);
  expect((await request(app).get('/api/v1/products').expect(200)).body.data.some((x:any)=>x._id===c._id)).toBe(false);});
});

describe('account security',()=>{
 const lastCode=(to:string)=>{const m=[...((globalThis as any).__mails||[])].reverse().find((x:any)=>x.to===to);return m?.text.match(/\b(\d{6})\b/)?.[1] as string;};
 const mailCount=(to:string)=>((globalThis as any).__mails||[]).filter((x:any)=>x.to===to).length;
 const login=(email:string,extra:any={})=>request(app).post('/api/v1/auth/login').send({email,password:PW,...extra});
 it('verifies email with a single-use code, limits guesses, and gates plan purchase',async()=>{
  const S=await seller();const pl=await newPlan();gateway({GatewayPageURL:'https://sandbox.example/pay'});
  await S.ag.post('/api/v1/payments/checkout').send({planId:String(pl._id)}).expect(403); // unverified
  const code=lastCode(S.user.email);expect(code).toMatch(/^\d{6}$/);
  const wrong=code==='000000'?'111111':'000000';
  await request(app).post('/api/v1/auth/verify-email').send({email:S.user.email,code:wrong}).expect(400);
  await request(app).post('/api/v1/auth/verify-email').send({email:S.user.email,code}).expect(200);
  await request(app).post('/api/v1/auth/verify-email').send({email:S.user.email,code}).expect(400); // already consumed
  const r=await S.ag.post('/api/v1/payments/checkout').send({planId:String(pl._id)}).expect(200);expect(r.body.data.gatewayUrl).toContain('sandbox.example');});
 it('invalidates a code after 5 wrong guesses even if the right one is then used',async()=>{
  const S=await seller();const code=lastCode(S.user.email),wrong=code==='000000'?'111111':'000000';
  for(let i=0;i<5;i++)await request(app).post('/api/v1/auth/verify-email').send({email:S.user.email,code:wrong}).expect(400);
  await request(app).post('/api/v1/auth/verify-email').send({email:S.user.email,code}).expect(400);
  await request(app).post('/api/v1/auth/resend-otp').send({email:S.user.email}).expect(200); // a fresh code works
  await request(app).post('/api/v1/auth/verify-email').send({email:S.user.email,code:lastCode(S.user.email)}).expect(200);});
 it('password reset: generic responses, wrong code fails, success signs out every session',async()=>{
  const S=await seller();const before=mailCount('ghost@t.test');
  const g=await request(app).post('/api/v1/auth/forgot').send({email:'ghost@t.test'}).expect(200);expect(mailCount('ghost@t.test')).toBe(before); // no mail, same response
  const k=await request(app).post('/api/v1/auth/forgot').send({email:S.user.email}).expect(200);expect(k.body).toEqual(g.body);
  const code=lastCode(S.user.email);await S.ag.get('/api/v1/auth/me').expect(200);
  await request(app).post('/api/v1/auth/reset').send({email:S.user.email,code:code==='000000'?'111111':'000000',password:'NewPassw0rd!x'}).expect(400);
  await request(app).post('/api/v1/auth/reset').send({email:S.user.email,code,password:'NewPassw0rd!x'}).expect(200);
  await S.ag.get('/api/v1/auth/me').expect(401);await login(S.user.email).expect(401);
  await request(app).post('/api/v1/auth/login').send({email:S.user.email,password:'NewPassw0rd!x'}).expect(200);
  await request(app).post('/api/v1/auth/reset').send({email:S.user.email,code,password:'Another1234!'}).expect(400);}); // code is single use
 it('lists and revokes sessions; logout invalidates the token server-side',async()=>{
  const S=await seller();const second=request.agent(app).set('Origin','http://localhost:3000');await second.post('/api/v1/auth/login').send({email:S.user.email,password:PW}).expect(200);
  const list=(await S.ag.get('/api/v1/auth/sessions').expect(200)).body.data;expect(list.length).toBe(2);expect(list.filter((x:any)=>x.current)).toHaveLength(1);
  const other=list.find((x:any)=>!x.current);await S.ag.delete(`/api/v1/auth/sessions/${other.id}`).expect(200);await second.get('/api/v1/auth/me').expect(401);await S.ag.get('/api/v1/auth/me').expect(200);
  const cookie=((await request(app).post('/api/v1/auth/login').send({email:S.user.email,password:PW})).headers['set-cookie'] as unknown as string[])[0].split(';')[0];
  await request(app).get('/api/v1/auth/me').set('Cookie',cookie).expect(200);
  await request(app).post('/api/v1/auth/logout').set('Cookie',cookie).expect(403); // CSRF guard: cookie without our Origin
  await request(app).post('/api/v1/auth/logout').set('Cookie',cookie).set('Origin','http://localhost:3000').expect(200);
  await request(app).get('/api/v1/auth/me').set('Cookie',cookie).expect(401);}); // replaying the old cookie after logout fails
 it("cannot revoke another user's session",async()=>{
  const A=await seller(),B=await seller();const sid=(await A.ag.get('/api/v1/auth/sessions')).body.data[0].id;
  await B.ag.delete(`/api/v1/auth/sessions/${sid}`).expect(404);await A.ag.get('/api/v1/auth/me').expect(200);});
 it('change password requires the current password and signs out other sessions',async()=>{
  const S=await seller();const other=request.agent(app).set('Origin','http://localhost:3000');await other.post('/api/v1/auth/login').send({email:S.user.email,password:PW}).expect(200);
  await S.ag.post('/api/v1/auth/change-password').send({current:'wrong-password',password:'Brand-new-pass1'}).expect(400);
  await S.ag.post('/api/v1/auth/change-password').send({current:PW,password:'Brand-new-pass1'}).expect(200);
  await S.ag.get('/api/v1/auth/me').expect(200);await other.get('/api/v1/auth/me').expect(401);});
 it('two-factor: setup, enable, enforced at login, single-use codes and recovery codes',async()=>{
  const {authenticator}=await import('otplib');const S=await seller();
  const setup=(await S.ag.post('/api/v1/auth/2fa/setup').expect(200)).body.data;expect(setup.qr).toMatch(/^data:image\/png/);
  const stored=await M.User.findById(S.user._id);expect(stored.pendingTotpEnc).toBeTruthy();expect(stored.pendingTotpEnc).not.toContain(setup.secret); // encrypted at rest
  await S.ag.post('/api/v1/auth/2fa/enable').send({code:'000000'}).expect(400);
  const rec=(await S.ag.post('/api/v1/auth/2fa/enable').send({code:authenticator.generate(setup.secret)}).expect(200)).body.data.recoveryCodes;expect(rec).toHaveLength(8);
  const need=await login(S.user.email).expect(200);expect(need.body.data.twoFactorRequired).toBe(true);expect(need.headers['set-cookie']).toBeUndefined(); // no session yet
  await login(S.user.email,{totp:'000000'}).expect(401);
  vi.useFakeTimers({toFake:['Date'],now:Date.now()+90_000}); // move to a later 30s step than the one consumed at enable
  try{const c=authenticator.generate(setup.secret);await login(S.user.email,{totp:c}).expect(200);await login(S.user.email,{totp:c}).expect(401);}finally{vi.useRealTimers();} // replay blocked
  await login(S.user.email,{totp:rec[0]}).expect(200);await login(S.user.email,{totp:rec[0]}).expect(401); // recovery code is single use
  await S.ag.post('/api/v1/auth/2fa/disable').send({password:'wrong',code:rec[1]}).expect(400);
  await S.ag.post('/api/v1/auth/2fa/disable').send({password:PW,code:rec[1]}).expect(200);await login(S.user.email).expect(200);});
});
