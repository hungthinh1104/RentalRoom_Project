// Shim for environments that resolve to utils.js
// Re-export everything from the TypeScript implementation
require('ts-node/register');
module.exports = require('./utils.ts');
