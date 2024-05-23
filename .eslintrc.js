module.exports = {
  env: {
    browser: true, // if using React with browser environment
    es2021: true,
    mocha: true,
    node: true,
    // jest: true,
  },
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "import"],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,  // Enable this if you're using React
    },
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    // "plugin:jest/recommended",
  ],
  rules: {
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "comma-dangle": ["error", "always-multiline"],
    "semi": ["error", "always"],
    // "quotes": ["error", "double"],
    "space-before-function-paren": [
      "error", {
        "anonymous": "always",
        "named": "never",
        "asyncArrow": "always",
      },
    ],
  },
  ignorePatterns: ["lib/*", "src/react-app-env.d.ts"],
  settings: {
    react: {
      version: "detect",  // Helps linting with correct React version
    },
  },
};
