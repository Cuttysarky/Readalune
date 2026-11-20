'use strict';
/**
 * Minimal ZIP writer/reader for library backups (main process only).
 * The reader enforces size limits and only returns entries whose names match
 * an allow-list, so a crafted backup can never write outside the library.
 */
const fs = require('node:fs/promises');
const zlib = require('node:zlib');

const STORE_EXT = /\.(jpg|jpeg|png|gz|bin|woff2?)$/i;

/** Write [name, absolutePath] pairs into a ZIP file at `target`. */
async function writeZip(target, entries) {
  const fh = await fs.open(target, 'w');
  const central = [];
  let offset = 0;
  try {
    for (const [name, abs] of entries) {
      const data = await fs.readFile(abs);
      const store = STORE_EXT.test(name);
      const comp = store ? data : zlib.deflateRawSync(data, { level: 6 });
      const nameBuf = Buffer.from(name, 'utf8');
      const crc = zlib.crc32(data);
      if (comp.length > 0xfffffffe || offset > 0xfffffffe) throw new Error('Backup is too large (over 4 GB).');
      const lh = Buffer.alloc(30);
      lh.writeUInt32LE(0x04034b50, 0);
      lh.writeUInt16LE(20, 4);
      lh.writeUInt16LE(0x0800, 6);
      lh.writeUInt16LE(store ? 0 : 8, 8);
      lh.writeUInt32LE(crc, 14);
      lh.writeUInt32LE(comp.length, 18);
      lh.writeUInt32LE(data.length, 22);
      lh.writeUInt16LE(nameBuf.length, 26);
      await fh.write(Buffer.concat([lh, nameBuf]));
      await fh.write(comp);
      const ch = Buffer.alloc(46);
      ch.writeUInt32LE(0x02014b50, 0);
      ch.writeUInt16LE(20, 4);
      ch.writeUInt16LE(20, 6);
      ch.writeUInt16LE(0x0800, 8);
      ch.writeUInt16LE(store ? 0 : 8, 10);
      ch.writeUInt32LE(crc, 16);
      ch.writeUInt32LE(comp.length, 20);
      ch.writeUInt32LE(data.length, 24);
      ch.writeUInt16LE(nameBuf.length, 28);
      ch.writeUInt32LE(offset, 42);
      central.push(ch, nameBuf);
      offset += 30 + nameBuf.length + comp.length;
    }
    const cd = Buffer.concat(central);
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(entries.length, 8);
    end.writeUInt16LE(entries.length, 10);
    end.writeUInt32LE(cd.length, 12);
    end.writeUInt32LE(offset, 16);
    await fh.write(Buffer.concat([cd, end]));
  } finally {
    await fh.close();
  }
  return offset;
}

/**
 * Read a ZIP buffer. Returns Map<name, Buffer> for allowed names only.
 * Throws on malformed archives, encryption, or anything over the limits.
 */
function readZip(buf, { allow, maxEntry = 400 * 1024 * 1024, maxTotal = 3 * 1024 * 1024 * 1024 }) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('This file is not a ZIP backup.');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = new Map();
  let total = 0;
  for (let i = 0; i < count; i++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Corrupt backup file.');
    const flags = buf.readUInt16LE(p + 8);
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const size = buf.readUInt32LE(p + 24);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const lo = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nameLen).toString('utf8');
    p += 46 + nameLen + extraLen + commentLen;
    if (!allow.test(name)) continue;
    if (flags & 1) throw new Error('Encrypted backups are not supported.');
    if (size > maxEntry || (total += size) > maxTotal) throw new Error('Backup is too large.');
    if (lo + 30 > buf.length || buf.readUInt32LE(lo) !== 0x04034b50) throw new Error('Corrupt backup file.');
    const start = lo + 30 + buf.readUInt16LE(lo + 26) + buf.readUInt16LE(lo + 28);
    const data = buf.subarray(start, start + compSize);
    let content;
    if (method === 0) content = Buffer.from(data);
    else if (method === 8) content = zlib.inflateRawSync(data, { maxOutputLength: maxEntry });
    else throw new Error('Unsupported compression in backup.');
    if (content.length !== size) throw new Error('Corrupt backup file.');
    out.set(name, content);
  }
  return out;
}

module.exports = { writeZip, readZip };
