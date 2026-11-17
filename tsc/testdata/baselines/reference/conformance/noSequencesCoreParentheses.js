//// [tests/cases/conformance/lint/rules/no-sequences/noSequencesCoreParentheses.ts] ////

//// [input.ts]
1, 2, 3;
if (doSomething(), test) {}
if ((doSomething(), test)) {}
for (i = 0, j = 0; test; i++, j++) {}
const arrow = a => (doSomething(), a);
const allowed = a => ((doSomething(), a));
const value = (1, 2);
const nested = (1, (2, 3));

//// [input.ts]
1, 2, 3;
if (doSomething(), test) {}
if ((doSomething(), test)) {}
for (i = 0, j = 0; test; i++, j++) {}
const arrow = a => (doSomething(), a);
const allowed = a => ((doSomething(), a));
const value = (1, 2);
const nested = (1, (2, 3));
