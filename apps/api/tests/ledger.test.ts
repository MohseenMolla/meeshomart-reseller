import { describe,it,expect } from 'vitest';
import { canTransition,MIN_WITHDRAWAL } from '../src/services/ledger';
describe('order state machine',()=>{
 it('allows forward flow',()=>{expect(canTransition('pending','confirmed')).toBe(true);expect(canTransition('out_for_delivery','delivered')).toBe(true);});
 it('blocks skipping and reopening',()=>{expect(canTransition('pending','delivered')).toBe(false);expect(canTransition('cancelled','confirmed')).toBe(false);expect(canTransition('shipped','cancelled')).toBe(false);});
 it('only delivered orders can be refunded via return path',()=>{expect(canTransition('delivered','refunded')).toBe(true);expect(canTransition('pending','refunded')).toBe(false);});
 it('min withdrawal',()=>expect(MIN_WITHDRAWAL).toBe(500));
});
