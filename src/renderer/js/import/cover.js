/**
 * Cover thumbnails. Images are decoded and re-encoded through a canvas so
 * that only a plain JPEG produced by the browser is ever stored.
 */

const COVER_WIDTH = 360;
const MAX_HEIGHT = 560;

export async function canvasToJpeg(canvas, quality = 0.85) {
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));
  if (!blob) return null;
  return new Uint8Array(await blob.arrayBuffer());
}

export async function imageBytesToCover(bytes, type) {
  if (!/^image\/(png|jpe?g|gif|webp|bmp)$/.test(type)) return null;
  if (bytes.byteLength > 30 * 1024 * 1024) return null;
  const bitmap = await createImageBitmap(new Blob([bytes], { type }));
  try {
    if (bitmap.width < 32 || bitmap.height < 32) return null;
    const scale = Math.min(COVER_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height, 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await canvasToJpeg(canvas);
  } finally {
    bitmap.close();
  }
}

export { COVER_WIDTH };
