//// [tests/cases/conformance/lint/rules/prefer-namespace-keyword/tsPreferNamespaceKeywordCoverage.ts] ////

//// [input.ts]
// @ts-ignore: exercise the lint rule for legacy module declarations.
declare module Legacy {
    interface Shape { size: number; }
}

declare namespace Modern {
    interface Shape { size: number; }
}

declare module "external-package" {
    export interface Shape { size: number; }
}

//// [input.ts]
// @ts-ignore: exercise the lint rule for legacy module declarations.
declare namespace Legacy {
    interface Shape { size: number; }
}

declare namespace Modern {
    interface Shape { size: number; }
}

declare module "external-package" {
    export interface Shape { size: number; }
}
