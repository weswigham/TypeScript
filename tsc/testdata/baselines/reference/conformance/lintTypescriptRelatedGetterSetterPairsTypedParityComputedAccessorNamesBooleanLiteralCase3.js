//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesBooleanLiteralCase3.ts] ////

//// [input.ts]
declare class C { get [true](): number; set ['true'](v: string); }
export {};

//// [input.ts]
declare class C { get [true](): number; set ['true'](v: string); }
export {};
