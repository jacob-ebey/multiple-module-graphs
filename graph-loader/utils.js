import { builtinModules } from "node:module";

const builtins = new Set(
  builtinModules.concat(builtinModules.map((m) => `node:${m}`))
);

const specifierBase = "//specifier/";

export function getResolveInfo(specifier, context) {
  if (specifier.startsWith("node:") || builtins.has(specifier)) {
    return null;
  }

  const specifierURL = new URL(specifier, `specifier:${specifierBase}`);
  let specifierWithoutQuery;
  if (specifier.startsWith("file:")) {
    specifierWithoutQuery = specifier;
  } else {
    const relativePrefixMatch = specifier.match(/^([\.+\/]+)/);
    specifierWithoutQuery = specifierURL.pathname.startsWith("/")
      ? specifierURL.pathname.slice(1)
      : specifierURL.pathname;
    if (relativePrefixMatch) {
      specifierWithoutQuery = relativePrefixMatch[1] + specifierWithoutQuery;
    }
  }

  const conditions = new Set();
  for (const condition of specifierURL.searchParams.getAll("condition")) {
    conditions.add(condition);
  }
  if (context.parentURL) {
    const parentURL = new URL(context.parentURL);
    for (const condition of parentURL.searchParams.getAll("condition")) {
      conditions.add(condition);
    }
  }
  for (const condition of context.conditions) {
    conditions.add(condition);
  }

  let newParentURL = context.parentURL;
  if (context.parentURL) {
    const parentURL = new URL(context.parentURL);
    parentURL.searchParams.delete("condition");

    for (const condition of conditions) {
      parentURL.searchParams.append("condition", condition);
    }

    newParentURL = parentURL.toString();
  }

  return {
    conditions: Array.from(conditions),
    specifier: specifierWithoutQuery,
    parentURL: newParentURL,
  };
}
