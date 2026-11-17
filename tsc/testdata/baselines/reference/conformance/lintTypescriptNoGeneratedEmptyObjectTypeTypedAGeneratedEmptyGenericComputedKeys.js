//// [tests/cases/conformance/lint/rules/no-generated-empty-object-type/lintTypescriptNoGeneratedEmptyObjectTypeTypedAGeneratedEmptyGenericComputedKeys.ts] ////

//// [input.ts]
type Keys<T> = T extends object ? keyof T : never; type Generic<T> = { [K in Keys<T>]: K }; type Other<T> = Generic<T>;

//// [input.ts]
type Keys<T> = T extends object ? keyof T : never; type Generic<T> = { [K in Keys<T>]: K }; type Other<T> = Generic<T>;
