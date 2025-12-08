import nextTypescript from "eslint-config-next/typescript";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  ...nextTypescript,
  ...nextCoreWebVitals,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "functions/lib/**",        // コンパイル済みファイルのみ除外
      "functions/node_modules/**" // functions配下のnode_modules
    ]
  },
  {
    // scripts/とfunctions/src/のJavaScript/TypeScriptファイルはCommonJSを許可
    files: ["scripts/**/*.js", "functions/src/**/*.{js,ts}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  },
  {
    // _で始まる変数は未使用でも許可（意図的に未使用であることを明示）
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ]
    }
  }
];

export default eslintConfig;
