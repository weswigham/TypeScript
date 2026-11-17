//// [tests/cases/conformance/lint/rules/prefer-find/tsPreferFindFinalDefaults.ts] ////

//// [input.ts]
declare const values: readonly number[];
declare const optional: number[] | undefined;
declare const condition: boolean;
const zero = 0;
values.filter(value => value > 0)[zero];
values["filter"](Boolean).at(0);
(condition ? values.filter(Boolean) : values.filter(Boolean))[0];
optional?.filter(Boolean)[0];
values.filter(Boolean)?.[0];
values.filter(Boolean).at(1);

//// [input.ts]
declare const values: readonly number[];
declare const optional: number[] | undefined;
declare const condition: boolean;
const zero = 0;
values.filter(value => value > 0)[zero];
values["filter"](Boolean).at(0);
(condition ? values.filter(Boolean) : values.filter(Boolean))[0];
optional?.filter(Boolean)[0];
values.filter(Boolean)?.[0];
values.filter(Boolean).at(1);
