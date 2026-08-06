import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
  ]),
  // Ship/component images are remote URLs served from third-party wikis.
  // next/image would require per-host remotePatterns; keep plain <img>.
  {
    files: ["src/**/*.tsx"],
    rules: {
      "@next/next/no-img-element": "off",
    },
  },
  // Data layer: SQLite rows, external API JSON and DB helper scripts use
  // dynamic types where `any` is intentional (row shapes come from better-sqlite3
  // and the remote APIs). Keep all other rules active.
  {
    files: [
      "scripts/**/*.ts",
      "src/lib/db/**/*.ts",
      "src/app/api/**/*.ts",
      "src/types/better-sqlite3.d.ts",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
  // External scraping clients: responses are untyped JSON from remote APIs.
  {
    files: ["src/lib/api/starCitizenWiki.ts", "src/lib/api/uexCorp.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
]);

export default eslintConfig;
