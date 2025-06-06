import { MonacoEditorLanguageClientWrapper, UserConfig } from 'monaco-editor-wrapper';
import { configureWorker, defineUserServices } from './setupCommon.js';

export const setupConfigExtended = (): UserConfig => {
    const extensionFilesOrContents = new Map();
    extensionFilesOrContents.set('/language-configuration.json', new URL('../language-configuration.json', import.meta.url));
    extensionFilesOrContents.set('/domain-lang-grammar.json', new URL('../syntaxes/domain-lang.tmLanguage.json', import.meta.url));

    return {
        wrapperConfig: {
            serviceConfig: defineUserServices(),
            editorAppConfig: {
                $type: 'extended',
                languageId: 'domain-lang',
                code: `group CustomerFacing {

    ContextMap map {
        ApplicationFramework [OHS] -> [ACL] ApplicationFramework
        Listings [P] <-> [P] ApplicationFramework
        ApplicationFramework [SK] <-> Listings [SK]
    }

    Domain Inventory {}

    /*
    * The CustomerFacing bounded context is responsible for all interactions with the customer.
    */
    BoundedContext ApplicationFramework {
        terminology {
            term micro-frontend : "a small, self-contained frontend application"
        }
    }

    BoundedContext Listings implements Inventory {
        description: "The product listings"
        classifiers {
            role: Nothing
        }
        terminology {
            term product    : "a product that is for sale"
            term SKU        : "a stock keeping unit"
        }
        decisions {
            // test
            policy do_not_allow_orders_without_stock : "do not allow orders for products that are out of stock"
            
            //other stuff
            rule   product_has_a_sku : "a product has a SKU"
        }
        
    }

    /**
     * Directly involved in executing transactions with the customer
     */
    Role Executing
}

Role Nothing`,
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
    const userConfig = setupConfigExtended();
    const wrapper = new MonacoEditorLanguageClientWrapper();
    await wrapper.initAndStart(userConfig, htmlElement);
};
