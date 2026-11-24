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
    print("=== ArcheOn Assign Vendors & Complete Features Seeder ===")
    admin_token = login("admin", "Password123!")
    if not admin_token:
        print("Could not login as admin.")
        return

    # 1. Fetch current Projects, Clients and Vendors
    projects = request("GET", "/api/operational-projects", token=admin_token)
    clients = request("GET", "/api/clients", token=admin_token)
    vendors = request("GET", "/api/vendors", token=admin_token)

    print(f"Loaded {len(projects)} projects, {len(clients)} clients, {len(vendors)} vendors.")

    # Index by reference / name
    v_by_ref = {v.get("vendorReference"): v for v in vendors}
    p_by_name = {p.get("name"): p for p in projects}

    # Helper to find project
    def find_p(substring):
        for name, p in p_by_name.items():
            if substring.lower() in name.lower():
                return p
        return None

    # Helper to assign vendor
    def assign(p_sub, v_ref, scope, amount, notes):
        p = find_p(p_sub)
        v = v_by_ref.get(v_ref)
        if not p:
            print(f"Project matching '{p_sub}' not found.")
            return None
        if not v:
            print(f"Vendor '{v_ref}' not found.")
            return None

        # Check existing assignments
        existing = request("GET", f"/api/operational-projects/{p['id']}/vendors", token=admin_token)
        if isinstance(existing, list):
            for a in existing:
                if str(a.get("vendorId")) == str(v["id"]):
                    print(f"Vendor {v_ref} already assigned to {p['name']}.")
                    return a

        payload = {
            "vendorId": v["id"],
            "scopeOfWork": scope,
            "contractAmount": amount,
            "notes": notes
        }
        res = request("POST", f"/api/operational-projects/{p['id']}/vendors", payload, token=admin_token)
        print(f"Assigned {v.get('businessName')} to {p['name']}: {res.get('status', 'OK')}")
        return res

    print("\n--- 2. Assigning All Vendors to Operational Projects ---")
    
    # VEN-2026-06: Botanica Zen Landscapes & Waterbodies
    assign("Basalt Courtyard", "VEN-2026-06", 
           "Biophilic Courtyard Landscaping, Zen Reflection Pools & Native Flora", 
           850000.0, "Native basalt landscape with integrated submerged water circulation.")
    assign("Aurum Horizon", "VEN-2026-06", 
           "Waterfront Landscape Terracing, Cliffside Gardens & Automatic Drip Irrigation", 
           1400000.0, "Multi-tier cliffside coastal garden and subterranean irrigation manifold.")
    assign("The Monolith", "VEN-2026-06", 
           "Basalt Rock Cliffside Gardens & Reflection Pool Water Cascades", 
           1150000.0, "Natural cliffside integration with illuminated travertine reflecting pools.")

    # VEN-2026-05: Lumina Architectural Glazing & Facades
    assign("Zephyr Sky", "VEN-2026-05", 
           "Double-Height Acoustic Glazing, Post-Tensioned Glass Curtain Walls & Motorized Skylights", 
           2100000.0, "Triple-glazed acoustic panes with concealed automated thermal vents.")
    assign("The Glass & Bronze", "VEN-2026-05", 
           "Bronze Profile Mullions, Architectural Low-E Facade Glass", 
           1800000.0, "Curated bronze anodized framing with 99% UV rejection acoustic glazing.")
    assign("Obsidian Cliffside", "VEN-2026-05", 
           "Post-Tensioned Acoustic Glazing & Travertine Glass Balustrades", 
           1650000.0, "Seamless glass balustrades anchored into monolithic travertine wall planes.")

    # VEN-2026-04: Vanguard Structural Steel & Cantilevers
    assign("The Monolith", "VEN-2026-04", 
           "High-Grade Marine Cantilever Steel Truss, Floating Deck Substructure", 
           3200000.0, "Engineered structural steel cantilever tested for 160 km/h cliff winds.")
    assign("Obsidian Cliffside", "VEN-2026-04", 
           "Exposed Structural Steel Portico & Cantilever Balcony Outriggers", 
           2600000.0, "Matte charcoal epoxy-finished structural steel framing.")
    assign("Aurum Horizon", "VEN-2026-04", 
           "High-Grade Marine Structural Steel Deck Substructure", 
           2850000.0, "Hot-dip galvanized structural outriggers for waterfront salinity resistance.")

    # VEN-2026-03: Apex Climate & Precision MEP Systems
    assign("Zephyr Sky", "VEN-2026-03", 
           "Concealed Variable Refrigerant VRV Systems, Linear Slot Diffusers & Smart Circadian MEP", 
           1950000.0, "Daikin VRV with acoustic baffling and linear slot diffusers integrated in ceiling.")
    assign("The Monolith", "VEN-2026-03", 
           "Geothermal Subterranean Cooling, Radiant Floor Piping & Heat Recovery Ventilation", 
           2400000.0, "Underground geothermal cooling loop embedded in basalt bedrock.")

    # VEN-2026-02: Bespoke Teak & Architectural Joinery
    assign("The Monolith", "VEN-2026-02", 
           "Bespoke Burma Teak Millwork, Fluted Wall Cladding & Concealed Pivot Doors", 
           2200000.0, "FSC-certified seasoned Burma teak with hand-rubbed Danish oil finish.")
    assign("Obsidian Cliffside", "VEN-2026-02", 
           "Smoked Oak Architectural Cabinetry & Solid Wood Ceilings", 
           1750000.0, "Smoked European oak slats with integrated concealed LED linear lights.")

    # VEN-2026-01: Deccan Stonecraft & Basalt Works
    assign("The Monolith", "VEN-2026-01", 
           "Hand-Chiseled Basalt Ashlar Masonry & Navona Travertine Wall Planes", 
           3500000.0, "Basalt blocks quarried from Deccan traps, calibrated travertine light-wells.")
    assign("Basalt Courtyard", "VEN-2026-01", 
           "Heritage Courtyard Paving, Stone Water Fountain & Basalt Steps", 
           1200000.0, "Restored hand-cut basalt flagstones with invisible perimeter drainage.")

    print("\n--- 3. Submitting Bills & Invoices for All Vendors ---")
    bills_to_create = [
        # Botanica Zen
        {
            "vendorReference": "VEN-2026-06",
            "projectSub": "Basalt Courtyard",
            "milestone": "Milestone 1 - Courtyard Earth Grading & Subsurface Drainage",
            "billNumber": "BOT-2026-B101",
            "amount": 285000.0,
            "status": "APPROVED",
            "category": "LANDSCAPING",
            "billPhotoUrl": "/brand-assets/ARCHEON DESIGN STUDIO 2.png"
        },
        {
            "vendorReference": "VEN-2026-06",
            "projectSub": "Aurum Horizon",
            "milestone": "Milestone 1 - Waterfront Terraced Planting & Drip Manifold",
            "billNumber": "BOT-2026-B102",
            "amount": 420000.0,
            "status": "SUBMITTED",
            "category": "LANDSCAPING",
            "billPhotoUrl": None
        },
        # Lumina Glazing
        {
            "vendorReference": "VEN-2026-05",
            "projectSub": "Zephyr Sky",
            "milestone": "Milestone 1 - High-Rise Facade Framing & Thermal Mullions",
            "billNumber": "LUM-2026-B201",
            "amount": 680000.0,
            "status": "APPROVED",
            "category": "GLAZING",
            "billPhotoUrl": "/brand-assets/logo-clock-center.png"
        },
        {
            "vendorReference": "VEN-2026-05",
            "projectSub": "The Glass & Bronze",
            "milestone": "Milestone 1 - Bronze Anodized Extrusions & Glazing Cassettes",
            "billNumber": "LUM-2026-B202",
            "amount": 540000.0,
            "status": "SUBMITTED",
            "category": "GLAZING",
            "billPhotoUrl": None
        },
        # Vanguard Steel
        {
            "vendorReference": "VEN-2026-04",
            "projectSub": "The Monolith",
            "milestone": "Milestone 1 - Primary Cantilever Box Girder Erection",
            "billNumber": "VAN-2026-B301",
            "amount": 1150000.0,
            "status": "APPROVED",
            "category": "STRUCTURAL_STEEL",
            "billPhotoUrl": None
        },
        {
            "vendorReference": "VEN-2026-04",
            "projectSub": "Obsidian Cliffside",
            "milestone": "Milestone 1 - Steel Balcony Subframe Anchors",
            "billNumber": "VAN-2026-B302",
            "amount": 780000.0,
            "status": "SUBMITTED",
            "category": "STRUCTURAL_STEEL",
            "billPhotoUrl": "/brand-assets/logo.png"
        },
        # Apex Climate
        {
            "vendorReference": "VEN-2026-03",
            "projectSub": "The Monolith",
            "milestone": "Milestone 1 - Geothermal Ground Loop Piping & Manifold",
            "billNumber": "APX-2026-B401",
            "amount": 620000.0,
            "status": "APPROVED",
            "category": "HVAC_MEP",
            "billPhotoUrl": None
        },
        # Bespoke Teak
        {
            "vendorReference": "VEN-2026-02",
            "projectSub": "The Monolith",
            "milestone": "Milestone 1 - Kiln-Dried Burma Teak Wall Framing",
            "billNumber": "BSK-2026-B501",
            "amount": 490000.0,
            "status": "APPROVED",
            "category": "CARPENTRY",
            "billPhotoUrl": None
        },
        # Deccan Stonecraft
        {
            "vendorReference": "VEN-2026-01",
            "projectSub": "The Monolith",
            "milestone": "Milestone 1 - Basalt Rock Substructure & Travertine Light Well",
            "billNumber": "DEC-2026-B601",
            "amount": 950000.0,
            "status": "APPROVED",
            "category": "STONEWORK",
            "billPhotoUrl": None
        }
    ]

    for b in bills_to_create:
        p = find_p(b["projectSub"])
        v = v_by_ref.get(b["vendorReference"])
        if not p or not v:
            continue

        payload = {
            "vendorId": v["vendorReference"],
            "clientId": p.get("clientId"),
            "projectId": p.get("id"),
            "amount": b["amount"],
            "invoiceNumber": b["billNumber"],
            "tradeCategory": b["category"],
            "description": b["milestone"],
            "billPhotoUrl": b.get("billPhotoUrl")
        }
        res = request("POST", "/api/billing/bills", payload, token=admin_token)
        print(f"Created Bill {b['billNumber']} for {v.get('businessName')}: {res.get('status', 'OK')} (Photo: {bool(b.get('billPhotoUrl'))})")

    print("\n--- 4. Adding Site Progress Updates for Projects ---")
    site_updates = [
        {
            "projectSub": "The Monolith",
            "title": "Basalt Bedrock Excavation & Cantilever Anchor Inspection",
            "notes": "Full load testing completed on cliffside bedrock anchors. Basalt excavation reached datum level +42.0m. Travertine deliveries from Navona quarry verified on site.",
            "progressPercentage": 45,
            "category": "STRUCTURAL_INSPECTION"
        },
        {
            "projectSub": "Basalt Courtyard",
            "title": "Courtyard Flagstone Restoration & Water Cascade Flow Verification",
            "notes": "Original basalt flagstones repointed with lime mortar. Subsurface water circulation pumps operational with passive aeration.",
            "progressPercentage": 75,
            "category": "LANDSCAPE_UPDATE"
        },
        {
            "projectSub": "Zephyr Sky",
            "title": "Double-Height Acoustic Glazing Delivery & Framing Verification",
            "notes": "Lumina architectural crew installed vertical bronze mullions. All floor-to-ceiling glass panels lifted via external crane hoist safely.",
            "progressPercentage": 60,
            "category": "ENVELOPE_UPDATE"
        },
        {
            "projectSub": "Obsidian Cliffside",
            "title": "Steel Portico Erection & Travertine Wall Slabs Alignment",
            "notes": "Vanguard steel crew placed the 12-meter cantilever outrigger beam. Laser plumb lines confirm zero deflection across the outer fascia.",
            "progressPercentage": 35,
            "category": "STRUCTURAL_INSPECTION"
        },
        {
            "projectSub": "Aurum Horizon",
            "title": "Marine Salinity Protection & Marine Grade Structural Deck Pour",
            "notes": "Epoxy coated reinforcement cages laid for the waterfront pool deck. Botanica Zen commenced terraced planting along western slope.",
            "progressPercentage": 40,
            "category": "CIVIL_UPDATE"
        }
    ]

    for su in site_updates:
        p = find_p(su["projectSub"])
        if not p:
            continue
        payload = {
            "projectId": p["id"],
            "title": su["title"],
            "description": su["notes"],
            "progressPercentage": su["progressPercentage"],
            "category": su["category"],
            "visitDate": "2026-11-24",
            "inspectorName": "Ar. Mandar Bhalekar",
            "weatherCondition": "Clear 27°C, Wind 8 km/h NW"
        }
        res = request("POST", "/api/site-updates", payload, token=admin_token)
        print(f"Added Site Update for {p['name']}: {res.get('status', 'OK')}")

    print("\n=== All Assignments & Content Added Successfully! ===")

if __name__ == "__main__":
    main()
