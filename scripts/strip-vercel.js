const fs = require('fs');
[
  'www/.vercel',
  'android/app/src/main/assets/public/.vercel',
  'ios/App/App/public/.vercel'
].forEach(d => {
  try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) {}
});
