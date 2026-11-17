//// [tests/cases/conformance/lint/rules/no-extra-boolean-cast/lintNoExtraBooleanCastCoreSyntaxBBooleanLegacy.ts] ////

//// [input.ts]
if (value && Boolean(other)) {} if (value ?? Boolean(other)) {}

//// [input.ts]
if (value && (other)) {} if (value ?? Boolean(other)) {}
