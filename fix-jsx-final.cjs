const fs = require('fs');

// Files with jsx-no-comment-textnodes errors - exact JSX comment lines to remove
const filesWithComments = {
  'src/components/ui/ConsultationModal.tsx': [
    '                {/* Top Bar */}',
    '                {/* Studio Location & Verified Office Header */}'
  ],
  'src/components/ui/ManifestoModal.tsx': [
    '            {/* Approach Points (Verified siteConfig.about.approach) */}'
  ],
  'src/components/ui/ProjectDetailModal.tsx': [
    '                <div className=\"text-xs uppercase font-mono text-stone-400 mb-1.5 font-bold tracking-wider\">',
    '                  /// Client Need & Site Brief',
    '                </div>',
    '                <div>',
    '                  <div className=\"text-xs uppercase font-mono text-stone-400 mb-1.5 font-bold tracking-wider\">',
    '                    /// Architectural Response & Materiality',
    '                  </div>',
    '                  <p>{project.designResponse}</p>',
    '                </div>',
    '                <div className=\"mb-8 pt-4 border-t border-stone-800\">',
    '                  <div className=\"text-xs uppercase text-stone-400 mb-2.5 font-bold tracking-wider\">',
    '                    /// Scope Delivered',
    '                  </div>'
  ],
  'src/components/ui/ProjectModal.tsx': [
    '                <div className=\"font-mono text-xs uppercase tracking-wider text-[#777777] mb-1\">',
    '                  /// Site Brief',
    '                </div>',
    '                <div className=\"font-mono text-xs uppercase tracking-wider text-[#777777] mb-1\">',
    '                  /// Architectural Response',
    '                </div>',
    '                <div className=\"font-mono text-xs uppercase tracking-wider text-[#777777] mb-2.5\">',
    '                  /// Scope Delivered',
    '                </div>'
  ],
  'src/components/ui/ScrollOverlay.tsx': [
    '          <div className=\"text-xs font-mono text-amber-500 tracking-widest mb-3 uppercase\">',
    '            /// Studio Philosophy',
    '          </div>',
    '          <div className=\"pointer-events-auto my-12 p-6 sm:p-8 rounded-2xl border border-stone-800 bg-[#141210]/90 backdrop-blur-xl max-w-4xl\">',
    '            <div className=\"text-stone-400 uppercase text-[10px] tracking-wider font-bold\">',
    '              /// Principal Architect & Practice Lead',
    '            </div>'
  ],
  'src/components/ui/ServiceModal.tsx': [
    '            <div className=\"text-xs uppercase tracking-wider text-stone-400 mb-3 border-b border-stone-800/80 pb-1\">',
    '              /// Scope of Professional Services',
    '            </div>',
    '            <div className=\"text-xs uppercase tracking-wider text-stone-400 mb-3 border-b border-stone-800/80 pb-1\">',
    '              /// Typical Outputs & Deliverables',
    '            </div>'
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
  const contentLines = content.split('\n');
  
  // Sort line numbers descending to remove from bottom up
  const allLinesToRemove = [];
  comments.forEach(comment => {
    contentLines.forEach((line, idx) => {
      if (line.trim() === comment.trim()) {
        allLinesToRemove.push(idx);
      }
    });
  });
  
  // Remove duplicates and sort descending
  const uniqueLines = [...new Set(allLinesToRemove)].sort((a, b) => b - a);
  
  uniqueLines.forEach(lineIdx => {
    contentLines.splice(lineIdx, 1);
    totalFixed++;
  });
  
  fs.writeFileSync(fullPath, contentLines.join('\n'));
});
console.log('Total comment lines removed: ' + totalFixed);