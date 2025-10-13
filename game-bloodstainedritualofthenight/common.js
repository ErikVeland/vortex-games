"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LO_FILE_NAME = exports.GAME_ID = exports.MOD_FILE_EXT = void 0;
exports.modsRelPath = modsRelPath;
const path_1 = __importDefault(require("path"));
exports.MOD_FILE_EXT = '.pak';
exports.GAME_ID = 'bloodstainedritualofthenight';
exports.LO_FILE_NAME = 'loadOrder.json';
function modsRelPath() {
    return path_1.default.join('BloodstainedRotN', 'Content', 'Paks', '~mods');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiY29tbW9uLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQU9BLGtDQUVDO0FBVEQsZ0RBQXdCO0FBR1gsUUFBQSxZQUFZLEdBQUcsTUFBTSxDQUFDO0FBQ3RCLFFBQUEsT0FBTyxHQUFHLDhCQUE4QixDQUFDO0FBQ3pDLFFBQUEsWUFBWSxHQUFHLGdCQUFnQixDQUFDO0FBRTdDLFNBQWdCLFdBQVc7SUFDekIsT0FBTyxjQUFJLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDbkUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyBEQUghIGV4dGVuc2lvbiBvbmx5IHN1cHBvcnQgLnBhayBtb2RzLlxuZXhwb3J0IGNvbnN0IE1PRF9GSUxFX0VYVCA9ICcucGFrJztcbmV4cG9ydCBjb25zdCBHQU1FX0lEID0gJ2Jsb29kc3RhaW5lZHJpdHVhbG9mdGhlbmlnaHQnO1xuZXhwb3J0IGNvbnN0IExPX0ZJTEVfTkFNRSA9ICdsb2FkT3JkZXIuanNvbic7XG5cbmV4cG9ydCBmdW5jdGlvbiBtb2RzUmVsUGF0aCgpIHtcbiAgcmV0dXJuIHBhdGguam9pbignQmxvb2RzdGFpbmVkUm90TicsICdDb250ZW50JywgJ1Bha3MnLCAnfm1vZHMnKTtcbn1cbiJdfQ==