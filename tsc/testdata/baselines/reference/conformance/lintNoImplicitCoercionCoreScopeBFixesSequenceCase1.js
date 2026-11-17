//// [tests/cases/conformance/lint/rules/no-implicit-coercion/lintNoImplicitCoercionCoreScopeBFixesSequenceCase1.ts] ////

//// [input.ts]
const result = !!(first, second);

//// [input.ts]
const result = Boolean((first, second));
