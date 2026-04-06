import fs from 'fs';
const file = 'c:/Users/yksai/OneDrive/Desktop/su r24/news-app/scripts/migrate_tags.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/\\`/g, '\`');
code = code.replace(/\\\${/g, '${');
fs.writeFileSync(file, code);
console.log('Fixed migrate_tags.ts');
