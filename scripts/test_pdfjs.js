const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function testPdf() {
    try {
        const buf = fs.readFileSync('27th Feb 2026, PULSE-R24.pdf');
        // Mimic file.arrayBuffer() -> Uint8Array
        const data = new Uint8Array(buf);
        const pdf = await pdfjsLib.getDocument({ data }).promise;
        console.log("PDF Pages:", pdf.numPages);
    } catch (err) {
        console.error("PDFJS ERROR:", err);
    }
}
testPdf();
