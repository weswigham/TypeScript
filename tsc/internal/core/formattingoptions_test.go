package core_test

import (
	"testing"

	"github.com/microsoft/TypeScript/tsc/internal/core"
	"github.com/microsoft/TypeScript/tsc/internal/json"
	"gotest.tools/v3/assert"
)

func TestFormattingOptionsCloneAndJSON(t *testing.T) {
	t.Parallel()
	options := &core.FormattingOptions{
		IndentSize:          new(0),
		TabSize:             new(2),
		IndentStyle:         new(core.FormattingIndentStyleNone),
		Semicolons:          new(core.FormattingSemicolonPreferenceIgnore),
		ConvertTabsToSpaces: core.TSFalse,
	}
	clone := options.Clone()
	assert.Assert(t, clone.Equals(options))
	*clone.IndentSize = 4
	assert.Equal(t, *options.IndentSize, 0)
	assert.Assert(t, !clone.Equals(options))
	data, err := json.Marshal(options)
	assert.NilError(t, err)
	var restored core.FormattingOptions
	assert.NilError(t, json.Unmarshal(data, &restored))
	assert.Assert(t, restored.Equals(options))
	assert.Assert(t, (*core.FormattingOptions)(nil).Clone() == nil)
	assert.Assert(t, !options.Equals(nil))
}
