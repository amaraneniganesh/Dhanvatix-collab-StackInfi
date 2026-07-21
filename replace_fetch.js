const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'apps/customer-portal/src/components/Dashboard.tsx',
  'apps/customer-portal/src/components/AuthPage.tsx',
  'apps/customer-portal/src/components/AdminPortal.tsx'
];

for (const relPath of filesToUpdate) {
  const fullPath = path.join(__dirname, relPath);
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  if (!content.includes('import { apiFetch } from')) {
    content = content.replace(
      "import { useNavigate } from 'react-router-dom';",
      "import { useNavigate } from 'react-router-dom';\nimport { apiFetch } from '../utils/apiClient';"
    );
  }
  
  content = content.replace(/await fetch\(/g, 'await apiFetch(');
  
  fs.writeFileSync(fullPath, content);
  console.log('Updated', relPath);
}
