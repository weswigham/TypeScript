//// [tests/cases/conformance/lint/rules/prefer-spread/lintPreferSpreadCoreDFooApplyNullArgsObjFooApplyObjArgsFooApplyNullArgs.ts] ////

//// [input.ts]
foo.apply(null, args); obj.foo.apply(obj, args); foo['apply'](null, args);

//// [input.ts]
foo.apply(null, args); obj.foo.apply(obj, args); foo['apply'](null, args);
