//// [tests/cases/conformance/lint/rules/no-setter-return/lintNoSetterReturnCoreCObjectCreateFooBarSetValReturn1.ts] ////

//// [input.ts]
Object.create(foo, {bar: {set(val) {return 1;}}});

//// [input.ts]
Object.create(foo, {bar: {set(val) {return 1;}}});
