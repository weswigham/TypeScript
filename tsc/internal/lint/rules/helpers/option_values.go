package helpers

func SemanticOptionArray(value any) []any {
	switch value := value.(type) {
	case []any:
		return value
	case []string:
		result := make([]any, len(value))
		for index, text := range value {
			result[index] = text
		}
		return result
	}
	return nil
}

func SemanticOptionStrings(value any) []string {
	var result []string
	for _, entry := range SemanticOptionArray(value) {
		if text, ok := entry.(string); ok {
			result = append(result, text)
		}
	}
	return result
}

func SemanticRuleOptions(options []any) map[string]any {
	if len(options) > 0 {
		if object, ok := options[0].(map[string]any); ok {
			return object
		}
	}
	return nil
}

func SemanticBooleanOption(context Context, name string, fallback bool) bool {
	if len(context.Options) > 0 {
		if options, ok := context.Options[0].(map[string]any); ok {
			if value, ok := options[name].(bool); ok {
				return value
			}
		}
	}
	return fallback
}

func SemanticOptionNames(value any) []string {
	switch value := value.(type) {
	case string:
		return []string{value}
	case []string:
		return value
	case []any:
		var result []string
		for _, item := range value {
			if name, ok := item.(string); ok {
				result = append(result, name)
			}
		}
		return result
	}
	return nil
}
