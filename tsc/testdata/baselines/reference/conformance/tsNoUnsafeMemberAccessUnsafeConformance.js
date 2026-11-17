//// [tests/cases/conformance/lint/rules/no-unsafe-member-access/tsNoUnsafeMemberAccessUnsafeConformance.ts] ////

//// [input.ts]
declare const unsafe: any;
declare const safe: {value: string};
declare const key: any;
unsafe.outer.inner;
(unsafe.outer).inner;
unsafe?.outer;
unsafe?.outer.inner;
unsafe[key];
safe[key];
safe[key++];
safe.value;
unresolved.value;
interface Heritage extends Missing.Type {}

//// [input.ts]
declare const unsafe: any;
declare const safe: {value: string};
declare const key: any;
unsafe.outer.inner;
(unsafe.outer).inner;
unsafe?.outer;
unsafe?.outer.inner;
unsafe[key];
safe[key];
safe[key++];
safe.value;
unresolved.value;
interface Heritage extends Missing.Type {}
