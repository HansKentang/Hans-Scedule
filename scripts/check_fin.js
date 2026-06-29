const fs = require('fs');
var html = fs.readFileSync('finance.html','utf8');
console.log('Has BOM:', html.charCodeAt(0) === 0xFEFF);
console.log('Has proper structure:', html.includes('<html') && html.includes('</html>'));
var matches = html.match(/data-i18n="[^"]*"/g);
console.log('data-i18n attrs:', matches ? matches.length : 0);
