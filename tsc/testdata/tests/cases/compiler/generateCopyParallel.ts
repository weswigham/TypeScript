// @generate: true
// @runExternalCode: true
// @currentDirectory: /project

// @Filename: /project/tsconfig.json
{
    "compilerOptions": { "target": "esnext", "module": "esnext", "moduleResolution": "bundler", "declaration": true },
    "files": ["main.ts"],
    "generate": [{
        "inputs": ["first.ts"],
        "outputs": ["generated/first.ts"],
        "command": ["copy", "${inputs}", "generated/first.ts"]
    }, {
        "inputs": ["second.ts"],
        "outputs": ["generated/second.ts"],
        "command": ["copy", "${inputs}", "generated/second.ts"]
    }]
}

// @Filename: /project/first.ts
export const first = 1;

// @Filename: /project/second.ts
export const second = 2;

// @Filename: /project/main.ts
import { first } from "./generated/first";
import { second } from "./generated/second";
export const result = first + second;