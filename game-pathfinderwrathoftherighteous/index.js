const { isWindows } = require('vortex-api');
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const path = require('path');
const { fs, types, util } = require('vortex-api');
const GAME_ID = 'pathfinderwrathoftherighteous';
const NAME = 'Pathfinder: Wrath\tof the Righteous';
const STEAM_ID = '1184370';
const GOG_ID = '1207187357';
function findGame() {
    return util.GameStoreHelper.findByAppId([STEAM_ID, GOG_ID])
        .then(game => game.gamePath);
}
function setup(discovery) {
    return fs.ensureDirWritableAsync(path.join(discovery.path, 'Mods'));
}
function resolveGameVersion(discoveryPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const versionFilepath = path.join(discoveryPath, 'Wrath_Data', 'StreamingAssets', 'Version.info');
        try {
            const data = yield fs.readFileAsync(versionFilepath, { encoding: 'utf8' });
            const segments = data.split(' ');
            return (segments[3])
                ? Promise.resolve(segments[3])
                : Promise.reject(new util.DataInvalid('Failed to resolve version'));
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
function main(context) {
    context.requireExtension('modtype-umm');
    context.registerGame({
        id: GAME_ID,
        name: NAME,
        logo: 'gameart.jpg',
        mergeMods: true,
        queryPath: findGame,
        queryModPath: () => 'Mods',
        executable: () => 'Wrath.exe',
        getGameVersion: resolveGameVersion,
        requiredFiles: ['Wrath.exe'],
        environment: {
            SteamAPPId: STEAM_ID,
        },
        details: {
            steamAppId: +STEAM_ID,
        },
        setup,
    });
    context.once(() => {
        if (context.api.ext.ummAddGame !== undefined) {
            context.api.ext.ummAddGame({
                gameId: GAME_ID,
                autoDownloadUMM: true,
            });
        }
    });
    return true;
}
module.exports = {
    default: main
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0IsTUFBTSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBRWxELE1BQU0sT0FBTyxHQUFHLCtCQUErQixDQUFDO0FBQ2hELE1BQU0sSUFBSSxHQUFHLHFDQUFxQyxDQUFDO0FBQ25ELE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQztBQUMzQixNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFFNUIsU0FBUyxRQUFRO0lBQ2YsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUN4RCxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakMsQ0FBQztBQUVELFNBQVMsS0FBSyxDQUFDLFNBQVM7SUFDdEIsT0FBTyxFQUFFLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDdEUsQ0FBQztBQUVELFNBQWUsa0JBQWtCLENBQUMsYUFBcUI7O1FBQ3JELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNsRyxJQUFJO1lBQ0YsTUFBTSxJQUFJLEdBQUcsTUFBTSxFQUFFLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1lBQzNFLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDakMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5QixDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxXQUFXLENBQUMsMkJBQTJCLENBQUMsQ0FBQyxDQUFDO1NBQ3ZFO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDNUI7SUFDSCxDQUFDO0NBQUE7QUFFRCxTQUFTLElBQUksQ0FBQyxPQUFPO0lBQ25CLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUN4QyxPQUFPLENBQUMsWUFBWSxDQUNsQjtRQUNFLEVBQUUsRUFBRSxPQUFPO1FBQ1gsSUFBSSxFQUFFLElBQUk7UUFDVixJQUFJLEVBQUUsYUFBYTtRQUNuQixTQUFTLEVBQUUsSUFBSTtRQUNmLFNBQVMsRUFBRSxRQUFRO1FBQ25CLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxNQUFNO1FBQzFCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxXQUFXO1FBQzdCLGNBQWMsRUFBRSxrQkFBa0I7UUFDbEMsYUFBYSxFQUFFLENBQUMsV0FBVyxDQUFDO1FBQzVCLFdBQVcsRUFBRTtZQUNYLFVBQVUsRUFBRSxRQUFRO1NBQ3JCO1FBQ0QsT0FBTyxFQUNQO1lBQ0UsVUFBVSxFQUFFLENBQUMsUUFBUTtTQUN0QjtRQUNELEtBQUs7S0FDTixDQUFDLENBQUM7SUFDTCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNoQixJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsS0FBSyxTQUFTLEVBQUU7WUFDNUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDO2dCQUN6QixNQUFNLEVBQUUsT0FBTztnQkFDZixlQUFlLEVBQUUsSUFBSTthQUN0QixDQUFDLENBQUM7U0FDSjtJQUNILENBQUMsQ0FBQyxDQUFBO0lBRUYsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImNvbnN0IHBhdGggPSByZXF1aXJlKCdwYXRoJyk7XG5jb25zdCB7IGZzLCB0eXBlcywgdXRpbCB9ID0gcmVxdWlyZSgndm9ydGV4LWFwaScpO1xuXG5jb25zdCBHQU1FX0lEID0gJ3BhdGhmaW5kZXJ3cmF0aG9mdGhlcmlnaHRlb3VzJztcbmNvbnN0IE5BTUUgPSAnUGF0aGZpbmRlcjogV3JhdGhcXHRvZiB0aGUgUmlnaHRlb3VzJztcbmNvbnN0IFNURUFNX0lEID0gJzExODQzNzAnO1xuY29uc3QgR09HX0lEID0gJzEyMDcxODczNTcnO1xuXG5mdW5jdGlvbiBmaW5kR2FtZSgpIHtcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtTVEVBTV9JRCwgR09HX0lEXSlcbiAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xufVxuXG5mdW5jdGlvbiBzZXR1cChkaXNjb3ZlcnkpIHtcbiAgcmV0dXJuIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVzb2x2ZUdhbWVWZXJzaW9uKGRpc2NvdmVyeVBhdGg6IHN0cmluZykge1xuICBjb25zdCB2ZXJzaW9uRmlsZXBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5UGF0aCwgJ1dyYXRoX0RhdGEnLCAnU3RyZWFtaW5nQXNzZXRzJywgJ1ZlcnNpb24uaW5mbycpO1xuICB0cnkge1xuICAgIGNvbnN0IGRhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKHZlcnNpb25GaWxlcGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIGNvbnN0IHNlZ21lbnRzID0gZGF0YS5zcGxpdCgnICcpO1xuICAgIHJldHVybiAoc2VnbWVudHNbM10pIFxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoc2VnbWVudHNbM10pXG4gICAgICA6IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdGYWlsZWQgdG8gcmVzb2x2ZSB2ZXJzaW9uJykpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWluKGNvbnRleHQpIHtcbiAgY29udGV4dC5yZXF1aXJlRXh0ZW5zaW9uKCdtb2R0eXBlLXVtbScpO1xuICBjb250ZXh0LnJlZ2lzdGVyR2FtZShcbiAgICB7XG4gICAgICBpZDogR0FNRV9JRCxcbiAgICAgIG5hbWU6IE5BTUUsXG4gICAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxuICAgICAgbWVyZ2VNb2RzOiB0cnVlLFxuICAgICAgcXVlcnlQYXRoOiBmaW5kR2FtZSxcbiAgICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gJ01vZHMnLFxuICAgICAgZXhlY3V0YWJsZTogKCkgPT4gJ1dyYXRoLmV4ZScsXG4gICAgICBnZXRHYW1lVmVyc2lvbjogcmVzb2x2ZUdhbWVWZXJzaW9uLFxuICAgICAgcmVxdWlyZWRGaWxlczogWydXcmF0aC5leGUnXSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFN0ZWFtQVBQSWQ6IFNURUFNX0lELFxuICAgICAgfSwgXG4gICAgICBkZXRhaWxzOlxuICAgICAge1xuICAgICAgICBzdGVhbUFwcElkOiArU1RFQU1fSUQsXG4gICAgICB9LFxuICAgICAgc2V0dXAsXG4gICAgfSk7XG4gIGNvbnRleHQub25jZSgoKSA9PiB7XG4gICAgaWYgKGNvbnRleHQuYXBpLmV4dC51bW1BZGRHYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnRleHQuYXBpLmV4dC51bW1BZGRHYW1lKHtcbiAgICAgICAgZ2FtZUlkOiBHQU1FX0lELFxuICAgICAgICBhdXRvRG93bmxvYWRVTU06IHRydWUsXG4gICAgICB9KTtcbiAgICB9XG4gIH0pXG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiBtYWluXG59O1xuIl19