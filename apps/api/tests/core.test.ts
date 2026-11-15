import { describe,it,expect } from 'vitest';
import { orderProfit,orderTotal,referralCommission,addDays } from '../src/utils';
describe('calculations',()=>{
 const items=[{qty:2,unitPrice:500,wholesale:400},{qty:1,unitPrice:300,wholesale:250}];
 it('total',()=>expect(orderTotal(items)).toBe(1300));
 it('profit',()=>expect(orderProfit(items)).toBe(250));
 it('referral commission',()=>expect(referralCommission(1000,10)).toBe(100));
 it('subscription expiry',()=>expect(addDays(new Date('2026-01-01'),30).toISOString().slice(0,10)).toBe('2026-01-31'));
});
