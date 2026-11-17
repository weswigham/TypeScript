//// [tests/cases/conformance/lint/rules/no-useless-call/noUselessCallCore.ts] ////

//// [input.ts]
foo.call(undefined, 1);
foo.apply(void 0, [1]);
object.method.call(object, 1);
(object?.method).call(object, 1);
object.method.call(other, 1);
foo["call"](null, 1);
object.method.apply(object, args);

//// [input.ts]
foo.call(undefined, 1);
foo.apply(void 0, [1]);
object.method.call(object, 1);
(object?.method).call(object, 1);
object.method.call(other, 1);
foo["call"](null, 1);
object.method.apply(object, args);
