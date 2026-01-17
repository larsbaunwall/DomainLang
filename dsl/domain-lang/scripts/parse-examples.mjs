import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import chalk from 'chalk';

async function parseFile(loader, filePath) {
  try {
    const { query } = await loader.loadModel(filePath);
    // Touch a few items to ensure augmentation works
    const bcCount = query.boundedContexts().toArray().length;
    const domainCount = query.domains().toArray().length;
    console.log(chalk.green(`✓ Parsed: ${filePath} (domains: ${domainCount}, contexts: ${bcCount})`));
    return true;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(chalk.red(`✗ Failed: ${filePath}`));
    console.log(chalk.gray(message));
    return false;
  }
}

async function main() {
  const examplesDir = path.resolve('examples');
  const files = await fs.readdir(examplesDir);
  const dlangFiles = files.filter(f => f.endsWith('.dlang'));

  const loader = await import('../packages/language/out/sdk/loader-node.js');

  let ok = 0, fail = 0;
  for (const file of dlangFiles) {
    const fullPath = path.join(examplesDir, file);
    const result = await parseFile(loader, fullPath);
    if (result) ok++; else fail++;
  }

  console.log('\n' + chalk.blue(`Summary: ${ok} succeeded, ${fail} failed`));
  if (fail > 0) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
