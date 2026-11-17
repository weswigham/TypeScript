//// [tests/cases/conformance/lint/rules/no-extra-boolean-cast/lintNoExtraBooleanCastCoreSyntaxBBooleanContexts.ts] ////

//// [input.ts]
if (!!value) {} while (Boolean(value)) {} Boolean(!!value); const valid = !!value;

//// [input.ts]
if ((value)) {} while ((value)) {} Boolean((value)); const valid = !!value;
