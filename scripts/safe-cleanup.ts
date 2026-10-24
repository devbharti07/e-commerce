import { prisma } from "../src/lib/prisma";

// Protected admin account IDs and emails
const PROTECTED_ADMIN_IDS = [
  "cmve3tv790000vlpo2l2mbyos", // admin@gmail.com
  "cmvcojv880000vlu0hdb1lf9c", // owner@jagdambamobile.com
];

const PROTECTED_ADMIN_EMAILS = [
  "admin@gmail.com",
  "owner@jagdambamobile.com",
];

const PROTECTED_GENUINE_CUSTOMERS = [
  "rajesh.mobile@gmail.com",
];

// Explicit test email allowlist patterns
const TEST_EMAIL_PATTERNS = [
  /^suspend\.test\.\d+@example\.com$/,
  /^retailer\.reg\.\d+@example\.com$/,
  /^dealer\.pending\.\d+@example\.com$/,
  /^security\.retailer\.b@gmail\.com$/,
  /^security\.pending\.user@gmail\.com$/,
];

export async function runSafeCleanup(isExecute: boolean = false) {
  console.log("==================================================");
  console.log(`SAFE DATABASE CLEANUP RUNNING (Mode: ${isExecute ? "EXECUTE" : "DRY RUN"})`);
  console.log("==================================================");

  // 1. Verify baseline protection counts
  const adminUsers = await prisma.user.findMany({
    where: { role: "OWNER" },
    select: { id: true, email: true, passwordHash: true, role: true },
  });

  console.log(`Protected Admin Accounts Found: ${adminUsers.length}`);
  for (const admin of adminUsers) {
    if (!PROTECTED_ADMIN_IDS.includes(admin.id)) {
      throw new Error(`Unexpected admin account found: ${admin.email} (${admin.id}). Aborting.`);
    }
    console.log(` - Admin: ${admin.email} (ID: ${admin.id}, HashPrefix: ${admin.passwordHash.slice(0, 10)})`);
  }

  const productCount = await prisma.product.count();
  const variantCount = await prisma.productVariant.count();
  const orderCount = await prisma.order.count();
  console.log(`Protected Catalog Status: ${productCount} products, ${variantCount} variants`);
  console.log(`Protected Order Status: ${orderCount} orders`);

  if (productCount < 22 || variantCount < 53) {
    throw new Error(`Product/Variant baseline below expected (22/53). Aborting.`);
  }

  // 2. Identify test users
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      _count: {
        select: {
          orders: true,
          addresses: true,
          auditLogs: true,
          conversations: true,
        },
      },
    },
  });

  const testUsersToDelete: typeof allUsers = [];
  const genuineUsersPreserved: typeof allUsers = [];

  for (const user of allUsers) {
    if (PROTECTED_ADMIN_EMAILS.includes(user.email) || PROTECTED_GENUINE_CUSTOMERS.includes(user.email)) {
      genuineUsersPreserved.push(user);
      continue;
    }

    const isMatch = TEST_EMAIL_PATTERNS.some((pattern) => pattern.test(user.email));
    if (isMatch) {
      if (user.role === "OWNER") {
        throw new Error(`Safety violation: Test pattern matched an OWNER account ${user.email}! Aborting.`);
      }
      if (user._count.orders > 0) {
        throw new Error(`Safety violation: Test candidate ${user.email} has genuine orders! Aborting.`);
      }
      testUsersToDelete.push(user);
    } else {
      genuineUsersPreserved.push(user);
    }
  }

  console.log(`\n--- USERS CLASSIFICATION ---`);
  console.log(`Confirmed Test Accounts To Remove: ${testUsersToDelete.length}`);
  testUsersToDelete.forEach((u) => {
    console.log(` - [TEST] ${u.email} (ID: ${u.id}, AuditLogs: ${u._count.auditLogs})`);
  });

  console.log(`Confirmed Genuine Accounts To Preserve: ${genuineUsersPreserved.length}`);
  genuineUsersPreserved.forEach((u) => {
    console.log(` - [PRESERVED] ${u.email} (Role: ${u.role}, Orders: ${u._count.orders})`);
  });



  // 4. Identify any test registration requests / audit logs
  const testUserIds = testUsersToDelete.map((u) => u.id);
  const testAuditLogsCount = await prisma.auditLog.count({
    where: { userId: { in: testUserIds } },
  });
  console.log(`Associated Test User Audit Logs: ${testAuditLogsCount}`);

  if (!isExecute) {
    console.log("\n==================================================");
    console.log("DRY RUN COMPLETED. No database changes were made.");
    console.log("Run with --execute flag to apply changes inside a transaction.");
    console.log("==================================================");
    return {
      dryRun: true,
      testUsersCount: testUsersToDelete.length,
      testAuditLogsCount,
      preservedUsersCount: genuineUsersPreserved.length,
    };
  }

  // 5. Execute safe cleanup in a single transaction
  console.log("\nExecuting safe cleanup in a PostgreSQL transaction...");

  const result = await prisma.$transaction(async (tx) => {
    // A. Delete test audit logs associated with test users
    const deletedAudit = await tx.auditLog.deleteMany({
      where: { userId: { in: testUserIds } },
    });



    // C. Delete confirmed test users
    const deletedUsers = await tx.user.deleteMany({
      where: { id: { in: testUserIds } },
    });

    // D. Strict safety invariant assertions inside the transaction
    const postAdminUsers = await tx.user.findMany({
      where: { role: "OWNER" },
      select: { id: true, email: true, passwordHash: true },
    });

    if (postAdminUsers.length !== 2) {
      throw new Error(`Transaction rollback: Admin count changed to ${postAdminUsers.length}`);
    }

    for (const admin of postAdminUsers) {
      if (!PROTECTED_ADMIN_IDS.includes(admin.id)) {
        throw new Error(`Transaction rollback: Admin ID modified for ${admin.email}`);
      }
    }

    const postProductCount = await tx.product.count();
    const postVariantCount = await tx.productVariant.count();
    const postOrderCount = await tx.order.count();

    if (postProductCount !== productCount) {
      throw new Error(`Transaction rollback: Product count changed from ${productCount} to ${postProductCount}`);
    }

    if (postVariantCount !== variantCount) {
      throw new Error(`Transaction rollback: Variant count changed from ${variantCount} to ${postVariantCount}`);
    }

    if (postOrderCount !== orderCount) {
      throw new Error(`Transaction rollback: Order count changed from ${orderCount} to ${postOrderCount}`);
    }

    return {
      deletedUsersCount: deletedUsers.count,
      deletedAuditCount: deletedAudit.count,
    };
  });

  console.log("\n==================================================");
  console.log("SAFE CLEANUP TRANSACTION COMMITTED SUCCESSFULLY");
  console.log(`- Deleted Test Customer Accounts: ${result.deletedUsersCount}`);
  console.log(`- Deleted Test Audit Logs: ${result.deletedAuditCount}`);
  console.log("All safety invariants verified post-commit.");
  console.log("==================================================");

  return {
    dryRun: false,
    ...result,
  };
}

const isExecute = process.argv.includes("--execute");

runSafeCleanup(isExecute)
  .catch((e) => {
    console.error("Cleanup failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
