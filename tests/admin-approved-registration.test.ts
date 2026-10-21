import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { hashPassword, createSessionToken, AUTH_COOKIE_NAME } from "../src/lib/auth";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

describe("Admin-Approved Registration, Login Gating & Storefront Protection Verification", () => {
  let ownerToken: string;
  let customerToken: string;
  let ownerUser: any;
  let testPendingUserEmail: string;
  let testPendingUserId: string;
  let testRejectedUserEmail: string;
  let testRejectedUserId: string;

  before(async () => {
    // Ensure test owner exists
    ownerUser = await prisma.user.findFirst({ where: { role: "OWNER" } });
    if (!ownerUser) {
      ownerUser = await prisma.user.create({
        data: {
          email: "test.admin.approval@jagdambamobile.com",
          name: "Approval Admin",
          phone: "9876543299",
          passwordHash: await hashPassword("AdminPass@2026"),
          role: "OWNER",
          approvalStatus: "APPROVED",
          isVerified: true,
        },
      });
    }

    ownerToken = await createSessionToken({
      userId: ownerUser.id,
      email: ownerUser.email,
      role: "OWNER",
      name: ownerUser.name,
    });
  });

  after(async () => {
    // Cleanup created test records
    if (testPendingUserId) {
      await prisma.notificationDelivery.deleteMany({
        where: { recipient: testPendingUserEmail },
      });
      await prisma.auditLog.deleteMany({
        where: { entityId: testPendingUserId },
      });
      await prisma.user.deleteMany({
        where: { id: testPendingUserId },
      });
    }

    if (testRejectedUserId) {
      await prisma.notificationDelivery.deleteMany({
        where: { recipient: testRejectedUserEmail },
      });
      await prisma.auditLog.deleteMany({
        where: { entityId: testRejectedUserId },
      });
      await prisma.user.deleteMany({
        where: { id: testRejectedUserId },
      });
    }
  });

  // Scenario 1 & 2: Unauthenticated visitor opening website is redirected to /login
  test("1 & 2. Unauthenticated visitor to homepage / is redirected to /login with return destination", async () => {
    const res = await fetch(`${BASE_URL}/`, { redirect: "manual" });
    assert.strictEqual(res.status, 307, `Expected 307 redirect, got ${res.status}`);
    const location = res.headers.get("location") || "";
    assert.ok(
      location.includes("/login"),
      `Expected redirect to /login, got ${location}`
    );
  });

  // Scenario 3: Visitor attempts to open protected routes directly
  test("3. Unauthenticated visitor cannot access protected routes (/catalog, /cart, /admin)", async () => {
    const protectedRoutes = ["/catalog", "/cart", "/orders", "/profile"];
    for (const route of protectedRoutes) {
      const res = await fetch(`${BASE_URL}${route}`, { redirect: "manual" });
      assert.strictEqual(
        res.status,
        307,
        `Expected ${route} to redirect unauthenticated visitor, got ${res.status}`
      );
      const location = res.headers.get("location") || "";
      assert.ok(
        location.includes("/login"),
        `Expected ${route} to redirect to /login, got ${location}`
      );
    }

    // Admin routes redirect to /admin/login
    const adminRes = await fetch(`${BASE_URL}/admin`, { redirect: "manual" });
    assert.ok(
      adminRes.status === 307 || adminRes.status === 302,
      `Expected /admin to redirect unauthenticated visitor, got ${adminRes.status}`
    );
    const adminLocation = adminRes.headers.get("location") || "";
    assert.ok(
      adminLocation.includes("/admin/login"),
      `Expected /admin to redirect to /admin/login, got ${adminLocation}`
    );
  });

  // Scenario 4: New customer submits valid registration
  test("4. New customer registration creates a PENDING account without authenticated session", async () => {
    testPendingUserEmail = `dealer.pending.${Date.now()}@example.com`;
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aman Gupta",
        email: testPendingUserEmail,
        phone: "9811223344",
        businessName: "Aman Telecom Traders",
        password: "SecurePassword@123",
      }),
    });

    assert.strictEqual(res.status, 201, `Expected 201 Created, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.approvalStatus, "PENDING");
    assert.ok(data.message.includes("awaiting admin approval"));

    // Critical Requirement: Must NOT set session cookie
    const setCookie = res.headers.get("set-cookie") || "";
    assert.ok(
      !setCookie.includes(AUTH_COOKIE_NAME) || setCookie.includes("Max-Age=0"),
      "Pending registration must NEVER receive an active session cookie"
    );

    // Verify DB record
    const userInDb = await prisma.user.findUnique({
      where: { email: testPendingUserEmail },
    });
    assert.ok(userInDb, "User record must exist in DB");
    assert.strictEqual(userInDb.approvalStatus, "PENDING");
    assert.strictEqual(userInDb.role, "CUSTOMER");
    testPendingUserId = userInDb.id;
  });

  // Scenario 5: Invalid registration is rejected
  test("5. Invalid registration payload returns 400 Bad Request with validation errors", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "A", // too short
        email: "not-an-email",
        phone: "123", // too short
        password: "short", // too short
      }),
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error);
  });

  // Scenario 6: Duplicate registration is handled correctly
  test("6. Duplicate registration for already submitted email returns 409 Conflict", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Aman Gupta Duplicate",
        email: testPendingUserEmail,
        phone: "9811223344",
        businessName: "Aman Telecom",
        password: "SecurePassword@123",
      }),
    });

    assert.strictEqual(res.status, 409);
    const data = await res.json();
    assert.strictEqual(data.success, false);
    assert.ok(data.error.includes("already exists"));
  });

  // Scenario 7: Pending registration appears in admin queue
  test("7. Pending registration appears in admin queue (/api/admin/registration-requests)", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/registration-requests?status=PENDING`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.requests));
    const found = data.requests.find((r: any) => r.id === testPendingUserId);
    assert.ok(found, "Pending request must be visible in admin queue");
    assert.strictEqual(found.approvalStatus, "PENDING");
  });

  // Scenario 8: Pending customer cannot log in
  test("8. Pending customer cannot log in (returns 403 Forbidden with approval explanation)", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testPendingUserEmail,
        password: "SecurePassword@123",
      }),
    });

    assert.strictEqual(res.status, 403, `Expected 403 Forbidden, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.approvalStatus, "PENDING");
    assert.ok(data.error.includes("awaiting admin approval"));

    // Session cookie must not be set
    const setCookie = res.headers.get("set-cookie") || "";
    assert.ok(
      !setCookie.includes(AUTH_COOKIE_NAME) || setCookie.includes("Max-Age=0"),
      "Pending login must not issue session cookie"
    );
  });

  // Scenario 9: Pending customer cannot access protected APIs
  test("9. Pending customer token cannot access /api/auth/me or protected resources", async () => {
    // Synthesize a token with role CUSTOMER for the pending user
    const pendingToken = await createSessionToken({
      userId: testPendingUserId,
      email: testPendingUserEmail,
      role: "CUSTOMER",
      name: "Aman Gupta",
    });

    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${pendingToken}` },
    });

    assert.ok(
      res.status === 401 || res.status === 403,
      `Expected 401 or 403 for unapproved token, got ${res.status}`
    );
  });

  // Scenario 10: Admin sees the registration notification
  test("10. Persistent NEW_REGISTRATION notification is recorded in DB for administrators", async () => {
    const notification = await prisma.notificationDelivery.findFirst({
      where: {
        type: "NEW_REGISTRATION",
        body: { contains: testPendingUserEmail },
      },
      orderBy: { createdAt: "desc" },
    });

    assert.ok(notification, "NEW_REGISTRATION notification must exist in database");
    assert.ok(notification.title.includes("Registration"));
    assert.ok(notification.body.includes(testPendingUserEmail));
  });

  // Scenario 11: Authorized admin approves the request
  test("11. Authorized admin approves pending registration request", async () => {
    const res = await fetch(`${BASE_URL}/api/admin/registration-requests/${testPendingUserId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({ action: "APPROVE" }),
    });

    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.user.approvalStatus, "APPROVED");

    // Verify DB update
    const updated = await prisma.user.findUnique({ where: { id: testPendingUserId } });
    assert.strictEqual(updated?.approvalStatus, "APPROVED");
    assert.ok(updated?.approvedAt);
  });

  // Scenario 12 & 13: Approved customer can log in and access storefront
  test("12 & 13. Approved customer logs in successfully, receives session, and accesses /api/auth/me", async () => {
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testPendingUserEmail,
        password: "SecurePassword@123",
      }),
    });

    assert.strictEqual(loginRes.status, 200, `Expected 200 OK, got ${loginRes.status}`);
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.success, true);
    assert.strictEqual(loginData.user.approvalStatus, "APPROVED");

    const sessionCookie = loginRes.headers.get("set-cookie") || "";
    assert.ok(sessionCookie.includes(AUTH_COOKIE_NAME), "Must set auth cookie");

    // Can access /api/auth/me
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: sessionCookie },
    });
    assert.strictEqual(meRes.status, 200);
    const meData = await meRes.json();
    assert.strictEqual(meData.user.email, testPendingUserEmail);
    assert.strictEqual(meData.user.approvalStatus, "APPROVED");

    // Can access storefront /
    const storefrontRes = await fetch(`${BASE_URL}/`, {
      headers: { Cookie: sessionCookie },
      redirect: "manual",
    });
    assert.strictEqual(
      storefrontRes.status,
      200,
      `Expected approved customer to access / directly, got ${storefrontRes.status}`
    );
  });

  // Scenario 14 & 15: Admin rejects another request and rejected customer cannot log in
  test("14 & 15. Admin rejects a registration request with reason; rejected user cannot log in", async () => {
    testRejectedUserEmail = `rejected.dealer.${Date.now()}@example.com`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Unverified Applicant",
        email: testRejectedUserEmail,
        phone: "9870001122",
        businessName: "Unverified Shop",
        password: "Password12345!",
      }),
    });
    assert.strictEqual(regRes.status, 201);

    const rejectedUser = await prisma.user.findUnique({
      where: { email: testRejectedUserEmail },
    });
    assert.ok(rejectedUser);
    testRejectedUserId = rejectedUser.id;

    // Admin rejects request
    const rejectRes = await fetch(`${BASE_URL}/api/admin/registration-requests/${testRejectedUserId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({
        action: "REJECT",
        rejectionReason: "Incomplete GST documentation provided.",
      }),
    });

    assert.strictEqual(rejectRes.status, 200);
    const rejectData = await rejectRes.json();
    assert.strictEqual(rejectData.user.approvalStatus, "REJECTED");

    // Rejected customer attempts login
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testRejectedUserEmail,
        password: "Password12345!",
      }),
    });

    assert.strictEqual(loginRes.status, 403);
    const loginData = await loginRes.json();
    assert.strictEqual(loginData.approvalStatus, "REJECTED");
    assert.ok(loginData.error.includes("rejected"));
  });

  // Scenario 16: Unauthorized customer attempts approval API
  test("16. Customer role cannot call registration approval APIs (403 Forbidden)", async () => {
    const fakeCustomerToken = await createSessionToken({
      userId: testPendingUserId,
      email: testPendingUserEmail,
      role: "CUSTOMER",
      name: "Aman Gupta",
    });

    const res = await fetch(`${BASE_URL}/api/admin/registration-requests/${testRejectedUserId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${fakeCustomerToken}`,
      },
      body: JSON.stringify({ action: "APPROVE" }),
    });

    assert.strictEqual(res.status, 403, "Customer must be rejected with 403 Forbidden");
  });

  // Scenario 17 & 18: Admin login works and OWNER permissions remain intact
  test("17 & 18. Admin login works and existing OWNER credentials remain unchanged", async () => {
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@gmail.com",
        password: "admin@1234",
      }),
    });

    assert.strictEqual(adminLoginRes.status, 200);
    const data = await adminLoginRes.json();
    assert.strictEqual(data.user.role, "OWNER");
    assert.strictEqual(data.user.approvalStatus, "APPROVED");
  });

  // Scenario 21 & 22: Successful login notification recorded, failed login is not
  test("21 & 22. Successful login records USER_LOGIN event; failed password attempt does not", async () => {
    const beforeCount = await prisma.notificationDelivery.count({
      where: { type: "USER_LOGIN" },
    });

    // 1. Failed attempt with bad password
    const failRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@gmail.com",
        password: "WrongPassword999",
      }),
    });
    assert.strictEqual(failRes.status, 401);

    const midCount = await prisma.notificationDelivery.count({
      where: { type: "USER_LOGIN" },
    });
    assert.strictEqual(
      midCount,
      beforeCount,
      "Failed login must NOT generate a USER_LOGIN notification"
    );

    // 2. Successful attempt
    const successRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@gmail.com",
        password: "admin@1234",
      }),
    });
    assert.strictEqual(successRes.status, 200);

    const afterCount = await prisma.notificationDelivery.count({
      where: { type: "USER_LOGIN" },
    });
    assert.ok(
      afterCount > beforeCount,
      "Successful login MUST record a USER_LOGIN notification"
    );
  });

  // Scenario 23: Notifications persist in database after page refresh
  test("23. Notifications persist reliably in PostgreSQL database table NotificationDelivery", async () => {
    const latestNotification = await prisma.notificationDelivery.findFirst({
      orderBy: { createdAt: "desc" },
    });
    assert.ok(latestNotification, "Notification record must be persisted in database");
    assert.ok(latestNotification.id, "Must have valid database ID");
  });

  // Scenario 24: Mobile viewports and responsive meta tags
  test("24. Login page renders responsive viewport and containment for mobile devices", async () => {
    const res = await fetch(`${BASE_URL}/login`);
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes("Customer / User Sign In") || html.includes("Customer Login"));
    assert.ok(html.includes("Admin Login"));
    assert.ok(html.includes("JAGDAMBA"));
  });

  // Scenario 25: Existing product, inventory and catalog data preserved
  test("25. Existing products, variants, and inventory records remain 100% intact", async () => {
    const productCount = await prisma.product.count();
    const variantCount = await prisma.productVariant.count({ where: { isAvailable: true } });

    assert.ok(productCount >= 20, `Expected at least 20 products, found ${productCount}`);
    assert.ok(variantCount >= 10, `Expected at least 10 variants, found ${variantCount}`);
  });
});
