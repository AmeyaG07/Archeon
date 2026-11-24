import asyncio
import os
import sys
import time
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\darsh\.gemini\antigravity\brain\4d981890-1549-477d-bbf6-92a4eaa67c80"


async def run_deep_workflows():
    results = {}
    page_errors = []

    ts = int(time.time())
    lead_name = f"Aarav Deshmukh QA {ts % 10000}"
    cash_trade = f"QA Cash Handover {ts % 10000}"
    cash_amount = "5200"
    support_subject = f"QA Support Ticket {ts % 10000}"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # -----------------------------------------------------
        # FLOW A: PUBLIC CONSULTATION ENQUIRY -> ADMIN LEADS
        # -----------------------------------------------------
        print("\n=======================================================")
        print("  FLOW A: PUBLIC ENQUIRY SUBMISSION (/)")
        print("=======================================================")
        pub_ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        pub_page = await pub_ctx.new_page()
        pub_page.on("pageerror", lambda e: (print(f"[Public PageError]: {e}"), page_errors.append(str(e))))

        await pub_page.goto("http://localhost:3000/", wait_until="domcontentloaded")
        await pub_page.wait_for_timeout(1500)

        await pub_page.locator('button:has-text("Discuss Your Project")').first.click()
        await pub_page.wait_for_timeout(600)

        dialog = pub_page.locator('[role="dialog"]').first
        await dialog.locator('input[placeholder*="Rahul Sharma"]').fill(lead_name)
        await dialog.locator('input[placeholder*="+91"]').fill("+91 9823011223")
        await dialog.locator('input[placeholder*="client@domain.com"]').fill("aarav.qa@example.com")
        await dialog.locator('input[placeholder*="Pune"]').fill("Nagpur, Maharashtra")
        await dialog.locator("textarea").fill(
            "Automated QA verification of public consultation enquiry submission and Admin lead intake."
        )
        await dialog.locator('button[type="submit"]:has-text("Submit Project Enquiry")').click()
        await pub_page.wait_for_timeout(2500)

        lead_registered = await dialog.locator('text="Commission Enquiry Registered"').is_visible()
        print(f"  Public Consultation Enquiry Registered: {lead_registered}")
        results["Public Lead Submission"] = "PASS" if lead_registered else "FAIL"
        await pub_page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_deep_1_public_lead_sent.png"))
        await pub_ctx.close()

        # -----------------------------------------------------
        # FLOW B: VENDOR PROJECT WORKSPACE + CASH REQUEST
        # -----------------------------------------------------
        print("\n=======================================================")
        print("  FLOW B: VENDOR WORKSPACE & CASH REQUEST")
        print("=======================================================")
        v_ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        v_page = await v_ctx.new_page()
        v_page.on("pageerror", lambda e: (print(f"[Vendor PageError]: {e}"), page_errors.append(str(e))))

        await v_page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await v_page.wait_for_timeout(600)
        await v_page.locator('button:has-text("Vendor")').click()
        await v_page.fill('input[type="text"]', "vendor_user")
        await v_page.fill('input[type="password"]', "Password123!")
        await v_page.click('button[type="submit"]')
        await v_page.wait_for_url("**/vendor**", timeout=10000)

        # 1. Open Assigned Projects -> click into project detail workspace
        await v_page.locator("aside").first.locator('button:has-text("Assigned Projects")').click()
        await v_page.wait_for_url("**/vendor/projects**", timeout=10000)
        await v_page.wait_for_timeout(1500)

        proj_card = v_page.locator("article", has_text="Atelier Lumiere Residence").first
        if await proj_card.is_visible():
            await proj_card.locator('button:has-text("Open Project Details")').click()
            await v_page.wait_for_url("**/vendor/projects/**", timeout=10000)
            await v_page.wait_for_timeout(1500)
            v_body = await v_page.locator("body").inner_text()
            rbac_safe = "45,00,000" not in v_body and "4500000" not in v_body
            # Test switching tabs inside Vendor Project Detail
            for tab_lbl in ["Updates", "Bills", "Documents", "Overview"]:
                tab_btn = v_page.locator(f'button:has-text("{tab_lbl}")').first
                if await tab_btn.count() > 0:
                    await tab_btn.click()
                    await v_page.wait_for_timeout(300)
            print(f"  Vendor Project Detail loaded | RBAC contractValue hidden: {rbac_safe}")
            results["Vendor Project Detail & RBAC"] = "PASS" if rbac_safe else "FAIL"
            await v_page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_deep_2_vendor_project_detail.png"))
        else:
            print("  [FAIL] Assigned project not visible in Vendor Projects")
            results["Vendor Project Detail & RBAC"] = "FAIL"

        # 2. Submit ₹5,200 cash bill and click "Request Cash"
        await v_page.locator("aside").first.locator('button:has-text("Invoices")').first.click()
        await v_page.wait_for_url("**/vendor/invoices**", timeout=10000)
        await v_page.wait_for_timeout(1500)

        await v_page.locator('button:has-text("Submit New Bill")').first.click()
        await v_page.wait_for_timeout(400)
        await v_page.locator('input[placeholder*="45000"]').fill(cash_amount)
        await v_page.locator('input[placeholder*="Tile Vendor"]').fill(cash_trade)
        await v_page.locator('form button[type="submit"]:has-text("Submit Bill")').click()
        await v_page.wait_for_timeout(2000)

        cash_row = v_page.locator("tr", has_text=cash_trade).first
        if await cash_row.is_visible():
            await cash_row.locator('button:has-text("Request Cash")').click()
            await v_page.wait_for_timeout(2000)
            updated_row_txt = await v_page.locator("tr", has_text=cash_trade).first.inner_text()
            cash_requested_ok = "CASH REQUESTED" in updated_row_txt
            print(f"  Vendor Request Cash -> CASH REQUESTED: {cash_requested_ok}")
            results["Vendor Request Cash"] = "PASS" if cash_requested_ok else "FAIL"
        else:
            results["Vendor Request Cash"] = "FAIL (bill row missing)"

        await v_ctx.close()

        # -----------------------------------------------------
        # FLOW C: CLIENT WORKSPACE, CASH APPROVE & SUPPORT TICKET
        # -----------------------------------------------------
        print("\n=======================================================")
        print("  FLOW C: CLIENT WORKSPACE, CASH APPROVAL & SUPPORT")
        print("=======================================================")
        c_ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        c_page = await c_ctx.new_page()
        c_page.on("pageerror", lambda e: (print(f"[Client PageError]: {e}"), page_errors.append(str(e))))

        await c_page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await c_page.wait_for_timeout(600)
        await c_page.locator('button:has-text("Client")').click()
        await c_page.fill('input[type="text"]', "client_user")
        await c_page.fill('input[type="password"]', "Password123!")
        await c_page.click('button[type="submit"]')
        await c_page.wait_for_url("**/client**", timeout=10000)

        # 1. Open Client Project Detail -> Approve Cash Request
        await c_page.locator("aside").first.locator('button:has-text("My Projects")').click()
        await c_page.wait_for_url("**/client/projects**", timeout=10000)
        await c_page.wait_for_timeout(1500)

        c_proj = c_page.locator("article", has_text="Atelier Lumiere Residence").first
        if await c_proj.is_visible():
            await c_proj.locator('button:has-text("Open Project Workspace")').click()
            await c_page.wait_for_url("**/client/projects/**", timeout=10000)
            await c_page.wait_for_timeout(2000)

            cash_item = c_page.locator("div.py-4", has_text=cash_trade).filter(
                has=c_page.locator('button:has-text("Approve Cash")')
            ).first
            has_cash_item = await cash_item.is_visible()
            print(f"  Client Project Workspace loaded | Found Cash Request ({cash_trade}): {has_cash_item}")
            if has_cash_item:
                await cash_item.locator('button:has-text("Approve Cash")').click()
                await c_page.wait_for_timeout(2500)
                c_body = await c_page.locator("body").inner_text()
                cash_approved_ok = "PAID_CASH" in c_body or "Cash payment approved" in c_body
                print(f"  Client Approved Cash -> PAID_CASH reflected: {cash_approved_ok}")
                results["Client Cash Approval"] = "PASS" if cash_approved_ok else "FAIL"
            else:
                results["Client Cash Approval"] = "FAIL (Approve Cash item missing)"
            await c_page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_deep_3_client_project_cash.png"))
        else:
            results["Client Cash Approval"] = "FAIL (client project not visible)"

        # 2. Submit Support Ticket & verify persistence across reload
        await c_page.locator("aside").first.locator('button:has-text("Help & Support")').click()
        await c_page.wait_for_url("**/client/support**", timeout=10000)
        await c_page.wait_for_timeout(1500)

        await c_page.locator('button:has-text("New Support Inquiry")').click()
        await c_page.wait_for_timeout(500)
        await c_page.locator('input[placeholder*="Living Room"]').fill(support_subject)
        await c_page.locator('textarea[placeholder*="Provide specific details"]').fill(
            "Verifying client support ticket creation, backend API submission, and DB persistence across page reloads."
        )
        await c_page.locator('button[type="submit"]:has-text("Submit Inquiry")').click()
        await c_page.wait_for_timeout(2500)

        await c_page.reload(wait_until="domcontentloaded")
        await c_page.wait_for_timeout(1500)
        ticket_persisted = await c_page.locator(f'text="{support_subject}"').first.is_visible()
        print(f"  Client Support Ticket persisted after reload: {ticket_persisted}")
        results["Client Support Ticket"] = "PASS" if ticket_persisted else "FAIL"
        await c_page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_deep_4_client_support_ticket.png"))
        await c_ctx.close()

        # -----------------------------------------------------
        # FLOW D: VERIFY VENDOR SEES PAID (CASH) + ADMIN LEADS & PROJECT DETAIL
        # -----------------------------------------------------
        print("\n=======================================================")
        print("  FLOW D: VENDOR CASH PAID + ADMIN LEADS & PROJECT DETAIL")
        print("=======================================================")
        v2_ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        v2_page = await v2_ctx.new_page()
        await v2_page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await v2_page.wait_for_timeout(500)
        await v2_page.locator('button:has-text("Vendor")').click()
        await v2_page.fill('input[type="text"]', "vendor_user")
        await v2_page.fill('input[type="password"]', "Password123!")
        await v2_page.click('button[type="submit"]')
        await v2_page.wait_for_url("**/vendor**", timeout=10000)
        await v2_page.locator("aside").first.locator('button:has-text("Invoices")').first.click()
        await v2_page.wait_for_url("**/vendor/invoices**", timeout=10000)
        await v2_page.wait_for_timeout(1500)
        v_cash_txt = await v2_page.locator("tr", has_text=cash_trade).first.inner_text()
        v_paid_cash = "PAID (CASH)" in v_cash_txt and "Settled" in v_cash_txt
        print(f"  Vendor reflects PAID (CASH): {v_paid_cash}")
        results["Vendor Cash Settled Reflection"] = "PASS" if v_paid_cash else "FAIL"
        await v2_ctx.close()

        a_ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        a_page = await a_ctx.new_page()
        a_page.on("pageerror", lambda e: (print(f"[Admin PageError]: {e}"), page_errors.append(str(e))))

        await a_page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await a_page.wait_for_timeout(600)
        await a_page.locator('button:has-text("Studio")').first.click()
        await a_page.fill('input[type="text"]', "admin")
        await a_page.fill('input[type="password"]', "Password123!")
        await a_page.click('button[type="submit"]')
        await a_page.wait_for_url("**/admin**", timeout=10000)

        # 1. Verify Public Lead arrived in /admin/leads
        await a_page.locator("aside").first.locator('button:has-text("Enquiries & Leads")').click()
        await a_page.wait_for_url("**/admin/leads**", timeout=10000)
        await a_page.wait_for_timeout(1500)
        lead_arrived = await a_page.locator(f'text="{lead_name}"').first.is_visible()
        print(f"  Admin sees newly submitted lead ({lead_name}): {lead_arrived}")
        results["Admin Sees Public Lead"] = "PASS" if lead_arrived else "FAIL"
        await a_page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_deep_5_admin_new_lead.png"))

        # 2. Verify Admin Project Detail workspace
        await a_page.locator("aside").first.locator('button:has-text("Projects")').click()
        await a_page.wait_for_url("**/admin/projects**", timeout=10000)
        await a_page.wait_for_timeout(1500)
        a_proj = a_page.locator('article', has_text="Atelier Lumiere Residence").first
        if await a_proj.count() > 0:
            open_btn = a_proj.locator('button:has-text("Open"), button:has-text("View"), a').first
            if await open_btn.count() > 0:
                await open_btn.click()
            else:
                await a_proj.click()
            await a_page.wait_for_timeout(2000)
            a_proj_ok = "/admin/projects/" in a_page.url
            print(f"  Admin Project Detail URL: {a_page.url} -> {a_proj_ok}")
            results["Admin Project Detail"] = "PASS" if a_proj_ok else "FAIL"
            await a_page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_deep_6_admin_project_detail.png"))
        else:
            results["Admin Project Detail"] = "FAIL (project card missing)"

        await a_ctx.close()
        await browser.close()

    print("\n=======================================================")
    print("  DEEP WORKFLOWS TEST SUMMARY")
    print("=======================================================")
    all_pass = True
    for k, v in results.items():
        flag = "[OK]" if v == "PASS" else "[FAIL]"
        print(f"  {flag} {k}: {v}")
        if v != "PASS":
            all_pass = False
    if page_errors:
        print(f"  [WARN] Uncaught PageErrors: {page_errors}")
        all_pass = False
    print("=======================================================")
    if not all_pass:
        sys.exit(1)
    print("  >>> ALL DEEP WORKFLOW CHECKS PASSED 100% <<<")


if __name__ == "__main__":
    asyncio.run(run_deep_workflows())
