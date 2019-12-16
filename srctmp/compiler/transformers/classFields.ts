import * as ts from "../ts";
/*@internal*/
const enum ClassPropertySubstitutionFlags {
    /**
     * Enables substitutions for class expressions with static fields
     * which have initializers that reference the class name.
     */
    ClassAliases = 1 << 0
}
/**
 * Transforms ECMAScript Class Syntax.
 * TypeScript parameter property syntax is transformed in the TypeScript transformer.
 * For now, this transforms public field declarations using TypeScript class semantics,
 * where declarations are elided and initializers are transformed as assignments in the constructor.
 * When --useDefineForClassFields is on, this transforms to ECMAScript semantics, with Object.defineProperty.
 */
/* @internal */
export function transformClassFields(context: ts.TransformationContext) {
    const { hoistVariableDeclaration, endLexicalEnvironment, resumeLexicalEnvironment } = context;
    const resolver = context.getEmitResolver();
    const previousOnSubstituteNode = context.onSubstituteNode;
    context.onSubstituteNode = onSubstituteNode;
    let enabledSubstitutions: ClassPropertySubstitutionFlags;
    let classAliases: ts.Identifier[];
    /**
     * Tracks what computed name expressions originating from elided names must be inlined
     * at the next execution site, in document order
     */
    let pendingExpressions: ts.Expression[] | undefined;
    /**
     * Tracks what computed name expression statements and static property initializers must be
     * emitted at the next execution site, in document order (for decorated classes).
     */
    let pendingStatements: ts.Statement[] | undefined;
    return ts.chainBundle(transformSourceFile);
    function transformSourceFile(node: ts.SourceFile) {
        const options = context.getCompilerOptions();
        if (node.isDeclarationFile
            || options.useDefineForClassFields && options.target === ts.ScriptTarget.ESNext) {
            return node;
        }
        const visited = ts.visitEachChild(node, visitor, context);
        ts.addEmitHelpers(visited, context.readEmitHelpers());
        return visited;
    }
    function visitor(node: ts.Node): ts.VisitResult<ts.Node> {
        if (!(node.transformFlags & ts.TransformFlags.ContainsClassFields))
            return node;
        switch (node.kind) {
            case ts.SyntaxKind.ClassExpression:
                return visitClassExpression((node as ts.ClassExpression));
            case ts.SyntaxKind.ClassDeclaration:
                return visitClassDeclaration((node as ts.ClassDeclaration));
            case ts.SyntaxKind.VariableStatement:
                return visitVariableStatement((node as ts.VariableStatement));
        }
        return ts.visitEachChild(node, visitor, context);
    }
    /**
     * Visits the members of a class that has fields.
     *
     * @param node The node to visit.
     */
    function classElementVisitor(node: ts.Node): ts.VisitResult<ts.Node> {
        switch (node.kind) {
            case ts.SyntaxKind.Constructor:
                // Constructors for classes using class fields are transformed in
                // `visitClassDeclaration` or `visitClassExpression`.
                return undefined;
            case ts.SyntaxKind.GetAccessor:
            case ts.SyntaxKind.SetAccessor:
            case ts.SyntaxKind.MethodDeclaration:
                // Visit the name of the member (if it's a computed property name).
                return ts.visitEachChild(node, classElementVisitor, context);
            case ts.SyntaxKind.PropertyDeclaration:
                return visitPropertyDeclaration((node as ts.PropertyDeclaration));
            case ts.SyntaxKind.ComputedPropertyName:
                return visitComputedPropertyName((node as ts.ComputedPropertyName));
            case ts.SyntaxKind.SemicolonClassElement:
                return node;
            default:
                return visitor(node);
        }
    }
    function visitVariableStatement(node: ts.VariableStatement) {
        const savedPendingStatements = pendingStatements;
        pendingStatements = [];
        const visitedNode = ts.visitEachChild(node, visitor, context);
        const statement = ts.some(pendingStatements) ?
            [visitedNode, ...pendingStatements] :
            visitedNode;
        pendingStatements = savedPendingStatements;
        return statement;
    }
    function visitComputedPropertyName(name: ts.ComputedPropertyName) {
        let node = ts.visitEachChild(name, visitor, context);
        if (ts.some(pendingExpressions)) {
            const expressions = pendingExpressions;
            expressions.push(name.expression);
            pendingExpressions = [];
            node = ts.updateComputedPropertyName(node, ts.inlineExpressions(expressions));
        }
        return node;
    }
    function visitPropertyDeclaration(node: ts.PropertyDeclaration) {
        ts.Debug.assert(!ts.some(node.decorators));
        // Create a temporary variable to store a computed property name (if necessary).
        // If it's not inlineable, then we emit an expression after the class which assigns
        // the property name to the temporary variable.
        const expr = getPropertyNameExpressionIfNeeded(node.name, !!node.initializer || !!context.getCompilerOptions().useDefineForClassFields);
        if (expr && !ts.isSimpleInlineableExpression(expr)) {
            (pendingExpressions || (pendingExpressions = [])).push(expr);
        }
        return undefined;
    }
    function visitClassDeclaration(node: ts.ClassDeclaration) {
        if (!ts.forEach(node.members, ts.isPropertyDeclaration)) {
            return ts.visitEachChild(node, visitor, context);
        }
        const savedPendingExpressions = pendingExpressions;
        pendingExpressions = undefined;
        const extendsClauseElement = ts.getEffectiveBaseTypeNode(node);
        const isDerivedClass = !!(extendsClauseElement && ts.skipOuterExpressions(extendsClauseElement.expression).kind !== ts.SyntaxKind.NullKeyword);
        const statements: ts.Statement[] = [
            ts.updateClassDeclaration(node, 
            /*decorators*/ undefined, node.modifiers, node.name, 
            /*typeParameters*/ undefined, ts.visitNodes(node.heritageClauses, visitor, ts.isHeritageClause), transformClassMembers(node, isDerivedClass))
        ];
        // Write any pending expressions from elided or moved computed property names
        if (ts.some(pendingExpressions)) {
            statements.push(ts.createExpressionStatement(ts.inlineExpressions(pendingExpressions)));
        }
        pendingExpressions = savedPendingExpressions;
        // Emit static property assignment. Because classDeclaration is lexically evaluated,
        // it is safe to emit static property assignment after classDeclaration
        // From ES6 specification:
        //      HasLexicalDeclaration (N) : Determines if the argument identifier has a binding in this environment record that was created using
        //                                  a lexical declaration such as a LexicalDeclaration or a ClassDeclaration.
        const staticProperties = ts.getProperties(node, /*requireInitializer*/ true, /*isStatic*/ true);
        if (ts.some(staticProperties)) {
            addPropertyStatements(statements, staticProperties, ts.getInternalName(node));
        }
        return statements;
    }
    function visitClassExpression(node: ts.ClassExpression): ts.Expression {
        if (!ts.forEach(node.members, ts.isPropertyDeclaration)) {
            return ts.visitEachChild(node, visitor, context);
        }
        const savedPendingExpressions = pendingExpressions;
        pendingExpressions = undefined;
        // If this class expression is a transformation of a decorated class declaration,
        // then we want to output the pendingExpressions as statements, not as inlined
        // expressions with the class statement.
        //
        // In this case, we use pendingStatements to produce the same output as the
        // class declaration transformation. The VariableStatement visitor will insert
        // these statements after the class expression variable statement.
        const isDecoratedClassDeclaration = ts.isClassDeclaration(ts.getOriginalNode(node));
        const staticProperties = ts.getProperties(node, /*requireInitializer*/ true, /*isStatic*/ true);
        const extendsClauseElement = ts.getEffectiveBaseTypeNode(node);
        const isDerivedClass = !!(extendsClauseElement && ts.skipOuterExpressions(extendsClauseElement.expression).kind !== ts.SyntaxKind.NullKeyword);
        const classExpression = ts.updateClassExpression(node, node.modifiers, node.name, 
        /*typeParameters*/ undefined, ts.visitNodes(node.heritageClauses, visitor, ts.isHeritageClause), transformClassMembers(node, isDerivedClass));
        if (ts.some(staticProperties) || ts.some(pendingExpressions)) {
            if (isDecoratedClassDeclaration) {
                ts.Debug.assertDefined(pendingStatements, "Decorated classes transformed by TypeScript are expected to be within a variable declaration.");
                // Write any pending expressions from elided or moved computed property names
                if (pendingStatements && pendingExpressions && ts.some(pendingExpressions)) {
                    pendingStatements.push(ts.createExpressionStatement(ts.inlineExpressions(pendingExpressions)));
                }
                pendingExpressions = savedPendingExpressions;
                if (pendingStatements && ts.some(staticProperties)) {
                    addPropertyStatements(pendingStatements, staticProperties, ts.getInternalName(node));
                }
                return classExpression;
            }
            else {
                const expressions: ts.Expression[] = [];
                const isClassWithConstructorReference = resolver.getNodeCheckFlags(node) & ts.NodeCheckFlags.ClassWithConstructorReference;
                const temp = ts.createTempVariable(hoistVariableDeclaration, !!isClassWithConstructorReference);
                if (isClassWithConstructorReference) {
                    // record an alias as the class name is not in scope for statics.
                    enableSubstitutionForClassAliases();
                    const alias = ts.getSynthesizedClone(temp);
                    alias.autoGenerateFlags &= ~ts.GeneratedIdentifierFlags.ReservedInNestedScopes;
                    classAliases[ts.getOriginalNodeId(node)] = alias;
                }
                // To preserve the behavior of the old emitter, we explicitly indent
                // the body of a class with static initializers.
                ts.setEmitFlags(classExpression, ts.EmitFlags.Indented | ts.getEmitFlags(classExpression));
                expressions.push(ts.startOnNewLine(ts.createAssignment(temp, classExpression)));
                // Add any pending expressions leftover from elided or relocated computed property names
                ts.addRange(expressions, ts.map(pendingExpressions, ts.startOnNewLine));
                ts.addRange(expressions, generateInitializedPropertyExpressions(staticProperties, temp));
                expressions.push(ts.startOnNewLine(temp));
                pendingExpressions = savedPendingExpressions;
                return ts.inlineExpressions(expressions);
            }
        }
        pendingExpressions = savedPendingExpressions;
        return classExpression;
    }
    function transformClassMembers(node: ts.ClassDeclaration | ts.ClassExpression, isDerivedClass: boolean) {
        const members: ts.ClassElement[] = [];
        const constructor = transformConstructor(node, isDerivedClass);
        if (constructor) {
            members.push(constructor);
        }
        ts.addRange(members, ts.visitNodes(node.members, classElementVisitor, ts.isClassElement));
        return ts.setTextRange(ts.createNodeArray(members), /*location*/ node.members);
    }
    function transformConstructor(node: ts.ClassDeclaration | ts.ClassExpression, isDerivedClass: boolean) {
        const constructor = ts.visitNode(ts.getFirstConstructorWithBody(node), visitor, ts.isConstructorDeclaration);
        const containsProperty = ts.forEach(node.members, m => ts.isInitializedProperty(m, /*requireInitializer*/ !context.getCompilerOptions().useDefineForClassFields));
        if (!containsProperty) {
            return constructor;
        }
        const parameters = ts.visitParameterList(constructor ? constructor.parameters : undefined, visitor, context);
        const body = transformConstructorBody(node, constructor, isDerivedClass);
        if (!body) {
            return undefined;
        }
        return ts.startOnNewLine(ts.setOriginalNode(ts.setTextRange(ts.createConstructor(
        /*decorators*/ undefined, 
        /*modifiers*/ undefined, parameters, body), constructor || node), constructor));
    }
    function transformConstructorBody(node: ts.ClassDeclaration | ts.ClassExpression, constructor: ts.ConstructorDeclaration | undefined, isDerivedClass: boolean) {
        const useDefineForClassFields = context.getCompilerOptions().useDefineForClassFields;
        const properties = ts.getProperties(node, /*requireInitializer*/ !useDefineForClassFields, /*isStatic*/ false);
        // Only generate synthetic constructor when there are property initializers to move.
        if (!constructor && !ts.some(properties)) {
            return ts.visitFunctionBody(/*node*/ undefined, visitor, context);
        }
        resumeLexicalEnvironment();
        let indexOfFirstStatement = 0;
        let statements: ts.Statement[] = [];
        if (!constructor && isDerivedClass) {
            // Add a synthetic `super` call:
            //
            //  super(...arguments);
            //
            statements.push(ts.createExpressionStatement(ts.createCall(ts.createSuper(), 
            /*typeArguments*/ undefined, [ts.createSpread(ts.createIdentifier("arguments"))])));
        }
        if (constructor) {
            indexOfFirstStatement = ts.addPrologueDirectivesAndInitialSuperCall(constructor, statements, visitor);
        }
        // Add the property initializers. Transforms this:
        //
        //  public x = 1;
        //
        // Into this:
        //
        //  constructor() {
        //      this.x = 1;
        //  }
        //
        if (constructor?.body) {
            let afterParameterProperties = ts.findIndex(constructor.body.statements, s => !ts.isParameterPropertyDeclaration(ts.getOriginalNode(s), constructor), indexOfFirstStatement);
            if (afterParameterProperties === -1) {
                afterParameterProperties = constructor.body.statements.length;
            }
            if (afterParameterProperties > indexOfFirstStatement) {
                if (!useDefineForClassFields) {
                    ts.addRange(statements, ts.visitNodes(constructor.body.statements, visitor, ts.isStatement, indexOfFirstStatement, afterParameterProperties - indexOfFirstStatement));
                }
                indexOfFirstStatement = afterParameterProperties;
            }
        }
        addPropertyStatements(statements, properties, ts.createThis());
        // Add existing statements, skipping the initial super call.
        if (constructor) {
            ts.addRange(statements, ts.visitNodes(constructor.body!.statements, visitor, ts.isStatement, indexOfFirstStatement));
        }
        statements = ts.mergeLexicalEnvironment(statements, endLexicalEnvironment());
        return ts.setTextRange(ts.createBlock(ts.setTextRange(ts.createNodeArray(statements), 
        /*location*/ constructor ? constructor.body!.statements : node.members), 
        /*multiLine*/ true), 
        /*location*/ constructor ? constructor.body : undefined);
    }
    /**
     * Generates assignment statements for property initializers.
     *
     * @param properties An array of property declarations to transform.
     * @param receiver The receiver on which each property should be assigned.
     */
    function addPropertyStatements(statements: ts.Statement[], properties: readonly ts.PropertyDeclaration[], receiver: ts.LeftHandSideExpression) {
        for (const property of properties) {
            const statement = ts.createExpressionStatement(transformInitializedProperty(property, receiver));
            ts.setSourceMapRange(statement, ts.moveRangePastModifiers(property));
            ts.setCommentRange(statement, property);
            ts.setOriginalNode(statement, property);
            statements.push(statement);
        }
    }
    /**
     * Generates assignment expressions for property initializers.
     *
     * @param properties An array of property declarations to transform.
     * @param receiver The receiver on which each property should be assigned.
     */
    function generateInitializedPropertyExpressions(properties: readonly ts.PropertyDeclaration[], receiver: ts.LeftHandSideExpression) {
        const expressions: ts.Expression[] = [];
        for (const property of properties) {
            const expression = transformInitializedProperty(property, receiver);
            ts.startOnNewLine(expression);
            ts.setSourceMapRange(expression, ts.moveRangePastModifiers(property));
            ts.setCommentRange(expression, property);
            ts.setOriginalNode(expression, property);
            expressions.push(expression);
        }
        return expressions;
    }
    /**
     * Transforms a property initializer into an assignment statement.
     *
     * @param property The property declaration.
     * @param receiver The object receiving the property assignment.
     */
    function transformInitializedProperty(property: ts.PropertyDeclaration, receiver: ts.LeftHandSideExpression) {
        // We generate a name here in order to reuse the value cached by the relocated computed name expression (which uses the same generated name)
        const emitAssignment = !context.getCompilerOptions().useDefineForClassFields;
        const propertyName = ts.isComputedPropertyName(property.name) && !ts.isSimpleInlineableExpression(property.name.expression)
            ? ts.updateComputedPropertyName(property.name, ts.getGeneratedNameForNode(property.name))
            : property.name;
        const initializer = property.initializer || emitAssignment ? ts.visitNode(property.initializer, visitor, ts.isExpression)
            : ts.hasModifier(ts.getOriginalNode(property), ts.ModifierFlags.ParameterPropertyModifier) && ts.isIdentifier(propertyName) ? propertyName
                : ts.createVoidZero();
        if (emitAssignment) {
            const memberAccess = ts.createMemberAccessForPropertyName(receiver, propertyName, /*location*/ propertyName);
            return ts.createAssignment(memberAccess, initializer);
        }
        else {
            const name = ts.isComputedPropertyName(propertyName) ? propertyName.expression
                : ts.isIdentifier(propertyName) ? ts.createStringLiteral(ts.unescapeLeadingUnderscores(propertyName.escapedText))
                    : propertyName;
            const descriptor = ts.createPropertyDescriptor({ value: initializer, configurable: true, writable: true, enumerable: true });
            return ts.createObjectDefinePropertyCall(receiver, name, descriptor);
        }
    }
    function enableSubstitutionForClassAliases() {
        if ((enabledSubstitutions & ClassPropertySubstitutionFlags.ClassAliases) === 0) {
            enabledSubstitutions |= ClassPropertySubstitutionFlags.ClassAliases;
            // We need to enable substitutions for identifiers. This allows us to
            // substitute class names inside of a class declaration.
            context.enableSubstitution(ts.SyntaxKind.Identifier);
            // Keep track of class aliases.
            classAliases = [];
        }
    }
    /**
     * Hooks node substitutions.
     *
     * @param hint The context for the emitter.
     * @param node The node to substitute.
     */
    function onSubstituteNode(hint: ts.EmitHint, node: ts.Node) {
        node = previousOnSubstituteNode(hint, node);
        if (hint === ts.EmitHint.Expression) {
            return substituteExpression((node as ts.Expression));
        }
        return node;
    }
    function substituteExpression(node: ts.Expression) {
        switch (node.kind) {
            case ts.SyntaxKind.Identifier:
                return substituteExpressionIdentifier((node as ts.Identifier));
        }
        return node;
    }
    function substituteExpressionIdentifier(node: ts.Identifier): ts.Expression {
        return trySubstituteClassAlias(node) || node;
    }
    function trySubstituteClassAlias(node: ts.Identifier): ts.Expression | undefined {
        if (enabledSubstitutions & ClassPropertySubstitutionFlags.ClassAliases) {
            if (resolver.getNodeCheckFlags(node) & ts.NodeCheckFlags.ConstructorReferenceInClass) {
                // Due to the emit for class decorators, any reference to the class from inside of the class body
                // must instead be rewritten to point to a temporary variable to avoid issues with the double-bind
                // behavior of class names in ES6.
                // Also, when emitting statics for class expressions, we must substitute a class alias for
                // constructor references in static property initializers.
                const declaration = resolver.getReferencedValueDeclaration(node);
                if (declaration) {
                    const classAlias = classAliases[declaration.id!]; // TODO: GH#18217
                    if (classAlias) {
                        const clone = ts.getSynthesizedClone(classAlias);
                        ts.setSourceMapRange(clone, node);
                        ts.setCommentRange(clone, node);
                        return clone;
                    }
                }
            }
        }
        return undefined;
    }
    /**
     * If the name is a computed property, this function transforms it, then either returns an expression which caches the
     * value of the result or the expression itself if the value is either unused or safe to inline into multiple locations
     * @param shouldHoist Does the expression need to be reused? (ie, for an initializer or a decorator)
     */
    function getPropertyNameExpressionIfNeeded(name: ts.PropertyName, shouldHoist: boolean): ts.Expression | undefined {
        if (ts.isComputedPropertyName(name)) {
            const expression = ts.visitNode(name.expression, visitor, ts.isExpression);
            const innerExpression = ts.skipPartiallyEmittedExpressions(expression);
            const inlinable = ts.isSimpleInlineableExpression(innerExpression);
            const alreadyTransformed = ts.isAssignmentExpression(innerExpression) && ts.isGeneratedIdentifier(innerExpression.left);
            if (!alreadyTransformed && !inlinable && shouldHoist) {
                const generatedName = ts.getGeneratedNameForNode(name);
                hoistVariableDeclaration(generatedName);
                return ts.createAssignment(generatedName, expression);
            }
            return (inlinable || ts.isIdentifier(innerExpression)) ? undefined : expression;
        }
    }
}
