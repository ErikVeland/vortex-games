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
exports.identifyHaloGames = identifyHaloGames;
exports.applyToManifest = applyToManifest;
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
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(common_1.MOD_MANIFEST_FILE_PATH));
            yield vortex_api_1.fs.writeFileAsync(common_1.MOD_MANIFEST_FILE_PATH, lines.filter(line => !!line).join('\r\n'));
        }
        catch (err) {
            api.showErrorNotification('Failed to write mod manifest file', err, { allowReport: err.code !== 'EPERM' });
        }
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFNQSw4Q0FnQkM7QUFFRCwwQ0F3QkM7QUFoREQsZ0RBQXdCO0FBQ3hCLDJDQUFrRDtBQUVsRCxxQ0FBdUU7QUFHdkUsU0FBZ0IsaUJBQWlCLENBQUMsS0FBZTtJQUcvQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUNqRSxPQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsbUJBQVUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtRQUNuRCxNQUFNLEtBQUssR0FBRyxtQkFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzlCLFFBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDekIsTUFBTSxRQUFRLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxjQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDekMsSUFBSSxRQUFRLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUN0QyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUNsQixPQUFPLEtBQUssQ0FBQztZQUNmLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ1QsQ0FBQztBQUVELFNBQXNCLGVBQWUsQ0FBQyxHQUF3QixFQUFFLEtBQWM7O1FBQzVFLElBQUksWUFBWSxHQUFHLEVBQUUsQ0FBQztRQUN0QixJQUFJLENBQUM7WUFDSCxZQUFZLEdBQUcsTUFBTSxlQUFFLENBQUMsYUFBYSxDQUFDLCtCQUFzQixFQUFFLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDdEYsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7Z0JBQ25DLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLEVBQUUsRUFBRSxXQUFXLEVBQUUsR0FBRyxDQUFDLElBQUksS0FBSyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUMxRyxPQUFPO1lBQ1QsQ0FBQztRQUNILENBQUM7UUFDRCxNQUFNLFdBQVcsR0FBRyxzQkFBUyxDQUFDLGtCQUFrQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRSxnQkFBTyxDQUFDLENBQUM7UUFDMUUsTUFBTSxLQUFLLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QyxNQUFNLHFCQUFxQixHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7UUFDN0UsSUFBSSxLQUFLLElBQUksQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1lBQ3BDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUIsQ0FBQzthQUFNLElBQUksQ0FBQyxLQUFLLElBQUkscUJBQXFCLEVBQUUsQ0FBQztZQUMzQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDOUMsQ0FBQztRQUNELElBQUksQ0FBQztZQUNILE1BQU0sZUFBRSxDQUFDLHNCQUFzQixDQUFDLGNBQUksQ0FBQyxPQUFPLENBQUMsK0JBQXNCLENBQUMsQ0FBQyxDQUFDO1lBQ3RFLE1BQU0sZUFBRSxDQUFDLGNBQWMsQ0FBQywrQkFBc0IsRUFBRSxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQzdGLENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsR0FBRyxDQUFDLHFCQUFxQixDQUFDLG1DQUFtQyxFQUFFLEdBQUcsRUFBRSxFQUFFLFdBQVcsRUFBRSxHQUFHLENBQUMsSUFBSSxLQUFLLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDN0csQ0FBQztJQUNILENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgZnMsIHR5cGVzLCBzZWxlY3RvcnMgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgSEFMT19HQU1FUywgTU9EX01BTklGRVNUX0ZJTEVfUEFUSCB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IElIYWxvR2FtZSB9IGZyb20gJy4vdHlwZXMnO1xuXG5leHBvcnQgZnVuY3Rpb24gaWRlbnRpZnlIYWxvR2FtZXMoZmlsZXM6IHN0cmluZ1tdKTogSUhhbG9HYW1lW10ge1xuICAvLyBGdW5jdGlvbiBhaW1zIHRvIGlkZW50aWZ5IHRoZSByZWxldmFudCBoYWxvIGdhbWUgZW50cnkgdXNpbmcgdGhlXG4gIC8vICBtb2QgZmlsZXMuXG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpICE9PSAnJyk7XG4gIHJldHVybiBPYmplY3Qua2V5cyhIQUxPX0dBTUVTKS5yZWR1Y2UoKGFjY3VtLCBrZXkpID0+IHtcbiAgICBjb25zdCBlbnRyeSA9IEhBTE9fR0FNRVNba2V5XTtcbiAgICBmaWx0ZXJlZC5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgY29uc3Qgc2VnbWVudHMgPSBlbGVtZW50LnNwbGl0KHBhdGguc2VwKTtcbiAgICAgIGlmIChzZWdtZW50cy5pbmNsdWRlcyhlbnRyeS5tb2RzUGF0aCkpIHtcbiAgICAgICAgYWNjdW0ucHVzaChlbnRyeSk7XG4gICAgICAgIHJldHVybiBhY2N1bTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBhY2N1bTtcbiAgfSwgW10pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXBwbHlUb01hbmlmZXN0KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgYXBwbHk6IGJvb2xlYW4pIHtcbiAgbGV0IG1hbmlmZXN0RGF0YSA9ICcnO1xuICB0cnkge1xuICAgIG1hbmlmZXN0RGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoTU9EX01BTklGRVNUX0ZJTEVfUEFUSCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBpZiAoIVsnRU5PRU5UJ10uaW5jbHVkZXMoZXJyLmNvZGUpKSB7XG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBtb2QgbWFuaWZlc3QgZmlsZScsIGVyciwgeyBhbGxvd1JlcG9ydDogZXJyLmNvZGUgIT09ICdFUEVSTScgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIGNvbnN0IHN0YWdpbmdQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShhcGkuZ2V0U3RhdGUoKSwgR0FNRV9JRCk7XG4gIGNvbnN0IGxpbmVzID0gbWFuaWZlc3REYXRhLnNwbGl0KCdcXHJcXG4nKTtcbiAgY29uc3QgaGFzU3RhZ2luZ0ZvbGRlckVudHJ5ID0gbGluZXMuc29tZShsaW5lID0+IGxpbmUuaW5jbHVkZXMoc3RhZ2luZ1BhdGgpKTtcbiAgaWYgKGFwcGx5ICYmICFoYXNTdGFnaW5nRm9sZGVyRW50cnkpIHtcbiAgICBsaW5lcy5wdXNoKHN0YWdpbmdQYXRoKTtcbiAgfSBlbHNlIGlmICghYXBwbHkgJiYgaGFzU3RhZ2luZ0ZvbGRlckVudHJ5KSB7XG4gICAgbGluZXMuc3BsaWNlKGxpbmVzLmluZGV4T2Yoc3RhZ2luZ1BhdGgpLCAxKTtcbiAgfVxuICB0cnkge1xuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKE1PRF9NQU5JRkVTVF9GSUxFX1BBVEgpKTtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhNT0RfTUFOSUZFU1RfRklMRV9QQVRILCBsaW5lcy5maWx0ZXIobGluZSA9PiAhIWxpbmUpLmpvaW4oJ1xcclxcbicpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIG1vZCBtYW5pZmVzdCBmaWxlJywgZXJyLCB7IGFsbG93UmVwb3J0OiBlcnIuY29kZSAhPT0gJ0VQRVJNJyB9KTtcbiAgfVxufSJdfQ==