import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";

export async function GET() {
  try {
    await requireOwner();

    const variants = await prisma.productVariant.findMany({
      include: {
        product: {
          include: { brand: true },
        },
      },
      orderBy: { sku: "asc" },
    });

    const headers = [
      "SKU",
      "Product Name",
      "Brand",
      "RAM (GB)",
      "Storage (GB)",
      "Color",
      "Base Wholesale Price (INR)",
      "On Hand Stock",
      "Reserved Stock",
      "Available Stock",
      "Min Order Qty",
      "Low Stock Threshold",
      "Status",
    ];

    const rows = variants.map((v) => {
      const available = v.onHandStock - v.reservedStock;
      const status = available <= 0 ? "SOLD_OUT" : available <= v.lowStockThreshold ? "LOW_STOCK" : "IN_STOCK";
      return [
        v.sku,
        `"${v.product.name.replace(/"/g, '""')}"`,
        v.product.brand.name,
        v.ramGb,
        v.storageGb,
        v.colorName,
        (v.baseWholesalePrice / 100).toFixed(2),
        v.onHandStock,
        v.reservedStock,
        available,
        v.minOrderQty,
        v.lowStockThreshold,
        status,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="jagdamba_inventory_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
