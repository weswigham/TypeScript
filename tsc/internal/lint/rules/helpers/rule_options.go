package helpers

func SharedRuleBool(option map[string]any, name string, fallback bool) bool {
	value, ok := option[name].(bool)
	if ok {
		return value
	}
	return fallback
}

func SharedRuleStrings(value any) []string {
	if values, ok := value.([]string); ok {
		return values
	}
	var result []string
	if values, ok := value.([]any); ok {
		for _, value := range values {
			if text, ok := value.(string); ok {
				result = append(result, text)
			}
		}
	}
	return result
}

func SharedRuleOptions(options []any, index int) map[string]any {
	if index < len(options) {
		option, _ := options[index].(map[string]any)
		return option
	}
	return nil
}

func SharedRuleBoolean(options []any, name string, fallback bool) bool {
	if len(options) > 0 {
		option, _ := options[0].(map[string]any)
		return SharedRuleBool(option, name, fallback)
	}
	return fallback
}
