/* @internal */
namespace ts.codefix {
    const fixName = "strictClassInitialization";
    const fixIdAddDefiniteAssignmentAssertions = "addMissingPropertyDefiniteAssignmentAssertions";
    const fixIdAddUndefinedType = "addMissingPropertyUndefinedType";
    const fixIdAddInitializer = "addMissingPropertyInitializer";
    const errorCodes = [ts.Diagnostics.Property_0_has_no_initializer_and_is_not_definitely_assigned_in_the_constructor.code];
    ts.codefix.registerCodeFix({
        errorCodes,
        getCodeActions: (context) => {
            const propertyDeclaration = getPropertyDeclaration(context.sourceFile, context.span.start);
            if (!propertyDeclaration)
                return;
            const result = [
                getActionForAddMissingUndefinedType(context, propertyDeclaration),
                getActionForAddMissingDefiniteAssignmentAssertion(context, propertyDeclaration)
            ];
            ts.append(result, getActionForAddMissingInitializer(context, propertyDeclaration));
            return result;
        },
        fixIds: [fixIdAddDefiniteAssignmentAssertions, fixIdAddUndefinedType, fixIdAddInitializer],
        getAllCodeActions: context => {
            return ts.codefix.codeFixAll(context, errorCodes, (changes, diag) => {
                const propertyDeclaration = getPropertyDeclaration(diag.file, diag.start);
                if (!propertyDeclaration)
                    return;
                switch (context.fixId) {
                    case fixIdAddDefiniteAssignmentAssertions:
                        addDefiniteAssignmentAssertion(changes, diag.file, propertyDeclaration);
                        break;
                    case fixIdAddUndefinedType:
                        addUndefinedType(changes, diag.file, propertyDeclaration);
                        break;
                    case fixIdAddInitializer:
                        const checker = context.program.getTypeChecker();
                        const initializer = getInitializer(checker, propertyDeclaration);
                        if (!initializer)
                            return;
                        addInitializer(changes, diag.file, propertyDeclaration, initializer);
                        break;
                    default:
                        ts.Debug.fail(JSON.stringify(context.fixId));
                }
            });
        },
    });
    function getPropertyDeclaration(sourceFile: ts.SourceFile, pos: number): ts.PropertyDeclaration | undefined {
        const token = ts.getTokenAtPosition(sourceFile, pos);
        return ts.isIdentifier(token) ? ts.cast(token.parent, ts.isPropertyDeclaration) : undefined;
    }
    function getActionForAddMissingDefiniteAssignmentAssertion(context: ts.CodeFixContext, propertyDeclaration: ts.PropertyDeclaration): ts.CodeFixAction {
        const changes = ts.textChanges.ChangeTracker.with(context, t => addDefiniteAssignmentAssertion(t, context.sourceFile, propertyDeclaration));
        return ts.codefix.createCodeFixAction(fixName, changes, [ts.Diagnostics.Add_definite_assignment_assertion_to_property_0, propertyDeclaration.getText()], fixIdAddDefiniteAssignmentAssertions, ts.Diagnostics.Add_definite_assignment_assertions_to_all_uninitialized_properties);
    }
    function addDefiniteAssignmentAssertion(changeTracker: ts.textChanges.ChangeTracker, propertyDeclarationSourceFile: ts.SourceFile, propertyDeclaration: ts.PropertyDeclaration): void {
        const property = ts.updateProperty(propertyDeclaration, propertyDeclaration.decorators, propertyDeclaration.modifiers, propertyDeclaration.name, ts.createToken(ts.SyntaxKind.ExclamationToken), propertyDeclaration.type, propertyDeclaration.initializer);
        changeTracker.replaceNode(propertyDeclarationSourceFile, propertyDeclaration, property);
    }
    function getActionForAddMissingUndefinedType(context: ts.CodeFixContext, propertyDeclaration: ts.PropertyDeclaration): ts.CodeFixAction {
        const changes = ts.textChanges.ChangeTracker.with(context, t => addUndefinedType(t, context.sourceFile, propertyDeclaration));
        return ts.codefix.createCodeFixAction(fixName, changes, [ts.Diagnostics.Add_undefined_type_to_property_0, propertyDeclaration.name.getText()], fixIdAddUndefinedType, ts.Diagnostics.Add_undefined_type_to_all_uninitialized_properties);
    }
    function addUndefinedType(changeTracker: ts.textChanges.ChangeTracker, propertyDeclarationSourceFile: ts.SourceFile, propertyDeclaration: ts.PropertyDeclaration): void {
        const undefinedTypeNode = ts.createKeywordTypeNode(ts.SyntaxKind.UndefinedKeyword);
        const type = propertyDeclaration.type!; // TODO: GH#18217
        const types = ts.isUnionTypeNode(type) ? type.types.concat(undefinedTypeNode) : [type, undefinedTypeNode];
        changeTracker.replaceNode(propertyDeclarationSourceFile, type, ts.createUnionTypeNode(types));
    }
    function getActionForAddMissingInitializer(context: ts.CodeFixContext, propertyDeclaration: ts.PropertyDeclaration): ts.CodeFixAction | undefined {
        const checker = context.program.getTypeChecker();
        const initializer = getInitializer(checker, propertyDeclaration);
        if (!initializer)
            return undefined;
        const changes = ts.textChanges.ChangeTracker.with(context, t => addInitializer(t, context.sourceFile, propertyDeclaration, initializer));
        return ts.codefix.createCodeFixAction(fixName, changes, [ts.Diagnostics.Add_initializer_to_property_0, propertyDeclaration.name.getText()], fixIdAddInitializer, ts.Diagnostics.Add_initializers_to_all_uninitialized_properties);
    }
    function addInitializer(changeTracker: ts.textChanges.ChangeTracker, propertyDeclarationSourceFile: ts.SourceFile, propertyDeclaration: ts.PropertyDeclaration, initializer: ts.Expression): void {
        const property = ts.updateProperty(propertyDeclaration, propertyDeclaration.decorators, propertyDeclaration.modifiers, propertyDeclaration.name, propertyDeclaration.questionToken, propertyDeclaration.type, initializer);
        changeTracker.replaceNode(propertyDeclarationSourceFile, propertyDeclaration, property);
    }
    function getInitializer(checker: ts.TypeChecker, propertyDeclaration: ts.PropertyDeclaration): ts.Expression | undefined {
        return getDefaultValueFromType(checker, checker.getTypeFromTypeNode(propertyDeclaration.type!)); // TODO: GH#18217
    }
    function getDefaultValueFromType(checker: ts.TypeChecker, type: ts.Type): ts.Expression | undefined {
        if (type.flags & ts.TypeFlags.BooleanLiteral) {
            return (type === checker.getFalseType() || type === checker.getFalseType(/*fresh*/ true)) ? ts.createFalse() : ts.createTrue();
        }
        else if (type.isLiteral()) {
            return ts.createLiteral(type.value);
        }
        else if (type.isUnion()) {
            return ts.firstDefined(type.types, t => getDefaultValueFromType(checker, t));
        }
        else if (type.isClass()) {
            const classDeclaration = ts.getClassLikeDeclarationOfSymbol(type.symbol);
            if (!classDeclaration || ts.hasModifier(classDeclaration, ts.ModifierFlags.Abstract))
                return undefined;
            const constructorDeclaration = ts.getFirstConstructorWithBody(classDeclaration);
            if (constructorDeclaration && constructorDeclaration.parameters.length)
                return undefined;
            return ts.createNew(ts.createIdentifier(type.symbol.name), /*typeArguments*/ undefined, /*argumentsArray*/ undefined);
        }
        else if (checker.isArrayLikeType(type)) {
            return ts.createArrayLiteral();
        }
        return undefined;
    }
}
