# Security policy

## Reporting a vulnerability

Please **do not open a public issue**. Report privately through
[GitHub security advisories](https://github.com/nisakhantalib/my-ui-kit/security/advisories/new).
You will get a reply within 5 working days, and a fix or mitigation plan within 30 days for confirmed issues.

## Supported versions

The latest minor release gets security fixes.

## How the supply chain is protected

- Releases are built and tagged only by GitHub Actions, from `main`, after lint and tests pass. Each GitHub release carries the exact package tarball and a **CycloneDX SBOM**.
- No registry token is stored in the repository or its secrets.
- The library has **zero runtime dependencies**; React is a peer dependency.
- Dependabot opens grouped update PRs weekly, and CI must pass before they merge.

## Privacy in the reference app

The demo app stores only a masked NRIC (`*****567D`) and never sends form data anywhere. Analytics adapters do nothing until the user consents.
