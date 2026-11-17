//// [tests/cases/conformance/lint/rules/related-getter-setter-pairs/lintTypescriptRelatedGetterSetterPairsTypedParityComputedAccessorNamesExpressionIsNotAStringCase1.ts] ////

//// [input.ts]
interface C { get [Symbol.iterator](): number; set ['Symbol.iterator'](v: string); }
export {};

//// [input.ts]
interface C { get [Symbol.iterator](): number; set ['Symbol.iterator'](v: string); }
export {};
