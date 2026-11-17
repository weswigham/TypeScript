//// [tests/cases/conformance/lint/rules/no-unused-vars/tsNoUnusedVarsCoverage.ts] ////

//// [types.ts]
export interface Shape { size: number; }
export interface UnusedShape { name: string; }

//// [input.ts]
import type { Shape, UnusedShape } from "./types";

const unused = 1;
const _ignored = 2;
const onlyType = 3;
export type ValueType = typeof onlyType;

export function select(first: number, second: number): number {
    return second;
}

export function size(shape: Shape): number {
    return shape.size;
}

export function recover(): void {
    try {
        size({ size: 1 });
    } catch (error) {}
}

//// [input.ts]
import type { Shape, UnusedShape } from "./types";

const unused = 1;
const _ignored = 2;
const onlyType = 3;
export type ValueType = typeof onlyType;

export function select(first: number, second: number): number {
    return second;
}

export function size(shape: Shape): number {
    return shape.size;
}

export function recover(): void {
    try {
        size({ size: 1 });
    } catch (error) {}
}
//// [types.ts]
export interface Shape { size: number; }
export interface UnusedShape { name: string; }
