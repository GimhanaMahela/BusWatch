import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const unusedVars = [
  "error",
  { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
];

export default tseslint.config(
  { ignores: ["**/dist", "**/coverage", "ui/.next", "ui/next-env.d.ts"] },
  js.configs.recommended,

  // --- API: Node, type-aware rules ---
  {
    files: ["api/**/*.ts"],
    extends: [...tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: globals.node,
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": unusedVars,
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    // Supertest response bodies are untyped JSON; asserting on them is the point of the tests
    files: ["api/tests/**/*.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
    },
  },

  // --- UI: Next.js, React ---
  {
    files: ["ui/**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { "@next/next": nextPlugin },
    settings: { next: { rootDir: "ui/" } },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "@typescript-eslint/no-unused-vars": unusedVars,
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },

  // --- Service worker (plain JS served from ui/public) ---
  { files: ["ui/public/sw.js"], languageOptions: { globals: globals.serviceworker } },

  // --- Root config files ---
  { files: ["*.{js,ts}"], languageOptions: { globals: globals.node } },
  prettier,
);
