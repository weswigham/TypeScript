//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralUpstreamValid58.ts] ////

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

namespace A {
  /** @deprecated */
  export type B = string;
  export type C = string;
  export type D = string;
}

export type D = A.C | A.D;
    

//// [input.tsx]

namespace A {
  /** @deprecated */
  export type B = string;
  export type C = string;
  export type D = string;
}

export type D = A.C | A.D;
    
