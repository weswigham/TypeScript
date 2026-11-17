//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesBooleanLiteralCase1.ts] ////

//// [input.ts]
interface C { get [true](): number; set ['true'](v: string); }
export {};

//// [input.ts]
interface C { get [true](): number; set ['true'](v: string); }
export {};
