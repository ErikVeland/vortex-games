"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_LAUNCHER_SETTINGS = exports.INVALID_LO_MOD_TYPES = exports.I18N_NAMESPACE = exports.LO_FILE_NAME = exports.GAME_ID = exports.MOD_INFO = void 0;
exports.launcherSettingsFilePath = launcherSettingsFilePath;
exports.loadOrderFilePath = loadOrderFilePath;
exports.modsRelPath = modsRelPath;
exports.gameExecutable = gameExecutable;
const vortex_api_1 = require("vortex-api");
const path_1 = __importDefault(require("path"));
exports.MOD_INFO = 'modinfo.xml';
exports.GAME_ID = '7daystodie';
exports.LO_FILE_NAME = 'loadOrder.json';
exports.I18N_NAMESPACE = `game-${exports.GAME_ID}`;
exports.INVALID_LO_MOD_TYPES = ['collection', '7dtd-root-mod'];
function launcherSettingsFilePath() {
    return path_1.default.join(vortex_api_1.util.getVortexPath('appData'), '7DaysToDie', 'launchersettings.json');
}
function loadOrderFilePath(profileId) {
    return path_1.default.join(vortex_api_1.util.getVortexPath('appData'), '7DaysToDie', profileId + '_' + exports.LO_FILE_NAME);
}
function modsRelPath() {
    return 'Mods';
}
function gameExecutable() {
    return '7DaysToDie.exe';
}
exports.DEFAULT_LAUNCHER_SETTINGS = {
    ShowLauncher: false,
    DefaultRunConfig: {
        ExclusiveMode: false,
        Renderer: "dx11",
        UseGamesparks: true,
        UseEAC: true,
        UseNativeInput: false,
        AdditionalParameters: ""
    }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQVNBLDREQUVDO0FBRUQsOENBRUM7QUFFRCxrQ0FFQztBQUVELHdDQUVDO0FBdkJELDJDQUFrQztBQUNsQyxnREFBd0I7QUFFWCxRQUFBLFFBQVEsR0FBRyxhQUFhLENBQUM7QUFDekIsUUFBQSxPQUFPLEdBQUcsWUFBWSxDQUFDO0FBQ3ZCLFFBQUEsWUFBWSxHQUFHLGdCQUFnQixDQUFDO0FBQ2hDLFFBQUEsY0FBYyxHQUFHLFFBQVEsZUFBTyxFQUFFLENBQUM7QUFDbkMsUUFBQSxvQkFBb0IsR0FBRyxDQUFDLFlBQVksRUFBRSxlQUFlLENBQUMsQ0FBQztBQUVwRSxTQUFnQix3QkFBd0I7SUFDdEMsT0FBTyxjQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFLFlBQVksRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0FBQ3pGLENBQUM7QUFFRCxTQUFnQixpQkFBaUIsQ0FBQyxTQUFpQjtJQUNqRCxPQUFPLGNBQUksQ0FBQyxJQUFJLENBQUMsaUJBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLEVBQUUsWUFBWSxFQUFFLFNBQVMsR0FBRyxHQUFHLEdBQUcsb0JBQVksQ0FBQyxDQUFDO0FBQ2hHLENBQUM7QUFFRCxTQUFnQixXQUFXO0lBQ3pCLE9BQU8sTUFBTSxDQUFDO0FBQ2hCLENBQUM7QUFFRCxTQUFnQixjQUFjO0lBQzVCLE9BQU8sZ0JBQWdCLENBQUM7QUFDMUIsQ0FBQztBQUVZLFFBQUEseUJBQXlCLEdBQUc7SUFDdkMsWUFBWSxFQUFHLEtBQUs7SUFDcEIsZ0JBQWdCLEVBQUc7UUFDakIsYUFBYSxFQUFHLEtBQUs7UUFDckIsUUFBUSxFQUFHLE1BQU07UUFDakIsYUFBYSxFQUFHLElBQUk7UUFDcEIsTUFBTSxFQUFHLElBQUk7UUFDYixjQUFjLEVBQUcsS0FBSztRQUN0QixvQkFBb0IsRUFBRyxFQUFFO0tBQzFCO0NBQ0YsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG5leHBvcnQgY29uc3QgTU9EX0lORk8gPSAnbW9kaW5mby54bWwnO1xuZXhwb3J0IGNvbnN0IEdBTUVfSUQgPSAnN2RheXN0b2RpZSc7XG5leHBvcnQgY29uc3QgTE9fRklMRV9OQU1FID0gJ2xvYWRPcmRlci5qc29uJztcbmV4cG9ydCBjb25zdCBJMThOX05BTUVTUEFDRSA9IGBnYW1lLSR7R0FNRV9JRH1gO1xuZXhwb3J0IGNvbnN0IElOVkFMSURfTE9fTU9EX1RZUEVTID0gWydjb2xsZWN0aW9uJywgJzdkdGQtcm9vdC1tb2QnXTtcblxuZXhwb3J0IGZ1bmN0aW9uIGxhdW5jaGVyU2V0dGluZ3NGaWxlUGF0aCgpOiBzdHJpbmcge1xuICByZXR1cm4gcGF0aC5qb2luKHV0aWwuZ2V0Vm9ydGV4UGF0aCgnYXBwRGF0YScpLCAnN0RheXNUb0RpZScsICdsYXVuY2hlcnNldHRpbmdzLmpzb24nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRPcmRlckZpbGVQYXRoKHByb2ZpbGVJZDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2FwcERhdGEnKSwgJzdEYXlzVG9EaWUnLCBwcm9maWxlSWQgKyAnXycgKyBMT19GSUxFX05BTUUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbW9kc1JlbFBhdGgoKSB7XG4gIHJldHVybiAnTW9kcyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnYW1lRXhlY3V0YWJsZSgpIHtcbiAgcmV0dXJuICc3RGF5c1RvRGllLmV4ZSc7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX0xBVU5DSEVSX1NFVFRJTkdTID0ge1xuICBTaG93TGF1bmNoZXIgOiBmYWxzZSxcbiAgRGVmYXVsdFJ1bkNvbmZpZyA6IHtcbiAgICBFeGNsdXNpdmVNb2RlIDogZmFsc2UsXG4gICAgUmVuZGVyZXIgOiBcImR4MTFcIixcbiAgICBVc2VHYW1lc3BhcmtzIDogdHJ1ZSxcbiAgICBVc2VFQUMgOiB0cnVlLFxuICAgIFVzZU5hdGl2ZUlucHV0IDogZmFsc2UsXG4gICAgQWRkaXRpb25hbFBhcmFtZXRlcnMgOiBcIlwiXG4gIH1cbn0iXX0=