const fs = require('fs');
const path = require('path');

const files = [
  'src/components/forms/PortalAccessForm.tsx',
  'src/components/home/ConsultationCTASection.tsx',
  'src/components/home/ContactSection.tsx',
  'src/components/home/ServiceDetailView.tsx',
  'src/components/portal/admin/AdminCashSettlementManagement.tsx',
  'src/components/portal/admin/AdminClientManagement.tsx',
  'src/components/portal/admin/AdminConsentNotificationPreferenceCenter.tsx',
  'src/components/portal/admin/AdminDataExportGovernanceCenter.tsx',
  'src/components/portal/admin/AdminNotificationChannelConfigurationCenter.tsx',
  'src/components/portal/admin/AdminNotificationSuppressionRulesCenter.tsx',
  'src/components/portal/admin/AdminSessionManagementCenter.tsx',
  'src/components/portal/admin/AdminSystemSettings.tsx',
  'src/components/portal/admin/AdminUserRoleManagement.tsx',
  'src/components/portal/admin/AdminVendorManagement.tsx',
  'src/components/portal/client/ClientDisputeTracking.tsx',
  'src/components/portal/client/ClientInvoiceDisputeForm.tsx',
  'src/components/portal/client/ClientInvoiceOverview.tsx',
  'src/components/portal/vendor/VendorDisputeTracking.tsx',
  'src/components/portal/vendor/VendorInvoiceHistory.tsx',
  'src/components/portal/vendor/VendorInvoiceSubmissionForm.tsx',
  'src/components/portal/vendor/VendorPaymentHistory.tsx',
  'src/components/portal/vendor/VendorProfileSettings.tsx',
  'src/components/portal/vendor/VendorSupportCentre.tsx',
];

const entityReplacements = {
  '&ldquo;': '\u201C',  // “
  '&rdquo;': '\u201D',  // ”
  '&lsquo;': '\u2018',  // ‘
  '&rsquo;': '\u2019',  // ’
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&nbsp;': '\u00A0',
};

let totalFixed = 0;
files.forEach(file => {
  const fullPath = 'd:/WEBUI/frontend/' + file;
  if (!fs.existsSync(fullPath)) {
    console.log('SKIP (not found): ' + file);
    return;
  }
  let content = fs.readFileSync(fullPath, 'utf8');
  let original = content;
  Object.entries(entityReplacements).forEach(([entity, char]) => {
    const regex = new RegExp(entity.replace(/[&]/g, '&amp;').replace(/[;]/g, '&semi;'), 'g');
    // Simple string replace for known entities
    content = content.split(entity).join(char);
  });
  if (content !== original) {
    fs.writeFileSync(fullPath, content);
    totalFixed++;
    console.log('Fixed: ' + file);
  }
});
console.log('Total files fixed: ' + totalFixed);