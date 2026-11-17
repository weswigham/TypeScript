//// [tests/cases/conformance/lint/rules/prefer-spread/lintPreferSpreadCoreDABCFooApplyABCArgsABCFooApplyABCArgs.ts] ////

//// [input.ts]
(a?.b).c.foo.apply(a?.b.c, args); a?.b.c.foo.apply((a?.b).c, args);

//// [input.ts]
(a?.b).c.foo.apply(a?.b.c, args); a?.b.c.foo.apply((a?.b).c, args);
