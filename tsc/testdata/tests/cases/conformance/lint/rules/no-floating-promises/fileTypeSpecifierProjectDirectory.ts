// @lintOnly: true
// @fix: true
// @currentDirectory: /outside
// @filename: /project/tsconfig.json
{
    "compilerOptions": { "module": "esnext", "target": "esnext", "strict": true },
    "lint": {
        "rules": {
            "@typescript-eslint/no-floating-promises": [
                "error",
                { "allowForKnownSafePromises": [{ "from": "file", "name": "SafePromise", "path": "types.ts" }] }
            ],
            "@typescript-eslint/only-throw-error": [
                "error",
                { "allow": [{ "from": "file", "name": "AllowedError", "path": "types.ts" }] }
            ],
            "@typescript-eslint/prefer-readonly-parameter-types": [
                "error",
                { "allow": [{ "from": "file", "name": "AllowedParameter", "path": "types.ts" }] }
            ],
            "@typescript-eslint/no-misused-spread": [
                "error",
                { "allow": [{ "from": "file", "name": "AllowedString", "path": "types.ts" }] }
            ]
        }
    },
    "files": ["src/input.ts"]
}
// @filename: /project/types.ts
export type SafePromise = Promise<void> & { brand: true };
export class AllowedError { value = 0; }
export interface AllowedParameter { value: number; }
export type AllowedString = string & { brand: true };
// @filename: /outside/types.ts
export type SafePromise = Promise<void> & { brand: true };
export class AllowedError { value = 0; }
export interface AllowedParameter { value: number; }
export type AllowedString = string & { brand: true };
// @filename: /project/src/input.ts
import { SafePromise, AllowedError, AllowedParameter, AllowedString } from "../types";
import {
    SafePromise as OtherPromise,
    AllowedError as OtherError,
    AllowedParameter as OtherParameter,
    AllowedString as OtherString,
} from "../../outside/types";

declare const safePromise: SafePromise;
declare const otherPromise: OtherPromise;
safePromise;
otherPromise;

function throwAllowed() { throw new AllowedError(); }
function throwOther() { throw new OtherError(); }

function acceptParameters(allowed: AllowedParameter, other: OtherParameter) {}

declare const allowedString: AllowedString;
declare const otherString: OtherString;
const allowedSpread = [...allowedString];
const otherSpread = [...otherString];
