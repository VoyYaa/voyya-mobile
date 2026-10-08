import { registerHooks } from 'node:module';

const BARE_RELATIVE = /^\.{1,2}\/[^.]*$|^\.{1,2}\/.*\/[^./]+$/;

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (BARE_RELATIVE.test(specifier)) {
      return nextResolve(`${specifier}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
});
