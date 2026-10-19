import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

function sanitizeCsv(val: any) {
  if (val === null || val === undefined) return '""';
  let s = String(val).trim();
  if (["=", "+", "-", "@", "\t", "\r"].some((c) => s.startsWith(c))) {
    s = "'" + s;
  }
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  try {
    await requireOwner();
    const { searchParams } = new URL(req.url);
    const reportType = searchParams.get("type") || "SALES";

    if (reportType === "BEST_SELLERS") {
      const items = await prisma.orderItem.groupBy({
        by: ["productName", "sku"],
        _sum: { quantity: true, lineTotal: true },
        orderBy: { _sum: { quantity: "desc" } },
      });

      const headers = ["Handset Model", "SKU", "Total Units Ordered", "Gross Booking Value (INR)"];
      const rows = items.map((it) => [
        sanitizeCsv(it.productName),
        sanitizeCsv(it.sku),
        it._sum.quantity || 0,
        ((it._sum.lineTotal || 0) / 100).toFixed(2),
      ]);

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="jagdamba_best_sellers_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    if (reportType === "INVENTORY_HEALTH") {
      const variants = await prisma.productVariant.findMany({
        include: { product: { include: { brand: true } } },
        orderBy: { sku: "asc" },
      });

      const headers = [
        "SKU",
        "Brand",
        "Model",
        "RAM/Storage",
        "Color",
        "On Hand",
        "Reserved",
        "Available",
        "Low Stock Threshold",
        "Stock Condition",
      ];

      const rows = variants.map((v) => {
        const avail = v.onHandStock - v.reservedStock;
        const condition = avail <= 0 ? "OUT_OF_STOCK" : avail <= v.lowStockThreshold ? "LOW_STOCK" : "HEALTHY";
        return [
          sanitizeCsv(v.sku),
          sanitizeCsv(v.product.brand.name),
          sanitizeCsv(v.product.name),
          sanitizeCsv(`${v.ramGb}GB / ${v.storageGb}GB`),
          sanitizeCsv(v.colorName),
          v.onHandStock,
          v.reservedStock,
          avail,
          v.lowStockThreshold,
          condition,
        ];
      });

      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="jagdamba_inventory_health_${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // Default: Orders by Status & Date
    const orders = await prisma.order.findMany({
      include: { customer: true },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Order Number",
      "Date",
      "Retailer Name",
      "Shop Name",
      "Phone",
      "Status",
      "Total Amount (INR)",
    ];

    const rows = orders.map((o) => [
      sanitizeCsv(o.orderNumber),
      sanitizeCsv(o.createdAt.toISOString().slice(0, 10)),
      sanitizeCsv(o.customer.name),
      sanitizeCsv(o.customer.businessName || "N/A"),
      sanitizeCsv(o.customer.phone),
      sanitizeCsv(o.status),
      (o.totalAmount / 100).toFixed(2),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="jagdamba_orders_report_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to export report" }, { status: 500 });
  }
}
