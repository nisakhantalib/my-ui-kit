// Generated from tokens/tokens.json by scripts/build-tokens.mjs. Do not edit.
// The same values as the CSS custom properties, for places CSS can't reach:
// React Native, Capacitor status-bar colours, canvas/charts, email templates.

export const tokens = {
  "font": [
    "system-ui",
    "-apple-system",
    "Segoe UI",
    "Roboto",
    "sans-serif"
  ],
  "radius": "10px",
  "space": {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "6": "24px"
  },
  "color": {
    "bg": {
      "light": "#ffffff",
      "dark": "#12151c"
    },
    "surface": {
      "light": "#f6f7f9",
      "dark": "#1b1f29"
    },
    "text": {
      "light": "#14171f",
      "dark": "#eef0f4"
    },
    "text-muted": {
      "light": "#4a5163",
      "dark": "#b3b9c6"
    },
    "border": {
      "light": "#8a90a0",
      "dark": "#6b7385"
    },
    "primary": {
      "light": "#0b5cad",
      "dark": "#7ab8f5"
    },
    "primary-hover": {
      "light": "#084a8c",
      "dark": "#a3cdf8"
    },
    "on-primary": {
      "light": "#ffffff",
      "dark": "#0a1626"
    },
    "danger": {
      "light": "#b42318",
      "dark": "#ff8a7a"
    },
    "on-danger": {
      "light": "#ffffff",
      "dark": "#2a0905"
    },
    "success": {
      "light": "#1a7f37",
      "dark": "#6fdd8b"
    },
    "warning": {
      "light": "#9a6700",
      "dark": "#f0b72f"
    },
    "focus": {
      "light": "#b45309",
      "dark": "#f5a524"
    },
    "backdrop": {
      "light": "rgb(10 14 22 / 0.55)",
      "dark": "rgb(10 14 22 / 0.55)"
    }
  }
} as const;

export type Tokens = typeof tokens;
