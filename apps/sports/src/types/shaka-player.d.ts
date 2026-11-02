// ponytail: shaka 4's typings declare a global namespace, not a module, so
// there's no import that pulls in the global `shaka` declaration below —
// a triple-slash reference is the documented way to do this.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../node_modules/shaka-player/dist/shaka-player.compiled.d.ts" />
declare module 'shaka-player/dist/shaka-player.compiled' {
    export default shaka;
}
