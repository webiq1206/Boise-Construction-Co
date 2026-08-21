import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        md: "2rem",
        lg: "2rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1400px",
      },
    },
    extend: {
      borderRadius: {
        lg: "4px",
        md: "2px",
        sm: "1px",
      },
      colors: {
        // Flat / base colors (regular buttons)
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "hsl(var(--popover-border) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          border: "var(--primary-border)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          border: "var(--secondary-border)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border: "var(--muted-border)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border: "var(--accent-border)",
        },
        // Ochre for readable links/hover so they stay AA on the dark ground
        // (the small-accent --accent is the deeper #7E6344, too dark for text).
        "accent-legible": "hsl(var(--accent-legible) / <alpha-value>)",
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--destructive-border)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          soft: "hsl(var(--success-soft) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          soft: "hsl(var(--warning-soft) / <alpha-value>)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)"
        },
        brass: {
          DEFAULT: "hsl(var(--brass) / <alpha-value>)",
          foreground: "hsl(var(--brass-foreground) / <alpha-value>)",
          border: "var(--brass-border)",
        },
        inverse: {
          DEFAULT: "hsl(var(--inverse) / <alpha-value>)",
          foreground: "hsl(var(--inverse-foreground) / <alpha-value>)",
          muted: "hsl(var(--inverse-muted) / <alpha-value>)",
        },
        "surface-muted": "hsl(var(--surface-muted) / <alpha-value>)",
        "surface-greige": "hsl(var(--surface-greige) / <alpha-value>)",
        "tint-warm": "hsl(var(--tint-warm) / <alpha-value>)",
        "tint-cool": "hsl(var(--tint-cool) / <alpha-value>)",
        "tint-blush": "hsl(var(--tint-blush) / <alpha-value>)",
        status: {
          online: "rgb(34 197 94)",
          away: "rgb(245 158 11)",
          busy: "rgb(239 68 68)",
          offline: "rgb(156 163 175)",
        },
      },
      fontFamily: {
        sans: ["var(--font-montserrat)", "Helvetica Neue", "system-ui", "sans-serif"],
        serif: ["var(--font-libre-baskerville)", "Georgia", "serif"],
        mono: ["Menlo", "Monaco", "monospace"],
      },
      /*
       * THE TYPE SCALE.
       *
       * WHAT WAS WRONG. The site had three named sizes (display and two section
       * titles) and nothing for the text people actually read, so 320 hardcoded
       * `text-[Npx]` values grew to fill the gap across fifteen different sizes
       * - 9, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 16, 20, 22.
       * The most common body text on the site was 11-13px. That is not a style
       * preference, it is below the size at which sustained reading is
       * comfortable for most people, and it is why the site "looked fine" while
       * being tiring to actually use.
       *
       * THE TWO DEFAULT OVERRIDES BELOW DO MOST OF THE WORK. text-xs and
       * text-sm account for 624 usages between them; moving them up one step
       * lifts more of the site than every hand-edit combined, and it lifts the
       * shadcn primitives too, which is where a lot of the small text lives.
       *
       * LINE HEIGHT TRAVELS WITH SIZE. It was previously left to Tailwind's
       * defaults, which are tuned tight for UI chrome, not for paragraphs. Every
       * entry here carries its own, so a size change cannot silently ship
       * cramped leading.
       *
       * 13px IS THE FLOOR. Nothing on the site should be smaller, including
       * eyebrows and legal text. Uppercase tracked labels read smaller than
       * their nominal size, which is exactly why the old 9-10px ones were
       * illegible.
       */
      fontSize: {
        /* --- overrides of Tailwind defaults (highest leverage) ------------ */
        xs: ["0.8125rem", { lineHeight: "1.5" }],      // 13px, was 12
        sm: ["0.9375rem", { lineHeight: "1.55" }],     // 15px, was 14
        base: ["1rem", { lineHeight: "1.65" }],        // 16px, looser leading
        lg: ["1.125rem", { lineHeight: "1.55" }],      // 18px
        xl: ["1.25rem", { lineHeight: "1.45" }],       // 20px

        /* --- semantic tokens, for the text people read ------------------- */
        /** Uppercase tracked kicker above a heading. The 13px floor. */
        eyebrow: ["0.8125rem", { lineHeight: "1.4", letterSpacing: "0.12em", fontWeight: "600" }],
        /** Timestamps, fine print, helper text under a field. */
        caption: ["0.875rem", { lineHeight: "1.5" }],  // 14px
        /** Form labels, chips, table headers. */
        label: ["0.9375rem", { lineHeight: "1.4", fontWeight: "500" }], // 15px
        /** Dense supporting copy that is still meant to be read. */
        "body-sm": ["0.9375rem", { lineHeight: "1.6" }], // 15px
        /** Default reading size. Nudges up on wider screens, never below 16px. */
        body: ["clamp(1rem, 0.97rem + 0.15vw, 1.0625rem)", { lineHeight: "1.65" }],
        /** Lead paragraph under a page title. */
        "body-lg": ["clamp(1.0625rem, 1rem + 0.3vw, 1.1875rem)", { lineHeight: "1.6" }],
        /** Card and sub-section titles. */
        "title-sm": ["1.125rem", { lineHeight: "1.35", letterSpacing: "-0.01em", fontWeight: "600" }],
        title: ["clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem)", { lineHeight: "1.3", letterSpacing: "-0.015em", fontWeight: "600" }],

        display: ["clamp(2.5rem,6vw,5rem)", { lineHeight: "1.04", letterSpacing: "-0.025em" }],
        "section-title": ["clamp(1.625rem, 1.4rem + 1vw, 1.875rem)", { lineHeight: "1.2", letterSpacing: "-0.025em" }],
        "section-title-lg": ["clamp(1.875rem, 1.5rem + 1.6vw, 2.25rem)", { lineHeight: "1.18", letterSpacing: "-0.025em" }],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
