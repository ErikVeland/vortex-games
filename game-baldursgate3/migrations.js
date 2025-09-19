"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.migrate13 = exports.migrate15 = exports.migrate = void 0;
const semver = __importStar(require("semver"));
const vortex_api_1 = require("vortex-api");
const loadOrder_1 = require("./loadOrder");
const path_1 = __importDefault(require("path"));
const util_1 = require("./util");
const actions_1 = require("./actions");
const common_1 = require("./common");
function migrate(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const bg3ProfileId = yield (0, util_1.getActivePlayerProfile)(api);
        const settingsPath = path_1.default.join((0, util_1.profilesPath)(), bg3ProfileId, 'modsettings.lsx');
        const backupPath = settingsPath + '.backup';
        const currentVersion = vortex_api_1.util.getSafe(api.getState(), ['settings', 'baldursgate3', 'extensionVersion'], '0.0.0');
        try {
            yield vortex_api_1.fs.statAsync(backupPath);
        }
        catch (err) {
            (0, util_1.logDebug)(`${backupPath} doesn't exist.`);
            try {
                yield vortex_api_1.fs.statAsync(settingsPath);
                yield vortex_api_1.fs.copyAsync(settingsPath, backupPath, { overwrite: true });
                (0, util_1.logDebug)(`backup created`);
                yield (0, loadOrder_1.importModSettingsGame)(api);
            }
            catch (err) {
                (0, util_1.logDebug)(`${settingsPath} doesn't exist`);
            }
        }
        finally {
            yield migrate15(api, currentVersion);
        }
    });
}
exports.migrate = migrate;
function migrate15(api, oldVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        const newVersion = '1.5.0';
        if (!common_1.DEBUG && semver.gte(oldVersion, newVersion)) {
            (0, util_1.logDebug)('skipping migration');
            return Promise.resolve();
        }
        yield (0, loadOrder_1.importModSettingsGame)(api);
        const t = api.translate;
        const batched = [(0, actions_1.setBG3ExtensionVersion)(newVersion)];
        api.sendNotification({
            id: 'bg3-patch7-info',
            type: 'info',
            message: 'Baldur\'s Gate 3 patch 7',
            allowSuppress: true,
            actions: [{
                    title: 'More',
                    action: (dismiss) => {
                        api.showDialog('info', 'Baldur\'s Gate 3 patch 7', {
                            bbcode: t('As of Baldur\'s Gate 3 patch 7, the "ModFixer" mod is no longer required. Please feel free to disable it.{{bl}}'
                                + 'Additional information about patch 7 troubleshooting can be found here: [url]{{url}}[/url]{{bl}}'
                                + 'Please note - if you switch between different game versions/patches - make sure to purge your mods and run the game at least once '
                                + 'so that the game can regenerate your "modsettings.lsx" file.', { replace: {
                                    bl: '[br][/br][br][/br]',
                                    url: 'https://wiki.bg3.community/en/Tutorials/patch7-troubleshooting',
                                } }),
                        }, [{ label: 'Close', action: () => {
                                    batched.push(vortex_api_1.actions.suppressNotification('bg3-patch7-info', true));
                                    dismiss();
                                } }]);
                    }
                }],
        });
        vortex_api_1.util.batchDispatch(api.store, batched);
    });
}
exports.migrate15 = migrate15;
function migrate13(api, oldVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        const newVersion = '1.4.0';
        if (semver.gte(oldVersion, newVersion)) {
            (0, util_1.logDebug)('skipping migration');
            return Promise.reject();
        }
        (0, util_1.logDebug)('perform migration');
        try {
            yield (0, loadOrder_1.importModSettingsGame)(api);
            return Promise.reject();
        }
        catch (_a) {
            return Promise.reject();
        }
        return Promise.reject();
    });
}
exports.migrate13 = migrate13;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlncmF0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1pZ3JhdGlvbnMudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsK0NBQWlDO0FBQ2pDLDJDQUFzRDtBQUN0RCwyQ0FBb0Q7QUFDcEQsZ0RBQXdCO0FBRXhCLGlDQUF3RTtBQUN4RSx1Q0FBbUQ7QUFDbkQscUNBQWlDO0FBR2pDLFNBQXNCLE9BQU8sQ0FBQyxHQUF3Qjs7UUFDcEQsTUFBTSxZQUFZLEdBQUcsTUFBTSxJQUFBLDZCQUFzQixFQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZELE1BQU0sWUFBWSxHQUFXLGNBQUksQ0FBQyxJQUFJLENBQUMsSUFBQSxtQkFBWSxHQUFFLEVBQUUsWUFBWSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDeEYsTUFBTSxVQUFVLEdBQUcsWUFBWSxHQUFHLFNBQVMsQ0FBQztRQUM1QyxNQUFNLGNBQWMsR0FBRyxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUUsQ0FBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFFL0csSUFBSTtZQUNGLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUNoQztRQUNELE9BQU8sR0FBRyxFQUFFO1lBRVYsSUFBQSxlQUFRLEVBQUMsR0FBRyxVQUFVLGlCQUFpQixDQUFDLENBQUM7WUFFekMsSUFBSTtnQkFDRixNQUFNLGVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ2pDLE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFFLENBQUM7Z0JBRW5FLElBQUEsZUFBUSxFQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBRzNCLE1BQU0sSUFB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XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuaW1wb3J0IHsgaW1wb3J0TW9kU2V0dGluZ3NHYW1lIH0gZnJvbSAnLi9sb2FkT3JkZXInO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuXHJcbmltcG9ydCB7IGdldEFjdGl2ZVBsYXllclByb2ZpbGUsIGxvZ0RlYnVnLCBwcm9maWxlc1BhdGggfSBmcm9tICcuL3V0aWwnO1xyXG5pbXBvcnQgeyBzZXRCRzNFeHRlbnNpb25WZXJzaW9uIH0gZnJvbSAnLi9hY3Rpb25zJztcclxuaW1wb3J0IHsgREVCVUcgfSBmcm9tICcuL2NvbW1vbic7XHJcblxyXG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dm9pZD4ge1xyXG4gIGNvbnN0IGJnM1Byb2ZpbGVJZCA9IGF3YWl0IGdldEFjdGl2ZVBsYXllclByb2ZpbGUoYXBpKTtcclxuICBjb25zdCBzZXR0aW5nc1BhdGg6IHN0cmluZyA9IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczUHJvZmlsZUlkLCAnbW9kc2V0dGluZ3MubHN4Jyk7XHJcbiAgY29uc3QgYmFja3VwUGF0aCA9IHNldHRpbmdzUGF0aCArICcuYmFja3VwJztcclxuICBjb25zdCBjdXJyZW50VmVyc2lvbiA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydzZXR0aW5ncycsICdiYWxkdXJzZ2F0ZTMnLCAnZXh0ZW5zaW9uVmVyc2lvbiddLCAnMC4wLjAnKTtcclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGZzLnN0YXRBc3luYyhiYWNrdXBQYXRoKTsgLy8gaWYgaXQgZG9lc24ndCBleGlzdCwgbWFrZSBhIGJhY2t1cFxyXG4gIH0gXHJcbiAgY2F0Y2ggKGVycikge1xyXG5cclxuICAgIGxvZ0RlYnVnKGAke2JhY2t1cFBhdGh9IGRvZXNuJ3QgZXhpc3QuYCk7XHJcblxyXG4gICAgdHJ5IHtcclxuICAgICAgYXdhaXQgZnMuc3RhdEFzeW5jKHNldHRpbmdzUGF0aCk7IFxyXG4gICAgICBhd2FpdCBmcy5jb3B5QXN5bmMoc2V0dGluZ3NQYXRoLCBiYWNrdXBQYXRoLCB7IG92ZXJ3cml0ZTogdHJ1ZSB9ICk7XHJcbiAgICAgIFxyXG4gICAgICBsb2dEZWJ1ZyhgYmFja3VwIGNyZWF0ZWRgKTtcclxuICAgICAgXHJcbiAgICAgIC8vIGltcG9ydFxyXG4gICAgICBhd2FpdCBpbXBvcnRNb2RTZXR0aW5nc0dhbWUoYXBpKTtcclxuICAgICAgXHJcbiAgICAgIC8vbG9nRGVidWcoYCR7YmFja3VwUGF0aH0gZG9lc24ndCBleGlzdGApO1xyXG4gICAgfSBcclxuICAgIGNhdGNoIChlcnIpIHtcclxuICAgICAgbG9nRGVidWcoYCR7c2V0dGluZ3NQYXRofSBkb2Vzbid0IGV4aXN0YCk7XHJcbiAgICB9ICAgIFxyXG4gIH0gZmluYWxseSB7XHJcbiAgICBhd2FpdCBtaWdyYXRlMTUoYXBpLCBjdXJyZW50VmVyc2lvbik7XHJcbiAgfVxyXG5cclxuICAvLyBiYWNrIHVwIG1hZGUganVzdCBpbiBjYXNlXHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBtaWdyYXRlMTUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBvbGRWZXJzaW9uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcclxuXHJcbiAgY29uc3QgbmV3VmVyc2lvbiA9ICcxLjUuMCc7XHJcblxyXG4gIC8vIGlmIG9sZCB2ZXJzaW9uIGlzIG5ld2VyLCB0aGVuIHNraXBcclxuICBpZiAoIURFQlVHICYmIHNlbXZlci5ndGUob2xkVmVyc2lvbiwgbmV3VmVyc2lvbikpIHtcclxuICAgIGxvZ0RlYnVnKCdza2lwcGluZyBtaWdyYXRpb24nKTtcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcclxuICB9XHJcblxyXG4gIGF3YWl0IGltcG9ydE1vZFNldHRpbmdzR2FtZShhcGkpO1xyXG4gIGNvbnN0IHQgPSBhcGkudHJhbnNsYXRlO1xyXG4gIGNvbnN0IGJhdGNoZWQ6IGFueSA9IFtzZXRCRzNFeHRlbnNpb25WZXJzaW9uKG5ld1ZlcnNpb24pXTtcclxuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XHJcbiAgICBpZDogJ2JnMy1wYXRjaDctaW5mbycsXHJcbiAgICB0eXBlOiAnaW5mbycsXHJcbiAgICBtZXNzYWdlOiAnQmFsZHVyXFwncyBHYXRlIDMgcGF0Y2ggNycsXHJcbiAgICBhbGxvd1N1cHByZXNzOiB0cnVlLFxyXG4gICAgYWN0aW9uczogW3tcclxuICAgICAgdGl0bGU6ICdNb3JlJyxcclxuICAgICAgYWN0aW9uOiAoZGlzbWlzcykgPT4ge1xyXG4gICAgICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ0JhbGR1clxcJ3MgR2F0ZSAzIHBhdGNoIDcnLCB7XHJcbiAgICAgICAgICBiYmNvZGU6IHQoJ0FzIG9mIEJhbGR1clxcJ3MgR2F0ZSAzIHBhdGNoIDcsIHRoZSBcIk1vZEZpeGVyXCIgbW9kIGlzIG5vIGxvbmdlciByZXF1aXJlZC4gUGxlYXNlIGZlZWwgZnJlZSB0byBkaXNhYmxlIGl0Lnt7Ymx9fSdcclxuICAgICAgICAgICAgICAgICAgKyAnQWRkaXRpb25hbCBpbmZvcm1hdGlvbiBhYm91dCBwYXRjaCA3IHRyb3VibGVzaG9vdGluZyBjYW4gYmUgZm91bmQgaGVyZTogW3VybF17e3VybH19Wy91cmxde3tibH19J1xyXG4gICAgICAgICAgICAgICAgICArICdQbGVhc2Ugbm90ZSAtIGlmIHlvdSBzd2l0Y2ggYmV0d2VlbiBkaWZmZXJlbnQgZ2FtZSB2ZXJzaW9ucy9wYXRjaGVzIC0gbWFrZSBzdXJlIHRvIHB1cmdlIHlvdXIgbW9kcyBhbmQgcnVuIHRoZSBnYW1lIGF0IGxlYXN0IG9uY2UgJ1xyXG4gICAgICAgICAgICAgICAgICArICdzbyB0aGF0IHRoZSBnYW1lIGNhbiByZWdlbmVyYXRlIHlvdXIgXCJtb2RzZXR0aW5ncy5sc3hcIiBmaWxlLicsIHsgcmVwbGFjZToge1xyXG4gICAgICAgICAgICBibDogJ1ticl1bL2JyXVticl1bL2JyXScsXHJcbiAgICAgICAgICAgIHVybDogJ2h0dHBzOi8vd2lraS5iZzMuY29tbXVuaXR5L2VuL1R1dG9yaWFscy9wYXRjaDctdHJvdWJsZXNob290aW5nJyxcclxuICAgICAgICAgIH0gfSksXHJcbiAgICAgICAgfSwgWyB7IGxhYmVsOiAnQ2xvc2UnLCBhY3Rpb246ICgpID0+IHtcclxuICAgICAgICAgIGJhdGNoZWQucHVzaChhY3Rpb25zLnN1cHByZXNzTm90aWZpY2F0aW9uKCdiZzMtcGF0Y2g3LWluZm8nLCB0cnVlKSk7XHJcbiAgICAgICAgICBkaXNtaXNzKCk7XHJcbiAgICAgICAgfX1dKTtcclxuICAgICAgfVxyXG4gICAgfV0sXHJcbiAgfSlcclxuICB1dGlsLmJhdGNoRGlzcGF0Y2goYXBpLnN0b3JlLCBiYXRjaGVkKTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIG1pZ3JhdGUxMyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIG9sZFZlcnNpb246IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xyXG5cclxuICBjb25zdCBuZXdWZXJzaW9uID0gJzEuNC4wJzsgLy8gRk9SQ0lORyBNSUdSQVRJT05cclxuXHJcbiAgLy8gaWYgb2xkIHZlcnNpb24gaXMgbmV3ZXIsIHRoZW4gc2tpcFxyXG4gIGlmIChzZW12ZXIuZ3RlKG9sZFZlcnNpb24sIG5ld1ZlcnNpb24pKSB7XHJcbiAgICBsb2dEZWJ1Zygnc2tpcHBpbmcgbWlncmF0aW9uJyk7XHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoKTtcclxuICB9XHJcblxyXG4gIGxvZ0RlYnVnKCdwZXJmb3JtIG1pZ3JhdGlvbicpO1xyXG5cclxuICAvLyBkbyB3ZSBqdXN0IGEgZm9yY2UgYSBpbXBvcnQgZnJvbSBnYW1lPyFcclxuXHJcbiAgdHJ5IHtcclxuICAgIGF3YWl0IGltcG9ydE1vZFNldHRpbmdzR2FtZShhcGkpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7IC8vIEZPUkNFIE5PVCBSRUNPUkQgVkVSU0lPTiBOVU1CRVJcclxuICB9IFxyXG4gIGNhdGNoIHtcclxuICAgIHJldHVybiBQcm9taXNlLnJlamVjdCgpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7ICBcclxufVxyXG4iXX0=