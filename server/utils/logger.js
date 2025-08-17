const log = (...args) => console.log('[server]', ...args);
const warn = (...args) => console.warn('[warn]', ...args);
const error = (...args) => console.error('[error]', ...args);
module.exports = { log, warn, error };