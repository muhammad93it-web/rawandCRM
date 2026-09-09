const fs = require('fs');
const path = require('path');

const files = [
  'artifacts/rawand-decoration-crm/src/index.css',
  'artifacts/rawand-decoration-crm/src/pages/items-new.tsx',
  'artifacts/rawand-decoration-crm/src/pages/organization-lists.tsx',
  'artifacts/rawand-decoration-crm/src/pages/workplaces.tsx',
  'artifacts/rawand-decoration-crm/src/pages/store-config.tsx',
  'artifacts/rawand-decoration-crm/src/pages/services-list.tsx',
  'artifacts/rawand-decoration-crm/src/pages/general-configurations.tsx',
  'artifacts/rawand-decoration-crm/src/pages/purchases-new.tsx',
  'artifacts/rawand-decoration-crm/src/pages/sales-new.tsx',
  'artifacts/rawand-decoration-crm/src/pages/income.tsx',
  'artifacts/rawand-decoration-crm/src/pages/expense.tsx'
];

files.forEach(file => {
  const filePath = path.resolve(file);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping missing file: ${file}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove trailing whitespace on each line
  content = content.split('\n').map(line => line.replace(/[ \t]+$/, '')).join('\n');
  
  // Ensure exactly one trailing newline at EOF
  content = content.replace(/\n*$/, '\n');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Processed ${file}`);
});
