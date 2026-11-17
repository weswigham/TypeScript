//// [tests/cases/conformance/lint/rules/no-mixed-enums/lintTypescriptNoMixedEnumsFinalStructuralMixedEnumsNamespaceNExportEnumEANamespaceNExportEnumEBB.ts] ////

//// [input.ts]
namespace N { export enum E { A } } namespace N { export enum E { B = 'b' } }

//// [input.ts]
namespace N { export enum E { A } } namespace N { export enum E { B = 'b' } }
