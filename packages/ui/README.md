# @nisakhantalib/my-ui-kit

Accessible, composable React components (WCAG 2.2 AA, light and dark) with design tokens and pluggable analytics (Adobe Analytics AppMeasurement, AEP Web SDK, Adobe Client Data Layer).

```bash
npm install @nisakhantalib/my-ui-kit
```

```tsx
import { Button, TextField } from '@nisakhantalib/my-ui-kit';
import '@nisakhantalib/my-ui-kit/styles.css';

<TextField label="Email" hint="We send the receipt here" error={error} required />
<Button>Continue</Button>
```

- **Components:** Button, TextField, Select, Checkbox, RadioGroup, Switch, Tabs, Accordion, Dialog, Alert, ErrorSummary, Toast, Announcer, SkipLink, VisuallyHidden
- **ESM, tree-shakeable** (one file per module; `Button` alone is about 0.4 kB brotli), `'use client'` where needed for React Server Components
- **Tokens** as CSS custom properties, typed `tokens` / `brandTokens` exports, and the source JSON at `@nisakhantalib/my-ui-kit/tokens/*`
- **Theming:** follows `prefers-color-scheme`, or set `<html data-theme="dark">`
- Styles live in `@layer kit`, so your CSS overrides them without `!important`
- React 18 or 19; Node 20.19+ for tooling

Docs, Storybook, accessibility notes and the reference app: <https://github.com/nisakhantalib/my-ui-kit>

MIT licensed. Published with npm provenance.
