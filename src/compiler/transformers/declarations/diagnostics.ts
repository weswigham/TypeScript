/* @internal */
namespace ts {
    export type GetSymbolAccessibilityDiagnostic = (symbolAccessibilityResult: ts.SymbolAccessibilityResult) => (SymbolAccessibilityDiagnostic | undefined);
    export interface SymbolAccessibilityDiagnostic {
        errorNode: ts.Node;
        diagnosticMessage: ts.DiagnosticMessage;
        typeName?: ts.DeclarationName | ts.QualifiedName;
    }
    export type DeclarationDiagnosticProducing = ts.VariableDeclaration | ts.PropertyDeclaration | ts.PropertySignature | ts.BindingElement | ts.SetAccessorDeclaration | ts.GetAccessorDeclaration | ts.ConstructSignatureDeclaration | ts.CallSignatureDeclaration | ts.MethodDeclaration | ts.MethodSignature | ts.FunctionDeclaration | ts.ParameterDeclaration | ts.TypeParameterDeclaration | ts.ExpressionWithTypeArguments | ts.ImportEqualsDeclaration | ts.TypeAliasDeclaration | ts.ConstructorDeclaration | ts.IndexSignatureDeclaration | ts.PropertyAccessExpression;
    export function canProduceDiagnostics(node: ts.Node): node is DeclarationDiagnosticProducing {
        return ts.isVariableDeclaration(node) ||
            ts.isPropertyDeclaration(node) ||
            ts.isPropertySignature(node) ||
            ts.isBindingElement(node) ||
            ts.isSetAccessor(node) ||
            ts.isGetAccessor(node) ||
            ts.isConstructSignatureDeclaration(node) ||
            ts.isCallSignatureDeclaration(node) ||
            ts.isMethodDeclaration(node) ||
            ts.isMethodSignature(node) ||
            ts.isFunctionDeclaration(node) ||
            ts.isParameter(node) ||
            ts.isTypeParameterDeclaration(node) ||
            ts.isExpressionWithTypeArguments(node) ||
            ts.isImportEqualsDeclaration(node) ||
            ts.isTypeAliasDeclaration(node) ||
            ts.isConstructorDeclaration(node) ||
            ts.isIndexSignatureDeclaration(node) ||
            ts.isPropertyAccessExpression(node);
    }
    export function createGetSymbolAccessibilityDiagnosticForNodeName(node: DeclarationDiagnosticProducing) {
        if (ts.isSetAccessor(node) || ts.isGetAccessor(node)) {
            return getAccessorNameVisibilityError;
        }
        else if (ts.isMethodSignature(node) || ts.isMethodDeclaration(node)) {
            return getMethodNameVisibilityError;
        }
        else {
            return createGetSymbolAccessibilityDiagnosticForNode(node);
        }
        function getAccessorNameVisibilityError(symbolAccessibilityResult: ts.SymbolAccessibilityResult) {
            const diagnosticMessage = getAccessorNameVisibilityDiagnosticMessage(symbolAccessibilityResult);
            return diagnosticMessage !== undefined ? {
                diagnosticMessage,
                errorNode: node,
                typeName: (node as ts.NamedDeclaration).name
            } : undefined;
        }
        function getAccessorNameVisibilityDiagnosticMessage(symbolAccessibilityResult: ts.SymbolAccessibilityResult) {
            if (ts.hasModifier(node, ts.ModifierFlags.Static)) {
                return symbolAccessibilityResult.errorModuleName ?
                    symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                        ts.Diagnostics.Public_static_property_0_of_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                        ts.Diagnostics.Public_static_property_0_of_exported_class_has_or_is_using_name_1_from_private_module_2 :
                    ts.Diagnostics.Public_static_property_0_of_exported_class_has_or_is_using_private_name_1;
            }
            else if (node.parent.kind === ts.SyntaxKind.ClassDeclaration) {
                return symbolAccessibilityResult.errorModuleName ?
                    symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                        ts.Diagnostics.Public_property_0_of_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                        ts.Diagnostics.Public_property_0_of_exported_class_has_or_is_using_name_1_from_private_module_2 :
                    ts.Diagnostics.Public_property_0_of_exported_class_has_or_is_using_private_name_1;
            }
            else {
                return symbolAccessibilityResult.errorModuleName ?
                    ts.Diagnostics.Property_0_of_exported_interface_has_or_is_using_name_1_from_private_module_2 :
                    ts.Diagnostics.Property_0_of_exported_interface_has_or_is_using_private_name_1;
            }
        }
        function getMethodNameVisibilityError(symbolAccessibilityResult: ts.SymbolAccessibilityResult): SymbolAccessibilityDiagnostic | undefined {
            const diagnosticMessage = getMethodNameVisibilityDiagnosticMessage(symbolAccessibilityResult);
            return diagnosticMessage !== undefined ? {
                diagnosticMessage,
                errorNode: node,
                typeName: (node as ts.NamedDeclaration).name
            } : undefined;
        }
        function getMethodNameVisibilityDiagnosticMessage(symbolAccessibilityResult: ts.SymbolAccessibilityResult) {
            if (ts.hasModifier(node, ts.ModifierFlags.Static)) {
                return symbolAccessibilityResult.errorModuleName ?
                    symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                        ts.Diagnostics.Public_static_method_0_of_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                        ts.Diagnostics.Public_static_method_0_of_exported_class_has_or_is_using_name_1_from_private_module_2 :
                    ts.Diagnostics.Public_static_method_0_of_exported_class_has_or_is_using_private_name_1;
            }
            else if (node.parent.kind === ts.SyntaxKind.ClassDeclaration) {
                return symbolAccessibilityResult.errorModuleName ?
                    symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                        ts.Diagnostics.Public_method_0_of_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                        ts.Diagnostics.Public_method_0_of_exported_class_has_or_is_using_name_1_from_private_module_2 :
                    ts.Diagnostics.Public_method_0_of_exported_class_has_or_is_using_private_name_1;
            }
            else {
                return symbolAccessibilityResult.errorModuleName ?
                    ts.Diagnostics.Method_0_of_exported_interface_has_or_is_using_name_1_from_private_module_2 :
                    ts.Diagnostics.Method_0_of_exported_interface_has_or_is_using_private_name_1;
            }
        }
    }
    export function createGetSymbolAccessibilityDiagnosticForNode(node: DeclarationDiagnosticProducing): (symbolAccessibilityResult: ts.SymbolAccessibilityResult) => SymbolAccessibilityDiagnostic | undefined {
        if (ts.isVariableDeclaration(node) || ts.isPropertyDeclaration(node) || ts.isPropertySignature(node) || ts.isPropertyAccessExpression(node) || ts.isBindingElement(node) || ts.isConstructorDeclaration(node)) {
            return getVariableDeclarationTypeVisibilityError;
        }
        else if (ts.isSetAccessor(node) || ts.isGetAccessor(node)) {
            return getAccessorDeclarationTypeVisibilityError;
        }
        else if (ts.isConstructSignatureDeclaration(node) || ts.isCallSignatureDeclaration(node) || ts.isMethodDeclaration(node) || ts.isMethodSignature(node) || ts.isFunctionDeclaration(node) || ts.isIndexSignatureDeclaration(node)) {
            return getReturnTypeVisibilityError;
        }
        else if (ts.isParameter(node)) {
            if (ts.isParameterPropertyDeclaration(node, node.parent) && ts.hasModifier(node.parent, ts.ModifierFlags.Private)) {
                return getVariableDeclarationTypeVisibilityError;
            }
            return getParameterDeclarationTypeVisibilityError;
        }
        else if (ts.isTypeParameterDeclaration(node)) {
            return getTypeParameterConstraintVisibilityError;
        }
        else if (ts.isExpressionWithTypeArguments(node)) {
            return getHeritageClauseVisibilityError;
        }
        else if (ts.isImportEqualsDeclaration(node)) {
            return getImportEntityNameVisibilityError;
        }
        else if (ts.isTypeAliasDeclaration(node)) {
            return getTypeAliasDeclarationVisibilityError;
        }
        else {
            return ts.Debug.assertNever(node, `Attempted to set a declaration diagnostic context for unhandled node kind: ${(ts as any).SyntaxKind[(node as any).kind]}`);
        }
        function getVariableDeclarationTypeVisibilityDiagnosticMessage(symbolAccessibilityResult: ts.SymbolAccessibilityResult) {
            if (node.kind === ts.SyntaxKind.VariableDeclaration || node.kind === ts.SyntaxKind.BindingElement) {
                return symbolAccessibilityResult.errorModuleName ?
                    symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                        ts.Diagnostics.Exported_variable_0_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                        ts.Diagnostics.Exported_variable_0_has_or_is_using_name_1_from_private_module_2 :
                    ts.Diagnostics.Exported_variable_0_has_or_is_using_private_name_1;
            }
            // This check is to ensure we don't report error on constructor parameter property as that error would be reported during parameter emit
            // The only exception here is if the constructor was marked as private. we are not emitting the constructor parameters at all.
            else if (node.kind === ts.SyntaxKind.PropertyDeclaration || node.kind === ts.SyntaxKind.PropertyAccessExpression || node.kind === ts.SyntaxKind.PropertySignature ||
                (node.kind === ts.SyntaxKind.Parameter && ts.hasModifier(node.parent, ts.ModifierFlags.Private))) {
                // TODO(jfreeman): Deal with computed properties in error reporting.
                if (ts.hasModifier(node, ts.ModifierFlags.Static)) {
                    return symbolAccessibilityResult.errorModuleName ?
                        symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                            ts.Diagnostics.Public_static_property_0_of_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                            ts.Diagnostics.Public_static_property_0_of_exported_class_has_or_is_using_name_1_from_private_module_2 :
                        ts.Diagnostics.Public_static_property_0_of_exported_class_has_or_is_using_private_name_1;
                }
                else if (node.parent.kind === ts.SyntaxKind.ClassDeclaration || node.kind === ts.SyntaxKind.Parameter) {
                    return symbolAccessibilityResult.errorModuleName ?
                        symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                            ts.Diagnostics.Public_property_0_of_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                            ts.Diagnostics.Public_property_0_of_exported_class_has_or_is_using_name_1_from_private_module_2 :
                        ts.Diagnostics.Public_property_0_of_exported_class_has_or_is_using_private_name_1;
                }
                else {
                    // Interfaces cannot have types that cannot be named
                    return symbolAccessibilityResult.errorModuleName ?
                        ts.Diagnostics.Property_0_of_exported_interface_has_or_is_using_name_1_from_private_module_2 :
                        ts.Diagnostics.Property_0_of_exported_interface_has_or_is_using_private_name_1;
                }
            }
        }
        function getVariableDeclarationTypeVisibilityError(symbolAccessibilityResult: ts.SymbolAccessibilityResult): SymbolAccessibilityDiagnostic | undefined {
            const diagnosticMessage = getVariableDeclarationTypeVisibilityDiagnosticMessage(symbolAccessibilityResult);
            return diagnosticMessage !== undefined ? {
                diagnosticMessage,
                errorNode: node,
                typeName: (node as ts.NamedDeclaration).name
            } : undefined;
        }
        function getAccessorDeclarationTypeVisibilityError(symbolAccessibilityResult: ts.SymbolAccessibilityResult): SymbolAccessibilityDiagnostic {
            let diagnosticMessage: ts.DiagnosticMessage;
            if (node.kind === ts.SyntaxKind.SetAccessor) {
                // Getters can infer the return type from the returned expression, but setters cannot, so the
                // "_from_external_module_1_but_cannot_be_named" case cannot occur.
                if (ts.hasModifier(node, ts.ModifierFlags.Static)) {
                    diagnosticMessage = symbolAccessibilityResult.errorModuleName ?
                        ts.Diagnostics.Parameter_type_of_public_static_setter_0_from_exported_class_has_or_is_using_name_1_from_private_module_2 :
                        ts.Diagnostics.Parameter_type_of_public_static_setter_0_from_exported_class_has_or_is_using_private_name_1;
                }
                else {
                    diagnosticMessage = symbolAccessibilityResult.errorModuleName ?
                        ts.Diagnostics.Parameter_type_of_public_setter_0_from_exported_class_has_or_is_using_name_1_from_private_module_2 :
                        ts.Diagnostics.Parameter_type_of_public_setter_0_from_exported_class_has_or_is_using_private_name_1;
                }
            }
            else {
                if (ts.hasModifier(node, ts.ModifierFlags.Static)) {
                    diagnosticMessage = symbolAccessibilityResult.errorModuleName ?
                        symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                            ts.Diagnostics.Return_type_of_public_static_getter_0_from_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                            ts.Diagnostics.Return_type_of_public_static_getter_0_from_exported_class_has_or_is_using_name_1_from_private_module_2 :
                        ts.Diagnostics.Return_type_of_public_static_getter_0_from_exported_class_has_or_is_using_private_name_1;
                }
                else {
                    diagnosticMessage = symbolAccessibilityResult.errorModuleName ?
                        symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                            ts.Diagnostics.Return_type_of_public_getter_0_from_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                            ts.Diagnostics.Return_type_of_public_getter_0_from_exported_class_has_or_is_using_name_1_from_private_module_2 :
                        ts.Diagnostics.Return_type_of_public_getter_0_from_exported_class_has_or_is_using_private_name_1;
                }
            }
            return {
                diagnosticMessage,
                errorNode: ((node as ts.NamedDeclaration).name!),
                typeName: (node as ts.NamedDeclaration).name
            };
        }
        function getReturnTypeVisibilityError(symbolAccessibilityResult: ts.SymbolAccessibilityResult): SymbolAccessibilityDiagnostic {
            let diagnosticMessage: ts.DiagnosticMessage;
            switch (node.kind) {
                case ts.SyntaxKind.ConstructSignature:
                    // Interfaces cannot have return types that cannot be named
                    diagnosticMessage = symbolAccessibilityResult.errorModuleName ?
                        ts.Diagnostics.Return_type_of_constructor_signature_from_exported_interface_has_or_is_using_name_0_from_private_module_1 :
                        ts.Diagnostics.Return_type_of_constructor_signature_from_exported_interface_has_or_is_using_private_name_0;
                    break;
                case ts.SyntaxKind.CallSignature:
                    // Interfaces cannot have return types that cannot be named
                    diagnosticMessage = symbolAccessibilityResult.errorModuleName ?
                        ts.Diagnostics.Return_type_of_call_signature_from_exported_interface_has_or_is_using_name_0_from_private_module_1 :
                        ts.Diagnostics.Return_type_of_call_signature_from_exported_interface_has_or_is_using_private_name_0;
                    break;
                case ts.SyntaxKind.IndexSignature:
                    // Interfaces cannot have return types that cannot be named
                    diagnosticMessage = symbolAccessibilityResult.errorModuleName ?
                        ts.Diagnostics.Return_type_of_index_signature_from_exported_interface_has_or_is_using_name_0_from_private_module_1 :
                        ts.Diagnostics.Return_type_of_index_signature_from_exported_interface_has_or_is_using_private_name_0;
                    break;
                case ts.SyntaxKind.MethodDeclaration:
                case ts.SyntaxKind.MethodSignature:
                    if (ts.hasModifier(node, ts.ModifierFlags.Static)) {
                        diagnosticMessage = symbolAccessibilityResult.errorModuleName ?
                            symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                                ts.Diagnostics.Return_type_of_public_static_method_from_exported_class_has_or_is_using_name_0_from_external_module_1_but_cannot_be_named :
                                ts.Diagnostics.Return_type_of_public_static_method_from_exported_class_has_or_is_using_name_0_from_private_module_1 :
                            ts.Diagnostics.Return_type_of_public_static_method_from_exported_class_has_or_is_using_private_name_0;
                    }
                    else if (node.parent.kind === ts.SyntaxKind.ClassDeclaration) {
                        diagnosticMessage = symbolAccessibilityResult.errorModuleName ?
                            symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                                ts.Diagnostics.Return_type_of_public_method_from_exported_class_has_or_is_using_name_0_from_external_module_1_but_cannot_be_named :
                                ts.Diagnostics.Return_type_of_public_method_from_exported_class_has_or_is_using_name_0_from_private_module_1 :
                            ts.Diagnostics.Return_type_of_public_method_from_exported_class_has_or_is_using_private_name_0;
                    }
                    else {
                        // Interfaces cannot have return types that cannot be named
                        diagnosticMessage = symbolAccessibilityResult.errorModuleName ?
                            ts.Diagnostics.Return_type_of_method_from_exported_interface_has_or_is_using_name_0_from_private_module_1 :
                            ts.Diagnostics.Return_type_of_method_from_exported_interface_has_or_is_using_private_name_0;
                    }
                    break;
                case ts.SyntaxKind.FunctionDeclaration:
                    diagnosticMessage = symbolAccessibilityResult.errorModuleName ?
                        symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                            ts.Diagnostics.Return_type_of_exported_function_has_or_is_using_name_0_from_external_module_1_but_cannot_be_named :
                            ts.Diagnostics.Return_type_of_exported_function_has_or_is_using_name_0_from_private_module_1 :
                        ts.Diagnostics.Return_type_of_exported_function_has_or_is_using_private_name_0;
                    break;
                default:
                    return ts.Debug.fail("This is unknown kind for signature: " + node.kind);
            }
            return {
                diagnosticMessage,
                errorNode: (node as ts.NamedDeclaration).name || node
            };
        }
        function getParameterDeclarationTypeVisibilityError(symbolAccessibilityResult: ts.SymbolAccessibilityResult): SymbolAccessibilityDiagnostic | undefined {
            const diagnosticMessage: ts.DiagnosticMessage = getParameterDeclarationTypeVisibilityDiagnosticMessage(symbolAccessibilityResult);
            return diagnosticMessage !== undefined ? {
                diagnosticMessage,
                errorNode: node,
                typeName: (node as ts.NamedDeclaration).name
            } : undefined;
        }
        function getParameterDeclarationTypeVisibilityDiagnosticMessage(symbolAccessibilityResult: ts.SymbolAccessibilityResult): ts.DiagnosticMessage {
            switch (node.parent.kind) {
                case ts.SyntaxKind.Constructor:
                    return symbolAccessibilityResult.errorModuleName ?
                        symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                            ts.Diagnostics.Parameter_0_of_constructor_from_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                            ts.Diagnostics.Parameter_0_of_constructor_from_exported_class_has_or_is_using_name_1_from_private_module_2 :
                        ts.Diagnostics.Parameter_0_of_constructor_from_exported_class_has_or_is_using_private_name_1;
                case ts.SyntaxKind.ConstructSignature:
                case ts.SyntaxKind.ConstructorType:
                    // Interfaces cannot have parameter types that cannot be named
                    return symbolAccessibilityResult.errorModuleName ?
                        ts.Diagnostics.Parameter_0_of_constructor_signature_from_exported_interface_has_or_is_using_name_1_from_private_module_2 :
                        ts.Diagnostics.Parameter_0_of_constructor_signature_from_exported_interface_has_or_is_using_private_name_1;
                case ts.SyntaxKind.CallSignature:
                    // Interfaces cannot have parameter types that cannot be named
                    return symbolAccessibilityResult.errorModuleName ?
                        ts.Diagnostics.Parameter_0_of_call_signature_from_exported_interface_has_or_is_using_name_1_from_private_module_2 :
                        ts.Diagnostics.Parameter_0_of_call_signature_from_exported_interface_has_or_is_using_private_name_1;
                case ts.SyntaxKind.IndexSignature:
                    // Interfaces cannot have parameter types that cannot be named
                    return symbolAccessibilityResult.errorModuleName ?
                        ts.Diagnostics.Parameter_0_of_index_signature_from_exported_interface_has_or_is_using_name_1_from_private_module_2 :
                        ts.Diagnostics.Parameter_0_of_index_signature_from_exported_interface_has_or_is_using_private_name_1;
                case ts.SyntaxKind.MethodDeclaration:
                case ts.SyntaxKind.MethodSignature:
                    if (ts.hasModifier(node.parent, ts.ModifierFlags.Static)) {
                        return symbolAccessibilityResult.errorModuleName ?
                            symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                                ts.Diagnostics.Parameter_0_of_public_static_method_from_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                                ts.Diagnostics.Parameter_0_of_public_static_method_from_exported_class_has_or_is_using_name_1_from_private_module_2 :
                            ts.Diagnostics.Parameter_0_of_public_static_method_from_exported_class_has_or_is_using_private_name_1;
                    }
                    else if (node.parent.parent.kind === ts.SyntaxKind.ClassDeclaration) {
                        return symbolAccessibilityResult.errorModuleName ?
                            symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                                ts.Diagnostics.Parameter_0_of_public_method_from_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                                ts.Diagnostics.Parameter_0_of_public_method_from_exported_class_has_or_is_using_name_1_from_private_module_2 :
                            ts.Diagnostics.Parameter_0_of_public_method_from_exported_class_has_or_is_using_private_name_1;
                    }
                    else {
                        // Interfaces cannot have parameter types that cannot be named
                        return symbolAccessibilityResult.errorModuleName ?
                            ts.Diagnostics.Parameter_0_of_method_from_exported_interface_has_or_is_using_name_1_from_private_module_2 :
                            ts.Diagnostics.Parameter_0_of_method_from_exported_interface_has_or_is_using_private_name_1;
                    }
                case ts.SyntaxKind.FunctionDeclaration:
                case ts.SyntaxKind.FunctionType:
                    return symbolAccessibilityResult.errorModuleName ?
                        symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                            ts.Diagnostics.Parameter_0_of_exported_function_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                            ts.Diagnostics.Parameter_0_of_exported_function_has_or_is_using_name_1_from_private_module_2 :
                        ts.Diagnostics.Parameter_0_of_exported_function_has_or_is_using_private_name_1;
                case ts.SyntaxKind.SetAccessor:
                case ts.SyntaxKind.GetAccessor:
                    return symbolAccessibilityResult.errorModuleName ?
                        symbolAccessibilityResult.accessibility === ts.SymbolAccessibility.CannotBeNamed ?
                            ts.Diagnostics.Parameter_0_of_accessor_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                            ts.Diagnostics.Parameter_0_of_accessor_has_or_is_using_name_1_from_private_module_2 :
                        ts.Diagnostics.Parameter_0_of_accessor_has_or_is_using_private_name_1;
                default:
                    return ts.Debug.fail(`Unknown parent for parameter: ${(ts as any).SyntaxKind[node.parent.kind]}`);
            }
        }
        function getTypeParameterConstraintVisibilityError(): SymbolAccessibilityDiagnostic {
            // Type parameter constraints are named by user so we should always be able to name it
            let diagnosticMessage: ts.DiagnosticMessage;
            switch (node.parent.kind) {
                case ts.SyntaxKind.ClassDeclaration:
                    diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_exported_class_has_or_is_using_private_name_1;
                    break;
                case ts.SyntaxKind.InterfaceDeclaration:
                    diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_exported_interface_has_or_is_using_private_name_1;
                    break;
                case ts.SyntaxKind.MappedType:
                    diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_exported_mapped_object_type_is_using_private_name_1;
                    break;
                case ts.SyntaxKind.ConstructorType:
                case ts.SyntaxKind.ConstructSignature:
                    diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_constructor_signature_from_exported_interface_has_or_is_using_private_name_1;
                    break;
                case ts.SyntaxKind.CallSignature:
                    diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_call_signature_from_exported_interface_has_or_is_using_private_name_1;
                    break;
                case ts.SyntaxKind.MethodDeclaration:
                case ts.SyntaxKind.MethodSignature:
                    if (ts.hasModifier(node.parent, ts.ModifierFlags.Static)) {
                        diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_public_static_method_from_exported_class_has_or_is_using_private_name_1;
                    }
                    else if (node.parent.parent.kind === ts.SyntaxKind.ClassDeclaration) {
                        diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_public_method_from_exported_class_has_or_is_using_private_name_1;
                    }
                    else {
                        diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_method_from_exported_interface_has_or_is_using_private_name_1;
                    }
                    break;
                case ts.SyntaxKind.FunctionType:
                case ts.SyntaxKind.FunctionDeclaration:
                    diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_exported_function_has_or_is_using_private_name_1;
                    break;
                case ts.SyntaxKind.TypeAliasDeclaration:
                    diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_exported_type_alias_has_or_is_using_private_name_1;
                    break;
                default:
                    return ts.Debug.fail("This is unknown parent for type parameter: " + node.parent.kind);
            }
            return {
                diagnosticMessage,
                errorNode: node,
                typeName: (node as ts.NamedDeclaration).name
            };
        }
        function getHeritageClauseVisibilityError(): SymbolAccessibilityDiagnostic {
            let diagnosticMessage: ts.DiagnosticMessage;
            // Heritage clause is written by user so it can always be named
            if (node.parent.parent.kind === ts.SyntaxKind.ClassDeclaration) {
                // Class or Interface implemented/extended is inaccessible
                diagnosticMessage = ts.isHeritageClause(node.parent) && node.parent.token === ts.SyntaxKind.ImplementsKeyword ?
                    ts.Diagnostics.Implements_clause_of_exported_class_0_has_or_is_using_private_name_1 :
                    ts.Diagnostics.extends_clause_of_exported_class_0_has_or_is_using_private_name_1;
            }
            else {
                // interface is inaccessible
                diagnosticMessage = ts.Diagnostics.extends_clause_of_exported_interface_0_has_or_is_using_private_name_1;
            }
            return {
                diagnosticMessage,
                errorNode: node,
                typeName: ts.getNameOfDeclaration((node.parent.parent as ts.Declaration))
            };
        }
        function getImportEntityNameVisibilityError(): SymbolAccessibilityDiagnostic {
            return {
                diagnosticMessage: ts.Diagnostics.Import_declaration_0_is_using_private_name_1,
                errorNode: node,
                typeName: (node as ts.NamedDeclaration).name
            };
        }
        function getTypeAliasDeclarationVisibilityError(): SymbolAccessibilityDiagnostic {
            return {
                diagnosticMessage: ts.Diagnostics.Exported_type_alias_0_has_or_is_using_private_name_1,
                errorNode: (node as ts.TypeAliasDeclaration).type,
                typeName: (node as ts.TypeAliasDeclaration).name
            };
        }
    }
}
