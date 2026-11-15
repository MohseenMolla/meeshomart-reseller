import crypto from 'crypto';
export const code=(p:string,n=6)=>p+crypto.randomBytes(n).toString('hex').slice(0,n).toUpperCase();
export const orderProfit=(items:{qty:number;unitPrice:number;wholesale:number}[])=>items.reduce((a,i)=>a+(i.unitPrice-i.wholesale)*i.qty,0);
export const orderTotal=(items:{qty:number;unitPrice:number}[])=>items.reduce((a,i)=>a+i.unitPrice*i.qty,0);
export const referralCommission=(planPrice:number,pct:number)=>Math.floor(planPrice*pct)/100;
export const addDays=(d:Date,n:number)=>new Date(d.getTime()+n*864e5);
