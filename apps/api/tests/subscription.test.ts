import { describe,it,expect } from 'vitest';
import { computeNewExpiry,classify } from '../src/services/subscription';
const d=(s:string)=>new Date(s+'T00:00:00Z');
describe('renewal',()=>{
 const plan={durationDays:30};
 it('new seller starts from now',()=>expect(computeNewExpiry(undefined,d('2026-01-01'),plan)).toEqual(d('2026-01-31')));
 it('early renewal extends from current end',()=>expect(computeNewExpiry(d('2026-01-20'),d('2026-01-10'),plan)).toEqual(d('2026-02-19')));
 it('lapsed renewal starts from now',()=>expect(computeNewExpiry(d('2026-01-01'),d('2026-03-01'),plan)).toEqual(d('2026-03-31')));
 it('lifetime has no expiry',()=>expect(computeNewExpiry(d('2026-01-01'),d('2026-01-02'),{lifetime:true})).toBeUndefined());
});
describe('classify',()=>{
 const now=d('2026-06-10');
 it('lifetime',()=>expect(classify(undefined,now)).toBe('lifetime'));
 it('ok',()=>expect(classify(d('2026-07-10'),now)).toBe('ok'));
 it('remind within 3 days',()=>expect(classify(d('2026-06-12'),now)).toBe('remind'));
 it('grace after end',()=>expect(classify(d('2026-06-08'),now,3)).toBe('grace'));
 it('expired after grace',()=>expect(classify(d('2026-06-01'),now,3)).toBe('expired'));
});
