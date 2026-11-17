//// [tests/cases/conformance/lint/rules/no-duplicate-type-constituents/tsNoDuplicateTypeConstituentsCoverage.ts] ////

//// [input.ts]
type Original = string;
type Alias = Original;
type DuplicateAliases = Original | Alias;
type DuplicateObjects = { value: string } | { value: string };
type NestedDuplicate = string | (number | string);
function optionalValue(value?: string | undefined) {
    return value;
}

type DistinctPrimitives = string | number;
type DistinctIntersection = { first: string } & { second: number };
type DistinctObjectSyntax = { first: string; second: number } | { second: number; first: string };
function optionalString(value?: string) {
    return value;
}

//// [input.ts]
type Original = string;
type Alias = Original;
type DuplicateAliases = Original  ;
type DuplicateObjects = { value: string }  ;
type NestedDuplicate = string | (number  );
function optionalValue(value?: string  ) {
    return value;
}

type DistinctPrimitives = string | number;
type DistinctIntersection = { first: string } & { second: number };
type DistinctObjectSyntax = { first: string; second: number } | { second: number; first: string };
function optionalString(value?: string) {
    return value;
}
