//// [tests/cases/conformance/lint/rules/one-var/lintOneVarRolloutStyleStrictAndClassCStaticVarAVarB.ts] ////

//// [input.ts]
class C { static { var a; var b; } }

//// [input.ts]
class C { static { var a,  b; } }
