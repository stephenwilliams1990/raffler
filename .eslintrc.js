module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint", "react", "react-hooks", "prettier"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:prettier/recommended"
    ],
    env: {
        node: true
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        "ecmaFeatures": {
            "jsx": true
        }
    },
    rules: {
        "@typescript-eslint/no-explicit-any": 0
    },
    settings: {
        "react": {
            "version": "detect",
        }
    }
};
