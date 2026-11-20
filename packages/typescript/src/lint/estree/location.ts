import type { TSESTree } from "@typescript-eslint/types";
import type { SourceFile } from "../../ast/index.ts";

const sourceFileKey: unique symbol = Symbol("sourceFile");
const offsetKey: unique symbol = Symbol("offset");
const locations = new WeakMap<Located, TSESTree.SourceLocation>();

function getLocation(this: Located): TSESTree.SourceLocation {
    let location = locations.get(this);
    if (!location) {
        const sourceFile = this[sourceFileKey];
        const offset = this[offsetKey];
        const start = sourceFile.getLineAndCharacterOfPosition(this.range[0] + offset);
        const end = sourceFile.getLineAndCharacterOfPosition(this.range[1] + offset);
        location = {
            start: { line: start.line + 1, column: start.character - (start.line === 0 ? offset : 0) },
            end: { line: end.line + 1, column: end.character - (end.line === 0 ? offset : 0) },
        };
        locations.set(this, location);
    }
    return location;
}

function setLocation(this: Located, value: TSESTree.SourceLocation): void {
    locations.set(this, value);
}

const locationDescriptor: PropertyDescriptor = {
    configurable: true,
    enumerable: true,
    get: getLocation,
    set: setLocation,
};

/** All nodes, tokens, and comments share these accessors, not captured closures. */
export interface Located {
    [sourceFileKey]: SourceFile;
    [offsetKey]: number;
}

export class Located {
    declare loc: TSESTree.SourceLocation;
    declare range: TSESTree.Range;

    private constructor() {}

    static create<T extends object>(data: T, sourceFile: SourceFile, start: number, end: number, offset = 0): T & Located {
        // Keep the literal's shape instead of copying every field to another object.
        const result = data as T & Located;
        result[sourceFileKey] = sourceFile;
        result[offsetKey] = offset;
        result.range = [Math.max(0, start - offset), Math.max(0, end - offset)];
        Object.defineProperty(result, "loc", locationDescriptor);
        return result;
    }
}

/** Native scanner positions retain the BOM; ESLint's SourceCode positions do not. */
export function nativeRange(node: { range: TSESTree.Range; }): TSESTree.Range {
    const offset = (node as Located)[offsetKey] ?? 0;
    return offset ? [node.range[0] + offset, node.range[1] + offset] : node.range;
}
