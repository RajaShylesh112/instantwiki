# Component Library Configuration: Instant Wiki

**Library:** shadcn/ui (Tailwind CSS + Radix UI)  
**Version:** latest  
**Installation:** `npx shadcn@latest init`

---

## Library Components Mapped

This design system uses React components from the `shadcn/ui` library.

### Component Mappings

| WDS Component ID | UI component | shadcn/ui Component Link | Description |
|------------------|--------------|--------------------------|-------------|
| `landing-header-btn-signup` | Button | `components/ui/button` | Solid and outline actions |
| `dash-modal` | Dialog | `components/ui/dialog` | Creator modal pop-up overlay |
| `upload-dropzone` | File Input | `components/ui/input` | File selection trigger |
| `upload-sources-list` | Table | `components/ui/table` | Tabular display of file listings |
| `processing-steps-group` | Progress | `components/ui/progress` | Status loaders & animation bars |
| `home-search-input` | Command | `components/ui/command` | Autocomplete input search drawer |
| `home-overview-card` | Card | `components/ui/card` | Structured container cards |
| `article-source-drawer` | Sheet | `components/ui/sheet` | Right side drawer for citations |
| `settings-delete-modal` | Dialog | `components/ui/dialog` | Deletion confirm modal overlay |

---

## Custom Theme Config (`tailwind.config.js`)

Theme overrides to configure our colors and typefaces inside the Tailwind configuration:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        background: "hsl(0, 0%, 100%)",
        foreground: "hsl(0, 0%, 9%)",
        muted: {
          DEFAULT: "hsl(0, 0%, 98%)",
          foreground: "hsl(0, 0%, 45%)",
        },
        border: "hsl(0, 0%, 90%)",
        primary: {
          DEFAULT: "hsl(250, 43%, 48%)",
          foreground: "hsl(0, 0%, 100%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 72%, 51%)",
          foreground: "hsl(0, 0%, 100%)",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        serif: ["Merriweather", "serif"],
        mono: ["Fira Code", "monospace"],
      },
      borderRadius: {
        lg: "12px",
        md: "8px",
        sm: "4px",
      },
    },
  },
};
```

---

_Generated with Whiteport Design Studio framework_
