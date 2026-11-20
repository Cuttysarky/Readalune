/**
 * Minimal, read-only ZIP reader (enough for EPUB files).
 * Uses the platform's built-in DecompressionStream - no third-party code.
 * Includes limits against malformed archives and "zip bombs".
 */

export const MAX_ENTRY_BYTES = 64 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 512 * 1024 * 1024;
const MAX_ENTRIES = 20000;

export class ZipError extends Error {}

/* Shown to the reader, so said plainly: every kind of broken archive gets the same sentence. */
const DAMAGED = 'This file is damaged or is not a real EPUB or comic archive.';

export function openZip(input) {
  const u8 = input instanceof Uint8Array ? input : new Uint8Array(input);
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  if (u8.length < 22) throw new ZipError(DAMAGED);

  // Find the End Of Central Directory record (last 64 KB + 22 bytes).
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new ZipError(DAMAGED);
  const count = dv.getUint16(eocd + 10, true);
  const cdOffset = dv.getUint32(eocd + 16, true);
  if (cdOffset === 0xffffffff || count === 0xffff) throw new ZipError('ZIP64 archives are not supported.');
  if (count > MAX_ENTRIES) throw new ZipError('Archive has too many files.');
  if (cdOffset >= u8.length) throw new ZipError(DAMAGED);

  const utf8 = new TextDecoder('utf-8');
  const entries = new Map();
  let p = cdOffset;
  for (let i = 0; i < count; i++) {
    if (p + 46 > u8.length || dv.getUint32(p, true) !== 0x02014b50) throw new ZipError(DAMAGED);
    const flags = dv.getUint16(p + 8, true);
    const method = dv.getUint16(p + 10, true);
    const compSize = dv.getUint32(p + 20, true);
    const size = dv.getUint32(p + 24, true);
    const nameLen = dv.getUint16(p + 28, true);
    const extraLen = dv.getUint16(p + 30, true);
    const commentLen = dv.getUint16(p + 32, true);
    const localOffset = dv.getUint32(p + 42, true);
    const name = utf8.decode(u8.subarray(p + 46, p + 46 + nameLen));
    entries.set(name, { name, flags, method, compSize, size, localOffset });
    p += 46 + nameLen + extraLen + commentLen;
  }

  let totalRead = 0;

  async function read(name) {
    const e = entries.get(name);
    if (!e) throw new ZipError(`Missing file in archive: ${name}`);
    if (e.flags & 0x1) throw new ZipError('This archive is encrypted.');
    const lo = e.localOffset;
    if (lo + 30 > u8.length || dv.getUint32(lo, true) !== 0x04034b50) throw new ZipError(DAMAGED);
    const start = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true);
    const end = start + e.compSize;
    if (end > u8.length) throw new ZipError(DAMAGED);
    const data = u8.subarray(start, end);
    let out;
    if (e.method === 0) out = data.slice();
    else if (e.method === 8) out = await inflateRaw(data, Math.min(MAX_ENTRY_BYTES, MAX_TOTAL_BYTES - totalRead));
    else throw new ZipError(`Unsupported compression method (${e.method}).`);
    totalRead += out.length;
    if (totalRead > MAX_TOTAL_BYTES) throw new ZipError('Archive expands to more data than allowed.');
    return out;
  }

  async function readText(name) {
    const bytes = await read(name);
    return new TextDecoder('utf-8').decode(bytes);
  }

  return {
    entries,
    has: (name) => entries.has(name),
    read,
    readText,
  };
}

export async function inflateRaw(data, maxBytes) {
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  // Write a copy: streams may take ownership of (detach) the chunk's memory.
  writer.write(data.slice()).catch(() => {});
  writer.close().catch(() => {});
  const reader = ds.readable.getReader();
  const chunks = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > maxBytes) {
        reader.cancel().catch(() => {});
        throw new ZipError('A file inside the archive is too large.');
      }
      chunks.push(value);
    }
  } catch (err) {
    if (err instanceof ZipError) throw err;
    throw new ZipError(DAMAGED);
  }
  const out = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.length;
  }
  return out;
}

/** Resolve a relative href against the directory of a file inside the archive. */
export function resolvePath(fromFile, href) {
  let target = href.split('#')[0].split('?')[0];
  try {
    target = decodeURIComponent(target);
  } catch {
    /* keep as-is */
  }
  if (!target) return fromFile;
  const parts = target.startsWith('/') ? [] : fromFile.split('/').slice(0, -1);
  for (const seg of target.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') parts.pop();
    else parts.push(seg);
  }
  return parts.join('/');
}
