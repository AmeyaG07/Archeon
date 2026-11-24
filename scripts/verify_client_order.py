import asyncio
import json
import urllib.request
from playwright.async_api import async_playwright

def get_client_auth():
    req = urllib.request.Request(
        "http://127.0.0.1:8080/api/auth/login",
        data=json.dumps({"username": "client_user", "password": "Password123!"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

async def run():
    auth = get_client_auth()
    token = auth.get("token") or auth.get("accessToken")
    user = {
        "id": "client_user",
        "username": "client_user",
        "email": "client_user@studioarcheon.com",
        "fullName": "Studio Client",
        "role": "ROLE_CLIENT"
    }

    print("Authenticated via API:", bool(token))

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # Inject auth into browser context
        await page.goto("http://localhost:3000/login")
        await page.evaluate(f"""() => {{
            localStorage.setItem("archeon_auth_token", "{token}");
            localStorage.setItem("archeon_auth_user", JSON.stringify({json.dumps(user)}));
            document.cookie = "archeon_auth_token={token}; path=/; max-age=31536000; SameSite=Lax";
        }}""")

        print("Injected auth. Navigating to /client/projects...")
        await page.goto("http://localhost:3000/client/projects")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)

        await page.screenshot(
            path="C:/Users/darsh/.gemini/antigravity/brain/4d981890-1549-477d-bbf6-92a4eaa67c80/verified_client_projects_list.png"
        )
        print("Saved verified_client_projects_list.png")

        # Open project workspace
        await page.goto("http://localhost:3000/client/projects/a87052c8-9c1d-4651-a554-fd8bb31e038a")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)

        print("Current page URL:", page.url)
        await page.screenshot(
            path="C:/Users/darsh/.gemini/antigravity/brain/4d981890-1549-477d-bbf6-92a4eaa67c80/verified_client_project_bills_workspace.png",
            full_page=True
        )
        print("Saved verified_client_project_bills_workspace.png")

        text = await page.evaluate("() => document.body.innerText")
        bills_idx = text.find("Project Bills & Invoices")
        gallery_idx = text.find("Project Progress Gallery & Architect Notes")
        vendors_idx = text.find("Assigned Vendors & Expense Breakdown")
        cash_idx = text.find("Cash Payment Approval Queue")

        print("--- Section Order Verification ---")
        print("1. Bills Index:", bills_idx)
        print("2. Gallery Index:", gallery_idx)
        print("3. Vendors Index:", vendors_idx)
        print("4. Cash Queue Index:", cash_idx)
        print("Is Cash Queue at the very end?:", cash_idx > vendors_idx and cash_idx > gallery_idx and cash_idx > bills_idx)
        print("Is Bills before Gallery & Vendors?:", bills_idx < gallery_idx and bills_idx < vendors_idx)

        # Check latest bills are displayed
        print("Has TRAV-2026-B104 in bills:", "TRAV-2026-B104" in text)
        print("Has TRAV-2026-B103 in bills:", "TRAV-2026-B103" in text)

        # Check disputes are absent
        print("Has 'Disputes' anywhere:", "Dispute" in text or "dispute" in text)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
