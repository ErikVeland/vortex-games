"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testCEMP = testCEMP;
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const MAP_NUMBER_CONSTRAINT = 28;
function testCEMP(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const activeGameMode = vortex_api_1.selectors.activeGameId(state);
        if (activeGameMode !== common_1.GAME_ID) {
            return Promise.resolve(undefined);
        }
        const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
        if (discovery === undefined) {
            return Promise.resolve(undefined);
        }
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const ceMods = Object.keys(mods).filter(modId => { var _a, _b; return (_b = (_a = mods[modId]) === null || _a === void 0 ? void 0 : _a.attributes) === null || _b === void 0 ? void 0 : _b.haloGames.includes(common_1.HALO_GAMES.halo1.internalId); });
        if (ceMods.length === 0) {
            return Promise.resolve(undefined);
        }
        const halo1MapsPath = path_1.default.join(discovery.path, common_1.HALO1_MAPS_RELPATH);
        try {
            const fileEntries = yield vortex_api_1.fs.readdirAsync(halo1MapsPath);
            if (fileEntries.length < MAP_NUMBER_CONSTRAINT) {
                throw new Error('Not enough maps');
            }
            return Promise.resolve(undefined);
        }
        catch (err) {
            const result = {
                description: {
                    short: 'Halo: CE Multiplayer maps are missing',
                    long: 'Your "{{dirPath}}" folder is either missing/inaccessible, or appears to not contain all the required maps. '
                        + 'This is usually an indication that you do not have Halo: CE Multiplayer installed. Some mods may not '
                        + 'work properly due to a bug in the game engine. Please ensure you have installed CE MP through your game store.',
                    replace: {
                        dirPath: halo1MapsPath,
                    }
                },
                severity: 'warning',
            };
            return Promise.resolve(result);
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQU9BLDRCQXNDQztBQTVDRCxnREFBd0I7QUFDeEIsMkNBQXdEO0FBRXhELHFDQUFtRTtBQUVuRSxNQUFNLHFCQUFxQixHQUFHLEVBQUUsQ0FBQztBQUNqQyxTQUFzQixRQUFRLENBQUMsR0FBd0I7O1FBQ3JELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLGNBQWMsR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyRCxJQUFJLGNBQWMsS0FBSyxnQkFBTyxFQUFFLENBQUM7WUFDL0IsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFDRCxNQUFNLFNBQVMsR0FBRyxzQkFBUyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsZ0JBQU8sQ0FBQyxDQUFDO1FBQzVELElBQUksU0FBUyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzVCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNwQyxDQUFDO1FBRUQsTUFBTSxJQUFJLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxnQkFBTyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDdEUsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsZUFBQyxPQUFBLE1BQUEsTUFBQSxJQUFJLENBQUMsS0FBSyxDQUFDLDBDQUFFLFVBQVUsMENBQUUsU0FBUyxDQUFDLFFBQVEsQ0FBQyxtQkFBVSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQSxFQUFBLENBQUMsQ0FBQztRQUMzSCxJQUFJLE1BQU0sQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDeEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFDRCxNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsMkJBQWtCLENBQUMsQ0FBQztRQUNwRSxJQUFJLENBQUM7WUFDSCxNQUFNLFdBQVcsR0FBRyxNQUFNLGVBQUUsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDekQsSUFBSSxXQUFXLENBQUMsTUFBTSxHQUFHLHFCQUFxQixFQUFFLENBQUM7Z0JBQy9DLE1BQU0sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNyQyxDQUFDO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsTUFBTSxNQUFNLEdBQXNCO2dCQUNoQyxXQUFXLEVBQUU7b0JBQ1gsS0FBSyxFQUFFLHVDQUF1QztvQkFDOUMsSUFBSSxFQUFFLDZHQUE2RzswQkFDN0csdUdBQXVHOzBCQUN2RyxnSEFBZ0g7b0JBQ3RILE9BQU8sRUFBRTt3QkFDUCxPQUFPLEVBQUUsYUFBYTtxQkFDdkI7aUJBQ0Y7Z0JBQ0QsUUFBUSxFQUFFLFNBQVM7YUFDcEIsQ0FBQTtZQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqQyxDQUFDO0lBQ0gsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZnMsIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgSEFMTzFfTUFQU19SRUxQQVRILCBIQUxPX0dBTUVTIH0gZnJvbSAnLi9jb21tb24nO1xuXG5jb25zdCBNQVBfTlVNQkVSX0NPTlNUUkFJTlQgPSAyODtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0Q0VNUChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHR5cGVzLklUZXN0UmVzdWx0PiB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGFjdGl2ZUdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XG4gIGlmIChhY3RpdmVHYW1lTW9kZSAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxuICBjb25zdCBkaXNjb3ZlcnkgPSBzZWxlY3RvcnMuZGlzY292ZXJ5QnlHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgaWYgKGRpc2NvdmVyeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG5cbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBjZU1vZHMgPSBPYmplY3Qua2V5cyhtb2RzKS5maWx0ZXIobW9kSWQgPT4gbW9kc1ttb2RJZF0/LmF0dHJpYnV0ZXM/LmhhbG9HYW1lcy5pbmNsdWRlcyhIQUxPX0dBTUVTLmhhbG8xLmludGVybmFsSWQpKTtcbiAgaWYgKGNlTW9kcy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cbiAgY29uc3QgaGFsbzFNYXBzUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgSEFMTzFfTUFQU19SRUxQQVRIKTtcbiAgdHJ5IHtcbiAgICBjb25zdCBmaWxlRW50cmllcyA9IGF3YWl0IGZzLnJlYWRkaXJBc3luYyhoYWxvMU1hcHNQYXRoKTtcbiAgICBpZiAoZmlsZUVudHJpZXMubGVuZ3RoIDwgTUFQX05VTUJFUl9DT05TVFJBSU5UKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBlbm91Z2ggbWFwcycpOyBcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zdCByZXN1bHQ6IHR5cGVzLklUZXN0UmVzdWx0ID0ge1xuICAgICAgZGVzY3JpcHRpb246IHtcbiAgICAgICAgc2hvcnQ6ICdIYWxvOiBDRSBNdWx0aXBsYXllciBtYXBzIGFyZSBtaXNzaW5nJyxcbiAgICAgICAgbG9uZzogJ1lvdXIgXCJ7e2RpclBhdGh9fVwiIGZvbGRlciBpcyBlaXRoZXIgbWlzc2luZy9pbmFjY2Vzc2libGUsIG9yIGFwcGVhcnMgdG8gbm90IGNvbnRhaW4gYWxsIHRoZSByZXF1aXJlZCBtYXBzLiAnXG4gICAgICAgICAgICArICdUaGlzIGlzIHVzdWFsbHkgYW4gaW5kaWNhdGlvbiB0aGF0IHlvdSBkbyBub3QgaGF2ZSBIYWxvOiBDRSBNdWx0aXBsYXllciBpbnN0YWxsZWQuIFNvbWUgbW9kcyBtYXkgbm90ICdcbiAgICAgICAgICAgICsgJ3dvcmsgcHJvcGVybHkgZHVlIHRvIGEgYnVnIGluIHRoZSBnYW1lIGVuZ2luZS4gUGxlYXNlIGVuc3VyZSB5b3UgaGF2ZSBpbnN0YWxsZWQgQ0UgTVAgdGhyb3VnaCB5b3VyIGdhbWUgc3RvcmUuJyxcbiAgICAgICAgcmVwbGFjZToge1xuICAgICAgICAgIGRpclBhdGg6IGhhbG8xTWFwc1BhdGgsXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICBzZXZlcml0eTogJ3dhcm5pbmcnLFxuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XG4gIH1cbn0iXX0=