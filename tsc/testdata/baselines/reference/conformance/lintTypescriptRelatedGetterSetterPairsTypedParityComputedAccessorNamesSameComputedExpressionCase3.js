//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesSameComputedExpressionCase3.ts] ////

//// [input.ts]
declare class C { get [Symbol.iterator](): number; set [Symbol.iterator](v: string); }
export {};

//// [input.ts]
declare class C { get [Symbol.iterator](): number; set [Symbol.iterator](v: string); }
export {};
