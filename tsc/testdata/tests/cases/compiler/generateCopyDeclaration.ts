// @generate: true
// @runExternalCode: true
// @format: true
// @incremental: false, true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "compilerOptions": {
        "target": "esnext",
        "module": "esnext",
        "moduleResolution": "bundler",
        "declaration": true
    },
    "files": ["main.ts"],
    "generate": [{
        "inputs": ["templates/**/*.d.ts"],
        "outputs": ["generated/**/*.d.ts"],
        "command": ["copy", "templates/value.d.ts", "generated/value.d.ts"]
    }]
}

// @Filename: /project/templates/value.d.ts
export interface Value{value:number;label:string;}

// @Filename: /project/main.ts
import type { Value } from "./generated/value";
export const result: Value = { value: 42, label: "generated" };