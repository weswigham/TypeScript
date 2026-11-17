//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralMixedEnumsNamespaceNEnumEANamespaceNEnumEBB.ts] ////

//// [input.ts]
namespace N { enum E { A } } namespace N { enum E { B = 'b' } }

//// [input.ts]
namespace N { enum E { A } } namespace N { enum E { B = 'b' } }
