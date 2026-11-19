with open('d:/WEBUI/frontend/src/components/portal/admin/AdminPortalShell.tsx', 'r') as f:
    content = f.read()

# Admin routes: only dashboard should work, everything else points to unavailable
# Since /admin is now restricted, these routes won't be publicly accessible anyway
content = content.replace(
  '  projects: "/admin",\n  leads: "/admin",\n  clients: "/admin",\n  vendors: "/admin",\n  invoices: "/admin",\n  approvals: "/admin",\n  "cash-settlements": "/admin",\n  "finance-reports": "/admin",\n  "audit-logs": "/admin",\n  settings: "/admin",',
  '  projects: "/admin/unavailable",\n  leads: "/admin/unavailable",\n  clients: "/admin/unavailable",\n  vendors: "/admin/unavailable",\n  invoices: "/admin/unavailable",\n  approvals: "/admin/unavailable",\n  "cash-settlements": "/admin/unavailable",\n  "finance-reports": "/admin/unavailable",\n  "audit-logs": "/admin/unavailable",\n  settings: "/admin/unavailable",'
)

with open('d:/WEBUI/frontend/src/components/portal/admin/AdminPortalShell.tsx', 'w') as f:
    f.write(content)
print('Done')