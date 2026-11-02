// ponytail: shaka 4's typings declare a global namespace, not a module, so they
// can't be `import`ed — a path reference is the only way to pull them in.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../node_modules/shaka-player/dist/shaka-player.compiled.d.ts" />
declare module 'shaka-player/dist/shaka-player.compiled' {
    export default shaka;
}
