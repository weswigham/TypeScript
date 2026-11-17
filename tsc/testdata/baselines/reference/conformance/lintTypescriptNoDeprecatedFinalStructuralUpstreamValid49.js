//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralUpstreamValid49.ts] ////

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

type A = {
  (value: 'b'): void;
  /** @deprecated */
  (value: 'c'): void;
};
declare const foo: A;
foo('b');
    

//// [input.tsx]

type A = {
  (value: 'b'): void;
  /** @deprecated */
  (value: 'c'): void;
};
declare const foo: A;
foo('b');
    
