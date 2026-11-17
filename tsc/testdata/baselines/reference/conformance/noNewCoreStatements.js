//// [tests/cases/conformance/lint/rules/no-new/noNewCoreStatements.ts] ////

//// [input.ts]
new Date();
(new Date());
const value = new Date();
if (value === new Date()) {}
void new Date();
new Date().getTime();

//// [input.ts]
new Date();
(new Date());
const value = new Date();
if (value === new Date()) {}
void new Date();
new Date().getTime();
