// Generated from tokens/*.json by scripts/build-tokens.mjs. Do not edit.
// The same values as the CSS custom properties, for places CSS can't reach:
// React Native, Capacitor status-bar colours, canvas/charts, email templates.

export const brandTokens = {
  "civic": {
    "font": [
      "system-ui",
      "-apple-system",
      "Segoe UI",
      "Roboto",
      "sans-serif"
    ],
    "radius": "10px",
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
      "accent": {
        "light": "#0f766e",
        "dark": "#5eead4"
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
    },
    "component": {
      "button": {
        "radius": "10px"
      },
      "control": {
        "height": "44px"
      },
      "card": {
        "radius": "16px"
      }
    },
    "space": {
      "1": "4px",
      "2": "8px",
      "3": "12px",
      "4": "16px",
      "6": "24px",
      "8": "32px"
    }
  },
  "orchid": {
    "font": [
      "Inter Variable",
      "system-ui",
      "-apple-system",
      "Segoe UI",
      "Roboto",
      "sans-serif"
    ],
    "radius": "14px",
    "color": {
      "bg": {
        "light": "#ffffff",
        "dark": "#110e17"
      },
      "surface": {
        "light": "#f8f6fb",
        "dark": "#1c1724"
      },
      "text": {
        "light": "#1a1523",
        "dark": "#f2eef8"
      },
      "text-muted": {
        "light": "#585067",
        "dark": "#bdb4cc"
      },
      "border": {
        "light": "#8c849b",
        "dark": "#6f6782"
      },
      "primary": {
        "light": "#6a1fb0",
        "dark": "#c9a7f5"
      },
      "primary-hover": {
        "light": "#551a8f",
        "dark": "#dcc5fa"
      },
      "on-primary": {
        "light": "#ffffff",
        "dark": "#1d0b33"
      },
      "accent": {
        "light": "#c0267a",
        "dark": "#f472b6"
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
        "light": "#0f766e",
        "dark": "#5eead4"
      },
      "backdrop": {
        "light": "rgb(10 14 22 / 0.55)",
        "dark": "rgb(10 14 22 / 0.55)"
      }
    },
    "component": {
      "button": {
        "radius": "999px"
      },
      "control": {
        "height": "48px"
      },
      "card": {
        "radius": "20px"
      }
    },
    "space": {
      "1": "4px",
      "2": "8px",
      "3": "12px",
      "4": "16px",
      "6": "24px",
      "8": "32px"
    }
  }
} as const;

export type Brand = keyof typeof brandTokens;
export const brands = Object.keys(brandTokens) as Brand[];

/** Tokens of the default brand (civic). */
export const tokens = brandTokens.civic;
export type Tokens = typeof tokens;

/** Contrast of every required pair, per brand and mode, as measured at build time. */
export const contrastReport = [{"brand":"civic","mode":"light","pair":"text on bg","ratio":17.92,"min":4.5,"pass":true},{"brand":"civic","mode":"light","pair":"text on surface","ratio":16.71,"min":4.5,"pass":true},{"brand":"civic","mode":"light","pair":"text-muted on bg","ratio":7.93,"min":4.5,"pass":true},{"brand":"civic","mode":"light","pair":"text-muted on surface","ratio":7.4,"min":4.5,"pass":true},{"brand":"civic","mode":"light","pair":"primary on bg","ratio":6.67,"min":4.5,"pass":true},{"brand":"civic","mode":"light","pair":"primary on surface","ratio":6.22,"min":4.5,"pass":true},{"brand":"civic","mode":"light","pair":"on-primary on primary","ratio":6.67,"min":4.5,"pass":true},{"brand":"civic","mode":"light","pair":"on-primary on primary-hover","ratio":8.87,"min":4.5,"pass":true},{"brand":"civic","mode":"light","pair":"danger on bg","ratio":6.57,"min":4.5,"pass":true},{"brand":"civic","mode":"light","pair":"danger on surface","ratio":6.13,"min":4.5,"pass":true},{"brand":"civic","mode":"light","pair":"on-danger on danger","ratio":6.57,"min":4.5,"pass":true},{"brand":"civic","mode":"light","pair":"success on bg","ratio":5.08,"min":4.5,"pass":true},{"brand":"civic","mode":"light","pair":"warning on bg","ratio":4.87,"min":4.5,"pass":true},{"brand":"civic","mode":"light","pair":"accent on bg","ratio":5.47,"min":3,"pass":true},{"brand":"civic","mode":"light","pair":"border on bg","ratio":3.19,"min":3,"pass":true},{"brand":"civic","mode":"light","pair":"focus on bg","ratio":5.02,"min":3,"pass":true},{"brand":"civic","mode":"light","pair":"focus on surface","ratio":4.68,"min":3,"pass":true},{"brand":"civic","mode":"dark","pair":"text on bg","ratio":16.01,"min":4.5,"pass":true},{"brand":"civic","mode":"dark","pair":"text on surface","ratio":14.44,"min":4.5,"pass":true},{"brand":"civic","mode":"dark","pair":"text-muted on bg","ratio":9.28,"min":4.5,"pass":true},{"brand":"civic","mode":"dark","pair":"text-muted on surface","ratio":8.37,"min":4.5,"pass":true},{"brand":"civic","mode":"dark","pair":"primary on bg","ratio":8.7,"min":4.5,"pass":true},{"brand":"civic","mode":"dark","pair":"primary on surface","ratio":7.85,"min":4.5,"pass":true},{"brand":"civic","mode":"dark","pair":"on-primary on primary","ratio":8.66,"min":4.5,"pass":true},{"brand":"civic","mode":"dark","pair":"on-primary on primary-hover","ratio":10.94,"min":4.5,"pass":true},{"brand":"civic","mode":"dark","pair":"danger on bg","ratio":7.97,"min":4.5,"pass":true},{"brand":"civic","mode":"dark","pair":"danger on surface","ratio":7.19,"min":4.5,"pass":true},{"brand":"civic","mode":"dark","pair":"on-danger on danger","ratio":8.04,"min":4.5,"pass":true},{"brand":"civic","mode":"dark","pair":"success on bg","ratio":10.78,"min":4.5,"pass":true},{"brand":"civic","mode":"dark","pair":"warning on bg","ratio":10.02,"min":4.5,"pass":true},{"brand":"civic","mode":"dark","pair":"accent on bg","ratio":12.35,"min":3,"pass":true},{"brand":"civic","mode":"dark","pair":"border on bg","ratio":3.84,"min":3,"pass":true},{"brand":"civic","mode":"dark","pair":"focus on bg","ratio":8.95,"min":3,"pass":true},{"brand":"civic","mode":"dark","pair":"focus on surface","ratio":8.07,"min":3,"pass":true},{"brand":"orchid","mode":"light","pair":"text on bg","ratio":17.87,"min":4.5,"pass":true},{"brand":"orchid","mode":"light","pair":"text on surface","ratio":16.65,"min":4.5,"pass":true},{"brand":"orchid","mode":"light","pair":"text-muted on bg","ratio":7.61,"min":4.5,"pass":true},{"brand":"orchid","mode":"light","pair":"text-muted on surface","ratio":7.09,"min":4.5,"pass":true},{"brand":"orchid","mode":"light","pair":"primary on bg","ratio":8.62,"min":4.5,"pass":true},{"brand":"orchid","mode":"light","pair":"primary on surface","ratio":8.03,"min":4.5,"pass":true},{"brand":"orchid","mode":"light","pair":"on-primary on primary","ratio":8.62,"min":4.5,"pass":true},{"brand":"orchid","mode":"light","pair":"on-primary on primary-hover","ratio":10.88,"min":4.5,"pass":true},{"brand":"orchid","mode":"light","pair":"danger on bg","ratio":6.57,"min":4.5,"pass":true},{"brand":"orchid","mode":"light","pair":"danger on surface","ratio":6.13,"min":4.5,"pass":true},{"brand":"orchid","mode":"light","pair":"on-danger on danger","ratio":6.57,"min":4.5,"pass":true},{"brand":"orchid","mode":"light","pair":"success on bg","ratio":5.08,"min":4.5,"pass":true},{"brand":"orchid","mode":"light","pair":"warning on bg","ratio":4.87,"min":4.5,"pass":true},{"brand":"orchid","mode":"light","pair":"accent on bg","ratio":5.53,"min":3,"pass":true},{"brand":"orchid","mode":"light","pair":"border on bg","ratio":3.57,"min":3,"pass":true},{"brand":"orchid","mode":"light","pair":"focus on bg","ratio":5.47,"min":3,"pass":true},{"brand":"orchid","mode":"light","pair":"focus on surface","ratio":5.1,"min":3,"pass":true},{"brand":"orchid","mode":"dark","pair":"text on bg","ratio":16.71,"min":4.5,"pass":true},{"brand":"orchid","mode":"dark","pair":"text on surface","ratio":15.33,"min":4.5,"pass":true},{"brand":"orchid","mode":"dark","pair":"text-muted on bg","ratio":9.61,"min":4.5,"pass":true},{"brand":"orchid","mode":"dark","pair":"text-muted on surface","ratio":8.82,"min":4.5,"pass":true},{"brand":"orchid","mode":"dark","pair":"primary on bg","ratio":9.4,"min":4.5,"pass":true},{"brand":"orchid","mode":"dark","pair":"primary on surface","ratio":8.63,"min":4.5,"pass":true},{"brand":"orchid","mode":"dark","pair":"on-primary on primary","ratio":9,"min":4.5,"pass":true},{"brand":"orchid","mode":"dark","pair":"on-primary on primary-hover","ratio":11.68,"min":4.5,"pass":true},{"brand":"orchid","mode":"dark","pair":"danger on bg","ratio":8.34,"min":4.5,"pass":true},{"brand":"orchid","mode":"dark","pair":"danger on surface","ratio":7.66,"min":4.5,"pass":true},{"brand":"orchid","mode":"dark","pair":"on-danger on danger","ratio":8.04,"min":4.5,"pass":true},{"brand":"orchid","mode":"dark","pair":"success on bg","ratio":11.27,"min":4.5,"pass":true},{"brand":"orchid","mode":"dark","pair":"warning on bg","ratio":10.48,"min":4.5,"pass":true},{"brand":"orchid","mode":"dark","pair":"accent on bg","ratio":7.21,"min":3,"pass":true},{"brand":"orchid","mode":"dark","pair":"border on bg","ratio":3.58,"min":3,"pass":true},{"brand":"orchid","mode":"dark","pair":"focus on bg","ratio":12.92,"min":3,"pass":true},{"brand":"orchid","mode":"dark","pair":"focus on surface","ratio":11.86,"min":3,"pass":true}] as const;
