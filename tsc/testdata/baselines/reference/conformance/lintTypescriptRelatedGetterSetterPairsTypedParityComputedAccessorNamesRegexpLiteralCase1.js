//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesRegexpLiteralCase1.ts] ////

//// [input.ts]
interface C { get [/a/ig](): number; set ['/a/gi'](v: string); }
export {};

//// [input.ts]
interface C { get [/a/ig](): number; set ['/a/gi'](v: string); }
export {};
