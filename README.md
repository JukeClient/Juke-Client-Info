# Juke Client website

Static, dependency-free landing site for Juke Client. It lives in `site/`; the desktop app build does not depend on it. Canonical home once published: `https://dolome.github.io/Juke-Client-Info/`. Until that URL actually serves the site, the canonical tags, `og:url`, `og:image`, sitemap and social links point to an empty URL.

## Preview locally

From the repository root:

```sh
cd site
py -m http.server 8000
```

Then open `http://localhost:8000/index.html`. Opening `file:///.../site/index.html` directly also works: all internal links point at explicit `index.html`/page filenames, not `./`, because Chromium does not auto-serve an index file from a `file://` directory URL — `file:///.../site/` shows a dark directory listing instead. A HTTP server is still recommended: the browser blocks the web manifest from `file://` with a harmless CORS warning, and `localStorage` may be disabled in some browsers. To check `404.html`, serve the folder under the `/Juke-Client-Info/` base path (its asset URLs are absolute) or inspect it on the deployed site.

The only browser storage used by the site is the theme choice. There are no cookies, analytics or runtime network requests. The header has a visible **Light / Dark** select with no `System` option: with no saved choice the site still follows `prefers-color-scheme`, and the select shows the resolved theme. Any explicit choice is persisted in `localStorage` and synced across tabs. Pressing `S` anywhere outside a text field returns to the system preference; a polite live region announces which theme was resolved. `theme-init.js` — a blocking script in `<head>` after `styles.css` — applies the saved choice before the first paint, so there is no light-theme flash for a saved dark theme. The `<meta name="theme-color">` element has no hardcoded `content`; both JS files read `--theme-color-light` / `--theme-color-dark` from `styles.css`, so the palette is defined once.

## Publish with GitHub Pages

The canonical site is served from the **public** `dolome/Juke-Client-Info` repository, not from the private app repository. Pages from a private repository requires a paid GitHub plan (Pro, Team or Enterprise); a public project repository works on the free plan.

Branch deployment cannot serve `site/` from a separate folder; **Deploy from a branch** only offers `/` and `/docs`. Use GitHub Actions:

1. Copy the contents of this `site/` directory to the root of `dolome/Juke-Client-Info`.
2. Copy `.github/workflows/pages.yml` to `Juke-Client-Info/.github/workflows/pages.yml`.
3. In the Info repository settings, open **Pages → Build and deployment → Source** and select **GitHub Actions**.
4. Push to `main` there (or run the workflow manually). The workflow uploads the site files as the Pages artifact and deploys them.

There is no npm install, build step or bundler. `.github/workflows/pages.yml` in this private `Juke-Client` repository deploys that repository's own `/Juke-Client/` Pages site; it is **not** the canonical deployment and can be deleted once Info is live.

Do not share the canonical URL or submit `sitemap.xml` until `https://dolome.github.io/Juke-Client-Info/` actually loads. Until then, the metadata and community links resolve to an empty address.

## Security and privacy

- All five HTML files declare a strict Content Security Policy. Only same-origin CSS, JavaScript, images and the web manifest are allowed. There are no external fonts, scripts, styles, frames, forms, analytics or trackers.
- There are no inline scripts and no CSP hashes. `theme-init.js` is a same-origin file loaded synchronously in `<head>`; the FAQ is plain HTML, not JSON-LD.
- `assets/social/` contains optional SVG source files for the service marks. The site inlines the marks and does not load those files; they are kept as editable sources only.
- Every external link uses `target="_blank"` with `rel="noopener noreferrer"` and an accessible new-tab notice. Discord, Telegram and Reddit are managed by third parties; check those links periodically for expiry or account changes. `.github/workflows/links.yml` runs Lychee weekly to catch broken policy and community links. The same workflow runs `.github/scripts/check_privacy_hosts.py`, which extracts hosts from the Rust request URLs, download allowlists and updater config and fails if any of them is missing from the `<code>` spans in `privacy.html`. Update the Privacy table in the same commit when an allowlist changes.
- Directives that only work as HTTP response headers (`frame-ancestors`, `X-Frame-Options`, `report-uri`) are intentionally omitted. GitHub Pages cannot send custom headers, and their meta-tag forms are ignored by browsers.
- `connect-src 'self'` is kept because Lighthouse requests `/robots.txt` from the origin root. With `connect-src 'none'` that request is blocked and the SEO audit can report a failure, even though the site itself makes no fetch calls. A 404 response for that root request is harmless; only the blocked request is a problem.
- `robots.txt`, `sitemap.xml`, `404.html`, canonical URLs and Open Graph/Twitter metadata are included. On a github.io project subpath crawlers and Lighthouse read `https://dolome.github.io/robots.txt`, not `/Juke-Client-Info/robots.txt`, so the project copy is informational only; it starts with a comment saying so. A `Sitemap:` line there would be read from the wrong root and would not work. Submit `https://dolome.github.io/Juke-Client-Info/sitemap.xml` manually **only after the site loads**, in **Google Search Console** and **Bing Webmaster Tools**.
- `404.html` uses absolute `/Juke-Client-Info/...` URLs for every asset and link, because GitHub Pages serves it for missing paths at any nesting level. `<base>` is not used because the CSP sets `base-uri 'none'`. When moving to a custom domain, update the deployment base in one place — search for the literal `/Juke-Client-Info/` in `404.html` and for `dolome.github.io/Juke-Client-Info` in `sitemap.xml`, `index.html`, `privacy.html`, `terms.html`, `changelog.html` and this README.
- The web manifest uses `display: browser` and provides separate maskable icons. It does not promise an installable offline app.

## Content and product status

- Platform wording is deliberately cautious: the site describes a Windows-first launch, with macOS and Linux listed as planned. Keep the title, description, Open Graph tags, intro, download button and Requirements section consistent if that changes.
- Juke Client is proprietary. The `dolome/Juke-Client` repository is private; `dolome/Juke-Client-Info` contains project information only, and `dolome/Juke-Client-Releases` contains release assets only. The FAQ says this directly instead of offering a misleading Source link.
- The download button is intentionally disabled with `aria-disabled="true"` and a visible “In development” note. When public builds exist, replace that single button with a real link to `https://github.com/dolome/Juke-Client-Releases/releases/latest`, update the note with the available platform, and keep the one-CTA layout.
- The site does not duplicate the launcher version number. `changelog.html` is intentionally empty until the first public release; when entries are added, date each one there. Launcher version files (`package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`) belong to the app part of the same private repository, outside `site/`, and are not duplicated on the site.
- The “Built for speed” card claims up to ten times faster than the most popular launchers. It is a marketing claim without bundled benchmark data; keep evidence for the comparison before publishing, or soften the wording.
- The bundled screenshot comes from a development build and shows an older Minecraft version. Its `alt` text is version-neutral on purpose; replace all light/dark PNG, WebP and AVIF variants together when capturing a current screenshot.
- Update installers are signed with a Juke Client minisign key. The installer itself has no Authenticode certificate yet, so the FAQ explains possible SmartScreen warnings.
- The operator is published as the `dolome` account on the Privacy and Terms pages. Privacy requests go to the project alias **JukeClient@proton.me**, which is also published on both pages; the personal address is deliberately not published. Verify that the alias mailbox exists before publishing. If an Impressum or a named legal entity and address are required for your publishing location, a nickname alone is unlikely to be enough — obtain a legal review before the public release. This README is not legal advice.
- The footer uses the current trademark line, “"Minecraft" is a trademark of Mojang Synergies AB”, together with the recommended NOT AN OFFICIAL MINECRAFT PRODUCT disclaimer. The site deliberately makes no claim of “compliance with the Minecraft Usage Guidelines”; review the guidelines and your product yourself before making such a claim.

## Files

- `index.html` — landing page with features, details, FAQ, community rail and strict metadata.
- `privacy.html` — technical privacy disclosure for the launcher and this website.
- `terms.html` — short licence, acceptable-use rules and disclaimers; deliberately no subscription, virtual-currency, UGC or arbitration clauses, because the project has none of those features.
- `changelog.html` — empty changelog page; add dated entries after the first public release.
- `404.html` — branded not-found page with absolute asset paths.
- `styles.css` — the launcher's graphite/wood/brass palette and component language (buttons, cards, chips, tables, FAQ rows), with accessible contrast in both themes, print rules and reduced-motion support.
- `theme-init.js` — pre-paint theme bootstrap, shared by all five pages.
- `script.js` — theme toggling, system preference and cross-tab handling, mobile menu, drag/scroll rail controls, FAQ print handling and screenshot swapping.
- `site.webmanifest`, `assets/favicon.ico`, `assets/apple-touch-icon.png` — browser metadata and shortcut icons.
- `assets/juke-icon.png` — source icon; `assets/icon-192.png`, `assets/icon-512.png` and their `-maskable` variants are manifest sizes.
- `assets/app-screenshot*.{png,webp,avif}` — light and dark launcher screenshots in 700px and 1400px variants.
- `assets/social-preview.png` — Open Graph/Twitter card image.
- `robots.txt`, `sitemap.xml` — crawler metadata; the sitemap must be submitted manually.
- `../.github/workflows/pages.yml` — GitHub Pages deployment workflow.
- `../.github/workflows/links.yml` — scheduled/check-on-push link and Privacy-host checker.
- `../.github/scripts/check_privacy_hosts.py` — host-sync check used by that workflow.

There are no runtime dependencies or build steps for the site.
