# Security policy

## Reporting a vulnerability

Please **do not open a public issue**. Report privately through
[GitHub security advisories](https://github.com/nisakhantalib/my-ui-kit/security/advisories/new).
You will get a reply within 5 working days, and a fix or mitigation plan within 30 days for confirmed issues.

## Supported versions

The latest minor release gets security fixes.

## How the supply chain is protected

- Releases are published from GitHub Actions with **npm trusted publishing (OIDC)**: no long-lived npm token exists to leak.
- Every release carries an **npm provenance attestation** linking the tarball to the exact commit and workflow run. Check with `npm audit signatures`.
- The library has **zero runtime dependencies**; React is a peer dependency.
- Dependabot opens grouped update PRs weekly, and CI must pass before they merge.

## Privacy in the reference app

The demo app stores only a masked NRIC (`*****567D`) and never sends form data anywhere. Analytics adapters do nothing until the user consents.
