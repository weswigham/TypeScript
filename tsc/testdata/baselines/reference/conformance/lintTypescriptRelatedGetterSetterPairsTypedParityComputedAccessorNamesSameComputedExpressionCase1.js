//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesSameComputedExpressionCase1.ts] ////

//// [input.ts]
interface C { get [Symbol.iterator](): number; set [Symbol.iterator](v: string); }
export {};

//// [input.ts]
interface C { get [Symbol.iterator](): number; set [Symbol.iterator](v: string); }
export {};
