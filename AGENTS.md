# Project guidance

- Work in this cloud repository. Keep implementation on a feature branch; do not push, publish, merge, or deploy without an explicit request.
- This is a Korean fictional pet-service demo. All identities, prices, services and bookings are examples. Never add real personal data, secrets, payment processing, external API calls or misleading claims of server authentication.
- Use React + strict TypeScript. Keep domain validation and versioned local persistence in `src/model.ts`; UI in `src/main.tsx`; responsive styles in `src/style.css`.
- Preserve demo-account isolation, browser-only storage disclosure, storage failure feedback, keyboard-accessible dialogs, and mobile layouts.
- Before handoff run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run test:e2e` when Chromium is available. Report blocked checks honestly.
- Use `npm install --cache /tmp/pawday-npm-cache` if the environment's default cache is unavailable. Keep generated files, browser downloads and logs out of git.
