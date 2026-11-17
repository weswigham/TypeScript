//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesPrivateIsNotAStringCase3.ts] ////

//// [input.ts]
declare class C { get #value(): number; set ['#value'](v: string); }
export {};

//// [input.ts]
declare class C { get #value(): number; set ['#value'](v: string); }
export {};
