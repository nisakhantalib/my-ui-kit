import { create } from 'storybook/theming';

/**
 * Storybook's own chrome, in the design system's identity: light and neutral (the components are
 * the content), the brand mark, treasury green for selection and focus, the kit's typefaces.
 * Shared by the manager (sidebar, toolbar) and the docs pages, so both read as one product.
 * Values mirror the Orchid tokens (packages/ui/tokens/brands/orchid.json).
 */
export const theme = create({
  base: 'light',
  brandTitle:
    '<span style="display:flex;align-items:center;gap:10px;font:700 15px/1 Archivo,system-ui;font-stretch:115%;letter-spacing:-0.01em;color:#0e1a24"><img src="logo.svg" width="28" height="28" alt="" style="border-radius:8px" />My UI Kit</span>',
  brandUrl: './',
  brandTarget: '_self',

  colorPrimary: '#0b3d36',
  colorSecondary: '#087a66',

  appBg: '#f4f6f4',
  appContentBg: '#ffffff',
  appPreviewBg: '#ffffff',
  appBorderColor: '#dde3df',
  appBorderRadius: 12,

  textColor: '#0e1a24',
  textMutedColor: '#56616b',
  textInverseColor: '#ffffff',

  barBg: '#ffffff',
  barTextColor: '#44515c',
  barSelectedColor: '#087a66',
  barHoverColor: '#0b3d36',

  inputBg: '#ffffff',
  inputBorder: '#c9d1cc',
  inputTextColor: '#0e1a24',
  inputBorderRadius: 10,

  buttonBg: '#ffffff',
  buttonBorder: '#c9d1cc',
  booleanBg: '#eef1ee',
  booleanSelectedBg: '#ffffff',

  fontBase: '"Hanken Grotesk Variable", "Hanken Grotesk", system-ui, sans-serif',
  fontCode: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
});
