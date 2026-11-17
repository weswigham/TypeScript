//// [tests/cases/conformance/lint/rules/explicit-module-boundary-types/tsExplicitModuleBoundaryTypesCoverage.ts] ////

//// [input.ts]
export function missingReturn(value: number) { return value; }
export function looseArgument(value: any): unknown { return value; }
export const missingArrowReturn = (value: number) => value;
export function validBoundary(value: number): number { return value; }
export function validDefault(value = 1): number { return value; }
export const validContextual: (value: number) => number = value => value;
function validLocal(value: number) { return value; }
export class Boundary {
    public missingMethodReturn(value: number) { return value; }
    private validPrivate(value: number) { return value; }
}

//// [input.ts]
export function missingReturn(value: number) { return value; }
export function looseArgument(value: any): unknown { return value; }
export const missingArrowReturn = (value: number) => value;
export function validBoundary(value: number): number { return value; }
export function validDefault(value = 1): number { return value; }
export const validContextual: (value: number) => number = value => value;
function validLocal(value: number) { return value; }
export class Boundary {
    public missingMethodReturn(value: number) { return value; }
    private validPrivate(value: number) { return value; }
}
