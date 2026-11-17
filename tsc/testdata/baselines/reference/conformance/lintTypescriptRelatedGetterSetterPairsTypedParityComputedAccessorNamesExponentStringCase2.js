//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesExponentStringCase2.ts] ////

//// [input.ts]
type C = { get [1e21](): number; set ['1e+21'](v: string); };
export {};

//// [input.ts]
type C = { get [1e21](): number; set ['1e+21'](v: string); };
export {};
