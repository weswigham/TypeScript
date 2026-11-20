// JSX conversion is adapted from typescript-eslint. See LICENSE.
import {
    AST_NODE_TYPES as N,
    type TSESTree as E,
} from "@typescript-eslint/types";
import * as ts from "../../ast/index.ts";
import { decodeEntities } from "./entities.ts";

type JSXNode = E.JSXTagNameExpression | E.JSXChild | E.JSXAttribute | E.JSXSpreadAttribute | E.JSXOpeningElement | E.JSXClosingElement | E.JSXOpeningFragment | E.JSXClosingFragment | E.JSXEmptyExpression;
type JSXData = { [T in JSXNode["type"]]: Omit<Extract<JSXNode, { type: T; }>, "range" | "loc" | "parent">; }[JSXNode["type"]];
type Guard<T extends E.Node> = (node: E.Node) => node is T;

export interface JSXConverterContext {
    readonly text: string;
    make<T extends JSXData>(native: ts.Node, data: T, start?: number, end?: number): T & E.Node;
    start(node: ts.Node): number;
    fail(node: ts.Node, message: string): never;
    remember(native: ts.Node, result: E.Node): void;
    raw(node: ts.Node): string;
    expression(node: ts.Node): E.Expression;
    checked<T extends E.Node>(native: ts.Node, guard: Guard<T>): T;
    list<T extends E.Node>(nodes: readonly ts.Node[] | undefined, guard: Guard<T>): T[];
    ofType<T extends N>(native: ts.Node, type: T): Extract<E.Node, { type: T; }>;
    typeArguments(node: ts.Node & { readonly typeArguments?: ts.NodeArray<ts.TypeNode>; }): E.TSTypeParameterInstantiation | undefined;
}

function isJSXChild(node: E.Node): node is E.JSXChild {
    return node.type === N.JSXElement || node.type === N.JSXFragment || node.type === N.JSXText
        || node.type === N.JSXExpressionContainer || node.type === N.JSXSpreadChild;
}

function isJSXAttribute(node: E.Node): node is E.JSXAttribute | E.JSXSpreadAttribute {
    return node.type === N.JSXAttribute || node.type === N.JSXSpreadAttribute;
}

function isJSXValue(node: E.Node): node is E.JSXAttribute["value"] & E.Node {
    return node.type === N.Literal && typeof node.value === "string" || node.type === N.JSXExpressionContainer
        || node.type === N.JSXElement || node.type === N.JSXFragment;
}

export class JSXConverter {
    readonly #context: JSXConverterContext;

    constructor(context: JSXConverterContext) {
        this.#context = context;
    }

    private name(node: ts.JsxTagNameExpression): E.JSXTagNameExpression {
        const context = this.#context;
        let result: E.JSXTagNameExpression;
        if (ts.isPropertyAccessExpression(node)) {
            result = context.make(node, {
                type: N.JSXMemberExpression,
                object: this.name(node.expression),
                property: this.identifier(node.name),
            });
        }
        else if (ts.isJsxNamespacedName(node)) {
            result = context.make(node, { type: N.JSXNamespacedName, namespace: this.identifier(node.namespace), name: this.identifier(node.name) });
        }
        else result = this.identifier(node);
        context.remember(node, result);
        return result;
    }

    private identifier(node: ts.Node): E.JSXIdentifier {
        const context = this.#context;
        if (!ts.isIdentifier(node) && node.kind !== ts.SyntaxKind.ThisKeyword) context.fail(node, "Invalid JSX identifier");
        const result = context.make(node, { type: N.JSXIdentifier, name: context.raw(node) });
        context.remember(node, result);
        return result;
    }

    private opening(node: ts.JsxOpeningElement | ts.JsxSelfClosingElement): E.JSXOpeningElement {
        const context = this.#context;
        return context.make(node, {
            type: N.JSXOpeningElement,
            name: this.name(node.tagName),
            selfClosing: node.kind === ts.SyntaxKind.JsxSelfClosingElement,
            attributes: context.list(node.attributes.properties, isJSXAttribute),
            typeArguments: context.typeArguments(node),
        });
    }

    convert(input: ts.Node): E.Node {
        const context = this.#context;
        const K = ts.SyntaxKind;
        switch (input.kind) {
            case K.JsxElement: {
                const node = ts.cast(input, ts.isJsxElement);
                return context.make(node, {
                    type: N.JSXElement,
                    children: context.list(node.children, isJSXChild),
                    openingElement: context.ofType(node.openingElement, N.JSXOpeningElement),
                    closingElement: context.ofType(node.closingElement, N.JSXClosingElement),
                });
            }
            case K.JsxSelfClosingElement: {
                const node = ts.cast(input, ts.isJsxSelfClosingElement);
                return context.make(node, { type: N.JSXElement, children: [], openingElement: this.opening(node), closingElement: null });
            }
            case K.JsxOpeningElement:
                return this.opening(ts.cast(input, ts.isJsxOpeningElement));
            case K.JsxClosingElement: {
                const node = ts.cast(input, ts.isJsxClosingElement);
                return context.make(node, { type: N.JSXClosingElement, name: this.name(node.tagName) });
            }
            case K.JsxFragment: {
                const node = ts.cast(input, ts.isJsxFragment);
                return context.make(node, {
                    type: N.JSXFragment,
                    children: context.list(node.children, isJSXChild),
                    openingFragment: context.ofType(node.openingFragment, N.JSXOpeningFragment),
                    closingFragment: context.ofType(node.closingFragment, N.JSXClosingFragment),
                });
            }
            case K.JsxOpeningFragment:
                return context.make(input, { type: N.JSXOpeningFragment });
            case K.JsxClosingFragment:
                return context.make(input, { type: N.JSXClosingFragment });
            case K.JsxAttribute: {
                const node = ts.cast(input, ts.isJsxAttribute);
                const name = this.name(node.name);
                if (name.type === N.JSXMemberExpression) return context.fail(node, "Invalid JSX attribute name");
                return context.make(node, { type: N.JSXAttribute, name, value: node.initializer ? context.checked(node.initializer, isJSXValue) : null });
            }
            case K.JsxSpreadAttribute: {
                const node = ts.cast(input, ts.isJsxSpreadAttribute);
                return context.make(node, { type: N.JSXSpreadAttribute, argument: context.expression(node.expression) });
            }
            case K.JsxExpression: {
                const node = ts.cast(input, ts.isJsxExpression);
                if (node.dotDotDotToken) {
                    if (!node.expression) return context.fail(node, "Missing JSX spread child expression");
                    return context.make(node, { type: N.JSXSpreadChild, expression: context.expression(node.expression) });
                }
                const expression = node.expression ? context.expression(node.expression)
                    : context.make(node, { type: N.JSXEmptyExpression }, context.start(node) + 1, node.end - 1);
                return context.make(node, { type: N.JSXExpressionContainer, expression });
            }
            case K.JsxText:
            case K.JsxTextAllWhiteSpaces: {
                const raw = context.text.slice(input.pos, input.end);
                return context.make(input, { type: N.JSXText, raw, value: decodeEntities(raw) }, input.pos);
            }
            default:
                return context.fail(input, `Invalid JSX syntax ${K[input.kind]}`);
        }
    }
}
