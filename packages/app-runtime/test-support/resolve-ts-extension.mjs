import { registerHooks } from 'node:module';

const BARE_RELATIVE = /^\.{1,2}\/[^.]*$|^\.{1,2}\/.*\/[^./]+$/;
const TYPESCRIPT_SOURCE = /\.tsx?$/;

function isImportedFromTypeScript(parentURL) {
  return typeof parentURL === 'string' && TYPESCRIPT_SOURCE.test(parentURL);
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (BARE_RELATIVE.test(specifier) && isImportedFromTypeScript(context.parentURL)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
