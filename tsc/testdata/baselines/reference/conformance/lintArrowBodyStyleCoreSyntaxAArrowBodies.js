//// [tests/cases/conformance/lint/rules/arrow-body-style/lintArrowBodyStyleCoreSyntaxAArrowBodies.ts] ////

//// [input.ts]
const fn = () => { return 1; }; const empty = () => {};

//// [input.ts]
const fn = () => (1); const empty = () => {};
