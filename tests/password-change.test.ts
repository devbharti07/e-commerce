import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { hashPassword, verifyPassword, createSessionToken, AUTH_COOKIE_NAME } from "../src/lib/auth";

const BASE_URL = process.env.TEST_BASE_URL || (process.env.PORT ? `http://localhost:${process.env.PORT}` : "http://localhost:3001");
const parsedBase = new URL(BASE_URL);
const TEST_ORIGIN = parsedBase.origin;
const TEST_HOST = parsedBase.host;

describe("Password Change Functionality & Security Verification", () => {
  let testUserEmail: string;
  let testUserId: string;
  let testSessionCookie: string;
  const initialPassword = "InitialPassword@2026";
  const updatedPassword = "UpdatedPassword@2026";

  before(async () => {
    testUserEmail = `password.change.test.${Date.now()}@example.com`;
    const initialHash = await hashPassword(initialPassword);

    const createdUser = await prisma.user.create({
      data: {
        name: "Test Retailer",
        email: testUserEmail,
        phone: "+91 99880 11223",
        businessName: "Test Wholesale Shop",
        gstNumber: "07AAAAA0000A1Z5",
        passwordHash: initialHash,
        role: "CUSTOMER",
        approvalStatus: "APPROVED",
        isVerified: true,
      },
    });

    testUserId = createdUser.id;

    // Create authenticated session token
    const token = await createSessionToken({
      userId: createdUser.id,
      email: createdUser.email,
      role: createdUser.role as "CUSTOMER",
      name: createdUser.name,
    });

    testSessionCookie = `${AUTH_COOKIE_NAME}=${token}`;
  });

  after(async () => {
    // Clean up test user
    if (testUserId) {
      await prisma.auditLog.deleteMany({ where: { userId: testUserId } }).catch(() => {});
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
  });

  test("1. Unauthenticated request to change password returns 401 Unauthorized", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: updatedPassword,
        confirmPassword: updatedPassword,
      }),
    });

    assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
    const data = await res.json();
    assert.ok(data.error, "Response must contain error message");
  });

  test("2. Missing fields return 400 Bad Request with validation errors", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: testSessionCookie,
        Host: TEST_HOST,
        Origin: TEST_ORIGIN,
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        // missing newPassword and confirmPassword
      }),
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error);
  });

  test("3. Weak new password (< 6 chars) is rejected with 400 Bad Request", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: testSessionCookie,
        Host: TEST_HOST,
        Origin: TEST_ORIGIN,
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: "123",
        confirmPassword: "123",
      }),
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes("6 characters"));
  });

  test("4. Mismatched new password and confirmation returns 400 Bad Request", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: testSessionCookie,
        Host: TEST_HOST,
        Origin: TEST_ORIGIN,
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: updatedPassword,
        confirmPassword: "DifferentPassword@2026",
      }),
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes("do not match"));
  });

  test("5. Reusing current password as new password returns 400 Bad Request", async () => {
    const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: testSessionCookie,
        Host: TEST_HOST,
        Origin: TEST_ORIGIN,
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: initialPassword,
        confirmPassword: initialPassword,
      }),
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes("different"));
  });

  test("6. Incorrect current password returns 400 Bad Request and does NOT change password", async () => {
    const userBefore = await prisma.user.findUnique({ where: { id: testUserId } });

    const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: testSessionCookie,
        Host: TEST_HOST,
        Origin: TEST_ORIGIN,
      },
      body: JSON.stringify({
        currentPassword: "WrongPassword@999",
        newPassword: updatedPassword,
        confirmPassword: updatedPassword,
      }),
    });

    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes("incorrect"));

    // Verify hash in database remains unchanged
    const userAfter = await prisma.user.findUnique({ where: { id: testUserId } });
    assert.strictEqual(userBefore?.passwordHash, userAfter?.passwordHash);
  });

  test("7. Valid current password successfully updates only the authenticated user's password hash", async () => {
    const userBefore = await prisma.user.findUnique({ where: { id: testUserId } });
    assert.ok(userBefore);

    const res = await fetch(`${BASE_URL}/api/auth/change-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: testSessionCookie,
        Host: TEST_HOST,
        Origin: TEST_ORIGIN,
      },
      body: JSON.stringify({
        currentPassword: initialPassword,
        newPassword: updatedPassword,
        confirmPassword: updatedPassword,
      }),
    });

    assert.strictEqual(res.status, 200, `Expected 200 OK, got ${res.status}`);
    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.message.includes("successfully"));

    // Verify database record
    const userAfter = await prisma.user.findUnique({ where: { id: testUserId } });
    assert.ok(userAfter);
    assert.notStrictEqual(userAfter.passwordHash, userBefore.passwordHash);

    // Verify that the new hash verifies with updatedPassword using bcrypt
    const verifiesWithNew = await verifyPassword(updatedPassword, userAfter.passwordHash);
    assert.strictEqual(verifiesWithNew, true, "New password must verify with stored hash");

    // Verify that old password no longer verifies
    const verifiesWithOld = await verifyPassword(initialPassword, userAfter.passwordHash);
    assert.strictEqual(verifiesWithOld, false, "Old password must NOT verify with updated hash");

    // Verify preservation of account role, approval status, business details
    assert.strictEqual(userAfter.role, userBefore.role);
    assert.strictEqual(userAfter.approvalStatus, userBefore.approvalStatus);
    assert.strictEqual(userAfter.name, userBefore.name);
    assert.strictEqual(userAfter.email, userBefore.email);
    assert.strictEqual(userAfter.phone, userBefore.phone);
    assert.strictEqual(userAfter.businessName, userBefore.businessName);
    assert.strictEqual(userAfter.gstNumber, userBefore.gstNumber);
  });

  test("8. Login with old password fails (401), while login with new password succeeds (200)", async () => {
    // 1. Old password fails
    const oldLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUserEmail,
        password: initialPassword,
      }),
    });

    assert.strictEqual(oldLoginRes.status, 401, "Login with old password must return 401");

    // 2. New password succeeds
    const newLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testUserEmail,
        password: updatedPassword,
      }),
    });

    assert.strictEqual(newLoginRes.status, 200, "Login with new password must return 200");
    const newLoginData = await newLoginRes.json();
    assert.strictEqual(newLoginData.success, true);
    assert.strictEqual(newLoginData.user.email, testUserEmail);

    const setCookie = newLoginRes.headers.get("set-cookie") || "";
    assert.ok(setCookie.includes(AUTH_COOKIE_NAME), "Must receive active auth session cookie");
  });

  test("9. Profile page /profile renders Change Password button and accessible modal structure", async () => {
    const profileRes = await fetch(`${BASE_URL}/profile`, {
      headers: { Cookie: testSessionCookie },
    });

    assert.strictEqual(profileRes.status, 200);
    const html = await profileRes.text();
    assert.ok(html.includes("Change Password"), "Page must contain Change Password action");
    assert.ok(html.includes("Security &amp; Authentication") || html.includes("Security & Authentication"), "Page must contain Security & Authentication section");
  });
});
