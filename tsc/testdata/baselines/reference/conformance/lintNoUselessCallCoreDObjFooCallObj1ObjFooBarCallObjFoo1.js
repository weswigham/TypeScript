//// [tests/cases/conformance/lint/rules/no-useless-call/lintNoUselessCallCoreDObjFooCallObj1ObjFooBarCallObjFoo1.ts] ////

//// [input.ts]
(obj?.foo).call(obj, 1); obj?.foo.bar.call(obj?.foo, 1);

//// [input.ts]
(obj?.foo).call(obj, 1); obj?.foo.bar.call(obj?.foo, 1);
