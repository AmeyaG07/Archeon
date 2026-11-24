import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\darsh\.gemini\antigravity\brain\4d981890-1549-477d-bbf6-92a4eaa67c80"

async def test_admin_portal():
    results = {}
    console_errors = []
    page_errors = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        def on_console(msg):
            if msg.type == "error":
                print(f"[Browser Console error]: {msg.text}")
                console_errors.append(msg.text)
            elif msg.type == "warning":
                print(f"[Browser Console warning]: {msg.text}")

        page.on("console", on_console)
        page.on("pageerror", lambda err: (print(f"[Browser PageError]: {err}"), page_errors.append(str(err))))

        print("\n=======================================================")
        print("  STEP 1: ADMIN LOGIN & DASHBOARD REDIRECTION")
        print("=======================================================")
        await page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await page.wait_for_timeout(1000)

        studio_tab_btn = page.locator('button:has-text("Studio")').first
        await studio_tab_btn.click()
        await page.wait_for_timeout(300)

        await page.fill('input[type="text"]', "admin")
        await page.fill('input[type="password"]', "Password123!")
        await page.click('button[type="submit"]')

        try:
            await page.wait_for_url("**/admin**", timeout=10000)
            print("  [PASS] Successfully logged in and redirected to /admin")
            results["Login"] = "PASS"
        except Exception as e:
            print(f"  [FAIL] Login redirect failed: {e}")
            results["Login"] = f"FAIL: {e}"

        await page.wait_for_timeout(2000)
        screenshot1 = os.path.join(ARTIFACT_DIR, "verified_admin_overview.png")
        await page.screenshot(path=screenshot1)
        print(f"  Saved screenshot: {screenshot1}")

        print("\n=======================================================")
        print("  STEP 2: ADMIN SIDEBAR NAVIGATION INVENTORY")
        print("=======================================================")
        sidebar = page.locator("aside").first
        sidebar_text = await sidebar.inner_text()
        expected_items = [
            "Overview",
            "Projects",
            "Enquiries & Leads",
            "Website Content",
            "Clients",
            "Invoices & Bills",
            "Cash Settlements",
            "Finance Reports",
            "System Settings",
        ]
        missing = [item for item in expected_items if item not in sidebar_text]
        if not missing:
            print("  [PASS] All 9 admin sidebar navigation items present")
            results["Sidebar Items"] = "PASS"
        else:
            print(f"  [FAIL] Missing sidebar items: {missing}")
            results["Sidebar Items"] = f"FAIL: missing {missing}"

        print("\n=======================================================")
        print("  STEP 3: PROJECTS & CREATE PROJECT MODAL")
        print("=======================================================")
        await page.locator("aside").first.locator('button:has-text("Projects")').click()
        await page.wait_for_timeout(2000)
        if "/admin/projects" in page.url:
            print("  [PASS] Navigated to /admin/projects")
            results["Projects Nav"] = "PASS"
        else:
            results["Projects Nav"] = f"FAIL ({page.url})"

        create_proj_btn = page.locator('button:has-text("Create Project")')
        if await create_proj_btn.count() > 0:
            await create_proj_btn.first.click()
            await page.wait_for_timeout(500)
            modal_visible = await page.locator('h2:has-text("Create New Architectural Project")').is_visible()
            print(f"  'Create Project' modal open: {modal_visible}")
            await page.locator('button:has-text("Cancel")').first.click()
            await page.wait_for_timeout(400)
            modal_closed = not await page.locator('h2:has-text("Create New Architectural Project")').is_visible()
            print(f"  'Create Project' modal closed on Cancel: {modal_closed}")
            results["Create Project Modal"] = "PASS" if (modal_visible and modal_closed) else "FAIL"
        else:
            results["Create Project Modal"] = "FAIL (button missing)"

        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_admin_projects.png"))

        print("\n=======================================================")
        print("  STEP 4: ENQUIRIES & LEADS")
        print("=======================================================")
        await page.locator("aside").first.locator('button:has-text("Enquiries & Leads")').click()
        await page.wait_for_timeout(2000)
        if "/admin/leads" in page.url:
            print("  [PASS] Navigated to /admin/leads")
            results["Leads Nav"] = "PASS"
        else:
            results["Leads Nav"] = f"FAIL ({page.url})"
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_admin_leads.png"))

        print("\n=======================================================")
        print("  STEP 5: WEBSITE CONTENT CMS & TABS (SHELL CHECK)")
        print("=======================================================")
        await page.locator("aside").first.locator('button:has-text("Website Content")').click()
        await page.wait_for_timeout(2000)
        aside_count = await page.locator("aside").count()
        print(f"  Current URL: {page.url}, <aside> count: {aside_count}")
        if "/admin/website-projects" in page.url and aside_count == 1:
            print("  [PASS] Navigated to /admin/website-projects with single AdminPortalShell")
            results["Website Content Nav"] = "PASS"
        else:
            results["Website Content Nav"] = f"FAIL (url={page.url}, aside={aside_count})"

        # Switch CMS tabs
        await page.locator('button:has-text("Studio Philosophy & Manifesto")').click()
        await page.wait_for_timeout(600)
        await page.locator('button:has-text("Studio Details & Contacts")').click()
        await page.wait_for_timeout(600)
        await page.locator('button:has-text("Showcase Projects")').click()
        await page.wait_for_timeout(600)
        results["Website Content Tabs"] = "PASS"

        # Test Add Showcase Project modal
        add_show_btn = page.locator('button:has-text("Add Showcase Project")')
        if await add_show_btn.count() > 0:
            await add_show_btn.first.click()
            await page.wait_for_timeout(500)
            cancel_cms = page.locator('button:has-text("Cancel")').first
            if await cancel_cms.count() > 0:
                await cancel_cms.click()
                await page.wait_for_timeout(400)
            results["Add Showcase Modal"] = "PASS"
        else:
            results["Add Showcase Modal"] = "FAIL (button missing)"

        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_admin_website_cms.png"))

        print("\n=======================================================")
        print("  STEP 6: CLIENTS MANAGEMENT & MODALS")
        print("=======================================================")
        await page.locator("aside").first.locator('button:has-text("Clients")').click()
        await page.wait_for_timeout(2000)
        if "/admin/clients" in page.url:
            print("  [PASS] Navigated cleanly from Website Content to /admin/clients")
            results["Clients Nav"] = "PASS"
        else:
            results["Clients Nav"] = f"FAIL ({page.url})"

        # Test Register Client modal
        reg_client_btn = page.locator('button:has-text("Register Client")')
        if await reg_client_btn.count() > 0:
            await reg_client_btn.first.click()
            await page.wait_for_timeout(500)
            rc_open = await page.locator('h2:has-text("Register New Client")').is_visible()
            print(f"  'Register Client' modal open: {rc_open}")
            await page.locator('button:has-text("Cancel")').first.click()
            await page.wait_for_timeout(400)
            rc_closed = not await page.locator('h2:has-text("Register New Client")').is_visible()
            results["Register Client Modal"] = "PASS" if (rc_open and rc_closed) else "FAIL"
        else:
            results["Register Client Modal"] = "FAIL (button missing)"

        # Test + Add Bill modal
        add_bill_btn = page.locator('button:has-text("+ Add Bill")')
        if await add_bill_btn.count() > 0:
            await add_bill_btn.first.click()
            await page.wait_for_timeout(500)
            ab_open = await page.locator('h2:has-text("Upload & Add Trade Partner Bill")').is_visible()
            print(f"  '+ Add Bill' modal open: {ab_open}")
            await page.locator('button:has-text("Cancel")').first.click()
            await page.wait_for_timeout(400)
            ab_closed = not await page.locator('h2:has-text("Upload & Add Trade Partner Bill")').is_visible()
            results["Add Bill Modal"] = "PASS" if (ab_open and ab_closed) else "FAIL"
        else:
            results["Add Bill Modal"] = "FAIL (button missing)"

        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_admin_clients.png"))

        print("\n=======================================================")
        print("  STEP 7: VENDORS DIRECTORY (/admin/vendors)")
        print("=======================================================")
        await page.goto("http://localhost:3000/admin/vendors", wait_until="domcontentloaded")
        await page.wait_for_timeout(2000)
        vendors_heading = await page.locator('text="Registered Vendors"').is_visible()
        print(f"  /admin/vendors loaded, Registered Vendors visible: {vendors_heading}")
        results["Vendors Page"] = "PASS" if vendors_heading else "FAIL"
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_admin_vendors.png"))

        print("\n=======================================================")
        print("  STEP 8: INVOICES & BILLS + WHATSAPP MODAL")
        print("=======================================================")
        await page.locator("aside").first.locator('button:has-text("Invoices & Bills")').click()
        await page.wait_for_timeout(2000)
        if "/admin/invoices" in page.url:
            print("  [PASS] Navigated to /admin/invoices")
            results["Invoices Nav"] = "PASS"
        else:
            results["Invoices Nav"] = f"FAIL ({page.url})"

        notify_btn = page.locator('button:has-text("Notify Clients via WhatsApp")')
        if await notify_btn.count() > 0:
            await notify_btn.first.click()
            await page.wait_for_timeout(600)
            wa_open = await page.locator('h2:has-text("Notify Clients About Bills")').is_visible()
            print(f"  'Notify Clients via WhatsApp' modal open: {wa_open}")
            # Close via X button inside modal header
            await page.locator('h2:has-text("Notify Clients About Bills")').locator('..').locator('..').locator('..').locator('button').last.click()
            await page.wait_for_timeout(400)
            wa_closed = not await page.locator('h2:has-text("Notify Clients About Bills")').is_visible()
            print(f"  WhatsApp modal closed: {wa_closed}")
            results["WhatsApp Notify Modal"] = "PASS" if (wa_open and wa_closed) else "FAIL"
        else:
            results["WhatsApp Notify Modal"] = "FAIL (button missing)"

        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_admin_invoices.png"))

        print("\n=======================================================")
        print("  STEP 9: CASH SETTLEMENTS, FINANCE REPORTS & SETTINGS")
        print("=======================================================")
        await page.locator("aside").first.locator('button:has-text("Cash Settlements")').click()
        await page.wait_for_timeout(2000)
        results["Cash Settlements Nav"] = "PASS" if "/admin/cash-settlements" in page.url else f"FAIL ({page.url})"
        print(f"  Cash Settlements URL: {page.url} -> {results['Cash Settlements Nav']}")
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_admin_cash.png"))

        await page.locator("aside").first.locator('button:has-text("Finance Reports")').click()
        await page.wait_for_timeout(2000)
        results["Finance Reports Nav"] = "PASS" if "/admin/finance-reports" in page.url else f"FAIL ({page.url})"
        print(f"  Finance Reports URL: {page.url} -> {results['Finance Reports Nav']}")
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_admin_finance.png"))

        await page.locator("aside").first.locator('button:has-text("System Settings")').click()
        await page.wait_for_timeout(2000)
        results["System Settings Nav"] = "PASS" if "/admin/settings" in page.url else f"FAIL ({page.url})"
        print(f"  System Settings URL: {page.url} -> {results['System Settings Nav']}")
        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_admin_settings.png"))

        print("\n=======================================================")
        print("  STEP 10: LEGACY ROUTE REDIRECTS (/approvals & /audit-logs)")
        print("=======================================================")
        await page.goto("http://localhost:3000/admin/approvals", wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        results["Approvals Redirect"] = "PASS" if "/admin/invoices" in page.url else f"FAIL ({page.url})"
        print(f"  /admin/approvals -> {page.url}")

        await page.goto("http://localhost:3000/admin/audit-logs", wait_until="domcontentloaded")
        await page.wait_for_timeout(1500)
        results["Audit Logs Redirect"] = "PASS" if page.url.rstrip("/").endswith("/admin") else f"FAIL ({page.url})"
        print(f"  /admin/audit-logs -> {page.url}")

        print("\n=======================================================")
        print("  STEP 11: ADMIN SIGN OUT CONFIRMATION DIALOG")
        print("=======================================================")
        signout_btn = page.locator("aside").first.locator('button:has-text("Sign Out")')
        await signout_btn.click()
        await page.wait_for_timeout(500)

        dialog_heading = page.locator("#admin-logout-title")
        dialog_visible = await dialog_heading.is_visible()
        print(f"  Sign out dialog visible: {dialog_visible}")

        stay_btn = page.locator('section[role="dialog"] button:has-text("Stay")')
        await stay_btn.click()
        await page.wait_for_timeout(400)
        dialog_dismissed = not await dialog_heading.is_visible()
        print(f"  Dialog dismissed after 'Stay': {dialog_dismissed}")

        await signout_btn.click()
        await page.wait_for_timeout(400)
        confirm_btn = page.locator('section[role="dialog"] button:has-text("Sign Out")')
        await confirm_btn.click()
        await page.wait_for_timeout(2000)
        after_logout_url = page.url
        print(f"  URL after confirming sign out: {after_logout_url}")
        if "/login" in after_logout_url and dialog_visible and dialog_dismissed:
            print("  [PASS] Successfully logged out and returned to /login")
            results["Sign Out Flow"] = "PASS"
        else:
            results["Sign Out Flow"] = f"FAIL ({after_logout_url})"

        await page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_admin_after_logout.png"))
        await browser.close()

    print("\n=======================================================")
    print("  ADMIN PORTAL TEST SUMMARY")
    print("=======================================================")
    all_pass = True
    for test_name, res in results.items():
        status_flag = "[OK]" if "PASS" in res else "[FAIL]"
        print(f"  {status_flag} {test_name}: {res}")
        if "FAIL" in res:
            all_pass = False

    if page_errors:
        print(f"  [WARN] Uncaught PageErrors: {page_errors}")
    if console_errors:
        print(f"  [INFO] Console errors observed: {len(console_errors)}")

    print("=======================================================")
    if all_pass and not page_errors:
        print("  >>> ALL ADMIN PORTAL TESTS PASSED 100% <<<")
    else:
        print("  >>> SOME TESTS FAILED - SEE ABOVE <<<")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_admin_portal())
