//// [tests/cases/conformance/lint/rules/no-meaningless-void-operator/lintTypescriptNoMeaninglessVoidOperatorTypedAMeaninglessVoidNoncallWrappedStatement.ts] ////

//// [input.ts]
declare const value: string; (void value);

//// [input.ts]
declare const value: string; (value);
