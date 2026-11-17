//// [tests/cases/conformance/lint/rules/no-unsafe-argument/tsNoUnsafeArgumentUnsafeConformance.ts] ////

//// [input.ts]
declare const unsafe: any;
declare const nested: Set<Set<any>>;
declare const tuple: [string, ...string[]];
declare function text(value: string): void;
declare function unknownValue(value: unknown): void;
declare function sets(value: Set<Set<string>>): void;
declare function rest(...values: [string, string]): void;
declare function generic<T extends any[]>(...values: T): void;
declare function tag(strings: TemplateStringsArray, value: string): void;
text(unsafe);
unknownValue(unsafe);
sets(nested);
rest(...tuple, unsafe);
rest(...[unsafe, unsafe] as const);
text(...[unsafe]);
generic(unsafe);
tag`${unsafe}`;

//// [input.ts]
declare const unsafe: any;
declare const nested: Set<Set<any>>;
declare const tuple: [string, ...string[]];
declare function text(value: string): void;
declare function unknownValue(value: unknown): void;
declare function sets(value: Set<Set<string>>): void;
declare function rest(...values: [string, string]): void;
declare function generic<T extends any[]>(...values: T): void;
declare function tag(strings: TemplateStringsArray, value: string): void;
text(unsafe);
unknownValue(unsafe);
sets(nested);
rest(...tuple, unsafe);
rest(...[unsafe, unsafe] as const);
text(...[unsafe]);
generic(unsafe);
tag`${unsafe}`;
