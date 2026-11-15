/** Cloudinary on-the-fly resize: square crop, auto format/quality. Safely handles strings, { url: string } objects, null, or undefined. */
export const imgUrl = (u: any, w = 400): string => {
  if (!u) return '';
  const url = typeof u === 'string' ? u : typeof u?.url === 'string' ? u.url : '';
  if (!url) return '';
  return url.includes('/image/upload/')
    ? url.replace('/image/upload/', `/image/upload/c_fill,ar_1:1,w_${w},q_auto,f_auto/`)
    : url;
};
