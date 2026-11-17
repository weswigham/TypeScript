//// [tests/cases/conformance/lint/rules/no-restricted-types/tsNoRestrictedTypesCoverage.ts] ////

//// [input.ts]
export {};
type Bad = string;
type Forbidden = number;
type Legacy = string;
type Banned<T> = T[];
type Good = string;
type Other = number;
let needsFix: Bad;
let reportOnly: Forbidden;
let suggestionOnly: Legacy;
type RestrictedGeneric = Banned<string>;
let allowed: Good;
let primitive: string;
let unrestrictedGeneric: Banned<number>;

//// [input.ts]
export {};
type Bad = string;
type Forbidden = number;
type Legacy = string;
type Banned<T> = T[];
type Good = string;
type Other = number;
let needsFix: Good;
let reportOnly: Forbidden;
let suggestionOnly: Legacy;
type RestrictedGeneric = Banned<string>;
let allowed: Good;
let primitive: string;
let unrestrictedGeneric: Banned<number>;
