//// [tests/cases/conformance/lint/rules/no-underscore-dangle/lintNoUnderscoreDangleCoreScopeCReportsConstValueNestedOtherObjectConstThirdArray.ts] ////

//// [input.ts]
const { _value, nested: [_other] } = object; const [_third] = array;

//// [input.ts]
const { _value, nested: [_other] } = object; const [_third] = array;
