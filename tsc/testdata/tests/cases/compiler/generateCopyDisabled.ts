// @runExternalCode: true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "esnext", "moduleResolution": "bundler" },
    "files": ["main.ts"],
    "generate": [{
        "inputs": ["template.ts"],
        "outputs": ["generated/value.ts"],
        "command": ["copy", "${inputs}", "generated/value.ts"]
    }]
}

// @Filename: /project/template.ts
export const value = 42;

// @Filename: /project/generated/value.ts
export const value = 0;

// @Filename: /project/main.ts
import { value } from "./generated/value";
export const result = value;