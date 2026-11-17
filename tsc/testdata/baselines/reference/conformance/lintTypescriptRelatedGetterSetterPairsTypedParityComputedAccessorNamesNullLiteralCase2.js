//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesNullLiteralCase2.ts] ////

//// [input.ts]
type C = { get [null](): number; set ['null'](v: string); };
export {};

//// [input.ts]
type C = { get [null](): number; set ['null'](v: string); };
export {};
