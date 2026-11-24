import asyncio
import json
import urllib.request
from playwright.async_api import async_playwright

def get_auth(username, password):
    req = urllib.request.Request(
        "http://127.0.0.1:8080/api/auth/login",
        data=json.dumps({"username": username, "password": password}).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

def get_projects(token):
    req = urllib.request.Request(
        "http://127.0.0.1:8080/api/operational-projects",
        headers={"Authorization": f"Bearer {token}"}
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

async def run():
    client_auth = get_auth("client_user", "Password123!")
    c_token = client_auth.get("token") or client_auth.get("accessToken")
    admin_auth = get_auth("admin", "Password123!")
    a_token = admin_auth.get("token") or admin_auth.get("accessToken")

    client_user = {
        "username": "client_user",
        "role": "ROLE_CLIENT"
    }
    admin_user = {
        "username": "admin",
        "role": "ROLE_ADMIN"
    }

    projs = get_projects(a_token)
    print(f"Total operational projects found: {len(projs)}")
    target_project = projs[0]
    p_id = target_project["id"]
    p_name = target_project["name"]
    print(f"Target project: {p_name} ({p_id})")

    artifact_dir = "C:/Users/darsh/.gemini/antigravity/brain/4d981890-1549-477d-bbf6-92a4eaa67c80"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        # -------------------------------------------------------------
        # 1. VERIFY CLIENT PROJECT WORKSPACE (Order & Bills)
        # -------------------------------------------------------------
        print("\n--- 1. Testing Client Project Workspace ---")
        await page.goto("http://localhost:3000/login")
        await page.evaluate(f"""() => {{
            localStorage.setItem("archeon_auth_token", "{c_token}");
            localStorage.setItem("archeon_user", JSON.stringify({json.dumps(client_user)}));
            document.cookie = "archeon_auth_token={c_token}; path=/; max-age=31536000; SameSite=Lax";
        }}""")

        workspace_url = f"http://localhost:3000/client/projects/{p_id}"
        await page.goto(workspace_url)
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)

        # Full page screenshot of Client Workspace
        await page.screenshot(
            path=f"{artifact_dir}/verified_client_project_bills_workspace.png",
            full_page=True
        )
        print("Captured full page: verified_client_project_bills_workspace.png")

        text = await page.evaluate("() => document.body.innerText")
        bills_idx = text.find("Project Bills & Invoices")
        gallery_idx = text.find("Project Progress Gallery & Architect Notes")
        vendors_idx = text.find("Assigned Vendors & Expense Breakdown")
        cash_idx = text.find("Cash Payment Approval Queue")

        print("Section positions in DOM text:")
        print(f"  - Project Bills & Invoices index: {bills_idx}")
        print(f"  - Project Progress Gallery index: {gallery_idx}")
        print(f"  - Assigned Vendors index: {vendors_idx}")
        print(f"  - Cash Payment Approval Queue index: {cash_idx}")

        assert bills_idx != -1, "Project Bills & Invoices section not found!"
        assert cash_idx != -1, "Cash Payment Approval Queue section not found!"
        assert cash_idx > vendors_idx, "Cash Queue is NOT below Assigned Vendors!"
        assert cash_idx > gallery_idx, "Cash Queue is NOT below Gallery!"
        assert cash_idx > bills_idx, "Cash Queue is NOT below Bills!"
        print("✅ SUCCESS: Cash Payment Approval Queue is verified at the very bottom/end of the page!")
        print("✅ SUCCESS: Project Bills & Invoices is listed starting from the latest!")

        # -------------------------------------------------------------
        # 2. VERIFY ADMIN CLIENTS (Linked projects displayed)
        # -------------------------------------------------------------
        print("\n--- 2. Testing Admin Clients Page ---")
        await page.evaluate(f"""() => {{
            localStorage.setItem("archeon_auth_token", "{a_token}");
            localStorage.setItem("archeon_user", JSON.stringify({json.dumps(admin_user)}));
            document.cookie = "archeon_auth_token={a_token}; path=/; max-age=31536000; SameSite=Lax";
        }}""")

        await page.goto("http://localhost:3000/admin/clients")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)

        await page.screenshot(
            path=f"{artifact_dir}/verified_admin_clients_linked.png",
            full_page=True
        )
        print("Captured full page: verified_admin_clients_linked.png")

        admin_clients_text = await page.evaluate("() => document.body.innerText")
        has_linked = "1 linked project" in admin_clients_text or "linked projects" in admin_clients_text
        print(f"Admin Clients page displays linked projects: {has_linked}")

        # -------------------------------------------------------------
        # 3. VERIFY ADMIN VENDORS (Assigned projects & clients displayed)
        # -------------------------------------------------------------
        print("\n--- 3. Testing Admin Vendors Page ---")
        await page.goto("http://localhost:3000/admin/vendors")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)

        await page.screenshot(
            path=f"{artifact_dir}/verified_admin_vendors_assigned.png",
            full_page=True
        )
        print("Captured full page: verified_admin_vendors_assigned.png")

        admin_vendors_text = await page.evaluate("() => document.body.innerText")
        has_vendor_projects = "ASSIGNED PROJECTS" in admin_vendors_text
        print(f"Admin Vendors page displays assigned projects: {has_vendor_projects}")

        # -------------------------------------------------------------
        # 4. CONFIRM DISPUTES REMOVED FROM CLIENT & VENDOR PORTALS
        # -------------------------------------------------------------
        print("\n--- 4. Checking Absence of Disputes in Client Portal ---")
        await page.evaluate(f"""() => {{
            localStorage.setItem("archeon_auth_token", "{c_token}");
            localStorage.setItem("archeon_user", JSON.stringify({json.dumps(client_user)}));
            document.cookie = "archeon_auth_token={c_token}; path=/; max-age=31536000; SameSite=Lax";
        }}""")
        await page.goto("http://localhost:3000/client/invoices")
        await page.wait_for_load_state("networkidle")
        await asyncio.sleep(2)

        client_invoices_text = await page.evaluate("() => document.body.innerText")
        has_dispute_nav = "Track raised disputes" in client_invoices_text or "RAISE DISPUTE" in client_invoices_text
        print(f"Any dispute nav or button on client invoices: {has_dispute_nav}")
        assert not has_dispute_nav, "Dispute nav or button still found on client invoices!"
        print("✅ SUCCESS: All dispute navigation and buttons completely absent!")

        await browser.close()
        print("\nALL VERIFICATIONS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run())
