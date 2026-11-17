//// [tests/cases/conformance/lint/rules/no-generated-empty-object-type/lintTypescriptNoGeneratedEmptyObjectTypeTypedAGeneratedEmptyInterfaceExempt.ts] ////

//// [input.ts]
interface Empty {} type Identity<T> = T; type Other = Identity<Empty>;

//// [input.ts]
interface Empty {} type Identity<T> = T; type Other = Identity<Empty>;
