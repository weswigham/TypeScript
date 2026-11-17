//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesExponentStringCase1.ts] ////

//// [input.ts]
interface C { get [1e21](): number; set ['1e+21'](v: string); }
export {};

//// [input.ts]
interface C { get [1e21](): number; set ['1e+21'](v: string); }
export {};
