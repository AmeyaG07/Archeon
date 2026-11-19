const fs = require('fs');

// Files with jsx-no-comment-textnodes errors - exact comment lines to remove
const filesWithComments = {
  'src/components/ui/ConsultationModal.tsx': [
    '            {/* Top Bar */}',
    '            {/* Studio Location & Verified Office Header */}'
  ],
  'src/components/ui/ManifestoModal.tsx': [
    '            {/* Approach Points (Verified siteConfig.about.approach) */}'
  ],
  'src/components/ui/ProjectDetailModal.tsx': [
    '            {/* Brief & Design Response */}',
    '            {/* Scope Deliverables & Disciplinary Tags */}'
  ],
  'src/components/ui/ProjectModal.tsx': [
    '            {/* Hero Summary */}',
    '            {/* Brief & Architectural Response */}',
    '            {/* Deliverables */}'
  ],
  'src/components/ui/ScrollOverlay.tsx': [
    '      {/* SECTION 8: STUDIO PHILOSOPHY & FOOTER */}',
    '        {/* Location & Contact Card (Section 2 Implementation) */}'
  ],
  'src/components/ui/ServiceModal.tsx': [
    '            {/* Scope of Work */}',
    '            {/* Deliverables */}'
  ],
};

let totalFixed = 0;
Object.entries(filesWithComments).forEach(([file, comments]) => {
  const fullPath = 'd:/WEBUI/frontend/' + file;
  if (!fs.existsSync(fullPath)) {
    console.log('SKIP (not found): ' + file);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  const original = content;
  
  comments.forEach(comment => {
    // Remove the comment line and the newline after it
    const regex = new RegExp(comment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\n?', 'g');
    const newContent = content.replace(regex, '');
    if (newContent !== content) {
      content = newContent;
      totalFixed++;
    }
  });
  
  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    console.log('Fixed: ' + file);
  }
});
console.log('Total comment blocks removed: ' + totalFixed);