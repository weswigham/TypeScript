//// [tests/cases/conformance/lint/rules/no-extra-boolean-cast/lintNoExtraBooleanCastCoreSyntaxBBooleanShadowing.ts] ////

//// [input.ts]
function run(Boolean) { if (Boolean(value)) {} Boolean(!!value); }

//// [input.ts]
function run(Boolean) { if (Boolean(value)) {} Boolean(!!value); }
