import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken, AUTH_COOKIE_NAME } from "../src/lib/auth";

const BASE_URL = process.env.TEST_BASE_URL || (process.env.PORT ? `http://localhost:${process.env.PORT}` : "http://localhost:3001");

describe("Separate Admin Sign In and User Sign In Verification", () => {
  let testCustomerEmail: string;
  let testCustomerId: string;
  const testCustomerPassword = "TestRetailer@2026";

  before(async () => {
    testCustomerEmail = `ephemeral.customer.${Date.now()}@example.com`;
    const hash = await hashPassword(testCustomerPassword);
    const created = await prisma.user.create({
      data: {
        email: testCustomerEmail,
        name: "Ephemeral Test Retailer",
        phone: "+91 99999 11111",
        passwordHash: hash,
        role: "CUSTOMER",
        approvalStatus: "APPROVED",
        isVerified: true,
      },
    });
    testCustomerId = created.id;
  });

  after(async () => {
    if (testCustomerId) {
      await prisma.auditLog.deleteMany({ where: { userId: testCustomerId } }).catch(() => {});
      await prisma.user.delete({ where: { id: testCustomerId } }).catch(() => {});
    }
  });
  it("1. Dedicated admin login page /admin/login is accessible and does not redirect in a loop", async () => {
    const res = await fetch(`${BASE_URL}/admin/login`, {
      redirect: "manual",
    });

    // Should return 200 OK directly, NOT 307/302 redirect loop
    assert.strictEqual(
      res.status,
      200,
      `Expected /admin/login to return 200, got ${res.status}`
    );

    const html = await res.text();
    // Must contain Admin Sign In heading and supporting text
    assert.ok(html.includes("Admin Sign In"), "Expected page to include 'Admin Sign In'");
    assert.ok(
      html.includes("Sign in to manage your business"),
      "Expected supporting text 'Sign in to manage your business'"
    );

    // Must not leak default credentials or allow public admin registration
    assert.ok(
      !html.includes("Owner@Jagdamba2026"),
      "Admin password must never be exposed on admin login page"
    );
    assert.ok(
      !html.includes("Register Administrator"),
      "Public admin registration must not exist"
    );
  });

  it("2. User login page /login is accessible and contains User Sign In and link to Admin Sign In", async () => {
    const res = await fetch(`${BASE_URL}/login`, {
      redirect: "manual",
    });

    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("User Sign In"), "Expected /login to state 'User Sign In'");
    assert.ok(
      html.includes("/admin/login"),
      "Expected /login to link to Admin Sign In (/admin/login)"
    );
    assert.ok(
      html.includes("/register"),
      "Expected /login to link to Register Retail Store (/register)"
    );
  });

  it("3. Unauthenticated access to /admin redirects to /admin/login", async () => {
    const res = await fetch(`${BASE_URL}/admin`, {
      redirect: "manual",
    });

    assert.ok(
      res.status === 307 || res.status === 302,
      `Expected redirect for unauthenticated /admin, got ${res.status}`
    );

    const location = res.headers.get("location") || "";
    assert.ok(
      location.includes("/admin/login"),
      `Expected redirect location to point to /admin/login, got ${location}`
    );
  });

  it("4. Authenticated OWNER receives OWNER role and can create valid session token", async () => {
    const owner = await prisma.user.findUnique({
      where: { email: "owner@jagdambamobile.com" },
    });
    assert.ok(owner, "Owner account must exist");
    assert.strictEqual(owner.role, "OWNER");

    const validPass = await verifyPassword("Owner@Jagdamba2026", owner.passwordHash);
    assert.strictEqual(validPass, true, "Owner password verification should succeed");

    const token = await createSessionToken({
      userId: owner.id,
      email: owner.email,
      role: owner.role as "OWNER",
      name: owner.name,
    });

    const verified = await verifySessionToken(token);
    assert.ok(verified, "Session token must be valid");
    assert.strictEqual(verified.role, "OWNER");
  });

  it("5. Retailer (CUSTOMER) account cannot sign in with admin privileges", async () => {
    const retailer = await prisma.user.findUnique({
      where: { id: testCustomerId },
    });
    assert.ok(retailer, "Retailer account must exist");
    assert.strictEqual(retailer.role, "CUSTOMER");

    // Login API test
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testCustomerEmail,
        password: testCustomerPassword,
      }),
    });

    assert.strictEqual(loginRes.status, 200);
    const data = await loginRes.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.role, "CUSTOMER");

    // Attempting to access /admin with retailer cookie must be rejected
    const cookieHeader = loginRes.headers.get("set-cookie") || "";
    const adminAccessRes = await fetch(`${BASE_URL}/admin`, {
      headers: {
        Cookie: cookieHeader,
      },
      redirect: "manual",
    });

    // Retailer is redirected away from /admin with error=unauthorized_admin
    assert.ok(
      adminAccessRes.status === 307 || adminAccessRes.status === 302,
      "Retailer must be redirected away from /admin"
    );
    const location = adminAccessRes.headers.get("location") || "";
    assert.ok(
      location.includes("unauthorized_admin") || location.includes("/admin/login"),
      `Expected redirect with unauthorized notification, got ${location}`
    );
  });

  it("6. Invalid credentials return 401 on login API", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent@test.com",
        password: "WrongPassword123",
      }),
    });

    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.strictEqual(data.error, "Invalid credentials");
  });

  it("7. Direct API calls to /api/admin/* with customer cookie return 403 Forbidden", async () => {
    // Generate customer token
    const customer = await prisma.user.findUnique({
      where: { id: testCustomerId },
    });
    assert.ok(customer);

    const customerToken = await createSessionToken({
      userId: customer.id,
      email: customer.email,
      role: "CUSTOMER",
      name: customer.name,
    });

    const res = await fetch(`${BASE_URL}/api/admin/settings`, {
      headers: {
        Cookie: `${AUTH_COOKIE_NAME}=${customerToken}`,
      },
    });

    assert.strictEqual(
      res.status,
      403,
      `Expected 403 Forbidden when customer calls /api/admin/settings, got ${res.status}`
    );
  });

  it("8. Admin user admin@gmail.com with password admin@1234 signs in successfully with OWNER role", async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@gmail.com",
        password: "admin@1234",
      }),
    });

    assert.strictEqual(loginRes.status, 200, "Login must succeed with 200 OK");
    const data = await loginRes.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.email, "admin@gmail.com");
    assert.strictEqual(data.user.role, "OWNER");

    // Access /admin with this cookie
    const cookieHeader = loginRes.headers.get("set-cookie") || "";
    const adminRes = await fetch(`${BASE_URL}/admin`, {
      headers: { Cookie: cookieHeader },
      redirect: "manual",
    });

    // Should return 200 OK (access granted to Admin Dashboard)
    assert.strictEqual(adminRes.status, 200, "Admin must be granted access to /admin");
  });
});

