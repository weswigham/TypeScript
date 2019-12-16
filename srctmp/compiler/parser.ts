import * as ts from "./ts";
const enum SignatureFlags {
    None = 0,
    Yield = 1 << 0,
    Await = 1 << 1,
    Type = 1 << 2,
    IgnoreMissingOpenBrace = 1 << 4,
    JSDoc = 1 << 5
}
let NodeConstructor: new (kind: ts.SyntaxKind, pos?: number, end?: number) => ts.Node;
let TokenConstructor: new (kind: ts.SyntaxKind, pos?: number, end?: number) => ts.Node;
let IdentifierConstructor: new (kind: ts.SyntaxKind, pos?: number, end?: number) => ts.Node;
let SourceFileConstructor: new (kind: ts.SyntaxKind, pos?: number, end?: number) => ts.Node;
export function createNode(kind: ts.SyntaxKind, pos?: number, end?: number): ts.Node {
    if (kind === ts.SyntaxKind.SourceFile) {
        return new (SourceFileConstructor || (SourceFileConstructor = ts.objectAllocator.getSourceFileConstructor()))(kind, pos, end);
    }
    else if (kind === ts.SyntaxKind.Identifier) {
        return new (IdentifierConstructor || (IdentifierConstructor = ts.objectAllocator.getIdentifierConstructor()))(kind, pos, end);
    }
    else if (!ts.isNodeKind(kind)) {
        return new (TokenConstructor || (TokenConstructor = ts.objectAllocator.getTokenConstructor()))(kind, pos, end);
    }
    else {
        return new (NodeConstructor || (NodeConstructor = ts.objectAllocator.getNodeConstructor()))(kind, pos, end);
    }
}
function visitNode<T>(cbNode: (node: ts.Node) => T, node: ts.Node | undefined): T | undefined {
    return node && cbNode(node);
}
function visitNodes<T>(cbNode: (node: ts.Node) => T, cbNodes: ((node: ts.NodeArray<ts.Node>) => T | undefined) | undefined, nodes: ts.NodeArray<ts.Node> | undefined): T | undefined {
    if (nodes) {
        if (cbNodes) {
            return cbNodes(nodes);
        }
        for (const node of nodes) {
            const result = cbNode(node);
            if (result) {
                return result;
            }
        }
    }
}
/*@internal*/
export function isJSDocLikeText(text: string, start: number) {
    return text.charCodeAt(start + 1) === ts.CharacterCodes.asterisk &&
        text.charCodeAt(start + 2) === ts.CharacterCodes.asterisk &&
        text.charCodeAt(start + 3) !== ts.CharacterCodes.slash;
}
/**
 * Invokes a callback for each child of the given node. The 'cbNode' callback is invoked for all child nodes
 * stored in properties. If a 'cbNodes' callback is specified, it is invoked for embedded arrays; otherwise,
 * embedded arrays are flattened and the 'cbNode' callback is invoked for each element. If a callback returns
 * a truthy value, iteration stops and that value is returned. Otherwise, undefined is returned.
 *
 * @param node a given node to visit its children
 * @param cbNode a callback to be invoked for all child nodes
 * @param cbNodes a callback to be invoked for embedded array
 *
 * @remarks `forEachChild` must visit the children of a node in the order
 * that they appear in the source code. The language service depends on this property to locate nodes by position.
 */
export function forEachChild<T>(node: ts.Node, cbNode: (node: ts.Node) => T | undefined, cbNodes?: (nodes: ts.NodeArray<ts.Node>) => T | undefined): T | undefined {
    if (!node || node.kind <= ts.SyntaxKind.LastToken) {
        return;
    }
    switch (node.kind) {
        case ts.SyntaxKind.QualifiedName:
            return visitNode(cbNode, (<ts.QualifiedName>node).left) ||
                visitNode(cbNode, (<ts.QualifiedName>node).right);
        case ts.SyntaxKind.TypeParameter:
            return visitNode(cbNode, (<ts.TypeParameterDeclaration>node).name) ||
                visitNode(cbNode, (<ts.TypeParameterDeclaration>node).constraint) ||
                visitNode(cbNode, (<ts.TypeParameterDeclaration>node).default) ||
                visitNode(cbNode, (<ts.TypeParameterDeclaration>node).expression);
        case ts.SyntaxKind.ShorthandPropertyAssignment:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.ShorthandPropertyAssignment>node).name) ||
                visitNode(cbNode, (<ts.ShorthandPropertyAssignment>node).questionToken) ||
                visitNode(cbNode, (<ts.ShorthandPropertyAssignment>node).exclamationToken) ||
                visitNode(cbNode, (<ts.ShorthandPropertyAssignment>node).equalsToken) ||
                visitNode(cbNode, (<ts.ShorthandPropertyAssignment>node).objectAssignmentInitializer);
        case ts.SyntaxKind.SpreadAssignment:
            return visitNode(cbNode, (<ts.SpreadAssignment>node).expression);
        case ts.SyntaxKind.Parameter:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.ParameterDeclaration>node).dotDotDotToken) ||
                visitNode(cbNode, (<ts.ParameterDeclaration>node).name) ||
                visitNode(cbNode, (<ts.ParameterDeclaration>node).questionToken) ||
                visitNode(cbNode, (<ts.ParameterDeclaration>node).type) ||
                visitNode(cbNode, (<ts.ParameterDeclaration>node).initializer);
        case ts.SyntaxKind.PropertyDeclaration:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.PropertyDeclaration>node).name) ||
                visitNode(cbNode, (<ts.PropertyDeclaration>node).questionToken) ||
                visitNode(cbNode, (<ts.PropertyDeclaration>node).exclamationToken) ||
                visitNode(cbNode, (<ts.PropertyDeclaration>node).type) ||
                visitNode(cbNode, (<ts.PropertyDeclaration>node).initializer);
        case ts.SyntaxKind.PropertySignature:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.PropertySignature>node).name) ||
                visitNode(cbNode, (<ts.PropertySignature>node).questionToken) ||
                visitNode(cbNode, (<ts.PropertySignature>node).type) ||
                visitNode(cbNode, (<ts.PropertySignature>node).initializer);
        case ts.SyntaxKind.PropertyAssignment:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.PropertyAssignment>node).name) ||
                visitNode(cbNode, (<ts.PropertyAssignment>node).questionToken) ||
                visitNode(cbNode, (<ts.PropertyAssignment>node).initializer);
        case ts.SyntaxKind.VariableDeclaration:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.VariableDeclaration>node).name) ||
                visitNode(cbNode, (<ts.VariableDeclaration>node).exclamationToken) ||
                visitNode(cbNode, (<ts.VariableDeclaration>node).type) ||
                visitNode(cbNode, (<ts.VariableDeclaration>node).initializer);
        case ts.SyntaxKind.BindingElement:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.BindingElement>node).dotDotDotToken) ||
                visitNode(cbNode, (<ts.BindingElement>node).propertyName) ||
                visitNode(cbNode, (<ts.BindingElement>node).name) ||
                visitNode(cbNode, (<ts.BindingElement>node).initializer);
        case ts.SyntaxKind.FunctionType:
        case ts.SyntaxKind.ConstructorType:
        case ts.SyntaxKind.CallSignature:
        case ts.SyntaxKind.ConstructSignature:
        case ts.SyntaxKind.IndexSignature:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNodes(cbNode, cbNodes, (<ts.SignatureDeclaration>node).typeParameters) ||
                visitNodes(cbNode, cbNodes, (<ts.SignatureDeclaration>node).parameters) ||
                visitNode(cbNode, (<ts.SignatureDeclaration>node).type);
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.GetAccessor:
        case ts.SyntaxKind.SetAccessor:
        case ts.SyntaxKind.FunctionExpression:
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.ArrowFunction:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.FunctionLikeDeclaration>node).asteriskToken) ||
                visitNode(cbNode, (<ts.FunctionLikeDeclaration>node).name) ||
                visitNode(cbNode, (<ts.FunctionLikeDeclaration>node).questionToken) ||
                visitNode(cbNode, (<ts.FunctionLikeDeclaration>node).exclamationToken) ||
                visitNodes(cbNode, cbNodes, (<ts.FunctionLikeDeclaration>node).typeParameters) ||
                visitNodes(cbNode, cbNodes, (<ts.FunctionLikeDeclaration>node).parameters) ||
                visitNode(cbNode, (<ts.FunctionLikeDeclaration>node).type) ||
                visitNode(cbNode, (<ts.ArrowFunction>node).equalsGreaterThanToken) ||
                visitNode(cbNode, (<ts.FunctionLikeDeclaration>node).body);
        case ts.SyntaxKind.TypeReference:
            return visitNode(cbNode, (<ts.TypeReferenceNode>node).typeName) ||
                visitNodes(cbNode, cbNodes, (<ts.TypeReferenceNode>node).typeArguments);
        case ts.SyntaxKind.TypePredicate:
            return visitNode(cbNode, (<ts.TypePredicateNode>node).assertsModifier) ||
                visitNode(cbNode, (<ts.TypePredicateNode>node).parameterName) ||
                visitNode(cbNode, (<ts.TypePredicateNode>node).type);
        case ts.SyntaxKind.TypeQuery:
            return visitNode(cbNode, (<ts.TypeQueryNode>node).exprName);
        case ts.SyntaxKind.TypeLiteral:
            return visitNodes(cbNode, cbNodes, (<ts.TypeLiteralNode>node).members);
        case ts.SyntaxKind.ArrayType:
            return visitNode(cbNode, (<ts.ArrayTypeNode>node).elementType);
        case ts.SyntaxKind.TupleType:
            return visitNodes(cbNode, cbNodes, (<ts.TupleTypeNode>node).elementTypes);
        case ts.SyntaxKind.UnionType:
        case ts.SyntaxKind.IntersectionType:
            return visitNodes(cbNode, cbNodes, (<ts.UnionOrIntersectionTypeNode>node).types);
        case ts.SyntaxKind.ConditionalType:
            return visitNode(cbNode, (<ts.ConditionalTypeNode>node).checkType) ||
                visitNode(cbNode, (<ts.ConditionalTypeNode>node).extendsType) ||
                visitNode(cbNode, (<ts.ConditionalTypeNode>node).trueType) ||
                visitNode(cbNode, (<ts.ConditionalTypeNode>node).falseType);
        case ts.SyntaxKind.InferType:
            return visitNode(cbNode, (<ts.InferTypeNode>node).typeParameter);
        case ts.SyntaxKind.ImportType:
            return visitNode(cbNode, (<ts.ImportTypeNode>node).argument) ||
                visitNode(cbNode, (<ts.ImportTypeNode>node).qualifier) ||
                visitNodes(cbNode, cbNodes, (<ts.ImportTypeNode>node).typeArguments);
        case ts.SyntaxKind.ParenthesizedType:
        case ts.SyntaxKind.TypeOperator:
            return visitNode(cbNode, (<ts.ParenthesizedTypeNode | ts.TypeOperatorNode>node).type);
        case ts.SyntaxKind.IndexedAccessType:
            return visitNode(cbNode, (<ts.IndexedAccessTypeNode>node).objectType) ||
                visitNode(cbNode, (<ts.IndexedAccessTypeNode>node).indexType);
        case ts.SyntaxKind.MappedType:
            return visitNode(cbNode, (<ts.MappedTypeNode>node).readonlyToken) ||
                visitNode(cbNode, (<ts.MappedTypeNode>node).typeParameter) ||
                visitNode(cbNode, (<ts.MappedTypeNode>node).questionToken) ||
                visitNode(cbNode, (<ts.MappedTypeNode>node).type);
        case ts.SyntaxKind.LiteralType:
            return visitNode(cbNode, (<ts.LiteralTypeNode>node).literal);
        case ts.SyntaxKind.ObjectBindingPattern:
        case ts.SyntaxKind.ArrayBindingPattern:
            return visitNodes(cbNode, cbNodes, (<ts.BindingPattern>node).elements);
        case ts.SyntaxKind.ArrayLiteralExpression:
            return visitNodes(cbNode, cbNodes, (<ts.ArrayLiteralExpression>node).elements);
        case ts.SyntaxKind.ObjectLiteralExpression:
            return visitNodes(cbNode, cbNodes, (<ts.ObjectLiteralExpression>node).properties);
        case ts.SyntaxKind.PropertyAccessExpression:
            return visitNode(cbNode, (<ts.PropertyAccessExpression>node).expression) ||
                visitNode(cbNode, (<ts.PropertyAccessExpression>node).questionDotToken) ||
                visitNode(cbNode, (<ts.PropertyAccessExpression>node).name);
        case ts.SyntaxKind.ElementAccessExpression:
            return visitNode(cbNode, (<ts.ElementAccessExpression>node).expression) ||
                visitNode(cbNode, (<ts.ElementAccessExpression>node).questionDotToken) ||
                visitNode(cbNode, (<ts.ElementAccessExpression>node).argumentExpression);
        case ts.SyntaxKind.CallExpression:
        case ts.SyntaxKind.NewExpression:
            return visitNode(cbNode, (<ts.CallExpression>node).expression) ||
                visitNode(cbNode, (<ts.CallExpression>node).questionDotToken) ||
                visitNodes(cbNode, cbNodes, (<ts.CallExpression>node).typeArguments) ||
                visitNodes(cbNode, cbNodes, (<ts.CallExpression>node).arguments);
        case ts.SyntaxKind.TaggedTemplateExpression:
            return visitNode(cbNode, (<ts.TaggedTemplateExpression>node).tag) ||
                visitNode(cbNode, (<ts.TaggedTemplateExpression>node).questionDotToken) ||
                visitNodes(cbNode, cbNodes, (<ts.TaggedTemplateExpression>node).typeArguments) ||
                visitNode(cbNode, (<ts.TaggedTemplateExpression>node).template);
        case ts.SyntaxKind.TypeAssertionExpression:
            return visitNode(cbNode, (<ts.TypeAssertion>node).type) ||
                visitNode(cbNode, (<ts.TypeAssertion>node).expression);
        case ts.SyntaxKind.ParenthesizedExpression:
            return visitNode(cbNode, (<ts.ParenthesizedExpression>node).expression);
        case ts.SyntaxKind.DeleteExpression:
            return visitNode(cbNode, (<ts.DeleteExpression>node).expression);
        case ts.SyntaxKind.TypeOfExpression:
            return visitNode(cbNode, (<ts.TypeOfExpression>node).expression);
        case ts.SyntaxKind.VoidExpression:
            return visitNode(cbNode, (<ts.VoidExpression>node).expression);
        case ts.SyntaxKind.PrefixUnaryExpression:
            return visitNode(cbNode, (<ts.PrefixUnaryExpression>node).operand);
        case ts.SyntaxKind.YieldExpression:
            return visitNode(cbNode, (<ts.YieldExpression>node).asteriskToken) ||
                visitNode(cbNode, (<ts.YieldExpression>node).expression);
        case ts.SyntaxKind.AwaitExpression:
            return visitNode(cbNode, (<ts.AwaitExpression>node).expression);
        case ts.SyntaxKind.PostfixUnaryExpression:
            return visitNode(cbNode, (<ts.PostfixUnaryExpression>node).operand);
        case ts.SyntaxKind.BinaryExpression:
            return visitNode(cbNode, (<ts.BinaryExpression>node).left) ||
                visitNode(cbNode, (<ts.BinaryExpression>node).operatorToken) ||
                visitNode(cbNode, (<ts.BinaryExpression>node).right);
        case ts.SyntaxKind.AsExpression:
            return visitNode(cbNode, (<ts.AsExpression>node).expression) ||
                visitNode(cbNode, (<ts.AsExpression>node).type);
        case ts.SyntaxKind.NonNullExpression:
            return visitNode(cbNode, (<ts.NonNullExpression>node).expression);
        case ts.SyntaxKind.MetaProperty:
            return visitNode(cbNode, (<ts.MetaProperty>node).name);
        case ts.SyntaxKind.ConditionalExpression:
            return visitNode(cbNode, (<ts.ConditionalExpression>node).condition) ||
                visitNode(cbNode, (<ts.ConditionalExpression>node).questionToken) ||
                visitNode(cbNode, (<ts.ConditionalExpression>node).whenTrue) ||
                visitNode(cbNode, (<ts.ConditionalExpression>node).colonToken) ||
                visitNode(cbNode, (<ts.ConditionalExpression>node).whenFalse);
        case ts.SyntaxKind.SpreadElement:
            return visitNode(cbNode, (<ts.SpreadElement>node).expression);
        case ts.SyntaxKind.Block:
        case ts.SyntaxKind.ModuleBlock:
            return visitNodes(cbNode, cbNodes, (<ts.Block>node).statements);
        case ts.SyntaxKind.SourceFile:
            return visitNodes(cbNode, cbNodes, (<ts.SourceFile>node).statements) ||
                visitNode(cbNode, (<ts.SourceFile>node).endOfFileToken);
        case ts.SyntaxKind.VariableStatement:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.VariableStatement>node).declarationList);
        case ts.SyntaxKind.VariableDeclarationList:
            return visitNodes(cbNode, cbNodes, (<ts.VariableDeclarationList>node).declarations);
        case ts.SyntaxKind.ExpressionStatement:
            return visitNode(cbNode, (<ts.ExpressionStatement>node).expression);
        case ts.SyntaxKind.IfStatement:
            return visitNode(cbNode, (<ts.IfStatement>node).expression) ||
                visitNode(cbNode, (<ts.IfStatement>node).thenStatement) ||
                visitNode(cbNode, (<ts.IfStatement>node).elseStatement);
        case ts.SyntaxKind.DoStatement:
            return visitNode(cbNode, (<ts.DoStatement>node).statement) ||
                visitNode(cbNode, (<ts.DoStatement>node).expression);
        case ts.SyntaxKind.WhileStatement:
            return visitNode(cbNode, (<ts.WhileStatement>node).expression) ||
                visitNode(cbNode, (<ts.WhileStatement>node).statement);
        case ts.SyntaxKind.ForStatement:
            return visitNode(cbNode, (<ts.ForStatement>node).initializer) ||
                visitNode(cbNode, (<ts.ForStatement>node).condition) ||
                visitNode(cbNode, (<ts.ForStatement>node).incrementor) ||
                visitNode(cbNode, (<ts.ForStatement>node).statement);
        case ts.SyntaxKind.ForInStatement:
            return visitNode(cbNode, (<ts.ForInStatement>node).initializer) ||
                visitNode(cbNode, (<ts.ForInStatement>node).expression) ||
                visitNode(cbNode, (<ts.ForInStatement>node).statement);
        case ts.SyntaxKind.ForOfStatement:
            return visitNode(cbNode, (<ts.ForOfStatement>node).awaitModifier) ||
                visitNode(cbNode, (<ts.ForOfStatement>node).initializer) ||
                visitNode(cbNode, (<ts.ForOfStatement>node).expression) ||
                visitNode(cbNode, (<ts.ForOfStatement>node).statement);
        case ts.SyntaxKind.ContinueStatement:
        case ts.SyntaxKind.BreakStatement:
            return visitNode(cbNode, (<ts.BreakOrContinueStatement>node).label);
        case ts.SyntaxKind.ReturnStatement:
            return visitNode(cbNode, (<ts.ReturnStatement>node).expression);
        case ts.SyntaxKind.WithStatement:
            return visitNode(cbNode, (<ts.WithStatement>node).expression) ||
                visitNode(cbNode, (<ts.WithStatement>node).statement);
        case ts.SyntaxKind.SwitchStatement:
            return visitNode(cbNode, (<ts.SwitchStatement>node).expression) ||
                visitNode(cbNode, (<ts.SwitchStatement>node).caseBlock);
        case ts.SyntaxKind.CaseBlock:
            return visitNodes(cbNode, cbNodes, (<ts.CaseBlock>node).clauses);
        case ts.SyntaxKind.CaseClause:
            return visitNode(cbNode, (<ts.CaseClause>node).expression) ||
                visitNodes(cbNode, cbNodes, (<ts.CaseClause>node).statements);
        case ts.SyntaxKind.DefaultClause:
            return visitNodes(cbNode, cbNodes, (<ts.DefaultClause>node).statements);
        case ts.SyntaxKind.LabeledStatement:
            return visitNode(cbNode, (<ts.LabeledStatement>node).label) ||
                visitNode(cbNode, (<ts.LabeledStatement>node).statement);
        case ts.SyntaxKind.ThrowStatement:
            return visitNode(cbNode, (<ts.ThrowStatement>node).expression);
        case ts.SyntaxKind.TryStatement:
            return visitNode(cbNode, (<ts.TryStatement>node).tryBlock) ||
                visitNode(cbNode, (<ts.TryStatement>node).catchClause) ||
                visitNode(cbNode, (<ts.TryStatement>node).finallyBlock);
        case ts.SyntaxKind.CatchClause:
            return visitNode(cbNode, (<ts.CatchClause>node).variableDeclaration) ||
                visitNode(cbNode, (<ts.CatchClause>node).block);
        case ts.SyntaxKind.Decorator:
            return visitNode(cbNode, (<ts.Decorator>node).expression);
        case ts.SyntaxKind.ClassDeclaration:
        case ts.SyntaxKind.ClassExpression:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.ClassLikeDeclaration>node).name) ||
                visitNodes(cbNode, cbNodes, (<ts.ClassLikeDeclaration>node).typeParameters) ||
                visitNodes(cbNode, cbNodes, (<ts.ClassLikeDeclaration>node).heritageClauses) ||
                visitNodes(cbNode, cbNodes, (<ts.ClassLikeDeclaration>node).members);
        case ts.SyntaxKind.InterfaceDeclaration:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.InterfaceDeclaration>node).name) ||
                visitNodes(cbNode, cbNodes, (<ts.InterfaceDeclaration>node).typeParameters) ||
                visitNodes(cbNode, cbNodes, (<ts.ClassDeclaration>node).heritageClauses) ||
                visitNodes(cbNode, cbNodes, (<ts.InterfaceDeclaration>node).members);
        case ts.SyntaxKind.TypeAliasDeclaration:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.TypeAliasDeclaration>node).name) ||
                visitNodes(cbNode, cbNodes, (<ts.TypeAliasDeclaration>node).typeParameters) ||
                visitNode(cbNode, (<ts.TypeAliasDeclaration>node).type);
        case ts.SyntaxKind.EnumDeclaration:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.EnumDeclaration>node).name) ||
                visitNodes(cbNode, cbNodes, (<ts.EnumDeclaration>node).members);
        case ts.SyntaxKind.EnumMember:
            return visitNode(cbNode, (<ts.EnumMember>node).name) ||
                visitNode(cbNode, (<ts.EnumMember>node).initializer);
        case ts.SyntaxKind.ModuleDeclaration:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.ModuleDeclaration>node).name) ||
                visitNode(cbNode, (<ts.ModuleDeclaration>node).body);
        case ts.SyntaxKind.ImportEqualsDeclaration:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.ImportEqualsDeclaration>node).name) ||
                visitNode(cbNode, (<ts.ImportEqualsDeclaration>node).moduleReference);
        case ts.SyntaxKind.ImportDeclaration:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.ImportDeclaration>node).importClause) ||
                visitNode(cbNode, (<ts.ImportDeclaration>node).moduleSpecifier);
        case ts.SyntaxKind.ImportClause:
            return visitNode(cbNode, (<ts.ImportClause>node).name) ||
                visitNode(cbNode, (<ts.ImportClause>node).namedBindings);
        case ts.SyntaxKind.NamespaceExportDeclaration:
            return visitNode(cbNode, (<ts.NamespaceExportDeclaration>node).name);
        case ts.SyntaxKind.NamespaceImport:
            return visitNode(cbNode, (<ts.NamespaceImport>node).name);
        case ts.SyntaxKind.NamedImports:
        case ts.SyntaxKind.NamedExports:
            return visitNodes(cbNode, cbNodes, (<ts.NamedImportsOrExports>node).elements);
        case ts.SyntaxKind.ExportDeclaration:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.ExportDeclaration>node).exportClause) ||
                visitNode(cbNode, (<ts.ExportDeclaration>node).moduleSpecifier);
        case ts.SyntaxKind.ImportSpecifier:
        case ts.SyntaxKind.ExportSpecifier:
            return visitNode(cbNode, (<ts.ImportOrExportSpecifier>node).propertyName) ||
                visitNode(cbNode, (<ts.ImportOrExportSpecifier>node).name);
        case ts.SyntaxKind.ExportAssignment:
            return visitNodes(cbNode, cbNodes, node.decorators) ||
                visitNodes(cbNode, cbNodes, node.modifiers) ||
                visitNode(cbNode, (<ts.ExportAssignment>node).expression);
        case ts.SyntaxKind.TemplateExpression:
            return visitNode(cbNode, (<ts.TemplateExpression>node).head) || visitNodes(cbNode, cbNodes, (<ts.TemplateExpression>node).templateSpans);
        case ts.SyntaxKind.TemplateSpan:
            return visitNode(cbNode, (<ts.TemplateSpan>node).expression) || visitNode(cbNode, (<ts.TemplateSpan>node).literal);
        case ts.SyntaxKind.ComputedPropertyName:
            return visitNode(cbNode, (<ts.ComputedPropertyName>node).expression);
        case ts.SyntaxKind.HeritageClause:
            return visitNodes(cbNode, cbNodes, (<ts.HeritageClause>node).types);
        case ts.SyntaxKind.ExpressionWithTypeArguments:
            return visitNode(cbNode, (<ts.ExpressionWithTypeArguments>node).expression) ||
                visitNodes(cbNode, cbNodes, (<ts.ExpressionWithTypeArguments>node).typeArguments);
        case ts.SyntaxKind.ExternalModuleReference:
            return visitNode(cbNode, (<ts.ExternalModuleReference>node).expression);
        case ts.SyntaxKind.MissingDeclaration:
            return visitNodes(cbNode, cbNodes, node.decorators);
        case ts.SyntaxKind.CommaListExpression:
            return visitNodes(cbNode, cbNodes, (<ts.CommaListExpression>node).elements);
        case ts.SyntaxKind.JsxElement:
            return visitNode(cbNode, (<ts.JsxElement>node).openingElement) ||
                visitNodes(cbNode, cbNodes, (<ts.JsxElement>node).children) ||
                visitNode(cbNode, (<ts.JsxElement>node).closingElement);
        case ts.SyntaxKind.JsxFragment:
            return visitNode(cbNode, (<ts.JsxFragment>node).openingFragment) ||
                visitNodes(cbNode, cbNodes, (<ts.JsxFragment>node).children) ||
                visitNode(cbNode, (<ts.JsxFragment>node).closingFragment);
        case ts.SyntaxKind.JsxSelfClosingElement:
        case ts.SyntaxKind.JsxOpeningElement:
            return visitNode(cbNode, (<ts.JsxOpeningLikeElement>node).tagName) ||
                visitNodes(cbNode, cbNodes, (<ts.JsxOpeningLikeElement>node).typeArguments) ||
                visitNode(cbNode, (<ts.JsxOpeningLikeElement>node).attributes);
        case ts.SyntaxKind.JsxAttributes:
            return visitNodes(cbNode, cbNodes, (<ts.JsxAttributes>node).properties);
        case ts.SyntaxKind.JsxAttribute:
            return visitNode(cbNode, (<ts.JsxAttribute>node).name) ||
                visitNode(cbNode, (<ts.JsxAttribute>node).initializer);
        case ts.SyntaxKind.JsxSpreadAttribute:
            return visitNode(cbNode, (<ts.JsxSpreadAttribute>node).expression);
        case ts.SyntaxKind.JsxExpression:
            return visitNode(cbNode, (node as ts.JsxExpression).dotDotDotToken) ||
                visitNode(cbNode, (node as ts.JsxExpression).expression);
        case ts.SyntaxKind.JsxClosingElement:
            return visitNode(cbNode, (<ts.JsxClosingElement>node).tagName);
        case ts.SyntaxKind.OptionalType:
        case ts.SyntaxKind.RestType:
        case ts.SyntaxKind.JSDocTypeExpression:
        case ts.SyntaxKind.JSDocNonNullableType:
        case ts.SyntaxKind.JSDocNullableType:
        case ts.SyntaxKind.JSDocOptionalType:
        case ts.SyntaxKind.JSDocVariadicType:
            return visitNode(cbNode, (<ts.OptionalTypeNode | ts.RestTypeNode | ts.JSDocTypeExpression | ts.JSDocTypeReferencingNode>node).type);
        case ts.SyntaxKind.JSDocFunctionType:
            return visitNodes(cbNode, cbNodes, (<ts.JSDocFunctionType>node).parameters) ||
                visitNode(cbNode, (<ts.JSDocFunctionType>node).type);
        case ts.SyntaxKind.JSDocComment:
            return visitNodes(cbNode, cbNodes, (<ts.JSDoc>node).tags);
        case ts.SyntaxKind.JSDocParameterTag:
        case ts.SyntaxKind.JSDocPropertyTag:
            return visitNode(cbNode, (node as ts.JSDocTag).tagName) ||
                ((node as ts.JSDocPropertyLikeTag).isNameFirst
                    ? visitNode(cbNode, (<ts.JSDocPropertyLikeTag>node).name) ||
                        visitNode(cbNode, (<ts.JSDocPropertyLikeTag>node).typeExpression)
                    : visitNode(cbNode, (<ts.JSDocPropertyLikeTag>node).typeExpression) ||
                        visitNode(cbNode, (<ts.JSDocPropertyLikeTag>node).name));
        case ts.SyntaxKind.JSDocAuthorTag:
            return visitNode(cbNode, (node as ts.JSDocTag).tagName);
        case ts.SyntaxKind.JSDocAugmentsTag:
            return visitNode(cbNode, (node as ts.JSDocTag).tagName) ||
                visitNode(cbNode, (<ts.JSDocAugmentsTag>node).class);
        case ts.SyntaxKind.JSDocTemplateTag:
            return visitNode(cbNode, (node as ts.JSDocTag).tagName) ||
                visitNode(cbNode, (<ts.JSDocTemplateTag>node).constraint) ||
                visitNodes(cbNode, cbNodes, (<ts.JSDocTemplateTag>node).typeParameters);
        case ts.SyntaxKind.JSDocTypedefTag:
            return visitNode(cbNode, (node as ts.JSDocTag).tagName) ||
                ((node as ts.JSDocTypedefTag).typeExpression &&
                    (node as ts.JSDocTypedefTag).typeExpression!.kind === ts.SyntaxKind.JSDocTypeExpression
                    ? visitNode(cbNode, (<ts.JSDocTypedefTag>node).typeExpression) ||
                        visitNode(cbNode, (<ts.JSDocTypedefTag>node).fullName)
                    : visitNode(cbNode, (<ts.JSDocTypedefTag>node).fullName) ||
                        visitNode(cbNode, (<ts.JSDocTypedefTag>node).typeExpression));
        case ts.SyntaxKind.JSDocCallbackTag:
            return visitNode(cbNode, (node as ts.JSDocTag).tagName) ||
                visitNode(cbNode, (node as ts.JSDocCallbackTag).fullName) ||
                visitNode(cbNode, (node as ts.JSDocCallbackTag).typeExpression);
        case ts.SyntaxKind.JSDocReturnTag:
        case ts.SyntaxKind.JSDocTypeTag:
        case ts.SyntaxKind.JSDocThisTag:
        case ts.SyntaxKind.JSDocEnumTag:
            return visitNode(cbNode, (node as ts.JSDocTag).tagName) ||
                visitNode(cbNode, (node as ts.JSDocReturnTag | ts.JSDocTypeTag | ts.JSDocThisTag | ts.JSDocEnumTag).typeExpression);
        case ts.SyntaxKind.JSDocSignature:
            return ts.forEach((<ts.JSDocSignature>node).typeParameters, cbNode) ||
                ts.forEach((<ts.JSDocSignature>node).parameters, cbNode) ||
                visitNode(cbNode, (<ts.JSDocSignature>node).type);
        case ts.SyntaxKind.JSDocTypeLiteral:
            return ts.forEach((node as ts.JSDocTypeLiteral).jsDocPropertyTags, cbNode);
        case ts.SyntaxKind.JSDocTag:
        case ts.SyntaxKind.JSDocClassTag:
            return visitNode(cbNode, (node as ts.JSDocTag).tagName);
        case ts.SyntaxKind.PartiallyEmittedExpression:
            return visitNode(cbNode, (<ts.PartiallyEmittedExpression>node).expression);
    }
}
export function createSourceFile(fileName: string, sourceText: string, languageVersion: ts.ScriptTarget, setParentNodes = false, scriptKind?: ts.ScriptKind): ts.SourceFile {
    ts.performance.mark("beforeParse");
    let result: ts.SourceFile;
    ts.perfLogger.logStartParseSourceFile(fileName);
    if (languageVersion === ts.ScriptTarget.JSON) {
        result = Parser.parseSourceFile(fileName, sourceText, languageVersion, /*syntaxCursor*/ undefined, setParentNodes, ts.ScriptKind.JSON);
    }
    else {
        result = Parser.parseSourceFile(fileName, sourceText, languageVersion, /*syntaxCursor*/ undefined, setParentNodes, scriptKind);
    }
    ts.perfLogger.logStopParseSourceFile();
    ts.performance.mark("afterParse");
    ts.performance.measure("Parse", "beforeParse", "afterParse");
    return result;
}
export function parseIsolatedEntityName(text: string, languageVersion: ts.ScriptTarget): ts.EntityName | undefined {
    return Parser.parseIsolatedEntityName(text, languageVersion);
}
/**
 * Parse json text into SyntaxTree and return node and parse errors if any
 * @param fileName
 * @param sourceText
 */
export function parseJsonText(fileName: string, sourceText: string): ts.JsonSourceFile {
    return Parser.parseJsonText(fileName, sourceText);
}
// See also `isExternalOrCommonJsModule` in utilities.ts
export function isExternalModule(file: ts.SourceFile): boolean {
    return file.externalModuleIndicator !== undefined;
}
// Produces a new SourceFile for the 'newText' provided. The 'textChangeRange' parameter
// indicates what changed between the 'text' that this SourceFile has and the 'newText'.
// The SourceFile will be created with the compiler attempting to reuse as many nodes from
// this file as possible.
//
// Note: this function mutates nodes from this SourceFile. That means any existing nodes
// from this SourceFile that are being held onto may change as a result (including
// becoming detached from any SourceFile).  It is recommended that this SourceFile not
// be used once 'update' is called on it.
export function updateSourceFile(sourceFile: ts.SourceFile, newText: string, textChangeRange: ts.TextChangeRange, aggressiveChecks = false): ts.SourceFile {
    const newSourceFile = IncrementalParser.updateSourceFile(sourceFile, newText, textChangeRange, aggressiveChecks);
    // Because new source file node is created, it may not have the flag PossiblyContainDynamicImport. This is the case if there is no new edit to add dynamic import.
    // We will manually port the flag to the new source file.
    newSourceFile.flags |= (sourceFile.flags & ts.NodeFlags.PermanentlySetIncrementalFlags);
    return newSourceFile;
}
/* @internal */
export function parseIsolatedJSDocComment(content: string, start?: number, length?: number) {
    const result = Parser.JSDocParser.parseIsolatedJSDocComment(content, start, length);
    if (result && result.jsDoc) {
        // because the jsDocComment was parsed out of the source file, it might
        // not be covered by the fixupParentReferences.
        Parser.fixupParentReferences(result.jsDoc);
    }
    return result;
}
/* @internal */
// Exposed only for testing.
export function parseJSDocTypeExpressionForTests(content: string, start?: number, length?: number) {
    return Parser.JSDocParser.parseJSDocTypeExpressionForTests(content, start, length);
}
// Implement the parser as a singleton module.  We do this for perf reasons because creating
// parser instances can actually be expensive enough to impact us on projects with many source
// files.
namespace Parser {
    // Share a single scanner across all calls to parse a source file.  This helps speed things
    // up by avoiding the cost of creating/compiling scanners over and over again.
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, /*skipTrivia*/ true);
    const disallowInAndDecoratorContext = ts.NodeFlags.DisallowInContext | ts.NodeFlags.DecoratorContext;
    // capture constructors in 'initializeState' to avoid null checks
    let NodeConstructor: new (kind: ts.SyntaxKind, pos: number, end: number) => ts.Node;
    let TokenConstructor: new (kind: ts.SyntaxKind, pos: number, end: number) => ts.Node;
    let IdentifierConstructor: new (kind: ts.SyntaxKind, pos: number, end: number) => ts.Node;
    let SourceFileConstructor: new (kind: ts.SyntaxKind, pos: number, end: number) => ts.Node;
    let sourceFile: ts.SourceFile;
    let parseDiagnostics: ts.DiagnosticWithLocation[];
    let syntaxCursor: IncrementalParser.SyntaxCursor | undefined;
    let currentToken: ts.SyntaxKind;
    let sourceText: string;
    let nodeCount: number;
    let identifiers: ts.Map<string>;
    let identifierCount: number;
    let parsingContext: ParsingContext;
    let notParenthesizedArrow: ts.Map<true> | undefined;
    // Flags that dictate what parsing context we're in.  For example:
    // Whether or not we are in strict parsing mode.  All that changes in strict parsing mode is
    // that some tokens that would be considered identifiers may be considered keywords.
    //
    // When adding more parser context flags, consider which is the more common case that the
    // flag will be in.  This should be the 'false' state for that flag.  The reason for this is
    // that we don't store data in our nodes unless the value is in the *non-default* state.  So,
    // for example, more often than code 'allows-in' (or doesn't 'disallow-in').  We opt for
    // 'disallow-in' set to 'false'.  Otherwise, if we had 'allowsIn' set to 'true', then almost
    // all nodes would need extra state on them to store this info.
    //
    // Note: 'allowIn' and 'allowYield' track 1:1 with the [in] and [yield] concepts in the ES6
    // grammar specification.
    //
    // An important thing about these context concepts.  By default they are effectively inherited
    // while parsing through every grammar production.  i.e. if you don't change them, then when
    // you parse a sub-production, it will have the same context values as the parent production.
    // This is great most of the time.  After all, consider all the 'expression' grammar productions
    // and how nearly all of them pass along the 'in' and 'yield' context values:
    //
    // EqualityExpression[In, Yield] :
    //      RelationalExpression[?In, ?Yield]
    //      EqualityExpression[?In, ?Yield] == RelationalExpression[?In, ?Yield]
    //      EqualityExpression[?In, ?Yield] != RelationalExpression[?In, ?Yield]
    //      EqualityExpression[?In, ?Yield] === RelationalExpression[?In, ?Yield]
    //      EqualityExpression[?In, ?Yield] !== RelationalExpression[?In, ?Yield]
    //
    // Where you have to be careful is then understanding what the points are in the grammar
    // where the values are *not* passed along.  For example:
    //
    // SingleNameBinding[Yield,GeneratorParameter]
    //      [+GeneratorParameter]BindingIdentifier[Yield] Initializer[In]opt
    //      [~GeneratorParameter]BindingIdentifier[?Yield]Initializer[In, ?Yield]opt
    //
    // Here this is saying that if the GeneratorParameter context flag is set, that we should
    // explicitly set the 'yield' context flag to false before calling into the BindingIdentifier
    // and we should explicitly unset the 'yield' context flag before calling into the Initializer.
    // production.  Conversely, if the GeneratorParameter context flag is not set, then we
    // should leave the 'yield' context flag alone.
    //
    // Getting this all correct is tricky and requires careful reading of the grammar to
    // understand when these values should be changed versus when they should be inherited.
    //
    // Note: it should not be necessary to save/restore these flags during speculative/lookahead
    // parsing.  These context flags are naturally stored and restored through normal recursive
    // descent parsing and unwinding.
    let contextFlags: ts.NodeFlags;
    // Whether or not we've had a parse error since creating the last AST node.  If we have
    // encountered an error, it will be stored on the next AST node we create.  Parse errors
    // can be broken down into three categories:
    //
    // 1) An error that occurred during scanning.  For example, an unterminated literal, or a
    //    character that was completely not understood.
    //
    // 2) A token was expected, but was not present.  This type of error is commonly produced
    //    by the 'parseExpected' function.
    //
    // 3) A token was present that no parsing function was able to consume.  This type of error
    //    only occurs in the 'abortParsingListOrMoveToNextToken' function when the parser
    //    decides to skip the token.
    //
    // In all of these cases, we want to mark the next node as having had an error before it.
    // With this mark, we can know in incremental settings if this node can be reused, or if
    // we have to reparse it.  If we don't keep this information around, we may just reuse the
    // node.  in that event we would then not produce the same errors as we did before, causing
    // significant confusion problems.
    //
    // Note: it is necessary that this value be saved/restored during speculative/lookahead
    // parsing.  During lookahead parsing, we will often create a node.  That node will have
    // this value attached, and then this value will be set back to 'false'.  If we decide to
    // rewind, we must get back to the same value we had prior to the lookahead.
    //
    // Note: any errors at the end of the file that do not precede a regular node, should get
    // attached to the EOF token.
    let parseErrorBeforeNextFinishedNode = false;
    export function parseSourceFile(fileName: string, sourceText: string, languageVersion: ts.ScriptTarget, syntaxCursor: IncrementalParser.SyntaxCursor | undefined, setParentNodes = false, scriptKind?: ts.ScriptKind): ts.SourceFile {
        scriptKind = ts.ensureScriptKind(fileName, scriptKind);
        if (scriptKind === ts.ScriptKind.JSON) {
            const result = parseJsonText(fileName, sourceText, languageVersion, syntaxCursor, setParentNodes);
            ts.convertToObjectWorker(result, result.parseDiagnostics, /*returnValue*/ false, /*knownRootOptions*/ undefined, /*jsonConversionNotifier*/ undefined);
            result.referencedFiles = ts.emptyArray;
            result.typeReferenceDirectives = ts.emptyArray;
            result.libReferenceDirectives = ts.emptyArray;
            result.amdDependencies = ts.emptyArray;
            result.hasNoDefaultLib = false;
            result.pragmas = ts.emptyMap;
            return result;
        }
        initializeState(sourceText, languageVersion, syntaxCursor, scriptKind);
        const result = parseSourceFileWorker(fileName, languageVersion, setParentNodes, scriptKind);
        clearState();
        return result;
    }
    export function parseIsolatedEntityName(content: string, languageVersion: ts.ScriptTarget): ts.EntityName | undefined {
        // Choice of `isDeclarationFile` should be arbitrary
        initializeState(content, languageVersion, /*syntaxCursor*/ undefined, ts.ScriptKind.JS);
        // Prime the scanner.
        nextToken();
        const entityName = parseEntityName(/*allowReservedWords*/ true);
        const isInvalid = token() === ts.SyntaxKind.EndOfFileToken && !parseDiagnostics.length;
        clearState();
        return isInvalid ? entityName : undefined;
    }
    export function parseJsonText(fileName: string, sourceText: string, languageVersion: ts.ScriptTarget = ts.ScriptTarget.ES2015, syntaxCursor?: IncrementalParser.SyntaxCursor, setParentNodes?: boolean): ts.JsonSourceFile {
        initializeState(sourceText, languageVersion, syntaxCursor, ts.ScriptKind.JSON);
        // Set source file so that errors will be reported with this file name
        sourceFile = createSourceFile(fileName, ts.ScriptTarget.ES2015, ts.ScriptKind.JSON, /*isDeclaration*/ false);
        sourceFile.flags = contextFlags;
        // Prime the scanner.
        nextToken();
        const pos = getNodePos();
        if (token() === ts.SyntaxKind.EndOfFileToken) {
            sourceFile.statements = createNodeArray([], pos, pos);
            sourceFile.endOfFileToken = parseTokenNode<ts.EndOfFileToken>();
        }
        else {
            const statement = (createNode(ts.SyntaxKind.ExpressionStatement) as ts.JsonObjectExpressionStatement);
            switch (token()) {
                case ts.SyntaxKind.OpenBracketToken:
                    statement.expression = parseArrayLiteralExpression();
                    break;
                case ts.SyntaxKind.TrueKeyword:
                case ts.SyntaxKind.FalseKeyword:
                case ts.SyntaxKind.NullKeyword:
                    statement.expression = parseTokenNode<ts.BooleanLiteral | ts.NullLiteral>();
                    break;
                case ts.SyntaxKind.MinusToken:
                    if (lookAhead(() => nextToken() === ts.SyntaxKind.NumericLiteral && nextToken() !== ts.SyntaxKind.ColonToken)) {
                        statement.expression = (parsePrefixUnaryExpression() as ts.JsonMinusNumericLiteral);
                    }
                    else {
                        statement.expression = parseObjectLiteralExpression();
                    }
                    break;
                case ts.SyntaxKind.NumericLiteral:
                case ts.SyntaxKind.StringLiteral:
                    if (lookAhead(() => nextToken() !== ts.SyntaxKind.ColonToken)) {
                        statement.expression = (parseLiteralNode() as ts.StringLiteral | ts.NumericLiteral);
                        break;
                    }
                // falls through
                default:
                    statement.expression = parseObjectLiteralExpression();
                    break;
            }
            finishNode(statement);
            sourceFile.statements = createNodeArray([statement], pos);
            sourceFile.endOfFileToken = parseExpectedToken(ts.SyntaxKind.EndOfFileToken, ts.Diagnostics.Unexpected_token);
        }
        if (setParentNodes) {
            fixupParentReferences(sourceFile);
        }
        sourceFile.nodeCount = nodeCount;
        sourceFile.identifierCount = identifierCount;
        sourceFile.identifiers = identifiers;
        sourceFile.parseDiagnostics = parseDiagnostics;
        const result = (sourceFile as ts.JsonSourceFile);
        clearState();
        return result;
    }
    function getLanguageVariant(scriptKind: ts.ScriptKind) {
        // .tsx and .jsx files are treated as jsx language variant.
        return scriptKind === ts.ScriptKind.TSX || scriptKind === ts.ScriptKind.JSX || scriptKind === ts.ScriptKind.JS || scriptKind === ts.ScriptKind.JSON ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard;
    }
    function initializeState(_sourceText: string, languageVersion: ts.ScriptTarget, _syntaxCursor: IncrementalParser.SyntaxCursor | undefined, scriptKind: ts.ScriptKind) {
        NodeConstructor = ts.objectAllocator.getNodeConstructor();
        TokenConstructor = ts.objectAllocator.getTokenConstructor();
        IdentifierConstructor = ts.objectAllocator.getIdentifierConstructor();
        SourceFileConstructor = ts.objectAllocator.getSourceFileConstructor();
        sourceText = _sourceText;
        syntaxCursor = _syntaxCursor;
        parseDiagnostics = [];
        parsingContext = 0;
        identifiers = ts.createMap<string>();
        identifierCount = 0;
        nodeCount = 0;
        switch (scriptKind) {
            case ts.ScriptKind.JS:
            case ts.ScriptKind.JSX:
                contextFlags = ts.NodeFlags.JavaScriptFile;
                break;
            case ts.ScriptKind.JSON:
                contextFlags = ts.NodeFlags.JavaScriptFile | ts.NodeFlags.JsonFile;
                break;
            default:
                contextFlags = ts.NodeFlags.None;
                break;
        }
        parseErrorBeforeNextFinishedNode = false;
        // Initialize and prime the scanner before parsing the source elements.
        scanner.setText(sourceText);
        scanner.setOnError(scanError);
        scanner.setScriptTarget(languageVersion);
        scanner.setLanguageVariant(getLanguageVariant(scriptKind));
    }
    function clearState() {
        // Clear out the text the scanner is pointing at, so it doesn't keep anything alive unnecessarily.
        scanner.setText("");
        scanner.setOnError(undefined);
        // Clear any data.  We don't want to accidentally hold onto it for too long.
        parseDiagnostics = undefined!;
        sourceFile = undefined!;
        identifiers = undefined!;
        syntaxCursor = undefined;
        sourceText = undefined!;
        notParenthesizedArrow = undefined!;
    }
    function parseSourceFileWorker(fileName: string, languageVersion: ts.ScriptTarget, setParentNodes: boolean, scriptKind: ts.ScriptKind): ts.SourceFile {
        const isDeclarationFile = isDeclarationFileName(fileName);
        if (isDeclarationFile) {
            contextFlags |= ts.NodeFlags.Ambient;
        }
        sourceFile = createSourceFile(fileName, languageVersion, scriptKind, isDeclarationFile);
        sourceFile.flags = contextFlags;
        // Prime the scanner.
        nextToken();
        // A member of ReadonlyArray<T> isn't assignable to a member of T[] (and prevents a direct cast) - but this is where we set up those members so they can be readonly in the future
        processCommentPragmas(sourceFile as {} as PragmaContext, sourceText);
        processPragmasIntoFields(sourceFile as {} as PragmaContext, reportPragmaDiagnostic);
        sourceFile.statements = parseList(ParsingContext.SourceElements, parseStatement);
        ts.Debug.assert(token() === ts.SyntaxKind.EndOfFileToken);
        sourceFile.endOfFileToken = addJSDocComment(parseTokenNode());
        setExternalModuleIndicator(sourceFile);
        sourceFile.nodeCount = nodeCount;
        sourceFile.identifierCount = identifierCount;
        sourceFile.identifiers = identifiers;
        sourceFile.parseDiagnostics = parseDiagnostics;
        if (setParentNodes) {
            fixupParentReferences(sourceFile);
        }
        return sourceFile;
        function reportPragmaDiagnostic(pos: number, end: number, diagnostic: ts.DiagnosticMessage) {
            parseDiagnostics.push(ts.createFileDiagnostic(sourceFile, pos, end, diagnostic));
        }
    }
    function addJSDocComment<T extends ts.HasJSDoc>(node: T): T {
        ts.Debug.assert(!node.jsDoc); // Should only be called once per node
        const jsDoc = ts.mapDefined(ts.getJSDocCommentRanges(node, sourceFile.text), comment => JSDocParser.parseJSDocComment(node, comment.pos, comment.end - comment.pos));
        if (jsDoc.length)
            node.jsDoc = jsDoc;
        return node;
    }
    export function fixupParentReferences(rootNode: ts.Node) {
        // normally parent references are set during binding. However, for clients that only need
        // a syntax tree, and no semantic features, then the binding process is an unnecessary
        // overhead.  This functions allows us to set all the parents, without all the expense of
        // binding.
        let parent: ts.Node = rootNode;
        forEachChild(rootNode, visitNode);
        return;
        function visitNode(n: ts.Node): void {
            // walk down setting parents that differ from the parent we think it should be.  This
            // allows us to quickly bail out of setting parents for subtrees during incremental
            // parsing
            if (n.parent !== parent) {
                n.parent = parent;
                const saveParent = parent;
                parent = n;
                forEachChild(n, visitNode);
                if (ts.hasJSDocNodes(n)) {
                    for (const jsDoc of n.jsDoc!) {
                        jsDoc.parent = n;
                        parent = jsDoc;
                        forEachChild(jsDoc, visitNode);
                    }
                }
                parent = saveParent;
            }
        }
    }
    function createSourceFile(fileName: string, languageVersion: ts.ScriptTarget, scriptKind: ts.ScriptKind, isDeclarationFile: boolean): ts.SourceFile {
        // code from createNode is inlined here so createNode won't have to deal with special case of creating source files
        // this is quite rare comparing to other nodes and createNode should be as fast as possible
        const sourceFile = (<ts.SourceFile>new SourceFileConstructor(ts.SyntaxKind.SourceFile, /*pos*/ 0, /* end */ sourceText.length));
        nodeCount++;
        sourceFile.text = sourceText;
        sourceFile.bindDiagnostics = [];
        sourceFile.bindSuggestionDiagnostics = undefined;
        sourceFile.languageVersion = languageVersion;
        sourceFile.fileName = ts.normalizePath(fileName);
        sourceFile.languageVariant = getLanguageVariant(scriptKind);
        sourceFile.isDeclarationFile = isDeclarationFile;
        sourceFile.scriptKind = scriptKind;
        return sourceFile;
    }
    function setContextFlag(val: boolean, flag: ts.NodeFlags) {
        if (val) {
            contextFlags |= flag;
        }
        else {
            contextFlags &= ~flag;
        }
    }
    function setDisallowInContext(val: boolean) {
        setContextFlag(val, ts.NodeFlags.DisallowInContext);
    }
    function setYieldContext(val: boolean) {
        setContextFlag(val, ts.NodeFlags.YieldContext);
    }
    function setDecoratorContext(val: boolean) {
        setContextFlag(val, ts.NodeFlags.DecoratorContext);
    }
    function setAwaitContext(val: boolean) {
        setContextFlag(val, ts.NodeFlags.AwaitContext);
    }
    function doOutsideOfContext<T>(context: ts.NodeFlags, func: () => T): T {
        // contextFlagsToClear will contain only the context flags that are
        // currently set that we need to temporarily clear
        // We don't just blindly reset to the previous flags to ensure
        // that we do not mutate cached flags for the incremental
        // parser (ThisNodeHasError, ThisNodeOrAnySubNodesHasError, and
        // HasAggregatedChildData).
        const contextFlagsToClear = context & contextFlags;
        if (contextFlagsToClear) {
            // clear the requested context flags
            setContextFlag(/*val*/ false, contextFlagsToClear);
            const result = func();
            // restore the context flags we just cleared
            setContextFlag(/*val*/ true, contextFlagsToClear);
            return result;
        }
        // no need to do anything special as we are not in any of the requested contexts
        return func();
    }
    function doInsideOfContext<T>(context: ts.NodeFlags, func: () => T): T {
        // contextFlagsToSet will contain only the context flags that
        // are not currently set that we need to temporarily enable.
        // We don't just blindly reset to the previous flags to ensure
        // that we do not mutate cached flags for the incremental
        // parser (ThisNodeHasError, ThisNodeOrAnySubNodesHasError, and
        // HasAggregatedChildData).
        const contextFlagsToSet = context & ~contextFlags;
        if (contextFlagsToSet) {
            // set the requested context flags
            setContextFlag(/*val*/ true, contextFlagsToSet);
            const result = func();
            // reset the context flags we just set
            setContextFlag(/*val*/ false, contextFlagsToSet);
            return result;
        }
        // no need to do anything special as we are already in all of the requested contexts
        return func();
    }
    function allowInAnd<T>(func: () => T): T {
        return doOutsideOfContext(ts.NodeFlags.DisallowInContext, func);
    }
    function disallowInAnd<T>(func: () => T): T {
        return doInsideOfContext(ts.NodeFlags.DisallowInContext, func);
    }
    function doInYieldContext<T>(func: () => T): T {
        return doInsideOfContext(ts.NodeFlags.YieldContext, func);
    }
    function doInDecoratorContext<T>(func: () => T): T {
        return doInsideOfContext(ts.NodeFlags.DecoratorContext, func);
    }
    function doInAwaitContext<T>(func: () => T): T {
        return doInsideOfContext(ts.NodeFlags.AwaitContext, func);
    }
    function doOutsideOfAwaitContext<T>(func: () => T): T {
        return doOutsideOfContext(ts.NodeFlags.AwaitContext, func);
    }
    function doInYieldAndAwaitContext<T>(func: () => T): T {
        return doInsideOfContext(ts.NodeFlags.YieldContext | ts.NodeFlags.AwaitContext, func);
    }
    function doOutsideOfYieldAndAwaitContext<T>(func: () => T): T {
        return doOutsideOfContext(ts.NodeFlags.YieldContext | ts.NodeFlags.AwaitContext, func);
    }
    function inContext(flags: ts.NodeFlags) {
        return (contextFlags & flags) !== 0;
    }
    function inYieldContext() {
        return inContext(ts.NodeFlags.YieldContext);
    }
    function inDisallowInContext() {
        return inContext(ts.NodeFlags.DisallowInContext);
    }
    function inDecoratorContext() {
        return inContext(ts.NodeFlags.DecoratorContext);
    }
    function inAwaitContext() {
        return inContext(ts.NodeFlags.AwaitContext);
    }
    function parseErrorAtCurrentToken(message: ts.DiagnosticMessage, arg0?: any): void {
        parseErrorAt(scanner.getTokenPos(), scanner.getTextPos(), message, arg0);
    }
    function parseErrorAtPosition(start: number, length: number, message: ts.DiagnosticMessage, arg0?: any): void {
        // Don't report another error if it would just be at the same position as the last error.
        const lastError = ts.lastOrUndefined(parseDiagnostics);
        if (!lastError || start !== lastError.start) {
            parseDiagnostics.push(ts.createFileDiagnostic(sourceFile, start, length, message, arg0));
        }
        // Mark that we've encountered an error.  We'll set an appropriate bit on the next
        // node we finish so that it can't be reused incrementally.
        parseErrorBeforeNextFinishedNode = true;
    }
    function parseErrorAt(start: number, end: number, message: ts.DiagnosticMessage, arg0?: any): void {
        parseErrorAtPosition(start, end - start, message, arg0);
    }
    function parseErrorAtRange(range: ts.TextRange, message: ts.DiagnosticMessage, arg0?: any): void {
        parseErrorAt(range.pos, range.end, message, arg0);
    }
    function scanError(message: ts.DiagnosticMessage, length: number): void {
        parseErrorAtPosition(scanner.getTextPos(), length, message);
    }
    function getNodePos(): number {
        return scanner.getStartPos();
    }
    // Use this function to access the current token instead of reading the currentToken
    // variable. Since function results aren't narrowed in control flow analysis, this ensures
    // that the type checker doesn't make wrong assumptions about the type of the current
    // token (e.g. a call to nextToken() changes the current token but the checker doesn't
    // reason about this side effect).  Mainstream VMs inline simple functions like this, so
    // there is no performance penalty.
    function token(): ts.SyntaxKind {
        return currentToken;
    }
    function nextTokenWithoutCheck() {
        return currentToken = scanner.scan();
    }
    function nextToken(): ts.SyntaxKind {
        // if the keyword had an escape
        if (ts.isKeyword(currentToken) && (scanner.hasUnicodeEscape() || scanner.hasExtendedUnicodeEscape())) {
            // issue a parse error for the escape
            parseErrorAt(scanner.getTokenPos(), scanner.getTextPos(), ts.Diagnostics.Keywords_cannot_contain_escape_characters);
        }
        return nextTokenWithoutCheck();
    }
    function nextTokenJSDoc(): ts.JSDocSyntaxKind {
        return currentToken = scanner.scanJsDocToken();
    }
    function reScanGreaterToken(): ts.SyntaxKind {
        return currentToken = scanner.reScanGreaterToken();
    }
    function reScanSlashToken(): ts.SyntaxKind {
        return currentToken = scanner.reScanSlashToken();
    }
    function reScanTemplateToken(): ts.SyntaxKind {
        return currentToken = scanner.reScanTemplateToken();
    }
    function reScanLessThanToken(): ts.SyntaxKind {
        return currentToken = scanner.reScanLessThanToken();
    }
    function scanJsxIdentifier(): ts.SyntaxKind {
        return currentToken = scanner.scanJsxIdentifier();
    }
    function scanJsxText(): ts.SyntaxKind {
        return currentToken = scanner.scanJsxToken();
    }
    function scanJsxAttributeValue(): ts.SyntaxKind {
        return currentToken = scanner.scanJsxAttributeValue();
    }
    function speculationHelper<T>(callback: () => T, isLookAhead: boolean): T {
        // Keep track of the state we'll need to rollback to if lookahead fails (or if the
        // caller asked us to always reset our state).
        const saveToken = currentToken;
        const saveParseDiagnosticsLength = parseDiagnostics.length;
        const saveParseErrorBeforeNextFinishedNode = parseErrorBeforeNextFinishedNode;
        // Note: it is not actually necessary to save/restore the context flags here.  That's
        // because the saving/restoring of these flags happens naturally through the recursive
        // descent nature of our parser.  However, we still store this here just so we can
        // assert that invariant holds.
        const saveContextFlags = contextFlags;
        // If we're only looking ahead, then tell the scanner to only lookahead as well.
        // Otherwise, if we're actually speculatively parsing, then tell the scanner to do the
        // same.
        const result = isLookAhead
            ? scanner.lookAhead(callback)
            : scanner.tryScan(callback);
        ts.Debug.assert(saveContextFlags === contextFlags);
        // If our callback returned something 'falsy' or we're just looking ahead,
        // then unconditionally restore us to where we were.
        if (!result || isLookAhead) {
            currentToken = saveToken;
            parseDiagnostics.length = saveParseDiagnosticsLength;
            parseErrorBeforeNextFinishedNode = saveParseErrorBeforeNextFinishedNode;
        }
        return result;
    }
    /** Invokes the provided callback then unconditionally restores the parser to the state it
     * was in immediately prior to invoking the callback.  The result of invoking the callback
     * is returned from this function.
     */
    function lookAhead<T>(callback: () => T): T {
        return speculationHelper(callback, /*isLookAhead*/ true);
    }
    /** Invokes the provided callback.  If the callback returns something falsy, then it restores
     * the parser to the state it was in immediately prior to invoking the callback.  If the
     * callback returns something truthy, then the parser state is not rolled back.  The result
     * of invoking the callback is returned from this function.
     */
    function tryParse<T>(callback: () => T): T {
        return speculationHelper(callback, /*isLookAhead*/ false);
    }
    // Ignore strict mode flag because we will report an error in type checker instead.
    function isIdentifier(): boolean {
        if (token() === ts.SyntaxKind.Identifier) {
            return true;
        }
        // If we have a 'yield' keyword, and we're in the [yield] context, then 'yield' is
        // considered a keyword and is not an identifier.
        if (token() === ts.SyntaxKind.YieldKeyword && inYieldContext()) {
            return false;
        }
        // If we have a 'await' keyword, and we're in the [Await] context, then 'await' is
        // considered a keyword and is not an identifier.
        if (token() === ts.SyntaxKind.AwaitKeyword && inAwaitContext()) {
            return false;
        }
        return token() > ts.SyntaxKind.LastReservedWord;
    }
    function parseExpected(kind: ts.SyntaxKind, diagnosticMessage?: ts.DiagnosticMessage, shouldAdvance = true): boolean {
        if (token() === kind) {
            if (shouldAdvance) {
                nextToken();
            }
            return true;
        }
        // Report specific message if provided with one.  Otherwise, report generic fallback message.
        if (diagnosticMessage) {
            parseErrorAtCurrentToken(diagnosticMessage);
        }
        else {
            parseErrorAtCurrentToken(ts.Diagnostics._0_expected, ts.tokenToString(kind));
        }
        return false;
    }
    function parseExpectedJSDoc(kind: ts.JSDocSyntaxKind) {
        if (token() === kind) {
            nextTokenJSDoc();
            return true;
        }
        parseErrorAtCurrentToken(ts.Diagnostics._0_expected, ts.tokenToString(kind));
        return false;
    }
    function parseOptional(t: ts.SyntaxKind): boolean {
        if (token() === t) {
            nextToken();
            return true;
        }
        return false;
    }
    function parseOptionalToken<TKind extends ts.SyntaxKind>(t: TKind): ts.Token<TKind>;
    function parseOptionalToken(t: ts.SyntaxKind): ts.Node | undefined {
        if (token() === t) {
            return parseTokenNode();
        }
        return undefined;
    }
    function parseOptionalTokenJSDoc<TKind extends ts.JSDocSyntaxKind>(t: TKind): ts.Token<TKind>;
    function parseOptionalTokenJSDoc(t: ts.JSDocSyntaxKind): ts.Node | undefined {
        if (token() === t) {
            return parseTokenNodeJSDoc();
        }
        return undefined;
    }
    function parseExpectedToken<TKind extends ts.SyntaxKind>(t: TKind, diagnosticMessage?: ts.DiagnosticMessage, arg0?: any): ts.Token<TKind>;
    function parseExpectedToken(t: ts.SyntaxKind, diagnosticMessage?: ts.DiagnosticMessage, arg0?: any): ts.Node {
        return parseOptionalToken(t) ||
            createMissingNode(t, /*reportAtCurrentPosition*/ false, diagnosticMessage || ts.Diagnostics._0_expected, arg0 || ts.tokenToString(t));
    }
    function parseExpectedTokenJSDoc<TKind extends ts.JSDocSyntaxKind>(t: TKind): ts.Token<TKind>;
    function parseExpectedTokenJSDoc(t: ts.JSDocSyntaxKind): ts.Node {
        return parseOptionalTokenJSDoc(t) ||
            createMissingNode(t, /*reportAtCurrentPosition*/ false, ts.Diagnostics._0_expected, ts.tokenToString(t));
    }
    function parseTokenNode<T extends ts.Node>(): T {
        const node = <T>createNode(token());
        nextToken();
        return finishNode(node);
    }
    function parseTokenNodeJSDoc<T extends ts.Node>(): T {
        const node = <T>createNode(token());
        nextTokenJSDoc();
        return finishNode(node);
    }
    function canParseSemicolon() {
        // If there's a real semicolon, then we can always parse it out.
        if (token() === ts.SyntaxKind.SemicolonToken) {
            return true;
        }
        // We can parse out an optional semicolon in ASI cases in the following cases.
        return token() === ts.SyntaxKind.CloseBraceToken || token() === ts.SyntaxKind.EndOfFileToken || scanner.hasPrecedingLineBreak();
    }
    function parseSemicolon(): boolean {
        if (canParseSemicolon()) {
            if (token() === ts.SyntaxKind.SemicolonToken) {
                // consume the semicolon if it was explicitly provided.
                nextToken();
            }
            return true;
        }
        else {
            return parseExpected(ts.SyntaxKind.SemicolonToken);
        }
    }
    function createNode(kind: ts.SyntaxKind, pos?: number): ts.Node {
        nodeCount++;
        const p = pos! >= 0 ? pos! : scanner.getStartPos();
        return ts.isNodeKind(kind) || kind === ts.SyntaxKind.Unknown ? new NodeConstructor(kind, p, p) :
            kind === ts.SyntaxKind.Identifier ? new IdentifierConstructor(kind, p, p) :
                new TokenConstructor(kind, p, p);
    }
    function createNodeWithJSDoc(kind: ts.SyntaxKind, pos?: number): ts.Node {
        const node = createNode(kind, pos);
        if (scanner.getTokenFlags() & ts.TokenFlags.PrecedingJSDocComment) {
            addJSDocComment((<ts.HasJSDoc>node));
        }
        return node;
    }
    function createNodeArray<T extends ts.Node>(elements: T[], pos: number, end?: number): ts.NodeArray<T> {
        // Since the element list of a node array is typically created by starting with an empty array and
        // repeatedly calling push(), the list may not have the optimal memory layout. We invoke slice() for
        // small arrays (1 to 4 elements) to give the VM a chance to allocate an optimal representation.
        const length = elements.length;
        const array = (<ts.MutableNodeArray<T>>(length >= 1 && length <= 4 ? elements.slice() : elements));
        array.pos = pos;
        array.end = end === undefined ? scanner.getStartPos() : end;
        return array;
    }
    function finishNode<T extends ts.Node>(node: T, end?: number): T {
        node.end = end === undefined ? scanner.getStartPos() : end;
        if (contextFlags) {
            node.flags |= contextFlags;
        }
        // Keep track on the node if we encountered an error while parsing it.  If we did, then
        // we cannot reuse the node incrementally.  Once we've marked this node, clear out the
        // flag so that we don't mark any subsequent nodes.
        if (parseErrorBeforeNextFinishedNode) {
            parseErrorBeforeNextFinishedNode = false;
            node.flags |= ts.NodeFlags.ThisNodeHasError;
        }
        return node;
    }
    function createMissingNode<T extends ts.Node>(kind: T["kind"], reportAtCurrentPosition: false, diagnosticMessage?: ts.DiagnosticMessage, arg0?: any): T;
    function createMissingNode<T extends ts.Node>(kind: T["kind"], reportAtCurrentPosition: boolean, diagnosticMessage: ts.DiagnosticMessage, arg0?: any): T;
    function createMissingNode<T extends ts.Node>(kind: T["kind"], reportAtCurrentPosition: boolean, diagnosticMessage: ts.DiagnosticMessage, arg0?: any): T {
        if (reportAtCurrentPosition) {
            parseErrorAtPosition(scanner.getStartPos(), 0, diagnosticMessage, arg0);
        }
        else if (diagnosticMessage) {
            parseErrorAtCurrentToken(diagnosticMessage, arg0);
        }
        const result = createNode(kind);
        if (kind === ts.SyntaxKind.Identifier) {
            (result as ts.Identifier).escapedText = ("" as ts.__String);
        }
        else if (ts.isLiteralKind(kind) || ts.isTemplateLiteralKind(kind)) {
            (result as ts.LiteralLikeNode).text = "";
        }
        return finishNode(result) as T;
    }
    function internIdentifier(text: string): string {
        let identifier = identifiers.get(text);
        if (identifier === undefined) {
            identifiers.set(text, identifier = text);
        }
        return identifier;
    }
    // An identifier that starts with two underscores has an extra underscore character prepended to it to avoid issues
    // with magic property names like '__proto__'. The 'identifiers' object is used to share a single string instance for
    // each identifier in order to reduce memory consumption.
    function createIdentifier(isIdentifier: boolean, diagnosticMessage?: ts.DiagnosticMessage): ts.Identifier {
        identifierCount++;
        if (isIdentifier) {
            const node = (<ts.Identifier>createNode(ts.SyntaxKind.Identifier));
            // Store original token kind if it is not just an Identifier so we can report appropriate error later in type checker
            if (token() !== ts.SyntaxKind.Identifier) {
                node.originalKeywordKind = token();
            }
            node.escapedText = ts.escapeLeadingUnderscores(internIdentifier(scanner.getTokenValue()));
            nextTokenWithoutCheck();
            return finishNode(node);
        }
        // Only for end of file because the error gets reported incorrectly on embedded script tags.
        const reportAtCurrentPosition = token() === ts.SyntaxKind.EndOfFileToken;
        const isReservedWord = scanner.isReservedWord();
        const msgArg = scanner.getTokenText();
        const defaultMessage = isReservedWord ?
            ts.Diagnostics.Identifier_expected_0_is_a_reserved_word_that_cannot_be_used_here :
            ts.Diagnostics.Identifier_expected;
        return createMissingNode<ts.Identifier>(ts.SyntaxKind.Identifier, reportAtCurrentPosition, diagnosticMessage || defaultMessage, msgArg);
    }
    function parseIdentifier(diagnosticMessage?: ts.DiagnosticMessage): ts.Identifier {
        return createIdentifier(isIdentifier(), diagnosticMessage);
    }
    function parseIdentifierName(diagnosticMessage?: ts.DiagnosticMessage): ts.Identifier {
        return createIdentifier(ts.tokenIsIdentifierOrKeyword(token()), diagnosticMessage);
    }
    function isLiteralPropertyName(): boolean {
        return ts.tokenIsIdentifierOrKeyword(token()) ||
            token() === ts.SyntaxKind.StringLiteral ||
            token() === ts.SyntaxKind.NumericLiteral;
    }
    function parsePropertyNameWorker(allowComputedPropertyNames: boolean): ts.PropertyName {
        if (token() === ts.SyntaxKind.StringLiteral || token() === ts.SyntaxKind.NumericLiteral) {
            const node = (<ts.StringLiteral | ts.NumericLiteral>parseLiteralNode());
            node.text = internIdentifier(node.text);
            return node;
        }
        if (allowComputedPropertyNames && token() === ts.SyntaxKind.OpenBracketToken) {
            return parseComputedPropertyName();
        }
        return parseIdentifierName();
    }
    function parsePropertyName(): ts.PropertyName {
        return parsePropertyNameWorker(/*allowComputedPropertyNames*/ true);
    }
    function parseComputedPropertyName(): ts.ComputedPropertyName {
        // PropertyName [Yield]:
        //      LiteralPropertyName
        //      ComputedPropertyName[?Yield]
        const node = (<ts.ComputedPropertyName>createNode(ts.SyntaxKind.ComputedPropertyName));
        parseExpected(ts.SyntaxKind.OpenBracketToken);
        // We parse any expression (including a comma expression). But the grammar
        // says that only an assignment expression is allowed, so the grammar checker
        // will error if it sees a comma expression.
        node.expression = allowInAnd(parseExpression);
        parseExpected(ts.SyntaxKind.CloseBracketToken);
        return finishNode(node);
    }
    function parseContextualModifier(t: ts.SyntaxKind): boolean {
        return token() === t && tryParse(nextTokenCanFollowModifier);
    }
    function nextTokenIsOnSameLineAndCanFollowModifier() {
        nextToken();
        if (scanner.hasPrecedingLineBreak()) {
            return false;
        }
        return canFollowModifier();
    }
    function nextTokenCanFollowModifier() {
        switch (token()) {
            case ts.SyntaxKind.ConstKeyword:
                // 'const' is only a modifier if followed by 'enum'.
                return nextToken() === ts.SyntaxKind.EnumKeyword;
            case ts.SyntaxKind.ExportKeyword:
                nextToken();
                if (token() === ts.SyntaxKind.DefaultKeyword) {
                    return lookAhead(nextTokenCanFollowDefaultKeyword);
                }
                return token() !== ts.SyntaxKind.AsteriskToken && token() !== ts.SyntaxKind.AsKeyword && token() !== ts.SyntaxKind.OpenBraceToken && canFollowModifier();
            case ts.SyntaxKind.DefaultKeyword:
                return nextTokenCanFollowDefaultKeyword();
            case ts.SyntaxKind.StaticKeyword:
            case ts.SyntaxKind.GetKeyword:
            case ts.SyntaxKind.SetKeyword:
                nextToken();
                return canFollowModifier();
            default:
                return nextTokenIsOnSameLineAndCanFollowModifier();
        }
    }
    function parseAnyContextualModifier(): boolean {
        return ts.isModifierKind(token()) && tryParse(nextTokenCanFollowModifier);
    }
    function canFollowModifier(): boolean {
        return token() === ts.SyntaxKind.OpenBracketToken
            || token() === ts.SyntaxKind.OpenBraceToken
            || token() === ts.SyntaxKind.AsteriskToken
            || token() === ts.SyntaxKind.DotDotDotToken
            || isLiteralPropertyName();
    }
    function nextTokenCanFollowDefaultKeyword(): boolean {
        nextToken();
        return token() === ts.SyntaxKind.ClassKeyword || token() === ts.SyntaxKind.FunctionKeyword ||
            token() === ts.SyntaxKind.InterfaceKeyword ||
            (token() === ts.SyntaxKind.AbstractKeyword && lookAhead(nextTokenIsClassKeywordOnSameLine)) ||
            (token() === ts.SyntaxKind.AsyncKeyword && lookAhead(nextTokenIsFunctionKeywordOnSameLine));
    }
    // True if positioned at the start of a list element
    function isListElement(parsingContext: ParsingContext, inErrorRecovery: boolean): boolean {
        const node = currentNode(parsingContext);
        if (node) {
            return true;
        }
        switch (parsingContext) {
            case ParsingContext.SourceElements:
            case ParsingContext.BlockStatements:
            case ParsingContext.SwitchClauseStatements:
                // If we're in error recovery, then we don't want to treat ';' as an empty statement.
                // The problem is that ';' can show up in far too many contexts, and if we see one
                // and assume it's a statement, then we may bail out inappropriately from whatever
                // we're parsing.  For example, if we have a semicolon in the middle of a class, then
                // we really don't want to assume the class is over and we're on a statement in the
                // outer module.  We just want to consume and move on.
                return !(token() === ts.SyntaxKind.SemicolonToken && inErrorRecovery) && isStartOfStatement();
            case ParsingContext.SwitchClauses:
                return token() === ts.SyntaxKind.CaseKeyword || token() === ts.SyntaxKind.DefaultKeyword;
            case ParsingContext.TypeMembers:
                return lookAhead(isTypeMemberStart);
            case ParsingContext.ClassMembers:
                // We allow semicolons as class elements (as specified by ES6) as long as we're
                // not in error recovery.  If we're in error recovery, we don't want an errant
                // semicolon to be treated as a class member (since they're almost always used
                // for statements.
                return lookAhead(isClassMemberStart) || (token() === ts.SyntaxKind.SemicolonToken && !inErrorRecovery);
            case ParsingContext.EnumMembers:
                // Include open bracket computed properties. This technically also lets in indexers,
                // which would be a candidate for improved error reporting.
                return token() === ts.SyntaxKind.OpenBracketToken || isLiteralPropertyName();
            case ParsingContext.ObjectLiteralMembers:
                switch (token()) {
                    case ts.SyntaxKind.OpenBracketToken:
                    case ts.SyntaxKind.AsteriskToken:
                    case ts.SyntaxKind.DotDotDotToken:
                    case ts.SyntaxKind.DotToken: // Not an object literal member, but don't want to close the object (see `tests/cases/fourslash/completionsDotInObjectLiteral.ts`)
                        return true;
                    default:
                        return isLiteralPropertyName();
                }
            case ParsingContext.RestProperties:
                return isLiteralPropertyName();
            case ParsingContext.ObjectBindingElements:
                return token() === ts.SyntaxKind.OpenBracketToken || token() === ts.SyntaxKind.DotDotDotToken || isLiteralPropertyName();
            case ParsingContext.HeritageClauseElement:
                // If we see `{ ... }` then only consume it as an expression if it is followed by `,` or `{`
                // That way we won't consume the body of a class in its heritage clause.
                if (token() === ts.SyntaxKind.OpenBraceToken) {
                    return lookAhead(isValidHeritageClauseObjectLiteral);
                }
                if (!inErrorRecovery) {
                    return isStartOfLeftHandSideExpression() && !isHeritageClauseExtendsOrImplementsKeyword();
                }
                else {
                    // If we're in error recovery we tighten up what we're willing to match.
                    // That way we don't treat something like "this" as a valid heritage clause
                    // element during recovery.
                    return isIdentifier() && !isHeritageClauseExtendsOrImplementsKeyword();
                }
            case ParsingContext.VariableDeclarations:
                return isIdentifierOrPattern();
            case ParsingContext.ArrayBindingElements:
                return token() === ts.SyntaxKind.CommaToken || token() === ts.SyntaxKind.DotDotDotToken || isIdentifierOrPattern();
            case ParsingContext.TypeParameters:
                return isIdentifier();
            case ParsingContext.ArrayLiteralMembers:
                switch (token()) {
                    case ts.SyntaxKind.CommaToken:
                    case ts.SyntaxKind.DotToken: // Not an array literal member, but don't want to close the array (see `tests/cases/fourslash/completionsDotInArrayLiteralInObjectLiteral.ts`)
                        return true;
                }
            // falls through
            case ParsingContext.ArgumentExpressions:
                return token() === ts.SyntaxKind.DotDotDotToken || isStartOfExpression();
            case ParsingContext.Parameters:
                return isStartOfParameter(/*isJSDocParameter*/ false);
            case ParsingContext.JSDocParameters:
                return isStartOfParameter(/*isJSDocParameter*/ true);
            case ParsingContext.TypeArguments:
            case ParsingContext.TupleElementTypes:
                return token() === ts.SyntaxKind.CommaToken || isStartOfType();
            case ParsingContext.HeritageClauses:
                return isHeritageClause();
            case ParsingContext.ImportOrExportSpecifiers:
                return ts.tokenIsIdentifierOrKeyword(token());
            case ParsingContext.JsxAttributes:
                return ts.tokenIsIdentifierOrKeyword(token()) || token() === ts.SyntaxKind.OpenBraceToken;
            case ParsingContext.JsxChildren:
                return true;
        }
        return ts.Debug.fail("Non-exhaustive case in 'isListElement'.");
    }
    function isValidHeritageClauseObjectLiteral() {
        ts.Debug.assert(token() === ts.SyntaxKind.OpenBraceToken);
        if (nextToken() === ts.SyntaxKind.CloseBraceToken) {
            // if we see "extends {}" then only treat the {} as what we're extending (and not
            // the class body) if we have:
            //
            //      extends {} {
            //      extends {},
            //      extends {} extends
            //      extends {} implements
            const next = nextToken();
            return next === ts.SyntaxKind.CommaToken || next === ts.SyntaxKind.OpenBraceToken || next === ts.SyntaxKind.ExtendsKeyword || next === ts.SyntaxKind.ImplementsKeyword;
        }
        return true;
    }
    function nextTokenIsIdentifier() {
        nextToken();
        return isIdentifier();
    }
    function nextTokenIsIdentifierOrKeyword() {
        nextToken();
        return ts.tokenIsIdentifierOrKeyword(token());
    }
    function nextTokenIsIdentifierOrKeywordOrGreaterThan() {
        nextToken();
        return ts.tokenIsIdentifierOrKeywordOrGreaterThan(token());
    }
    function isHeritageClauseExtendsOrImplementsKeyword(): boolean {
        if (token() === ts.SyntaxKind.ImplementsKeyword ||
            token() === ts.SyntaxKind.ExtendsKeyword) {
            return lookAhead(nextTokenIsStartOfExpression);
        }
        return false;
    }
    function nextTokenIsStartOfExpression() {
        nextToken();
        return isStartOfExpression();
    }
    function nextTokenIsStartOfType() {
        nextToken();
        return isStartOfType();
    }
    // True if positioned at a list terminator
    function isListTerminator(kind: ParsingContext): boolean {
        if (token() === ts.SyntaxKind.EndOfFileToken) {
            // Being at the end of the file ends all lists.
            return true;
        }
        switch (kind) {
            case ParsingContext.BlockStatements:
            case ParsingContext.SwitchClauses:
            case ParsingContext.TypeMembers:
            case ParsingContext.ClassMembers:
            case ParsingContext.EnumMembers:
            case ParsingContext.ObjectLiteralMembers:
            case ParsingContext.ObjectBindingElements:
            case ParsingContext.ImportOrExportSpecifiers:
                return token() === ts.SyntaxKind.CloseBraceToken;
            case ParsingContext.SwitchClauseStatements:
                return token() === ts.SyntaxKind.CloseBraceToken || token() === ts.SyntaxKind.CaseKeyword || token() === ts.SyntaxKind.DefaultKeyword;
            case ParsingContext.HeritageClauseElement:
                return token() === ts.SyntaxKind.OpenBraceToken || token() === ts.SyntaxKind.ExtendsKeyword || token() === ts.SyntaxKind.ImplementsKeyword;
            case ParsingContext.VariableDeclarations:
                return isVariableDeclaratorListTerminator();
            case ParsingContext.TypeParameters:
                // Tokens other than '>' are here for better error recovery
                return token() === ts.SyntaxKind.GreaterThanToken || token() === ts.SyntaxKind.OpenParenToken || token() === ts.SyntaxKind.OpenBraceToken || token() === ts.SyntaxKind.ExtendsKeyword || token() === ts.SyntaxKind.ImplementsKeyword;
            case ParsingContext.ArgumentExpressions:
                // Tokens other than ')' are here for better error recovery
                return token() === ts.SyntaxKind.CloseParenToken || token() === ts.SyntaxKind.SemicolonToken;
            case ParsingContext.ArrayLiteralMembers:
            case ParsingContext.TupleElementTypes:
            case ParsingContext.ArrayBindingElements:
                return token() === ts.SyntaxKind.CloseBracketToken;
            case ParsingContext.JSDocParameters:
            case ParsingContext.Parameters:
            case ParsingContext.RestProperties:
                // Tokens other than ')' and ']' (the latter for index signatures) are here for better error recovery
                return token() === ts.SyntaxKind.CloseParenToken || token() === ts.SyntaxKind.CloseBracketToken /*|| token === SyntaxKind.OpenBraceToken*/;
            case ParsingContext.TypeArguments:
                // All other tokens should cause the type-argument to terminate except comma token
                return token() !== ts.SyntaxKind.CommaToken;
            case ParsingContext.HeritageClauses:
                return token() === ts.SyntaxKind.OpenBraceToken || token() === ts.SyntaxKind.CloseBraceToken;
            case ParsingContext.JsxAttributes:
                return token() === ts.SyntaxKind.GreaterThanToken || token() === ts.SyntaxKind.SlashToken;
            case ParsingContext.JsxChildren:
                return token() === ts.SyntaxKind.LessThanToken && lookAhead(nextTokenIsSlash);
            default:
                return false;
        }
    }
    function isVariableDeclaratorListTerminator(): boolean {
        // If we can consume a semicolon (either explicitly, or with ASI), then consider us done
        // with parsing the list of variable declarators.
        if (canParseSemicolon()) {
            return true;
        }
        // in the case where we're parsing the variable declarator of a 'for-in' statement, we
        // are done if we see an 'in' keyword in front of us. Same with for-of
        if (isInOrOfKeyword(token())) {
            return true;
        }
        // ERROR RECOVERY TWEAK:
        // For better error recovery, if we see an '=>' then we just stop immediately.  We've got an
        // arrow function here and it's going to be very unlikely that we'll resynchronize and get
        // another variable declaration.
        if (token() === ts.SyntaxKind.EqualsGreaterThanToken) {
            return true;
        }
        // Keep trying to parse out variable declarators.
        return false;
    }
    // True if positioned at element or terminator of the current list or any enclosing list
    function isInSomeParsingContext(): boolean {
        for (let kind = 0; kind < ParsingContext.Count; kind++) {
            if (parsingContext & (1 << kind)) {
                if (isListElement(kind, /*inErrorRecovery*/ true) || isListTerminator(kind)) {
                    return true;
                }
            }
        }
        return false;
    }
    // Parses a list of elements
    function parseList<T extends ts.Node>(kind: ParsingContext, parseElement: () => T): ts.NodeArray<T> {
        const saveParsingContext = parsingContext;
        parsingContext |= 1 << kind;
        const list = [];
        const listPos = getNodePos();
        while (!isListTerminator(kind)) {
            if (isListElement(kind, /*inErrorRecovery*/ false)) {
                const element = parseListElement(kind, parseElement);
                list.push(element);
                continue;
            }
            if (abortParsingListOrMoveToNextToken(kind)) {
                break;
            }
        }
        parsingContext = saveParsingContext;
        return createNodeArray(list, listPos);
    }
    function parseListElement<T extends ts.Node>(parsingContext: ParsingContext, parseElement: () => T): T {
        const node = currentNode(parsingContext);
        if (node) {
            return <T>consumeNode(node);
        }
        return parseElement();
    }
    function currentNode(parsingContext: ParsingContext): ts.Node | undefined {
        // If we don't have a cursor or the parsing context isn't reusable, there's nothing to reuse.
        //
        // If there is an outstanding parse error that we've encountered, but not attached to
        // some node, then we cannot get a node from the old source tree.  This is because we
        // want to mark the next node we encounter as being unusable.
        //
        // Note: This may be too conservative.  Perhaps we could reuse the node and set the bit
        // on it (or its leftmost child) as having the error.  For now though, being conservative
        // is nice and likely won't ever affect perf.
        if (!syntaxCursor || !isReusableParsingContext(parsingContext) || parseErrorBeforeNextFinishedNode) {
            return undefined;
        }
        const node = syntaxCursor.currentNode(scanner.getStartPos());
        // Can't reuse a missing node.
        // Can't reuse a node that intersected the change range.
        // Can't reuse a node that contains a parse error.  This is necessary so that we
        // produce the same set of errors again.
        if (ts.nodeIsMissing(node) || node.intersectsChange || ts.containsParseError(node)) {
            return undefined;
        }
        // We can only reuse a node if it was parsed under the same strict mode that we're
        // currently in.  i.e. if we originally parsed a node in non-strict mode, but then
        // the user added 'using strict' at the top of the file, then we can't use that node
        // again as the presence of strict mode may cause us to parse the tokens in the file
        // differently.
        //
        // Note: we *can* reuse tokens when the strict mode changes.  That's because tokens
        // are unaffected by strict mode.  It's just the parser will decide what to do with it
        // differently depending on what mode it is in.
        //
        // This also applies to all our other context flags as well.
        const nodeContextFlags = node.flags & ts.NodeFlags.ContextFlags;
        if (nodeContextFlags !== contextFlags) {
            return undefined;
        }
        // Ok, we have a node that looks like it could be reused.  Now verify that it is valid
        // in the current list parsing context that we're currently at.
        if (!canReuseNode(node, parsingContext)) {
            return undefined;
        }
        if ((node as ts.JSDocContainer).jsDocCache) {
            // jsDocCache may include tags from parent nodes, which might have been modified.
            (node as ts.JSDocContainer).jsDocCache = undefined;
        }
        return node;
    }
    function consumeNode(node: ts.Node) {
        // Move the scanner so it is after the node we just consumed.
        scanner.setTextPos(node.end);
        nextToken();
        return node;
    }
    function isReusableParsingContext(parsingContext: ParsingContext): boolean {
        switch (parsingContext) {
            case ParsingContext.ClassMembers:
            case ParsingContext.SwitchClauses:
            case ParsingContext.SourceElements:
            case ParsingContext.BlockStatements:
            case ParsingContext.SwitchClauseStatements:
            case ParsingContext.EnumMembers:
            case ParsingContext.TypeMembers:
            case ParsingContext.VariableDeclarations:
            case ParsingContext.JSDocParameters:
            case ParsingContext.Parameters:
                return true;
        }
        return false;
    }
    function canReuseNode(node: ts.Node, parsingContext: ParsingContext): boolean {
        switch (parsingContext) {
            case ParsingContext.ClassMembers:
                return isReusableClassMember(node);
            case ParsingContext.SwitchClauses:
                return isReusableSwitchClause(node);
            case ParsingContext.SourceElements:
            case ParsingContext.BlockStatements:
            case ParsingContext.SwitchClauseStatements:
                return isReusableStatement(node);
            case ParsingContext.EnumMembers:
                return isReusableEnumMember(node);
            case ParsingContext.TypeMembers:
                return isReusableTypeMember(node);
            case ParsingContext.VariableDeclarations:
                return isReusableVariableDeclaration(node);
            case ParsingContext.JSDocParameters:
            case ParsingContext.Parameters:
                return isReusableParameter(node);
            // Any other lists we do not care about reusing nodes in.  But feel free to add if
            // you can do so safely.  Danger areas involve nodes that may involve speculative
            // parsing.  If speculative parsing is involved with the node, then the range the
            // parser reached while looking ahead might be in the edited range (see the example
            // in canReuseVariableDeclaratorNode for a good case of this).
            // case ParsingContext.HeritageClauses:
            // This would probably be safe to reuse.  There is no speculative parsing with
            // heritage clauses.
            // case ParsingContext.TypeParameters:
            // This would probably be safe to reuse.  There is no speculative parsing with
            // type parameters.  Note that that's because type *parameters* only occur in
            // unambiguous *type* contexts.  While type *arguments* occur in very ambiguous
            // *expression* contexts.
            // case ParsingContext.TupleElementTypes:
            // This would probably be safe to reuse.  There is no speculative parsing with
            // tuple types.
            // Technically, type argument list types are probably safe to reuse.  While
            // speculative parsing is involved with them (since type argument lists are only
            // produced from speculative parsing a < as a type argument list), we only have
            // the types because speculative parsing succeeded.  Thus, the lookahead never
            // went past the end of the list and rewound.
            // case ParsingContext.TypeArguments:
            // Note: these are almost certainly not safe to ever reuse.  Expressions commonly
            // need a large amount of lookahead, and we should not reuse them as they may
            // have actually intersected the edit.
            // case ParsingContext.ArgumentExpressions:
            // This is not safe to reuse for the same reason as the 'AssignmentExpression'
            // cases.  i.e. a property assignment may end with an expression, and thus might
            // have lookahead far beyond it's old node.
            // case ParsingContext.ObjectLiteralMembers:
            // This is probably not safe to reuse.  There can be speculative parsing with
            // type names in a heritage clause.  There can be generic names in the type
            // name list, and there can be left hand side expressions (which can have type
            // arguments.)
            // case ParsingContext.HeritageClauseElement:
            // Perhaps safe to reuse, but it's unlikely we'd see more than a dozen attributes
            // on any given element. Same for children.
            // case ParsingContext.JsxAttributes:
            // case ParsingContext.JsxChildren:
        }
        return false;
    }
    function isReusableClassMember(node: ts.Node) {
        if (node) {
            switch (node.kind) {
                case ts.SyntaxKind.Constructor:
                case ts.SyntaxKind.IndexSignature:
                case ts.SyntaxKind.GetAccessor:
                case ts.SyntaxKind.SetAccessor:
                case ts.SyntaxKind.PropertyDeclaration:
                case ts.SyntaxKind.SemicolonClassElement:
                    return true;
                case ts.SyntaxKind.MethodDeclaration:
                    // Method declarations are not necessarily reusable.  An object-literal
                    // may have a method calls "constructor(...)" and we must reparse that
                    // into an actual .ConstructorDeclaration.
                    const methodDeclaration = (<ts.MethodDeclaration>node);
                    const nameIsConstructor = methodDeclaration.name.kind === ts.SyntaxKind.Identifier &&
                        methodDeclaration.name.originalKeywordKind === ts.SyntaxKind.ConstructorKeyword;
                    return !nameIsConstructor;
            }
        }
        return false;
    }
    function isReusableSwitchClause(node: ts.Node) {
        if (node) {
            switch (node.kind) {
                case ts.SyntaxKind.CaseClause:
                case ts.SyntaxKind.DefaultClause:
                    return true;
            }
        }
        return false;
    }
    function isReusableStatement(node: ts.Node) {
        if (node) {
            switch (node.kind) {
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.VariableStatement:
                case ts.SyntaxKind.Block:
                case ts.SyntaxKind.IfStatement:
                case ts.SyntaxKind.ExpressionStatement:
                case ts.SyntaxKind.ThrowStatement:
                case ts.SyntaxKind.ReturnStatement:
                case ts.SyntaxKind.SwitchStatement:
                case ts.SyntaxKind.BreakStatement:
                case ts.SyntaxKind.ContinueStatement:
                case ts.SyntaxKind.ForInStatement:
                case ts.SyntaxKind.ForOfStatement:
                case ts.SyntaxKind.ForStatement:
                case ts.SyntaxKind.WhileStatement:
                case ts.SyntaxKind.WithStatement:
                case ts.SyntaxKind.EmptyStatement:
                case ts.SyntaxKind.TryStatement:
                case ts.SyntaxKind.LabeledStatement:
                case ts.SyntaxKind.DoStatement:
                case ts.SyntaxKind.DebuggerStatement:
                case ts.SyntaxKind.ImportDeclaration:
                case ts.SyntaxKind.ImportEqualsDeclaration:
                case ts.SyntaxKind.ExportDeclaration:
                case ts.SyntaxKind.ExportAssignment:
                case ts.SyntaxKind.ModuleDeclaration:
                case ts.SyntaxKind.ClassDeclaration:
                case ts.SyntaxKind.InterfaceDeclaration:
                case ts.SyntaxKind.EnumDeclaration:
                case ts.SyntaxKind.TypeAliasDeclaration:
                    return true;
            }
        }
        return false;
    }
    function isReusableEnumMember(node: ts.Node) {
        return node.kind === ts.SyntaxKind.EnumMember;
    }
    function isReusableTypeMember(node: ts.Node) {
        if (node) {
            switch (node.kind) {
                case ts.SyntaxKind.ConstructSignature:
                case ts.SyntaxKind.MethodSignature:
                case ts.SyntaxKind.IndexSignature:
                case ts.SyntaxKind.PropertySignature:
                case ts.SyntaxKind.CallSignature:
                    return true;
            }
        }
        return false;
    }
    function isReusableVariableDeclaration(node: ts.Node) {
        if (node.kind !== ts.SyntaxKind.VariableDeclaration) {
            return false;
        }
        // Very subtle incremental parsing bug.  Consider the following code:
        //
        //      let v = new List < A, B
        //
        // This is actually legal code.  It's a list of variable declarators "v = new List<A"
        // on one side and "B" on the other. If you then change that to:
        //
        //      let v = new List < A, B >()
        //
        // then we have a problem.  "v = new List<A" doesn't intersect the change range, so we
        // start reparsing at "B" and we completely fail to handle this properly.
        //
        // In order to prevent this, we do not allow a variable declarator to be reused if it
        // has an initializer.
        const variableDeclarator = (<ts.VariableDeclaration>node);
        return variableDeclarator.initializer === undefined;
    }
    function isReusableParameter(node: ts.Node) {
        if (node.kind !== ts.SyntaxKind.Parameter) {
            return false;
        }
        // See the comment in isReusableVariableDeclaration for why we do this.
        const parameter = (<ts.ParameterDeclaration>node);
        return parameter.initializer === undefined;
    }
    // Returns true if we should abort parsing.
    function abortParsingListOrMoveToNextToken(kind: ParsingContext) {
        parseErrorAtCurrentToken(parsingContextErrors(kind));
        if (isInSomeParsingContext()) {
            return true;
        }
        nextToken();
        return false;
    }
    function parsingContextErrors(context: ParsingContext): ts.DiagnosticMessage {
        switch (context) {
            case ParsingContext.SourceElements: return ts.Diagnostics.Declaration_or_statement_expected;
            case ParsingContext.BlockStatements: return ts.Diagnostics.Declaration_or_statement_expected;
            case ParsingContext.SwitchClauses: return ts.Diagnostics.case_or_default_expected;
            case ParsingContext.SwitchClauseStatements: return ts.Diagnostics.Statement_expected;
            case ParsingContext.RestProperties: // fallthrough
            case ParsingContext.TypeMembers: return ts.Diagnostics.Property_or_signature_expected;
            case ParsingContext.ClassMembers: return ts.Diagnostics.Unexpected_token_A_constructor_method_accessor_or_property_was_expected;
            case ParsingContext.EnumMembers: return ts.Diagnostics.Enum_member_expected;
            case ParsingContext.HeritageClauseElement: return ts.Diagnostics.Expression_expected;
            case ParsingContext.VariableDeclarations: return ts.Diagnostics.Variable_declaration_expected;
            case ParsingContext.ObjectBindingElements: return ts.Diagnostics.Property_destructuring_pattern_expected;
            case ParsingContext.ArrayBindingElements: return ts.Diagnostics.Array_element_destructuring_pattern_expected;
            case ParsingContext.ArgumentExpressions: return ts.Diagnostics.Argument_expression_expected;
            case ParsingContext.ObjectLiteralMembers: return ts.Diagnostics.Property_assignment_expected;
            case ParsingContext.ArrayLiteralMembers: return ts.Diagnostics.Expression_or_comma_expected;
            case ParsingContext.JSDocParameters: return ts.Diagnostics.Parameter_declaration_expected;
            case ParsingContext.Parameters: return ts.Diagnostics.Parameter_declaration_expected;
            case ParsingContext.TypeParameters: return ts.Diagnostics.Type_parameter_declaration_expected;
            case ParsingContext.TypeArguments: return ts.Diagnostics.Type_argument_expected;
            case ParsingContext.TupleElementTypes: return ts.Diagnostics.Type_expected;
            case ParsingContext.HeritageClauses: return ts.Diagnostics.Unexpected_token_expected;
            case ParsingContext.ImportOrExportSpecifiers: return ts.Diagnostics.Identifier_expected;
            case ParsingContext.JsxAttributes: return ts.Diagnostics.Identifier_expected;
            case ParsingContext.JsxChildren: return ts.Diagnostics.Identifier_expected;
            default: return undefined!; // TODO: GH#18217 `default: Debug.assertNever(context);`
        }
    }
    // Parses a comma-delimited list of elements
    function parseDelimitedList<T extends ts.Node>(kind: ParsingContext, parseElement: () => T, considerSemicolonAsDelimiter?: boolean): ts.NodeArray<T> {
        const saveParsingContext = parsingContext;
        parsingContext |= 1 << kind;
        const list = [];
        const listPos = getNodePos();
        let commaStart = -1; // Meaning the previous token was not a comma
        while (true) {
            if (isListElement(kind, /*inErrorRecovery*/ false)) {
                const startPos = scanner.getStartPos();
                list.push(parseListElement(kind, parseElement));
                commaStart = scanner.getTokenPos();
                if (parseOptional(ts.SyntaxKind.CommaToken)) {
                    // No need to check for a zero length node since we know we parsed a comma
                    continue;
                }
                commaStart = -1; // Back to the state where the last token was not a comma
                if (isListTerminator(kind)) {
                    break;
                }
                // We didn't get a comma, and the list wasn't terminated, explicitly parse
                // out a comma so we give a good error message.
                parseExpected(ts.SyntaxKind.CommaToken, getExpectedCommaDiagnostic(kind));
                // If the token was a semicolon, and the caller allows that, then skip it and
                // continue.  This ensures we get back on track and don't result in tons of
                // parse errors.  For example, this can happen when people do things like use
                // a semicolon to delimit object literal members.   Note: we'll have already
                // reported an error when we called parseExpected above.
                if (considerSemicolonAsDelimiter && token() === ts.SyntaxKind.SemicolonToken && !scanner.hasPrecedingLineBreak()) {
                    nextToken();
                }
                if (startPos === scanner.getStartPos()) {
                    // What we're parsing isn't actually remotely recognizable as a element and we've consumed no tokens whatsoever
                    // Consume a token to advance the parser in some way and avoid an infinite loop
                    // This can happen when we're speculatively parsing parenthesized expressions which we think may be arrow functions,
                    // or when a modifier keyword which is disallowed as a parameter name (ie, `static` in strict mode) is supplied
                    nextToken();
                }
                continue;
            }
            if (isListTerminator(kind)) {
                break;
            }
            if (abortParsingListOrMoveToNextToken(kind)) {
                break;
            }
        }
        parsingContext = saveParsingContext;
        const result = createNodeArray(list, listPos);
        // Recording the trailing comma is deliberately done after the previous
        // loop, and not just if we see a list terminator. This is because the list
        // may have ended incorrectly, but it is still important to know if there
        // was a trailing comma.
        // Check if the last token was a comma.
        if (commaStart >= 0) {
            // Always preserve a trailing comma by marking it on the NodeArray
            result.hasTrailingComma = true;
        }
        return result;
    }
    function getExpectedCommaDiagnostic(kind: ParsingContext) {
        return kind === ParsingContext.EnumMembers ? ts.Diagnostics.An_enum_member_name_must_be_followed_by_a_or : undefined;
    }
    interface MissingList<T extends ts.Node> extends ts.NodeArray<T> {
        isMissingList: true;
    }
    function createMissingList<T extends ts.Node>(): MissingList<T> {
        const list = createNodeArray<T>([], getNodePos()) as MissingList<T>;
        list.isMissingList = true;
        return list;
    }
    function isMissingList(arr: ts.NodeArray<ts.Node>): boolean {
        return !!(arr as MissingList<ts.Node>).isMissingList;
    }
    function parseBracketedList<T extends ts.Node>(kind: ParsingContext, parseElement: () => T, open: ts.SyntaxKind, close: ts.SyntaxKind): ts.NodeArray<T> {
        if (parseExpected(open)) {
            const result = parseDelimitedList(kind, parseElement);
            parseExpected(close);
            return result;
        }
        return createMissingList<T>();
    }
    function parseEntityName(allowReservedWords: boolean, diagnosticMessage?: ts.DiagnosticMessage): ts.EntityName {
        let entity: ts.EntityName = allowReservedWords ? parseIdentifierName(diagnosticMessage) : parseIdentifier(diagnosticMessage);
        let dotPos = scanner.getStartPos();
        while (parseOptional(ts.SyntaxKind.DotToken)) {
            if (token() === ts.SyntaxKind.LessThanToken) {
                // the entity is part of a JSDoc-style generic, so record the trailing dot for later error reporting
                entity.jsdocDotPos = dotPos;
                break;
            }
            dotPos = scanner.getStartPos();
            entity = createQualifiedName(entity, parseRightSideOfDot(allowReservedWords));
        }
        return entity;
    }
    function createQualifiedName(entity: ts.EntityName, name: ts.Identifier): ts.QualifiedName {
        const node = (createNode(ts.SyntaxKind.QualifiedName, entity.pos) as ts.QualifiedName);
        node.left = entity;
        node.right = name;
        return finishNode(node);
    }
    function parseRightSideOfDot(allowIdentifierNames: boolean): ts.Identifier {
        // Technically a keyword is valid here as all identifiers and keywords are identifier names.
        // However, often we'll encounter this in error situations when the identifier or keyword
        // is actually starting another valid construct.
        //
        // So, we check for the following specific case:
        //
        //      name.
        //      identifierOrKeyword identifierNameOrKeyword
        //
        // Note: the newlines are important here.  For example, if that above code
        // were rewritten into:
        //
        //      name.identifierOrKeyword
        //      identifierNameOrKeyword
        //
        // Then we would consider it valid.  That's because ASI would take effect and
        // the code would be implicitly: "name.identifierOrKeyword; identifierNameOrKeyword".
        // In the first case though, ASI will not take effect because there is not a
        // line terminator after the identifier or keyword.
        if (scanner.hasPrecedingLineBreak() && ts.tokenIsIdentifierOrKeyword(token())) {
            const matchesPattern = lookAhead(nextTokenIsIdentifierOrKeywordOnSameLine);
            if (matchesPattern) {
                // Report that we need an identifier.  However, report it right after the dot,
                // and not on the next token.  This is because the next token might actually
                // be an identifier and the error would be quite confusing.
                return createMissingNode<ts.Identifier>(ts.SyntaxKind.Identifier, /*reportAtCurrentPosition*/ true, ts.Diagnostics.Identifier_expected);
            }
        }
        return allowIdentifierNames ? parseIdentifierName() : parseIdentifier();
    }
    function parseTemplateExpression(): ts.TemplateExpression {
        const template = (<ts.TemplateExpression>createNode(ts.SyntaxKind.TemplateExpression));
        template.head = parseTemplateHead();
        ts.Debug.assert(template.head.kind === ts.SyntaxKind.TemplateHead, "Template head has wrong token kind");
        const list = [];
        const listPos = getNodePos();
        do {
            list.push(parseTemplateSpan());
        } while (ts.last(list).literal.kind === ts.SyntaxKind.TemplateMiddle);
        template.templateSpans = createNodeArray(list, listPos);
        return finishNode(template);
    }
    function parseTemplateSpan(): ts.TemplateSpan {
        const span = (<ts.TemplateSpan>createNode(ts.SyntaxKind.TemplateSpan));
        span.expression = allowInAnd(parseExpression);
        let literal: ts.TemplateMiddle | ts.TemplateTail;
        if (token() === ts.SyntaxKind.CloseBraceToken) {
            reScanTemplateToken();
            literal = parseTemplateMiddleOrTemplateTail();
        }
        else {
            literal = (<ts.TemplateTail>parseExpectedToken(ts.SyntaxKind.TemplateTail, ts.Diagnostics._0_expected, ts.tokenToString(ts.SyntaxKind.CloseBraceToken)));
        }
        span.literal = literal;
        return finishNode(span);
    }
    function parseLiteralNode(): ts.LiteralExpression {
        return <ts.LiteralExpression>parseLiteralLikeNode(token());
    }
    function parseTemplateHead(): ts.TemplateHead {
        const fragment = parseLiteralLikeNode(token());
        ts.Debug.assert(fragment.kind === ts.SyntaxKind.TemplateHead, "Template head has wrong token kind");
        return <ts.TemplateHead>fragment;
    }
    function parseTemplateMiddleOrTemplateTail(): ts.TemplateMiddle | ts.TemplateTail {
        const fragment = parseLiteralLikeNode(token());
        ts.Debug.assert(fragment.kind === ts.SyntaxKind.TemplateMiddle || fragment.kind === ts.SyntaxKind.TemplateTail, "Template fragment has wrong token kind");
        return <ts.TemplateMiddle | ts.TemplateTail>fragment;
    }
    function parseLiteralLikeNode(kind: ts.SyntaxKind): ts.LiteralLikeNode {
        const node = (<ts.LiteralLikeNode>createNode(kind));
        node.text = scanner.getTokenValue();
        switch (kind) {
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
            case ts.SyntaxKind.TemplateHead:
            case ts.SyntaxKind.TemplateMiddle:
            case ts.SyntaxKind.TemplateTail:
                const isLast = kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral || kind === ts.SyntaxKind.TemplateTail;
                const tokenText = scanner.getTokenText();
                (<ts.TemplateLiteralLikeNode>node).rawText = tokenText.substring(1, tokenText.length - (scanner.isUnterminated() ? 0 : isLast ? 1 : 2));
                break;
        }
        if (scanner.hasExtendedUnicodeEscape()) {
            node.hasExtendedUnicodeEscape = true;
        }
        if (scanner.isUnterminated()) {
            node.isUnterminated = true;
        }
        // Octal literals are not allowed in strict mode or ES5
        // Note that theoretically the following condition would hold true literals like 009,
        // which is not octal.But because of how the scanner separates the tokens, we would
        // never get a token like this. Instead, we would get 00 and 9 as two separate tokens.
        // We also do not need to check for negatives because any prefix operator would be part of a
        // parent unary expression.
        if (node.kind === ts.SyntaxKind.NumericLiteral) {
            (<ts.NumericLiteral>node).numericLiteralFlags = scanner.getTokenFlags() & ts.TokenFlags.NumericLiteralFlags;
        }
        nextToken();
        finishNode(node);
        return node;
    }
    // TYPES
    function parseTypeReference(): ts.TypeReferenceNode {
        const node = (<ts.TypeReferenceNode>createNode(ts.SyntaxKind.TypeReference));
        node.typeName = parseEntityName(/*allowReservedWords*/ true, ts.Diagnostics.Type_expected);
        if (!scanner.hasPrecedingLineBreak() && reScanLessThanToken() === ts.SyntaxKind.LessThanToken) {
            node.typeArguments = parseBracketedList(ParsingContext.TypeArguments, parseType, ts.SyntaxKind.LessThanToken, ts.SyntaxKind.GreaterThanToken);
        }
        return finishNode(node);
    }
    // If true, we should abort parsing an error function.
    function typeHasArrowFunctionBlockingParseError(node: ts.TypeNode): boolean {
        switch (node.kind) {
            case ts.SyntaxKind.TypeReference:
                return ts.nodeIsMissing((node as ts.TypeReferenceNode).typeName);
            case ts.SyntaxKind.FunctionType:
            case ts.SyntaxKind.ConstructorType: {
                const { parameters, type } = (node as ts.FunctionOrConstructorTypeNode);
                return isMissingList(parameters) || typeHasArrowFunctionBlockingParseError(type);
            }
            case ts.SyntaxKind.ParenthesizedType:
                return typeHasArrowFunctionBlockingParseError((node as ts.ParenthesizedTypeNode).type);
            default:
                return false;
        }
    }
    function parseThisTypePredicate(lhs: ts.ThisTypeNode): ts.TypePredicateNode {
        nextToken();
        const node = (createNode(ts.SyntaxKind.TypePredicate, lhs.pos) as ts.TypePredicateNode);
        node.parameterName = lhs;
        node.type = parseType();
        return finishNode(node);
    }
    function parseThisTypeNode(): ts.ThisTypeNode {
        const node = (createNode(ts.SyntaxKind.ThisType) as ts.ThisTypeNode);
        nextToken();
        return finishNode(node);
    }
    function parseJSDocAllType(postFixEquals: boolean): ts.JSDocAllType | ts.JSDocOptionalType {
        const result = (createNode(ts.SyntaxKind.JSDocAllType) as ts.JSDocAllType);
        if (postFixEquals) {
            return createPostfixType(ts.SyntaxKind.JSDocOptionalType, result) as ts.JSDocOptionalType;
        }
        else {
            nextToken();
        }
        return finishNode(result);
    }
    function parseJSDocNonNullableType(): ts.TypeNode {
        const result = (createNode(ts.SyntaxKind.JSDocNonNullableType) as ts.JSDocNonNullableType);
        nextToken();
        result.type = parseNonArrayType();
        return finishNode(result);
    }
    function parseJSDocUnknownOrNullableType(): ts.JSDocUnknownType | ts.JSDocNullableType {
        const pos = scanner.getStartPos();
        // skip the ?
        nextToken();
        // Need to lookahead to decide if this is a nullable or unknown type.
        // Here are cases where we'll pick the unknown type:
        //
        //      Foo(?,
        //      { a: ? }
        //      Foo(?)
        //      Foo<?>
        //      Foo(?=
        //      (?|
        if (token() === ts.SyntaxKind.CommaToken ||
            token() === ts.SyntaxKind.CloseBraceToken ||
            token() === ts.SyntaxKind.CloseParenToken ||
            token() === ts.SyntaxKind.GreaterThanToken ||
            token() === ts.SyntaxKind.EqualsToken ||
            token() === ts.SyntaxKind.BarToken) {
            const result = (<ts.JSDocUnknownType>createNode(ts.SyntaxKind.JSDocUnknownType, pos));
            return finishNode(result);
        }
        else {
            const result = (<ts.JSDocNullableType>createNode(ts.SyntaxKind.JSDocNullableType, pos));
            result.type = parseType();
            return finishNode(result);
        }
    }
    function parseJSDocFunctionType(): ts.JSDocFunctionType | ts.TypeReferenceNode {
        if (lookAhead(nextTokenIsOpenParen)) {
            const result = (<ts.JSDocFunctionType>createNodeWithJSDoc(ts.SyntaxKind.JSDocFunctionType));
            nextToken();
            fillSignature(ts.SyntaxKind.ColonToken, SignatureFlags.Type | SignatureFlags.JSDoc, result);
            return finishNode(result);
        }
        const node = (<ts.TypeReferenceNode>createNode(ts.SyntaxKind.TypeReference));
        node.typeName = parseIdentifierName();
        return finishNode(node);
    }
    function parseJSDocParameter(): ts.ParameterDeclaration {
        const parameter = (createNode(ts.SyntaxKind.Parameter) as ts.ParameterDeclaration);
        if (token() === ts.SyntaxKind.ThisKeyword || token() === ts.SyntaxKind.NewKeyword) {
            parameter.name = parseIdentifierName();
            parseExpected(ts.SyntaxKind.ColonToken);
        }
        parameter.type = parseJSDocType();
        return finishNode(parameter);
    }
    function parseJSDocType(): ts.TypeNode {
        scanner.setInJSDocType(true);
        const moduleSpecifier = parseOptionalToken(ts.SyntaxKind.ModuleKeyword);
        if (moduleSpecifier) {
            const moduleTag = (createNode(ts.SyntaxKind.JSDocNamepathType, moduleSpecifier.pos) as ts.JSDocNamepathType);
            terminate: while (true) {
                switch (token()) {
                    case ts.SyntaxKind.CloseBraceToken:
                    case ts.SyntaxKind.EndOfFileToken:
                    case ts.SyntaxKind.CommaToken:
                    case ts.SyntaxKind.WhitespaceTrivia:
                        break terminate;
                    default:
                        nextTokenJSDoc();
                }
            }
            scanner.setInJSDocType(false);
            return finishNode(moduleTag);
        }
        const dotdotdot = parseOptionalToken(ts.SyntaxKind.DotDotDotToken);
        let type = parseTypeOrTypePredicate();
        scanner.setInJSDocType(false);
        if (dotdotdot) {
            const variadic = (createNode(ts.SyntaxKind.JSDocVariadicType, dotdotdot.pos) as ts.JSDocVariadicType);
            variadic.type = type;
            type = finishNode(variadic);
        }
        if (token() === ts.SyntaxKind.EqualsToken) {
            return createPostfixType(ts.SyntaxKind.JSDocOptionalType, type);
        }
        return type;
    }
    function parseTypeQuery(): ts.TypeQueryNode {
        const node = (<ts.TypeQueryNode>createNode(ts.SyntaxKind.TypeQuery));
        parseExpected(ts.SyntaxKind.TypeOfKeyword);
        node.exprName = parseEntityName(/*allowReservedWords*/ true);
        return finishNode(node);
    }
    function parseTypeParameter(): ts.TypeParameterDeclaration {
        const node = (<ts.TypeParameterDeclaration>createNode(ts.SyntaxKind.TypeParameter));
        node.name = parseIdentifier();
        if (parseOptional(ts.SyntaxKind.ExtendsKeyword)) {
            // It's not uncommon for people to write improper constraints to a generic.  If the
            // user writes a constraint that is an expression and not an actual type, then parse
            // it out as an expression (so we can recover well), but report that a type is needed
            // instead.
            if (isStartOfType() || !isStartOfExpression()) {
                node.constraint = parseType();
            }
            else {
                // It was not a type, and it looked like an expression.  Parse out an expression
                // here so we recover well.  Note: it is important that we call parseUnaryExpression
                // and not parseExpression here.  If the user has:
                //
                //      <T extends "">
                //
                // We do *not* want to consume the `>` as we're consuming the expression for "".
                node.expression = parseUnaryExpressionOrHigher();
            }
        }
        if (parseOptional(ts.SyntaxKind.EqualsToken)) {
            node.default = parseType();
        }
        return finishNode(node);
    }
    function parseTypeParameters(): ts.NodeArray<ts.TypeParameterDeclaration> | undefined {
        if (token() === ts.SyntaxKind.LessThanToken) {
            return parseBracketedList(ParsingContext.TypeParameters, parseTypeParameter, ts.SyntaxKind.LessThanToken, ts.SyntaxKind.GreaterThanToken);
        }
    }
    function parseParameterType(): ts.TypeNode | undefined {
        if (parseOptional(ts.SyntaxKind.ColonToken)) {
            return parseType();
        }
        return undefined;
    }
    function isStartOfParameter(isJSDocParameter: boolean): boolean {
        return token() === ts.SyntaxKind.DotDotDotToken ||
            isIdentifierOrPattern() ||
            ts.isModifierKind(token()) ||
            token() === ts.SyntaxKind.AtToken ||
            isStartOfType(/*inStartOfParameter*/ !isJSDocParameter);
    }
    function parseParameter(): ts.ParameterDeclaration {
        const node = (<ts.ParameterDeclaration>createNodeWithJSDoc(ts.SyntaxKind.Parameter));
        if (token() === ts.SyntaxKind.ThisKeyword) {
            node.name = createIdentifier(/*isIdentifier*/ true);
            node.type = parseParameterType();
            return finishNode(node);
        }
        node.decorators = parseDecorators();
        node.modifiers = parseModifiers();
        node.dotDotDotToken = parseOptionalToken(ts.SyntaxKind.DotDotDotToken);
        // FormalParameter [Yield,Await]:
        //      BindingElement[?Yield,?Await]
        node.name = parseIdentifierOrPattern();
        if (ts.getFullWidth(node.name) === 0 && !ts.hasModifiers(node) && ts.isModifierKind(token())) {
            // in cases like
            // 'use strict'
            // function foo(static)
            // isParameter('static') === true, because of isModifier('static')
            // however 'static' is not a legal identifier in a strict mode.
            // so result of this function will be ParameterDeclaration (flags = 0, name = missing, type = undefined, initializer = undefined)
            // and current token will not change => parsing of the enclosing parameter list will last till the end of time (or OOM)
            // to avoid this we'll advance cursor to the next token.
            nextToken();
        }
        node.questionToken = parseOptionalToken(ts.SyntaxKind.QuestionToken);
        node.type = parseParameterType();
        node.initializer = parseInitializer();
        return finishNode(node);
    }
    /**
     * Note: If returnToken is EqualsGreaterThanToken, `signature.type` will always be defined.
     * @returns If return type parsing succeeds
     */
    function fillSignature(returnToken: ts.SyntaxKind.ColonToken | ts.SyntaxKind.EqualsGreaterThanToken, flags: SignatureFlags, signature: ts.SignatureDeclaration): boolean {
        if (!(flags & SignatureFlags.JSDoc)) {
            signature.typeParameters = parseTypeParameters();
        }
        const parametersParsedSuccessfully = parseParameterList(signature, flags);
        if (shouldParseReturnType(returnToken, !!(flags & SignatureFlags.Type))) {
            signature.type = parseTypeOrTypePredicate();
            if (typeHasArrowFunctionBlockingParseError(signature.type))
                return false;
        }
        return parametersParsedSuccessfully;
    }
    function shouldParseReturnType(returnToken: ts.SyntaxKind.ColonToken | ts.SyntaxKind.EqualsGreaterThanToken, isType: boolean): boolean {
        if (returnToken === ts.SyntaxKind.EqualsGreaterThanToken) {
            parseExpected(returnToken);
            return true;
        }
        else if (parseOptional(ts.SyntaxKind.ColonToken)) {
            return true;
        }
        else if (isType && token() === ts.SyntaxKind.EqualsGreaterThanToken) {
            // This is easy to get backward, especially in type contexts, so parse the type anyway
            parseErrorAtCurrentToken(ts.Diagnostics._0_expected, ts.tokenToString(ts.SyntaxKind.ColonToken));
            nextToken();
            return true;
        }
        return false;
    }
    // Returns true on success.
    function parseParameterList(signature: ts.SignatureDeclaration, flags: SignatureFlags): boolean {
        // FormalParameters [Yield,Await]: (modified)
        //      [empty]
        //      FormalParameterList[?Yield,Await]
        //
        // FormalParameter[Yield,Await]: (modified)
        //      BindingElement[?Yield,Await]
        //
        // BindingElement [Yield,Await]: (modified)
        //      SingleNameBinding[?Yield,?Await]
        //      BindingPattern[?Yield,?Await]Initializer [In, ?Yield,?Await] opt
        //
        // SingleNameBinding [Yield,Await]:
        //      BindingIdentifier[?Yield,?Await]Initializer [In, ?Yield,?Await] opt
        if (!parseExpected(ts.SyntaxKind.OpenParenToken)) {
            signature.parameters = createMissingList<ts.ParameterDeclaration>();
            return false;
        }
        const savedYieldContext = inYieldContext();
        const savedAwaitContext = inAwaitContext();
        setYieldContext(!!(flags & SignatureFlags.Yield));
        setAwaitContext(!!(flags & SignatureFlags.Await));
        signature.parameters = flags & SignatureFlags.JSDoc ?
            parseDelimitedList(ParsingContext.JSDocParameters, parseJSDocParameter) :
            parseDelimitedList(ParsingContext.Parameters, parseParameter);
        setYieldContext(savedYieldContext);
        setAwaitContext(savedAwaitContext);
        return parseExpected(ts.SyntaxKind.CloseParenToken);
    }
    function parseTypeMemberSemicolon() {
        // We allow type members to be separated by commas or (possibly ASI) semicolons.
        // First check if it was a comma.  If so, we're done with the member.
        if (parseOptional(ts.SyntaxKind.CommaToken)) {
            return;
        }
        // Didn't have a comma.  We must have a (possible ASI) semicolon.
        parseSemicolon();
    }
    function parseSignatureMember(kind: ts.SyntaxKind.CallSignature | ts.SyntaxKind.ConstructSignature): ts.CallSignatureDeclaration | ts.ConstructSignatureDeclaration {
        const node = (<ts.CallSignatureDeclaration | ts.ConstructSignatureDeclaration>createNodeWithJSDoc(kind));
        if (kind === ts.SyntaxKind.ConstructSignature) {
            parseExpected(ts.SyntaxKind.NewKeyword);
        }
        fillSignature(ts.SyntaxKind.ColonToken, SignatureFlags.Type, node);
        parseTypeMemberSemicolon();
        return finishNode(node);
    }
    function isIndexSignature(): boolean {
        return token() === ts.SyntaxKind.OpenBracketToken && lookAhead(isUnambiguouslyIndexSignature);
    }
    function isUnambiguouslyIndexSignature() {
        // The only allowed sequence is:
        //
        //   [id:
        //
        // However, for error recovery, we also check the following cases:
        //
        //   [...
        //   [id,
        //   [id?,
        //   [id?:
        //   [id?]
        //   [public id
        //   [private id
        //   [protected id
        //   []
        //
        nextToken();
        if (token() === ts.SyntaxKind.DotDotDotToken || token() === ts.SyntaxKind.CloseBracketToken) {
            return true;
        }
        if (ts.isModifierKind(token())) {
            nextToken();
            if (isIdentifier()) {
                return true;
            }
        }
        else if (!isIdentifier()) {
            return false;
        }
        else {
            // Skip the identifier
            nextToken();
        }
        // A colon signifies a well formed indexer
        // A comma should be a badly formed indexer because comma expressions are not allowed
        // in computed properties.
        if (token() === ts.SyntaxKind.ColonToken || token() === ts.SyntaxKind.CommaToken) {
            return true;
        }
        // Question mark could be an indexer with an optional property,
        // or it could be a conditional expression in a computed property.
        if (token() !== ts.SyntaxKind.QuestionToken) {
            return false;
        }
        // If any of the following tokens are after the question mark, it cannot
        // be a conditional expression, so treat it as an indexer.
        nextToken();
        return token() === ts.SyntaxKind.ColonToken || token() === ts.SyntaxKind.CommaToken || token() === ts.SyntaxKind.CloseBracketToken;
    }
    function parseIndexSignatureDeclaration(node: ts.IndexSignatureDeclaration): ts.IndexSignatureDeclaration {
        node.kind = ts.SyntaxKind.IndexSignature;
        node.parameters = parseBracketedList(ParsingContext.Parameters, parseParameter, ts.SyntaxKind.OpenBracketToken, ts.SyntaxKind.CloseBracketToken);
        node.type = parseTypeAnnotation();
        parseTypeMemberSemicolon();
        return finishNode(node);
    }
    function parsePropertyOrMethodSignature(node: ts.PropertySignature | ts.MethodSignature): ts.PropertySignature | ts.MethodSignature {
        node.name = parsePropertyName();
        node.questionToken = parseOptionalToken(ts.SyntaxKind.QuestionToken);
        if (token() === ts.SyntaxKind.OpenParenToken || token() === ts.SyntaxKind.LessThanToken) {
            node.kind = ts.SyntaxKind.MethodSignature;
            // Method signatures don't exist in expression contexts.  So they have neither
            // [Yield] nor [Await]
            fillSignature(ts.SyntaxKind.ColonToken, SignatureFlags.Type, (<ts.MethodSignature>node));
        }
        else {
            node.kind = ts.SyntaxKind.PropertySignature;
            node.type = parseTypeAnnotation();
            if (token() === ts.SyntaxKind.EqualsToken) {
                // Although type literal properties cannot not have initializers, we attempt
                // to parse an initializer so we can report in the checker that an interface
                // property or type literal property cannot have an initializer.
                (<ts.PropertySignature>node).initializer = parseInitializer();
            }
        }
        parseTypeMemberSemicolon();
        return finishNode(node);
    }
    function isTypeMemberStart(): boolean {
        // Return true if we have the start of a signature member
        if (token() === ts.SyntaxKind.OpenParenToken || token() === ts.SyntaxKind.LessThanToken) {
            return true;
        }
        let idToken = false;
        // Eat up all modifiers, but hold on to the last one in case it is actually an identifier
        while (ts.isModifierKind(token())) {
            idToken = true;
            nextToken();
        }
        // Index signatures and computed property names are type members
        if (token() === ts.SyntaxKind.OpenBracketToken) {
            return true;
        }
        // Try to get the first property-like token following all modifiers
        if (isLiteralPropertyName()) {
            idToken = true;
            nextToken();
        }
        // If we were able to get any potential identifier, check that it is
        // the start of a member declaration
        if (idToken) {
            return token() === ts.SyntaxKind.OpenParenToken ||
                token() === ts.SyntaxKind.LessThanToken ||
                token() === ts.SyntaxKind.QuestionToken ||
                token() === ts.SyntaxKind.ColonToken ||
                token() === ts.SyntaxKind.CommaToken ||
                canParseSemicolon();
        }
        return false;
    }
    function parseTypeMember(): ts.TypeElement {
        if (token() === ts.SyntaxKind.OpenParenToken || token() === ts.SyntaxKind.LessThanToken) {
            return parseSignatureMember(ts.SyntaxKind.CallSignature);
        }
        if (token() === ts.SyntaxKind.NewKeyword && lookAhead(nextTokenIsOpenParenOrLessThan)) {
            return parseSignatureMember(ts.SyntaxKind.ConstructSignature);
        }
        const node = (<ts.TypeElement>createNodeWithJSDoc(ts.SyntaxKind.Unknown));
        node.modifiers = parseModifiers();
        if (isIndexSignature()) {
            return parseIndexSignatureDeclaration((<ts.IndexSignatureDeclaration>node));
        }
        return parsePropertyOrMethodSignature((<ts.PropertySignature | ts.MethodSignature>node));
    }
    function nextTokenIsOpenParenOrLessThan() {
        nextToken();
        return token() === ts.SyntaxKind.OpenParenToken || token() === ts.SyntaxKind.LessThanToken;
    }
    function nextTokenIsDot() {
        return nextToken() === ts.SyntaxKind.DotToken;
    }
    function nextTokenIsOpenParenOrLessThanOrDot() {
        switch (nextToken()) {
            case ts.SyntaxKind.OpenParenToken:
            case ts.SyntaxKind.LessThanToken:
            case ts.SyntaxKind.DotToken:
                return true;
        }
        return false;
    }
    function parseTypeLiteral(): ts.TypeLiteralNode {
        const node = (<ts.TypeLiteralNode>createNode(ts.SyntaxKind.TypeLiteral));
        node.members = parseObjectTypeMembers();
        return finishNode(node);
    }
    function parseObjectTypeMembers(): ts.NodeArray<ts.TypeElement> {
        let members: ts.NodeArray<ts.TypeElement>;
        if (parseExpected(ts.SyntaxKind.OpenBraceToken)) {
            members = parseList(ParsingContext.TypeMembers, parseTypeMember);
            parseExpected(ts.SyntaxKind.CloseBraceToken);
        }
        else {
            members = createMissingList<ts.TypeElement>();
        }
        return members;
    }
    function isStartOfMappedType() {
        nextToken();
        if (token() === ts.SyntaxKind.PlusToken || token() === ts.SyntaxKind.MinusToken) {
            return nextToken() === ts.SyntaxKind.ReadonlyKeyword;
        }
        if (token() === ts.SyntaxKind.ReadonlyKeyword) {
            nextToken();
        }
        return token() === ts.SyntaxKind.OpenBracketToken && nextTokenIsIdentifier() && nextToken() === ts.SyntaxKind.InKeyword;
    }
    function parseMappedTypeParameter() {
        const node = (<ts.TypeParameterDeclaration>createNode(ts.SyntaxKind.TypeParameter));
        node.name = parseIdentifier();
        parseExpected(ts.SyntaxKind.InKeyword);
        node.constraint = parseType();
        return finishNode(node);
    }
    function parseMappedType() {
        const node = (<ts.MappedTypeNode>createNode(ts.SyntaxKind.MappedType));
        parseExpected(ts.SyntaxKind.OpenBraceToken);
        if (token() === ts.SyntaxKind.ReadonlyKeyword || token() === ts.SyntaxKind.PlusToken || token() === ts.SyntaxKind.MinusToken) {
            node.readonlyToken = parseTokenNode<ts.ReadonlyToken | ts.PlusToken | ts.MinusToken>();
            if (node.readonlyToken.kind !== ts.SyntaxKind.ReadonlyKeyword) {
                parseExpectedToken(ts.SyntaxKind.ReadonlyKeyword);
            }
        }
        parseExpected(ts.SyntaxKind.OpenBracketToken);
        node.typeParameter = parseMappedTypeParameter();
        parseExpected(ts.SyntaxKind.CloseBracketToken);
        if (token() === ts.SyntaxKind.QuestionToken || token() === ts.SyntaxKind.PlusToken || token() === ts.SyntaxKind.MinusToken) {
            node.questionToken = parseTokenNode<ts.QuestionToken | ts.PlusToken | ts.MinusToken>();
            if (node.questionToken.kind !== ts.SyntaxKind.QuestionToken) {
                parseExpectedToken(ts.SyntaxKind.QuestionToken);
            }
        }
        node.type = parseTypeAnnotation();
        parseSemicolon();
        parseExpected(ts.SyntaxKind.CloseBraceToken);
        return finishNode(node);
    }
    function parseTupleElementType() {
        const pos = getNodePos();
        if (parseOptional(ts.SyntaxKind.DotDotDotToken)) {
            const node = (<ts.RestTypeNode>createNode(ts.SyntaxKind.RestType, pos));
            node.type = parseType();
            return finishNode(node);
        }
        const type = parseType();
        if (!(contextFlags & ts.NodeFlags.JSDoc) && type.kind === ts.SyntaxKind.JSDocNullableType && type.pos === (<ts.JSDocNullableType>type).type.pos) {
            type.kind = ts.SyntaxKind.OptionalType;
        }
        return type;
    }
    function parseTupleType(): ts.TupleTypeNode {
        const node = (<ts.TupleTypeNode>createNode(ts.SyntaxKind.TupleType));
        node.elementTypes = parseBracketedList(ParsingContext.TupleElementTypes, parseTupleElementType, ts.SyntaxKind.OpenBracketToken, ts.SyntaxKind.CloseBracketToken);
        return finishNode(node);
    }
    function parseParenthesizedType(): ts.TypeNode {
        const node = (<ts.ParenthesizedTypeNode>createNode(ts.SyntaxKind.ParenthesizedType));
        parseExpected(ts.SyntaxKind.OpenParenToken);
        node.type = parseType();
        parseExpected(ts.SyntaxKind.CloseParenToken);
        return finishNode(node);
    }
    function parseFunctionOrConstructorType(): ts.TypeNode {
        const pos = getNodePos();
        const kind = parseOptional(ts.SyntaxKind.NewKeyword) ? ts.SyntaxKind.ConstructorType : ts.SyntaxKind.FunctionType;
        const node = (<ts.FunctionOrConstructorTypeNode>createNodeWithJSDoc(kind, pos));
        fillSignature(ts.SyntaxKind.EqualsGreaterThanToken, SignatureFlags.Type, node);
        return finishNode(node);
    }
    function parseKeywordAndNoDot(): ts.TypeNode | undefined {
        const node = parseTokenNode<ts.TypeNode>();
        return token() === ts.SyntaxKind.DotToken ? undefined : node;
    }
    function parseLiteralTypeNode(negative?: boolean): ts.LiteralTypeNode {
        const node = (createNode(ts.SyntaxKind.LiteralType) as ts.LiteralTypeNode);
        let unaryMinusExpression!: ts.PrefixUnaryExpression;
        if (negative) {
            unaryMinusExpression = (createNode(ts.SyntaxKind.PrefixUnaryExpression) as ts.PrefixUnaryExpression);
            unaryMinusExpression.operator = ts.SyntaxKind.MinusToken;
            nextToken();
        }
        let expression: ts.BooleanLiteral | ts.LiteralExpression | ts.PrefixUnaryExpression = token() === ts.SyntaxKind.TrueKeyword || token() === ts.SyntaxKind.FalseKeyword
            ? parseTokenNode<ts.BooleanLiteral>()
            : parseLiteralLikeNode(token()) as ts.LiteralExpression;
        if (negative) {
            unaryMinusExpression.operand = expression;
            finishNode(unaryMinusExpression);
            expression = unaryMinusExpression;
        }
        node.literal = expression;
        return finishNode(node);
    }
    function isStartOfTypeOfImportType() {
        nextToken();
        return token() === ts.SyntaxKind.ImportKeyword;
    }
    function parseImportType(): ts.ImportTypeNode {
        sourceFile.flags |= ts.NodeFlags.PossiblyContainsDynamicImport;
        const node = (createNode(ts.SyntaxKind.ImportType) as ts.ImportTypeNode);
        if (parseOptional(ts.SyntaxKind.TypeOfKeyword)) {
            node.isTypeOf = true;
        }
        parseExpected(ts.SyntaxKind.ImportKeyword);
        parseExpected(ts.SyntaxKind.OpenParenToken);
        node.argument = parseType();
        parseExpected(ts.SyntaxKind.CloseParenToken);
        if (parseOptional(ts.SyntaxKind.DotToken)) {
            node.qualifier = parseEntityName(/*allowReservedWords*/ true, ts.Diagnostics.Type_expected);
        }
        if (!scanner.hasPrecedingLineBreak() && reScanLessThanToken() === ts.SyntaxKind.LessThanToken) {
            node.typeArguments = parseBracketedList(ParsingContext.TypeArguments, parseType, ts.SyntaxKind.LessThanToken, ts.SyntaxKind.GreaterThanToken);
        }
        return finishNode(node);
    }
    function nextTokenIsNumericOrBigIntLiteral() {
        nextToken();
        return token() === ts.SyntaxKind.NumericLiteral || token() === ts.SyntaxKind.BigIntLiteral;
    }
    function parseNonArrayType(): ts.TypeNode {
        switch (token()) {
            case ts.SyntaxKind.AnyKeyword:
            case ts.SyntaxKind.UnknownKeyword:
            case ts.SyntaxKind.StringKeyword:
            case ts.SyntaxKind.NumberKeyword:
            case ts.SyntaxKind.BigIntKeyword:
            case ts.SyntaxKind.SymbolKeyword:
            case ts.SyntaxKind.BooleanKeyword:
            case ts.SyntaxKind.UndefinedKeyword:
            case ts.SyntaxKind.NeverKeyword:
            case ts.SyntaxKind.ObjectKeyword:
                // If these are followed by a dot, then parse these out as a dotted type reference instead.
                return tryParse(parseKeywordAndNoDot) || parseTypeReference();
            case ts.SyntaxKind.AsteriskToken:
                return parseJSDocAllType(/*postfixEquals*/ false);
            case ts.SyntaxKind.AsteriskEqualsToken:
                return parseJSDocAllType(/*postfixEquals*/ true);
            case ts.SyntaxKind.QuestionQuestionToken:
                // If there is '??', consider that is prefix '?' in JSDoc type.
                scanner.reScanQuestionToken();
            // falls through
            case ts.SyntaxKind.QuestionToken:
                return parseJSDocUnknownOrNullableType();
            case ts.SyntaxKind.FunctionKeyword:
                return parseJSDocFunctionType();
            case ts.SyntaxKind.ExclamationToken:
                return parseJSDocNonNullableType();
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.NumericLiteral:
            case ts.SyntaxKind.BigIntLiteral:
            case ts.SyntaxKind.TrueKeyword:
            case ts.SyntaxKind.FalseKeyword:
                return parseLiteralTypeNode();
            case ts.SyntaxKind.MinusToken:
                return lookAhead(nextTokenIsNumericOrBigIntLiteral) ? parseLiteralTypeNode(/*negative*/ true) : parseTypeReference();
            case ts.SyntaxKind.VoidKeyword:
            case ts.SyntaxKind.NullKeyword:
                return parseTokenNode<ts.TypeNode>();
            case ts.SyntaxKind.ThisKeyword: {
                const thisKeyword = parseThisTypeNode();
                if (token() === ts.SyntaxKind.IsKeyword && !scanner.hasPrecedingLineBreak()) {
                    return parseThisTypePredicate(thisKeyword);
                }
                else {
                    return thisKeyword;
                }
            }
            case ts.SyntaxKind.TypeOfKeyword:
                return lookAhead(isStartOfTypeOfImportType) ? parseImportType() : parseTypeQuery();
            case ts.SyntaxKind.OpenBraceToken:
                return lookAhead(isStartOfMappedType) ? parseMappedType() : parseTypeLiteral();
            case ts.SyntaxKind.OpenBracketToken:
                return parseTupleType();
            case ts.SyntaxKind.OpenParenToken:
                return parseParenthesizedType();
            case ts.SyntaxKind.ImportKeyword:
                return parseImportType();
            case ts.SyntaxKind.AssertsKeyword:
                return lookAhead(nextTokenIsIdentifierOrKeywordOnSameLine) ? parseAssertsTypePredicate() : parseTypeReference();
            default:
                return parseTypeReference();
        }
    }
    function isStartOfType(inStartOfParameter?: boolean): boolean {
        switch (token()) {
            case ts.SyntaxKind.AnyKeyword:
            case ts.SyntaxKind.UnknownKeyword:
            case ts.SyntaxKind.StringKeyword:
            case ts.SyntaxKind.NumberKeyword:
            case ts.SyntaxKind.BigIntKeyword:
            case ts.SyntaxKind.BooleanKeyword:
            case ts.SyntaxKind.ReadonlyKeyword:
            case ts.SyntaxKind.SymbolKeyword:
            case ts.SyntaxKind.UniqueKeyword:
            case ts.SyntaxKind.VoidKeyword:
            case ts.SyntaxKind.UndefinedKeyword:
            case ts.SyntaxKind.NullKeyword:
            case ts.SyntaxKind.ThisKeyword:
            case ts.SyntaxKind.TypeOfKeyword:
            case ts.SyntaxKind.NeverKeyword:
            case ts.SyntaxKind.OpenBraceToken:
            case ts.SyntaxKind.OpenBracketToken:
            case ts.SyntaxKind.LessThanToken:
            case ts.SyntaxKind.BarToken:
            case ts.SyntaxKind.AmpersandToken:
            case ts.SyntaxKind.NewKeyword:
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.NumericLiteral:
            case ts.SyntaxKind.BigIntLiteral:
            case ts.SyntaxKind.TrueKeyword:
            case ts.SyntaxKind.FalseKeyword:
            case ts.SyntaxKind.ObjectKeyword:
            case ts.SyntaxKind.AsteriskToken:
            case ts.SyntaxKind.QuestionToken:
            case ts.SyntaxKind.ExclamationToken:
            case ts.SyntaxKind.DotDotDotToken:
            case ts.SyntaxKind.InferKeyword:
            case ts.SyntaxKind.ImportKeyword:
            case ts.SyntaxKind.AssertsKeyword:
                return true;
            case ts.SyntaxKind.FunctionKeyword:
                return !inStartOfParameter;
            case ts.SyntaxKind.MinusToken:
                return !inStartOfParameter && lookAhead(nextTokenIsNumericOrBigIntLiteral);
            case ts.SyntaxKind.OpenParenToken:
                // Only consider '(' the start of a type if followed by ')', '...', an identifier, a modifier,
                // or something that starts a type. We don't want to consider things like '(1)' a type.
                return !inStartOfParameter && lookAhead(isStartOfParenthesizedOrFunctionType);
            default:
                return isIdentifier();
        }
    }
    function isStartOfParenthesizedOrFunctionType() {
        nextToken();
        return token() === ts.SyntaxKind.CloseParenToken || isStartOfParameter(/*isJSDocParameter*/ false) || isStartOfType();
    }
    function parsePostfixTypeOrHigher(): ts.TypeNode {
        let type = parseNonArrayType();
        while (!scanner.hasPrecedingLineBreak()) {
            switch (token()) {
                case ts.SyntaxKind.ExclamationToken:
                    type = createPostfixType(ts.SyntaxKind.JSDocNonNullableType, type);
                    break;
                case ts.SyntaxKind.QuestionToken:
                    // If not in JSDoc and next token is start of a type we have a conditional type
                    if (!(contextFlags & ts.NodeFlags.JSDoc) && lookAhead(nextTokenIsStartOfType)) {
                        return type;
                    }
                    type = createPostfixType(ts.SyntaxKind.JSDocNullableType, type);
                    break;
                case ts.SyntaxKind.OpenBracketToken:
                    parseExpected(ts.SyntaxKind.OpenBracketToken);
                    if (isStartOfType()) {
                        const node = (createNode(ts.SyntaxKind.IndexedAccessType, type.pos) as ts.IndexedAccessTypeNode);
                        node.objectType = type;
                        node.indexType = parseType();
                        parseExpected(ts.SyntaxKind.CloseBracketToken);
                        type = finishNode(node);
                    }
                    else {
                        const node = (createNode(ts.SyntaxKind.ArrayType, type.pos) as ts.ArrayTypeNode);
                        node.elementType = type;
                        parseExpected(ts.SyntaxKind.CloseBracketToken);
                        type = finishNode(node);
                    }
                    break;
                default:
                    return type;
            }
        }
        return type;
    }
    function createPostfixType(kind: ts.SyntaxKind, type: ts.TypeNode) {
        nextToken();
        const postfix = (createNode(kind, type.pos) as ts.OptionalTypeNode | ts.JSDocOptionalType | ts.JSDocNonNullableType | ts.JSDocNullableType);
        postfix.type = type;
        return finishNode(postfix);
    }
    function parseTypeOperator(operator: ts.SyntaxKind.KeyOfKeyword | ts.SyntaxKind.UniqueKeyword | ts.SyntaxKind.ReadonlyKeyword) {
        const node = (<ts.TypeOperatorNode>createNode(ts.SyntaxKind.TypeOperator));
        parseExpected(operator);
        node.operator = operator;
        node.type = parseTypeOperatorOrHigher();
        return finishNode(node);
    }
    function parseInferType(): ts.InferTypeNode {
        const node = (<ts.InferTypeNode>createNode(ts.SyntaxKind.InferType));
        parseExpected(ts.SyntaxKind.InferKeyword);
        const typeParameter = (<ts.TypeParameterDeclaration>createNode(ts.SyntaxKind.TypeParameter));
        typeParameter.name = parseIdentifier();
        node.typeParameter = finishNode(typeParameter);
        return finishNode(node);
    }
    function parseTypeOperatorOrHigher(): ts.TypeNode {
        const operator = token();
        switch (operator) {
            case ts.SyntaxKind.KeyOfKeyword:
            case ts.SyntaxKind.UniqueKeyword:
            case ts.SyntaxKind.ReadonlyKeyword:
                return parseTypeOperator(operator);
            case ts.SyntaxKind.InferKeyword:
                return parseInferType();
        }
        return parsePostfixTypeOrHigher();
    }
    function parseUnionOrIntersectionType(kind: ts.SyntaxKind.UnionType | ts.SyntaxKind.IntersectionType, parseConstituentType: () => ts.TypeNode, operator: ts.SyntaxKind.BarToken | ts.SyntaxKind.AmpersandToken): ts.TypeNode {
        const start = scanner.getStartPos();
        const hasLeadingOperator = parseOptional(operator);
        let type = parseConstituentType();
        if (token() === operator || hasLeadingOperator) {
            const types = [type];
            while (parseOptional(operator)) {
                types.push(parseConstituentType());
            }
            const node = (<ts.UnionOrIntersectionTypeNode>createNode(kind, start));
            node.types = createNodeArray(types, start);
            type = finishNode(node);
        }
        return type;
    }
    function parseIntersectionTypeOrHigher(): ts.TypeNode {
        return parseUnionOrIntersectionType(ts.SyntaxKind.IntersectionType, parseTypeOperatorOrHigher, ts.SyntaxKind.AmpersandToken);
    }
    function parseUnionTypeOrHigher(): ts.TypeNode {
        return parseUnionOrIntersectionType(ts.SyntaxKind.UnionType, parseIntersectionTypeOrHigher, ts.SyntaxKind.BarToken);
    }
    function isStartOfFunctionType(): boolean {
        if (token() === ts.SyntaxKind.LessThanToken) {
            return true;
        }
        return token() === ts.SyntaxKind.OpenParenToken && lookAhead(isUnambiguouslyStartOfFunctionType);
    }
    function skipParameterStart(): boolean {
        if (ts.isModifierKind(token())) {
            // Skip modifiers
            parseModifiers();
        }
        if (isIdentifier() || token() === ts.SyntaxKind.ThisKeyword) {
            nextToken();
            return true;
        }
        if (token() === ts.SyntaxKind.OpenBracketToken || token() === ts.SyntaxKind.OpenBraceToken) {
            // Return true if we can parse an array or object binding pattern with no errors
            const previousErrorCount = parseDiagnostics.length;
            parseIdentifierOrPattern();
            return previousErrorCount === parseDiagnostics.length;
        }
        return false;
    }
    function isUnambiguouslyStartOfFunctionType() {
        nextToken();
        if (token() === ts.SyntaxKind.CloseParenToken || token() === ts.SyntaxKind.DotDotDotToken) {
            // ( )
            // ( ...
            return true;
        }
        if (skipParameterStart()) {
            // We successfully skipped modifiers (if any) and an identifier or binding pattern,
            // now see if we have something that indicates a parameter declaration
            if (token() === ts.SyntaxKind.ColonToken || token() === ts.SyntaxKind.CommaToken ||
                token() === ts.SyntaxKind.QuestionToken || token() === ts.SyntaxKind.EqualsToken) {
                // ( xxx :
                // ( xxx ,
                // ( xxx ?
                // ( xxx =
                return true;
            }
            if (token() === ts.SyntaxKind.CloseParenToken) {
                nextToken();
                if (token() === ts.SyntaxKind.EqualsGreaterThanToken) {
                    // ( xxx ) =>
                    return true;
                }
            }
        }
        return false;
    }
    function parseTypeOrTypePredicate(): ts.TypeNode {
        const typePredicateVariable = isIdentifier() && tryParse(parseTypePredicatePrefix);
        const type = parseType();
        if (typePredicateVariable) {
            const node = (<ts.TypePredicateNode>createNode(ts.SyntaxKind.TypePredicate, typePredicateVariable.pos));
            node.assertsModifier = undefined;
            node.parameterName = typePredicateVariable;
            node.type = type;
            return finishNode(node);
        }
        else {
            return type;
        }
    }
    function parseTypePredicatePrefix() {
        const id = parseIdentifier();
        if (token() === ts.SyntaxKind.IsKeyword && !scanner.hasPrecedingLineBreak()) {
            nextToken();
            return id;
        }
    }
    function parseAssertsTypePredicate(): ts.TypeNode {
        const node = (<ts.TypePredicateNode>createNode(ts.SyntaxKind.TypePredicate));
        node.assertsModifier = parseExpectedToken(ts.SyntaxKind.AssertsKeyword);
        node.parameterName = token() === ts.SyntaxKind.ThisKeyword ? parseThisTypeNode() : parseIdentifier();
        node.type = parseOptional(ts.SyntaxKind.IsKeyword) ? parseType() : undefined;
        return finishNode(node);
    }
    function parseType(): ts.TypeNode {
        // The rules about 'yield' only apply to actual code/expression contexts.  They don't
        // apply to 'type' contexts.  So we disable these parameters here before moving on.
        return doOutsideOfContext(ts.NodeFlags.TypeExcludesFlags, parseTypeWorker);
    }
    function parseTypeWorker(noConditionalTypes?: boolean): ts.TypeNode {
        if (isStartOfFunctionType() || token() === ts.SyntaxKind.NewKeyword) {
            return parseFunctionOrConstructorType();
        }
        const type = parseUnionTypeOrHigher();
        if (!noConditionalTypes && !scanner.hasPrecedingLineBreak() && parseOptional(ts.SyntaxKind.ExtendsKeyword)) {
            const node = (<ts.ConditionalTypeNode>createNode(ts.SyntaxKind.ConditionalType, type.pos));
            node.checkType = type;
            // The type following 'extends' is not permitted to be another conditional type
            node.extendsType = parseTypeWorker(/*noConditionalTypes*/ true);
            parseExpected(ts.SyntaxKind.QuestionToken);
            node.trueType = parseTypeWorker();
            parseExpected(ts.SyntaxKind.ColonToken);
            node.falseType = parseTypeWorker();
            return finishNode(node);
        }
        return type;
    }
    function parseTypeAnnotation(): ts.TypeNode | undefined {
        return parseOptional(ts.SyntaxKind.ColonToken) ? parseType() : undefined;
    }
    // EXPRESSIONS
    function isStartOfLeftHandSideExpression(): boolean {
        switch (token()) {
            case ts.SyntaxKind.ThisKeyword:
            case ts.SyntaxKind.SuperKeyword:
            case ts.SyntaxKind.NullKeyword:
            case ts.SyntaxKind.TrueKeyword:
            case ts.SyntaxKind.FalseKeyword:
            case ts.SyntaxKind.NumericLiteral:
            case ts.SyntaxKind.BigIntLiteral:
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
            case ts.SyntaxKind.TemplateHead:
            case ts.SyntaxKind.OpenParenToken:
            case ts.SyntaxKind.OpenBracketToken:
            case ts.SyntaxKind.OpenBraceToken:
            case ts.SyntaxKind.FunctionKeyword:
            case ts.SyntaxKind.ClassKeyword:
            case ts.SyntaxKind.NewKeyword:
            case ts.SyntaxKind.SlashToken:
            case ts.SyntaxKind.SlashEqualsToken:
            case ts.SyntaxKind.Identifier:
                return true;
            case ts.SyntaxKind.ImportKeyword:
                return lookAhead(nextTokenIsOpenParenOrLessThanOrDot);
            default:
                return isIdentifier();
        }
    }
    function isStartOfExpression(): boolean {
        if (isStartOfLeftHandSideExpression()) {
            return true;
        }
        switch (token()) {
            case ts.SyntaxKind.PlusToken:
            case ts.SyntaxKind.MinusToken:
            case ts.SyntaxKind.TildeToken:
            case ts.SyntaxKind.ExclamationToken:
            case ts.SyntaxKind.DeleteKeyword:
            case ts.SyntaxKind.TypeOfKeyword:
            case ts.SyntaxKind.VoidKeyword:
            case ts.SyntaxKind.PlusPlusToken:
            case ts.SyntaxKind.MinusMinusToken:
            case ts.SyntaxKind.LessThanToken:
            case ts.SyntaxKind.AwaitKeyword:
            case ts.SyntaxKind.YieldKeyword:
                // Yield/await always starts an expression.  Either it is an identifier (in which case
                // it is definitely an expression).  Or it's a keyword (either because we're in
                // a generator or async function, or in strict mode (or both)) and it started a yield or await expression.
                return true;
            default:
                // Error tolerance.  If we see the start of some binary operator, we consider
                // that the start of an expression.  That way we'll parse out a missing identifier,
                // give a good message about an identifier being missing, and then consume the
                // rest of the binary expression.
                if (isBinaryOperator()) {
                    return true;
                }
                return isIdentifier();
        }
    }
    function isStartOfExpressionStatement(): boolean {
        // As per the grammar, none of '{' or 'function' or 'class' can start an expression statement.
        return token() !== ts.SyntaxKind.OpenBraceToken &&
            token() !== ts.SyntaxKind.FunctionKeyword &&
            token() !== ts.SyntaxKind.ClassKeyword &&
            token() !== ts.SyntaxKind.AtToken &&
            isStartOfExpression();
    }
    function parseExpression(): ts.Expression {
        // Expression[in]:
        //      AssignmentExpression[in]
        //      Expression[in] , AssignmentExpression[in]
        // clear the decorator context when parsing Expression, as it should be unambiguous when parsing a decorator
        const saveDecoratorContext = inDecoratorContext();
        if (saveDecoratorContext) {
            setDecoratorContext(/*val*/ false);
        }
        let expr = parseAssignmentExpressionOrHigher();
        let operatorToken: ts.BinaryOperatorToken;
        while ((operatorToken = parseOptionalToken(ts.SyntaxKind.CommaToken))) {
            expr = makeBinaryExpression(expr, operatorToken, parseAssignmentExpressionOrHigher());
        }
        if (saveDecoratorContext) {
            setDecoratorContext(/*val*/ true);
        }
        return expr;
    }
    function parseInitializer(): ts.Expression | undefined {
        return parseOptional(ts.SyntaxKind.EqualsToken) ? parseAssignmentExpressionOrHigher() : undefined;
    }
    function parseAssignmentExpressionOrHigher(): ts.Expression {
        //  AssignmentExpression[in,yield]:
        //      1) ConditionalExpression[?in,?yield]
        //      2) LeftHandSideExpression = AssignmentExpression[?in,?yield]
        //      3) LeftHandSideExpression AssignmentOperator AssignmentExpression[?in,?yield]
        //      4) ArrowFunctionExpression[?in,?yield]
        //      5) AsyncArrowFunctionExpression[in,yield,await]
        //      6) [+Yield] YieldExpression[?In]
        //
        // Note: for ease of implementation we treat productions '2' and '3' as the same thing.
        // (i.e. they're both BinaryExpressions with an assignment operator in it).
        // First, do the simple check if we have a YieldExpression (production '6').
        if (isYieldExpression()) {
            return parseYieldExpression();
        }
        // Then, check if we have an arrow function (production '4' and '5') that starts with a parenthesized
        // parameter list or is an async arrow function.
        // AsyncArrowFunctionExpression:
        //      1) async[no LineTerminator here]AsyncArrowBindingIdentifier[?Yield][no LineTerminator here]=>AsyncConciseBody[?In]
        //      2) CoverCallExpressionAndAsyncArrowHead[?Yield, ?Await][no LineTerminator here]=>AsyncConciseBody[?In]
        // Production (1) of AsyncArrowFunctionExpression is parsed in "tryParseAsyncSimpleArrowFunctionExpression".
        // And production (2) is parsed in "tryParseParenthesizedArrowFunctionExpression".
        //
        // If we do successfully parse arrow-function, we must *not* recurse for productions 1, 2 or 3. An ArrowFunction is
        // not a LeftHandSideExpression, nor does it start a ConditionalExpression.  So we are done
        // with AssignmentExpression if we see one.
        const arrowExpression = tryParseParenthesizedArrowFunctionExpression() || tryParseAsyncSimpleArrowFunctionExpression();
        if (arrowExpression) {
            return arrowExpression;
        }
        // Now try to see if we're in production '1', '2' or '3'.  A conditional expression can
        // start with a LogicalOrExpression, while the assignment productions can only start with
        // LeftHandSideExpressions.
        //
        // So, first, we try to just parse out a BinaryExpression.  If we get something that is a
        // LeftHandSide or higher, then we can try to parse out the assignment expression part.
        // Otherwise, we try to parse out the conditional expression bit.  We want to allow any
        // binary expression here, so we pass in the 'lowest' precedence here so that it matches
        // and consumes anything.
        const expr = parseBinaryExpressionOrHigher(/*precedence*/ 0);
        // To avoid a look-ahead, we did not handle the case of an arrow function with a single un-parenthesized
        // parameter ('x => ...') above. We handle it here by checking if the parsed expression was a single
        // identifier and the current token is an arrow.
        if (expr.kind === ts.SyntaxKind.Identifier && token() === ts.SyntaxKind.EqualsGreaterThanToken) {
            return parseSimpleArrowFunctionExpression((<ts.Identifier>expr));
        }
        // Now see if we might be in cases '2' or '3'.
        // If the expression was a LHS expression, and we have an assignment operator, then
        // we're in '2' or '3'. Consume the assignment and return.
        //
        // Note: we call reScanGreaterToken so that we get an appropriately merged token
        // for cases like `> > =` becoming `>>=`
        if (ts.isLeftHandSideExpression(expr) && ts.isAssignmentOperator(reScanGreaterToken())) {
            return makeBinaryExpression(expr, parseTokenNode(), parseAssignmentExpressionOrHigher());
        }
        // It wasn't an assignment or a lambda.  This is a conditional expression:
        return parseConditionalExpressionRest(expr);
    }
    function isYieldExpression(): boolean {
        if (token() === ts.SyntaxKind.YieldKeyword) {
            // If we have a 'yield' keyword, and this is a context where yield expressions are
            // allowed, then definitely parse out a yield expression.
            if (inYieldContext()) {
                return true;
            }
            // We're in a context where 'yield expr' is not allowed.  However, if we can
            // definitely tell that the user was trying to parse a 'yield expr' and not
            // just a normal expr that start with a 'yield' identifier, then parse out
            // a 'yield expr'.  We can then report an error later that they are only
            // allowed in generator expressions.
            //
            // for example, if we see 'yield(foo)', then we'll have to treat that as an
            // invocation expression of something called 'yield'.  However, if we have
            // 'yield foo' then that is not legal as a normal expression, so we can
            // definitely recognize this as a yield expression.
            //
            // for now we just check if the next token is an identifier.  More heuristics
            // can be added here later as necessary.  We just need to make sure that we
            // don't accidentally consume something legal.
            return lookAhead(nextTokenIsIdentifierOrKeywordOrLiteralOnSameLine);
        }
        return false;
    }
    function nextTokenIsIdentifierOnSameLine() {
        nextToken();
        return !scanner.hasPrecedingLineBreak() && isIdentifier();
    }
    function parseYieldExpression(): ts.YieldExpression {
        const node = (<ts.YieldExpression>createNode(ts.SyntaxKind.YieldExpression));
        // YieldExpression[In] :
        //      yield
        //      yield [no LineTerminator here] [Lexical goal InputElementRegExp]AssignmentExpression[?In, Yield]
        //      yield [no LineTerminator here] * [Lexical goal InputElementRegExp]AssignmentExpression[?In, Yield]
        nextToken();
        if (!scanner.hasPrecedingLineBreak() &&
            (token() === ts.SyntaxKind.AsteriskToken || isStartOfExpression())) {
            node.asteriskToken = parseOptionalToken(ts.SyntaxKind.AsteriskToken);
            node.expression = parseAssignmentExpressionOrHigher();
            return finishNode(node);
        }
        else {
            // if the next token is not on the same line as yield.  or we don't have an '*' or
            // the start of an expression, then this is just a simple "yield" expression.
            return finishNode(node);
        }
    }
    function parseSimpleArrowFunctionExpression(identifier: ts.Identifier, asyncModifier?: ts.NodeArray<ts.Modifier> | undefined): ts.ArrowFunction {
        ts.Debug.assert(token() === ts.SyntaxKind.EqualsGreaterThanToken, "parseSimpleArrowFunctionExpression should only have been called if we had a =>");
        let node: ts.ArrowFunction;
        if (asyncModifier) {
            node = (<ts.ArrowFunction>createNode(ts.SyntaxKind.ArrowFunction, asyncModifier.pos));
            node.modifiers = asyncModifier;
        }
        else {
            node = (<ts.ArrowFunction>createNode(ts.SyntaxKind.ArrowFunction, identifier.pos));
        }
        const parameter = (<ts.ParameterDeclaration>createNode(ts.SyntaxKind.Parameter, identifier.pos));
        parameter.name = identifier;
        finishNode(parameter);
        node.parameters = createNodeArray<ts.ParameterDeclaration>([parameter], parameter.pos, parameter.end);
        node.equalsGreaterThanToken = parseExpectedToken(ts.SyntaxKind.EqualsGreaterThanToken);
        node.body = parseArrowFunctionExpressionBody(/*isAsync*/ !!asyncModifier);
        return addJSDocComment(finishNode(node));
    }
    function tryParseParenthesizedArrowFunctionExpression(): ts.Expression | undefined {
        const triState = isParenthesizedArrowFunctionExpression();
        if (triState === Tristate.False) {
            // It's definitely not a parenthesized arrow function expression.
            return undefined;
        }
        // If we definitely have an arrow function, then we can just parse one, not requiring a
        // following => or { token. Otherwise, we *might* have an arrow function.  Try to parse
        // it out, but don't allow any ambiguity, and return 'undefined' if this could be an
        // expression instead.
        const arrowFunction = triState === Tristate.True
            ? parseParenthesizedArrowFunctionExpressionHead(/*allowAmbiguity*/ true)
            : tryParse(parsePossibleParenthesizedArrowFunctionExpressionHead);
        if (!arrowFunction) {
            // Didn't appear to actually be a parenthesized arrow function.  Just bail out.
            return undefined;
        }
        const isAsync = ts.hasModifier(arrowFunction, ts.ModifierFlags.Async);
        // If we have an arrow, then try to parse the body. Even if not, try to parse if we
        // have an opening brace, just in case we're in an error state.
        const lastToken = token();
        arrowFunction.equalsGreaterThanToken = parseExpectedToken(ts.SyntaxKind.EqualsGreaterThanToken);
        arrowFunction.body = (lastToken === ts.SyntaxKind.EqualsGreaterThanToken || lastToken === ts.SyntaxKind.OpenBraceToken)
            ? parseArrowFunctionExpressionBody(isAsync)
            : parseIdentifier();
        return finishNode(arrowFunction);
    }
    //  True        -> We definitely expect a parenthesized arrow function here.
    //  False       -> There *cannot* be a parenthesized arrow function here.
    //  Unknown     -> There *might* be a parenthesized arrow function here.
    //                 Speculatively look ahead to be sure, and rollback if not.
    function isParenthesizedArrowFunctionExpression(): Tristate {
        if (token() === ts.SyntaxKind.OpenParenToken || token() === ts.SyntaxKind.LessThanToken || token() === ts.SyntaxKind.AsyncKeyword) {
            return lookAhead(isParenthesizedArrowFunctionExpressionWorker);
        }
        if (token() === ts.SyntaxKind.EqualsGreaterThanToken) {
            // ERROR RECOVERY TWEAK:
            // If we see a standalone => try to parse it as an arrow function expression as that's
            // likely what the user intended to write.
            return Tristate.True;
        }
        // Definitely not a parenthesized arrow function.
        return Tristate.False;
    }
    function isParenthesizedArrowFunctionExpressionWorker() {
        if (token() === ts.SyntaxKind.AsyncKeyword) {
            nextToken();
            if (scanner.hasPrecedingLineBreak()) {
                return Tristate.False;
            }
            if (token() !== ts.SyntaxKind.OpenParenToken && token() !== ts.SyntaxKind.LessThanToken) {
                return Tristate.False;
            }
        }
        const first = token();
        const second = nextToken();
        if (first === ts.SyntaxKind.OpenParenToken) {
            if (second === ts.SyntaxKind.CloseParenToken) {
                // Simple cases: "() =>", "(): ", and "() {".
                // This is an arrow function with no parameters.
                // The last one is not actually an arrow function,
                // but this is probably what the user intended.
                const third = nextToken();
                switch (third) {
                    case ts.SyntaxKind.EqualsGreaterThanToken:
                    case ts.SyntaxKind.ColonToken:
                    case ts.SyntaxKind.OpenBraceToken:
                        return Tristate.True;
                    default:
                        return Tristate.False;
                }
            }
            // If encounter "([" or "({", this could be the start of a binding pattern.
            // Examples:
            //      ([ x ]) => { }
            //      ({ x }) => { }
            //      ([ x ])
            //      ({ x })
            if (second === ts.SyntaxKind.OpenBracketToken || second === ts.SyntaxKind.OpenBraceToken) {
                return Tristate.Unknown;
            }
            // Simple case: "(..."
            // This is an arrow function with a rest parameter.
            if (second === ts.SyntaxKind.DotDotDotToken) {
                return Tristate.True;
            }
            // Check for "(xxx yyy", where xxx is a modifier and yyy is an identifier. This
            // isn't actually allowed, but we want to treat it as a lambda so we can provide
            // a good error message.
            if (ts.isModifierKind(second) && second !== ts.SyntaxKind.AsyncKeyword && lookAhead(nextTokenIsIdentifier)) {
                return Tristate.True;
            }
            // If we had "(" followed by something that's not an identifier,
            // then this definitely doesn't look like a lambda.  "this" is not
            // valid, but we want to parse it and then give a semantic error.
            if (!isIdentifier() && second !== ts.SyntaxKind.ThisKeyword) {
                return Tristate.False;
            }
            switch (nextToken()) {
                case ts.SyntaxKind.ColonToken:
                    // If we have something like "(a:", then we must have a
                    // type-annotated parameter in an arrow function expression.
                    return Tristate.True;
                case ts.SyntaxKind.QuestionToken:
                    nextToken();
                    // If we have "(a?:" or "(a?," or "(a?=" or "(a?)" then it is definitely a lambda.
                    if (token() === ts.SyntaxKind.ColonToken || token() === ts.SyntaxKind.CommaToken || token() === ts.SyntaxKind.EqualsToken || token() === ts.SyntaxKind.CloseParenToken) {
                        return Tristate.True;
                    }
                    // Otherwise it is definitely not a lambda.
                    return Tristate.False;
                case ts.SyntaxKind.CommaToken:
                case ts.SyntaxKind.EqualsToken:
                case ts.SyntaxKind.CloseParenToken:
                    // If we have "(a," or "(a=" or "(a)" this *could* be an arrow function
                    return Tristate.Unknown;
            }
            // It is definitely not an arrow function
            return Tristate.False;
        }
        else {
            ts.Debug.assert(first === ts.SyntaxKind.LessThanToken);
            // If we have "<" not followed by an identifier,
            // then this definitely is not an arrow function.
            if (!isIdentifier()) {
                return Tristate.False;
            }
            // JSX overrides
            if (sourceFile.languageVariant === ts.LanguageVariant.JSX) {
                const isArrowFunctionInJsx = lookAhead(() => {
                    const third = nextToken();
                    if (third === ts.SyntaxKind.ExtendsKeyword) {
                        const fourth = nextToken();
                        switch (fourth) {
                            case ts.SyntaxKind.EqualsToken:
                            case ts.SyntaxKind.GreaterThanToken:
                                return false;
                            default:
                                return true;
                        }
                    }
                    else if (third === ts.SyntaxKind.CommaToken) {
                        return true;
                    }
                    return false;
                });
                if (isArrowFunctionInJsx) {
                    return Tristate.True;
                }
                return Tristate.False;
            }
            // This *could* be a parenthesized arrow function.
            return Tristate.Unknown;
        }
    }
    function parsePossibleParenthesizedArrowFunctionExpressionHead(): ts.ArrowFunction | undefined {
        const tokenPos = scanner.getTokenPos();
        if (notParenthesizedArrow && notParenthesizedArrow.has(tokenPos.toString())) {
            return undefined;
        }
        const result = parseParenthesizedArrowFunctionExpressionHead(/*allowAmbiguity*/ false);
        if (!result) {
            (notParenthesizedArrow || (notParenthesizedArrow = ts.createMap())).set(tokenPos.toString(), true);
        }
        return result;
    }
    function tryParseAsyncSimpleArrowFunctionExpression(): ts.ArrowFunction | undefined {
        // We do a check here so that we won't be doing unnecessarily call to "lookAhead"
        if (token() === ts.SyntaxKind.AsyncKeyword) {
            if (lookAhead(isUnParenthesizedAsyncArrowFunctionWorker) === Tristate.True) {
                const asyncModifier = parseModifiersForArrowFunction();
                const expr = parseBinaryExpressionOrHigher(/*precedence*/ 0);
                return parseSimpleArrowFunctionExpression((<ts.Identifier>expr), asyncModifier);
            }
        }
        return undefined;
    }
    function isUnParenthesizedAsyncArrowFunctionWorker(): Tristate {
        // AsyncArrowFunctionExpression:
        //      1) async[no LineTerminator here]AsyncArrowBindingIdentifier[?Yield][no LineTerminator here]=>AsyncConciseBody[?In]
        //      2) CoverCallExpressionAndAsyncArrowHead[?Yield, ?Await][no LineTerminator here]=>AsyncConciseBody[?In]
        if (token() === ts.SyntaxKind.AsyncKeyword) {
            nextToken();
            // If the "async" is followed by "=>" token then it is not a beginning of an async arrow-function
            // but instead a simple arrow-function which will be parsed inside "parseAssignmentExpressionOrHigher"
            if (scanner.hasPrecedingLineBreak() || token() === ts.SyntaxKind.EqualsGreaterThanToken) {
                return Tristate.False;
            }
            // Check for un-parenthesized AsyncArrowFunction
            const expr = parseBinaryExpressionOrHigher(/*precedence*/ 0);
            if (!scanner.hasPrecedingLineBreak() && expr.kind === ts.SyntaxKind.Identifier && token() === ts.SyntaxKind.EqualsGreaterThanToken) {
                return Tristate.True;
            }
        }
        return Tristate.False;
    }
    function parseParenthesizedArrowFunctionExpressionHead(allowAmbiguity: boolean): ts.ArrowFunction | undefined {
        const node = (<ts.ArrowFunction>createNodeWithJSDoc(ts.SyntaxKind.ArrowFunction));
        node.modifiers = parseModifiersForArrowFunction();
        const isAsync = ts.hasModifier(node, ts.ModifierFlags.Async) ? SignatureFlags.Await : SignatureFlags.None;
        // Arrow functions are never generators.
        //
        // If we're speculatively parsing a signature for a parenthesized arrow function, then
        // we have to have a complete parameter list.  Otherwise we might see something like
        // a => (b => c)
        // And think that "(b =>" was actually a parenthesized arrow function with a missing
        // close paren.
        if (!fillSignature(ts.SyntaxKind.ColonToken, isAsync, node) && !allowAmbiguity) {
            return undefined;
        }
        // Parsing a signature isn't enough.
        // Parenthesized arrow signatures often look like other valid expressions.
        // For instance:
        //  - "(x = 10)" is an assignment expression parsed as a signature with a default parameter value.
        //  - "(x,y)" is a comma expression parsed as a signature with two parameters.
        //  - "a ? (b): c" will have "(b):" parsed as a signature with a return type annotation.
        //  - "a ? (b): function() {}" will too, since function() is a valid JSDoc function type.
        //
        // So we need just a bit of lookahead to ensure that it can only be a signature.
        const hasJSDocFunctionType = node.type && ts.isJSDocFunctionType(node.type);
        if (!allowAmbiguity && token() !== ts.SyntaxKind.EqualsGreaterThanToken && (hasJSDocFunctionType || token() !== ts.SyntaxKind.OpenBraceToken)) {
            // Returning undefined here will cause our caller to rewind to where we started from.
            return undefined;
        }
        return node;
    }
    function parseArrowFunctionExpressionBody(isAsync: boolean): ts.Block | ts.Expression {
        if (token() === ts.SyntaxKind.OpenBraceToken) {
            return parseFunctionBlock(isAsync ? SignatureFlags.Await : SignatureFlags.None);
        }
        if (token() !== ts.SyntaxKind.SemicolonToken &&
            token() !== ts.SyntaxKind.FunctionKeyword &&
            token() !== ts.SyntaxKind.ClassKeyword &&
            isStartOfStatement() &&
            !isStartOfExpressionStatement()) {
            // Check if we got a plain statement (i.e. no expression-statements, no function/class expressions/declarations)
            //
            // Here we try to recover from a potential error situation in the case where the
            // user meant to supply a block. For example, if the user wrote:
            //
            //  a =>
            //      let v = 0;
            //  }
            //
            // they may be missing an open brace.  Check to see if that's the case so we can
            // try to recover better.  If we don't do this, then the next close curly we see may end
            // up preemptively closing the containing construct.
            //
            // Note: even when 'IgnoreMissingOpenBrace' is passed, parseBody will still error.
            return parseFunctionBlock(SignatureFlags.IgnoreMissingOpenBrace | (isAsync ? SignatureFlags.Await : SignatureFlags.None));
        }
        return isAsync
            ? doInAwaitContext(parseAssignmentExpressionOrHigher)
            : doOutsideOfAwaitContext(parseAssignmentExpressionOrHigher);
    }
    function parseConditionalExpressionRest(leftOperand: ts.Expression): ts.Expression {
        // Note: we are passed in an expression which was produced from parseBinaryExpressionOrHigher.
        const questionToken = parseOptionalToken(ts.SyntaxKind.QuestionToken);
        if (!questionToken) {
            return leftOperand;
        }
        // Note: we explicitly 'allowIn' in the whenTrue part of the condition expression, and
        // we do not that for the 'whenFalse' part.
        const node = (<ts.ConditionalExpression>createNode(ts.SyntaxKind.ConditionalExpression, leftOperand.pos));
        node.condition = leftOperand;
        node.questionToken = questionToken;
        node.whenTrue = doOutsideOfContext(disallowInAndDecoratorContext, parseAssignmentExpressionOrHigher);
        node.colonToken = parseExpectedToken(ts.SyntaxKind.ColonToken);
        node.whenFalse = ts.nodeIsPresent(node.colonToken)
            ? parseAssignmentExpressionOrHigher()
            : createMissingNode(ts.SyntaxKind.Identifier, /*reportAtCurrentPosition*/ false, ts.Diagnostics._0_expected, ts.tokenToString(ts.SyntaxKind.ColonToken));
        return finishNode(node);
    }
    function parseBinaryExpressionOrHigher(precedence: number): ts.Expression {
        const leftOperand = parseUnaryExpressionOrHigher();
        return parseBinaryExpressionRest(precedence, leftOperand);
    }
    function isInOrOfKeyword(t: ts.SyntaxKind) {
        return t === ts.SyntaxKind.InKeyword || t === ts.SyntaxKind.OfKeyword;
    }
    function parseBinaryExpressionRest(precedence: number, leftOperand: ts.Expression): ts.Expression {
        while (true) {
            // We either have a binary operator here, or we're finished.  We call
            // reScanGreaterToken so that we merge token sequences like > and = into >=
            reScanGreaterToken();
            const newPrecedence = ts.getBinaryOperatorPrecedence(token());
            // Check the precedence to see if we should "take" this operator
            // - For left associative operator (all operator but **), consume the operator,
            //   recursively call the function below, and parse binaryExpression as a rightOperand
            //   of the caller if the new precedence of the operator is greater then or equal to the current precedence.
            //   For example:
            //      a - b - c;
            //            ^token; leftOperand = b. Return b to the caller as a rightOperand
            //      a * b - c
            //            ^token; leftOperand = b. Return b to the caller as a rightOperand
            //      a - b * c;
            //            ^token; leftOperand = b. Return b * c to the caller as a rightOperand
            // - For right associative operator (**), consume the operator, recursively call the function
            //   and parse binaryExpression as a rightOperand of the caller if the new precedence of
            //   the operator is strictly grater than the current precedence
            //   For example:
            //      a ** b ** c;
            //             ^^token; leftOperand = b. Return b ** c to the caller as a rightOperand
            //      a - b ** c;
            //            ^^token; leftOperand = b. Return b ** c to the caller as a rightOperand
            //      a ** b - c
            //             ^token; leftOperand = b. Return b to the caller as a rightOperand
            const consumeCurrentOperator = token() === ts.SyntaxKind.AsteriskAsteriskToken ?
                newPrecedence >= precedence :
                newPrecedence > precedence;
            if (!consumeCurrentOperator) {
                break;
            }
            if (token() === ts.SyntaxKind.InKeyword && inDisallowInContext()) {
                break;
            }
            if (token() === ts.SyntaxKind.AsKeyword) {
                // Make sure we *do* perform ASI for constructs like this:
                //    var x = foo
                //    as (Bar)
                // This should be parsed as an initialized variable, followed
                // by a function call to 'as' with the argument 'Bar'
                if (scanner.hasPrecedingLineBreak()) {
                    break;
                }
                else {
                    nextToken();
                    leftOperand = makeAsExpression(leftOperand, parseType());
                }
            }
            else {
                leftOperand = makeBinaryExpression(leftOperand, parseTokenNode(), parseBinaryExpressionOrHigher(newPrecedence));
            }
        }
        return leftOperand;
    }
    function isBinaryOperator() {
        if (inDisallowInContext() && token() === ts.SyntaxKind.InKeyword) {
            return false;
        }
        return ts.getBinaryOperatorPrecedence(token()) > 0;
    }
    function makeBinaryExpression(left: ts.Expression, operatorToken: ts.BinaryOperatorToken, right: ts.Expression): ts.BinaryExpression {
        const node = (<ts.BinaryExpression>createNode(ts.SyntaxKind.BinaryExpression, left.pos));
        node.left = left;
        node.operatorToken = operatorToken;
        node.right = right;
        return finishNode(node);
    }
    function makeAsExpression(left: ts.Expression, right: ts.TypeNode): ts.AsExpression {
        const node = (<ts.AsExpression>createNode(ts.SyntaxKind.AsExpression, left.pos));
        node.expression = left;
        node.type = right;
        return finishNode(node);
    }
    function parsePrefixUnaryExpression() {
        const node = (<ts.PrefixUnaryExpression>createNode(ts.SyntaxKind.PrefixUnaryExpression));
        node.operator = (<ts.PrefixUnaryOperator>token());
        nextToken();
        node.operand = parseSimpleUnaryExpression();
        return finishNode(node);
    }
    function parseDeleteExpression() {
        const node = (<ts.DeleteExpression>createNode(ts.SyntaxKind.DeleteExpression));
        nextToken();
        node.expression = parseSimpleUnaryExpression();
        return finishNode(node);
    }
    function parseTypeOfExpression() {
        const node = (<ts.TypeOfExpression>createNode(ts.SyntaxKind.TypeOfExpression));
        nextToken();
        node.expression = parseSimpleUnaryExpression();
        return finishNode(node);
    }
    function parseVoidExpression() {
        const node = (<ts.VoidExpression>createNode(ts.SyntaxKind.VoidExpression));
        nextToken();
        node.expression = parseSimpleUnaryExpression();
        return finishNode(node);
    }
    function isAwaitExpression(): boolean {
        if (token() === ts.SyntaxKind.AwaitKeyword) {
            if (inAwaitContext()) {
                return true;
            }
            // here we are using similar heuristics as 'isYieldExpression'
            return lookAhead(nextTokenIsIdentifierOrKeywordOrLiteralOnSameLine);
        }
        return false;
    }
    function parseAwaitExpression() {
        const node = (<ts.AwaitExpression>createNode(ts.SyntaxKind.AwaitExpression));
        nextToken();
        node.expression = parseSimpleUnaryExpression();
        return finishNode(node);
    }
    /**
     * Parse ES7 exponential expression and await expression
     *
     * ES7 ExponentiationExpression:
     *      1) UnaryExpression[?Yield]
     *      2) UpdateExpression[?Yield] ** ExponentiationExpression[?Yield]
     *
     */
    function parseUnaryExpressionOrHigher(): ts.UnaryExpression | ts.BinaryExpression {
        /**
         * ES7 UpdateExpression:
         *      1) LeftHandSideExpression[?Yield]
         *      2) LeftHandSideExpression[?Yield][no LineTerminator here]++
         *      3) LeftHandSideExpression[?Yield][no LineTerminator here]--
         *      4) ++UnaryExpression[?Yield]
         *      5) --UnaryExpression[?Yield]
         */
        if (isUpdateExpression()) {
            const updateExpression = parseUpdateExpression();
            return token() === ts.SyntaxKind.AsteriskAsteriskToken ?
                <ts.BinaryExpression>parseBinaryExpressionRest(ts.getBinaryOperatorPrecedence(token()), updateExpression) :
                updateExpression;
        }
        /**
         * ES7 UnaryExpression:
         *      1) UpdateExpression[?yield]
         *      2) delete UpdateExpression[?yield]
         *      3) void UpdateExpression[?yield]
         *      4) typeof UpdateExpression[?yield]
         *      5) + UpdateExpression[?yield]
         *      6) - UpdateExpression[?yield]
         *      7) ~ UpdateExpression[?yield]
         *      8) ! UpdateExpression[?yield]
         */
        const unaryOperator = token();
        const simpleUnaryExpression = parseSimpleUnaryExpression();
        if (token() === ts.SyntaxKind.AsteriskAsteriskToken) {
            const pos = ts.skipTrivia(sourceText, simpleUnaryExpression.pos);
            const { end } = simpleUnaryExpression;
            if (simpleUnaryExpression.kind === ts.SyntaxKind.TypeAssertionExpression) {
                parseErrorAt(pos, end, ts.Diagnostics.A_type_assertion_expression_is_not_allowed_in_the_left_hand_side_of_an_exponentiation_expression_Consider_enclosing_the_expression_in_parentheses);
            }
            else {
                parseErrorAt(pos, end, ts.Diagnostics.An_unary_expression_with_the_0_operator_is_not_allowed_in_the_left_hand_side_of_an_exponentiation_expression_Consider_enclosing_the_expression_in_parentheses, ts.tokenToString(unaryOperator));
            }
        }
        return simpleUnaryExpression;
    }
    /**
     * Parse ES7 simple-unary expression or higher:
     *
     * ES7 UnaryExpression:
     *      1) UpdateExpression[?yield]
     *      2) delete UnaryExpression[?yield]
     *      3) void UnaryExpression[?yield]
     *      4) typeof UnaryExpression[?yield]
     *      5) + UnaryExpression[?yield]
     *      6) - UnaryExpression[?yield]
     *      7) ~ UnaryExpression[?yield]
     *      8) ! UnaryExpression[?yield]
     *      9) [+Await] await UnaryExpression[?yield]
     */
    function parseSimpleUnaryExpression(): ts.UnaryExpression {
        switch (token()) {
            case ts.SyntaxKind.PlusToken:
            case ts.SyntaxKind.MinusToken:
            case ts.SyntaxKind.TildeToken:
            case ts.SyntaxKind.ExclamationToken:
                return parsePrefixUnaryExpression();
            case ts.SyntaxKind.DeleteKeyword:
                return parseDeleteExpression();
            case ts.SyntaxKind.TypeOfKeyword:
                return parseTypeOfExpression();
            case ts.SyntaxKind.VoidKeyword:
                return parseVoidExpression();
            case ts.SyntaxKind.LessThanToken:
                // This is modified UnaryExpression grammar in TypeScript
                //  UnaryExpression (modified):
                //      < type > UnaryExpression
                return parseTypeAssertion();
            case ts.SyntaxKind.AwaitKeyword:
                if (isAwaitExpression()) {
                    return parseAwaitExpression();
                }
            // falls through
            default:
                return parseUpdateExpression();
        }
    }
    /**
     * Check if the current token can possibly be an ES7 increment expression.
     *
     * ES7 UpdateExpression:
     *      LeftHandSideExpression[?Yield]
     *      LeftHandSideExpression[?Yield][no LineTerminator here]++
     *      LeftHandSideExpression[?Yield][no LineTerminator here]--
     *      ++LeftHandSideExpression[?Yield]
     *      --LeftHandSideExpression[?Yield]
     */
    function isUpdateExpression(): boolean {
        // This function is called inside parseUnaryExpression to decide
        // whether to call parseSimpleUnaryExpression or call parseUpdateExpression directly
        switch (token()) {
            case ts.SyntaxKind.PlusToken:
            case ts.SyntaxKind.MinusToken:
            case ts.SyntaxKind.TildeToken:
            case ts.SyntaxKind.ExclamationToken:
            case ts.SyntaxKind.DeleteKeyword:
            case ts.SyntaxKind.TypeOfKeyword:
            case ts.SyntaxKind.VoidKeyword:
            case ts.SyntaxKind.AwaitKeyword:
                return false;
            case ts.SyntaxKind.LessThanToken:
                // If we are not in JSX context, we are parsing TypeAssertion which is an UnaryExpression
                if (sourceFile.languageVariant !== ts.LanguageVariant.JSX) {
                    return false;
                }
            // We are in JSX context and the token is part of JSXElement.
            // falls through
            default:
                return true;
        }
    }
    /**
     * Parse ES7 UpdateExpression. UpdateExpression is used instead of ES6's PostFixExpression.
     *
     * ES7 UpdateExpression[yield]:
     *      1) LeftHandSideExpression[?yield]
     *      2) LeftHandSideExpression[?yield] [[no LineTerminator here]]++
     *      3) LeftHandSideExpression[?yield] [[no LineTerminator here]]--
     *      4) ++LeftHandSideExpression[?yield]
     *      5) --LeftHandSideExpression[?yield]
     * In TypeScript (2), (3) are parsed as PostfixUnaryExpression. (4), (5) are parsed as PrefixUnaryExpression
     */
    function parseUpdateExpression(): ts.UpdateExpression {
        if (token() === ts.SyntaxKind.PlusPlusToken || token() === ts.SyntaxKind.MinusMinusToken) {
            const node = (<ts.PrefixUnaryExpression>createNode(ts.SyntaxKind.PrefixUnaryExpression));
            node.operator = (<ts.PrefixUnaryOperator>token());
            nextToken();
            node.operand = parseLeftHandSideExpressionOrHigher();
            return finishNode(node);
        }
        else if (sourceFile.languageVariant === ts.LanguageVariant.JSX && token() === ts.SyntaxKind.LessThanToken && lookAhead(nextTokenIsIdentifierOrKeywordOrGreaterThan)) {
            // JSXElement is part of primaryExpression
            return parseJsxElementOrSelfClosingElementOrFragment(/*inExpressionContext*/ true);
        }
        const expression = parseLeftHandSideExpressionOrHigher();
        ts.Debug.assert(ts.isLeftHandSideExpression(expression));
        if ((token() === ts.SyntaxKind.PlusPlusToken || token() === ts.SyntaxKind.MinusMinusToken) && !scanner.hasPrecedingLineBreak()) {
            const node = (<ts.PostfixUnaryExpression>createNode(ts.SyntaxKind.PostfixUnaryExpression, expression.pos));
            node.operand = expression;
            node.operator = (<ts.PostfixUnaryOperator>token());
            nextToken();
            return finishNode(node);
        }
        return expression;
    }
    function parseLeftHandSideExpressionOrHigher(): ts.LeftHandSideExpression {
        // Original Ecma:
        // LeftHandSideExpression: See 11.2
        //      NewExpression
        //      CallExpression
        //
        // Our simplification:
        //
        // LeftHandSideExpression: See 11.2
        //      MemberExpression
        //      CallExpression
        //
        // See comment in parseMemberExpressionOrHigher on how we replaced NewExpression with
        // MemberExpression to make our lives easier.
        //
        // to best understand the below code, it's important to see how CallExpression expands
        // out into its own productions:
        //
        // CallExpression:
        //      MemberExpression Arguments
        //      CallExpression Arguments
        //      CallExpression[Expression]
        //      CallExpression.IdentifierName
        //      import (AssignmentExpression)
        //      super Arguments
        //      super.IdentifierName
        //
        // Because of the recursion in these calls, we need to bottom out first. There are three
        // bottom out states we can run into: 1) We see 'super' which must start either of
        // the last two CallExpression productions. 2) We see 'import' which must start import call.
        // 3)we have a MemberExpression which either completes the LeftHandSideExpression,
        // or starts the beginning of the first four CallExpression productions.
        let expression: ts.MemberExpression;
        if (token() === ts.SyntaxKind.ImportKeyword) {
            if (lookAhead(nextTokenIsOpenParenOrLessThan)) {
                // We don't want to eagerly consume all import keyword as import call expression so we look ahead to find "("
                // For example:
                //      var foo3 = require("subfolder
                //      import * as foo1 from "module-from-node
                // We want this import to be a statement rather than import call expression
                sourceFile.flags |= ts.NodeFlags.PossiblyContainsDynamicImport;
                expression = parseTokenNode<ts.PrimaryExpression>();
            }
            else if (lookAhead(nextTokenIsDot)) {
                // This is an 'import.*' metaproperty (i.e. 'import.meta')
                const fullStart = scanner.getStartPos();
                nextToken(); // advance past the 'import'
                nextToken(); // advance past the dot
                const node = (createNode(ts.SyntaxKind.MetaProperty, fullStart) as ts.MetaProperty);
                node.keywordToken = ts.SyntaxKind.ImportKeyword;
                node.name = parseIdentifierName();
                expression = finishNode(node);
                sourceFile.flags |= ts.NodeFlags.PossiblyContainsImportMeta;
            }
            else {
                expression = parseMemberExpressionOrHigher();
            }
        }
        else {
            expression = token() === ts.SyntaxKind.SuperKeyword ? parseSuperExpression() : parseMemberExpressionOrHigher();
        }
        // Now, we *may* be complete.  However, we might have consumed the start of a
        // CallExpression or OptionalExpression.  As such, we need to consume the rest
        // of it here to be complete.
        return parseCallExpressionRest(expression);
    }
    function parseMemberExpressionOrHigher(): ts.MemberExpression {
        // Note: to make our lives simpler, we decompose the NewExpression productions and
        // place ObjectCreationExpression and FunctionExpression into PrimaryExpression.
        // like so:
        //
        //   PrimaryExpression : See 11.1
        //      this
        //      Identifier
        //      Literal
        //      ArrayLiteral
        //      ObjectLiteral
        //      (Expression)
        //      FunctionExpression
        //      new MemberExpression Arguments?
        //
        //   MemberExpression : See 11.2
        //      PrimaryExpression
        //      MemberExpression[Expression]
        //      MemberExpression.IdentifierName
        //
        //   CallExpression : See 11.2
        //      MemberExpression
        //      CallExpression Arguments
        //      CallExpression[Expression]
        //      CallExpression.IdentifierName
        //
        // Technically this is ambiguous.  i.e. CallExpression defines:
        //
        //   CallExpression:
        //      CallExpression Arguments
        //
        // If you see: "new Foo()"
        //
        // Then that could be treated as a single ObjectCreationExpression, or it could be
        // treated as the invocation of "new Foo".  We disambiguate that in code (to match
        // the original grammar) by making sure that if we see an ObjectCreationExpression
        // we always consume arguments if they are there. So we treat "new Foo()" as an
        // object creation only, and not at all as an invocation.  Another way to think
        // about this is that for every "new" that we see, we will consume an argument list if
        // it is there as part of the *associated* object creation node.  Any additional
        // argument lists we see, will become invocation expressions.
        //
        // Because there are no other places in the grammar now that refer to FunctionExpression
        // or ObjectCreationExpression, it is safe to push down into the PrimaryExpression
        // production.
        //
        // Because CallExpression and MemberExpression are left recursive, we need to bottom out
        // of the recursion immediately.  So we parse out a primary expression to start with.
        const expression = parsePrimaryExpression();
        return parseMemberExpressionRest(expression, /*allowOptionalChain*/ true);
    }
    function parseSuperExpression(): ts.MemberExpression {
        const expression = parseTokenNode<ts.PrimaryExpression>();
        if (token() === ts.SyntaxKind.LessThanToken) {
            const startPos = getNodePos();
            const typeArguments = tryParse(parseTypeArgumentsInExpression);
            if (typeArguments !== undefined) {
                parseErrorAt(startPos, getNodePos(), ts.Diagnostics.super_may_not_use_type_arguments);
            }
        }
        if (token() === ts.SyntaxKind.OpenParenToken || token() === ts.SyntaxKind.DotToken || token() === ts.SyntaxKind.OpenBracketToken) {
            return expression;
        }
        // If we have seen "super" it must be followed by '(' or '.'.
        // If it wasn't then just try to parse out a '.' and report an error.
        const node = (<ts.PropertyAccessExpression>createNode(ts.SyntaxKind.PropertyAccessExpression, expression.pos));
        node.expression = expression;
        parseExpectedToken(ts.SyntaxKind.DotToken, ts.Diagnostics.super_must_be_followed_by_an_argument_list_or_member_access);
        node.name = parseRightSideOfDot(/*allowIdentifierNames*/ true);
        return finishNode(node);
    }
    function parseJsxElementOrSelfClosingElementOrFragment(inExpressionContext: boolean): ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment {
        const opening = parseJsxOpeningOrSelfClosingElementOrOpeningFragment(inExpressionContext);
        let result: ts.JsxElement | ts.JsxSelfClosingElement | ts.JsxFragment;
        if (opening.kind === ts.SyntaxKind.JsxOpeningElement) {
            const node = (<ts.JsxElement>createNode(ts.SyntaxKind.JsxElement, opening.pos));
            node.openingElement = opening;
            node.children = parseJsxChildren(node.openingElement);
            node.closingElement = parseJsxClosingElement(inExpressionContext);
            if (!tagNamesAreEquivalent(node.openingElement.tagName, node.closingElement.tagName)) {
                parseErrorAtRange(node.closingElement, ts.Diagnostics.Expected_corresponding_JSX_closing_tag_for_0, ts.getTextOfNodeFromSourceText(sourceText, node.openingElement.tagName));
            }
            result = finishNode(node);
        }
        else if (opening.kind === ts.SyntaxKind.JsxOpeningFragment) {
            const node = (<ts.JsxFragment>createNode(ts.SyntaxKind.JsxFragment, opening.pos));
            node.openingFragment = opening;
            node.children = parseJsxChildren(node.openingFragment);
            node.closingFragment = parseJsxClosingFragment(inExpressionContext);
            result = finishNode(node);
        }
        else {
            ts.Debug.assert(opening.kind === ts.SyntaxKind.JsxSelfClosingElement);
            // Nothing else to do for self-closing elements
            result = opening;
        }
        // If the user writes the invalid code '<div></div><div></div>' in an expression context (i.e. not wrapped in
        // an enclosing tag), we'll naively try to parse   ^ this as a 'less than' operator and the remainder of the tag
        // as garbage, which will cause the formatter to badly mangle the JSX. Perform a speculative parse of a JSX
        // element if we see a < token so that we can wrap it in a synthetic binary expression so the formatter
        // does less damage and we can report a better error.
        // Since JSX elements are invalid < operands anyway, this lookahead parse will only occur in error scenarios
        // of one sort or another.
        if (inExpressionContext && token() === ts.SyntaxKind.LessThanToken) {
            const invalidElement = tryParse(() => parseJsxElementOrSelfClosingElementOrFragment(/*inExpressionContext*/ true));
            if (invalidElement) {
                parseErrorAtCurrentToken(ts.Diagnostics.JSX_expressions_must_have_one_parent_element);
                const badNode = (<ts.BinaryExpression>createNode(ts.SyntaxKind.BinaryExpression, result.pos));
                badNode.end = invalidElement.end;
                badNode.left = result;
                badNode.right = invalidElement;
                badNode.operatorToken = createMissingNode(ts.SyntaxKind.CommaToken, /*reportAtCurrentPosition*/ false);
                badNode.operatorToken.pos = badNode.operatorToken.end = badNode.right.pos;
                return <ts.JsxElement><ts.Node>badNode;
            }
        }
        return result;
    }
    function parseJsxText(): ts.JsxText {
        const node = (<ts.JsxText>createNode(ts.SyntaxKind.JsxText));
        node.text = scanner.getTokenValue();
        node.containsOnlyTriviaWhiteSpaces = currentToken === ts.SyntaxKind.JsxTextAllWhiteSpaces;
        currentToken = scanner.scanJsxToken();
        return finishNode(node);
    }
    function parseJsxChild(openingTag: ts.JsxOpeningElement | ts.JsxOpeningFragment, token: ts.JsxTokenSyntaxKind): ts.JsxChild | undefined {
        switch (token) {
            case ts.SyntaxKind.EndOfFileToken:
                // If we hit EOF, issue the error at the tag that lacks the closing element
                // rather than at the end of the file (which is useless)
                if (ts.isJsxOpeningFragment(openingTag)) {
                    parseErrorAtRange(openingTag, ts.Diagnostics.JSX_fragment_has_no_corresponding_closing_tag);
                }
                else {
                    parseErrorAtRange(openingTag.tagName, ts.Diagnostics.JSX_element_0_has_no_corresponding_closing_tag, ts.getTextOfNodeFromSourceText(sourceText, openingTag.tagName));
                }
                return undefined;
            case ts.SyntaxKind.LessThanSlashToken:
            case ts.SyntaxKind.ConflictMarkerTrivia:
                return undefined;
            case ts.SyntaxKind.JsxText:
            case ts.SyntaxKind.JsxTextAllWhiteSpaces:
                return parseJsxText();
            case ts.SyntaxKind.OpenBraceToken:
                return parseJsxExpression(/*inExpressionContext*/ false);
            case ts.SyntaxKind.LessThanToken:
                return parseJsxElementOrSelfClosingElementOrFragment(/*inExpressionContext*/ false);
            default:
                return ts.Debug.assertNever(token);
        }
    }
    function parseJsxChildren(openingTag: ts.JsxOpeningElement | ts.JsxOpeningFragment): ts.NodeArray<ts.JsxChild> {
        const list = [];
        const listPos = getNodePos();
        const saveParsingContext = parsingContext;
        parsingContext |= 1 << ParsingContext.JsxChildren;
        while (true) {
            const child = parseJsxChild(openingTag, currentToken = scanner.reScanJsxToken());
            if (!child)
                break;
            list.push(child);
        }
        parsingContext = saveParsingContext;
        return createNodeArray(list, listPos);
    }
    function parseJsxAttributes(): ts.JsxAttributes {
        const jsxAttributes = (<ts.JsxAttributes>createNode(ts.SyntaxKind.JsxAttributes));
        jsxAttributes.properties = parseList(ParsingContext.JsxAttributes, parseJsxAttribute);
        return finishNode(jsxAttributes);
    }
    function parseJsxOpeningOrSelfClosingElementOrOpeningFragment(inExpressionContext: boolean): ts.JsxOpeningElement | ts.JsxSelfClosingElement | ts.JsxOpeningFragment {
        const fullStart = scanner.getStartPos();
        parseExpected(ts.SyntaxKind.LessThanToken);
        if (token() === ts.SyntaxKind.GreaterThanToken) {
            // See below for explanation of scanJsxText
            const node: ts.JsxOpeningFragment = (<ts.JsxOpeningFragment>createNode(ts.SyntaxKind.JsxOpeningFragment, fullStart));
            scanJsxText();
            return finishNode(node);
        }
        const tagName = parseJsxElementName();
        const typeArguments = tryParseTypeArguments();
        const attributes = parseJsxAttributes();
        let node: ts.JsxOpeningLikeElement;
        if (token() === ts.SyntaxKind.GreaterThanToken) {
            // Closing tag, so scan the immediately-following text with the JSX scanning instead
            // of regular scanning to avoid treating illegal characters (e.g. '#') as immediate
            // scanning errors
            node = (<ts.JsxOpeningElement>createNode(ts.SyntaxKind.JsxOpeningElement, fullStart));
            scanJsxText();
        }
        else {
            parseExpected(ts.SyntaxKind.SlashToken);
            if (inExpressionContext) {
                parseExpected(ts.SyntaxKind.GreaterThanToken);
            }
            else {
                parseExpected(ts.SyntaxKind.GreaterThanToken, /*diagnostic*/ undefined, /*shouldAdvance*/ false);
                scanJsxText();
            }
            node = (<ts.JsxSelfClosingElement>createNode(ts.SyntaxKind.JsxSelfClosingElement, fullStart));
        }
        node.tagName = tagName;
        node.typeArguments = typeArguments;
        node.attributes = attributes;
        return finishNode(node);
    }
    function parseJsxElementName(): ts.JsxTagNameExpression {
        scanJsxIdentifier();
        // JsxElement can have name in the form of
        //      propertyAccessExpression
        //      primaryExpression in the form of an identifier and "this" keyword
        // We can't just simply use parseLeftHandSideExpressionOrHigher because then we will start consider class,function etc as a keyword
        // We only want to consider "this" as a primaryExpression
        let expression: ts.JsxTagNameExpression = token() === ts.SyntaxKind.ThisKeyword ?
            parseTokenNode<ts.ThisExpression>() : parseIdentifierName();
        while (parseOptional(ts.SyntaxKind.DotToken)) {
            const propertyAccess: ts.JsxTagNamePropertyAccess = (<ts.JsxTagNamePropertyAccess>createNode(ts.SyntaxKind.PropertyAccessExpression, expression.pos));
            propertyAccess.expression = expression;
            propertyAccess.name = parseRightSideOfDot(/*allowIdentifierNames*/ true);
            expression = finishNode(propertyAccess);
        }
        return expression;
    }
    function parseJsxExpression(inExpressionContext: boolean): ts.JsxExpression | undefined {
        const node = (<ts.JsxExpression>createNode(ts.SyntaxKind.JsxExpression));
        if (!parseExpected(ts.SyntaxKind.OpenBraceToken)) {
            return undefined;
        }
        if (token() !== ts.SyntaxKind.CloseBraceToken) {
            node.dotDotDotToken = parseOptionalToken(ts.SyntaxKind.DotDotDotToken);
            // Only an AssignmentExpression is valid here per the JSX spec,
            // but we can unambiguously parse a comma sequence and provide
            // a better error message in grammar checking.
            node.expression = parseExpression();
        }
        if (inExpressionContext) {
            parseExpected(ts.SyntaxKind.CloseBraceToken);
        }
        else {
            if (parseExpected(ts.SyntaxKind.CloseBraceToken, /*message*/ undefined, /*shouldAdvance*/ false)) {
                scanJsxText();
            }
        }
        return finishNode(node);
    }
    function parseJsxAttribute(): ts.JsxAttribute | ts.JsxSpreadAttribute {
        if (token() === ts.SyntaxKind.OpenBraceToken) {
            return parseJsxSpreadAttribute();
        }
        scanJsxIdentifier();
        const node = (<ts.JsxAttribute>createNode(ts.SyntaxKind.JsxAttribute));
        node.name = parseIdentifierName();
        if (token() === ts.SyntaxKind.EqualsToken) {
            switch (scanJsxAttributeValue()) {
                case ts.SyntaxKind.StringLiteral:
                    node.initializer = (<ts.StringLiteral>parseLiteralNode());
                    break;
                default:
                    node.initializer = parseJsxExpression(/*inExpressionContext*/ true);
                    break;
            }
        }
        return finishNode(node);
    }
    function parseJsxSpreadAttribute(): ts.JsxSpreadAttribute {
        const node = (<ts.JsxSpreadAttribute>createNode(ts.SyntaxKind.JsxSpreadAttribute));
        parseExpected(ts.SyntaxKind.OpenBraceToken);
        parseExpected(ts.SyntaxKind.DotDotDotToken);
        node.expression = parseExpression();
        parseExpected(ts.SyntaxKind.CloseBraceToken);
        return finishNode(node);
    }
    function parseJsxClosingElement(inExpressionContext: boolean): ts.JsxClosingElement {
        const node = (<ts.JsxClosingElement>createNode(ts.SyntaxKind.JsxClosingElement));
        parseExpected(ts.SyntaxKind.LessThanSlashToken);
        node.tagName = parseJsxElementName();
        if (inExpressionContext) {
            parseExpected(ts.SyntaxKind.GreaterThanToken);
        }
        else {
            parseExpected(ts.SyntaxKind.GreaterThanToken, /*diagnostic*/ undefined, /*shouldAdvance*/ false);
            scanJsxText();
        }
        return finishNode(node);
    }
    function parseJsxClosingFragment(inExpressionContext: boolean): ts.JsxClosingFragment {
        const node = (<ts.JsxClosingFragment>createNode(ts.SyntaxKind.JsxClosingFragment));
        parseExpected(ts.SyntaxKind.LessThanSlashToken);
        if (ts.tokenIsIdentifierOrKeyword(token())) {
            parseErrorAtRange(parseJsxElementName(), ts.Diagnostics.Expected_corresponding_closing_tag_for_JSX_fragment);
        }
        if (inExpressionContext) {
            parseExpected(ts.SyntaxKind.GreaterThanToken);
        }
        else {
            parseExpected(ts.SyntaxKind.GreaterThanToken, /*diagnostic*/ undefined, /*shouldAdvance*/ false);
            scanJsxText();
        }
        return finishNode(node);
    }
    function parseTypeAssertion(): ts.TypeAssertion {
        const node = (<ts.TypeAssertion>createNode(ts.SyntaxKind.TypeAssertionExpression));
        parseExpected(ts.SyntaxKind.LessThanToken);
        node.type = parseType();
        parseExpected(ts.SyntaxKind.GreaterThanToken);
        node.expression = parseSimpleUnaryExpression();
        return finishNode(node);
    }
    function nextTokenIsIdentifierOrKeywordOrOpenBracketOrTemplate() {
        nextToken();
        return ts.tokenIsIdentifierOrKeyword(token())
            || token() === ts.SyntaxKind.OpenBracketToken
            || isTemplateStartOfTaggedTemplate();
    }
    function isStartOfOptionalPropertyOrElementAccessChain() {
        return token() === ts.SyntaxKind.QuestionDotToken
            && lookAhead(nextTokenIsIdentifierOrKeywordOrOpenBracketOrTemplate);
    }
    function parsePropertyAccessExpressionRest(expression: ts.LeftHandSideExpression, questionDotToken: ts.QuestionDotToken | undefined) {
        const propertyAccess = (<ts.PropertyAccessExpression>createNode(ts.SyntaxKind.PropertyAccessExpression, expression.pos));
        propertyAccess.expression = expression;
        propertyAccess.questionDotToken = questionDotToken;
        propertyAccess.name = parseRightSideOfDot(/*allowIdentifierNames*/ true);
        if (questionDotToken || expression.flags & ts.NodeFlags.OptionalChain) {
            propertyAccess.flags |= ts.NodeFlags.OptionalChain;
        }
        return finishNode(propertyAccess);
    }
    function parseElementAccessExpressionRest(expression: ts.LeftHandSideExpression, questionDotToken: ts.QuestionDotToken | undefined) {
        const indexedAccess = (<ts.ElementAccessExpression>createNode(ts.SyntaxKind.ElementAccessExpression, expression.pos));
        indexedAccess.expression = expression;
        indexedAccess.questionDotToken = questionDotToken;
        if (token() === ts.SyntaxKind.CloseBracketToken) {
            indexedAccess.argumentExpression = createMissingNode(ts.SyntaxKind.Identifier, /*reportAtCurrentPosition*/ true, ts.Diagnostics.An_element_access_expression_should_take_an_argument);
        }
        else {
            const argument = allowInAnd(parseExpression);
            if (ts.isStringOrNumericLiteralLike(argument)) {
                argument.text = internIdentifier(argument.text);
            }
            indexedAccess.argumentExpression = argument;
        }
        parseExpected(ts.SyntaxKind.CloseBracketToken);
        if (questionDotToken || expression.flags & ts.NodeFlags.OptionalChain) {
            indexedAccess.flags |= ts.NodeFlags.OptionalChain;
        }
        return finishNode(indexedAccess);
    }
    function parseMemberExpressionRest(expression: ts.LeftHandSideExpression, allowOptionalChain: boolean): ts.MemberExpression {
        while (true) {
            let questionDotToken: ts.QuestionDotToken | undefined;
            let isPropertyAccess = false;
            if (allowOptionalChain && isStartOfOptionalPropertyOrElementAccessChain()) {
                questionDotToken = parseExpectedToken(ts.SyntaxKind.QuestionDotToken);
                isPropertyAccess = ts.tokenIsIdentifierOrKeyword(token());
            }
            else {
                isPropertyAccess = parseOptional(ts.SyntaxKind.DotToken);
            }
            if (isPropertyAccess) {
                expression = parsePropertyAccessExpressionRest(expression, questionDotToken);
                continue;
            }
            if (!questionDotToken && token() === ts.SyntaxKind.ExclamationToken && !scanner.hasPrecedingLineBreak()) {
                nextToken();
                const nonNullExpression = (<ts.NonNullExpression>createNode(ts.SyntaxKind.NonNullExpression, expression.pos));
                nonNullExpression.expression = expression;
                expression = finishNode(nonNullExpression);
                continue;
            }
            // when in the [Decorator] context, we do not parse ElementAccess as it could be part of a ComputedPropertyName
            if ((questionDotToken || !inDecoratorContext()) && parseOptional(ts.SyntaxKind.OpenBracketToken)) {
                expression = parseElementAccessExpressionRest(expression, questionDotToken);
                continue;
            }
            if (isTemplateStartOfTaggedTemplate()) {
                expression = parseTaggedTemplateRest(expression, questionDotToken, /*typeArguments*/ undefined);
                continue;
            }
            return <ts.MemberExpression>expression;
        }
    }
    function isTemplateStartOfTaggedTemplate() {
        return token() === ts.SyntaxKind.NoSubstitutionTemplateLiteral || token() === ts.SyntaxKind.TemplateHead;
    }
    function parseTaggedTemplateRest(tag: ts.LeftHandSideExpression, questionDotToken: ts.QuestionDotToken | undefined, typeArguments: ts.NodeArray<ts.TypeNode> | undefined) {
        const tagExpression = (<ts.TaggedTemplateExpression>createNode(ts.SyntaxKind.TaggedTemplateExpression, tag.pos));
        tagExpression.tag = tag;
        tagExpression.questionDotToken = questionDotToken;
        tagExpression.typeArguments = typeArguments;
        tagExpression.template = token() === ts.SyntaxKind.NoSubstitutionTemplateLiteral
            ? <ts.NoSubstitutionTemplateLiteral>parseLiteralNode()
            : parseTemplateExpression();
        if (questionDotToken || tag.flags & ts.NodeFlags.OptionalChain) {
            tagExpression.flags |= ts.NodeFlags.OptionalChain;
        }
        return finishNode(tagExpression);
    }
    function parseCallExpressionRest(expression: ts.LeftHandSideExpression): ts.LeftHandSideExpression {
        while (true) {
            expression = parseMemberExpressionRest(expression, /*allowOptionalChain*/ true);
            const questionDotToken = parseOptionalToken(ts.SyntaxKind.QuestionDotToken);
            // handle 'foo<<T>()'
            if (token() === ts.SyntaxKind.LessThanToken || token() === ts.SyntaxKind.LessThanLessThanToken) {
                // See if this is the start of a generic invocation.  If so, consume it and
                // keep checking for postfix expressions.  Otherwise, it's just a '<' that's
                // part of an arithmetic expression.  Break out so we consume it higher in the
                // stack.
                const typeArguments = tryParse(parseTypeArgumentsInExpression);
                if (typeArguments) {
                    if (isTemplateStartOfTaggedTemplate()) {
                        expression = parseTaggedTemplateRest(expression, questionDotToken, typeArguments);
                        continue;
                    }
                    const callExpr = (<ts.CallExpression>createNode(ts.SyntaxKind.CallExpression, expression.pos));
                    callExpr.expression = expression;
                    callExpr.questionDotToken = questionDotToken;
                    callExpr.typeArguments = typeArguments;
                    callExpr.arguments = parseArgumentList();
                    if (questionDotToken || expression.flags & ts.NodeFlags.OptionalChain) {
                        callExpr.flags |= ts.NodeFlags.OptionalChain;
                    }
                    expression = finishNode(callExpr);
                    continue;
                }
            }
            else if (token() === ts.SyntaxKind.OpenParenToken) {
                const callExpr = (<ts.CallExpression>createNode(ts.SyntaxKind.CallExpression, expression.pos));
                callExpr.expression = expression;
                callExpr.questionDotToken = questionDotToken;
                callExpr.arguments = parseArgumentList();
                if (questionDotToken || expression.flags & ts.NodeFlags.OptionalChain) {
                    callExpr.flags |= ts.NodeFlags.OptionalChain;
                }
                expression = finishNode(callExpr);
                continue;
            }
            if (questionDotToken) {
                // We failed to parse anything, so report a missing identifier here.
                const propertyAccess = (createNode(ts.SyntaxKind.PropertyAccessExpression, expression.pos) as ts.PropertyAccessExpression);
                propertyAccess.expression = expression;
                propertyAccess.questionDotToken = questionDotToken;
                propertyAccess.name = createMissingNode(ts.SyntaxKind.Identifier, /*reportAtCurrentPosition*/ false, ts.Diagnostics.Identifier_expected);
                propertyAccess.flags |= ts.NodeFlags.OptionalChain;
                expression = finishNode(propertyAccess);
            }
            break;
        }
        return expression;
    }
    function parseArgumentList() {
        parseExpected(ts.SyntaxKind.OpenParenToken);
        const result = parseDelimitedList(ParsingContext.ArgumentExpressions, parseArgumentExpression);
        parseExpected(ts.SyntaxKind.CloseParenToken);
        return result;
    }
    function parseTypeArgumentsInExpression() {
        if (reScanLessThanToken() !== ts.SyntaxKind.LessThanToken) {
            return undefined;
        }
        nextToken();
        const typeArguments = parseDelimitedList(ParsingContext.TypeArguments, parseType);
        if (!parseExpected(ts.SyntaxKind.GreaterThanToken)) {
            // If it doesn't have the closing `>` then it's definitely not an type argument list.
            return undefined;
        }
        // If we have a '<', then only parse this as a argument list if the type arguments
        // are complete and we have an open paren.  if we don't, rewind and return nothing.
        return typeArguments && canFollowTypeArgumentsInExpression()
            ? typeArguments
            : undefined;
    }
    function canFollowTypeArgumentsInExpression(): boolean {
        switch (token()) {
            case ts.SyntaxKind.OpenParenToken: // foo<x>(
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral: // foo<T> `...`
            case ts.SyntaxKind.TemplateHead: // foo<T> `...${100}...`
            // these are the only tokens can legally follow a type argument
            // list. So we definitely want to treat them as type arg lists.
            // falls through
            case ts.SyntaxKind.DotToken: // foo<x>.
            case ts.SyntaxKind.CloseParenToken: // foo<x>)
            case ts.SyntaxKind.CloseBracketToken: // foo<x>]
            case ts.SyntaxKind.ColonToken: // foo<x>:
            case ts.SyntaxKind.SemicolonToken: // foo<x>;
            case ts.SyntaxKind.QuestionToken: // foo<x>?
            case ts.SyntaxKind.EqualsEqualsToken: // foo<x> ==
            case ts.SyntaxKind.EqualsEqualsEqualsToken: // foo<x> ===
            case ts.SyntaxKind.ExclamationEqualsToken: // foo<x> !=
            case ts.SyntaxKind.ExclamationEqualsEqualsToken: // foo<x> !==
            case ts.SyntaxKind.AmpersandAmpersandToken: // foo<x> &&
            case ts.SyntaxKind.BarBarToken: // foo<x> ||
            case ts.SyntaxKind.QuestionQuestionToken: // foo<x> ??
            case ts.SyntaxKind.CaretToken: // foo<x> ^
            case ts.SyntaxKind.AmpersandToken: // foo<x> &
            case ts.SyntaxKind.BarToken: // foo<x> |
            case ts.SyntaxKind.CloseBraceToken: // foo<x> }
            case ts.SyntaxKind.EndOfFileToken: // foo<x>
                // these cases can't legally follow a type arg list.  However, they're not legal
                // expressions either.  The user is probably in the middle of a generic type. So
                // treat it as such.
                return true;
            case ts.SyntaxKind.CommaToken: // foo<x>,
            case ts.SyntaxKind.OpenBraceToken: // foo<x> {
            // We don't want to treat these as type arguments.  Otherwise we'll parse this
            // as an invocation expression.  Instead, we want to parse out the expression
            // in isolation from the type arguments.
            // falls through
            default:
                // Anything else treat as an expression.
                return false;
        }
    }
    function parsePrimaryExpression(): ts.PrimaryExpression {
        switch (token()) {
            case ts.SyntaxKind.NumericLiteral:
            case ts.SyntaxKind.BigIntLiteral:
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.NoSubstitutionTemplateLiteral:
                return parseLiteralNode();
            case ts.SyntaxKind.ThisKeyword:
            case ts.SyntaxKind.SuperKeyword:
            case ts.SyntaxKind.NullKeyword:
            case ts.SyntaxKind.TrueKeyword:
            case ts.SyntaxKind.FalseKeyword:
                return parseTokenNode<ts.PrimaryExpression>();
            case ts.SyntaxKind.OpenParenToken:
                return parseParenthesizedExpression();
            case ts.SyntaxKind.OpenBracketToken:
                return parseArrayLiteralExpression();
            case ts.SyntaxKind.OpenBraceToken:
                return parseObjectLiteralExpression();
            case ts.SyntaxKind.AsyncKeyword:
                // Async arrow functions are parsed earlier in parseAssignmentExpressionOrHigher.
                // If we encounter `async [no LineTerminator here] function` then this is an async
                // function; otherwise, its an identifier.
                if (!lookAhead(nextTokenIsFunctionKeywordOnSameLine)) {
                    break;
                }
                return parseFunctionExpression();
            case ts.SyntaxKind.ClassKeyword:
                return parseClassExpression();
            case ts.SyntaxKind.FunctionKeyword:
                return parseFunctionExpression();
            case ts.SyntaxKind.NewKeyword:
                return parseNewExpressionOrNewDotTarget();
            case ts.SyntaxKind.SlashToken:
            case ts.SyntaxKind.SlashEqualsToken:
                if (reScanSlashToken() === ts.SyntaxKind.RegularExpressionLiteral) {
                    return parseLiteralNode();
                }
                break;
            case ts.SyntaxKind.TemplateHead:
                return parseTemplateExpression();
        }
        return parseIdentifier(ts.Diagnostics.Expression_expected);
    }
    function parseParenthesizedExpression(): ts.ParenthesizedExpression {
        const node = (<ts.ParenthesizedExpression>createNodeWithJSDoc(ts.SyntaxKind.ParenthesizedExpression));
        parseExpected(ts.SyntaxKind.OpenParenToken);
        node.expression = allowInAnd(parseExpression);
        parseExpected(ts.SyntaxKind.CloseParenToken);
        return finishNode(node);
    }
    function parseSpreadElement(): ts.Expression {
        const node = (<ts.SpreadElement>createNode(ts.SyntaxKind.SpreadElement));
        parseExpected(ts.SyntaxKind.DotDotDotToken);
        node.expression = parseAssignmentExpressionOrHigher();
        return finishNode(node);
    }
    function parseArgumentOrArrayLiteralElement(): ts.Expression {
        return token() === ts.SyntaxKind.DotDotDotToken ? parseSpreadElement() :
            token() === ts.SyntaxKind.CommaToken ? <ts.Expression>createNode(ts.SyntaxKind.OmittedExpression) :
                parseAssignmentExpressionOrHigher();
    }
    function parseArgumentExpression(): ts.Expression {
        return doOutsideOfContext(disallowInAndDecoratorContext, parseArgumentOrArrayLiteralElement);
    }
    function parseArrayLiteralExpression(): ts.ArrayLiteralExpression {
        const node = (<ts.ArrayLiteralExpression>createNode(ts.SyntaxKind.ArrayLiteralExpression));
        parseExpected(ts.SyntaxKind.OpenBracketToken);
        if (scanner.hasPrecedingLineBreak()) {
            node.multiLine = true;
        }
        node.elements = parseDelimitedList(ParsingContext.ArrayLiteralMembers, parseArgumentOrArrayLiteralElement);
        parseExpected(ts.SyntaxKind.CloseBracketToken);
        return finishNode(node);
    }
    function parseObjectLiteralElement(): ts.ObjectLiteralElementLike {
        const node = (<ts.ObjectLiteralElementLike>createNodeWithJSDoc(ts.SyntaxKind.Unknown));
        if (parseOptionalToken(ts.SyntaxKind.DotDotDotToken)) {
            node.kind = ts.SyntaxKind.SpreadAssignment;
            (<ts.SpreadAssignment>node).expression = parseAssignmentExpressionOrHigher();
            return finishNode(node);
        }
        node.decorators = parseDecorators();
        node.modifiers = parseModifiers();
        if (parseContextualModifier(ts.SyntaxKind.GetKeyword)) {
            return parseAccessorDeclaration((<ts.AccessorDeclaration>node), ts.SyntaxKind.GetAccessor);
        }
        if (parseContextualModifier(ts.SyntaxKind.SetKeyword)) {
            return parseAccessorDeclaration((<ts.AccessorDeclaration>node), ts.SyntaxKind.SetAccessor);
        }
        const asteriskToken = parseOptionalToken(ts.SyntaxKind.AsteriskToken);
        const tokenIsIdentifier = isIdentifier();
        node.name = parsePropertyName();
        // Disallowing of optional property assignments and definite assignment assertion happens in the grammar checker.
        (<ts.MethodDeclaration>node).questionToken = parseOptionalToken(ts.SyntaxKind.QuestionToken);
        (<ts.MethodDeclaration>node).exclamationToken = parseOptionalToken(ts.SyntaxKind.ExclamationToken);
        if (asteriskToken || token() === ts.SyntaxKind.OpenParenToken || token() === ts.SyntaxKind.LessThanToken) {
            return parseMethodDeclaration((<ts.MethodDeclaration>node), asteriskToken);
        }
        // check if it is short-hand property assignment or normal property assignment
        // NOTE: if token is EqualsToken it is interpreted as CoverInitializedName production
        // CoverInitializedName[Yield] :
        //     IdentifierReference[?Yield] Initializer[In, ?Yield]
        // this is necessary because ObjectLiteral productions are also used to cover grammar for ObjectAssignmentPattern
        const isShorthandPropertyAssignment = tokenIsIdentifier && (token() !== ts.SyntaxKind.ColonToken);
        if (isShorthandPropertyAssignment) {
            node.kind = ts.SyntaxKind.ShorthandPropertyAssignment;
            const equalsToken = parseOptionalToken(ts.SyntaxKind.EqualsToken);
            if (equalsToken) {
                (<ts.ShorthandPropertyAssignment>node).equalsToken = equalsToken;
                (<ts.ShorthandPropertyAssignment>node).objectAssignmentInitializer = allowInAnd(parseAssignmentExpressionOrHigher);
            }
        }
        else {
            node.kind = ts.SyntaxKind.PropertyAssignment;
            parseExpected(ts.SyntaxKind.ColonToken);
            (<ts.PropertyAssignment>node).initializer = allowInAnd(parseAssignmentExpressionOrHigher);
        }
        return finishNode(node);
    }
    function parseObjectLiteralExpression(): ts.ObjectLiteralExpression {
        const node = (<ts.ObjectLiteralExpression>createNode(ts.SyntaxKind.ObjectLiteralExpression));
        parseExpected(ts.SyntaxKind.OpenBraceToken);
        if (scanner.hasPrecedingLineBreak()) {
            node.multiLine = true;
        }
        node.properties = parseDelimitedList(ParsingContext.ObjectLiteralMembers, parseObjectLiteralElement, /*considerSemicolonAsDelimiter*/ true);
        parseExpected(ts.SyntaxKind.CloseBraceToken);
        return finishNode(node);
    }
    function parseFunctionExpression(): ts.FunctionExpression {
        // GeneratorExpression:
        //      function* BindingIdentifier [Yield][opt](FormalParameters[Yield]){ GeneratorBody }
        //
        // FunctionExpression:
        //      function BindingIdentifier[opt](FormalParameters){ FunctionBody }
        const saveDecoratorContext = inDecoratorContext();
        if (saveDecoratorContext) {
            setDecoratorContext(/*val*/ false);
        }
        const node = (<ts.FunctionExpression>createNodeWithJSDoc(ts.SyntaxKind.FunctionExpression));
        node.modifiers = parseModifiers();
        parseExpected(ts.SyntaxKind.FunctionKeyword);
        node.asteriskToken = parseOptionalToken(ts.SyntaxKind.AsteriskToken);
        const isGenerator = node.asteriskToken ? SignatureFlags.Yield : SignatureFlags.None;
        const isAsync = ts.hasModifier(node, ts.ModifierFlags.Async) ? SignatureFlags.Await : SignatureFlags.None;
        node.name =
            isGenerator && isAsync ? doInYieldAndAwaitContext(parseOptionalIdentifier) :
                isGenerator ? doInYieldContext(parseOptionalIdentifier) :
                    isAsync ? doInAwaitContext(parseOptionalIdentifier) :
                        parseOptionalIdentifier();
        fillSignature(ts.SyntaxKind.ColonToken, isGenerator | isAsync, node);
        node.body = parseFunctionBlock(isGenerator | isAsync);
        if (saveDecoratorContext) {
            setDecoratorContext(/*val*/ true);
        }
        return finishNode(node);
    }
    function parseOptionalIdentifier(): ts.Identifier | undefined {
        return isIdentifier() ? parseIdentifier() : undefined;
    }
    function parseNewExpressionOrNewDotTarget(): ts.NewExpression | ts.MetaProperty {
        const fullStart = scanner.getStartPos();
        parseExpected(ts.SyntaxKind.NewKeyword);
        if (parseOptional(ts.SyntaxKind.DotToken)) {
            const node = (<ts.MetaProperty>createNode(ts.SyntaxKind.MetaProperty, fullStart));
            node.keywordToken = ts.SyntaxKind.NewKeyword;
            node.name = parseIdentifierName();
            return finishNode(node);
        }
        let expression: ts.MemberExpression = parsePrimaryExpression();
        let typeArguments;
        while (true) {
            expression = parseMemberExpressionRest(expression, /*allowOptionalChain*/ false);
            typeArguments = tryParse(parseTypeArgumentsInExpression);
            if (isTemplateStartOfTaggedTemplate()) {
                ts.Debug.assert(!!typeArguments, "Expected a type argument list; all plain tagged template starts should be consumed in 'parseMemberExpressionRest'");
                expression = parseTaggedTemplateRest(expression, /*optionalChain*/ undefined, typeArguments);
                typeArguments = undefined;
            }
            break;
        }
        const node = (<ts.NewExpression>createNode(ts.SyntaxKind.NewExpression, fullStart));
        node.expression = expression;
        node.typeArguments = typeArguments;
        if (node.typeArguments || token() === ts.SyntaxKind.OpenParenToken) {
            node.arguments = parseArgumentList();
        }
        return finishNode(node);
    }
    // STATEMENTS
    function parseBlock(ignoreMissingOpenBrace: boolean, diagnosticMessage?: ts.DiagnosticMessage): ts.Block {
        const node = (<ts.Block>createNode(ts.SyntaxKind.Block));
        const openBracePosition = scanner.getTokenPos();
        if (parseExpected(ts.SyntaxKind.OpenBraceToken, diagnosticMessage) || ignoreMissingOpenBrace) {
            if (scanner.hasPrecedingLineBreak()) {
                node.multiLine = true;
            }
            node.statements = parseList(ParsingContext.BlockStatements, parseStatement);
            if (!parseExpected(ts.SyntaxKind.CloseBraceToken)) {
                const lastError = ts.lastOrUndefined(parseDiagnostics);
                if (lastError && lastError.code === ts.Diagnostics._0_expected.code) {
                    ts.addRelatedInfo(lastError, ts.createFileDiagnostic(sourceFile, openBracePosition, 1, ts.Diagnostics.The_parser_expected_to_find_a_to_match_the_token_here));
                }
            }
        }
        else {
            node.statements = createMissingList<ts.Statement>();
        }
        return finishNode(node);
    }
    function parseFunctionBlock(flags: SignatureFlags, diagnosticMessage?: ts.DiagnosticMessage): ts.Block {
        const savedYieldContext = inYieldContext();
        setYieldContext(!!(flags & SignatureFlags.Yield));
        const savedAwaitContext = inAwaitContext();
        setAwaitContext(!!(flags & SignatureFlags.Await));
        // We may be in a [Decorator] context when parsing a function expression or
        // arrow function. The body of the function is not in [Decorator] context.
        const saveDecoratorContext = inDecoratorContext();
        if (saveDecoratorContext) {
            setDecoratorContext(/*val*/ false);
        }
        const block = parseBlock(!!(flags & SignatureFlags.IgnoreMissingOpenBrace), diagnosticMessage);
        if (saveDecoratorContext) {
            setDecoratorContext(/*val*/ true);
        }
        setYieldContext(savedYieldContext);
        setAwaitContext(savedAwaitContext);
        return block;
    }
    function parseEmptyStatement(): ts.Statement {
        const node = (<ts.Statement>createNode(ts.SyntaxKind.EmptyStatement));
        parseExpected(ts.SyntaxKind.SemicolonToken);
        return finishNode(node);
    }
    function parseIfStatement(): ts.IfStatement {
        const node = (<ts.IfStatement>createNode(ts.SyntaxKind.IfStatement));
        parseExpected(ts.SyntaxKind.IfKeyword);
        parseExpected(ts.SyntaxKind.OpenParenToken);
        node.expression = allowInAnd(parseExpression);
        parseExpected(ts.SyntaxKind.CloseParenToken);
        node.thenStatement = parseStatement();
        node.elseStatement = parseOptional(ts.SyntaxKind.ElseKeyword) ? parseStatement() : undefined;
        return finishNode(node);
    }
    function parseDoStatement(): ts.DoStatement {
        const node = (<ts.DoStatement>createNode(ts.SyntaxKind.DoStatement));
        parseExpected(ts.SyntaxKind.DoKeyword);
        node.statement = parseStatement();
        parseExpected(ts.SyntaxKind.WhileKeyword);
        parseExpected(ts.SyntaxKind.OpenParenToken);
        node.expression = allowInAnd(parseExpression);
        parseExpected(ts.SyntaxKind.CloseParenToken);
        // From: https://mail.mozilla.org/pipermail/es-discuss/2011-August/016188.html
        // 157 min --- All allen at wirfs-brock.com CONF --- "do{;}while(false)false" prohibited in
        // spec but allowed in consensus reality. Approved -- this is the de-facto standard whereby
        //  do;while(0)x will have a semicolon inserted before x.
        parseOptional(ts.SyntaxKind.SemicolonToken);
        return finishNode(node);
    }
    function parseWhileStatement(): ts.WhileStatement {
        const node = (<ts.WhileStatement>createNode(ts.SyntaxKind.WhileStatement));
        parseExpected(ts.SyntaxKind.WhileKeyword);
        parseExpected(ts.SyntaxKind.OpenParenToken);
        node.expression = allowInAnd(parseExpression);
        parseExpected(ts.SyntaxKind.CloseParenToken);
        node.statement = parseStatement();
        return finishNode(node);
    }
    function parseForOrForInOrForOfStatement(): ts.Statement {
        const pos = getNodePos();
        parseExpected(ts.SyntaxKind.ForKeyword);
        const awaitToken = parseOptionalToken(ts.SyntaxKind.AwaitKeyword);
        parseExpected(ts.SyntaxKind.OpenParenToken);
        let initializer!: ts.VariableDeclarationList | ts.Expression;
        if (token() !== ts.SyntaxKind.SemicolonToken) {
            if (token() === ts.SyntaxKind.VarKeyword || token() === ts.SyntaxKind.LetKeyword || token() === ts.SyntaxKind.ConstKeyword) {
                initializer = parseVariableDeclarationList(/*inForStatementInitializer*/ true);
            }
            else {
                initializer = disallowInAnd(parseExpression);
            }
        }
        let forOrForInOrForOfStatement: ts.IterationStatement;
        if (awaitToken ? parseExpected(ts.SyntaxKind.OfKeyword) : parseOptional(ts.SyntaxKind.OfKeyword)) {
            const forOfStatement = (<ts.ForOfStatement>createNode(ts.SyntaxKind.ForOfStatement, pos));
            forOfStatement.awaitModifier = awaitToken;
            forOfStatement.initializer = initializer;
            forOfStatement.expression = allowInAnd(parseAssignmentExpressionOrHigher);
            parseExpected(ts.SyntaxKind.CloseParenToken);
            forOrForInOrForOfStatement = forOfStatement;
        }
        else if (parseOptional(ts.SyntaxKind.InKeyword)) {
            const forInStatement = (<ts.ForInStatement>createNode(ts.SyntaxKind.ForInStatement, pos));
            forInStatement.initializer = initializer;
            forInStatement.expression = allowInAnd(parseExpression);
            parseExpected(ts.SyntaxKind.CloseParenToken);
            forOrForInOrForOfStatement = forInStatement;
        }
        else {
            const forStatement = (<ts.ForStatement>createNode(ts.SyntaxKind.ForStatement, pos));
            forStatement.initializer = initializer;
            parseExpected(ts.SyntaxKind.SemicolonToken);
            if (token() !== ts.SyntaxKind.SemicolonToken && token() !== ts.SyntaxKind.CloseParenToken) {
                forStatement.condition = allowInAnd(parseExpression);
            }
            parseExpected(ts.SyntaxKind.SemicolonToken);
            if (token() !== ts.SyntaxKind.CloseParenToken) {
                forStatement.incrementor = allowInAnd(parseExpression);
            }
            parseExpected(ts.SyntaxKind.CloseParenToken);
            forOrForInOrForOfStatement = forStatement;
        }
        forOrForInOrForOfStatement.statement = parseStatement();
        return finishNode(forOrForInOrForOfStatement);
    }
    function parseBreakOrContinueStatement(kind: ts.SyntaxKind): ts.BreakOrContinueStatement {
        const node = (<ts.BreakOrContinueStatement>createNode(kind));
        parseExpected(kind === ts.SyntaxKind.BreakStatement ? ts.SyntaxKind.BreakKeyword : ts.SyntaxKind.ContinueKeyword);
        if (!canParseSemicolon()) {
            node.label = parseIdentifier();
        }
        parseSemicolon();
        return finishNode(node);
    }
    function parseReturnStatement(): ts.ReturnStatement {
        const node = (<ts.ReturnStatement>createNode(ts.SyntaxKind.ReturnStatement));
        parseExpected(ts.SyntaxKind.ReturnKeyword);
        if (!canParseSemicolon()) {
            node.expression = allowInAnd(parseExpression);
        }
        parseSemicolon();
        return finishNode(node);
    }
    function parseWithStatement(): ts.WithStatement {
        const node = (<ts.WithStatement>createNode(ts.SyntaxKind.WithStatement));
        parseExpected(ts.SyntaxKind.WithKeyword);
        parseExpected(ts.SyntaxKind.OpenParenToken);
        node.expression = allowInAnd(parseExpression);
        parseExpected(ts.SyntaxKind.CloseParenToken);
        node.statement = doInsideOfContext(ts.NodeFlags.InWithStatement, parseStatement);
        return finishNode(node);
    }
    function parseCaseClause(): ts.CaseClause {
        const node = (<ts.CaseClause>createNode(ts.SyntaxKind.CaseClause));
        parseExpected(ts.SyntaxKind.CaseKeyword);
        node.expression = allowInAnd(parseExpression);
        parseExpected(ts.SyntaxKind.ColonToken);
        node.statements = parseList(ParsingContext.SwitchClauseStatements, parseStatement);
        return finishNode(node);
    }
    function parseDefaultClause(): ts.DefaultClause {
        const node = (<ts.DefaultClause>createNode(ts.SyntaxKind.DefaultClause));
        parseExpected(ts.SyntaxKind.DefaultKeyword);
        parseExpected(ts.SyntaxKind.ColonToken);
        node.statements = parseList(ParsingContext.SwitchClauseStatements, parseStatement);
        return finishNode(node);
    }
    function parseCaseOrDefaultClause(): ts.CaseOrDefaultClause {
        return token() === ts.SyntaxKind.CaseKeyword ? parseCaseClause() : parseDefaultClause();
    }
    function parseSwitchStatement(): ts.SwitchStatement {
        const node = (<ts.SwitchStatement>createNode(ts.SyntaxKind.SwitchStatement));
        parseExpected(ts.SyntaxKind.SwitchKeyword);
        parseExpected(ts.SyntaxKind.OpenParenToken);
        node.expression = allowInAnd(parseExpression);
        parseExpected(ts.SyntaxKind.CloseParenToken);
        const caseBlock = (<ts.CaseBlock>createNode(ts.SyntaxKind.CaseBlock));
        parseExpected(ts.SyntaxKind.OpenBraceToken);
        caseBlock.clauses = parseList(ParsingContext.SwitchClauses, parseCaseOrDefaultClause);
        parseExpected(ts.SyntaxKind.CloseBraceToken);
        node.caseBlock = finishNode(caseBlock);
        return finishNode(node);
    }
    function parseThrowStatement(): ts.ThrowStatement {
        // ThrowStatement[Yield] :
        //      throw [no LineTerminator here]Expression[In, ?Yield];
        // Because of automatic semicolon insertion, we need to report error if this
        // throw could be terminated with a semicolon.  Note: we can't call 'parseExpression'
        // directly as that might consume an expression on the following line.
        // We just return 'undefined' in that case.  The actual error will be reported in the
        // grammar walker.
        const node = (<ts.ThrowStatement>createNode(ts.SyntaxKind.ThrowStatement));
        parseExpected(ts.SyntaxKind.ThrowKeyword);
        node.expression = scanner.hasPrecedingLineBreak() ? undefined : allowInAnd(parseExpression);
        parseSemicolon();
        return finishNode(node);
    }
    // TODO: Review for error recovery
    function parseTryStatement(): ts.TryStatement {
        const node = (<ts.TryStatement>createNode(ts.SyntaxKind.TryStatement));
        parseExpected(ts.SyntaxKind.TryKeyword);
        node.tryBlock = parseBlock(/*ignoreMissingOpenBrace*/ false);
        node.catchClause = token() === ts.SyntaxKind.CatchKeyword ? parseCatchClause() : undefined;
        // If we don't have a catch clause, then we must have a finally clause.  Try to parse
        // one out no matter what.
        if (!node.catchClause || token() === ts.SyntaxKind.FinallyKeyword) {
            parseExpected(ts.SyntaxKind.FinallyKeyword);
            node.finallyBlock = parseBlock(/*ignoreMissingOpenBrace*/ false);
        }
        return finishNode(node);
    }
    function parseCatchClause(): ts.CatchClause {
        const result = (<ts.CatchClause>createNode(ts.SyntaxKind.CatchClause));
        parseExpected(ts.SyntaxKind.CatchKeyword);
        if (parseOptional(ts.SyntaxKind.OpenParenToken)) {
            result.variableDeclaration = parseVariableDeclaration();
            parseExpected(ts.SyntaxKind.CloseParenToken);
        }
        else {
            // Keep shape of node to avoid degrading performance.
            result.variableDeclaration = undefined;
        }
        result.block = parseBlock(/*ignoreMissingOpenBrace*/ false);
        return finishNode(result);
    }
    function parseDebuggerStatement(): ts.Statement {
        const node = (<ts.Statement>createNode(ts.SyntaxKind.DebuggerStatement));
        parseExpected(ts.SyntaxKind.DebuggerKeyword);
        parseSemicolon();
        return finishNode(node);
    }
    function parseExpressionOrLabeledStatement(): ts.ExpressionStatement | ts.LabeledStatement {
        // Avoiding having to do the lookahead for a labeled statement by just trying to parse
        // out an expression, seeing if it is identifier and then seeing if it is followed by
        // a colon.
        const node = (<ts.ExpressionStatement | ts.LabeledStatement>createNodeWithJSDoc(ts.SyntaxKind.Unknown));
        const expression = allowInAnd(parseExpression);
        if (expression.kind === ts.SyntaxKind.Identifier && parseOptional(ts.SyntaxKind.ColonToken)) {
            node.kind = ts.SyntaxKind.LabeledStatement;
            (<ts.LabeledStatement>node).label = (<ts.Identifier>expression);
            (<ts.LabeledStatement>node).statement = parseStatement();
        }
        else {
            node.kind = ts.SyntaxKind.ExpressionStatement;
            (<ts.ExpressionStatement>node).expression = expression;
            parseSemicolon();
        }
        return finishNode(node);
    }
    function nextTokenIsIdentifierOrKeywordOnSameLine() {
        nextToken();
        return ts.tokenIsIdentifierOrKeyword(token()) && !scanner.hasPrecedingLineBreak();
    }
    function nextTokenIsClassKeywordOnSameLine() {
        nextToken();
        return token() === ts.SyntaxKind.ClassKeyword && !scanner.hasPrecedingLineBreak();
    }
    function nextTokenIsFunctionKeywordOnSameLine() {
        nextToken();
        return token() === ts.SyntaxKind.FunctionKeyword && !scanner.hasPrecedingLineBreak();
    }
    function nextTokenIsIdentifierOrKeywordOrLiteralOnSameLine() {
        nextToken();
        return (ts.tokenIsIdentifierOrKeyword(token()) || token() === ts.SyntaxKind.NumericLiteral || token() === ts.SyntaxKind.BigIntLiteral || token() === ts.SyntaxKind.StringLiteral) && !scanner.hasPrecedingLineBreak();
    }
    function isDeclaration(): boolean {
        while (true) {
            switch (token()) {
                case ts.SyntaxKind.VarKeyword:
                case ts.SyntaxKind.LetKeyword:
                case ts.SyntaxKind.ConstKeyword:
                case ts.SyntaxKind.FunctionKeyword:
                case ts.SyntaxKind.ClassKeyword:
                case ts.SyntaxKind.EnumKeyword:
                    return true;
                // 'declare', 'module', 'namespace', 'interface'* and 'type' are all legal JavaScript identifiers;
                // however, an identifier cannot be followed by another identifier on the same line. This is what we
                // count on to parse out the respective declarations. For instance, we exploit this to say that
                //
                //    namespace n
                //
                // can be none other than the beginning of a namespace declaration, but need to respect that JavaScript sees
                //
                //    namespace
                //    n
                //
                // as the identifier 'namespace' on one line followed by the identifier 'n' on another.
                // We need to look one token ahead to see if it permissible to try parsing a declaration.
                //
                // *Note*: 'interface' is actually a strict mode reserved word. So while
                //
                //   "use strict"
                //   interface
                //   I {}
                //
                // could be legal, it would add complexity for very little gain.
                case ts.SyntaxKind.InterfaceKeyword:
                case ts.SyntaxKind.TypeKeyword:
                    return nextTokenIsIdentifierOnSameLine();
                case ts.SyntaxKind.ModuleKeyword:
                case ts.SyntaxKind.NamespaceKeyword:
                    return nextTokenIsIdentifierOrStringLiteralOnSameLine();
                case ts.SyntaxKind.AbstractKeyword:
                case ts.SyntaxKind.AsyncKeyword:
                case ts.SyntaxKind.DeclareKeyword:
                case ts.SyntaxKind.PrivateKeyword:
                case ts.SyntaxKind.ProtectedKeyword:
                case ts.SyntaxKind.PublicKeyword:
                case ts.SyntaxKind.ReadonlyKeyword:
                    nextToken();
                    // ASI takes effect for this modifier.
                    if (scanner.hasPrecedingLineBreak()) {
                        return false;
                    }
                    continue;
                case ts.SyntaxKind.GlobalKeyword:
                    nextToken();
                    return token() === ts.SyntaxKind.OpenBraceToken || token() === ts.SyntaxKind.Identifier || token() === ts.SyntaxKind.ExportKeyword;
                case ts.SyntaxKind.ImportKeyword:
                    nextToken();
                    return token() === ts.SyntaxKind.StringLiteral || token() === ts.SyntaxKind.AsteriskToken ||
                        token() === ts.SyntaxKind.OpenBraceToken || ts.tokenIsIdentifierOrKeyword(token());
                case ts.SyntaxKind.ExportKeyword:
                    nextToken();
                    if (token() === ts.SyntaxKind.EqualsToken || token() === ts.SyntaxKind.AsteriskToken ||
                        token() === ts.SyntaxKind.OpenBraceToken || token() === ts.SyntaxKind.DefaultKeyword ||
                        token() === ts.SyntaxKind.AsKeyword) {
                        return true;
                    }
                    continue;
                case ts.SyntaxKind.StaticKeyword:
                    nextToken();
                    continue;
                default:
                    return false;
            }
        }
    }
    function isStartOfDeclaration(): boolean {
        return lookAhead(isDeclaration);
    }
    function isStartOfStatement(): boolean {
        switch (token()) {
            case ts.SyntaxKind.AtToken:
            case ts.SyntaxKind.SemicolonToken:
            case ts.SyntaxKind.OpenBraceToken:
            case ts.SyntaxKind.VarKeyword:
            case ts.SyntaxKind.LetKeyword:
            case ts.SyntaxKind.FunctionKeyword:
            case ts.SyntaxKind.ClassKeyword:
            case ts.SyntaxKind.EnumKeyword:
            case ts.SyntaxKind.IfKeyword:
            case ts.SyntaxKind.DoKeyword:
            case ts.SyntaxKind.WhileKeyword:
            case ts.SyntaxKind.ForKeyword:
            case ts.SyntaxKind.ContinueKeyword:
            case ts.SyntaxKind.BreakKeyword:
            case ts.SyntaxKind.ReturnKeyword:
            case ts.SyntaxKind.WithKeyword:
            case ts.SyntaxKind.SwitchKeyword:
            case ts.SyntaxKind.ThrowKeyword:
            case ts.SyntaxKind.TryKeyword:
            case ts.SyntaxKind.DebuggerKeyword:
            // 'catch' and 'finally' do not actually indicate that the code is part of a statement,
            // however, we say they are here so that we may gracefully parse them and error later.
            // falls through
            case ts.SyntaxKind.CatchKeyword:
            case ts.SyntaxKind.FinallyKeyword:
                return true;
            case ts.SyntaxKind.ImportKeyword:
                return isStartOfDeclaration() || lookAhead(nextTokenIsOpenParenOrLessThanOrDot);
            case ts.SyntaxKind.ConstKeyword:
            case ts.SyntaxKind.ExportKeyword:
                return isStartOfDeclaration();
            case ts.SyntaxKind.AsyncKeyword:
            case ts.SyntaxKind.DeclareKeyword:
            case ts.SyntaxKind.InterfaceKeyword:
            case ts.SyntaxKind.ModuleKeyword:
            case ts.SyntaxKind.NamespaceKeyword:
            case ts.SyntaxKind.TypeKeyword:
            case ts.SyntaxKind.GlobalKeyword:
                // When these don't start a declaration, they're an identifier in an expression statement
                return true;
            case ts.SyntaxKind.PublicKeyword:
            case ts.SyntaxKind.PrivateKeyword:
            case ts.SyntaxKind.ProtectedKeyword:
            case ts.SyntaxKind.StaticKeyword:
            case ts.SyntaxKind.ReadonlyKeyword:
                // When these don't start a declaration, they may be the start of a class member if an identifier
                // immediately follows. Otherwise they're an identifier in an expression statement.
                return isStartOfDeclaration() || !lookAhead(nextTokenIsIdentifierOrKeywordOnSameLine);
            default:
                return isStartOfExpression();
        }
    }
    function nextTokenIsIdentifierOrStartOfDestructuring() {
        nextToken();
        return isIdentifier() || token() === ts.SyntaxKind.OpenBraceToken || token() === ts.SyntaxKind.OpenBracketToken;
    }
    function isLetDeclaration() {
        // In ES6 'let' always starts a lexical declaration if followed by an identifier or {
        // or [.
        return lookAhead(nextTokenIsIdentifierOrStartOfDestructuring);
    }
    function parseStatement(): ts.Statement {
        switch (token()) {
            case ts.SyntaxKind.SemicolonToken:
                return parseEmptyStatement();
            case ts.SyntaxKind.OpenBraceToken:
                return parseBlock(/*ignoreMissingOpenBrace*/ false);
            case ts.SyntaxKind.VarKeyword:
                return parseVariableStatement((<ts.VariableStatement>createNodeWithJSDoc(ts.SyntaxKind.VariableDeclaration)));
            case ts.SyntaxKind.LetKeyword:
                if (isLetDeclaration()) {
                    return parseVariableStatement((<ts.VariableStatement>createNodeWithJSDoc(ts.SyntaxKind.VariableDeclaration)));
                }
                break;
            case ts.SyntaxKind.FunctionKeyword:
                return parseFunctionDeclaration((<ts.FunctionDeclaration>createNodeWithJSDoc(ts.SyntaxKind.FunctionDeclaration)));
            case ts.SyntaxKind.ClassKeyword:
                return parseClassDeclaration((<ts.ClassDeclaration>createNodeWithJSDoc(ts.SyntaxKind.ClassDeclaration)));
            case ts.SyntaxKind.IfKeyword:
                return parseIfStatement();
            case ts.SyntaxKind.DoKeyword:
                return parseDoStatement();
            case ts.SyntaxKind.WhileKeyword:
                return parseWhileStatement();
            case ts.SyntaxKind.ForKeyword:
                return parseForOrForInOrForOfStatement();
            case ts.SyntaxKind.ContinueKeyword:
                return parseBreakOrContinueStatement(ts.SyntaxKind.ContinueStatement);
            case ts.SyntaxKind.BreakKeyword:
                return parseBreakOrContinueStatement(ts.SyntaxKind.BreakStatement);
            case ts.SyntaxKind.ReturnKeyword:
                return parseReturnStatement();
            case ts.SyntaxKind.WithKeyword:
                return parseWithStatement();
            case ts.SyntaxKind.SwitchKeyword:
                return parseSwitchStatement();
            case ts.SyntaxKind.ThrowKeyword:
                return parseThrowStatement();
            case ts.SyntaxKind.TryKeyword:
            // Include 'catch' and 'finally' for error recovery.
            // falls through
            case ts.SyntaxKind.CatchKeyword:
            case ts.SyntaxKind.FinallyKeyword:
                return parseTryStatement();
            case ts.SyntaxKind.DebuggerKeyword:
                return parseDebuggerStatement();
            case ts.SyntaxKind.AtToken:
                return parseDeclaration();
            case ts.SyntaxKind.AsyncKeyword:
            case ts.SyntaxKind.InterfaceKeyword:
            case ts.SyntaxKind.TypeKeyword:
            case ts.SyntaxKind.ModuleKeyword:
            case ts.SyntaxKind.NamespaceKeyword:
            case ts.SyntaxKind.DeclareKeyword:
            case ts.SyntaxKind.ConstKeyword:
            case ts.SyntaxKind.EnumKeyword:
            case ts.SyntaxKind.ExportKeyword:
            case ts.SyntaxKind.ImportKeyword:
            case ts.SyntaxKind.PrivateKeyword:
            case ts.SyntaxKind.ProtectedKeyword:
            case ts.SyntaxKind.PublicKeyword:
            case ts.SyntaxKind.AbstractKeyword:
            case ts.SyntaxKind.StaticKeyword:
            case ts.SyntaxKind.ReadonlyKeyword:
            case ts.SyntaxKind.GlobalKeyword:
                if (isStartOfDeclaration()) {
                    return parseDeclaration();
                }
                break;
        }
        return parseExpressionOrLabeledStatement();
    }
    function isDeclareModifier(modifier: ts.Modifier) {
        return modifier.kind === ts.SyntaxKind.DeclareKeyword;
    }
    function parseDeclaration(): ts.Statement {
        const modifiers = lookAhead(() => (parseDecorators(), parseModifiers()));
        // `parseListElement` attempted to get the reused node at this position,
        // but the ambient context flag was not yet set, so the node appeared
        // not reusable in that context.
        const isAmbient = ts.some(modifiers, isDeclareModifier);
        if (isAmbient) {
            const node = tryReuseAmbientDeclaration();
            if (node) {
                return node;
            }
        }
        const node = (<ts.Statement>createNodeWithJSDoc(ts.SyntaxKind.Unknown));
        node.decorators = parseDecorators();
        node.modifiers = parseModifiers();
        if (isAmbient) {
            for (const m of node.modifiers!) {
                m.flags |= ts.NodeFlags.Ambient;
            }
            return doInsideOfContext(ts.NodeFlags.Ambient, () => parseDeclarationWorker(node));
        }
        else {
            return parseDeclarationWorker(node);
        }
    }
    function tryReuseAmbientDeclaration(): ts.Statement | undefined {
        return doInsideOfContext(ts.NodeFlags.Ambient, () => {
            const node = currentNode(parsingContext);
            if (node) {
                return consumeNode(node) as ts.Statement;
            }
        });
    }
    function parseDeclarationWorker(node: ts.Statement): ts.Statement {
        switch (token()) {
            case ts.SyntaxKind.VarKeyword:
            case ts.SyntaxKind.LetKeyword:
            case ts.SyntaxKind.ConstKeyword:
                return parseVariableStatement((<ts.VariableStatement>node));
            case ts.SyntaxKind.FunctionKeyword:
                return parseFunctionDeclaration((<ts.FunctionDeclaration>node));
            case ts.SyntaxKind.ClassKeyword:
                return parseClassDeclaration((<ts.ClassDeclaration>node));
            case ts.SyntaxKind.InterfaceKeyword:
                return parseInterfaceDeclaration((<ts.InterfaceDeclaration>node));
            case ts.SyntaxKind.TypeKeyword:
                return parseTypeAliasDeclaration((<ts.TypeAliasDeclaration>node));
            case ts.SyntaxKind.EnumKeyword:
                return parseEnumDeclaration((<ts.EnumDeclaration>node));
            case ts.SyntaxKind.GlobalKeyword:
            case ts.SyntaxKind.ModuleKeyword:
            case ts.SyntaxKind.NamespaceKeyword:
                return parseModuleDeclaration((<ts.ModuleDeclaration>node));
            case ts.SyntaxKind.ImportKeyword:
                return parseImportDeclarationOrImportEqualsDeclaration((<ts.ImportDeclaration | ts.ImportEqualsDeclaration>node));
            case ts.SyntaxKind.ExportKeyword:
                nextToken();
                switch (token()) {
                    case ts.SyntaxKind.DefaultKeyword:
                    case ts.SyntaxKind.EqualsToken:
                        return parseExportAssignment((<ts.ExportAssignment>node));
                    case ts.SyntaxKind.AsKeyword:
                        return parseNamespaceExportDeclaration((<ts.NamespaceExportDeclaration>node));
                    default:
                        return parseExportDeclaration((<ts.ExportDeclaration>node));
                }
            default:
                if (node.decorators || node.modifiers) {
                    // We reached this point because we encountered decorators and/or modifiers and assumed a declaration
                    // would follow. For recovery and error reporting purposes, return an incomplete declaration.
                    const missing = createMissingNode<ts.Statement>(ts.SyntaxKind.MissingDeclaration, /*reportAtCurrentPosition*/ true, ts.Diagnostics.Declaration_expected);
                    missing.pos = node.pos;
                    missing.decorators = node.decorators;
                    missing.modifiers = node.modifiers;
                    return finishNode(missing);
                }
                return undefined!; // TODO: GH#18217
        }
    }
    function nextTokenIsIdentifierOrStringLiteralOnSameLine() {
        nextToken();
        return !scanner.hasPrecedingLineBreak() && (isIdentifier() || token() === ts.SyntaxKind.StringLiteral);
    }
    function parseFunctionBlockOrSemicolon(flags: SignatureFlags, diagnosticMessage?: ts.DiagnosticMessage): ts.Block | undefined {
        if (token() !== ts.SyntaxKind.OpenBraceToken && canParseSemicolon()) {
            parseSemicolon();
            return;
        }
        return parseFunctionBlock(flags, diagnosticMessage);
    }
    // DECLARATIONS
    function parseArrayBindingElement(): ts.ArrayBindingElement {
        if (token() === ts.SyntaxKind.CommaToken) {
            return <ts.OmittedExpression>createNode(ts.SyntaxKind.OmittedExpression);
        }
        const node = (<ts.BindingElement>createNode(ts.SyntaxKind.BindingElement));
        node.dotDotDotToken = parseOptionalToken(ts.SyntaxKind.DotDotDotToken);
        node.name = parseIdentifierOrPattern();
        node.initializer = parseInitializer();
        return finishNode(node);
    }
    function parseObjectBindingElement(): ts.BindingElement {
        const node = (<ts.BindingElement>createNode(ts.SyntaxKind.BindingElement));
        node.dotDotDotToken = parseOptionalToken(ts.SyntaxKind.DotDotDotToken);
        const tokenIsIdentifier = isIdentifier();
        const propertyName = parsePropertyName();
        if (tokenIsIdentifier && token() !== ts.SyntaxKind.ColonToken) {
            node.name = (<ts.Identifier>propertyName);
        }
        else {
            parseExpected(ts.SyntaxKind.ColonToken);
            node.propertyName = propertyName;
            node.name = parseIdentifierOrPattern();
        }
        node.initializer = parseInitializer();
        return finishNode(node);
    }
    function parseObjectBindingPattern(): ts.ObjectBindingPattern {
        const node = (<ts.ObjectBindingPattern>createNode(ts.SyntaxKind.ObjectBindingPattern));
        parseExpected(ts.SyntaxKind.OpenBraceToken);
        node.elements = parseDelimitedList(ParsingContext.ObjectBindingElements, parseObjectBindingElement);
        parseExpected(ts.SyntaxKind.CloseBraceToken);
        return finishNode(node);
    }
    function parseArrayBindingPattern(): ts.ArrayBindingPattern {
        const node = (<ts.ArrayBindingPattern>createNode(ts.SyntaxKind.ArrayBindingPattern));
        parseExpected(ts.SyntaxKind.OpenBracketToken);
        node.elements = parseDelimitedList(ParsingContext.ArrayBindingElements, parseArrayBindingElement);
        parseExpected(ts.SyntaxKind.CloseBracketToken);
        return finishNode(node);
    }
    function isIdentifierOrPattern() {
        return token() === ts.SyntaxKind.OpenBraceToken || token() === ts.SyntaxKind.OpenBracketToken || isIdentifier();
    }
    function parseIdentifierOrPattern(): ts.Identifier | ts.BindingPattern {
        if (token() === ts.SyntaxKind.OpenBracketToken) {
            return parseArrayBindingPattern();
        }
        if (token() === ts.SyntaxKind.OpenBraceToken) {
            return parseObjectBindingPattern();
        }
        return parseIdentifier();
    }
    function parseVariableDeclarationAllowExclamation() {
        return parseVariableDeclaration(/*allowExclamation*/ true);
    }
    function parseVariableDeclaration(allowExclamation?: boolean): ts.VariableDeclaration {
        const node = (<ts.VariableDeclaration>createNode(ts.SyntaxKind.VariableDeclaration));
        node.name = parseIdentifierOrPattern();
        if (allowExclamation && node.name.kind === ts.SyntaxKind.Identifier &&
            token() === ts.SyntaxKind.ExclamationToken && !scanner.hasPrecedingLineBreak()) {
            node.exclamationToken = parseTokenNode<ts.Token<ts.SyntaxKind.ExclamationToken>>();
        }
        node.type = parseTypeAnnotation();
        if (!isInOrOfKeyword(token())) {
            node.initializer = parseInitializer();
        }
        return finishNode(node);
    }
    function parseVariableDeclarationList(inForStatementInitializer: boolean): ts.VariableDeclarationList {
        const node = (<ts.VariableDeclarationList>createNode(ts.SyntaxKind.VariableDeclarationList));
        switch (token()) {
            case ts.SyntaxKind.VarKeyword:
                break;
            case ts.SyntaxKind.LetKeyword:
                node.flags |= ts.NodeFlags.Let;
                break;
            case ts.SyntaxKind.ConstKeyword:
                node.flags |= ts.NodeFlags.Const;
                break;
            default:
                ts.Debug.fail();
        }
        nextToken();
        // The user may have written the following:
        //
        //    for (let of X) { }
        //
        // In this case, we want to parse an empty declaration list, and then parse 'of'
        // as a keyword. The reason this is not automatic is that 'of' is a valid identifier.
        // So we need to look ahead to determine if 'of' should be treated as a keyword in
        // this context.
        // The checker will then give an error that there is an empty declaration list.
        if (token() === ts.SyntaxKind.OfKeyword && lookAhead(canFollowContextualOfKeyword)) {
            node.declarations = createMissingList<ts.VariableDeclaration>();
        }
        else {
            const savedDisallowIn = inDisallowInContext();
            setDisallowInContext(inForStatementInitializer);
            node.declarations = parseDelimitedList(ParsingContext.VariableDeclarations, inForStatementInitializer ? parseVariableDeclaration : parseVariableDeclarationAllowExclamation);
            setDisallowInContext(savedDisallowIn);
        }
        return finishNode(node);
    }
    function canFollowContextualOfKeyword(): boolean {
        return nextTokenIsIdentifier() && nextToken() === ts.SyntaxKind.CloseParenToken;
    }
    function parseVariableStatement(node: ts.VariableStatement): ts.VariableStatement {
        node.kind = ts.SyntaxKind.VariableStatement;
        node.declarationList = parseVariableDeclarationList(/*inForStatementInitializer*/ false);
        parseSemicolon();
        return finishNode(node);
    }
    function parseFunctionDeclaration(node: ts.FunctionDeclaration): ts.FunctionDeclaration {
        node.kind = ts.SyntaxKind.FunctionDeclaration;
        parseExpected(ts.SyntaxKind.FunctionKeyword);
        node.asteriskToken = parseOptionalToken(ts.SyntaxKind.AsteriskToken);
        node.name = ts.hasModifier(node, ts.ModifierFlags.Default) ? parseOptionalIdentifier() : parseIdentifier();
        const isGenerator = node.asteriskToken ? SignatureFlags.Yield : SignatureFlags.None;
        const isAsync = ts.hasModifier(node, ts.ModifierFlags.Async) ? SignatureFlags.Await : SignatureFlags.None;
        fillSignature(ts.SyntaxKind.ColonToken, isGenerator | isAsync, node);
        node.body = parseFunctionBlockOrSemicolon(isGenerator | isAsync, ts.Diagnostics.or_expected);
        return finishNode(node);
    }
    function parseConstructorName() {
        if (token() === ts.SyntaxKind.ConstructorKeyword) {
            return parseExpected(ts.SyntaxKind.ConstructorKeyword);
        }
        if (token() === ts.SyntaxKind.StringLiteral && lookAhead(nextToken) === ts.SyntaxKind.OpenParenToken) {
            return tryParse(() => {
                const literalNode = parseLiteralNode();
                return literalNode.text === "constructor" ? literalNode : undefined;
            });
        }
    }
    function tryParseConstructorDeclaration(node: ts.ConstructorDeclaration): ts.ConstructorDeclaration | undefined {
        return tryParse(() => {
            if (parseConstructorName()) {
                node.kind = ts.SyntaxKind.Constructor;
                fillSignature(ts.SyntaxKind.ColonToken, SignatureFlags.None, node);
                node.body = parseFunctionBlockOrSemicolon(SignatureFlags.None, ts.Diagnostics.or_expected);
                return finishNode(node);
            }
        });
    }
    function parseMethodDeclaration(node: ts.MethodDeclaration, asteriskToken: ts.AsteriskToken, diagnosticMessage?: ts.DiagnosticMessage): ts.MethodDeclaration {
        node.kind = ts.SyntaxKind.MethodDeclaration;
        node.asteriskToken = asteriskToken;
        const isGenerator = asteriskToken ? SignatureFlags.Yield : SignatureFlags.None;
        const isAsync = ts.hasModifier(node, ts.ModifierFlags.Async) ? SignatureFlags.Await : SignatureFlags.None;
        fillSignature(ts.SyntaxKind.ColonToken, isGenerator | isAsync, node);
        node.body = parseFunctionBlockOrSemicolon(isGenerator | isAsync, diagnosticMessage);
        return finishNode(node);
    }
    function parsePropertyDeclaration(node: ts.PropertyDeclaration): ts.PropertyDeclaration {
        node.kind = ts.SyntaxKind.PropertyDeclaration;
        if (!node.questionToken && token() === ts.SyntaxKind.ExclamationToken && !scanner.hasPrecedingLineBreak()) {
            node.exclamationToken = parseTokenNode<ts.Token<ts.SyntaxKind.ExclamationToken>>();
        }
        node.type = parseTypeAnnotation();
        node.initializer = doOutsideOfContext(ts.NodeFlags.YieldContext | ts.NodeFlags.AwaitContext | ts.NodeFlags.DisallowInContext, parseInitializer);
        parseSemicolon();
        return finishNode(node);
    }
    function parsePropertyOrMethodDeclaration(node: ts.PropertyDeclaration | ts.MethodDeclaration): ts.PropertyDeclaration | ts.MethodDeclaration {
        const asteriskToken = parseOptionalToken(ts.SyntaxKind.AsteriskToken);
        node.name = parsePropertyName();
        // Note: this is not legal as per the grammar.  But we allow it in the parser and
        // report an error in the grammar checker.
        node.questionToken = parseOptionalToken(ts.SyntaxKind.QuestionToken);
        if (asteriskToken || token() === ts.SyntaxKind.OpenParenToken || token() === ts.SyntaxKind.LessThanToken) {
            return parseMethodDeclaration((<ts.MethodDeclaration>node), asteriskToken, ts.Diagnostics.or_expected);
        }
        return parsePropertyDeclaration((<ts.PropertyDeclaration>node));
    }
    function parseAccessorDeclaration(node: ts.AccessorDeclaration, kind: ts.AccessorDeclaration["kind"]): ts.AccessorDeclaration {
        node.kind = kind;
        node.name = parsePropertyName();
        fillSignature(ts.SyntaxKind.ColonToken, SignatureFlags.None, node);
        node.body = parseFunctionBlockOrSemicolon(SignatureFlags.None);
        return finishNode(node);
    }
    function isClassMemberStart(): boolean {
        let idToken: ts.SyntaxKind | undefined;
        if (token() === ts.SyntaxKind.AtToken) {
            return true;
        }
        // Eat up all modifiers, but hold on to the last one in case it is actually an identifier.
        while (ts.isModifierKind(token())) {
            idToken = token();
            // If the idToken is a class modifier (protected, private, public, and static), it is
            // certain that we are starting to parse class member. This allows better error recovery
            // Example:
            //      public foo() ...     // true
            //      public @dec blah ... // true; we will then report an error later
            //      export public ...    // true; we will then report an error later
            if (ts.isClassMemberModifier(idToken)) {
                return true;
            }
            nextToken();
        }
        if (token() === ts.SyntaxKind.AsteriskToken) {
            return true;
        }
        // Try to get the first property-like token following all modifiers.
        // This can either be an identifier or the 'get' or 'set' keywords.
        if (isLiteralPropertyName()) {
            idToken = token();
            nextToken();
        }
        // Index signatures and computed properties are class members; we can parse.
        if (token() === ts.SyntaxKind.OpenBracketToken) {
            return true;
        }
        // If we were able to get any potential identifier...
        if (idToken !== undefined) {
            // If we have a non-keyword identifier, or if we have an accessor, then it's safe to parse.
            if (!ts.isKeyword(idToken) || idToken === ts.SyntaxKind.SetKeyword || idToken === ts.SyntaxKind.GetKeyword) {
                return true;
            }
            // If it *is* a keyword, but not an accessor, check a little farther along
            // to see if it should actually be parsed as a class member.
            switch (token()) {
                case ts.SyntaxKind.OpenParenToken: // Method declaration
                case ts.SyntaxKind.LessThanToken: // Generic Method declaration
                case ts.SyntaxKind.ExclamationToken: // Non-null assertion on property name
                case ts.SyntaxKind.ColonToken: // Type Annotation for declaration
                case ts.SyntaxKind.EqualsToken: // Initializer for declaration
                case ts.SyntaxKind.QuestionToken: // Not valid, but permitted so that it gets caught later on.
                    return true;
                default:
                    // Covers
                    //  - Semicolons     (declaration termination)
                    //  - Closing braces (end-of-class, must be declaration)
                    //  - End-of-files   (not valid, but permitted so that it gets caught later on)
                    //  - Line-breaks    (enabling *automatic semicolon insertion*)
                    return canParseSemicolon();
            }
        }
        return false;
    }
    function parseDecorators(): ts.NodeArray<ts.Decorator> | undefined {
        let list: ts.Decorator[] | undefined;
        const listPos = getNodePos();
        while (true) {
            const decoratorStart = getNodePos();
            if (!parseOptional(ts.SyntaxKind.AtToken)) {
                break;
            }
            const decorator = (<ts.Decorator>createNode(ts.SyntaxKind.Decorator, decoratorStart));
            decorator.expression = doInDecoratorContext(parseLeftHandSideExpressionOrHigher);
            finishNode(decorator);
            (list || (list = [])).push(decorator);
        }
        return list && createNodeArray(list, listPos);
    }
    /*
     * There are situations in which a modifier like 'const' will appear unexpectedly, such as on a class member.
     * In those situations, if we are entirely sure that 'const' is not valid on its own (such as when ASI takes effect
     * and turns it into a standalone declaration), then it is better to parse it and report an error later.
     *
     * In such situations, 'permitInvalidConstAsModifier' should be set to true.
     */
    function parseModifiers(permitInvalidConstAsModifier?: boolean): ts.NodeArray<ts.Modifier> | undefined {
        let list: ts.Modifier[] | undefined;
        const listPos = getNodePos();
        while (true) {
            const modifierStart = scanner.getStartPos();
            const modifierKind = token();
            if (token() === ts.SyntaxKind.ConstKeyword && permitInvalidConstAsModifier) {
                // We need to ensure that any subsequent modifiers appear on the same line
                // so that when 'const' is a standalone declaration, we don't issue an error.
                if (!tryParse(nextTokenIsOnSameLineAndCanFollowModifier)) {
                    break;
                }
            }
            else {
                if (!parseAnyContextualModifier()) {
                    break;
                }
            }
            const modifier = finishNode((<ts.Modifier>createNode(modifierKind, modifierStart)));
            (list || (list = [])).push(modifier);
        }
        return list && createNodeArray(list, listPos);
    }
    function parseModifiersForArrowFunction(): ts.NodeArray<ts.Modifier> | undefined {
        let modifiers: ts.NodeArray<ts.Modifier> | undefined;
        if (token() === ts.SyntaxKind.AsyncKeyword) {
            const modifierStart = scanner.getStartPos();
            const modifierKind = token();
            nextToken();
            const modifier = finishNode((<ts.Modifier>createNode(modifierKind, modifierStart)));
            modifiers = createNodeArray<ts.Modifier>([modifier], modifierStart);
        }
        return modifiers;
    }
    function parseClassElement(): ts.ClassElement {
        if (token() === ts.SyntaxKind.SemicolonToken) {
            const result = (<ts.SemicolonClassElement>createNode(ts.SyntaxKind.SemicolonClassElement));
            nextToken();
            return finishNode(result);
        }
        const node = (<ts.ClassElement>createNodeWithJSDoc(ts.SyntaxKind.Unknown));
        node.decorators = parseDecorators();
        node.modifiers = parseModifiers(/*permitInvalidConstAsModifier*/ true);
        if (parseContextualModifier(ts.SyntaxKind.GetKeyword)) {
            return parseAccessorDeclaration((<ts.AccessorDeclaration>node), ts.SyntaxKind.GetAccessor);
        }
        if (parseContextualModifier(ts.SyntaxKind.SetKeyword)) {
            return parseAccessorDeclaration((<ts.AccessorDeclaration>node), ts.SyntaxKind.SetAccessor);
        }
        if (token() === ts.SyntaxKind.ConstructorKeyword || token() === ts.SyntaxKind.StringLiteral) {
            const constructorDeclaration = tryParseConstructorDeclaration((<ts.ConstructorDeclaration>node));
            if (constructorDeclaration) {
                return constructorDeclaration;
            }
        }
        if (isIndexSignature()) {
            return parseIndexSignatureDeclaration((<ts.IndexSignatureDeclaration>node));
        }
        // It is very important that we check this *after* checking indexers because
        // the [ token can start an index signature or a computed property name
        if (ts.tokenIsIdentifierOrKeyword(token()) ||
            token() === ts.SyntaxKind.StringLiteral ||
            token() === ts.SyntaxKind.NumericLiteral ||
            token() === ts.SyntaxKind.AsteriskToken ||
            token() === ts.SyntaxKind.OpenBracketToken) {
            const isAmbient = node.modifiers && ts.some(node.modifiers, isDeclareModifier);
            if (isAmbient) {
                for (const m of node.modifiers!) {
                    m.flags |= ts.NodeFlags.Ambient;
                }
                return doInsideOfContext(ts.NodeFlags.Ambient, () => parsePropertyOrMethodDeclaration((node as ts.PropertyDeclaration | ts.MethodDeclaration)));
            }
            else {
                return parsePropertyOrMethodDeclaration((node as ts.PropertyDeclaration | ts.MethodDeclaration));
            }
        }
        if (node.decorators || node.modifiers) {
            // treat this as a property declaration with a missing name.
            node.name = createMissingNode<ts.Identifier>(ts.SyntaxKind.Identifier, /*reportAtCurrentPosition*/ true, ts.Diagnostics.Declaration_expected);
            return parsePropertyDeclaration((<ts.PropertyDeclaration>node));
        }
        // 'isClassMemberStart' should have hinted not to attempt parsing.
        return ts.Debug.fail("Should not have attempted to parse class member declaration.");
    }
    function parseClassExpression(): ts.ClassExpression {
        return <ts.ClassExpression>parseClassDeclarationOrExpression((<ts.ClassLikeDeclaration>createNodeWithJSDoc(ts.SyntaxKind.Unknown)), ts.SyntaxKind.ClassExpression);
    }
    function parseClassDeclaration(node: ts.ClassLikeDeclaration): ts.ClassDeclaration {
        return <ts.ClassDeclaration>parseClassDeclarationOrExpression(node, ts.SyntaxKind.ClassDeclaration);
    }
    function parseClassDeclarationOrExpression(node: ts.ClassLikeDeclaration, kind: ts.ClassLikeDeclaration["kind"]): ts.ClassLikeDeclaration {
        node.kind = kind;
        parseExpected(ts.SyntaxKind.ClassKeyword);
        node.name = parseNameOfClassDeclarationOrExpression();
        node.typeParameters = parseTypeParameters();
        node.heritageClauses = parseHeritageClauses();
        if (parseExpected(ts.SyntaxKind.OpenBraceToken)) {
            // ClassTail[Yield,Await] : (Modified) See 14.5
            //      ClassHeritage[?Yield,?Await]opt { ClassBody[?Yield,?Await]opt }
            node.members = parseClassMembers();
            parseExpected(ts.SyntaxKind.CloseBraceToken);
        }
        else {
            node.members = createMissingList<ts.ClassElement>();
        }
        return finishNode(node);
    }
    function parseNameOfClassDeclarationOrExpression(): ts.Identifier | undefined {
        // implements is a future reserved word so
        // 'class implements' might mean either
        // - class expression with omitted name, 'implements' starts heritage clause
        // - class with name 'implements'
        // 'isImplementsClause' helps to disambiguate between these two cases
        return isIdentifier() && !isImplementsClause()
            ? parseIdentifier()
            : undefined;
    }
    function isImplementsClause() {
        return token() === ts.SyntaxKind.ImplementsKeyword && lookAhead(nextTokenIsIdentifierOrKeyword);
    }
    function parseHeritageClauses(): ts.NodeArray<ts.HeritageClause> | undefined {
        // ClassTail[Yield,Await] : (Modified) See 14.5
        //      ClassHeritage[?Yield,?Await]opt { ClassBody[?Yield,?Await]opt }
        if (isHeritageClause()) {
            return parseList(ParsingContext.HeritageClauses, parseHeritageClause);
        }
        return undefined;
    }
    function parseHeritageClause(): ts.HeritageClause {
        const tok = token();
        ts.Debug.assert(tok === ts.SyntaxKind.ExtendsKeyword || tok === ts.SyntaxKind.ImplementsKeyword); // isListElement() should ensure this.
        const node = (<ts.HeritageClause>createNode(ts.SyntaxKind.HeritageClause));
        node.token = (tok as ts.SyntaxKind.ExtendsKeyword | ts.SyntaxKind.ImplementsKeyword);
        nextToken();
        node.types = parseDelimitedList(ParsingContext.HeritageClauseElement, parseExpressionWithTypeArguments);
        return finishNode(node);
    }
    function parseExpressionWithTypeArguments(): ts.ExpressionWithTypeArguments {
        const node = (<ts.ExpressionWithTypeArguments>createNode(ts.SyntaxKind.ExpressionWithTypeArguments));
        node.expression = parseLeftHandSideExpressionOrHigher();
        node.typeArguments = tryParseTypeArguments();
        return finishNode(node);
    }
    function tryParseTypeArguments(): ts.NodeArray<ts.TypeNode> | undefined {
        return token() === ts.SyntaxKind.LessThanToken ?
            parseBracketedList(ParsingContext.TypeArguments, parseType, ts.SyntaxKind.LessThanToken, ts.SyntaxKind.GreaterThanToken) : undefined;
    }
    function isHeritageClause(): boolean {
        return token() === ts.SyntaxKind.ExtendsKeyword || token() === ts.SyntaxKind.ImplementsKeyword;
    }
    function parseClassMembers(): ts.NodeArray<ts.ClassElement> {
        return parseList(ParsingContext.ClassMembers, parseClassElement);
    }
    function parseInterfaceDeclaration(node: ts.InterfaceDeclaration): ts.InterfaceDeclaration {
        node.kind = ts.SyntaxKind.InterfaceDeclaration;
        parseExpected(ts.SyntaxKind.InterfaceKeyword);
        node.name = parseIdentifier();
        node.typeParameters = parseTypeParameters();
        node.heritageClauses = parseHeritageClauses();
        node.members = parseObjectTypeMembers();
        return finishNode(node);
    }
    function parseTypeAliasDeclaration(node: ts.TypeAliasDeclaration): ts.TypeAliasDeclaration {
        node.kind = ts.SyntaxKind.TypeAliasDeclaration;
        parseExpected(ts.SyntaxKind.TypeKeyword);
        node.name = parseIdentifier();
        node.typeParameters = parseTypeParameters();
        parseExpected(ts.SyntaxKind.EqualsToken);
        node.type = parseType();
        parseSemicolon();
        return finishNode(node);
    }
    // In an ambient declaration, the grammar only allows integer literals as initializers.
    // In a non-ambient declaration, the grammar allows uninitialized members only in a
    // ConstantEnumMemberSection, which starts at the beginning of an enum declaration
    // or any time an integer literal initializer is encountered.
    function parseEnumMember(): ts.EnumMember {
        const node = (<ts.EnumMember>createNodeWithJSDoc(ts.SyntaxKind.EnumMember));
        node.name = parsePropertyName();
        node.initializer = allowInAnd(parseInitializer);
        return finishNode(node);
    }
    function parseEnumDeclaration(node: ts.EnumDeclaration): ts.EnumDeclaration {
        node.kind = ts.SyntaxKind.EnumDeclaration;
        parseExpected(ts.SyntaxKind.EnumKeyword);
        node.name = parseIdentifier();
        if (parseExpected(ts.SyntaxKind.OpenBraceToken)) {
            node.members = doOutsideOfYieldAndAwaitContext(() => parseDelimitedList(ParsingContext.EnumMembers, parseEnumMember));
            parseExpected(ts.SyntaxKind.CloseBraceToken);
        }
        else {
            node.members = createMissingList<ts.EnumMember>();
        }
        return finishNode(node);
    }
    function parseModuleBlock(): ts.ModuleBlock {
        const node = (<ts.ModuleBlock>createNode(ts.SyntaxKind.ModuleBlock));
        if (parseExpected(ts.SyntaxKind.OpenBraceToken)) {
            node.statements = parseList(ParsingContext.BlockStatements, parseStatement);
            parseExpected(ts.SyntaxKind.CloseBraceToken);
        }
        else {
            node.statements = createMissingList<ts.Statement>();
        }
        return finishNode(node);
    }
    function parseModuleOrNamespaceDeclaration(node: ts.ModuleDeclaration, flags: ts.NodeFlags): ts.ModuleDeclaration {
        node.kind = ts.SyntaxKind.ModuleDeclaration;
        // If we are parsing a dotted namespace name, we want to
        // propagate the 'Namespace' flag across the names if set.
        const namespaceFlag = flags & ts.NodeFlags.Namespace;
        node.flags |= flags;
        node.name = parseIdentifier();
        node.body = parseOptional(ts.SyntaxKind.DotToken)
            ? <ts.NamespaceDeclaration>parseModuleOrNamespaceDeclaration((<ts.ModuleDeclaration>createNode(ts.SyntaxKind.Unknown)), ts.NodeFlags.NestedNamespace | namespaceFlag)
            : parseModuleBlock();
        return finishNode(node);
    }
    function parseAmbientExternalModuleDeclaration(node: ts.ModuleDeclaration): ts.ModuleDeclaration {
        node.kind = ts.SyntaxKind.ModuleDeclaration;
        if (token() === ts.SyntaxKind.GlobalKeyword) {
            // parse 'global' as name of global scope augmentation
            node.name = parseIdentifier();
            node.flags |= ts.NodeFlags.GlobalAugmentation;
        }
        else {
            node.name = (<ts.StringLiteral>parseLiteralNode());
            node.name.text = internIdentifier(node.name.text);
        }
        if (token() === ts.SyntaxKind.OpenBraceToken) {
            node.body = parseModuleBlock();
        }
        else {
            parseSemicolon();
        }
        return finishNode(node);
    }
    function parseModuleDeclaration(node: ts.ModuleDeclaration): ts.ModuleDeclaration {
        let flags: ts.NodeFlags = 0;
        if (token() === ts.SyntaxKind.GlobalKeyword) {
            // global augmentation
            return parseAmbientExternalModuleDeclaration(node);
        }
        else if (parseOptional(ts.SyntaxKind.NamespaceKeyword)) {
            flags |= ts.NodeFlags.Namespace;
        }
        else {
            parseExpected(ts.SyntaxKind.ModuleKeyword);
            if (token() === ts.SyntaxKind.StringLiteral) {
                return parseAmbientExternalModuleDeclaration(node);
            }
        }
        return parseModuleOrNamespaceDeclaration(node, flags);
    }
    function isExternalModuleReference() {
        return token() === ts.SyntaxKind.RequireKeyword &&
            lookAhead(nextTokenIsOpenParen);
    }
    function nextTokenIsOpenParen() {
        return nextToken() === ts.SyntaxKind.OpenParenToken;
    }
    function nextTokenIsSlash() {
        return nextToken() === ts.SyntaxKind.SlashToken;
    }
    function parseNamespaceExportDeclaration(node: ts.NamespaceExportDeclaration): ts.NamespaceExportDeclaration {
        node.kind = ts.SyntaxKind.NamespaceExportDeclaration;
        parseExpected(ts.SyntaxKind.AsKeyword);
        parseExpected(ts.SyntaxKind.NamespaceKeyword);
        node.name = parseIdentifier();
        parseSemicolon();
        return finishNode(node);
    }
    function parseImportDeclarationOrImportEqualsDeclaration(node: ts.ImportEqualsDeclaration | ts.ImportDeclaration): ts.ImportEqualsDeclaration | ts.ImportDeclaration {
        parseExpected(ts.SyntaxKind.ImportKeyword);
        const afterImportPos = scanner.getStartPos();
        let identifier: ts.Identifier | undefined;
        if (isIdentifier()) {
            identifier = parseIdentifier();
            if (token() !== ts.SyntaxKind.CommaToken && token() !== ts.SyntaxKind.FromKeyword) {
                return parseImportEqualsDeclaration((<ts.ImportEqualsDeclaration>node), identifier);
            }
        }
        // Import statement
        node.kind = ts.SyntaxKind.ImportDeclaration;
        // ImportDeclaration:
        //  import ImportClause from ModuleSpecifier ;
        //  import ModuleSpecifier;
        if (identifier || // import id
            token() === ts.SyntaxKind.AsteriskToken || // import *
            token() === ts.SyntaxKind.OpenBraceToken) { // import {
            (<ts.ImportDeclaration>node).importClause = parseImportClause(identifier, afterImportPos);
            parseExpected(ts.SyntaxKind.FromKeyword);
        }
        (<ts.ImportDeclaration>node).moduleSpecifier = parseModuleSpecifier();
        parseSemicolon();
        return finishNode(node);
    }
    function parseImportEqualsDeclaration(node: ts.ImportEqualsDeclaration, identifier: ts.Identifier): ts.ImportEqualsDeclaration {
        node.kind = ts.SyntaxKind.ImportEqualsDeclaration;
        node.name = identifier;
        parseExpected(ts.SyntaxKind.EqualsToken);
        node.moduleReference = parseModuleReference();
        parseSemicolon();
        return finishNode(node);
    }
    function parseImportClause(identifier: ts.Identifier | undefined, fullStart: number) {
        // ImportClause:
        //  ImportedDefaultBinding
        //  NameSpaceImport
        //  NamedImports
        //  ImportedDefaultBinding, NameSpaceImport
        //  ImportedDefaultBinding, NamedImports
        const importClause = (<ts.ImportClause>createNode(ts.SyntaxKind.ImportClause, fullStart));
        if (identifier) {
            // ImportedDefaultBinding:
            //  ImportedBinding
            importClause.name = identifier;
        }
        // If there was no default import or if there is comma token after default import
        // parse namespace or named imports
        if (!importClause.name ||
            parseOptional(ts.SyntaxKind.CommaToken)) {
            importClause.namedBindings = token() === ts.SyntaxKind.AsteriskToken ? parseNamespaceImport() : parseNamedImportsOrExports(ts.SyntaxKind.NamedImports);
        }
        return finishNode(importClause);
    }
    function parseModuleReference() {
        return isExternalModuleReference()
            ? parseExternalModuleReference()
            : parseEntityName(/*allowReservedWords*/ false);
    }
    function parseExternalModuleReference() {
        const node = (<ts.ExternalModuleReference>createNode(ts.SyntaxKind.ExternalModuleReference));
        parseExpected(ts.SyntaxKind.RequireKeyword);
        parseExpected(ts.SyntaxKind.OpenParenToken);
        node.expression = parseModuleSpecifier();
        parseExpected(ts.SyntaxKind.CloseParenToken);
        return finishNode(node);
    }
    function parseModuleSpecifier(): ts.Expression {
        if (token() === ts.SyntaxKind.StringLiteral) {
            const result = parseLiteralNode();
            result.text = internIdentifier(result.text);
            return result;
        }
        else {
            // We allow arbitrary expressions here, even though the grammar only allows string
            // literals.  We check to ensure that it is only a string literal later in the grammar
            // check pass.
            return parseExpression();
        }
    }
    function parseNamespaceImport(): ts.NamespaceImport {
        // NameSpaceImport:
        //  * as ImportedBinding
        const namespaceImport = (<ts.NamespaceImport>createNode(ts.SyntaxKind.NamespaceImport));
        parseExpected(ts.SyntaxKind.AsteriskToken);
        parseExpected(ts.SyntaxKind.AsKeyword);
        namespaceImport.name = parseIdentifier();
        return finishNode(namespaceImport);
    }
    function parseNamedImportsOrExports(kind: ts.SyntaxKind.NamedImports): ts.NamedImports;
    function parseNamedImportsOrExports(kind: ts.SyntaxKind.NamedExports): ts.NamedExports;
    function parseNamedImportsOrExports(kind: ts.SyntaxKind): ts.NamedImportsOrExports {
        const node = (<ts.NamedImports | ts.NamedExports>createNode(kind));
        // NamedImports:
        //  { }
        //  { ImportsList }
        //  { ImportsList, }
        // ImportsList:
        //  ImportSpecifier
        //  ImportsList, ImportSpecifier
        node.elements = (<ts.NodeArray<ts.ImportSpecifier> | ts.NodeArray<ts.ExportSpecifier>>parseBracketedList(ParsingContext.ImportOrExportSpecifiers, kind === ts.SyntaxKind.NamedImports ? parseImportSpecifier : parseExportSpecifier, ts.SyntaxKind.OpenBraceToken, ts.SyntaxKind.CloseBraceToken));
        return finishNode(node);
    }
    function parseExportSpecifier() {
        return parseImportOrExportSpecifier(ts.SyntaxKind.ExportSpecifier);
    }
    function parseImportSpecifier() {
        return parseImportOrExportSpecifier(ts.SyntaxKind.ImportSpecifier);
    }
    function parseImportOrExportSpecifier(kind: ts.SyntaxKind): ts.ImportOrExportSpecifier {
        const node = (<ts.ImportSpecifier>createNode(kind));
        // ImportSpecifier:
        //   BindingIdentifier
        //   IdentifierName as BindingIdentifier
        // ExportSpecifier:
        //   IdentifierName
        //   IdentifierName as IdentifierName
        let checkIdentifierIsKeyword = ts.isKeyword(token()) && !isIdentifier();
        let checkIdentifierStart = scanner.getTokenPos();
        let checkIdentifierEnd = scanner.getTextPos();
        const identifierName = parseIdentifierName();
        if (token() === ts.SyntaxKind.AsKeyword) {
            node.propertyName = identifierName;
            parseExpected(ts.SyntaxKind.AsKeyword);
            checkIdentifierIsKeyword = ts.isKeyword(token()) && !isIdentifier();
            checkIdentifierStart = scanner.getTokenPos();
            checkIdentifierEnd = scanner.getTextPos();
            node.name = parseIdentifierName();
        }
        else {
            node.name = identifierName;
        }
        if (kind === ts.SyntaxKind.ImportSpecifier && checkIdentifierIsKeyword) {
            parseErrorAt(checkIdentifierStart, checkIdentifierEnd, ts.Diagnostics.Identifier_expected);
        }
        return finishNode(node);
    }
    function parseExportDeclaration(node: ts.ExportDeclaration): ts.ExportDeclaration {
        node.kind = ts.SyntaxKind.ExportDeclaration;
        if (parseOptional(ts.SyntaxKind.AsteriskToken)) {
            parseExpected(ts.SyntaxKind.FromKeyword);
            node.moduleSpecifier = parseModuleSpecifier();
        }
        else {
            node.exportClause = parseNamedImportsOrExports(ts.SyntaxKind.NamedExports);
            // It is not uncommon to accidentally omit the 'from' keyword. Additionally, in editing scenarios,
            // the 'from' keyword can be parsed as a named export when the export clause is unterminated (i.e. `export { from "moduleName";`)
            // If we don't have a 'from' keyword, see if we have a string literal such that ASI won't take effect.
            if (token() === ts.SyntaxKind.FromKeyword || (token() === ts.SyntaxKind.StringLiteral && !scanner.hasPrecedingLineBreak())) {
                parseExpected(ts.SyntaxKind.FromKeyword);
                node.moduleSpecifier = parseModuleSpecifier();
            }
        }
        parseSemicolon();
        return finishNode(node);
    }
    function parseExportAssignment(node: ts.ExportAssignment): ts.ExportAssignment {
        node.kind = ts.SyntaxKind.ExportAssignment;
        if (parseOptional(ts.SyntaxKind.EqualsToken)) {
            node.isExportEquals = true;
        }
        else {
            parseExpected(ts.SyntaxKind.DefaultKeyword);
        }
        node.expression = parseAssignmentExpressionOrHigher();
        parseSemicolon();
        return finishNode(node);
    }
    function setExternalModuleIndicator(sourceFile: ts.SourceFile) {
        // Try to use the first top-level import/export when available, then
        // fall back to looking for an 'import.meta' somewhere in the tree if necessary.
        sourceFile.externalModuleIndicator =
            ts.forEach(sourceFile.statements, isAnExternalModuleIndicatorNode) ||
                getImportMetaIfNecessary(sourceFile);
    }
    function isAnExternalModuleIndicatorNode(node: ts.Node) {
        return ts.hasModifier(node, ts.ModifierFlags.Export)
            || node.kind === ts.SyntaxKind.ImportEqualsDeclaration && (<ts.ImportEqualsDeclaration>node).moduleReference.kind === ts.SyntaxKind.ExternalModuleReference
            || node.kind === ts.SyntaxKind.ImportDeclaration
            || node.kind === ts.SyntaxKind.ExportAssignment
            || node.kind === ts.SyntaxKind.ExportDeclaration ? node : undefined;
    }
    function getImportMetaIfNecessary(sourceFile: ts.SourceFile) {
        return sourceFile.flags & ts.NodeFlags.PossiblyContainsImportMeta ?
            walkTreeForExternalModuleIndicators(sourceFile) :
            undefined;
    }
    function walkTreeForExternalModuleIndicators(node: ts.Node): ts.Node | undefined {
        return isImportMeta(node) ? node : forEachChild(node, walkTreeForExternalModuleIndicators);
    }
    function isImportMeta(node: ts.Node): boolean {
        return ts.isMetaProperty(node) && node.keywordToken === ts.SyntaxKind.ImportKeyword && node.name.escapedText === "meta";
    }
    const enum ParsingContext {
        SourceElements,
        BlockStatements,
        SwitchClauses,
        SwitchClauseStatements,
        TypeMembers,
        ClassMembers,
        EnumMembers,
        HeritageClauseElement,
        VariableDeclarations,
        ObjectBindingElements,
        ArrayBindingElements,
        ArgumentExpressions,
        ObjectLiteralMembers,
        JsxAttributes,
        JsxChildren,
        ArrayLiteralMembers,
        Parameters,
        JSDocParameters,
        RestProperties,
        TypeParameters,
        TypeArguments,
        TupleElementTypes,
        HeritageClauses,
        ImportOrExportSpecifiers,
        Count // Number of parsing contexts
    }
    const enum Tristate {
        False,
        True,
        Unknown
    }
    export namespace JSDocParser {
        export function parseJSDocTypeExpressionForTests(content: string, start: number | undefined, length: number | undefined): {
            jsDocTypeExpression: ts.JSDocTypeExpression;
            diagnostics: ts.Diagnostic[];
        } | undefined {
            initializeState(content, ts.ScriptTarget.Latest, /*_syntaxCursor:*/ undefined, ts.ScriptKind.JS);
            sourceFile = createSourceFile("file.js", ts.ScriptTarget.Latest, ts.ScriptKind.JS, /*isDeclarationFile*/ false);
            scanner.setText(content, start, length);
            currentToken = scanner.scan();
            const jsDocTypeExpression = parseJSDocTypeExpression();
            const diagnostics = parseDiagnostics;
            clearState();
            return jsDocTypeExpression ? { jsDocTypeExpression, diagnostics } : undefined;
        }
        // Parses out a JSDoc type expression.
        export function parseJSDocTypeExpression(mayOmitBraces?: boolean): ts.JSDocTypeExpression {
            const result = (<ts.JSDocTypeExpression>createNode(ts.SyntaxKind.JSDocTypeExpression));
            const hasBrace = (mayOmitBraces ? parseOptional : parseExpected)(ts.SyntaxKind.OpenBraceToken);
            result.type = doInsideOfContext(ts.NodeFlags.JSDoc, parseJSDocType);
            if (!mayOmitBraces || hasBrace) {
                parseExpectedJSDoc(ts.SyntaxKind.CloseBraceToken);
            }
            fixupParentReferences(result);
            return finishNode(result);
        }
        export function parseIsolatedJSDocComment(content: string, start: number | undefined, length: number | undefined): {
            jsDoc: ts.JSDoc;
            diagnostics: ts.Diagnostic[];
        } | undefined {
            initializeState(content, ts.ScriptTarget.Latest, /*_syntaxCursor:*/ undefined, ts.ScriptKind.JS);
            sourceFile = (<ts.SourceFile>{ languageVariant: ts.LanguageVariant.Standard, text: content });
            const jsDoc = doInsideOfContext(ts.NodeFlags.JSDoc, () => parseJSDocCommentWorker(start, length));
            const diagnostics = parseDiagnostics;
            clearState();
            return jsDoc ? { jsDoc, diagnostics } : undefined;
        }
        export function parseJSDocComment(parent: ts.HasJSDoc, start: number, length: number): ts.JSDoc | undefined {
            const saveToken = currentToken;
            const saveParseDiagnosticsLength = parseDiagnostics.length;
            const saveParseErrorBeforeNextFinishedNode = parseErrorBeforeNextFinishedNode;
            const comment = doInsideOfContext(ts.NodeFlags.JSDoc, () => parseJSDocCommentWorker(start, length));
            if (comment) {
                comment.parent = parent;
            }
            if (contextFlags & ts.NodeFlags.JavaScriptFile) {
                if (!sourceFile.jsDocDiagnostics) {
                    sourceFile.jsDocDiagnostics = [];
                }
                sourceFile.jsDocDiagnostics.push(...parseDiagnostics);
            }
            currentToken = saveToken;
            parseDiagnostics.length = saveParseDiagnosticsLength;
            parseErrorBeforeNextFinishedNode = saveParseErrorBeforeNextFinishedNode;
            return comment;
        }
        const enum JSDocState {
            BeginningOfLine,
            SawAsterisk,
            SavingComments,
            SavingBackticks
        }
        const enum PropertyLikeParse {
            Property = 1 << 0,
            Parameter = 1 << 1,
            CallbackParameter = 1 << 2
        }
        function parseJSDocCommentWorker(start = 0, length: number | undefined): ts.JSDoc | undefined {
            const content = sourceText;
            const end = length === undefined ? content.length : start + length;
            length = end - start;
            ts.Debug.assert(start >= 0);
            ts.Debug.assert(start <= end);
            ts.Debug.assert(end <= content.length);
            // Check for /** (JSDoc opening part)
            if (!isJSDocLikeText(content, start)) {
                return undefined;
            }
            let tags: ts.JSDocTag[];
            let tagsPos: number;
            let tagsEnd: number;
            const comments: string[] = [];
            // + 3 for leading /**, - 5 in total for /** */
            return scanner.scanRange(start + 3, length - 5, () => {
                // Initially we can parse out a tag.  We also have seen a starting asterisk.
                // This is so that /** * @type */ doesn't parse.
                let state = JSDocState.SawAsterisk;
                let margin: number | undefined;
                // + 4 for leading '/** '
                let indent = start - Math.max(content.lastIndexOf("\n", start), 0) + 4;
                function pushComment(text: string) {
                    if (!margin) {
                        margin = indent;
                    }
                    comments.push(text);
                    indent += text.length;
                }
                nextTokenJSDoc();
                while (parseOptionalJsdoc(ts.SyntaxKind.WhitespaceTrivia))
                    ;
                if (parseOptionalJsdoc(ts.SyntaxKind.NewLineTrivia)) {
                    state = JSDocState.BeginningOfLine;
                    indent = 0;
                }
                loop: while (true) {
                    switch (token()) {
                        case ts.SyntaxKind.AtToken:
                            if (state === JSDocState.BeginningOfLine || state === JSDocState.SawAsterisk) {
                                removeTrailingWhitespace(comments);
                                addTag(parseTag(indent));
                                // NOTE: According to usejsdoc.org, a tag goes to end of line, except the last tag.
                                // Real-world comments may break this rule, so "BeginningOfLine" will not be a real line beginning
                                // for malformed examples like `/** @param {string} x @returns {number} the length */`
                                state = JSDocState.BeginningOfLine;
                                margin = undefined;
                            }
                            else {
                                pushComment(scanner.getTokenText());
                            }
                            break;
                        case ts.SyntaxKind.NewLineTrivia:
                            comments.push(scanner.getTokenText());
                            state = JSDocState.BeginningOfLine;
                            indent = 0;
                            break;
                        case ts.SyntaxKind.AsteriskToken:
                            const asterisk = scanner.getTokenText();
                            if (state === JSDocState.SawAsterisk || state === JSDocState.SavingComments) {
                                // If we've already seen an asterisk, then we can no longer parse a tag on this line
                                state = JSDocState.SavingComments;
                                pushComment(asterisk);
                            }
                            else {
                                // Ignore the first asterisk on a line
                                state = JSDocState.SawAsterisk;
                                indent += asterisk.length;
                            }
                            break;
                        case ts.SyntaxKind.WhitespaceTrivia:
                            // only collect whitespace if we're already saving comments or have just crossed the comment indent margin
                            const whitespace = scanner.getTokenText();
                            if (state === JSDocState.SavingComments) {
                                comments.push(whitespace);
                            }
                            else if (margin !== undefined && indent + whitespace.length > margin) {
                                comments.push(whitespace.slice(margin - indent - 1));
                            }
                            indent += whitespace.length;
                            break;
                        case ts.SyntaxKind.EndOfFileToken:
                            break loop;
                        default:
                            // Anything else is doc comment text. We just save it. Because it
                            // wasn't a tag, we can no longer parse a tag on this line until we hit the next
                            // line break.
                            state = JSDocState.SavingComments;
                            pushComment(scanner.getTokenText());
                            break;
                    }
                    nextTokenJSDoc();
                }
                removeLeadingNewlines(comments);
                removeTrailingWhitespace(comments);
                return createJSDocComment();
            });
            function removeLeadingNewlines(comments: string[]) {
                while (comments.length && (comments[0] === "\n" || comments[0] === "\r")) {
                    comments.shift();
                }
            }
            function removeTrailingWhitespace(comments: string[]) {
                while (comments.length && comments[comments.length - 1].trim() === "") {
                    comments.pop();
                }
            }
            function createJSDocComment(): ts.JSDoc {
                const result = (<ts.JSDoc>createNode(ts.SyntaxKind.JSDocComment, start));
                result.tags = tags && createNodeArray(tags, tagsPos, tagsEnd);
                result.comment = comments.length ? comments.join("") : undefined;
                return finishNode(result, end);
            }
            function isNextNonwhitespaceTokenEndOfFile(): boolean {
                // We must use infinite lookahead, as there could be any number of newlines :(
                while (true) {
                    nextTokenJSDoc();
                    if (token() === ts.SyntaxKind.EndOfFileToken) {
                        return true;
                    }
                    if (!(token() === ts.SyntaxKind.WhitespaceTrivia || token() === ts.SyntaxKind.NewLineTrivia)) {
                        return false;
                    }
                }
            }
            function skipWhitespace(): void {
                if (token() === ts.SyntaxKind.WhitespaceTrivia || token() === ts.SyntaxKind.NewLineTrivia) {
                    if (lookAhead(isNextNonwhitespaceTokenEndOfFile)) {
                        return; // Don't skip whitespace prior to EoF (or end of comment) - that shouldn't be included in any node's range
                    }
                }
                while (token() === ts.SyntaxKind.WhitespaceTrivia || token() === ts.SyntaxKind.NewLineTrivia) {
                    nextTokenJSDoc();
                }
            }
            function skipWhitespaceOrAsterisk(): string {
                if (token() === ts.SyntaxKind.WhitespaceTrivia || token() === ts.SyntaxKind.NewLineTrivia) {
                    if (lookAhead(isNextNonwhitespaceTokenEndOfFile)) {
                        return ""; // Don't skip whitespace prior to EoF (or end of comment) - that shouldn't be included in any node's range
                    }
                }
                let precedingLineBreak = scanner.hasPrecedingLineBreak();
                let seenLineBreak = false;
                let indentText = "";
                while ((precedingLineBreak && token() === ts.SyntaxKind.AsteriskToken) || token() === ts.SyntaxKind.WhitespaceTrivia || token() === ts.SyntaxKind.NewLineTrivia) {
                    indentText += scanner.getTokenText();
                    if (token() === ts.SyntaxKind.NewLineTrivia) {
                        precedingLineBreak = true;
                        seenLineBreak = true;
                        indentText = "";
                    }
                    else if (token() === ts.SyntaxKind.AsteriskToken) {
                        precedingLineBreak = false;
                    }
                    nextTokenJSDoc();
                }
                return seenLineBreak ? indentText : "";
            }
            function parseTag(margin: number) {
                ts.Debug.assert(token() === ts.SyntaxKind.AtToken);
                const start = scanner.getTokenPos();
                nextTokenJSDoc();
                const tagName = parseJSDocIdentifierName(/*message*/ undefined);
                const indentText = skipWhitespaceOrAsterisk();
                let tag: ts.JSDocTag | undefined;
                switch (tagName.escapedText) {
                    case "author":
                        tag = parseAuthorTag(start, tagName, margin);
                        break;
                    case "augments":
                    case "extends":
                        tag = parseAugmentsTag(start, tagName);
                        break;
                    case "class":
                    case "constructor":
                        tag = parseClassTag(start, tagName);
                        break;
                    case "this":
                        tag = parseThisTag(start, tagName);
                        break;
                    case "enum":
                        tag = parseEnumTag(start, tagName);
                        break;
                    case "arg":
                    case "argument":
                    case "param":
                        return parseParameterOrPropertyTag(start, tagName, PropertyLikeParse.Parameter, margin);
                    case "return":
                    case "returns":
                        tag = parseReturnTag(start, tagName);
                        break;
                    case "template":
                        tag = parseTemplateTag(start, tagName);
                        break;
                    case "type":
                        tag = parseTypeTag(start, tagName);
                        break;
                    case "typedef":
                        tag = parseTypedefTag(start, tagName, margin);
                        break;
                    case "callback":
                        tag = parseCallbackTag(start, tagName, margin);
                        break;
                    default:
                        tag = parseUnknownTag(start, tagName);
                        break;
                }
                if (!tag.comment) {
                    // some tags, like typedef and callback, have already parsed their comments earlier
                    if (!indentText) {
                        margin += tag.end - tag.pos;
                    }
                    tag.comment = parseTagComments(margin, indentText.slice(margin));
                }
                return tag;
            }
            function parseTagComments(indent: number, initialMargin?: string): string | undefined {
                const comments: string[] = [];
                let state = JSDocState.BeginningOfLine;
                let margin: number | undefined;
                function pushComment(text: string) {
                    if (!margin) {
                        margin = indent;
                    }
                    comments.push(text);
                    indent += text.length;
                }
                if (initialMargin) {
                    // jump straight to saving comments if there is some initial indentation
                    pushComment(initialMargin);
                    state = JSDocState.SavingComments;
                }
                let tok = (token() as ts.JSDocSyntaxKind);
                loop: while (true) {
                    switch (tok) {
                        case ts.SyntaxKind.NewLineTrivia:
                            if (state >= JSDocState.SawAsterisk) {
                                state = JSDocState.BeginningOfLine;
                                // don't use pushComment here because we want to keep the margin unchanged
                                comments.push(scanner.getTokenText());
                            }
                            indent = 0;
                            break;
                        case ts.SyntaxKind.AtToken:
                            if (state === JSDocState.SavingBackticks) {
                                comments.push(scanner.getTokenText());
                                break;
                            }
                            scanner.setTextPos(scanner.getTextPos() - 1);
                        // falls through
                        case ts.SyntaxKind.EndOfFileToken:
                            // Done
                            break loop;
                        case ts.SyntaxKind.WhitespaceTrivia:
                            if (state === JSDocState.SavingComments || state === JSDocState.SavingBackticks) {
                                pushComment(scanner.getTokenText());
                            }
                            else {
                                const whitespace = scanner.getTokenText();
                                // if the whitespace crosses the margin, take only the whitespace that passes the margin
                                if (margin !== undefined && indent + whitespace.length > margin) {
                                    comments.push(whitespace.slice(margin - indent));
                                }
                                indent += whitespace.length;
                            }
                            break;
                        case ts.SyntaxKind.OpenBraceToken:
                            state = JSDocState.SavingComments;
                            if (lookAhead(() => nextTokenJSDoc() === ts.SyntaxKind.AtToken && ts.tokenIsIdentifierOrKeyword(nextTokenJSDoc()) && scanner.getTokenText() === "link")) {
                                pushComment(scanner.getTokenText());
                                nextTokenJSDoc();
                                pushComment(scanner.getTokenText());
                                nextTokenJSDoc();
                            }
                            pushComment(scanner.getTokenText());
                            break;
                        case ts.SyntaxKind.BacktickToken:
                            if (state === JSDocState.SavingBackticks) {
                                state = JSDocState.SavingComments;
                            }
                            else {
                                state = JSDocState.SavingBackticks;
                            }
                            pushComment(scanner.getTokenText());
                            break;
                        case ts.SyntaxKind.AsteriskToken:
                            if (state === JSDocState.BeginningOfLine) {
                                // leading asterisks start recording on the *next* (non-whitespace) token
                                state = JSDocState.SawAsterisk;
                                indent += 1;
                                break;
                            }
                        // record the * as a comment
                        // falls through
                        default:
                            if (state !== JSDocState.SavingBackticks) {
                                state = JSDocState.SavingComments; // leading identifiers start recording as well
                            }
                            pushComment(scanner.getTokenText());
                            break;
                    }
                    tok = nextTokenJSDoc();
                }
                removeLeadingNewlines(comments);
                removeTrailingWhitespace(comments);
                return comments.length === 0 ? undefined : comments.join("");
            }
            function parseUnknownTag(start: number, tagName: ts.Identifier) {
                const result = (<ts.JSDocTag>createNode(ts.SyntaxKind.JSDocTag, start));
                result.tagName = tagName;
                return finishNode(result);
            }
            function addTag(tag: ts.JSDocTag | undefined): void {
                if (!tag) {
                    return;
                }
                if (!tags) {
                    tags = [tag];
                    tagsPos = tag.pos;
                }
                else {
                    tags.push(tag);
                }
                tagsEnd = tag.end;
            }
            function tryParseTypeExpression(): ts.JSDocTypeExpression | undefined {
                skipWhitespaceOrAsterisk();
                return token() === ts.SyntaxKind.OpenBraceToken ? parseJSDocTypeExpression() : undefined;
            }
            function parseBracketNameInPropertyAndParamTag(): {
                name: ts.EntityName;
                isBracketed: boolean;
            } {
                // Looking for something like '[foo]', 'foo', '[foo.bar]' or 'foo.bar'
                const isBracketed = parseOptionalJsdoc(ts.SyntaxKind.OpenBracketToken);
                if (isBracketed) {
                    skipWhitespace();
                }
                // a markdown-quoted name: `arg` is not legal jsdoc, but occurs in the wild
                const isBackquoted = parseOptionalJsdoc(ts.SyntaxKind.BacktickToken);
                const name = parseJSDocEntityName();
                if (isBackquoted) {
                    parseExpectedTokenJSDoc(ts.SyntaxKind.BacktickToken);
                }
                if (isBracketed) {
                    skipWhitespace();
                    // May have an optional default, e.g. '[foo = 42]'
                    if (parseOptionalToken(ts.SyntaxKind.EqualsToken)) {
                        parseExpression();
                    }
                    parseExpected(ts.SyntaxKind.CloseBracketToken);
                }
                return { name, isBracketed };
            }
            function isObjectOrObjectArrayTypeReference(node: ts.TypeNode): boolean {
                switch (node.kind) {
                    case ts.SyntaxKind.ObjectKeyword:
                        return true;
                    case ts.SyntaxKind.ArrayType:
                        return isObjectOrObjectArrayTypeReference((node as ts.ArrayTypeNode).elementType);
                    default:
                        return ts.isTypeReferenceNode(node) && ts.isIdentifier(node.typeName) && node.typeName.escapedText === "Object";
                }
            }
            function parseParameterOrPropertyTag(start: number, tagName: ts.Identifier, target: PropertyLikeParse, indent: number): ts.JSDocParameterTag | ts.JSDocPropertyTag {
                let typeExpression = tryParseTypeExpression();
                let isNameFirst = !typeExpression;
                skipWhitespaceOrAsterisk();
                const { name, isBracketed } = parseBracketNameInPropertyAndParamTag();
                skipWhitespace();
                if (isNameFirst) {
                    typeExpression = tryParseTypeExpression();
                }
                const result = target === PropertyLikeParse.Property ?
                    <ts.JSDocPropertyTag>createNode(ts.SyntaxKind.JSDocPropertyTag, start) :
                    <ts.JSDocParameterTag>createNode(ts.SyntaxKind.JSDocParameterTag, start);
                const comment = parseTagComments(indent + scanner.getStartPos() - start);
                const nestedTypeLiteral = target !== PropertyLikeParse.CallbackParameter && parseNestedTypeLiteral(typeExpression, name, target, indent);
                if (nestedTypeLiteral) {
                    typeExpression = nestedTypeLiteral;
                    isNameFirst = true;
                }
                result.tagName = tagName;
                result.typeExpression = typeExpression;
                result.name = name;
                result.isNameFirst = isNameFirst;
                result.isBracketed = isBracketed;
                result.comment = comment;
                return finishNode(result);
            }
            function parseNestedTypeLiteral(typeExpression: ts.JSDocTypeExpression | undefined, name: ts.EntityName, target: PropertyLikeParse, indent: number) {
                if (typeExpression && isObjectOrObjectArrayTypeReference(typeExpression.type)) {
                    const typeLiteralExpression = (<ts.JSDocTypeExpression>createNode(ts.SyntaxKind.JSDocTypeExpression, scanner.getTokenPos()));
                    let child: ts.JSDocPropertyLikeTag | ts.JSDocTypeTag | false;
                    let jsdocTypeLiteral: ts.JSDocTypeLiteral;
                    const start = scanner.getStartPos();
                    let children: ts.JSDocPropertyLikeTag[] | undefined;
                    while (child = tryParse(() => parseChildParameterOrPropertyTag(target, indent, name))) {
                        if (child.kind === ts.SyntaxKind.JSDocParameterTag || child.kind === ts.SyntaxKind.JSDocPropertyTag) {
                            children = ts.append(children, child);
                        }
                    }
                    if (children) {
                        jsdocTypeLiteral = (<ts.JSDocTypeLiteral>createNode(ts.SyntaxKind.JSDocTypeLiteral, start));
                        jsdocTypeLiteral.jsDocPropertyTags = children;
                        if (typeExpression.type.kind === ts.SyntaxKind.ArrayType) {
                            jsdocTypeLiteral.isArrayType = true;
                        }
                        typeLiteralExpression.type = finishNode(jsdocTypeLiteral);
                        return finishNode(typeLiteralExpression);
                    }
                }
            }
            function parseReturnTag(start: number, tagName: ts.Identifier): ts.JSDocReturnTag {
                if (ts.some(tags, ts.isJSDocReturnTag)) {
                    parseErrorAt(tagName.pos, scanner.getTokenPos(), ts.Diagnostics._0_tag_already_specified, tagName.escapedText);
                }
                const result = (<ts.JSDocReturnTag>createNode(ts.SyntaxKind.JSDocReturnTag, start));
                result.tagName = tagName;
                result.typeExpression = tryParseTypeExpression();
                return finishNode(result);
            }
            function parseTypeTag(start: number, tagName: ts.Identifier): ts.JSDocTypeTag {
                if (ts.some(tags, ts.isJSDocTypeTag)) {
                    parseErrorAt(tagName.pos, scanner.getTokenPos(), ts.Diagnostics._0_tag_already_specified, tagName.escapedText);
                }
                const result = (<ts.JSDocTypeTag>createNode(ts.SyntaxKind.JSDocTypeTag, start));
                result.tagName = tagName;
                result.typeExpression = parseJSDocTypeExpression(/*mayOmitBraces*/ true);
                return finishNode(result);
            }
            function parseAuthorTag(start: number, tagName: ts.Identifier, indent: number): ts.JSDocAuthorTag {
                const result = (<ts.JSDocAuthorTag>createNode(ts.SyntaxKind.JSDocAuthorTag, start));
                result.tagName = tagName;
                const authorInfoWithEmail = tryParse(() => tryParseAuthorNameAndEmail());
                if (!authorInfoWithEmail) {
                    return finishNode(result);
                }
                result.comment = authorInfoWithEmail;
                if (lookAhead(() => nextToken() !== ts.SyntaxKind.NewLineTrivia)) {
                    const comment = parseTagComments(indent);
                    if (comment) {
                        result.comment += comment;
                    }
                }
                return finishNode(result);
            }
            function tryParseAuthorNameAndEmail(): string | undefined {
                const comments: string[] = [];
                let seenLessThan = false;
                let seenGreaterThan = false;
                let token = scanner.getToken();
                loop: while (true) {
                    switch (token) {
                        case ts.SyntaxKind.Identifier:
                        case ts.SyntaxKind.WhitespaceTrivia:
                        case ts.SyntaxKind.DotToken:
                        case ts.SyntaxKind.AtToken:
                            comments.push(scanner.getTokenText());
                            break;
                        case ts.SyntaxKind.LessThanToken:
                            if (seenLessThan || seenGreaterThan) {
                                return;
                            }
                            seenLessThan = true;
                            comments.push(scanner.getTokenText());
                            break;
                        case ts.SyntaxKind.GreaterThanToken:
                            if (!seenLessThan || seenGreaterThan) {
                                return;
                            }
                            seenGreaterThan = true;
                            comments.push(scanner.getTokenText());
                            scanner.setTextPos(scanner.getTokenPos() + 1);
                            break loop;
                        case ts.SyntaxKind.NewLineTrivia:
                        case ts.SyntaxKind.EndOfFileToken:
                            break loop;
                    }
                    token = nextTokenJSDoc();
                }
                if (seenLessThan && seenGreaterThan) {
                    return comments.length === 0 ? undefined : comments.join("");
                }
            }
            function parseAugmentsTag(start: number, tagName: ts.Identifier): ts.JSDocAugmentsTag {
                const result = (<ts.JSDocAugmentsTag>createNode(ts.SyntaxKind.JSDocAugmentsTag, start));
                result.tagName = tagName;
                result.class = parseExpressionWithTypeArgumentsForAugments();
                return finishNode(result);
            }
            function parseExpressionWithTypeArgumentsForAugments(): ts.ExpressionWithTypeArguments & {
                expression: ts.Identifier | ts.PropertyAccessEntityNameExpression;
            } {
                const usedBrace = parseOptional(ts.SyntaxKind.OpenBraceToken);
                const node = (createNode(ts.SyntaxKind.ExpressionWithTypeArguments) as ts.ExpressionWithTypeArguments & {
                    expression: ts.Identifier | ts.PropertyAccessEntityNameExpression;
                });
                node.expression = parsePropertyAccessEntityNameExpression();
                node.typeArguments = tryParseTypeArguments();
                const res = finishNode(node);
                if (usedBrace) {
                    parseExpected(ts.SyntaxKind.CloseBraceToken);
                }
                return res;
            }
            function parsePropertyAccessEntityNameExpression() {
                let node: ts.Identifier | ts.PropertyAccessEntityNameExpression = parseJSDocIdentifierName();
                while (parseOptional(ts.SyntaxKind.DotToken)) {
                    const prop: ts.PropertyAccessEntityNameExpression = (createNode(ts.SyntaxKind.PropertyAccessExpression, node.pos) as ts.PropertyAccessEntityNameExpression);
                    prop.expression = node;
                    prop.name = parseJSDocIdentifierName();
                    node = finishNode(prop);
                }
                return node;
            }
            function parseClassTag(start: number, tagName: ts.Identifier): ts.JSDocClassTag {
                const tag = (<ts.JSDocClassTag>createNode(ts.SyntaxKind.JSDocClassTag, start));
                tag.tagName = tagName;
                return finishNode(tag);
            }
            function parseThisTag(start: number, tagName: ts.Identifier): ts.JSDocThisTag {
                const tag = (<ts.JSDocThisTag>createNode(ts.SyntaxKind.JSDocThisTag, start));
                tag.tagName = tagName;
                tag.typeExpression = parseJSDocTypeExpression(/*mayOmitBraces*/ true);
                skipWhitespace();
                return finishNode(tag);
            }
            function parseEnumTag(start: number, tagName: ts.Identifier): ts.JSDocEnumTag {
                const tag = (<ts.JSDocEnumTag>createNode(ts.SyntaxKind.JSDocEnumTag, start));
                tag.tagName = tagName;
                tag.typeExpression = parseJSDocTypeExpression(/*mayOmitBraces*/ true);
                skipWhitespace();
                return finishNode(tag);
            }
            function parseTypedefTag(start: number, tagName: ts.Identifier, indent: number): ts.JSDocTypedefTag {
                const typeExpression = tryParseTypeExpression();
                skipWhitespaceOrAsterisk();
                const typedefTag = (<ts.JSDocTypedefTag>createNode(ts.SyntaxKind.JSDocTypedefTag, start));
                typedefTag.tagName = tagName;
                typedefTag.fullName = parseJSDocTypeNameWithNamespace();
                typedefTag.name = getJSDocTypeAliasName(typedefTag.fullName);
                skipWhitespace();
                typedefTag.comment = parseTagComments(indent);
                typedefTag.typeExpression = typeExpression;
                let end: number | undefined;
                if (!typeExpression || isObjectOrObjectArrayTypeReference(typeExpression.type)) {
                    let child: ts.JSDocTypeTag | ts.JSDocPropertyTag | false;
                    let jsdocTypeLiteral: ts.JSDocTypeLiteral | undefined;
                    let childTypeTag: ts.JSDocTypeTag | undefined;
                    while (child = tryParse(() => parseChildPropertyTag(indent))) {
                        if (!jsdocTypeLiteral) {
                            jsdocTypeLiteral = (<ts.JSDocTypeLiteral>createNode(ts.SyntaxKind.JSDocTypeLiteral, start));
                        }
                        if (child.kind === ts.SyntaxKind.JSDocTypeTag) {
                            if (childTypeTag) {
                                break;
                            }
                            else {
                                childTypeTag = child;
                            }
                        }
                        else {
                            jsdocTypeLiteral.jsDocPropertyTags = ts.append((jsdocTypeLiteral.jsDocPropertyTags as ts.MutableNodeArray<ts.JSDocPropertyTag>), child);
                        }
                    }
                    if (jsdocTypeLiteral) {
                        if (typeExpression && typeExpression.type.kind === ts.SyntaxKind.ArrayType) {
                            jsdocTypeLiteral.isArrayType = true;
                        }
                        typedefTag.typeExpression = childTypeTag && childTypeTag.typeExpression && !isObjectOrObjectArrayTypeReference(childTypeTag.typeExpression.type) ?
                            childTypeTag.typeExpression :
                            finishNode(jsdocTypeLiteral);
                        end = typedefTag.typeExpression.end;
                    }
                }
                // Only include the characters between the name end and the next token if a comment was actually parsed out - otherwise it's just whitespace
                return finishNode(typedefTag, end || typedefTag.comment !== undefined ? scanner.getStartPos() : (typedefTag.fullName || typedefTag.typeExpression || typedefTag.tagName).end);
            }
            function parseJSDocTypeNameWithNamespace(nested?: boolean) {
                const pos = scanner.getTokenPos();
                if (!ts.tokenIsIdentifierOrKeyword(token())) {
                    return undefined;
                }
                const typeNameOrNamespaceName = parseJSDocIdentifierName();
                if (parseOptional(ts.SyntaxKind.DotToken)) {
                    const jsDocNamespaceNode = (<ts.JSDocNamespaceDeclaration>createNode(ts.SyntaxKind.ModuleDeclaration, pos));
                    if (nested) {
                        jsDocNamespaceNode.flags |= ts.NodeFlags.NestedNamespace;
                    }
                    jsDocNamespaceNode.name = typeNameOrNamespaceName;
                    jsDocNamespaceNode.body = parseJSDocTypeNameWithNamespace(/*nested*/ true);
                    return finishNode(jsDocNamespaceNode);
                }
                if (nested) {
                    typeNameOrNamespaceName.isInJSDocNamespace = true;
                }
                return typeNameOrNamespaceName;
            }
            function parseCallbackTag(start: number, tagName: ts.Identifier, indent: number): ts.JSDocCallbackTag {
                const callbackTag = (createNode(ts.SyntaxKind.JSDocCallbackTag, start) as ts.JSDocCallbackTag);
                callbackTag.tagName = tagName;
                callbackTag.fullName = parseJSDocTypeNameWithNamespace();
                callbackTag.name = getJSDocTypeAliasName(callbackTag.fullName);
                skipWhitespace();
                callbackTag.comment = parseTagComments(indent);
                let child: ts.JSDocParameterTag | false;
                const jsdocSignature = (createNode(ts.SyntaxKind.JSDocSignature, start) as ts.JSDocSignature);
                jsdocSignature.parameters = [];
                while (child = tryParse(() => parseChildParameterOrPropertyTag(PropertyLikeParse.CallbackParameter, indent) as ts.JSDocParameterTag)) {
                    jsdocSignature.parameters = ts.append((jsdocSignature.parameters as ts.MutableNodeArray<ts.JSDocParameterTag>), child);
                }
                const returnTag = tryParse(() => {
                    if (parseOptionalJsdoc(ts.SyntaxKind.AtToken)) {
                        const tag = parseTag(indent);
                        if (tag && tag.kind === ts.SyntaxKind.JSDocReturnTag) {
                            return tag as ts.JSDocReturnTag;
                        }
                    }
                });
                if (returnTag) {
                    jsdocSignature.type = returnTag;
                }
                callbackTag.typeExpression = finishNode(jsdocSignature);
                return finishNode(callbackTag);
            }
            function getJSDocTypeAliasName(fullName: ts.JSDocNamespaceBody | undefined) {
                if (fullName) {
                    let rightNode = fullName;
                    while (true) {
                        if (ts.isIdentifier(rightNode) || !rightNode.body) {
                            return ts.isIdentifier(rightNode) ? rightNode : rightNode.name;
                        }
                        rightNode = rightNode.body;
                    }
                }
            }
            function escapedTextsEqual(a: ts.EntityName, b: ts.EntityName): boolean {
                while (!ts.isIdentifier(a) || !ts.isIdentifier(b)) {
                    if (!ts.isIdentifier(a) && !ts.isIdentifier(b) && a.right.escapedText === b.right.escapedText) {
                        a = a.left;
                        b = b.left;
                    }
                    else {
                        return false;
                    }
                }
                return a.escapedText === b.escapedText;
            }
            function parseChildPropertyTag(indent: number) {
                return parseChildParameterOrPropertyTag(PropertyLikeParse.Property, indent) as ts.JSDocTypeTag | ts.JSDocPropertyTag | false;
            }
            function parseChildParameterOrPropertyTag(target: PropertyLikeParse, indent: number, name?: ts.EntityName): ts.JSDocTypeTag | ts.JSDocPropertyTag | ts.JSDocParameterTag | false {
                let canParseTag = true;
                let seenAsterisk = false;
                while (true) {
                    switch (nextTokenJSDoc()) {
                        case ts.SyntaxKind.AtToken:
                            if (canParseTag) {
                                const child = tryParseChildTag(target, indent);
                                if (child && (child.kind === ts.SyntaxKind.JSDocParameterTag || child.kind === ts.SyntaxKind.JSDocPropertyTag) &&
                                    target !== PropertyLikeParse.CallbackParameter &&
                                    name && (ts.isIdentifier(child.name) || !escapedTextsEqual(name, child.name.left))) {
                                    return false;
                                }
                                return child;
                            }
                            seenAsterisk = false;
                            break;
                        case ts.SyntaxKind.NewLineTrivia:
                            canParseTag = true;
                            seenAsterisk = false;
                            break;
                        case ts.SyntaxKind.AsteriskToken:
                            if (seenAsterisk) {
                                canParseTag = false;
                            }
                            seenAsterisk = true;
                            break;
                        case ts.SyntaxKind.Identifier:
                            canParseTag = false;
                            break;
                        case ts.SyntaxKind.EndOfFileToken:
                            return false;
                    }
                }
            }
            function tryParseChildTag(target: PropertyLikeParse, indent: number): ts.JSDocTypeTag | ts.JSDocPropertyTag | ts.JSDocParameterTag | false {
                ts.Debug.assert(token() === ts.SyntaxKind.AtToken);
                const start = scanner.getStartPos();
                nextTokenJSDoc();
                const tagName = parseJSDocIdentifierName();
                skipWhitespace();
                let t: PropertyLikeParse;
                switch (tagName.escapedText) {
                    case "type":
                        return target === PropertyLikeParse.Property && parseTypeTag(start, tagName);
                    case "prop":
                    case "property":
                        t = PropertyLikeParse.Property;
                        break;
                    case "arg":
                    case "argument":
                    case "param":
                        t = PropertyLikeParse.Parameter | PropertyLikeParse.CallbackParameter;
                        break;
                    default:
                        return false;
                }
                if (!(target & t)) {
                    return false;
                }
                return parseParameterOrPropertyTag(start, tagName, target, indent);
            }
            function parseTemplateTag(start: number, tagName: ts.Identifier): ts.JSDocTemplateTag {
                // the template tag looks like '@template {Constraint} T,U,V'
                let constraint: ts.JSDocTypeExpression | undefined;
                if (token() === ts.SyntaxKind.OpenBraceToken) {
                    constraint = parseJSDocTypeExpression();
                }
                const typeParameters = [];
                const typeParametersPos = getNodePos();
                do {
                    skipWhitespace();
                    const typeParameter = (<ts.TypeParameterDeclaration>createNode(ts.SyntaxKind.TypeParameter));
                    typeParameter.name = parseJSDocIdentifierName(ts.Diagnostics.Unexpected_token_A_type_parameter_name_was_expected_without_curly_braces);
                    finishNode(typeParameter);
                    skipWhitespace();
                    typeParameters.push(typeParameter);
                } while (parseOptionalJsdoc(ts.SyntaxKind.CommaToken));
                const result = (<ts.JSDocTemplateTag>createNode(ts.SyntaxKind.JSDocTemplateTag, start));
                result.tagName = tagName;
                result.constraint = constraint;
                result.typeParameters = createNodeArray(typeParameters, typeParametersPos);
                finishNode(result);
                return result;
            }
            function parseOptionalJsdoc(t: ts.JSDocSyntaxKind): boolean {
                if (token() === t) {
                    nextTokenJSDoc();
                    return true;
                }
                return false;
            }
            function parseJSDocEntityName(): ts.EntityName {
                let entity: ts.EntityName = parseJSDocIdentifierName();
                if (parseOptional(ts.SyntaxKind.OpenBracketToken)) {
                    parseExpected(ts.SyntaxKind.CloseBracketToken);
                    // Note that y[] is accepted as an entity name, but the postfix brackets are not saved for checking.
                    // Technically usejsdoc.org requires them for specifying a property of a type equivalent to Array<{ x: ...}>
                    // but it's not worth it to enforce that restriction.
                }
                while (parseOptional(ts.SyntaxKind.DotToken)) {
                    const name = parseJSDocIdentifierName();
                    if (parseOptional(ts.SyntaxKind.OpenBracketToken)) {
                        parseExpected(ts.SyntaxKind.CloseBracketToken);
                    }
                    entity = createQualifiedName(entity, name);
                }
                return entity;
            }
            function parseJSDocIdentifierName(message?: ts.DiagnosticMessage): ts.Identifier {
                if (!ts.tokenIsIdentifierOrKeyword(token())) {
                    return createMissingNode<ts.Identifier>(ts.SyntaxKind.Identifier, /*reportAtCurrentPosition*/ !message, message || ts.Diagnostics.Identifier_expected);
                }
                identifierCount++;
                const pos = scanner.getTokenPos();
                const end = scanner.getTextPos();
                const result = (<ts.Identifier>createNode(ts.SyntaxKind.Identifier, pos));
                if (token() !== ts.SyntaxKind.Identifier) {
                    result.originalKeywordKind = token();
                }
                result.escapedText = ts.escapeLeadingUnderscores(internIdentifier(scanner.getTokenValue()));
                finishNode(result, end);
                nextTokenJSDoc();
                return result;
            }
        }
    }
}
namespace IncrementalParser {
    export function updateSourceFile(sourceFile: ts.SourceFile, newText: string, textChangeRange: ts.TextChangeRange, aggressiveChecks: boolean): ts.SourceFile {
        aggressiveChecks = aggressiveChecks || ts.Debug.shouldAssert(ts.AssertionLevel.Aggressive);
        checkChangeRange(sourceFile, newText, textChangeRange, aggressiveChecks);
        if (ts.textChangeRangeIsUnchanged(textChangeRange)) {
            // if the text didn't change, then we can just return our current source file as-is.
            return sourceFile;
        }
        if (sourceFile.statements.length === 0) {
            // If we don't have any statements in the current source file, then there's no real
            // way to incrementally parse.  So just do a full parse instead.
            return Parser.parseSourceFile(sourceFile.fileName, newText, sourceFile.languageVersion, /*syntaxCursor*/ undefined, /*setParentNodes*/ true, sourceFile.scriptKind);
        }
        // Make sure we're not trying to incrementally update a source file more than once.  Once
        // we do an update the original source file is considered unusable from that point onwards.
        //
        // This is because we do incremental parsing in-place.  i.e. we take nodes from the old
        // tree and give them new positions and parents.  From that point on, trusting the old
        // tree at all is not possible as far too much of it may violate invariants.
        const incrementalSourceFile = (<IncrementalNode><ts.Node>sourceFile);
        ts.Debug.assert(!incrementalSourceFile.hasBeenIncrementallyParsed);
        incrementalSourceFile.hasBeenIncrementallyParsed = true;
        const oldText = sourceFile.text;
        const syntaxCursor = createSyntaxCursor(sourceFile);
        // Make the actual change larger so that we know to reparse anything whose lookahead
        // might have intersected the change.
        const changeRange = extendToAffectedRange(sourceFile, textChangeRange);
        checkChangeRange(sourceFile, newText, changeRange, aggressiveChecks);
        // Ensure that extending the affected range only moved the start of the change range
        // earlier in the file.
        ts.Debug.assert(changeRange.span.start <= textChangeRange.span.start);
        ts.Debug.assert(ts.textSpanEnd(changeRange.span) === ts.textSpanEnd(textChangeRange.span));
        ts.Debug.assert(ts.textSpanEnd(ts.textChangeRangeNewSpan(changeRange)) === ts.textSpanEnd(ts.textChangeRangeNewSpan(textChangeRange)));
        // The is the amount the nodes after the edit range need to be adjusted.  It can be
        // positive (if the edit added characters), negative (if the edit deleted characters)
        // or zero (if this was a pure overwrite with nothing added/removed).
        const delta = ts.textChangeRangeNewSpan(changeRange).length - changeRange.span.length;
        // If we added or removed characters during the edit, then we need to go and adjust all
        // the nodes after the edit.  Those nodes may move forward (if we inserted chars) or they
        // may move backward (if we deleted chars).
        //
        // Doing this helps us out in two ways.  First, it means that any nodes/tokens we want
        // to reuse are already at the appropriate position in the new text.  That way when we
        // reuse them, we don't have to figure out if they need to be adjusted.  Second, it makes
        // it very easy to determine if we can reuse a node.  If the node's position is at where
        // we are in the text, then we can reuse it.  Otherwise we can't.  If the node's position
        // is ahead of us, then we'll need to rescan tokens.  If the node's position is behind
        // us, then we'll need to skip it or crumble it as appropriate
        //
        // We will also adjust the positions of nodes that intersect the change range as well.
        // By doing this, we ensure that all the positions in the old tree are consistent, not
        // just the positions of nodes entirely before/after the change range.  By being
        // consistent, we can then easily map from positions to nodes in the old tree easily.
        //
        // Also, mark any syntax elements that intersect the changed span.  We know, up front,
        // that we cannot reuse these elements.
        updateTokenPositionsAndMarkElements(incrementalSourceFile, changeRange.span.start, ts.textSpanEnd(changeRange.span), ts.textSpanEnd(ts.textChangeRangeNewSpan(changeRange)), delta, oldText, newText, aggressiveChecks);
        // Now that we've set up our internal incremental state just proceed and parse the
        // source file in the normal fashion.  When possible the parser will retrieve and
        // reuse nodes from the old tree.
        //
        // Note: passing in 'true' for setNodeParents is very important.  When incrementally
        // parsing, we will be reusing nodes from the old tree, and placing it into new
        // parents.  If we don't set the parents now, we'll end up with an observably
        // inconsistent tree.  Setting the parents on the new tree should be very fast.  We
        // will immediately bail out of walking any subtrees when we can see that their parents
        // are already correct.
        const result = Parser.parseSourceFile(sourceFile.fileName, newText, sourceFile.languageVersion, syntaxCursor, /*setParentNodes*/ true, sourceFile.scriptKind);
        return result;
    }
    function moveElementEntirelyPastChangeRange(element: IncrementalElement, isArray: boolean, delta: number, oldText: string, newText: string, aggressiveChecks: boolean) {
        if (isArray) {
            visitArray(<IncrementalNodeArray>element);
        }
        else {
            visitNode(<IncrementalNode>element);
        }
        return;
        function visitNode(node: IncrementalNode) {
            let text = "";
            if (aggressiveChecks && shouldCheckNode(node)) {
                text = oldText.substring(node.pos, node.end);
            }
            // Ditch any existing LS children we may have created.  This way we can avoid
            // moving them forward.
            if (node._children) {
                node._children = undefined;
            }
            node.pos += delta;
            node.end += delta;
            if (aggressiveChecks && shouldCheckNode(node)) {
                ts.Debug.assert(text === newText.substring(node.pos, node.end));
            }
            forEachChild(node, visitNode, visitArray);
            if (ts.hasJSDocNodes(node)) {
                for (const jsDocComment of node.jsDoc!) {
                    visitNode((<IncrementalNode><ts.Node>jsDocComment));
                }
            }
            checkNodePositions(node, aggressiveChecks);
        }
        function visitArray(array: IncrementalNodeArray) {
            array._children = undefined;
            array.pos += delta;
            array.end += delta;
            for (const node of array) {
                visitNode(node);
            }
        }
    }
    function shouldCheckNode(node: ts.Node) {
        switch (node.kind) {
            case ts.SyntaxKind.StringLiteral:
            case ts.SyntaxKind.NumericLiteral:
            case ts.SyntaxKind.Identifier:
                return true;
        }
        return false;
    }
    function adjustIntersectingElement(element: IncrementalElement, changeStart: number, changeRangeOldEnd: number, changeRangeNewEnd: number, delta: number) {
        ts.Debug.assert(element.end >= changeStart, "Adjusting an element that was entirely before the change range");
        ts.Debug.assert(element.pos <= changeRangeOldEnd, "Adjusting an element that was entirely after the change range");
        ts.Debug.assert(element.pos <= element.end);
        // We have an element that intersects the change range in some way.  It may have its
        // start, or its end (or both) in the changed range.  We want to adjust any part
        // that intersects such that the final tree is in a consistent state.  i.e. all
        // children have spans within the span of their parent, and all siblings are ordered
        // properly.
        // We may need to update both the 'pos' and the 'end' of the element.
        // If the 'pos' is before the start of the change, then we don't need to touch it.
        // If it isn't, then the 'pos' must be inside the change.  How we update it will
        // depend if delta is positive or negative. If delta is positive then we have
        // something like:
        //
        //  -------------------AAA-----------------
        //  -------------------BBBCCCCCCC-----------------
        //
        // In this case, we consider any node that started in the change range to still be
        // starting at the same position.
        //
        // however, if the delta is negative, then we instead have something like this:
        //
        //  -------------------XXXYYYYYYY-----------------
        //  -------------------ZZZ-----------------
        //
        // In this case, any element that started in the 'X' range will keep its position.
        // However any element that started after that will have their pos adjusted to be
        // at the end of the new range.  i.e. any node that started in the 'Y' range will
        // be adjusted to have their start at the end of the 'Z' range.
        //
        // The element will keep its position if possible.  Or Move backward to the new-end
        // if it's in the 'Y' range.
        element.pos = Math.min(element.pos, changeRangeNewEnd);
        // If the 'end' is after the change range, then we always adjust it by the delta
        // amount.  However, if the end is in the change range, then how we adjust it
        // will depend on if delta is positive or negative.  If delta is positive then we
        // have something like:
        //
        //  -------------------AAA-----------------
        //  -------------------BBBCCCCCCC-----------------
        //
        // In this case, we consider any node that ended inside the change range to keep its
        // end position.
        //
        // however, if the delta is negative, then we instead have something like this:
        //
        //  -------------------XXXYYYYYYY-----------------
        //  -------------------ZZZ-----------------
        //
        // In this case, any element that ended in the 'X' range will keep its position.
        // However any element that ended after that will have their pos adjusted to be
        // at the end of the new range.  i.e. any node that ended in the 'Y' range will
        // be adjusted to have their end at the end of the 'Z' range.
        if (element.end >= changeRangeOldEnd) {
            // Element ends after the change range.  Always adjust the end pos.
            element.end += delta;
        }
        else {
            // Element ends in the change range.  The element will keep its position if
            // possible. Or Move backward to the new-end if it's in the 'Y' range.
            element.end = Math.min(element.end, changeRangeNewEnd);
        }
        ts.Debug.assert(element.pos <= element.end);
        if (element.parent) {
            ts.Debug.assert(element.pos >= element.parent.pos);
            ts.Debug.assert(element.end <= element.parent.end);
        }
    }
    function checkNodePositions(node: ts.Node, aggressiveChecks: boolean) {
        if (aggressiveChecks) {
            let pos = node.pos;
            const visitNode = (child: ts.Node) => {
                ts.Debug.assert(child.pos >= pos);
                pos = child.end;
            };
            if (ts.hasJSDocNodes(node)) {
                for (const jsDocComment of node.jsDoc!) {
                    visitNode(jsDocComment);
                }
            }
            forEachChild(node, visitNode);
            ts.Debug.assert(pos <= node.end);
        }
    }
    function updateTokenPositionsAndMarkElements(sourceFile: IncrementalNode, changeStart: number, changeRangeOldEnd: number, changeRangeNewEnd: number, delta: number, oldText: string, newText: string, aggressiveChecks: boolean): void {
        visitNode(sourceFile);
        return;
        function visitNode(child: IncrementalNode) {
            ts.Debug.assert(child.pos <= child.end);
            if (child.pos > changeRangeOldEnd) {
                // Node is entirely past the change range.  We need to move both its pos and
                // end, forward or backward appropriately.
                moveElementEntirelyPastChangeRange(child, /*isArray*/ false, delta, oldText, newText, aggressiveChecks);
                return;
            }
            // Check if the element intersects the change range.  If it does, then it is not
            // reusable.  Also, we'll need to recurse to see what constituent portions we may
            // be able to use.
            const fullEnd = child.end;
            if (fullEnd >= changeStart) {
                child.intersectsChange = true;
                child._children = undefined;
                // Adjust the pos or end (or both) of the intersecting element accordingly.
                adjustIntersectingElement(child, changeStart, changeRangeOldEnd, changeRangeNewEnd, delta);
                forEachChild(child, visitNode, visitArray);
                if (ts.hasJSDocNodes(child)) {
                    for (const jsDocComment of child.jsDoc!) {
                        visitNode((<IncrementalNode><ts.Node>jsDocComment));
                    }
                }
                checkNodePositions(child, aggressiveChecks);
                return;
            }
            // Otherwise, the node is entirely before the change range.  No need to do anything with it.
            ts.Debug.assert(fullEnd < changeStart);
        }
        function visitArray(array: IncrementalNodeArray) {
            ts.Debug.assert(array.pos <= array.end);
            if (array.pos > changeRangeOldEnd) {
                // Array is entirely after the change range.  We need to move it, and move any of
                // its children.
                moveElementEntirelyPastChangeRange(array, /*isArray*/ true, delta, oldText, newText, aggressiveChecks);
                return;
            }
            // Check if the element intersects the change range.  If it does, then it is not
            // reusable.  Also, we'll need to recurse to see what constituent portions we may
            // be able to use.
            const fullEnd = array.end;
            if (fullEnd >= changeStart) {
                array.intersectsChange = true;
                array._children = undefined;
                // Adjust the pos or end (or both) of the intersecting array accordingly.
                adjustIntersectingElement(array, changeStart, changeRangeOldEnd, changeRangeNewEnd, delta);
                for (const node of array) {
                    visitNode(node);
                }
                return;
            }
            // Otherwise, the array is entirely before the change range.  No need to do anything with it.
            ts.Debug.assert(fullEnd < changeStart);
        }
    }
    function extendToAffectedRange(sourceFile: ts.SourceFile, changeRange: ts.TextChangeRange): ts.TextChangeRange {
        // Consider the following code:
        //      void foo() { /; }
        //
        // If the text changes with an insertion of / just before the semicolon then we end up with:
        //      void foo() { //; }
        //
        // If we were to just use the changeRange a is, then we would not rescan the { token
        // (as it does not intersect the actual original change range).  Because an edit may
        // change the token touching it, we actually need to look back *at least* one token so
        // that the prior token sees that change.
        const maxLookahead = 1;
        let start = changeRange.span.start;
        // the first iteration aligns us with the change start. subsequent iteration move us to
        // the left by maxLookahead tokens.  We only need to do this as long as we're not at the
        // start of the tree.
        for (let i = 0; start > 0 && i <= maxLookahead; i++) {
            const nearestNode = findNearestNodeStartingBeforeOrAtPosition(sourceFile, start);
            ts.Debug.assert(nearestNode.pos <= start);
            const position = nearestNode.pos;
            start = Math.max(0, position - 1);
        }
        const finalSpan = ts.createTextSpanFromBounds(start, ts.textSpanEnd(changeRange.span));
        const finalLength = changeRange.newLength + (changeRange.span.start - start);
        return ts.createTextChangeRange(finalSpan, finalLength);
    }
    function findNearestNodeStartingBeforeOrAtPosition(sourceFile: ts.SourceFile, position: number): ts.Node {
        let bestResult: ts.Node = sourceFile;
        let lastNodeEntirelyBeforePosition: ts.Node | undefined;
        forEachChild(sourceFile, visit);
        if (lastNodeEntirelyBeforePosition) {
            const lastChildOfLastEntireNodeBeforePosition = getLastDescendant(lastNodeEntirelyBeforePosition);
            if (lastChildOfLastEntireNodeBeforePosition.pos > bestResult.pos) {
                bestResult = lastChildOfLastEntireNodeBeforePosition;
            }
        }
        return bestResult;
        function getLastDescendant(node: ts.Node): ts.Node {
            while (true) {
                const lastChild = ts.getLastChild(node);
                if (lastChild) {
                    node = lastChild;
                }
                else {
                    return node;
                }
            }
        }
        function visit(child: ts.Node) {
            if (ts.nodeIsMissing(child)) {
                // Missing nodes are effectively invisible to us.  We never even consider them
                // When trying to find the nearest node before us.
                return;
            }
            // If the child intersects this position, then this node is currently the nearest
            // node that starts before the position.
            if (child.pos <= position) {
                if (child.pos >= bestResult.pos) {
                    // This node starts before the position, and is closer to the position than
                    // the previous best node we found.  It is now the new best node.
                    bestResult = child;
                }
                // Now, the node may overlap the position, or it may end entirely before the
                // position.  If it overlaps with the position, then either it, or one of its
                // children must be the nearest node before the position.  So we can just
                // recurse into this child to see if we can find something better.
                if (position < child.end) {
                    // The nearest node is either this child, or one of the children inside
                    // of it.  We've already marked this child as the best so far.  Recurse
                    // in case one of the children is better.
                    forEachChild(child, visit);
                    // Once we look at the children of this node, then there's no need to
                    // continue any further.
                    return true;
                }
                else {
                    ts.Debug.assert(child.end <= position);
                    // The child ends entirely before this position.  Say you have the following
                    // (where $ is the position)
                    //
                    //      <complex expr 1> ? <complex expr 2> $ : <...> <...>
                    //
                    // We would want to find the nearest preceding node in "complex expr 2".
                    // To support that, we keep track of this node, and once we're done searching
                    // for a best node, we recurse down this node to see if we can find a good
                    // result in it.
                    //
                    // This approach allows us to quickly skip over nodes that are entirely
                    // before the position, while still allowing us to find any nodes in the
                    // last one that might be what we want.
                    lastNodeEntirelyBeforePosition = child;
                }
            }
            else {
                ts.Debug.assert(child.pos > position);
                // We're now at a node that is entirely past the position we're searching for.
                // This node (and all following nodes) could never contribute to the result,
                // so just skip them by returning 'true' here.
                return true;
            }
        }
    }
    function checkChangeRange(sourceFile: ts.SourceFile, newText: string, textChangeRange: ts.TextChangeRange, aggressiveChecks: boolean) {
        const oldText = sourceFile.text;
        if (textChangeRange) {
            ts.Debug.assert((oldText.length - textChangeRange.span.length + textChangeRange.newLength) === newText.length);
            if (aggressiveChecks || ts.Debug.shouldAssert(ts.AssertionLevel.VeryAggressive)) {
                const oldTextPrefix = oldText.substr(0, textChangeRange.span.start);
                const newTextPrefix = newText.substr(0, textChangeRange.span.start);
                ts.Debug.assert(oldTextPrefix === newTextPrefix);
                const oldTextSuffix = oldText.substring(ts.textSpanEnd(textChangeRange.span), oldText.length);
                const newTextSuffix = newText.substring(ts.textSpanEnd(ts.textChangeRangeNewSpan(textChangeRange)), newText.length);
                ts.Debug.assert(oldTextSuffix === newTextSuffix);
            }
        }
    }
    interface IncrementalElement extends ts.TextRange {
        parent: ts.Node;
        intersectsChange: boolean;
        length?: number;
        _children: ts.Node[] | undefined;
    }
    export interface IncrementalNode extends ts.Node, IncrementalElement {
        hasBeenIncrementallyParsed: boolean;
    }
    interface IncrementalNodeArray extends ts.NodeArray<IncrementalNode>, IncrementalElement {
        length: number;
    }
    // Allows finding nodes in the source file at a certain position in an efficient manner.
    // The implementation takes advantage of the calling pattern it knows the parser will
    // make in order to optimize finding nodes as quickly as possible.
    export interface SyntaxCursor {
        currentNode(position: number): IncrementalNode;
    }
    function createSyntaxCursor(sourceFile: ts.SourceFile): SyntaxCursor {
        let currentArray: ts.NodeArray<ts.Node> = sourceFile.statements;
        let currentArrayIndex = 0;
        ts.Debug.assert(currentArrayIndex < currentArray.length);
        let current = currentArray[currentArrayIndex];
        let lastQueriedPosition = InvalidPosition.Value;
        return {
            currentNode(position: number) {
                // Only compute the current node if the position is different than the last time
                // we were asked.  The parser commonly asks for the node at the same position
                // twice.  Once to know if can read an appropriate list element at a certain point,
                // and then to actually read and consume the node.
                if (position !== lastQueriedPosition) {
                    // Much of the time the parser will need the very next node in the array that
                    // we just returned a node from.So just simply check for that case and move
                    // forward in the array instead of searching for the node again.
                    if (current && current.end === position && currentArrayIndex < (currentArray.length - 1)) {
                        currentArrayIndex++;
                        current = currentArray[currentArrayIndex];
                    }
                    // If we don't have a node, or the node we have isn't in the right position,
                    // then try to find a viable node at the position requested.
                    if (!current || current.pos !== position) {
                        findHighestListElementThatStartsAtPosition(position);
                    }
                }
                // Cache this query so that we don't do any extra work if the parser calls back
                // into us.  Note: this is very common as the parser will make pairs of calls like
                // 'isListElement -> parseListElement'.  If we were unable to find a node when
                // called with 'isListElement', we don't want to redo the work when parseListElement
                // is called immediately after.
                lastQueriedPosition = position;
                // Either we don'd have a node, or we have a node at the position being asked for.
                ts.Debug.assert(!current || current.pos === position);
                return <IncrementalNode>current;
            }
        };
        // Finds the highest element in the tree we can find that starts at the provided position.
        // The element must be a direct child of some node list in the tree.  This way after we
        // return it, we can easily return its next sibling in the list.
        function findHighestListElementThatStartsAtPosition(position: number) {
            // Clear out any cached state about the last node we found.
            currentArray = undefined!;
            currentArrayIndex = InvalidPosition.Value;
            current = undefined!;
            // Recurse into the source file to find the highest node at this position.
            forEachChild(sourceFile, visitNode, visitArray);
            return;
            function visitNode(node: ts.Node) {
                if (position >= node.pos && position < node.end) {
                    // Position was within this node.  Keep searching deeper to find the node.
                    forEachChild(node, visitNode, visitArray);
                    // don't proceed any further in the search.
                    return true;
                }
                // position wasn't in this node, have to keep searching.
                return false;
            }
            function visitArray(array: ts.NodeArray<ts.Node>) {
                if (position >= array.pos && position < array.end) {
                    // position was in this array.  Search through this array to see if we find a
                    // viable element.
                    for (let i = 0; i < array.length; i++) {
                        const child = array[i];
                        if (child) {
                            if (child.pos === position) {
                                // Found the right node.  We're done.
                                currentArray = array;
                                currentArrayIndex = i;
                                current = child;
                                return true;
                            }
                            else {
                                if (child.pos < position && position < child.end) {
                                    // Position in somewhere within this child.  Search in it and
                                    // stop searching in this array.
                                    forEachChild(child, visitNode, visitArray);
                                    return true;
                                }
                            }
                        }
                    }
                }
                // position wasn't in this array, have to keep searching.
                return false;
            }
        }
    }
    const enum InvalidPosition {
        Value = -1
    }
}
/** @internal */
export function isDeclarationFileName(fileName: string): boolean {
    return ts.fileExtensionIs(fileName, ts.Extension.Dts);
}
/*@internal*/
export interface PragmaContext {
    languageVersion: ts.ScriptTarget;
    pragmas?: ts.PragmaMap;
    checkJsDirective?: ts.CheckJsDirective;
    referencedFiles: ts.FileReference[];
    typeReferenceDirectives: ts.FileReference[];
    libReferenceDirectives: ts.FileReference[];
    amdDependencies: ts.AmdDependency[];
    hasNoDefaultLib?: boolean;
    moduleName?: string;
}
/*@internal*/
export function processCommentPragmas(context: PragmaContext, sourceText: string): void {
    const pragmas: ts.PragmaPseudoMapEntry[] = [];
    for (const range of ts.getLeadingCommentRanges(sourceText, 0) || ts.emptyArray) {
        const comment = sourceText.substring(range.pos, range.end);
        extractPragmas(pragmas, range, comment);
    }
    context.pragmas = (ts.createMap() as ts.PragmaMap);
    for (const pragma of pragmas) {
        if (context.pragmas.has(pragma.name)) {
            const currentValue = context.pragmas.get(pragma.name);
            if (currentValue instanceof Array) {
                currentValue.push(pragma.args);
            }
            else {
                context.pragmas.set(pragma.name, [currentValue, pragma.args]);
            }
            continue;
        }
        context.pragmas.set(pragma.name, pragma.args);
    }
}
/*@internal*/
type PragmaDiagnosticReporter = (pos: number, length: number, message: ts.DiagnosticMessage) => void;
/*@internal*/
export function processPragmasIntoFields(context: PragmaContext, reportDiagnostic: PragmaDiagnosticReporter): void {
    context.checkJsDirective = undefined;
    context.referencedFiles = [];
    context.typeReferenceDirectives = [];
    context.libReferenceDirectives = [];
    context.amdDependencies = [];
    context.hasNoDefaultLib = false;
    context.pragmas!.forEach((entryOrList, key) => {
        // TODO: The below should be strongly type-guarded and not need casts/explicit annotations, since entryOrList is related to
        // key and key is constrained to a union; but it's not (see GH#21483 for at least partial fix) :(
        switch (key) {
            case "reference": {
                const referencedFiles = context.referencedFiles;
                const typeReferenceDirectives = context.typeReferenceDirectives;
                const libReferenceDirectives = context.libReferenceDirectives;
                ts.forEach((ts.toArray(entryOrList) as ts.PragmaPseudoMap["reference"][]), arg => {
                    const { types, lib, path } = arg.arguments;
                    if (arg.arguments["no-default-lib"]) {
                        context.hasNoDefaultLib = true;
                    }
                    else if (types) {
                        typeReferenceDirectives.push({ pos: types.pos, end: types.end, fileName: types.value });
                    }
                    else if (lib) {
                        libReferenceDirectives.push({ pos: lib.pos, end: lib.end, fileName: lib.value });
                    }
                    else if (path) {
                        referencedFiles.push({ pos: path.pos, end: path.end, fileName: path.value });
                    }
                    else {
                        reportDiagnostic(arg.range.pos, arg.range.end - arg.range.pos, ts.Diagnostics.Invalid_reference_directive_syntax);
                    }
                });
                break;
            }
            case "amd-dependency": {
                context.amdDependencies = ts.map((ts.toArray(entryOrList) as ts.PragmaPseudoMap["amd-dependency"][]), x => ({ name: x.arguments.name, path: x.arguments.path }));
                break;
            }
            case "amd-module": {
                if (entryOrList instanceof Array) {
                    for (const entry of entryOrList) {
                        if (context.moduleName) {
                            // TODO: It's probably fine to issue this diagnostic on all instances of the pragma
                            reportDiagnostic(entry.range.pos, entry.range.end - entry.range.pos, ts.Diagnostics.An_AMD_module_cannot_have_multiple_name_assignments);
                        }
                        context.moduleName = (entry as ts.PragmaPseudoMap["amd-module"]).arguments.name;
                    }
                }
                else {
                    context.moduleName = (entryOrList as ts.PragmaPseudoMap["amd-module"]).arguments.name;
                }
                break;
            }
            case "ts-nocheck":
            case "ts-check": {
                // _last_ of either nocheck or check in a file is the "winner"
                ts.forEach(ts.toArray(entryOrList), entry => {
                    if (!context.checkJsDirective || entry.range.pos > context.checkJsDirective.pos) {
                        context.checkJsDirective = {
                            enabled: key === "ts-check",
                            end: entry.range.end,
                            pos: entry.range.pos
                        };
                    }
                });
                break;
            }
            case "jsx": return; // Accessed directly
            default: ts.Debug.fail("Unhandled pragma kind"); // Can this be made into an assertNever in the future?
        }
    });
}
const namedArgRegExCache = ts.createMap<RegExp>();
function getNamedArgRegEx(name: string): RegExp {
    if (namedArgRegExCache.has(name)) {
        return namedArgRegExCache.get(name)!;
    }
    const result = new RegExp(`(\\s${name}\\s*=\\s*)('|")(.+?)\\2`, "im");
    namedArgRegExCache.set(name, result);
    return result;
}
const tripleSlashXMLCommentStartRegEx = /^\/\/\/\s*<(\S+)\s.*?\/>/im;
const singleLinePragmaRegEx = /^\/\/\/?\s*@(\S+)\s*(.*)\s*$/im;
function extractPragmas(pragmas: ts.PragmaPseudoMapEntry[], range: ts.CommentRange, text: string) {
    const tripleSlash = range.kind === ts.SyntaxKind.SingleLineCommentTrivia && tripleSlashXMLCommentStartRegEx.exec(text);
    if (tripleSlash) {
        const name = (tripleSlash[1].toLowerCase() as keyof ts.PragmaPseudoMap); // Technically unsafe cast, but we do it so the below check to make it safe typechecks
        const pragma = (ts.commentPragmas[name] as ts.PragmaDefinition);
        if (!pragma || !((pragma.kind!) & ts.PragmaKindFlags.TripleSlashXML)) {
            return;
        }
        if (pragma.args) {
            const argument: {
                [index: string]: string | {
                    value: string;
                    pos: number;
                    end: number;
                };
            } = {};
            for (const arg of pragma.args) {
                const matcher = getNamedArgRegEx(arg.name);
                const matchResult = matcher.exec(text);
                if (!matchResult && !arg.optional) {
                    return; // Missing required argument, don't parse
                }
                else if (matchResult) {
                    if (arg.captureSpan) {
                        const startPos = range.pos + matchResult.index + matchResult[1].length + matchResult[2].length;
                        argument[arg.name] = {
                            value: matchResult[3],
                            pos: startPos,
                            end: startPos + matchResult[3].length
                        };
                    }
                    else {
                        argument[arg.name] = matchResult[3];
                    }
                }
            }
            pragmas.push(({ name, args: { arguments: argument, range } } as ts.PragmaPseudoMapEntry));
        }
        else {
            pragmas.push(({ name, args: { arguments: {}, range } } as ts.PragmaPseudoMapEntry));
        }
        return;
    }
    const singleLine = range.kind === ts.SyntaxKind.SingleLineCommentTrivia && singleLinePragmaRegEx.exec(text);
    if (singleLine) {
        return addPragmaForMatch(pragmas, range, ts.PragmaKindFlags.SingleLine, singleLine);
    }
    if (range.kind === ts.SyntaxKind.MultiLineCommentTrivia) {
        const multiLinePragmaRegEx = /\s*@(\S+)\s*(.*)\s*$/gim; // Defined inline since it uses the "g" flag, which keeps a persistent index (for iterating)
        let multiLineMatch: RegExpExecArray | null;
        while (multiLineMatch = multiLinePragmaRegEx.exec(text)) {
            addPragmaForMatch(pragmas, range, ts.PragmaKindFlags.MultiLine, multiLineMatch);
        }
    }
}
function addPragmaForMatch(pragmas: ts.PragmaPseudoMapEntry[], range: ts.CommentRange, kind: ts.PragmaKindFlags, match: RegExpExecArray) {
    if (!match)
        return;
    const name = (match[1].toLowerCase() as keyof ts.PragmaPseudoMap); // Technically unsafe cast, but we do it so they below check to make it safe typechecks
    const pragma = (ts.commentPragmas[name] as ts.PragmaDefinition);
    if (!pragma || !(pragma.kind! & kind)) {
        return;
    }
    const args = match[2]; // Split on spaces and match up positionally with definition
    const argument = getNamedPragmaArguments(pragma, args);
    if (argument === "fail")
        return; // Missing required argument, fail to parse it
    pragmas.push(({ name, args: { arguments: argument, range } } as ts.PragmaPseudoMapEntry));
    return;
}
function getNamedPragmaArguments(pragma: ts.PragmaDefinition, text: string | undefined): {
    [index: string]: string;
} | "fail" {
    if (!text)
        return {};
    if (!pragma.args)
        return {};
    const args = text.split(/\s+/);
    const argMap: {
        [index: string]: string;
    } = {};
    for (let i = 0; i < pragma.args.length; i++) {
        const argument = pragma.args[i];
        if (!args[i] && !argument.optional) {
            return "fail";
        }
        if (argument.captureSpan) {
            return ts.Debug.fail("Capture spans not yet implemented for non-xml pragmas");
        }
        argMap[argument.name] = args[i];
    }
    return argMap;
}
/** @internal */
export function tagNamesAreEquivalent(lhs: ts.JsxTagNameExpression, rhs: ts.JsxTagNameExpression): boolean {
    if (lhs.kind !== rhs.kind) {
        return false;
    }
    if (lhs.kind === ts.SyntaxKind.Identifier) {
        return lhs.escapedText === (<ts.Identifier>rhs).escapedText;
    }
    if (lhs.kind === ts.SyntaxKind.ThisKeyword) {
        return true;
    }
    // If we are at this statement then we must have PropertyAccessExpression and because tag name in Jsx element can only
    // take forms of JsxTagNameExpression which includes an identifier, "this" expression, or another propertyAccessExpression
    // it is safe to case the expression property as such. See parseJsxElementName for how we parse tag name in Jsx element
    return (<ts.PropertyAccessExpression>lhs).name.escapedText === (<ts.PropertyAccessExpression>rhs).name.escapedText &&
        tagNamesAreEquivalent(((<ts.PropertyAccessExpression>lhs).expression as ts.JsxTagNameExpression), ((<ts.PropertyAccessExpression>rhs).expression as ts.JsxTagNameExpression));
}
