// Jest polyfills - runs before any modules are imported
const { TextEncoder, TextDecoder } = require('util')

// Setup TextEncoder and TextDecoder globally
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Setup URL if not available
if (!global.URL) {
  global.URL = require('url').URL
}

// Setup URLSearchParams if not available
if (!global.URLSearchParams) {
  global.URLSearchParams = require('url').URLSearchParams
}

// Setup ReadableStream for Node 16+
if (!global.ReadableStream) {
  try {
    const { ReadableStream } = require('stream/web')
    global.ReadableStream = ReadableStream
  } catch (e) {
    // Ignore if not available
  }
} 