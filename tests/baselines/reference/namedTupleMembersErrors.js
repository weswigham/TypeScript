//// [namedTupleMembersErrors.ts]
export type Segment1 = [length: number, number]; // partially named, disallowed

export type List = [item: any, ...any];  // partially named, disallowed

export type Pair = [item: any, any?];  // partially named, disallowed

export type Opt = [element?: string]; // question mark on name disallowed

export type Trailing =  [first: string, ...rest: string[]] // dots on name disallowed

//// [namedTupleMembersErrors.js]
"use strict";
exports.__esModule = true;


//// [namedTupleMembersErrors.d.ts]
export declare type Segment1 = [length: number, number];
export declare type List = [item: any, ...any];
export declare type Pair = [item: any, any?];
export declare type Opt = [element: string];
export declare type Trailing = [first: string, rest: string[]];
