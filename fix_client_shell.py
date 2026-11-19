with open('d:/WEBUI/frontend/src/components/portal/client/ClientPortalShell.tsx', 'r') as f:
    content = f.read()

content = content.replace(
  '  payments: "/client/invoices",\n  disputes: "/client/invoices",\n  notifications: "/client/notifications",\n  support: "/client",',
  '  payments: "/client/unavailable",\n  disputes: "/client/unavailable",\n  notifications: "/client/notifications",\n  support: "/client/unavailable",'
)

with open('d:/WEBUI/frontend/src/components/portal/client/ClientPortalShell.tsx', 'w') as f:
    f.write(content)
print('Done')