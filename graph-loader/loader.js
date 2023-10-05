import * as fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { getResolveInfo } from "./utils.js";

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

  resolved.url +=
    "?" +
    new URLSearchParams(
      info.conditions.map((condition) => ["condition", condition])
    );

  return resolved;
}

export async function load(urlString, context, defaultLoad) {
  if (context.importAssertions.conditions) {
    context.conditions = JSON.parse(context.importAssertions.conditions);
  }

  // console.log({ urlString });
  let loaded = await defaultLoad(urlString, context);
  if (loaded.format === "commonjs") {
    const newURL = new URL(loaded.responseURL ?? urlString);
    newURL.search = "";
    loaded.responseURL =
      newURL.href +
      "--" +
      new URLSearchParams(
        context.conditions.map((condition) => ["condition", condition])
      );

    // console.log({ URL: loaded.responseURL });

    // loaded.source ??= await fs.readFile(fileURLToPath(newURL.href));
  }

  return loaded;
}
