//// [tests/cases/conformance/lint/rules/prefer-includes/tsPreferIncludesFinalDefaults.ts] ////

//// [input.ts]
declare const values: number[];
declare const text: string;
declare const optional: string | undefined;
declare const custom: { indexOf(value: string): number; includes(value: string): boolean };
declare const incompatible: { indexOf(value: string): number; includes(other: string): boolean };
values.indexOf(1) !== -1;
text.indexOf("a") < 0;
optional?.indexOf("a") !== -1;
custom.indexOf("a") >= 0;
incompatible.indexOf("a") >= 0;
/a\x62/.test(text);
/a|b/.test(text);
/a/i.test(text);
/a/g.test(text);

//// [input.ts]
declare const values: number[];
declare const text: string;
declare const optional: string | undefined;
declare const custom: { indexOf(value: string): number; includes(value: string): boolean };
declare const incompatible: { indexOf(value: string): number; includes(other: string): boolean };
values.includes(1);
!text.includes("a");
optional?.indexOf("a") !== -1;
custom.includes("a");
incompatible.indexOf("a") >= 0;
text.includes('ab');
/a|b/.test(text);
/a/i.test(text);
/a/g.test(text);
