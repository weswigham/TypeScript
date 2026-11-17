//// [tests/cases/conformance/lint/rules/no-useless-call/lintNoUselessCallCoreDObjFooCallOther1ObjFooBarCallObjFoo1FooCallNull.ts] ////

//// [input.ts]
obj.foo.call(other, 1); obj?.foo.bar.call(obj.foo, 1); foo['call'](null);

//// [input.ts]
obj.foo.call(other, 1); obj?.foo.bar.call(obj.foo, 1); foo['call'](null);
