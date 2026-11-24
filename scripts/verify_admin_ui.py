from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto('http://localhost:3000/login')
    page.wait_for_load_state('networkidle')
    page.fill('input[type="text"]', 'admin')
    page.fill('input[type="password"]', 'Password123!')
    page.click('button[type="submit"]')
    page.wait_for_url('**/admin**', timeout=10000)
    print('Logged in successfully! Current URL:', page.url)

    page.goto('http://localhost:3000/admin/clients')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    print('Clients page URL:', page.url)
    text = page.evaluate('() => document.body.innerText')
    print('Has Aurum Horizon:', 'Aurum Horizon' in text)
    print('Has Devang Kothari:', 'Devang Kothari' in text)
    print('Linked projects snippet:', [line for line in text.split('\n') if 'linked project' in line])

    page.screenshot(path='C:/Users/darsh/.gemini/antigravity/brain/4d981890-1549-477d-bbf6-92a4eaa67c80/verified_admin_clients_linked.png', full_page=True)
    print('Saved verified_admin_clients_linked.png')

    page.goto('http://localhost:3000/admin/vendors')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(2000)
    print('Vendors page URL:', page.url)
    v_text = page.evaluate('() => document.body.innerText')
    print('Has Botanica Zen:', 'Botanica Zen' in v_text)
    print('Has Lumina:', 'Lumina' in v_text)
    print('Assigned projects snippet:', [line for line in v_text.split('\n') if 'ASSIGNED' in line.upper() or 'LINKED' in line.upper()])
    page.screenshot(path='C:/Users/darsh/.gemini/antigravity/brain/4d981890-1549-477d-bbf6-92a4eaa67c80/verified_admin_vendors_assigned.png', full_page=True)
    print('Saved verified_admin_vendors_assigned.png')

    browser.close()
