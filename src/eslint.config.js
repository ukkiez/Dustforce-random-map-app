import {defineConfig} from "eslint/config";

import globals from "globals";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    plugins: {
      "@stylistic": stylistic,
    },
    extends: [],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.browser
      },
    },
    rules: {
      "consistent-return": [2, {"treatUndefinedAsUnspecified": false}],
      "no-else-return"   : 1,
      "semi"             : [1, "always"],
      "space-unary-ops"  : 2,
      "no-unused-vars"   : 1,

      "@stylistic/array-bracket-spacing": ["error", "never"],
      "@stylistic/object-curly-spacing": ["error", "never"],
      "@stylistic/space-in-parens": ["error", "never"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/padded-blocks": ["error", "never"],
    }
  },

  {
    ignores: [
      "app/bundle/*",
    ]
  }
]);
