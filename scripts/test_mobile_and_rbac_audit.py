import asyncio
import json
import os
import sys
import urllib.error
import urllib.request
from playwright.async_api import async_playwright

ARTIFACT_DIR = r"C:\Users\darsh\.gemini\antigravity\brain\4d981890-1549-477d-bbf6-92a4eaa67c80"
MOBILE_VIEWPORT = {"width": 390, "height": 844}


def api_login(username: str, password: str) -> str:
    req = urllib.request.Request(
        "http://localhost:8080/api/auth/login",
        data=json.dumps({"username": username, "password": password}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))["token"]


def check_status_403(path: str, token: str) -> int:
    req = urllib.request.Request(
        f"http://localhost:8080{path}",
        headers={"Authorization": f"Bearer {token}"},
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        return e.code


async def check_no_overflow(page, label: str) -> bool:
    metrics = await page.evaluate(
        "() => ({ scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth })"
    )
    ok = metrics["scrollW"] <= metrics["innerW"] + 2
    print(f"    [Overflow Check] {label}: scrollW={metrics['scrollW']} / innerW={metrics['innerW']} -> {'OK' if ok else 'OVERFLOW!'}")
    return ok


async def run_mobile_and_rbac_audit():
    results = {}

    # ---------------------------------------------------------
    # PART 1: LIVE HTTP RBAC NEGATIVE TESTS
    # ---------------------------------------------------------
    print("\n=======================================================")
    print("  PART 1: LIVE RBAC CROSS-ROLE AUTHORIZATION CHECKS")
    print("=======================================================")
    c_tok = api_login("client_user", "Password123!")
    v_tok = api_login("vendor_user", "Password123!")

    rbac_targets = [
        ("client_user -> /api/clients", c_tok, "/api/clients"),
        ("client_user -> /api/vendors", c_tok, "/api/vendors"),
        ("client_user -> /api/leads", c_tok, "/api/leads"),
        ("client_user -> /api/dashboards/admin", c_tok, "/api/dashboards/admin"),
        ("vendor_user -> /api/clients", v_tok, "/api/clients"),
        ("vendor_user -> /api/leads", v_tok, "/api/leads"),
        ("vendor_user -> /api/dashboards/admin", v_tok, "/api/dashboards/admin"),
    ]
    rbac_all_403 = True
    for desc, tok, path in rbac_targets:
        code = check_status_403(path, tok)
        print(f"  {desc}: HTTP {code} -> {'PASS' if code == 403 else 'FAIL'}")
        if code != 403:
            rbac_all_403 = False
    results["Live HTTP RBAC Enforcement"] = "PASS" if rbac_all_403 else "FAIL"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)

        # -----------------------------------------------------
        # PART 2: UNAUTHENTICATED PORTAL GUARDS
        # -----------------------------------------------------
        print("\n=======================================================")
        print("  PART 2: UNAUTHENTICATED ROUTE PROTECTION")
        print("=======================================================")
        u_ctx = await browser.new_context(viewport=MOBILE_VIEWPORT)
        u_page = await u_ctx.new_page()

        guard_ok = True
        for route in ["/client", "/vendor", "/admin"]:
            await u_page.goto(f"http://localhost:3000{route}", wait_until="domcontentloaded")
            await u_page.wait_for_timeout(1500)
            url = u_page.url
            body = await u_page.locator("body").inner_text()
            protected = ("/login" in url) or ("Studio Session Required" in body) or ("Sign In" in body)
            print(f"  Unauth {route} -> url={url} | protected={protected}")
            if not protected:
                guard_ok = False
        results["Unauthenticated Guards"] = "PASS" if guard_ok else "FAIL"
        await u_ctx.close()

        # -----------------------------------------------------
        # PART 3: CLIENT PORTAL MOBILE (390x844) + ZERO 403 CHECK
        # -----------------------------------------------------
        print("\n=======================================================")
        print("  PART 3: CLIENT PORTAL MOBILE & ZERO 403 AUDIT")
        print("=======================================================")
        c_errors = []
        c_ctx = await browser.new_context(viewport=MOBILE_VIEWPORT)
        c_page = await c_ctx.new_page()
        c_page.on("console", lambda m: c_errors.append(m.text) if m.type == "error" else None)
        c_page.on("pageerror", lambda e: c_errors.append(str(e)))

        await c_page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await c_page.wait_for_timeout(600)
        await c_page.locator('button:has-text("Client")').click()
        await c_page.fill('input[type="text"]', "client_user")
        await c_page.fill('input[type="password"]', "Password123!")
        await c_page.click('button[type="submit"]')
        await c_page.wait_for_url("**/client**", timeout=10000)
        await c_page.wait_for_timeout(1500)

        c_ov1 = await check_no_overflow(c_page, "/client")
        # Open Mobile Drawer and navigate to Invoices & Bills
        await c_page.locator('button[aria-label="Open navigation menu"]').click()
        await c_page.wait_for_timeout(400)
        await c_page.locator('nav[aria-label="Mobile client navigation"] button:has-text("Invoices & Bills")').click()
        await c_page.wait_for_url("**/client/invoices**", timeout=10000)
        await c_page.wait_for_timeout(1500)
        c_ov2 = await check_no_overflow(c_page, "/client/invoices")
        await c_page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_mobile_client_invoices.png"))

        print(f"  Client console/page errors: {len(c_errors)} {c_errors}")
        results["Client Mobile & Zero Console Errors"] = "PASS" if (c_ov1 and c_ov2 and len(c_errors) == 0) else "FAIL"
        await c_ctx.close()

        # -----------------------------------------------------
        # PART 4: VENDOR PORTAL MOBILE (390x844) + PROFILE FIX CHECK
        # -----------------------------------------------------
        print("\n=======================================================")
        print("  PART 4: VENDOR PORTAL MOBILE & ZERO WARNING AUDIT")
        print("=======================================================")
        v_errors = []
        v_warns = []
        v_ctx = await browser.new_context(viewport=MOBILE_VIEWPORT)
        v_page = await v_ctx.new_page()
        v_page.on("console", lambda m: v_errors.append(m.text) if m.type == "error" else (v_warns.append(m.text) if m.type == "warning" and "Could not load payment methods" in m.text else None))
        v_page.on("pageerror", lambda e: v_errors.append(str(e)))

        await v_page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await v_page.wait_for_timeout(600)
        await v_page.locator('button:has-text("Vendor")').click()
        await v_page.fill('input[type="text"]', "vendor_user")
        await v_page.fill('input[type="password"]', "Password123!")
        await v_page.click('button[type="submit"]')
        await v_page.wait_for_url("**/vendor**", timeout=10000)
        await v_page.wait_for_timeout(1500)

        v_ov1 = await check_no_overflow(v_page, "/vendor")
        await v_page.locator('button[aria-label="Open navigation menu"]').click()
        await v_page.wait_for_timeout(400)
        await v_page.locator('nav[aria-label="Mobile vendor navigation"] button:has-text("Invoices")').first.click()
        await v_page.wait_for_url("**/vendor/invoices**", timeout=10000)
        await v_page.wait_for_timeout(1500)
        v_ov2 = await check_no_overflow(v_page, "/vendor/invoices")
        await v_page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_mobile_vendor_invoices.png"))

        await v_page.locator('button[aria-label="Open navigation menu"]').click()
        await v_page.wait_for_timeout(400)
        await v_page.locator('nav[aria-label="Mobile vendor navigation"] button:has-text("Account Settings")').click()
        await v_page.wait_for_url("**/vendor/profile**", timeout=10000)
        await v_page.wait_for_timeout(1500)
        v_ov3 = await check_no_overflow(v_page, "/vendor/profile")

        print(f"  Vendor console/page errors: {len(v_errors)}, payment-method SyntaxWarnings: {len(v_warns)}")
        results["Vendor Mobile & Zero Warnings"] = "PASS" if (v_ov1 and v_ov2 and v_ov3 and len(v_errors) == 0 and len(v_warns) == 0) else "FAIL"
        await v_ctx.close()

        # -----------------------------------------------------
        # PART 5: ADMIN PORTAL MOBILE (390x844) + VENDORS LINK
        # -----------------------------------------------------
        print("\n=======================================================")
        print("  PART 5: ADMIN PORTAL MOBILE & VENDORS LINK AUDIT")
        print("=======================================================")
        a_errors = []
        a_ctx = await browser.new_context(viewport=MOBILE_VIEWPORT)
        a_page = await a_ctx.new_page()
        a_page.on("console", lambda m: a_errors.append(m.text) if m.type == "error" else None)
        a_page.on("pageerror", lambda e: a_errors.append(str(e)))

        await a_page.goto("http://localhost:3000/login", wait_until="domcontentloaded")
        await a_page.wait_for_timeout(600)
        await a_page.locator('button:has-text("Studio")').first.click()
        await a_page.fill('input[type="text"]', "admin")
        await a_page.fill('input[type="password"]', "Password123!")
        await a_page.click('button[type="submit"]')
        await a_page.wait_for_url("**/admin**", timeout=10000)
        await a_page.wait_for_timeout(1500)

        a_ov1 = await check_no_overflow(a_page, "/admin")
        await a_page.locator('button[aria-label="Open navigation menu"]').click()
        await a_page.wait_for_timeout(400)
        await a_page.locator('nav[aria-label="Mobile administration navigation"] button:has-text("Vendors")').click()
        await a_page.wait_for_url("**/admin/vendors**", timeout=10000)
        await a_page.wait_for_timeout(1500)
        a_ov2 = await check_no_overflow(a_page, "/admin/vendors")

        await a_page.locator('button[aria-label="Open navigation menu"]').click()
        await a_page.wait_for_timeout(400)
        await a_page.locator('nav[aria-label="Mobile administration navigation"] button:has-text("Invoices & Bills")').click()
        await a_page.wait_for_url("**/admin/invoices**", timeout=10000)
        await a_page.wait_for_timeout(1500)
        a_ov3 = await check_no_overflow(a_page, "/admin/invoices")
        await a_page.screenshot(path=os.path.join(ARTIFACT_DIR, "verified_mobile_admin_invoices.png"))

        print(f"  Admin console/page errors: {len(a_errors)} {a_errors}")
        results["Admin Mobile & Zero Console Errors"] = "PASS" if (a_ov1 and a_ov2 and a_ov3 and len(a_errors) == 0) else "FAIL"
        await a_ctx.close()

        await browser.close()

    print("\n=======================================================")
    print("  MOBILE RESPONSIVENESS & RBAC AUDIT SUMMARY")
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
    print("  >>> ALL MOBILE & RBAC AUDIT CHECKS PASSED 100% <<<")


if __name__ == "__main__":
    asyncio.run(run_mobile_and_rbac_audit())
