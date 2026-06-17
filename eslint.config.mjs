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
            parserOptions: {
            },
            globals: {
                ...globals.node,
                ...globals.mocha,
                ...globals.jest,
                expect: "readonly",
                assert: "readonly",
                suite: "readonly",
                test: "readonly",
                suiteSetup: "readonly",
                suiteTeardown: "readonly",
                setup: "readonly",
                teardown: "readonly"
            }
        },
        rules: {
            "no-multi-spaces": ["error"],
            "mocha/no-setup-in-describe": "off",
            "mocha/no-mocha-arrows": "off",
            "mocha/consistent-spacing-between-blocks": "off",
            "no-unused-vars": ["warn", { "args": "after-used", "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
            "no-undef": "warn",
            "mocha/no-pending-tests": "off",
            "no-redeclare": "off",
            "no-var": "off",
            "no-useless-assignment": "off"
        }
    },
    {
        files: ["test/**/*.js"],
        rules: {
            "no-unused-vars": ["warn", { "vars": "local", "args": "none", "varsIgnorePattern": "^_" }]
        }
    },
    {
        files: ["**/*.mjs"],
        languageOptions: {
            sourceType: "module"
        }
    }
];
