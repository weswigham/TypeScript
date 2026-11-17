//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesRegexpLiteralCase3.ts] ////

//// [input.ts]
declare class C { get [/a/ig](): number; set ['/a/gi'](v: string); }
export {};

//// [input.ts]
declare class C { get [/a/ig](): number; set ['/a/gi'](v: string); }
export {};
