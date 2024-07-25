import globals from "globals";
import pluginJs from "@eslint/js";
import mochaPlugin from 'eslint-plugin-mocha';

export default [
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  mochaPlugin.configs.flat.recommended,
  {
    rules: {
      "mocha/no-mocha-arrows": "off",
      "mocha/no-setup-in-describe": "off",
      "mocha/no-skipped-tests": "off",
      "mocha/no-exports": "off"
    }
  }
];