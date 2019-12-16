import * as ts from "./ts";
/* @internal */
function reduceNode<T>(node: ts.Node | undefined, f: (memo: T, node: ts.Node) => T, initial: T) {
    return node ? f(initial, node) : initial;
}
/* @internal */
function reduceNodeArray<T>(nodes: ts.NodeArray<ts.Node> | undefined, f: (memo: T, nodes: ts.NodeArray<ts.Node>) => T, initial: T) {
    return nodes ? f(initial, nodes) : initial;
}
/**
 * Similar to `reduceLeft`, performs a reduction against each child of a node.
 * NOTE: Unlike `forEachChild`, this does *not* visit every node.
 *
 * @param node The node containing the children to reduce.
 * @param initial The initial value to supply to the reduction.
 * @param f The callback function
 */
/* @internal */
export function reduceEachChild<T>(node: ts.Node | undefined, initial: T, cbNode: (memo: T, node: ts.Node) => T, cbNodeArray?: (memo: T, nodes: ts.NodeArray<ts.Node>) => T): T {
    if (node === undefined) {
        return initial;
    }
    const reduceNodes: (nodes: ts.NodeArray<ts.Node> | undefined, f: ((memo: T, node: ts.Node) => T) | ((memo: T, node: ts.NodeArray<ts.Node>) => T), initial: T) => T = cbNodeArray ? reduceNodeArray : ts.reduceLeft;
    const cbNodes = cbNodeArray || cbNode;
    const kind = node.kind;
    // No need to visit nodes with no children.
    if ((kind > ts.SyntaxKind.FirstToken && kind <= ts.SyntaxKind.LastToken)) {
        return initial;
    }
    // We do not yet support types.
    if ((kind >= ts.SyntaxKind.TypePredicate && kind <= ts.SyntaxKind.LiteralType)) {
        return initial;
    }
    let result = initial;
    switch (node.kind) {
        // Leaf nodes
        case ts.SyntaxKind.SemicolonClassElement:
        case ts.SyntaxKind.EmptyStatement:
        case ts.SyntaxKind.OmittedExpression:
        case ts.SyntaxKind.DebuggerStatement:
        case ts.SyntaxKind.NotEmittedStatement:
            // No need to visit nodes with no children.
            break;
        // Names
        case ts.SyntaxKind.QualifiedName:
            result = reduceNode((<ts.QualifiedName>node).left, cbNode, result);
            result = reduceNode((<ts.QualifiedName>node).right, cbNode, result);
            break;
        case ts.SyntaxKind.ComputedPropertyName:
            result = reduceNode((<ts.ComputedPropertyName>node).expression, cbNode, result);
            break;
        // Signature elements
        case ts.SyntaxKind.Parameter:
            result = reduceNodes((<ts.ParameterDeclaration>node).decorators, cbNodes, result);
            result = reduceNodes((<ts.ParameterDeclaration>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.ParameterDeclaration>node).name, cbNode, result);
            result = reduceNode((<ts.ParameterDeclaration>node).type, cbNode, result);
            result = reduceNode((<ts.ParameterDeclaration>node).initializer, cbNode, result);
            break;
        case ts.SyntaxKind.Decorator:
            result = reduceNode((<ts.Decorator>node).expression, cbNode, result);
            break;
        // Type member
        case ts.SyntaxKind.PropertySignature:
            result = reduceNodes((<ts.PropertySignature>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.PropertySignature>node).name, cbNode, result);
            result = reduceNode((<ts.PropertySignature>node).questionToken, cbNode, result);
            result = reduceNode((<ts.PropertySignature>node).type, cbNode, result);
            result = reduceNode((<ts.PropertySignature>node).initializer, cbNode, result);
            break;
        case ts.SyntaxKind.PropertyDeclaration:
            result = reduceNodes((<ts.PropertyDeclaration>node).decorators, cbNodes, result);
            result = reduceNodes((<ts.PropertyDeclaration>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.PropertyDeclaration>node).name, cbNode, result);
            result = reduceNode((<ts.PropertyDeclaration>node).type, cbNode, result);
            result = reduceNode((<ts.PropertyDeclaration>node).initializer, cbNode, result);
            break;
        case ts.SyntaxKind.MethodDeclaration:
            result = reduceNodes((<ts.MethodDeclaration>node).decorators, cbNodes, result);
            result = reduceNodes((<ts.MethodDeclaration>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.MethodDeclaration>node).name, cbNode, result);
            result = reduceNodes((<ts.MethodDeclaration>node).typeParameters, cbNodes, result);
            result = reduceNodes((<ts.MethodDeclaration>node).parameters, cbNodes, result);
            result = reduceNode((<ts.MethodDeclaration>node).type, cbNode, result);
            result = reduceNode((<ts.MethodDeclaration>node).body, cbNode, result);
            break;
        case ts.SyntaxKind.Constructor:
            result = reduceNodes((<ts.ConstructorDeclaration>node).modifiers, cbNodes, result);
            result = reduceNodes((<ts.ConstructorDeclaration>node).parameters, cbNodes, result);
            result = reduceNode((<ts.ConstructorDeclaration>node).body, cbNode, result);
            break;
        case ts.SyntaxKind.GetAccessor:
            result = reduceNodes((<ts.GetAccessorDeclaration>node).decorators, cbNodes, result);
            result = reduceNodes((<ts.GetAccessorDeclaration>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.GetAccessorDeclaration>node).name, cbNode, result);
            result = reduceNodes((<ts.GetAccessorDeclaration>node).parameters, cbNodes, result);
            result = reduceNode((<ts.GetAccessorDeclaration>node).type, cbNode, result);
            result = reduceNode((<ts.GetAccessorDeclaration>node).body, cbNode, result);
            break;
        case ts.SyntaxKind.SetAccessor:
            result = reduceNodes((<ts.GetAccessorDeclaration>node).decorators, cbNodes, result);
            result = reduceNodes((<ts.GetAccessorDeclaration>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.GetAccessorDeclaration>node).name, cbNode, result);
            result = reduceNodes((<ts.GetAccessorDeclaration>node).parameters, cbNodes, result);
            result = reduceNode((<ts.GetAccessorDeclaration>node).body, cbNode, result);
            break;
        // Binding patterns
        case ts.SyntaxKind.ObjectBindingPattern:
        case ts.SyntaxKind.ArrayBindingPattern:
            result = reduceNodes((<ts.BindingPattern>node).elements, cbNodes, result);
            break;
        case ts.SyntaxKind.BindingElement:
            result = reduceNode((<ts.BindingElement>node).propertyName, cbNode, result);
            result = reduceNode((<ts.BindingElement>node).name, cbNode, result);
            result = reduceNode((<ts.BindingElement>node).initializer, cbNode, result);
            break;
        // Expression
        case ts.SyntaxKind.ArrayLiteralExpression:
            result = reduceNodes((<ts.ArrayLiteralExpression>node).elements, cbNodes, result);
            break;
        case ts.SyntaxKind.ObjectLiteralExpression:
            result = reduceNodes((<ts.ObjectLiteralExpression>node).properties, cbNodes, result);
            break;
        case ts.SyntaxKind.PropertyAccessExpression:
            result = reduceNode((<ts.PropertyAccessExpression>node).expression, cbNode, result);
            result = reduceNode((<ts.PropertyAccessExpression>node).name, cbNode, result);
            break;
        case ts.SyntaxKind.ElementAccessExpression:
            result = reduceNode((<ts.ElementAccessExpression>node).expression, cbNode, result);
            result = reduceNode((<ts.ElementAccessExpression>node).argumentExpression, cbNode, result);
            break;
        case ts.SyntaxKind.CallExpression:
            result = reduceNode((<ts.CallExpression>node).expression, cbNode, result);
            result = reduceNodes((<ts.CallExpression>node).typeArguments, cbNodes, result);
            result = reduceNodes((<ts.CallExpression>node).arguments, cbNodes, result);
            break;
        case ts.SyntaxKind.NewExpression:
            result = reduceNode((<ts.NewExpression>node).expression, cbNode, result);
            result = reduceNodes((<ts.NewExpression>node).typeArguments, cbNodes, result);
            result = reduceNodes((<ts.NewExpression>node).arguments, cbNodes, result);
            break;
        case ts.SyntaxKind.TaggedTemplateExpression:
            result = reduceNode((<ts.TaggedTemplateExpression>node).tag, cbNode, result);
            result = reduceNodes((<ts.TaggedTemplateExpression>node).typeArguments, cbNodes, result);
            result = reduceNode((<ts.TaggedTemplateExpression>node).template, cbNode, result);
            break;
        case ts.SyntaxKind.TypeAssertionExpression:
            result = reduceNode((<ts.TypeAssertion>node).type, cbNode, result);
            result = reduceNode((<ts.TypeAssertion>node).expression, cbNode, result);
            break;
        case ts.SyntaxKind.FunctionExpression:
            result = reduceNodes((<ts.FunctionExpression>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.FunctionExpression>node).name, cbNode, result);
            result = reduceNodes((<ts.FunctionExpression>node).typeParameters, cbNodes, result);
            result = reduceNodes((<ts.FunctionExpression>node).parameters, cbNodes, result);
            result = reduceNode((<ts.FunctionExpression>node).type, cbNode, result);
            result = reduceNode((<ts.FunctionExpression>node).body, cbNode, result);
            break;
        case ts.SyntaxKind.ArrowFunction:
            result = reduceNodes((<ts.ArrowFunction>node).modifiers, cbNodes, result);
            result = reduceNodes((<ts.ArrowFunction>node).typeParameters, cbNodes, result);
            result = reduceNodes((<ts.ArrowFunction>node).parameters, cbNodes, result);
            result = reduceNode((<ts.ArrowFunction>node).type, cbNode, result);
            result = reduceNode((<ts.ArrowFunction>node).body, cbNode, result);
            break;
        case ts.SyntaxKind.ParenthesizedExpression:
        case ts.SyntaxKind.DeleteExpression:
        case ts.SyntaxKind.TypeOfExpression:
        case ts.SyntaxKind.VoidExpression:
        case ts.SyntaxKind.AwaitExpression:
        case ts.SyntaxKind.YieldExpression:
        case ts.SyntaxKind.SpreadElement:
        case ts.SyntaxKind.NonNullExpression:
            result = reduceNode((<ts.ParenthesizedExpression | ts.DeleteExpression | ts.TypeOfExpression | ts.VoidExpression | ts.AwaitExpression | ts.YieldExpression | ts.SpreadElement | ts.NonNullExpression>node).expression, cbNode, result);
            break;
        case ts.SyntaxKind.PrefixUnaryExpression:
        case ts.SyntaxKind.PostfixUnaryExpression:
            result = reduceNode((<ts.PrefixUnaryExpression | ts.PostfixUnaryExpression>node).operand, cbNode, result);
            break;
        case ts.SyntaxKind.BinaryExpression:
            result = reduceNode((<ts.BinaryExpression>node).left, cbNode, result);
            result = reduceNode((<ts.BinaryExpression>node).right, cbNode, result);
            break;
        case ts.SyntaxKind.ConditionalExpression:
            result = reduceNode((<ts.ConditionalExpression>node).condition, cbNode, result);
            result = reduceNode((<ts.ConditionalExpression>node).whenTrue, cbNode, result);
            result = reduceNode((<ts.ConditionalExpression>node).whenFalse, cbNode, result);
            break;
        case ts.SyntaxKind.TemplateExpression:
            result = reduceNode((<ts.TemplateExpression>node).head, cbNode, result);
            result = reduceNodes((<ts.TemplateExpression>node).templateSpans, cbNodes, result);
            break;
        case ts.SyntaxKind.ClassExpression:
            result = reduceNodes((<ts.ClassExpression>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.ClassExpression>node).name, cbNode, result);
            result = reduceNodes((<ts.ClassExpression>node).typeParameters, cbNodes, result);
            result = reduceNodes((<ts.ClassExpression>node).heritageClauses, cbNodes, result);
            result = reduceNodes((<ts.ClassExpression>node).members, cbNodes, result);
            break;
        case ts.SyntaxKind.ExpressionWithTypeArguments:
            result = reduceNode((<ts.ExpressionWithTypeArguments>node).expression, cbNode, result);
            result = reduceNodes((<ts.ExpressionWithTypeArguments>node).typeArguments, cbNodes, result);
            break;
        case ts.SyntaxKind.AsExpression:
            result = reduceNode((<ts.AsExpression>node).expression, cbNode, result);
            result = reduceNode((<ts.AsExpression>node).type, cbNode, result);
            break;
        // Misc
        case ts.SyntaxKind.TemplateSpan:
            result = reduceNode((<ts.TemplateSpan>node).expression, cbNode, result);
            result = reduceNode((<ts.TemplateSpan>node).literal, cbNode, result);
            break;
        // Element
        case ts.SyntaxKind.Block:
            result = reduceNodes((<ts.Block>node).statements, cbNodes, result);
            break;
        case ts.SyntaxKind.VariableStatement:
            result = reduceNodes((<ts.VariableStatement>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.VariableStatement>node).declarationList, cbNode, result);
            break;
        case ts.SyntaxKind.ExpressionStatement:
            result = reduceNode((<ts.ExpressionStatement>node).expression, cbNode, result);
            break;
        case ts.SyntaxKind.IfStatement:
            result = reduceNode((<ts.IfStatement>node).expression, cbNode, result);
            result = reduceNode((<ts.IfStatement>node).thenStatement, cbNode, result);
            result = reduceNode((<ts.IfStatement>node).elseStatement, cbNode, result);
            break;
        case ts.SyntaxKind.DoStatement:
            result = reduceNode((<ts.DoStatement>node).statement, cbNode, result);
            result = reduceNode((<ts.DoStatement>node).expression, cbNode, result);
            break;
        case ts.SyntaxKind.WhileStatement:
        case ts.SyntaxKind.WithStatement:
            result = reduceNode((<ts.WhileStatement | ts.WithStatement>node).expression, cbNode, result);
            result = reduceNode((<ts.WhileStatement | ts.WithStatement>node).statement, cbNode, result);
            break;
        case ts.SyntaxKind.ForStatement:
            result = reduceNode((<ts.ForStatement>node).initializer, cbNode, result);
            result = reduceNode((<ts.ForStatement>node).condition, cbNode, result);
            result = reduceNode((<ts.ForStatement>node).incrementor, cbNode, result);
            result = reduceNode((<ts.ForStatement>node).statement, cbNode, result);
            break;
        case ts.SyntaxKind.ForInStatement:
        case ts.SyntaxKind.ForOfStatement:
            result = reduceNode((<ts.ForInOrOfStatement>node).initializer, cbNode, result);
            result = reduceNode((<ts.ForInOrOfStatement>node).expression, cbNode, result);
            result = reduceNode((<ts.ForInOrOfStatement>node).statement, cbNode, result);
            break;
        case ts.SyntaxKind.ReturnStatement:
        case ts.SyntaxKind.ThrowStatement:
            result = reduceNode((<ts.ReturnStatement>node).expression, cbNode, result);
            break;
        case ts.SyntaxKind.SwitchStatement:
            result = reduceNode((<ts.SwitchStatement>node).expression, cbNode, result);
            result = reduceNode((<ts.SwitchStatement>node).caseBlock, cbNode, result);
            break;
        case ts.SyntaxKind.LabeledStatement:
            result = reduceNode((<ts.LabeledStatement>node).label, cbNode, result);
            result = reduceNode((<ts.LabeledStatement>node).statement, cbNode, result);
            break;
        case ts.SyntaxKind.TryStatement:
            result = reduceNode((<ts.TryStatement>node).tryBlock, cbNode, result);
            result = reduceNode((<ts.TryStatement>node).catchClause, cbNode, result);
            result = reduceNode((<ts.TryStatement>node).finallyBlock, cbNode, result);
            break;
        case ts.SyntaxKind.VariableDeclaration:
            result = reduceNode((<ts.VariableDeclaration>node).name, cbNode, result);
            result = reduceNode((<ts.VariableDeclaration>node).type, cbNode, result);
            result = reduceNode((<ts.VariableDeclaration>node).initializer, cbNode, result);
            break;
        case ts.SyntaxKind.VariableDeclarationList:
            result = reduceNodes((<ts.VariableDeclarationList>node).declarations, cbNodes, result);
            break;
        case ts.SyntaxKind.FunctionDeclaration:
            result = reduceNodes((<ts.FunctionDeclaration>node).decorators, cbNodes, result);
            result = reduceNodes((<ts.FunctionDeclaration>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.FunctionDeclaration>node).name, cbNode, result);
            result = reduceNodes((<ts.FunctionDeclaration>node).typeParameters, cbNodes, result);
            result = reduceNodes((<ts.FunctionDeclaration>node).parameters, cbNodes, result);
            result = reduceNode((<ts.FunctionDeclaration>node).type, cbNode, result);
            result = reduceNode((<ts.FunctionDeclaration>node).body, cbNode, result);
            break;
        case ts.SyntaxKind.ClassDeclaration:
            result = reduceNodes((<ts.ClassDeclaration>node).decorators, cbNodes, result);
            result = reduceNodes((<ts.ClassDeclaration>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.ClassDeclaration>node).name, cbNode, result);
            result = reduceNodes((<ts.ClassDeclaration>node).typeParameters, cbNodes, result);
            result = reduceNodes((<ts.ClassDeclaration>node).heritageClauses, cbNodes, result);
            result = reduceNodes((<ts.ClassDeclaration>node).members, cbNodes, result);
            break;
        case ts.SyntaxKind.EnumDeclaration:
            result = reduceNodes((<ts.EnumDeclaration>node).decorators, cbNodes, result);
            result = reduceNodes((<ts.EnumDeclaration>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.EnumDeclaration>node).name, cbNode, result);
            result = reduceNodes((<ts.EnumDeclaration>node).members, cbNodes, result);
            break;
        case ts.SyntaxKind.ModuleDeclaration:
            result = reduceNodes((<ts.ModuleDeclaration>node).decorators, cbNodes, result);
            result = reduceNodes((<ts.ModuleDeclaration>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.ModuleDeclaration>node).name, cbNode, result);
            result = reduceNode((<ts.ModuleDeclaration>node).body, cbNode, result);
            break;
        case ts.SyntaxKind.ModuleBlock:
            result = reduceNodes((<ts.ModuleBlock>node).statements, cbNodes, result);
            break;
        case ts.SyntaxKind.CaseBlock:
            result = reduceNodes((<ts.CaseBlock>node).clauses, cbNodes, result);
            break;
        case ts.SyntaxKind.ImportEqualsDeclaration:
            result = reduceNodes((<ts.ImportEqualsDeclaration>node).decorators, cbNodes, result);
            result = reduceNodes((<ts.ImportEqualsDeclaration>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.ImportEqualsDeclaration>node).name, cbNode, result);
            result = reduceNode((<ts.ImportEqualsDeclaration>node).moduleReference, cbNode, result);
            break;
        case ts.SyntaxKind.ImportDeclaration:
            result = reduceNodes((<ts.ImportDeclaration>node).decorators, cbNodes, result);
            result = reduceNodes((<ts.ImportDeclaration>node).modifiers, cbNodes, result);
            result = reduceNode((<ts.ImportDeclaration>node).importClause, cbNode, result);
            result = reduceNode((<ts.ImportDeclaration>node).moduleSpecifier, cbNode, result);
            break;
        case ts.SyntaxKind.ImportClause:
            result = reduceNode((<ts.ImportClause>node).name, cbNode, result);
            result = reduceNode((<ts.ImportClause>node).namedBindings, cbNode, result);
            break;
        case ts.SyntaxKind.NamespaceImport:
            result = reduceNode((<ts.NamespaceImport>node).name, cbNode, result);
            break;
        case ts.SyntaxKind.NamedImports:
        case ts.SyntaxKind.NamedExports:
            result = reduceNodes((<ts.NamedImports | ts.NamedExports>node).elements, cbNodes, result);
            break;
        case ts.SyntaxKind.ImportSpecifier:
        case ts.SyntaxKind.ExportSpecifier:
            result = reduceNode((<ts.ImportSpecifier | ts.ExportSpecifier>node).propertyName, cbNode, result);
            result = reduceNode((<ts.ImportSpecifier | ts.ExportSpecifier>node).name, cbNode, result);
            break;
        case ts.SyntaxKind.ExportAssignment:
            result = ts.reduceLeft((<ts.ExportAssignment>node).decorators, cbNode, result);
            result = ts.reduceLeft((<ts.ExportAssignment>node).modifiers, cbNode, result);
            result = reduceNode((<ts.ExportAssignment>node).expression, cbNode, result);
            break;
        case ts.SyntaxKind.ExportDeclaration:
            result = ts.reduceLeft((<ts.ExportDeclaration>node).decorators, cbNode, result);
            result = ts.reduceLeft((<ts.ExportDeclaration>node).modifiers, cbNode, result);
            result = reduceNode((<ts.ExportDeclaration>node).exportClause, cbNode, result);
            result = reduceNode((<ts.ExportDeclaration>node).moduleSpecifier, cbNode, result);
            break;
        // Module references
        case ts.SyntaxKind.ExternalModuleReference:
            result = reduceNode((<ts.ExternalModuleReference>node).expression, cbNode, result);
            break;
        // JSX
        case ts.SyntaxKind.JsxElement:
            result = reduceNode((<ts.JsxElement>node).openingElement, cbNode, result);
            result = ts.reduceLeft((<ts.JsxElement>node).children, cbNode, result);
            result = reduceNode((<ts.JsxElement>node).closingElement, cbNode, result);
            break;
        case ts.SyntaxKind.JsxFragment:
            result = reduceNode((<ts.JsxFragment>node).openingFragment, cbNode, result);
            result = ts.reduceLeft((<ts.JsxFragment>node).children, cbNode, result);
            result = reduceNode((<ts.JsxFragment>node).closingFragment, cbNode, result);
            break;
        case ts.SyntaxKind.JsxSelfClosingElement:
        case ts.SyntaxKind.JsxOpeningElement:
            result = reduceNode((<ts.JsxSelfClosingElement | ts.JsxOpeningElement>node).tagName, cbNode, result);
            result = reduceNodes((<ts.JsxSelfClosingElement | ts.JsxOpeningElement>node).typeArguments, cbNode, result);
            result = reduceNode((<ts.JsxSelfClosingElement | ts.JsxOpeningElement>node).attributes, cbNode, result);
            break;
        case ts.SyntaxKind.JsxAttributes:
            result = reduceNodes((<ts.JsxAttributes>node).properties, cbNodes, result);
            break;
        case ts.SyntaxKind.JsxClosingElement:
            result = reduceNode((<ts.JsxClosingElement>node).tagName, cbNode, result);
            break;
        case ts.SyntaxKind.JsxAttribute:
            result = reduceNode((<ts.JsxAttribute>node).name, cbNode, result);
            result = reduceNode((<ts.JsxAttribute>node).initializer, cbNode, result);
            break;
        case ts.SyntaxKind.JsxSpreadAttribute:
            result = reduceNode((<ts.JsxSpreadAttribute>node).expression, cbNode, result);
            break;
        case ts.SyntaxKind.JsxExpression:
            result = reduceNode((<ts.JsxExpression>node).expression, cbNode, result);
            break;
        // Clauses
        case ts.SyntaxKind.CaseClause:
            result = reduceNode((<ts.CaseClause>node).expression, cbNode, result);
        // falls through
        case ts.SyntaxKind.DefaultClause:
            result = reduceNodes((<ts.CaseClause | ts.DefaultClause>node).statements, cbNodes, result);
            break;
        case ts.SyntaxKind.HeritageClause:
            result = reduceNodes((<ts.HeritageClause>node).types, cbNodes, result);
            break;
        case ts.SyntaxKind.CatchClause:
            result = reduceNode((<ts.CatchClause>node).variableDeclaration, cbNode, result);
            result = reduceNode((<ts.CatchClause>node).block, cbNode, result);
            break;
        // Property assignments
        case ts.SyntaxKind.PropertyAssignment:
            result = reduceNode((<ts.PropertyAssignment>node).name, cbNode, result);
            result = reduceNode((<ts.PropertyAssignment>node).initializer, cbNode, result);
            break;
        case ts.SyntaxKind.ShorthandPropertyAssignment:
            result = reduceNode((<ts.ShorthandPropertyAssignment>node).name, cbNode, result);
            result = reduceNode((<ts.ShorthandPropertyAssignment>node).objectAssignmentInitializer, cbNode, result);
            break;
        case ts.SyntaxKind.SpreadAssignment:
            result = reduceNode((<ts.SpreadAssignment>node).expression, cbNode, result);
            break;
        // Enum
        case ts.SyntaxKind.EnumMember:
            result = reduceNode((<ts.EnumMember>node).name, cbNode, result);
            result = reduceNode((<ts.EnumMember>node).initializer, cbNode, result);
            break;
        // Top-level nodes
        case ts.SyntaxKind.SourceFile:
            result = reduceNodes((<ts.SourceFile>node).statements, cbNodes, result);
            break;
        // Transformation nodes
        case ts.SyntaxKind.PartiallyEmittedExpression:
            result = reduceNode((<ts.PartiallyEmittedExpression>node).expression, cbNode, result);
            break;
        case ts.SyntaxKind.CommaListExpression:
            result = reduceNodes((<ts.CommaListExpression>node).elements, cbNodes, result);
            break;
        default:
            break;
    }
    return result;
}
/**
 * Merges generated lexical declarations into a new statement list.
 */
/* @internal */
export function mergeLexicalEnvironment(statements: ts.NodeArray<ts.Statement>, declarations: readonly ts.Statement[] | undefined): ts.NodeArray<ts.Statement>;
/**
 * Appends generated lexical declarations to an array of statements.
 */
/* @internal */
export function mergeLexicalEnvironment(statements: ts.Statement[], declarations: readonly ts.Statement[] | undefined): ts.Statement[];
/* @internal */
export function mergeLexicalEnvironment(statements: ts.Statement[] | ts.NodeArray<ts.Statement>, declarations: readonly ts.Statement[] | undefined) {
    if (!ts.some(declarations)) {
        return statements;
    }
    return ts.isNodeArray(statements)
        ? ts.setTextRange(ts.createNodeArray(ts.insertStatementsAfterStandardPrologue(statements.slice(), declarations)), statements)
        : ts.insertStatementsAfterStandardPrologue(statements, declarations);
}
/**
 * Lifts a NodeArray containing only Statement nodes to a block.
 *
 * @param nodes The NodeArray.
 */
/* @internal */
export function liftToBlock(nodes: readonly ts.Node[]): ts.Statement {
    ts.Debug.assert(ts.every(nodes, ts.isStatement), "Cannot lift nodes to a Block.");
    return (<ts.Statement>ts.singleOrUndefined(nodes)) || ts.createBlock((<ts.NodeArray<ts.Statement>>nodes));
}
/**
 * Aggregates the TransformFlags for a Node and its subtree.
 */
/* @internal */
export function aggregateTransformFlags<T extends ts.Node>(node: T): T {
    aggregateTransformFlagsForNode(node);
    return node;
}
/**
 * Aggregates the TransformFlags for a Node and its subtree. The flags for the subtree are
 * computed first, then the transform flags for the current node are computed from the subtree
 * flags and the state of the current node. Finally, the transform flags of the node are
 * returned, excluding any flags that should not be included in its parent node's subtree
 * flags.
 */
/* @internal */
function aggregateTransformFlagsForNode(node: ts.Node): ts.TransformFlags {
    if (node === undefined) {
        return ts.TransformFlags.None;
    }
    if (node.transformFlags & ts.TransformFlags.HasComputedFlags) {
        return node.transformFlags & ~ts.getTransformFlagsSubtreeExclusions(node.kind);
    }
    const subtreeFlags = aggregateTransformFlagsForSubtree(node);
    return ts.computeTransformFlagsForNode(node, subtreeFlags);
}
/* @internal */
function aggregateTransformFlagsForNodeArray(nodes: ts.NodeArray<ts.Node>): ts.TransformFlags {
    if (nodes === undefined) {
        return ts.TransformFlags.None;
    }
    let subtreeFlags = ts.TransformFlags.None;
    let nodeArrayFlags = ts.TransformFlags.None;
    for (const node of nodes) {
        subtreeFlags |= aggregateTransformFlagsForNode(node);
        nodeArrayFlags |= node.transformFlags & ~ts.TransformFlags.HasComputedFlags;
    }
    nodes.transformFlags = nodeArrayFlags | ts.TransformFlags.HasComputedFlags;
    return subtreeFlags;
}
/**
 * Aggregates the transform flags for the subtree of a node.
 */
/* @internal */
function aggregateTransformFlagsForSubtree(node: ts.Node): ts.TransformFlags {
    // We do not transform ambient declarations or types, so there is no need to
    // recursively aggregate transform flags.
    if (ts.hasModifier(node, ts.ModifierFlags.Ambient) || (ts.isTypeNode(node) && node.kind !== ts.SyntaxKind.ExpressionWithTypeArguments)) {
        return ts.TransformFlags.None;
    }
    // Aggregate the transform flags of each child.
    return reduceEachChild(node, ts.TransformFlags.None, aggregateTransformFlagsForChildNode, aggregateTransformFlagsForChildNodes);
}
/**
 * Aggregates the TransformFlags of a child node with the TransformFlags of its
 * siblings.
 */
/* @internal */
function aggregateTransformFlagsForChildNode(transformFlags: ts.TransformFlags, node: ts.Node): ts.TransformFlags {
    return transformFlags | aggregateTransformFlagsForNode(node);
}
/* @internal */
function aggregateTransformFlagsForChildNodes(transformFlags: ts.TransformFlags, nodes: ts.NodeArray<ts.Node>): ts.TransformFlags {
    return transformFlags | aggregateTransformFlagsForNodeArray(nodes);
}
