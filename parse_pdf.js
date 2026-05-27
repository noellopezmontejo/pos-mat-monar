const fs = require('fs');
const pdf = require('pdf-parse');
let dataBuffer = fs.readFileSync('fel_manual.pdf');
pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('fel_manual.txt', data.text);
    console.log('PDF parsed successfully.');
}).catch(console.error);
