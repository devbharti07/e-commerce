import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isVerified: true }
  });
  console.log("=== USERS IN DB ===");
  users.forEach((u) => console.log(`- [${u.role}] ${u.name} <${u.email}> (verified: ${u.isVerified})`));

  const products = await prisma.product.findMany({
    include: {
      brand: true,
      category: true,
      variants: {
        include: { pricingTiers: true }
      },
      images: true,
      specifications: true,
    },
    orderBy: { createdAt: "asc" }
  });

  console.log(`\n=== PRODUCTS IN DB (${products.length} total) ===`);
  products.forEach((p, idx) => {
    console.log(`\n${idx + 1}. [${p.isPublished ? "PUBLISHED" : "DRAFT"}] ${p.name} (${p.slug})`);
    console.log(`   Brand: ${p.brand.name} | Category: ${p.category.name} | Model: ${p.model} (${p.modelNumber})`);
    console.log(`   Variants (${p.variants.length}):`);
    p.variants.forEach((v) => {
      console.log(`     - SKU: ${v.sku} | ${v.ramGb}GB/${v.storageGb}GB ${v.colorName} | Price: ₹${(v.baseWholesalePrice / 100).toLocaleString('en-IN')} | Stock: ${v.onHandStock} (avail: ${v.isAvailable}) | Tiers: ${v.pricingTiers.length}`);
    });
    console.log(`   Images: ${p.images.length} | Specs: ${p.specifications.length}`);
  });
}

main()
  .catch((e) => {
    console.error("DB check failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
