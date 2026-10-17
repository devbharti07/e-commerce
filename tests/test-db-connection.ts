import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Testing PostgreSQL connection via Prisma Client...");
  const result: any[] = await prisma.$queryRaw`SELECT current_database() as db_name, version() as pg_version, NOW() as current_time`;
  console.log("Database connected successfully:", result[0]?.db_name);
  console.log("PostgreSQL Version:", result[0]?.pg_version?.split(" ")[0], result[0]?.pg_version?.split(" ")[1]);
  console.log("Current Server Time:", result[0]?.current_time);

  const userCount = await prisma.user.count();
  const productCount = await prisma.product.count();
  console.log("Existing Counts in PostgreSQL -> Users:", userCount, "Products:", productCount);
}

main()
  .catch((e) => {
    console.error("Connection failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
