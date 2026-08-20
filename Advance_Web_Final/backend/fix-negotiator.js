/**
 * Post-install fix for negotiator@0.6.3 broken on Node 22+ / Windows
 * Creates the missing accept.js file if it doesn't exist
 */
const fs = require('fs');
const path = require('path');

const negotiatorLib = path.join(__dirname, 'node_modules', 'negotiator', 'lib');
const charsetFile = path.join(negotiatorLib, 'charset.js');
const acceptFile = path.join(negotiatorLib, 'accept.js');

try {
  if (fs.existsSync(charsetFile) && !fs.existsSync(acceptFile)) {
    // accept.js is identical to charset.js in negotiator
    fs.copyFileSync(charsetFile, acceptFile);
    console.log('✅ Fixed negotiator: created missing accept.js');
  }
} catch (err) {
  // Silently ignore — not critical
}
