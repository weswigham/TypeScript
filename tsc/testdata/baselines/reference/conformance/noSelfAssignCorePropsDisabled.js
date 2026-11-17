//// [tests/cases/conformance/lint/rules/no-self-assign/noSelfAssignCorePropsDisabled.ts] ////

//// [input.ts]
a = a;
a.b = a.b;
this.x = this.x;
[a, b.x] = [a, b.x];

//// [input.ts]
a = a;
a.b = a.b;
this.x = this.x;
[a, b.x] = [a, b.x];
