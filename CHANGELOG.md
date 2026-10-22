# Changelog

All notable changes to this project. Versions follow [semver](https://semver.org/).

## [1.4.1] - 2026-10-22

A security update: the container now runs Node.js 22. Update the image tag to `1.4.1`; nothing else changes.

### Security
- Runtime moved from Node.js 20 (end of life, no fix available) to Node.js 22.23.4, for the October 21, 2026 Node.js security release: CVE-2026-111497 (High, Brotli decoder remote code execution), CVE-2026-105482 (High, DNS name truncation), CVE-2026-105483 and CVE-2026-106069 (High, TLS hostname verification bypasses), plus six Medium/Low fixes.
- Releases are now published only from version tags on `main` that passed CI; each image is scanned before it is tagged and carries signed build provenance. Pushes to `main` no longer publish `:latest`, `:main` or `:sha-*` images.

### Fixed
- A request path containing a NUL byte (`/%00`) returned a server error (500); it now returns 400.

### Added
- The header links to the GitHub repo and to these release notes.
- README: a compose quickstart for the published image and a Security architecture section.
