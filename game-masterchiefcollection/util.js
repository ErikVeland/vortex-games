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
exports.applyToManifest = exports.identifyHaloGames = void 0;
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
function identifyHaloGames(files) {
    const filtered = files.filter(file => path_1.default.extname(file) !== '');
    return Object.keys(common_1.HALO_GAMES).reduce((accum, key) => {
        const entry = common_1.HALO_GAMES[key];
        filtered.forEach(element => {
            const segments = element.split(path_1.default.sep);
            if (segments.includes(entry.modsPath)) {
                accum.push(entry);
                return accum;
            }
        });
        return accum;
    }, []);
}
exports.identifyHaloGames = identifyHaloGames;
function applyToManifest(api, apply) {
    return __awaiter(this, void 0, void 0, function* () {
        let manifestData = '';
        try {
            manifestData = yield vortex_api_1.fs.readFileAsync(common_1.MOD_MANIFEST_FILE_PATH, { encoding: 'utf8' });
        }
        catch (err) {
            if (!['ENOENT'].includes(err.code)) {
                api.showErrorNotification('Failed to read mod manifest file', err, { allowReport: err.code !== 'EPERM' });
                return;
            }
        }
        const stagingPath = vortex_api_1.selectors.installPathForGame(api.getState(), common_1.GAME_ID);
        const lines = manifestData.split('\r\n');
        const hasStagingFolderEntry = lines.some(line => line.includes(stagingPath));
        if (apply && !hasStagingFolderEntry) {
            lines.push(stagingPath);
        }
        else if (!apply && hasStagingFolderEntry) {
            lines.splice(lines.indexOf(stagingPath), 1);
        }
        yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(common_1.MOD_MANIFEST_FILE_PATH));
        yield vortex_api_1.fs.writeFileAsync(common_1.MOD_MANIFEST_FILE_PATH, lines.filter(line => !!line).join('\r\n'));
    });
}
exports.applyToManifest = applyToManifest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsZ0RBQXdCO0FBQ3hCLDJDQUFrRDtBQUVsRCxxQ0FBdUU7QUFHdkUsU0FBZ0IsaUJBQWlCLENBQUMsS0FBZTtJQUcvQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUNqRSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtRQUNuRCxNQUFNLEtBQUssR0FBRyxtQkFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDekIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDekMsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRTtnQkFDckMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbEIsT0FBTyxLQUFLLENBQUM7YUFDZDtRQUNILENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDVCxDQUFDO0FBaEJELDhDQWdCQztBQUVELFNBQXNCLGVBQWUsQ0FBQyxHQUF3QixFQUFFLEtBQWM7O1FBQzVFLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztRQUN0QixJQUFJO1lBQ0YsWUFBWSxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQywrQkFBc0IsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1NBQ3JGO1FBQUMsT0FBTyxHQUFHLEVBQUU7WUFDWixJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNsQyxHQUFHLENBQUMscUJBQXFCLENBQUMsa0NBQWtDLEVBQUUsR0FBRyxFQUFFLEVBQUUsV0FBVyxFQUFFLEdBQUcsQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDMUcsT0FBTzthQUNSO1NBQ0Y7UUFDRCxNQUFNLFdBQVcsR0FBRyxzQkFBUyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDMUUsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxNQUFNLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDN0UsSUFBSSxLQUFLLElBQUksQ0FBQyxxQkFBcUIsRUFBRTtZQUNuQyxLQUFLLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1NBQ3pCO2FBQU0sSUFBSSxDQUFDLEtBQUssSUFBSSxxQkFBcUIsRUFBRTtZQUMxQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDN0M7UUFDRCxNQUFNLGVBQUUsQ0FBQyxzQkFBc0IsQ0FBQyxjQUFJLENBQUMsT0FBTyxDQUFDLCtCQUFzQixDQUFDLENBQUMsQ0FBQztRQUN0RSxNQUFNLGVBQUUsQ0FBQyxjQUFjLENBQUMsK0JBQXNCLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM3RixDQUFDO0NBQUE7QUFwQkQsMENBb0JDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyBmcywgdHlwZXMsIHNlbGVjdG9ycyB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBIQUxPX0dBTUVTLCBNT0RfTUFOSUZFU1RfRklMRV9QQVRIIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgSUhhbG9HYW1lIH0gZnJvbSAnLi90eXBlcyc7XG5cbmV4cG9ydCBmdW5jdGlvbiBpZGVudGlmeUhhbG9HYW1lcyhmaWxlczogc3RyaW5nW10pOiBJSGFsb0dhbWVbXSB7XG4gIC8vIEZ1bmN0aW9uIGFpbXMgdG8gaWRlbnRpZnkgdGhlIHJlbGV2YW50IGhhbG8gZ2FtZSBlbnRyeSB1c2luZyB0aGVcbiAgLy8gIG1vZCBmaWxlcy5cbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBwYXRoLmV4dG5hbWUoZmlsZSkgIT09ICcnKTtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKEhBTE9fR0FNRVMpLnJlZHVjZSgoYWNjdW0sIGtleSkgPT4ge1xuICAgIGNvbnN0IGVudHJ5ID0gSEFMT19HQU1FU1trZXldO1xuICAgIGZpbHRlcmVkLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICBjb25zdCBzZWdtZW50cyA9IGVsZW1lbnQuc3BsaXQocGF0aC5zZXApO1xuICAgICAgaWYgKHNlZ21lbnRzLmluY2x1ZGVzKGVudHJ5Lm1vZHNQYXRoKSkge1xuICAgICAgICBhY2N1bS5wdXNoKGVudHJ5KTtcbiAgICAgICAgcmV0dXJuIGFjY3VtO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCBbXSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhcHBseVRvTWFuaWZlc3QoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBhcHBseTogYm9vbGVhbikge1xuICBsZXQgbWFuaWZlc3REYXRhID0gJyc7XG4gIHRyeSB7XG4gICAgbWFuaWZlc3REYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhNT0RfTUFOSUZFU1RfRklMRV9QQVRILCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGlmICghWydFTk9FTlQnXS5pbmNsdWRlcyhlcnIuY29kZSkpIHtcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZWFkIG1vZCBtYW5pZmVzdCBmaWxlJywgZXJyLCB7IGFsbG93UmVwb3J0OiBlcnIuY29kZSAhPT0gJ0VQRVJNJyB9KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cbiAgY29uc3Qgc3RhZ2luZ1BhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKGFwaS5nZXRTdGF0ZSgpLCBHQU1FX0lEKTtcbiAgY29uc3QgbGluZXMgPSBtYW5pZmVzdERhdGEuc3BsaXQoJ1xcclxcbicpO1xuICBjb25zdCBoYXNTdGFnaW5nRm9sZGVyRW50cnkgPSBsaW5lcy5zb21lKGxpbmUgPT4gbGluZS5pbmNsdWRlcyhzdGFnaW5nUGF0aCkpO1xuICBpZiAoYXBwbHkgJiYgIWhhc1N0YWdpbmdGb2xkZXJFbnRyeSkge1xuICAgIGxpbmVzLnB1c2goc3RhZ2luZ1BhdGgpO1xuICB9IGVsc2UgaWYgKCFhcHBseSAmJiBoYXNTdGFnaW5nRm9sZGVyRW50cnkpIHtcbiAgICBsaW5lcy5zcGxpY2UobGluZXMuaW5kZXhPZihzdGFnaW5nUGF0aCksIDEpO1xuICB9XG4gIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKE1PRF9NQU5JRkVTVF9GSUxFX1BBVEgpKTtcbiAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoTU9EX01BTklGRVNUX0ZJTEVfUEFUSCwgbGluZXMuZmlsdGVyKGxpbmUgPT4gISFsaW5lKS5qb2luKCdcXHJcXG4nKSk7XG59Il19