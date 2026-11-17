//// [tests/cases/conformance/lint/rules/prefer-optional-chain/tsPreferOptionalChainCoverage.ts] ////

//// [input.ts]
declare const optional: { name: string } | undefined;
const guarded = optional && optional.name;

declare const nullable: { name: string } | null;
const nullGuarded = nullable && nullable.name;

const chained = optional?.name;
declare const definite: { name: string };
const nonNullish = definite && definite.name;
declare const unchecked: any;
const ignored = unchecked && unchecked.name;

//// [input.ts]
declare const optional: { name: string } | undefined;
const guarded = optional?.name;

declare const nullable: { name: string } | null;
const nullGuarded = nullable && nullable.name;

const chained = optional?.name;
declare const definite: { name: string };
const nonNullish = definite && definite.name;
declare const unchecked: any;
const ignored = unchecked && unchecked.name;
