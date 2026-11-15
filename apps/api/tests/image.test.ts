import { describe,it,expect } from 'vitest';
import { detectImage } from '../src/utils/image';
const pad=(a:number[])=>Buffer.concat([Buffer.from(a),Buffer.alloc(16)]);
describe('detectImage (magic bytes)',()=>{
 it('png',()=>expect(detectImage(pad([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))).toBe('png'));
 it('jpeg',()=>expect(detectImage(pad([0xff,0xd8,0xff,0xe0]))).toBe('jpeg'));
 it('webp',()=>expect(detectImage(Buffer.concat([Buffer.from('RIFF'),Buffer.alloc(4),Buffer.from('WEBP'),Buffer.alloc(8)]))).toBe('webp'));
 it('rejects scripts/html/gif and short files',()=>{expect(detectImage(Buffer.from('<script>alert(1)</script>'))).toBeNull();expect(detectImage(Buffer.from('GIF89a'+'x'.repeat(20)))).toBeNull();expect(detectImage(Buffer.from([0xff]))).toBeNull();});
});
