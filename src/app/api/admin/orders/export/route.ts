import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, handleAuthError } from "@/lib/auth";

function sanitizeCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).trim();
  // Prevent CSV Formula Injection
  const formulaChars = ["=", "+", "-", "@", "\t", "\r"];
  let safeStr = str;
  if (formulaChars.some((char) => safeStr.startsWith(char))) {
    safeStr = "'" + safeStr;
  }
  return `"${safeStr.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    await requireOwner();

    const orders = await prisma.order.findMany({
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const headers = [
      "Order Number",
      "Date",
      "Retailer Name",
      "Business Name",
      "Phone",
      "Status",
      "Total Units",
      "Subtotal (INR)",
      "Tax (INR)",
      "Total Amount (INR)",
      "Items Breakdown",
    ];

    const rows = orders.map((ord) => {
      const totalUnits = ord.items.reduce((sum, item) => sum + item.quantity, 0);
      const itemsDetail = ord.items
        .map((it) => `${it.productName} [${it.sku}] (${it.quantity}x @ INR ${(it.unitPrice / 100).toFixed(2)})`)
        .join("; ");

      return [
        sanitizeCsvCell(ord.orderNumber),
        sanitizeCsvCell(ord.createdAt.toISOString().slice(0, 10)),
        sanitizeCsvCell(ord.customer.name),
        sanitizeCsvCell(ord.customer.businessName || "N/A"),
        sanitizeCsvCell(ord.customer.phone),
        sanitizeCsvCell(ord.status),
        totalUnits,
        (ord.subtotal / 100).toFixed(2),
        (ord.taxAmount / 100).toFixed(2),
        (ord.totalAmount / 100).toFixed(2),
        sanitizeCsvCell(itemsDetail),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="jagdamba_orders_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    const authRes = handleAuthError(error);
    if (authRes) return authRes;
    return NextResponse.json({ error: "Failed to export orders" }, { status: 500 });
  }
}
