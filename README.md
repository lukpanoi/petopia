# Petopia

Petopia is a bilingual, interactive **demonstration** of pet adoption and care services. It runs as a static site on GitHub Pages. Pets, photos, verification badges, stories and transactions are illustrative; no shelter receives requests and no real payments are processed.

## Run and test

Serve this directory with any static HTTP server and open `index.html`. `app.html` is retained as a compatibility redirect. No build step or package installation is required.

```sh
python -m http.server 8765 --bind 127.0.0.1
node --test tests/core.test.cjs
```

## Structure

- `index.html`: page structure, accessible notices and policy entry points.
- `app.js`: sample content, Thai translations, service and community interactions.
- `core.js`: pure matching, bilingual search, validation and escaping rules.
- `quality.js`: navigation, matching explanations, application review, demo profiles and accessible dialogs.
- `styles.css`, `quality.css`, `mobile-fix.css`, `mobile-fix.js`: presentation and mobile navigation.

Scripts load in order: core, quality, app, mobile navigation. The page loads directly without a fetch/document.write loader. Asset version strings in `index.html` must be bumped when deploying changed scripts or styles.

## Matching

Each completed quiz produces a deterministic score using sample pet profiles: living space 25%, activity 30%, available time 25%, personality 20%. Recommendations are sorted by score. The card and hero use the same calculation, and each card explains its score. Scores are lifestyle illustrations, not clinical assessments or guarantees.

## Data and limitations

The public demo does not collect passwords or government identifiers and has no real authentication or backend. A single demo profile and demo records use namespaced session storage in the current tab, with an in-memory fallback if storage is unavailable. A browser may restore a closed session. Legacy localStorage records are not read or migrated by this version.

Applications preserve the reviewed nickname, living space, existing pet count, optional sample care budget and care plan; the saved record can be reopened from Profile. Hotel bookings preserve start/end dates and notes. User-authored community and chat content is escaped before display.

Images are loaded from Unsplash. Real production use requires a separately designed backend, server-side authentication and authorization, validated shelter identities, data retention controls and operational privacy/security review.

See `QA.md` for the regression checklist and tested scope.
