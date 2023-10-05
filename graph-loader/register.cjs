const Module = require("node:module");

const originalRequire = Module.prototype.require;
const originalResolveFilename = Module._resolveFilename;
const originalFindPath = Module._findPath;
const originalInitPaths = Module._initPaths;
const originalResolveLookupPaths = Module._resolveLookupPaths;

const originalLoad = Module._load;
// console.log(Object.keys(Module));
Module._load = function load(request, parent, ...rest) {
  const index = request.indexOf("--condition=");
  if (index > 0) {
    const newRequest = request.slice(0, index);
    // // console.log("BEFORE", Object.keys(Module._cache));
    // const result = originalLoad.call(this, request, parent, ...rest);
    // // console.log("AFTER", Object.keys(Module._cache));
    // return result;
    // // request = request.slice(0, index) + "?" + request.slice(index + 2);
    // // return require(request);
    const loaded = originalLoad.call(this, newRequest, parent, ...rest);
    delete Module._cache[newRequest];

    return loaded;
  }
  // console.log({ request, parent, rest });

  return originalLoad.call(this, request, parent, ...rest);
};

Module.prototype.require = function require(request, ...rest) {
  //   // const [start, end] = this.id.split("?", 2);
  // console.log({ request, this: this });
  //   // if (end) {
  //   //   const searchParams = new URLSearchParams(end);
  //   //   const conditions = searchParams.getAll("condition");
  //   //   // const require = Module.createRequire(this.path);
  //   //   console.log(conditions);
  //   // }
  console.log("REQUIRE", { request, this: this });
  return originalRequire.call(this, request, ...rest);
};

// Module._initPaths = function initPaths(...rest) {
//   console.log("INIT_PATHS", { rest, this: this });
//   return originalInitPaths.call(this, ...rest);
// };

// Module._resolveLookupPaths = function resolveLookupPaths(...rest) {
//   console.log("RESOLVE_LOOKUP_PATHS", { rest, this: this });
//   return originalResolveLookupPaths.call(this, ...rest);
// };

Module._resolveFilename = function resolveFilename(
  request,
  parent,
  isMain,
  options,
  ...rest
) {
  const index = request.indexOf("--condition=");
  if (index > 0) {
    return request;
  }
  return originalResolveFilename.call(
    this,
    request,
    parent,
    isMain,
    options,
    ...rest
  );
};

Module._findPath = function findPath(
  request,
  parent,
  isMain,
  options,
  ...rest
) {
  // console.log("FIND_PATH", { request, parent });
  const index = request.indexOf("--condition=");
  if (index > 0) {
    return request;
  }
  return originalFindPath.call(this, request, parent, isMain, options, ...rest);
};

const originalResolve = Module.prototype.require.resolve;
// Module.prototype.require.resolve.prototype = function resolve(request, ...rest) {
//   console.log("RESOLVE", { request, rest, this: this });
//   return originalResolve.call(this, request, ...rest);
// };
