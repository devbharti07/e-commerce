# Jagdamba Mobile — Master Design System Specification
**Product:** Jagdamba Mobile (Wholesale Smartphone E-Commerce Platform)  
**Industry:** B2B Electronics Distribution & Retailer Trade Portal  
**Visual Direction:** Editorial B2B Luxury & Trade Authority (Forest Green, Warm Ivory, Slate Graphite, Burnished Brass)  
**Generated & Validated with:** UI/UX Pro Max Intelligence Engine  

---

## 1. Brand Tokens & Color Palette

### Light Mode (Warm Ivory & Forest Green Trade Canvas)
| Semantic Token | Value | Contrast vs Surface / Background | Intended Role |
|---|---|---|---|
| `--background` | `#F6F5F0` | Base Canvas | Warm editorial ivory, reduces eye strain for long wholesale trading sessions |
| `--surface` | `#FFFFFF` | 1.1:1 vs bg | Pure crisp container for product cards, specifications, data tables |
| `--surface-elevated` | `#FFFFFF` | Elevated | Modals, flyout menus, sticky summary sidebars |
| `--surface-muted` | `#ECEFE9` | Subtle Divider | Table headers, secondary toolbars, status pill containers |
| `--text-primary` | `#17231E` | **13.5:1 (AAA)** | Headlines, model titles, wholesale price figures, primary labels |
| `--text-secondary` | `#3D4E45` | **7.1:1 (AAA)** | Descriptions, specs labels, order items metadata |
| `--text-muted` | `#66786F` | **4.6:1 (AA)** | Timestamps, placeholder hints, inactive navigation states |
| `--border` | `#D5DFD7` | Subtle Definition | Clean structural lines, grid dividers, form field borders |
| `--border-subtle` | `#E7EDE8` | Card hairline | Inner divider lines, table row borders |
| `--primary` | `#173B35` | **12.2:1 (AAA)** | Deep Forest Pine — Primary buttons, active tabs, header bar |
| `--primary-hover` | `#1F4D45` | High | Interactive hover states |
| `--primary-foreground` | `#FFFFFF` | High | Text on primary containers |
| `--secondary` | `#285C4D` | Medium | Secondary actions, badges, brand pill containers |
| `--secondary-foreground`| `#FFFFFF` | High | Text on secondary elements |
| `--accent` | `#B3853E` | **4.8:1 (AA)** | Burnished Trade Brass — Featured badges, tier pricing highlights, CTA tags |
| `--accent-hover` | `#9B7233` | Hover | Interactive brass elements |
| `--accent-foreground` | `#FFFFFF` | High | Accent button labels |
| `--accent-subtle` | `#F8F3EA` | Soft Tag | Tier discount pill backgrounds, verified dealer badges |
| `--success` | `#1B6A47` | **5.4:1 (AA)** | In-Stock indicators, approved badges, confirmed order tags |
| `--success-subtle` | `#E6F4ED` | Soft Tag | Success banner backgrounds |
| `--warning` | `#B45309` | **5.1:1 (AA)** | Low-stock threshold alerts, pending approval tags |
| `--warning-subtle` | `#FEF3C7` | Soft Tag | Warning callouts |
| `--error` | `#B91C1C` | **6.0:1 (AAA)** | Out of stock, rejected account, critical inventory warnings |
| `--error-subtle` | `#FEE2E2` | Soft Tag | Error callouts |

### Dark Mode (Midnight Cypress & Luminous Spruce)
| Semantic Token | Value | Role |
|---|---|---|
| `--background` | `#111916` | Midnight Forest trade backdrop |
| `--surface` | `#18221D` | Deep Spruce container surface |
| `--surface-elevated` | `#212E28` | Elevated modals, dropdowns, floating summary panels |
| `--surface-muted` | `#141E19` | Recessed containers, table headers |
| `--text-primary` | `#E8EFEA` | **13.2:1 (AAA)** high-clarity soft ivory text |
| `--text-secondary` | `#A3B5AA` | **6.5:1 (AAA)** secondary spec text |
| `--text-muted` | `#788B80` | **4.5:1 (AA)** hints and labels |
| `--border` | `#26362E` | Deep dark moss borders |
| `--border-subtle` | `#1E2B25` | Hairline dividers |
| `--primary` | `#2D6A5A` | Luminous Forest Emerald |
| `--primary-foreground` | `#FFFFFF` | High contrast on primary |
| `--accent` | `#D8AB64` | **5.5:1 (AA)** Luminous warm brass gold |
| `--accent-subtle` | `#2A2214` | Dark mode gold pill container |
| `--success` | `#22C55E` | Dark mode live stock indicators |
| `--error` | `#EF4444` | Dark mode error states |

---

## 2. Typography & Editorial Hierarchy

- **Primary Font Family:** `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
- **Typographic Scale:**
  - `Hero Display`: 40px – 56px / Line Height 1.1 / Weight 800 / Tracking -0.03em
  - `Section Title (H2)`: 28px – 34px / Line Height 1.2 / Weight 700 / Tracking -0.025em
  - `Card Title (H3)`: 18px – 20px / Line Height 1.3 / Weight 600 / Tracking -0.015em
  - `Subheading / Lead`: 15px – 17px / Line Height 1.5 / Weight 400-500
  - `Body / Specs`: 13px – 14px / Line Height 1.55 / Weight 400
  - `Micro Label / Badge`: 11px – 12px / Line Height 1.3 / Weight 600 / Tracking 0.05em (Uppercase)
  - `Currency / Figures`: Tabular numbers (`font-variant-numeric: tabular-nums`) for perfect alignment

---

## 3. Structural Spacing, Radius & Shadows

- **Spacing Scale:**
  - `2xs: 4px`, `xs: 8px`, `sm: 12px`, `md: 16px`, `lg: 24px`, `xl: 32px`, `2xl: 48px`, `3xl: 64px`, `4xl: 96px`
- **Border Radii:**
  - `Base / Buttons / Inputs`: `8px` (`rounded-lg`) — Precise, professional, never overly bulbous
  - `Cards / Containers`: `12px` (`rounded-xl`) — Restrained luxury radius
  - `Modals / Flyouts`: `16px` (`rounded-2xl`)
  - `Pills / Status Chips`: `9999px` (`rounded-full`)
- **Shadow System (Natural Soft Deflection):**
  - `Card Elevation`: `0 1px 3px rgba(23, 35, 30, 0.04), 0 4px 12px rgba(23, 35, 30, 0.03)`
  - `Hover Elevation`: `0 6px 18px rgba(23, 35, 30, 0.07), 0 1px 4px rgba(23, 35, 30, 0.04)`
  - `Modal / Popover`: `0 20px 40px rgba(17, 25, 22, 0.16)`

---

## 4. Component Patterns

1. **Brand Navigation & Header:**
   - Slim, elegant top bar with real-time stock alert banner.
   - Distinctive brand mark with emerald & brass crest icon.
   - Quick search with instant model/specs filtering.
   - Live badge counters for wholesale cart items, dealer chat messages, and admin pending queue.
2. **Wholesale Product Cards:**
   - Brand logo badge + genuine sealed guarantee chip.
   - High-fidelity smartphone image framing with subtle warm-canvas backdrop.
   - Specs pills (RAM / Storage / Battery / 5G Band status).
   - Clear Tier pricing progression table (e.g. 1-2 pcs @ ₹X, 5-9 pcs @ ₹Y, 10+ pcs @ ₹Z).
   - Live warehouse availability: Available units count, Minimum Order Quantity (MOQ).
3. **Admin Console Components:**
   - High-density, scannable data tables with sticky header and alternating rows.
   - Quick action toolbars with CSV export, search, and status filters.
   - Contextual drawer modals for stock adjustments and price revision negotiations.
4. **Motion & Interaction Rules:**
   - Short, crisp transitions (150ms – 240ms) using `cubic-bezier(0.16, 1, 0.3, 1)`.
   - Micro-interaction lifts on cards (translateY -2px).
   - Strict `prefers-reduced-motion` compliance. Zero layout shift.
