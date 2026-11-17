//// [tests/cases/conformance/lint/rules/consistent-this/lintConsistentThisCoreScopeAThisVarSelfSelfThisCase1.ts] ////

//// [input.ts]
var self; (() => { self = this; })();

//// [input.ts]
var self; (() => { self = this; })();
