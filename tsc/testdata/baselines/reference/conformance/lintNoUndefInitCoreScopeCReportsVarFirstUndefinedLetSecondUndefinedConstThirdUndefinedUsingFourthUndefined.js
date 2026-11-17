//// [tests/cases/conformance/lint/rules/no-undef-init/lintNoUndefInitCoreScopeCReportsVarFirstUndefinedLetSecondUndefinedConstThirdUndefinedUsingFourthUndefined.ts] ////

//// [input.ts]
var first = undefined; let second = (undefined); const third = undefined; using fourth = undefined;

//// [input.ts]
var first = undefined; let second; const third = undefined; using fourth = undefined;
