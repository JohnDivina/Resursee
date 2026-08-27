---
version: 1.0.0
name: Resursee Cobalt Ecosystem
description: Institutional university resource hub design system with Cobalt electric blue signal, clean high-contrast typography, and playful otter/owl mascot elements.
colors:
  paper: "oklch(98.5% 0.004 250)"
  paper-surface: "oklch(99.5% 0.002 250)"
  paper-muted: "oklch(96.0% 0.008 250)"
  paper-card: "oklch(100% 0 0)"
  ink: "oklch(24.0% 0.02 258)"
  ink-secondary: "oklch(45.0% 0.018 257)"
  ink-muted: "oklch(65.0% 0.012 257)"
  rule: "oklch(91.0% 0.006 250)"
  rule-subtle: "oklch(94.5% 0.004 250)"
  rule-strong: "oklch(80.0% 0.015 250)"
  primary: "oklch(58.0% 0.20 256)"
  primary-hover: "oklch(52.0% 0.22 256)"
  primary-active: "oklch(46.0% 0.24 256)"
  primary-glow: "rgba(37, 99, 235, 0.15)"
  accent-amber: "oklch(76.0% 0.16 75)"
  accent-amber-glow: "rgba(245, 158, 11, 0.18)"
  accent-emerald: "oklch(70.0% 0.17 150)"
  accent-rose: "oklch(65.0% 0.20 25)"
  badge-bg: "oklch(94.0% 0.03 256)"
  dark-surface: "oklch(18.0% 0.016 260)"
  dark-surface-card: "oklch(22.0% 0.016 260)"
  dark-border: "oklch(30.0% 0.015 260)"
typography:
  font-display: "Space Grotesk, system-ui, sans-serif"
  font-body: "Inter, system-ui, sans-serif"
  font-mono: "JetBrains Mono, Menlo, monospace"
  h1:
    fontFamily: "{typography.font-display}"
    fontSize: "44px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  h2:
    fontFamily: "{typography.font-display}"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  h3:
    fontFamily: "{typography.font-display}"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body-lg:
    fontFamily: "{typography.font-body}"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: "{typography.font-body}"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "{typography.font-body}"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label-mono:
    fontFamily: "{typography.font-mono}"
    fontSize: "11.5px"
    fontWeight: 500
    letterSpacing: "0.06em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "10px"
  xl: "14px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
  3xl: "64px"
components:
  search-bar:
    backgroundColor: "{colors.paper-surface}"
    borderColor: "{colors.rule}"
    rounded: "{rounded.lg}"
    padding: "16px 20px"
  resource-card:
    backgroundColor: "{colors.paper-card}"
    borderColor: "{colors.rule}"
    rounded: "{rounded.lg}"
    padding: "20px"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "10px 18px"
  category-chip:
    backgroundColor: "{colors.paper-surface}"
    borderColor: "{colors.rule}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
---

# Resursee · Central University Resource Hub Design System

/* Hallmark · macrostructure: Ecosystem Index · theme: Cobalt · genre: modern-minimal */

## 1. Overview & Mascot DNA
**Resursee** ("Search, See, Succeed") is the centralized discovery and resource aggregation platform for universities.
- **Mascot / Motif:** The Resourceful Sea Otter / Wise University Owl — curious, organized, always gathering and organizing tools and knowledge.
- **Design Philosophy:** Institutional clarity meets modern developer-tool precision (Linear/GitBook clarity + Supabase responsiveness).
- **Primary Goal:** Eliminate academic information fragmentation. Transform a 15-minute search across 7 platforms into a 3-second instant search, preview, and download.

## 2. Color Calibration (OKLCH System)
- **Paper Ground (`--color-paper`):** `oklch(98.5% 0.004 250)` — engineered cool near-white, prevents harsh `#ffffff` glare.
- **Charcoal Ink (`--color-ink`):** `oklch(24% 0.02 258)` — deep technical contrast with WCAG AAA compliance.
- **Electric Cobalt Accent (`--color-primary`):** `oklch(58% 0.20 256)` — crisp signal blue for active states, key CTAs, and verified resource badges.
- **Amber Gold (`--color-accent-amber`):** `oklch(76% 0.16 75)` — for featured items, document ratings, and announcement tags.
- **Dark Graphite (`--color-dark-surface`):** `oklch(18% 0.016 260)` — for command palette overlay and technical preview headers.

## 3. Typography Hierarchy
- **Display:** `Space Grotesk` (500/600/700) for headlines, numbers, and macro section titles.
- **Body:** `Inter` (400/500/600) for clear reading, descriptions, and metadata.
- **Labels & Code:** `JetBrains Mono` (400/500) uppercase for file types (`.PDF`, `.DOCX`), document versions (`v2026.1`), timestamps, and department codes (`HR-OFFICE`, `REG-01`).

## 4. Macrostructure: 20 · Ecosystem Index
- **Nav Archetype (`N13`):** Wordmark + Mascot pill + Quick links + ⌘K Instant Search trigger + Admin Portal link.
- **Hero Section:** "Find the university resource you need" with live dynamic search filter bar and quick category pills.
- **Enrichment (Tier A):** `InteractiveParticles.tsx` canvas constellation mesh with cobalt/amber glow lines and cursor gravity.
- **Core Hub Views:**
  1. **Quick Categories Grid:** Forms, Templates, Policies, Guidelines, Memorandums, Research.
  2. **Featured & Most Downloaded Resources:** High-utility official documents.
  3. **Live University News & Announcements Stream:** Official verified updates with source tagging.
  4. **Official Department Links Directory:** Direct links to registrar, HR, colleges, IT, library.
- **Footer Archetype (`Ft3`):** Categorized index columns with academic trust seals and status uptime monitor.

## 5. Do's and Don'ts
- **DO** maintain strict 1px hairline rules (`--color-rule`) for spatial depth rather than heavy fuzzy drop shadows.
- **DO** show instant file format badges (`PDF`, `DOCX`, `XLSX`) and file size preview.
- **DO** implement full 8-state interactive feedback (default, hover, focus-visible, active, disabled, loading, error, success).
- **DON'T** use generic AI purple/pink gradients or unreadable thin fonts.
- **DON'T** make the site look like a generic corporate CRM. It must feel like an authoritative, academic digital library.
