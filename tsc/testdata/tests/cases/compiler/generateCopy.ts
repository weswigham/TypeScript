// @generate: true
// @runExternalCode: true
// @incremental: false, true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "compilerOptions": {
        "target": "esnext",
        "module": "esnext",
        "moduleResolution": "bundler",
        "strict": true,
        "declaration": true
    },
    "files": ["main.ts"],
    "generate": [{
        "inputs": ["template.ts"],
        "outputs": ["generated/value.ts"],
        "command": ["copy", "${inputs}", "generated/value.ts"]
    }]
}

// @Filename: /project/template.ts
export const value = 42;

// @Filename: /project/main.ts
import { value } from "./generated/value";
export const result = value.toFixed();