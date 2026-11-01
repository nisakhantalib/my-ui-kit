// One site for Cloudflare: Orchid Bank at the root, the component library's Storybook at /storybook/.
// Run by `npm run build:site` (after both builds); `wrangler deploy` serves ./site (wrangler.jsonc).
import { cpSync, existsSync, rmSync } from 'node:fs';

const out = new URL('../site/', import.meta.url);
rmSync(out, { recursive: true, force: true });
cpSync(new URL('../apps/bank/dist/', import.meta.url), out, { recursive: true });
const storybook = new URL('../packages/ui/storybook-static/', import.meta.url);
if (existsSync(storybook)) cpSync(storybook, new URL('storybook/', out), { recursive: true });
console.log('Assembled site/ (bank + storybook)');
