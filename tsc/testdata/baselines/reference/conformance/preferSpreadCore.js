//// [tests/cases/conformance/lint/rules/prefer-spread/preferSpreadCore.ts] ////

//// [input.ts]
foo.apply(null, args);
object.method.apply(object, args);
foo["apply"](null, args);
foo.apply(null, []);
foo.apply(null, ...args);
(a?.b).c.foo.apply(a?.b.c, args);
a?.b.c.foo.apply((a?.b).c, args);

//// [input.ts]
foo.apply(null, args);
object.method.apply(object, args);
foo["apply"](null, args);
foo.apply(null, []);
foo.apply(null, ...args);
(a?.b).c.foo.apply(a?.b.c, args);
a?.b.c.foo.apply((a?.b).c, args);
