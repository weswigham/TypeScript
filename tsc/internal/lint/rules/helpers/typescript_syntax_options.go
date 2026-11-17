package helpers

func TypescriptSyntaxStrings(value any) []string {
	if list, ok := value.([]string); ok {
		return list
	}
	var result []string
	if list, ok := value.([]any); ok {
		for _, entry := range list {
			if text, ok := entry.(string); ok {
				result = append(result, text)
			}
		}
	}
	return result
}
