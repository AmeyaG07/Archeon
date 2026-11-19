const fs = require('fs');

// Files with jsx-no-comment-textnodes errors and the line numbers to remove
const filesWithComments = {
  'src/components/ui/ConsultationModal.tsx': [107, 126],
  'src/components/ui/ManifestoModal.tsx': [75],
  'src/components/ui/ProjectDetailModal.tsx': [216, 223, 232],
  'src/components/ui/ProjectModal.tsx': [98, 105, 114],
  'src/components/ui/ScrollOverlay.tsx': [495, 553],
  'src/components/ui/ServiceModal.tsx': [70, 85],
};

let totalFixed = 0;
Object.entries(filesWithComments).forEach(([file, lines]) => {
  const fullPath = 'd:/WEBUI/frontend/' + file;
  if (!fs.existsSync(fullPath)) {
    console.log('SKIP (not found): ' + file);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const contentLines = content.split('\n');
  
  // Sort lines descending to remove from bottom up (preserves line numbers)
  const sortedLines = [...lines].sort((a, b) => b - a);
  
  sortedLines.forEach(lineNum => {
    const idx = lineNum - 1;
    if (idx < 0 || idx >= contentLines.length) return;
    const line = contentLines[idx];
    // Verify it's a JSX comment line
    if (line.trim().startsWith('{/*') && line.trim().endsWith('*/}')) {
      contentLines.splice(idx, 1);
      console.log('Removed comment line ' + lineNum + ' from ' + file);
      totalFixed++;
    } else {
      console.log('WARNING: Line ' + lineNum + ' in ' + file + ' is not a JSX comment: ' + line.trim());
    }
  });
  
  fs.writeFileSync(fullPath, contentLines.join('\n'));
});
console.log('Total comment lines removed: ' + totalFixed);