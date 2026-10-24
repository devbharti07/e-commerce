import React from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Zap } from "lucide-react";
import { LandingHeroAnimated } from "@/components/landing-hero-animated";
import { LandingBrandDiscovery } from "@/components/landing-brand-discovery";
import { LandingFeaturedProducts } from "@/components/landing-featured-products";
import { LandingWholesaleBenefits } from "@/components/landing-wholesale-benefits";
import { LandingWorkflow } from "@/components/landing-workflow";
import { LandingPricingPreview } from "@/components/landing-pricing-preview";
import { LandingCta } from "@/components/landing-cta";

export const revalidate = 60;

export const metadata = {
  title: "Jagdamba Mobile | Wholesale Smartphone Distribution Platform",
  description:
    "Direct factory allotment and wholesale smartphone distribution for verified retail stores and telecom dealers. 100% brand-sealed Indian stock with 18% GST input credit invoices.",
};

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  let brands: any[] = [];
  let products: any[] = [];
  let totalVariantsCount = 0;
  let siteSettings: any[] = [];

  try {
    const [fetchedBrands, fetchedProducts, count, settings] = await Promise.all([
      prisma.brand.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true, description: true },
        orderBy: { name: "asc" },
      }),
      prisma.product.findMany({
        where: { isPublished: true, isArchived: false },
        select: {
          id: true,
          name: true,
          slug: true,
          modelNumber: true,
          brand: { select: { id: true, name: true } },
          variants: {
            where: { isAvailable: true },
            select: {
              id: true,
              ramGb: true,
              storageGb: true,
              colorName: true,
              baseWholesalePrice: true,
              minOrderQty: true,
              onHandStock: true,
              reservedStock: true,
              lowStockThreshold: true,
            },
            orderBy: { baseWholesalePrice: "asc" },
          },
          images: {
            select: { url: true },
            orderBy: { displayOrder: "asc" },
            take: 1,
          },
        },
        take: 8,
        orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { createdAt: "desc" }],
      }),
      prisma.productVariant.count({
        where: { isAvailable: true },
      }),
      prisma.siteSetting.findMany({
        select: { key: true, value: true },
      }),
    ]);

    brands = fetchedBrands;
    products = fetchedProducts;
    totalVariantsCount = count;
    siteSettings = settings;
  } catch (error) {
    console.warn("Database queries fallback during HomePage render:", error);
  }

  const settingsMap: Record<string, string> = {};
  siteSettings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  const announcementBanner = settingsMap["ANNOUNCEMENT_BANNER"];
  const isAnnouncementActive = settingsMap["ANNOUNCEMENT_ACTIVE"] === "true";
  const contactPhone = settingsMap["CONTACT_PHONE"] || "+91 98765 00000";
  const minOrderValuePaise = parseInt(settingsMap["MIN_ORDER_VALUE"] || "2500000");

  // Pick primary flagship smartphone for hero showcase
  const primaryHeroProduct = products.find((p) => p.images.length > 0) || products[0];
  const heroImageUrl =
    primaryHeroProduct?.images[0]?.url ||
    "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80";
  const heroProductName = primaryHeroProduct?.name || "Apple iPhone 16 Pro Max";

  return (
    <div className="space-y-16 sm:space-y-24 pb-24 bg-[#F6F5F0] dark:bg-[#111916] text-[#17231E] dark:text-[#E8EFEA] transition-colors">
      {/* 0. Dynamic Operational Announcement Banner (if configured by admin) */}
      {isAnnouncementActive && announcementBanner && (
        <div className="bg-[#B3853E] text-white px-4 py-2.5 text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-2xs">
          <Zap className="w-3.5 h-3.5 shrink-0" />
          <span>{announcementBanner}</span>
        </div>
      )}

      {/* 1. Animated Hero Section */}
      <LandingHeroAnimated
        totalVariantsCount={totalVariantsCount}
        contactPhone={contactPhone}
        minOrderValuePaise={minOrderValuePaise}
        featuredImageUrl={heroImageUrl}
        featuredProductName={heroProductName}
      />

      {/* 2. Brand Discovery Matrix */}
      <LandingBrandDiscovery brands={brands} />

      {/* 3. Featured Products Grid with Brand Filter Tabs */}
      <LandingFeaturedProducts products={products} />

      {/* 4. Wholesale Margin & Volume Tier Simulator */}
      <LandingPricingPreview />

      {/* 5. How Retailer Registration Works (4-Step Onboarding Pipeline) */}
      <LandingWorkflow />

      {/* 6. Wholesale Value Proposition & Capabilities */}
      <LandingWholesaleBenefits />

      {/* 7. High-Impact Call to Action & Distribution Desk Cards */}
      <LandingCta contactPhone={contactPhone} />
    </div>
  );
}
