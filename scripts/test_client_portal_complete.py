import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\darsh\.gemini\antigravity\brain\4d981890-1549-477d-bbf6-92a4eaa67c80"

async def test_client_portal():
    results = {}
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # Capture console messages and errors
        page.on("console", lambda msg: print(f"[Browser Console {msg.type}]: {msg.text}") if msg.type in ["error", "warning"] else None)
        page.on("pageerror", lambda err: print(f"[Browser PageError]: {err}"))

        print("\n=======================================================")
        print("  STEP 1: CLIENT LOGIN & DASHBOARD REDIRECTION")
        print("=======================================================")
        await page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await page.wait_for_timeout(1000)

        # Click Client Tab
        client_tab_btn = page.locator('button:has-text("Client")')
        await client_tab_btn.click()
        await page.wait_for_timeout(300)

        # Fill credentials
        await page.fill('input[type="text"]', "client_user")
        await page.fill('input[type="password"]', "Password123!")
        await page.click('button[type="submit"]')
        
        try:
            await page.wait_for_url("**/client**", timeout=10000)
            print("  [PASS] Successfully logged in and redirected to /client")
            results["Login"] = "PASS"
        except Exception as e:
            print(f"  [FAIL] Login redirect failed: {e}")
            results["Login"] = f"FAIL: {e}"

        await page.wait_for_timeout(2000)
        screenshot1 = os.path.join(ARTIFACT_DIR, "verified_client_overview.png")
        await page.screenshot(path=screenshot1)
        print(f"  Saved screenshot: {screenshot1}")

        print("\n=======================================================")
        print("  STEP 2: CLIENT SIDEBAR NAVIGATION & DISPUTES TAB CHECK")
        print("=======================================================")
        sidebar = page.locator("aside").first
        sidebar_text = await sidebar.inner_text()
        print("  Sidebar items present:")
        for line in sidebar_text.split("\n"):
            line = line.strip()
            if line and len(line) < 30 and line not in ["ARCHEON", "Design Studio", "Private Workspace", "Client Portal", "My Workspace"]:
                print(f"    - {line}")

        # Check Invariant: ZERO presence of "Disputes" in client portal
        has_disputes = "Dispute" in sidebar_text or "Disputes" in sidebar_text
        if not has_disputes:
            print("  [PASS] Invariant verified: NO 'Disputes' tab exists in client portal")
            results["Disputes Absence"] = "PASS"
        else:
            print("  [FAIL] 'Disputes' tab was found in client portal!")
            results["Disputes Absence"] = "FAIL"

        print("\n=======================================================")
        print("  STEP 3: NAVIGATE TO 'MY PROJECTS'")
        print("=======================================================")
        my_projects_btn = page.locator('aside').first.locator('button:has-text("My Projects")')
        await my_projects_btn.click()
        await page.wait_for_timeout(2000)
        current_url = page.url
        print(f"  Current URL: {current_url}")
        if "/client/projects" in current_url:
            print("  [PASS] Navigated to /client/projects")
            results["My Projects Nav"] = "PASS"
        else:
            print(f"  [FAIL] Expected /client/projects but got {current_url}")
            results["My Projects Nav"] = f"FAIL ({current_url})"

        screenshot_proj = os.path.join(ARTIFACT_DIR, "verified_client_projects_nav.png")
        await page.screenshot(path=screenshot_proj)

        print("\n=======================================================")
        print("  STEP 4: NAVIGATE TO 'DOCUMENT LIBRARY'")
        print("=======================================================")
        docs_btn = page.locator('aside').first.locator('button:has-text("Document Library")')
        await docs_btn.click()
        await page.wait_for_timeout(2000)
        current_url = page.url
        print(f"  Current URL: {current_url}")
        if "/client/documents" in current_url:
            print("  [PASS] Navigated to /client/documents")
            results["Document Library Nav"] = "PASS"
        else:
            print(f"  [FAIL] Expected /client/documents but got {current_url}")
            results["Document Library Nav"] = f"FAIL ({current_url})"

        screenshot_docs = os.path.join(ARTIFACT_DIR, "verified_client_documents_nav.png")
        await page.screenshot(path=screenshot_docs)

        print("\n=======================================================")
        print("  STEP 5: NAVIGATE TO 'INVOICES & BILLS' & TEST ACTIONS")
        print("=======================================================")
        invoices_btn = page.locator('aside').first.locator('button:has-text("Invoices & Bills")')
        await invoices_btn.click()
        await page.wait_for_timeout(2000)
        current_url = page.url
        print(f"  Current URL: {current_url}")
        if "/client/invoices" in current_url:
            print("  [PASS] Navigated to /client/invoices")
            results["Invoices Nav"] = "PASS"
        else:
            print(f"  [FAIL] Expected /client/invoices but got {current_url}")
            results["Invoices Nav"] = f"FAIL ({current_url})"

        # Check for View Invoice and Submit Payment Proof buttons
        view_inv_btns = page.locator('button:has-text("View Invoice")')
        view_inv_count = await view_inv_btns.count()
        print(f"  Found {view_inv_count} 'View Invoice' buttons")

        if view_inv_count > 0:
            print("  Testing 'View Invoice' modal...")
            await view_inv_btns.first.click()
            await page.wait_for_timeout(1000)
            modal_visible = await page.locator('#bill-photo-title').first.is_visible()
            print(f"  Modal 'Bill Document' open: {modal_visible}")
            
            # Close modal
            close_btn = page.locator('[role="dialog"] button:has-text("Close"), [role="dialog"] button[aria-label="Close"]').first
            if await close_btn.count() > 0:
                await close_btn.click()
                await page.wait_for_timeout(500)
                print("  Closed 'View Invoice' modal")
                results["View Invoice Modal"] = "PASS" if modal_visible else "FAIL"
        else:
            results["View Invoice Modal"] = "N/A (No invoices with attachments)"

        # Check Submit Payment Proof
        proof_btns = page.locator('button:has-text("Submit Payment Proof")')
        proof_count = await proof_btns.count()
        print(f"  Found {proof_count} 'Submit Payment Proof' buttons")
        if proof_count > 0:
            print("  Testing 'Submit Payment Proof' modal...")
            await proof_btns.first.click()
            await page.wait_for_timeout(1000)
            drawer_visible = await page.locator('#payment-proof-title').first.is_visible()
            print(f"  Modal visible: {drawer_visible}")
            results["Submit Payment Proof Modal"] = "PASS" if drawer_visible else "FAIL"

            # Close modal
            close_drawer_btn = page.locator('[role="dialog"] button[aria-label="Close"], [role="dialog"] button:has-text("Cancel")').first
            if await close_drawer_btn.count() > 0:
                await close_drawer_btn.click()
                await page.wait_for_timeout(500)
                print("  Closed Payment Proof modal")
        else:
            results["Submit Payment Proof Modal"] = "N/A (No outstanding invoices)"

        screenshot_inv = os.path.join(ARTIFACT_DIR, "verified_client_invoices_nav.png")
        await page.screenshot(path=screenshot_inv)

        print("\n=======================================================")
        print("  STEP 6: NAVIGATE TO 'PAYMENT RECORDS'")
        print("=======================================================")
        payments_btn = page.locator('aside').first.locator('button:has-text("Payment Records")')
        await payments_btn.click()
        await page.wait_for_timeout(2000)
        current_url = page.url
        print(f"  Current URL: {current_url}")
        if "tab=payments" in current_url:
            print("  [PASS] Navigated to /client/invoices?tab=payments")
            results["Payment Records Nav"] = "PASS"
        else:
            print(f"  [FAIL] Expected tab=payments in URL: {current_url}")
            results["Payment Records Nav"] = f"FAIL ({current_url})"

        screenshot_pay = os.path.join(ARTIFACT_DIR, "verified_client_payment_records_nav.png")
        await page.screenshot(path=screenshot_pay)

        print("\n=======================================================")
        print("  STEP 7: NAVIGATE TO 'NOTIFICATIONS'")
        print("=======================================================")
        notif_btn = page.locator('aside').first.locator('button:has-text("Notifications")')
        await notif_btn.click()
        await page.wait_for_timeout(2000)
        current_url = page.url
        print(f"  Current URL: {current_url}")
        if "/client/notifications" in current_url:
            print("  [PASS] Navigated to /client/notifications")
            results["Notifications Nav"] = "PASS"
        else:
            print(f"  [FAIL] Expected /client/notifications but got {current_url}")
            results["Notifications Nav"] = f"FAIL ({current_url})"

        screenshot_notif = os.path.join(ARTIFACT_DIR, "verified_client_notifications_nav.png")
        await page.screenshot(path=screenshot_notif)

        print("\n=======================================================")
        print("  STEP 8: NAVIGATE TO 'HELP & SUPPORT'")
        print("=======================================================")
        support_btn = page.locator('aside').first.locator('button:has-text("Help & Support")')
        await support_btn.click()
        await page.wait_for_timeout(2000)
        current_url = page.url
        print(f"  Current URL: {current_url}")
        if "/client/support" in current_url:
            print("  [PASS] Navigated to /client/support")
            results["Help & Support Nav"] = "PASS"
        else:
            print(f"  [FAIL] Expected /client/support but got {current_url}")
            results["Help & Support Nav"] = f"FAIL ({current_url})"

        screenshot_supp = os.path.join(ARTIFACT_DIR, "verified_client_support_nav.png")
        await page.screenshot(path=screenshot_supp)

        print("\n=======================================================")
        print("  STEP 9: NAVIGATE TO 'ACCOUNT SETTINGS'")
        print("=======================================================")
        profile_btn = page.locator('aside').first.locator('button:has-text("Account Settings")')
        await profile_btn.click()
        await page.wait_for_timeout(2000)
        current_url = page.url
        print(f"  Current URL: {current_url}")
        if "/client/profile" in current_url:
            print("  [PASS] Navigated to /client/profile")
            results["Account Settings Nav"] = "PASS"
        else:
            print(f"  [FAIL] Expected /client/profile but got {current_url}")
            results["Account Settings Nav"] = f"FAIL ({current_url})"

        screenshot_prof = os.path.join(ARTIFACT_DIR, "verified_client_profile_nav.png")
        await page.screenshot(path=screenshot_prof)

        print("\n=======================================================")
        print("  STEP 10: TEST SIGN OUT CONFIRMATION DIALOG")
        print("=======================================================")
        signout_btn = page.locator('aside').first.locator('button:has-text("Sign Out")')
        await signout_btn.click()
        await page.wait_for_timeout(500)

        dialog_heading = page.locator('#client-logout-title')
        dialog_visible = await dialog_heading.is_visible()
        print(f"  Sign out dialog visible: {dialog_visible}")

        # Click Stay Signed In
        stay_btn = page.locator('button:has-text("Stay Signed In")')
        await stay_btn.click()
        await page.wait_for_timeout(500)
        dialog_visible_after = await dialog_heading.is_visible()
        print(f"  Dialog dismissed after 'Stay Signed In': {not dialog_visible_after}")

        # Now test actual sign out
        await signout_btn.click()
        await page.wait_for_timeout(500)
        confirm_btn = page.locator('button:has-text("Confirm Sign Out")')
        await confirm_btn.click()
        await page.wait_for_timeout(2000)
        after_logout_url = page.url
        print(f"  URL after confirming sign out: {after_logout_url}")
        if "/login" in after_logout_url:
            print("  [PASS] Successfully logged out and returned to /login")
            results["Sign Out Flow"] = "PASS"
        else:
            print(f"  [FAIL] Expected /login but got {after_logout_url}")
            results["Sign Out Flow"] = f"FAIL ({after_logout_url})"

        screenshot_logout = os.path.join(ARTIFACT_DIR, "verified_client_after_logout.png")
        await page.screenshot(path=screenshot_logout)

        await browser.close()

    print("\n=======================================================")
    print("  CLIENT PORTAL TEST SUMMARY")
    print("=======================================================")
    all_pass = True
    for test_name, res in results.items():
        status_flag = "[OK]" if "PASS" in res else "[FAIL]"
        print(f"  {status_flag} {test_name}: {res}")
        if "FAIL" in res:
            all_pass = False

    print("=======================================================")
    if all_pass:
        print("  >>> ALL 10 CLIENT PORTAL TESTS PASSED 100% <<<")
    else:
        print("  >>> SOME TESTS FAILED - SEE ABOVE <<<")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_client_portal())
