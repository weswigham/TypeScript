//// [tests/cases/conformance/lint/rules/use-isnan/rolloutUseIsnan.ts] ////

//// [input.ts]
declare const value: number, values: number[];
value === NaN;
value != Number.NaN;
value < NaN;
switch (NaN) { case NaN: break; }
values.indexOf(NaN);
values.lastIndexOf(NaN, 1);
function shadowed(NaN: number) { return value === NaN; }

//// [input.ts]
declare const value: number, values: number[];
value === NaN;
value != Number.NaN;
value < NaN;
switch (NaN) { case NaN: break; }
values.indexOf(NaN);
values.lastIndexOf(NaN, 1);
function shadowed(NaN: number) { return value === NaN; }
