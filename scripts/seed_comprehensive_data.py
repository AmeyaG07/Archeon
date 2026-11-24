import json
import urllib.request
import urllib.error
import time

BASE_URL = "http://localhost:8080"

def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data else None
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
    print("=== ArcheOn Design Studio Comprehensive Seeder ===")
    admin_token = login("admin", "Password123!")
    if not admin_token:
        print("Could not obtain admin token. Exiting.")
        return
    print("Logged in as admin.")

    client_token = login("client_user", "Password123!")
    vendor_token = login("vendor_user", "Password123!")

    # 1. Seed Clients
    print("\n--- 1. Seeding Clients ---")
    clients_to_seed = [
        {
            "clientReference": "CLI-2026-101",
            "fullName": "Vikram Singhania",
            "email": "vikram.singhania@heritagehomes.in",
            "phone": "+91 98201 11223",
            "organization": "Singhania Heritage Living",
            "location": "South Mumbai, Maharashtra",
            "notes": "Prefers Italian Travertine, Scandinavian minimalism, bespoke climate automation."
        },
        {
            "clientReference": "CLI-2026-102",
            "fullName": "Dr. Ananya Deshmukh",
            "email": "ananya.deshmukh@agroretreat.org",
            "phone": "+91 98202 22334",
            "organization": "Deshmukh Agro Retreats",
            "location": "Alibaug, Maharashtra",
            "notes": "Requires biophilic stone courtyards, subterranean rainwater storage and courtyard greens."
        },
        {
            "clientReference": "CLI-2026-103",
            "fullName": "Kabir Mehra",
            "email": "kabir.mehra@mehraholdings.com",
            "phone": "+91 98203 33445",
            "organization": "Mehra Creative Penthouse",
            "location": "Bandra West, Mumbai",
            "notes": "Curated bronze metal accents, monolithic fluted timber, acoustic recording walls."
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
        }
    ]

    all_clients = request("GET", "/api/clients", token=admin_token)
    if isinstance(all_clients, list):
        existing_emails = {c.get("email") for c in all_clients}
    else:
        existing_emails = set()
        all_clients = []

    for c in clients_to_seed:
        if c["email"] not in existing_emails:
            res = request("POST", "/api/clients", c, token=admin_token)
            if "id" in res:
                print(f"Created client: {c['fullName']} ({c['clientReference']})")
                all_clients.append(res)
            else:
                print(f"Failed to create client {c['fullName']}: {res}")
        else:
            print(f"Client already exists: {c['fullName']}")

    # Refresh client list
    all_clients = request("GET", "/api/clients", token=admin_token)

    # 2. Seed Vendors
    print("\n--- 2. Seeding Trade Vendors ---")
    vendors_to_seed = [
        {
            "vendorReference": "VND-2026-001",
            "businessName": "Stellar Joinery & Architectural Millwork",
            "contactPerson": "Rajesh S. Parmar",
            "email": "stellar.joinery@archeon-partners.in",
            "phone": "+91 98200 12345",
            "category": "CARPENTRY",
            "location": "Pune, Maharashtra",
            "gstin": "27AABCU9603R1ZM",
            "pan": "ABCDE1234F",
            "bankDetailsJson": json.dumps({
                "accountHolder": "Stellar Joinery LLP",
                "bankName": "HDFC Bank",
                "accountNumber": "50200012345678",
                "ifsc": "HDFC0000123",
                "upiId": "stellar@okhdfcbank"
            }),
            "notes": "Specialists in Burma teak, fluted oak paneling, concealed acoustic doors."
        },
        {
            "vendorReference": "VND-2026-002",
            "businessName": "Apex Structural & Post-Tensioned Works",
            "contactPerson": "Eng. Tariq Mansuri",
            "email": "apex.structural@archeon-partners.in",
            "phone": "+91 98200 23456",
            "category": "CIVIL_WORK",
            "location": "Nagpur, Maharashtra",
            "gstin": "27AABCA1234F1Z1",
            "pan": "AABCA1234F",
            "bankDetailsJson": json.dumps({
                "accountHolder": "Apex Structural Engineering",
                "bankName": "ICICI Bank",
                "accountNumber": "002405001234",
                "ifsc": "ICIC0000024",
                "upiId": "apexstructural@icici"
            }),
            "notes": "RCC foundations, post-tensioned slabs, cantilever beams."
        },
        {
            "vendorReference": "VND-2026-003",
            "businessName": "Prism Glass & Architectural Façade Systems",
            "contactPerson": "Farhan Merchant",
            "email": "prism.glass@archeon-partners.in",
            "phone": "+91 98200 34567",
            "category": "FABRICATION",
            "location": "Mumbai, Maharashtra",
            "gstin": "27AABCP5678G1Z2",
            "pan": "AABCP5678G",
            "bankDetailsJson": json.dumps({
                "accountHolder": "Prism Façades India",
                "bankName": "Axis Bank",
                "accountNumber": "918020034567890",
                "ifsc": "UTIB0000180",
                "upiId": "prismglass@axis"
            }),
            "notes": "Low-E double glazing, slim profile aluminum windows, structural glass balustrades."
        },
        {
            "vendorReference": "VND-2026-004",
            "businessName": "Lumina Automation & Intelligent Systems",
            "contactPerson": "Anand Joshi",
            "email": "lumina.systems@archeon-partners.in",
            "phone": "+91 98200 45678",
            "category": "ELECTRICAL",
            "location": "Pune, Maharashtra",
            "gstin": "27AABCL9012H1Z3",
            "pan": "AABCL9012H",
            "bankDetailsJson": json.dumps({
                "accountHolder": "Lumina Automation Pvt Ltd",
                "bankName": "Kotak Mahindra Bank",
                "accountNumber": "4512345678",
                "ifsc": "KKBK0000451",
                "upiId": "lumina@kotak"
            }),
            "notes": "KNX lighting, Lutron shading, circadian scene control, smart energy monitors."
        },
        {
            "vendorReference": "VND-2026-005",
            "businessName": "Terrastone Marble & Basalt Masonry",
            "contactPerson": "Devendra Rao",
            "email": "terrastone.masonry@archeon-partners.in",
            "phone": "+91 98200 56789",
            "category": "MASONRY",
            "location": "Nagpur, Maharashtra",
            "gstin": "27AABCT3456J1Z4",
            "pan": "AABCT3456J",
            "bankDetailsJson": json.dumps({
                "accountHolder": "Terrastone Enterprises",
                "bankName": "State Bank of India",
                "accountNumber": "30456789123",
                "ifsc": "SBIN0001234",
                "upiId": "terrastone@sbi"
            }),
            "notes": "Italian travertine dry-cladding, local black basalt landscaping, water features."
        },
        {
            "vendorReference": "VND-2026-006",
            "businessName": "HydroFlow Climate & Sanitary MEP",
            "contactPerson": "Sunil Chawla",
            "email": "hydroflow.mep@archeon-partners.in",
            "phone": "+91 98200 67890",
            "category": "PLUMBING",
            "location": "Mumbai, Maharashtra",
            "gstin": "27AABCH7890K1Z5",
            "pan": "AABCH7890K",
            "bankDetailsJson": json.dumps({
                "accountHolder": "HydroFlow MEP Solutions",
                "bankName": "HDFC Bank",
                "accountNumber": "50200098765432",
                "ifsc": "HDFC0000456",
                "upiId": "hydroflow@okhdfcbank"
            }),
            "notes": "VRV central climate control, pressure boosted plumbing, solar hot water recirc."
        }
    ]

    all_vendors = request("GET", "/api/vendors", token=admin_token)
    if isinstance(all_vendors, list):
        existing_vendor_emails = {v.get("email") for v in all_vendors}
    else:
        existing_vendor_emails = set()
        all_vendors = []

    for v in vendors_to_seed:
        if v["email"] not in existing_vendor_emails:
            res = request("POST", "/api/vendors", v, token=admin_token)
            if "id" in res:
                print(f"Created vendor: {v['businessName']} ({v['vendorReference']})")
                all_vendors.append(res)
            else:
                print(f"Failed to create vendor {v['businessName']}: {res}")
        else:
            print(f"Vendor already exists: {v['businessName']}")

    # Refresh vendor list
    all_vendors = request("GET", "/api/vendors", token=admin_token)

    # 3. Seed Projects
    print("\n--- 3. Seeding Operational Projects ---")
    client_map = {c["fullName"]: c["id"] for c in all_clients if "fullName" in c and "id" in c}
    # Fallback to first client if name not found
    default_client_id = all_clients[0]["id"] if all_clients else None

    projects_to_seed = [
        {
            "projectReference": "PRJ-2026-001",
            "name": "The Monolith Sanctuary",
            "description": "A subterranean cliffside retreat sculpted into basalt rock with central travertine light-wells in Khandala.",
            "projectType": "RESIDENTIAL_ARCHITECTURE",
            "clientId": client_map.get("Vikram Singhania", default_client_id),
            "projectManagerUsername": "admin_mandar",
            "siteAddress": "Plot 14, Khandala Cliffside, Maharashtra 410301",
            "contractValue": 12500000.0,
            "budgetAllocated": 11000000.0,
            "startDate": "2026-01-10",
            "expectedCompletionDate": "2026-12-20",
            "notes": "Phase 1 excavation and RCC core completed. Travertine delivery underway."
        },
        {
            "projectReference": "PRJ-2026-002",
            "name": "The Travertine Penthouse",
            "description": "Minimalist coastal penthouse with monolithic travertine wall planes and brushed bronze joinery in Worli.",
            "projectType": "COMMERCIAL_INTERIOR",
            "clientId": client_map.get("Kabir Mehra", default_client_id),
            "projectManagerUsername": "admin_mandar",
            "siteAddress": "Level 48, Bayview Towers, Worli Seaface, Mumbai 400018",
            "contractValue": 7500000.0,
            "budgetAllocated": 6800000.0,
            "startDate": "2026-02-01",
            "expectedCompletionDate": "2026-09-30",
            "notes": "Millwork framing and acoustic underlays in progress."
        },
        {
            "projectReference": "PRJ-2026-003",
            "name": "Terracotta Courtyard Estate",
            "description": "Multi-tiered coastal landscape ecosystem with stepped rainwater bio-swales and native flora in Alibaug.",
            "projectType": "LANDSCAPE_DESIGN",
            "clientId": client_map.get("Dr. Ananya Deshmukh", default_client_id),
            "projectManagerUsername": "admin_mandar",
            "siteAddress": "Survey 88, Kihim Coast Road, Alibaug, Maharashtra 402201",
            "contractValue": 14000000.0,
            "budgetAllocated": 12500000.0,
            "startDate": "2026-01-15",
            "expectedCompletionDate": "2026-11-15",
            "notes": "Bio-swale earth shaping complete; masonry retaining walls underway."
        },
        {
            "projectReference": "PRJ-2026-004",
            "name": "Basalt Courtyard Pavilion",
            "description": "Sculptural residential villa centered around an internal courtyard of raw black basalt and water fountains.",
            "projectType": "RESIDENTIAL_ARCHITECTURE",
            "clientId": client_map.get("Rohit & Sunita Malhotra", default_client_id),
            "projectManagerUsername": "admin_mandar",
            "siteAddress": "Plot 22, Deendayal Nagar, Nagpur, Maharashtra 440022",
            "contractValue": 9800000.0,
            "budgetAllocated": 8900000.0,
            "startDate": "2026-03-01",
            "expectedCompletionDate": "2027-01-15",
            "notes": "Foundation completed; ground floor columns cast."
        },
        {
            "projectReference": "PRJ-2026-005",
            "name": "Zephyr Horizon Villa",
            "description": "Turnkey luxury estate overlooking the Arabian Sea with panoramic cantilevers and private wellness pool in Goa.",
            "projectType": "TURNKEY_EXECUTION",
            "clientId": client_map.get("Priya & Siddharth Kapoor", default_client_id),
            "projectManagerUsername": "admin",
            "siteAddress": "Plot 5, Vagator Cliff Road, North Goa 403509",
            "contractValue": 18500000.0,
            "budgetAllocated": 16500000.0,
            "startDate": "2026-02-15",
            "expectedCompletionDate": "2027-03-30",
            "notes": "Turnkey site mobilization and structural excavation in progress."
        }
    ]

    all_projects = request("GET", "/api/operational-projects", token=admin_token)
    if isinstance(all_projects, list):
        existing_proj_refs = {p.get("projectReference") for p in all_projects}
    else:
        existing_proj_refs = set()
        all_projects = []

    for p in projects_to_seed:
        if p["projectReference"] not in existing_proj_refs:
            res = request("POST", "/api/operational-projects", p, token=admin_token)
            if "id" in res:
                print(f"Created project: {p['name']} ({p['projectReference']})")
                all_projects.append(res)
            else:
                print(f"Failed to create project {p['name']}: {res}")
        else:
            print(f"Project already exists: {p['name']}")

    # Refresh project list
    all_projects = request("GET", "/api/operational-projects", token=admin_token)

    # 4. Assign 2-3 Vendors to each Project (Ensures vendors have Associated Clients!)
    print("\n--- 4. Assigning Trade Vendors to Projects ---")
    vendor_by_ref = {v.get("vendorReference"): v for v in all_vendors if "vendorReference" in v}

    assignments_plan = [
        # Monolith Sanctuary
        ("PRJ-2026-001", [
            ("VND-2026-001", "Bespoke Burma teak joinery, acoustic bedroom paneling and walnut cabinetry", 2200000.0),
            ("VND-2026-002", "Deep basalt excavation, RCC shear walls and post-tensioned cantilever deck", 4500000.0),
            ("VND-2026-003", "Low-E structural glass facade, curtain walls and motorized sliding glass screens", 2800000.0),
        ]),
        # Travertine Penthouse
        ("PRJ-2026-002", [
            ("VND-2026-001", "Italian oak veneers, concealed wardrobes, and bronze architectural hardware", 1850000.0),
            ("VND-2026-004", "KNX automated circadian lighting, scene keypad integration, automated shades", 1200000.0),
            ("VND-2026-005", "Navona travertine floor tiling, master bath book-matched marble cladding", 1950000.0),
        ]),
        # Terracotta Courtyard Estate
        ("PRJ-2026-003", [
            ("VND-2026-002", "Stepped bio-swale earth retaining works, concrete water cascade basins", 3200000.0),
            ("VND-2026-005", "Hand-chiseled basalt boundary walls, courtyard stone pavers, reflecting pond copings", 2400000.0),
            ("VND-2026-006", "Underground rainwater harvesting pumps, micro-drip irrigation, solar heating", 1600000.0),
        ]),
        # Basalt Courtyard Pavilion
        ("PRJ-2026-004", [
            ("VND-2026-001", "Main entrance double-pivot solid teak door, minimalist ceiling louvers", 1500000.0),
            ("VND-2026-003", "Frameless glass partitions, courtyard viewing windows, skylight glazing", 1800000.0),
            ("VND-2026-004", "Architectural cove lighting channels, master home automation server rack", 1100000.0),
        ]),
        # Zephyr Horizon Villa
        ("PRJ-2026-005", [
            ("VND-2026-002", "High-strength marine grade RCC foundation, cliff retaining piles", 5200000.0),
            ("VND-2026-004", "Solar PV system integration, landscape mood lighting, smart distribution", 2100000.0),
            ("VND-2026-006", "VRV multi-split climate air conditioning, automated pool circulation", 2500000.0),
        ]),
    ]

    proj_by_ref = {p.get("projectReference"): p for p in all_projects if "projectReference" in p}

    for pref, assigns in assignments_plan:
        proj = proj_by_ref.get(pref)
        if not proj:
            continue
        pid = proj["id"]
        
        # Check current assigned vendors
        current_assigned = request("GET", f"/api/operational-projects/{pid}/vendors", token=admin_token)
        assigned_vids = {a.get("vendorId") for a in current_assigned} if isinstance(current_assigned, list) else set()

        for vref, scope, amount in assigns:
            vendor = vendor_by_ref.get(vref)
            if not vendor:
                continue
            vid = vendor["id"]
            if vid not in assigned_vids:
                body = {
                    "vendorId": vid,
                    "scopeOfWork": scope,
                    "contractAmount": amount,
                    "notes": f"Contract assigned with trade scope: {scope[:40]}..."
                }
                res = request("POST", f"/api/operational-projects/{pid}/vendors", body, token=admin_token)
                if "id" in res:
                    print(f"Assigned {vendor['businessName']} to {proj['name']}")
                else:
                    print(f"Assignment skipped/failed for {vref}: {res}")
            else:
                print(f"Vendor {vref} already assigned to {proj['name']}")

    # 5. Seed Contractor Bills & Invoices
    print("\n--- 5. Seeding Contractor Bills ---")
    monolith = proj_by_ref.get("PRJ-2026-001")
    penthouse = proj_by_ref.get("PRJ-2026-002")
    stellar = vendor_by_ref.get("VND-2026-001")
    apex = vendor_by_ref.get("VND-2026-002")

    bills_to_seed = [
        {
            "projectId": monolith["id"] if monolith else None,
            "clientId": monolith.get("clientId") if monolith else None,
            "vendorId": stellar.get("id") if stellar else None,
            "amount": 185000.0,
            "tradeCategory": "Carpentry & Joinery",
            "invoiceNumber": "STEL-2026-B901",
            "description": "Milestone 1 Teakwood Subframe and Wardrobe Shell Fabrication",
            "billPhotoUrl": "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800"
        },
        {
            "projectId": monolith["id"] if monolith else None,
            "clientId": monolith.get("clientId") if monolith else None,
            "vendorId": apex.get("id") if apex else None,
            "amount": 420000.0,
            "tradeCategory": "Civil & Structural",
            "invoiceNumber": "APEX-2026-B104",
            "description": "Basalt Rock Excavation & Reinforced Concrete Retaining Plinth",
            "billPhotoUrl": "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=800"
        },
        {
            "projectId": penthouse["id"] if penthouse else None,
            "clientId": penthouse.get("clientId") if penthouse else None,
            "vendorId": stellar.get("id") if stellar else None,
            "amount": 250000.0,
            "tradeCategory": "Carpentry & Joinery",
            "invoiceNumber": "STEL-2026-B902",
            "description": "Master Suite Wall Panelling and Concealed Fluted Doors",
            "billPhotoUrl": "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800"
        }
    ]

    for b in bills_to_seed:
        if b["projectId"] and b["vendorId"]:
            res = request("POST", "/api/billing/bills", b, token=admin_token)
            if "id" in res:
                print(f"Submitted bill: {b['invoiceNumber']} for ₹{b['amount']}")
            else:
                print(f"Bill result: {res}")

    # 6. Seed Cash Settlement
    print("\n--- 6. Seeding Cash Settlements ---")
    csh_body = {
        "settlementRef": "CSH-SETTLE-501",
        "billId": "BILL-2026-081",
        "projectId": "PRJ-2026-001",
        "counterpartyId": "VND-2026-001",
        "amount": 45000.0,
        "sitePurpose": "Site manual granite unloading and specialized crane transit hire",
        "receiptRef": "RCPT-CRANE-901"
    }
    csh_res = request("POST", "/api/finance/cash/initiate", csh_body, token=admin_token)
    print(f"Initiated Cash Settlement: {csh_res}")

    # Counterparty response (vendor acknowledge)
    ack_res = request("POST", "/api/finance/cash/CSH-SETTLE-501/respond", {
        "acknowledge": True,
        "notes": "Cash received at Khandala site office for crane unloading. Verified and signed."
    }, token=vendor_token or admin_token)
    print(f"Vendor acknowledged Cash Settlement: {ack_res}")

    # Finance approval
    appr_res = request("POST", "/api/finance/cash/CSH-SETTLE-501/approve", {}, token=admin_token)
    print(f"Finance approved Cash Settlement: {appr_res}")

    # 7. Seed Support Tickets
    print("\n--- 7. Seeding Support Tickets ---")
    tickets_to_seed = [
        {
            "subject": "Travertine Finish & Vein Matching Sample Review",
            "category": "Material Selection",
            "priority": "High",
            "relatedReference": "The Monolith Sanctuary / Living Pavilion",
            "description": "We would like to inspect the dry-lay travertine slab samples before the mason commences the living pavilion cladding next Tuesday.",
            "token": client_token or admin_token,
            "reply": "Dear Client, 3 slab samples have been placed in the studio gallery. Ar. Mandar will review them with you on Monday at 3:00 PM."
        },
        {
            "subject": "Bespoke Teakwood Wardrobe Hardware Delivery Schedule",
            "category": "Project Assignment",
            "priority": "Normal",
            "relatedReference": "The Travertine Penthouse / Master Suite",
            "description": "Requesting confirmation on whether the concealed soft-close pivot hinges from Hettich will be dispatched to the site this week.",
            "token": vendor_token or admin_token,
            "reply": "Hardware consignment has arrived at our central warehouse and will be dispatched to Worli site tomorrow morning."
        },
        {
            "subject": "Invoice STEL-2026-B901 Verification Status",
            "category": "Invoicing & Billing",
            "priority": "Normal",
            "relatedReference": "STEL-2026-B901",
            "description": "Checking whether Milestone 1 woodwork bill has cleared the secondary checker review.",
            "token": vendor_token or admin_token,
            "reply": "Primary approval complete. Final finance checker approval scheduled for today's payment batch."
        }
    ]

    for t in tickets_to_seed:
        tok = t.pop("token")
        reply_msg = t.pop("reply")
        res = request("POST", "/api/support/tickets", t, token=tok)
        if "id" in res:
            tid = res["id"]
            ref = res.get("referenceCode", tid)
            print(f"Created Support Ticket: {ref} - {t['subject']}")
            # Add reply
            reply_res = request("POST", f"/api/support/tickets/{tid}/reply", {"message": reply_msg}, token=admin_token)
            print(f"Added studio reply to ticket {ref}")
        else:
            print(f"Ticket creation error: {res}")

    # 8. Seed Leads & Enquiries
    print("\n--- 8. Seeding Leads & Enquiries ---")
    leads_to_seed = [
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
        }
    ]

    for lead in leads_to_seed:
        res = request("POST", "/api/leads", lead)
        if res.get("success"):
            print(f"Submitted Consultation Lead: {lead['clientName']} ({lead['location']})")
        else:
            print(f"Lead submission error: {res}")

    # 9. In-App Notifications
    print("\n--- 9. Verifying In-App Notifications ---")
    notif_list = request("GET", "/api/notifications", token=admin_token)
    print(f"Admin notifications count: {len(notif_list) if isinstance(notif_list, list) else notif_list}")

    print("\n=== Seeding Finished Successfully! ===")

if __name__ == "__main__":
    main()
