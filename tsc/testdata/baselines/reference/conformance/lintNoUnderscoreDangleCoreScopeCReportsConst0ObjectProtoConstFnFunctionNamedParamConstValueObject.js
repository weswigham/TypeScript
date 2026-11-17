//// [tests/cases/conformance/lint/rules/no-underscore-dangle/lintNoUnderscoreDangleCoreScopeCReportsConst0ObjectProtoConstFnFunctionNamedParamConstValueObject.ts] ////

//// [input.ts]
const _ = 0; object.__proto__; const fn = function _named(_param) {}; const { _value } = object;

//// [input.ts]
const _ = 0; object.__proto__; const fn = function _named(_param) {}; const { _value } = object;
