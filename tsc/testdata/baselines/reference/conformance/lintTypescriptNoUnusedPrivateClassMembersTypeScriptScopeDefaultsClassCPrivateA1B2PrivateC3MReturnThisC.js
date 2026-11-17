//// [tests/cases/conformance/lint/rules/no-unused-private-class-members/lintTypescriptNoUnusedPrivateClassMembersTypeScriptScopeDefaultsClassCPrivateA1B2PrivateC3MReturnThisC.ts] ////

//// [input.ts]
class C { private a = 1; #b = 2; private c = 3; m() { return this.c; } }

//// [input.ts]
class C { private a = 1; #b = 2; private c = 3; m() { return this.c; } }
