//// [tests/cases/conformance/lint/rules/no-meaningless-void-operator/lintTypescriptNoMeaninglessVoidOperatorTypedAMeaninglessVoidWrappedMember.ts] ////

//// [input.ts]
declare const obj: { value: string }; void (obj.value as string);

//// [input.ts]
declare const obj: { value: string }; (obj.value as string);
