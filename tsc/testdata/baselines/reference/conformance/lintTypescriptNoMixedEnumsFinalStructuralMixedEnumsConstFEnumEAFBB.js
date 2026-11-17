//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralMixedEnumsConstFEnumEAFBB.ts] ////

//// [input.ts]
const f = () => ''; enum E { A = f(), B = `b` }

//// [input.ts]
const f = () => ''; enum E { A = f(), B = `b` }
