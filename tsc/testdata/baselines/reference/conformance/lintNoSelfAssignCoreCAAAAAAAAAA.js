//// [tests/cases/conformance/lint/rules/no-self-assign/lintNoSelfAssignCoreCAAAAAAAAAA.ts] ////

//// [input.ts]
a = a; a &&= a; a ||= a; a ??= a; a += a;

//// [input.ts]
a = a; a &&= a; a ||= a; a ??= a; a += a;
