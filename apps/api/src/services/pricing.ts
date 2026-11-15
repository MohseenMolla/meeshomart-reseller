export const MAX_MARKUP=1.5; // seller price may not exceed 150% of platform retail price
export const SLUG_RE=/^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$/;
export const RESERVED_SLUGS=['admin','api','store','login','register','seller','www'];
export function validateSellingPrice(price:number,wholesale:number,retail:number){
 if(price<wholesale)return 'Price below wholesale';
 if(price>retail*MAX_MARKUP)return 'Price above platform maximum';
 return null;}
export const validSlug=(s:string)=>SLUG_RE.test(s)&&!RESERVED_SLUGS.includes(s);
