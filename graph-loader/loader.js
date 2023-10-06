import * as fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getResolveInfo } from './utils.js';

export async function resolve(specifier, context, nextResolve) {
  const info = getResolveInfo(specifier, context);
  if (!info) {
    return nextResolve(specifier, context);
  }

  const nextContext = {
    ...context,
    conditions: info.conditions,
    parentURL: info.parentURL,
    importAssertions: {
      ...context.importAssertions,
      conditions: JSON.stringify(info.conditions),
    },
  };

  const resolved = await nextResolve(info.specifier, nextContext);
  resolved.importAssertions = nextContext.importAssertions;
  resolved.shortCircuit = true;

  const sp = new URLSearchParams(
    info.conditions.map((condition) => ['condition', condition])
  );

  sp.append('parent', info.parentURL);

  resolved.url += '?' + sp;

  return resolved;
}

export async function load(urlString, context, defaultLoad) {
  if (context.importAssertions.conditions) {
    context.conditions = JSON.parse(context.importAssertions.conditions);
  }

  let loaded = await defaultLoad(urlString, context);

  let originalConditions;

  if (loaded.format === 'commonjs') {
    const _searchP = new URLSearchParams(
      new URL(loaded.responseURL ?? urlString).search
    );
    originalConditions = _searchP.getAll('condition');
    // const importer = _searchP.get('parent');

    // const importerURL = new URLSearchParams(new URL(importer).search);

    // const hasReactServer = importerURL
    //   .getAll('condition')
    //   .find((x) => x === 'react-server');

    // console.log({ hasReactServer });

    const newURL = new URL(loaded.responseURL);
    newURL.search = '';
    const sp = new URLSearchParams(
      originalConditions.map((condition) => ['condition', condition])
    );

    loaded.responseURL = newURL.href + '--' + sp.toString();
    newURL.search = sp;
    // loaded = await defaultLoad(newURL.href, context);
    loaded.source ??= await fs.readFile(fileURLToPath(newURL.href));
    debugger;
  }

  return loaded;
}
