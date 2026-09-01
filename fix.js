const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'artifacts/rawand-decoration-crm/src/pages');

// Replace the root wrapper in all pages
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace wrapper
  content = content.replace(
    /className="rounded-sm bg-white p-4 shadow-sm min-h-\[calc\(100vh-42px\)\]"/g,
    'className=""'
  );

  // Fix menu links DOM order (Label/Icon first, then Chevron)
  // Old: <ChevronLeft... /> <div...>...</div>
  // New: <div...>...</div> <ChevronLeft... />
  const linkRegex = /<ChevronLeft([^>]+)\/>\s*<div className="flex items-center gap-2">([\s\S]*?)<\/div>/g;
  content = content.replace(linkRegex, (match, chevProps, inner) => {
    return `<div className="flex items-center gap-3">\n${inner}\n          </div>\n          <ChevronLeft${chevProps}/>`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Done processing wrapper and links.');
