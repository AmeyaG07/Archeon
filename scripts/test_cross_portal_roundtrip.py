import asyncio
import base64
import json
import os
import sys
import urllib.request
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\darsh\.gemini\antigravity\brain\4d981890-1549-477d-bbf6-92a4eaa67c80"
SCRATCH_DIR = os.path.join(ARTIFACT_DIR, "scratch")
SAMPLE_PNG_PATH = os.path.join(SCRATCH_DIR, "qa_receipt_sample.png")

# Minimal valid 1x1 gold PNG base64
SAMPLE_PNG_B64 = (
    "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVSF+F"
    "AP5FD/8N3y2XAAAAAElFTkSuQmCC"
)


def api_login(username: str, password: str) -> str:
    req = urllib.request.Request(
        "http://localhost:8080/api/auth/login",
        data=json.dumps({"username": username, "password": password}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))["token"]


def api_request(method: str, path: str, token: str, body=None):
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(
        f"http://localhost:8080{path}",
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req) as resp:
        raw = resp.read().decode("utf-8")
        return json.loads(raw) if raw else None


def ensure_demo_project_and_vendor_assignment():
    admin_token = api_login("admin", "Password123!")
    clients = api_request("GET", "/api/clients", admin_token)
    vendors = api_request("GET", "/api/vendors", admin_token)
    projects = api_request("GET", "/api/operational-projects", admin_token)

    demo_client = next((c for c in clients if c.get("clientReference") == "CLI-DEMO-01"), clients[0])
    demo_vendor = next((v for v in vendors if v.get("vendorReference") == "VEN-DEMO-01"), vendors[0])

    demo_proj = next(
        (p for p in projects if str(p.get("clientId")) == str(demo_client["id"])),
        None,
    )

    if demo_proj is None:
        print(f"  Creating QA operational project for {demo_client['clientReference']}...")
        demo_proj = api_request(
            "POST",
            "/api/operational-projects",
            admin_token,
            {
                "name": "Atelier Lumiere Residence (QA Roundtrip)",
                "projectType": "RESIDENTIAL_ARCHITECTURE",
                "clientId": demo_client["id"],
                "siteAddress": "Dharampeth, Nagpur, Maharashtra",
                "projectManagerUsername": "admin",
                "contractValue": 4500000,
                "description": "Verification project linking CLI-DEMO-01 and VEN-DEMO-01 for E2E roundtrip.",
            },
        )

    project_id = demo_proj["id"]
    assigned_vendors = api_request("GET", f"/api/operational-projects/{project_id}/vendors", admin_token)
    already_assigned = any(str(a.get("vendorId")) == str(demo_vendor["id"]) for a in assigned_vendors)

    if not already_assigned:
        print(f"  Assigning {demo_vendor['vendorReference']} to project {demo_proj.get('name')}...")
        api_request(
            "POST",
            f"/api/operational-projects/{project_id}/vendors",
            admin_token,
            {
                "vendorId": demo_vendor["id"],
                "scopeOfWork": "Architectural Millwork & Joinery",
                "contractAmount": 500000,
                "notes": "Assigned for cross-portal live roundtrip verification",
            },
        )

    print(
        f"  [OK] Project={demo_proj.get('name')} | Client={demo_client['clientReference']} | Vendor={demo_vendor['vendorReference']}"
    )
    return demo_proj


async def run_roundtrip():
    os.makedirs(SCRATCH_DIR, exist_ok=True)
    with open(SAMPLE_PNG_PATH, "wb") as f:
        f.write(base64.b64decode(SAMPLE_PNG_B64))

    results = {}
    unique_amount = "47850"
    unique_trade = "QA Millwork Roundtrip 2026"
    unique_utr = "UTR-QA-ROUNDTRIP-47850"

    print("\n=======================================================")
    print("  STEP 0: ENSURE PROJECT & VENDOR ASSIGNMENT")
    print("=======================================================")
    ensure_demo_project_and_vendor_assignment()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # -----------------------------------------------------
        # STEP 1: VENDOR SUBMITS BILL VIA LIVE VENDOR PORTAL UI
        # -----------------------------------------------------
        print("\n=======================================================")
        print("  STEP 1: VENDOR SUBMITS NEW BILL (/vendor/invoices)")
        print("=======================================================")
        v_ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        v_page = await v_ctx.new_page()
        v_page.on("pageerror", lambda e: print(f"[Vendor PageError]: {e}"))

        await v_page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await v_page.wait_for_timeout(800)
        await v_page.locator('button:has-text("Vendor")').click()
        await v_page.fill('input[type="text"]', "vendor_user")
        await v_page.fill('input[type="password"]', "Password123!")
        await v_page.click('button[type="submit"]')
        await v_page.wait_for_url("**/vendor**", timeout=10000)

        await v_page.locator("aside").first.locator('button:has-text("Invoices")').first.click()
        await v_page.wait_for_url("**/vendor/invoices**", timeout=10000)
        await v_page.wait_for_timeout(1500)

        await v_page.locator('button:has-text("Submit New Bill")').first.click()
        await v_page.wait_for_timeout(500)

        # Fill bill form
        await v_page.locator('input[placeholder*="45000"]').fill(unique_amount)
        await v_page.locator('input[placeholder*="Tile Vendor"]').fill(unique_trade)

        # Attach sample receipt image URL / file via DualImageUpload if input[type=file] exists
        file_inputs = v_page.locator('input[type="file"]')
        if await file_inputs.count() > 0:
            await file_inputs.first.set_input_files(SAMPLE_PNG_PATH)
            await v_page.wait_for_timeout(600)

        await v_page.locator('form button[type="submit"]:has-text("Submit Bill")').click()
        await v_page.wait_for_timeout(2500)

        vendor_body = await v_page.locator("body").inner_text()
        vendor_bill_visible = unique_trade in vendor_body and "47,850" in vendor_body
        print(f"  Vendor submitted bill visible in table: {vendor_bill_visible}")
        results["Vendor Submit Bill"] = "PASS" if vendor_bill_visible else "FAIL"

        await v_page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_roundtrip_1_vendor_bill.png"))
        await v_ctx.close()

        # -----------------------------------------------------
        # STEP 2: CLIENT PAYS BILL WITH PAYMENT PROOF (/client/invoices)
        # -----------------------------------------------------
        print("\n=======================================================")
        print("  STEP 2: CLIENT SUBMITS PAYMENT PROOF (/client/invoices)")
        print("=======================================================")
        c_ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        c_page = await c_ctx.new_page()
        c_page.on("pageerror", lambda e: print(f"[Client PageError]: {e}"))

        await c_page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await c_page.wait_for_timeout(800)
        await c_page.locator('button:has-text("Client")').click()
        await c_page.fill('input[type="text"]', "client_user")
        await c_page.fill('input[type="password"]', "Password123!")
        await c_page.click('button[type="submit"]')
        await c_page.wait_for_url("**/client**", timeout=10000)

        await c_page.locator("aside").first.locator('button:has-text("Invoices & Bills")').click()
        await c_page.wait_for_url("**/client/invoices**", timeout=10000)
        await c_page.wait_for_timeout(2000)

        target_article = c_page.locator("article", has_text=unique_trade).first
        client_sees_bill = await target_article.is_visible()
        print(f"  Client sees newly submitted bill ({unique_trade}): {client_sees_bill}")
        results["Client Sees New Bill"] = "PASS" if client_sees_bill else "FAIL"

        if client_sees_bill:
            await target_article.locator('button:has-text("Submit Payment Proof")').click()
            await c_page.wait_for_timeout(600)

            modal = c_page.locator('[role="dialog"]').first
            await modal.locator('input[type="file"]').set_input_files(SAMPLE_PNG_PATH)
            await c_page.wait_for_timeout(600)
            await modal.locator('input[placeholder*="432109876543"]').fill(unique_utr)
            await modal.locator('button[type="submit"]:has-text("Confirm & Update to Paid")').click()
            await c_page.wait_for_timeout(2500)

            # Reload from server to verify persistence in DB!
            await c_page.reload(wait_until="domcontentloaded")
            await c_page.wait_for_timeout(2000)
            reloaded_article = c_page.locator("article", has_text=unique_trade).first
            reloaded_text = await reloaded_article.inner_text()
            is_paid_persisted = "Paid" in reloaded_text or "PAID" in reloaded_text.upper()
            has_proof_btn = await reloaded_article.locator('button:has-text("Submit Payment Proof")').count() == 0
            print(f"  After page.reload() -> Bill is Paid: {is_paid_persisted}, Outstanding button removed: {has_proof_btn}")
            results["Client Payment Proof Persisted"] = "PASS" if (is_paid_persisted and has_proof_btn) else "FAIL"
        else:
            results["Client Payment Proof Persisted"] = "FAIL (bill not found)"

        await c_page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_roundtrip_2_client_paid.png"))
        await c_ctx.close()

        # -----------------------------------------------------
        # STEP 3: VENDOR SEES PAID STATUS & PAYMENT PROOF SCREENSHOT
        # -----------------------------------------------------
        print("\n=======================================================")
        print("  STEP 3: VENDOR SEES PAID STATUS & SCREENSHOT")
        print("=======================================================")
        v2_ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        v2_page = await v2_ctx.new_page()

        await v2_page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await v2_page.wait_for_timeout(800)
        await v2_page.locator('button:has-text("Vendor")').click()
        await v2_page.fill('input[type="text"]', "vendor_user")
        await v2_page.fill('input[type="password"]', "Password123!")
        await v2_page.click('button[type="submit"]')
        await v2_page.wait_for_url("**/vendor**", timeout=10000)

        await v2_page.locator("aside").first.locator('button:has-text("Invoices")').first.click()
        await v2_page.wait_for_url("**/vendor/invoices**", timeout=10000)
        await v2_page.wait_for_timeout(2000)

        bill_row = v2_page.locator("tr", has_text=unique_trade).first
        row_text = await bill_row.inner_text()
        vendor_paid_ok = "PAID (ONLINE)" in row_text and "Settled" in row_text
        has_screenshot_link = await bill_row.locator('button:has-text("View Screenshot")').count() > 0
        print(f"  Vendor sees PAID (ONLINE) & Settled: {vendor_paid_ok}, View Screenshot present: {has_screenshot_link}")
        results["Vendor Sees Paid Reflection"] = "PASS" if (vendor_paid_ok and has_screenshot_link) else "FAIL"

        await v2_page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_roundtrip_3_vendor_paid.png"))
        await v2_ctx.close()

        # -----------------------------------------------------
        # STEP 4: ADMIN PORTAL VERIFIES BILL & TWO UI FIXES
        # -----------------------------------------------------
        print("\n=======================================================")
        print("  STEP 4: ADMIN PORTAL VERIFIES ROUND-TRIP & UI FIXES")
        print("=======================================================")
        a_ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        a_page = await a_ctx.new_page()
        a_page.on("pageerror", lambda e: print(f"[Admin PageError]: {e}"))

        await a_page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await a_page.wait_for_timeout(800)
        await a_page.locator('button:has-text("Studio")').first.click()
        await a_page.fill('input[type="text"]', "admin")
        await a_page.fill('input[type="password"]', "Password123!")
        await a_page.click('button[type="submit"]')
        await a_page.wait_for_url("**/admin**", timeout=10000)
        await a_page.wait_for_timeout(1500)

        # UI Fix 1: Verify "Vendors" link in Admin sidebar and navigate with it
        vendors_nav_btn = a_page.locator("aside").first.locator('button:has-text("Vendors")')
        has_vendors_nav = await vendors_nav_btn.count() > 0
        print(f"  UI Fix 1 - 'Vendors' item in Admin sidebar: {has_vendors_nav}")
        if has_vendors_nav:
            await vendors_nav_btn.first.click()
            await a_page.wait_for_url("**/admin/vendors**", timeout=10000)
            await a_page.wait_for_timeout(1500)
            vendors_ok = "/admin/vendors" in a_page.url and await a_page.locator('text="Registered Vendors"').is_visible()
            results["UI Fix 1: Vendors Sidebar Link"] = "PASS" if vendors_ok else "FAIL"
        else:
            results["UI Fix 1: Vendors Sidebar Link"] = "FAIL"

        await a_page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_roundtrip_4_admin_vendors_sidebar.png"))

        # UI Fix 2 & Round-trip check on /admin/invoices
        await a_page.locator("aside").first.locator('button:has-text("Invoices & Bills")').click()
        await a_page.wait_for_url("**/admin/invoices**", timeout=10000)
        await a_page.wait_for_timeout(2000)

        # Check single-line rendering on all 5 SummaryCard values
        kpi_wrap_info = await a_page.evaluate("""() => {
            const cards = document.querySelectorAll('section.grid > div');
            const out = [];
            cards.forEach(c => {
                const labelEl = c.querySelector('p:nth-child(1)');
                const valEl = c.querySelector('p:nth-child(2)');
                if (labelEl && valEl) {
                    const range = document.createRange();
                    range.selectNodeContents(valEl);
                    const rects = range.getClientRects();
                    out.push({
                        label: labelEl.innerText.trim(),
                        value: valEl.innerText.trim(),
                        lineCount: rects.length,
                        scrollWidth: valEl.scrollWidth,
                        clientWidth: valEl.clientWidth
                    });
                }
            });
            return out;
        }""")
        print("  UI Fix 2 - KPI Summary Card Line Counts:")
        all_single_line = len(kpi_wrap_info) >= 5
        for info in kpi_wrap_info:
            print(f"    - {info['label']}: '{info['value']}' | lines={info['lineCount']} | scrollW={info['scrollWidth']}/clientW={info['clientWidth']}")
            if info["lineCount"] > 1 or info["scrollWidth"] > info["clientWidth"] + 2:
                all_single_line = False
        results["UI Fix 2: KPI No .00 Wrapping"] = "PASS" if all_single_line else "FAIL"

        # Verify the round-trip bill appears in Admin Invoices as Paid
        admin_bill_article = a_page.locator("article", has_text=unique_trade).first
        admin_sees_bill = await admin_bill_article.is_visible()
        admin_bill_text = await admin_bill_article.inner_text() if admin_sees_bill else ""
        admin_paid_ok = admin_sees_bill and "PAID" in admin_bill_text.upper() and "47,850" in admin_bill_text
        print(f"  Admin sees round-trip bill as Paid: {admin_paid_ok}")
        results["Admin Verifies Paid Bill"] = "PASS" if admin_paid_ok else "FAIL"

        await a_page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_roundtrip_5_admin_invoices.png"))
        await a_ctx.close()
        await browser.close()

    print("\n=======================================================")
    print("  CROSS-PORTAL ROUND-TRIP & UI FIX SUMMARY")
    print("=======================================================")
    all_pass = True
    for k, v in results.items():
        flag = "[OK]" if v == "PASS" else "[FAIL]"
        print(f"  {flag} {k}: {v}")
        if v != "PASS":
            all_pass = False
    print("=======================================================")
    if not all_pass:
        sys.exit(1)
    print("  >>> ALL ROUND-TRIP & UI FIX CHECKS PASSED 100% <<<")


if __name__ == "__main__":
    asyncio.run(run_roundtrip())
