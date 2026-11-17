//// [tests/cases/conformance/lint/rules/explicit-member-accessibility/lintTypescriptExplicitMemberAccessibilityTypeScriptSyntaxNoPublicPreservesComments.ts] ////

//// [input.ts]
class Item { public /* keep */ value = 1; }

//// [input.ts]
class Item { /* keep */ value = 1; }
