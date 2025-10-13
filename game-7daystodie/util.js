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
    return (...args) => bluebird_1.default.resolve(func(...args));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBYUEsc0JBR0M7QUFFRCx3QkFHQztBQXFFRCxrQ0FJQztBQUlELHdCQUVDO0FBRUQsNEJBbUJDO0FBRUQsb0NBbUJDO0FBRUQsMENBVUM7QUFFRCxzQ0FlQztBQUVELGdDQVFDO0FBRUQsZ0NBY0M7QUFFRCwwQ0FVQztBQWpORCx3REFBZ0M7QUFDaEMsZ0RBQXdCO0FBQ3hCLDBEQUFrQztBQUNsQywyQ0FBaUU7QUFDakUsbUNBQWdDO0FBRWhDLHVDQUFtQztBQUVuQyxxQ0FBcUg7QUFHckgsTUFBTSxNQUFNLEdBQUcsSUFBSSxlQUFNLENBQUMsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztBQUVuRCxTQUFzQixLQUFLLENBQUMsR0FBd0I7O1FBQ2xELE9BQU8sSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FDM0MsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztJQUNsRixDQUFDO0NBQUE7QUFFRCxTQUFzQixNQUFNLENBQUMsR0FBd0I7O1FBQ25ELE9BQU8sSUFBSSxPQUFPLENBQU8sQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUUsQ0FDM0MsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQzVFLENBQUM7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LEVBQUUsSUFBSSxFQUFFLENBQUM7YUFDbkMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUM7WUFDdEQsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUMzQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQzVDLENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB0dXJib3dhbGsgZnJvbSAndHVyYm93YWxrJztcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBQYXJzZXIgfSBmcm9tICd4bWwyanMnO1xuXG5pbXBvcnQgeyBzZXRVREYgfSBmcm9tICcuL2FjdGlvbnMnO1xuXG5pbXBvcnQgeyBERUZBVUxUX0xBVU5DSEVSX1NFVFRJTkdTLCBHQU1FX0lELCBNT0RfSU5GTywgbGF1bmNoZXJTZXR0aW5nc0ZpbGVQYXRoLCBsb2FkT3JkZXJGaWxlUGF0aCB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IElQcm9wcyB9IGZyb20gJy4vdHlwZXMnO1xuXG5jb25zdCBQQVJTRVIgPSBuZXcgUGFyc2VyKHsgZXhwbGljaXRSb290OiBmYWxzZSB9KTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHB1cmdlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dm9pZD4ge1xuICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT5cbiAgICBhcGkuZXZlbnRzLmVtaXQoJ3B1cmdlLW1vZHMnLCBmYWxzZSwgKGVycikgPT4gZXJyID8gcmVqZWN0KGVycikgOiByZXNvbHZlKCkpKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRlcGxveShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHZvaWQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlPHZvaWQ+KChyZXNvbHZlLCByZWplY3QpID0+XG4gICAgYXBpLmV2ZW50cy5lbWl0KCdkZXBsb3ktbW9kcycsIChlcnIpID0+IGVyciA/IHJlamVjdChlcnIpIDogcmVzb2x2ZSgpKSk7XG59XG5cbmV4cG9ydCBjb25zdCByZWxhdW5jaEV4dCA9IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHtcbiAgcmV0dXJuIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1Jlc3RhcnQgUmVxdWlyZWQnLCB7XG4gICAgdGV4dDogJ1RoZSBleHRlbnNpb24gcmVxdWlyZXMgYSByZXN0YXJ0IHRvIGNvbXBsZXRlIHRoZSBVREYgc2V0dXAuICdcbiAgICAgICAgKyAnVGhlIGV4dGVuc2lvbiB3aWxsIG5vdyBleGl0IC0gcGxlYXNlIHJlLWFjdGl2YXRlIGl0IHZpYSB0aGUgZ2FtZXMgcGFnZSBvciBkYXNoYm9hcmQuJyxcbiAgfSwgWyB7IGxhYmVsOiAnUmVzdGFydCBFeHRlbnNpb24nIH0gXSlcbiAgLnRoZW4oYXN5bmMgKCkgPT4ge1xuICAgIHRyeSB7XG4gICAgICBhd2FpdCBwdXJnZShhcGkpO1xuICAgICAgY29uc3QgYmF0Y2hlZCA9IFtcbiAgICAgICAgYWN0aW9ucy5zZXREZXBsb3ltZW50TmVjZXNzYXJ5KEdBTUVfSUQsIHRydWUpLFxuICAgICAgICBhY3Rpb25zLnNldE5leHRQcm9maWxlKHVuZGVmaW5lZCksXG4gICAgICBdO1xuICAgICAgdXRpbC5iYXRjaERpc3BhdGNoKGFwaS5zdG9yZSwgYmF0Y2hlZCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gc2V0IHVwIFVERicsIGVycik7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICB9KTtcbn1cblxuZXhwb3J0IGNvbnN0IHNlbGVjdFVERiA9IGFzeW5jIChjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkgPT4ge1xuICBjb25zdCBsYXVuY2hlclNldHRpbmdzID0gbGF1bmNoZXJTZXR0aW5nc0ZpbGVQYXRoKCk7XG4gIGNvbnN0IHJlcyA9IGF3YWl0IGNvbnRleHQuYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnQ2hvb3NlIFVzZXIgRGF0YSBGb2xkZXInLCB7XG4gICAgdGV4dDogJ1RoZSBtb2RkaW5nIHBhdHRlcm4gZm9yIDdEVEQgaXMgY2hhbmdpbmcuIFRoZSBNb2RzIHBhdGggaW5zaWRlIHRoZSBnYW1lIGRpcmVjdG9yeSAnXG4gICAgICArICdpcyBiZWluZyBkZXByZWNhdGVkIGFuZCBtb2RzIGxvY2F0ZWQgaW4gdGhlIG9sZCBwYXRoIHdpbGwgbm8gbG9uZ2VyIHdvcmsgaW4gdGhlIG5lYXIgJ1xuICAgICAgKyAnZnV0dXJlLiBQbGVhc2Ugc2VsZWN0IHlvdXIgVXNlciBEYXRhIEZvbGRlciAoVURGKSAtIFZvcnRleCB3aWxsIGRlcGxveSB0byB0aGlzIG5ldyBsb2NhdGlvbi4gJ1xuICAgICAgKyAnUGxlYXNlIE5FVkVSIHNldCB5b3VyIFVERiBwYXRoIHRvIFZvcnRleFxcJ3Mgc3RhZ2luZyBmb2xkZXIuJyxcbiAgfSxcbiAgICBbXG4gICAgICB7IGxhYmVsOiAnQ2FuY2VsJyB9LFxuICAgICAgeyBsYWJlbDogJ1NlbGVjdCBVREYnIH0sXG4gICAgXSk7XG4gIGlmIChyZXMuYWN0aW9uICE9PSAnU2VsZWN0IFVERicpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdDYW5ub3QgcHJvY2VlZCB3aXRob3V0IFVERicpKTtcbiAgfVxuICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguZGlybmFtZShsYXVuY2hlclNldHRpbmdzKSk7XG4gIGF3YWl0IGVuc3VyZUxPRmlsZShjb250ZXh0KTtcbiAgbGV0IGRpcmVjdG9yeSA9IGF3YWl0IGNvbnRleHQuYXBpLnNlbGVjdERpcih7XG4gICAgdGl0bGU6ICdTZWxlY3QgVXNlciBEYXRhIEZvbGRlcicsXG4gICAgZGVmYXVsdFBhdGg6IHBhdGguam9pbihwYXRoLmRpcm5hbWUobGF1bmNoZXJTZXR0aW5ncykpLFxuICB9KTtcbiAgaWYgKCFkaXJlY3RvcnkpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdDYW5ub3QgcHJvY2VlZCB3aXRob3V0IFVERicpKTtcbiAgfVxuXG4gIGNvbnN0IHNlZ21lbnRzID0gZGlyZWN0b3J5LnNwbGl0KHBhdGguc2VwKTtcbiAgY29uc3QgbG93ZXJlZCA9IHNlZ21lbnRzLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpO1xuICBpZiAobG93ZXJlZFtsb3dlcmVkLmxlbmd0aCAtIDFdID09PSAnbW9kcycpIHtcbiAgICBzZWdtZW50cy5wb3AoKTtcbiAgICBkaXJlY3RvcnkgPSBzZWdtZW50cy5qb2luKHBhdGguc2VwKTtcbiAgfVxuICBpZiAobG93ZXJlZC5pbmNsdWRlcygndm9ydGV4JykpIHtcbiAgICByZXR1cm4gY29udGV4dC5hcGkuc2hvd0RpYWxvZygnaW5mbycsICdJbnZhbGlkIFVzZXIgRGF0YSBGb2xkZXInLCB7XG4gICAgICB0ZXh0OiAnVGhlIFVERiBjYW5ub3QgYmUgc2V0IGluc2lkZSBWb3J0ZXggZGlyZWN0b3JpZXMuIFBsZWFzZSBzZWxlY3QgYSBkaWZmZXJlbnQgZm9sZGVyLicsXG4gICAgfSwgW1xuICAgICAgeyBsYWJlbDogJ1RyeSBBZ2FpbicgfVxuICAgIF0pLnRoZW4oKCkgPT4gc2VsZWN0VURGKGNvbnRleHQpKTtcbiAgfVxuICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXJlY3RvcnksICdNb2RzJykpO1xuICBjb25zdCBsYXVuY2hlciA9IERFRkFVTFRfTEFVTkNIRVJfU0VUVElOR1M7XG4gIGxhdW5jaGVyLkRlZmF1bHRSdW5Db25maWcuQWRkaXRpb25hbFBhcmFtZXRlcnMgPSBgLVVzZXJEYXRhRm9sZGVyPVwiJHtkaXJlY3Rvcnl9XCJgO1xuICBjb25zdCBsYXVuY2hlckRhdGEgPSBKU09OLnN0cmluZ2lmeShsYXVuY2hlciwgbnVsbCwgMik7XG4gIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGxhdW5jaGVyU2V0dGluZ3MsIGxhdW5jaGVyRGF0YSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRVREYoZGlyZWN0b3J5KSk7XG4gIHJldHVybiByZWxhdW5jaEV4dChjb250ZXh0LmFwaSk7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TW9kc1BhdGgoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogc3RyaW5nIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgdWRmID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJzdkYXlzdG9kaWUnLCAndWRmJ10sIHVuZGVmaW5lZCk7XG4gIHJldHVybiB1ZGYgIT09IHVuZGVmaW5lZCA/IHBhdGguam9pbih1ZGYsICdNb2RzJykgOiAnTW9kcyc7XG59XG5cbi8vIFdlIF9zaG91bGRfIGp1c3QgZXhwb3J0IHRoaXMgZnJvbSB2b3J0ZXgtYXBpLCBidXQgSSBndWVzcyBpdCdzIG5vdCB3aXNlIHRvIG1ha2UgaXRcbi8vICBlYXN5IGZvciB1c2VycyBzaW5jZSB3ZSB3YW50IHRvIG1vdmUgYXdheSBmcm9tIGJsdWViaXJkIGluIHRoZSBmdXR1cmUgP1xuZXhwb3J0IGZ1bmN0aW9uIHRvQmx1ZTxUPihmdW5jOiAoLi4uYXJnczogYW55W10pID0+IFByb21pc2U8VD4pOiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkPFQ+IHtcbiAgcmV0dXJuICguLi5hcmdzOiBhbnlbXSkgPT4gQmx1ZWJpcmQucmVzb2x2ZShmdW5jKC4uLmFyZ3MpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdlblByb3BzKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LCBwcm9maWxlSWQ/OiBzdHJpbmcpOiBJUHJvcHMge1xuICBjb25zdCBhcGkgPSBjb250ZXh0LmFwaTtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUgPSAocHJvZmlsZUlkICE9PSB1bmRlZmluZWQpXG4gICAgPyBzZWxlY3RvcnMucHJvZmlsZUJ5SWQoc3RhdGUsIHByb2ZpbGVJZClcbiAgICA6IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcblxuICBpZiAocHJvZmlsZT8uZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IGRpc2NvdmVyeTogdHlwZXMuSURpc2NvdmVyeVJlc3VsdCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSxcbiAgICBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIGNvbnN0IG1vZHMgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KTtcbiAgcmV0dXJuIHsgYXBpLCBzdGF0ZSwgcHJvZmlsZSwgbW9kcywgZGlzY292ZXJ5IH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBlbnN1cmVMT0ZpbGUoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgcHJvZmlsZUlkPzogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgIHByb3BzPzogSVByb3BzKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcbiAgICBwcm9wcyA9IGdlblByb3BzKGNvbnRleHQsIHByb2ZpbGVJZCk7XG4gIH1cblxuICBpZiAocHJvcHMgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ2ZhaWxlZCB0byBnZW5lcmF0ZSBnYW1lIHByb3BzJykpO1xuICB9XG5cbiAgY29uc3QgdGFyZ2V0UGF0aCA9IGxvYWRPcmRlckZpbGVQYXRoKHByb3BzLnByb2ZpbGUuaWQpO1xuICB0cnkge1xuICAgIGF3YWl0IGZzLnN0YXRBc3luYyh0YXJnZXRQYXRoKVxuICAgICAgLmNhdGNoKHsgY29kZTogJ0VOT0VOVCcgfSwgKCkgPT4gZnMud3JpdGVGaWxlQXN5bmModGFyZ2V0UGF0aCwgSlNPTi5zdHJpbmdpZnkoW10pLCB7IGVuY29kaW5nOiAndXRmOCcgfSkpO1xuICAgIHJldHVybiB0YXJnZXRQYXRoO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJlZml4T2Zmc2V0KGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IG51bWJlciB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XG4gIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIEhvdyA/XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignTm8gYWN0aXZlIHByb2ZpbGUgZm9yIDdkdGQnLCB1bmRlZmluZWQsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHJldHVybiB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnN2RheXN0b2RpZScsICdwcmVmaXhPZmZzZXQnLCBwcm9maWxlSWRdLCAwKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJldmVyc2VQcmVmaXgoaW5wdXQ6IHN0cmluZyk6IG51bWJlciB7XG4gIGlmIChpbnB1dC5sZW5ndGggIT09IDMgfHwgaW5wdXQubWF0Y2goL1tBLVpdW0EtWl1bQS1aXS9nKSA9PT0gbnVsbCkge1xuICAgIHRocm93IG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdJbnZhbGlkIGlucHV0LCBwbGVhc2UgcHJvdmlkZSBhIHZhbGlkIHByZWZpeCAoQUFBLVpaWiknKTtcbiAgfVxuICBjb25zdCBwcmVmaXggPSBpbnB1dC5zcGxpdCgnJyk7XG5cbiAgY29uc3Qgb2Zmc2V0ID0gcHJlZml4LnJlZHVjZSgocHJldiwgaXRlciwgaWR4KSA9PiB7XG4gICAgY29uc3QgcG93ID0gMiAtIGlkeDtcbiAgICBjb25zdCBtdWx0ID0gTWF0aC5wb3coMjYsIHBvdyk7XG4gICAgY29uc3QgY2hhckNvZGUgPSAoaXRlci5jaGFyQ29kZUF0KDApICUgNjUpO1xuICAgIHByZXYgPSBwcmV2ICsgKGNoYXJDb2RlICogbXVsdCk7XG4gICAgcmV0dXJuIHByZXY7XG4gIH0sIDApO1xuXG4gIHJldHVybiBvZmZzZXQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYWtlUHJlZml4KGlucHV0OiBudW1iZXIpIHtcbiAgbGV0IHJlcyA9ICcnO1xuICBsZXQgcmVzdCA9IGlucHV0O1xuICB3aGlsZSAocmVzdCA+IDApIHtcbiAgICByZXMgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDY1ICsgKHJlc3QgJSAyNikpICsgcmVzO1xuICAgIHJlc3QgPSBNYXRoLmZsb29yKHJlc3QgLyAyNik7XG4gIH1cbiAgcmV0dXJuIHV0aWwucGFkKChyZXMgYXMgYW55KSwgJ0EnLCAzKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1vZE5hbWUobW9kSW5mb1BhdGgpOiBQcm9taXNlPGFueT4ge1xuICBsZXQgbW9kSW5mbztcbiAgdHJ5IHtcbiAgICBjb25zdCB4bWxEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhtb2RJbmZvUGF0aCk7XG4gICAgbW9kSW5mbyA9IGF3YWl0IFBBUlNFUi5wYXJzZVN0cmluZ1Byb21pc2UoeG1sRGF0YSk7XG4gICAgY29uc3QgbW9kTmFtZSA9IG1vZEluZm8/LkRpc3BsYXlOYW1lPy5bMF0/LiQ/LnZhbHVlXG4gICAgICB8fCBtb2RJbmZvPy5Nb2RJbmZvPy5bMF0/Lk5hbWU/LlswXT8uJD8udmFsdWVcbiAgICAgIHx8IG1vZEluZm8/Lk5hbWU/LlswXT8uJD8udmFsdWU7XG4gICAgcmV0dXJuIChtb2ROYW1lICE9PSB1bmRlZmluZWQpXG4gICAgICA/IFByb21pc2UucmVzb2x2ZShtb2ROYW1lKVxuICAgICAgOiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnVW5leHBlY3RlZCBtb2RpbmZvLnhtbCBmb3JtYXQnKSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnRmFpbGVkIHRvIHBhcnNlIE1vZEluZm8ueG1sIGZpbGUnKSk7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldE1vZEluZm9GaWxlcyhiYXNlUGF0aDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBsZXQgZmlsZVBhdGhzOiBzdHJpbmdbXSA9IFtdO1xuICByZXR1cm4gdHVyYm93YWxrKGJhc2VQYXRoLCBmaWxlcyA9PiB7XG4gICAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZW50cnkgPT5cbiAgICAgICFlbnRyeS5pc0RpcmVjdG9yeSAmJiBwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSA9PT0gTU9EX0lORk8pO1xuICAgIGZpbGVQYXRocyA9IGZpbGVQYXRocy5jb25jYXQoZmlsdGVyZWQubWFwKGVudHJ5ID0+IGVudHJ5LmZpbGVQYXRoKSk7XG4gIH0sIHsgcmVjdXJzZTogdHJ1ZSwgc2tpcExpbmtzOiB0cnVlIH0pXG4gICAgLmNhdGNoKGVyciA9PiBbJ0VOT0VOVCcsICdFTk9URk9VTkQnXS5pbmNsdWRlcyhlcnIuY29kZSlcbiAgICAgID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBQcm9taXNlLnJlamVjdChlcnIpKVxuICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShmaWxlUGF0aHMpKTtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBJQXR0cmlidXRlIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcgfT4geyB9XG5leHBvcnQgaW50ZXJmYWNlIElYbWxOb2RlPEF0dHJpYnV0ZVQgZXh0ZW5kcyBvYmplY3Q+IHtcbiAgJDogQXR0cmlidXRlVDtcbn1cbmV4cG9ydCBpbnRlcmZhY2UgSU1vZE5hbWVOb2RlIGV4dGVuZHMgSVhtbE5vZGU8eyBpZDogJ05hbWUnIH0+IHtcbiAgYXR0cmlidXRlOiBJQXR0cmlidXRlO1xufVxuZXhwb3J0IGludGVyZmFjZSBJTW9kSW5mb05vZGUgZXh0ZW5kcyBJWG1sTm9kZTx7IGlkOiAnTW9kSW5mbycgfT4ge1xuICBjaGlsZHJlbj86IFt7IG5vZGU6IElNb2ROYW1lTm9kZVtdIH1dO1xuICBhdHRyaWJ1dGU/OiBJQXR0cmlidXRlW107XG59XG4iXX0=