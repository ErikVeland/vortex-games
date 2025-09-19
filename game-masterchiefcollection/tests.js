const { isWindows } = require('vortex-api');
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
exports.testCEMP = void 0;
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
exports.testCEMP = testCEMP;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJ0ZXN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFDQSxnREFBd0I7QUFDeEIsMkNBQXdEO0FBRXhELHFDQUFtRTtBQUVuRSxNQUFNLHFCQUFxQixHQUFHLEVBQUUsQ0FBQztBQUNqQyxTQUFzQixRQUFRLENBQUMsR0FBd0I7O1FBQ3JELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUM3QixNQUFNLGNBQWMsR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyRCxJQUFJLGNBQWMsS0FBSyxnQkFBTyxFQUFFO1lBQzlCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQztRQUNELE1BQU0sU0FBUyxHQUFHLHNCQUFTLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDNUQsSUFBSSxTQUFTLEtBQUssU0FBUyxFQUFFO1lBQzNCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQztRQUVELE1BQU0sSUFBSSxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxNQUFNLEVBQUUsZ0JBQU8sQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3RFLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLGVBQUMsT0FBQSxNQUFBLE1BQUEsSUFBSSxDQUFDLEtBQUssQ0FBQywwQ0FBRSxVQUFVLDBDQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsbUJBQVUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUEsRUFBQSxDQUFDLENBQUM7UUFDM0gsSUFBSSxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtZQUN2QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDbkM7UUFDRCxNQUFNLGFBQWEsR0FBRyxjQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsMkJBQWtCLENBQUMsQ0FBQztRQUNwRSxJQUFJO1lBQ0YsTUFBTSxXQUFXLEdBQUcsTUFBTSxlQUFFLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1lBQ3pELElBQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxxQkFBcUIsRUFBRTtnQkFDOUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2FBQ3BDO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ25DO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixNQUFNLE1BQU0sR0FBc0I7Z0JBQ2hDLFdBQVcsRUFBRTtvQkFDWCxLQUFLLEVBQUUsdUNBQXVDO29CQUM5QyxJQUFJLEVBQUUsNkdBQTZHOzBCQUM3Ryx1R0FBdUc7MEJBQ3ZHLGdIQUFnSDtvQkFDdEgsT0FBTyxFQUFFO3dCQUNQLE9BQU8sRUFBRSxhQUFhO3FCQUN2QjtpQkFDRjtnQkFDRCxRQUFRLEVBQUUsU0FBUzthQUNwQixDQUFBO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ2hDO0lBQ0gsQ0FBQztDQUFBO0FBdENELDRCQXNDQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIGVzbGludC1kaXNhYmxlICovXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIEhBTE8xX01BUFNfUkVMUEFUSCwgSEFMT19HQU1FUyB9IGZyb20gJy4vY29tbW9uJztcblxuY29uc3QgTUFQX05VTUJFUl9DT05TVFJBSU5UID0gMjg7XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdENFTVAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx0eXBlcy5JVGVzdFJlc3VsdD4ge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBhY3RpdmVHYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xuICBpZiAoYWN0aXZlR2FtZU1vZGUgIT09IEdBTUVfSUQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cbiAgY29uc3QgZGlzY292ZXJ5ID0gc2VsZWN0b3JzLmRpc2NvdmVyeUJ5R2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gIGlmIChkaXNjb3ZlcnkgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxuXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgY29uc3QgY2VNb2RzID0gT2JqZWN0LmtleXMobW9kcykuZmlsdGVyKG1vZElkID0+IG1vZHNbbW9kSWRdPy5hdHRyaWJ1dGVzPy5oYWxvR2FtZXMuaW5jbHVkZXMoSEFMT19HQU1FUy5oYWxvMS5pbnRlcm5hbElkKSk7XG4gIGlmIChjZU1vZHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG4gIGNvbnN0IGhhbG8xTWFwc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIEhBTE8xX01BUFNfUkVMUEFUSCk7XG4gIHRyeSB7XG4gICAgY29uc3QgZmlsZUVudHJpZXMgPSBhd2FpdCBmcy5yZWFkZGlyQXN5bmMoaGFsbzFNYXBzUGF0aCk7XG4gICAgaWYgKGZpbGVFbnRyaWVzLmxlbmd0aCA8IE1BUF9OVU1CRVJfQ09OU1RSQUlOVCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgZW5vdWdoIG1hcHMnKTsgXG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc3QgcmVzdWx0OiB0eXBlcy5JVGVzdFJlc3VsdCA9IHtcbiAgICAgIGRlc2NyaXB0aW9uOiB7XG4gICAgICAgIHNob3J0OiAnSGFsbzogQ0UgTXVsdGlwbGF5ZXIgbWFwcyBhcmUgbWlzc2luZycsXG4gICAgICAgIGxvbmc6ICdZb3VyIFwie3tkaXJQYXRofX1cIiBmb2xkZXIgaXMgZWl0aGVyIG1pc3NpbmcvaW5hY2Nlc3NpYmxlLCBvciBhcHBlYXJzIHRvIG5vdCBjb250YWluIGFsbCB0aGUgcmVxdWlyZWQgbWFwcy4gJ1xuICAgICAgICAgICAgKyAnVGhpcyBpcyB1c3VhbGx5IGFuIGluZGljYXRpb24gdGhhdCB5b3UgZG8gbm90IGhhdmUgSGFsbzogQ0UgTXVsdGlwbGF5ZXIgaW5zdGFsbGVkLiBTb21lIG1vZHMgbWF5IG5vdCAnXG4gICAgICAgICAgICArICd3b3JrIHByb3Blcmx5IGR1ZSB0byBhIGJ1ZyBpbiB0aGUgZ2FtZSBlbmdpbmUuIFBsZWFzZSBlbnN1cmUgeW91IGhhdmUgaW5zdGFsbGVkIENFIE1QIHRocm91Z2ggeW91ciBnYW1lIHN0b3JlLicsXG4gICAgICAgIHJlcGxhY2U6IHtcbiAgICAgICAgICBkaXJQYXRoOiBoYWxvMU1hcHNQYXRoLFxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgc2V2ZXJpdHk6ICd3YXJuaW5nJyxcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXN1bHQpO1xuICB9XG59Il19