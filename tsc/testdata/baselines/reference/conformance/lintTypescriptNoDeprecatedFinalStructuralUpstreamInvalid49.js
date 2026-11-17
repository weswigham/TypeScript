//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralUpstreamInvalid49.ts] ////

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

declare class A {
  /** @deprecated */
  computed(): string;
}

declare const a: A;
const k1 = 'comp';
const k2 = 'uted';

a[`${k1}${k2}`];
      

//// [input.tsx]

declare class A {
  /** @deprecated */
  computed(): string;
}

declare const a: A;
const k1 = 'comp';
const k2 = 'uted';

a[`${k1}${k2}`];
      
