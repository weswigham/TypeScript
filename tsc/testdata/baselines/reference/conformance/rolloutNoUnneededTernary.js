//// [tests/cases/conformance/lint/rules/no-unneeded-ternary/rolloutNoUnneededTernary.ts] ////

//// [input.ts]
declare const value: any, other: any;
const boolean = value ? true : false;
const inverse = value === other ? false : true;
const fallback = value ? value : other ?? 0;
const unchanged = (() => value)() ? true : true;

//// [input.ts]
declare const value: any, other: any;
const boolean = !!value;
const inverse = value !== other;
const fallback = value || (other ?? 0);
const unchanged = (() => value)() ? true : true;
