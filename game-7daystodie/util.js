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
exports.selectUDF = exports.relaunchExt = void 0;
exports.purge = purge;
exports.deploy = deploy;
exports.getModsPath = getModsPath;
exports.toBlue = toBlue;
exports.genProps = genProps;
exports.ensureLOFile = ensureLOFile;
exports.getPrefixOffset = getPrefixOffset;
exports.reversePrefix = reversePrefix;
exports.makePrefix = makePrefix;
exports.getModName = getModName;
exports.getModInfoFiles = getModInfoFiles;
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
function deploy(api) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => api.events.emit('deploy-mods', (err) => err ? reject(err) : resolve()));
    });
}
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
function toBlue(func) {
    return (...args) => Promise.resolve(func(...args));
}
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
function makePrefix(input) {
    let res = '';
    let rest = input;
    while (rest > 0) {
        res = String.fromCharCode(65 + (rest % 26)) + res;
        rest = Math.floor(rest / 26);
    }
    return vortex_api_1.util.pad(res, 'A', 3);
}
function getModName(modInfoPath) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBYUEsc0JBR0M7QUFFRCx3QkFHQztBQXFFRCxrQ0FJQztBQUlELHdCQUVDO0FBRUQsNEJBbUJDO0FBRUQsb0NBbUJDO0FBRUQsMENBVUM7QUFFRCxzQ0FlQztBQUVELGdDQVFDO0FBRUQsZ0NBY0M7QUFFRCwwQ0FVQztBQWhORCxnREFBd0I7QUFDeEIsMERBQWtDO0FBQ2xDLDJDQUFpRTtBQUNqRSxtQ0FBZ0M7QUFFaEMsdUNBQW1DO0FBRW5DLHFDQUFxSDtBQUdySCxNQUFNLE1BQU0sR0FBRyxJQUFJLGVBQU0sQ0FBQyxFQUFFLFlBQVksRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0FBRW5ELFNBQXNCLEtBQUssQ0FBQyxHQUF3Qjs7UUFDbEQsT0FBTyxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUMzQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ2xGLENBQUM7Q0FBQTtBQUVELFNBQXNCLE1BQU0sQ0FBQyxHQUF3Qjs7UUFDbkQsT0FBTyxJQUFJLE9BQU8sQ0FBTyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRSxDQUMzQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7SUFDNUUsQ0FBQztDQUFBO0FBRU0sTUFB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QUUsQ0FBQzthQUNuQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQztZQUN0RCxDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQzNDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVE9ETzogUmVtb3ZlIEJsdWViaXJkIGltcG9ydCAtIHVzaW5nIG5hdGl2ZSBQcm9taXNlO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgUGFyc2VyIH0gZnJvbSAneG1sMmpzJztcblxuaW1wb3J0IHsgc2V0VURGIH0gZnJvbSAnLi9hY3Rpb25zJztcblxuaW1wb3J0IHsgREVGQVVMVF9MQVVOQ0hFUl9TRVRUSU5HUywgR0FNRV9JRCwgTU9EX0lORk8sIGxhdW5jaGVyU2V0dGluZ3NGaWxlUGF0aCwgbG9hZE9yZGVyRmlsZVBhdGggfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBJUHJvcHMgfSBmcm9tICcuL3R5cGVzJztcblxuY29uc3QgUEFSU0VSID0gbmV3IFBhcnNlcih7IGV4cGxpY2l0Um9vdDogZmFsc2UgfSk7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwdXJnZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgYXBpLmV2ZW50cy5lbWl0KCdwdXJnZS1tb2RzJywgZmFsc2UsIChlcnIpID0+IGVyciA/IHJlamVjdChlcnIpIDogcmVzb2x2ZSgpKSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZXBsb3koYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PlxuICAgIGFwaS5ldmVudHMuZW1pdCgnZGVwbG95LW1vZHMnLCAoZXJyKSA9PiBlcnIgPyByZWplY3QoZXJyKSA6IHJlc29sdmUoKSkpO1xufVxuXG5leHBvcnQgY29uc3QgcmVsYXVuY2hFeHQgPSAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiB7XG4gIHJldHVybiBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdSZXN0YXJ0IFJlcXVpcmVkJywge1xuICAgIHRleHQ6ICdUaGUgZXh0ZW5zaW9uIHJlcXVpcmVzIGEgcmVzdGFydCB0byBjb21wbGV0ZSB0aGUgVURGIHNldHVwLiAnXG4gICAgICAgICsgJ1RoZSBleHRlbnNpb24gd2lsbCBub3cgZXhpdCAtIHBsZWFzZSByZS1hY3RpdmF0ZSBpdCB2aWEgdGhlIGdhbWVzIHBhZ2Ugb3IgZGFzaGJvYXJkLicsXG4gIH0sIFsgeyBsYWJlbDogJ1Jlc3RhcnQgRXh0ZW5zaW9uJyB9IF0pXG4gICAgLnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcHVyZ2UoYXBpKTtcbiAgICAgICAgY29uc3QgYmF0Y2hlZCA9IFtcbiAgICAgICAgICBhY3Rpb25zLnNldERlcGxveW1lbnROZWNlc3NhcnkoR0FNRV9JRCwgdHJ1ZSksXG4gICAgICAgICAgYWN0aW9ucy5zZXROZXh0UHJvZmlsZSh1bmRlZmluZWQpLFxuICAgICAgICBdO1xuICAgICAgICB1dGlsLmJhdGNoRGlzcGF0Y2goYXBpLnN0b3JlLCBiYXRjaGVkKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gc2V0IHVwIFVERicsIGVycik7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cbiAgICB9KTtcbn1cblxuZXhwb3J0IGNvbnN0IHNlbGVjdFVERiA9IGFzeW5jIChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkgPT4ge1xuICBjb25zdCBsYXVuY2hlclNldHRpbmdzID0gbGF1bmNoZXJTZXR0aW5nc0ZpbGVQYXRoKCk7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnQ2hvb3NlIFVzZXIgRGF0YSBGb2xkZXInLCB7XG4gICAgdGV4dDogJ1RoZSBtb2RkaW5nIHBhdHRlcm4gZm9yIDdEVEQgaXMgY2hhbmdpbmcuIFRoZSBNb2RzIHBhdGggaW5zaWRlIHRoZSBnYW1lIGRpcmVjdG9yeSAnXG4gICAgICArICdpcyBiZWluZyBkZXByZWNhdGVkIGFuZCBtb2RzIGxvY2F0ZWQgaW4gdGhlIG9sZCBwYXRoIHdpbGwgbm8gbG9uZ2VyIHdvcmsgaW4gdGhlIG5lYXIgJ1xuICAgICAgKyAnZnV0dXJlLiBQbGVhc2Ugc2VsZWN0IHlvdXIgVXNlciBEYXRhIEZvbGRlciAoVURGKSAtIFZvcnRleCB3aWxsIGRlcGxveSB0byB0aGlzIG5ldyBsb2NhdGlvbi4gJ1xuICAgICAgKyAnUGxlYXNlIE5FVkVSIHNldCB5b3VyIFVERiBwYXRoIHRvIFZvcnRleFxcJ3Mgc3RhZ2luZyBmb2xkZXIuJyxcbiAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7IGxhYmVsOiAnQ2FuY2VsJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgeyBsYWJlbDogJ1NlbGVjdCBVREYnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXSk7XG4gIGlmIChyZXMuYWN0aW9uICE9PSAnU2VsZWN0IFVERicpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdDYW5ub3QgcHJvY2VlZCB3aXRob3V0IFVERicpKTtcbiAgfVxuICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShsYXVuY2hlclNldHRpbmdzKSk7XG4gIGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0KTtcbiAgbGV0IGRpcmVjdG9yeSA9IGF3YWl0IGNvbnRleHQuYXBpLnNlbGVjdERpcih7XG4gICAgdGl0bGU6ICdTZWxlY3QgVXNlciBEYXRhIEZvbGRlcicsXG4gICAgZGVmYXVsdFBhdGg6IHBhdGguam9pbihwYXRoLmRpcm5hbWUobGF1bmNoZXJTZXR0aW5ncykpLFxuICB9KTtcbiAgaWYgKCFkaXJlY3RvcnkpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdDYW5ub3QgcHJvY2VlZCB3aXRob3V0IFVERicpKTtcbiAgfVxuXG4gIGNvbnN0IHNlZ21lbnRzID0gZGlyZWN0b3J5LnNwbGl0KHBhdGguc2VwKTtcbiAgY29uc3QgbG93ZXJlZCA9IHNlZ21lbnRzLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpO1xuICBpZiAobG93ZXJlZFtsb3dlcmVkLmxlbmd0aCAtIDFdID09PSAnbW9kcycpIHtcbiAgICBzZWdtZW50cy5wb3AoKTtcbiAgICBkaXJlY3RvcnkgPSBzZWdtZW50cy5qb2luKHBhdGguc2VwKTtcbiAgfVxuICBpZiAobG93ZXJlZC5pbmNsdWRlcygndm9ydGV4JykpIHtcbiAgICByZXR1cm4gY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdJbnZhbGlkIFVzZXIgRGF0YSBGb2xkZXInLCB7XG4gICAgICB0ZXh0OiAnVGhlIFVERiBjYW5ub3QgYmUgc2V0IGluc2lkZSBWb3J0ZXggZGlyZWN0b3JpZXMuIFBsZWFzZSBzZWxlY3QgYSBkaWZmZXJlbnQgZm9sZGVyLicsXG4gICAgfSwgW1xuICAgICAgeyBsYWJlbDogJ1RyeSBBZ2FpbicgfVxuICAgIF0pLnRoZW4oKCkgPT4gc2VsZWN0VURGKGNvbnRleHQpKTtcbiAgfVxuICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXJlY3RvcnksICdNb2RzJykpO1xuICBjb25zdCBsYXVuY2hlciA9IERFRkFVTFRfTEFVTkNIRVJfU0VUVElOR1M7XG4gIGxhdW5jaGVyLkRlZmF1bHRSdW5Db25maWcuQWRkaXRpb25hbFBhcmFtZXRlcnMgPSBgLVVzZXJEYXRhRm9sZGVyPVwiJHtkaXJlY3Rvcnl9XCJgO1xuICBjb25zdCBsYXVuY2hlckRhdGEgPSBKU09OLnN0cmluZ2lmeShsYXVuY2hlciwgbnVsbCwgMik7XG4gIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGxhdW5jaGVyU2V0dGluZ3MsIGxhdW5jaGVyRGF0YSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRVREYoZGlyZWN0b3J5KSk7XG4gIHJldHVybiByZWxhdW5jaEV4dChjb250ZXh0LmFwaSk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kc1BhdGgoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogc3RyaW5nIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgdWRmID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJzdkYXlzdG9kaWUnLCAndWRmJ10sIHVuZGVmaW5lZCk7XG4gIHJldHVybiB1ZGYgIT09IHVuZGVmaW5lZCA/IHBhdGguam9pbih1ZGYsICdNb2RzJykgOiAnTW9kcyc7XG59XG5cbi8vIFdlIF9zaG91bGRfIGp1c3QgZXhwb3J0IHRoaXMgZnJvbSB2b3J0ZXgtYXBpLCBidXQgSSBndWVzcyBpdCdzIG5vdCB3aXNlIHRvIG1ha2UgaXRcbi8vICBlYXN5IGZvciB1c2VycyBzaW5jZSB3ZSB3YW50IHRvIG1vdmUgYXdheSBmcm9tIGJsdWViaXJkIGluIHRoZSBmdXR1cmUgP1xuZXhwb3J0IGZ1bmN0aW9uIHRvQmx1ZTxUPihmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4pOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4ge1xuICByZXR1cm4gKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlLnJlc29sdmUoZnVuYyguLi5hcmdzKSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5Qcm9wcyhjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCwgcHJvZmlsZUlkPzogc3RyaW5nKTogSVByb3BzIHtcbiAgY29uc3QgYXBpID0gY29udGV4dC5hcGk7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gKHByb2ZpbGVJZCAhPT0gdW5kZWZpbmVkKVxuICAgID8gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpXG4gICAgOiBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG5cbiAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cblxuICBjb25zdCBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQgPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgcmV0dXJuIHsgYXBpLCBzdGF0ZSwgcHJvZmlsZSwgbW9kcywgZGlzY292ZXJ5IH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVMT0ZpbGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2ZpbGVJZD86IHN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHM/OiBJUHJvcHMpOiBQcm9taXNlPHN0cmluZz4ge1xuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHByb3BzID0gZ2VuUHJvcHMoY29udGV4dCwgcHJvZmlsZUlkKTtcbiAgfVxuXG4gIGlmIChwcm9wcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnZmFpbGVkIHRvIGdlbmVyYXRlIGdhbWUgcHJvcHMnKSk7XG4gIH1cblxuICBjb25zdCB0YXJnZXRQYXRoID0gbG9hZE9yZGVyRmlsZVBhdGgocHJvcHMucHJvZmlsZS5pZCk7XG4gIHRyeSB7XG4gICAgYXdhaXQgZnMuc3RhdEFzeW5jKHRhcmdldFBhdGgpXG4gICAgICAuY2F0Y2goeyBjb2RlOiAnRU5PRU5UJyB9LCAoKSA9PiBmcy53cml0ZUZpbGVBc3luYyh0YXJnZXRQYXRoLCBKU09OLnN0cmluZ2lmeShbXSksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KSk7XG4gICAgcmV0dXJuIHRhcmdldFBhdGg7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmVmaXhPZmZzZXQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogbnVtYmVyIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcbiAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gSG93ID9cbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdObyBhY3RpdmUgcHJvZmlsZSBmb3IgN2R0ZCcsIHVuZGVmaW5lZCwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcmV0dXJuIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICc3ZGF5c3RvZGllJywgJ3ByZWZpeE9mZnNldCcsIHByb2ZpbGVJZF0sIDApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmV2ZXJzZVByZWZpeChpbnB1dDogc3RyaW5nKTogbnVtYmVyIHtcbiAgaWYgKGlucHV0Lmxlbmd0aCAhPT0gMyB8fCBpbnB1dC5tYXRjaCgvW0EtWl1bQS1aXVtBLVpdL2cpID09PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IHV0aWwuRGF0YUludmFsaWQoJ0ludmFsaWQgaW5wdXQsIHBsZWFzZSBwcm92aWRlIGEgdmFsaWQgcHJlZml4IChBQUEtWlpaKScpO1xuICB9XG4gIGNvbnN0IHByZWZpeCA9IGlucHV0LnNwbGl0KCcnKTtcblxuICBjb25zdCBvZmZzZXQgPSBwcmVmaXgucmVkdWNlKChwcmV2LCBpdGVyLCBpZHgpID0+IHtcbiAgICBjb25zdCBwb3cgPSAyIC0gaWR4O1xuICAgIGNvbnN0IG11bHQgPSBNYXRoLnBvdygyNiwgcG93KTtcbiAgICBjb25zdCBjaGFyQ29kZSA9IChpdGVyLmNoYXJDb2RlQXQoMCkgJSA2NSk7XG4gICAgcHJldiA9IHByZXYgKyAoY2hhckNvZGUgKiBtdWx0KTtcbiAgICByZXR1cm4gcHJldjtcbiAgfSwgMCk7XG5cbiAgcmV0dXJuIG9mZnNldDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1ha2VQcmVmaXgoaW5wdXQ6IG51bWJlcikge1xuICBsZXQgcmVzID0gJyc7XG4gIGxldCByZXN0ID0gaW5wdXQ7XG4gIHdoaWxlIChyZXN0ID4gMCkge1xuICAgIHJlcyA9IFN0cmluZy5mcm9tQ2hhckNvZGUoNjUgKyAocmVzdCAlIDI2KSkgKyByZXM7XG4gICAgcmVzdCA9IE1hdGguZmxvb3IocmVzdCAvIDI2KTtcbiAgfVxuICByZXR1cm4gdXRpbC5wYWQoKHJlcyBhcyBhbnkpLCAnQScsIDMpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TW9kTmFtZShtb2RJbmZvUGF0aCk6IFByb21pc2U8YW55PiB7XG4gIGxldCBtb2RJbmZvO1xuICB0cnkge1xuICAgIGNvbnN0IHhtbERhdGEgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1vZEluZm9QYXRoKTtcbiAgICBtb2RJbmZvID0gYXdhaXQgUEFSU0VSLnBhcnNlU3RyaW5nUHJvbWlzZSh4bWxEYXRhKTtcbiAgICBjb25zdCBtb2ROYW1lID0gbW9kSW5mbz8uRGlzcGxheU5hbWU/LlswXT8uJD8udmFsdWVcbiAgICAgIHx8IG1vZEluZm8/Lk1vZEluZm8/LlswXT8uTmFtZT8uWzBdPy4kPy52YWx1ZVxuICAgICAgfHwgbW9kSW5mbz8uTmFtZT8uWzBdPy4kPy52YWx1ZTtcbiAgICByZXR1cm4gKG1vZE5hbWUgIT09IHVuZGVmaW5lZClcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKG1vZE5hbWUpXG4gICAgICA6IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdVbmV4cGVjdGVkIG1vZGluZm8ueG1sIGZvcm1hdCcpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdGYWlsZWQgdG8gcGFyc2UgTW9kSW5mby54bWwgZmlsZScpKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TW9kSW5mb0ZpbGVzKGJhc2VQYXRoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gIGxldCBmaWxlUGF0aHM6IHN0cmluZ1tdID0gW107XG4gIHJldHVybiB0dXJib3dhbGsoYmFzZVBhdGgsIGZpbGVzID0+IHtcbiAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihlbnRyeSA9PlxuICAgICAgIWVudHJ5LmlzRGlyZWN0b3J5ICYmIHBhdGguYmFzZW5hbWUoZW50cnkuZmlsZVBhdGgpID09PSBNT0RfSU5GTyk7XG4gICAgZmlsZVBhdGhzID0gZmlsZVBhdGhzLmNvbmNhdChmaWx0ZXJlZC5tYXAoZW50cnkgPT4gZW50cnkuZmlsZVBhdGgpKTtcbiAgfSwgeyByZWN1cnNlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfSlcbiAgICAuY2F0Y2goZXJyID0+IFsnRU5PRU5UJywgJ0VOT1RGT1VORCddLmluY2x1ZGVzKGVyci5jb2RlKVxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoKSA6IFByb21pc2UucmVqZWN0KGVycikpXG4gICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGZpbGVQYXRocykpO1xufVxuXG5leHBvcnQgdHlwZSBJQXR0cmlidXRlID0gSVhtbE5vZGU8eyBpZDogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfT5cbmV4cG9ydCBpbnRlcmZhY2UgSVhtbE5vZGU8QXR0cmlidXRlVCBleHRlbmRzIG9iamVjdD4ge1xuICAkOiBBdHRyaWJ1dGVUO1xufVxuZXhwb3J0IGludGVyZmFjZSBJTW9kTmFtZU5vZGUgZXh0ZW5kcyBJWG1sTm9kZTx7IGlkOiAnTmFtZScgfT4ge1xuICBhdHRyaWJ1dGU6IElBdHRyaWJ1dGU7XG59XG5leHBvcnQgaW50ZXJmYWNlIElNb2RJbmZvTm9kZSBleHRlbmRzIElYbWxOb2RlPHsgaWQ6ICdNb2RJbmZvJyB9PiB7XG4gIGNoaWxkcmVuPzogW3sgbm9kZTogSU1vZE5hbWVOb2RlW10gfV07XG4gIGF0dHJpYnV0ZT86IElBdHRyaWJ1dGVbXTtcbn1cbiJdfQ==