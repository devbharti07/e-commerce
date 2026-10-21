import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface VariantDefinition {
  sku: string;
  ramGb: number;
  storageGb: number;
  colorName: string;
  colorHex: string;
}

interface SpecDefinition {
  group: string;
  key: string;
  value: string;
}

interface ProductDefinition {
  brandSlug: string;
  categorySlug: string;
  name: string;
  slug: string;
  model: string;
  modelNumber: string;
  description: string;
  specs: SpecDefinition[];
  variants: VariantDefinition[];
}

// The 20 requested smartphone models
const REQUESTED_MODELS: ProductDefinition[] = [
  // 1. Apple iPhone 16
  {
    brandSlug: "apple",
    categorySlug: "flagship",
    name: "Apple iPhone 16",
    slug: "apple-iphone-16",
    model: "iPhone 16",
    modelNumber: "A3287",
    description: "Apple iPhone 16 featuring the A18 Bionic chip, Camera Control button, 48MP Fusion dual camera with macro photography, Action Button, and Super Retina XDR 6.1-inch OLED display. Brand sealed Indian retail stock.",
    specs: [
      { group: "Performance", key: "Processor", value: "Apple A18 (3nm) Hexa-core with 16-core Neural Engine" },
      { group: "Display", key: "Screen", value: "6.1-inch Super Retina XDR OLED (2556 x 1179) 2000 nits peak" },
      { group: "Camera", key: "Main Camera", value: "48MP Fusion (f/1.6, OIS) + 12MP Ultra Wide with macro" },
      { group: "Battery", key: "Capacity", value: "3561 mAh, 25W MagSafe wireless charging" },
    ],
    variants: [
      { sku: "APL-IP16-128-BLK", ramGb: 8, storageGb: 128, colorName: "Black", colorHex: "#1c1c1e" },
      { sku: "APL-IP16-256-BLU", ramGb: 8, storageGb: 256, colorName: "Ultramarine", colorHex: "#4b5563" },
      { sku: "APL-IP16-512-WHT", ramGb: 8, storageGb: 512, colorName: "White", colorHex: "#f5f5f7" },
    ],
  },

  // 2. Apple iPhone 16 Plus
  {
    brandSlug: "apple",
    categorySlug: "flagship",
    name: "Apple iPhone 16 Plus",
    slug: "apple-iphone-16-plus",
    model: "iPhone 16 Plus",
    modelNumber: "A3290",
    description: "Apple iPhone 16 Plus featuring a 6.7-inch Super Retina XDR display, A18 processor, dedicated Camera Control, all-day battery endurance, 48MP Fusion camera, and USB-C connectivity. 100% brand sealed pack.",
    specs: [
      { group: "Performance", key: "Processor", value: "Apple A18 (3nm) Hexa-core with 16-core Neural Engine" },
      { group: "Display", key: "Screen", value: "6.7-inch Super Retina XDR OLED (2796 x 1290) 2000 nits peak" },
      { group: "Camera", key: "Main Camera", value: "48MP Fusion (f/1.6, OIS) + 12MP Ultra Wide" },
      { group: "Battery", key: "Capacity", value: "4674 mAh, 25W MagSafe wireless charging" },
    ],
    variants: [
      { sku: "APL-IP16P-128-BLK", ramGb: 8, storageGb: 128, colorName: "Black", colorHex: "#1c1c1e" },
      { sku: "APL-IP16P-256-TEA", ramGb: 8, storageGb: 256, colorName: "Teal", colorHex: "#2dd4bf" },
    ],
  },

  // 3. Apple iPhone 16 Pro
  {
    brandSlug: "apple",
    categorySlug: "flagship",
    name: "Apple iPhone 16 Pro",
    slug: "apple-iphone-16-pro",
    model: "iPhone 16 Pro",
    modelNumber: "A3293",
    description: "Apple iPhone 16 Pro with Grade 5 Titanium construction, A18 Pro silicon, 6.3-inch ProMotion 120Hz display, 48MP Ultra Wide sensor, 5x telephoto optical zoom, and 4K 120 fps Dolby Vision video capture.",
    specs: [
      { group: "Performance", key: "Processor", value: "Apple A18 Pro (3nm) Hexa-core with 6-core GPU" },
      { group: "Display", key: "Screen", value: "6.3-inch Super Retina XDR OLED ProMotion 120Hz (2622 x 1206)" },
      { group: "Camera", key: "Main Camera", value: "48MP Fusion + 48MP Ultra Wide + 12MP 5x Telephoto" },
      { group: "Battery", key: "Capacity", value: "3582 mAh, 25W MagSafe wireless, USB-C 3.0" },
    ],
    variants: [
      { sku: "APL-IP16PRO-128-NAT", ramGb: 8, storageGb: 128, colorName: "Natural Titanium", colorHex: "#9ca3af" },
      { sku: "APL-IP16PRO-256-DES", ramGb: 8, storageGb: 256, colorName: "Desert Titanium", colorHex: "#d4b996" },
      { sku: "APL-IP16PRO-512-BLK", ramGb: 8, storageGb: 512, colorName: "Black Titanium", colorHex: "#27272a" },
    ],
  },

  // 4. Apple iPhone 16 Pro Max (Already present - will be skipped)
  {
    brandSlug: "apple",
    categorySlug: "flagship",
    name: "Apple iPhone 16 Pro Max",
    slug: "apple-iphone-16-pro-max",
    model: "iPhone 16 Pro Max",
    modelNumber: "A3296",
    description: "Existing product in database",
    specs: [],
    variants: [],
  },

  // 5. Samsung Galaxy S25
  {
    brandSlug: "samsung",
    categorySlug: "flagship",
    name: "Samsung Galaxy S25 5G",
    slug: "samsung-galaxy-s25-5g",
    model: "Galaxy S25",
    modelNumber: "SM-S931B/DS",
    description: "Samsung Galaxy S25 5G featuring Qualcomm Snapdragon 8 Elite Mobile Platform, Galaxy AI suite, 6.2-inch Dynamic AMOLED 2X 120Hz display, and 50MP triple optical stabilization camera in Armor Aluminum frame.",
    specs: [
      { group: "Performance", key: "Processor", value: "Qualcomm Snapdragon 8 Elite (3nm) Octa-Core" },
      { group: "Display", key: "Screen", value: "6.2-inch Dynamic AMOLED 2X, 120Hz, HDR10+, 2600 nits" },
      { group: "Camera", key: "Main Camera", value: "50MP (f/1.8, OIS) + 12MP Ultra-Wide + 10MP 3x Telephoto" },
      { group: "Battery", key: "Capacity", value: "4000 mAh, 25W fast charging, 15W wireless" },
    ],
    variants: [
      { sku: "SAM-S25-12-128-BLK", ramGb: 12, storageGb: 128, colorName: "Onyx Black", colorHex: "#18181b" },
      { sku: "SAM-S25-12-256-SLV", ramGb: 12, storageGb: 256, colorName: "Silver Shadow", colorHex: "#e2e8f0" },
    ],
  },

  // 6. Samsung Galaxy S25 Ultra
  {
    brandSlug: "samsung",
    categorySlug: "flagship",
    name: "Samsung Galaxy S25 Ultra 5G",
    slug: "samsung-galaxy-s25-ultra-5g",
    model: "Galaxy S25 Ultra",
    modelNumber: "SM-S938B/DS",
    description: "Samsung Galaxy S25 Ultra 5G with Titanium frame, integrated S Pen stylus, Snapdragon 8 Elite for Galaxy, 200MP quad camera with 5x periscope telephoto, and Gorilla Armor anti-reflective glass.",
    specs: [
      { group: "Performance", key: "Processor", value: "Qualcomm Snapdragon 8 Elite for Galaxy (3nm)" },
      { group: "Display", key: "Screen", value: "6.8-inch QHD+ Dynamic AMOLED 2X, 1-120Hz, Gorilla Armor" },
      { group: "Camera", key: "Main Camera", value: "200MP Main + 50MP 5x Periscope + 50MP Ultra-Wide + 10MP 3x Telephoto" },
      { group: "Battery", key: "Capacity", value: "5000 mAh, 45W wired, 15W wireless charging" },
    ],
    variants: [
      { sku: "SAM-S25U-12-256-GRY", ramGb: 12, storageGb: 256, colorName: "Titanium Gray", colorHex: "#71717a" },
      { sku: "SAM-S25U-12-512-BLK", ramGb: 12, storageGb: 512, colorName: "Titanium Black", colorHex: "#09090b" },
      { sku: "SAM-S25U-16-1TB-SLV", ramGb: 16, storageGb: 1024, colorName: "Titanium Silver", colorHex: "#cbd5e1" },
    ],
  },

  // 7. Samsung Galaxy A56 5G
  {
    brandSlug: "samsung",
    categorySlug: "mid-range-5g",
    name: "Samsung Galaxy A56 5G",
    slug: "samsung-galaxy-a56-5g",
    model: "Galaxy A56 5G",
    modelNumber: "SM-A566B/DS",
    description: "Samsung Galaxy A56 5G built for high-volume wholesale distribution with Exynos 1580 processor, 6.6-inch Super AMOLED 120Hz display, 50MP OIS camera, IP67 dust/water resistance, and 45W fast charging.",
    specs: [
      { group: "Performance", key: "Processor", value: "Samsung Exynos 1580 (4nm) Octa-Core" },
      { group: "Display", key: "Screen", value: "6.6-inch Super AMOLED 120Hz FHD+ (1080 x 2340)" },
      { group: "Camera", key: "Main Camera", value: "50MP (f/1.8, OIS) + 12MP Ultra-Wide + 5MP Macro" },
      { group: "Battery", key: "Capacity", value: "5000 mAh, 45W fast charging" },
    ],
    variants: [
      { sku: "SAM-A56-8-128-NVY", ramGb: 8, storageGb: 128, colorName: "Awesome Navy", colorHex: "#1e3a8a" },
      { sku: "SAM-A56-8-256-BLU", ramGb: 8, storageGb: 256, colorName: "Awesome Iceblue", colorHex: "#93c5fd" },
    ],
  },

  // 8. OnePlus 13
  {
    brandSlug: "oneplus",
    categorySlug: "flagship",
    name: "OnePlus 13 5G",
    slug: "oneplus-13-5g",
    model: "OnePlus 13",
    modelNumber: "CPH2653",
    description: "OnePlus 13 5G flagship powered by Snapdragon 8 Elite, 6.82-inch 2K Oriental Screen DisplayMate A++, 50MP triple Hasselblad camera system, IP68/IP69 rating, and 6000 mAh Silicon-Carbon battery with 100W SuperVOOC.",
    specs: [
      { group: "Performance", key: "Processor", value: "Qualcomm Snapdragon 8 Elite (3nm) Octa-Core" },
      { group: "Display", key: "Screen", value: "6.82-inch 2K+ LTPO AMOLED (3168 x 1440) 120Hz, 4500 nits" },
      { group: "Camera", key: "Main Camera", value: "50MP Sony LYT-808 (OIS) + 50MP 3x Periscope + 50MP Ultra-Wide" },
      { group: "Battery", key: "Capacity", value: "6000 mAh Silicon-Carbon, 100W SuperVOOC, 50W AirVOOC" },
    ],
    variants: [
      { sku: "1P-13-12-256-BLK", ramGb: 12, storageGb: 256, colorName: "Midnight Black", colorHex: "#18181b" },
      { sku: "1P-13-16-512-WHT", ramGb: 16, storageGb: 512, colorName: "Arctic Dawn", colorHex: "#e0e7ff" },
    ],
  },

  // 9. OnePlus 13R
  {
    brandSlug: "oneplus",
    categorySlug: "mid-range-5g",
    name: "OnePlus 13R 5G",
    slug: "oneplus-13r-5g",
    model: "OnePlus 13R",
    modelNumber: "CPH2645",
    description: "OnePlus 13R 5G performance powerhouse featuring Snapdragon 8 Gen 3, 1.5K 120Hz ProXDR display, 50MP Sony IMX906 OIS main camera, and massive 6000 mAh battery with 80W SuperVOOC fast charging.",
    specs: [
      { group: "Performance", key: "Processor", value: "Qualcomm Snapdragon 8 Gen 3 (4nm) Octa-Core" },
      { group: "Display", key: "Screen", value: "6.78-inch 1.5K LTPO AMOLED 120Hz (2780 x 1264)" },
      { group: "Camera", key: "Main Camera", value: "50MP Sony (f/1.8, OIS) + 8MP Ultra-Wide + 2MP Macro" },
      { group: "Battery", key: "Capacity", value: "6000 mAh, 80W SuperVOOC fast charging" },
    ],
    variants: [
      { sku: "1P-13R-12-256-NOIR", ramGb: 12, storageGb: 256, colorName: "Nebula Noir", colorHex: "#1e1e24" },
      { sku: "1P-13R-16-512-AST", ramGb: 16, storageGb: 512, colorName: "Astral Trail", colorHex: "#94a3b8" },
    ],
  },

  // 10. OnePlus Nord 4
  {
    brandSlug: "oneplus",
    categorySlug: "mid-range-5g",
    name: "OnePlus Nord 4 5G",
    slug: "oneplus-nord-4-5g",
    model: "OnePlus Nord 4",
    modelNumber: "CPH2661",
    description: "OnePlus Nord 4 5G featuring an all-metal unibody design, Snapdragon 7+ Gen 3 processor, 6.74-inch 120Hz AMOLED display, 50MP Sony LYT-600 OIS camera, and 100W SuperVOOC charging.",
    specs: [
      { group: "Performance", key: "Processor", value: "Qualcomm Snapdragon 7+ Gen 3 (4nm) Octa-Core" },
      { group: "Display", key: "Screen", value: "6.74-inch 1.5K AMOLED 120Hz (2772 x 1240)" },
      { group: "Camera", key: "Main Camera", value: "50MP Sony LYT-600 (f/1.8, OIS) + 8MP Ultra-Wide" },
      { group: "Battery", key: "Capacity", value: "5500 mAh, 100W SuperVOOC fast charging" },
    ],
    variants: [
      { sku: "1P-NORD4-8-128-OBS", ramGb: 8, storageGb: 128, colorName: "Obsidian Midnight", colorHex: "#262626" },
      { sku: "1P-NORD4-12-256-SLV", ramGb: 12, storageGb: 256, colorName: "Mercurial Silver", colorHex: "#d1d5db" },
    ],
  },

  // 11. Xiaomi 14
  {
    brandSlug: "xiaomi",
    categorySlug: "flagship",
    name: "Xiaomi 14 5G",
    slug: "xiaomi-14-5g",
    model: "Xiaomi 14",
    modelNumber: "23127PN0CG",
    description: "Xiaomi 14 5G compact optical flagship co-engineered with Leica. Features Snapdragon 8 Gen 3, 6.36-inch 1.5K 120Hz LTPO OLED, Leica Summilux optical lenses with 50MP Light Fusion 900 sensor, and 90W HyperCharge.",
    specs: [
      { group: "Performance", key: "Processor", value: "Qualcomm Snapdragon 8 Gen 3 (4nm) Octa-Core" },
      { group: "Display", key: "Screen", value: "6.36-inch 1.5K LTPO OLED 120Hz (2670 x 1200) 3000 nits" },
      { group: "Camera", key: "Main Camera", value: "50MP Leica Main (OIS) + 50MP Leica 3.2x Telephoto + 50MP Ultra-Wide" },
      { group: "Battery", key: "Capacity", value: "4610 mAh, 90W HyperCharge, 50W wireless" },
    ],
    variants: [
      { sku: "MI-14-12-512-GRN", ramGb: 12, storageGb: 512, colorName: "Jade Green", colorHex: "#15803d" },
      { sku: "MI-14-12-512-BLK", ramGb: 12, storageGb: 512, colorName: "Black", colorHex: "#171717" },
    ],
  },

  // 12. Xiaomi 14 Ultra
  {
    brandSlug: "xiaomi",
    categorySlug: "flagship",
    name: "Xiaomi 14 Ultra 5G",
    slug: "xiaomi-14-ultra-5g",
    model: "Xiaomi 14 Ultra",
    modelNumber: "24030PN60G",
    description: "Xiaomi 14 Ultra professional imaging flagship with quad 50MP Leica camera system, 1-inch LYT-900 sensor with stepless variable aperture, Snapdragon 8 Gen 3, and Xiaomi Guardian Structure.",
    specs: [
      { group: "Performance", key: "Processor", value: "Qualcomm Snapdragon 8 Gen 3 (4nm) Octa-Core" },
      { group: "Display", key: "Screen", value: "6.73-inch WQHD+ LTPO AMOLED 120Hz (3200 x 1440)" },
      { group: "Camera", key: "Main Camera", value: "Quad 50MP: 1-inch LYT-900 (f/1.63-f/4.0 OIS) + 50MP 3.2x + 50MP 5x Periscope + 50MP UW" },
      { group: "Battery", key: "Capacity", value: "5000 mAh, 90W HyperCharge, 80W wireless" },
    ],
    variants: [
      { sku: "MI-14U-16-512-BLK", ramGb: 16, storageGb: 512, colorName: "Black Vegan Leather", colorHex: "#1c1917" },
      { sku: "MI-14U-16-512-WHT", ramGb: 16, storageGb: 512, colorName: "White Vegan Leather", colorHex: "#f5f5f4" },
    ],
  },

  // 13. Redmi Note 14 Pro+ 5G
  {
    brandSlug: "xiaomi",
    categorySlug: "mid-range-5g",
    name: "Redmi Note 14 Pro+ 5G",
    slug: "redmi-note-14-pro-plus-5g",
    model: "Redmi Note 14 Pro+ 5G",
    modelNumber: "24090RA29G",
    description: "Redmi Note 14 Pro+ 5G flagship-level mid-ranger featuring Snapdragon 7s Gen 3, 6.67-inch curved 1.5K 120Hz OLED, 50MP Light Hunter 800 OIS camera with 2.5x telephoto, and IP68/IP69K rating.",
    specs: [
      { group: "Performance", key: "Processor", value: "Qualcomm Snapdragon 7s Gen 3 (4nm) Octa-Core" },
      { group: "Display", key: "Screen", value: "6.67-inch 1.5K 120Hz Curved OLED (2712 x 1220) 3000 nits" },
      { group: "Camera", key: "Main Camera", value: "50MP Light Hunter 800 (OIS) + 50MP 2.5x Telephoto + 8MP Ultra-Wide" },
      { group: "Battery", key: "Capacity", value: "6200 mAh Silicon-Carbon, 90W fast charging" },
    ],
    variants: [
      { sku: "RED-N14PP-8-256-BLK", ramGb: 8, storageGb: 256, colorName: "Midnight Black", colorHex: "#1e293b" },
      { sku: "RED-N14PP-12-512-WHT", ramGb: 12, storageGb: 512, colorName: "Mirror Porcelain White", colorHex: "#f8fafc" },
    ],
  },

  // 14. Vivo V50
  {
    brandSlug: "vivo",
    categorySlug: "mid-range-5g",
    name: "Vivo V50 5G",
    slug: "vivo-v50-5g",
    model: "Vivo V50",
    modelNumber: "V2427",
    description: "Vivo V50 5G slim portrait smartphone equipped with Snapdragon 7 Gen 3, ZEISS co-engineered portrait optics with Studio Quality Aura Light, 6.78-inch 120Hz curved AMOLED, and 6000 mAh battery with 90W FlashCharge.",
    specs: [
      { group: "Performance", key: "Processor", value: "Qualcomm Snapdragon 7 Gen 3 (4nm) Octa-Core" },
      { group: "Display", key: "Screen", value: "6.78-inch 1.5K 120Hz 3D Curved AMOLED (2800 x 1260)" },
      { group: "Camera", key: "Main Camera", value: "50MP ZEISS OIS Main + 50MP ZEISS Ultra-Wide + Smart Aura Light" },
      { group: "Battery", key: "Capacity", value: "6000 mAh, 90W FlashCharge" },
    ],
    variants: [
      { sku: "VIV-V50-8-128-GRY", ramGb: 8, storageGb: 128, colorName: "Titanium Grey", colorHex: "#64748b" },
      { sku: "VIV-V50-12-256-GLD", ramGb: 12, storageGb: 256, colorName: "Rose Gold", colorHex: "#fb7185" },
    ],
  },

  // 15. Vivo X200
  {
    brandSlug: "vivo",
    categorySlug: "flagship",
    name: "Vivo X200 5G",
    slug: "vivo-x200-5g",
    model: "Vivo X200",
    modelNumber: "V2415",
    description: "Vivo X200 imaging flagship powered by MediaTek Dimensity 9400, ZEISS True Color Master Camera with 50MP Sony LYT-818 sensor, 6.67-inch quad-curved AMOLED, and 5800 mAh BlueVolt battery.",
    specs: [
      { group: "Performance", key: "Processor", value: "MediaTek Dimensity 9400 (3nm) Octa-Core" },
      { group: "Display", key: "Screen", value: "6.67-inch 1.5K LTPS AMOLED 120Hz (2800 x 1260) 4500 nits" },
      { group: "Camera", key: "Main Camera", value: "50MP Sony LYT-818 (f/1.57, OIS) + 50MP ZEISS Telephoto + 50MP Ultra-Wide" },
      { group: "Battery", key: "Capacity", value: "5800 mAh BlueVolt, 90W FlashCharge" },
    ],
    variants: [
      { sku: "VIV-X200-12-256-GRN", ramGb: 12, storageGb: 256, colorName: "Aurora Green", colorHex: "#0d9488" },
      { sku: "VIV-X200-16-512-BLK", ramGb: 16, storageGb: 512, colorName: "Carbon Black", colorHex: "#111827" },
    ],
  },

  // 16. Vivo X200 Pro
  {
    brandSlug: "vivo",
    categorySlug: "flagship",
    name: "Vivo X200 Pro 5G",
    slug: "vivo-x200-pro-5g",
    model: "Vivo X200 Pro",
    modelNumber: "V2413",
    description: "Vivo X200 Pro ultimate telephoto camera phone with 200MP ZEISS APO Periscope Telephoto, Sony LYT-818 50MP main sensor, Dimensity 9400 chip, V3+ imaging processor, and 6000 mAh battery.",
    specs: [
      { group: "Performance", key: "Processor", value: "MediaTek Dimensity 9400 (3nm) with Vivo V3+ Chip" },
      { group: "Display", key: "Screen", value: "6.78-inch 1.5K 8T LTPO AMOLED 120Hz (2800 x 1260)" },
      { group: "Camera", key: "Main Camera", value: "50MP LYT-818 (OIS) + 200MP ZEISS APO Telephoto (OIS) + 50MP Ultra-Wide" },
      { group: "Battery", key: "Capacity", value: "6000 mAh BlueVolt, 90W FlashCharge, 30W wireless" },
    ],
    variants: [
      { sku: "VIV-X200P-16-512-GRY", ramGb: 16, storageGb: 512, colorName: "Titanium Gray", colorHex: "#475569" },
      { sku: "VIV-X200P-16-512-BLK", ramGb: 16, storageGb: 512, colorName: "Midnight Black", colorHex: "#030712" },
    ],
  },

  // 17. OPPO Reno13 Pro 5G
  {
    brandSlug: "oppo",
    categorySlug: "mid-range-5g",
    name: "OPPO Reno13 Pro 5G",
    slug: "oppo-reno13-pro-5g",
    model: "Reno13 Pro 5G",
    modelNumber: "CPH2697",
    description: "OPPO Reno13 Pro 5G with aerospace-grade metal frame, MediaTek Dimensity 8350, 6.83-inch quad-micro-curved 120Hz AMOLED, 50MP OIS camera, 50MP 3.5x telephoto, and IP69 water resistance.",
    specs: [
      { group: "Performance", key: "Processor", value: "MediaTek Dimensity 8350 (4nm) Octa-Core" },
      { group: "Display", key: "Screen", value: "6.83-inch 1.5K 120Hz Quad-curved AMOLED (2800 x 1272)" },
      { group: "Camera", key: "Main Camera", value: "50MP Sony (OIS) + 50MP 3.5x Telephoto + 8MP Ultra-Wide" },
      { group: "Battery", key: "Capacity", value: "5800 mAh, 80W SuperVOOC, 50W wireless" },
    ],
    variants: [
      { sku: "OPP-R13P-12-256-PUR", ramGb: 12, storageGb: 256, colorName: "Butterfly Purple", colorHex: "#a855f7" },
      { sku: "OPP-R13P-12-512-BLK", ramGb: 12, storageGb: 512, colorName: "Midnight Black", colorHex: "#1f2937" },
    ],
  },

  // 18. Realme GT 7 Pro
  {
    brandSlug: "realme",
    categorySlug: "flagship",
    name: "Realme GT 7 Pro 5G",
    slug: "realme-gt-7-pro-5g",
    model: "Realme GT 7 Pro",
    modelNumber: "RMX5010",
    description: "Realme GT 7 Pro India's first Snapdragon 8 Elite flagship with Eco² OLED Plus display, 50MP Sony IMX906 OIS main camera, 50MP 3x periscope telephoto, underwater photography mode, and 120W charging.",
    specs: [
      { group: "Performance", key: "Processor", value: "Qualcomm Snapdragon 8 Elite (3nm) Octa-Core" },
      { group: "Display", key: "Screen", value: "6.78-inch Eco² OLED Plus 120Hz 1.5K (2780 x 1264) 6000 nits" },
      { group: "Camera", key: "Main Camera", value: "50MP Sony IMX906 (OIS) + 50MP Sony LYT-600 3x Periscope + 8MP Ultra-Wide" },
      { group: "Battery", key: "Capacity", value: "5800 mAh Titan Battery, 120W SuperVOOC" },
    ],
    variants: [
      { sku: "RLM-GT7P-12-256-ORG", ramGb: 12, storageGb: 256, colorName: "Mars Orange", colorHex: "#ea580c" },
      { sku: "RLM-GT7P-16-512-GRY", ramGb: 16, storageGb: 512, colorName: "Galaxy Grey", colorHex: "#374151" },
    ],
  },

  // 19. Motorola Edge 50 Pro
  {
    brandSlug: "motorola",
    categorySlug: "mid-range-5g",
    name: "Motorola Edge 50 Pro 5G",
    slug: "motorola-edge-50-pro-5g",
    model: "Edge 50 Pro",
    modelNumber: "XT2403-1",
    description: "Motorola Edge 50 Pro featuring Pantone Validated camera and display, Snapdragon 7 Gen 3, 6.7-inch 144Hz 1.5K pOLED curved screen, 50MP AI camera with 3x telephoto, and 125W TurboPower charging.",
    specs: [
      { group: "Performance", key: "Processor", value: "Qualcomm Snapdragon 7 Gen 3 (4nm) Octa-Core" },
      { group: "Display", key: "Screen", value: "6.7-inch 1.5K pOLED 144Hz (2712 x 1220) HDR10+ 2000 nits" },
      { group: "Camera", key: "Main Camera", value: "50MP (f/1.4, OIS) + 10MP 3x Telephoto (OIS) + 13MP Ultra-Wide/Macro" },
      { group: "Battery", key: "Capacity", value: "4500 mAh, 125W TurboPower wired, 50W wireless" },
    ],
    variants: [
      { sku: "MOT-E50P-8-256-BLK", ramGb: 8, storageGb: 256, colorName: "Black Beauty", colorHex: "#18181b" },
      { sku: "MOT-E50P-12-256-LAV", ramGb: 12, storageGb: 256, colorName: "Luxe Lavender", colorHex: "#c084fc" },
    ],
  },

  // 20. Google Pixel 9 Pro
  {
    brandSlug: "google",
    categorySlug: "flagship",
    name: "Google Pixel 9 Pro 5G",
    slug: "google-pixel-9-pro-5g",
    model: "Pixel 9 Pro",
    modelNumber: "GEC77",
    description: "Google Pixel 9 Pro with Google Tensor G4 and Gemini AI, 6.3-inch Super Actua LTPO OLED 120Hz display, pro triple rear camera system with 5x telephoto, 42MP selfie camera, and 7 years of OS updates.",
    specs: [
      { group: "Performance", key: "Processor", value: "Google Tensor G4 (4nm) with Titan M2 security coprocessor" },
      { group: "Display", key: "Screen", value: "6.3-inch Super Actua LTPO OLED 1-120Hz (1280 x 2856) 3000 nits" },
      { group: "Camera", key: "Main Camera", value: "50MP Octa PD Main (OIS) + 48MP Quad PD 5x Telephoto + 48MP Quad PD Ultra-Wide" },
      { group: "Battery", key: "Capacity", value: "4700 mAh, 27W fast charging, Fast wireless charging" },
    ],
    variants: [
      { sku: "GGL-PX9P-16-128-OBS", ramGb: 16, storageGb: 128, colorName: "Obsidian", colorHex: "#1c1917" },
      { sku: "GGL-PX9P-16-256-POR", ramGb: 16, storageGb: 256, colorName: "Porcelain", colorHex: "#fafaf9" },
      { sku: "GGL-PX9P-16-512-HAZ", ramGb: 16, storageGb: 512, colorName: "Hazel", colorHex: "#78716c" },
    ],
  },
];

async function main() {
  console.log("Starting addition of smartphone models...");

  // 1. Ensure required Brands exist
  const brandData = [
    { name: "Apple", slug: "apple", description: "Apple iPhones and premium consumer hardware" },
    { name: "Samsung", slug: "samsung", description: "Samsung Galaxy flagship, foldable and A-series smartphones" },
    { name: "OnePlus", slug: "oneplus", description: "OnePlus flagship and Nord series smartphones" },
    { name: "Xiaomi", slug: "xiaomi", description: "Xiaomi and Redmi high-performance smartphones" },
    { name: "Vivo", slug: "vivo", description: "Vivo ZEISS imaging and V-series portrait smartphones" },
    { name: "OPPO", slug: "oppo", description: "OPPO Reno and Find series advanced smartphones" },
    { name: "Realme", slug: "realme", description: "Realme GT performance and youth-focused smartphones" },
    { name: "Motorola", slug: "motorola", description: "Motorola Edge and G-series smartphones" },
    { name: "Google", slug: "google", description: "Google Pixel smartphones with Tensor and Gemini AI" },
  ];

  const brandMap: Record<string, string> = {};
  for (const b of brandData) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: { name: b.name, description: b.description },
      create: { name: b.name, slug: b.slug, description: b.description },
    });
    brandMap[b.slug] = brand.id;
  }

  // 2. Ensure Categories exist
  const categoryData = [
    { name: "Flagship Smartphones", slug: "flagship", description: "Premium high-tier smartphones with top-grade processors and optics" },
    { name: "Mid-Range & Value 5G", slug: "mid-range-5g", description: "High volume, fast moving 5G smartphones for retail outlets" },
  ];

  const categoryMap: Record<string, string> = {};
  for (const c of categoryData) {
    const category = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, description: c.description },
      create: { name: c.name, slug: c.slug, description: c.description },
    });
    categoryMap[c.slug] = category.id;
  }

  // 3. Process the 20 requested models
  const createdProducts: string[] = [];
  const skippedProducts: string[] = [];

  for (const item of REQUESTED_MODELS) {
    // Check if product already exists by slug OR by model
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { slug: item.slug },
          { model: item.model, brandId: brandMap[item.brandSlug] },
        ],
      },
    });

    if (existing) {
      console.log(`[SKIPPED] Model "${item.name}" (slug: ${existing.slug}) is ALREADY present in database (ID: ${existing.id}).`);
      skippedProducts.push(`${item.name} (${existing.slug})`);
      continue;
    }

    // Create the product as DRAFT (isPublished: false, isArchived: false)
    // As per instruction: "If verified business data is unavailable, leave the product as a draft or inactive according to the existing application design. Do not make incomplete products visible as available inventory."
    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({
        data: {
          brandId: brandMap[item.brandSlug],
          categoryId: categoryMap[item.categorySlug],
          name: item.name,
          slug: item.slug,
          model: item.model,
          modelNumber: item.modelNumber,
          description: item.description,
          condition: "Brand New Sealed",
          warrantyMonths: 12,
          returnDays: 7,
          isPublished: false, // DRAFT status: not visible on public storefront until admin sets prices and publishes
          isArchived: false,
          isFeatured: false,
        },
      });

      // Insert technical specifications
      for (const spec of item.specs) {
        await tx.productSpecification.create({
          data: {
            productId: p.id,
            group: spec.group,
            key: spec.key,
            value: spec.value,
          },
        });
      }

      // Insert genuine variants (with onHandStock: 0, isAvailable: false, baseWholesalePrice: 0)
      for (const v of item.variants) {
        await tx.productVariant.create({
          data: {
            productId: p.id,
            sku: v.sku,
            ramGb: v.ramGb,
            storageGb: v.storageGb,
            colorName: v.colorName,
            colorHex: v.colorHex,
            region: "India (IN)",
            condition: "Brand New",
            baseWholesalePrice: 0, // 0 indicates pending admin wholesale quote
            minOrderQty: 2,
            lowStockThreshold: 5,
            onHandStock: 0, // 0 indicates no verified inventory received yet
            reservedStock: 0,
            isAvailable: false, // Inactive until priced & published
          },
        });
      }

      return p;
    });

    console.log(`[CREATED DRAFT] Model "${product.name}" (slug: ${product.slug}) with ${item.variants.length} draft variants.`);
    createdProducts.push(`${product.name} (${product.slug})`);
  }

  console.log("\n==========================================");
  console.log("SMARTPHONE MODEL EXPANSION SUMMARY");
  console.log("==========================================");
  console.log(`Total requested: ${REQUESTED_MODELS.length}`);
  console.log(`Actually created (as Drafts): ${createdProducts.length}`);
  console.log(`Skipped (already present): ${skippedProducts.length}`);
  console.log("\nCreated Products:");
  createdProducts.forEach((p, idx) => console.log(`  ${idx + 1}. ${p}`));
  console.log("\nSkipped Products:");
  skippedProducts.forEach((p, idx) => console.log(`  ${idx + 1}. ${p}`));
  console.log("==========================================\n");
}

main()
  .catch((e) => {
    console.error("Error executing smartphone expansion script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
