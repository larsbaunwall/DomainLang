import { MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { configureWorker, defineUserServices } from './setupCommon.js';

export const setupConfigExtended = async (): Promise<UserConfig> => {
    const extensionFilesOrContents = new Map();
    extensionFilesOrContents.set('/language-configuration.json', new URL('../language-configuration.json', import.meta.url));
    extensionFilesOrContents.set('/domain-lang-grammar.json', new URL('../syntaxes/domain-lang.tmLanguage.json', import.meta.url));

    // Fetch code content from the static .dlang file for browser compatibility
    const response = await fetch('example-customer-facing.dlang');
    const code = await response.text();

    return {
        wrapperConfig: {
            serviceConfig: defineUserServices(),
            editorAppConfig: {
                $type: 'extended',
                languageId: 'domain-lang',
                code,
                useDiffEditor: false,
                extensions: [{
                    config: {
                        name: 'domain-lang-web',
                        publisher: 'generator-langium',
                        version: '1.0.0',
                        engines: {
                            vscode: '*'
                        },
                        contributes: {
                            languages: [{
                                id: 'domain-lang',
                                extensions: [
                                    '.domain-lang'
                                ],
                                configuration: './language-configuration.json'
                            }],
                            grammars: [{
                                language: 'domain-lang',
                                scopeName: 'source.domain-lang',
                                path: './domain-lang-grammar.json'
                            }]
                        }
                    },
                    filesOrContents: extensionFilesOrContents,
                }],                
                userConfiguration: {
                    json: JSON.stringify({
                        'workbench.colorTheme': 'Default Dark Modern',
                        'editor.semanticHighlighting.enabled': true
                    })
                }
            }
        },
        languageClientConfig: configureWorker()
    };
};

export const executeExtended = async (htmlElement: HTMLElement) => {
    const userConfig = await setupConfigExtended();
    const wrapper = new MonacoEditorLanguageClientWrapper();
    await wrapper.initAndStart(userConfig, htmlElement);
};
