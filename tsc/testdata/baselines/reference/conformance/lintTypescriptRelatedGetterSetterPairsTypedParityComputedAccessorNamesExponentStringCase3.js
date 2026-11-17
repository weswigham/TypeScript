//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesExponentStringCase3.ts] ////

//// [input.ts]
declare class C { get [1e21](): number; set ['1e+21'](v: string); }
export {};

//// [input.ts]
declare class C { get [1e21](): number; set ['1e+21'](v: string); }
export {};
