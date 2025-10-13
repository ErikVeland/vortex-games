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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDN0IsTUFBTSxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBRWxELE1BQU0sT0FBTyxHQUFHLCtCQUErQixDQUFDO0FBQ2hELE1BQU0sSUFBSSxHQUFHLHFDQUFxQyxDQUFDO0FBQ25ELE1BQU0sUUFBUSxHQUFHLFNBQVMsQ0FBQztBQUMzQixNQUFNLE1BQU0sR0FBRyxZQUFZLENBQUM7QUFFNUIsU0FBUyxRQUFRO0lBQ2YsT0FBTyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztTQUN4RCxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDakMsQ0FBQztBQUVELFNBQVMsS0FBSyxDQUFDLFNBQVM7SUFDdEIsT0FBTyxFQUFFLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDdEUsQ0FBQztBQUVELFNBQWUsa0JBQWtCLENBQUMsYUFBcUI7O1FBQ3JELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxjQUFjLENBQUMsQ0FBQztRQUNsRyxJQUFJLENBQUM7WUFDSCxNQUFNLElBQUksR0FBRyxNQUFNLEVBQUUsQ0FBQyxhQUFhLENBQUMsZUFBZSxFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7WUFDM0UsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUNqQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsQixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLFdBQVcsQ0FBQywyQkFBMkIsQ0FBQyxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDN0IsQ0FBQztJQUNILENBQUM7Q0FBQTtBQUVELFNBQVMsSUFBSSxDQUFDLE9BQU87SUFDbkIsT0FBTyxDQUFDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQ3hDLE9BQU8sQ0FBQyxZQUFZLENBQ2xCO1FBQ0UsRUFBRSxFQUFFLE9BQU87UUFDWCxJQUFJLEVBQUUsSUFBSTtRQUNWLElBQUksRUFBRSxhQUFhO1FBQ25CLFNBQVMsRUFBRSxJQUFJO1FBQ2YsU0FBUyxFQUFFLFFBQVE7UUFDbkIsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU07UUFDMUIsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLFdBQVc7UUFDN0IsY0FBYyxFQUFFLGtCQUFrQjtRQUNsQyxhQUFhLEVBQUUsQ0FBQyxXQUFXLENBQUM7UUFDNUIsV0FBVyxFQUFFO1lBQ1gsVUFBVSxFQUFFLFFBQVE7U0FDckI7UUFDRCxPQUFPLEVBQ1A7WUFDRSxVQUFVLEVBQUUsQ0FBQyxRQUFRO1NBQ3RCO1FBQ0QsS0FBSztLQUNOLENBQUMsQ0FBQztJQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFO1FBQ2hCLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQztnQkFDekIsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsZUFBZSxFQUFFLElBQUk7YUFDdEIsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztJQUNILENBQUMsQ0FBQyxDQUFBO0lBRUYsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNiLE9BQU8sRUFBRSxJQUFJO0NBQ2hCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuY29uc3QgeyBmcywgdHlwZXMsIHV0aWwgfSA9IHJlcXVpcmUoJ3ZvcnRleC1hcGknKTtcblxuY29uc3QgR0FNRV9JRCA9ICdwYXRoZmluZGVyd3JhdGhvZnRoZXJpZ2h0ZW91cyc7XG5jb25zdCBOQU1FID0gJ1BhdGhmaW5kZXI6IFdyYXRoXFx0b2YgdGhlIFJpZ2h0ZW91cyc7XG5jb25zdCBTVEVBTV9JRCA9ICcxMTg0MzcwJztcbmNvbnN0IEdPR19JRCA9ICcxMjA3MTg3MzU3JztcblxuZnVuY3Rpb24gZmluZEdhbWUoKSB7XG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbU1RFQU1fSUQsIEdPR19JRF0pXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcbn1cblxuZnVuY3Rpb24gc2V0dXAoZGlzY292ZXJ5KSB7XG4gIHJldHVybiBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgJ01vZHMnKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlc29sdmVHYW1lVmVyc2lvbihkaXNjb3ZlcnlQYXRoOiBzdHJpbmcpIHtcbiAgY29uc3QgdmVyc2lvbkZpbGVwYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeVBhdGgsICdXcmF0aF9EYXRhJywgJ1N0cmVhbWluZ0Fzc2V0cycsICdWZXJzaW9uLmluZm8nKTtcbiAgdHJ5IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyh2ZXJzaW9uRmlsZXBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICBjb25zdCBzZWdtZW50cyA9IGRhdGEuc3BsaXQoJyAnKTtcbiAgICByZXR1cm4gKHNlZ21lbnRzWzNdKSBcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKHNlZ21lbnRzWzNdKVxuICAgICAgOiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnRmFpbGVkIHRvIHJlc29sdmUgdmVyc2lvbicpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWFpbihjb250ZXh0KSB7XG4gIGNvbnRleHQucmVxdWlyZUV4dGVuc2lvbignbW9kdHlwZS11bW0nKTtcbiAgY29udGV4dC5yZWdpc3RlckdhbWUoXG4gICAge1xuICAgICAgaWQ6IEdBTUVfSUQsXG4gICAgICBuYW1lOiBOQU1FLFxuICAgICAgbG9nbzogJ2dhbWVhcnQuanBnJyxcbiAgICAgIG1lcmdlTW9kczogdHJ1ZSxcbiAgICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXG4gICAgICBxdWVyeU1vZFBhdGg6ICgpID0+ICdNb2RzJyxcbiAgICAgIGV4ZWN1dGFibGU6ICgpID0+ICdXcmF0aC5leGUnLFxuICAgICAgZ2V0R2FtZVZlcnNpb246IHJlc29sdmVHYW1lVmVyc2lvbixcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFsnV3JhdGguZXhlJ10sXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBTdGVhbUFQUElkOiBTVEVBTV9JRCxcbiAgICAgIH0sIFxuICAgICAgZGV0YWlsczpcbiAgICAgIHtcbiAgICAgICAgc3RlYW1BcHBJZDogK1NURUFNX0lELFxuICAgICAgfSxcbiAgICAgIHNldHVwLFxuICAgIH0pO1xuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xuICAgIGlmIChjb250ZXh0LmFwaS5leHQudW1tQWRkR2FtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb250ZXh0LmFwaS5leHQudW1tQWRkR2FtZSh7XG4gICAgICAgIGdhbWVJZDogR0FNRV9JRCxcbiAgICAgICAgYXV0b0Rvd25sb2FkVU1NOiB0cnVlLFxuICAgICAgfSk7XG4gICAgfVxuICB9KVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBkZWZhdWx0OiBtYWluXG59O1xuIl19