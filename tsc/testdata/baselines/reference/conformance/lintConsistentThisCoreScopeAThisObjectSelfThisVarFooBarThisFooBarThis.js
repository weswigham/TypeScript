//// [tests/cases/conformance/lint/rules/consistent-this/lintConsistentThisCoreScopeAThisObjectSelfThisVarFooBarThisFooBarThis.ts] ////

//// [input.ts]
object.self = this; var { foo, bar } = this; [foo, bar] = this;

//// [input.ts]
object.self = this; var { foo, bar } = this; [foo, bar] = this;
