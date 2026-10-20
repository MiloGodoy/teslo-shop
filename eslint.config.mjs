import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
export default defineConfig([
  ...nextVitals,
  // Hydration effects wait for Zustand's browser-only persisted state.
  { rules: { 'react-hooks/set-state-in-effect': 'off' } },
  globalIgnores(['.next/**', 'node_modules/**', 'next-env.d.ts', 'src/seed/seed.js']),
]);
