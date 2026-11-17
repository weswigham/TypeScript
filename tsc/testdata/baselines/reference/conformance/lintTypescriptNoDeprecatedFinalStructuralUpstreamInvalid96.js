//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralUpstreamInvalid96.ts] ////

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

interface Props {
  /** @deprecated */
  anchor: 'foo';
}
declare const x: [item: Props];
const [{ anchor = 'bar' }] = x;
      

//// [input.tsx]

interface Props {
  /** @deprecated */
  anchor: 'foo';
}
declare const x: [item: Props];
const [{ anchor = 'bar' }] = x;
      
