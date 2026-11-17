//// [tests/cases/conformance/lint/rules/no-nested-ternary/noNestedTernaryCoreBranches.ts] ////

//// [input.ts]
foo ? bar : baz === qux ? quxx : foobar;
foo ? baz === qux ? quxx : foobar : bar;
foo ? (bar ? baz : qux) : quux;
(foo ? bar : baz) ? qux : quux;
foo ? bar : baz;

//// [input.ts]
foo ? bar : baz === qux ? quxx : foobar;
foo ? baz === qux ? quxx : foobar : bar;
foo ? (bar ? baz : qux) : quux;
(foo ? bar : baz) ? qux : quux;
foo ? bar : baz;
