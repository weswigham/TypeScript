import {
    AST_NODE_TYPES as N,
    type TSESTree as E,
} from "@typescript-eslint/types";

type WithAssertions = E.ImportDeclaration | E.ExportAllDeclaration | E.ExportNamedDeclaration;

function getAssertions(this: WithAssertions): E.ImportAttribute[] {
    return this.attributes;
}

function setAssertions(this: WithAssertions, value: E.ImportAttribute[]): void {
    Object.defineProperty(this, "assertions", { configurable: true, enumerable: true, writable: true, value });
}

function getImportAttributes(this: E.ImportExpression): E.Expression | null {
    return this.options;
}

function setImportAttributes(this: E.ImportExpression, value: E.Expression | null): void {
    Object.defineProperty(this, "attributes", { configurable: true, enumerable: true, writable: true, value });
}

function getEnumMembers(this: E.TSEnumDeclaration): E.TSEnumMember[] {
    return this.body.members;
}

function setEnumMembers(this: E.TSEnumDeclaration, value: E.TSEnumMember[]): void {
    Object.defineProperty(this, "members", { configurable: true, enumerable: true, writable: true, value });
}

const assertions: PropertyDescriptor = { configurable: true, get: getAssertions, set: setAssertions };
const importAttributes: PropertyDescriptor = { configurable: true, get: getImportAttributes, set: setImportAttributes };
const enumMembers: PropertyDescriptor = { configurable: true, get: getEnumMembers, set: setEnumMembers };

export function addDeprecatedAliases(node: E.Node): void {
    switch (node.type) {
        case N.ImportDeclaration:
        case N.ExportNamedDeclaration:
        case N.ExportAllDeclaration:
            Object.defineProperty(node, "assertions", assertions);
            break;
        case N.ImportExpression:
            Object.defineProperty(node, "attributes", importAttributes);
            break;
        case N.TSEnumDeclaration:
            Object.defineProperty(node, "members", enumMembers);
            break;
    }
}
