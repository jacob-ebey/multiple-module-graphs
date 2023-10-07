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

let prevLoad = [];
Module._load = function load(request, parent, ...rest) {
  const index = request.indexOf('--condition=');
  if (index > 0) {
    // Ignore react requests for now
    let newRequest = request.slice(0, index);
    const sp = new URLSearchParams(request.slice(index + 2));
    const conditions = sp.getAll('condition');
    prevLoad.push({ request: newRequest, conditions });
    return originalLoad.call(this, newRequest, parent, ...rest);
  }
  prevLoad.push({
    request,
    conditions: [],
  });
  return originalLoad.call(this, request, parent, ...rest);
};

Module.prototype.require = function require(request, ...rest) {
  const inheritReactServerCondition =
    prevLoad
      .reverse()
      // offset for now, might need to figure out a way to guess
      // this number
      .slice(3)
      .findIndex((x) => x.conditions.includes('react-server')) > -1;

  if (inheritReactServerCondition) {
    const require = Module.createRequire(this.path);
    const pathsToCheck = this.paths;
    let foundModule;

    for (let p of pathsToCheck) {
      try {
        const toResolve = path.join(p, request);
        foundModule = require.resolve(toResolve, {
          paths: pathsToCheck,
        });
        break;
      } catch (err) {
        // digest the error for now
        // considering, it's most probably going to be a require resolve
        // error failing to find the module since it could be a node
        // generic module
      }
    }

    if (foundModule) {
      const { pkg, dir } = findPkg(foundModule);
      const resolvedEx = resolve.exports(pkg, '.', {
        conditions: ['react-server'],
      });
      return originalRequire.call(this, path.join(dir, resolvedEx[0]), ...rest);
    }
  }
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

// const originalResolve = Module.prototype.require.resolve;
// Module.prototype.require.resolve = function resolve(request, ...rest) {
//   console.log('RESOLVE', { request, rest, this: this });
//   return originalResolve.call(this, request, ...rest);
// };

function findPkg(_path) {
  let stat;
  let pkgDirPath = _path;
  let foundPkgPath = false;

  // considering pnpm is being used
  let depth = 20;

  do {
    stat = fs.statSync(pkgDirPath);
    if (stat.isFile) {
      const parent = path.dirname(pkgDirPath);
      pkgDirPath = parent;
      foundPkgPath = fs.existsSync(path.join(pkgDirPath, 'package.json'));
      depth -= 1;
    } else {
      foundPkgPath = fs.existsSync(path.join(pkgDirPath, 'package.json'));
      depth -= 1;
    }
  } while (!foundPkgPath && depth > 0);

  if (!foundPkgPath) {
    return {
      found: false,
    };
  }

  const pkg = fs.readFileSync(path.join(pkgDirPath, 'package.json'), 'utf8');

  return {
    found: true,
    pkg: JSON.parse(pkg),
    dir: pkgDirPath,
  };
}
