const fs = require('fs');
const r = JSON.parse(fs.readFileSync('d:/WEBUI/frontend/lint-errors.json', 'utf8'));
r.forEach(f => {
  const e = f.messages.filter(m => m.severity === 2);
  if (e.length > 0) {
    const file = f.filePath.replace('D:\\WEBUI\\frontend\\', '');
    // Skip public/assets
    if (file.startsWith('public\\assets')) return;
    console.log('=== ' + file + ' ===');
    e.forEach(m => console.log('  Line ' + m.line + ': ' + m.ruleId + ' - ' + m.message));
  }
});