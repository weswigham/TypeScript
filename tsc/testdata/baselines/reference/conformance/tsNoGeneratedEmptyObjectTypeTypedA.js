//// [tests/cases/conformance/lint/rules/no-generated-empty-object-type/tsNoGeneratedEmptyObjectTypeTypedA.ts] ////

//// [input.ts]
type Empty = Pick<{ value: string }, never>;
type EmptyRecord = Record<never, unknown>;
type EmptyIntersection = {} & {};
type Explicit = {};
type Generic<T extends string> = Record<T, unknown>;
interface EmptyInterface<T> {}
type InterfaceAlias = EmptyInterface<string>;

//// [input.ts]
type Empty = Pick<{ value: string }, never>;
type EmptyRecord = Record<never, unknown>;
type EmptyIntersection = {} & {};
type Explicit = {};
type Generic<T extends string> = Record<T, unknown>;
interface EmptyInterface<T> {}
type InterfaceAlias = EmptyInterface<string>;
