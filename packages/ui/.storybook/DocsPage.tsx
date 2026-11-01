import { Controls, Description, Primary, Stories, Subtitle, Title } from '@storybook/addon-docs/blocks';

/**
 * One template for every component page (the pattern Carbon, Polaris and Primer follow): what it
 * is and its status, a live example, the props, then every variant. Accessibility results are in
 * the panel below each story.
 */
export function DocsPage() {
  return (
    <>
      <Title />
      <ul className="kit-doc-status" aria-label="Status">
        <li data-tone="stable">Stable</li>
        <li>WCAG 2.2 AA</li>
        <li>3 brands · light and dark</li>
        <li>Tested in Chromium</li>
      </ul>
      <Subtitle />
      <Description />
      <Primary />
      <h2 className="kit-doc-h2">Props</h2>
      <Controls />
      <Stories title="Examples" />
    </>
  );
}
