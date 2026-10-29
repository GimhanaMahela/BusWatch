import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const unusedVars = [
  "error",
  { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
];

export default tseslint.config(
  { ignores: ["**/dist", "**/coverage"] },
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

  // --- UI: browser, React ---
  {
    files: ["ui/**/*.{ts,tsx}"],
    extends: [...tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
    plugins: { "react-refresh": reactRefresh },
    rules: {
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": unusedVars,
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },

  // --- Root config files ---
  { files: ["*.{js,ts}"], languageOptions: { globals: globals.node } },
  prettier,
);
