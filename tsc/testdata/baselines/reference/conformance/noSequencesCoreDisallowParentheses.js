//// [tests/cases/conformance/lint/rules/no-sequences/noSequencesCoreDisallowParentheses.ts] ////

//// [input.ts]
const value = (1, 2);
(0, eval)("foo()");
if ((doSomething(), test)) {}
for ((i = 0, j = 0); test; (i++, j++)) {}

//// [input.ts]
const value = (1, 2);
(0, eval)("foo()");
if ((doSomething(), test)) {}
for ((i = 0, j = 0); test; (i++, j++)) {}
