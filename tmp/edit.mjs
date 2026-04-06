import fs from 'fs';
const path = 'c:/Users/yksai/OneDrive/Desktop/su r24/news-app/pages/admin/AdminApprovals.tsx';
let txt = fs.readFileSync(path, 'utf8');

txt = txt.replace('const items = await storageService.getNewsItems();', 'const user = await storageService.getAuth();\n        setCurrentUser(user);\n        const items = await storageService.getNewsItems();');

txt = txt.replace('const title = item.blocks.find(b => b.type === \'title\')?.value || \'Untitled\';', 'const isOwnArticle = item.author === currentUser?.email || item.author === currentUser?.name;\n                        const canApprove = currentUser?.role === \'admin\' || !isOwnArticle;\n\n                        const title = item.blocks.find(b => b.type === \'title\')?.value || \'Untitled\';');

txt = txt.replace('onClick={() => handleAction(item, \'rejected\')}', 'onClick={() => handleAction(item, \'rejected\')}\n                                        disabled={!canApprove && currentUser?.role !== \'admin\'}');
txt = txt.replace('onClick={() => handleAction(item, \'published\')}', 'onClick={() => handleAction(item, \'published\')}\n                                        disabled={!canApprove}');

fs.writeFileSync(path, txt);
console.log("Updated AdminApprovals");
