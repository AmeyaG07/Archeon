import requests
import io
import json

# 1. Login Admin
admin_tok = requests.post('http://localhost:8080/api/auth/login', json={'username': 'admin', 'password': 'Password123!'}).json()['token']
h_admin = {'Authorization': f'Bearer {admin_tok}', 'Content-Type': 'application/json'}

# 2. Check or Create 3 Clients
clients_to_add = [
    {
        'fullName': 'Vikram Singhania',
        'email': 'vikram.singhania@studioarcheon.com',
        'phone': '+91 98201 12345',
        'organization': 'Singhania Estates',
        'location': 'Alibaug, Maharashtra',
        'notes': 'Client Specifications: Minimalist waterfront villa, sea-facing cantilevered decks, imported Grecian travertine, seamless smart automation, zero acoustic transfer.'
    },
    {
        'fullName': 'Ananya Deshmukh',
        'email': 'ananya.deshmukh@studioarcheon.com',
        'phone': '+91 98202 23456',
        'organization': 'Deshmukh Heritage Trust',
        'location': 'Koregaon Park, Pune',
        'notes': 'Client Specifications: Heritage courtyard revitalization, exposed basalt masonry, native botanical landscape, natural passive cooling wind-tunnels.'
    },
    {
        'fullName': 'Rohit Malhotra',
        'email': 'rohit.malhotra@studioarcheon.com',
        'phone': '+91 98203 34567',
        'organization': 'Malhotra Tech Ventures',
        'location': 'Civil Lines, Nagpur',
        'notes': 'Client Specifications: Parametric penthouse interior, double-height glazing, dark smoked oak millwork, dedicated screening room with THX acoustic standards.'
    }
]

existing_clients = requests.get('http://localhost:8080/api/clients', headers=h_admin).json()
existing_names = {c.get('fullName') for c in existing_clients if c.get('fullName')}

for c in clients_to_add:
    if c['fullName'] not in existing_names:
        r = requests.post('http://localhost:8080/api/clients', headers=h_admin, json=c)
        print('Created Client:', c['fullName'], r.status_code)

all_clients = requests.get('http://localhost:8080/api/clients', headers=h_admin).json()
c_map = {c['fullName']: c['id'] for c in all_clients if c.get('fullName')}

studio_client_id = None
for c in all_clients:
    if c.get('clientReference') == 'CLI-DEMO-01' or c.get('fullName') == 'Studio Client':
        studio_client_id = c['id']
        break

print('Studio Client ID:', studio_client_id)

# 3. Create Operational Projects
projects = [
    {
        'name': 'The Monolith Sanctuary - Execution Phase',
        'clientId': studio_client_id,
        'projectType': 'RESIDENTIAL_ARCHITECTURE',
        'siteAddress': 'Plot 14, Khandala Hills, Maharashtra',
        'contractValue': 18500000.0,
        'budgetAllocated': 16000000.0,
        'startDate': '2026-01-15',
        'expectedCompletionDate': '2027-01-15',
        'lastVisitDate': '2026-11-20',
        'notes': 'Monolithic basalt stone residence with cantilevered travertine terraces and reflection pools.'
    },
    {
        'name': 'Zephyr Sky Penthouse',
        'clientId': c_map.get('Vikram Singhania'),
        'projectType': 'COMMERCIAL_INTERIOR',
        'siteAddress': 'Alibaug Waterfront, Maharashtra',
        'contractValue': 12500000.0,
        'budgetAllocated': 11000000.0,
        'startDate': '2026-01-01',
        'expectedCompletionDate': '2027-01-01',
        'lastVisitDate': '2026-11-21',
        'notes': 'Luxury waterfront penthouse with structural glass, Italian marble and custom millwork.'
    },
    {
        'name': 'Basalt Courtyard Pavilion',
        'clientId': c_map.get('Ananya Deshmukh'),
        'projectType': 'LANDSCAPE_DESIGN',
        'siteAddress': 'Koregaon Park, Pune',
        'contractValue': 4800000.0,
        'budgetAllocated': 4200000.0,
        'startDate': '2026-02-10',
        'expectedCompletionDate': '2026-08-10',
        'lastVisitDate': '2026-11-15',
        'notes': 'Heritage stone courtyard restoration with central water body and native flora.'
    },
    {
        'name': 'Obsidian Cliffside Villa',
        'clientId': c_map.get('Rohit Malhotra'),
        'projectType': 'RESIDENTIAL_ARCHITECTURE',
        'siteAddress': 'Plot 42, Civil Lines, Nagpur',
        'contractValue': 8500000.0,
        'budgetAllocated': 7200000.0,
        'startDate': '2026-03-01',
        'expectedCompletionDate': '2026-09-01',
        'lastVisitDate': '2026-11-18',
        'notes': 'Parametric travertine residence, cantilevered steel terrace pavilion.'
    }
]

created_projects = []
for p in projects:
    if p['clientId']:
        r = requests.post('http://localhost:8080/api/operational-projects', headers=h_admin, json=p)
        if r.status_code == 201:
            created_projects.append(r.json())
            print('Created Operational Project:', p['name'])

# 4. Assign Trade Partner Vendor
vendors = requests.get('http://localhost:8080/api/vendors', headers=h_admin).json()
vendor_id = vendors[0]['id'] if vendors else None
print('Vendor ID:', vendor_id)

for prj in created_projects:
    pid = prj['id']
    va_payload = {
        'vendorId': vendor_id,
        'scopeOfWork': 'Architectural Woodwork, Teak Joinery & Custom Paneling',
        'contractAmount': 1850000.0,
        'notes': 'High-precision teak framing as per Studio drawing package AR-WD-101. Send updates on WhatsApp.'
    }
    r = requests.post(f'http://localhost:8080/api/operational-projects/{pid}/vendors', headers=h_admin, json=va_payload)
    print(f'Assigned Vendor to {prj["name"]}: {r.status_code}')

# 5. Upload Documents for Studio Client
monolith_prj_id = created_projects[0]['id'] if created_projects else None
if studio_client_id and monolith_prj_id:
    h_doc = {'Authorization': f'Bearer {admin_tok}'}
    docs = [
        ('AR-01 Main Floor Plan & Spatial Layout', 'BLUEPRINT_DRAWING', 'Approved architectural floor layout.', 'AR-01-FloorPlan.pdf', b'%PDF-1.4\n1 0 obj\n<< /Title (Floor Plan) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'),
        ('Visual Elevation & Light Well 3D Render', 'SITE_PHOTO', 'High-resolution dusk render.', 'Render-Elevation-Dusk.png', b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'),
        ('Master Architectural & Joinery Agreement', 'CONTRACT', 'Fully signed turnkey execution agreement.', 'Studio-Agreement-Signed.pdf', b'%PDF-1.4\n1 0 obj\n<< /Title (Studio Agreement) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF'),
        ('Client Architectural Specifications Document', 'SPECIFICATION', 'Full architectural and material schedule specifications.', 'Architectural-Specs.pdf', b'%PDF-1.4\n1 0 obj\n<< /Title (Specs) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF')
    ]
    for title, cat, desc, fn, content in docs:
        files = {'file': (fn, io.BytesIO(content), 'application/pdf' if fn.endswith('.pdf') else 'image/png')}
        data = {'title': title, 'category': cat, 'description': desc, 'securityClassification': 'PUBLIC_CLIENT', 'clientId': studio_client_id, 'projectId': monolith_prj_id}
        r = requests.post('http://localhost:8080/api/documents/upload', headers=h_doc, data=data, files=files)
        print('Uploaded Doc:', title, r.status_code)

print('ALL DEMO SEEDING COMPLETE!')
