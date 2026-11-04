// @generate: true
// @runExternalCode: true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "compilerOptions": {
        "target": "esnext",
        "module": "esnext",
        "moduleResolution": "bundler",
        "noEmitOnError": true
    },
    "files": ["main.ts"],
    "generate": [{
        "inputs": ["template.ts"],
        "outputs": ["generated/value.ts"],
        "command": ["copy", "${inputs}", "generated/value.ts"]
    }]
}

// @Filename: /project/template.ts
export const value: number = "generated type error";

// @Filename: /project/main.ts
import { value } from "./generated/value";
export const result = value;