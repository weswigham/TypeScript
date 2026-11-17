//// [tests/cases/conformance/lint/rules/explicit-member-accessibility/lintTypescriptExplicitMemberAccessibilityTypeScriptSyntaxNoPublicParameterProperty.ts] ////

//// [input.ts]
class Item { constructor(public value: number, public readonly other: number) {} }

//// [input.ts]
class Item { constructor(public value: number, readonly other: number) {} }
