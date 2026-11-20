package host

import (
	"io"

	"github.com/microsoft/TypeScript/tsc/internal/tspath"
)

type Spawner interface {
	Spawn(command []string, dir string, stderr io.Writer) (io.ReadWriteCloser, error)
}

type Options struct {
	CurrentDirectory tspath.RootedDirectoryPath
	Command          []string
	ResolveCommand   func() ([]string, error)
	Workers          int
	Stderr           io.Writer
}

type PluginOptions struct {
	CurrentDirectory  string            `json:"currentDirectory"`
	Plugins           map[string]string `json:"plugins"`
	PluginResolveFrom map[string]string `json:"pluginResolveFrom,omitempty"`
	CompilerOptions   map[string]any    `json:"compilerOptions,omitempty"`
}

type Fix struct {
	Range [2]int `json:"range"`
	Text  string `json:"text"`
}

type Suggestion struct {
	Description string `json:"desc"`
	Fix         Fix    `json:"fix"`
}

type Message struct {
	RuleID      string       `json:"ruleId"`
	Severity    int          `json:"severity"`
	Message     string       `json:"message"`
	MessageID   string       `json:"messageId,omitzero"`
	Start       int          `json:"start"`
	End         int          `json:"end"`
	Fix         *Fix         `json:"fix,omitzero"`
	Suggestions []Suggestion `json:"suggestions,omitempty"`
}

type FileResult struct {
	FileName string    `json:"fileName"`
	Messages []Message `json:"messages"`
	Error    string    `json:"error,omitempty"`
}

type BatchResult struct {
	Files []FileResult `json:"files"`
}
