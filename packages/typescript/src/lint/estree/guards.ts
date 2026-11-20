import {
    AST_NODE_TYPES as N,
    type TSESTree as E,
} from "@typescript-eslint/types";

const expressionTypes: ReadonlySet<N> = new Set([
    N.ArrayExpression,
    N.ArrayPattern,
    N.ArrowFunctionExpression,
    N.AssignmentExpression,
    N.AwaitExpression,
    N.BinaryExpression,
    N.CallExpression,
    N.ChainExpression,
    N.ClassExpression,
    N.ConditionalExpression,
    N.FunctionExpression,
    N.Identifier,
    N.ImportExpression,
    N.JSXElement,
    N.JSXFragment,
    N.Literal,
    N.LogicalExpression,
    N.MemberExpression,
    N.MetaProperty,
    N.NewExpression,
    N.ObjectExpression,
    N.ObjectPattern,
    N.SequenceExpression,
    N.Super,
    N.TaggedTemplateExpression,
    N.TemplateLiteral,
    N.ThisExpression,
    N.TSAsExpression,
    N.TSInstantiationExpression,
    N.TSNonNullExpression,
    N.TSSatisfiesExpression,
    N.TSTypeAssertion,
    N.UnaryExpression,
    N.UpdateExpression,
    N.YieldExpression,
]);

const statementTypes: ReadonlySet<N> = new Set([
    N.BlockStatement,
    N.BreakStatement,
    N.ClassDeclaration,
    N.ContinueStatement,
    N.DebuggerStatement,
    N.DoWhileStatement,
    N.EmptyStatement,
    N.ExportAllDeclaration,
    N.ExportDefaultDeclaration,
    N.ExportNamedDeclaration,
    N.ExpressionStatement,
    N.ForInStatement,
    N.ForOfStatement,
    N.ForStatement,
    N.FunctionDeclaration,
    N.IfStatement,
    N.ImportDeclaration,
    N.LabeledStatement,
    N.ReturnStatement,
    N.SwitchStatement,
    N.ThrowStatement,
    N.TryStatement,
    N.TSDeclareFunction,
    N.TSEnumDeclaration,
    N.TSExportAssignment,
    N.TSImportEqualsDeclaration,
    N.TSInterfaceDeclaration,
    N.TSModuleDeclaration,
    N.TSNamespaceExportDeclaration,
    N.TSTypeAliasDeclaration,
    N.VariableDeclaration,
    N.WhileStatement,
    N.WithStatement,
]);

const typeTypes: ReadonlySet<N> = new Set([
    N.TSAbstractKeyword,
    N.TSAnyKeyword,
    N.TSArrayType,
    N.TSAsyncKeyword,
    N.TSBigIntKeyword,
    N.TSBooleanKeyword,
    N.TSConditionalType,
    N.TSConstructorType,
    N.TSDeclareKeyword,
    N.TSExportKeyword,
    N.TSFunctionType,
    N.TSImportType,
    N.TSIndexedAccessType,
    N.TSInferType,
    N.TSIntersectionType,
    N.TSIntrinsicKeyword,
    N.TSLiteralType,
    N.TSMappedType,
    N.TSNamedTupleMember,
    N.TSNeverKeyword,
    N.TSNullKeyword,
    N.TSNumberKeyword,
    N.TSObjectKeyword,
    N.TSOptionalType,
    N.TSPrivateKeyword,
    N.TSProtectedKeyword,
    N.TSPublicKeyword,
    N.TSQualifiedName,
    N.TSReadonlyKeyword,
    N.TSRestType,
    N.TSStaticKeyword,
    N.TSStringKeyword,
    N.TSSymbolKeyword,
    N.TSTemplateLiteralType,
    N.TSThisType,
    N.TSTupleType,
    N.TSTypeLiteral,
    N.TSTypeOperator,
    N.TSTypePredicate,
    N.TSTypeQuery,
    N.TSTypeReference,
    N.TSUndefinedKeyword,
    N.TSUnionType,
    N.TSUnknownKeyword,
    N.TSVoidKeyword,
]);

export function isExpression(node: E.Node): node is E.Expression {
    return expressionTypes.has(node.type);
}

export function isStatement(node: E.Node): node is E.Statement {
    return statementTypes.has(node.type);
}

export function isType(node: E.Node): node is E.TypeNode {
    return typeTypes.has(node.type);
}

export function isBinding(node: E.Node): node is E.BindingName {
    return node.type === N.Identifier || node.type === N.ArrayPattern || node.type === N.ObjectPattern;
}

export function isParameter(node: E.Node): node is E.Parameter {
    return isBinding(node) || node.type === N.AssignmentPattern || node.type === N.RestElement || node.type === N.TSParameterProperty;
}

export type AssignmentTarget = E.BindingName | E.MemberExpression | E.TSAsExpression | E.TSTypeAssertion | E.TSNonNullExpression | E.TSSatisfiesExpression;

export function isAssignmentTarget(node: E.Node): node is AssignmentTarget {
    return isBinding(node) || node.type === N.MemberExpression || node.type === N.TSAsExpression
        || node.type === N.TSTypeAssertion || node.type === N.TSNonNullExpression || node.type === N.TSSatisfiesExpression;
}

export function isProperty(node: E.Node): node is E.Property | E.SpreadElement {
    return node.type === N.Property || node.type === N.SpreadElement;
}

export function isPatternProperty(node: E.Node): node is E.Property | E.RestElement {
    return node.type === N.Property || node.type === N.RestElement;
}

export function isClassElement(node: E.Node): node is E.ClassElement {
    return node.type === N.MethodDefinition || node.type === N.TSAbstractMethodDefinition
        || node.type === N.PropertyDefinition || node.type === N.TSAbstractPropertyDefinition
        || node.type === N.AccessorProperty || node.type === N.TSAbstractAccessorProperty
        || node.type === N.StaticBlock || node.type === N.TSIndexSignature;
}

export function isTypeElement(node: E.Node): node is E.TypeElement {
    return node.type === N.TSPropertySignature || node.type === N.TSMethodSignature
        || node.type === N.TSIndexSignature || node.type === N.TSCallSignatureDeclaration
        || node.type === N.TSConstructSignatureDeclaration;
}

export function hasType<K extends N>(node: E.Node, type: K): node is Extract<E.Node, { type: K; }> {
    return node.type === type;
}
