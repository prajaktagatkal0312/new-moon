import fs from 'fs';
let c = fs.readFileSync('frontend/src/App.tsx', 'utf8');
c = c.replace(/className=\{px-4 py-3 rounded-xl border shadow-xl flex items-center space-x-2 text-xs font-medium \}/g, 'className={px-4 py-3 rounded-xl border shadow-xl flex items-center space-x-2 text-xs font-medium }');
fs.writeFileSync('frontend/src/App.tsx', c);
