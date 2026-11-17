//// [tests/cases/conformance/lint/rules/no-unsafe-return/tsNoUnsafeReturnUnsafeConformance.ts] ////

//// [input.ts]
declare const unsafe: any;
function inferred() { return unsafe; }
function explicit(): any { return unsafe; }
function unknownValue(): unknown { return unsafe; }
function array() { return [] as any[]; }
function unknownArray(): unknown[] { return [] as any[]; }
function generic(): Set<string> { return new Set<any>(); }
const contextual: () => Set<string> = () => new Set<any>();
async function asyncInferred() { return Promise.resolve(unsafe); }
async function asyncExplicit(): Promise<any> { return Promise.resolve(unsafe); }
async function asyncUnknown(): Promise<unknown> { return Promise.resolve(unsafe); }
function nonAsyncPromise() { return Promise.resolve(unsafe); }
function unconstrained<T extends any>(value: T) { return value; }

//// [input.ts]
declare const unsafe: any;
function inferred() { return unsafe; }
function explicit(): any { return unsafe; }
function unknownValue(): unknown { return unsafe; }
function array() { return [] as any[]; }
function unknownArray(): unknown[] { return [] as any[]; }
function generic(): Set<string> { return new Set<any>(); }
const contextual: () => Set<string> = () => new Set<any>();
async function asyncInferred() { return Promise.resolve(unsafe); }
async function asyncExplicit(): Promise<any> { return Promise.resolve(unsafe); }
async function asyncUnknown(): Promise<unknown> { return Promise.resolve(unsafe); }
function nonAsyncPromise() { return Promise.resolve(unsafe); }
function unconstrained<T extends any>(value: T) { return value; }
