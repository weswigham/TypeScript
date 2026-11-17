//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralUpstreamValid47.ts] ////

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

class A {
  a(value: 'b'): void;
  /** @deprecated */
  a(value: 'c'): void;
}
declare const foo: A;
foo.a('b');
    

//// [input.tsx]

class A {
  a(value: 'b'): void;
  /** @deprecated */
  a(value: 'c'): void;
}
declare const foo: A;
foo.a('b');
    
