import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { createSessionToken, hashPassword, AUTH_COOKIE_NAME } from "../src/lib/auth";
import { isSafeRedirectPath, getSafeRedirectPath } from "../src/proxy";
import { resetRateLimit } from "../src/lib/rate-limit";

const BASE_URL = "http://localhost:3000";

describe("Jagdamba Mobile End-to-End Security Audit Verification (Phases 1-13)", () => {
  let ownerToken: string;
  let customerAToken: string;
  let customerBToken: string;
  let pendingToken: string;
  let ownerUser: any;
  let customerUserA: any;
  let customerUserB: any;
  let pendingUser: any;
  let testVariant: any;
  let customerAOrderId: string;

  before(async () => {
    // 1. Ensure Owner exists
    ownerUser = await prisma.user.findFirst({ where: { role: "OWNER" } });
    if (!ownerUser) {
      ownerUser = await prisma.user.create({
        data: {
          email: "security.owner@jagdambamobile.com",
          name: "Security Audit Owner",
          phone: "9800000001",
          passwordHash: await hashPassword("OwnerSecure@2026"),
          role: "OWNER",
          approvalStatus: "APPROVED",
          isVerified: true,
        },
      });
    }

    // 2. Ensure Customer A exists
    customerUserA = await prisma.user.findUnique({ where: { email: "rajesh.mobile@gmail.com" } });
    if (!customerUserA) {
      customerUserA = await prisma.user.create({
        data: {
          email: "rajesh.mobile@gmail.com",
          name: "Rajesh Kumar",
          phone: "9876543210",
          passwordHash: await hashPassword("Retailer@1234"),
          role: "CUSTOMER",
          approvalStatus: "APPROVED",
          isVerified: true,
        },
      });
    }

    // 3. Ensure Customer B exists (for IDOR testing)
    customerUserB = await prisma.user.findUnique({ where: { email: "security.retailer.b@gmail.com" } });
    if (!customerUserB) {
      customerUserB = await prisma.user.create({
        data: {
          email: "security.retailer.b@gmail.com",
          name: "Retailer B Store",
          phone: "9800000002",
          passwordHash: await hashPassword("RetailerB@2026"),
          role: "CUSTOMER",
          approvalStatus: "APPROVED",
          isVerified: true,
        },
      });
    }

    // 4. Ensure Pending User exists
    pendingUser = await prisma.user.findUnique({ where: { email: "security.pending.user@gmail.com" } });
    if (!pendingUser) {
      pendingUser = await prisma.user.create({
        data: {
          email: "security.pending.user@gmail.com",
          name: "Pending Applicant",
          phone: "9800000003",
          passwordHash: await hashPassword("Pending@2026"),
          role: "CUSTOMER",
          approvalStatus: "PENDING",
          isVerified: false,
        },
      });
    }

    // 5. Generate Session Tokens
    ownerToken = await createSessionToken({
      userId: ownerUser.id,
      email: ownerUser.email,
      name: ownerUser.name,
      role: "OWNER",
    });

    customerAToken = await createSessionToken({
      userId: customerUserA.id,
      email: customerUserA.email,
      name: customerUserA.name,
      role: "CUSTOMER",
    });

    customerBToken = await createSessionToken({
      userId: customerUserB.id,
      email: customerUserB.email,
      name: customerUserB.name,
      role: "CUSTOMER",
    });

    pendingToken = await createSessionToken({
      userId: pendingUser.id,
      email: pendingUser.email,
      name: pendingUser.name,
      role: "CUSTOMER",
    });

    // 6. Find a test variant with stock
    testVariant = await prisma.productVariant.findFirst({
      where: { isAvailable: true, onHandStock: { gte: 10 } },
      include: { product: true },
    });
    assert.ok(testVariant, "At least one product variant must exist with available stock");

    // 7. Create a baseline order for Customer A (to test IDOR)
    const orderCount = await prisma.order.count();
    const orderNumber = `JM-SEC-${String(orderCount + 1).padStart(4, "0")}`;
    const testOrder = await prisma.order.create({
      data: {
        orderNumber,
        customerId: customerUserA.id,
        status: "REQUESTED",
        subtotal: testVariant.baseWholesalePrice * 2,
        totalAmount: testVariant.baseWholesalePrice * 2,
        shippingAddressSnapshot: JSON.stringify({
          fullName: "Rajesh Kumar",
          mobileNumber: "9876543210",
          houseOrShop: "Shop 101",
          street: "Main Market",
          city: "New Delhi",
          state: "Delhi",
          pinCode: "110001",
        }),
        items: {
          create: [
            {
              variantId: testVariant.id,
              productName: testVariant.product.name,
              variantName: `${testVariant.ramGb}GB/${testVariant.storageGb}GB`,
              sku: testVariant.sku,
              ramGb: testVariant.ramGb,
              storageGb: testVariant.storageGb,
              colorName: testVariant.colorName,
              quantity: 2,
              unitPrice: testVariant.baseWholesalePrice,
              lineTotal: testVariant.baseWholesalePrice * 2,
            },
          ],
        },
      },
    });
    customerAOrderId = testOrder.id;

    // Ensure store is open for order testing during security audit
    await prisma.storeSchedule.upsert({
      where: { id: "default" },
      update: { scheduleMode: "FORCE_OPEN", acceptOrders: true },
      create: {
        id: "default",
        acceptOrders: true,
        scheduleMode: "FORCE_OPEN",
        openTime: "09:00",
        closeTime: "23:00",
        timeZone: "Asia/Kolkata",
        closureMessage: "Our ordering service is currently unavailable. Please check back during our service hours.",
        version: 1,
      },
    });
  });

  after(async () => {
    // Cleanup temporary test order
    if (customerAOrderId) {
      await prisma.orderItem.deleteMany({ where: { orderId: customerAOrderId } }).catch(() => {});
      await prisma.message.deleteMany({ where: { conversation: { orderId: customerAOrderId } } }).catch(() => {});
      await prisma.conversation.deleteMany({ where: { orderId: customerAOrderId } }).catch(() => {});
      await prisma.order.delete({ where: { id: customerAOrderId } }).catch(() => {});
    }
    // Cleanup temporary test users created for IDOR and pending auth tests
    if (customerUserB?.id) {
      await prisma.user.delete({ where: { id: customerUserB.id } }).catch(() => {});
    }
    if (pendingUser?.id) {
      await prisma.user.delete({ where: { id: pendingUser.id } }).catch(() => {});
    }
    // Restore store availability to FOLLOW_SCHEDULE
    await prisma.storeSchedule.updateMany({
      where: { id: "default" },
      data: { scheduleMode: "FOLLOW_SCHEDULE", acceptOrders: true },
    }).catch(() => {});
  });

  // TEST 1: SQL Injection Strings Submitted to Search
  it("1. SQL injection strings submitted to search are safely handled as string literals", async () => {
    const payloads = [
      "' OR '1'='1",
      "'; DROP TABLE \"User\"; --",
      "UNION SELECT id, email, passwordHash FROM \"User\" --",
      "1' ORDER BY 1--+",
      "1' AND SLEEP(5)--",
    ];

    for (const sqli of payloads) {
      const res = await fetch(`${BASE_URL}/catalog?q=${encodeURIComponent(sqli)}`);
      assert.equal(res.status, 200, `Catalog must respond 200 for SQLi payload: ${sqli}`);
      const body = await res.text();
      // Ensure page did not crash with database error
      assert.ok(!body.includes("syntax error at or near"), "Must not leak PostgreSQL syntax errors");
      assert.ok(!body.includes("pg_type"), "Must not leak database metadata");
    }

    // Verify User table is completely intact
    const count = await prisma.user.count();
    assert.ok(count > 0, "User table must remain 100% intact after SQL injection attempts");
  });

  // TEST 2: SQL Injection Strings Submitted to Filters and Sorting
  it("2. SQL injection strings submitted to sort and filter params do not alter query logic", async () => {
    const maliciousSorts = [
      "price_asc; DROP TABLE \"Product\";--",
      "' OR 1=1 --",
      "createdAt DESC; SELECT * FROM \"User\";",
    ];

    for (const sortPayload of maliciousSorts) {
      const res = await fetch(`${BASE_URL}/catalog?sort=${encodeURIComponent(sortPayload)}`);
      assert.equal(res.status, 200, `Catalog must safely handle unallowlisted sort: ${sortPayload}`);
    }

    // Verify Product table remains intact
    const productCount = await prisma.product.count();
    assert.ok(productCount > 0, "Product table must remain 100% intact");
  });

  // TEST 3: Malformed Identifiers and Unexpected Input Types
  it("3. Malformed identifiers and unexpected input types return clean 400/404 errors", async () => {
    // Malformed ID in order sync
    const resSync = await fetch(`${BASE_URL}/api/orders/../../etc/passwd/sync`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${customerAToken}` },
    });
    assert.ok([400, 404].includes(resSync.status), "Malformed path traversal ID must return 400 or 404");

    // Invalid non-existent ID
    const resStatus = await fetch(`${BASE_URL}/api/orders/invalid-uuid-format-99999/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
      },
      body: JSON.stringify({ status: "CONFIRMED" }),
    });
    assert.equal(resStatus.status, 404, "Non-existent order ID must return 404");

    // Unexpected types in Profile update
    const resProfile = await fetch(`${BASE_URL}/api/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerAToken}`,
      },
      body: JSON.stringify({ name: 12345, phone: true }),
    });
    assert.equal(resProfile.status, 400, "Unexpected types must fail Zod validation with 400");
  });

  // TEST 4: Unauthorized Access to Admin Endpoints
  it("4. Admin endpoints strictly require authenticated OWNER role and reject unauthenticated / customers", async () => {
    const adminEndpoints = [
      "/api/admin/products",
      "/api/admin/retailers",
      "/api/admin/registration-requests",
      "/api/admin/settings",
      "/api/admin/audit-logs",
    ];

    for (const endpoint of adminEndpoints) {
      // 1. Unauthenticated request -> 401
      const unauth = await fetch(`${BASE_URL}${endpoint}`);
      assert.equal(unauth.status, 401, `Unauthenticated request to ${endpoint} must return 401`);

      // 2. Customer token -> 403 Forbidden
      const cust = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { Cookie: `${AUTH_COOKIE_NAME}=${customerAToken}` },
      });
      assert.equal(cust.status, 403, `Customer request to ${endpoint} must return 403 Forbidden`);

      // 3. Owner token -> 200 OK
      const owner = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}` },
      });
      assert.equal(owner.status, 200, `Owner request to ${endpoint} must return 200 OK`);
    }
  });

  // TEST 5: Unauthorized Access to Another User's Resources (IDOR)
  it("5. Customer cannot access, cancel, or message other customers' orders (IDOR prevention)", async () => {
    // Customer B attempts to cancel Customer A's order -> 403 Forbidden
    const cancelRes = await fetch(`${BASE_URL}/api/orders/${customerAOrderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerBToken}`,
      },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    assert.equal(cancelRes.status, 403, "Customer B cannot cancel Customer A's order");

    // Customer B attempts to post message to Customer A's order -> 403 Forbidden
    const msgRes = await fetch(`${BASE_URL}/api/orders/${customerAOrderId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerBToken}`,
      },
      body: JSON.stringify({ content: "Malicious unauthorized message from Customer B" }),
    });
    assert.equal(msgRes.status, 403, "Customer B cannot message Customer A's order");

    // Customer B attempts to sync/read Customer A's order details -> 403 Forbidden
    const syncRes = await fetch(`${BASE_URL}/api/orders/${customerAOrderId}/sync`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${customerBToken}` },
    });
    assert.equal(syncRes.status, 403, "Customer B cannot read Customer A's order sync details");
  });

  // TEST 6: Customer Role Escalation Attempts
  it("6. Customer cannot escalate their role or bypass approval status via profile updates", async () => {
    const res = await fetch(`${BASE_URL}/api/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerAToken}`,
      },
      body: JSON.stringify({
        name: "Rajesh Escalation Attempt",
        phone: "9876543210",
        role: "OWNER",
        approvalStatus: "APPROVED",
        isSuspended: false,
      }),
    });
    assert.equal(res.status, 200);

    // Verify DB authoritative record: role MUST remain CUSTOMER
    const userInDb = await prisma.user.findUnique({ where: { id: customerUserA.id } });
    assert.equal(userInDb?.role, "CUSTOMER", "User role must not be altered by profile PATCH");
  });

  // TEST 7: Pending Registration Approval Bypass Attempts
  it("7. Customers in PENDING approval status cannot log in or access protected customer APIs", async () => {
    // 1. Login attempt with pending credentials -> 403 Forbidden
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "security.pending.user@gmail.com",
        password: "Pending@2026",
      }),
    });
    assert.equal(loginRes.status, 403, "Pending customer login must be rejected with 403");
    const loginData = await loginRes.json();
    assert.equal(loginData.approvalStatus, "PENDING");

    // 2. Protected customer endpoint access with pending token -> 403 Forbidden
    const meRes = await fetch(`${BASE_URL}/api/profile`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${pendingToken}` },
    });
    assert.equal(meRes.status, 403, "Pending customer token must be denied access to protected endpoints");
  });

  // TEST 8: Stored and Reflected XSS Attempts
  it("8. Malicious script injection in product image URLs is blocked (XSS prevention)", async () => {
    const xssPayloads = [
      "javascript:alert(document.domain)",
      "data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==",
      "vbscript:msgbox(1)",
    ];

    for (const urlPayload of xssPayloads) {
      const res = await fetch(`${BASE_URL}/api/admin/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${AUTH_COOKIE_NAME}=${ownerToken}`,
        },
        body: JSON.stringify({
          name: "XSS Test Phone",
          slug: `xss-test-phone-${Date.now()}`,
          brandId: testVariant.product.brandId,
          categoryId: testVariant.product.categoryId,
          model: "XSS Model",
          modelNumber: "XSS-001",
          description: "Testing XSS resistance in product creation",
          imageUrl: urlPayload,
        }),
      });

      assert.equal(
        res.status,
        400,
        `Malicious imageUrl protocol ${urlPayload} must be rejected with 400 Bad Request`
      );
      const data = await res.json();
      assert.ok(data.error.includes("http:// or https://"));
    }
  });

  // TEST 9: Open Redirect Protection
  it("9. Protocol-relative, backslash, and external redirect attempts are strictly neutralized", () => {
    const maliciousRedirects = [
      "//evil.com",
      "/\\evil.com",
      "/\\/evil.com",
      "https://attacker.com",
      "javascript:alert(1)",
      "//google.com/%2f..",
      "/login\r\nSet-Cookie: evil=1",
    ];

    for (const badRedirect of maliciousRedirects) {
      assert.equal(
        isSafeRedirectPath(badRedirect),
        false,
        `Should reject unsafe redirect target: ${badRedirect}`
      );
      assert.equal(
        getSafeRedirectPath(badRedirect, "/"),
        "/",
        `Must fallback to '/' for unsafe target: ${badRedirect}`
      );
    }

    // Valid internal paths
    assert.equal(isSafeRedirectPath("/admin"), true);
    assert.equal(isSafeRedirectPath("/catalog?brand=apple"), true);
    assert.equal(isSafeRedirectPath("/cart"), true);
  });

  // TEST 10: CSRF Protection on State-Changing API Requests
  it("10. State-changing requests with cookie auth reject mismatched external origins (CSRF)", async () => {
    const res = await fetch(`${BASE_URL}/api/orders/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://malicious-attacker-domain.xyz",
        Cookie: `${AUTH_COOKIE_NAME}=${customerAToken}`,
      },
      body: JSON.stringify({
        items: [{ variantId: testVariant.id, quantity: 2 }],
        addressSnapshot: {
          fullName: "CSRF Attacker",
          mobileNumber: "9876543210",
          houseOrShop: "Evil HQ",
          street: "Attacker St",
          city: "Dark City",
          state: "Delhi",
          pinCode: "110001",
        },
      }),
    });

    assert.equal(res.status, 403, "Must reject cross-origin CSRF POST request with 403 Forbidden");
    const data = await res.json();
    assert.ok(data.error.includes("CSRF check failed"), "Response error must cite CSRF protection");
  });

  // TEST 11: Security Headers Verification
  it("11. Responses deliver required security headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)", async () => {
    const res = await fetch(`${BASE_URL}/`);
    assert.equal(res.status, 200);

    const headers = res.headers;
    assert.equal(headers.get("x-frame-options"), "DENY", "X-Frame-Options must be DENY");
    assert.equal(headers.get("x-content-type-options"), "nosniff", "X-Content-Type-Options must be nosniff");
    assert.ok(headers.get("referrer-policy")?.includes("strict-origin"), "Referrer-Policy must be strict");
    assert.ok(headers.get("content-security-policy")?.includes("frame-ancestors 'none'"), "CSP must include frame-ancestors 'none'");
  });

  // TEST 12: Manipulated Product Prices & Server-Authoritative Totals
  it("12. Server strictly recalculates line items and order totals from database pricing (ignoring client prices)", async () => {
    const requestedQty = Math.max(testVariant.minOrderQty || 1, 2);
    const authoritiveUnitPrice = testVariant.baseWholesalePrice;
    const expectedSubtotal = authoritiveUnitPrice * requestedQty;

    // Client attempts to submit order with unitPrice = ₹1 (100 paise)
    const res = await fetch(`${BASE_URL}/api/orders/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerAToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            variantId: testVariant.id,
            quantity: requestedQty,
            unitPrice: 100, // Attacker attempts to pay 1 Rupee!
            lineTotal: 200,
          },
        ],
        addressSnapshot: {
          fullName: "Rajesh Kumar",
          mobileNumber: "9876543210",
          houseOrShop: "Shop 101",
          street: "Main Market",
          city: "New Delhi",
          state: "Delhi",
          pinCode: "110001",
        },
      }),
    });

    assert.equal(res.status, 200, "Order request succeeds");
    const data = await res.json();
    assert.equal(
      data.order.totalAmount,
      expectedSubtotal,
      `Order total MUST equal database authoritative total (${expectedSubtotal}), not tampered price (200)`
    );

    // Clean up created order
    await prisma.orderItem.deleteMany({ where: { orderId: data.order.id } });
    await prisma.conversation.deleteMany({ where: { orderId: data.order.id } });
    await prisma.auditLog.deleteMany({ where: { entityId: data.order.id } });
    await prisma.order.delete({ where: { id: data.order.id } });
  });

  // TEST 13: Concurrent Inventory & Over-Reservation Safety
  it("13. Server rejects order requests exceeding live available stock (onHand - reserved)", async () => {
    const currentOnHand = testVariant.onHandStock;
    const currentReserved = testVariant.reservedStock;
    const available = currentOnHand - currentReserved;

    const res = await fetch(`${BASE_URL}/api/orders/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${AUTH_COOKIE_NAME}=${customerAToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            variantId: testVariant.id,
            quantity: available + 9999, // Exceeds available stock
          },
        ],
        addressSnapshot: {
          fullName: "Rajesh Kumar",
          mobileNumber: "9876543210",
          houseOrShop: "Shop 101",
          street: "Main Market",
          city: "New Delhi",
          state: "Delhi",
          pinCode: "110001",
        },
      }),
    });

    assert.equal(res.status, 400, "Must reject order exceeding available inventory");
    const data = await res.json();
    assert.ok(data.error.includes("Insufficient live stock"));
  });

  // TEST 14: Sensitive Information Leakage in Error Responses
  it("14. Error responses do not reveal raw SQL queries, stack traces, or server file paths", async () => {
    // 1. Invalid JSON body to /api/auth/login
    const resBadJson = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "INVALID_JSON_BODY{{{",
    });
    assert.equal(resBadJson.status, 400);
    const textBadJson = await resBadJson.text();
    assert.ok(!textBadJson.includes("C:\\e-commerce"), "Must not leak filesystem paths");
    assert.ok(!textBadJson.includes("node_modules"), "Must not leak internal stack traces");

    // 2. Invalid credentials to /api/auth/login
    const resBadCreds = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "nonexistent.dealer@example.com",
        password: "WrongPassword@123",
      }),
    });
    assert.equal(resBadCreds.status, 401);
    const credData = await resBadCreds.json();
    assert.equal(credData.error, "Invalid credentials", "Must return generic authentication error");
  });

  // TEST 15: Immediate Session Invalidation upon Account Suspension
  it("15. Suspended accounts are immediately blocked on subsequent requests even with active JWT token", async () => {
    // 1. Verify Customer A is currently active
    const beforeSuspend = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${customerAToken}` },
    });
    assert.equal(beforeSuspend.status, 200, "Customer A token is initially valid");

    // 2. Admin suspends Customer A in database
    await prisma.user.update({
      where: { id: customerUserA.id },
      data: { isSuspended: true },
    });

    try {
      // 3. Customer A immediately tries to access protected endpoint with existing JWT
      const afterSuspend = await fetch(`${BASE_URL}/api/profile`, {
        headers: { Cookie: `${AUTH_COOKIE_NAME}=${customerAToken}` },
      });
      assert.equal(
        afterSuspend.status,
        403,
        "Customer A token must be immediately rejected with 403 Forbidden upon account suspension"
      );
      const data = await afterSuspend.json();
      assert.ok(data.error.includes("suspended"));

      // 4. Verify /api/auth/me also returns 401 unauthenticated
      const meAfterSuspend = await fetch(`${BASE_URL}/api/auth/me`, {
        headers: { Cookie: `${AUTH_COOKIE_NAME}=${customerAToken}` },
      });
      assert.equal(meAfterSuspend.status, 401);
    } finally {
      // 5. Restore Customer A active status
      await prisma.user.update({
        where: { id: customerUserA.id },
        data: { isSuspended: false },
      });
    }

    // 6. Customer A can access again once reactivated
    const afterReactivate = await fetch(`${BASE_URL}/api/profile`, {
      headers: { Cookie: `${AUTH_COOKIE_NAME}=${customerAToken}` },
    });
    assert.equal(afterReactivate.status, 200, "Customer A token works again after reactivation");
  });
});
