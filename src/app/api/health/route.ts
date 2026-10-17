import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [dbTest, productCount, variantCount] = await Promise.all([
      prisma.$queryRaw`SELECT 1 as result`,
      prisma.product.count(),
      prisma.productVariant.count(),
    ]);

    return NextResponse.json({
      status: "HEALTHY",
      service: "Jagdamba Mobile Distribution API",
      timestamp: new Date().toISOString(),
      database: "CONNECTED",
      engine: "PostgreSQL",
      catalog: {
        products: productCount,
        variants: variantCount,
      },
    });
  } catch (error: any) {
    console.error("Health check database failure:", error);
    return NextResponse.json(
      {
        status: "UNHEALTHY",
        service: "Jagdamba Mobile Distribution API",
        timestamp: new Date().toISOString(),
        database: "DISCONNECTED",
        error: error.message || "Database connection unavailable",
      },
      { status: 503 }
    );
  }
}
