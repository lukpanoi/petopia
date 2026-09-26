# Quality review — 26 September 2026

## Acceptance criteria

1. Matching uses all four answers, stays within 0–100, orders recommendations and explains the same score everywhere.
2. Thai and English queries find equivalent pet records; filtering, no-results and reset states remain usable.
3. Verification status agrees across listings and details. Sample claims are identified as demonstration content.
4. Adoption drafts can be reviewed, edited, saved and reopened after a reload with every requested field preserved.
5. Dialogs have labels, receive focus, contain keyboard navigation, close on Escape and return focus. Mobile navigation fits the viewport and offers logout.
6. Demo entry does not request real credentials or IDs; policy controls open readable information. User text renders as text.

## Automated checks

`node --test tests/core.test.cjs` verifies changed rankings for contrasting lifestyles, every one of 256 answer combinations for six pet profiles (1,536 score calculations), bilingual search aliases, application field persistence/validation, HTML escaping and booking date order/calendar validity.

## Browser checks

Checked locally in the Codex browser using desktop and mobile viewport sizes:

- Four-step quiz, answer validation, score ordering, consistent Mochi score in card and banner.
- Whiskers remains pending verification in all detail badges.
- Demo session entry and return to requested pet; no credential entry.
- Application review/save/reload/detail preserves sample home, two existing pets, THB 2,400 budget and care plan.
- Search for เชียงใหม่ finds both sample cats; translated breed and city labels display.
- Escape closes the dialog and restores the opener; keyboard focus stays in dialogs.
- Mobile menu has no horizontal overflow, including Thai labels, and exposes logout.
- Hotel rejects reversed dates and saves checkout date plus notes.
- Community text containing HTML tags remains literal text.
- Add-to-cart and demo checkout produce an order in Profile.

These checks do not certify real-device Safari/Android behavior, real shelter operations, payments, or production security. The site remains an explicitly labelled demo.
