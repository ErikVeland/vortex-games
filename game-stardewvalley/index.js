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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const bluebird_1 = __importDefault(require("bluebird"));
const react_1 = __importDefault(require("react"));
const semver = __importStar(require("semver"));
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const platform_1 = require("../../../src/util/platform");
const winapi = (0, platform_1.isWindows)() ? require('winapi-bindings') : undefined;
const CompatibilityIcon_1 = __importDefault(require("./CompatibilityIcon"));
const constants_1 = require("./constants");
const DependencyManager_1 = __importDefault(require("./DependencyManager"));
const reducers_1 = __importDefault(require("./reducers"));
const smapiProxy_1 = __importDefault(require("./smapiProxy"));
const tests_1 = require("./tests");
const types_1 = require("./types");
const util_1 = require("./util");
const Settings_1 = __importDefault(require("./Settings"));
const actions_1 = require("./actions");
const configMod_1 = require("./configMod");
const path = require('path'), { clipboard } = require('electron'), rjson = require('relaxed-json'), { SevenZip } = vortex_api_1.util, { deploySMAPI, downloadSMAPI, findSMAPIMod } = require('./SMAPI'), { GAME_ID, _SMAPI_BUNDLED_MODS, getBundledMods, MOD_TYPE_CONFIG } = require('./common');
const MANIFEST_FILE = 'manifest.json';
const PTRN_CONTENT = path.sep + 'Content' + path.sep;
const SMAPI_EXE = 'StardewModdingAPI.exe';
const SMAPI_DLL = 'SMAPI.Installer.dll';
const SMAPI_DATA = ['windows-install.dat', 'install.dat'];
function toBlue(func) {
    return (...args) => bluebird_1.default.resolve(func(...args));
}
class StardewValley {
    constructor(context) {
        this.id = GAME_ID;
        this.name = 'Stardew Valley';
        this.logo = 'gameart.jpg';
        this.environment = {
            SteamAPPId: '413150',
        };
        this.details = {
            steamAppId: 413150
        };
        this.supportedTools = [
            {
                id: 'smapi',
                name: 'SMAPI',
                logo: 'smapi.png',
                executable: () => SMAPI_EXE,
                requiredFiles: [SMAPI_EXE],
                shell: true,
                exclusive: true,
                relative: true,
                defaultPrimary: true,
            }
        ];
        this.mergeMods = true;
        this.requiresCleanup = true;
        this.shell = process.platform === 'win32';
        this.queryPath = toBlue(() => __awaiter(this, void 0, void 0, function* () {
            const game = yield vortex_api_1.util.GameStoreHelper.findByAppId(['413150', '1453375253', 'ConcernedApe.StardewValleyPC']);
            if (game)
                return game.gamePath;
            for (const defaultPath of this.defaultPaths) {
                if (yield this.getPathExistsAsync(defaultPath))
                    return defaultPath;
            }
        }));
        this.setup = toBlue((discovery) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield vortex_api_1.fs.ensureDirWritableAsync(path.join(discovery.path, (0, util_1.defaultModsRelPath)()));
            }
            catch (err) {
                return Promise.reject(err);
            }
            const smapiPath = path.join(discovery.path, SMAPI_EXE);
            const smapiFound = yield this.getPathExistsAsync(smapiPath);
            if (!smapiFound) {
                this.recommendSmapi();
            }
            const state = this.context.api.getState();
        }));
        this.context = context;
        this.requiredFiles = process.platform == 'win32'
            ? ['Stardew Valley.exe']
            : ['StardewValley', 'StardewValley.exe'];
        this.defaultPaths = [
            process.env.HOME + '/GOG Games/Stardew Valley/game',
            process.env.HOME + '/.local/share/Steam/steamapps/common/Stardew Valley',
            '/Applications/Stardew Valley.app/Contents/MacOS',
            process.env.HOME + '/Library/Application Support/Steam/steamapps/common/Stardew Valley/Contents/MacOS',
            'C:\\Program Files (x86)\\GalaxyClient\\Games\\Stardew Valley',
            'C:\\Program Files (x86)\\GOG Galaxy\\Games\\Stardew Valley',
            'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stardew Valley'
        ];
    }
    executable() {
        return process.platform == 'win32'
            ? 'Stardew Valley.exe'
            : 'StardewValley';
    }
    queryModPath() {
        return (0, util_1.defaultModsRelPath)();
    }
    recommendSmapi() {
        const smapiMod = findSMAPIMod(this.context.api);
        const title = smapiMod ? 'SMAPI is not deployed' : 'SMAPI is not installed';
        const actionTitle = smapiMod ? 'Deploy' : 'Get SMAPI';
        const action = () => (smapiMod
            ? deploySMAPI(this.context.api)
            : downloadSMAPI(this.context.api))
            .then(() => this.context.api.dismissNotification('smapi-missing'));
        this.context.api.sendNotification({
            id: 'smapi-missing',
            type: 'warning',
            title,
            message: 'SMAPI is required to mod Stardew Valley.',
            actions: [
                {
                    title: actionTitle,
                    action,
                },
            ]
        });
    }
    getPathExistsAsync(path) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield vortex_api_1.fs.statAsync(path);
                return true;
            }
            catch (err) {
                return false;
            }
        });
    }
    readRegistryKeyAsync(hive, key, name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const instPath = ((0, platform_1.isWindows)() && winapi) ? winapi.RegGetValue(hive, key, name) : null;
                if (!instPath) {
                    throw new Error('empty registry key');
                }
                return Promise.resolve(instPath.value);
            }
            catch (err) {
                return Promise.resolve(undefined);
            }
        });
    }
}
function testRootFolder(files, gameId) {
    const filtered = files.filter(file => file.endsWith(path.sep))
        .map(file => path.join('fakeDir', file));
    const contentDir = filtered.find(file => file.endsWith(PTRN_CONTENT));
    const supported = ((gameId === GAME_ID)
        && (contentDir !== undefined));
    return bluebird_1.default.resolve({ supported, requiredFiles: [] });
}
function installRootFolder(files, destinationPath) {
    const contentFile = files.find(file => path.join('fakeDir', file).endsWith(PTRN_CONTENT));
    const idx = contentFile.indexOf(PTRN_CONTENT) + 1;
    const rootDir = path.basename(contentFile.substring(0, idx));
    const filtered = files.filter(file => !file.endsWith(path.sep)
        && (file.indexOf(rootDir) !== -1)
        && (path.extname(file) !== '.txt'));
    const instructions = filtered.map(file => {
        return {
            type: 'copy',
            source: file,
            destination: file.substr(idx),
        };
    });
    return bluebird_1.default.resolve({ instructions });
}
function isValidManifest(filePath) {
    const segments = filePath.toLowerCase().split(path.sep);
    const isManifestFile = segments[segments.length - 1] === MANIFEST_FILE;
    const isLocale = segments.includes('locale');
    return isManifestFile && !isLocale;
}
function testSupported(files, gameId) {
    const supported = (gameId === GAME_ID)
        && (files.find(isValidManifest) !== undefined)
        && (files.find(file => {
            const testFile = path.join('fakeDir', file);
            return (testFile.endsWith(PTRN_CONTENT));
        }) === undefined);
    return bluebird_1.default.resolve({ supported, requiredFiles: [] });
}
function install(api, dependencyManager, files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const manifestFiles = files.filter(isValidManifest);
        let parseError;
        yield dependencyManager.scanManifests(true);
        let mods = yield Promise.all(manifestFiles.map((manifestFile) => __awaiter(this, void 0, void 0, function* () {
            const rootFolder = path.dirname(manifestFile);
            const rootSegments = rootFolder.toLowerCase().split(path.sep);
            const manifestIndex = manifestFile.toLowerCase().indexOf(MANIFEST_FILE);
            const filterFunc = (file) => {
                const isFile = !file.endsWith(path.sep) && path.extname(path.basename(file)) !== '';
                const fileSegments = file.toLowerCase().split(path.sep);
                const isInRootFolder = (rootSegments.length > 0)
                    ? (fileSegments === null || fileSegments === void 0 ? void 0 : fileSegments[rootSegments.length - 1]) === rootSegments[rootSegments.length - 1]
                    : true;
                return isInRootFolder && isFile;
            };
            try {
                const manifest = yield (0, util_1.parseManifest)(path.join(destinationPath, manifestFile));
                const modFiles = files.filter(filterFunc);
                return {
                    manifest,
                    rootFolder,
                    manifestIndex,
                    modFiles,
                };
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'Failed to parse manifest', { manifestFile, error: err.message });
                parseError = err;
                return undefined;
            }
        })));
        mods = mods.filter(x => x !== undefined);
        if (mods.length === 0) {
            api.showErrorNotification('The mod manifest is invalid and can\'t be read. You can try to install the mod anyway via right-click -> "Unpack (as-is)"', parseError, {
                allowReport: false,
            });
        }
        return bluebird_1.default.map(mods, mod => {
            var _a;
            const modName = (mod.rootFolder !== '.')
                ? mod.rootFolder
                : (_a = mod.manifest.Name) !== null && _a !== void 0 ? _a : mod.rootFolder;
            if (modName === undefined) {
                return [];
            }
            const dependencies = mod.manifest.Dependencies || [];
            const instructions = [];
            for (const file of mod.modFiles) {
                const destination = path.join(modName, file.substr(mod.manifestIndex));
                instructions.push({
                    type: 'copy',
                    source: file,
                    destination: destination,
                });
            }
            const addRuleForDependency = (dep) => {
                if ((dep.UniqueID === undefined)
                    || (dep.UniqueID.toLowerCase() === 'yourname.yourotherspacksandmods')) {
                    return;
                }
                const versionMatch = dep.MinimumVersion !== undefined
                    ? `>=${dep.MinimumVersion}`
                    : '*';
                const rule = {
                    type: 'recommends',
                    reference: {
                        logicalFileName: dep.UniqueID.toLowerCase(),
                        versionMatch,
                    },
                    extra: {
                        onlyIfFulfillable: true,
                        automatic: true,
                    },
                };
                instructions.push({
                    type: 'rule',
                    rule,
                });
            };
            return instructions;
        })
            .then(data => {
            const instructions = [].concat(data).reduce((accum, iter) => accum.concat(iter), []);
            return Promise.resolve({ instructions });
        });
    });
}
function isSMAPIModType(instructions) {
    const smapiData = instructions.find(inst => (inst.type === 'copy') && inst.source.endsWith(SMAPI_EXE));
    return bluebird_1.default.resolve(smapiData !== undefined);
}
function testSMAPI(files, gameId) {
    const supported = (gameId === GAME_ID) && (files.find(file => path.basename(file) === SMAPI_DLL) !== undefined);
    return bluebird_1.default.resolve({
        supported,
        requiredFiles: [],
    });
}
function installSMAPI(getDiscoveryPath, files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const folder = process.platform === 'win32'
            ? 'windows'
            : process.platform === 'linux'
                ? 'linux'
                : 'macos';
        const fileHasCorrectPlatform = (file) => {
            const segments = file.split(path.sep).map(seg => seg.toLowerCase());
            return (segments.includes(folder));
        };
        const dataFile = files.find(file => {
            const isCorrectPlatform = fileHasCorrectPlatform(file);
            return isCorrectPlatform && SMAPI_DATA.includes(path.basename(file).toLowerCase());
        });
        if (dataFile === undefined) {
            return Promise.reject(new vortex_api_1.util.DataInvalid('Failed to find the SMAPI data files - download appears '
                + 'to be corrupted; please re-download SMAPI and try again'));
        }
        let data = '';
        try {
            data = yield vortex_api_1.fs.readFileAsync(path.join(getDiscoveryPath(), 'Stardew Valley.deps.json'), { encoding: 'utf8' });
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'failed to parse SDV dependencies', err);
        }
        const updatedFiles = [];
        const szip = new SevenZip();
        yield szip.extractFull(path.join(destinationPath, dataFile), destinationPath);
        yield vortex_api_1.util.walk(destinationPath, (iter, stats) => {
            const relPath = path.relative(destinationPath, iter);
            if (!files.includes(relPath) && stats.isFile() && !files.includes(relPath + path.sep))
                updatedFiles.push(relPath);
            const segments = relPath.toLocaleLowerCase().split(path.sep);
            const modsFolderIdx = segments.indexOf('mods');
            if ((modsFolderIdx !== -1) && (segments.length > modsFolderIdx + 1)) {
                _SMAPI_BUNDLED_MODS.push(segments[modsFolderIdx + 1]);
            }
            return bluebird_1.default.resolve();
        });
        const smapiExe = updatedFiles.find(file => file.toLowerCase().endsWith(SMAPI_EXE.toLowerCase()));
        if (smapiExe === undefined) {
            return Promise.reject(new vortex_api_1.util.DataInvalid(`Failed to extract ${SMAPI_EXE} - download appears `
                + 'to be corrupted; please re-download SMAPI and try again'));
        }
        const idx = smapiExe.indexOf(path.basename(smapiExe));
        const instructions = updatedFiles.map(file => {
            return {
                type: 'copy',
                source: file,
                destination: path.join(file.substr(idx)),
            };
        });
        instructions.push({
            type: 'attribute',
            key: 'smapiBundledMods',
            value: getBundledMods(),
        });
        instructions.push({
            type: 'generatefile',
            data,
            destination: 'StardewModdingAPI.deps.json',
        });
        return Promise.resolve({ instructions });
    });
}
function showSMAPILog(api, basePath, logFile) {
    return __awaiter(this, void 0, void 0, function* () {
        const logData = yield vortex_api_1.fs.readFileAsync(path.join(basePath, logFile), { encoding: 'utf-8' });
        yield api.showDialog('info', 'SMAPI Log', {
            text: 'Your SMAPI log is displayed below. To share it, click "Copy & Share" which will copy it to your clipboard and open the SMAPI log sharing website. ' +
                'Next, paste your code into the text box and press "save & parse log". You can now share a link to this page with others so they can see your log file.\n\n' + logData
        }, [{
                label: 'Copy & Share log', action: () => {
                    const timestamp = new Date().toISOString().replace(/^.+T([^\.]+).+/, '$1');
                    clipboard.writeText(`[${timestamp} INFO Vortex] Log exported by Vortex ${vortex_api_1.util.getApplication().version}.\n` + logData);
                    return vortex_api_1.util.opn('https://smapi.io/log').catch(err => undefined);
                }
            }, { label: 'Close', action: () => undefined }]);
    });
}
function onShowSMAPILog(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const basePath = path.join(vortex_api_1.util.getVortexPath('appData'), 'stardewvalley', 'errorlogs');
        try {
            yield showSMAPILog(api, basePath, "SMAPI-crash.txt");
        }
        catch (err) {
            try {
                yield showSMAPILog(api, basePath, "SMAPI-latest.txt");
            }
            catch (err) {
                api.sendNotification({ type: 'info', title: 'No SMAPI logs found.', message: '', displayMS: 5000 });
            }
        }
    });
}
function getModManifests(modPath) {
    const manifests = [];
    if (modPath === undefined) {
        return Promise.resolve([]);
    }
    return (0, turbowalk_1.default)(modPath, (entries) => __awaiter(this, void 0, void 0, function* () {
        for (const entry of entries) {
            if (path.basename(entry.filePath) === 'manifest.json') {
                manifests.push(entry.filePath);
            }
        }
    }), { skipHidden: false, recurse: true, skipInaccessible: true, skipLinks: true })
        .then(() => manifests);
}
function updateConflictInfo(api, smapi, gameId, modId) {
    var _a, _b, _c, _d, _e;
    const mod = api.getState().persistent.mods[gameId][modId];
    if (mod === undefined) {
        return Promise.resolve();
    }
    const now = Date.now();
    if ((now - ((_b = (_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.lastSMAPIQuery) !== null && _b !== void 0 ? _b : 0)) < constants_1.SMAPI_QUERY_FREQUENCY) {
        return Promise.resolve();
    }
    let additionalLogicalFileNames = (_c = mod.attributes) === null || _c === void 0 ? void 0 : _c.additionalLogicalFileNames;
    if (!additionalLogicalFileNames) {
        if ((_d = mod.attributes) === null || _d === void 0 ? void 0 : _d.logicalFileName) {
            additionalLogicalFileNames = [(_e = mod.attributes) === null || _e === void 0 ? void 0 : _e.logicalFileName];
        }
        else {
            additionalLogicalFileNames = [];
        }
    }
    const query = additionalLogicalFileNames
        .map(name => {
        var _a, _b, _c, _d;
        const res = {
            id: name,
        };
        const ver = (_b = (_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.manifestVersion) !== null && _b !== void 0 ? _b : (_d = semver.coerce((_c = mod.attributes) === null || _c === void 0 ? void 0 : _c.version)) === null || _d === void 0 ? void 0 : _d.version;
        if (!!ver) {
            res['installedVersion'] = ver;
        }
        return res;
    });
    const stat = (item) => {
        var _a, _b, _c;
        const status = (_c = (_b = (_a = item.metadata) === null || _a === void 0 ? void 0 : _a.compatibilityStatus) === null || _b === void 0 ? void 0 : _b.toLowerCase) === null || _c === void 0 ? void 0 : _c.call(_b);
        if (!types_1.compatibilityOptions.includes(status)) {
            return 'unknown';
        }
        else {
            return status;
        }
    };
    const compatibilityPrio = (item) => types_1.compatibilityOptions.indexOf(stat(item));
    return smapi.findByNames(query)
        .then(results => {
        var _a;
        const worstStatus = results
            .sort((lhs, rhs) => compatibilityPrio(lhs) - compatibilityPrio(rhs));
        if (worstStatus.length > 0) {
            api.store.dispatch(vortex_api_1.actions.setModAttributes(gameId, modId, {
                lastSMAPIQuery: now,
                compatibilityStatus: worstStatus[0].metadata.compatibilityStatus,
                compatibilityMessage: worstStatus[0].metadata.compatibilitySummary,
                compatibilityUpdate: (_a = worstStatus[0].suggestedUpdate) === null || _a === void 0 ? void 0 : _a.version,
            }));
        }
        else {
            (0, vortex_api_1.log)('debug', 'no manifest');
            api.store.dispatch(vortex_api_1.actions.setModAttribute(gameId, modId, 'lastSMAPIQuery', now));
        }
    })
        .catch(err => {
        (0, vortex_api_1.log)('warn', 'error reading manifest', err.message);
        api.store.dispatch(vortex_api_1.actions.setModAttribute(gameId, modId, 'lastSMAPIQuery', now));
    });
}
function init(context) {
    let dependencyManager;
    const getDiscoveryPath = () => {
        const state = context.api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', GAME_ID], undefined);
        if ((discovery === undefined) || (discovery.path === undefined)) {
            (0, vortex_api_1.log)('error', 'stardewvalley was not discovered');
            return undefined;
        }
        return discovery.path;
    };
    const getSMAPIPath = (game) => {
        const state = context.api.store.getState();
        const discovery = state.settings.gameMode.discovered[game.id];
        return discovery.path;
    };
    const manifestExtractor = toBlue((modInfo, modPath) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        if (vortex_api_1.selectors.activeGameId(context.api.getState()) !== GAME_ID) {
            return Promise.resolve({});
        }
        const manifests = yield getModManifests(modPath);
        const parsedManifests = (yield Promise.all(manifests.map((manifest) => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield (0, util_1.parseManifest)(manifest);
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'Failed to parse manifest', { manifestFile: manifest, error: err.message });
                return undefined;
            }
        })))).filter(manifest => manifest !== undefined);
        if (parsedManifests.length === 0) {
            return Promise.resolve({});
        }
        const refManifest = parsedManifests[0];
        const additionalLogicalFileNames = parsedManifests
            .filter(manifest => manifest.UniqueID !== undefined)
            .map(manifest => manifest.UniqueID.toLowerCase());
        const minSMAPIVersion = parsedManifests
            .map(manifest => manifest.MinimumApiVersion)
            .filter(version => semver.valid(version))
            .sort((lhs, rhs) => semver.compare(rhs, lhs))[0];
        const result = {
            additionalLogicalFileNames,
            minSMAPIVersion,
        };
        if (refManifest !== undefined) {
            if (((_c = (_b = (_a = modInfo.download.modInfo) === null || _a === void 0 ? void 0 : _a.nexus) === null || _b === void 0 ? void 0 : _b.ids) === null || _c === void 0 ? void 0 : _c.modId) !== 2400) {
                result['customFileName'] = refManifest.Name;
            }
            if (typeof (refManifest.Version) === 'string') {
                result['manifestVersion'] = refManifest.Version;
            }
        }
        return Promise.resolve(result);
    }));
    context.registerGame(new StardewValley(context));
    context.registerReducer(['settings', 'SDV'], reducers_1.default);
    context.registerSettings('Mods', Settings_1.default, () => ({
        onMergeConfigToggle: (profileId, enabled) => __awaiter(this, void 0, void 0, function* () {
            if (!enabled) {
                yield (0, configMod_1.onRevertFiles)(context.api, profileId);
                context.api.sendNotification({ type: 'info', message: 'Mod configs returned to their respective mods', displayMS: 5000 });
            }
            context.api.store.dispatch((0, actions_1.setMergeConfigs)(profileId, enabled));
            return Promise.resolve();
        })
    }), () => vortex_api_1.selectors.activeGameId(context.api.getState()) === GAME_ID, 150);
    context.registerInstaller('smapi-installer', 30, testSMAPI, (files, dest) => bluebird_1.default.resolve(installSMAPI(getDiscoveryPath, files, dest)));
    context.registerInstaller('sdvrootfolder', 50, testRootFolder, installRootFolder);
    context.registerInstaller('stardew-valley-installer', 50, testSupported, (files, destinationPath) => bluebird_1.default.resolve(install(context.api, dependencyManager, files, destinationPath)));
    context.registerModType('SMAPI', 30, gameId => gameId === GAME_ID, getSMAPIPath, isSMAPIModType);
    context.registerModType(MOD_TYPE_CONFIG, 30, (gameId) => (gameId === GAME_ID), () => path.join(getDiscoveryPath(), (0, util_1.defaultModsRelPath)()), () => bluebird_1.default.resolve(false));
    context.registerModType('sdvrootfolder', 25, (gameId) => (gameId === GAME_ID), () => getDiscoveryPath(), (instructions) => {
        const copyInstructions = instructions.filter(instr => instr.type === 'copy');
        const hasManifest = copyInstructions.find(instr => instr.destination.endsWith(MANIFEST_FILE));
        const hasModsFolder = copyInstructions.find(instr => instr.destination.startsWith((0, util_1.defaultModsRelPath)() + path.sep)) !== undefined;
        const hasContentFolder = copyInstructions.find(instr => instr.destination.startsWith('Content' + path.sep)) !== undefined;
        return (hasManifest)
            ? bluebird_1.default.resolve(hasContentFolder && hasModsFolder)
            : bluebird_1.default.resolve(hasContentFolder);
    });
    (0, configMod_1.registerConfigMod)(context);
    context.registerAction('mod-icons', 999, 'changelog', {}, 'SMAPI Log', () => { onShowSMAPILog(context.api); }, () => {
        const state = context.api.store.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        return (gameMode === GAME_ID);
    });
    context.registerAttributeExtractor(25, manifestExtractor);
    context.registerTableAttribute('mods', {
        id: 'sdv-compatibility',
        position: 100,
        condition: () => vortex_api_1.selectors.activeGameId(context.api.getState()) === GAME_ID,
        placement: 'table',
        calc: (mod) => { var _a; return (_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.compatibilityStatus; },
        customRenderer: (mod, detailCell, t) => {
            return react_1.default.createElement(CompatibilityIcon_1.default, { t, mod, detailCell }, []);
        },
        name: 'Compatibility',
        isDefaultVisible: true,
        edit: {},
    });
    context.registerTest('sdv-incompatible-mods', 'gamemode-activated', () => bluebird_1.default.resolve((0, tests_1.testSMAPIOutdated)(context.api, dependencyManager)));
    context.once(() => {
        const proxy = new smapiProxy_1.default(context.api);
        context.api.setStylesheet('sdv', path.join(__dirname, 'sdvstyle.scss'));
        context.api.addMetaServer('smapi.io', {
            url: '',
            loopbackCB: (query) => {
                return bluebird_1.default.resolve(proxy.find(query))
                    .catch(err => {
                    (0, vortex_api_1.log)('error', 'failed to look up smapi meta info', err.message);
                    return bluebird_1.default.resolve([]);
                });
            },
            cacheDurationSec: 86400,
            priority: 25,
        });
        dependencyManager = new DependencyManager_1.default(context.api);
        context.api.onAsync('added-files', (profileId, files) => (0, configMod_1.onAddedFiles)(context.api, profileId, files));
        context.api.onAsync('will-enable-mods', (profileId, modIds, enabled, options) => (0, configMod_1.onWillEnableMods)(context.api, profileId, modIds, enabled, options));
        context.api.onAsync('did-deploy', (profileId) => __awaiter(this, void 0, void 0, function* () {
            const state = context.api.getState();
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== GAME_ID) {
                return Promise.resolve();
            }
            const smapiMod = findSMAPIMod(context.api);
            const primaryTool = vortex_api_1.util.getSafe(state, ['settings', 'interface', 'primaryTool', GAME_ID], undefined);
            if (smapiMod && primaryTool === undefined) {
                context.api.store.dispatch(vortex_api_1.actions.setPrimaryTool(GAME_ID, 'smapi'));
            }
            return Promise.resolve();
        }));
        context.api.onAsync('did-purge', (profileId) => __awaiter(this, void 0, void 0, function* () {
            const state = context.api.getState();
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            if ((profile === null || profile === void 0 ? void 0 : profile.gameId) !== GAME_ID) {
                return Promise.resolve();
            }
            const smapiMod = findSMAPIMod(context.api);
            const primaryTool = vortex_api_1.util.getSafe(state, ['settings', 'interface', 'primaryTool', GAME_ID], undefined);
            if (smapiMod && primaryTool === 'smapi') {
                context.api.store.dispatch(vortex_api_1.actions.setPrimaryTool(GAME_ID, undefined));
            }
            return Promise.resolve();
        }));
        context.api.events.on('did-install-mod', (gameId, archiveId, modId) => {
            if (gameId !== GAME_ID) {
                return;
            }
            updateConflictInfo(context.api, proxy, gameId, modId)
                .then(() => (0, vortex_api_1.log)('debug', 'added compatibility info', { modId }))
                .catch(err => (0, vortex_api_1.log)('error', 'failed to add compatibility info', { modId, error: err.message }));
        });
        context.api.events.on('gamemode-activated', (gameMode) => {
            var _a;
            if (gameMode !== GAME_ID) {
                return;
            }
            const state = context.api.getState();
            (0, vortex_api_1.log)('debug', 'updating SDV compatibility info');
            Promise.all(Object.keys((_a = state.persistent.mods[gameMode]) !== null && _a !== void 0 ? _a : {}).map(modId => updateConflictInfo(context.api, proxy, gameMode, modId)))
                .then(() => {
                (0, vortex_api_1.log)('debug', 'done updating compatibility info');
            })
                .catch(err => {
                (0, vortex_api_1.log)('error', 'failed to update conflict info', err.message);
            });
        });
    });
}
exports.default = init;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLHdEQUFnQztBQUVoQyxrREFBMEI7QUFDMUIsK0NBQWlDO0FBQ2pDLDBEQUFrQztBQUNsQywyQ0FBc0U7QUFDdEUseURBQXVEO0FBR3ZELE1BQU0sTUFBTSxHQUFHLElBQUEsb0JBQVMsR0FBRSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0FBQ3BFLDRFQUFvRDtBQUNwRCwyQ0FBb0Q7QUFFcEQsNEVBQW9EO0FBQ3BELDBEQUFxQztBQUNyQyw4REFBc0M7QUFDdEMsbUNBQTRDO0FBQzVDLG1DQUFtSDtBQUNuSCxpQ0FBMkQ7QUFFM0QsMERBQWtDO0FBRWxDLHVDQUE0QztBQUU1QywyQ0FBK0Y7QUFFL0YsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUMxQixFQUFFLFNBQVMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFDbkMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFDL0IsRUFBRSxRQUFRLEVBQUUsR0FBRyxpQkFBSSxFQUNuQixFQUFFLFdBQVcsRUFBRSxhQUFhLEVBQUUsWUFBWSxFQUFFLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUNqRSxFQUFFLE9BQU8sRUFBRSxtQkFBbUIsRUFBRSxjQUFjLEVBQUUsZUFBZSxFQUFFLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBRTFGLE1BQU0sYUFBYSxHQUFHLGVBQWUsQ0FBQztBQUN0QyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLFNBQVMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQ3JELE1BQU0sU0FBUyxHQUFHLHVCQUF1QixDQUFDO0FB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QU8sRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVuRyxDQUFDLENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLFFBQWdCLEVBQUUsRUFBRTs7WUFDL0QsSUFBSSxRQUFRLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQ3pCLE9BQU87WUFDVCxDQUFDO1lBRUQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQyxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLGlDQUFpQyxDQUFDLENBQUM7WUFDaEQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQUEsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLG1DQUFJLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUN6RSxrQkFBa0IsQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztpQkFDeEQsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDVCxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLGtDQUFrQyxDQUFDLENBQUM7WUFDbkQsQ0FBQyxDQUFDO2lCQUNELEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDWCxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLGdDQUFnQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUM5RCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsa0JBQWUsSUFBSSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgeyBJUXVlcnkgfSBmcm9tICdtb2RtZXRhLWRiJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCB0dXJib3dhbGsgZnJvbSAndHVyYm93YWxrJztcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBsb2csIHNlbGVjdG9ycywgdXRpbCwgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IGlzV2luZG93cyB9IGZyb20gJy4uLy4uLy4uL3NyYy91dGlsL3BsYXRmb3JtJztcblxuLy8gQ29uZGl0aW9uYWwgd2luYXBpIGltcG9ydCAtIG9ubHkgYXZhaWxhYmxlIG9uIFdpbmRvd3NcbmNvbnN0IHdpbmFwaSA9IGlzV2luZG93cygpID8gcmVxdWlyZSgnd2luYXBpLWJpbmRpbmdzJykgOiB1bmRlZmluZWQ7XG5pbXBvcnQgQ29tcGF0aWJpbGl0eUljb24gZnJvbSAnLi9Db21wYXRpYmlsaXR5SWNvbic7XG5pbXBvcnQgeyBTTUFQSV9RVUVSWV9GUkVRVUVOQ1kgfSBmcm9tICcuL2NvbnN0YW50cyc7XG5cbmltcG9ydCBEZXBlbmRlbmN5TWFuYWdlciBmcm9tICcuL0RlcGVuZGVuY3lNYW5hZ2VyJztcbmltcG9ydCBzZHZSZWR1Y2VycyBmcm9tICcuL3JlZHVjZXJzJztcbmltcG9ydCBTTUFQSVByb3h5IGZyb20gJy4vc21hcGlQcm94eSc7XG5pbXBvcnQgeyB0ZXN0U01BUElPdXRkYXRlZCB9IGZyb20gJy4vdGVzdHMnO1xuaW1wb3J0IHsgY29tcGF0aWJpbGl0eU9wdGlvbnMsIENvbXBhdGliaWxpdHlTdGF0dXMsIElTRFZEZXBlbmRlbmN5LCBJU0RWTW9kTWFuaWZlc3QsIElTTUFQSVJlc3VsdCB9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHsgcGFyc2VNYW5pZmVzdCwgZGVmYXVsdE1vZHNSZWxQYXRoIH0gZnJvbSAnLi91dGlsJztcblxuaW1wb3J0IFNldHRpbmdzIGZyb20gJy4vU2V0dGluZ3MnO1xuXG5pbXBvcnQgeyBzZXRNZXJnZUNvbmZpZ3MgfSBmcm9tICcuL2FjdGlvbnMnO1xuXG5pbXBvcnQgeyBvbkFkZGVkRmlsZXMsIG9uUmV2ZXJ0RmlsZXMsIG9uV2lsbEVuYWJsZU1vZHMsIHJlZ2lzdGVyQ29uZmlnTW9kIH0gZnJvbSAnLi9jb25maWdNb2QnO1xuXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpLFxuICB7IGNsaXBib2FyZCB9ID0gcmVxdWlyZSgnZWxlY3Ryb24nKSxcbiAgcmpzb24gPSByZXF1aXJlKCdyZWxheGVkLWpzb24nKSxcbiAgeyBTZXZlblppcCB9ID0gdXRpbCxcbiAgeyBkZXBsb3lTTUFQSSwgZG93bmxvYWRTTUFQSSwgZmluZFNNQVBJTW9kIH0gPSByZXF1aXJlKCcuL1NNQVBJJyksXG4gIHsgR0FNRV9JRCwgX1NNQVBJX0JVTkRMRURfTU9EUywgZ2V0QnVuZGxlZE1vZHMsIE1PRF9UWVBFX0NPTkZJRyB9ID0gcmVxdWlyZSgnLi9jb21tb24nKTtcblxuY29uc3QgTUFOSUZFU1RfRklMRSA9ICdtYW5pZmVzdC5qc29uJztcbmNvbnN0IFBUUk5fQ09OVEVOVCA9IHBhdGguc2VwICsgJ0NvbnRlbnQnICsgcGF0aC5zZXA7XG5jb25zdCBTTUFQSV9FWEUgPSAnU3RhcmRld01vZGRpbmdBUEkuZXhlJztcbmNvbnN0IFNNQVBJX0RMTCA9ICdTTUFQSS5JbnN0YWxsZXIuZGxsJztcbmNvbnN0IFNNQVBJX0RBVEEgPSBbJ3dpbmRvd3MtaW5zdGFsbC5kYXQnLCAnaW5zdGFsbC5kYXQnXTtcblxuXG5mdW5jdGlvbiB0b0JsdWU8VD4oZnVuYzogKC4uLmFyZ3M6IGFueVtdKSA9PiBQcm9taXNlPFQ+KTogKC4uLmFyZ3M6IGFueVtdKSA9PiBCbHVlYmlyZDxUPiB7XG4gIHJldHVybiAoLi4uYXJnczogYW55W10pID0+IEJsdWViaXJkLnJlc29sdmUoZnVuYyguLi5hcmdzKSk7XG59XG5cbmNsYXNzIFN0YXJkZXdWYWxsZXkgaW1wbGVtZW50cyB0eXBlcy5JR2FtZSB7XG4gIHB1YmxpYyBjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dDtcbiAgcHVibGljIGlkOiBzdHJpbmcgPSBHQU1FX0lEO1xuICBwdWJsaWMgbmFtZTogc3RyaW5nID0gJ1N0YXJkZXcgVmFsbGV5JztcbiAgcHVibGljIGxvZ286IHN0cmluZyA9ICdnYW1lYXJ0LmpwZyc7XG4gIHB1YmxpYyByZXF1aXJlZEZpbGVzOiBzdHJpbmdbXTtcbiAgcHVibGljIGVudmlyb25tZW50OiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge1xuICAgIFN0ZWFtQVBQSWQ6ICc0MTMxNTAnLFxuICB9O1xuICBwdWJsaWMgZGV0YWlsczogeyBba2V5OiBzdHJpbmddOiBhbnkgfSA9IHtcbiAgICBzdGVhbUFwcElkOiA0MTMxNTBcbiAgfTtcbiAgcHVibGljIHN1cHBvcnRlZFRvb2xzOiBhbnlbXSA9IFtcbiAgICB7XG4gICAgICBpZDogJ3NtYXBpJyxcbiAgICAgIG5hbWU6ICdTTUFQSScsXG4gICAgICBsb2dvOiAnc21hcGkucG5nJyxcbiAgICAgIGV4ZWN1dGFibGU6ICgpID0+IFNNQVBJX0VYRSxcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFtTTUFQSV9FWEVdLFxuICAgICAgc2hlbGw6IHRydWUsXG4gICAgICBleGNsdXNpdmU6IHRydWUsXG4gICAgICByZWxhdGl2ZTogdHJ1ZSxcbiAgICAgIGRlZmF1bHRQcmltYXJ5OiB0cnVlLFxuICAgIH1cbiAgXTtcbiAgcHVibGljIG1lcmdlTW9kczogYm9vbGVhbiA9IHRydWU7XG4gIHB1YmxpYyByZXF1aXJlc0NsZWFudXA6IGJvb2xlYW4gPSB0cnVlO1xuICBwdWJsaWMgc2hlbGw6IGJvb2xlYW4gPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInO1xuICBwdWJsaWMgZGVmYXVsdFBhdGhzOiBzdHJpbmdbXTtcblxuICAvKioqKioqKioqXG4gICoqIFZvcnRleCBBUElcbiAgKioqKioqKioqL1xuICAvKipcbiAgICogQ29uc3RydWN0IGFuIGluc3RhbmNlLlxuICAgKiBAcGFyYW0ge0lFeHRlbnNpb25Db250ZXh0fSBjb250ZXh0IC0tIFRoZSBWb3J0ZXggZXh0ZW5zaW9uIGNvbnRleHQuXG4gICAqL1xuICBjb25zdHJ1Y3Rvcihjb250ZXh0OiB0eXBlcy5JRXh0ZW5zaW9uQ29udGV4dCkge1xuICAgIC8vIHByb3BlcnRpZXMgdXNlZCBieSBWb3J0ZXhcbiAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgIHRoaXMucmVxdWlyZWRGaWxlcyA9IHByb2Nlc3MucGxhdGZvcm0gPT0gJ3dpbjMyJ1xuICAgICAgPyBbJ1N0YXJkZXcgVmFsbGV5LmV4ZSddXG4gICAgICA6IFsnU3RhcmRld1ZhbGxleScsICdTdGFyZGV3VmFsbGV5LmV4ZSddO1xuXG4gICAgLy8gY3VzdG9tIHByb3BlcnRpZXNcbiAgICB0aGlzLmRlZmF1bHRQYXRocyA9IFtcbiAgICAgIC8vIExpbnV4XG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy9HT0cgR2FtZXMvU3RhcmRldyBWYWxsZXkvZ2FtZScsXG4gICAgICBwcm9jZXNzLmVudi5IT01FICsgJy8ubG9jYWwvc2hhcmUvU3RlYW0vc3RlYW1hcHBzL2NvbW1vbi9TdGFyZGV3IFZhbGxleScsXG5cbiAgICAgIC8vIE1hY1xuICAgICAgJy9BcHBsaWNhdGlvbnMvU3RhcmRldyBWYWxsZXkuYXBwL0NvbnRlbnRzL01hY09TJyxcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnL0xpYnJhcnkvQXBwbGljYXRpb24gU3VwcG9ydC9TdGVhbS9zdGVhbWFwcHMvY29tbW9uL1N0YXJkZXcgVmFsbGV5L0NvbnRlbnRzL01hY09TJyxcblxuICAgICAgLy8gV2luZG93c1xuICAgICAgJ0M6XFxcXFByb2dyYW0gRmlsZXMgKHg4NilcXFxcR2FsYXh5Q2xpZW50XFxcXEdhbWVzXFxcXFN0YXJkZXcgVmFsbGV5JyxcbiAgICAgICdDOlxcXFxQcm9ncmFtIEZpbGVzICh4ODYpXFxcXEdPRyBHYWxheHlcXFxcR2FtZXNcXFxcU3RhcmRldyBWYWxsZXknLFxuICAgICAgJ0M6XFxcXFByb2dyYW0gRmlsZXMgKHg4NilcXFxcU3RlYW1cXFxcc3RlYW1hcHBzXFxcXGNvbW1vblxcXFxTdGFyZGV3IFZhbGxleSdcbiAgICBdO1xuICB9XG5cbiAgLyoqXG4gICAqIEFzeW5jaHJvbm91c2x5IGZpbmQgdGhlIGdhbWUgaW5zdGFsbCBwYXRoLlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uIHNob3VsZCByZXR1cm4gcXVpY2tseSBhbmQsIGlmIGl0IHJldHVybnMgYSB2YWx1ZSwgaXQgc2hvdWxkIGRlZmluaXRpdmVseSBiZSB0aGVcbiAgICogdmFsaWQgZ2FtZSBwYXRoLiBVc3VhbGx5IHRoaXMgZnVuY3Rpb24gd2lsbCBxdWVyeSB0aGUgcGF0aCBmcm9tIHRoZSByZWdpc3RyeSBvciBmcm9tIHN0ZWFtLlxuICAgKiBUaGlzIGZ1bmN0aW9uIG1heSByZXR1cm4gYSBwcm9taXNlIGFuZCBpdCBzaG91bGQgZG8gdGhhdCBpZiBpdCdzIGRvaW5nIEkvTy5cbiAgICpcbiAgICogVGhpcyBtYXkgYmUgbGVmdCB1bmRlZmluZWQgYnV0IHRoZW4gdGhlIHRvb2wvZ2FtZSBjYW4gb25seSBiZSBkaXNjb3ZlcmVkIGJ5IHNlYXJjaGluZyB0aGUgZGlza1xuICAgKiB3aGljaCBpcyBzbG93IGFuZCBvbmx5IGhhcHBlbnMgbWFudWFsbHkuXG4gICAqL1xuICBwdWJsaWMgcXVlcnlQYXRoID0gdG9CbHVlKGFzeW5jICgpID0+IHtcbiAgICAvLyBjaGVjayBTdGVhbVxuICAgIGNvbnN0IGdhbWUgPSBhd2FpdCB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbJzQxMzE1MCcsICcxNDUzMzc1MjUzJywgJ0NvbmNlcm5lZEFwZS5TdGFyZGV3VmFsbGV5UEMnXSk7XG4gICAgaWYgKGdhbWUpXG4gICAgICByZXR1cm4gZ2FtZS5nYW1lUGF0aDtcblxuICAgIC8vIGNoZWNrIGRlZmF1bHQgcGF0aHNcbiAgICBmb3IgKGNvbnN0IGRlZmF1bHRQYXRoIG9mIHRoaXMuZGVmYXVsdFBhdGhzKVxuICAgIHtcbiAgICAgIGlmIChhd2FpdCB0aGlzLmdldFBhdGhFeGlzdHNBc3luYyhkZWZhdWx0UGF0aCkpXG4gICAgICAgIHJldHVybiBkZWZhdWx0UGF0aDtcbiAgICB9XG4gIH0pO1xuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHBhdGggb2YgdGhlIHRvb2wgZXhlY3V0YWJsZSByZWxhdGl2ZSB0byB0aGUgdG9vbCBiYXNlIHBhdGgsIGkuZS4gYmluYXJpZXMvVVQzLmV4ZSBvclxuICAgKiBURVNWLmV4ZS4gVGhpcyBpcyBhIGZ1bmN0aW9uIHNvIHRoYXQgeW91IGNhbiByZXR1cm4gZGlmZmVyZW50IHRoaW5ncyBiYXNlZCBvbiB0aGUgb3BlcmF0aW5nXG4gICAqIHN5c3RlbSBmb3IgZXhhbXBsZSBidXQgYmUgYXdhcmUgdGhhdCBpdCB3aWxsIGJlIGV2YWx1YXRlZCBhdCBhcHBsaWNhdGlvbiBzdGFydCBhbmQgb25seSBvbmNlLFxuICAgKiBzbyB0aGUgcmV0dXJuIHZhbHVlIGNhbiBub3QgZGVwZW5kIG9uIHRoaW5ncyB0aGF0IGNoYW5nZSBhdCBydW50aW1lLlxuICAgKi9cbiAgcHVibGljIGV4ZWN1dGFibGUoKSB7XG4gICAgcmV0dXJuIHByb2Nlc3MucGxhdGZvcm0gPT0gJ3dpbjMyJ1xuICAgICAgPyAnU3RhcmRldyBWYWxsZXkuZXhlJ1xuICAgICAgOiAnU3RhcmRld1ZhbGxleSc7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSBkZWZhdWx0IGRpcmVjdG9yeSB3aGVyZSBtb2RzIGZvciB0aGlzIGdhbWUgc2hvdWxkIGJlIHN0b3JlZC5cbiAgICogXG4gICAqIElmIHRoaXMgcmV0dXJucyBhIHJlbGF0aXZlIHBhdGggdGhlbiB0aGUgcGF0aCBpcyB0cmVhdGVkIGFzIHJlbGF0aXZlIHRvIHRoZSBnYW1lIGluc3RhbGxhdGlvblxuICAgKiBkaXJlY3RvcnkuIFNpbXBseSByZXR1cm4gYSBkb3QgKCAoKSA9PiAnLicgKSBpZiBtb2RzIGFyZSBpbnN0YWxsZWQgZGlyZWN0bHkgaW50byB0aGUgZ2FtZVxuICAgKiBkaXJlY3RvcnkuXG4gICAqLyBcbiAgcHVibGljIHF1ZXJ5TW9kUGF0aCgpXG4gIHtcbiAgICByZXR1cm4gZGVmYXVsdE1vZHNSZWxQYXRoKCk7XG4gIH1cblxuICAvKipcbiAgICogT3B0aW9uYWwgc2V0dXAgZnVuY3Rpb24uIElmIHRoaXMgZ2FtZSByZXF1aXJlcyBzb21lIGZvcm0gb2Ygc2V0dXAgYmVmb3JlIGl0IGNhbiBiZSBtb2RkZWQgKGxpa2VcbiAgICogY3JlYXRpbmcgYSBkaXJlY3RvcnksIGNoYW5naW5nIGEgcmVnaXN0cnkga2V5LCAuLi4pIGRvIGl0IGhlcmUuIEl0IHdpbGwgYmUgY2FsbGVkIGV2ZXJ5IHRpbWVcbiAgICogYmVmb3JlIHRoZSBnYW1lIG1vZGUgaXMgYWN0aXZhdGVkLlxuICAgKiBAcGFyYW0ge0lEaXNjb3ZlcnlSZXN1bHR9IGRpc2NvdmVyeSAtLSBiYXNpYyBpbmZvIGFib3V0IHRoZSBnYW1lIGJlaW5nIGxvYWRlZC5cbiAgICovXG4gIHB1YmxpYyBzZXR1cCA9IHRvQmx1ZShhc3luYyAoZGlzY292ZXJ5KSA9PiB7XG4gICAgLy8gTWFrZSBzdXJlIHRoZSBmb2xkZXIgZm9yIFNNQVBJIG1vZHMgZXhpc3RzLlxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgZGVmYXVsdE1vZHNSZWxQYXRoKCkpKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgIH1cbiAgICAvLyBza2lwIGlmIFNNQVBJIGZvdW5kXG4gICAgY29uc3Qgc21hcGlQYXRoID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBTTUFQSV9FWEUpO1xuICAgIGNvbnN0IHNtYXBpRm91bmQgPSBhd2FpdCB0aGlzLmdldFBhdGhFeGlzdHNBc3luYyhzbWFwaVBhdGgpO1xuICAgIGlmICghc21hcGlGb3VuZCkge1xuICAgICAgdGhpcy5yZWNvbW1lbmRTbWFwaSgpO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCBzdGF0ZSA9IHRoaXMuY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcblxuICAgIC8qXG4gICAgaWYgKHN0YXRlLnNldHRpbmdzWydTRFYnXS51c2VSZWNvbW1lbmRhdGlvbnMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhpcy5jb250ZXh0LmFwaS5zaG93RGlhbG9nKCdxdWVzdGlvbicsICdTaG93IFJlY29tbWVuZGF0aW9ucz8nLCB7XG4gICAgICAgIHRleHQ6ICdWb3J0ZXggY2FuIG9wdGlvbmFsbHkgdXNlIGRhdGEgZnJvbSBTTUFQSVxcJ3MgZGF0YWJhc2UgYW5kICdcbiAgICAgICAgICAgICsgJ3RoZSBtYW5pZmVzdCBmaWxlcyBpbmNsdWRlZCB3aXRoIG1vZHMgdG8gcmVjb21tZW5kIGFkZGl0aW9uYWwgJ1xuICAgICAgICAgICAgKyAnY29tcGF0aWJsZSBtb2RzIHRoYXQgd29yayB3aXRoIHRob3NlIHRoYXQgeW91IGhhdmUgaW5zdGFsbGVkLiAnXG4gICAgICAgICAgICArICdJbiBzb21lIGNhc2VzLCB0aGlzIGluZm9ybWF0aW9uIGNvdWxkIGJlIHdyb25nIG9yIGluY29tcGxldGUgJ1xuICAgICAgICAgICAgKyAnd2hpY2ggbWF5IGxlYWQgdG8gdW5yZWxpYWJsZSBwcm9tcHRzIHNob3dpbmcgaW4gdGhlIGFwcC5cXG4nXG4gICAgICAgICAgICArICdBbGwgcmVjb21tZW5kYXRpb25zIHNob3duIHNob3VsZCBiZSBjYXJlZnVsbHkgY29uc2lkZXJlZCAnXG4gICAgICAgICAgICArICdiZWZvcmUgYWNjZXB0aW5nIHRoZW0gLSBpZiB5b3UgYXJlIHVuc3VyZSBwbGVhc2UgY2hlY2sgdGhlICdcbiAgICAgICAgICAgICsgJ21vZCBwYWdlIHRvIHNlZSBpZiB0aGUgYXV0aG9yIGhhcyBwcm92aWRlZCBhbnkgZnVydGhlciBpbnN0cnVjdGlvbnMuICdcbiAgICAgICAgICAgICsgJ1dvdWxkIHlvdSBsaWtlIHRvIGVuYWJsZSB0aGlzIGZlYXR1cmU/IFlvdSBjYW4gdXBkYXRlIHlvdXIgY2hvaWNlICdcbiAgICAgICAgICAgICsgJ2Zyb20gdGhlIFNldHRpbmdzIG1lbnUgYXQgYW55IHRpbWUuJ1xuICAgICAgfSwgW1xuICAgICAgICB7IGxhYmVsOiAnQ29udGludWUgd2l0aG91dCByZWNvbW1lbmRhdGlvbnMnLCBhY3Rpb246ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFJlY29tbWVuZGF0aW9ucyhmYWxzZSkpO1xuICAgICAgICB9IH0sXG4gICAgICAgIHsgbGFiZWw6ICdFbmFibGUgcmVjb21tZW5kYXRpb25zJywgYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgdGhpcy5jb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChzZXRSZWNvbW1lbmRhdGlvbnModHJ1ZSkpO1xuICAgICAgICB9IH0sXG4gICAgICBdKVxuICAgIH0qL1xuICB9KTtcblxuXG4gIHByaXZhdGUgcmVjb21tZW5kU21hcGkoKSB7XG4gICAgY29uc3Qgc21hcGlNb2QgPSBmaW5kU01BUElNb2QodGhpcy5jb250ZXh0LmFwaSk7XG4gICAgY29uc3QgdGl0bGUgPSBzbWFwaU1vZCA/ICdTTUFQSSBpcyBub3QgZGVwbG95ZWQnIDogJ1NNQVBJIGlzIG5vdCBpbnN0YWxsZWQnO1xuICAgIGNvbnN0IGFjdGlvblRpdGxlID0gc21hcGlNb2QgPyAnRGVwbG95JyA6ICdHZXQgU01BUEknO1xuICAgIGNvbnN0IGFjdGlvbiA9ICgpID0+IChzbWFwaU1vZFxuICAgICAgPyBkZXBsb3lTTUFQSSh0aGlzLmNvbnRleHQuYXBpKVxuICAgICAgOiBkb3dubG9hZFNNQVBJKHRoaXMuY29udGV4dC5hcGkpKVxuICAgICAgLnRoZW4oKCkgPT4gdGhpcy5jb250ZXh0LmFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKCdzbWFwaS1taXNzaW5nJykpO1xuXG4gICAgdGhpcy5jb250ZXh0LmFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgIGlkOiAnc21hcGktbWlzc2luZycsXG4gICAgICB0eXBlOiAnd2FybmluZycsXG4gICAgICB0aXRsZSxcbiAgICAgIG1lc3NhZ2U6ICdTTUFQSSBpcyByZXF1aXJlZCB0byBtb2QgU3RhcmRldyBWYWxsZXkuJyxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAge1xuICAgICAgICAgIHRpdGxlOiBhY3Rpb25UaXRsZSxcbiAgICAgICAgICBhY3Rpb24sXG4gICAgICAgIH0sXG4gICAgICBdXG4gICAgfSk7XG4gIH1cblxuICAvKioqKioqKioqXG4gICoqIEludGVybmFsIG1ldGhvZHNcbiAgKioqKioqKioqL1xuXG4gIC8qKlxuICAgKiBBc3luY2hyb25vdXNseSBjaGVjayB3aGV0aGVyIGEgZmlsZSBvciBkaXJlY3RvcnkgcGF0aCBleGlzdHMuXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoIC0gVGhlIGZpbGUgb3IgZGlyZWN0b3J5IHBhdGguXG4gICAqL1xuICBhc3luYyBnZXRQYXRoRXhpc3RzQXN5bmMocGF0aClcbiAge1xuICAgIHRyeSB7XG4gICAgIGF3YWl0IGZzLnN0YXRBc3luYyhwYXRoKTtcbiAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGNhdGNoKGVycikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBc3luY2hyb25vdXNseSByZWFkIGEgcmVnaXN0cnkga2V5IHZhbHVlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGl2ZSAtIFRoZSByZWdpc3RyeSBoaXZlIHRvIGFjY2Vzcy4gVGhpcyBzaG91bGQgYmUgYSBjb25zdGFudCBsaWtlIFJlZ2lzdHJ5LkhLTE0uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSBUaGUgcmVnaXN0cnkga2V5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIG9mIHRoZSB2YWx1ZSB0byByZWFkLlxuICAgKi9cbiAgYXN5bmMgcmVhZFJlZ2lzdHJ5S2V5QXN5bmMoaGl2ZSwga2V5LCBuYW1lKVxuICB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGluc3RQYXRoID0gKGlzV2luZG93cygpICYmIHdpbmFwaSkgPyB3aW5hcGkuUmVnR2V0VmFsdWUoaGl2ZSwga2V5LCBuYW1lKSA6IG51bGw7XG4gICAgICBpZiAoIWluc3RQYXRoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignZW1wdHkgcmVnaXN0cnkga2V5Jyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGluc3RQYXRoLnZhbHVlKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdGVzdFJvb3RGb2xkZXIoZmlsZXMsIGdhbWVJZCkge1xuICAvLyBXZSBhc3N1bWUgdGhhdCBhbnkgbW9kIGNvbnRhaW5pbmcgXCIvQ29udGVudC9cIiBpbiBpdHMgZGlyZWN0b3J5XG4gIC8vICBzdHJ1Y3R1cmUgaXMgbWVhbnQgdG8gYmUgZGVwbG95ZWQgdG8gdGhlIHJvb3QgZm9sZGVyLlxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IGZpbGUuZW5kc1dpdGgocGF0aC5zZXApKVxuICAgIC5tYXAoZmlsZSA9PiBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKSk7XG4gIGNvbnN0IGNvbnRlbnREaXIgPSBmaWx0ZXJlZC5maW5kKGZpbGUgPT4gZmlsZS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcbiAgY29uc3Qgc3VwcG9ydGVkID0gKChnYW1lSWQgPT09IEdBTUVfSUQpXG4gICAgJiYgKGNvbnRlbnREaXIgIT09IHVuZGVmaW5lZCkpO1xuXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcbn1cblxuZnVuY3Rpb24gaW5zdGFsbFJvb3RGb2xkZXIoZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xuICAvLyBXZSdyZSBnb2luZyB0byBkZXBsb3kgXCIvQ29udGVudC9cIiBhbmQgd2hhdGV2ZXIgZm9sZGVycyBjb21lIGFsb25nc2lkZSBpdC5cbiAgLy8gIGkuZS4gU29tZU1vZC43elxuICAvLyAgV2lsbCBiZSBkZXBsb3llZCAgICAgPT4gLi4vU29tZU1vZC9Db250ZW50L1xuICAvLyAgV2lsbCBiZSBkZXBsb3llZCAgICAgPT4gLi4vU29tZU1vZC9Nb2RzL1xuICAvLyAgV2lsbCBOT1QgYmUgZGVwbG95ZWQgPT4gLi4vUmVhZG1lLmRvY1xuICBjb25zdCBjb250ZW50RmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcbiAgY29uc3QgaWR4ID0gY29udGVudEZpbGUuaW5kZXhPZihQVFJOX0NPTlRFTlQpICsgMTtcbiAgY29uc3Qgcm9vdERpciA9IHBhdGguYmFzZW5hbWUoY29udGVudEZpbGUuc3Vic3RyaW5nKDAsIGlkeCkpO1xuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+ICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKVxuICAgICYmIChmaWxlLmluZGV4T2Yocm9vdERpcikgIT09IC0xKVxuICAgICYmIChwYXRoLmV4dG5hbWUoZmlsZSkgIT09ICcudHh0JykpO1xuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWx0ZXJlZC5tYXAoZmlsZSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgIHNvdXJjZTogZmlsZSxcbiAgICAgIGRlc3RpbmF0aW9uOiBmaWxlLnN1YnN0cihpZHgpLFxuICAgIH07XG4gIH0pO1xuXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xufVxuXG5mdW5jdGlvbiBpc1ZhbGlkTWFuaWZlc3QoZmlsZVBhdGgpIHtcbiAgY29uc3Qgc2VnbWVudHMgPSBmaWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcbiAgY29uc3QgaXNNYW5pZmVzdEZpbGUgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXSA9PT0gTUFOSUZFU1RfRklMRTtcbiAgY29uc3QgaXNMb2NhbGUgPSBzZWdtZW50cy5pbmNsdWRlcygnbG9jYWxlJyk7XG4gIHJldHVybiBpc01hbmlmZXN0RmlsZSAmJiAhaXNMb2NhbGU7XG59XG5cbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWQoZmlsZXMsIGdhbWVJZCkge1xuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKVxuICAgICYmIChmaWxlcy5maW5kKGlzVmFsaWRNYW5pZmVzdCkgIT09IHVuZGVmaW5lZClcbiAgICAmJiAoZmlsZXMuZmluZChmaWxlID0+IHtcbiAgICAgIC8vIFdlIGNyZWF0ZSBhIHByZWZpeCBmYWtlIGRpcmVjdG9yeSBqdXN0IGluIGNhc2UgdGhlIGNvbnRlbnRcbiAgICAgIC8vICBmb2xkZXIgaXMgaW4gdGhlIGFyY2hpdmUncyByb290IGZvbGRlci4gVGhpcyBpcyB0byBlbnN1cmUgd2VcbiAgICAgIC8vICBmaW5kIGEgbWF0Y2ggZm9yIFwiL0NvbnRlbnQvXCJcbiAgICAgIGNvbnN0IHRlc3RGaWxlID0gcGF0aC5qb2luKCdmYWtlRGlyJywgZmlsZSk7XG4gICAgICByZXR1cm4gKHRlc3RGaWxlLmVuZHNXaXRoKFBUUk5fQ09OVEVOVCkpO1xuICAgIH0pID09PSB1bmRlZmluZWQpO1xuICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSh7IHN1cHBvcnRlZCwgcmVxdWlyZWRGaWxlczogW10gfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGwoYXBpLFxuICAgICAgICAgICAgICAgICAgICAgICBkZXBlbmRlbmN5TWFuYWdlcixcbiAgICAgICAgICAgICAgICAgICAgICAgZmlsZXMsXG4gICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aCkge1xuICAvLyBUaGUgYXJjaGl2ZSBtYXkgY29udGFpbiBtdWx0aXBsZSBtYW5pZmVzdCBmaWxlcyB3aGljaCB3b3VsZFxuICAvLyAgaW1wbHkgdGhhdCB3ZSdyZSBpbnN0YWxsaW5nIG11bHRpcGxlIG1vZHMuXG4gIGNvbnN0IG1hbmlmZXN0RmlsZXMgPSBmaWxlcy5maWx0ZXIoaXNWYWxpZE1hbmlmZXN0KTtcblxuICBpbnRlcmZhY2UgSU1vZEluZm8ge1xuICAgIG1hbmlmZXN0OiBJU0RWTW9kTWFuaWZlc3Q7XG4gICAgcm9vdEZvbGRlcjogc3RyaW5nO1xuICAgIG1hbmlmZXN0SW5kZXg6IG51bWJlcjtcbiAgICBtb2RGaWxlczogc3RyaW5nW107XG4gIH1cblxuICBsZXQgcGFyc2VFcnJvcjogRXJyb3I7XG5cbiAgYXdhaXQgZGVwZW5kZW5jeU1hbmFnZXIuc2Nhbk1hbmlmZXN0cyh0cnVlKTtcbiAgbGV0IG1vZHM6IElNb2RJbmZvW10gPSBhd2FpdCBQcm9taXNlLmFsbChtYW5pZmVzdEZpbGVzLm1hcChhc3luYyBtYW5pZmVzdEZpbGUgPT4ge1xuICAgIGNvbnN0IHJvb3RGb2xkZXIgPSBwYXRoLmRpcm5hbWUobWFuaWZlc3RGaWxlKTtcbiAgICBjb25zdCByb290U2VnbWVudHMgPSByb290Rm9sZGVyLnRvTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApO1xuICAgIGNvbnN0IG1hbmlmZXN0SW5kZXggPSBtYW5pZmVzdEZpbGUudG9Mb3dlckNhc2UoKS5pbmRleE9mKE1BTklGRVNUX0ZJTEUpO1xuICAgIGNvbnN0IGZpbHRlckZ1bmMgPSAoZmlsZTogc3RyaW5nKSA9PiB7XG4gICAgICBjb25zdCBpc0ZpbGUgPSAhZmlsZS5lbmRzV2l0aChwYXRoLnNlcCkgJiYgcGF0aC5leHRuYW1lKHBhdGguYmFzZW5hbWUoZmlsZSkpICE9PSAnJztcbiAgICAgIGNvbnN0IGZpbGVTZWdtZW50cyA9IGZpbGUudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XG4gICAgICBjb25zdCBpc0luUm9vdEZvbGRlciA9IChyb290U2VnbWVudHMubGVuZ3RoID4gMClcbiAgICAgICAgPyBmaWxlU2VnbWVudHM/Lltyb290U2VnbWVudHMubGVuZ3RoIC0gMV0gPT09IHJvb3RTZWdtZW50c1tyb290U2VnbWVudHMubGVuZ3RoIC0gMV1cbiAgICAgICAgOiB0cnVlO1xuICAgICAgcmV0dXJuIGlzSW5Sb290Rm9sZGVyICYmIGlzRmlsZTtcbiAgICB9O1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBtYW5pZmVzdDogSVNEVk1vZE1hbmlmZXN0ID1cbiAgICAgICAgYXdhaXQgcGFyc2VNYW5pZmVzdChwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBtYW5pZmVzdEZpbGUpKTtcbiAgICAgIGNvbnN0IG1vZEZpbGVzID0gZmlsZXMuZmlsdGVyKGZpbHRlckZ1bmMpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgbWFuaWZlc3QsXG4gICAgICAgIHJvb3RGb2xkZXIsXG4gICAgICAgIG1hbmlmZXN0SW5kZXgsXG4gICAgICAgIG1vZEZpbGVzLFxuICAgICAgfTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vIGp1c3QgYSB3YXJuaW5nIGF0IHRoaXMgcG9pbnQgYXMgdGhpcyBtYXkgbm90IGJlIHRoZSBtYWluIG1hbmlmZXN0IGZvciB0aGUgbW9kXG4gICAgICBsb2coJ3dhcm4nLCAnRmFpbGVkIHRvIHBhcnNlIG1hbmlmZXN0JywgeyBtYW5pZmVzdEZpbGUsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgIHBhcnNlRXJyb3IgPSBlcnI7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbiAgfSkpO1xuXG4gIG1vZHMgPSBtb2RzLmZpbHRlcih4ID0+IHggIT09IHVuZGVmaW5lZCk7XG4gIFxuICBpZiAobW9kcy5sZW5ndGggPT09IDApIHtcbiAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKFxuICAgICAgJ1RoZSBtb2QgbWFuaWZlc3QgaXMgaW52YWxpZCBhbmQgY2FuXFwndCBiZSByZWFkLiBZb3UgY2FuIHRyeSB0byBpbnN0YWxsIHRoZSBtb2QgYW55d2F5IHZpYSByaWdodC1jbGljayAtPiBcIlVucGFjayAoYXMtaXMpXCInLFxuICAgICAgcGFyc2VFcnJvciwge1xuICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxuICAgIH0pO1xuICB9XG5cbiAgcmV0dXJuIEJsdWViaXJkLm1hcChtb2RzLCBtb2QgPT4ge1xuICAgIC8vIFRPRE86IHdlIG1pZ2h0IGdldCBoZXJlIHdpdGggYSBtb2QgdGhhdCBoYXMgYSBtYW5pZmVzdC5qc29uIGZpbGUgYnV0IHdhc24ndCBpbnRlbmRlZCBmb3IgU3RhcmRldyBWYWxsZXksIGFsbFxuICAgIC8vICB0aHVuZGVyc3RvcmUgbW9kcyB3aWxsIGNvbnRhaW4gYSBtYW5pZmVzdC5qc29uIGZpbGVcbiAgICBjb25zdCBtb2ROYW1lID0gKG1vZC5yb290Rm9sZGVyICE9PSAnLicpXG4gICAgICA/IG1vZC5yb290Rm9sZGVyXG4gICAgICA6IG1vZC5tYW5pZmVzdC5OYW1lID8/IG1vZC5yb290Rm9sZGVyO1xuXG4gICAgaWYgKG1vZE5hbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IGRlcGVuZGVuY2llcyA9IG1vZC5tYW5pZmVzdC5EZXBlbmRlbmNpZXMgfHwgW107XG5cbiAgICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gW107XG5cbiAgICBmb3IgKGNvbnN0IGZpbGUgb2YgbW9kLm1vZEZpbGVzKSB7XG4gICAgICBjb25zdCBkZXN0aW5hdGlvbiA9IHBhdGguam9pbihtb2ROYW1lLCBmaWxlLnN1YnN0cihtb2QubWFuaWZlc3RJbmRleCkpO1xuICAgICAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xuICAgICAgICB0eXBlOiAnY29weScsXG4gICAgICAgIHNvdXJjZTogZmlsZSxcbiAgICAgICAgZGVzdGluYXRpb246IGRlc3RpbmF0aW9uLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgYWRkUnVsZUZvckRlcGVuZGVuY3kgPSAoZGVwOiBJU0RWRGVwZW5kZW5jeSkgPT4ge1xuICAgICAgaWYgKChkZXAuVW5pcXVlSUQgPT09IHVuZGVmaW5lZClcbiAgICAgICAgICB8fCAoZGVwLlVuaXF1ZUlELnRvTG93ZXJDYXNlKCkgPT09ICd5b3VybmFtZS55b3Vyb3RoZXJzcGFja3NhbmRtb2RzJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB2ZXJzaW9uTWF0Y2ggPSBkZXAuTWluaW11bVZlcnNpb24gIT09IHVuZGVmaW5lZFxuICAgICAgICA/IGA+PSR7ZGVwLk1pbmltdW1WZXJzaW9ufWBcbiAgICAgICAgOiAnKic7XG4gICAgICBjb25zdCBydWxlOiB0eXBlcy5JTW9kUnVsZSA9IHtcbiAgICAgICAgLy8gdHJlYXRpbmcgYWxsIGRlcGVuZGVuY2llcyBhcyByZWNvbW1lbmRhdGlvbnMgYmVjYXVzZSB0aGUgZGVwZW5kZW5jeSBpbmZvcm1hdGlvblxuICAgICAgICAvLyBwcm92aWRlZCBieSBzb21lIG1vZCBhdXRob3JzIGlzIGEgYml0IGhpdC1hbmQtbWlzcyBhbmQgVm9ydGV4IGZhaXJseSBhZ2dyZXNzaXZlbHlcbiAgICAgICAgLy8gZW5mb3JjZXMgcmVxdWlyZW1lbnRzXG4gICAgICAgIC8vIHR5cGU6IChkZXAuSXNSZXF1aXJlZCA/PyB0cnVlKSA/ICdyZXF1aXJlcycgOiAncmVjb21tZW5kcycsXG4gICAgICAgIHR5cGU6ICdyZWNvbW1lbmRzJyxcbiAgICAgICAgcmVmZXJlbmNlOiB7XG4gICAgICAgICAgbG9naWNhbEZpbGVOYW1lOiBkZXAuVW5pcXVlSUQudG9Mb3dlckNhc2UoKSxcbiAgICAgICAgICB2ZXJzaW9uTWF0Y2gsXG4gICAgICAgIH0sXG4gICAgICAgIGV4dHJhOiB7XG4gICAgICAgICAgb25seUlmRnVsZmlsbGFibGU6IHRydWUsXG4gICAgICAgICAgYXV0b21hdGljOiB0cnVlLFxuICAgICAgICB9LFxuICAgICAgfTtcbiAgICAgIGluc3RydWN0aW9ucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ3J1bGUnLFxuICAgICAgICBydWxlLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLypcbiAgICBpZiAoYXBpLmdldFN0YXRlKCkuc2V0dGluZ3NbJ1NEViddPy51c2VSZWNvbW1lbmRhdGlvbnMgPz8gZmFsc2UpIHtcbiAgICAgIGZvciAoY29uc3QgZGVwIG9mIGRlcGVuZGVuY2llcykge1xuICAgICAgICBhZGRSdWxlRm9yRGVwZW5kZW5jeShkZXApO1xuICAgICAgfVxuICAgICAgaWYgKG1vZC5tYW5pZmVzdC5Db250ZW50UGFja0ZvciAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGFkZFJ1bGVGb3JEZXBlbmRlbmN5KG1vZC5tYW5pZmVzdC5Db250ZW50UGFja0Zvcik7XG4gICAgICB9XG4gICAgfSovXG4gICAgcmV0dXJuIGluc3RydWN0aW9ucztcbiAgfSlcbiAgICAudGhlbihkYXRhID0+IHtcbiAgICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IFtdLmNvbmNhdChkYXRhKS5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiBhY2N1bS5jb25jYXQoaXRlciksIFtdKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGlzU01BUElNb2RUeXBlKGluc3RydWN0aW9ucykge1xuICAvLyBGaW5kIHRoZSBTTUFQSSBleGUgZmlsZS5cbiAgY29uc3Qgc21hcGlEYXRhID0gaW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdCA9PiAoaW5zdC50eXBlID09PSAnY29weScpICYmIGluc3Quc291cmNlLmVuZHNXaXRoKFNNQVBJX0VYRSkpO1xuXG4gIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKHNtYXBpRGF0YSAhPT0gdW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gdGVzdFNNQVBJKGZpbGVzLCBnYW1lSWQpIHtcbiAgLy8gTWFrZSBzdXJlIHRoZSBkb3dubG9hZCBjb250YWlucyB0aGUgU01BUEkgZGF0YSBhcmNoaXZlLnNcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PlxuICAgIHBhdGguYmFzZW5hbWUoZmlsZSkgPT09IFNNQVBJX0RMTCkgIT09IHVuZGVmaW5lZClcbiAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUoe1xuICAgICAgc3VwcG9ydGVkLFxuICAgICAgcmVxdWlyZWRGaWxlczogW10sXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsU01BUEkoZ2V0RGlzY292ZXJ5UGF0aCwgZmlsZXMsIGRlc3RpbmF0aW9uUGF0aCkge1xuICBjb25zdCBmb2xkZXIgPSBwcm9jZXNzLnBsYXRmb3JtID09PSAnd2luMzInXG4gICAgPyAnd2luZG93cydcbiAgICA6IHByb2Nlc3MucGxhdGZvcm0gPT09ICdsaW51eCdcbiAgICAgID8gJ2xpbnV4J1xuICAgICAgOiAnbWFjb3MnO1xuICBjb25zdCBmaWxlSGFzQ29ycmVjdFBsYXRmb3JtID0gKGZpbGUpID0+IHtcbiAgICBjb25zdCBzZWdtZW50cyA9IGZpbGUuc3BsaXQocGF0aC5zZXApLm1hcChzZWcgPT4gc2VnLnRvTG93ZXJDYXNlKCkpO1xuICAgIHJldHVybiAoc2VnbWVudHMuaW5jbHVkZXMoZm9sZGVyKSk7XG4gIH1cbiAgLy8gRmluZCB0aGUgU01BUEkgZGF0YSBhcmNoaXZlXG4gIGNvbnN0IGRhdGFGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHtcbiAgICBjb25zdCBpc0NvcnJlY3RQbGF0Zm9ybSA9IGZpbGVIYXNDb3JyZWN0UGxhdGZvcm0oZmlsZSk7XG4gICAgcmV0dXJuIGlzQ29ycmVjdFBsYXRmb3JtICYmIFNNQVBJX0RBVEEuaW5jbHVkZXMocGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpKVxuICB9KTtcbiAgaWYgKGRhdGFGaWxlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ0ZhaWxlZCB0byBmaW5kIHRoZSBTTUFQSSBkYXRhIGZpbGVzIC0gZG93bmxvYWQgYXBwZWFycyAnXG4gICAgICArICd0byBiZSBjb3JydXB0ZWQ7IHBsZWFzZSByZS1kb3dubG9hZCBTTUFQSSBhbmQgdHJ5IGFnYWluJykpO1xuICB9XG4gIGxldCBkYXRhID0gJyc7XG4gIHRyeSB7XG4gICAgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGdldERpc2NvdmVyeVBhdGgoKSwgJ1N0YXJkZXcgVmFsbGV5LmRlcHMuanNvbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHBhcnNlIFNEViBkZXBlbmRlbmNpZXMnLCBlcnIpO1xuICB9XG5cbiAgLy8gZmlsZSB3aWxsIGJlIG91dGRhdGVkIGFmdGVyIHRoZSB3YWxrIG9wZXJhdGlvbiBzbyBwcmVwYXJlIGEgcmVwbGFjZW1lbnQuIFxuICBjb25zdCB1cGRhdGVkRmlsZXMgPSBbXTtcblxuICBjb25zdCBzemlwID0gbmV3IFNldmVuWmlwKCk7XG4gIC8vIFVuemlwIHRoZSBmaWxlcyBmcm9tIHRoZSBkYXRhIGFyY2hpdmUuIFRoaXMgZG9lc24ndCBzZWVtIHRvIGJlaGF2ZSBhcyBkZXNjcmliZWQgaGVyZTogaHR0cHM6Ly93d3cubnBtanMuY29tL3BhY2thZ2Uvbm9kZS03eiNldmVudHNcbiAgYXdhaXQgc3ppcC5leHRyYWN0RnVsbChwYXRoLmpvaW4oZGVzdGluYXRpb25QYXRoLCBkYXRhRmlsZSksIGRlc3RpbmF0aW9uUGF0aCk7XG5cbiAgLy8gRmluZCBhbnkgZmlsZXMgdGhhdCBhcmUgbm90IGluIHRoZSBwYXJlbnQgZm9sZGVyLiBcbiAgYXdhaXQgdXRpbC53YWxrKGRlc3RpbmF0aW9uUGF0aCwgKGl0ZXIsIHN0YXRzKSA9PiB7XG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZShkZXN0aW5hdGlvblBhdGgsIGl0ZXIpO1xuICAgICAgLy8gRmlsdGVyIG91dCBmaWxlcyBmcm9tIHRoZSBvcmlnaW5hbCBpbnN0YWxsIGFzIHRoZXkncmUgbm8gbG9uZ2VyIHJlcXVpcmVkLlxuICAgICAgaWYgKCFmaWxlcy5pbmNsdWRlcyhyZWxQYXRoKSAmJiBzdGF0cy5pc0ZpbGUoKSAmJiAhZmlsZXMuaW5jbHVkZXMocmVsUGF0aCtwYXRoLnNlcCkpIHVwZGF0ZWRGaWxlcy5wdXNoKHJlbFBhdGgpO1xuICAgICAgY29uc3Qgc2VnbWVudHMgPSByZWxQYXRoLnRvTG9jYWxlTG93ZXJDYXNlKCkuc3BsaXQocGF0aC5zZXApO1xuICAgICAgY29uc3QgbW9kc0ZvbGRlcklkeCA9IHNlZ21lbnRzLmluZGV4T2YoJ21vZHMnKTtcbiAgICAgIGlmICgobW9kc0ZvbGRlcklkeCAhPT0gLTEpICYmIChzZWdtZW50cy5sZW5ndGggPiBtb2RzRm9sZGVySWR4ICsgMSkpIHtcbiAgICAgICAgX1NNQVBJX0JVTkRMRURfTU9EUy5wdXNoKHNlZ21lbnRzW21vZHNGb2xkZXJJZHggKyAxXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gQmx1ZWJpcmQucmVzb2x2ZSgpO1xuICB9KTtcblxuICAvLyBGaW5kIHRoZSBTTUFQSSBleGUgZmlsZS4gXG4gIGNvbnN0IHNtYXBpRXhlID0gdXBkYXRlZEZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkuZW5kc1dpdGgoU01BUElfRVhFLnRvTG93ZXJDYXNlKCkpKTtcbiAgaWYgKHNtYXBpRXhlID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoYEZhaWxlZCB0byBleHRyYWN0ICR7U01BUElfRVhFfSAtIGRvd25sb2FkIGFwcGVhcnMgYFxuICAgICAgKyAndG8gYmUgY29ycnVwdGVkOyBwbGVhc2UgcmUtZG93bmxvYWQgU01BUEkgYW5kIHRyeSBhZ2FpbicpKTtcbiAgfVxuICBjb25zdCBpZHggPSBzbWFwaUV4ZS5pbmRleE9mKHBhdGguYmFzZW5hbWUoc21hcGlFeGUpKTtcblxuICAvLyBCdWlsZCB0aGUgaW5zdHJ1Y3Rpb25zIGZvciBpbnN0YWxsYXRpb24uIFxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gdXBkYXRlZEZpbGVzLm1hcChmaWxlID0+IHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICAgIHNvdXJjZTogZmlsZSxcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5qb2luKGZpbGUuc3Vic3RyKGlkeCkpLFxuICAgICAgfVxuICB9KTtcblxuICBpbnN0cnVjdGlvbnMucHVzaCh7XG4gICAgdHlwZTogJ2F0dHJpYnV0ZScsXG4gICAga2V5OiAnc21hcGlCdW5kbGVkTW9kcycsXG4gICAgdmFsdWU6IGdldEJ1bmRsZWRNb2RzKCksXG4gIH0pO1xuXG4gIGluc3RydWN0aW9ucy5wdXNoKHtcbiAgICB0eXBlOiAnZ2VuZXJhdGVmaWxlJyxcbiAgICBkYXRhLFxuICAgIGRlc3RpbmF0aW9uOiAnU3RhcmRld01vZGRpbmdBUEkuZGVwcy5qc29uJyxcbiAgfSk7XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc2hvd1NNQVBJTG9nKGFwaSwgYmFzZVBhdGgsIGxvZ0ZpbGUpIHtcbiAgY29uc3QgbG9nRGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKGJhc2VQYXRoLCBsb2dGaWxlKSwgeyBlbmNvZGluZzogJ3V0Zi04JyB9KTtcbiAgYXdhaXQgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnU01BUEkgTG9nJywge1xuICAgIHRleHQ6ICdZb3VyIFNNQVBJIGxvZyBpcyBkaXNwbGF5ZWQgYmVsb3cuIFRvIHNoYXJlIGl0LCBjbGljayBcIkNvcHkgJiBTaGFyZVwiIHdoaWNoIHdpbGwgY29weSBpdCB0byB5b3VyIGNsaXBib2FyZCBhbmQgb3BlbiB0aGUgU01BUEkgbG9nIHNoYXJpbmcgd2Vic2l0ZS4gJyArXG4gICAgICAnTmV4dCwgcGFzdGUgeW91ciBjb2RlIGludG8gdGhlIHRleHQgYm94IGFuZCBwcmVzcyBcInNhdmUgJiBwYXJzZSBsb2dcIi4gWW91IGNhbiBub3cgc2hhcmUgYSBsaW5rIHRvIHRoaXMgcGFnZSB3aXRoIG90aGVycyBzbyB0aGV5IGNhbiBzZWUgeW91ciBsb2cgZmlsZS5cXG5cXG4nICsgbG9nRGF0YVxuICB9LCBbe1xuICAgIGxhYmVsOiAnQ29weSAmIFNoYXJlIGxvZycsIGFjdGlvbjogKCkgPT4ge1xuICAgICAgY29uc3QgdGltZXN0YW1wID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnJlcGxhY2UoL14uK1QoW15cXC5dKykuKy8sICckMScpO1xuICAgICAgY2xpcGJvYXJkLndyaXRlVGV4dChgWyR7dGltZXN0YW1wfSBJTkZPIFZvcnRleF0gTG9nIGV4cG9ydGVkIGJ5IFZvcnRleCAke3V0aWwuZ2V0QXBwbGljYXRpb24oKS52ZXJzaW9ufS5cXG5gICsgbG9nRGF0YSk7XG4gICAgICByZXR1cm4gdXRpbC5vcG4oJ2h0dHBzOi8vc21hcGkuaW8vbG9nJykuY2F0Y2goZXJyID0+IHVuZGVmaW5lZCk7XG4gICAgfVxuICB9LCB7IGxhYmVsOiAnQ2xvc2UnLCBhY3Rpb246ICgpID0+IHVuZGVmaW5lZCB9XSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG9uU2hvd1NNQVBJTG9nKGFwaSkge1xuICAvL1JlYWQgYW5kIGRpc3BsYXkgdGhlIGxvZy5cbiAgY29uc3QgYmFzZVBhdGggPSBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdhcHBEYXRhJyksICdzdGFyZGV3dmFsbGV5JywgJ2Vycm9ybG9ncycpO1xuICB0cnkge1xuICAgIC8vSWYgdGhlIGNyYXNoIGxvZyBleGlzdHMsIHNob3cgdGhhdC5cbiAgICBhd2FpdCBzaG93U01BUElMb2coYXBpLCBiYXNlUGF0aCwgXCJTTUFQSS1jcmFzaC50eHRcIik7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHRyeSB7XG4gICAgICAvL090aGVyd2lzZSBzaG93IHRoZSBub3JtYWwgbG9nLlxuICAgICAgYXdhaXQgc2hvd1NNQVBJTG9nKGFwaSwgYmFzZVBhdGgsIFwiU01BUEktbGF0ZXN0LnR4dFwiKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIC8vT3IgSW5mb3JtIHRoZSB1c2VyIHRoZXJlIGFyZSBubyBsb2dzLlxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oeyB0eXBlOiAnaW5mbycsIHRpdGxlOiAnTm8gU01BUEkgbG9ncyBmb3VuZC4nLCBtZXNzYWdlOiAnJywgZGlzcGxheU1TOiA1MDAwIH0pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRNb2RNYW5pZmVzdHMobW9kUGF0aD86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgY29uc3QgbWFuaWZlc3RzOiBzdHJpbmdbXSA9IFtdO1xuXG4gIGlmIChtb2RQYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgfVxuXG4gIHJldHVybiB0dXJib3dhbGsobW9kUGF0aCwgYXN5bmMgZW50cmllcyA9PiB7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyaWVzKSB7XG4gICAgICBpZiAocGF0aC5iYXNlbmFtZShlbnRyeS5maWxlUGF0aCkgPT09ICdtYW5pZmVzdC5qc29uJykge1xuICAgICAgICBtYW5pZmVzdHMucHVzaChlbnRyeS5maWxlUGF0aCk7XG4gICAgICB9XG4gICAgfVxuICB9LCB7IHNraXBIaWRkZW46IGZhbHNlLCByZWN1cnNlOiB0cnVlLCBza2lwSW5hY2Nlc3NpYmxlOiB0cnVlLCBza2lwTGlua3M6IHRydWUgfSlcbiAgICAudGhlbigoKSA9PiBtYW5pZmVzdHMpO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVDb25mbGljdEluZm8oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNtYXBpOiBTTUFQSVByb3h5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGdhbWVJZDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1vZElkOiBzdHJpbmcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgbW9kID0gYXBpLmdldFN0YXRlKCkucGVyc2lzdGVudC5tb2RzW2dhbWVJZF1bbW9kSWRdO1xuXG4gIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGNvbnN0IG5vdyA9IERhdGUubm93KCk7XG5cbiAgaWYgKChub3cgLSAobW9kLmF0dHJpYnV0ZXM/Lmxhc3RTTUFQSVF1ZXJ5ID8/IDApKSA8IFNNQVBJX1FVRVJZX0ZSRVFVRU5DWSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIGxldCBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IG1vZC5hdHRyaWJ1dGVzPy5hZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcztcbiAgaWYgKCFhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcykge1xuICAgIGlmIChtb2QuYXR0cmlidXRlcz8ubG9naWNhbEZpbGVOYW1lKSB7XG4gICAgICBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IFttb2QuYXR0cmlidXRlcz8ubG9naWNhbEZpbGVOYW1lXTtcbiAgICB9IGVsc2Uge1xuICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBbXTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBxdWVyeSA9IGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzXG4gICAgLm1hcChuYW1lID0+IHtcbiAgICAgIGNvbnN0IHJlcyA9IHtcbiAgICAgICAgaWQ6IG5hbWUsXG4gICAgICB9O1xuICAgICAgY29uc3QgdmVyID0gbW9kLmF0dHJpYnV0ZXM/Lm1hbmlmZXN0VmVyc2lvblxuICAgICAgICAgICAgICAgICAgICAgPz8gc2VtdmVyLmNvZXJjZShtb2QuYXR0cmlidXRlcz8udmVyc2lvbik/LnZlcnNpb247XG4gICAgICBpZiAoISF2ZXIpIHtcbiAgICAgICAgcmVzWydpbnN0YWxsZWRWZXJzaW9uJ10gPSB2ZXI7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiByZXM7XG4gICAgfSk7XG5cbiAgY29uc3Qgc3RhdCA9IChpdGVtOiBJU01BUElSZXN1bHQpOiBDb21wYXRpYmlsaXR5U3RhdHVzID0+IHtcbiAgICBjb25zdCBzdGF0dXMgPSBpdGVtLm1ldGFkYXRhPy5jb21wYXRpYmlsaXR5U3RhdHVzPy50b0xvd2VyQ2FzZT8uKCk7XG4gICAgaWYgKCFjb21wYXRpYmlsaXR5T3B0aW9ucy5pbmNsdWRlcyhzdGF0dXMgYXMgYW55KSkge1xuICAgICAgcmV0dXJuICd1bmtub3duJztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHN0YXR1cyBhcyBDb21wYXRpYmlsaXR5U3RhdHVzO1xuICAgIH1cbiAgfTtcblxuICBjb25zdCBjb21wYXRpYmlsaXR5UHJpbyA9IChpdGVtOiBJU01BUElSZXN1bHQpID0+IGNvbXBhdGliaWxpdHlPcHRpb25zLmluZGV4T2Yoc3RhdChpdGVtKSk7XG5cbiAgcmV0dXJuIHNtYXBpLmZpbmRCeU5hbWVzKHF1ZXJ5KVxuICAgIC50aGVuKHJlc3VsdHMgPT4ge1xuICAgICAgY29uc3Qgd29yc3RTdGF0dXM6IElTTUFQSVJlc3VsdFtdID0gcmVzdWx0c1xuICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IGNvbXBhdGliaWxpdHlQcmlvKGxocykgLSBjb21wYXRpYmlsaXR5UHJpbyhyaHMpKTtcbiAgICAgIGlmICh3b3JzdFN0YXR1cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZXMoZ2FtZUlkLCBtb2RJZCwge1xuICAgICAgICAgIGxhc3RTTUFQSVF1ZXJ5OiBub3csXG4gICAgICAgICAgY29tcGF0aWJpbGl0eVN0YXR1czogd29yc3RTdGF0dXNbMF0ubWV0YWRhdGEuY29tcGF0aWJpbGl0eVN0YXR1cyxcbiAgICAgICAgICBjb21wYXRpYmlsaXR5TWVzc2FnZTogd29yc3RTdGF0dXNbMF0ubWV0YWRhdGEuY29tcGF0aWJpbGl0eVN1bW1hcnksXG4gICAgICAgICAgY29tcGF0aWJpbGl0eVVwZGF0ZTogd29yc3RTdGF0dXNbMF0uc3VnZ2VzdGVkVXBkYXRlPy52ZXJzaW9uLFxuICAgICAgICB9KSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBsb2coJ2RlYnVnJywgJ25vIG1hbmlmZXN0Jyk7XG4gICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShnYW1lSWQsIG1vZElkLCAnbGFzdFNNQVBJUXVlcnknLCBub3cpKTtcbiAgICAgIH1cbiAgICB9KVxuICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgbG9nKCd3YXJuJywgJ2Vycm9yIHJlYWRpbmcgbWFuaWZlc3QnLCBlcnIubWVzc2FnZSk7XG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoZ2FtZUlkLCBtb2RJZCwgJ2xhc3RTTUFQSVF1ZXJ5Jywgbm93KSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGluaXQoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgbGV0IGRlcGVuZGVuY3lNYW5hZ2VyOiBEZXBlbmRlbmN5TWFuYWdlcjtcbiAgY29uc3QgZ2V0RGlzY292ZXJ5UGF0aCA9ICgpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgICBpZiAoKGRpc2NvdmVyeSA9PT0gdW5kZWZpbmVkKSB8fCAoZGlzY292ZXJ5LnBhdGggPT09IHVuZGVmaW5lZCkpIHtcbiAgICAgIC8vIHNob3VsZCBuZXZlciBoYXBwZW4gYW5kIGlmIGl0IGRvZXMgaXQgd2lsbCBjYXVzZSBlcnJvcnMgZWxzZXdoZXJlIGFzIHdlbGxcbiAgICAgIGxvZygnZXJyb3InLCAnc3RhcmRld3ZhbGxleSB3YXMgbm90IGRpc2NvdmVyZWQnKTtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIGRpc2NvdmVyeS5wYXRoO1xuICB9XG5cbiAgY29uc3QgZ2V0U01BUElQYXRoID0gKGdhbWUpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgY29uc3QgZGlzY292ZXJ5ID0gc3RhdGUuc2V0dGluZ3MuZ2FtZU1vZGUuZGlzY292ZXJlZFtnYW1lLmlkXTtcbiAgICByZXR1cm4gZGlzY292ZXJ5LnBhdGg7XG4gIH07XG5cbiAgY29uc3QgbWFuaWZlc3RFeHRyYWN0b3IgPSB0b0JsdWUoXG4gICAgYXN5bmMgKG1vZEluZm86IGFueSwgbW9kUGF0aD86IHN0cmluZyk6IFByb21pc2U8eyBba2V5OiBzdHJpbmddOiBhbnk7IH0+ID0+IHtcbiAgICAgIGlmIChzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpICE9PSBHQU1FX0lEKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe30pO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtYW5pZmVzdHMgPSBhd2FpdCBnZXRNb2RNYW5pZmVzdHMobW9kUGF0aCk7XG5cbiAgICAgIGNvbnN0IHBhcnNlZE1hbmlmZXN0cyA9IChhd2FpdCBQcm9taXNlLmFsbChtYW5pZmVzdHMubWFwKFxuICAgICAgICBhc3luYyBtYW5pZmVzdCA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBwYXJzZU1hbmlmZXN0KG1hbmlmZXN0KTtcbiAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGxvZygnd2FybicsICdGYWlsZWQgdG8gcGFyc2UgbWFuaWZlc3QnLCB7IG1hbmlmZXN0RmlsZTogbWFuaWZlc3QsIGVycm9yOiBlcnIubWVzc2FnZSB9KTtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgfVxuICAgICAgICB9KSkpLmZpbHRlcihtYW5pZmVzdCA9PiBtYW5pZmVzdCAhPT0gdW5kZWZpbmVkKTtcblxuICAgICAgaWYgKHBhcnNlZE1hbmlmZXN0cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7XG4gICAgICB9XG5cbiAgICAgIC8vIHdlIGNhbiBvbmx5IHVzZSBvbmUgbWFuaWZlc3QgdG8gZ2V0IHRoZSBpZCBmcm9tXG4gICAgICBjb25zdCByZWZNYW5pZmVzdCA9IHBhcnNlZE1hbmlmZXN0c1swXTtcblxuICAgICAgY29uc3QgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMgPSBwYXJzZWRNYW5pZmVzdHNcbiAgICAgICAgLmZpbHRlcihtYW5pZmVzdCA9PiBtYW5pZmVzdC5VbmlxdWVJRCAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAubWFwKG1hbmlmZXN0ID0+IG1hbmlmZXN0LlVuaXF1ZUlELnRvTG93ZXJDYXNlKCkpO1xuXG4gICAgICBjb25zdCBtaW5TTUFQSVZlcnNpb24gPSBwYXJzZWRNYW5pZmVzdHNcbiAgICAgICAgLm1hcChtYW5pZmVzdCA9PiBtYW5pZmVzdC5NaW5pbXVtQXBpVmVyc2lvbilcbiAgICAgICAgLmZpbHRlcih2ZXJzaW9uID0+IHNlbXZlci52YWxpZCh2ZXJzaW9uKSlcbiAgICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBzZW12ZXIuY29tcGFyZShyaHMsIGxocykpWzBdO1xuXG4gICAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICAgIGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzLFxuICAgICAgICBtaW5TTUFQSVZlcnNpb24sXG4gICAgICB9O1xuXG4gICAgICBpZiAocmVmTWFuaWZlc3QgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBkb24ndCBzZXQgYSBjdXN0b20gZmlsZSBuYW1lIGZvciBTTUFQSVxuICAgICAgICBpZiAobW9kSW5mby5kb3dubG9hZC5tb2RJbmZvPy5uZXh1cz8uaWRzPy5tb2RJZCAhPT0gMjQwMCkge1xuICAgICAgICAgIHJlc3VsdFsnY3VzdG9tRmlsZU5hbWUnXSA9IHJlZk1hbmlmZXN0Lk5hbWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIChyZWZNYW5pZmVzdC5WZXJzaW9uKSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICByZXN1bHRbJ21hbmlmZXN0VmVyc2lvbiddID0gcmVmTWFuaWZlc3QuVmVyc2lvbjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHJlc3VsdCk7XG4gICAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlckdhbWUobmV3IFN0YXJkZXdWYWxsZXkoY29udGV4dCkpO1xuICBjb250ZXh0LnJlZ2lzdGVyUmVkdWNlcihbJ3NldHRpbmdzJywgJ1NEViddLCBzZHZSZWR1Y2Vycyk7XG5cbiAgY29udGV4dC5yZWdpc3RlclNldHRpbmdzKCdNb2RzJywgU2V0dGluZ3MsICgpID0+ICh7XG4gICAgb25NZXJnZUNvbmZpZ1RvZ2dsZTogYXN5bmMgKHByb2ZpbGVJZDogc3RyaW5nLCBlbmFibGVkOiBib29sZWFuKSA9PiB7XG4gICAgICBpZiAoIWVuYWJsZWQpIHtcbiAgICAgICAgYXdhaXQgb25SZXZlcnRGaWxlcyhjb250ZXh0LmFwaSwgcHJvZmlsZUlkKTtcbiAgICAgICAgY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7IHR5cGU6ICdpbmZvJywgbWVzc2FnZTogJ01vZCBjb25maWdzIHJldHVybmVkIHRvIHRoZWlyIHJlc3BlY3RpdmUgbW9kcycsIGRpc3BsYXlNUzogNTAwMCB9KTtcbiAgICAgIH1cbiAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldE1lcmdlQ29uZmlncyhwcm9maWxlSWQsIGVuYWJsZWQpKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gIH0pLCAoKSA9PiBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpID09PSBHQU1FX0lELCAxNTApO1xuXG4gIC8vIFJlZ2lzdGVyIG91ciBTTUFQSSBtb2QgdHlwZSBhbmQgaW5zdGFsbGVyLiBOb3RlOiBUaGlzIGN1cnJlbnRseSBmbGFncyBhbiBlcnJvciBpbiBWb3J0ZXggb24gaW5zdGFsbGluZyBjb3JyZWN0bHkuXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NtYXBpLWluc3RhbGxlcicsIDMwLCB0ZXN0U01BUEksIChmaWxlcywgZGVzdCkgPT4gQmx1ZWJpcmQucmVzb2x2ZShpbnN0YWxsU01BUEkoZ2V0RGlzY292ZXJ5UGF0aCwgZmlsZXMsIGRlc3QpKSk7XG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NkdnJvb3Rmb2xkZXInLCA1MCwgdGVzdFJvb3RGb2xkZXIsIGluc3RhbGxSb290Rm9sZGVyKTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc3RhcmRldy12YWxsZXktaW5zdGFsbGVyJywgNTAsIHRlc3RTdXBwb3J0ZWQsXG4gICAgKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpID0+IEJsdWViaXJkLnJlc29sdmUoaW5zdGFsbChjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIsIGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpKSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ1NNQVBJJywgMzAsIGdhbWVJZCA9PiBnYW1lSWQgPT09IEdBTUVfSUQsIGdldFNNQVBJUGF0aCwgaXNTTUFQSU1vZFR5cGUpO1xuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZShNT0RfVFlQRV9DT05GSUcsIDMwLCAoZ2FtZUlkKSA9PiAoZ2FtZUlkID09PSBHQU1FX0lEKSxcbiAgICAoKSA9PiBwYXRoLmpvaW4oZ2V0RGlzY292ZXJ5UGF0aCgpLCBkZWZhdWx0TW9kc1JlbFBhdGgoKSksICgpID0+IEJsdWViaXJkLnJlc29sdmUoZmFsc2UpKTtcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoJ3NkdnJvb3Rmb2xkZXInLCAyNSwgKGdhbWVJZCkgPT4gKGdhbWVJZCA9PT0gR0FNRV9JRCksXG4gICAgKCkgPT4gZ2V0RGlzY292ZXJ5UGF0aCgpLCAoaW5zdHJ1Y3Rpb25zKSA9PiB7XG4gICAgICAvLyBPbmx5IGludGVyZXN0ZWQgaW4gY29weSBpbnN0cnVjdGlvbnMuXG4gICAgICBjb25zdCBjb3B5SW5zdHJ1Y3Rpb25zID0gaW5zdHJ1Y3Rpb25zLmZpbHRlcihpbnN0ciA9PiBpbnN0ci50eXBlID09PSAnY29weScpO1xuICAgICAgLy8gVGhpcyBpcyBhIHRyaWNreSBwYXR0ZXJuIHNvIHdlJ3JlIGdvaW5nIHRvIDFzdCBwcmVzZW50IHRoZSBkaWZmZXJlbnQgcGFja2FnaW5nXG4gICAgICAvLyAgcGF0dGVybnMgd2UgbmVlZCB0byBjYXRlciBmb3I6XG4gICAgICAvLyAgMS4gUmVwbGFjZW1lbnQgbW9kIHdpdGggXCJDb250ZW50XCIgZm9sZGVyLiBEb2VzIG5vdCByZXF1aXJlIFNNQVBJIHNvIG5vXG4gICAgICAvLyAgICBtYW5pZmVzdCBmaWxlcyBhcmUgaW5jbHVkZWQuXG4gICAgICAvLyAgMi4gUmVwbGFjZW1lbnQgbW9kIHdpdGggXCJDb250ZW50XCIgZm9sZGVyICsgb25lIG9yIG1vcmUgU01BUEkgbW9kcyBpbmNsdWRlZFxuICAgICAgLy8gICAgYWxvbmdzaWRlIHRoZSBDb250ZW50IGZvbGRlciBpbnNpZGUgYSBcIk1vZHNcIiBmb2xkZXIuXG4gICAgICAvLyAgMy4gQSByZWd1bGFyIFNNQVBJIG1vZCB3aXRoIGEgXCJDb250ZW50XCIgZm9sZGVyIGluc2lkZSB0aGUgbW9kJ3Mgcm9vdCBkaXIuXG4gICAgICAvL1xuICAgICAgLy8gcGF0dGVybiAxOlxuICAgICAgLy8gIC0gRW5zdXJlIHdlIGRvbid0IGhhdmUgbWFuaWZlc3QgZmlsZXNcbiAgICAgIC8vICAtIEVuc3VyZSB3ZSBoYXZlIGEgXCJDb250ZW50XCIgZm9sZGVyXG4gICAgICAvL1xuICAgICAgLy8gVG8gc29sdmUgcGF0dGVybnMgMiBhbmQgMyB3ZSdyZSBnb2luZyB0bzpcbiAgICAgIC8vICBDaGVjayB3aGV0aGVyIHdlIGhhdmUgYW55IG1hbmlmZXN0IGZpbGVzLCBpZiB3ZSBkbywgd2UgZXhwZWN0IHRoZSBmb2xsb3dpbmdcbiAgICAgIC8vICAgIGFyY2hpdmUgc3RydWN0dXJlIGluIG9yZGVyIGZvciB0aGUgbW9kVHlwZSB0byBmdW5jdGlvbiBjb3JyZWN0bHk6XG4gICAgICAvLyAgICBhcmNoaXZlLnppcCA9PlxuICAgICAgLy8gICAgICAuLi9Db250ZW50L1xuICAgICAgLy8gICAgICAuLi9Nb2RzL1xuICAgICAgLy8gICAgICAuLi9Nb2RzL0FfU01BUElfTU9EXFxtYW5pZmVzdC5qc29uXG4gICAgICBjb25zdCBoYXNNYW5pZmVzdCA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxuICAgICAgICBpbnN0ci5kZXN0aW5hdGlvbi5lbmRzV2l0aChNQU5JRkVTVF9GSUxFKSlcbiAgICAgIGNvbnN0IGhhc01vZHNGb2xkZXIgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uc3RhcnRzV2l0aChkZWZhdWx0TW9kc1JlbFBhdGgoKSArIHBhdGguc2VwKSkgIT09IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IGhhc0NvbnRlbnRGb2xkZXIgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uc3RhcnRzV2l0aCgnQ29udGVudCcgKyBwYXRoLnNlcCkpICE9PSB1bmRlZmluZWRcblxuICAgICAgcmV0dXJuIChoYXNNYW5pZmVzdClcbiAgICAgICAgPyBCbHVlYmlyZC5yZXNvbHZlKGhhc0NvbnRlbnRGb2xkZXIgJiYgaGFzTW9kc0ZvbGRlcilcbiAgICAgICAgOiBCbHVlYmlyZC5yZXNvbHZlKGhhc0NvbnRlbnRGb2xkZXIpO1xuICAgIH0pO1xuXG4gIHJlZ2lzdGVyQ29uZmlnTW9kKGNvbnRleHQpXG4gIGNvbnRleHQucmVnaXN0ZXJBY3Rpb24oJ21vZC1pY29ucycsIDk5OSwgJ2NoYW5nZWxvZycsIHt9LCAnU01BUEkgTG9nJyxcbiAgICAoKSA9PiB7IG9uU2hvd1NNQVBJTG9nKGNvbnRleHQuYXBpKTsgfSxcbiAgICAoKSA9PiB7XG4gICAgICAvL09ubHkgc2hvdyB0aGUgU01BUEkgbG9nIGJ1dHRvbiBmb3IgU0RWLiBcbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgICAgIGNvbnN0IGdhbWVNb2RlID0gc2VsZWN0b3JzLmFjdGl2ZUdhbWVJZChzdGF0ZSk7XG4gICAgICByZXR1cm4gKGdhbWVNb2RlID09PSBHQU1FX0lEKTtcbiAgICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyQXR0cmlidXRlRXh0cmFjdG9yKDI1LCBtYW5pZmVzdEV4dHJhY3Rvcik7XG5cbiAgY29udGV4dC5yZWdpc3RlclRhYmxlQXR0cmlidXRlKCdtb2RzJywge1xuICAgIGlkOiAnc2R2LWNvbXBhdGliaWxpdHknLFxuICAgIHBvc2l0aW9uOiAxMDAsXG4gICAgY29uZGl0aW9uOiAoKSA9PiBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpID09PSBHQU1FX0lELFxuICAgIHBsYWNlbWVudDogJ3RhYmxlJyxcbiAgICBjYWxjOiAobW9kOiB0eXBlcy5JTW9kKSA9PiBtb2QuYXR0cmlidXRlcz8uY29tcGF0aWJpbGl0eVN0YXR1cyxcbiAgICBjdXN0b21SZW5kZXJlcjogKG1vZDogdHlwZXMuSU1vZCwgZGV0YWlsQ2VsbDogYm9vbGVhbiwgdDogdHlwZXMuVEZ1bmN0aW9uKSA9PiB7XG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChDb21wYXRpYmlsaXR5SWNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdCwgbW9kLCBkZXRhaWxDZWxsIH0sIFtdKTtcbiAgICB9LFxuICAgIG5hbWU6ICdDb21wYXRpYmlsaXR5JyxcbiAgICBpc0RlZmF1bHRWaXNpYmxlOiB0cnVlLFxuICAgIGVkaXQ6IHt9LFxuICB9KTtcblxuICAvKlxuICBjb250ZXh0LnJlZ2lzdGVyVGVzdCgnc2R2LW1pc3NpbmctZGVwZW5kZW5jaWVzJywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXG4gICAgKCkgPT4gdGVzdE1pc3NpbmdEZXBlbmRlbmNpZXMoY29udGV4dC5hcGksIGRlcGVuZGVuY3lNYW5hZ2VyKSk7XG4gICovXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCdzZHYtaW5jb21wYXRpYmxlLW1vZHMnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcbiAgICAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKHRlc3RTTUFQSU91dGRhdGVkKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlcikpKTtcblxuICBjb250ZXh0Lm9uY2UoKCkgPT4ge1xuICAgIGNvbnN0IHByb3h5ID0gbmV3IFNNQVBJUHJveHkoY29udGV4dC5hcGkpO1xuICAgIGNvbnRleHQuYXBpLnNldFN0eWxlc2hlZXQoJ3NkdicsIHBhdGguam9pbihfX2Rpcm5hbWUsICdzZHZzdHlsZS5zY3NzJykpO1xuXG4gICAgY29udGV4dC5hcGkuYWRkTWV0YVNlcnZlcignc21hcGkuaW8nLCB7XG4gICAgICB1cmw6ICcnLFxuICAgICAgbG9vcGJhY2tDQjogKHF1ZXJ5OiBJUXVlcnkpID0+IHtcbiAgICAgICAgcmV0dXJuIEJsdWViaXJkLnJlc29sdmUocHJveHkuZmluZChxdWVyeSkpXG4gICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBsb29rIHVwIHNtYXBpIG1ldGEgaW5mbycsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgICAgIHJldHVybiBCbHVlYmlyZC5yZXNvbHZlKFtdKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBjYWNoZUR1cmF0aW9uU2VjOiA4NjQwMCxcbiAgICAgIHByaW9yaXR5OiAyNSxcbiAgICB9KTtcbiAgICBkZXBlbmRlbmN5TWFuYWdlciA9IG5ldyBEZXBlbmRlbmN5TWFuYWdlcihjb250ZXh0LmFwaSk7XG4gICAgY29udGV4dC5hcGkub25Bc3luYygnYWRkZWQtZmlsZXMnLCAocHJvZmlsZUlkOiBzdHJpbmcsIGZpbGVzOiBhbnlbXSkgPT4gb25BZGRlZEZpbGVzKGNvbnRleHQuYXBpLCBwcm9maWxlSWQsIGZpbGVzKSBhcyBhbnkpO1xuXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnd2lsbC1lbmFibGUtbW9kcycsIChwcm9maWxlSWQ6IHN0cmluZywgbW9kSWRzOiBzdHJpbmdbXSwgZW5hYmxlZDogYm9vbGVhbiwgb3B0aW9uczogYW55KSA9PiBvbldpbGxFbmFibGVNb2RzKGNvbnRleHQuYXBpLCBwcm9maWxlSWQsIG1vZElkcywgZW5hYmxlZCwgb3B0aW9ucykgYXMgYW55KTtcblxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2RpZC1kZXBsb3knLCBhc3luYyAocHJvZmlsZUlkKSA9PiB7XG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKGNvbnRleHQuYXBpKTtcbiAgICAgIGNvbnN0IHByaW1hcnlUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2ludGVyZmFjZScsICdwcmltYXJ5VG9vbCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xuICAgICAgaWYgKHNtYXBpTW9kICYmIHByaW1hcnlUb29sID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRQcmltYXJ5VG9vbChHQU1FX0lELCAnc21hcGknKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9KVxuXG4gICAgY29udGV4dC5hcGkub25Bc3luYygnZGlkLXB1cmdlJywgYXN5bmMgKHByb2ZpbGVJZCkgPT4ge1xuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgICAgIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZChjb250ZXh0LmFwaSk7XG4gICAgICBjb25zdCBwcmltYXJ5VG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdpbnRlcmZhY2UnLCAncHJpbWFyeVRvb2wnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgICAgIGlmIChzbWFwaU1vZCAmJiBwcmltYXJ5VG9vbCA9PT0gJ3NtYXBpJykge1xuICAgICAgICBjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldFByaW1hcnlUb29sKEdBTUVfSUQsIHVuZGVmaW5lZCkpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSk7XG5cbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2RpZC1pbnN0YWxsLW1vZCcsIChnYW1lSWQ6IHN0cmluZywgYXJjaGl2ZUlkOiBzdHJpbmcsIG1vZElkOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChnYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdXBkYXRlQ29uZmxpY3RJbmZvKGNvbnRleHQuYXBpLCBwcm94eSwgZ2FtZUlkLCBtb2RJZClcbiAgICAgICAgLnRoZW4oKCkgPT4gbG9nKCdkZWJ1ZycsICdhZGRlZCBjb21wYXRpYmlsaXR5IGluZm8nLCB7IG1vZElkIH0pKVxuICAgICAgICAuY2F0Y2goZXJyID0+IGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIGFkZCBjb21wYXRpYmlsaXR5IGluZm8nLCB7IG1vZElkLCBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xuXG4gICAgfSk7XG5cbiAgICBjb250ZXh0LmFwaS5ldmVudHMub24oJ2dhbWVtb2RlLWFjdGl2YXRlZCcsIChnYW1lTW9kZTogc3RyaW5nKSA9PiB7XG4gICAgICBpZiAoZ2FtZU1vZGUgIT09IEdBTUVfSUQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gICAgICBsb2coJ2RlYnVnJywgJ3VwZGF0aW5nIFNEViBjb21wYXRpYmlsaXR5IGluZm8nKTtcbiAgICAgIFByb21pc2UuYWxsKE9iamVjdC5rZXlzKHN0YXRlLnBlcnNpc3RlbnQubW9kc1tnYW1lTW9kZV0gPz8ge30pLm1hcChtb2RJZCA9PlxuICAgICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lTW9kZSwgbW9kSWQpKSlcbiAgICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICAgIGxvZygnZGVidWcnLCAnZG9uZSB1cGRhdGluZyBjb21wYXRpYmlsaXR5IGluZm8nKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gdXBkYXRlIGNvbmZsaWN0IGluZm8nLCBlcnIubWVzc2FnZSk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgaW5pdDtcbiJdfQ==