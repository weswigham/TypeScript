//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesNullLiteralCase3.ts] ////

//// [input.ts]
declare class C { get [null](): number; set ['null'](v: string); }
export {};

//// [input.ts]
declare class C { get [null](): number; set ['null'](v: string); }
export {};
