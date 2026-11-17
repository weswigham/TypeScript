//// [tests/cases/conformance/lint/rules/prefer-spread/lintPreferSpreadCoreDFooApplyNullFooApplyNullArgsFooApplyOtherArgs.ts] ////

//// [input.ts]
foo.apply(null, []); foo.apply(null, ...args); foo.apply(other, args);

//// [input.ts]
foo.apply(null, []); foo.apply(null, ...args); foo.apply(other, args);
