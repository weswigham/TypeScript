//// [tests/cases/conformance/lint/rules/no-extra-boolean-cast/lintNoExtraBooleanCastCoreSyntaxBBooleanInner.ts] ////

//// [input.ts]
if (value && Boolean(other)) {} if (value ?? Boolean(other)) {} if ((value, Boolean(other))) {}

//// [input.ts]
if (value && (other)) {} if (value ?? (other)) {} if ((value, (other))) {}
