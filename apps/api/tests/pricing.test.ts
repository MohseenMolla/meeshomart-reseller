import { describe,it,expect } from 'vitest';
import { validateSellingPrice,validSlug } from '../src/services/pricing';
describe('selling price rules',()=>{
 it('rejects below wholesale',()=>expect(validateSellingPrice(399,400,500)).toBe('Price below wholesale'));
 it('accepts within range',()=>expect(validateSellingPrice(600,400,500)).toBeNull());
 it('rejects above 150% of retail',()=>expect(validateSellingPrice(751,400,500)).toBe('Price above platform maximum'));
});
describe('slugs',()=>{
 it('accepts valid',()=>expect(validSlug('my-shop-1')).toBe(true));
 it('rejects reserved/invalid',()=>{expect(validSlug('admin')).toBe(false);expect(validSlug('-bad')).toBe(false);expect(validSlug('A_B')).toBe(false);});
});
