/*!
 * Syntax conversion adapted from typescript-eslint v8.73.0:
 * https://github.com/typescript-eslint/typescript-eslint/tree/v8.73.0/packages/typescript-estree
 *
 * MIT License
 *
 * Copyright (c) 2019 typescript-eslint and other contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import {
    AST_NODE_TYPES as N,
    type TSESTree as E,
} from "@typescript-eslint/types";
import { visitorKeys } from "@typescript-eslint/visitor-keys";
import * as ts from "../../ast/index.ts";
import { modifierToFlag } from "../../ast/modifiers.ts";
import { addDeprecatedAliases } from "./aliases.ts";
import { JSXConverter } from "./converter-jsx.ts";
import { decodeEntities } from "./entities.ts";
import {
    type AssignmentTarget,
    hasType,
    isAssignmentTarget,
    isBinding,
    isClassElement,
    isExpression,
    isParameter,
    isPatternProperty,
    isProperty,
    isStatement,
    isType,
    isTypeElement,
} from "./guards.ts";
import { LexicalData } from "./lexical.ts";
import {
    Located,
    nativeRange,
} from "./location.ts";

type DeprecatedKeys<T> = T extends E.ImportDeclaration | E.ExportAllDeclaration | E.ExportNamedDeclaration ? "assertions"
    : T extends E.ImportExpression ? "attributes"
    : T extends E.TSImportType ? "argument"
    : T extends E.TSMappedType ? "typeParameter"
    : T extends E.TSEnumDeclaration ? "members"
    : T extends E.TSEnumMember ? "computed"
    : never;
type SyntaxData<T extends N> = Omit<Extract<E.Node, { type: T; }>, "range" | "loc" | "parent" | DeprecatedKeys<Extract<E.Node, { type: T; }>>>;
// Valid parser output is wider than ast-spec in some TS assignment/name positions.
type DataFor<T extends N> = T extends N.ClassDeclaration | N.ClassExpression ? Omit<SyntaxData<T>, "superClass"> & { superClass: E.Expression | null; }
    : T extends N.AssignmentPattern ? Omit<SyntaxData<T>, "left"> & { left: AssignmentTarget; }
    : T extends N.ArrayPattern ? Omit<SyntaxData<T>, "elements"> & { elements: (E.DestructuringPattern | AssignmentTarget | null)[]; }
    : T extends N.RestElement ? Omit<SyntaxData<T>, "argument"> & { argument: E.DestructuringPattern | AssignmentTarget; }
    : T extends N.AccessorProperty ? Omit<SyntaxData<T>, "key"> & { key: E.Expression | E.PrivateIdentifier; }
    : T extends N.ExportAllDeclaration ? Omit<SyntaxData<T>, "exported"> & { exported: E.Identifier | E.StringLiteral | null; }
    : T extends N.TSModuleDeclaration ? Omit<SyntaxData<T>, "id"> & { id: E.Identifier | E.StringLiteral | E.TSQualifiedName; }
    : T extends N.TSQualifiedName ? Omit<SyntaxData<T>, "right"> & { right: E.Identifier | E.PrivateIdentifier; }
    : SyntaxData<T>;
type Data = { [T in N]: DataFor<T>; }[N];
type Guard<T extends E.Node> = (node: E.Node) => node is T;
type Method = ts.MethodDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration | ts.ConstructorDeclaration;
type PublicName = { computed: true; key: E.Expression; } | { computed: false; key: E.Identifier | E.StringLiteral | E.NumberLiteral; };
type ClassName = PublicName | { computed: false; key: E.PrivateIdentifier; };
const K = ts.SyntaxKind;

function isNode(value: unknown): value is E.Node {
    return !!value && typeof value === "object" && "type" in value && typeof value.type === "string" && Object.hasOwn(visitorKeys, value.type);
}

function isIdentifier(node: E.Node): node is E.Identifier {
    return node.type === N.Identifier;
}

function isTypeName(node: E.Node): node is E.Identifier | E.TSQualifiedName {
    return node.type === N.Identifier || node.type === N.TSQualifiedName;
}

function isModuleName(node: E.Node): node is E.Identifier | E.StringLiteral {
    return node.type === N.Identifier || node.type === N.Literal && typeof node.value === "string";
}

function isArgument(node: E.Node): node is E.Expression | E.SpreadElement {
    return isExpression(node) || node.type === N.SpreadElement;
}

function isPatternElement(node: E.Node): node is AssignmentTarget | E.AssignmentPattern | E.RestElement {
    return isAssignmentTarget(node) || node.type === N.AssignmentPattern || node.type === N.RestElement;
}

export class Converter {
    readonly esTreeNodeToTSNodeMap: WeakMap<E.Node, ts.Node> = new WeakMap();
    readonly tsNodeToESTreeNodeMap: WeakMap<ts.Node, E.Node> = new WeakMap();
    readonly #sourceFile: ts.SourceFile;
    readonly #lexical: LexicalData;
    readonly #offset: number;
    readonly #modifierFlags = new WeakMap<ts.Node, ts.ModifierFlags>();
    readonly #parentDescriptor: PropertyDescriptor = { configurable: true, writable: true, value: undefined };
    #jsx: JSXConverter | undefined;

    constructor(sourceFile: ts.SourceFile, stripBOM = false) {
        this.#sourceFile = sourceFile;
        this.#offset = stripBOM && sourceFile.text.charCodeAt(0) === 0xFEFF ? 1 : 0;
        this.#lexical = new LexicalData(sourceFile, this.#offset);
    }

    program(): E.Program {
        const program = this.ofType(this.#sourceFile, N.Program);
        this.linkParents(program);
        return program;
    }

    private make<T extends Data>(native: ts.Node, data: T, start = this.start(native), end = native.end): Located & T & E.Node {
        // Data checks every syntax field; parent links are installed once the tree is complete.
        const result = Located.create(data, this.#sourceFile, start, end, this.#offset) as Located & T & E.Node;
        addDeprecatedAliases(result);
        this.esTreeNodeToTSNodeMap.set(result, native);
        return result;
    }

    private start(node: ts.Node): number {
        return this.#lexical.start(node);
    }

    private fail(node: ts.Node, message: string): never {
        throw this.#lexical.error(this.start(node), message);
    }

    private remember(native: ts.Node, result: E.Node): void {
        if (!this.tsNodeToESTreeNodeMap.has(native)) this.tsNodeToESTreeNodeMap.set(native, result);
    }

    private linkParents(node: E.Node): void {
        const keys = visitorKeys[node.type];
        if (!keys) throw new Error(`Missing ESTree visitor keys for ${node.type}`);
        for (const key of keys) {
            const value: unknown = Reflect.get(node, key);
            if (Array.isArray(value)) {
                for (const child of value) if (isNode(child)) this.linkParent(node, child);
            }
            else if (isNode(value)) this.linkParent(node, value);
        }
    }

    private linkParent(parent: E.Node, child: E.Node): void {
        this.#parentDescriptor.value = parent;
        Object.defineProperty(child, "parent", this.#parentDescriptor);
        this.linkParents(child);
    }

    private checked<T extends E.Node>(native: ts.Node, guard: Guard<T>, pattern = false): T {
        const result = this.convert(native, pattern);
        if (!result || !guard(result)) this.fail(native, `Unexpected node in ${pattern ? "pattern" : "syntax"} position`);
        return result;
    }

    private ofType<T extends N>(native: ts.Node, type: T): Extract<E.Node, { type: T; }> {
        const result = this.convert(native);
        if (!result || !hasType(result, type)) this.fail(native, `Expected ${type}`);
        return result;
    }

    private list<T extends E.Node>(nodes: readonly ts.Node[] | undefined, guard: Guard<T>, pattern = false): T[] {
        const result: T[] = [];
        if (nodes) { for (const node of nodes) result.push(this.checked(node, guard, pattern)); }
        return result;
    }

    private expression(node: ts.Node): E.Expression {
        return this.checked(node, isExpression);
    }

    private nullableExpression(node: ts.Node | undefined): E.Expression | null {
        return node ? this.expression(node) : null;
    }

    private type(node: ts.Node): E.TypeNode {
        return this.checked(node, isType);
    }

    private statement(node: ts.Node): E.Statement {
        return this.checked(node, isStatement);
    }

    private identifier(node: ts.Node): E.Identifier {
        return this.checked(node, isIdentifier);
    }

    private binding(node: ts.Node): E.BindingName {
        return this.checked(node, isBinding, true);
    }

    private body(nodes: readonly ts.Statement[], directives: boolean): E.Statement[] {
        const result: E.Statement[] = [];
        for (const node of nodes) {
            if (node.flags & ts.NodeFlags.Reparsed) continue;
            const statement = this.statement(node);
            if (directives && statement.type === N.ExpressionStatement && ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression)) {
                statement.directive = this.#sourceFile.text.slice(this.start(node.expression) + 1, node.expression.end - 1);
            }
            else directives = false;
            result.push(statement);
        }
        return result;
    }

    private convert(node: ts.Node, pattern = false): E.Node | null {
        const result = this.convertNode(node, pattern);
        if (result) this.remember(node, result);
        return result;
    }

    private convertNode(input: ts.Node, pattern: boolean): E.Node | null {
        switch (input.kind) {
            case K.SourceFile: {
                const node = ts.cast(input, ts.isSourceFile);
                const body = this.body(node.statements, true);
                if (!body.length && this.#lexical.tokens.length) this.fail(node, "Native syntax has no convertible statements");
                return this.make(
                    node,
                    {
                        type: N.Program,
                        body,
                        sourceType: node.externalModuleIndicator ? "module" : "script",
                        tokens: this.#lexical.tokens,
                        comments: this.#lexical.comments,
                    },
                    0,
                    node.text.length,
                );
            }
            case K.Block: {
                const node = ts.cast(input, ts.isBlock);
                return this.make(node, { type: N.BlockStatement, body: this.body(node.statements, ts.isFunctionLikeDeclaration(node.parent)) });
            }
            case K.ModuleBlock: {
                const node = ts.cast(input, ts.isModuleBlock);
                return this.make(node, { type: N.TSModuleBlock, body: this.body(node.statements, true) });
            }
            case K.Identifier: {
                const node = ts.cast(input, ts.isIdentifier);
                const start = this.start(node);
                const text = this.#lexical.identifierText(node, start);
                if (text === "this" && this.inTypeQuery(node)) return this.make(node, { type: N.ThisExpression });
                if (!text) this.fail(node, "Missing identifier");
                return this.make(node, { type: N.Identifier, name: text, decorators: [], optional: false, typeAnnotation: undefined }, start);
            }
            case K.PrivateIdentifier: {
                const node = ts.cast(input, ts.isPrivateIdentifier);
                return this.make(node, { type: N.PrivateIdentifier, name: node.text.slice(1) });
            }
            case K.EmptyStatement:
                return this.make(input, { type: N.EmptyStatement });
            case K.DebuggerStatement:
                return this.make(input, { type: N.DebuggerStatement });
            case K.ThisKeyword:
                return this.make(input, { type: N.ThisExpression });
            case K.SuperKeyword:
                return this.make(input, { type: N.Super });
            case K.ExpressionStatement: {
                const node = ts.cast(input, ts.isExpressionStatement);
                return this.make(node, { type: N.ExpressionStatement, expression: this.expression(node.expression), directive: undefined });
            }
            case K.ReturnStatement: {
                const node = ts.cast(input, ts.isReturnStatement);
                return this.make(node, { type: N.ReturnStatement, argument: this.nullableExpression(node.expression) });
            }
            case K.ThrowStatement: {
                const node = ts.cast(input, ts.isThrowStatement);
                return this.make(node, { type: N.ThrowStatement, argument: this.expression(node.expression) });
            }
            case K.BreakStatement: {
                const node = ts.cast(input, ts.isBreakStatement);
                return this.make(node, { type: N.BreakStatement, label: node.label ? this.identifier(node.label) : null });
            }
            case K.ContinueStatement: {
                const node = ts.cast(input, ts.isContinueStatement);
                return this.make(node, { type: N.ContinueStatement, label: node.label ? this.identifier(node.label) : null });
            }
            case K.LabeledStatement: {
                const node = ts.cast(input, ts.isLabeledStatement);
                return this.make(node, { type: N.LabeledStatement, label: this.identifier(node.label), body: this.statement(node.statement) });
            }
            case K.WithStatement: {
                const node = ts.cast(input, ts.isWithStatement);
                return this.make(node, { type: N.WithStatement, object: this.expression(node.expression), body: this.statement(node.statement) });
            }
            case K.IfStatement: {
                const node = ts.cast(input, ts.isIfStatement);
                return this.make(node, {
                    type: N.IfStatement,
                    test: this.expression(node.expression),
                    consequent: this.statement(node.thenStatement),
                    alternate: node.elseStatement ? this.statement(node.elseStatement) : null,
                });
            }
            case K.WhileStatement: {
                const node = ts.cast(input, ts.isWhileStatement);
                return this.make(node, { type: N.WhileStatement, test: this.expression(node.expression), body: this.statement(node.statement) });
            }
            case K.DoStatement: {
                const node = ts.cast(input, ts.isDoStatement);
                return this.make(node, { type: N.DoWhileStatement, test: this.expression(node.expression), body: this.statement(node.statement) });
            }
            case K.ForStatement: {
                const node = ts.cast(input, ts.isForStatement);
                return this.make(node, {
                    type: N.ForStatement,
                    init: node.initializer ? this.forInitializer(node.initializer) : null,
                    test: this.nullableExpression(node.condition),
                    update: this.nullableExpression(node.incrementor),
                    body: this.statement(node.statement),
                });
            }
            case K.ForInStatement: {
                const node = ts.cast(input, ts.isForInStatement);
                return this.make(node, {
                    type: N.ForInStatement,
                    left: this.forInLeft(node.initializer),
                    right: this.expression(node.expression),
                    body: this.statement(node.statement),
                });
            }
            case K.ForOfStatement: {
                const node = ts.cast(input, ts.isForOfStatement);
                return this.make(node, {
                    type: N.ForOfStatement,
                    await: !!node.awaitModifier,
                    left: this.forLeft(node.initializer),
                    right: this.expression(node.expression),
                    body: this.statement(node.statement),
                });
            }
            case K.SwitchStatement: {
                const node = ts.cast(input, ts.isSwitchStatement);
                const cases: E.SwitchCase[] = [];
                for (const clause of node.caseBlock.clauses) cases.push(this.ofType(clause, N.SwitchCase));
                return this.make(node, { type: N.SwitchStatement, discriminant: this.expression(node.expression), cases });
            }
            case K.CaseClause: {
                const node = ts.cast(input, ts.isCaseClause);
                return this.make(node, { type: N.SwitchCase, test: this.expression(node.expression), consequent: this.body(node.statements, false) });
            }
            case K.DefaultClause: {
                const node = ts.cast(input, ts.isDefaultClause);
                return this.make(node, { type: N.SwitchCase, test: null, consequent: this.body(node.statements, false) });
            }
            case K.TryStatement: {
                const node = ts.cast(input, ts.isTryStatement);
                return this.make(node, {
                    type: N.TryStatement,
                    block: this.ofType(node.tryBlock, N.BlockStatement),
                    handler: node.catchClause ? this.ofType(node.catchClause, N.CatchClause) : null,
                    finalizer: node.finallyBlock ? this.ofType(node.finallyBlock, N.BlockStatement) : null,
                });
            }
            case K.CatchClause: {
                const node = ts.cast(input, ts.isCatchClause);
                return this.make(node, {
                    type: N.CatchClause,
                    body: this.ofType(node.block, N.BlockStatement),
                    param: node.variableDeclaration ? this.annotatedBinding(node.variableDeclaration.name, node.variableDeclaration.type) : null,
                });
            }
            case K.VariableStatement: {
                const node = ts.cast(input, ts.isVariableStatement);
                return this.exports(node, this.variableList(node.declarationList, node));
            }
            case K.VariableDeclarationList:
                return this.variableList(ts.cast(input, ts.isVariableDeclarationList));
            case K.VariableDeclaration: {
                const node = ts.cast(input, ts.isVariableDeclaration);
                if (node.exclamationToken && (node.initializer || !ts.isIdentifier(node.name) || !this.sourceNode(node.type))) this.fail(node, "Invalid definite assignment declaration");
                return this.make(node, {
                    type: N.VariableDeclarator,
                    definite: !!node.exclamationToken,
                    id: this.annotatedBinding(node.name, node.type),
                    init: this.nullableExpression(node.initializer),
                });
            }
            case K.FunctionDeclaration:
            case K.FunctionExpression:
            case K.ArrowFunction:
                return this.functionNode(input);
            case K.Parameter:
                return this.parameter(ts.cast(input, ts.isParameterDeclaration));
            case K.BindingElement:
                return this.bindingElement(ts.cast(input, ts.isBindingElement));
            case K.ArrayBindingPattern: {
                const node = ts.cast(input, ts.isArrayBindingPattern);
                return this.arrayPattern(node, node.elements);
            }
            case K.ObjectBindingPattern: {
                const node = ts.cast(input, ts.isObjectBindingPattern);
                return this.make(node, {
                    type: N.ObjectPattern,
                    decorators: [],
                    optional: false,
                    typeAnnotation: undefined,
                    properties: this.list(node.elements, isPatternProperty, true),
                });
            }
            case K.OmittedExpression:
                return null;
            case K.ArrayLiteralExpression: {
                const node = ts.cast(input, ts.isArrayLiteralExpression);
                if (pattern) return this.arrayPattern(node, node.elements);
                const elements: (E.Expression | E.SpreadElement | null)[] = [];
                for (const element of node.elements) elements.push(element.kind === K.OmittedExpression ? null : this.checked(element, isArgument));
                return this.make(node, { type: N.ArrayExpression, elements });
            }
            case K.ObjectLiteralExpression: {
                const node = ts.cast(input, ts.isObjectLiteralExpression);
                if (pattern) {
                    return this.make(node, {
                        type: N.ObjectPattern,
                        decorators: [],
                        optional: false,
                        typeAnnotation: undefined,
                        properties: this.list(node.properties, isPatternProperty, true),
                    });
                }
                return this.make(node, { type: N.ObjectExpression, properties: this.list(node.properties, isProperty) });
            }
            case K.PropertyAssignment: {
                const node = ts.cast(input, ts.isPropertyAssignment);
                if (this.sourceNode(node.type) || this.sourceNode(node.postfixToken)) this.fail(node, "Invalid object property annotation");
                const value = pattern ? this.checked(node.initializer, isPatternElement, true) : this.expression(node.initializer);
                if (value.type === N.RestElement) this.fail(node, "Invalid property binding");
                return this.property(node, this.key(node.name), value, false, ts.isComputedPropertyName(node.name));
            }
            case K.ShorthandPropertyAssignment: {
                const node = ts.cast(input, ts.isShorthandPropertyAssignment);
                if (this.sourceNode(node.type) || this.sourceNode(node.postfixToken)) this.fail(node, "Invalid shorthand property annotation");
                const value = node.objectAssignmentInitializer
                    ? this.make(node, {
                        type: N.AssignmentPattern,
                        decorators: [],
                        optional: false,
                        typeAnnotation: undefined,
                        left: this.binding(node.name),
                        right: this.expression(node.objectAssignmentInitializer),
                    })
                    : this.identifier(node.name);
                return this.property(node, this.key(node.name), value, true, false);
            }
            case K.ComputedPropertyName:
                return this.expression(ts.cast(input, ts.isComputedPropertyName).expression);
            case K.SpreadElement:
            case K.SpreadAssignment: {
                const node = ts.isSpreadElement(input) ? input : ts.cast(input, ts.isSpreadAssignment);
                if (pattern) {
                    return this.make(node, {
                        type: N.RestElement,
                        argument: this.checked(node.expression, isPatternElement, true),
                        decorators: [],
                        optional: false,
                        typeAnnotation: undefined,
                        value: undefined,
                    });
                }
                return this.make(node, { type: N.SpreadElement, argument: this.expression(node.expression) });
            }
            case K.ParenthesizedExpression:
                return this.convert(ts.cast(input, ts.isParenthesizedExpression).expression, pattern);
            case K.ParenthesizedType:
                return this.type(ts.cast(input, ts.isParenthesizedTypeNode).type);
            case K.BinaryExpression:
                return this.binary(ts.cast(input, ts.isBinaryExpression), pattern);
            case K.PrefixUnaryExpression:
            case K.PostfixUnaryExpression:
                return this.unary(input);
            case K.DeleteExpression:
                return this.make(input, { type: N.UnaryExpression, argument: this.expression(ts.cast(input, ts.isDeleteExpression).expression), operator: "delete", prefix: true });
            case K.TypeOfExpression:
                return this.make(input, { type: N.UnaryExpression, argument: this.expression(ts.cast(input, ts.isTypeOfExpression).expression), operator: "typeof", prefix: true });
            case K.VoidExpression:
                return this.make(input, { type: N.UnaryExpression, argument: this.expression(ts.cast(input, ts.isVoidExpression).expression), operator: "void", prefix: true });
            case K.AwaitExpression:
                return this.make(input, { type: N.AwaitExpression, argument: this.expression(ts.cast(input, ts.isAwaitExpression).expression) });
            case K.YieldExpression: {
                const node = ts.cast(input, ts.isYieldExpression);
                if (node.asteriskToken && !node.expression) this.fail(node, "Delegated yield requires an expression");
                return this.make(node, { type: N.YieldExpression, argument: this.nullableExpression(node.expression), delegate: !!node.asteriskToken });
            }
            case K.ConditionalExpression: {
                const node = ts.cast(input, ts.isConditionalExpression);
                return this.make(node, { type: N.ConditionalExpression, test: this.expression(node.condition), consequent: this.expression(node.whenTrue), alternate: this.expression(node.whenFalse) });
            }
            case K.PropertyAccessExpression: {
                const node = ts.cast(input, ts.isPropertyAccessExpression);
                const result = this.make(node, {
                    type: N.MemberExpression,
                    object: this.expression(node.expression),
                    property: this.memberName(node.name),
                    computed: false,
                    optional: !!node.questionDotToken,
                });
                return this.chain(node, result);
            }
            case K.ElementAccessExpression: {
                const node = ts.cast(input, ts.isElementAccessExpression);
                return this.chain(
                    node,
                    this.make(node, {
                        type: N.MemberExpression,
                        object: this.expression(node.expression),
                        property: this.expression(node.argumentExpression),
                        computed: true,
                        optional: !!node.questionDotToken,
                    }),
                );
            }
            case K.CallExpression:
                return this.call(ts.cast(input, ts.isCallExpression));
            case K.NewExpression: {
                const node = ts.cast(input, ts.isNewExpression);
                return this.make(node, { type: N.NewExpression, callee: this.expression(node.expression), arguments: this.list(node.arguments, isArgument), typeArguments: this.typeArguments(node) });
            }
            case K.MetaProperty: {
                const node = ts.cast(input, ts.isMetaProperty);
                const token = this.#lexical.at(this.start(node));
                return this.make(node, {
                    type: N.MetaProperty,
                    meta: this.syntheticIdentifier(node, node.keywordToken === K.ImportKeyword ? "import" : "new", token.start, token.end),
                    property: this.identifier(node.name),
                });
            }
            case K.StringLiteral: {
                const node = ts.cast(input, ts.isStringLiteral);
                return this.make(node, { type: N.Literal, value: node.parent.kind === K.JsxAttribute ? decodeEntities(node.text) : node.text, raw: this.raw(node) });
            }
            case K.NumericLiteral: {
                const node = ts.cast(input, ts.isNumericLiteral);
                return this.make(node, { type: N.Literal, value: Number(node.text), raw: this.raw(node) });
            }
            case K.BigIntLiteral: {
                const node = ts.cast(input, ts.isBigIntLiteral);
                const raw = this.raw(node);
                const value = BigInt(raw.slice(0, -1).replaceAll("_", ""));
                return this.make(node, { type: N.Literal, bigint: String(value), raw, value });
            }
            case K.RegularExpressionLiteral: {
                const node = ts.cast(input, ts.isRegularExpressionLiteral);
                const raw = this.raw(node);
                const lastSlash = raw.lastIndexOf("/");
                const regex = { pattern: raw.slice(1, lastSlash), flags: raw.slice(lastSlash + 1) };
                let value: RegExp | null = null;
                try {
                    value = new RegExp(regex.pattern, regex.flags);
                }
                catch {
                    // Valid syntax may use regular expression features absent in this JS engine.
                }
                return this.make(node, { type: N.Literal, regex, raw, value });
            }
            case K.TrueKeyword:
                return this.make(input, { type: N.Literal, raw: "true", value: true });
            case K.FalseKeyword:
                return this.make(input, { type: N.Literal, raw: "false", value: false });
            case K.NullKeyword:
                return this.make(input, { type: N.Literal, raw: "null", value: null });
            case K.NoSubstitutionTemplateLiteral:
            case K.TemplateExpression:
                return this.template(input);
            case K.TemplateHead:
            case K.TemplateMiddle:
            case K.TemplateTail:
                return this.templateElement(input);
            case K.TaggedTemplateExpression: {
                const node = ts.cast(input, ts.isTaggedTemplateExpression);
                return this.make(node, { type: N.TaggedTemplateExpression, tag: this.expression(node.tag), quasi: this.ofType(node.template, N.TemplateLiteral), typeArguments: this.typeArguments(node) });
            }
            case K.Decorator: {
                const node = ts.cast(input, ts.isDecorator);
                return this.make(node, { type: N.Decorator, expression: this.checked(node.expression, isLeftHandSide) });
            }
            case K.ClassDeclaration:
            case K.ClassExpression:
                return this.classNode(input);
            case K.PropertyDeclaration:
                return this.classProperty(ts.cast(input, ts.isPropertyDeclaration));
            case K.Constructor:
                return this.method(ts.cast(input, ts.isConstructorDeclaration));
            case K.MethodDeclaration:
                return this.method(ts.cast(input, ts.isMethodDeclaration));
            case K.GetAccessor:
            case K.SetAccessor: {
                const node = ts.isGetAccessorDeclaration(input) ? input : ts.cast(input, ts.isSetAccessorDeclaration);
                return node.parent.kind === K.InterfaceDeclaration || node.parent.kind === K.TypeLiteral ? this.methodSignature(node) : this.method(node);
            }
            case K.ClassStaticBlockDeclaration: {
                const node = ts.cast(input, ts.isClassStaticBlockDeclaration);
                return this.make(node, { type: N.StaticBlock, body: this.body(node.body.statements, true) });
            }
            case K.ImportDeclaration:
                return this.importDeclaration(ts.cast(input, ts.isImportDeclaration));
            case K.ImportClause: {
                const node = ts.cast(input, ts.isImportClause);
                if (!node.name) this.fail(node, "Missing import binding");
                const local = this.identifier(node.name);
                return this.make(node, { type: N.ImportDefaultSpecifier, local }, ...nativeRange(local));
            }
            case K.NamespaceImport: {
                const node = ts.cast(input, ts.isNamespaceImport);
                return this.make(node, { type: N.ImportNamespaceSpecifier, local: this.identifier(node.name) });
            }
            case K.ImportSpecifier: {
                const node = ts.cast(input, ts.isImportSpecifier);
                return this.make(node, { type: N.ImportSpecifier, imported: this.checked(node.propertyName ?? node.name, isModuleName), local: this.identifier(node.name), importKind: node.isTypeOnly ? "type" : "value" });
            }
            case K.ExportDeclaration:
                return this.exportDeclaration(ts.cast(input, ts.isExportDeclaration));
            case K.ExportSpecifier: {
                const node = ts.cast(input, ts.isExportSpecifier);
                return this.make(node, { type: N.ExportSpecifier, local: this.checked(node.propertyName ?? node.name, isModuleName), exported: this.checked(node.name, isModuleName), exportKind: node.isTypeOnly ? "type" : "value" });
            }
            case K.ExportAssignment: {
                const node = ts.cast(input, ts.isExportAssignment);
                if (node.isExportEquals) return this.make(node, { type: N.TSExportAssignment, expression: this.expression(node.expression) });
                return this.make(node, { type: N.ExportDefaultDeclaration, declaration: this.expression(node.expression), exportKind: "value" });
            }
            case K.ImportEqualsDeclaration: {
                const node = ts.cast(input, ts.isImportEqualsDeclaration);
                const reference = this.convert(node.moduleReference);
                if (!reference || !isTypeName(reference) && reference.type !== N.TSExternalModuleReference) this.fail(node, "Invalid module reference");
                return this.exports(
                    node,
                    this.make(node, {
                        type: N.TSImportEqualsDeclaration,
                        id: this.identifier(node.name),
                        importKind: node.isTypeOnly ? "type" : "value",
                        moduleReference: reference,
                    }),
                );
            }
            case K.ExternalModuleReference: {
                const node = ts.cast(input, ts.isExternalModuleReference);
                return this.make(node, { type: N.TSExternalModuleReference, expression: this.stringLiteral(node.expression) });
            }
            case K.NamespaceExportDeclaration: {
                const node = ts.cast(input, ts.isNamespaceExportDeclaration);
                return this.make(node, { type: N.TSNamespaceExportDeclaration, id: this.identifier(node.name) });
            }
            case K.JsxElement:
            case K.JsxSelfClosingElement:
            case K.JsxOpeningElement:
            case K.JsxClosingElement:
            case K.JsxFragment:
            case K.JsxOpeningFragment:
            case K.JsxClosingFragment:
            case K.JsxAttribute:
            case K.JsxSpreadAttribute:
            case K.JsxExpression:
            case K.JsxText:
            case K.JsxTextAllWhiteSpaces:
                return this.jsxConverter().convert(input);
            default:
                return this.typeNode(input);
        }
    }

    private raw(node: ts.Node): string {
        return this.#sourceFile.text.slice(this.start(node), node.end);
    }

    private inTypeQuery(node: ts.Node): boolean {
        let parent = node.parent;
        while (parent && ts.isQualifiedName(parent) && parent.left === node) {
            node = parent;
            parent = node.parent;
        }
        return parent?.kind === K.TypeQuery;
    }

    private flag(node: ts.ModifiersBase, flag: ts.ModifierFlags): boolean {
        let flags = this.#modifierFlags.get(node);
        if (flags === undefined) {
            flags = ts.ModifierFlags.None;
            if (node.modifiers) {
                for (const modifier of node.modifiers) {
                    if (!(modifier.flags & ts.NodeFlags.Reparsed)) {
                        const modifierFlag = modifierToFlag(modifier.kind);
                        if (!modifierFlag) this.fail(modifier, `Unknown native modifier ${K[modifier.kind]}`);
                        flags |= modifierFlag;
                    }
                }
            }
            this.#modifierFlags.set(node, flags);
        }
        return (flags & flag) !== 0;
    }

    private accessibility(node: ts.ModifiersBase): E.Accessibility | undefined {
        if (this.flag(node, ts.ModifierFlags.Public)) return "public";
        if (this.flag(node, ts.ModifierFlags.Protected)) return "protected";
        if (this.flag(node, ts.ModifierFlags.Private)) return "private";
        return undefined;
    }

    private decorators(node: ts.ModifiersBase): E.Decorator[] {
        const result: E.Decorator[] = [];
        if (node.modifiers) {
            for (const modifier of node.modifiers) {
                if (ts.isDecorator(modifier) && !(modifier.flags & ts.NodeFlags.Reparsed)) result.push(this.ofType(modifier, N.Decorator));
            }
        }
        return result;
    }

    private syntheticIdentifier(native: ts.Node, name: string, start: number, end: number): E.Identifier {
        return this.make(native, { type: N.Identifier, name, decorators: [], optional: false, typeAnnotation: undefined }, start, end);
    }

    private memberName(node: ts.MemberName): E.Identifier | E.PrivateIdentifier {
        return ts.isIdentifier(node) ? this.identifier(node) : this.ofType(node, N.PrivateIdentifier);
    }

    private key(node: ts.Node): E.Property["key"] {
        const result = this.convert(node);
        if (result && isExpression(result)) return result;
        this.fail(node, "Invalid property key");
    }

    private stringLiteral(node: ts.Node): E.StringLiteral {
        const result = this.convert(node);
        if (result?.type === N.Literal && typeof result.value === "string") return result;
        this.fail(node, "Expected string literal");
    }

    private property(
        node: ts.Node,
        key: E.Property["key"],
        value: E.Property["value"],
        shorthand: boolean,
        computed: boolean,
        start = this.start(node),
        end = node.end,
    ): E.Property {
        return this.make(node, { type: N.Property, key, value, shorthand, computed, method: false, optional: false, kind: "init" }, start, end);
    }

    private variableList(node: ts.VariableDeclarationList, statement?: ts.VariableStatement): E.VariableDeclaration {
        let kind: E.VariableDeclaration["kind"];
        if (node.flags & ts.NodeFlags.Let) kind = "let";
        else if ((node.flags & ts.NodeFlags.AwaitUsing) === ts.NodeFlags.AwaitUsing) kind = "await using";
        else if (node.flags & ts.NodeFlags.Const) kind = "const";
        else if (node.flags & ts.NodeFlags.Using) kind = "using";
        else kind = "var";
        const declarations: E.VariableDeclarator[] = [];
        for (const declaration of node.declarations) declarations.push(this.ofType(declaration, N.VariableDeclarator));
        if (!declarations.length) this.fail(node, "Empty variable declaration list");
        const result = this.make(statement ?? node, {
            type: N.VariableDeclaration,
            declarations,
            kind,
            declare: statement ? this.flag(statement, ts.ModifierFlags.Ambient) : false,
        });
        this.remember(node, result);
        return result;
    }

    private forInitializer(node: ts.Node): NonNullable<E.ForStatement["init"]> {
        const result = this.convert(node);
        if (result && isExpression(result)) return result;
        if (result?.type === N.VariableDeclaration && (result.kind === "const" || (result.kind === "let" || result.kind === "var") && !result.declare)) return result;
        this.fail(node, "Invalid loop initializer");
    }

    private forInLeft(node: ts.Node): E.ForInStatement["left"] {
        const result = this.convert(node, true);
        if (result && isExpression(result)) return result;
        if (result?.type === N.VariableDeclaration && (result.kind === "const" || result.kind === "let" || result.kind === "var")) return result;
        this.fail(node, "Invalid for-in binding");
    }

    private forLeft(node: ts.Node): E.ForOfStatement["left"] {
        const result = this.convert(node, true);
        if (result && isAssignmentTarget(result)) return result;
        if (result?.type === N.VariableDeclaration && (result.kind === "const" || result.kind === "let" || result.kind === "var" || isUsingForOf(result))) return result;
        this.fail(node, "Invalid loop binding");
    }

    private annotation(node: ts.TypeNode, arrow = false, bare = false): E.TSTypeAnnotation {
        const start = bare ? this.start(node) : this.#lexical.before(this.start(node), arrow ? K.EqualsGreaterThanToken : K.ColonToken).start;
        return this.make(node, { type: N.TSTypeAnnotation, typeAnnotation: this.type(node) }, start);
    }

    private annotatedBinding(name: ts.BindingName, type: ts.TypeNode | undefined): E.BindingName {
        const result = this.binding(name);
        if (type && !(type.flags & ts.NodeFlags.Reparsed)) {
            result.typeAnnotation = this.annotation(type);
            result.range[1] = type.end - this.#offset;
        }
        return result;
    }

    private sourceNode<T extends ts.Node>(node: T | undefined): T | undefined {
        return node && !(node.flags & ts.NodeFlags.Reparsed) ? node : undefined;
    }

    private annotationFor(node: ts.TypeNode | undefined, arrow = false): E.TSTypeAnnotation | undefined {
        const type = this.sourceNode(node);
        return type ? this.annotation(type, arrow) : undefined;
    }

    private typeArguments(node: ts.Node & { readonly typeArguments?: ts.NodeArray<ts.TypeNode>; }): E.TSTypeParameterInstantiation | undefined {
        if (!node.typeArguments) return undefined;
        if (node.typeArguments[0]?.flags & ts.NodeFlags.Reparsed) return undefined;
        if (!node.typeArguments.length) this.fail(node, "Empty type argument list");
        const start = this.#lexical.before(this.start(node.typeArguments[0]), K.LessThanToken).start;
        const end = this.#lexical.at(node.typeArguments.end, K.GreaterThanToken).end;
        return this.make(node, { type: N.TSTypeParameterInstantiation, params: this.list(node.typeArguments, isType) }, start, end);
    }

    private typeParameters(node: ts.Node & { readonly typeParameters?: ts.NodeArray<ts.TypeParameterDeclaration>; }): E.TSTypeParameterDeclaration | undefined {
        if (!node.typeParameters) return undefined;
        if (node.typeParameters[0]?.flags & ts.NodeFlags.Reparsed) return undefined;
        if (!node.typeParameters.length) this.fail(node, "Empty type parameter list");
        const start = this.#lexical.before(this.start(node.typeParameters[0]), K.LessThanToken).start;
        const end = this.#lexical.at(node.typeParameters.end, K.GreaterThanToken).end;
        const params: E.TSTypeParameter[] = [];
        for (const parameter of node.typeParameters) params.push(this.ofType(parameter, N.TSTypeParameter));
        return this.make(node, { type: N.TSTypeParameterDeclaration, params }, start, end);
    }

    private parameters(nodes: readonly ts.ParameterDeclaration[]): E.Parameter[] {
        const result: E.Parameter[] = [];
        for (const node of nodes) {
            if (node.flags & ts.NodeFlags.Reparsed) continue;
            const parameter = this.checked(node, isParameter);
            parameter.decorators = this.decorators(node);
            result.push(parameter);
        }
        return result;
    }

    private functionNode(input: ts.Node): E.Node {
        const node = ts.isFunctionDeclaration(input) ? input
            : ts.isFunctionExpression(input) ? input : ts.cast(input, ts.isArrowFunction);
        if (this.sourceNode(node.fullSignature)) this.fail(node, "Full-signature annotations are not ESTree syntax");
        const params = this.parameters(node.parameters);
        const returnType = this.annotationFor(node.type);
        const typeParameters = this.typeParameters(node);
        const async = this.flag(node, ts.ModifierFlags.Async);
        if (ts.isArrowFunction(node)) {
            return this.make(node, {
                type: N.ArrowFunctionExpression,
                async,
                body: ts.isBlock(node.body) ? this.ofType(node.body, N.BlockStatement) : this.expression(node.body),
                expression: node.body.kind !== K.Block,
                generator: false,
                id: null,
                params,
                returnType,
                typeParameters,
            });
        }
        const body = node.body ? this.ofType(node.body, N.BlockStatement) : undefined;
        const id = node.name ? this.identifier(node.name) : null;
        const generator = !!node.asteriskToken;
        if (ts.isFunctionExpression(node)) {
            if (!body) this.fail(node, "Function expression requires a body");
            return this.make(node, { type: N.FunctionExpression, async, body, declare: false, expression: false, generator, id, params, returnType, typeParameters });
        }
        if (!body) {
            if (generator || async && this.flag(node, ts.ModifierFlags.Ambient)) this.fail(node, "Invalid ambient function modifiers");
            return this.exports(
                node,
                this.make(node, {
                    type: N.TSDeclareFunction,
                    async,
                    body: undefined,
                    declare: this.flag(node, ts.ModifierFlags.Ambient),
                    expression: false,
                    generator: false,
                    id,
                    params,
                    returnType,
                    typeParameters,
                }),
            );
        }
        if (this.flag(node, ts.ModifierFlags.Ambient)) this.fail(node, "Ambient function cannot have a body");
        return this.exports(
            node,
            this.make(node, {
                type: N.FunctionDeclaration,
                async,
                body,
                declare: false,
                expression: false,
                generator,
                id,
                params,
                returnType,
                typeParameters,
            }),
        );
    }

    private arrayPattern(node: ts.Node, elements: readonly ts.Node[]): E.ArrayPattern {
        const result: (AssignmentTarget | E.AssignmentPattern | E.RestElement | null)[] = [];
        for (const element of elements) {
            const omitted = element.kind === K.OmittedExpression || ts.isBindingElement(element) && !element.name && element.pos === element.end;
            result.push(omitted ? null : this.checked(element, isPatternElement, true));
        }
        return this.make(node, { type: N.ArrayPattern, elements: result, decorators: [], optional: false, typeAnnotation: undefined });
    }

    private parameter(node: ts.ParameterDeclaration): E.Parameter {
        const binding = this.binding(node.name);
        const initializer = this.sourceNode(node.initializer);
        const rest = this.sourceNode(node.dotDotDotToken);
        const question = this.sourceNode(node.questionToken);
        if (rest && (initializer || question)) this.fail(node, "Rest parameter cannot be optional or have an initializer");
        let parameter: E.BindingName | E.RestElement = binding;
        let result: E.Parameter;
        if (rest) {
            parameter = this.make(node, { type: N.RestElement, argument: binding, decorators: [], optional: false, typeAnnotation: undefined, value: undefined });
            result = parameter;
        }
        else if (initializer) {
            result = this.make(
                node,
                {
                    type: N.AssignmentPattern,
                    left: binding,
                    right: this.expression(initializer),
                    decorators: [],
                    optional: false,
                    typeAnnotation: undefined,
                },
                nativeRange(binding)[0],
                initializer.end,
            );
        }
        else result = binding;
        const annotation = this.annotationFor(node.type);
        if (annotation) {
            parameter.typeAnnotation = annotation;
            parameter.range[1] = annotation.range[1];
        }
        if (question) {
            parameter.optional = true;
            parameter.range[1] = Math.max(parameter.range[1], question.end - this.#offset);
        }
        if (this.flag(node, ts.ModifierFlags.Modifier)) {
            if (!isParameterPropertyParameter(result)) this.fail(node, "Invalid parameter property");
            return this.make(node, {
                type: N.TSParameterProperty,
                accessibility: this.accessibility(node),
                decorators: [],
                override: this.flag(node, ts.ModifierFlags.Override),
                readonly: this.flag(node, ts.ModifierFlags.Readonly),
                static: this.flag(node, ts.ModifierFlags.Static),
                parameter: result,
            });
        }
        return result;
    }

    private bindingElement(node: ts.BindingElement): E.Node {
        if (!node.name) this.fail(node, "Missing binding name");
        if (node.dotDotDotToken && node.initializer) this.fail(node, "Rest binding cannot have an initializer");
        const binding = this.binding(node.name);
        if (node.dotDotDotToken) {
            return this.make(node, {
                type: N.RestElement,
                argument: binding,
                decorators: [],
                optional: false,
                typeAnnotation: undefined,
                value: undefined,
            });
        }
        if (node.parent.kind === K.ArrayBindingPattern) {
            if (!node.initializer) return binding;
            return this.make(node, {
                type: N.AssignmentPattern,
                left: binding,
                right: this.expression(node.initializer),
                decorators: [],
                optional: false,
                typeAnnotation: undefined,
            });
        }
        const value = node.initializer ? this.make(
            node,
            {
                type: N.AssignmentPattern,
                left: binding,
                right: this.expression(node.initializer),
                decorators: [],
                optional: false,
                typeAnnotation: undefined,
            },
            this.start(node.name),
            node.initializer.end,
        ) : binding;
        const key = node.propertyName ? this.key(node.propertyName) : this.key(node.name);
        return this.property(node, key, value, !node.propertyName, node.propertyName?.kind === K.ComputedPropertyName);
    }

    private unary(input: ts.Node): E.UpdateExpression | E.UnaryExpression {
        const node = ts.isPrefixUnaryExpression(input) ? input : ts.cast(input, ts.isPostfixUnaryExpression);
        const argument = this.expression(node.operand);
        const prefix = ts.isPrefixUnaryExpression(node);
        switch (node.operator) {
            case K.PlusPlusToken:
                return this.make(node, { type: N.UpdateExpression, argument, operator: "++", prefix });
            case K.MinusMinusToken:
                return this.make(node, { type: N.UpdateExpression, argument, operator: "--", prefix });
            case K.PlusToken:
                return this.make(node, { type: N.UnaryExpression, argument, operator: "+", prefix: true });
            case K.MinusToken:
                return this.make(node, { type: N.UnaryExpression, argument, operator: "-", prefix: true });
            case K.ExclamationToken:
                return this.make(node, { type: N.UnaryExpression, argument, operator: "!", prefix: true });
            case K.TildeToken:
                return this.make(node, { type: N.UnaryExpression, argument, operator: "~", prefix: true });
            default:
                this.fail(node, "Unknown native unary operator");
        }
    }

    private binary(node: ts.BinaryExpression, pattern: boolean): E.Node {
        const kind = node.operatorToken.kind;
        if (kind === K.CommaToken) {
            const expressions: E.Expression[] = [];
            this.sequence(node, expressions);
            return this.make(node, { type: N.SequenceExpression, expressions });
        }
        const assignment = assignmentOperators[kind];
        if (assignment) {
            if (pattern) {
                if (kind !== K.EqualsToken) this.fail(node, "Invalid assignment pattern operator");
                return this.make(node, {
                    type: N.AssignmentPattern,
                    left: this.checked(node.left, isAssignmentTarget, true),
                    right: this.expression(node.right),
                    decorators: [],
                    optional: false,
                    typeAnnotation: undefined,
                });
            }
            return this.make(node, {
                type: N.AssignmentExpression,
                operator: assignment,
                left: this.checked(node.left, isAssignmentTarget, true),
                right: this.expression(node.right),
            });
        }
        if (kind === K.AmpersandAmpersandToken || kind === K.BarBarToken || kind === K.QuestionQuestionToken) {
            return this.make(node, {
                type: N.LogicalExpression,
                operator: kind === K.AmpersandAmpersandToken ? "&&" : kind === K.BarBarToken ? "||" : "??",
                left: this.expression(node.left),
                right: this.expression(node.right),
            });
        }
        if (kind === K.InKeyword && ts.isPrivateIdentifier(node.left)) {
            return this.make(node, { type: N.BinaryExpression, operator: "in", left: this.ofType(node.left, N.PrivateIdentifier), right: this.expression(node.right) });
        }
        const operator = binaryOperators[kind];
        if (!operator) this.fail(node, `Unknown binary operator ${K[kind]}`);
        return this.make(node, { type: N.BinaryExpression, operator, left: this.expression(node.left), right: this.expression(node.right) });
    }

    private sequence(node: ts.Expression, result: E.Expression[]): void {
        if (ts.isBinaryExpression(node) && node.operatorToken.kind === K.CommaToken) {
            this.sequence(node.left, result);
            result.push(this.expression(node.right));
        }
        else result.push(this.expression(node));
    }

    private chain(
        node: ts.PropertyAccessExpression | ts.ElementAccessExpression | ts.CallExpression | ts.NonNullExpression,
        result: E.ChainElement,
    ): E.ChainElement | E.ChainExpression {
        const child = result.type === N.MemberExpression ? result.object : result.type === N.CallExpression ? result.callee : result.expression;
        const unwrap = child.type === N.ChainExpression && node.expression.kind !== K.ParenthesizedExpression;
        const optional = result.type !== N.TSNonNullExpression && result.optional;
        if (!unwrap && !optional) return result;
        if (unwrap) {
            const childNative = this.esTreeNodeToTSNodeMap.get(child);
            if (childNative && this.tsNodeToESTreeNodeMap.get(childNative) === child) this.tsNodeToESTreeNodeMap.set(childNative, child.expression);
            if (result.type === N.MemberExpression) result.object = child.expression;
            else if (result.type === N.CallExpression) result.callee = child.expression;
            else result.expression = child.expression;
        }
        return this.make(node, { type: N.ChainExpression, expression: result });
    }

    private call(node: ts.CallExpression): E.ImportExpression | E.CallExpression | E.ChainExpression {
        const isImport = node.expression.kind === K.ImportKeyword;
        const isDeferredImport = ts.isMetaProperty(node.expression) && node.expression.keywordToken === K.ImportKeyword && node.expression.name.text === "defer";
        if (isImport || isDeferredImport) {
            if (node.arguments.length < 1 || node.arguments.length > 2 || node.typeArguments?.length) this.fail(node, "Invalid dynamic import arguments");
            return this.make(node, {
                type: N.ImportExpression,
                source: this.expression(node.arguments[0]),
                options: node.arguments[1] ? this.expression(node.arguments[1]) : null,
                phase: isDeferredImport ? "defer" : null,
            });
        }
        const result = this.make(node, {
            type: N.CallExpression,
            callee: this.expression(node.expression),
            arguments: this.list(node.arguments, isArgument),
            optional: !!node.questionDotToken,
            typeArguments: this.typeArguments(node),
        });
        const converted = this.chain(node, result);
        if (converted.type !== N.CallExpression && converted.type !== N.ChainExpression) this.fail(node, "Invalid call chain");
        return converted;
    }

    private templateElement(input: ts.Node): E.TemplateElement {
        const node = ts.isNoSubstitutionTemplateLiteral(input) ? input : ts.cast(input, ts.isTemplateLiteralLikeNode);
        const tail = node.kind === K.NoSubstitutionTemplateLiteral || node.kind === K.TemplateTail;
        const raw = this.#sourceFile.text.slice(this.start(node) + 1, node.end - (tail ? 1 : 2));
        return this.make(node, {
            type: N.TemplateElement,
            tail,
            value: { raw, cooked: this.#lexical.templateFlags(node) & ts.TokenFlags.ContainsInvalidEscape ? null : node.text },
        });
    }

    private template(input: ts.Node): E.TemplateLiteral {
        if (ts.isNoSubstitutionTemplateLiteral(input)) {
            return this.make(input, {
                type: N.TemplateLiteral,
                expressions: [],
                quasis: [this.templateElement(input)],
            });
        }
        const node = ts.cast(input, ts.isTemplateExpression);
        const expressions: E.Expression[] = [];
        const quasis = [this.ofType(node.head, N.TemplateElement)];
        for (const span of node.templateSpans) {
            expressions.push(this.expression(span.expression));
            quasis.push(this.ofType(span.literal, N.TemplateElement));
        }
        return this.make(node, { type: N.TemplateLiteral, expressions, quasis });
    }

    private typeNode(input: ts.Node): E.Node {
        switch (input.kind) {
            case K.QualifiedName: {
                const node = ts.cast(input, ts.isQualifiedName);
                const left = this.convert(node.left);
                if (!left || !isTypeName(left) && left.type !== N.ThisExpression) this.fail(node, "Invalid qualified name");
                return this.make(node, { type: N.TSQualifiedName, left, right: this.memberName(node.right) });
            }
            case K.AnyKeyword:
                return this.make(input, { type: N.TSAnyKeyword });
            case K.BigIntKeyword:
                return this.make(input, { type: N.TSBigIntKeyword });
            case K.BooleanKeyword:
                return this.make(input, { type: N.TSBooleanKeyword });
            case K.IntrinsicKeyword:
                return this.make(input, { type: N.TSIntrinsicKeyword });
            case K.NeverKeyword:
                return this.make(input, { type: N.TSNeverKeyword });
            case K.NumberKeyword:
                return this.make(input, { type: N.TSNumberKeyword });
            case K.ObjectKeyword:
                return this.make(input, { type: N.TSObjectKeyword });
            case K.StringKeyword:
                return this.make(input, { type: N.TSStringKeyword });
            case K.SymbolKeyword:
                return this.make(input, { type: N.TSSymbolKeyword });
            case K.UndefinedKeyword:
                return this.make(input, { type: N.TSUndefinedKeyword });
            case K.UnknownKeyword:
                return this.make(input, { type: N.TSUnknownKeyword });
            case K.VoidKeyword:
                return this.make(input, { type: N.TSVoidKeyword });
            case K.ThisType:
                return this.make(input, { type: N.TSThisType });
            case K.AbstractKeyword:
                return this.make(input, { type: N.TSAbstractKeyword });
            case K.TypeParameter: {
                const node = ts.cast(input, ts.isTypeParameterDeclaration);
                return this.make(node, {
                    type: N.TSTypeParameter,
                    name: this.identifier(node.name),
                    const: this.flag(node, ts.ModifierFlags.Const),
                    in: this.flag(node, ts.ModifierFlags.In),
                    out: this.flag(node, ts.ModifierFlags.Out),
                    constraint: node.constraint ? this.type(node.constraint) : undefined,
                    default: node.defaultType ? this.type(node.defaultType) : undefined,
                });
            }
            case K.TypeReference: {
                const node = ts.cast(input, ts.isTypeReferenceNode);
                return this.make(node, { type: N.TSTypeReference, typeName: this.checked(node.typeName, isTypeName), typeArguments: this.typeArguments(node) });
            }
            case K.TypeQuery: {
                const node = ts.cast(input, ts.isTypeQueryNode);
                const exprName = this.convert(node.exprName);
                if (!exprName || !isTypeName(exprName) && exprName.type !== N.ThisExpression) this.fail(node, "Invalid type query");
                return this.make(node, { type: N.TSTypeQuery, exprName, typeArguments: this.typeArguments(node) });
            }
            case K.TypeLiteral: {
                const node = ts.cast(input, ts.isTypeLiteralNode);
                return this.make(node, { type: N.TSTypeLiteral, members: this.list(node.members, isTypeElement) });
            }
            case K.ArrayType: {
                const node = ts.cast(input, ts.isArrayTypeNode);
                return this.make(node, { type: N.TSArrayType, elementType: this.type(node.elementType) });
            }
            case K.IndexedAccessType: {
                const node = ts.cast(input, ts.isIndexedAccessTypeNode);
                return this.make(node, { type: N.TSIndexedAccessType, objectType: this.type(node.objectType), indexType: this.type(node.indexType) });
            }
            case K.UnionType: {
                const node = ts.cast(input, ts.isUnionTypeNode);
                return this.make(node, { type: N.TSUnionType, types: this.list(node.types, isType) });
            }
            case K.IntersectionType: {
                const node = ts.cast(input, ts.isIntersectionTypeNode);
                return this.make(node, { type: N.TSIntersectionType, types: this.list(node.types, isType) });
            }
            case K.ConditionalType: {
                const node = ts.cast(input, ts.isConditionalTypeNode);
                return this.make(node, {
                    type: N.TSConditionalType,
                    checkType: this.type(node.checkType),
                    extendsType: this.type(node.extendsType),
                    trueType: this.type(node.trueType),
                    falseType: this.type(node.falseType),
                });
            }
            case K.InferType: {
                const node = ts.cast(input, ts.isInferTypeNode);
                return this.make(node, { type: N.TSInferType, typeParameter: this.ofType(node.typeParameter, N.TSTypeParameter) });
            }
            case K.TypeOperator: {
                const node = ts.cast(input, ts.isTypeOperatorNode);
                const operator = typeOperators[node.operator];
                if (!operator) this.fail(node, "Unknown native type operator");
                return this.make(node, {
                    type: N.TSTypeOperator,
                    operator,
                    typeAnnotation: this.type(node.type),
                });
            }
            case K.TupleType: {
                const node = ts.cast(input, ts.isTupleTypeNode);
                return this.make(node, { type: N.TSTupleType, elementTypes: this.list(node.elements, isType) });
            }
            case K.NamedTupleMember: {
                const node = ts.cast(input, ts.isNamedTupleMember);
                const label = this.identifier(node.name);
                const member = this.make(node, {
                    type: N.TSNamedTupleMember,
                    label,
                    elementType: this.type(node.type),
                    optional: !!node.questionToken,
                }, node.dotDotDotToken ? nativeRange(label)[0] : this.start(node));
                return node.dotDotDotToken ? this.make(node, { type: N.TSRestType, typeAnnotation: member }) : member;
            }
            case K.OptionalType: {
                const node = ts.cast(input, ts.isOptionalTypeNode);
                return this.make(node, { type: N.TSOptionalType, typeAnnotation: this.type(node.type) });
            }
            case K.RestType: {
                const node = ts.cast(input, ts.isRestTypeNode);
                return this.make(node, { type: N.TSRestType, typeAnnotation: this.type(node.type) });
            }
            case K.LiteralType: {
                const node = ts.cast(input, ts.isLiteralTypeNode);
                if (node.literal.kind === K.NullKeyword) return this.make(node.literal, { type: N.TSNullKeyword });
                const literal = this.convert(node.literal);
                if (!literal || !isTypeLiteral(literal)) this.fail(node, "Invalid literal type");
                return this.make(node, { type: N.TSLiteralType, literal });
            }
            case K.AsExpression: {
                const node = ts.cast(input, ts.isAsExpression);
                if (node.type.flags & ts.NodeFlags.Reparsed) return this.expression(node.expression);
                return this.make(node, { type: N.TSAsExpression, expression: this.expression(node.expression), typeAnnotation: this.type(node.type) });
            }
            case K.SatisfiesExpression: {
                const node = ts.cast(input, ts.isSatisfiesExpression);
                if (node.type.flags & ts.NodeFlags.Reparsed) return this.expression(node.expression);
                return this.make(node, { type: N.TSSatisfiesExpression, expression: this.expression(node.expression), typeAnnotation: this.type(node.type) });
            }
            case K.TypeAssertionExpression: {
                const node = ts.cast(input, ts.isTypeAssertion);
                return this.make(node, { type: N.TSTypeAssertion, expression: this.expression(node.expression), typeAnnotation: this.type(node.type) });
            }
            case K.NonNullExpression: {
                const node = ts.cast(input, ts.isNonNullExpression);
                return this.chain(node, this.make(node, { type: N.TSNonNullExpression, expression: this.expression(node.expression) }));
            }
            case K.ExpressionWithTypeArguments:
                return this.heritage(ts.cast(input, ts.isExpressionWithTypeArguments));
            case K.TypePredicate: {
                const node = ts.cast(input, ts.isTypePredicateNode);
                const parameterName = ts.isIdentifier(node.parameterName) ? this.identifier(node.parameterName) : this.ofType(node.parameterName, N.TSThisType);
                if (node.assertsModifier) {
                    return this.make(node, {
                        type: N.TSTypePredicate,
                        asserts: true,
                        parameterName,
                        typeAnnotation: node.type ? this.annotation(node.type, false, true) : null,
                    });
                }
                if (!node.type) this.fail(node, "Missing predicate type");
                return this.make(node, { type: N.TSTypePredicate, asserts: false, parameterName, typeAnnotation: this.annotation(node.type, false, true) });
            }
            case K.MappedType: {
                const node = ts.cast(input, ts.isMappedTypeNode);
                if (!node.typeParameter.constraint || node.members?.length) this.fail(node, "Invalid mapped type");
                const parameter = this.ofType(node.typeParameter, N.TSTypeParameter);
                if (!parameter.constraint) this.fail(node, "Missing mapped type constraint");
                const result = this.make(node, {
                    type: N.TSMappedType,
                    constraint: parameter.constraint,
                    key: parameter.name,
                    nameType: node.nameType ? this.type(node.nameType) : null,
                    optional: node.questionToken ? node.questionToken.kind === K.QuestionToken ? true : node.questionToken.kind === K.PlusToken ? "+" : "-" : false,
                    readonly: node.readonlyToken ? node.readonlyToken.kind === K.ReadonlyKeyword ? true : node.readonlyToken.kind === K.PlusToken ? "+" : "-" : undefined,
                    typeAnnotation: node.type ? this.type(node.type) : undefined,
                });
                Object.defineProperty(result, "typeParameter", { configurable: true, writable: true, value: parameter });
                return result;
            }
            case K.TemplateLiteralType: {
                const node = ts.cast(input, ts.isTemplateLiteralTypeNode);
                const quasis = [this.ofType(node.head, N.TemplateElement)];
                const types: E.TypeNode[] = [];
                for (const span of node.templateSpans) {
                    types.push(this.type(span.type));
                    quasis.push(this.ofType(span.literal, N.TemplateElement));
                }
                return this.make(node, { type: N.TSTemplateLiteralType, quasis, types });
            }
            case K.FunctionType:
            case K.ConstructorType:
            case K.CallSignature:
            case K.ConstructSignature:
                return this.functionType(input);
            case K.MethodSignature:
                return this.methodSignature(ts.cast(input, ts.isMethodSignatureDeclaration));
            case K.PropertySignature:
                return this.propertySignature(ts.cast(input, ts.isPropertySignatureDeclaration));
            case K.IndexSignature: {
                const node = ts.cast(input, ts.isIndexSignatureDeclaration);
                return this.make(node, {
                    type: N.TSIndexSignature,
                    accessibility: this.accessibility(node),
                    parameters: this.parameters(node.parameters),
                    readonly: this.flag(node, ts.ModifierFlags.Readonly),
                    static: this.flag(node, ts.ModifierFlags.Static),
                    typeAnnotation: this.annotationFor(node.type),
                });
            }
            case K.TypeAliasDeclaration: {
                const node = ts.cast(input, ts.isTypeAliasDeclaration);
                return this.exports(
                    node,
                    this.make(node, {
                        type: N.TSTypeAliasDeclaration,
                        id: this.identifier(node.name),
                        declare: this.flag(node, ts.ModifierFlags.Ambient),
                        typeAnnotation: this.type(node.type),
                        typeParameters: this.typeParameters(node),
                    }),
                );
            }
            case K.InterfaceDeclaration:
                return this.interfaceNode(ts.cast(input, ts.isInterfaceDeclaration));
            case K.ImportType:
                return this.importType(ts.cast(input, ts.isImportTypeNode));
            case K.ImportAttribute: {
                const node = ts.cast(input, ts.isImportAttribute);
                return this.make(node, { type: N.ImportAttribute, key: this.checked(node.name, isModuleName), value: this.stringLiteral(node.value) });
            }
            case K.EnumMember: {
                const node = ts.cast(input, ts.isEnumMember);
                const result = this.make(node, { type: N.TSEnumMember, id: this.checked(node.name, isModuleName), initializer: node.initializer ? this.expression(node.initializer) : undefined });
                Object.defineProperty(result, "computed", { configurable: true, writable: true, value: node.name.kind === K.ComputedPropertyName });
                return result;
            }
            case K.EnumDeclaration: {
                const node = ts.cast(input, ts.isEnumDeclaration);
                const members: E.TSEnumMember[] = [];
                for (const member of node.members) members.push(this.ofType(member, N.TSEnumMember));
                return this.exports(
                    node,
                    this.make(node, {
                        type: N.TSEnumDeclaration,
                        id: this.identifier(node.name),
                        const: this.flag(node, ts.ModifierFlags.Const),
                        declare: this.flag(node, ts.ModifierFlags.Ambient),
                        body: this.make(node, { type: N.TSEnumBody, members }, node.members.pos - 1),
                    }),
                );
            }
            case K.ModuleDeclaration:
                return this.moduleNode(ts.cast(input, ts.isModuleDeclaration));
            default:
                this.fail(input, `Unsupported native syntax ${K[input.kind]} (${input.kind})`);
        }
    }

    private functionType(input: ts.Node): E.Node {
        const node = ts.isFunctionTypeNode(input) ? input : ts.isConstructorTypeNode(input) ? input
            : ts.isCallSignatureDeclaration(input) ? input : ts.cast(input, ts.isConstructSignatureDeclaration);
        const params = this.parameters(node.parameters);
        const typeParameters = this.typeParameters(node);
        const returnType = this.annotationFor(node.type, node.kind === K.FunctionType || node.kind === K.ConstructorType);
        if (ts.isConstructorTypeNode(node)) return this.make(node, { type: N.TSConstructorType, abstract: this.flag(node, ts.ModifierFlags.Abstract), params, typeParameters, returnType });
        if (ts.isFunctionTypeNode(node)) return this.make(node, { type: N.TSFunctionType, params, typeParameters, returnType });
        if (ts.isCallSignatureDeclaration(node)) return this.make(node, { type: N.TSCallSignatureDeclaration, params, typeParameters, returnType });
        return this.make(node, { type: N.TSConstructSignatureDeclaration, params, typeParameters, returnType });
    }

    private heritage(node: ts.ExpressionWithTypeArguments): E.TSInterfaceHeritage | E.TSClassImplements | E.TSInstantiationExpression {
        const expression = this.expression(node.expression);
        const typeArguments = this.typeArguments(node);
        if (node.parent.kind === K.HeritageClause) {
            if (node.parent.parent.kind === K.InterfaceDeclaration) return this.make(node, { type: N.TSInterfaceHeritage, expression, typeArguments });
            return this.make(node, { type: N.TSClassImplements, expression, typeArguments });
        }
        if (!typeArguments) this.fail(node, "Missing instantiation type arguments");
        return this.make(node, { type: N.TSInstantiationExpression, expression, typeArguments });
    }

    private interfaceNode(node: ts.InterfaceDeclaration): E.Node {
        const extended: E.TSInterfaceHeritage[] = [];
        if (node.heritageClauses) {
            for (const clause of node.heritageClauses) {
                if (clause.token !== K.ExtendsKeyword) this.fail(clause, "Invalid interface heritage");
                for (const type of clause.types) extended.push(this.interfaceHeritage(type));
            }
        }
        return this.exports(
            node,
            this.make(node, {
                type: N.TSInterfaceDeclaration,
                id: this.identifier(node.name),
                declare: this.flag(node, ts.ModifierFlags.Ambient),
                body: this.make(node, { type: N.TSInterfaceBody, body: this.list(node.members, isTypeElement) }, node.members.pos - 1),
                extends: extended,
                typeParameters: this.typeParameters(node),
            }),
        );
    }

    private interfaceHeritage(node: ts.HeritageClauseElement): E.TSInterfaceHeritage {
        const expression = ts.isExpressionWithTypeArguments(node) ? this.expression(node.expression) : this.entityExpression(node.typeName);
        const result = this.make(node, { type: N.TSInterfaceHeritage, expression, typeArguments: this.typeArguments(node) });
        this.remember(node, result);
        return result;
    }

    private entityExpression(node: ts.EntityName): E.Expression {
        if (ts.isIdentifier(node)) return this.identifier(node);
        const result = this.make(node, {
            type: N.MemberExpression,
            object: this.entityExpression(node.left),
            property: this.memberName(node.right),
            computed: false,
            optional: false,
        });
        this.remember(node, result);
        return result;
    }

    private publicName(node: ts.PropertyName): PublicName {
        if (ts.isComputedPropertyName(node)) return { computed: true, key: this.expression(node.expression) };
        const key = this.convert(node);
        if (key?.type === N.Identifier || key?.type === N.Literal && (typeof key.value === "string" || typeof key.value === "number")) return { computed: false, key };
        this.fail(node, "Invalid non-computed property name");
    }

    private className(node: ts.PropertyName): ClassName {
        if (ts.isPrivateIdentifier(node)) return { computed: false, key: this.ofType(node, N.PrivateIdentifier) };
        return this.publicName(node);
    }

    private classNode(input: ts.Node): E.Node {
        const node = ts.isClassDeclaration(input) ? input : ts.cast(input, ts.isClassExpression);
        let extended: ts.HeritageClauseElement | undefined;
        const implemented: E.TSClassImplements[] = [];
        if (node.heritageClauses) {
            for (const clause of node.heritageClauses) {
                if (clause.token === K.ExtendsKeyword) {
                    if (extended || clause.types.length !== 1) this.fail(clause, "Invalid class extends clause");
                    extended = clause.types[0];
                }
                else {for (const heritage of clause.types) {
                        const expression = ts.isExpressionWithTypeArguments(heritage) ? this.expression(heritage.expression) : this.entityExpression(heritage.typeName);
                        const converted = this.make(heritage, { type: N.TSClassImplements, expression, typeArguments: this.typeArguments(heritage) });
                        this.remember(heritage, converted);
                        implemented.push(converted);
                    }}
            }
        }
        const members: E.ClassElement[] = [];
        for (const member of node.members) {
            if (member.kind !== K.SemicolonClassElement && !(member.flags & ts.NodeFlags.Reparsed)) members.push(this.checked(member, isClassElement));
        }
        const data = {
            abstract: this.flag(node, ts.ModifierFlags.Abstract),
            declare: this.flag(node, ts.ModifierFlags.Ambient),
            decorators: this.decorators(node),
            id: node.name ? this.identifier(node.name) : null,
            body: this.make(node, { type: N.ClassBody, body: members }, node.members.pos - 1),
            implements: implemented,
            typeParameters: this.typeParameters(node),
            superClass: extended ? ts.isExpressionWithTypeArguments(extended) ? this.expression(extended.expression) : this.entityExpression(extended.typeName) : null,
            superTypeArguments: extended ? this.typeArguments(extended) : undefined,
        };
        if (ts.isClassExpression(node)) {
            if (data.abstract || data.declare) this.fail(node, "Invalid class expression modifiers");
            return this.make(node, { type: N.ClassExpression, ...data, abstract: false, declare: false });
        }
        return this.exports(node, this.make(node, { type: N.ClassDeclaration, ...data }));
    }

    private classProperty(node: ts.PropertyDeclaration): E.Node {
        const name = this.className(node.name);
        const postfix = this.sourceNode(node.postfixToken);
        const data = {
            accessibility: this.accessibility(node),
            declare: this.flag(node, ts.ModifierFlags.Ambient),
            decorators: this.decorators(node),
            definite: postfix?.kind === K.ExclamationToken,
            optional: postfix?.kind === K.QuestionToken,
            override: this.flag(node, ts.ModifierFlags.Override),
            readonly: this.flag(node, ts.ModifierFlags.Readonly),
            static: this.flag(node, ts.ModifierFlags.Static),
            typeAnnotation: this.annotationFor(node.type),
        };
        const abstract = this.flag(node, ts.ModifierFlags.Abstract);
        const accessor = this.flag(node, ts.ModifierFlags.Accessor);
        if (abstract) {
            if (node.initializer) this.fail(node, "Abstract property cannot have an initializer");
            if (!isPublicName(name)) this.fail(node, "Abstract property cannot be private");
            if (accessor) return this.make(node, { type: N.TSAbstractAccessorProperty, ...name, ...data, value: null });
            return this.make(node, { type: N.TSAbstractPropertyDefinition, ...name, ...data, value: null });
        }
        const value = this.nullableExpression(node.initializer);
        if (accessor) return this.make(node, { type: N.AccessorProperty, ...name, ...data, value });
        return this.make(node, { type: N.PropertyDefinition, ...name, ...data, value });
    }

    private method(node: Method): E.Node {
        const typeParameters = this.typeParameters(node);
        const start = typeParameters ? nativeRange(typeParameters)[0] : node.parameters.pos - 1;
        const params = this.parameters(node.parameters);
        const returnType = this.annotationFor(node.type);
        const data = {
            async: this.flag(node, ts.ModifierFlags.Async),
            generator: !!node.asteriskToken,
            declare: false,
            expression: false,
            id: null,
            params,
            typeParameters,
            returnType,
        } as const;
        const value = node.body ? this.make(node, {
            type: N.FunctionExpression,
            ...data,
            body: this.ofType(node.body, N.BlockStatement),
        }, start) : this.make(node, { type: N.TSEmptyBodyFunctionExpression, ...data, body: null }, start);
        if (node.kind !== K.Constructor && node.parent.kind === K.ObjectLiteralExpression) {
            return this.make(node, {
                type: N.Property,
                ...this.publicName(node.name),
                kind: node.kind === K.GetAccessor ? "get" : node.kind === K.SetAccessor ? "set" : "init",
                method: node.kind === K.MethodDeclaration,
                optional: this.sourceNode(node.postfixToken)?.kind === K.QuestionToken,
                shorthand: false,
                value,
            });
        }
        let name: ClassName;
        let kind: E.MethodDefinition["kind"];
        const staticMember = this.flag(node, ts.ModifierFlags.Static);
        if (ts.isConstructorDeclaration(node)) {
            let position = this.start(node);
            if (node.modifiers) { for (const modifier of node.modifiers) position = modifier.end; }
            const token = this.#lexical.at(position);
            const key = token.kind === K.StringLiteral
                ? this.make(node, { type: N.Literal, value: "constructor", raw: this.#sourceFile.text.slice(token.start, token.end) }, token.start, token.end)
                : this.syntheticIdentifier(node, "constructor", token.start, token.end);
            name = { computed: false, key };
            kind = staticMember ? "method" : "constructor";
        }
        else {
            name = this.className(node.name);
            kind = node.kind === K.GetAccessor ? "get" : node.kind === K.SetAccessor ? "set"
                : !staticMember && ts.isStringLiteral(node.name) && node.name.text === "constructor" ? "constructor" : "method";
        }
        const member = {
            accessibility: this.accessibility(node),
            decorators: ts.isConstructorDeclaration(node) ? [] : this.decorators(node),
            optional: !ts.isConstructorDeclaration(node) && this.sourceNode(node.postfixToken)?.kind === K.QuestionToken,
            override: !ts.isConstructorDeclaration(node) && this.flag(node, ts.ModifierFlags.Override),
            static: staticMember,
            kind,
            value,
        };
        if (this.flag(node, ts.ModifierFlags.Abstract)) {
            if (ts.isConstructorDeclaration(node)) this.fail(node, "Constructor cannot be abstract");
            if (!isPublicName(name)) this.fail(node, "Abstract method cannot be private");
            return this.make(node, { type: N.TSAbstractMethodDefinition, ...name, ...member });
        }
        return this.make(node, { type: N.MethodDefinition, ...name, ...member });
    }

    private methodSignature(node: ts.MethodSignatureDeclaration | ts.GetAccessorDeclaration | ts.SetAccessorDeclaration): E.TSMethodSignature {
        return this.make(node, {
            type: N.TSMethodSignature,
            ...this.publicName(node.name),
            accessibility: this.accessibility(node),
            kind: node.kind === K.GetAccessor ? "get" : node.kind === K.SetAccessor ? "set" : "method",
            optional: this.sourceNode(node.postfixToken)?.kind === K.QuestionToken,
            readonly: this.flag(node, ts.ModifierFlags.Readonly),
            static: this.flag(node, ts.ModifierFlags.Static),
            params: this.parameters(node.parameters),
            returnType: this.annotationFor(node.type),
            typeParameters: this.typeParameters(node),
        });
    }

    private propertySignature(node: ts.PropertySignatureDeclaration): E.TSPropertySignature {
        if (node.initializer) this.fail(node, "Property signature cannot have an initializer");
        return this.make(node, {
            type: N.TSPropertySignature,
            ...this.publicName(node.name),
            accessibility: this.accessibility(node),
            optional: this.sourceNode(node.postfixToken)?.kind === K.QuestionToken,
            readonly: this.flag(node, ts.ModifierFlags.Readonly),
            static: this.flag(node, ts.ModifierFlags.Static),
            typeAnnotation: this.annotationFor(node.type),
        });
    }

    private importAttributes(node: ts.ImportAttributes | undefined): E.ImportAttribute[] {
        const result: E.ImportAttribute[] = [];
        if (node) { for (const attribute of node.attributes) result.push(this.ofType(attribute, N.ImportAttribute)); }
        return result;
    }

    private importDeclaration(node: ts.ImportDeclaration): E.ImportDeclaration {
        const specifiers: E.ImportClause[] = [];
        const clause = node.importClause;
        if (clause?.phaseModifier === K.SourceKeyword) this.fail(node, "Source-phase imports are not supported by this ESTree version");
        if (clause?.phaseModifier !== undefined && clause.phaseModifier !== K.TypeKeyword && clause.phaseModifier !== K.DeferKeyword) this.fail(node, "Unknown native import phase");
        if (clause?.name) specifiers.push(this.ofType(clause, N.ImportDefaultSpecifier));
        if (clause?.namedBindings) {
            if (ts.isNamespaceImport(clause.namedBindings)) specifiers.push(this.ofType(clause.namedBindings, N.ImportNamespaceSpecifier));
            else for (const specifier of clause.namedBindings.elements) specifiers.push(this.ofType(specifier, N.ImportSpecifier));
        }
        return this.make(node, {
            type: N.ImportDeclaration,
            attributes: this.importAttributes(node.attributes),
            specifiers,
            importKind: clause?.phaseModifier === K.TypeKeyword ? "type" : "value",
            phase: clause?.phaseModifier === K.DeferKeyword ? "defer" : null,
            source: this.stringLiteral(node.moduleSpecifier),
        });
    }

    private exportDeclaration(node: ts.ExportDeclaration): E.ExportNamedDeclaration | E.ExportAllDeclaration {
        const attributes = this.importAttributes(node.attributes);
        const exportKind = node.isTypeOnly ? "type" : "value";
        if (node.exportClause?.kind === K.NamedExports) {
            const specifiers: E.ExportSpecifier[] = [];
            for (const specifier of node.exportClause.elements) specifiers.push(this.ofType(specifier, N.ExportSpecifier));
            const source = node.moduleSpecifier ? this.stringLiteral(node.moduleSpecifier) : null;
            if (source) return this.make(node, { type: N.ExportNamedDeclaration, attributes, exportKind, declaration: null, source, specifiers });
            for (const specifier of specifiers) if (specifier.local.type !== N.Identifier) this.fail(node, "String export names require a module source");
            return this.make(node, { type: N.ExportNamedDeclaration, attributes, exportKind, declaration: null, source: null, specifiers });
        }
        if (!node.moduleSpecifier) this.fail(node, "Export-all requires a module source");
        return this.make(node, {
            type: N.ExportAllDeclaration,
            attributes,
            exportKind,
            source: this.stringLiteral(node.moduleSpecifier),
            exported: node.exportClause ? this.checked(node.exportClause.name, isModuleName) : null,
        });
    }

    private jsxConverter(): JSXConverter {
        return this.#jsx ??= new JSXConverter({
            text: this.#sourceFile.text,
            make: this.make.bind(this),
            start: this.start.bind(this),
            fail: this.fail.bind(this),
            remember: this.remember.bind(this),
            raw: this.raw.bind(this),
            expression: this.expression.bind(this),
            checked: this.checked.bind(this),
            list: this.list.bind(this),
            ofType: this.ofType.bind(this),
            typeArguments: this.typeArguments.bind(this),
        });
    }

    private importType(node: ts.ImportTypeNode): E.Node {
        const argument = this.ofType(node.argument, N.TSLiteralType);
        const source = argument.literal;
        if (source.type !== N.Literal || typeof source.value !== "string") this.fail(node, "Import type requires a string literal");
        let options: E.ObjectExpression | null = null;
        if (node.attributes) {
            const properties: E.Property[] = [];
            for (const attribute of node.attributes.attributes) {
                properties.push(this.property(attribute, this.checked(attribute.name, isModuleName), this.stringLiteral(attribute.value), false, false));
            }
            const value = this.make(node.attributes, { type: N.ObjectExpression, properties });
            const comma = this.#lexical.at(node.argument.end, K.CommaToken);
            const open = this.#lexical.at(comma.end, K.OpenBraceToken);
            const keyword = this.#lexical.at(open.end);
            let close = this.#lexical.at(node.attributes.end);
            if (close.kind === K.CommaToken) close = this.#lexical.at(close.end);
            if (close.kind !== K.CloseBraceToken) this.fail(node, "Invalid import type options");
            const key = this.syntheticIdentifier(node, node.attributes.token === K.AssertKeyword ? "assert" : "with", keyword.start, keyword.end);
            options = this.make(
                node,
                {
                    type: N.ObjectExpression,
                    properties: [this.property(node, key, value, false, false, keyword.start, node.attributes.end)],
                },
                open.start,
                close.end,
            );
        }
        const start = node.isTypeOf ? this.#lexical.at(this.#lexical.at(this.start(node), K.TypeOfKeyword).end, K.ImportKeyword).start : this.start(node);
        const result = this.make(node, {
            type: N.TSImportType,
            source,
            options,
            qualifier: node.qualifier ? this.checked(node.qualifier, isTypeName) : null,
            typeArguments: this.typeArguments(node) ?? null,
        }, start);
        Object.defineProperty(result, "argument", { configurable: true, writable: true, value: argument });
        if (node.isTypeOf) return this.make(node, { type: N.TSTypeQuery, exprName: result, typeArguments: undefined });
        return result;
    }

    private moduleNode(node: ts.ModuleDeclaration): E.Node {
        if (node.attributes) this.fail(node, "Module declaration attributes have no ESTree representation");
        let declare = this.flag(node, ts.ModifierFlags.Ambient);
        let current = node;
        let id: E.Identifier | E.StringLiteral | E.TSQualifiedName = this.checked(node.name, isModuleName);
        while (current.body && ts.isModuleDeclaration(current.body)) {
            current = current.body;
            if (!ts.isIdentifier(current.name)) this.fail(current, "Invalid nested namespace name");
            declare ||= this.flag(current, ts.ModifierFlags.Ambient);
            const right = this.identifier(current.name);
            if (id.type === N.Literal) this.fail(node, "Invalid nested module name");
            id = this.make(current.name, { type: N.TSQualifiedName, left: id, right }, nativeRange(id)[0], nativeRange(right)[1]);
        }
        const body = current.body ? this.ofType(current.body, N.TSModuleBlock) : undefined;
        if (id.type === N.Literal) {
            if (declare) {
                return this.exports(
                    node,
                    body
                        ? this.make(node, { type: N.TSModuleDeclaration, id, body, declare: true, global: false, kind: "module" })
                        : this.make(node, { type: N.TSModuleDeclaration, id, declare: true, global: false, kind: "module" }),
                );
            }
            if (!body) this.fail(node, "Non-ambient module requires a body");
            return this.exports(node, this.make(node, { type: N.TSModuleDeclaration, id, body, declare: false, global: false, kind: "module" }));
        }
        if (!body) this.fail(node, "Namespace requires a body");
        let keyword = this.#lexical.at(this.start(node));
        if (node.modifiers) { for (const modifier of node.modifiers) if (modifier.kind !== K.Decorator) keyword = this.#lexical.at(modifier.end); }
        if (ts.isIdentifier(node.name) && node.name.text === "global" && keyword.start === this.start(node.name)) {
            if (id.type !== N.Identifier) this.fail(node, "Invalid global augmentation");
            return this.exports(node, this.make(node, { type: N.TSModuleDeclaration, id, body, declare, global: true, kind: "global" }));
        }
        if (current.keyword === K.NamespaceKeyword) return this.exports(node, this.make(node, { type: N.TSModuleDeclaration, id, body, declare, global: false, kind: "namespace" }));
        return this.exports(node, this.make(node, { type: N.TSModuleDeclaration, id, body, declare, global: false, kind: "module" }));
    }

    private exports(node: ts.ModifiersBase, declaration: E.Node): E.Node {
        if (!this.flag(node, ts.ModifierFlags.Export)) return declaration;
        let exportToken: ts.ModifierLike | undefined;
        let defaultToken: ts.ModifierLike | undefined;
        if (node.modifiers) {
            for (const modifier of node.modifiers) {
                if (modifier.kind === K.ExportKeyword) exportToken = modifier;
                if (modifier.kind === K.DefaultKeyword) defaultToken = modifier;
            }
        }
        if (!exportToken) this.fail(node, "Missing export modifier");
        this.remember(node, declaration);
        declaration.range[0] = this.#lexical.at((defaultToken ?? exportToken).end).start - this.#offset;
        if (defaultToken) {
            if (
                declaration.type !== N.ClassDeclaration && declaration.type !== N.FunctionDeclaration
                && declaration.type !== N.TSDeclareFunction && declaration.type !== N.TSInterfaceDeclaration
            ) this.fail(node, "Invalid default declaration");
            return this.make(node, { type: N.ExportDefaultDeclaration, declaration, exportKind: "value" }, this.start(exportToken));
        }
        if (!isNamedExport(declaration)) this.fail(node, "Invalid named export declaration");
        return this.make(node, {
            type: N.ExportNamedDeclaration,
            declaration,
            exportKind: declaration.type === N.TSInterfaceDeclaration || declaration.type === N.TSTypeAliasDeclaration
                    || "declare" in declaration && declaration.declare ? "type" : "value",
            attributes: [],
            source: null,
            specifiers: [],
        }, this.start(exportToken));
    }
}

function isNamedExport(node: E.Node): node is E.NamedExportDeclarations {
    return node.type === N.VariableDeclaration || node.type === N.ClassDeclaration || node.type === N.FunctionDeclaration
        || node.type === N.TSDeclareFunction || node.type === N.TSEnumDeclaration || node.type === N.TSImportEqualsDeclaration
        || node.type === N.TSInterfaceDeclaration || node.type === N.TSModuleDeclaration || node.type === N.TSTypeAliasDeclaration;
}

const assignmentOperators: Partial<Record<ts.SyntaxKind, E.AssignmentExpression["operator"]>> = {
    [K.EqualsToken]: "=",
    [K.PlusEqualsToken]: "+=",
    [K.MinusEqualsToken]: "-=",
    [K.AsteriskEqualsToken]: "*=",
    [K.AsteriskAsteriskEqualsToken]: "**=",
    [K.SlashEqualsToken]: "/=",
    [K.PercentEqualsToken]: "%=",
    [K.LessThanLessThanEqualsToken]: "<<=",
    [K.GreaterThanGreaterThanEqualsToken]: ">>=",
    [K.GreaterThanGreaterThanGreaterThanEqualsToken]: ">>>=",
    [K.AmpersandEqualsToken]: "&=",
    [K.BarEqualsToken]: "|=",
    [K.CaretEqualsToken]: "^=",
    [K.AmpersandAmpersandEqualsToken]: "&&=",
    [K.BarBarEqualsToken]: "||=",
    [K.QuestionQuestionEqualsToken]: "??=",
};

const binaryOperators: Partial<Record<ts.SyntaxKind, E.SymmetricBinaryExpression["operator"]>> = {
    [K.PlusToken]: "+",
    [K.MinusToken]: "-",
    [K.AsteriskToken]: "*",
    [K.AsteriskAsteriskToken]: "**",
    [K.SlashToken]: "/",
    [K.PercentToken]: "%",
    [K.LessThanToken]: "<",
    [K.LessThanEqualsToken]: "<=",
    [K.GreaterThanToken]: ">",
    [K.GreaterThanEqualsToken]: ">=",
    [K.EqualsEqualsToken]: "==",
    [K.EqualsEqualsEqualsToken]: "===",
    [K.ExclamationEqualsToken]: "!=",
    [K.ExclamationEqualsEqualsToken]: "!==",
    [K.LessThanLessThanToken]: "<<",
    [K.GreaterThanGreaterThanToken]: ">>",
    [K.GreaterThanGreaterThanGreaterThanToken]: ">>>",
    [K.AmpersandToken]: "&",
    [K.BarToken]: "|",
    [K.CaretToken]: "^",
    [K.InKeyword]: "in",
    [K.InstanceOfKeyword]: "instanceof",
};

const typeOperators: Partial<Record<ts.SyntaxKind, E.TSTypeOperator["operator"]>> = {
    [K.KeyOfKeyword]: "keyof",
    [K.ReadonlyKeyword]: "readonly",
    [K.UniqueKeyword]: "unique",
};

function isTypeLiteral(node: E.Node): node is E.TSLiteralType["literal"] {
    return node.type === N.Literal && !("regex" in node) && node.value !== null
        || node.type === N.UnaryExpression && (node.operator === "+" || node.operator === "-");
}

function isUsingForOf(node: E.VariableDeclaration): node is E.UsingInForOfDeclaration {
    return (node.kind === "using" || node.kind === "await using") && node.declarations.length === 1
        && node.declarations[0].id.type === N.Identifier && node.declarations[0].init === null;
}

function isParameterPropertyParameter(node: E.Parameter): node is E.TSParameterProperty["parameter"] {
    return node.type === N.Identifier || node.type === N.AssignmentPattern && node.left.type === N.Identifier;
}

function isPublicName(name: ClassName): name is PublicName {
    return name.key.type !== N.PrivateIdentifier;
}

function isLeftHandSide(node: E.Node): node is E.LeftHandSideExpression {
    return isExpression(node) && node.type !== N.AssignmentExpression && node.type !== N.AwaitExpression
        && node.type !== N.BinaryExpression && node.type !== N.ChainExpression && node.type !== N.ConditionalExpression
        && node.type !== N.ImportExpression && node.type !== N.LogicalExpression && node.type !== N.TSInstantiationExpression
        && node.type !== N.TSSatisfiesExpression && node.type !== N.UnaryExpression && node.type !== N.UpdateExpression
        && node.type !== N.YieldExpression;
}
