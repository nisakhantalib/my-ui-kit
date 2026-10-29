# @nisakhantalib/my-ui-kit-elements

My UI Kit as framework-free **Web Components**, for teams on Angular, Vue or server-rendered pages. Same components, same accessibility, same tokens and brands. Only the API changes: HTML attributes in, DOM events out.

```html
<html lang="en-SG" data-currency="SGD" data-brand="orchid">
  <link rel="stylesheet" href="https://unpkg.com/@nisakhantalib/my-ui-kit-elements/dist/kit-elements.css" />
  <script type="module" src="https://unpkg.com/@nisakhantalib/my-ui-kit-elements"></script>

  <kit-amount-input label="Amount" hint="Daily limit SGD 5,000" required></kit-amount-input>
  <script type="module">
    document.querySelector('kit-amount-input').addEventListener('kit-change', (e) => console.log(e.detail.value));
  </script>
</html>
```

| Element | Attributes | Events (`detail.value`) |
|---|---|---|
| `<kit-button>` | `variant` `size` `loading` `disabled` `type` `track-id`, text = label | native `click` |
| `<kit-text-field>` | `label` `hint` `error` `name` `type` `autocomplete` `required` | native `input` |
| `<kit-amount-input>` | `label` `hint` `error` `currency` `required` | `kit-change`: minor units or `null` |
| `<kit-otp-input>` | `label` `hint` `error` `length` `resend-after` | `kit-complete`: the code; `kit-resend` |
| `<kit-switch>` | `label` `description` `checked` | `kit-change`: boolean |
| `<kit-alert>` | `tone` `heading`, text = message | |
| `<kit-badge>` | `tone`, text = label | |
| `<kit-masked-value>` | `value` `label` `visible` | |

- **Locale and currency** come from the nearest `lang` and `data-currency` attributes, so a page (or one section) is set once.
- **Light DOM**, not shadow DOM: the kit stylesheet, brands (`data-brand`) and dark mode (`data-theme`) apply exactly as in React, and labels and descriptions work with the page's assistive technology.
- React is bundled (about 84 kB gzip), so the page needs nothing else. React apps should use `@nisakhantalib/my-ui-kit` directly.

**Angular:** add `CUSTOM_ELEMENTS_SCHEMA` to the component, then `<kit-amount-input (kit-change)="amount = $event.detail.value">`.
**Vue:** `<kit-amount-input @kit-change="(e) => (amount = e.detail.value)" />`, with `compilerOptions.isCustomElement: (t) => t.startsWith('kit-')`.

A live demo is at `/elements/` on the project site.
