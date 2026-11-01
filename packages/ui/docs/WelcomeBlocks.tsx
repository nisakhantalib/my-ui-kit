import type { ReactNode } from 'react';
import { Guilloche } from '../src/components/Guilloche.js';

/** Building blocks for the Storybook welcome page (docs/Introduction.mdx). */

export function WelcomeHero({ children }: { children: ReactNode }) {
  return (
    <div className="kit-welcome-hero">
      <Guilloche color="var(--kit-brand-accent)" accentColor="#c8a25a" />
      {children}
    </div>
  );
}

/** Links styled as the hero's buttons. Written as a component: MDX would wrap their text in <p>. */
export function WelcomeActions({ items }: { items: [label: string, href: string][] }) {
  return (
    <div className="kit-welcome-actions">
      {items.map(([label, href]) => (
        <a key={href} href={href} target="_top">
          {label}
        </a>
      ))}
    </div>
  );
}

export function WelcomeStats({ items }: { items: [value: string, label: string][] }) {
  return (
    <dl className="kit-welcome-stats">
      {items.map(([value, label]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Cards that open a docs page in the Storybook manager (target _top leaves the preview iframe). */
export function WelcomeCards({ items }: { items: { title: string; body: string; story: string }[] }) {
  return (
    <ul className="kit-welcome-cards">
      {items.map((item) => (
        <li key={item.story}>
          <a href={`./?path=/docs/${item.story}`} target="_top">
            <strong>{item.title}</strong>
            <span>{item.body}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
