// @lintOnly: true
// @fix: true
// @preserveFileContent: true
// @currentDirectory: /
// Migrated from TestFinalStructuralUpstream/no-deprecated/invalid/93 (invocation 1).
// Upstream source revisions and MIT notices: ../../UPSTREAM-LICENSE.txt.
// @filename: /tsconfig.json
{
    "compilerOptions": {
        "esModuleInterop": true,
        "jsx": "preserve",
        "module": "commonjs",
        "strict": true,
        "target": "esnext"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-deprecated": "error"
        }
    },
    "files": [
        "/input.tsx",
        "/jsx.d.ts"
    ]
}
// @filename: /deprecated.ts
/** @deprecated */
export function deprecatedFunction(): void {}
/** @deprecated Reason */
export type T = { a: string };
export type U = { b: string };
/** @deprecated */
export default { foo: 1 };
// @filename: /jsx.d.ts
declare namespace JSX {
    interface IntrinsicElements { div: AriaAttributes }
    interface AriaAttributes {
        /** @deprecated in ARIA 1.1 */
        "aria-grabbed"?: boolean | "false" | "true";
    }
}
// @filename: /input.tsx

namespace A {
  /** @deprecated */
  export type B = string;
  export type C = string;
  export type D = string;
}

export type D = A.B | A.C | A.D;
      