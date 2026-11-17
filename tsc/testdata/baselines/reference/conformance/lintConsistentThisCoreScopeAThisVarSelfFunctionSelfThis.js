//// [tests/cases/conformance/lint/rules/consistent-this/lintConsistentThisCoreScopeAThisVarSelfFunctionSelfThis.ts] ////

//// [input.ts]
var self; (function() { self = this; })();

//// [input.ts]
var self; (function() { self = this; })();
