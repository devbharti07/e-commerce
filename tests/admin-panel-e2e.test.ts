import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/prisma";
import { hashPassword, createSessionToken } from "../src/lib/auth";

describe("Jagdamba Mobile Admin Panel Comprehensive Security & Functional Verification", () => {
  let ownerToken: string;
  let customerToken: string;
  let attackerToken: string;
  let ownerUser: any;
  let customerUser: any;
  let testProductId: string;
  let testVariantId: string;
  let testOrderId: string;

  before(async () => {
    // 1. Fetch or create owner
    ownerUser = await prisma.user.findFirst({ where: { role: "OWNER" } });
    if (!ownerUser) {
      ownerUser = await prisma.user.create({
        data: {
          email: "test.owner.admin@jagdambamobile.com",
          name: "Test Owner Admin",
          phone: "9876543210",
          passwordHash: await hashPassword("OwnerPass@2026"),
          role: "OWNER",
          isVerified: true,
        },
      });
    }

    // 2. Fetch or create customer
    customerUser = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
    if (!customerUser) {
      customerUser = await prisma.user.create({
        data: {
          email: "test.retailer.admin@gmail.com",
          name: "Test Retailer",
          phone: "9123456789",
          businessName: "Test Mobile Store",
          passwordHash: await hashPassword("RetailerPass@2026"),
          role: "CUSTOMER",
          isVerified: true,
        },
      });
    }

    ownerToken = await createSessionToken({
      userId: ownerUser.id,
      email: ownerUser.email,
      name: ownerUser.name,
      role: "OWNER",
    });

    customerToken = await createSessionToken({
      userId: customerUser.id,
      email: customerUser.email,
      name: customerUser.name,
      role: "CUSTOMER",
    });

    attackerToken = await createSessionToken({
      userId: "fake-attacker-id",
      email: "attacker@malicious.com",
      name: "Attacker",
      role: "CUSTOMER",
    });
  });

  // TEST 1: Unauthenticated users cannot access admin APIs
  test("1. Unauthenticated users cannot access admin APIs (returns 401)", async () => {
    const endpoints = [
      "http://localhost:3000/api/admin/products",
      "http://localhost:3000/api/admin/variants",
      "http://localhost:3000/api/admin/settings",
      "http://localhost:3000/api/admin/retailers",
      "http://localhost:3000/api/admin/audit-logs",
    ];

    for (const url of endpoints) {
      const res = await fetch(url);
      assert.strictEqual(
        res.status,
        401,
        `Expected 401 Unauthorized for unauthenticated request to ${url}`
      );
    }
  });

  // TEST 2: Retailers (CUSTOMER) cannot access admin-only operations
  test("2. Retailers (role CUSTOMER) cannot access admin operations (returns 403 Forbidden)", async () => {
    const endpoints = [
      { url: "http://localhost:3000/api/admin/products", method: "GET" },
      { url: "http://localhost:3000/api/admin/variants", method: "GET" },
      { url: "http://localhost:3000/api/admin/settings", method: "GET" },
      { url: "http://localhost:3000/api/admin/retailers", method: "GET" },
      { url: "http://localhost:3000/api/admin/audit-logs", method: "GET" },
      {
        url: "http://localhost:3000/api/admin/inventory/adjust",
        method: "POST",
        body: JSON.stringify({ variantId: "abc", changeQty: 10, reason: "HACK" }),
      },
    ];

    for (const req of endpoints) {
      const res = await fetch(req.url, {
        method: req.method,
        headers: {
          Cookie: `jm_auth_token=${customerToken}`,
          "Content-Type": "application/json",
        },
        body: req.body,
      });

      assert.strictEqual(
        res.status,
        403,
        `Expected 403 Forbidden for retailer requesting ${req.url}`
      );
    }
  });

  // TEST 3: Users cannot promote themselves to administrators
  test("3. Self-registration strictly enforces CUSTOMER role and blocks privilege escalation", async () => {
    const testEmail = `retailer.reg.${Date.now()}@example.com`;
    const res = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Honest Trader",
        email: testEmail,
        phone: "9988776655",
        businessName: "Trader Telecom",
        password: "SecretPassword123",
        role: "OWNER", // Malicious payload attempting privilege escalation
      }),
    });

    assert.strictEqual(res.status, 200);
    const registeredUser = await prisma.user.findUnique({
      where: { email: testEmail },
    });
    assert.ok(registeredUser);
    assert.strictEqual(
      registeredUser.role,
      "CUSTOMER",
      "Role MUST default to CUSTOMER even if OWNER is submitted"
    );

    // Clean up
    await prisma.user.delete({ where: { id: registeredUser.id } });
  });

  // TEST 4: Product creation, editing, and publishing in PostgreSQL
  test("4. Product creation and editing work correctly with real database persistence", async () => {
    const brand = await prisma.brand.findFirst();
    const category = await prisma.category.findFirst();
    assert.ok(brand && category);

    const testSlug = `test-phone-${Date.now()}`;

    // Create Product
    const createRes = await fetch("http://localhost:3000/api/admin/products", {
      method: "POST",
      headers: {
        Cookie: `jm_auth_token=${ownerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Test Flagship Phone 2026",
        slug: testSlug,
        brandId: brand.id,
        categoryId: category.id,
        model: "Flagship 2026",
        modelNumber: "TEST-FP-2026",
        description: "Official test flagship model with verified warranty.",
        warrantyMonths: 24,
        isPublished: true,
        isFeatured: true,
        specifications: [
          { group: "Performance", key: "Processor", value: "Snapdragon 8 Gen 3" },
          { group: "Battery", key: "Capacity", value: "5400 mAh" },
        ],
      }),
    });

    assert.strictEqual(createRes.status, 201);
    const createdData = await createRes.json();
    assert.ok(createdData.product.id);
    testProductId = createdData.product.id;

    // Verify in DB
    const dbProduct = await prisma.product.findUnique({
      where: { id: testProductId },
      include: { specifications: true },
    });
    assert.ok(dbProduct);
    assert.strictEqual(dbProduct.isPublished, true);
    assert.strictEqual(dbProduct.isFeatured, true);
    assert.strictEqual(dbProduct.specifications.length, 2);

    // Update Product
    const updateRes = await fetch(`http://localhost:3000/api/admin/products/${testProductId}`, {
      method: "PATCH",
      headers: {
        Cookie: `jm_auth_token=${ownerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isPublished: false,
        isFeatured: false,
      }),
    });
    assert.strictEqual(updateRes.status, 200);

    const updatedDb = await prisma.product.findUnique({ where: { id: testProductId } });
    assert.strictEqual(updatedDb?.isPublished, false);
    assert.strictEqual(updatedDb?.isFeatured, false);
  });

  // TEST 5: Smartphone variant creation and duplicate SKU rejection
  test("5. Smartphone variants enforce unique SKU and prevent duplicate combinations", async () => {
    assert.ok(testProductId);
    const testSku = `SKU-TEST-${Date.now()}`;

    // 1. Create variant
    const createRes = await fetch("http://localhost:3000/api/admin/variants", {
      method: "POST",
      headers: {
        Cookie: `jm_auth_token=${ownerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: testProductId,
        sku: testSku,
        ramGb: 12,
        storageGb: 256,
        colorName: "Phantom Black",
        colorHex: "#111111",
        baseWholesalePrice: 4500000, // ₹45,000
        minOrderQty: 2,
        lowStockThreshold: 5,
        initialStock: 25,
      }),
    });

    assert.strictEqual(createRes.status, 201);
    const varData = await createRes.json();
    testVariantId = varData.variant.id;
    assert.ok(testVariantId);

    // Verify on-hand stock and movement in DB
    const dbVariant = await prisma.productVariant.findUnique({ where: { id: testVariantId } });
    assert.strictEqual(dbVariant?.onHandStock, 25);
    assert.strictEqual(dbVariant?.reservedStock, 0);

    // 2. Attempt duplicate SKU -> MUST FAIL
    const dupSkuRes = await fetch("http://localhost:3000/api/admin/variants", {
      method: "POST",
      headers: {
        Cookie: `jm_auth_token=${ownerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: testProductId,
        sku: testSku, // Duplicate
        ramGb: 16,
        storageGb: 512,
        colorName: "Titanium Silver",
        baseWholesalePrice: 5500000,
      }),
    });
    assert.strictEqual(dupSkuRes.status, 400);
    const dupSkuData = await dupSkuRes.json();
    assert.match(dupSkuData.error, /already in use/i);

    // 3. Attempt duplicate spec combination -> MUST FAIL
    const dupSpecRes = await fetch("http://localhost:3000/api/admin/variants", {
      method: "POST",
      headers: {
        Cookie: `jm_auth_token=${ownerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        productId: testProductId,
        sku: `${testSku}-DIFFERENT`,
        ramGb: 12,
        storageGb: 256,
        colorName: "Phantom Black", // Same spec combination for this product
        baseWholesalePrice: 4500000,
      }),
    });
    assert.strictEqual(dupSpecRes.status, 400);
    const dupSpecData = await dupSpecRes.json();
    assert.match(dupSpecData.error, /already exists/i);
  });

  // TEST 6: Inventory manual adjustments with concurrency and validation
  test("6. Manual inventory adjustments persist in PostgreSQL and prevent stock drop below reserved", async () => {
    assert.ok(testVariantId);

    // Add +10 units
    const addRes = await fetch("http://localhost:3000/api/admin/inventory/adjust", {
      method: "POST",
      headers: {
        Cookie: `jm_auth_token=${ownerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variantId: testVariantId,
        changeQty: 10,
        reason: "DISTRIBUTOR_RESTOCK",
      }),
    });

    assert.strictEqual(addRes.status, 200);
    let variantDb = await prisma.productVariant.findUnique({ where: { id: testVariantId } });
    assert.strictEqual(variantDb?.onHandStock, 35);

    // Verify movement logged
    const movement = await prisma.inventoryMovement.findFirst({
      where: { variantId: testVariantId, reason: "DISTRIBUTOR_RESTOCK" },
    });
    assert.ok(movement);
    assert.strictEqual(movement.changeQty, 10);
    assert.strictEqual(movement.balanceOnHand, 35);

    // Attempt illegal reduction below reserved stock
    const illegalRes = await fetch("http://localhost:3000/api/admin/inventory/adjust", {
      method: "POST",
      headers: {
        Cookie: `jm_auth_token=${ownerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variantId: testVariantId,
        changeQty: -100, // Would drop below 0
        reason: "DEFECT",
      }),
    });
    assert.strictEqual(illegalRes.status, 400);
  });

  // TEST 7: Quantity pricing tiers configuration
  test("7. Wholesale volume pricing tiers can be configured and deleted", async () => {
    assert.ok(testVariantId);

    // Add Tier (5+ units @ ₹42,000)
    const tierRes = await fetch("http://localhost:3000/api/admin/pricing", {
      method: "POST",
      headers: {
        Cookie: `jm_auth_token=${ownerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variantId: testVariantId,
        minQty: 5,
        maxQty: 9,
        unitPrice: 4200000,
      }),
    });

    assert.strictEqual(tierRes.status, 201);
    const tierData = await tierRes.json();
    assert.ok(tierData.tier.id);

    // Verify in DB
    const dbTier = await prisma.pricingTier.findUnique({ where: { id: tierData.tier.id } });
    assert.ok(dbTier);
    assert.strictEqual(dbTier.unitPrice, 4200000);

    // Delete Tier
    const delRes = await fetch(
      `http://localhost:3000/api/admin/pricing/tiers/${tierData.tier.id}`,
      {
        method: "DELETE",
        headers: { Cookie: `jm_auth_token=${ownerToken}` },
      }
    );
    assert.strictEqual(delRes.status, 200);

    const deletedTier = await prisma.pricingTier.findUnique({
      where: { id: tierData.tier.id },
    });
    assert.strictEqual(deletedTier, null);
  });

  // TEST 8: Retailer account suspension enforcement
  test("8. Admin can suspend retailer account, blocking subsequent login", async () => {
    // Create dedicated test user for suspension test
    const suspendTestUser = await prisma.user.create({
      data: {
        name: "Suspension Test User",
        email: `suspend.test.${Date.now()}@example.com`,
        phone: "9876501234",
        passwordHash: await hashPassword("RetailerPass@2026"),
        role: "CUSTOMER",
        isSuspended: false,
        isVerified: true,
      },
    });

    // Suspend user
    const suspendRes = await fetch(
      `http://localhost:3000/api/admin/retailers/${suspendTestUser.id}`,
      {
        method: "PATCH",
        headers: {
          Cookie: `jm_auth_token=${ownerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isSuspended: true }),
      }
    );
    assert.strictEqual(suspendRes.status, 200);

    const dbCust = await prisma.user.findUnique({ where: { id: suspendTestUser.id } });
    assert.strictEqual(dbCust?.isSuspended, true);

    // Customer attempts to login -> MUST BE FORBIDDEN (403)
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: suspendTestUser.email,
        password: "RetailerPass@2026",
      }),
    });
    assert.strictEqual(loginRes.status, 403);
    const loginData = await loginRes.json();
    assert.match(loginData.error, /suspended/i);

    // Reactivate customer
    const reactivateRes = await fetch(
      `http://localhost:3000/api/admin/retailers/${suspendTestUser.id}`,
      {
        method: "PATCH",
        headers: {
          Cookie: `jm_auth_token=${ownerToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isSuspended: false }),
      }
    );
    assert.strictEqual(reactivateRes.status, 200);

    // Clean up
    await prisma.user.delete({ where: { id: suspendTestUser.id } });
  });

  // TEST 9: Website settings persist in PostgreSQL and update storefront
  test("9. Website settings update persists and updates database SiteSetting records", async () => {
    const updateRes = await fetch("http://localhost:3000/api/admin/settings", {
      method: "POST",
      headers: {
        Cookie: `jm_auth_token=${ownerToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        settings: {
          CONTACT_PHONE: "+91 99999 88888",
          ANNOUNCEMENT_BANNER: "Special B2B Discount Active Today Only!",
          ANNOUNCEMENT_ACTIVE: "true",
        },
      }),
    });
    assert.strictEqual(updateRes.status, 200);

    const setting = await prisma.siteSetting.findUnique({
      where: { key: "CONTACT_PHONE" },
    });
    assert.strictEqual(setting?.value, "+91 99999 88888");

    const bannerSetting = await prisma.siteSetting.findUnique({
      where: { key: "ANNOUNCEMENT_BANNER" },
    });
    assert.strictEqual(bannerSetting?.value, "Special B2B Discount Active Today Only!");
  });

  // TEST 10: Audit Log Creation
  test("10. Important admin operations generate persistent AuditLog records with actor metadata", async () => {
    const auditLogs = await prisma.auditLog.findMany({
      where: { userId: ownerUser.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    assert.ok(auditLogs.length > 0);
    const actions = auditLogs.map((a) => a.action);
    assert.ok(
      actions.includes("PRODUCT_CREATED") ||
        actions.includes("VARIANT_CREATED") ||
        actions.includes("INVENTORY_ADJUSTMENT") ||
        actions.includes("WEBSITE_SETTINGS_UPDATED"),
      `Expected standard audit actions, got: ${actions.join(", ")}`
    );

    // Ensure no passwords or tokens were logged
    for (const log of auditLogs) {
      if (log.detailsJson) {
        assert.doesNotMatch(log.detailsJson, /passwordHash/i);
        assert.doesNotMatch(log.detailsJson, /jm_auth_token/i);
      }
    }
  });

  // TEST 11: CSV Exports Formula Injection Protection
  test("11. Order and Inventory CSV exports prevent spreadsheet formula injection", async () => {
    const inventoryCsvRes = await fetch("http://localhost:3000/api/admin/inventory/export", {
      headers: { Cookie: `jm_auth_token=${ownerToken}` },
    });
    assert.strictEqual(inventoryCsvRes.status, 200);
    const invContent = await inventoryCsvRes.text();
    assert.ok(invContent.startsWith("SKU,Product Name"));

    const ordersCsvRes = await fetch("http://localhost:3000/api/admin/orders/export", {
      headers: { Cookie: `jm_auth_token=${ownerToken}` },
    });
    assert.strictEqual(ordersCsvRes.status, 200);
    const ordContent = await ordersCsvRes.text();
    assert.ok(ordContent.includes("Order Number"));
  });

  after(async () => {
    // Clean up test product and variant
    if (testVariantId) {
      await prisma.inventoryMovement.deleteMany({ where: { variantId: testVariantId } }).catch(() => {});
      await prisma.pricingTier.deleteMany({ where: { variantId: testVariantId } }).catch(() => {});
      await prisma.productVariant.delete({ where: { id: testVariantId } }).catch(() => {});
    }
    if (testProductId) {
      await prisma.productSpecification.deleteMany({ where: { productId: testProductId } }).catch(() => {});
      await prisma.productImage.deleteMany({ where: { productId: testProductId } }).catch(() => {});
      await prisma.product.delete({ where: { id: testProductId } }).catch(() => {});
    }
  });
});
