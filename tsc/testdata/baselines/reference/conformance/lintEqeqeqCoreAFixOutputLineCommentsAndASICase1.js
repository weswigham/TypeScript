//// [tests/cases/conformance/lint/rules/eqeqeq/lintEqeqeqCoreAFixOutputLineCommentsAndASICase1.ts] ////

//// [input.ts]
typeof left // Left
== // Right
"string" // Trailing
next()

//// [input.ts]
typeof left // Left
=== // Right
"string" // Trailing
next()
