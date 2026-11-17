//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesSameComputedExpressionCase2.ts] ////

//// [input.ts]
type C = { get [Symbol.iterator](): number; set [Symbol.iterator](v: string); };
export {};

//// [input.ts]
type C = { get [Symbol.iterator](): number; set [Symbol.iterator](v: string); };
export {};
