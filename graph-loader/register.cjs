const Module = require('node:module');
const resolve = require('resolve.exports');
const fs = require('node:fs');
const path = require('node:path');

const originalRequire = Module.prototype.require;
// const originalResolveFilename = Module._resolveFilename;
// const originalFindPath = Module._findPath;
// const originalInitPaths = Module._initPaths;
// const originalResolveLookupPaths = Module._resolveLookupPaths;

const originalLoad = Module._load;
// // console.log(Object.keys(Module));
// const originalCompile = Module.prototype._compile;

// Module.prototype._compile = function compile(content, filename) {
//   debugger;
//   return originalCompile.apply(this, [content, filename]);
// };

function findPkg(_path) {
  let stat;
  let _dirPath = _path;
  stat = fs.statSync(_path);
  if (stat.isFile) {
    const parent = path.dirname(_path);
    _dirPath = parent;
    if (fs.existsSync(path.join(parent, 'package.json'))) {
      const pkg = fs.readFileSync(path.join(parent, 'package.json'), 'utf8');
      return {
        pkg: JSON.parse(pkg),
        dir: _dirPath,
      };
    }
  }
}

let prevLoad = [];
Module._load = function load(request, parent, ...rest) {
  const index = request.indexOf('--condition=');
  if (index > 0) {
    // Ignore react requests for now
    let newRequest = request.slice(0, index);
    const sp = new URLSearchParams(request.slice(index + 2));
    const conditions = sp.getAll('condition');

    const { pkg, dir } = findPkg(newRequest);
    const requestedModule = path.basename(newRequest);
    // Assume that it's the base entry for now
    // and force react to load with the server condition
    if (requestedModule === 'index.js' && pkg.name === 'react') {
      const importEntry = '.';
      const resolvePath = resolve.exports(pkg, importEntry, {
        conditions: conditions,
      });
      newRequest = path.join(dir, resolvePath[0]);
    }
    prevLoad.push(newRequest);
    return originalLoad.call(this, newRequest, parent, ...rest);
  }
  prevLoad.push(request);
  return originalLoad.call(this, request, parent, ...rest);
};

let forceReactServer;
Module.prototype.require = function require(request, ...rest) {
  if (
    request.includes(
      './cjs/react-server-dom-webpack-server.node.unbundled.development.js'
    )
  ) {
    forceReactServer = true;
  }
  if (forceReactServer && request == 'react') {
    const require = Module.createRequire(this.path);
    const requirePath = require.resolve(request);
    const { pkg, dir } = findPkg(requirePath);
    const resolvedEx = resolve.exports(pkg, '.', {
      conditions: ['react-server'],
    });
    return originalRequire.call(this, path.join(dir, resolvedEx[0]), ...rest);
  }
  // const [start, end] = this.id.split('?', 2);
  // // console.log({ request, this: this });
  // if (end) {
  //   const searchParams = new URLSearchParams(end);
  //   const conditions = searchParams.getAll('condition');
  //   const require = Module.createRequire(this.path);
  //   require();
  //   console.log(conditions);
  // }
  // // console.log("REQUIRE", { request, this: this });
  return originalRequire.call(this, request, ...rest);
};

// // Module._initPaths = function initPaths(...rest) {
// //   console.log("INIT_PATHS", { rest, this: this });
// //   return originalInitPaths.call(this, ...rest);
// // };

// // Module._resolveLookupPaths = function resolveLookupPaths(...rest) {
// //   console.log("RESOLVE_LOOKUP_PATHS", { rest, this: this });
// //   return originalResolveLookupPaths.call(this, ...rest);
// // };

// // Module._resolveFilename = function resolveFilename(
// //   request,
// //   parent,
// //   isMain,
// //   options,
// //   ...rest
// // ) {
// //   const index = request.indexOf('--condition=');
// //   if (index > 0) {
// //     debugger;
// //     return request;
// //   }
// //   return originalResolveFilename.call(
// //     this,
// //     request,
// //     parent,
// //     isMain,
// //     options,
// //     ...rest
// //   );
// // };

// // Module._findPath = function findPath(
// //   request,
// //   parent,
// //   isMain,
// //   options,
// //   ...rest
// // ) {
// //   // console.log("FIND_PATH", { request, parent });
// //   const index = request.indexOf('--condition=');
// //   if (index > 0) {
// //     debugger;
// //     return request;
// //   }
// //   return originalFindPath.call(this, request, parent, isMain, options, ...rest);
// // };

// // const originalResolve = Module.prototype.require.resolve;
// // Module.prototype.require.resolve.prototype = function resolve(request, ...rest) {
// //   console.log("RESOLVE", { request, rest, this: this });
// //   return originalResolve.call(this, request, ...rest);
// // };
