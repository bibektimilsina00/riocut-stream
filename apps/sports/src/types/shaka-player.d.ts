// ponytail: shaka 4's typings declare a global namespace, not a module.
/// <reference path="../../node_modules/shaka-player/dist/shaka-player.compiled.d.ts" />
declare module 'shaka-player/dist/shaka-player.compiled' {
    export default shaka;
}
