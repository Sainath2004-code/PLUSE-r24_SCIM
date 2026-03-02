const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('public/dummy.pdf'));

doc.fontSize(25).text('Test Pulse R24 Bulletin', 100, 100);
doc.fontSize(12).text('Vol. 2024 - 05', 100, 150);

doc.moveDown();
doc.fontSize(16).text('Threat Intelligence Update');
doc.moveDown();

doc.fontSize(12).text('This is the body content of the test PDF. It should be extracted as the first paragraph.');
doc.moveDown();
doc.text('Here is a second paragraph. Malicious activity was detected originating from various botnets targeting critical infrastructure.');

doc.end();
console.log('Dummy PDF created at public/dummy.pdf');
