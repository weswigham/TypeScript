//// [tests/cases/conformance/lint/rules/array-callback-return/lintArrayCallbackReturnRolloutReturnsRulesValuesFilterFunctionReturnFunction.ts] ////

//// [input.ts]
values.filter((function() { return function() {}; })());

//// [input.ts]
values.filter((function() { return function() {}; })());
