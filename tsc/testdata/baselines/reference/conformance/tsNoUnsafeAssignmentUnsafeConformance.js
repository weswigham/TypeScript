//// [tests/cases/conformance/lint/rules/no-unsafe-assignment/tsNoUnsafeAssignmentUnsafeConformance.ts] ////

//// [input.ts]
declare const unsafe: any;
declare const array: any[];
declare const tuple: [number, any, {value: any}];
declare const object: {value: any};
const value = unsafe;
const safe: unknown = unsafe;
const inferred = new Set<any>();
const annotated: Set<string> = new Set<any>();
const contextual: {value: Set<string>} = {value: new Set<any>()};
const [first] = array;
const [, second, {value: nested}] = tuple;
const {value: property} = object;
const [...rest] = tuple;
const spread = [...array];
function defaults(value = unsafe) {}
class Box { value = unsafe; }

//// [input.ts]
declare const unsafe: any;
declare const array: any[];
declare const tuple: [number, any, {value: any}];
declare const object: {value: any};
const value = unsafe;
const safe: unknown = unsafe;
const inferred = new Set<any>();
const annotated: Set<string> = new Set<any>();
const contextual: {value: Set<string>} = {value: new Set<any>()};
const [first] = array;
const [, second, {value: nested}] = tuple;
const {value: property} = object;
const [...rest] = tuple;
const spread = [...array];
function defaults(value = unsafe) {}
class Box { value = unsafe; }
