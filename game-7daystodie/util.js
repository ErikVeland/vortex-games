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
exports.getModInfoFiles = exports.getModName = exports.makePrefix = exports.reversePrefix = exports.getPrefixOffset = exports.ensureLOFile = exports.genProps = exports.toBlue = exports.getModsPath = exports.selectUDF = exports.relaunchExt = exports.deploy = exports.purge = void 0;
const bluebird_1 = __importDefault(require("bluebird"));
const path_1 = __importDefault(require("path"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const xml2js_1 = require("xml2js");
const actions_1 = require("./actions");
const common_1 = require("./common");
const PARSER = new xml2js_1.Parser({ explicitRoot: false });
function purge(api) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => api.events.emit('purge-mods', false, (err) => err ? reject(err) : resolve()));
    });
}
exports.purge = purge;
function deploy(api) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => api.events.emit('deploy-mods', (err) => err ? reject(err) : resolve()));
    });
}
exports.deploy = deploy;
const relaunchExt = (api) => {
    return api.showDialog('info', 'Restart Required', {
        text: 'The extension requires a restart to complete the UDF setup. '
            + 'The extension will now exit - please re-activate it via the games page or dashboard.',
    }, [{ label: 'Restart Extension' }])
        .then(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield purge(api);
            const batched = [
                vortex_api_1.actions.setDeploymentNecessary(common_1.GAME_ID, true),
                vortex_api_1.actions.setNextProfile(undefined),
            ];
            vortex_api_1.util.batchDispatch(api.store, batched);
        }
        catch (err) {
            api.showErrorNotification('Failed to set up UDF', err);
            return Promise.resolve();
        }
    }));
};
exports.relaunchExt = relaunchExt;
const selectUDF = (context) => __awaiter(void 0, void 0, void 0, function* () {
    const launcherSettings = (0, common_1.launcherSettingsFilePath)();
    const res = yield context.api.showDialog('info', 'Choose User Data Folder', {
        text: 'The modding pattern for 7DTD is changing. The Mods path inside the game directory '
            + 'is being deprecated and mods located in the old path will no longer work in the near '
            + 'future. Please select your User Data Folder (UDF) - Vortex will deploy to this new location. '
            + 'Please NEVER set your UDF path to Vortex\'s staging folder.',
    }, [
        { label: 'Cancel' },
        { label: 'Select UDF' },
    ]);
    if (res.action !== 'Select UDF') {
        return Promise.reject(new vortex_api_1.util.ProcessCanceled('Cannot proceed without UDF'));
    }
    yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(launcherSettings));
    yield ensureLOFile(context);
    let directory = yield context.api.selectDir({
        title: 'Select User Data Folder',
        defaultPath: path_1.default.join(path_1.default.dirname(launcherSettings)),
    });
    if (!directory) {
        return Promise.reject(new vortex_api_1.util.ProcessCanceled('Cannot proceed without UDF'));
    }
    const segments = directory.split(path_1.default.sep);
    const lowered = segments.map(seg => seg.toLowerCase());
    if (lowered[lowered.length - 1] === 'mods') {
        segments.pop();
        directory = segments.join(path_1.default.sep);
    }
    if (lowered.includes('vortex')) {
        return context.api.showDialog('info', 'Invalid User Data Folder', {
            text: 'The UDF cannot be set inside Vortex directories. Please select a different folder.',
        }, [
            { label: 'Try Again' }
        ]).then(() => (0, exports.selectUDF)(context));
    }
    yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(directory, 'Mods'));
    const launcher = common_1.DEFAULT_LAUNCHER_SETTINGS;
    launcher.DefaultRunConfig.AdditionalParameters = `-UserDataFolder="${directory}"`;
    const launcherData = JSON.stringify(launcher, null, 2);
    yield vortex_api_1.fs.writeFileAsync(launcherSettings, launcherData, { encoding: 'utf8' });
    context.api.store.dispatch((0, actions_1.setUDF)(directory));
    return (0, exports.relaunchExt)(context.api);
});
exports.selectUDF = selectUDF;
function getModsPath(api) {
    const state = api.getState();
    const udf = vortex_api_1.util.getSafe(state, ['settings', '7daystodie', 'udf'], undefined);
    return udf !== undefined ? path_1.default.join(udf, 'Mods') : 'Mods';
}
exports.getModsPath = getModsPath;
function toBlue(func) {
    return (...args) => bluebird_1.default.resolve(func(...args));
}
exports.toBlue = toBlue;
function genProps(context, profileId) {
    const api = context.api;
    const state = api.getState();
    const profile = (profileId !== undefined)
        ? vortex_api_1.selectors.profileById(state, profileId)
        : vortex_api_1.selectors.activeProfile(state);
    if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== common_1.GAME_ID) {
        return undefined;
    }
    const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', common_1.GAME_ID], undefined);
    if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
        return undefined;
    }
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    return { api, state, profile, mods, discovery };
}
exports.genProps = genProps;
function ensureLOFile(context, profileId, props) {
    return __awaiter(this, void 0, void 0, function* () {
        if (props === undefined) {
            props = genProps(context, profileId);
        }
        if (props === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('failed to generate game props'));
        }
        const targetPath = (0, common_1.loadOrderFilePath)(props.profile.id);
        try {
            yield vortex_api_1.fs.statAsync(targetPath)
                .catch({ code: 'ENOENT' }, () => vortex_api_1.fs.writeFileAsync(targetPath, JSON.stringify([]), { encoding: 'utf8' }));
            return targetPath;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
exports.ensureLOFile = ensureLOFile;
function getPrefixOffset(api) {
    var _a;
    const state = api.getState();
    const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
    if (profileId === undefined) {
        api.showErrorNotification('No active profile for 7dtd', undefined, { allowReport: false });
        return;
    }
    return vortex_api_1.util.getSafe(state, ['settings', '7daystodie', 'prefixOffset', profileId], 0);
}
exports.getPrefixOffset = getPrefixOffset;
function reversePrefix(input) {
    if (input.length !== 3 || input.match(/[A-Z][A-Z][A-Z]/g) === null) {
        throw new vortex_api_1.util.DataInvalid('Invalid input, please provide a valid prefix (AAA-ZZZ)');
    }
    const prefix = input.split('');
    const offset = prefix.reduce((prev, iter, idx) => {
        const pow = 2 - idx;
        const mult = Math.pow(26, pow);
        const charCode = (iter.charCodeAt(0) % 65);
        prev = prev + (charCode * mult);
        return prev;
    }, 0);
    return offset;
}
exports.reversePrefix = reversePrefix;
function makePrefix(input) {
    let res = '';
    let rest = input;
    while (rest > 0) {
        res = String.fromCharCode(65 + (rest % 26)) + res;
        rest = Math.floor(rest / 26);
    }
    return vortex_api_1.util.pad(res, 'A', 3);
}
exports.makePrefix = makePrefix;
function getModName(modInfoPath) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    return __awaiter(this, void 0, void 0, function* () {
        let modInfo;
        try {
            const xmlData = yield vortex_api_1.fs.readFileAsync(modInfoPath);
            modInfo = yield PARSER.parseStringPromise(xmlData);
            const modName = ((_c = (_b = (_a = modInfo === null || modInfo === void 0 ? void 0 : modInfo.DisplayName) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.$) === null || _c === void 0 ? void 0 : _c.value)
                || ((_h = (_g = (_f = (_e = (_d = modInfo === null || modInfo === void 0 ? void 0 : modInfo.ModInfo) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.Name) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.$) === null || _h === void 0 ? void 0 : _h.value)
                || ((_l = (_k = (_j = modInfo === null || modInfo === void 0 ? void 0 : modInfo.Name) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.$) === null || _l === void 0 ? void 0 : _l.value);
            return (modName !== undefined)
                ? Promise.resolve(modName)
                : Promise.reject(new vortex_api_1.util.DataInvalid('Unexpected modinfo.xml format'));
        }
        catch (err) {
            return Promise.reject(new vortex_api_1.util.DataInvalid('Failed to parse ModInfo.xml file'));
        }
    });
}
exports.getModName = getModName;
function getModInfoFiles(basePath) {
    return __awaiter(this, void 0, void 0, function* () {
        let filePaths = [];
        return (0, turbowalk_1.default)(basePath, files => {
            const filtered = files.filter(entry => !entry.isDirectory && path_1.default.basename(entry.filePath) === common_1.MOD_INFO);
            filePaths = filePaths.concat(filtered.map(entry => entry.filePath));
        }, { recurse: true, skipLinks: true })
            .catch(err => ['ENOENT', 'ENOTFOUND'].includes(err.code)
            ? Promise.resolve() : Promise.reject(err))
            .then(() => Promise.resolve(filePaths));
    });
}
exports.getModInfoFiles = getModInfoFiles;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLGdEQUF3QjtBQUN4QiwwREFBa0M7QUFDbEMsMkNBQWlFO0FBQ2pFLG1DQUFnQztBQUVoQyx1Q0FBbUM7QUFFbkMscUNBQXFIO0FBR3JILE1BQU0sTUFBTSxHQUFHLElBQUksZUFBTSxDQUFDLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7QUFFbkQsU0FBc0IsS0FBSyxDQUFDLEdBQXdCOztRQUNsRCxPQUFPLElBQUksT0FBTyxDQUFPLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQzNDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDbEYsQ0FBQztDQUFBO0FBSEQsc0JBR0M7QUFFRCxTQUFzQixNQUFNLENBQUMsR0FBd0I7O1FBQ25ELE9BQU8sSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FDM0MsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzVFLENBQUM7Q0FBQTtBQUhELHdCQUdDO0FBRU0sTUFBTSxXQUFXLEdBQUcsQ0FBQyxHQUF3QixFQUFFLEVBQUU7SUFDdEQsT0FBTyxHQUFHLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxrQkFBa0IsRUFBRTtRQUNo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QUcsQ0FBQyxDQUFDO2FBQzNDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUFBO0FBVkQsMENBVUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgUGFyc2VyIH0gZnJvbSAneG1sMmpzJztcblxuaW1wb3J0IHsgc2V0VURGIH0gZnJvbSAnLi9hY3Rpb25zJztcblxuaW1wb3J0IHsgREVGQVVMVF9MQVVOQ0hFUl9TRVRUSU5HUywgR0FNRV9JRCwgTU9EX0lORk8sIGxhdW5jaGVyU2V0dGluZ3NGaWxlUGF0aCwgbG9hZE9yZGVyRmlsZVBhdGggfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBJUHJvcHMgfSBmcm9tICcuL3R5cGVzJztcblxuY29uc3QgUEFSU0VSID0gbmV3IFBhcnNlcih7IGV4cGxpY2l0Um9vdDogZmFsc2UgfSk7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwdXJnZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgYXBpLmV2ZW50cy5lbWl0KCdwdXJnZS1tb2RzJywgZmFsc2UsIChlcnIpID0+IGVyciA/IHJlamVjdChlcnIpIDogcmVzb2x2ZSgpKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZXBsb3koYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIGFwaS5ldmVudHMuZW1pdCgnZGVwbG95LW1vZHMnLCAoZXJyKSA9PiBlcnIgPyByZWplY3QoZXJyKSA6IHJlc29sdmUoKSkpO1xufVxuXG5leHBvcnQgY29uc3QgcmVsYXVuY2hFeHQgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XG4gIHJldHVybiBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdSZXN0YXJ0IFJlcXVpcmVkJywge1xuICAgIHRleHQ6ICdUaGUgZXh0ZW5zaW9uIHJlcXVpcmVzIGEgcmVzdGFydCB0byBjb21wbGV0ZSB0aGUgVURGIHNldHVwLiAnXG4gICAgICAgICsgJ1RoZSBleHRlbnNpb24gd2lsbCBub3cgZXhpdCAtIHBsZWFzZSByZS1hY3RpdmF0ZSBpdCB2aWEgdGhlIGdhbWVzIHBhZ2Ugb3IgZGFzaGJvYXJkLicsXG4gIH0sIFsgeyBsYWJlbDogJ1Jlc3RhcnQgRXh0ZW5zaW9uJyB9IF0pXG4gIC50aGVuKGFzeW5jICgpID0+IHtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgcHVyZ2UoYXBpKTtcbiAgICAgIGNvbnN0IGJhdGNoZWQgPSBbXG4gICAgICAgIGFjdGlvbnMuc2V0RGVwbG95bWVudE5lY2Vzc2FyeShHQU1FX0lELCB0cnVlKSxcbiAgICAgICAgYWN0aW9ucy5zZXROZXh0UHJvZmlsZSh1bmRlZmluZWQpLFxuICAgICAgXTtcbiAgICAgIHV0aWwuYmF0Y2hEaXNwYXRjaChhcGkuc3RvcmUsIGJhdGNoZWQpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHNldCB1cCBVREYnLCBlcnIpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgfSk7XG59XG5cbmV4cG9ydCBjb25zdCBzZWxlY3RVREYgPSBhc3luYyAoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpID0+IHtcbiAgY29uc3QgbGF1bmNoZXJTZXR0aW5ncyA9IGxhdW5jaGVyU2V0dGluZ3NGaWxlUGF0aCgpO1xuICBjb25zdCByZXMgPSBhd2FpdCBjb250ZXh0LmFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ0Nob29zZSBVc2VyIERhdGEgRm9sZGVyJywge1xuICAgIHRleHQ6ICdUaGUgbW9kZGluZyBwYXR0ZXJuIGZvciA3RFREIGlzIGNoYW5naW5nLiBUaGUgTW9kcyBwYXRoIGluc2lkZSB0aGUgZ2FtZSBkaXJlY3RvcnkgJ1xuICAgICAgKyAnaXMgYmVpbmcgZGVwcmVjYXRlZCBhbmQgbW9kcyBsb2NhdGVkIGluIHRoZSBvbGQgcGF0aCB3aWxsIG5vIGxvbmdlciB3b3JrIGluIHRoZSBuZWFyICdcbiAgICAgICsgJ2Z1dHVyZS4gUGxlYXNlIHNlbGVjdCB5b3VyIFVzZXIgRGF0YSBGb2xkZXIgKFVERikgLSBWb3J0ZXggd2lsbCBkZXBsb3kgdG8gdGhpcyBuZXcgbG9jYXRpb24uICdcbiAgICAgICsgJ1BsZWFzZSBORVZFUiBzZXQgeW91ciBVREYgcGF0aCB0byBWb3J0ZXhcXCdzIHN0YWdpbmcgZm9sZGVyLicsXG4gIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ0NhbmNlbCcgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdTZWxlY3QgVURGJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0pO1xuICBpZiAocmVzLmFjdGlvbiAhPT0gJ1NlbGVjdCBVREYnKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnQ2Fubm90IHByb2NlZWQgd2l0aG91dCBVREYnKSk7XG4gIH1cbiAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmRpcm5hbWUobGF1bmNoZXJTZXR0aW5ncykpO1xuICBhd2FpdCBlbnN1cmVMT0ZpbGUoY29udGV4dCk7XG4gIGxldCBkaXJlY3RvcnkgPSBhd2FpdCBjb250ZXh0LmFwaS5zZWxlY3REaXIoe1xuICAgIHRpdGxlOiAnU2VsZWN0IFVzZXIgRGF0YSBGb2xkZXInLFxuICAgIGRlZmF1bHRQYXRoOiBwYXRoLmpvaW4ocGF0aC5kaXJuYW1lKGxhdW5jaGVyU2V0dGluZ3MpKSxcbiAgfSk7XG4gIGlmICghZGlyZWN0b3J5KSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnQ2Fubm90IHByb2NlZWQgd2l0aG91dCBVREYnKSk7XG4gIH1cblxuICBjb25zdCBzZWdtZW50cyA9IGRpcmVjdG9yeS5zcGxpdChwYXRoLnNlcCk7XG4gIGNvbnN0IGxvd2VyZWQgPSBzZWdtZW50cy5tYXAoc2VnID0+IHNlZy50b0xvd2VyQ2FzZSgpKTtcbiAgaWYgKGxvd2VyZWRbbG93ZXJlZC5sZW5ndGggLSAxXSA9PT0gJ21vZHMnKSB7XG4gICAgc2VnbWVudHMucG9wKCk7XG4gICAgZGlyZWN0b3J5ID0gc2VnbWVudHMuam9pbihwYXRoLnNlcCk7XG4gIH1cbiAgaWYgKGxvd2VyZWQuaW5jbHVkZXMoJ3ZvcnRleCcpKSB7XG4gICAgcmV0dXJuIGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnSW52YWxpZCBVc2VyIERhdGEgRm9sZGVyJywge1xuICAgICAgdGV4dDogJ1RoZSBVREYgY2Fubm90IGJlIHNldCBpbnNpZGUgVm9ydGV4IGRpcmVjdG9yaWVzLiBQbGVhc2Ugc2VsZWN0IGEgZGlmZmVyZW50IGZvbGRlci4nLFxuICAgIH0sIFtcbiAgICAgIHsgbGFiZWw6ICdUcnkgQWdhaW4nIH1cbiAgICBdKS50aGVuKCgpID0+IHNlbGVjdFVERihjb250ZXh0KSk7XG4gIH1cbiAgYXdhaXQgZnMuZW5zdXJlRGlyV3JpdGFibGVBc3luYyhwYXRoLmpvaW4oZGlyZWN0b3J5LCAnTW9kcycpKTtcbiAgY29uc3QgbGF1bmNoZXIgPSBERUZBVUxUX0xBVU5DSEVSX1NFVFRJTkdTO1xuICBsYXVuY2hlci5EZWZhdWx0UnVuQ29uZmlnLkFkZGl0aW9uYWxQYXJhbWV0ZXJzID0gYC1Vc2VyRGF0YUZvbGRlcj1cIiR7ZGlyZWN0b3J5fVwiYDtcbiAgY29uc3QgbGF1bmNoZXJEYXRhID0gSlNPTi5zdHJpbmdpZnkobGF1bmNoZXIsIG51bGwsIDIpO1xuICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhsYXVuY2hlclNldHRpbmdzLCBsYXVuY2hlckRhdGEsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0VURGKGRpcmVjdG9yeSkpO1xuICByZXR1cm4gcmVsYXVuY2hFeHQoY29udGV4dC5hcGkpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldE1vZHNQYXRoKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IHN0cmluZyB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHVkZiA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICc3ZGF5c3RvZGllJywgJ3VkZiddLCB1bmRlZmluZWQpO1xuICByZXR1cm4gdWRmICE9PSB1bmRlZmluZWQgPyBwYXRoLmpvaW4odWRmLCAnTW9kcycpIDogJ01vZHMnO1xufVxuXG4vLyBXZSBfc2hvdWxkXyBqdXN0IGV4cG9ydCB0aGlzIGZyb20gdm9ydGV4LWFwaSwgYnV0IEkgZ3Vlc3MgaXQncyBub3Qgd2lzZSB0byBtYWtlIGl0XG4vLyAgZWFzeSBmb3IgdXNlcnMgc2luY2Ugd2Ugd2FudCB0byBtb3ZlIGF3YXkgZnJvbSBibHVlYmlyZCBpbiB0aGUgZnV0dXJlID9cbmV4cG9ydCBmdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XG4gIHJldHVybiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkLnJlc29sdmUoZnVuYyguLi5hcmdzKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5Qcm9wcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgcHJvZmlsZUlkPzogc3RyaW5nKTogSVByb3BzIHtcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gKHByb2ZpbGVJZCAhPT0gdW5kZWZpbmVkKVxuICAgID8gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpXG4gICAgOiBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG5cbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQgPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgcmV0dXJuIHsgYXBpLCBzdGF0ZSwgcHJvZmlsZSwgbW9kcywgZGlzY292ZXJ5IH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVMT0ZpbGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZD86IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHM/OiBJUHJvcHMpOiBQcm9taXNlPHN0cmluZz4ge1xuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHByb3BzID0gZ2VuUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkKTtcbiAgfVxuXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnZmFpbGVkIHRvIGdlbmVyYXRlIGdhbWUgcHJvcHMnKSk7XG4gIH1cblxuICBjb25zdCB0YXJnZXRQYXRoID0gbG9hZE9yZGVyRmlsZVBhdGgocHJvcHMucHJvZmlsZS5pZCk7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMuc3RhdEFzeW5jKHRhcmdldFBhdGgpXG4gICAgICAuY2F0Y2goeyBjb2RlOiAnRU5PRU5UJyB9LCAoKSA9PiBmcy53cml0ZUZpbGVBc3luYyh0YXJnZXRQYXRoLCBKU09OLnN0cmluZ2lmeShbXSksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSk7XG4gICAgcmV0dXJuIHRhcmdldFBhdGg7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmVmaXhPZmZzZXQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogbnVtYmVyIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gSG93ID9cbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdObyBhY3RpdmUgcHJvZmlsZSBmb3IgN2R0ZCcsIHVuZGVmaW5lZCwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcmV0dXJuIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICc3ZGF5c3RvZGllJywgJ3ByZWZpeE9mZnNldCcsIHByb2ZpbGVJZF0sIDApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmV2ZXJzZVByZWZpeChpbnB1dDogc3RyaW5nKTogbnVtYmVyIHtcbiAgaWYgKGlucHV0Lmxlbmd0aCAhPT0gMyB8fCBpbnB1dC5tYXRjaCgvW0EtWl1bQS1aXVtBLVpdL2cpID09PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IHV0aWwuRGF0YUludmFsaWQoJ0ludmFsaWQgaW5wdXQsIHBsZWFzZSBwcm92aWRlIGEgdmFsaWQgcHJlZml4IChBQUEtWlpaKScpO1xuICB9XG4gIGNvbnN0IHByZWZpeCA9IGlucHV0LnNwbGl0KCcnKTtcblxuICBjb25zdCBvZmZzZXQgPSBwcmVmaXgucmVkdWNlKChwcmV2LCBpdGVyLCBpZHgpID0+IHtcbiAgICBjb25zdCBwb3cgPSAyIC0gaWR4O1xuICAgIGNvbnN0IG11bHQgPSBNYXRoLnBvdygyNiwgcG93KTtcbiAgICBjb25zdCBjaGFyQ29kZSA9IChpdGVyLmNoYXJDb2RlQXQoMCkgJSA2NSk7XG4gICAgcHJldiA9IHByZXYgKyAoY2hhckNvZGUgKiBtdWx0KTtcbiAgICByZXR1cm4gcHJldjtcbiAgfSwgMCk7XG5cbiAgcmV0dXJuIG9mZnNldDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQcmVmaXgoaW5wdXQ6IG51bWJlcikge1xuICBsZXQgcmVzID0gJyc7XG4gIGxldCByZXN0ID0gaW5wdXQ7XG4gIHdoaWxlIChyZXN0ID4gMCkge1xuICAgIHJlcyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoNjUgKyAocmVzdCAlIDI2KSkgKyByZXM7XG4gICAgcmVzdCA9IE1hdGguZmxvb3IocmVzdCAvIDI2KTtcbiAgfVxuICByZXR1cm4gdXRpbC5wYWQoKHJlcyBhcyBhbnkpLCAnQScsIDMpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TW9kTmFtZShtb2RJbmZvUGF0aCk6IFByb21pc2U8YW55PiB7XG4gIGxldCBtb2RJbmZvO1xuICB0cnkge1xuICAgIGNvbnN0IHhtbERhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1vZEluZm9QYXRoKTtcbiAgICBtb2RJbmZvID0gYXdhaXQgUEFSU0VSLnBhcnNlU3RyaW5nUHJvbWlzZSh4bWxEYXRhKTtcbiAgICBjb25zdCBtb2ROYW1lID0gbW9kSW5mbz8uRGlzcGxheU5hbWU/LlswXT8uJD8udmFsdWVcbiAgICAgIHx8IG1vZEluZm8/Lk1vZEluZm8/LlswXT8uTmFtZT8uWzBdPy4kPy52YWx1ZVxuICAgICAgfHwgbW9kSW5mbz8uTmFtZT8uWzBdPy4kPy52YWx1ZTtcbiAgICByZXR1cm4gKG1vZE5hbWUgIT09IHVuZGVmaW5lZClcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKG1vZE5hbWUpXG4gICAgICA6IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdVbmV4cGVjdGVkIG1vZGluZm8ueG1sIGZvcm1hdCcpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdGYWlsZWQgdG8gcGFyc2UgTW9kSW5mby54bWwgZmlsZScpKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TW9kSW5mb0ZpbGVzKGJhc2VQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGxldCBmaWxlUGF0aHM6IHN0cmluZ1tdID0gW107XG4gIHJldHVybiB0dXJib3dhbGsoYmFzZVBhdGgsIGZpbGVzID0+IHtcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihlbnRyeSA9PlxuICAgICAgIWVudHJ5LmlzRGlyZWN0b3J5ICYmIHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpID09PSBNT0RfSU5GTyk7XG4gICAgZmlsZVBhdGhzID0gZmlsZVBhdGhzLmNvbmNhdChmaWx0ZXJlZC5tYXAoZW50cnkgPT4gZW50cnkuZmlsZVBhdGgpKTtcbiAgfSwgeyByZWN1cnNlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfSlcbiAgICAuY2F0Y2goZXJyID0+IFsnRU5PRU5UJywgJ0VOT1RGT1VORCddLmluY2x1ZGVzKGVyci5jb2RlKVxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoKSA6IFByb21pc2UucmVqZWN0KGVycikpXG4gICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGZpbGVQYXRocykpO1xufVxuXG5leHBvcnQgdHlwZSBJQXR0cmlidXRlID0gSVhtbE5vZGU8eyBpZDogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfT5cbmV4cG9ydCBpbnRlcmZhY2UgSVhtbE5vZGU8QXR0cmlidXRlVCBleHRlbmRzIG9iamVjdD4ge1xuICAkOiBBdHRyaWJ1dGVUO1xufVxuZXhwb3J0IGludGVyZmFjZSBJTW9kTmFtZU5vZGUgZXh0ZW5kcyBJWG1sTm9kZTx7IGlkOiAnTmFtZScgfT4ge1xuICBhdHRyaWJ1dGU6IElBdHRyaWJ1dGU7XG59XG5leHBvcnQgaW50ZXJmYWNlIElNb2RJbmZvTm9kZSBleHRlbmRzIElYbWxOb2RlPHsgaWQ6ICdNb2RJbmZvJyB9PiB7XG4gIGNoaWxkcmVuPzogW3sgbm9kZTogSU1vZE5hbWVOb2RlW10gfV07XG4gIGF0dHJpYnV0ZT86IElBdHRyaWJ1dGVbXTtcbn1cbiJdfQ==