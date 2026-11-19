with open('d:/WEBUI/frontend/src/components/portal/vendor/VendorPortalShell.tsx', 'r') as f:
    content = f.read()

content = content.replace(
  '  payments: "/vendor/invoices",\n  disputes: "/vendor/cash-settlements",\n  notifications: "/vendor/notifications",\n  support: "/vendor",',
  '  payments: "/vendor/unavailable",\n  disputes: "/vendor/unavailable",\n  notifications: "/vendor/notifications",\n  support: "/vendor/unavailable",'
)

with open('d:/WEBUI/frontend/src/components/portal/vendor/VendorPortalShell.tsx', 'w') as f:
    f.write(content)
print('Done')