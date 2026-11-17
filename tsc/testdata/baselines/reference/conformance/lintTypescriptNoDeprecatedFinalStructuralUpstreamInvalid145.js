//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralUpstreamInvalid145.ts] ////

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

declare namespace JSX {
  interface IntrinsicElements {
    'foo-bar:baz-bam': {
      name: string;
      /**
       * @deprecated
       */
      deprecatedProp: string;
    };
  }
}

const componentDashed = <foo-bar:baz-bam name="e" deprecatedProp="oh no" />;
      

//// [input.tsx]

declare namespace JSX {
  interface IntrinsicElements {
    'foo-bar:baz-bam': {
      name: string;
      /**
       * @deprecated
       */
      deprecatedProp: string;
    };
  }
}

const componentDashed = <foo-bar:baz-bam name="e" deprecatedProp="oh no" />;
      
