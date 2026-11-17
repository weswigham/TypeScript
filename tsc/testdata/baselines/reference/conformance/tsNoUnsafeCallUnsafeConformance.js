//// [tests/cases/conformance/lint/rules/no-unsafe-call/tsNoUnsafeCallUnsafeConformance.ts] ////

//// [input.ts]
declare const unsafe: any;
declare const broad: Function;
declare const safe: () => void;
interface Callable extends Function { (): string; }
interface VoidCallable extends Function { (): void; }
declare const callable: Callable;
declare const voidCallable: VoidCallable;
unsafe();
unsafe?.();
new unsafe();
unsafe`text`;
broad();
new voidCallable();
new callable();
safe();
missing();
function generic<T extends any>(value: T) { value(); }

//// [input.ts]
declare const unsafe: any;
declare const broad: Function;
declare const safe: () => void;
interface Callable extends Function { (): string; }
interface VoidCallable extends Function { (): void; }
declare const callable: Callable;
declare const voidCallable: VoidCallable;
unsafe();
unsafe?.();
new unsafe();
unsafe`text`;
broad();
new voidCallable();
new callable();
safe();
missing();
function generic<T extends any>(value: T) { value(); }
