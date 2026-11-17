//// [tests/cases/conformance/lint/rules/no-deprecated/lintTypescriptNoDeprecatedFinalStructuralUpstreamValid51.ts] ////

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

namespace assert {
  export function fail(message?: string | Error): never;
  /** @deprecated since v10.0.0 - use fail([message]) or other assert functions instead. */
  export function fail(actual: unknown, expected: unknown): never;
}

assert.fail('');
    

//// [input.tsx]

namespace assert {
  export function fail(message?: string | Error): never;
  /** @deprecated since v10.0.0 - use fail([message]) or other assert functions instead. */
  export function fail(actual: unknown, expected: unknown): never;
}

assert.fail('');
    
