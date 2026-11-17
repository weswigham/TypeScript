//// [tests/cases/conformance/lint/rules/no-return-assign/noReturnAssignCoreParentheses.ts] ////

//// [input.ts]
function first() { return result = a * b; }
function second() { return (result = a * b); }
function third() { return (result) = (a * b); }
const arrow = () => result = a * b;
const allowed = () => (result = a * b);
const nested = () => function() { result = a * b; };

//// [input.ts]
function first() { return result = a * b; }
function second() { return (result = a * b); }
function third() { return (result) = (a * b); }
const arrow = () => result = a * b;
const allowed = () => (result = a * b);
const nested = () => function() { result = a * b; };
