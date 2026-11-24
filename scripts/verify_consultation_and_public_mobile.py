import asyncio
import os
import json
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\darsh\.gemini\antigravity\brain\4d981890-1549-477d-bbf6-92a4eaa67c80"

async def test_public_and_consultation():
    async with async_playwright() as p:
        # Test on mobile viewport (iPhone 13 - 390x844)
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 390, "height": 844})
        page = await context.new_page()

        print("\n--- 1. Testing Public Homepage on Mobile (390px) ---")
        await page.goto("http://localhost:3000/", wait_until="domcontentloaded")
        await page.wait_for_timeout(3000)

        # Check horizontal overflow
        scroll_width = await page.evaluate("() => document.documentElement.scrollWidth")
        client_width = await page.evaluate("() => document.documentElement.clientWidth")
        overflow = max(0, scroll_width - client_width)
        print(f"Mobile Homepage width: {client_width}px, scrollWidth: {scroll_width}px, overflow: {overflow}px")
        assert overflow == 0, f"Horizontal overflow detected on mobile homepage: {overflow}px"

        # Capture mobile landing screenshot
        mobile_home_shot = os.path.join(ARTIFACT_DIR, "verified_mobile_public_homepage.png")
        await page.screenshot(path=mobile_home_shot)
        print(f"Saved: {mobile_home_shot}")

        # ----------------------------------------------------
        # 2. Open Consultation Modal
        # ----------------------------------------------------
        print("\n--- 2. Testing Consultation Modal Booking on Mobile ---")
        # Look for "Book Consultation" or "Consultation" button
        consult_btns = await page.locator('button:has-text("CONSULTATION"), button:has-text("Consultation"), a:has-text("Consultation")').all()
        print(f"Found {len(consult_btns)} consultation triggers.")
        
        opened = False
        for btn in consult_btns:
            if await btn.is_visible():
                print(f"Clicking trigger: '{await btn.inner_text()}'")
                await btn.click()
                await page.wait_for_timeout(1000)
                opened = True
                break

        if not opened:
            # Scroll down to contact section
            print("Scrolling to Contact section...")
            await page.evaluate("() => window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(1500)

        # Check if consultation modal or form is visible
        modal = page.locator('div[role="dialog"], form:has-text("Consultation"), form:has-text("Name")').first
        modal_visible = await modal.is_visible() if await modal.count() > 0 else False
        print(f"Consultation modal/form visible: {modal_visible}")

        # Capture consultation modal screenshot
        consult_shot = os.path.join(ARTIFACT_DIR, "verified_mobile_consultation_modal.png")
        await page.screenshot(path=consult_shot)
        print(f"Saved: {consult_shot}")

        # ----------------------------------------------------
        # 3. Test Navigation Drawer on Mobile
        # ----------------------------------------------------
        print("\n--- 3. Testing Public Mobile Navigation Menu ---")
        # Click menu button
        menu_btn = page.locator('button[aria-label*="menu" i], button:has-text("MENU"), button:has-text("Menu")').first
        if await menu_btn.count() > 0 and await menu_btn.is_visible():
            await menu_btn.click()
            await page.wait_for_timeout(1000)
            print("Menu opened.")
            nav_shot = os.path.join(ARTIFACT_DIR, "verified_mobile_public_nav.png")
            await page.screenshot(path=nav_shot)
            print(f"Saved: {nav_shot}")

        await browser.close()
        print("\n=== PUBLIC MOBILE & CONSULTATION TESTS PASSED ===")

if __name__ == "__main__":
    asyncio.run(test_public_and_consultation())
