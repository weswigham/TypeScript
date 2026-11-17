//// [tests/cases/conformance/lint/rules/no-unsafe-declaration-merging/tsNoUnsafeDeclarationMergingCoverage.ts] ////

//// [input.ts]
export {};
class Unsafe {}
interface Unsafe { field: string; }
interface Reverse { value: number; }
class Reverse {}
interface Safe { first: string; }
interface Safe { second: number; }
class Namespaced {}
namespace Namespaced { export const value = 1; }
class Separate {}
namespace Nested { export interface Separate { value: string; } }

//// [input.ts]
export {};
class Unsafe {}
interface Unsafe { field: string; }
interface Reverse { value: number; }
class Reverse {}
interface Safe { first: string; }
interface Safe { second: number; }
class Namespaced {}
namespace Namespaced { export const value = 1; }
class Separate {}
namespace Nested { export interface Separate { value: string; } }
