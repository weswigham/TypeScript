//// [tests/cases/conformance/lint/rules/arrow-body-style/lintArrowBodyStyleCoreSyntaxAOptionsConstFnValue1.ts] ////

//// [input.ts]
const fn = () => ({ value:1 });

//// [input.ts]
const fn = () => {
    return ({ value: 1 });
};
