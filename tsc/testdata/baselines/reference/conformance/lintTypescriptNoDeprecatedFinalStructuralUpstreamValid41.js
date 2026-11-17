//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralUpstreamValid41.ts] ////

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

function a(value: 'b' | undefined): void;
/** @deprecated */
function a(value: 'c' | undefined): void;
function a(value: string | undefined): void {
  // ...
}

export default a('b');
    

//// [input.tsx]

function a(value: 'b' | undefined): void;
/** @deprecated */
function a(value: 'c' | undefined): void;
function a(value: string | undefined): void {
  // ...
}

export default a('b');
    
