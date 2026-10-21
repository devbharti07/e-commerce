import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { add20SmartphoneModels } from "../scripts/add-20-smartphones";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Jagdamba Mobile database (Idempotent)...");

  // 1. Seed Users (Idempotent upsert by unique email)
  const ownerPasswordHash = await bcrypt.hash("Owner@Jagdamba2026", 12);
  const adminPasswordHash = await bcrypt.hash("admin@1234", 12);
  const retailerPasswordHash = await bcrypt.hash("Retailer@2026", 12);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {
      name: "Jagdamba Admin HQ",
      phone: "+91 98765 00000",
      businessName: "Jagdamba Mobile Distribution HQ",
      role: "OWNER",
      isVerified: true,
      isSuspended: false,
    },
    create: {
      name: "Jagdamba Admin HQ",
      email: "admin@gmail.com",
      passwordHash: adminPasswordHash,
      phone: "+91 98765 00000",
      businessName: "Jagdamba Mobile Distribution HQ",
      role: "OWNER",
      isVerified: true,
      isSuspended: false,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: "owner@jagdambamobile.com" },
    update: {
      name: "Jagdamba Admin (Owner)",
      phone: "**********",
      businessName: "Jagdamba Mobile Distribution HQ",
      gstNumber: "07AAAAA0000A1Z5",
      role: "OWNER",
      isVerified: true,
    },
    create: {
      name: "Jagdamba Admin (Owner)",
      email: "owner@jagdambamobile.com",
      passwordHash: ownerPasswordHash,
      phone: "**********",
      businessName: "Jagdamba Mobile Distribution HQ",
      gstNumber: "07AAAAA0000A1Z5",
      role: "OWNER",
      isVerified: true,
    },
  });

  const retailer = await prisma.user.upsert({
    where: { email: "rajesh.mobile@gmail.com" },
    update: {
      name: "Rajesh Sharma",
      phone: "+91 98234 56789",
      businessName: "Sharma Telecom & Electronics",
      gstNumber: "27AABCU9603R1ZM",
      role: "CUSTOMER",
      isVerified: true,
    },
    create: {
      name: "Rajesh Sharma",
      email: "rajesh.mobile@gmail.com",
      passwordHash: retailerPasswordHash,
      phone: "+91 98234 56789",
      businessName: "Sharma Telecom & Electronics",
      gstNumber: "27AABCU9603R1ZM",
      role: "CUSTOMER",
      isVerified: true,
    },
  });

  // Seed default address for retailer if not present
  const existingAddress = await prisma.address.findFirst({
    where: { userId: retailer.id },
  });

  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: retailer.id,
        fullName: "Rajesh Sharma",
        mobileNumber: "+91 98234 56789",
        houseOrShop: "Shop No. 14, Ground Floor",
        street: "Main Market Road, Near Clock Tower",
        locality: "Laxmi Nagar",
        city: "New Delhi",
        state: "Delhi",
        pinCode: "110092",
        country: "India",
        instructions: "Wholesale delivery between 11 AM - 7 PM. Loading bay accessible.",
        latitude: 28.6304,
        longitude: 77.2773,
        isDefault: true,
      },
    });
  }

  // 2. Seed Categories (Idempotent upsert by slug)
  const catFlagship = await prisma.category.upsert({
    where: { slug: "flagship" },
    update: {
      name: "Flagship Smartphones",
      description: "Premium high-tier smartphones with top-grade processors and optics",
    },
    create: {
      name: "Flagship Smartphones",
      slug: "flagship",
      description: "Premium high-tier smartphones with top-grade processors and optics",
    },
  });

  const catMidrange = await prisma.category.upsert({
    where: { slug: "mid-range-5g" },
    update: {
      name: "Mid-Range & Value 5G",
      description: "High volume, fast moving 5G smartphones for retail outlets",
    },
    create: {
      name: "Mid-Range & Value 5G",
      slug: "mid-range-5g",
      description: "High volume, fast moving 5G smartphones for retail outlets",
    },
  });

  await prisma.category.upsert({
    where: { slug: "foldables" },
    update: {
      name: "Foldables & Flip Phones",
      description: "Next-gen foldable and flip smartphones",
    },
    create: {
      name: "Foldables & Flip Phones",
      slug: "foldables",
      description: "Next-gen foldable and flip smartphones",
    },
  });

  // 3. Seed Brands (Idempotent upsert by slug)
  const brandApple = await prisma.brand.upsert({
    where: { slug: "apple" },
    update: {
      name: "Apple",
      description: "Official Apple sealed wholesale inventory with 1-Year Apple Care India warranty",
    },
    create: {
      name: "Apple",
      slug: "apple",
      description: "Official Apple sealed wholesale inventory with 1-Year Apple Care India warranty",
    },
  });

  const brandSamsung = await prisma.brand.upsert({
    where: { slug: "samsung" },
    update: {
      name: "Samsung",
      description: "Samsung Galaxy series genuine distributor stock",
    },
    create: {
      name: "Samsung",
      slug: "samsung",
      description: "Samsung Galaxy series genuine distributor stock",
    },
  });

  const brandOnePlus = await prisma.brand.upsert({
    where: { slug: "oneplus" },
    update: {
      name: "OnePlus",
      description: "OnePlus Never Settle Series with rapid charging and OxygenOS",
    },
    create: {
      name: "OnePlus",
      slug: "oneplus",
      description: "OnePlus Never Settle Series with rapid charging and OxygenOS",
    },
  });

  await prisma.brand.upsert({
    where: { slug: "xiaomi" },
    update: {
      name: "Xiaomi",
      description: "Xiaomi and Redmi high volume commercial handsets",
    },
    create: {
      name: "Xiaomi",
      slug: "xiaomi",
      description: "Xiaomi and Redmi high volume commercial handsets",
    },
  });

  // 4. Helper for Specifications (Idempotent by compound unique [productId, group, key])
  async function seedSpecs(productId: string, specs: { group: string; key: string; value: string }[]) {
    for (const spec of specs) {
      await prisma.productSpecification.upsert({
        where: {
          productId_group_key: {
            productId,
            group: spec.group,
            key: spec.key,
          },
        },
        update: { value: spec.value },
        create: {
          productId,
          group: spec.group,
          key: spec.key,
          value: spec.value,
        },
      });
    }
  }

  // Helper for Pricing Tiers (Idempotent by compound unique [variantId, minQty])
  async function seedTiers(variantId: string, tiers: { minQty: number; maxQty: number | null; unitPrice: number }[]) {
    for (const tier of tiers) {
      await prisma.pricingTier.upsert({
        where: {
          variantId_minQty: {
            variantId,
            minQty: tier.minQty,
          },
        },
        update: {
          maxQty: tier.maxQty,
          unitPrice: tier.unitPrice,
        },
        create: {
          variantId,
          minQty: tier.minQty,
          maxQty: tier.maxQty,
          unitPrice: tier.unitPrice,
        },
      });
    }
  }

  // 5. Product 1: Apple iPhone 16 Pro Max
  const iphone16ProMax = await prisma.product.upsert({
    where: { slug: "apple-iphone-16-pro-max" },
    update: {
      name: "Apple iPhone 16 Pro Max",
      model: "iPhone 16 Pro Max",
      modelNumber: "A3296",
      description: "Grade Titanium design with Camera Control, 4K 120 fps Dolby Vision, and the breakthrough A18 Pro chip. Genuine wholesale sealed pack.",
      warrantyMonths: 12,
      returnDays: 7,
      isPublished: true,
    },
    create: {
      brandId: brandApple.id,
      categoryId: catFlagship.id,
      name: "Apple iPhone 16 Pro Max",
      slug: "apple-iphone-16-pro-max",
      model: "iPhone 16 Pro Max",
      modelNumber: "A3296",
      description: "Grade Titanium design with Camera Control, 4K 120 fps Dolby Vision, and the breakthrough A18 Pro chip. Genuine wholesale sealed pack.",
      warrantyMonths: 12,
      returnDays: 7,
      isPublished: true,
    },
  });

  await seedSpecs(iphone16ProMax.id, [
    { group: "Display", key: "Screen Size", value: "6.9-inch Super Retina XDR OLED" },
    { group: "Display", key: "Refresh Rate", value: "120Hz ProMotion" },
    { group: "Display", key: "Resolution", value: "2868 x 1320 pixels" },
    { group: "Performance", key: "Processor", value: "Apple A18 Pro (3nm)" },
    { group: "Camera", key: "Rear Camera", value: "48MP Fusion + 48MP Ultra Wide + 12MP 5x Telephoto" },
    { group: "Camera", key: "Front Camera", value: "12MP TrueDepth with Autofocus" },
    { group: "Battery & Charging", key: "Battery Capacity", value: "4685 mAh equivalent (Up to 33h video)" },
    { group: "Battery & Charging", key: "Charging", value: "MagSafe wireless up to 25W, USB-C 3.0" },
    { group: "Connectivity", key: "5G Support", value: "Yes, Dual eSIM / Nano-SIM + eSIM (India spec)" },
    { group: "Security", key: "Biometrics", value: "Face ID" },
  ]);

  const p1v1 = await prisma.productVariant.upsert({
    where: { sku: "APL-IP16PM-256-NAT" },
    update: {
      ramGb: 8,
      storageGb: 256,
      colorName: "Natural Titanium",
      colorHex: "#9B958C",
      baseWholesalePrice: 13490000,
      minOrderQty: 2,
      maxOrderQty: 20,
      lowStockThreshold: 4,
      isAvailable: true,
    },
    create: {
      productId: iphone16ProMax.id,
      sku: "APL-IP16PM-256-NAT",
      ramGb: 8,
      storageGb: 256,
      colorName: "Natural Titanium",
      colorHex: "#9B958C",
      baseWholesalePrice: 13490000,
      minOrderQty: 2,
      maxOrderQty: 20,
      lowStockThreshold: 4,
      onHandStock: 18,
      reservedStock: 2,
      isAvailable: true,
    },
  });

  const p1v2 = await prisma.productVariant.upsert({
    where: { sku: "APL-IP16PM-512-DES" },
    update: {
      ramGb: 8,
      storageGb: 512,
      colorName: "Desert Titanium",
      colorHex: "#C3B1A2",
      baseWholesalePrice: 15490000,
      minOrderQty: 2,
      maxOrderQty: 15,
      lowStockThreshold: 3,
      isAvailable: true,
    },
    create: {
      productId: iphone16ProMax.id,
      sku: "APL-IP16PM-512-DES",
      ramGb: 8,
      storageGb: 512,
      colorName: "Desert Titanium",
      colorHex: "#C3B1A2",
      baseWholesalePrice: 15490000,
      minOrderQty: 2,
      maxOrderQty: 15,
      lowStockThreshold: 3,
      onHandStock: 7,
      reservedStock: 0,
      isAvailable: true,
    },
  });

  await seedTiers(p1v1.id, [
    { minQty: 2, maxQty: 4, unitPrice: 13490000 },
    { minQty: 5, maxQty: 9, unitPrice: 13150000 },
    { minQty: 10, maxQty: null, unitPrice: 12800000 },
  ]);

  // Image for iPhone (Idempotent)
  const existingIphoneImg = await prisma.productImage.findFirst({
    where: { productId: iphone16ProMax.id, isPrimary: true },
  });
  if (!existingIphoneImg) {
    await prisma.productImage.create({
      data: {
        productId: iphone16ProMax.id,
        variantId: p1v1.id,
        url: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1000&q=80",
        displayOrder: 1,
        isPrimary: true,
      },
    });
  }

  // 6. Product 2: Samsung Galaxy S24 Ultra 5G
  const s24Ultra = await prisma.product.upsert({
    where: { slug: "samsung-galaxy-s24-ultra-5g" },
    update: {
      name: "Samsung Galaxy S24 Ultra 5G",
      model: "Galaxy S24 Ultra",
      modelNumber: "SM-S928B/DS",
      description: "Galaxy AI powered flagship with built-in S-Pen, Titanium exterior, and 200MP Quad Tele System. Complete dealer sealed package.",
      warrantyMonths: 12,
      returnDays: 7,
      isPublished: true,
    },
    create: {
      brandId: brandSamsung.id,
      categoryId: catFlagship.id,
      name: "Samsung Galaxy S24 Ultra 5G",
      slug: "samsung-galaxy-s24-ultra-5g",
      model: "Galaxy S24 Ultra",
      modelNumber: "SM-S928B/DS",
      description: "Galaxy AI powered flagship with built-in S-Pen, Titanium exterior, and 200MP Quad Tele System. Complete dealer sealed package.",
      warrantyMonths: 12,
      returnDays: 7,
      isPublished: true,
    },
  });

  await seedSpecs(s24Ultra.id, [
    { group: "Display", key: "Screen Size", value: "6.8-inch Dynamic AMOLED 2X Flat" },
    { group: "Display", key: "Refresh Rate", value: "1-120Hz Adaptive" },
    { group: "Display", key: "Resolution", value: "3120 x 1440 (Quad HD+)" },
    { group: "Performance", key: "Processor", value: "Snapdragon 8 Gen 3 for Galaxy" },
    { group: "Camera", key: "Rear Camera", value: "200MP Main + 50MP 5x Periscope + 10MP 3x + 12MP Ultra-Wide" },
    { group: "Camera", key: "Front Camera", value: "12MP Dual Pixel AF" },
    { group: "Battery & Charging", key: "Battery Capacity", value: "5000 mAh" },
    { group: "Battery & Charging", key: "Charging", value: "45W Fast Wired, 15W Wireless" },
    { group: "Connectivity", key: "5G Support", value: "Yes, Dual SIM (Nano-SIM + eSIM)" },
    { group: "Security", key: "Biometrics", value: "Ultrasonic In-Display Fingerprint + Face Recognition" },
  ]);

  const p2v1 = await prisma.productVariant.upsert({
    where: { sku: "SAM-S24U-12-256-GRY" },
    update: {
      ramGb: 12,
      storageGb: 256,
      colorName: "Titanium Gray",
      colorHex: "#5E5F64",
      baseWholesalePrice: 10999900,
      minOrderQty: 3,
      maxOrderQty: 30,
      lowStockThreshold: 5,
      isAvailable: true,
    },
    create: {
      productId: s24Ultra.id,
      sku: "SAM-S24U-12-256-GRY",
      ramGb: 12,
      storageGb: 256,
      colorName: "Titanium Gray",
      colorHex: "#5E5F64",
      baseWholesalePrice: 10999900,
      minOrderQty: 3,
      maxOrderQty: 30,
      lowStockThreshold: 5,
      onHandStock: 25,
      reservedStock: 4,
      isAvailable: true,
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: "SAM-S24U-12-512-BLK" },
    update: {
      ramGb: 12,
      storageGb: 512,
      colorName: "Titanium Black",
      colorHex: "#2C2C2E",
      baseWholesalePrice: 11999900,
      minOrderQty: 2,
      maxOrderQty: 25,
      lowStockThreshold: 4,
      isAvailable: true,
    },
    create: {
      productId: s24Ultra.id,
      sku: "SAM-S24U-12-512-BLK",
      ramGb: 12,
      storageGb: 512,
      colorName: "Titanium Black",
      colorHex: "#2C2C2E",
      baseWholesalePrice: 11999900,
      minOrderQty: 2,
      maxOrderQty: 25,
      lowStockThreshold: 4,
      onHandStock: 12,
      reservedStock: 1,
      isAvailable: true,
    },
  });

  await seedTiers(p2v1.id, [
    { minQty: 3, maxQty: 5, unitPrice: 10999900 },
    { minQty: 6, maxQty: 10, unitPrice: 10650000 },
    { minQty: 11, maxQty: null, unitPrice: 10300000 },
  ]);

  const existingSamsungImg = await prisma.productImage.findFirst({
    where: { productId: s24Ultra.id, isPrimary: true },
  });
  if (!existingSamsungImg) {
    await prisma.productImage.create({
      data: {
        productId: s24Ultra.id,
        variantId: p2v1.id,
        url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=1000&q=80",
        displayOrder: 1,
        isPrimary: true,
      },
    });
  }

  // 7. Product 3: OnePlus 12 5G
  const oneplus12 = await prisma.product.upsert({
    where: { slug: "oneplus-12-5g" },
    update: {
      name: "OnePlus 12 5G",
      model: "OnePlus 12",
      modelNumber: "CPH2573",
      description: "Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera System, 5400 mAh with 100W SUPERVOOC charging.",
      warrantyMonths: 12,
      returnDays: 7,
      isPublished: true,
    },
    create: {
      brandId: brandOnePlus.id,
      categoryId: catMidrange.id,
      name: "OnePlus 12 5G",
      slug: "oneplus-12-5g",
      model: "OnePlus 12",
      modelNumber: "CPH2573",
      description: "Snapdragon 8 Gen 3, 4th Gen Hasselblad Camera System, 5400 mAh with 100W SUPERVOOC charging.",
      warrantyMonths: 12,
      returnDays: 7,
      isPublished: true,
    },
  });

  const p3v1 = await prisma.productVariant.upsert({
    where: { sku: "1P-12-16-512-EMR" },
    update: {
      ramGb: 16,
      storageGb: 512,
      colorName: "Emerald Green",
      colorHex: "#2D5A4B",
      baseWholesalePrice: 5899900,
      minOrderQty: 3,
      maxOrderQty: 40,
      lowStockThreshold: 5,
      isAvailable: true,
    },
    create: {
      productId: oneplus12.id,
      sku: "1P-12-16-512-EMR",
      ramGb: 16,
      storageGb: 512,
      colorName: "Emerald Green",
      colorHex: "#2D5A4B",
      baseWholesalePrice: 5899900,
      minOrderQty: 3,
      maxOrderQty: 40,
      lowStockThreshold: 5,
      onHandStock: 30,
      reservedStock: 0,
      isAvailable: true,
    },
  });

  await seedTiers(p3v1.id, [
    { minQty: 3, maxQty: 5, unitPrice: 5899900 },
    { minQty: 6, maxQty: 15, unitPrice: 5699900 },
    { minQty: 16, maxQty: null, unitPrice: 5499900 },
  ]);

  const existingOneplusImg = await prisma.productImage.findFirst({
    where: { productId: oneplus12.id, isPrimary: true },
  });
  if (!existingOneplusImg) {
    await prisma.productImage.create({
      data: {
        productId: oneplus12.id,
        variantId: p3v1.id,
        url: "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=1000&q=80",
        displayOrder: 1,
        isPrimary: true,
      },
    });
  }

  // 8. Sample Order & Conversation (Only seeded in non-production environments for integration test suite)
  if (process.env.NODE_ENV !== "production") {
    const existingOrder = await prisma.order.findUnique({
      where: { orderNumber: "JM-2026-0001" },
    });

    if (!existingOrder) {
      await prisma.order.create({
        data: {
          orderNumber: "JM-2026-0001",
          customerId: retailer.id,
          status: "REQUESTED",
          subtotal: 26980000,
          taxAmount: 0,
          deliveryFee: 0,
          totalAmount: 26980000,
          customerNotes: "Please confirm dispatch date. Need delivery by Tuesday morning for retail weekend sale.",
          shippingAddressSnapshot: JSON.stringify({
            fullName: "Rajesh Sharma",
            mobileNumber: "+91 98234 56789",
            houseOrShop: "Shop No. 14, Ground Floor",
            street: "Main Market Road, Near Clock Tower",
            locality: "Laxmi Nagar",
            city: "New Delhi",
            state: "Delhi",
            pinCode: "110092",
            country: "India",
            latitude: 28.6304,
            longitude: 77.2773,
          }),
          items: {
            create: [
              {
                variantId: p1v1.id,
                productName: "Apple iPhone 16 Pro Max",
                variantName: "8GB RAM / 256GB - Natural Titanium",
                sku: "APL-IP16PM-256-NAT",
                ramGb: 8,
                storageGb: 256,
                colorName: "Natural Titanium",
                quantity: 2,
                unitPrice: 13490000,
                lineTotal: 26980000,
              },
            ],
          },
          conversation: {
            create: {
              customerId: retailer.id,
              messages: {
                create: [
                  {
                    senderId: retailer.id,
                    senderRole: "CUSTOMER",
                    content: "Hello Jagdamba Mobile, I have submitted an order request for 2 units of iPhone 16 Pro Max 256GB Natural Titanium. Can you confirm if these are sealed Indian retail units with GST invoice?",
                  },
                  {
                    senderId: owner.id,
                    senderRole: "OWNER",
                    content: "Hello Rajesh ji! Yes, 100% brand new sealed with official Apple 1-Year India Warranty and valid 18% GST input tax credit invoice. We have 16 units on hand. Ready to confirm once we align on the delivery schedule.",
                  },
                ],
              },
            },
          },
        },
      });
    }
  }

  // 9. Site Settings (Idempotent upsert by unique key)
  const settings = [
    { key: "BUSINESS_NAME", value: "Jagdamba Mobile Distribution" },
    { key: "CONTACT_PHONE", value: "**********" },
    { key: "CONTACT_EMAIL", value: "orders@jagdambamobile.com" },
    { key: "WHOLESALE_TERMS", value: "All prices quoted are B2B wholesale exclusive of local transit insurance unless negotiated. Orders require dealer confirmation prior to dispatch." },
    { key: "MIN_ORDER_VALUE", value: "2500000" },
  ];

  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, isPublic: true },
      create: { key: s.key, value: s.value, isPublic: true },
    });
  }

  // 10. Seed Smartphone Models Expansion (Idempotent 20 models)
  await add20SmartphoneModels(prisma);

  console.log("Database seeded successfully and verified idempotent!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
