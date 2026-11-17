//// [tests/cases/conformance/lint/rules/no-setter-return/lintNoSetterReturnCoreCObjectCreateFooSetValValObjectDefinePropertyFooBarSetFunctionObjectReturn1.ts] ////

//// [input.ts]
Object.create({}, { foo: { [`set`]: val => val } }); Object['defineProperty'](foo, 'bar', { set: function Object() { return 1; } });

//// [input.ts]
Object.create({}, { foo: { [`set`]: val => val } }); Object['defineProperty'](foo, 'bar', { set: function Object() { return 1; } });
