//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesNullLiteralCase1.ts] ////

//// [input.ts]
interface C { get [null](): number; set ['null'](v: string); }
export {};

//// [input.ts]
interface C { get [null](): number; set ['null'](v: string); }
export {};
