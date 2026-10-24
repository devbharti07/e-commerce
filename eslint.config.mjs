import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Disable overly aggressive React 19 canary rules in eslint-config-next
for (const conf of nextVitals) {
  if (conf.rules) {
    if (conf.rules["react-hooks/set-state-in-effect"]) {
      conf.rules["react-hooks/set-state-in-effect"] = "off";
    }
    if (conf.rules["react-hooks/purity"]) {
      conf.rules["react-hooks/purity"] = "off";
    }
  }
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "tests/**",
    "scripts/**",
    "scratch/**",
    ".agents/**",
  ]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
