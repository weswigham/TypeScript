//// [tests/cases/conformance/lint/rules/no-empty-object-type/noEmptyObjectType.ts] ////

//// [input.ts]
interface Empty {}
interface Parent { value: string }
interface Derived<T> extends Parent {}
interface Multiple extends Parent, Empty {}
type EmptyAlias = {};
type Union<T> = T | {};
type NonNullable<T> = T & {};
type Parenthesized<T> = T & ({});
type Nested<T> = T & { property: {} };
interface Merged {}
interface Merged { value: number }
interface WithClass extends Parent {}
class WithClass {}
export interface Exported {}
export default interface DefaultExport {}
function inner() {
    interface Empty { value: number }
}

//// [input.ts]
interface Empty {}
interface Parent { value: string }
interface Derived<T> extends Parent {}
interface Multiple extends Parent, Empty {}
type EmptyAlias = {};
type Union<T> = T | {};
type NonNullable<T> = T & {};
type Parenthesized<T> = T & ({});
type Nested<T> = T & { property: {} };
interface Merged {}
interface Merged { value: number }
interface WithClass extends Parent {}
class WithClass {}
export interface Exported {}
export default interface DefaultExport {}
function inner() {
    interface Empty { value: number }
}
