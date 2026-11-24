import asyncio
import json
import urllib.request
from playwright.async_api import async_playwright

def get_admin_auth():
    req = urllib.request.Request(
        "http://127.0.0.1:8080/api/auth/login",
        data=json.dumps({"username": "admin", "password": "Password123!"}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

async def run():
    auth = get_admin_auth()
    token = auth.get("token") or auth.get("accessToken")
    user = {
        "id": "admin",
        "username": "admin",
        "email": "admin@archeon.studio",
        "fullName": "Studio Administration",
        "role": "ROLE_ADMIN"
    }

    print("Authenticated Admin via API:", bool(token))

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

        print("Navigating to /admin/clients...")
        await page.goto("http://localhost:3000/admin/clients")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)

        await page.screenshot(
            path="C:/Users/darsh/.gemini/antigravity/brain/4d981890-1549-477d-bbf6-92a4eaa67c80/verified_admin_clients_page.png",
            full_page=True
        )
        print("Saved verified_admin_clients_page.png")

        c_text = await page.evaluate("() => document.body.innerText")
        print("Admin clients page contains 'Aurum Horizon':", "Aurum Horizon" in c_text)
        print("Admin clients page contains '1 linked project':", "1 linked project" in c_text or "1 linked projects" in c_text)

        print("Navigating to /admin/vendors...")
        await page.goto("http://localhost:3000/admin/vendors")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)

        await page.screenshot(
            path="C:/Users/darsh/.gemini/antigravity/brain/4d981890-1549-477d-bbf6-92a4eaa67c80/verified_admin_vendors_page.png",
            full_page=True
        )
        print("Saved verified_admin_vendors_page.png")

        v_text = await page.evaluate("() => document.body.innerText")
        print("Admin vendors page contains 'Botanica Zen':", "Botanica Zen" in v_text)
        print("Admin vendors page contains 'Lumina':", "Lumina" in v_text)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
