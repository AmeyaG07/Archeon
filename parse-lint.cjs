const fs = require('fs');
const r = JSON.parse(fs.readFileSync('d:/WEBUI/frontend/lint-errors.json', 'utf8'));
let total = 0;
r.forEach(f => {
  const e = f.messages.filter(m => m.severity === 2);
  if (e.length > 0) {
    const file = f.filePath.replace('D:\\WEBUI\\frontend\\', '');
    const rules = {};
    e.forEach(m => { rules[m.ruleId] = (rules[m.ruleId] || 0) + 1; });
    console.log(file + ': ' + e.length + ' errors - ' + JSON.stringify(rules));
    total += e.length;
  }
});
console.log('TOTAL: ' + total);