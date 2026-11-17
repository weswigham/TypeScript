//// [tests/cases/conformance/lint/rules/no-underscore-dangle/lintNoUnderscoreDangleCoreScopeCReportsVarFirstConstSecond0FunctionThirdObjectFourthObjectFifthObjectSixth.ts] ////

//// [input.ts]
var _first; const second_ = 0; function _third() {} object._fourth; object[_fifth]; object['_sixth'];

//// [input.ts]
var _first; const second_ = 0; function _third() {} object._fourth; object[_fifth]; object['_sixth'];
