const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('27th Feb 2026, PULSE-R24.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('pdf_output.txt', data.text);
    console.log("SUCCESS");
}).catch(function(error){
    console.error("ERROR:", error);
});
