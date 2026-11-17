//// [tests/cases/conformance/lint/rules/max-params/lintMaxParamsCoreSyntaxAParameters.ts] ////

//// [input.ts]
function many(first, second, third, fourth) {} function valid(this: void, first, second, third) {}

//// [input.ts]
function many(first, second, third, fourth) {} function valid(this: void, first, second, third) {}
