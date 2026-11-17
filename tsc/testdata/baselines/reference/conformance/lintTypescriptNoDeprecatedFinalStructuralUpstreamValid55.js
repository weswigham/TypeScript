//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralUpstreamValid55.ts] ////

//// [deprecated.ts]
/** @deprecated */
export function deprecatedFunction(): void {}
/** @deprecated Reason */
export type T = { a: string };
export type U = { b: string };
/** @deprecated */
export default { foo: 1 };
//// [jsx.d.ts]
declare namespace JSX {
    interface IntrinsicElements { div: AriaAttributes }
    interface AriaAttributes {
        /** @deprecated in ARIA 1.1 */
        "aria-grabbed"?: boolean | "false" | "true";
    }
}
//// [input.tsx]

export {
  /** @deprecated Use ts directly. */
  default as ts,
} from 'typescript';
    

//// [input.tsx]

export {
  /** @deprecated Use ts directly. */
  default as ts,
} from 'typescript';
    
