const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '.env.local');

try {
  const content = fs.readFileSync(filePath);
  console.log('File byte length:', content.length);
  
  // Show hex representation of the first 50 bytes and the last 100 bytes
  console.log('Hex representation of first 50 bytes:');
  console.log(content.slice(0, 50).toString('hex'));
  
  console.log('\nAll line-by-line character audit:');
  const lines = content.toString('utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const charCodes = [];
    for (let i = 0; i < line.length; i++) {
      charCodes.push(line.charCodeAt(i));
    }
    console.log(`Line ${index + 1} (${line.length} chars): "${line}" -> codes:`, charCodes);
  });
} catch (err) {
  console.error('Error reading file:', err);
}
