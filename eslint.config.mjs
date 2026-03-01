import js from "@eslint/js";
import mochaPlugin from "eslint-plugin-mocha";
import globals from "globals";

export default [
    {
        ignores: ["**/node_modules/", "dist/", "build/", "coverage/", "public/uploads/", "actions-runner/", "docs/"]
    },
    js.configs.recommended,
    mochaPlugin.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                ...globals.node,
                ...globals.mocha,
                ...globals.jest,
            },
        },
        rules: {
            "no-multi-spaces": ["error"],
            "mocha/no-setup-in-describe": "off",
            "mocha/no-mocha-arrows": "off",
            "mocha/consistent-spacing-between-blocks": "off",
            "no-useless-assignment": "off",
            "no-unused-vars": "warn",
            "no-undef": "warn",
            "mocha/no-pending-tests": "off",
            "no-unassigned-vars": "off"
        }
    }
];
