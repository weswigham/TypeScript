// @lintOnly: true
// @fix: true

// @filename: tsconfig.json
{
    "compilerOptions": {
        "strict": true,
        "target": "esnext",
        "module": "preserve"
    },
    "lint": {
        "rules": {
            "@typescript-eslint/no-namespace": ["error", {
                "allowDeclarations": true
            }]
        }
    },
    "files": ["input.ts"]
}

// @filename: input.ts
namespace Outer.Inner {}
namespace Runtime {
    export const value = 1;
}

declare namespace Ambient {
    namespace Nested {
        interface Value {
            value: string;
        }
    }
}
declare module "coverage-external" {
    export const value: number;
}