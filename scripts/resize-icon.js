const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '..', 'resources', 'android', 'icon.png');
const out = src; // overwrite

if (!fs.existsSync(src)) {
  console.error('Source icon not found at', src);
  process.exit(1);
}

sharp(src)
  .resize(1024, 1024, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toFile(out + '.tmp.png')
  .then(() => {
    fs.renameSync(out + '.tmp.png', out);
    console.log('Resized icon written to', out);
  })
  .catch((err) => {
    console.error('Resize failed:', err);
    process.exit(1);
  });
