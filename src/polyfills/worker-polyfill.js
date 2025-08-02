// Polyfill for Web Worker globals in Node.js environment
if (typeof global !== 'undefined') {
  if (typeof self === 'undefined') {
    global.self = global;
  }

  // Polyfill webpackChunk for server-side rendering
  if (typeof global.webpackChunk_N_E === 'undefined') {
    global.webpackChunk_N_E = [];
  }

  // Ensure self has webpackChunk_N_E
  if (global.self && typeof global.self.webpackChunk_N_E === 'undefined') {
    global.self.webpackChunk_N_E = global.webpackChunk_N_E;
  }
}

if (typeof globalThis !== 'undefined') {
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis;
  }

  // Polyfill webpackChunk for server-side rendering
  if (typeof globalThis.webpackChunk_N_E === 'undefined') {
    globalThis.webpackChunk_N_E = [];
  }

  // Ensure self has webpackChunk_N_E
  if (globalThis.self && typeof globalThis.self.webpackChunk_N_E === 'undefined') {
    globalThis.self.webpackChunk_N_E = globalThis.webpackChunk_N_E;
  }
}
