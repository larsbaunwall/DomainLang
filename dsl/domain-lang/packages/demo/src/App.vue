<template>
  <div id="app">
    <header class="app-header">
      <div class="title-group">
        <h1>DomainLang Browser Playground</h1>
        <p class="subtitle">Edit a .dlang model on the left, inspect the structured DomainLang output on the right.</p>
      </div>
      <div class="controls">
        <button @click="loadExample">Load Example</button>
        <button @click="share" :disabled="!content">Share</button>
      </div>
    </header>
    <main class="layout">
      <section class="pane editor">
        <div class="pane-header">
          <h2>Model (domain.dlang)</h2>
          <span v-if="isParsing" class="status">Parsing…</span>
          <span v-else class="status">Updated</span>
        </div>
        <div ref="contentEditor" class="monaco-editor"></div>
      </section>
      <section class="pane output">
        <div class="pane-header">
          <h2>Structured Output</h2>
          <span v-if="parseError" class="status error-text">{{ parseError }}</span>
        </div>
        <pre class="ast-view" :class="{ empty: !astJson }">{{ astJson || '/* The AST will appear here once the model parses successfully. */' }}</pre>
        <div v-if="diagnostics.length" class="diagnostics">
          <h3>Diagnostics</h3>
          <ul>
            <li v-for="diag in diagnostics" :key="diag.key" :class="diag.cssClass">
              <strong>{{ diag.label }}</strong>
              <span>Line {{ diag.line }} • {{ diag.message }}</span>
            </li>
          </ul>
        </div>
      </section>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, onUnmounted, ref } from 'vue';
import * as monaco from 'monaco-editor';
import { buildWorkerDefinition } from 'monaco-editor-workers';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import { URI } from 'langium';
import { EmptyFileSystem } from 'langium';
import { createDomainLangServices } from 'domain-lang-language';

const { shared, DomainLang } = createDomainLangServices({ ...EmptyFileSystem });
const documents = shared.workspace.LangiumDocuments;
const documentBuilder = shared.workspace.DocumentBuilder;
const serializer = DomainLang.serializer.JsonSerializer;
const metadata = DomainLang.LanguageMetaData;
const documentUri = URI.parse('memory://domain-lang/demo.dlang');

const baseUri = new URL(document.baseURI);
const workerBaseUrl = new URL('workers/', baseUri);
buildWorkerDefinition(workerBaseUrl.toString(), baseUri.toString(), false);

const defaultContent = `domain ECommerce {
    context Sales {
        aggregate Order {
            entity Order {
                id: String
                customerId: String
                status: OrderStatus
            }
        }
    }

    context Inventory {
        aggregate Product {
            entity Product {
                id: String
                name: String
                price: Money
            }
        }
    }
}`;

type UiDiagnostic = {
  key: string;
  message: string;
  label: string;
  cssClass: string;
  line: number;
};

const severityMap: Record<number, { label: string; css: string }> = {
  1: { label: 'Error', css: 'severity-error' },
  2: { label: 'Warning', css: 'severity-warning' },
  3: { label: 'Info', css: 'severity-info' },
  4: { label: 'Hint', css: 'severity-hint' }
};

async function parseDomainLangModel(text: string): Promise<{ ast: string; diagnostics: UiDiagnostic[] }> {
  if (documents.hasDocument(documentUri)) {
    documents.deleteDocument(documentUri);
  }

  const document = documents.createDocument(documentUri, text);
  await documentBuilder.build([document], { validation: true });

  const astText = serializer.serialize(document.parseResult.value, {
    space: 2,
    refText: true,
    textRegions: true
  });

  const sourceDiagnostics = document.diagnostics ?? [];
  const uiDiagnostics: UiDiagnostic[] = sourceDiagnostics.map((diag, index) => {
    const severity = diag.severity ?? 1;
    const mapped = severityMap[severity] ?? severityMap[1];
    const line = (diag.range?.start.line ?? 0) + 1;
    return {
      key: `${line}-${index}-${mapped.label}`,
      message: diag.message,
      label: mapped.label,
      cssClass: mapped.css,
      line
    };
  });

  return { ast: astText, diagnostics: uiDiagnostics };
}

export default defineComponent({
  name: 'App',
  setup() {
    const contentEditor = ref<HTMLElement>();
    const content = ref(defaultContent);
    const astJson = ref('');
    const diagnostics = ref<UiDiagnostic[]>([]);
    const isParsing = ref(false);
    const parseError = ref('');

    let editorInstance: monaco.editor.IStandaloneCodeEditor | null = null;
    let parseHandle: number | undefined;
    let latestParseToken = 0;

    onMounted(async () => {
      const params = new URLSearchParams(window.location.search);
      const encodedContent = params.get('content');
      if (encodedContent) {
        content.value = decompressFromEncodedURIComponent(encodedContent) || defaultContent;
      }

      await initializeEditor();
      scheduleParse();
    });

    onUnmounted(() => {
      editorInstance?.dispose();
      if (parseHandle) {
        window.clearTimeout(parseHandle);
      }
    });

    async function initializeEditor(): Promise<void> {
      if (!contentEditor.value) {
        return;
      }

      const languageId = metadata.languageId ?? 'domain-lang';
      monaco.languages.register({
        id: languageId,
        extensions: Array.from(metadata.fileExtensions ?? []),
        aliases: metadata.languageId ? [metadata.languageId] : [languageId]
      });

  const monarchModule = await import('domain-lang-language/syntaxes/domain-lang.monarch.js');
      monaco.languages.setMonarchTokensProvider(languageId, monarchModule.default as monaco.languages.IMonarchLanguage);

      editorInstance = monaco.editor.create(contentEditor.value, {
        value: content.value,
        language: languageId,
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: false }
      });

      editorInstance.onDidChangeModelContent(() => {
        content.value = editorInstance?.getValue() ?? '';
        scheduleParse();
      });
    }

    function scheduleParse(): void {
      if (parseHandle) {
        window.clearTimeout(parseHandle);
      }
      parseHandle = window.setTimeout(() => {
        void parseContent();
      }, 200);
    }

    async function parseContent(): Promise<void> {
      if (!content.value.trim()) {
        astJson.value = '';
        diagnostics.value = [];
        return;
      }

      const currentToken = ++latestParseToken;
      isParsing.value = true;
      parseError.value = '';

      try {
        const result = await parseDomainLangModel(content.value);
        if (currentToken !== latestParseToken) {
          return;
        }
        astJson.value = result.ast;
        diagnostics.value = result.diagnostics;
      } catch (error) {
        if (currentToken !== latestParseToken) {
          return;
        }
        astJson.value = '';
        diagnostics.value = [];
        parseError.value = error instanceof Error ? error.message : String(error);
      } finally {
        if (currentToken === latestParseToken) {
          isParsing.value = false;
        }
      }
    }

    function share(): void {
      const encodedContent = compressToEncodedURIComponent(content.value);
      const url = new URL(window.location.href);
      url.searchParams.set('content', encodedContent);
      navigator.clipboard.writeText(url.toString()).then(() => {
        alert('Sharable link copied to clipboard.');
      }).catch(() => {
        prompt('Copy this URL:', url.toString());
      });
    }

    function loadExample(): void {
      if (editorInstance) {
        editorInstance.setValue(defaultContent);
      } else {
        content.value = defaultContent;
        scheduleParse();
      }
    }

    return {
      contentEditor,
      content,
      astJson,
      diagnostics,
      isParsing,
      parseError,
      share,
      loadExample
    };
  }
});
</script>

<style scoped>
#app {
  font-family: Arial, sans-serif;
  color: #f5f7fa;
  background: #10141b;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 1.5rem 2rem 1rem;
  background: #0b1017;
  border-bottom: 1px solid #1f2933;
}

.title-group h1 {
  margin: 0;
  font-size: 1.6rem;
}

.subtitle {
  margin: 0.25rem 0 0;
  color: #9aa5b1;
  font-size: 0.95rem;
}

.controls {
  display: flex;
  gap: 0.75rem;
}

.controls button {
  padding: 0.5rem 1rem;
  background: #2563eb;
  border: none;
  border-radius: 4px;
  color: #f5f7fa;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s ease;
}

.controls button:disabled {
  background: #253044;
  cursor: not-allowed;
}

.controls button:not(:disabled):hover {
  background: #1d4ed8;
}

.layout {
  display: flex;
  flex: 1;
  min-height: 0;
}

.pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1rem 2rem 2rem;
  min-width: 0;
}

.pane.editor {
  border-right: 1px solid #1f2933;
}

.pane-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.pane-header h2 {
  margin: 0;
  font-size: 1.2rem;
}

.status {
  font-size: 0.85rem;
  color: #9aa5b1;
}

.error-text {
  color: #f87171;
}

.monaco-editor {
  flex: 1;
  border: 1px solid #1f2933;
  border-radius: 6px;
  overflow: hidden;
}

.output {
  background: #111827;
}

.ast-view {
  flex: 1;
  background: #0b1017;
  border: 1px solid #1f2933;
  border-radius: 6px;
  padding: 1rem;
  overflow: auto;
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.ast-view.empty {
  color: #6b7280;
}

.diagnostics {
  margin-top: 1.5rem;
}

.diagnostics h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
}

.diagnostics ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.diagnostics li {
  padding: 0.6rem 0.75rem;
  border-radius: 6px;
  background: #0b1017;
  border: 1px solid #1f2933;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.diagnostics strong {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.diagnostics span {
  font-size: 0.9rem;
}

.severity-error {
  border-color: #f87171;
}

.severity-warning {
  border-color: #fbbf24;
}

.severity-info {
  border-color: #38bdf8;
}

.severity-hint {
  border-color: #a855f7;
}

@media (max-width: 1200px) {
  .layout {
    flex-direction: column;
  }

  .pane.editor {
    border-right: none;
    border-bottom: 1px solid #1f2933;
  }
}
</style>
