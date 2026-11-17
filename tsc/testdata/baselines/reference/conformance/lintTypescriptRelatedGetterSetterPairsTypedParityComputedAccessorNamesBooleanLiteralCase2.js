//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesBooleanLiteralCase2.ts] ////

//// [input.ts]
type C = { get [true](): number; set ['true'](v: string); };
export {};

//// [input.ts]
type C = { get [true](): number; set ['true'](v: string); };
export {};
