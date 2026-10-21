import { describe, it } from "node:test";
import assert from "node:assert/strict";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Mobile Responsiveness & Viewport Configuration Verification", () => {
  it("1. Root layout serves responsive viewport meta tag with device-width", async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();

    // Verify viewport meta tag exists
    assert.match(
      html,
      /<meta\s+name="viewport"\s+content="[^"]*width=device-width[^"]*"/i,
      "Expected responsive viewport meta tag with width=device-width"
    );
  });

  it("2. Root layout contains overflow-x-hidden containment on html and body", async () => {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    assert.ok(
      html.includes("overflow-x-hidden"),
      "Root layout must have overflow-x-hidden containment to prevent mobile zoom-out and horizontal blowout"
    );
  });

  it("3. Header contains mobile-friendly compact navigation for narrow viewports", async () => {
    const res = await fetch(`${BASE_URL}/`);
    const html = await res.text();
    // Verify compact mobile sign-in icon button and desktop dropdown coexist responsively
    assert.ok(
      html.includes('aria-label="User Sign In"'),
      "Expected mobile sign-in touch target for phone viewports"
    );
    assert.ok(
      html.includes('id="login-dropdown-btn"'),
      "Expected desktop/tablet sign-in dropdown for larger viewports"
    );
  });

  it("4. All core storefront pages render with 200 OK", async () => {
    const routes = ["/", "/catalog", "/cart", "/login", "/register"];
    for (const route of routes) {
      const res = await fetch(`${BASE_URL}${route}`);
      assert.strictEqual(res.status, 200, `Expected ${route} to return 200 OK`);
      const html = await res.text();
      assert.ok(html.length > 500, `Expected ${route} to render HTML content`);
    }
  });

  it("5. Protected Admin routes require authentication and redirect unauthorized visitors", async () => {
    const adminRoutes = [
      "/admin",
      "/admin/orders",
      "/admin/products",
      "/admin/variants",
      "/admin/inventory",
      "/admin/pricing",
      "/admin/retailers",
      "/admin/messages",
      "/admin/notifications",
      "/admin/homepage",
      "/admin/settings",
      "/admin/reports",
      "/admin/audit-logs",
      "/admin/admin-settings",
    ];

    for (const route of adminRoutes) {
      const res = await fetch(`${BASE_URL}${route}`, { redirect: "manual" });
      // Next.js redirects unauthenticated users to /admin/login
      assert.ok(
        res.status === 307 || res.status === 302 || res.status === 308,
        `Expected ${route} to redirect unauthenticated user, got status ${res.status}`
      );
      const location = res.headers.get("location") || "";
      assert.ok(
        location.includes("/admin/login"),
        `Expected redirect to /admin/login, got ${location}`
      );
    }
  });

  it("6. Dedicated Admin login page /admin/login is directly accessible without redirect loop", async () => {
    const res = await fetch(`${BASE_URL}/admin/login`, { redirect: "manual" });
    assert.strictEqual(res.status, 200, "Expected /admin/login to return 200 directly");
    const html = await res.text();
    assert.ok(html.includes("Admin Sign In"), "Expected Admin Sign In on /admin/login");
  });
});
