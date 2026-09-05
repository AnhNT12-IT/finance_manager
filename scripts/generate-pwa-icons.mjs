import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { fileURLToPath } from 'node:url'

/**
 * Compute CRC32 for PNG chunks.
 */
const getCrc32 = (buffer) => {
  let crc = ~0

  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index]

    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }

  return ~crc >>> 0
}

/**
 * Build a PNG chunk.
 */
const createChunk = (type, data) => {
  const typeBuffer = Buffer.from(type)
  const lengthBuffer = Buffer.alloc(4)
  lengthBuffer.writeUInt32BE(data.length)

  const crcBuffer = Buffer.alloc(4)
  crcBuffer.writeUInt32BE(getCrc32(Buffer.concat([typeBuffer, data])))

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer])
}

/**
 * Create a solid brand PNG with a soft center mark.
 */
const createPng = (size, red, green, blue) => {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 2

  const rows = []

  for (let y = 0; y < size; y += 1) {
    const line = Buffer.alloc(1 + size * 3)
    line[0] = 0

    for (let x = 0; x < size; x += 1) {
      const pixel = 1 + x * 3
      const dx = x - size / 2
      const dy = y - size / 2
      const isMark = Math.sqrt(dx * dx + dy * dy) < size * 0.28

      if (isMark) {
        line[pixel] = 229
        line[pixel + 1] = 244
        line[pixel + 2] = 236
      } else {
        line[pixel] = red
        line[pixel + 1] = green
        line[pixel + 2] = blue
      }
    }

    rows.push(line)
  }

  const compressed = zlib.deflateSync(Buffer.concat(rows))

  return Buffer.concat([
    signature,
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0)),
  ])
}

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public')
fs.mkdirSync(publicDir, { recursive: true })
fs.writeFileSync(path.join(publicDir, 'pwa-192.png'), createPng(192, 31, 122, 85))
fs.writeFileSync(path.join(publicDir, 'pwa-512.png'), createPng(512, 31, 122, 85))
console.log('PWA icons written to public/')
