# Boise Construction Co — Brand Kit

Custom Construction · Boise & the Treasure Valley, Idaho · Est. 2020

Part of the Boise trades brand system. The system-wide rules live in
[`../../BRAND-SYSTEM.md`](../../BRAND-SYSTEM.md) — **this file covers only what is specific to Boise Construction Co.**

---

## What makes this brand distinct

| | |
|---|---|
| **Accent color** | `#D09A5C` — Ochre |
| **Seal arc** | `CUSTOM CONSTRUCTION` |
| **Seal centre** | `BOISE` / *Construction* / `CO` |
| **Wordmark** | `BOISE CONSTRUCTION` *Co.* |

Everything else — charcoal, bone, both typefaces, the ring geometry, spacing, minimum sizes — is shared
across all five companies.

### Accent contrast

| Pairing | Ratio | Verdict |
|---|---|---|
| `#D09A5C` on charcoal | 5.38:1 | Passes AA for normal text |
| `#D09A5C` on bone | 2.28:1 | Decorative only |

The accent appears on the seal's **outer ring and dots**, and on the wordmark's ***Co.*** only.

It reads well on charcoal and acceptably as a soft tint on bone. Usable either way, though the reverse lockups are where it has the most presence. Don't set accent-colored *text* on bone.

---

## Files

```
boise-construction-co/
├── svg/
│   ├── seal/      light/  dark/  any/     (8 files)
│   └── wordmark/  light/  dark/           (4 files)
└── png/           same tree, transparent
    ├── seal/…       1024 / 512 / 256 / 128 / 64 px
    └── wordmark/…   2400 / 1200 / 600 / 300 px wide
```

**Naming:** `boise-construction-co-{mark}-{ink}[-accent]-{size}`

| Use | File |
|---|---|
| Default, light background | `svg/seal/light/boise-construction-co-seal-charcoal.svg` |
| Default, dark background | `svg/seal/dark/boise-construction-co-seal-bone.svg` |
| With accent, light | `svg/seal/light/boise-construction-co-seal-charcoal-accent.svg` |
| With accent, dark | `svg/seal/dark/boise-construction-co-seal-bone-accent.svg` |
| Over a photo | `svg/seal/any/boise-construction-co-seal-on-charcoal.svg` |
| Horizontal lockup | `svg/wordmark/light/boise-construction-co-wordmark-charcoal.svg` |

---

## Quick rules

- Seal minimum **160px** on screen, **0.75in** in print. Below that use the wordmark.
- Wordmark minimum **600px** wide, **2.5in**.
- Clear space: **8% of seal diameter**; for the wordmark, one cap height of the `B`.
- Over photography, always use an `any/` disc version.
- Never recolor outside charcoal, bone, and `#D09A5C`.

Full reasoning, typography detail, and known gaps: [`../../BRAND-SYSTEM.md`](../../BRAND-SYSTEM.md).
