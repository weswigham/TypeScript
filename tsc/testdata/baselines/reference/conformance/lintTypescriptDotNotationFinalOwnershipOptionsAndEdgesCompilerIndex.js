//// [tests/cases/conformance/lint/rules/dot-notation/lintTypescriptDotNotationFinalOwnershipOptionsAndEdgesCompilerIndex.ts] ////

//// [input.ts]
declare const object: { fixed: number; [key: `extra${string}`]: number }; object['extraValue']; object['fixed'];

//// [input.ts]
declare const object: { fixed: number; [key: `extra${string}`]: number }; object['extraValue']; object.fixed;
