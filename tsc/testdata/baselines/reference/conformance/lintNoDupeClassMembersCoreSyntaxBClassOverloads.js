//// [tests/cases/conformance/lint/rules/no-dupe-class-members/lintNoDupeClassMembersCoreSyntaxBClassOverloads.ts] ////

//// [input.ts]
class Item { method(value: string): void; method(value: any) {} constructor() {} ['constructor']() {} }

//// [input.ts]
class Item { method(value: string): void; method(value: any) {} constructor() {} ['constructor']() {} }
