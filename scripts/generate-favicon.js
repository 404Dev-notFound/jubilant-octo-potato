const fs = require('fs');
const path = require('path');

// 16x16 transparent PNG with a stylized terminal prompt matching CodeCollab brand colors (#10131A, #AEC6FF, #48DDBC)
// Base64 encoded 16x16 PNG
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAZElEQVQ4T2NkwAH+//9vT1XMoEA7g5GFgUqGMTAw/MfG/08xMEYNGBgYGBgxDCBkBk5d+A3BpRBmALqhyBoIZoBEyv4fCGBkYGA8CjMArxWkehhF/v8n1QAMQ5Bth/qJjAxg4kQZAAAiZ3B69z7k7gAAAABJRU5ErkJggg==';
const pngBuffer = Buffer.from(pngBase64, 'base64');

// ICO Header: 6 bytes
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // Reserved
header.writeUInt16LE(1, 2); // Type 1 = ICO
header.writeUInt16LE(1, 4); // 1 Image

// ICO Directory Entry: 16 bytes
const entry = Buffer.alloc(16);
entry.writeUInt8(16, 0); // Width 16
entry.writeUInt8(16, 1); // Height 16
entry.writeUInt8(0, 2);  // Palette size
entry.writeUInt8(0, 3);  // Reserved
entry.writeUInt16LE(1, 4); // Color planes
entry.writeUInt16LE(32, 6); // Bits per pixel
entry.writeUInt32LE(pngBuffer.length, 8); // Image data size
entry.writeUInt32LE(22, 12); // Offset (6 + 16 = 22)

const icoBuffer = Buffer.concat([header, entry, pngBuffer]);
fs.writeFileSync(path.join(__dirname, '..', 'favicon.ico'), icoBuffer);
console.log('✅ Successfully generated valid favicon.ico (size:', icoBuffer.length, 'bytes)');
