export function buildWorkerDefinition(workerPath, basePath, useModuleWorker) {
    const monWin = self;
    const workerOverrideGlobals = {
        basePath: basePath,
        workerPath: workerPath,
        workerOptions: {
            type: useModuleWorker ? 'module' : 'classic'
        }
    };
    if (!monWin.MonacoEnvironment) {
        monWin.MonacoEnvironment = {
            workerOverrideGlobals: workerOverrideGlobals
        };
    }
    const getWorker = (_, label) => {
        console.log('getWorker: workerId: ' + _ + ' label: ' + label);
        const buildWorker = (globals, label, workerName, editorType) => {
            globals.workerOptions.name = label;
            const workerFilename = globals.workerOptions.type === 'module' ? `${workerName}-es.js` : `${workerName}-iife.js`;
            const workerPathLocal = `${globals.workerPath}/${workerFilename}`;
            const workerUrl = new URL(workerPathLocal, globals.basePath);
            console.log(`${editorType}: url: ${workerUrl.href} created from basePath: ${globals.basePath} and file: ${workerPathLocal}`);
            return new Worker(workerUrl.href, globals.workerOptions);
        };
        switch (label) {
            case 'typescript':
            case 'javascript':
                return buildWorker(workerOverrideGlobals, label, 'tsWorker', 'TS Worker');
            case 'html':
            case 'handlebars':
            case 'razor':
                return buildWorker(workerOverrideGlobals, label, 'htmlWorker', 'HTML Worker');
            case 'css':
            case 'scss':
            case 'less':
                return buildWorker(workerOverrideGlobals, label, 'cssWorker', 'CSS Worker');
            case 'json':
                return buildWorker(workerOverrideGlobals, label, 'jsonWorker', 'JSON Worker');
            default:
                return buildWorker(workerOverrideGlobals, label, 'editorWorker', 'Editor Worker');
        }
    };
    monWin.MonacoEnvironment.getWorker = getWorker;
}
//# sourceMappingURL=index.js.map