//// [tests/cases/conformance/lint/rules/no-base-to-string/lintTypescriptNoBaseToStringFinalValuesBaseToStringStringToStringReturnCustom.ts] ////

//// [input.ts]
String({ toString() { return 'custom'; } });

//// [input.ts]
String({ toString() { return 'custom'; } });
