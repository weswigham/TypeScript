//// [tests/cases/conformance/lint/rules/prefer-readonly-parameter-types/lintTypescriptPreferReadonlyParameterTypesFinalOwnershipFixtures.ts] ////

//// [input.ts]

interface Cycle { readonly next: Cycle; }
interface MutableCycle { next: MutableCycle; }
interface Methods { run(): void; }
type Brand = string & { readonly tag: unique symbol };
function mutable(value: string[]) {}
function nested(value: readonly string[][]) {}
function shallow(value: Readonly<MutableCycle>) {}
function methods(value: Methods) {}
function recursive(value: Cycle) {}
function immutable(value: readonly [string, readonly number[]]) {}
function branded(value: Brand) {}

//// [input.ts]

interface Cycle { readonly next: Cycle; }
interface MutableCycle { next: MutableCycle; }
interface Methods { run(): void; }
type Brand = string & { readonly tag: unique symbol };
function mutable(value: string[]) {}
function nested(value: readonly string[][]) {}
function shallow(value: Readonly<MutableCycle>) {}
function methods(value: Methods) {}
function recursive(value: Cycle) {}
function immutable(value: readonly [string, readonly number[]]) {}
function branded(value: Brand) {}
