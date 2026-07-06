const fs = require('fs');
const path = require('path');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  
  if (filePath.endsWith('.css')) {
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
  } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    // For JSX, remove {/* ... */}
    content = content.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');
    
    // For JS/JSX, remove /* ... */
    content = content.replace(/\/\*[\s\S]*?\*\//g, '');
    
    // For JS/JSX line comments //
    // Matches // not preceded by : or ' or "
    // This avoids matching inside strings like "://" or similar simple cases, though mostly we rely on ://
    content = content.replace(/(?<![:'"])\s*\/\/.*$/gm, '');
  }
  
  // Remove 3 or more consecutive newlines
  content = content.replace(/\n{3,}/g, '\n\n');
  
  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log('Processed:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      walkDir(fullPath);
    } else {
      if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx') || fullPath.endsWith('.css')) {
        processFile(fullPath);
      }
    }
  }
}

walkDir(path.join(__dirname, 'client', 'src'));
walkDir(path.join(__dirname, 'server'));

console.log('Done.');
