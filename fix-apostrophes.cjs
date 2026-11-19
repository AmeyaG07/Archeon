const fs = require('fs');
const path = require('path');

// Files with no-unescaped-entities errors (apostrophe in JSX text content)
const filesWithErrors = {
  'src/components/forms/PortalAccessForm.tsx': [145],
  'src/components/home/ConsultationCTASection.tsx': [37],
  'src/components/home/ContactSection.tsx': [35],
  'src/components/home/ServiceDetailView.tsx': [144],
  'src/components/portal/admin/AdminCashSettlementManagement.tsx': [488, 809],
  'src/components/portal/admin/AdminClientManagement.tsx': [673],
  'src/components/portal/admin/AdminConsentNotificationPreferenceCenter.tsx': [260, 474],
  'src/components/portal/admin/AdminDataExportGovernanceCenter.tsx': [637],
  'src/components/portal/admin/AdminNotificationChannelConfigurationCenter.tsx': [493],
  'src/components/portal/admin/AdminNotificationSuppressionRulesCenter.tsx': [493],
  'src/components/portal/admin/AdminSessionManagementCenter.tsx': [531],
  'src/components/portal/admin/AdminSystemSettings.tsx': [1253],
  'src/components/portal/admin/AdminUserRoleManagement.tsx': [428],
  'src/components/portal/admin/AdminVendorManagement.tsx': [686],
  'src/components/portal/client/ClientDisputeTracking.tsx': [162, 199],
  'src/components/portal/client/ClientInvoiceDisputeForm.tsx': [378],
  'src/components/portal/client/ClientInvoiceOverview.tsx': [206],
  'src/components/portal/vendor/VendorDisputeTracking.tsx': [382],
  'src/components/portal/vendor/VendorInvoiceHistory.tsx': [383],
  'src/components/portal/vendor/VendorInvoiceSubmissionForm.tsx': [692],
  'src/components/portal/vendor/VendorPaymentHistory.tsx': [203],
  'src/components/portal/vendor/VendorProfileSettings.tsx': [399],
};

let totalFixed = 0;
Object.entries(filesWithErrors).forEach(([file, lines]) => {
  const fullPath = 'd:/WEBUI/frontend/' + file;
  if (!fs.existsSync(fullPath)) {
    console.log('SKIP (not found): ' + file);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const contentLines = content.split('\n');
  let modified = false;
  
  lines.forEach(lineNum => {
    const idx = lineNum - 1;
    if (idx < 0 || idx >= contentLines.length) return;
    const line = contentLines[idx];
    // Replace ' with &apos; in JSX text content (between > and <, not inside attribute values)
    // Simple approach: replace standalone apostrophes in words like "studio's", "Let's"
    const newLine = line.replace(/(\w)'(\w)/g, '$1&apos;$2');
    if (newLine !== line) {
      contentLines[idx] = newLine;
      modified = true;
      console.log('Fixed ' + file + ' line ' + lineNum + ': ' + line.trim().substring(0, 60) + '...');
    }
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, contentLines.join('\n'));
    totalFixed++;
  }
});
console.log('Total files fixed: ' + totalFixed);