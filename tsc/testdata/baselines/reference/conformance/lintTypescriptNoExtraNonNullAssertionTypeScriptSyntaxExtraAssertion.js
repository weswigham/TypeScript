//// [tests/cases/conformance/lint/rules/no-extra-non-null-assertion/lintTypescriptNoExtraNonNullAssertionTypeScriptSyntaxExtraAssertion.ts] ////

//// [input.ts]
value!!; (value!)?.key;

//// [input.ts]
value!; (value)?.key;
