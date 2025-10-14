"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const migrations_1 = require("./migrations");
const statics_1 = require("./statics");
const util_1 = require("./util");
const BIX_CONFIG = 'BepInEx.cfg';
function ensureBIXConfig(discovery) {
    const src = path_1.default.join(__dirname, BIX_CONFIG);
    const dest = path_1.default.join(discovery.path, 'BepInEx', 'config', BIX_CONFIG);
    return vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(dest))
        .then(() => vortex_api_1.fs.copyAsync(src, dest))
        .catch(err => {
        if (err.code !== 'EEXIST') {
            (0, vortex_api_1.log)('warn', 'failed to write BIX config', err);
        }
        return Promise.resolve();
    });
}
function requiresLauncher() {
    return vortex_api_1.util.epicGamesLauncher.isGameInstalled(statics_1.EPIC_APP_ID)
        .then(epic => epic
        ? { launcher: 'epic', addInfo: statics_1.EPIC_APP_ID }
        : undefined);
}
function findGame() {
    return vortex_api_1.util.epicGamesLauncher.findByAppId(statics_1.EPIC_APP_ID)
        .then(epicEntry => epicEntry.gamePath);
}
function modPath() {
    return path_1.default.join('BepInEx', 'plugins');
}
function prepareForModding(discovery) {
    if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
        return Promise.reject(new vortex_api_1.util.ProcessCanceled('Game not discovered'));
    }
    return ensureBIXConfig(discovery)
        .then(() => vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(discovery.path, 'BepInEx', 'plugins')));
}
function main(context) {
    context.registerGame({
        id: statics_1.GAME_ID,
        name: 'Untitled Goose Game',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: modPath,
        requiresLauncher,
        logo: 'gameart.jpg',
        executable: () => 'Untitled.exe',
        requiredFiles: [
            'Untitled.exe',
            'UnityPlayer.dll',
        ],
        setup: prepareForModding,
    });
    context.registerMigration((0, util_1.toBlue)(old => (0, migrations_1.migrate020)(context, old)));
    context.once(() => {
        if (context.api.ext.bepinexAddGame !== undefined) {
            context.api.ext.bepinexAddGame({
                gameId: statics_1.GAME_ID,
                autoDownloadBepInEx: true,
                doorstopConfig: {
                    doorstopType: 'default',
                    ignoreDisableSwitch: true,
                },
            });
        }
    });
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUNBLGdEQUF3QjtBQUN4QiwyQ0FBa0Q7QUFFbEQsNkNBQTBDO0FBQzFDLHVDQUFpRDtBQUNqRCxpQ0FBZ0M7QUFFaEMsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDO0FBQ2pDLFNBQVMsZUFBZSxDQUFDLFNBQWlDO0lBQ3hELE1BQU0sR0FBRyxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzdDLE1BQU0sSUFBSSxHQUFHLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3hFLE9BQU8sZUFBRSxDQUFDLHNCQUFzQixDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDakQsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQUUsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ25DLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtRQUNYLElBQUksR0FBRyxDQUFDLElBQUksS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUMxQixJQUFBLGdCQUFHLEVBQUMsTUFBTSxFQUFFLDRCQUE0QixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBQ2pELENBQUM7UUFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMzQixDQUFDLENBQUMsQ0FBQztBQUNQLENBQUM7QUFFRCxTQUFTLGdCQUFnQjtJQUN2QixPQUFPLGlCQUFJLENBQUMsaUJBQWlCLENBQUMsZUFBZSxDQUFDLHFCQUFXLENBQUM7U0FDdkQsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSTtRQUNoQixDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxxQkFBVyxFQUFFO1FBQzVDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNuQixDQUFDO0FBRUQsU0FBUyxRQUFRO0lBQ2YsT0FBTyxpQkFBSSxDQUFDLGlCQUFpQixDQUFDLFdBQVcsQ0FBQyxxQkFBVyxDQUFDO1NBQ25ELElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRUQsU0FBUyxPQUFPO0lBQ2QsT0FBTyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN6QyxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxTQUFpQztJQUMxRCxJQUFJLENBQUEsU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFFLElBQUksTUFBSyxTQUFTLEVBQUUsQ0FBQztRQUNsQyxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLGVBQWUsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDLENBQUM7SUFDekUsQ0FBQztJQUVELE9BQU8sZUFBZSxDQUFDLFNBQVMsQ0FBQztTQUM5QixJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsZUFBRSxDQUFDLHNCQUFzQixDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzVGLENBQUM7QUFFRCxTQUFTLElBQUksQ0FBQyxPQUFnQztJQUM1QyxPQUFPLENBQUMsWUFBWSxDQUFDO1FBQ25CLEVBQUUsRUFBRSxpQkFBTztRQUNYLElBQUksRUFBRSxxQkFBcUI7UUFDM0IsU0FBUyxFQUFFLElBQUk7UUFDZixTQUFTLEVBQUUsUUFBUTtRQUNuQixZQUFZLEVBQUUsT0FBTztRQUNyQixnQkFBZ0I7UUFDaEIsSUFBSSxFQUFFLGFBQWE7UUFDbkIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLGNBQWM7UUFDaEMsYUFBYSxFQUFFO1lBQ2IsY0FBYztZQUNkLGlCQUFpQjtTQUNsQjtRQUNELEtBQUssRUFBRSxpQkFBaUI7S0FDekIsQ0FBQyxDQUFDO0lBR0gsT0FBTyxDQUFDLGlCQUFpQixDQUFDLElBQUEsYUFBTSxFQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBQSx1QkFBVSxFQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFbkUsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7UUFDaEIsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxjQUFjLEtBQUssU0FBUyxFQUFFLENBQUM7WUFDakQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsY0FBYyxDQUFDO2dCQUM3QixNQUFNLEVBQUUsaUJBQU87Z0JBQ2YsbUJBQW1CLEVBQUUsSUFBSTtnQkFDekIsY0FBYyxFQUFFO29CQUNkLFlBQVksRUFBRSxTQUFTO29CQUN2QixtQkFBbUIsRUFBRSxJQUFJO2lCQUMxQjthQUNGLENBQUMsQ0FBQztRQUNMLENBQUM7SUFDSCxDQUFDLENBQUMsQ0FBQztJQUVILE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBUT0RPOiBSZW1vdmUgQmx1ZWJpcmQgaW1wb3J0IC0gdXNpbmcgbmF0aXZlIFByb21pc2U7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZzLCBsb2csIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IG1pZ3JhdGUwMjAgfSBmcm9tICcuL21pZ3JhdGlvbnMnO1xuaW1wb3J0IHsgRVBJQ19BUFBfSUQsIEdBTUVfSUQgfSBmcm9tICcuL3N0YXRpY3MnO1xuaW1wb3J0IHsgdG9CbHVlIH0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgQklYX0NPTkZJRyA9ICdCZXBJbkV4LmNmZyc7XG5mdW5jdGlvbiBlbnN1cmVCSVhDb25maWcoZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IHNyYyA9IHBhdGguam9pbihfX2Rpcm5hbWUsIEJJWF9DT05GSUcpO1xuICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnQmVwSW5FeCcsICdjb25maWcnLCBCSVhfQ09ORklHKTtcbiAgcmV0dXJuIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGRlc3QpKVxuICAgIC50aGVuKCgpID0+IGZzLmNvcHlBc3luYyhzcmMsIGRlc3QpKVxuICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgaWYgKGVyci5jb2RlICE9PSAnRUVYSVNUJykge1xuICAgICAgICBsb2coJ3dhcm4nLCAnZmFpbGVkIHRvIHdyaXRlIEJJWCBjb25maWcnLCBlcnIpO1xuICAgICAgfVxuICAgICAgLy8gbm9wIC0gdGhpcyBpcyBhIG5pY2UgdG8gaGF2ZSwgbm90IGEgbXVzdC5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9KTtcbn1cblxuZnVuY3Rpb24gcmVxdWlyZXNMYXVuY2hlcigpIHtcbiAgcmV0dXJuIHV0aWwuZXBpY0dhbWVzTGF1bmNoZXIuaXNHYW1lSW5zdGFsbGVkKEVQSUNfQVBQX0lEKVxuICAgIC50aGVuKGVwaWMgPT4gZXBpY1xuICAgICAgPyB7IGxhdW5jaGVyOiAnZXBpYycsIGFkZEluZm86IEVQSUNfQVBQX0lEIH1cbiAgICAgIDogdW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gZmluZEdhbWUoKSB7XG4gIHJldHVybiB1dGlsLmVwaWNHYW1lc0xhdW5jaGVyLmZpbmRCeUFwcElkKEVQSUNfQVBQX0lEKVxuICAgIC50aGVuKGVwaWNFbnRyeSA9PiBlcGljRW50cnkuZ2FtZVBhdGgpO1xufVxuXG5mdW5jdGlvbiBtb2RQYXRoKCkge1xuICByZXR1cm4gcGF0aC5qb2luKCdCZXBJbkV4JywgJ3BsdWdpbnMnKTtcbn1cblxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSB7XG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dhbWUgbm90IGRpc2NvdmVyZWQnKSk7XG4gIH1cblxuICByZXR1cm4gZW5zdXJlQklYQ29uZmlnKGRpc2NvdmVyeSlcbiAgICAudGhlbigoKSA9PiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ0JlcEluRXgnLCAncGx1Z2lucycpKSk7XG59XG5cbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoe1xuICAgIGlkOiBHQU1FX0lELFxuICAgIG5hbWU6ICdVbnRpdGxlZCBHb29zZSBHYW1lJyxcbiAgICBtZXJnZU1vZHM6IHRydWUsXG4gICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcbiAgICBxdWVyeU1vZFBhdGg6IG1vZFBhdGgsXG4gICAgcmVxdWlyZXNMYXVuY2hlcixcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdVbnRpdGxlZC5leGUnLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdVbnRpdGxlZC5leGUnLFxuICAgICAgJ1VuaXR5UGxheWVyLmRsbCcsXG4gICAgXSxcbiAgICBzZXR1cDogcHJlcGFyZUZvck1vZGRpbmcsXG4gIH0pO1xuXG4gIC8vIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24odG9CbHVlKG9sZCA9PiBtaWdyYXRlMDEwKGNvbnRleHQsIG9sZCkgYXMgYW55KSk7XG4gIGNvbnRleHQucmVnaXN0ZXJNaWdyYXRpb24odG9CbHVlKG9sZCA9PiBtaWdyYXRlMDIwKGNvbnRleHQsIG9sZCkpKTtcblxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xuICAgIGlmIChjb250ZXh0LmFwaS5leHQuYmVwaW5leEFkZEdhbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29udGV4dC5hcGkuZXh0LmJlcGluZXhBZGRHYW1lKHtcbiAgICAgICAgZ2FtZUlkOiBHQU1FX0lELFxuICAgICAgICBhdXRvRG93bmxvYWRCZXBJbkV4OiB0cnVlLFxuICAgICAgICBkb29yc3RvcENvbmZpZzoge1xuICAgICAgICAgIGRvb3JzdG9wVHlwZTogJ2RlZmF1bHQnLFxuICAgICAgICAgIGlnbm9yZURpc2FibGVTd2l0Y2g6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZGVmYXVsdDogbWFpbixcbn07XG4iXX0=