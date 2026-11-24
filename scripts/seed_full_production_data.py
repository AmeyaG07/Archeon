import json
import urllib.request
import urllib.error
import io
import time

BASE_URL = "http://localhost:8080"

def request(method, path, data=None, token=None, files=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    if files:
        # Simple multipart form builder
        boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
        headers["Content-Type"] = f"multipart/form-data; boundary={boundary}"
        body = bytearray()
        for k, v in (data or {}).items():
            body.extend(f"--{boundary}\r\n".encode())
            body.extend(f'Content-Disposition: form-data; name="{k}"\r\n\r\n'.encode())
            body.extend(f"{v}\r\n".encode())
        for field_name, (filename, file_bytes, content_type) in files.items():
            body.extend(f"--{boundary}\r\n".encode())
            body.extend(f'Content-Disposition: form-data; name="{field_name}"; filename="{filename}"\r\n'.encode())
            body.extend(f"Content-Type: {content_type}\r\n\r\n".encode())
            body.extend(file_bytes)
            body.extend(b"\r\n")
        body.extend(f"--{boundary}--\r\n".encode())
        req = urllib.request.Request(url, data=bytes(body), headers=headers, method=method)
    else:
        headers["Content-Type"] = "application/json"
        body = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return {"status_code": e.code, "error": json.loads(err_body)}
        except:
            return {"status_code": e.code, "error": err_body}
    except Exception as e:
        return {"error": str(e)}

def login(username, password):
    res = request("POST", "/api/auth/login", {"username": username, "password": password})
    if "token" in res:
        return res["token"]
    if "accessToken" in res:
        return res["accessToken"]
    print(f"Failed to login as {username}: {res}")
    return None

def main():
    print("=================================================================")
    print("ARCHEON DESIGN STUDIO - COMPREHENSIVE PRODUCTION DATABASE SEEDER")
    print("=================================================================")

    # 0. Authenticate
    admin_token = login("admin", "Password123!")
    if not admin_token:
        print("CRITICAL: Failed to login as admin. Ensure backend is running.")
        return
    print("[AUTH] Admin authenticated successfully.")

    client_token = login("client_user", "Password123!")
    vendor_token = login("vendor_user", "Password123!")
    print(f"[AUTH] Client User token: {'OK' if client_token else 'Pending'}")
    print(f"[AUTH] Vendor User token: {'OK' if vendor_token else 'Pending'}")

    # 1. SEED CLIENTS
    print("\n--- 1. Seeding Client Organizations ---")
    clients_data = [
        {
            "clientReference": "CLI-2026-101",
            "fullName": "Vikram Singhania",
            "email": "vikram.singhania@heritagehomes.in",
            "phone": "+91 98201 11223",
            "organization": "Singhania Heritage Living",
            "location": "South Mumbai, Maharashtra",
            "notes": "Prefers Italian Travertine, Scandinavian minimalism, bespoke climate automation, zero acoustic transfer."
        },
        {
            "clientReference": "CLI-2026-102",
            "fullName": "Dr. Ananya Deshmukh",
            "email": "ananya.deshmukh@agroretreat.org",
            "phone": "+91 98202 22334",
            "organization": "Deshmukh Agro Retreats",
            "location": "Alibaug, Maharashtra",
            "notes": "Requires biophilic basalt courtyards, subterranean rainwater storage and courtyard native flora."
        },
        {
            "clientReference": "CLI-2026-103",
            "fullName": "Kabir Mehra",
            "email": "kabir.mehra@mehraholdings.com",
            "phone": "+91 98203 33445",
            "organization": "Mehra Creative Penthouse",
            "location": "Bandra West, Mumbai",
            "notes": "Curated bronze metal accents, monolithic fluted timber, acoustic recording room."
        },
        {
            "clientReference": "CLI-2026-104",
            "fullName": "Rohit & Sunita Malhotra",
            "email": "rohit.malhotra@malhotravillas.in",
            "phone": "+91 98204 44556",
            "organization": "Malhotra Villa Oasis",
            "location": "Khandala Hills, Maharashtra",
            "notes": "Open cantilever living pavilion, infinity reflection pool, natural basalt masonry."
        },
        {
            "clientReference": "CLI-2026-105",
            "fullName": "Priya & Siddharth Kapoor",
            "email": "priya.kapoor@kapoorestates.com",
            "phone": "+91 98205 55667",
            "organization": "Kapoor Estate Residences",
            "location": "Koregaon Park, Pune",
            "notes": "Turnkey luxury estate, automated circadian lighting, solar envelope, zen courtyard."
        },
        {
            "clientReference": "CLI-2026-106",
            "fullName": "Devang Kothari",
            "email": "devang.kothari@kotharigroup.com",
            "phone": "+91 98330 12345",
            "organization": "Kothari Infra Living",
            "location": "Lonavala, Maharashtra",
            "notes": "Cliffside residential villa, post-tensioned cantilever roof, floor-to-ceiling glass envelopes."
        }
    ]

    client_id_map = {}
    for c in clients_data:
        res = request("POST", "/api/clients", c, token=admin_token)
        cid = res.get("id")
        if cid:
            client_id_map[c["fullName"]] = cid
            print(f"  [+] Client: {c['fullName']} -> ID: {cid}")
        else:
            print(f"  [!] Note: {c['fullName']}: {res}")

    # Fetch all clients to map
    all_clients = request("GET", "/api/clients", token=admin_token)
    if isinstance(all_clients, list):
        for c in all_clients:
            client_id_map[c.get("fullName")] = c.get("id")
            if c.get("clientReference") == "CLI-DEMO-01" or c.get("fullName") == "Studio Client":
                client_id_map["Studio Client"] = c.get("id")

    # 2. SEED VENDORS
    print("\n--- 2. Seeding Trade Partners & Material Vendors ---")
    vendors_data = [
        {
            "vendorReference": "VEN-2026-01",
            "businessName": "Deccan Stonecraft & Basalt Works",
            "contactPerson": "Rameshwar Patil",
            "email": "rameshwar@deccanstonecraft.in",
            "phone": "+91 98221 44556",
            "category": "MASONRY",
            "location": "Chakan Industrial Zone, Pune",
            "notes": "Quarry owner & master fabricator of basalt blocks, monolithic steps and dry-cladded travertine."
        },
        {
            "vendorReference": "VEN-2026-02",
            "businessName": "Bespoke Teak & Architectural Joinery",
            "contactPerson": "Gurpreet Singh",
            "email": "gurpreet@bespoketeak.com",
            "phone": "+91 98190 77889",
            "category": "CARPENTRY",
            "location": "Reay Road Timber Market, Mumbai",
            "notes": "FSC-certified Burmese teak, concealed pivot doors, acoustic wall paneling, Italian water-based polyurethane."
        },
        {
            "vendorReference": "VEN-2026-03",
            "businessName": "Apex Climate & Precision MEP Systems",
            "contactPerson": "Murtaza Contractor",
            "email": "murtaza@apexclimate.co.in",
            "phone": "+91 98205 99001",
            "category": "HVAC",
            "location": "MIDC Andheri East, Mumbai",
            "notes": "VRV air conditioning, automated heat-pump domestic hot water, manifold plumbing systems."
        },
        {
            "vendorReference": "VEN-2026-04",
            "businessName": "Vanguard Structural Steel & Cantilevers",
            "contactPerson": "Ashok Singhania",
            "email": "ashok@vanguardsteel.com",
            "phone": "+91 98206 11223",
            "category": "FABRICATION",
            "location": "Taloja MIDC, Navi Mumbai",
            "notes": "CNC-cut architectural beams, moment-resisting connections, post-tensioned steel stays."
        },
        {
            "vendorReference": "VEN-2026-05",
            "businessName": "Lumina Architectural Glazing & Facades",
            "contactPerson": "Nikhil Varma",
            "email": "nikhil@luminaglazing.com",
            "phone": "+91 98207 33445",
            "category": "CIVIL_WORK",
            "location": "Wagle Estate, Thane",
            "notes": "Double-glazed low-E argon units, minimal-profile sliding frames, frameless structural balustrades."
        },
        {
            "vendorReference": "VEN-2026-06",
            "businessName": "Botanica Zen Landscapes & Waterbodies",
            "contactPerson": "Kavita Nair",
            "email": "kavita@botanicazen.in",
            "phone": "+91 98208 55667",
            "category": "OTHER",
            "location": "Aundh, Pune",
            "notes": "Native basalt reflection pools, drought-tolerant endemic flora, biological filtration cascades."
        }
    ]

    vendor_id_map = {}
    for v in vendors_data:
        res = request("POST", "/api/vendors", v, token=admin_token)
        vid = res.get("id")
        if vid:
            vendor_id_map[v["businessName"]] = vid
            print(f"  [+] Vendor: {v['businessName']} -> ID: {vid}")
        else:
            print(f"  [!] Note: {v['businessName']}: {res}")

    all_vendors = request("GET", "/api/vendors", token=admin_token)
    if isinstance(all_vendors, list):
        for v in all_vendors:
            vendor_id_map[v.get("businessName")] = v.get("id")

    # 3. SEED VENDOR PAYMENT METHODS (Bank details, UPI, QR Code)
    print("\n--- 3. Seeding Vendor Payment Methods & Banking Config ---")
    banks = [
        ("HDFC Bank", "HDFC0000123", "9820112345@hdfcbank"),
        ("ICICI Bank", "ICIC0000456", "bespoketeak@icici"),
        ("Kotak Mahindra Bank", "KKBK0000789", "apexclimate@kotak"),
        ("State Bank of India", "SBIN0001011", "vanguardsteel@sbi"),
        ("Axis Bank", "UTIB0001213", "luminaglaze@axis"),
        ("Bank of Baroda", "BARB0AUNDHX", "botanica@barodampay")
    ]
    idx = 0
    for vname, vid in vendor_id_map.items():
        bank_name, ifsc, upi_id = banks[idx % len(banks)]
        idx += 1
        pm_payload = {
            "vendorId": vid,
            "accountHolderName": vname,
            "bankName": bank_name,
            "accountNumber": f"5010023489{idx:02d}",
            "ifscCode": ifsc,
            "upiId": upi_id,
            "qrCodeData": f"upi://pay?pa={upi_id}&pn={urllib.parse.quote(vname)}&mc=1234&cu=INR",
            "isDefault": True,
            "status": "VERIFIED"
        }
        pm_res = request("POST", f"/api/vendor-payment-methods/vendor/{vid}", pm_payload, token=admin_token)
        print(f"  [+] Payment details configured for {vname} ({bank_name} / {upi_id})")

    # 4. SEED OPERATIONAL PROJECTS
    print("\n--- 4. Seeding Operational Site Projects ---")
    default_client_id = list(client_id_map.values())[0] if client_id_map else None

    projects_data = [
        {
            "name": "The Monolith Sanctuary (Execution Phase)",
            "clientId": client_id_map.get("Vikram Singhania") or default_client_id,
            "projectType": "RESIDENTIAL_ARCHITECTURE",
            "siteAddress": "Plot 14, Khandala Hills, Maharashtra",
            "contractValue": 18500000.0,
            "budgetAllocated": 16000000.0,
            "startDate": "2026-01-15",
            "expectedCompletionDate": "2027-01-15",
            "lastVisitDate": "2026-11-20",
            "notes": "Subterranean cliffside retreat sculpted into basalt rock, featuring central travertine light-wells and reflection pools in Khandala."
        },
        {
            "name": "Zephyr Sky Penthouse",
            "clientId": client_id_map.get("Kabir Mehra") or default_client_id,
            "projectType": "COMMERCIAL_INTERIOR",
            "siteAddress": "Level 48, Worli Sea Face, Mumbai",
            "contractValue": 12500000.0,
            "budgetAllocated": 11000000.0,
            "startDate": "2026-02-01",
            "expectedCompletionDate": "2026-12-01",
            "lastVisitDate": "2026-11-21",
            "notes": "Parametric penthouse interior, double-height acoustic glazing, dark smoked oak millwork and fluted bronze accents."
        },
        {
            "name": "Basalt Courtyard Pavilion",
            "clientId": client_id_map.get("Dr. Ananya Deshmukh") or default_client_id,
            "projectType": "LANDSCAPE_DESIGN",
            "siteAddress": "Survey 88, Koregaon Park, Pune",
            "contractValue": 4800000.0,
            "budgetAllocated": 4200000.0,
            "startDate": "2026-02-10",
            "expectedCompletionDate": "2026-08-10",
            "lastVisitDate": "2026-11-15",
            "notes": "Heritage stone courtyard restoration with central water body, endemic botanical landscaping and natural passive cooling."
        },
        {
            "name": "Obsidian Cliffside Villa",
            "clientId": client_id_map.get("Rohit & Sunita Malhotra") or default_client_id,
            "projectType": "RESIDENTIAL_ARCHITECTURE",
            "siteAddress": "Plot 42, Civil Lines, Nagpur",
            "contractValue": 8500000.0,
            "budgetAllocated": 7200000.0,
            "startDate": "2026-03-01",
            "expectedCompletionDate": "2026-09-01",
            "lastVisitDate": "2026-11-18",
            "notes": "Monolithic dark stone villa, cantilevered steel terrace pavilion overlooking urban forest."
        },
        {
            "name": "The Glass & Bronze Studio HQ",
            "clientId": client_id_map.get("Priya & Siddharth Kapoor") or default_client_id,
            "projectType": "HOSPITALITY_DEVELOPMENT",
            "siteAddress": "G-Block, Bandra Kurla Complex (BKC), Mumbai",
            "contractValue": 22000000.0,
            "budgetAllocated": 19500000.0,
            "startDate": "2026-01-05",
            "expectedCompletionDate": "2027-04-05",
            "lastVisitDate": "2026-11-22",
            "notes": "Flagship multi-story studio headquarters with bronze screen facade, post-tensioned floor plates and atrium light shafts."
        },
        {
            "name": "Aurum Horizon Waterfront Villa",
            "clientId": client_id_map.get("Devang Kothari") or default_client_id,
            "projectType": "TURNKEY_EXECUTION",
            "siteAddress": "Kolegaon Point, Alibaug Coast, Maharashtra",
            "contractValue": 31000000.0,
            "budgetAllocated": 27500000.0,
            "startDate": "2026-02-15",
            "expectedCompletionDate": "2027-08-15",
            "lastVisitDate": "2026-11-19",
            "notes": "Turnkey luxury estate featuring sea-facing cantilevered decks, imported travertine stone cladding, and infinity reflection cascade."
        }
    ]

    project_id_map = {}
    for p in projects_data:
        res = request("POST", "/api/operational-projects", p, token=admin_token)
        pid = res.get("id")
        if pid:
            project_id_map[p["name"]] = pid
            print(f"  [+] Project: {p['name']} -> ID: {pid}")
        else:
            print(f"  [!] Note: {p['name']}: {res}")

    all_op_projects = request("GET", "/api/operational-projects", token=admin_token)
    if isinstance(all_op_projects, list):
        for prj in all_op_projects:
            project_id_map[prj.get("name")] = prj.get("id")

    # 5. ASSIGN VENDORS TO PROJECTS
    print("\n--- 5. Assigning Trade Vendors to Operational Projects ---")
    vendor_ids = list(vendor_id_map.values())
    for pname, pid in project_id_map.items():
        for vid in vendor_ids[:3]: # assign top 3 vendors
            v_payload = {
                "vendorId": vid,
                "scopeOfWork": "Turnkey Architectural Trade Execution Package as per Studio Drawings AR-101 to AR-108",
                "contractAmount": 1450000.0,
                "notes": "All materials must be dry-laid and approved by Ar. Mandar before installation."
            }
            request("POST", f"/api/operational-projects/{pid}/vendors", v_payload, token=admin_token)
        print(f"  [+] Assigned 3 Trade Vendors to: {pname}")

    # 6. SEED SITE UPDATES & ARCHITECT INSPECTION LOGS
    print("\n--- 6. Seeding Site Visits & Architect Inspection Logs ---")
    primary_project_id = list(project_id_map.values())[0] if project_id_map else None
    if primary_project_id:
        site_updates_data = [
            {
                "projectId": primary_project_id,
                "visitDate": "2026-11-20",
                "weatherCondition": "Clear Sky / 26°C",
                "gpsCoordinates": "18.7562° N, 73.3742° E",
                "structuralNotes": "Inspected Milestone 2 cantilever slab concrete curing. 14-day compressive test report confirms 38 MPa. Basalt retention wall anchor bolts torque tested.",
                "actionItems": "Proceed with travertine cladding dry-lay on southern light-well wall.",
                "conductedBy": "Ar. Mandar Bhalekar"
            },
            {
                "projectId": primary_project_id,
                "visitDate": "2026-11-12",
                "weatherCondition": "Partly Cloudy / 28°C",
                "gpsCoordinates": "18.7562° N, 73.3742° E",
                "structuralNotes": "Foundation inspection of central light well and reflection pool waterproofing membrane. Zero hydrostatic leakage detected.",
                "actionItems": "Cast protective screed over waterproof layer prior to stonework.",
                "conductedBy": "Ar. Mandar Bhalekar"
            }
        ]
        for su in site_updates_data:
            res = request("POST", "/api/site-updates", su, token=admin_token)
            print(f"  [+] Site visit log recorded: {su['visitDate']} ({su['conductedBy']})")

    # 7. UPLOAD ARCHITECTURAL BLUEPRINTS & DMS DOCUMENTS
    print("\n--- 7. Uploading Blueprints, 3D Renders & Agreements to DMS ---")
    if primary_project_id and default_client_id:
        docs = [
            ("AR-01 Main Floor Plan & Spatial Layout", "BLUEPRINT_DRAWING", "Approved architectural floor layout.", "AR-01-FloorPlan.pdf", b"%PDF-1.4\n1 0 obj\n<< /Title (Floor Plan) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"),
            ("Visual Elevation & Light Well 3D Dusk Render", "SITE_PHOTO", "High-resolution dusk render.", "Render-Elevation-Dusk.png", b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"),
            ("Master Architectural & Joinery Turnkey Agreement", "CONTRACT", "Fully signed turnkey execution agreement.", "Studio-Agreement-Signed.pdf", b"%PDF-1.4\n1 0 obj\n<< /Title (Studio Agreement) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"),
            ("Structural Basalt & Travertine Specification Schedule", "SPECIFICATION", "Full architectural and material schedule specifications.", "Architectural-Specs.pdf", b"%PDF-1.4\n1 0 obj\n<< /Title (Specs) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF")
        ]
        for title, cat, desc, fn, content in docs:
            files = {"file": (fn, content, "application/pdf" if fn.endswith(".pdf") else "image/png")}
            form_fields = {
                "title": title,
                "category": cat,
                "description": desc,
                "securityClassification": "PUBLIC_CLIENT",
                "clientId": default_client_id,
                "projectId": primary_project_id
            }
            res = request("POST", "/api/documents/upload", data=form_fields, files=files, token=admin_token)
            print(f"  [+] Document uploaded: {title} ({cat})")

    # 8. SEED BILLS, INVOICES & CASH SETTLEMENTS
    print("\n--- 8. Seeding Trade Bills, Invoices & Cash Settlements ---")
    first_vendor_id = list(vendor_id_map.values())[0] if vendor_id_map else None

    # Vendor Bills
    bills_data = [
        {
            "billReference": "BILL-2026-DSC-01",
            "vendorId": first_vendor_id,
            "projectId": primary_project_id,
            "category": "STONEWORK",
            "title": "Milestone 1 Basalt Foundation Pour & Retention Cladding",
            "amount": 850000.0,
            "taxAmount": 153000.0,
            "totalAmount": 1003000.0,
            "status": "APPROVED",
            "paymentMode": "ONLINE_TRANSFER",
            "utrReference": "HDFCN261120489123",
            "description": "Basalt extraction, dressing, diamond saw-cut finishing and foundation perimeter placement."
        },
        {
            "billReference": "BILL-2026-TEAK-02",
            "vendorId": list(vendor_id_map.values())[1] if len(vendor_id_map) > 1 else first_vendor_id,
            "projectId": primary_project_id,
            "category": "WOODWORK",
            "title": "Burmese Teak Framing & Concealed Pivot Frames",
            "amount": 425000.0,
            "taxAmount": 76500.0,
            "totalAmount": 501500.0,
            "status": "APPROVED",
            "paymentMode": "CASH_SETTLEMENT",
            "voucherReference": "CSH-SETTLE-501",
            "description": "First consignment of moisture-stabilized seasoned teak for master living suite."
        },
        {
            "billReference": "BILL-2026-MEP-03",
            "vendorId": list(vendor_id_map.values())[2] if len(vendor_id_map) > 2 else first_vendor_id,
            "projectId": primary_project_id,
            "category": "MEP_HVAC",
            "title": "First-Fix VRV Refrigerant Piping & Drainage Loops",
            "amount": 310000.0,
            "taxAmount": 55800.0,
            "totalAmount": 365800.0,
            "status": "SUBMITTED",
            "paymentMode": "ONLINE_TRANSFER",
            "description": "Pressure-tested copper piping networks embedded in subterranean concrete slabs."
        },
        {
            "billReference": "BILL-2026-STEEL-04",
            "vendorId": list(vendor_id_map.values())[3] if len(vendor_id_map) > 3 else first_vendor_id,
            "projectId": primary_project_id,
            "category": "STRUCTURAL_STEEL",
            "title": "Cantilever Terrace Girder & Post-Tensioned Anchor Bolts",
            "amount": 680000.0,
            "taxAmount": 122400.0,
            "totalAmount": 802400.0,
            "status": "SUBMITTED",
            "paymentMode": "ONLINE_TRANSFER",
            "description": "Fabrication and ultrasonic flaw testing of 6.5m cantilever terrace steel sections."
        }
    ]

    for b in bills_data:
        res = request("POST", "/api/billing/bills", b, token=admin_token)
        print(f"  [+] Trade Bill: {b['billReference']} ({b['title']}) - ₹{b['totalAmount']:,.2f}")

    # Cash Settlement Requests
    cash_req = {
        "voucherNumber": "CSH-SETTLE-501",
        "projectId": primary_project_id,
        "vendorId": first_vendor_id,
        "amount": 85000.0,
        "purpose": "Emergency on-site labor overtime and hydraulic rock-breaker diesel supply for basement excavation",
        "settledBy": "Ar. Mandar Bhalekar",
        "notes": "Verified against physical fuel receipts and labour muster rolls. Approved under studio petty cash threshold."
    }
    cs_res = request("POST", "/api/finance/cash/settlements", cash_req, token=admin_token)
    print(f"  [+] Cash Settlement Request: {cash_req['voucherNumber']} - ₹{cash_req['amount']:,.2f}")
    request("POST", f"/api/finance/cash/CSH-SETTLE-501/approve", {}, token=admin_token)
    print(f"  [+] Cash Settlement {cash_req['voucherNumber']} Approved.")

    # 9. SEED SUPPORT & DISPUTE TICKETS
    print("\n--- 9. Seeding Support & Dispute Tickets ---")
    tickets_data = [
        {
            "subject": "Travertine Finish & Vein Matching Sample Review",
            "category": "Material Selection",
            "priority": "High",
            "relatedReference": "The Monolith Sanctuary / Living Pavilion",
            "description": "We would like to inspect the dry-lay travertine slab samples before the mason commences the living pavilion cladding next Tuesday.",
            "reply": "Dear Client, 3 slab samples have been placed in the studio gallery. Ar. Mandar will review them with you on Monday at 3:00 PM."
        },
        {
            "subject": "Bespoke Teakwood Wardrobe Hardware Delivery Schedule",
            "category": "Project Assignment",
            "priority": "Normal",
            "relatedReference": "The Travertine Penthouse / Master Suite",
            "description": "Requesting confirmation on whether the concealed soft-close pivot hinges from Hettich will be dispatched to the site this week.",
            "reply": "Hardware consignment has arrived at our central warehouse and will be dispatched to Worli site tomorrow morning."
        },
        {
            "subject": "Invoice STEL-2026-B901 Verification Status",
            "category": "Invoicing & Billing",
            "priority": "Normal",
            "relatedReference": "BILL-2026-DSC-01",
            "description": "Checking whether Milestone 1 basalt bill has cleared the secondary finance check.",
            "reply": "Primary approval complete. Final finance checker approval scheduled for today's payment batch."
        },
        {
            "subject": "Cantilever Roof Drainage Incline Inspection",
            "category": "Technical Drawing",
            "priority": "Urgent",
            "relatedReference": "Drawing AR-WD-204",
            "description": "Need immediate clarification on 1:60 slope transition around the concealed rainwater harvesting downpipe box.",
            "reply": "Revised section drawing AR-WD-204-REV2 uploaded to the document portal with localized detail section."
        }
    ]

    for t in tickets_data:
        reply_text = t.pop("reply")
        res = request("POST", "/api/support/tickets", t, token=admin_token)
        tid = res.get("id")
        ref = res.get("referenceCode", tid)
        if tid:
            print(f"  [+] Support Ticket: {ref} - {t['subject']}")
            request("POST", f"/api/support/tickets/{tid}/reply", {"message": reply_text}, token=admin_token)

    # 10. SEED CONSULTATION LEADS
    print("\n--- 10. Seeding Incoming Consultation Leads ---")
    leads_data = [
        {
            "clientName": "Devang Kothari",
            "phone": "+91 98330 12345",
            "email": "devang.kothari@kotharigroup.com",
            "serviceDiscipline": "ARCHITECTURE",
            "location": "Lonavala, Maharashtra",
            "budgetBand": "₹5 - ₹10 Crores",
            "estimatedTimeline": "12-18 Months",
            "projectBrief": "Seeking turnkey cliffside villa design with infinity pool overlooking Pawna Lake.",
            "whatsappOptIn": True
        },
        {
            "clientName": "Shalini Singhal",
            "phone": "+91 98110 56789",
            "email": "shalini.singhal@singhaljewels.com",
            "serviceDiscipline": "INTERIOR",
            "location": "South Delhi / Goa Holiday Home",
            "budgetBand": "₹3 - ₹5 Crores",
            "estimatedTimeline": "8-12 Months",
            "projectBrief": "Ultra-luxury Mediterranean interior redesign for heritage coastal Portuguese villa in Assagao, Goa.",
            "whatsappOptIn": True
        },
        {
            "clientName": "Nilesh Agrawal",
            "phone": "+91 98220 89012",
            "email": "nilesh@nagpurinfra.org",
            "serviceDiscipline": "TURNKEY",
            "location": "Civil Lines, Nagpur",
            "budgetBand": "₹8 - ₹12 Crores",
            "estimatedTimeline": "18-24 Months",
            "projectBrief": "Biophilic residence with subterranean courtyard and post-tensioned cantilever roof.",
            "whatsappOptIn": True
        },
        {
            "clientName": "Aarav Oberoi",
            "phone": "+91 98200 77112",
            "email": "aarav@oberoiventures.com",
            "serviceDiscipline": "ARCHITECTURE",
            "location": "Alibaug Coastline",
            "budgetBand": "₹15 - ₹20 Crores",
            "estimatedTimeline": "24 Months",
            "projectBrief": "Raw concrete brutalist beachfront compound with private boat dock and reflection pools.",
            "whatsappOptIn": True
        }
    ]

    for lead in leads_data:
        res = request("POST", "/api/leads", lead)
        print(f"  [+] Lead Registered: {lead['clientName']} ({lead['location']}) - {lead['budgetBand']}")

    # 11. SEED SHOWCASE PROJECTS & MANIFESTO (CMS)
    print("\n--- 11. Seeding Website Portfolio Showcase Projects & Philosophy CMS ---")
    showcase_projects = [
        {
            "title": "The Monolith Sanctuary",
            "category": "Residential Architecture",
            "location": "Khandala, Maharashtra",
            "year": "2026",
            "releaseDate": "01/01/2026",
            "area": "8,500 sq.ft",
            "status": "Completed",
            "summaryTitle": "////// RESIDENTIAL ARCHITECTURE",
            "summary": "A subterranean cliffside retreat sculpted into basalt rock, featuring central travertine light-wells and reflecting water pools in Khandala, Maharashtra.",
            "tagsJson": json.dumps(["BRUTALIST STONE", "CANTILEVER", "SUSTAINABLE GEOLOGY"]),
            "accentColor": "#A58A64"
        },
        {
            "title": "The Travertine Penthouse",
            "category": "Interior Architecture",
            "location": "Worli, Mumbai",
            "year": "2025",
            "releaseDate": "01/01/2025",
            "area": "4,200 sq.ft",
            "status": "Completed",
            "summaryTitle": "////// INTERIOR ARCHITECTURE",
            "summary": "A minimalist coastal residence finished with monolithic travertine wall planes, brushed bronze joinery, and concealed circadian lighting channels in Worli, Mumbai.",
            "tagsJson": json.dumps(["WARM MINIMALISM", "TRAVERTINE", "BESPOKE JOINERY"]),
            "accentColor": "#B89D78"
        },
        {
            "title": "The Basalt Courtyard",
            "category": "Heritage Restoration & Landscape",
            "location": "Pune, Maharashtra",
            "year": "2025",
            "releaseDate": "01/01/2025",
            "area": "6,100 sq.ft",
            "status": "Completed",
            "summaryTitle": "////// HERITAGE RESTORATION",
            "summary": "Revitalization of a century-old courtyard house, balancing exposed hand-chiseled basalt masonry with native botanical landscaping and rainwater reflection basins.",
            "tagsJson": json.dumps(["BASALT MASONRY", "BIOPHILIC", "WATER REFLECTION"]),
            "accentColor": "#997A52"
        },
        {
            "title": "Zephyr Sky Pavilion",
            "category": "Turnkey Villa Execution",
            "location": "Alibaug Coast, Maharashtra",
            "year": "2026",
            "releaseDate": "01/01/2026",
            "area": "11,200 sq.ft",
            "status": "In Execution",
            "summaryTitle": "////// TURNKEY VILLA EXECUTION",
            "summary": "Post-tensioned cantilevered ocean retreat overlooking the Arabian Sea, featuring full-height acoustic glazing and seamless indoor-outdoor water courts.",
            "tagsJson": json.dumps(["CANTILEVER", "OCEANFRONT", "STRUCTURAL GLASS"]),
            "accentColor": "#C4A47C"
        }
    ]

    for sp in showcase_projects:
        request("POST", "/api/projects", sp, token=admin_token)
        print(f"  [+] Website Showcase Project: {sp['title']} ({sp['location']})")

    manifesto_data = {
        "title": "ARCHÉON PHILOSOPHY",
        "headline": "Raw Materiality. Precise Geometry. Timeless Permanence.",
        "paragraphsJson": json.dumps([
            "At ArcheOn Design Studio, architecture is not an imposition upon the earth, but a profound excavation of what the land demands. Under the design direction of Ar. Mandar Bhalekar, every project begins with geological resonance.",
            "We reject synthetic ornamentation in favor of authentic basalt, honed travertine, seasoned Burmese teak, and honest structural steel. Through meticulous light-well carving, space becomes an experiential continuum that transcends passing stylistic trends.",
            "Our studio operates at the rigorous intersection of bespoke luxury and flawless execution, delivering spaces of quiet monumentality and everlasting dignity."
        ])
    }
    request("PUT", "/api/manifesto", manifesto_data, token=admin_token)
    print("  [+] Studio Philosophy & Manifesto Published.")

    # 12. IN-APP NOTIFICATIONS
    print("\n--- 12. Seeding Portal Notifications ---")
    notifs = [
        {"title": "Milestone 1 Payment Verified", "message": "Basalt foundation bill BILL-2026-DSC-01 of ₹10,03,000 has been verified and settled via online transfer.", "type": "PAYMENT"},
        {"title": "New Blueprint Uploaded", "message": "Drawing AR-01 Floor Plan & Spatial Layout has been approved and published to the document workspace.", "type": "PROJECT"},
        {"title": "Architect Site Visit Completed", "message": "Ar. Mandar Bhalekar completed the 14-day slab inspection at The Monolith Sanctuary.", "type": "SITE_VISIT"},
        {"title": "Sample Inspection Scheduled", "message": "Client inspection for travertine stone finishes confirmed for Monday at 3:00 PM.", "type": "TICKET"}
    ]
    for n in notifs:
        request("POST", "/api/notifications", n, token=admin_token)
        print(f"  [+] Notification Created: {n['title']}")

    print("\n=================================================================")
    print("ALL SAMPLE DATA SEEDED SUCCESSFULLY ACROSS EVERY FEATURE & TABLE!")
    print("=================================================================")

if __name__ == "__main__":
    main()
