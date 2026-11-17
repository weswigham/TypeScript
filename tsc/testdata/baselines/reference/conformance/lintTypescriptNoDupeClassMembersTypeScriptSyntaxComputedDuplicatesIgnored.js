//// [tests/cases/conformance/lint/rules/no-dupe-class-members/lintTypescriptNoDupeClassMembersTypeScriptSyntaxComputedDuplicatesIgnored.ts] ////

//// [input.ts]
class Item { value() {} ['value']() {} value() {} }

//// [input.ts]
class Item { value() {} ['value']() {} value() {} }
