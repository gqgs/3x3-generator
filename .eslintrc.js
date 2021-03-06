module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    "plugin:vue/vue3-essential",
    "@vue/typescript/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
    camelcase: "off",
    "import/no-webpack-loader-syntax": "off",
    quotes: [2, "double", { avoidEscape: true }],
    indent: "off",
    "@typescript-eslint/indent": ["error", 2]
  }
}
