import asyncio
import os
import json
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\darsh\.gemini\antigravity\brain\4d981890-1549-477d-bbf6-92a4eaa67c80"

async def run_audit():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # ----------------------------------------------------
        # TEST 1: Admin Login & Audit Log Redirect / Refresh removal
        # ----------------------------------------------------
        print("\n--- TEST 1: Admin Login & Audit Logs Navigation ---")
        await page.goto("http://localhost:3000/login", wait_until="networkidle")
        await page.fill('input[type="text"], input[name="username"]', "admin")
        await page.fill('input[type="password"]', "Password123!")
        await page.click('button[type="submit"]')
        await page.wait_for_url("**/admin**", timeout=10000)
        print("Admin logged in successfully.")

        # Visit /admin/audit-logs
        await page.goto("http://localhost:3000/admin/audit-logs", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        current_url = page.url
        print(f"Current URL after visiting /admin/audit-logs: {current_url}")
        
        # Check sidebar items
        sidebar_text = await page.locator("aside").first.inner_text()
        has_audit_nav = "Audit Records" in sidebar_text or "Audit Log" in sidebar_text
        print(f"Sidebar has Audit Records link: {has_audit_nav}")

        # Check for any button with text REFRESH
        refresh_buttons = await page.locator('button:has-text("REFRESH"), button:has-text("Refresh")').all()
        # Filter visible ones
        visible_refresh = []
        for btn in refresh_buttons:
            if await btn.is_visible():
                txt = (await btn.inner_text()).strip()
                visible_refresh.append(txt)
        print(f"Visible Refresh buttons on page: {visible_refresh}")

        screenshot_path1 = os.path.join(ARTIFACT_DIR, "verified_admin_audit_redirect.png")
        await page.screenshot(path=screenshot_path1, full_page=True)
        print(f"Saved: {screenshot_path1}")

        # ----------------------------------------------------
        # TEST 2: Admin Clients -> Linked Projects
        # ----------------------------------------------------
        print("\n--- TEST 2: Admin Clients & Linked Projects ---")
        await page.goto("http://localhost:3000/admin/clients", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        body_text = await page.locator("body").inner_text()
        has_kothari = "Devang Kothari" in body_text
        has_kapoor = "Priya & Siddharth Kapoor" in body_text
        
        # Check linked projects count texts
        client_articles = await page.locator("article").all()
        print(f"Found {len(client_articles)} client articles.")
        for idx, art in enumerate(client_articles[:4]):
            text = await art.inner_text()
            title = text.split("\n")[0] if "\n" in text else "Client"
            for line in text.split("\n"):
                if "linked project" in line.lower():
                    print(f"  Client [{title}]: {line.strip()}")

        screenshot_path2 = os.path.join(ARTIFACT_DIR, "verified_admin_clients_linked.png")
        await page.screenshot(path=screenshot_path2, full_page=True)
        print(f"Saved: {screenshot_path2}")

        # ----------------------------------------------------
        # TEST 3: Admin Vendors -> Assigned Projects
        # ----------------------------------------------------
        print("\n--- TEST 3: Admin Vendors & Assigned Projects ---")
        await page.goto("http://localhost:3000/admin/vendors", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        vendor_articles = await page.locator("article").all()
        print(f"Found {len(vendor_articles)} vendor articles.")
        for idx, art in enumerate(vendor_articles[:4]):
            text = await art.inner_text()
            lines = [l.strip() for l in text.split("\n") if l.strip()]
            vname = lines[1] if len(lines) > 1 else "Vendor"
            assigned_line = next((l for l in lines if "ASSIGNED" in l or "PROJECTS" in l), "")
            print(f"  Vendor [{vname}]: {assigned_line}")

        screenshot_path3 = os.path.join(ARTIFACT_DIR, "verified_admin_vendors_assigned.png")
        await page.screenshot(path=screenshot_path3, full_page=True)
        print(f"Saved: {screenshot_path3}")

        # ----------------------------------------------------
        # TEST 4: Client Portal -> Invoices, View Invoice Tile, Submit Payment Proof
        # ----------------------------------------------------
        print("\n--- TEST 4: Client Invoices Flow ---")
        client_context = await browser.new_context(viewport={"width": 1440, "height": 900})
        client_page = await client_context.new_page()

        await client_page.goto("http://localhost:3000/login", wait_until="networkidle")
        # Click Client tab
        client_tab = client_page.locator('button:has-text("Client")')
        if await client_tab.count() > 0:
            await client_tab.first.click()
            await client_page.wait_for_timeout(500)

        await client_page.fill('input[type="text"]', "client_user")
        await client_page.fill('input[type="password"]', "Password123!")
        await client_page.click('button[type="submit"]')
        await client_page.wait_for_url("**/client**", timeout=10000)
        print("Client user logged in.")

        await client_page.goto("http://localhost:3000/client/invoices", wait_until="networkidle")
        await client_page.wait_for_timeout(2000)

        # Inspect invoice cards
        articles = await client_page.locator("article").all()
        print(f"Found {len(articles)} invoice articles in Client portal.")
        
        view_invoice_buttons = await client_page.locator('button:has-text("View Invoice")').all()
        print(f"Total 'View Invoice' buttons visible: {len(view_invoice_buttons)}")

        # Check if the first View Invoice button opens the in-page tile modal
        if len(view_invoice_buttons) > 0:
            print("Clicking 'View Invoice' button...")
            await view_invoice_buttons[0].click()
            await client_page.wait_for_timeout(1000)

            # Check if tile modal is visible
            modal_heading = await client_page.locator('text="ORIGINAL BILL DOCUMENT"').is_visible()
            modal_img = await client_page.locator('img[alt="Uploaded Bill Receipt"]').is_visible()
            print(f"Modal 'ORIGINAL BILL DOCUMENT' visible: {modal_heading}, image visible: {modal_img}")
            
            screenshot_path4 = os.path.join(ARTIFACT_DIR, "verified_client_invoice_photo_tile.png")
            await client_page.screenshot(path=screenshot_path4)
            print(f"Saved: {screenshot_path4}")

            # Close the modal
            close_btn = client_page.locator('button:has-text("Close"), button[aria-label="Close"]')
            if await close_btn.count() > 0:
                await close_btn.first.click()
                await client_page.wait_for_timeout(500)
                print("Closed photo modal.")

        # Check Submit Payment Proof
        proof_buttons = await client_page.locator('button:has-text("Submit Payment Proof")').all()
        print(f"Total 'Submit Payment Proof' buttons visible: {len(proof_buttons)}")

        if len(proof_buttons) > 0:
            print("Clicking 'Submit Payment Proof' button...")
            await proof_buttons[0].click()
            await client_page.wait_for_timeout(1000)

            proof_modal = await client_page.locator('text="SUBMIT PAYMENT PROOF"').is_visible()
            print(f"Submit Payment Proof modal visible: {proof_modal}")

            # Fill UTR
            utr_input = client_page.locator('input[placeholder*="UTR"], input[name="utr"]')
            if await utr_input.count() > 0:
                await utr_input.first.fill("UTR-2026-TEST999888")

            # Submit payment
            submit_action = client_page.locator('button:has-text("Record Payment & Mark Paid")')
            if await submit_action.count() > 0:
                await submit_action.first.click()
                await client_page.wait_for_timeout(2000)
                print("Submitted payment proof.")

            screenshot_path5 = os.path.join(ARTIFACT_DIR, "verified_client_payment_proof_paid.png")
            await client_page.screenshot(path=screenshot_path5)
            print(f"Saved: {screenshot_path5}")

        await browser.close()
        print("\n=== ALL PLAYWRIGHT VERIFICATION CHECKS COMPLETED ===")

asyncio.run(run_audit())
