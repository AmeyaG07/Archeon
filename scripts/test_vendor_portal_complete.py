import asyncio
import os
import sys
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\darsh\.gemini\antigravity\brain\4d981890-1549-477d-bbf6-92a4eaa67c80"

async def test_vendor_portal():
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
        print("  STEP 1: VENDOR LOGIN & DASHBOARD REDIRECTION")
        print("=======================================================")
        await page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await page.wait_for_timeout(1000)

        vendor_tab_btn = page.locator('button:has-text("Vendor")')
        await vendor_tab_btn.click()
        await page.wait_for_timeout(300)

        await page.fill('input[type="text"]', "vendor_user")
        await page.fill('input[type="password"]', "Password123!")
        await page.click('button[type="submit"]')

        try:
            await page.wait_for_url("**/vendor**", timeout=10000)
            print("  [PASS] Successfully logged in and redirected to /vendor")
            results["Login"] = "PASS"
        except Exception as e:
            print(f"  [FAIL] Login redirect failed: {e}")
            results["Login"] = f"FAIL: {e}"

        await page.wait_for_timeout(2000)
        screenshot1 = os.path.join(ARTIFACT_DIR, "verified_vendor_overview.png")
        await page.screenshot(path=screenshot1)
        print(f"  Saved screenshot: {screenshot1}")

        print("\n=======================================================")
        print("  STEP 2: VENDOR SIDEBAR NAVIGATION & CHECKS")
        print("=======================================================")
        sidebar = page.locator("aside").first
        sidebar_text = await sidebar.inner_text()
        print("  Sidebar items present:")
        for line in sidebar_text.split("\n"):
            line = line.strip()
            if line and len(line) < 35 and line not in ["ARCHEON", "Design Studio", "Trade & Subcontractor Portal", "Vendor Portal"]:
                print(f"    - {line}")

        expected_items = [
            "Overview",
            "Assigned Projects",
            "Invoices",
            "Cash Settlements",
            "Payment History",
            "Notifications",
            "Help & Support",
            "Account Settings",
        ]
        missing = [item for item in expected_items if item not in sidebar_text]
        if not missing:
            print("  [PASS] All 8 vendor sidebar navigation items present")
            results["Sidebar Items"] = "PASS"
        else:
            print(f"  [FAIL] Missing sidebar items: {missing}")
            results["Sidebar Items"] = f"FAIL: missing {missing}"

        print("\n=======================================================")
        print("  STEP 3: NAVIGATE TO 'ASSIGNED PROJECTS'")
        print("=======================================================")
        await page.locator("aside").first.locator('button:has-text("Assigned Projects")').click()
        await page.wait_for_timeout(2000)
        current_url = page.url
        print(f"  Current URL: {current_url}")
        if "/vendor/projects" in current_url:
            print("  [PASS] Navigated to /vendor/projects")
            results["Assigned Projects Nav"] = "PASS"
        else:
            print(f"  [FAIL] Expected /vendor/projects but got {current_url}")
            results["Assigned Projects Nav"] = f"FAIL ({current_url})"

        screenshot_proj = os.path.join(ARTIFACT_DIR, "verified_vendor_projects_nav.png")
        await page.screenshot(path=screenshot_proj)

        print("\n=======================================================")
        print("  STEP 4: NAVIGATE TO 'INVOICES' & TEST MODALS")
        print("=======================================================")
        await page.locator("aside").first.locator('button:has-text("Invoices")').first.click()
        await page.wait_for_timeout(2000)
        current_url = page.url
        print(f"  Current URL: {current_url}")
        if "/vendor/invoices" in current_url:
            print("  [PASS] Navigated to /vendor/invoices")
            results["Invoices Nav"] = "PASS"
        else:
            print(f"  [FAIL] Expected /vendor/invoices but got {current_url}")
            results["Invoices Nav"] = f"FAIL ({current_url})"

        # Test "Submit New Bill" modal
        submit_bill_btn = page.locator('button:has-text("Submit New Bill")')
        if await submit_bill_btn.count() > 0:
            await submit_bill_btn.first.click()
            await page.wait_for_timeout(600)
            modal_open = await page.locator('h2:has-text("Upload Bill for Client")').is_visible()
            print(f"  'Submit New Bill' modal open: {modal_open}")
            results["Submit Bill Modal"] = "PASS" if modal_open else "FAIL"

            # Close via Cancel button
            cancel_btn = page.locator('button:has-text("Cancel")').first
            await cancel_btn.click()
            await page.wait_for_timeout(400)
            modal_closed = not await page.locator('h2:has-text("Upload Bill for Client")').is_visible()
            print(f"  'Submit New Bill' modal closed on Cancel: {modal_closed}")
            if not modal_closed:
                results["Submit Bill Modal"] = "FAIL (did not close)"
        else:
            print("  [FAIL] 'Submit New Bill' button not found")
            results["Submit Bill Modal"] = "FAIL (button missing)"

        # Test "Send Architect Update" modal
        arch_update_btn = page.locator('button:has-text("Send Architect Update")')
        if await arch_update_btn.count() > 0:
            await arch_update_btn.first.click()
            await page.wait_for_timeout(600)
            upd_open = await page.locator('h2:has-text("Send Site Note or Photo to Architect")').is_visible()
            print(f"  'Send Architect Update' modal open: {upd_open}")
            results["Architect Update Modal"] = "PASS" if upd_open else "FAIL"

            cancel_btn = page.locator('button:has-text("Cancel")').first
            await cancel_btn.click()
            await page.wait_for_timeout(400)
            upd_closed = not await page.locator('h2:has-text("Send Site Note or Photo to Architect")').is_visible()
            print(f"  'Send Architect Update' modal closed on Cancel: {upd_closed}")
            if not upd_closed:
                results["Architect Update Modal"] = "FAIL (did not close)"
        else:
            print("  [FAIL] 'Send Architect Update' button not found")
            results["Architect Update Modal"] = "FAIL (button missing)"

        screenshot_inv = os.path.join(ARTIFACT_DIR, "verified_vendor_invoices_nav.png")
        await page.screenshot(path=screenshot_inv)

        print("\n=======================================================")
        print("  STEP 5: NAVIGATE TO 'CASH SETTLEMENTS'")
        print("=======================================================")
        await page.locator("aside").first.locator('button:has-text("Cash Settlements")').click()
        await page.wait_for_timeout(2000)
        current_url = page.url
        print(f"  Current URL: {current_url}")
        if "/vendor/cash-settlements" in current_url:
            print("  [PASS] Navigated to /vendor/cash-settlements")
            results["Cash Settlements Nav"] = "PASS"
        else:
            print(f"  [FAIL] Expected /vendor/cash-settlements but got {current_url}")
            results["Cash Settlements Nav"] = f"FAIL ({current_url})"

        screenshot_cash = os.path.join(ARTIFACT_DIR, "verified_vendor_cash_nav.png")
        await page.screenshot(path=screenshot_cash)

        print("\n=======================================================")
        print("  STEP 6: NAVIGATE TO 'PAYMENT HISTORY'")
        print("=======================================================")
        await page.locator("aside").first.locator('button:has-text("Payment History")').click()
        await page.wait_for_timeout(2000)
        current_url = page.url
        print(f"  Current URL: {current_url}")
        if "tab=payments" in current_url:
            print("  [PASS] Navigated to /vendor/invoices?tab=payments")
            results["Payment History Nav"] = "PASS"
        else:
            print(f"  [FAIL] Expected tab=payments in URL: {current_url}")
            results["Payment History Nav"] = f"FAIL ({current_url})"

        # Test "Open Cash Settlements Vouchers" CTA inside Payment History
        vouchers_btn = page.locator('button:has-text("Open Cash Settlements Vouchers")')
        if await vouchers_btn.count() > 0:
            await vouchers_btn.first.click()
            await page.wait_for_timeout(1500)
            if "/vendor/cash-settlements" in page.url:
                print("  [PASS] 'Open Cash Settlements Vouchers' button navigated to /vendor/cash-settlements")
                results["Payment History Voucher CTA"] = "PASS"
            else:
                print(f"  [FAIL] Expected /vendor/cash-settlements, got {page.url}")
                results["Payment History Voucher CTA"] = "FAIL"
            # Return to Payment History to continue sidebar flow
            await page.locator("aside").first.locator('button:has-text("Payment History")').click()
            await page.wait_for_timeout(1000)
        else:
            results["Payment History Voucher CTA"] = "FAIL (button missing)"

        screenshot_pay = os.path.join(ARTIFACT_DIR, "verified_vendor_payment_history_nav.png")
        await page.screenshot(path=screenshot_pay)

        print("\n=======================================================")
        print("  STEP 7: NAVIGATE TO 'NOTIFICATIONS'")
        print("=======================================================")
        await page.locator("aside").first.locator('button:has-text("Notifications")').click()
        await page.wait_for_timeout(2000)
        current_url = page.url
        print(f"  Current URL: {current_url}")
        if "/vendor/notifications" in current_url:
            print("  [PASS] Navigated to /vendor/notifications")
            results["Notifications Nav"] = "PASS"
        else:
            print(f"  [FAIL] Expected /vendor/notifications but got {current_url}")
            results["Notifications Nav"] = f"FAIL ({current_url})"

        screenshot_notif = os.path.join(ARTIFACT_DIR, "verified_vendor_notifications_nav.png")
        await page.screenshot(path=screenshot_notif)

        print("\n=======================================================")
        print("  STEP 8: NAVIGATE TO 'HELP & SUPPORT' (VERIFY NO DUPLICATE SHELL)")
        print("=======================================================")
        await page.locator("aside").first.locator('button:has-text("Help & Support")').click()
        await page.wait_for_timeout(2000)
        current_url = page.url
        print(f"  Current URL: {current_url}")
        aside_count = await page.locator("aside").count()
        print(f"  Visible/DOM <aside> elements on /vendor/support: {aside_count}")
        if "/vendor/support" in current_url and aside_count == 1:
            print("  [PASS] Navigated to /vendor/support with single VendorPortalShell")
            results["Help & Support Nav"] = "PASS"
        else:
            print(f"  [FAIL] URL={current_url}, aside_count={aside_count}")
            results["Help & Support Nav"] = f"FAIL (URL={current_url}, aside_count={aside_count})"

        screenshot_supp = os.path.join(ARTIFACT_DIR, "verified_vendor_support_nav.png")
        await page.screenshot(path=screenshot_supp)

        print("\n=======================================================")
        print("  STEP 9: NAVIGATE TO 'ACCOUNT SETTINGS' FROM SUPPORT")
        print("=======================================================")
        await page.locator("aside").first.locator('button:has-text("Account Settings")').click()
        await page.wait_for_timeout(2000)
        current_url = page.url
        print(f"  Current URL: {current_url}")
        if "/vendor/profile" in current_url:
            print("  [PASS] Navigated cleanly to /vendor/profile without click interception")
            results["Account Settings Nav"] = "PASS"
        else:
            print(f"  [FAIL] Expected /vendor/profile but got {current_url}")
            results["Account Settings Nav"] = f"FAIL ({current_url})"

        screenshot_prof = os.path.join(ARTIFACT_DIR, "verified_vendor_profile_nav.png")
        await page.screenshot(path=screenshot_prof)

        print("\n=======================================================")
        print("  STEP 10: TEST SIGN OUT CONFIRMATION DIALOG")
        print("=======================================================")
        signout_btn = page.locator("aside").first.locator('button:has-text("Sign Out")')
        await signout_btn.click()
        await page.wait_for_timeout(500)

        dialog_heading = page.locator("#vendor-logout-title")
        dialog_visible = await dialog_heading.is_visible()
        print(f"  Sign out dialog visible: {dialog_visible}")

        stay_btn = page.locator('button:has-text("Stay Signed In")')
        await stay_btn.click()
        await page.wait_for_timeout(500)
        dialog_dismissed = not await dialog_heading.is_visible()
        print(f"  Dialog dismissed after 'Stay Signed In': {dialog_dismissed}")

        await signout_btn.click()
        await page.wait_for_timeout(500)
        confirm_btn = page.locator('button:has-text("Confirm Sign Out")')
        await confirm_btn.click()
        await page.wait_for_timeout(2000)
        after_logout_url = page.url
        print(f"  URL after confirming sign out: {after_logout_url}")
        if "/login" in after_logout_url and dialog_visible and dialog_dismissed:
            print("  [PASS] Successfully logged out and returned to /login")
            results["Sign Out Flow"] = "PASS"
        else:
            print(f"  [FAIL] Logout check failed (url={after_logout_url})")
            results["Sign Out Flow"] = f"FAIL ({after_logout_url})"

        screenshot_logout = os.path.join(ARTIFACT_DIR, "verified_vendor_after_logout.png")
        await page.screenshot(path=screenshot_logout)

        await browser.close()

    print("\n=======================================================")
    print("  VENDOR PORTAL TEST SUMMARY")
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
        print("  >>> ALL VENDOR PORTAL TESTS PASSED 100% <<<")
    else:
        print("  >>> SOME TESTS FAILED - SEE ABOVE <<<")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_vendor_portal())
