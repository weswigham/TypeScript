//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesRegexpLiteralCase2.ts] ////

//// [input.ts]
type C = { get [/a/ig](): number; set ['/a/gi'](v: string); };
export {};

//// [input.ts]
type C = { get [/a/ig](): number; set ['/a/gi'](v: string); };
export {};
