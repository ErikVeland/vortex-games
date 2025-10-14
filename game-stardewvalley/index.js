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
const React = __importStar(require("react"));
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
        this.queryPath = (0, util_1.toBlue)(() => __awaiter(this, void 0, void 0, function* () {
            const game = yield vortex_api_1.util.GameStoreHelper.findByAppId(['413150', '1453375253', 'ConcernedApe.StardewValleyPC']);
            if (game)
                return game.gamePath;
            for (const defaultPath of this.defaultPaths) {
                if (yield this.getPathExistsAsync(defaultPath))
                    return defaultPath;
            }
        }));
        this.setup = (0, util_1.toBlue)((discovery) => __awaiter(this, void 0, void 0, function* () {
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
                return instPath.value;
            }
            catch (err) {
                return undefined;
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
    return Promise.resolve({ supported, requiredFiles: [] });
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
    return Promise.resolve({ instructions });
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
    return Promise.resolve({ supported, requiredFiles: [] });
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
        return Promise.all(mods.map(mod => {
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
        }));
    });
}
function isSMAPIModType(instructions) {
    const smapiData = instructions.find(inst => (inst.type === 'copy') && inst.source.endsWith(SMAPI_EXE));
    return Promise.resolve(smapiData !== undefined);
}
function testSMAPI(files, gameId) {
    const supported = (gameId === GAME_ID) && (files.find(file => path.basename(file) === SMAPI_DLL) !== undefined);
    return Promise.resolve({
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
            return Promise.resolve();
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
    ;
    const manifestExtractor = (0, util_1.toBlue)((modInfo, modPath) => __awaiter(this, void 0, void 0, function* () {
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
    context.registerInstaller('smapi-installer', 30, (0, util_1.toBlue)(testSMAPI), (0, util_1.toBlue)((files, dest) => Promise.resolve(installSMAPI(getDiscoveryPath, files, dest))));
    context.registerInstaller('sdvrootfolder', 50, (0, util_1.toBlue)(testRootFolder), (0, util_1.toBlue)(installRootFolder));
    context.registerInstaller('stardew-valley-installer', 50, (0, util_1.toBlue)(testSupported), (0, util_1.toBlue)((files, destinationPath) => __awaiter(this, void 0, void 0, function* () {
        const instructionArrays = yield install(context.api, dependencyManager, files, destinationPath);
        const instructions = instructionArrays.flat();
        return { instructions };
    })));
    context.registerModType('SMAPI', 30, gameId => gameId === GAME_ID, getSMAPIPath, (0, util_1.toBlue)(isSMAPIModType));
    context.registerModType(MOD_TYPE_CONFIG, 30, (gameId) => (gameId === GAME_ID), () => path.join(getDiscoveryPath(), (0, util_1.defaultModsRelPath)()), (0, util_1.toBlue)(() => Promise.resolve(false)));
    context.registerModType('sdvrootfolder', 25, (gameId) => (gameId === GAME_ID), () => getDiscoveryPath(), (0, util_1.toBlue)((instructions) => {
        const copyInstructions = instructions.filter(instr => instr.type === 'copy');
        const hasManifest = copyInstructions.find(instr => instr.destination.endsWith(MANIFEST_FILE));
        const hasModsFolder = copyInstructions.find(instr => instr.destination.startsWith((0, util_1.defaultModsRelPath)() + path.sep)) !== undefined;
        const hasContentFolder = copyInstructions.find(instr => instr.destination.startsWith('Content' + path.sep)) !== undefined;
        return (hasManifest)
            ? Promise.resolve(hasContentFolder && hasModsFolder)
            : Promise.resolve(hasContentFolder);
    }));
    (0, configMod_1.registerConfigMod)(context);
    context.registerAction('mod-icons', 999, 'changelog', {}, 'SMAPI Log', () => { onShowSMAPILog(context.api); }, () => {
        const state = context.api.store.getState();
        const gameMode = vortex_api_1.selectors.activeGameId(state);
        return (gameMode === GAME_ID);
    });
    context.registerAttributeExtractor(25, (0, util_1.toBlue)(manifestExtractor));
    context.registerTableAttribute('mods', {
        id: 'sdv-compatibility',
        position: 100,
        condition: () => vortex_api_1.selectors.activeGameId(context.api.getState()) === GAME_ID,
        placement: 'table',
        calc: (mod) => { var _a; return (_a = mod.attributes) === null || _a === void 0 ? void 0 : _a.compatibilityStatus; },
        customRenderer: (mod, detailCell, t) => {
            return React.createElement(CompatibilityIcon_1.default, { t, mod, detailCell }, []);
        },
        name: 'Compatibility',
        isDefaultVisible: true,
        edit: {},
    });
    context.registerTest('sdv-incompatible-mods', 'gamemode-activated', (0, util_1.toBlue)(() => Promise.resolve((0, tests_1.testSMAPIOutdated)(context.api, dependencyManager))));
    context.once(() => {
        const proxy = new smapiProxy_1.default(context.api);
        context.api.setStylesheet('sdv', path.join(__dirname, 'sdvstyle.scss'));
        context.api.addMetaServer('smapi.io', {
            url: '',
            loopbackCB: (0, util_1.toBlue)((query) => {
                return Promise.resolve(proxy.find(query))
                    .catch(err => {
                    (0, vortex_api_1.log)('error', 'failed to look up smapi meta info', err.message);
                    return Promise.resolve([]);
                });
            }),
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdBLDZDQUErQjtBQUMvQiwrQ0FBaUM7QUFDakMsMERBQWtDO0FBQ2xDLDJDQUFzRTtBQUN0RSx5REFBdUQ7QUFHdkQsTUFBTSxNQUFNLEdBQUcsSUFBQSxvQkFBUyxHQUFFLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7QUFDcEUsNEVBQW9EO0FBQ3BELDJDQUFvRDtBQUVwRCw0RUFBb0Q7QUFDcEQsMERBQXFDO0FBQ3JDLDhEQUFzQztBQUN0QyxtQ0FBNEM7QUFDNUMsbUNBQW1IO0FBQ25ILGlDQUFtRTtBQUVuRSwwREFBa0M7QUFFbEMsdUNBQTRDO0FBRTVDLDJDQUErRjtBQUUvRixNQUFNLElBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQzFCLEVBQUUsU0FBUyxFQUFFLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUNuQyxLQUFLLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUMvQixFQUFFLFFBQVEsRUFBRSxHQUFHLGlCQUFJLEVBQ25CLEVBQUUsV0FBVyxFQUFFLGFBQWEsRUFBRSxZQUFZLEVBQUUsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQ2pFLEVBQUUsT0FBTyxFQUFFLG1CQUFtQixFQUFFLGNBQWMsRUFBRSxlQUFlLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFMUYsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDO0FBQ3RDLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDckQsTUFBTSxTQUFTLEdBQUcsdUJBQXVCLENBQUM7QUFDMUMsTUFBTSxTQUFTLEdBQUcscUJBQXFCLENBQUM7QUFDeEMsTUFBTSxVQUFVLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUsxRCxNQUFNLGFBQWE7SUFxQ2pCLFlBQVksT0FBZ0M7UUFuQ3JDLE9BQUUsR0FBVyxPQUFPLENBQUM7UUFDckIsU0FBSSxHQUFXLGdCQUFnQixDQUFDO1FBQ2hDLFNBQUksR0FBVyxhQUFhLENBQUM7UUFFN0IsZ0JBQVcsR0FBOEI7WUFDOUMsVUFBVSxFQUFFLFFBQVE7U0FDckIsQ0FBQztRQUNLLFlBQU8sR0FBMkI7WUFDdkMsVUFBVSxFQUFFLE1BQU07U0FDbkIsQ0FBQztRQUNLLG1CQUFjLEdBQVU7WUFDN0I7Z0JBQ0UsRUFBRSxFQUFFLE9BQU87Z0JBQ1gsSUFBSSxFQUFFLE9BQU87Z0JBQ2IsSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLFVBQVUsRUFBRSxHQUFHLEVBQUUsQ0FBQyxTQUFTO2dCQUMzQixhQUFhLEVBQUUsQ0FBQyxTQUFTLENBQUM7Z0JBQzFCLEtBQUssRUFBRSxJQUFJO2dCQUNYLFNBQVMsRUFBRSxJQUFJO2dCQUNmLFFBQVEsRUFBRSxJQUFJO2dCQUNkLGNBQWMsRUFBRSxJQUFJO2FBQ3JCO1NBQ0YsQ0FBQztRQUNLLGNBQVMsR0FBWSxJQUFJLENBQUM7UUFDMUIsb0JBQWUsR0FBWSxJQUFJLENBQUM7UUFDaEMsVUFBSyxHQUFZLE9BQU8sQ0FBQyxRQUFRLEtBQUssT0FBTyxDQUFDO1FBNEM5QyxjQUFTLEdBQUcsSUFBQSxhQUFNLEVBQUMsR0FBUyxFQUFFO1lBRW5DLE1BQU0sSUFBSSxHQUFHLE1BQU0saUJBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxFQUFFLFlBQVksRUFBRSw4QkFBOEIsQ0FBQyxDQUFDLENBQUM7WUFDOUcsSUFBSSxJQUFJO2dCQUNOLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQztZQUd2QixLQUFLLE1BQU0sV0FBVyxJQUFJLElBQUksQ0FBQyxZQUFZLEVBQzNDLENBQUM7Z0JBQ0MsSUFBSSxNQUFNLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxXQUFXLENBQUM7b0JBQzVDLE9BQU8sV0FBVyxDQUFDO1lBQ3ZCLENBQUM7UUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDO1FBZ0NJLFVBQUssR0FBRyxJQUFBLGFBQU0sRUFBQyxDQUFPLFNBQWlDLEVBQUUsRUFBRTtZQUVoRSxJQUFJLENBQUM7Z0JBQ0gsTUFBTSxlQUFFLENBQUMsc0JBQXNCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLElBQUEseUJBQWtCLEdBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkYsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdCLENBQUM7WUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDdkQsTUFBTSxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDNUQsSUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUNoQixJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDeEIsQ0FBQztZQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBd0I1QyxDQUFDLENBQUEsQ0FBQyxDQUFDO1FBbEhELElBQUksQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQ3ZCLElBQUksQ0FBQyxhQUFhLEdBQUcsT0FBTyxDQUFDLFFBQVEsSUFBSSxPQUFPO1lBQzlDLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDO1lBQ3hCLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBRzNDLElBQUksQ0FBQyxZQUFZLEdBQUc7WUFFbEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsZ0NBQWdDO1lBQ25ELE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLHFEQUFxRDtZQUd4RSxpREFBaUQ7WUFDakQsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsbUZBQW1GO1lBR3RHLDhEQUE4RDtZQUM5RCw0REFBNEQ7WUFDNUQsbUVBQW1FO1NBQ3BFLENBQUM7SUFDSixDQUFDO0lBZ0NNLFVBQVU7UUFDZixPQUFPLE9BQU8sQ0FBQyxRQUFRLElBQUksT0FBTztZQUNoQyxDQUFDLENBQUMsb0JBQW9CO1lBQ3RCLENBQUMsQ0FBQyxlQUFlLENBQUM7SUFDdEIsQ0FBQztJQVNNLFlBQVk7UUFFakIsT0FBTyxJQUFBLHlCQUFrQixHQUFFLENBQUM7SUFDOUIsQ0FBQztJQWdETyxjQUFjO1FBQ3BCLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsdUJBQXVCLENBQUMsQ0FBQyxDQUFDLHdCQUF3QixDQUFDO1FBQzVFLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUM7UUFDdEQsTUFBTSxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsQ0FBQyxRQUFRO1lBQzVCLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUM7WUFDL0IsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ2pDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBRXJFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDO1lBQ2hDLEVBQUUsRUFBRSxlQUFlO1lBQ25CLElBQUksRUFBRSxTQUFTO1lBQ2YsS0FBSztZQUNMLE9BQU8sRUFBRSwwQ0FBMEM7WUFDbkQsT0FBTyxFQUFFO2dCQUNQO29CQUNFLEtBQUssRUFBRSxXQUFXO29CQUNsQixNQUFNO2lCQUNQO2FBQ0Y7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0lBVWEsa0JBQWtCLENBQUMsSUFBWTs7WUFDM0MsSUFBSSxDQUFDO2dCQUNILE1BQU0sZUFBRSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDekIsT0FBTyxJQUFJLENBQUM7WUFDZCxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDYixPQUFPLEtBQUssQ0FBQztZQUNmLENBQUM7UUFDSCxDQUFDO0tBQUE7SUFRYSxvQkFBb0IsQ0FBQyxJQUFZLEVBQUUsR0FBVyxFQUFFLElBQVk7O1lBQ3hFLElBQUksQ0FBQztnQkFDSCxNQUFNLFFBQVEsR0FBRyxDQUFDLElBQUEsb0JBQVMsR0FBRSxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztnQkFDdEYsSUFBSSxDQUFDLFFBQVEsRUFBRSxDQUFDO29CQUNkLE1BQU0sSUFBSSxLQUFLLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDeEMsQ0FBQztnQkFDRCxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUM7WUFDeEIsQ0FBQztZQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7Z0JBQ2IsT0FBTyxTQUFTLENBQUM7WUFDbkIsQ0FBQztRQUNILENBQUM7S0FBQTtDQUNGO0FBRUQsU0FBUyxjQUFjLENBQUMsS0FBZSxFQUFFLE1BQWM7SUFHckQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzNELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDM0MsTUFBTSxVQUFVLEdBQUcsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQztJQUN0RSxNQUFNLFNBQVMsR0FBRyxDQUFDLENBQUMsTUFBTSxLQUFLLE9BQU8sQ0FBQztXQUNsQyxDQUFDLFVBQVUsS0FBSyxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBRWpDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBQyxLQUFlLEVBQUUsZUFBdUI7SUFNakUsTUFBTSxXQUFXLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO0lBQzFGLE1BQU0sR0FBRyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ2xELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM3RCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7V0FDekQsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1dBQzlCLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBQ3RDLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDdkMsT0FBTztZQUNMLElBQUksRUFBRSxNQUFNO1lBQ1osTUFBTSxFQUFFLElBQUk7WUFDWixXQUFXLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUM7U0FDOUIsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUFDO0lBRUgsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsWUFBWSxFQUFFLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsUUFBZ0I7SUFDdkMsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEQsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssYUFBYSxDQUFDO0lBQ3ZFLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDN0MsT0FBTyxjQUFjLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDckMsQ0FBQztBQUVELFNBQVMsYUFBYSxDQUFDLEtBQWUsRUFBRSxNQUFjO0lBQ3BELE1BQU0sU0FBUyxHQUFHLENBQUMsTUFBTSxLQUFLLE9BQU8sQ0FBQztXQUNqQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssU0FBUyxDQUFDO1dBQzNDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUlwQixNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUM1QyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDO1FBQzNDLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDO0lBQ3BCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRUQsU0FBZSxPQUFPLENBQUMsR0FBRyxFQUNILGlCQUFpQixFQUNqQixLQUFLLEVBQ0wsZUFBZTs7UUFHcEMsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztRQVNwRCxJQUFJLFVBQWlCLENBQUM7UUFFdEIsTUFBTSxpQkFBaUIsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUMsSUFBSSxJQUFJLEdBQWUsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBTSxZQUFZLEVBQUMsRUFBRTtZQUM5RSxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQzlDLE1BQU0sWUFBWSxHQUFHLFVBQVUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzlELE1BQU0sYUFBYSxHQUFHLFlBQVksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDeEUsTUFBTSxVQUFVLEdBQUcsQ0FBQyxJQUFZLEVBQUUsRUFBRTtnQkFDbEMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUM7Z0JBQ3BGLE1BQU0sWUFBWSxHQUFHLElBQUksQ0FBQyxXQUFXLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUN4RCxNQUFNLGNBQWMsR0FBRyxDQUFDLFlBQVksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO29CQUM5QyxDQUFDLENBQUMsQ0FBQSxZQUFZLGFBQVosWUFBWSx1QkFBWixZQUFZLENBQUcsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsTUFBSyxZQUFZLENBQUMsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7b0JBQ25GLENBQUMsQ0FBQyxJQUFJLENBQUM7Z0JBQ1QsT0FBTyxjQUFjLElBQUksTUFBTSxDQUFDO1lBQ2xDLENBQUMsQ0FBQztZQUNGLElBQUksQ0FBQztnQkFDSCxNQUFNLFFBQVEsR0FDWixNQUFNLElBQUEsb0JBQWEsRUFBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsRUFBRSxZQUFZLENBQUMsQ0FBQyxDQUFDO2dCQUNoRSxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO2dCQUMxQyxPQUFPO29CQUNMLFFBQVE7b0JBQ1IsVUFBVTtvQkFDVixhQUFhO29CQUNiLFFBQVE7aUJBQ1QsQ0FBQztZQUNKLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUViLElBQUEsZ0JBQUcsRUFBQyxNQUFNLEVBQUUsMEJBQTBCLEVBQUUsRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDO2dCQUM5RSxVQUFVLEdBQUcsR0FBRyxDQUFDO2dCQUNqQixPQUFPLFNBQVMsQ0FBQztZQUNuQixDQUFDO1FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFDO1FBRUosSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUM7UUFFekMsSUFBSSxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3RCLEdBQUcsQ0FBQyxxQkFBcUIsQ0FDdkIsMkhBQTJILEVBQzNILFVBQVUsRUFBRTtnQkFDWixXQUFXLEVBQUUsS0FBSzthQUNuQixDQUFDLENBQUM7UUFDTCxDQUFDO1FBRUQsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUU7O1lBR2hDLE1BQU0sT0FBTyxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsS0FBSyxHQUFHLENBQUM7Z0JBQ3RDLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVTtnQkFDaEIsQ0FBQyxDQUFDLE1BQUEsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLG1DQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUM7WUFFeEMsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7Z0JBQzFCLE9BQU8sRUFBRSxDQUFDO1lBQ1osQ0FBQztZQUVELE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsWUFBWSxJQUFJLEVBQUUsQ0FBQztZQUVyRCxNQUFNLFlBQVksR0FBeUIsRUFBRSxDQUFDO1lBRTlDLEtBQUssTUFBTSxJQUFJLElBQUksR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUNoQyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO2dCQUN2RSxZQUFZLENBQUMsSUFBSSxDQUFDO29CQUNoQixJQUFJLEVBQUUsTUFBTTtvQkFDWixNQUFNLEVBQUUsSUFBSTtvQkFDWixXQUFXLEVBQUUsV0FBVztpQkFDekIsQ0FBQyxDQUFDO1lBQ0wsQ0FBQztZQUVELE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxHQUFtQixFQUFFLEVBQUU7Z0JBQ25ELElBQUksQ0FBQyxHQUFHLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQzt1QkFDekIsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxLQUFLLGlDQUFpQyxDQUFDLEVBQUUsQ0FBQztvQkFDMUUsT0FBTztnQkFDVCxDQUFDO2dCQUVELE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxjQUFjLEtBQUssU0FBUztvQkFDbkQsQ0FBQyxDQUFDLEtBQUssR0FBRyxDQUFDLGNBQWMsRUFBRTtvQkFDM0IsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFDUixNQUFNLElBQUksR0FBbUI7b0JBSzNCLElBQUksRUFBRSxZQUFZO29CQUNsQixTQUFTLEVBQUU7d0JBQ1QsZUFBZSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFO3dCQUMzQyxZQUFZO3FCQUNiO29CQUNELEtBQUssRUFBRTt3QkFDTCxpQkFBaUIsRUFBRSxJQUFJO3dCQUN2QixTQUFTLEVBQUUsSUFBSTtxQkFDaEI7aUJBQ0YsQ0FBQztnQkFDRixZQUFZLENBQUMsSUFBSSxDQUFDO29CQUNoQixJQUFJLEVBQUUsTUFBTTtvQkFDWixJQUFJO2lCQUNMLENBQUMsQ0FBQztZQUNMLENBQUMsQ0FBQTtZQVdELE9BQU8sWUFBWSxDQUFDO1FBQ3RCLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFTixDQUFDO0NBQUE7QUFFRCxTQUFTLGNBQWMsQ0FBQyxZQUFrQztJQUV4RCxNQUFNLFNBQVMsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFFdkcsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBRUQsU0FBUyxTQUFTLENBQUMsS0FBZSxFQUFFLE1BQWM7SUFFaEQsTUFBTSxTQUFTLEdBQUcsQ0FBQyxNQUFNLEtBQUssT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQzNELElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssU0FBUyxDQUFDLEtBQUssU0FBUyxDQUFDLENBQUM7SUFDcEQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ25CLFNBQVM7UUFDVCxhQUFhLEVBQUUsRUFBRTtLQUNwQixDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBZSxZQUFZLENBQUMsZ0JBQThCLEVBQUUsS0FBZSxFQUFFLGVBQXVCOztRQUNsRyxNQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsUUFBUSxLQUFLLE9BQU87WUFDekMsQ0FBQyxDQUFDLFNBQVM7WUFDWCxDQUFDLENBQUMsT0FBTyxDQUFDLFFBQVEsS0FBSyxPQUFPO2dCQUM1QixDQUFDLENBQUMsT0FBTztnQkFDVCxDQUFDLENBQUMsT0FBTyxDQUFDO1FBQ2QsTUFBTSxzQkFBc0IsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3RDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO1lBQ3BFLE9BQU8sQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDckMsQ0FBQyxDQUFBO1FBRUQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNqQyxNQUFNLGlCQUFpQixHQUFHLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3ZELE9BQU8saUJBQWlCLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUE7UUFDcEYsQ0FBQyxDQUFDLENBQUM7UUFDSCxJQUFJLFFBQVEsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUMzQixPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsSUFBSSxpQkFBSSxDQUFDLFdBQVcsQ0FBQyx5REFBeUQ7a0JBQ2hHLHlEQUF5RCxDQUFDLENBQUMsQ0FBQztRQUNsRSxDQUFDO1FBQ0QsSUFBSSxJQUFJLEdBQUcsRUFBRSxDQUFDO1FBQ2QsSUFBSSxDQUFDO1lBQ0gsSUFBSSxHQUFHLE1BQU0sZUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsMEJBQTBCLENBQUMsRUFBRSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ2pILENBQUM7UUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO1lBQ2IsSUFBQSxnQkFBRyxFQUFDLE9BQU8sRUFBRSxrQ0FBa0MsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUN4RCxDQUFDO1FBR0QsTUFBTSxZQUFZLEdBQUcsRUFBRSxDQUFDO1FBRXhCLE1BQU0sSUFBSSxHQUFHLElBQUksUUFBUSxFQUFFLENBQUM7UUFFNUIsTUFBTSxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLFFBQVEsQ0FBQyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBRzlFLE1BQU0saUJBQUksQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO1lBQzdDLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRXJELElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsT0FBTyxHQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQUUsWUFBWSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUNoSCxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdELE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDL0MsSUFBSSxDQUFDLGFBQWEsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxhQUFhLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQztnQkFDcEUsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4RCxDQUFDO1lBQ0QsT0FBTyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDN0IsQ0FBQyxDQUFDLENBQUM7UUFHSCxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ2pHLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBQzNCLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLGlCQUFJLENBQUMsV0FBVyxDQUFDLHFCQUFxQixTQUFTLHNCQUFzQjtrQkFDM0YseURBQXlELENBQUMsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFDRCxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUd0RCxNQUFNLFlBQVksR0FBeUIsWUFBWSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMvRCxPQUFPO2dCQUNILElBQUksRUFBRSxNQUFNO2dCQUNaLE1BQU0sRUFBRSxJQUFJO2dCQUNaLFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7YUFDM0MsQ0FBQTtRQUNMLENBQUMsQ0FBQyxDQUFDO1FBRUgsWUFBWSxDQUFDLElBQUksQ0FBQztZQUNoQixJQUFJLEVBQUUsV0FBVztZQUNqQixHQUFHLEVBQUUsa0JBQWtCO1lBQ3ZCLEtBQUssRUFBRSxjQUFjLEVBQUU7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsWUFBWSxDQUFDLElBQUksQ0FBQztZQUNoQixJQUFJLEVBQUUsY0FBYztZQUNwQixJQUFJO1lBQ0osV0FBVyxFQUFFLDZCQUE2QjtTQUMzQyxDQUFDLENBQUM7UUFFSCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxZQUFZLEVBQUUsQ0FBQyxDQUFDO0lBQzNDLENBQUM7Q0FBQTtBQUVELFNBQWUsWUFBWSxDQUFDLEdBQXdCLEVBQUUsUUFBZ0IsRUFBRSxPQUFlOztRQUNyRixNQUFNLE9BQU8sR0FBRyxNQUFNLGVBQUUsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLENBQUMsQ0FBQztRQUM1RixNQUFNLEdBQUcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLFdBQVcsRUFBRTtZQUN4QyxJQUFJLEVBQUUsb0pBQW9KO2dCQUN4Siw0SkFBNEosR0FBRyxPQUFPO1NBQ3pLLEVBQUUsQ0FBQztnQkFDRixLQUFLLEVBQUUsa0JBQWtCLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRTtvQkFDdEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUM7b0JBQzNFLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxTQUFTLHdDQUF3QyxpQkFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLE9BQU8sS0FBSyxHQUFHLE9BQU8sQ0FBQyxDQUFDO29CQUN2SCxPQUFPLGlCQUFJLENBQUMsR0FBRyxDQUFDLHNCQUFzQixDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ2xFLENBQUM7YUFDRixFQUFFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQ25ELENBQUM7Q0FBQTtBQUVELFNBQWUsY0FBYyxDQUFDLEdBQXdCOztRQUVwRCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLGlCQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFLGVBQWUsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUN4RixJQUFJLENBQUM7WUFFSCxNQUFNLFlBQVksQ0FBQyxHQUFHLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDdkQsQ0FBQztRQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7WUFDYixJQUFJLENBQUM7Z0JBRUgsTUFBTSxZQUFZLENBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDO1lBQ3hELENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUViLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLHNCQUFzQixFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDdEcsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0NBQUE7QUFFRCxTQUFTLGVBQWUsQ0FBQyxPQUFnQjtJQUN2QyxNQUFNLFNBQVMsR0FBYSxFQUFFLENBQUM7SUFFL0IsSUFBSSxPQUFPLEtBQUssU0FBUyxFQUFFLENBQUM7UUFDMUIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBQzdCLENBQUM7SUFFRCxPQUFPLElBQUEsbUJBQVMsRUFBQyxPQUFPLEVBQUUsQ0FBTSxPQUFPLEVBQUMsRUFBRTtRQUN4QyxLQUFLLE1BQU0sS0FBSyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQzVCLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQUssZUFBZSxFQUFFLENBQUM7Z0JBQ3RELFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2pDLENBQUM7UUFDSCxDQUFDO0lBQ0gsQ0FBQyxDQUFBLEVBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQztTQUM5RSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDM0IsQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQUMsR0FBd0IsRUFDeEIsS0FBaUIsRUFDakIsTUFBYyxFQUNkLEtBQWE7O0lBRXZDLE1BQU0sR0FBRyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRTFELElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO1FBQ3RCLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQzNCLENBQUM7SUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFFdkIsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLE1BQUEsTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxjQUFjLG1DQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsaUNBQXFCLEVBQUUsQ0FBQztRQUMxRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUMzQixDQUFDO0lBRUQsSUFBSSwwQkFBMEIsR0FBRyxNQUFBLEdBQUcsQ0FBQyxVQUFVLDBDQUFFLDBCQUEwQixDQUFDO0lBQzVFLElBQUksQ0FBQywwQkFBMEIsRUFBRSxDQUFDO1FBQ2hDLElBQUksTUFBQSxHQUFHLENBQUMsVUFBVSwwQ0FBRSxlQUFlLEVBQUUsQ0FBQztZQUNwQywwQkFBMEIsR0FBRyxDQUFDLE1BQUEsR0FBRyxDQUFDLFVBQVUsMENBQUUsZUFBZSxDQUFDLENBQUM7UUFDakUsQ0FBQzthQUFNLENBQUM7WUFDTiwwQkFBMEIsR0FBRyxFQUFFLENBQUM7UUFDbEMsQ0FBQztJQUNILENBQUM7SUFFRCxNQUFNLEtBQUssR0FBRywwQkFBMEI7U0FDckMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFOztRQUNWLE1BQU0sR0FBRyxHQUFHO1lBQ1YsRUFBRSxFQUFFLElBQUk7U0FDVCxDQUFDO1FBQ0YsTUFBTSxHQUFHLEdBQUcsTUFBQSxNQUFBLEdBQUcsQ0FBQyxVQUFVLDBDQUFFLGVBQWUsbUNBQ3pCLE1BQUEsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFBLEdBQUcsQ0FBQyxVQUFVLDBDQUFFLE9BQU8sQ0FBQywwQ0FBRSxPQUFPLENBQUM7UUFDbEUsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7WUFDVixHQUFHLENBQUMsa0JBQWtCLENBQUMsR0FBRyxHQUFHLENBQUM7UUFDaEMsQ0FBQztRQUVELE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQyxDQUFDLENBQUM7SUFFTCxNQUFNLElBQUksR0FBRyxDQUFDLElBQWtCLEVBQXVCLEVBQUU7O1FBQ3ZELE1BQU0sTUFBTSxHQUFHLE1BQUEsTUFBQSxNQUFBLElBQUksQ0FBQyxRQUFRLDBDQUFFLG1CQUFtQiwwQ0FBRSxXQUFXLGtEQUFJLENBQUM7UUFDbkUsSUFBSSxDQUFDLDRCQUFvQixDQUFDLFFBQVEsQ0FBQyxNQUFhLENBQUMsRUFBRSxDQUFDO1lBQ2xELE9BQU8sU0FBUyxDQUFDO1FBQ25CLENBQUM7YUFBTSxDQUFDO1lBQ04sT0FBTyxNQUE2QixDQUFDO1FBQ3ZDLENBQUM7SUFDSCxDQUFDLENBQUE7SUFFRCxNQUFNLGlCQUFpQixHQUFHLENBQUMsSUFBa0IsRUFBRSxFQUFFLENBQUMsNEJBQW9CLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRTNGLE9BQU8sS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUM7U0FDNUIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFOztRQUNkLE1BQU0sV0FBVyxHQUFtQixPQUFPO2FBQ3hDLElBQUksQ0FBQyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxHQUFHLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdkUsSUFBSSxXQUFXLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQzNCLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRTtnQkFDekQsY0FBYyxFQUFFLEdBQUc7Z0JBQ25CLG1CQUFtQixFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsbUJBQW1CO2dCQUNoRSxvQkFBb0IsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLG9CQUFvQjtnQkFDbEUsbUJBQW1CLEVBQUUsTUFBQSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSwwQ0FBRSxPQUFPO2FBQzdELENBQUMsQ0FBQyxDQUFDO1FBQ04sQ0FBQzthQUFNLENBQUM7WUFDTixJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1lBQzVCLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNwRixDQUFDO0lBQ0gsQ0FBQyxDQUFDO1NBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ1gsSUFBQSxnQkFBRyxFQUFDLE1BQU0sRUFBRSx3QkFBd0IsRUFBRSxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbkQsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQ3BGLENBQUMsQ0FBQyxDQUFDO0FBQ1AsQ0FBQztBQUVELFNBQVMsSUFBSSxDQUFDLE9BQWdDO0lBQzVDLElBQUksaUJBQW9DLENBQUM7SUFDekMsTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLEVBQUU7UUFDNUIsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDM0MsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUUsT0FBTyxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbEcsSUFBSSxDQUFDLFNBQVMsS0FBSyxTQUFTLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssU0FBUyxDQUFDLEVBQUUsQ0FBQztZQUVoRSxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLGtDQUFrQyxDQUFDLENBQUM7WUFDakQsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQztRQUVELE9BQU8sU0FBUyxDQUFDLElBQUksQ0FBQztJQUN4QixDQUFDLENBQUE7SUFFRCxNQUFNLFlBQVksR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFO1FBQzVCLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzNDLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDOUQsT0FBTyxTQUFTLENBQUMsSUFBSSxDQUFDO0lBQ3hCLENBQUMsQ0FBQztJQUFBLENBQUM7SUFFSCxNQUFNLGlCQUFpQixHQUFHLElBQUEsYUFBTSxFQUM5QixDQUFPLE9BQVksRUFBRSxPQUFnQixFQUFvQyxFQUFFOztRQUN6RSxJQUFJLHNCQUFTLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxPQUFPLEVBQUUsQ0FBQztZQUMvRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDN0IsQ0FBQztRQUVELE1BQU0sU0FBUyxHQUFHLE1BQU0sZUFBZSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRWpELE1BQU0sZUFBZSxHQUFHLENBQUMsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQ3RELENBQU0sUUFBUSxFQUFDLEVBQUU7WUFDZixJQUFJLENBQUM7Z0JBQ0gsT0FBTyxNQUFNLElBQUEsb0JBQWEsRUFBQyxRQUFRLENBQUMsQ0FBQztZQUN2QyxDQUFDO1lBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztnQkFDYixJQUFBLGdCQUFHLEVBQUMsTUFBTSxFQUFFLDBCQUEwQixFQUFFLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBQ3hGLE9BQU8sU0FBUyxDQUFDO1lBQ25CLENBQUM7UUFDSCxDQUFDLENBQUEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLEtBQUssU0FBUyxDQUFDLENBQUM7UUFFbEQsSUFBSSxlQUFlLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ2pDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM3QixDQUFDO1FBR0QsTUFBTSxXQUFXLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRXZDLE1BQU0sMEJBQTBCLEdBQUcsZUFBZTthQUMvQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQzthQUNuRCxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFFcEQsTUFBTSxlQUFlLEdBQUcsZUFBZTthQUNwQyxHQUFHLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUM7YUFDM0MsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUN4QyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRW5ELE1BQU0sTUFBTSxHQUFHO1lBQ2IsMEJBQTBCO1lBQzFCLGVBQWU7U0FDaEIsQ0FBQztRQUVGLElBQUksV0FBVyxLQUFLLFNBQVMsRUFBRSxDQUFDO1lBRTlCLElBQUksQ0FBQSxNQUFBLE1BQUEsTUFBQSxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sMENBQUUsS0FBSywwQ0FBRSxHQUFHLDBDQUFFLEtBQUssTUFBSyxJQUFJLEVBQUUsQ0FBQztnQkFDekQsTUFBTSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQztZQUM5QyxDQUFDO1lBRUQsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLFFBQVEsRUFBRSxDQUFDO2dCQUM5QyxNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1lBQ2xELENBQUM7UUFDSCxDQUFDO1FBRUQsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2pDLENBQUMsQ0FBQSxDQUFDLENBQUM7SUFFTCxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDakQsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsRUFBRSxrQkFBVyxDQUFDLENBQUM7SUFFMUQsT0FBTyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxrQkFBUSxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDaEQsbUJBQW1CLEVBQUUsQ0FBTyxTQUFpQixFQUFFLE9BQWdCLEVBQUUsRUFBRTtZQUNqRSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7Z0JBQ2IsTUFBTSxJQUFBLHlCQUFhLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQztnQkFDNUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLCtDQUErQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzVILENBQUM7WUFDRCxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBQSx5QkFBZSxFQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2hFLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQzNCLENBQUMsQ0FBQTtLQUNGLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLEtBQUssT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBRzNFLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLEVBQUUsSUFBQSxhQUFNLEVBQUMsU0FBUyxDQUFDLEVBQUUsSUFBQSxhQUFNLEVBQUMsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEVBQUUsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDM0osT0FBTyxDQUFDLGlCQUFpQixDQUFDLGVBQWUsRUFBRSxFQUFFLEVBQUUsSUFBQSxhQUFNLEVBQUMsY0FBYyxDQUFDLEVBQUUsSUFBQSxhQUFNLEVBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO0lBQ2xHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQywwQkFBMEIsRUFBRSxFQUFFLEVBQUUsSUFBQSxhQUFNLEVBQUMsYUFBYSxDQUFDLEVBQzdFLElBQUEsYUFBTSxFQUFDLENBQU8sS0FBSyxFQUFFLGVBQWUsRUFBRSxFQUFFO1FBQ3RDLE1BQU0saUJBQWlCLEdBQUcsTUFBTSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxLQUFLLEVBQUUsZUFBZSxDQUFDLENBQUM7UUFFaEcsTUFBTSxZQUFZLEdBQUcsaUJBQWlCLENBQUMsSUFBSSxFQUFFLENBQUM7UUFDOUMsT0FBTyxFQUFFLFlBQVksRUFBRSxDQUFDO0lBQzFCLENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQztJQUVOLE9BQU8sQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sS0FBSyxPQUFPLEVBQUUsWUFBWSxFQUFFLElBQUEsYUFBTSxFQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUM7SUFDekcsT0FBTyxDQUFDLGVBQWUsQ0FBQyxlQUFlLEVBQUUsRUFBRSxFQUFFLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sS0FBSyxPQUFPLENBQUMsRUFDM0UsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxFQUFFLElBQUEseUJBQWtCLEdBQUUsQ0FBQyxFQUFFLElBQUEsYUFBTSxFQUFDLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25HLE9BQU8sQ0FBQyxlQUFlLENBQUMsZUFBZSxFQUFFLEVBQUUsRUFBRSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxNQUFNLEtBQUssT0FBTyxDQUFDLEVBQzNFLEdBQUcsRUFBRSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsSUFBQSxhQUFNLEVBQUMsQ0FBQyxZQUFZLEVBQUUsRUFBRTtRQUVoRCxNQUFNLGdCQUFnQixHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxDQUFDO1FBb0I3RSxNQUFNLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FDaEQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQTtRQUM1QyxNQUFNLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FDbEQsS0FBSyxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsSUFBQSx5QkFBa0IsR0FBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLFNBQVMsQ0FBQztRQUMvRSxNQUFNLGdCQUFnQixHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUNyRCxLQUFLLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDO1FBRXBFLE9BQU8sQ0FBQyxXQUFXLENBQUM7WUFDbEIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLElBQUksYUFBYSxDQUFDO1lBQ3BELENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDeEMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVOLElBQUEsNkJBQWlCLEVBQUMsT0FBTyxDQUFDLENBQUM7SUFDM0IsT0FBTyxDQUFDLGNBQWMsQ0FBQyxXQUFXLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxFQUFFLEVBQUUsV0FBVyxFQUNuRSxHQUFHLEVBQUUsR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUN0QyxHQUFHLEVBQUU7UUFFSCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsQ0FBQztRQUMzQyxNQUFNLFFBQVEsR0FBRyxzQkFBUyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMvQyxPQUFPLENBQUMsUUFBUSxLQUFLLE9BQU8sQ0FBQyxDQUFDO0lBQ2hDLENBQUMsQ0FBQyxDQUFDO0lBRUwsT0FBTyxDQUFDLDBCQUEwQixDQUFDLEVBQUUsRUFBRSxJQUFBLGFBQU0sRUFBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7SUFFbEUsT0FBTyxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRTtRQUNyQyxFQUFFLEVBQUUsbUJBQW1CO1FBQ3ZCLFFBQVEsRUFBRSxHQUFHO1FBQ2IsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLHNCQUFTLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsS0FBSyxPQUFPO1FBQzNFLFNBQVMsRUFBRSxPQUFPO1FBQ2xCLElBQUksRUFBRSxDQUFDLEdBQWUsRUFBRSxFQUFFLFdBQUMsT0FBQSxNQUFBLEdBQUcsQ0FBQyxVQUFVLDBDQUFFLG1CQUFtQixDQUFBLEVBQUE7UUFDOUQsY0FBYyxFQUFFLENBQUMsR0FBZSxFQUFFLFVBQW1CLEVBQUUsQ0FBa0IsRUFBRSxFQUFFO1lBQzNFLE9BQU8sS0FBSyxDQUFDLGFBQWEsQ0FBQywyQkFBaUIsRUFDakIsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ3pELENBQUM7UUFDRCxJQUFJLEVBQUUsZUFBZTtRQUNyQixnQkFBZ0IsRUFBRSxJQUFJO1FBQ3RCLElBQUksRUFBRSxFQUFFO0tBQ1QsQ0FBQyxDQUFDO0lBTUgsT0FBTyxDQUFDLFlBQVksQ0FBQyx1QkFBdUIsRUFBRSxvQkFBb0IsRUFDaEUsSUFBQSxhQUFNLEVBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFBLHlCQUFpQixFQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVwRixPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRTtRQUNoQixNQUFNLEtBQUssR0FBRyxJQUFJLG9CQUFVLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQzFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxlQUFlLENBQUMsQ0FBQyxDQUFDO1FBRXhFLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLFVBQVUsRUFBRTtZQUNwQyxHQUFHLEVBQUUsRUFBRTtZQUNQLFVBQVUsRUFBRSxJQUFBLGFBQU0sRUFBQyxDQUFDLEtBQWEsRUFBRSxFQUFFO2dCQUNuQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDdEMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUNYLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsbUNBQW1DLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO29CQUMvRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQzdCLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDO1lBQ0YsZ0JBQWdCLEVBQUUsS0FBSztZQUN2QixRQUFRLEVBQUUsRUFBRTtTQUNiLENBQUMsQ0FBQztRQUNILGlCQUFpQixHQUFHLElBQUksMkJBQWlCLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZELE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxDQUFDLFNBQWlCLEVBQUUsS0FBWSxFQUFFLEVBQUUsQ0FBQyxJQUFBLHdCQUFZLEVBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFRLENBQUMsQ0FBQztRQUU1SCxPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxDQUFDLFNBQWlCLEVBQUUsTUFBZ0IsRUFBRSxPQUFnQixFQUFFLE9BQVksRUFBRSxFQUFFLENBQUMsSUFBQSw0QkFBZ0IsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sQ0FBUSxDQUFDLENBQUM7UUFFNUwsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQU8sU0FBUyxFQUFFLEVBQUU7WUFDcEQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQyxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDeEQsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssT0FBTyxFQUFFLENBQUM7Z0JBQ2hDLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzNCLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sV0FBVyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLE9BQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RHLElBQUksUUFBUSxJQUFJLFdBQVcsS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDMUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQixDQUFDLENBQUEsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQU8sU0FBUyxFQUFFLEVBQUU7WUFDbkQsTUFBTSxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztZQUNyQyxNQUFNLE9BQU8sR0FBRyxzQkFBUyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7WUFDeEQsSUFBSSxDQUFBLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNLE1BQUssT0FBTyxFQUFFLENBQUM7Z0JBQ2hDLE9BQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQzNCLENBQUM7WUFFRCxNQUFNLFFBQVEsR0FBRyxZQUFZLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzNDLE1BQU0sV0FBVyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFVBQVUsRUFBRSxXQUFXLEVBQUUsYUFBYSxFQUFFLE9BQU8sQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RHLElBQUksUUFBUSxJQUFJLFdBQVcsS0FBSyxPQUFPLEVBQUUsQ0FBQztnQkFDeEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO1lBQ3pFLENBQUM7WUFFRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUMzQixDQUFDLENBQUEsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLGlCQUFpQixFQUFFLENBQUMsTUFBYyxFQUFFLFNBQWlCLEVBQUUsS0FBYSxFQUFFLEVBQUU7WUFDNUYsSUFBSSxNQUFNLEtBQUssT0FBTyxFQUFFLENBQUM7Z0JBQ3ZCLE9BQU87WUFDVCxDQUFDO1lBQ0Qsa0JBQWtCLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQztpQkFDbEQsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2lCQUMvRCxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFBLGdCQUFHLEVBQUMsT0FBTyxFQUFFLGtDQUFrQyxFQUFFLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRW5HLENBQUMsQ0FBQyxDQUFDO1FBRUgsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLG9CQUFvQixFQUFFLENBQUMsUUFBZ0IsRUFBRSxFQUFFOztZQUMvRCxJQUFJLFFBQVEsS0FBSyxPQUFPLEVBQUUsQ0FBQztnQkFDekIsT0FBTztZQUNULENBQUM7WUFFRCxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO1lBQ3JDLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztZQUNoRCxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBQSxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsbUNBQUksRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQ3pFLGtCQUFrQixDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2lCQUN4RCxJQUFJLENBQUMsR0FBRyxFQUFFO2dCQUNULElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsa0NBQWtDLENBQUMsQ0FBQztZQUNuRCxDQUFDLENBQUM7aUJBQ0QsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO2dCQUNYLElBQUEsZ0JBQUcsRUFBQyxPQUFPLEVBQUUsZ0NBQWdDLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzlELENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxrQkFBZSxJQUFJLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuLy8gQmx1ZWJpcmQgaW1wb3J0IHJlbW92ZWQgZHVyaW5nIG1pZ3JhdGlvbiB0byBuYXRpdmUgUHJvbWlzZXNcbmltcG9ydCB7IElRdWVyeSB9IGZyb20gJ21vZG1ldGEtZGInO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgdHVyYm93YWxrIGZyb20gJ3R1cmJvd2Fsayc7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgbG9nLCBzZWxlY3RvcnMsIHV0aWwsIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tICcuLi8uLi8uLi9zcmMvdXRpbC9wbGF0Zm9ybSc7XG5cbi8vIENvbmRpdGlvbmFsIHdpbmFwaSBpbXBvcnQgLSBvbmx5IGF2YWlsYWJsZSBvbiBXaW5kb3dzXG5jb25zdCB3aW5hcGkgPSBpc1dpbmRvd3MoKSA/IHJlcXVpcmUoJ3dpbmFwaS1iaW5kaW5ncycpIDogdW5kZWZpbmVkO1xuaW1wb3J0IENvbXBhdGliaWxpdHlJY29uIGZyb20gJy4vQ29tcGF0aWJpbGl0eUljb24nO1xuaW1wb3J0IHsgU01BUElfUVVFUllfRlJFUVVFTkNZIH0gZnJvbSAnLi9jb25zdGFudHMnO1xuXG5pbXBvcnQgRGVwZW5kZW5jeU1hbmFnZXIgZnJvbSAnLi9EZXBlbmRlbmN5TWFuYWdlcic7XG5pbXBvcnQgc2R2UmVkdWNlcnMgZnJvbSAnLi9yZWR1Y2Vycyc7XG5pbXBvcnQgU01BUElQcm94eSBmcm9tICcuL3NtYXBpUHJveHknO1xuaW1wb3J0IHsgdGVzdFNNQVBJT3V0ZGF0ZWQgfSBmcm9tICcuL3Rlc3RzJztcbmltcG9ydCB7IGNvbXBhdGliaWxpdHlPcHRpb25zLCBDb21wYXRpYmlsaXR5U3RhdHVzLCBJU0RWRGVwZW5kZW5jeSwgSVNEVk1vZE1hbmlmZXN0LCBJU01BUElSZXN1bHQgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IHBhcnNlTWFuaWZlc3QsIGRlZmF1bHRNb2RzUmVsUGF0aCwgdG9CbHVlIH0gZnJvbSAnLi91dGlsJztcblxuaW1wb3J0IFNldHRpbmdzIGZyb20gJy4vU2V0dGluZ3MnO1xuXG5pbXBvcnQgeyBzZXRNZXJnZUNvbmZpZ3MgfSBmcm9tICcuL2FjdGlvbnMnO1xuXG5pbXBvcnQgeyBvbkFkZGVkRmlsZXMsIG9uUmV2ZXJ0RmlsZXMsIG9uV2lsbEVuYWJsZU1vZHMsIHJlZ2lzdGVyQ29uZmlnTW9kIH0gZnJvbSAnLi9jb25maWdNb2QnO1xuXG5jb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpLFxuICB7IGNsaXBib2FyZCB9ID0gcmVxdWlyZSgnZWxlY3Ryb24nKSxcbiAgcmpzb24gPSByZXF1aXJlKCdyZWxheGVkLWpzb24nKSxcbiAgeyBTZXZlblppcCB9ID0gdXRpbCxcbiAgeyBkZXBsb3lTTUFQSSwgZG93bmxvYWRTTUFQSSwgZmluZFNNQVBJTW9kIH0gPSByZXF1aXJlKCcuL1NNQVBJJyksXG4gIHsgR0FNRV9JRCwgX1NNQVBJX0JVTkRMRURfTU9EUywgZ2V0QnVuZGxlZE1vZHMsIE1PRF9UWVBFX0NPTkZJRyB9ID0gcmVxdWlyZSgnLi9jb21tb24nKTtcblxuY29uc3QgTUFOSUZFU1RfRklMRSA9ICdtYW5pZmVzdC5qc29uJztcbmNvbnN0IFBUUk5fQ09OVEVOVCA9IHBhdGguc2VwICsgJ0NvbnRlbnQnICsgcGF0aC5zZXA7XG5jb25zdCBTTUFQSV9FWEUgPSAnU3RhcmRld01vZGRpbmdBUEkuZXhlJztcbmNvbnN0IFNNQVBJX0RMTCA9ICdTTUFQSS5JbnN0YWxsZXIuZGxsJztcbmNvbnN0IFNNQVBJX0RBVEEgPSBbJ3dpbmRvd3MtaW5zdGFsbC5kYXQnLCAnaW5zdGFsbC5kYXQnXTtcblxuXG5cblxuY2xhc3MgU3RhcmRld1ZhbGxleSBpbXBsZW1lbnRzIHR5cGVzLklHYW1lIHtcbiAgcHVibGljIGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0O1xuICBwdWJsaWMgaWQ6IHN0cmluZyA9IEdBTUVfSUQ7XG4gIHB1YmxpYyBuYW1lOiBzdHJpbmcgPSAnU3RhcmRldyBWYWxsZXknO1xuICBwdWJsaWMgbG9nbzogc3RyaW5nID0gJ2dhbWVhcnQuanBnJztcbiAgcHVibGljIHJlcXVpcmVkRmlsZXM6IHN0cmluZ1tdO1xuICBwdWJsaWMgZW52aXJvbm1lbnQ6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0gPSB7XG4gICAgU3RlYW1BUFBJZDogJzQxMzE1MCcsXG4gIH07XG4gIHB1YmxpYyBkZXRhaWxzOiB7IFtrZXk6IHN0cmluZ106IGFueSB9ID0ge1xuICAgIHN0ZWFtQXBwSWQ6IDQxMzE1MFxuICB9O1xuICBwdWJsaWMgc3VwcG9ydGVkVG9vbHM6IGFueVtdID0gW1xuICAgIHtcbiAgICAgIGlkOiAnc21hcGknLFxuICAgICAgbmFtZTogJ1NNQVBJJyxcbiAgICAgIGxvZ286ICdzbWFwaS5wbmcnLFxuICAgICAgZXhlY3V0YWJsZTogKCkgPT4gU01BUElfRVhFLFxuICAgICAgcmVxdWlyZWRGaWxlczogW1NNQVBJX0VYRV0sXG4gICAgICBzaGVsbDogdHJ1ZSxcbiAgICAgIGV4Y2x1c2l2ZTogdHJ1ZSxcbiAgICAgIHJlbGF0aXZlOiB0cnVlLFxuICAgICAgZGVmYXVsdFByaW1hcnk6IHRydWUsXG4gICAgfVxuICBdO1xuICBwdWJsaWMgbWVyZ2VNb2RzOiBib29sZWFuID0gdHJ1ZTtcbiAgcHVibGljIHJlcXVpcmVzQ2xlYW51cDogYm9vbGVhbiA9IHRydWU7XG4gIHB1YmxpYyBzaGVsbDogYm9vbGVhbiA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMic7XG4gIHB1YmxpYyBkZWZhdWx0UGF0aHM6IHN0cmluZ1tdO1xuXG4gIC8qKioqKioqKipcbiAgKiogVm9ydGV4IEFQSVxuICAqKioqKioqKiovXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYW4gaW5zdGFuY2UuXG4gICAqIEBwYXJhbSB7SUV4dGVuc2lvbkNvbnRleHR9IGNvbnRleHQgLS0gVGhlIFZvcnRleCBleHRlbnNpb24gY29udGV4dC5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XG4gICAgLy8gcHJvcGVydGllcyB1c2VkIGJ5IFZvcnRleFxuICAgIHRoaXMuY29udGV4dCA9IGNvbnRleHQ7XG4gICAgdGhpcy5yZXF1aXJlZEZpbGVzID0gcHJvY2Vzcy5wbGF0Zm9ybSA9PSAnd2luMzInXG4gICAgICA/IFsnU3RhcmRldyBWYWxsZXkuZXhlJ11cbiAgICAgIDogWydTdGFyZGV3VmFsbGV5JywgJ1N0YXJkZXdWYWxsZXkuZXhlJ107XG5cbiAgICAvLyBjdXN0b20gcHJvcGVydGllc1xuICAgIHRoaXMuZGVmYXVsdFBhdGhzID0gW1xuICAgICAgLy8gTGludXhcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnL0dPRyBHYW1lcy9TdGFyZGV3IFZhbGxleS9nYW1lJyxcbiAgICAgIHByb2Nlc3MuZW52LkhPTUUgKyAnLy5sb2NhbC9zaGFyZS9TdGVhbS9zdGVhbWFwcHMvY29tbW9uL1N0YXJkZXcgVmFsbGV5JyxcblxuICAgICAgLy8gTWFjXG4gICAgICAnL0FwcGxpY2F0aW9ucy9TdGFyZGV3IFZhbGxleS5hcHAvQ29udGVudHMvTWFjT1MnLFxuICAgICAgcHJvY2Vzcy5lbnYuSE9NRSArICcvTGlicmFyeS9BcHBsaWNhdGlvbiBTdXBwb3J0L1N0ZWFtL3N0ZWFtYXBwcy9jb21tb24vU3RhcmRldyBWYWxsZXkvQ29udGVudHMvTWFjT1MnLFxuXG4gICAgICAvLyBXaW5kb3dzXG4gICAgICAnQzpcXFxcUHJvZ3JhbSBGaWxlcyAoeDg2KVxcXFxHYWxheHlDbGllbnRcXFxcR2FtZXNcXFxcU3RhcmRldyBWYWxsZXknLFxuICAgICAgJ0M6XFxcXFByb2dyYW0gRmlsZXMgKHg4NilcXFxcR09HIEdhbGF4eVxcXFxHYW1lc1xcXFxTdGFyZGV3IFZhbGxleScsXG4gICAgICAnQzpcXFxcUHJvZ3JhbSBGaWxlcyAoeDg2KVxcXFxTdGVhbVxcXFxzdGVhbWFwcHNcXFxcY29tbW9uXFxcXFN0YXJkZXcgVmFsbGV5J1xuICAgIF07XG4gIH1cblxuICAvKipcbiAgICogQXN5bmNocm9ub3VzbHkgZmluZCB0aGUgZ2FtZSBpbnN0YWxsIHBhdGguXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiBxdWlja2x5IGFuZCwgaWYgaXQgcmV0dXJucyBhIHZhbHVlLCBpdCBzaG91bGQgZGVmaW5pdGl2ZWx5IGJlIHRoZVxuICAgKiB2YWxpZCBnYW1lIHBhdGguIFVzdWFsbHkgdGhpcyBmdW5jdGlvbiB3aWxsIHF1ZXJ5IHRoZSBwYXRoIGZyb20gdGhlIHJlZ2lzdHJ5IG9yIGZyb20gc3RlYW0uXG4gICAqIFRoaXMgZnVuY3Rpb24gbWF5IHJldHVybiBhIHByb21pc2UgYW5kIGl0IHNob3VsZCBkbyB0aGF0IGlmIGl0J3MgZG9pbmcgSS9PLlxuICAgKlxuICAgKiBUaGlzIG1heSBiZSBsZWZ0IHVuZGVmaW5lZCBidXQgdGhlbiB0aGUgdG9vbC9nYW1lIGNhbiBvbmx5IGJlIGRpc2NvdmVyZWQgYnkgc2VhcmNoaW5nIHRoZSBkaXNrXG4gICAqIHdoaWNoIGlzIHNsb3cgYW5kIG9ubHkgaGFwcGVucyBtYW51YWxseS5cbiAgICovXG4gIHB1YmxpYyBxdWVyeVBhdGggPSB0b0JsdWUoYXN5bmMgKCkgPT4ge1xuICAgIC8vIGNoZWNrIFN0ZWFtXG4gICAgY29uc3QgZ2FtZSA9IGF3YWl0IHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFsnNDEzMTUwJywgJzE0NTMzNzUyNTMnLCAnQ29uY2VybmVkQXBlLlN0YXJkZXdWYWxsZXlQQyddKTtcbiAgICBpZiAoZ2FtZSlcbiAgICAgIHJldHVybiBnYW1lLmdhbWVQYXRoO1xuXG4gICAgLy8gY2hlY2sgZGVmYXVsdCBwYXRoc1xuICAgIGZvciAoY29uc3QgZGVmYXVsdFBhdGggb2YgdGhpcy5kZWZhdWx0UGF0aHMpXG4gICAge1xuICAgICAgaWYgKGF3YWl0IHRoaXMuZ2V0UGF0aEV4aXN0c0FzeW5jKGRlZmF1bHRQYXRoKSlcbiAgICAgICAgcmV0dXJuIGRlZmF1bHRQYXRoO1xuICAgIH1cbiAgfSk7XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgcGF0aCBvZiB0aGUgdG9vbCBleGVjdXRhYmxlIHJlbGF0aXZlIHRvIHRoZSB0b29sIGJhc2UgcGF0aCwgaS5lLiBiaW5hcmllcy9VVDMuZXhlIG9yXG4gICAqIFRFU1YuZXhlLiBUaGlzIGlzIGEgZnVuY3Rpb24gc28gdGhhdCB5b3UgY2FuIHJldHVybiBkaWZmZXJlbnQgdGhpbmdzIGJhc2VkIG9uIHRoZSBvcGVyYXRpbmdcbiAgICogc3lzdGVtIGZvciBleGFtcGxlIGJ1dCBiZSBhd2FyZSB0aGF0IGl0IHdpbGwgYmUgZXZhbHVhdGVkIGF0IGFwcGxpY2F0aW9uIHN0YXJ0IGFuZCBvbmx5IG9uY2UsXG4gICAqIHNvIHRoZSByZXR1cm4gdmFsdWUgY2FuIG5vdCBkZXBlbmQgb24gdGhpbmdzIHRoYXQgY2hhbmdlIGF0IHJ1bnRpbWUuXG4gICAqL1xuICBwdWJsaWMgZXhlY3V0YWJsZSgpIHtcbiAgICByZXR1cm4gcHJvY2Vzcy5wbGF0Zm9ybSA9PSAnd2luMzInXG4gICAgICA/ICdTdGFyZGV3IFZhbGxleS5leGUnXG4gICAgICA6ICdTdGFyZGV3VmFsbGV5JztcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGRlZmF1bHQgZGlyZWN0b3J5IHdoZXJlIG1vZHMgZm9yIHRoaXMgZ2FtZSBzaG91bGQgYmUgc3RvcmVkLlxuICAgKiBcbiAgICogSWYgdGhpcyByZXR1cm5zIGEgcmVsYXRpdmUgcGF0aCB0aGVuIHRoZSBwYXRoIGlzIHRyZWF0ZWQgYXMgcmVsYXRpdmUgdG8gdGhlIGdhbWUgaW5zdGFsbGF0aW9uXG4gICAqIGRpcmVjdG9yeS4gU2ltcGx5IHJldHVybiBhIGRvdCAoICgpID0+ICcuJyApIGlmIG1vZHMgYXJlIGluc3RhbGxlZCBkaXJlY3RseSBpbnRvIHRoZSBnYW1lXG4gICAqIGRpcmVjdG9yeS5cbiAgICovIFxuICBwdWJsaWMgcXVlcnlNb2RQYXRoKClcbiAge1xuICAgIHJldHVybiBkZWZhdWx0TW9kc1JlbFBhdGgoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBPcHRpb25hbCBzZXR1cCBmdW5jdGlvbi4gSWYgdGhpcyBnYW1lIHJlcXVpcmVzIHNvbWUgZm9ybSBvZiBzZXR1cCBiZWZvcmUgaXQgY2FuIGJlIG1vZGRlZCAobGlrZVxuICAgKiBjcmVhdGluZyBhIGRpcmVjdG9yeSwgY2hhbmdpbmcgYSByZWdpc3RyeSBrZXksIC4uLikgZG8gaXQgaGVyZS4gSXQgd2lsbCBiZSBjYWxsZWQgZXZlcnkgdGltZVxuICAgKiBiZWZvcmUgdGhlIGdhbWUgbW9kZSBpcyBhY3RpdmF0ZWQuXG4gICAqIEBwYXJhbSB7SURpc2NvdmVyeVJlc3VsdH0gZGlzY292ZXJ5IC0tIGJhc2ljIGluZm8gYWJvdXQgdGhlIGdhbWUgYmVpbmcgbG9hZGVkLlxuICAgKi9cbiAgcHVibGljIHNldHVwID0gdG9CbHVlKGFzeW5jIChkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpID0+IHtcbiAgICAvLyBNYWtlIHN1cmUgdGhlIGZvbGRlciBmb3IgU01BUEkgbW9kcyBleGlzdHMuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBkZWZhdWx0TW9kc1JlbFBhdGgoKSkpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgfVxuICAgIC8vIHNraXAgaWYgU01BUEkgZm91bmRcbiAgICBjb25zdCBzbWFwaVBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIFNNQVBJX0VYRSk7XG4gICAgY29uc3Qgc21hcGlGb3VuZCA9IGF3YWl0IHRoaXMuZ2V0UGF0aEV4aXN0c0FzeW5jKHNtYXBpUGF0aCk7XG4gICAgaWYgKCFzbWFwaUZvdW5kKSB7XG4gICAgICB0aGlzLnJlY29tbWVuZFNtYXBpKCk7XG4gICAgfVxuICAgIFxuICAgIGNvbnN0IHN0YXRlID0gdGhpcy5jb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuXG4gICAgLypcbiAgICBpZiAoc3RhdGUuc2V0dGluZ3NbJ1NEViddLnVzZVJlY29tbWVuZGF0aW9ucyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmNvbnRleHQuYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1Nob3cgUmVjb21tZW5kYXRpb25zPycsIHtcbiAgICAgICAgdGV4dDogJ1ZvcnRleCBjYW4gb3B0aW9uYWxseSB1c2UgZGF0YSBmcm9tIFNNQVBJXFwncyBkYXRhYmFzZSBhbmQgJ1xuICAgICAgICAgICAgKyAndGhlIG1hbmlmZXN0IGZpbGVzIGluY2x1ZGVkIHdpdGggbW9kcyB0byByZWNvbW1lbmQgYWRkaXRpb25hbCAnXG4gICAgICAgICAgICArICdjb21wYXRpYmxlIG1vZHMgdGhhdCB3b3JrIHdpdGggdGhvc2UgdGhhdCB5b3UgaGF2ZSBpbnN0YWxsZWQuICdcbiAgICAgICAgICAgICsgJ0luIHNvbWUgY2FzZXMsIHRoaXMgaW5mb3JtYXRpb24gY291bGQgYmUgd3Jvbmcgb3IgaW5jb21wbGV0ZSAnXG4gICAgICAgICAgICArICd3aGljaCBtYXkgbGVhZCB0byB1bnJlbGlhYmxlIHByb21wdHMgc2hvd2luZyBpbiB0aGUgYXBwLlxcbidcbiAgICAgICAgICAgICsgJ0FsbCByZWNvbW1lbmRhdGlvbnMgc2hvd24gc2hvdWxkIGJlIGNhcmVmdWxseSBjb25zaWRlcmVkICdcbiAgICAgICAgICAgICsgJ2JlZm9yZSBhY2NlcHRpbmcgdGhlbSAtIGlmIHlvdSBhcmUgdW5zdXJlIHBsZWFzZSBjaGVjayB0aGUgJ1xuICAgICAgICAgICAgKyAnbW9kIHBhZ2UgdG8gc2VlIGlmIHRoZSBhdXRob3IgaGFzIHByb3ZpZGVkIGFueSBmdXJ0aGVyIGluc3RydWN0aW9ucy4gJ1xuICAgICAgICAgICAgKyAnV291bGQgeW91IGxpa2UgdG8gZW5hYmxlIHRoaXMgZmVhdHVyZT8gWW91IGNhbiB1cGRhdGUgeW91ciBjaG9pY2UgJ1xuICAgICAgICAgICAgKyAnZnJvbSB0aGUgU2V0dGluZ3MgbWVudSBhdCBhbnkgdGltZS4nXG4gICAgICB9LCBbXG4gICAgICAgIHsgbGFiZWw6ICdDb250aW51ZSB3aXRob3V0IHJlY29tbWVuZGF0aW9ucycsIGFjdGlvbjogKCkgPT4ge1xuICAgICAgICAgIHRoaXMuY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0UmVjb21tZW5kYXRpb25zKGZhbHNlKSk7XG4gICAgICAgIH0gfSxcbiAgICAgICAgeyBsYWJlbDogJ0VuYWJsZSByZWNvbW1lbmRhdGlvbnMnLCBhY3Rpb246ICgpID0+IHtcbiAgICAgICAgICB0aGlzLmNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKHNldFJlY29tbWVuZGF0aW9ucyh0cnVlKSk7XG4gICAgICAgIH0gfSxcbiAgICAgIF0pO1xuICAgIH0qL1xuICB9KTtcblxuICBwcml2YXRlIHJlY29tbWVuZFNtYXBpKCkge1xuICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKHRoaXMuY29udGV4dC5hcGkpO1xuICAgIGNvbnN0IHRpdGxlID0gc21hcGlNb2QgPyAnU01BUEkgaXMgbm90IGRlcGxveWVkJyA6ICdTTUFQSSBpcyBub3QgaW5zdGFsbGVkJztcbiAgICBjb25zdCBhY3Rpb25UaXRsZSA9IHNtYXBpTW9kID8gJ0RlcGxveScgOiAnR2V0IFNNQVBJJztcbiAgICBjb25zdCBhY3Rpb24gPSAoKSA9PiAoc21hcGlNb2RcbiAgICAgID8gZGVwbG95U01BUEkodGhpcy5jb250ZXh0LmFwaSlcbiAgICAgIDogZG93bmxvYWRTTUFQSSh0aGlzLmNvbnRleHQuYXBpKSlcbiAgICAgIC50aGVuKCgpID0+IHRoaXMuY29udGV4dC5hcGkuZGlzbWlzc05vdGlmaWNhdGlvbignc21hcGktbWlzc2luZycpKTtcblxuICAgIHRoaXMuY29udGV4dC5hcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICBpZDogJ3NtYXBpLW1pc3NpbmcnLFxuICAgICAgdHlwZTogJ3dhcm5pbmcnLFxuICAgICAgdGl0bGUsXG4gICAgICBtZXNzYWdlOiAnU01BUEkgaXMgcmVxdWlyZWQgdG8gbW9kIFN0YXJkZXcgVmFsbGV5LicsXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgIHtcbiAgICAgICAgICB0aXRsZTogYWN0aW9uVGl0bGUsXG4gICAgICAgICAgYWN0aW9uLFxuICAgICAgICB9LFxuICAgICAgXVxuICAgIH0pO1xuICB9XG5cbiAgLyoqKioqKioqKlxuICAqKiBJbnRlcm5hbCBtZXRob2RzXG4gICoqKioqKioqKi9cblxuICAvKipcbiAgICogQXN5bmNocm9ub3VzbHkgY2hlY2sgd2hldGhlciBhIGZpbGUgb3IgZGlyZWN0b3J5IHBhdGggZXhpc3RzLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF0aCAtIFRoZSBmaWxlIG9yIGRpcmVjdG9yeSBwYXRoLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyBnZXRQYXRoRXhpc3RzQXN5bmMocGF0aDogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGZzLnN0YXRBc3luYyhwYXRoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBBc3luY2hyb25vdXNseSByZWFkIGEgcmVnaXN0cnkga2V5IHZhbHVlLlxuICAgKiBAcGFyYW0ge3N0cmluZ30gaGl2ZSAtIFRoZSByZWdpc3RyeSBoaXZlIHRvIGFjY2Vzcy4gVGhpcyBzaG91bGQgYmUgYSBjb25zdGFudCBsaWtlIFJlZ2lzdHJ5LkhLTE0uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSBUaGUgcmVnaXN0cnkga2V5LlxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmFtZSAtIFRoZSBuYW1lIG9mIHRoZSB2YWx1ZSB0byByZWFkLlxuICAgKi9cbiAgcHJpdmF0ZSBhc3luYyByZWFkUmVnaXN0cnlLZXlBc3luYyhoaXZlOiBzdHJpbmcsIGtleTogc3RyaW5nLCBuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBpbnN0UGF0aCA9IChpc1dpbmRvd3MoKSAmJiB3aW5hcGkpID8gd2luYXBpLlJlZ0dldFZhbHVlKGhpdmUsIGtleSwgbmFtZSkgOiBudWxsO1xuICAgICAgaWYgKCFpbnN0UGF0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2VtcHR5IHJlZ2lzdHJ5IGtleScpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGluc3RQYXRoLnZhbHVlO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdGVzdFJvb3RGb2xkZXIoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZykge1xuICAvLyBXZSBhc3N1bWUgdGhhdCBhbnkgbW9kIGNvbnRhaW5pbmcgXCIvQ29udGVudC9cIiBpbiBpdHMgZGlyZWN0b3J5XG4gIC8vICBzdHJ1Y3R1cmUgaXMgbWVhbnQgdG8gYmUgZGVwbG95ZWQgdG8gdGhlIHJvb3QgZm9sZGVyLlxuICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlID0+IGZpbGUuZW5kc1dpdGgocGF0aC5zZXApKVxuICAgIC5tYXAoZmlsZSA9PiBwYXRoLmpvaW4oJ2Zha2VEaXInLCBmaWxlKSk7XG4gIGNvbnN0IGNvbnRlbnREaXIgPSBmaWx0ZXJlZC5maW5kKGZpbGUgPT4gZmlsZS5lbmRzV2l0aChQVFJOX0NPTlRFTlQpKTtcbiAgY29uc3Qgc3VwcG9ydGVkID0gKChnYW1lSWQgPT09IEdBTUVfSUQpXG4gICAgJiYgKGNvbnRlbnREaXIgIT09IHVuZGVmaW5lZCkpO1xuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xufVxuXG5mdW5jdGlvbiBpbnN0YWxsUm9vdEZvbGRlcihmaWxlczogc3RyaW5nW10sIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nKSB7XG4gIC8vIFdlJ3JlIGdvaW5nIHRvIGRlcGxveSBcIi9Db250ZW50L1wiIGFuZCB3aGF0ZXZlciBmb2xkZXJzIGNvbWUgYWxvbmdzaWRlIGl0LlxuICAvLyAgaS5lLiBTb21lTW9kLjd6XG4gIC8vICBXaWxsIGJlIGRlcGxveWVkICAgICA9PiAuLi9Tb21lTW9kL0NvbnRlbnQvXG4gIC8vICBXaWxsIGJlIGRlcGxveWVkICAgICA9PiAuLi9Tb21lTW9kL01vZHMvXG4gIC8vICBXaWxsIE5PVCBiZSBkZXBsb3llZCA9PiAuLi9SZWFkbWUuZG9jXG4gIGNvbnN0IGNvbnRlbnRGaWxlID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguam9pbignZmFrZURpcicsIGZpbGUpLmVuZHNXaXRoKFBUUk5fQ09OVEVOVCkpO1xuICBjb25zdCBpZHggPSBjb250ZW50RmlsZS5pbmRleE9mKFBUUk5fQ09OVEVOVCkgKyAxO1xuICBjb25zdCByb290RGlyID0gcGF0aC5iYXNlbmFtZShjb250ZW50RmlsZS5zdWJzdHJpbmcoMCwgaWR4KSk7XG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApXG4gICAgJiYgKGZpbGUuaW5kZXhPZihyb290RGlyKSAhPT0gLTEpXG4gICAgJiYgKHBhdGguZXh0bmFtZShmaWxlKSAhPT0gJy50eHQnKSk7XG4gIGNvbnN0IGluc3RydWN0aW9ucyA9IGZpbHRlcmVkLm1hcChmaWxlID0+IHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgc291cmNlOiBmaWxlLFxuICAgICAgZGVzdGluYXRpb246IGZpbGUuc3Vic3RyKGlkeCksXG4gICAgfTtcbiAgfSk7XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcbn1cblxuZnVuY3Rpb24gaXNWYWxpZE1hbmlmZXN0KGZpbGVQYXRoOiBzdHJpbmcpIHtcbiAgY29uc3Qgc2VnbWVudHMgPSBmaWxlUGF0aC50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcbiAgY29uc3QgaXNNYW5pZmVzdEZpbGUgPSBzZWdtZW50c1tzZWdtZW50cy5sZW5ndGggLSAxXSA9PT0gTUFOSUZFU1RfRklMRTtcbiAgY29uc3QgaXNMb2NhbGUgPSBzZWdtZW50cy5pbmNsdWRlcygnbG9jYWxlJyk7XG4gIHJldHVybiBpc01hbmlmZXN0RmlsZSAmJiAhaXNMb2NhbGU7XG59XG5cbmZ1bmN0aW9uIHRlc3RTdXBwb3J0ZWQoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZykge1xuICBjb25zdCBzdXBwb3J0ZWQgPSAoZ2FtZUlkID09PSBHQU1FX0lEKVxuICAgICYmIChmaWxlcy5maW5kKGlzVmFsaWRNYW5pZmVzdCkgIT09IHVuZGVmaW5lZClcbiAgICAmJiAoZmlsZXMuZmluZChmaWxlID0+IHtcbiAgICAgIC8vIFdlIGNyZWF0ZSBhIHByZWZpeCBmYWtlIGRpcmVjdG9yeSBqdXN0IGluIGNhc2UgdGhlIGNvbnRlbnRcbiAgICAgIC8vICBmb2xkZXIgaXMgaW4gdGhlIGFyY2hpdmUncyByb290IGZvbGRlci4gVGhpcyBpcyB0byBlbnN1cmUgd2VcbiAgICAgIC8vICBmaW5kIGEgbWF0Y2ggZm9yIFwiL0NvbnRlbnQvXCJcbiAgICAgIGNvbnN0IHRlc3RGaWxlID0gcGF0aC5qb2luKCdmYWtlRGlyJywgZmlsZSk7XG4gICAgICByZXR1cm4gKHRlc3RGaWxlLmVuZHNXaXRoKFBUUk5fQ09OVEVOVCkpO1xuICAgIH0pID09PSB1bmRlZmluZWQpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgc3VwcG9ydGVkLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbChhcGksXG4gICAgICAgICAgICAgICAgICAgICAgIGRlcGVuZGVuY3lNYW5hZ2VyLFxuICAgICAgICAgICAgICAgICAgICAgICBmaWxlcyxcbiAgICAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb25QYXRoKSB7XG4gIC8vIFRoZSBhcmNoaXZlIG1heSBjb250YWluIG11bHRpcGxlIG1hbmlmZXN0IGZpbGVzIHdoaWNoIHdvdWxkXG4gIC8vICBpbXBseSB0aGF0IHdlJ3JlIGluc3RhbGxpbmcgbXVsdGlwbGUgbW9kcy5cbiAgY29uc3QgbWFuaWZlc3RGaWxlcyA9IGZpbGVzLmZpbHRlcihpc1ZhbGlkTWFuaWZlc3QpO1xuXG4gIGludGVyZmFjZSBJTW9kSW5mbyB7XG4gICAgbWFuaWZlc3Q6IElTRFZNb2RNYW5pZmVzdDtcbiAgICByb290Rm9sZGVyOiBzdHJpbmc7XG4gICAgbWFuaWZlc3RJbmRleDogbnVtYmVyO1xuICAgIG1vZEZpbGVzOiBzdHJpbmdbXTtcbiAgfVxuXG4gIGxldCBwYXJzZUVycm9yOiBFcnJvcjtcblxuICBhd2FpdCBkZXBlbmRlbmN5TWFuYWdlci5zY2FuTWFuaWZlc3RzKHRydWUpO1xuICBsZXQgbW9kczogSU1vZEluZm9bXSA9IGF3YWl0IFByb21pc2UuYWxsKG1hbmlmZXN0RmlsZXMubWFwKGFzeW5jIG1hbmlmZXN0RmlsZSA9PiB7XG4gICAgY29uc3Qgcm9vdEZvbGRlciA9IHBhdGguZGlybmFtZShtYW5pZmVzdEZpbGUpO1xuICAgIGNvbnN0IHJvb3RTZWdtZW50cyA9IHJvb3RGb2xkZXIudG9Mb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XG4gICAgY29uc3QgbWFuaWZlc3RJbmRleCA9IG1hbmlmZXN0RmlsZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YoTUFOSUZFU1RfRklMRSk7XG4gICAgY29uc3QgZmlsdGVyRnVuYyA9IChmaWxlOiBzdHJpbmcpID0+IHtcbiAgICAgIGNvbnN0IGlzRmlsZSA9ICFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSAmJiBwYXRoLmV4dG5hbWUocGF0aC5iYXNlbmFtZShmaWxlKSkgIT09ICcnO1xuICAgICAgY29uc3QgZmlsZVNlZ21lbnRzID0gZmlsZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKTtcbiAgICAgIGNvbnN0IGlzSW5Sb290Rm9sZGVyID0gKHJvb3RTZWdtZW50cy5sZW5ndGggPiAwKVxuICAgICAgICA/IGZpbGVTZWdtZW50cz8uW3Jvb3RTZWdtZW50cy5sZW5ndGggLSAxXSA9PT0gcm9vdFNlZ21lbnRzW3Jvb3RTZWdtZW50cy5sZW5ndGggLSAxXVxuICAgICAgICA6IHRydWU7XG4gICAgICByZXR1cm4gaXNJblJvb3RGb2xkZXIgJiYgaXNGaWxlO1xuICAgIH07XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG1hbmlmZXN0OiBJU0RWTW9kTWFuaWZlc3QgPVxuICAgICAgICBhd2FpdCBwYXJzZU1hbmlmZXN0KHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1hbmlmZXN0RmlsZSkpO1xuICAgICAgY29uc3QgbW9kRmlsZXMgPSBmaWxlcy5maWx0ZXIoZmlsdGVyRnVuYyk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBtYW5pZmVzdCxcbiAgICAgICAgcm9vdEZvbGRlcixcbiAgICAgICAgbWFuaWZlc3RJbmRleCxcbiAgICAgICAgbW9kRmlsZXMsXG4gICAgICB9O1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy8ganVzdCBhIHdhcm5pbmcgYXQgdGhpcyBwb2ludCBhcyB0aGlzIG1heSBub3QgYmUgdGhlIG1haW4gbWFuaWZlc3QgZm9yIHRoZSBtb2RcbiAgICAgIGxvZygnd2FybicsICdGYWlsZWQgdG8gcGFyc2UgbWFuaWZlc3QnLCB7IG1hbmlmZXN0RmlsZSwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgcGFyc2VFcnJvciA9IGVycjtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuICB9KSk7XG5cbiAgbW9kcyA9IG1vZHMuZmlsdGVyKHggPT4geCAhPT0gdW5kZWZpbmVkKTtcbiAgXG4gIGlmIChtb2RzLmxlbmd0aCA9PT0gMCkge1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oXG4gICAgICAnVGhlIG1vZCBtYW5pZmVzdCBpcyBpbnZhbGlkIGFuZCBjYW5cXCd0IGJlIHJlYWQuIFlvdSBjYW4gdHJ5IHRvIGluc3RhbGwgdGhlIG1vZCBhbnl3YXkgdmlhIHJpZ2h0LWNsaWNrIC0+IFwiVW5wYWNrIChhcy1pcylcIicsXG4gICAgICBwYXJzZUVycm9yLCB7XG4gICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgfSk7XG4gIH1cblxuICByZXR1cm4gUHJvbWlzZS5hbGwobW9kcy5tYXAobW9kID0+IHtcbiAgICAvLyBUT0RPOiB3ZSBtaWdodCBnZXQgaGVyZSB3aXRoIGEgbW9kIHRoYXQgaGFzIGEgbWFuaWZlc3QuanNvbiBmaWxlIGJ1dCB3YXNuJ3QgaW50ZW5kZWQgZm9yIFN0YXJkZXcgVmFsbGV5LCBhbGxcbiAgICAvLyAgdGh1bmRlcnN0b3JlIG1vZHMgd2lsbCBjb250YWluIGEgbWFuaWZlc3QuanNvbiBmaWxlXG4gICAgY29uc3QgbW9kTmFtZSA9IChtb2Qucm9vdEZvbGRlciAhPT0gJy4nKVxuICAgICAgPyBtb2Qucm9vdEZvbGRlclxuICAgICAgOiBtb2QubWFuaWZlc3QuTmFtZSA/PyBtb2Qucm9vdEZvbGRlcjtcblxuICAgIGlmIChtb2ROYW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBbXTtcbiAgICB9XG5cbiAgICBjb25zdCBkZXBlbmRlbmNpZXMgPSBtb2QubWFuaWZlc3QuRGVwZW5kZW5jaWVzIHx8IFtdO1xuXG4gICAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IFtdO1xuXG4gICAgZm9yIChjb25zdCBmaWxlIG9mIG1vZC5tb2RGaWxlcykge1xuICAgICAgY29uc3QgZGVzdGluYXRpb24gPSBwYXRoLmpvaW4obW9kTmFtZSwgZmlsZS5zdWJzdHIobW9kLm1hbmlmZXN0SW5kZXgpKTtcbiAgICAgIGluc3RydWN0aW9ucy5wdXNoKHtcbiAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICBzb3VyY2U6IGZpbGUsXG4gICAgICAgIGRlc3RpbmF0aW9uOiBkZXN0aW5hdGlvbixcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IGFkZFJ1bGVGb3JEZXBlbmRlbmN5ID0gKGRlcDogSVNEVkRlcGVuZGVuY3kpID0+IHtcbiAgICAgIGlmICgoZGVwLlVuaXF1ZUlEID09PSB1bmRlZmluZWQpXG4gICAgICAgICAgfHwgKGRlcC5VbmlxdWVJRC50b0xvd2VyQ2FzZSgpID09PSAneW91cm5hbWUueW91cm90aGVyc3BhY2tzYW5kbW9kcycpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdmVyc2lvbk1hdGNoID0gZGVwLk1pbmltdW1WZXJzaW9uICE9PSB1bmRlZmluZWRcbiAgICAgICAgPyBgPj0ke2RlcC5NaW5pbXVtVmVyc2lvbn1gXG4gICAgICAgIDogJyonO1xuICAgICAgY29uc3QgcnVsZTogdHlwZXMuSU1vZFJ1bGUgPSB7XG4gICAgICAgIC8vIHRyZWF0aW5nIGFsbCBkZXBlbmRlbmNpZXMgYXMgcmVjb21tZW5kYXRpb25zIGJlY2F1c2UgdGhlIGRlcGVuZGVuY3kgaW5mb3JtYXRpb25cbiAgICAgICAgLy8gcHJvdmlkZWQgYnkgc29tZSBtb2QgYXV0aG9ycyBpcyBhIGJpdCBoaXQtYW5kLW1pc3MgYW5kIFZvcnRleCBmYWlybHkgYWdncmVzc2l2ZWx5XG4gICAgICAgIC8vIGVuZm9yY2VzIHJlcXVpcmVtZW50c1xuICAgICAgICAvLyB0eXBlOiAoZGVwLklzUmVxdWlyZWQgPz8gdHJ1ZSkgPyAncmVxdWlyZXMnIDogJ3JlY29tbWVuZHMnLFxuICAgICAgICB0eXBlOiAncmVjb21tZW5kcycsXG4gICAgICAgIHJlZmVyZW5jZToge1xuICAgICAgICAgIGxvZ2ljYWxGaWxlTmFtZTogZGVwLlVuaXF1ZUlELnRvTG93ZXJDYXNlKCksXG4gICAgICAgICAgdmVyc2lvbk1hdGNoLFxuICAgICAgICB9LFxuICAgICAgICBleHRyYToge1xuICAgICAgICAgIG9ubHlJZkZ1bGZpbGxhYmxlOiB0cnVlLFxuICAgICAgICAgIGF1dG9tYXRpYzogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgICBpbnN0cnVjdGlvbnMucHVzaCh7XG4gICAgICAgIHR5cGU6ICdydWxlJyxcbiAgICAgICAgcnVsZSxcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8qXG4gICAgaWYgKGFwaS5nZXRTdGF0ZSgpLnNldHRpbmdzWydTRFYnXT8udXNlUmVjb21tZW5kYXRpb25zID8/IGZhbHNlKSB7XG4gICAgICBmb3IgKGNvbnN0IGRlcCBvZiBkZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgYWRkUnVsZUZvckRlcGVuZGVuY3koZGVwKTtcbiAgICAgIH1cbiAgICAgIGlmIChtb2QubWFuaWZlc3QuQ29udGVudFBhY2tGb3IgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBhZGRSdWxlRm9yRGVwZW5kZW5jeShtb2QubWFuaWZlc3QuQ29udGVudFBhY2tGb3IpO1xuICAgICAgfVxuICAgIH0qL1xuICAgIHJldHVybiBpbnN0cnVjdGlvbnM7XG4gIH0pKTtcbiAgLy8gUmVtb3ZlZCAudGhlbigpIGJsb2NrIHRoYXQgd2FzIGNhdXNpbmcgc3ludGF4IGVycm9yXG59XG5cbmZ1bmN0aW9uIGlzU01BUElNb2RUeXBlKGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10pIHtcbiAgLy8gRmluZCB0aGUgU01BUEkgZXhlIGZpbGUuXG4gIGNvbnN0IHNtYXBpRGF0YSA9IGluc3RydWN0aW9ucy5maW5kKGluc3QgPT4gKGluc3QudHlwZSA9PT0gJ2NvcHknKSAmJiBpbnN0LnNvdXJjZS5lbmRzV2l0aChTTUFQSV9FWEUpKTtcblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHNtYXBpRGF0YSAhPT0gdW5kZWZpbmVkKTtcbn1cblxuZnVuY3Rpb24gdGVzdFNNQVBJKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpIHtcbiAgLy8gTWFrZSBzdXJlIHRoZSBkb3dubG9hZCBjb250YWlucyB0aGUgU01BUEkgZGF0YSBhcmNoaXZlLnNcbiAgY29uc3Qgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRCkgJiYgKGZpbGVzLmZpbmQoZmlsZSA9PlxuICAgIHBhdGguYmFzZW5hbWUoZmlsZSkgPT09IFNNQVBJX0RMTCkgIT09IHVuZGVmaW5lZCk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgc3VwcG9ydGVkLFxuICAgICAgcmVxdWlyZWRGaWxlczogW10sXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbnN0YWxsU01BUEkoZ2V0RGlzY292ZXJ5UGF0aDogKCkgPT4gc3RyaW5nLCBmaWxlczogc3RyaW5nW10sIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nKSB7XG4gIGNvbnN0IGZvbGRlciA9IHByb2Nlc3MucGxhdGZvcm0gPT09ICd3aW4zMidcbiAgICA/ICd3aW5kb3dzJ1xuICAgIDogcHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ2xpbnV4J1xuICAgICAgPyAnbGludXgnXG4gICAgICA6ICdtYWNvcyc7XG4gIGNvbnN0IGZpbGVIYXNDb3JyZWN0UGxhdGZvcm0gPSAoZmlsZSkgPT4ge1xuICAgIGNvbnN0IHNlZ21lbnRzID0gZmlsZS5zcGxpdChwYXRoLnNlcCkubWFwKHNlZyA9PiBzZWcudG9Mb3dlckNhc2UoKSk7XG4gICAgcmV0dXJuIChzZWdtZW50cy5pbmNsdWRlcyhmb2xkZXIpKTtcbiAgfVxuICAvLyBGaW5kIHRoZSBTTUFQSSBkYXRhIGFyY2hpdmVcbiAgY29uc3QgZGF0YUZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4ge1xuICAgIGNvbnN0IGlzQ29ycmVjdFBsYXRmb3JtID0gZmlsZUhhc0NvcnJlY3RQbGF0Zm9ybShmaWxlKTtcbiAgICByZXR1cm4gaXNDb3JyZWN0UGxhdGZvcm0gJiYgU01BUElfREFUQS5pbmNsdWRlcyhwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkpXG4gIH0pO1xuICBpZiAoZGF0YUZpbGUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnRmFpbGVkIHRvIGZpbmQgdGhlIFNNQVBJIGRhdGEgZmlsZXMgLSBkb3dubG9hZCBhcHBlYXJzICdcbiAgICAgICsgJ3RvIGJlIGNvcnJ1cHRlZDsgcGxlYXNlIHJlLWRvd25sb2FkIFNNQVBJIGFuZCB0cnkgYWdhaW4nKSk7XG4gIH1cbiAgbGV0IGRhdGEgPSAnJztcbiAgdHJ5IHtcbiAgICBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oZ2V0RGlzY292ZXJ5UGF0aCgpLCAnU3RhcmRldyBWYWxsZXkuZGVwcy5qc29uJyksIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gcGFyc2UgU0RWIGRlcGVuZGVuY2llcycsIGVycik7XG4gIH1cblxuICAvLyBmaWxlIHdpbGwgYmUgb3V0ZGF0ZWQgYWZ0ZXIgdGhlIHdhbGsgb3BlcmF0aW9uIHNvIHByZXBhcmUgYSByZXBsYWNlbWVudC4gXG4gIGNvbnN0IHVwZGF0ZWRGaWxlcyA9IFtdO1xuXG4gIGNvbnN0IHN6aXAgPSBuZXcgU2V2ZW5aaXAoKTtcbiAgLy8gVW56aXAgdGhlIGZpbGVzIGZyb20gdGhlIGRhdGEgYXJjaGl2ZS4gVGhpcyBkb2Vzbid0IHNlZW0gdG8gYmVoYXZlIGFzIGRlc2NyaWJlZCBoZXJlOiBodHRwczovL3d3dy5ucG1qcy5jb20vcGFja2FnZS9ub2RlLTd6I2V2ZW50c1xuICBhd2FpdCBzemlwLmV4dHJhY3RGdWxsKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIGRhdGFGaWxlKSwgZGVzdGluYXRpb25QYXRoKTtcblxuICAvLyBGaW5kIGFueSBmaWxlcyB0aGF0IGFyZSBub3QgaW4gdGhlIHBhcmVudCBmb2xkZXIuIFxuICBhd2FpdCB1dGlsLndhbGsoZGVzdGluYXRpb25QYXRoLCAoaXRlciwgc3RhdHMpID0+IHtcbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGRlc3RpbmF0aW9uUGF0aCwgaXRlcik7XG4gICAgICAvLyBGaWx0ZXIgb3V0IGZpbGVzIGZyb20gdGhlIG9yaWdpbmFsIGluc3RhbGwgYXMgdGhleSdyZSBubyBsb25nZXIgcmVxdWlyZWQuXG4gICAgICBpZiAoIWZpbGVzLmluY2x1ZGVzKHJlbFBhdGgpICYmIHN0YXRzLmlzRmlsZSgpICYmICFmaWxlcy5pbmNsdWRlcyhyZWxQYXRoK3BhdGguc2VwKSkgdXBkYXRlZEZpbGVzLnB1c2gocmVsUGF0aCk7XG4gICAgICBjb25zdCBzZWdtZW50cyA9IHJlbFBhdGgudG9Mb2NhbGVMb3dlckNhc2UoKS5zcGxpdChwYXRoLnNlcCk7XG4gICAgICBjb25zdCBtb2RzRm9sZGVySWR4ID0gc2VnbWVudHMuaW5kZXhPZignbW9kcycpO1xuICAgICAgaWYgKChtb2RzRm9sZGVySWR4ICE9PSAtMSkgJiYgKHNlZ21lbnRzLmxlbmd0aCA+IG1vZHNGb2xkZXJJZHggKyAxKSkge1xuICAgICAgICBfU01BUElfQlVORExFRF9NT0RTLnB1c2goc2VnbWVudHNbbW9kc0ZvbGRlcklkeCArIDFdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSk7XG5cbiAgLy8gRmluZCB0aGUgU01BUEkgZXhlIGZpbGUuIFxuICBjb25zdCBzbWFwaUV4ZSA9IHVwZGF0ZWRGaWxlcy5maW5kKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLmVuZHNXaXRoKFNNQVBJX0VYRS50b0xvd2VyQ2FzZSgpKSk7XG4gIGlmIChzbWFwaUV4ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKGBGYWlsZWQgdG8gZXh0cmFjdCAke1NNQVBJX0VYRX0gLSBkb3dubG9hZCBhcHBlYXJzIGBcbiAgICAgICsgJ3RvIGJlIGNvcnJ1cHRlZDsgcGxlYXNlIHJlLWRvd25sb2FkIFNNQVBJIGFuZCB0cnkgYWdhaW4nKSk7XG4gIH1cbiAgY29uc3QgaWR4ID0gc21hcGlFeGUuaW5kZXhPZihwYXRoLmJhc2VuYW1lKHNtYXBpRXhlKSk7XG5cbiAgLy8gQnVpbGQgdGhlIGluc3RydWN0aW9ucyBmb3IgaW5zdGFsbGF0aW9uLiBcbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IHVwZGF0ZWRGaWxlcy5tYXAoZmlsZSA9PiB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgICAgICBzb3VyY2U6IGZpbGUsXG4gICAgICAgICAgZGVzdGluYXRpb246IHBhdGguam9pbihmaWxlLnN1YnN0cihpZHgpKSxcbiAgICAgIH1cbiAgfSk7XG5cbiAgaW5zdHJ1Y3Rpb25zLnB1c2goe1xuICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxuICAgIGtleTogJ3NtYXBpQnVuZGxlZE1vZHMnLFxuICAgIHZhbHVlOiBnZXRCdW5kbGVkTW9kcygpLFxuICB9KTtcblxuICBpbnN0cnVjdGlvbnMucHVzaCh7XG4gICAgdHlwZTogJ2dlbmVyYXRlZmlsZScsXG4gICAgZGF0YSxcbiAgICBkZXN0aW5hdGlvbjogJ1N0YXJkZXdNb2RkaW5nQVBJLmRlcHMuanNvbicsXG4gIH0pO1xuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNob3dTTUFQSUxvZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGJhc2VQYXRoOiBzdHJpbmcsIGxvZ0ZpbGU6IHN0cmluZykge1xuICBjb25zdCBsb2dEYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oYmFzZVBhdGgsIGxvZ0ZpbGUpLCB7IGVuY29kaW5nOiAndXRmLTgnIH0pO1xuICBhd2FpdCBhcGkuc2hvd0RpYWxvZygnaW5mbycsICdTTUFQSSBMb2cnLCB7XG4gICAgdGV4dDogJ1lvdXIgU01BUEkgbG9nIGlzIGRpc3BsYXllZCBiZWxvdy4gVG8gc2hhcmUgaXQsIGNsaWNrIFwiQ29weSAmIFNoYXJlXCIgd2hpY2ggd2lsbCBjb3B5IGl0IHRvIHlvdXIgY2xpcGJvYXJkIGFuZCBvcGVuIHRoZSBTTUFQSSBsb2cgc2hhcmluZyB3ZWJzaXRlLiAnICtcbiAgICAgICdOZXh0LCBwYXN0ZSB5b3VyIGNvZGUgaW50byB0aGUgdGV4dCBib3ggYW5kIHByZXNzIFwic2F2ZSAmIHBhcnNlIGxvZ1wiLiBZb3UgY2FuIG5vdyBzaGFyZSBhIGxpbmsgdG8gdGhpcyBwYWdlIHdpdGggb3RoZXJzIHNvIHRoZXkgY2FuIHNlZSB5b3VyIGxvZyBmaWxlLlxcblxcbicgKyBsb2dEYXRhXG4gIH0sIFt7XG4gICAgbGFiZWw6ICdDb3B5ICYgU2hhcmUgbG9nJywgYWN0aW9uOiAoKSA9PiB7XG4gICAgICBjb25zdCB0aW1lc3RhbXAgPSBuZXcgRGF0ZSgpLnRvSVNPU3RyaW5nKCkucmVwbGFjZSgvXi4rVChbXlxcLl0rKS4rLywgJyQxJyk7XG4gICAgICBjbGlwYm9hcmQud3JpdGVUZXh0KGBbJHt0aW1lc3RhbXB9IElORk8gVm9ydGV4XSBMb2cgZXhwb3J0ZWQgYnkgVm9ydGV4ICR7dXRpbC5nZXRBcHBsaWNhdGlvbigpLnZlcnNpb259LlxcbmAgKyBsb2dEYXRhKTtcbiAgICAgIHJldHVybiB1dGlsLm9wbignaHR0cHM6Ly9zbWFwaS5pby9sb2cnKS5jYXRjaChlcnIgPT4gdW5kZWZpbmVkKTtcbiAgICB9XG4gIH0sIHsgbGFiZWw6ICdDbG9zZScsIGFjdGlvbjogKCkgPT4gdW5kZWZpbmVkIH1dKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gb25TaG93U01BUElMb2coYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIC8vUmVhZCBhbmQgZGlzcGxheSB0aGUgbG9nLlxuICBjb25zdCBiYXNlUGF0aCA9IHBhdGguam9pbih1dGlsLmdldFZvcnRleFBhdGgoJ2FwcERhdGEnKSwgJ3N0YXJkZXd2YWxsZXknLCAnZXJyb3Jsb2dzJyk7XG4gIHRyeSB7XG4gICAgLy9JZiB0aGUgY3Jhc2ggbG9nIGV4aXN0cywgc2hvdyB0aGF0LlxuICAgIGF3YWl0IHNob3dTTUFQSUxvZyhhcGksIGJhc2VQYXRoLCBcIlNNQVBJLWNyYXNoLnR4dFwiKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgdHJ5IHtcbiAgICAgIC8vT3RoZXJ3aXNlIHNob3cgdGhlIG5vcm1hbCBsb2cuXG4gICAgICBhd2FpdCBzaG93U01BUElMb2coYXBpLCBiYXNlUGF0aCwgXCJTTUFQSS1sYXRlc3QudHh0XCIpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy9PciBJbmZvcm0gdGhlIHVzZXIgdGhlcmUgYXJlIG5vIGxvZ3MuXG4gICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7IHR5cGU6ICdpbmZvJywgdGl0bGU6ICdObyBTTUFQSSBsb2dzIGZvdW5kLicsIG1lc3NhZ2U6ICcnLCBkaXNwbGF5TVM6IDUwMDAgfSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldE1vZE1hbmlmZXN0cyhtb2RQYXRoPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICBjb25zdCBtYW5pZmVzdHM6IHN0cmluZ1tdID0gW107XG5cbiAgaWYgKG1vZFBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICB9XG5cbiAgcmV0dXJuIHR1cmJvd2Fsayhtb2RQYXRoLCBhc3luYyBlbnRyaWVzID0+IHtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVudHJpZXMpIHtcbiAgICAgIGlmIChwYXRoLmJhc2VuYW1lKGVudHJ5LmZpbGVQYXRoKSA9PT0gJ21hbmlmZXN0Lmpzb24nKSB7XG4gICAgICAgIG1hbmlmZXN0cy5wdXNoKGVudHJ5LmZpbGVQYXRoKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sIHsgc2tpcEhpZGRlbjogZmFsc2UsIHJlY3Vyc2U6IHRydWUsIHNraXBJbmFjY2Vzc2libGU6IHRydWUsIHNraXBMaW5rczogdHJ1ZSB9KVxuICAgIC50aGVuKCgpID0+IG1hbmlmZXN0cyk7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZUNvbmZsaWN0SW5mbyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc21hcGk6IFNNQVBJUHJveHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kSWQ6IHN0cmluZylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBtb2QgPSBhcGkuZ2V0U3RhdGUoKS5wZXJzaXN0ZW50Lm1vZHNbZ2FtZUlkXVttb2RJZF07XG5cbiAgaWYgKG1vZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcblxuICBpZiAoKG5vdyAtIChtb2QuYXR0cmlidXRlcz8ubGFzdFNNQVBJUXVlcnkgPz8gMCkpIDwgU01BUElfUVVFUllfRlJFUVVFTkNZKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgbGV0IGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gbW9kLmF0dHJpYnV0ZXM/LmFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzO1xuICBpZiAoIWFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzKSB7XG4gICAgaWYgKG1vZC5hdHRyaWJ1dGVzPy5sb2dpY2FsRmlsZU5hbWUpIHtcbiAgICAgIGFkZGl0aW9uYWxMb2dpY2FsRmlsZU5hbWVzID0gW21vZC5hdHRyaWJ1dGVzPy5sb2dpY2FsRmlsZU5hbWVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IFtdO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHF1ZXJ5ID0gYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXNcbiAgICAubWFwKG5hbWUgPT4ge1xuICAgICAgY29uc3QgcmVzID0ge1xuICAgICAgICBpZDogbmFtZSxcbiAgICAgIH07XG4gICAgICBjb25zdCB2ZXIgPSBtb2QuYXR0cmlidXRlcz8ubWFuaWZlc3RWZXJzaW9uXG4gICAgICAgICAgICAgICAgICAgICA/PyBzZW12ZXIuY29lcmNlKG1vZC5hdHRyaWJ1dGVzPy52ZXJzaW9uKT8udmVyc2lvbjtcbiAgICAgIGlmICghIXZlcikge1xuICAgICAgICByZXNbJ2luc3RhbGxlZFZlcnNpb24nXSA9IHZlcjtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHJlcztcbiAgICB9KTtcblxuICBjb25zdCBzdGF0ID0gKGl0ZW06IElTTUFQSVJlc3VsdCk6IENvbXBhdGliaWxpdHlTdGF0dXMgPT4ge1xuICAgIGNvbnN0IHN0YXR1cyA9IGl0ZW0ubWV0YWRhdGE/LmNvbXBhdGliaWxpdHlTdGF0dXM/LnRvTG93ZXJDYXNlPy4oKTtcbiAgICBpZiAoIWNvbXBhdGliaWxpdHlPcHRpb25zLmluY2x1ZGVzKHN0YXR1cyBhcyBhbnkpKSB7XG4gICAgICByZXR1cm4gJ3Vua25vd24nO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc3RhdHVzIGFzIENvbXBhdGliaWxpdHlTdGF0dXM7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY29tcGF0aWJpbGl0eVByaW8gPSAoaXRlbTogSVNNQVBJUmVzdWx0KSA9PiBjb21wYXRpYmlsaXR5T3B0aW9ucy5pbmRleE9mKHN0YXQoaXRlbSkpO1xuXG4gIHJldHVybiBzbWFwaS5maW5kQnlOYW1lcyhxdWVyeSlcbiAgICAudGhlbihyZXN1bHRzID0+IHtcbiAgICAgIGNvbnN0IHdvcnN0U3RhdHVzOiBJU01BUElSZXN1bHRbXSA9IHJlc3VsdHNcbiAgICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBjb21wYXRpYmlsaXR5UHJpbyhsaHMpIC0gY29tcGF0aWJpbGl0eVByaW8ocmhzKSk7XG4gICAgICBpZiAod29yc3RTdGF0dXMubGVuZ3RoID4gMCkge1xuICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGVzKGdhbWVJZCwgbW9kSWQsIHtcbiAgICAgICAgICBsYXN0U01BUElRdWVyeTogbm93LFxuICAgICAgICAgIGNvbXBhdGliaWxpdHlTdGF0dXM6IHdvcnN0U3RhdHVzWzBdLm1ldGFkYXRhLmNvbXBhdGliaWxpdHlTdGF0dXMsXG4gICAgICAgICAgY29tcGF0aWJpbGl0eU1lc3NhZ2U6IHdvcnN0U3RhdHVzWzBdLm1ldGFkYXRhLmNvbXBhdGliaWxpdHlTdW1tYXJ5LFxuICAgICAgICAgIGNvbXBhdGliaWxpdHlVcGRhdGU6IHdvcnN0U3RhdHVzWzBdLnN1Z2dlc3RlZFVwZGF0ZT8udmVyc2lvbixcbiAgICAgICAgfSkpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbG9nKCdkZWJ1ZycsICdubyBtYW5pZmVzdCcpO1xuICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoZ2FtZUlkLCBtb2RJZCwgJ2xhc3RTTUFQSVF1ZXJ5Jywgbm93KSk7XG4gICAgICB9XG4gICAgfSlcbiAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgIGxvZygnd2FybicsICdlcnJvciByZWFkaW5nIG1hbmlmZXN0JywgZXJyLm1lc3NhZ2UpO1xuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TW9kQXR0cmlidXRlKGdhbWVJZCwgbW9kSWQsICdsYXN0U01BUElRdWVyeScsIG5vdykpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBpbml0KGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XG4gIGxldCBkZXBlbmRlbmN5TWFuYWdlcjogRGVwZW5kZW5jeU1hbmFnZXI7XG4gIGNvbnN0IGdldERpc2NvdmVyeVBhdGggPSAoKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgR0FNRV9JRF0sIHVuZGVmaW5lZCk7XG4gICAgaWYgKChkaXNjb3ZlcnkgPT09IHVuZGVmaW5lZCkgfHwgKGRpc2NvdmVyeS5wYXRoID09PSB1bmRlZmluZWQpKSB7XG4gICAgICAvLyBzaG91bGQgbmV2ZXIgaGFwcGVuIGFuZCBpZiBpdCBkb2VzIGl0IHdpbGwgY2F1c2UgZXJyb3JzIGVsc2V3aGVyZSBhcyB3ZWxsXG4gICAgICBsb2coJ2Vycm9yJywgJ3N0YXJkZXd2YWxsZXkgd2FzIG5vdCBkaXNjb3ZlcmVkJyk7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHJldHVybiBkaXNjb3ZlcnkucGF0aDtcbiAgfVxuXG4gIGNvbnN0IGdldFNNQVBJUGF0aCA9IChnYW1lKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWRbZ2FtZS5pZF07XG4gICAgcmV0dXJuIGRpc2NvdmVyeS5wYXRoO1xuICB9OztcblxuICBjb25zdCBtYW5pZmVzdEV4dHJhY3RvciA9IHRvQmx1ZShcbiAgICBhc3luYyAobW9kSW5mbzogYW55LCBtb2RQYXRoPzogc3RyaW5nKTogUHJvbWlzZTx7IFtrZXk6IHN0cmluZ106IGFueTsgfT4gPT4ge1xuICAgICAgaWYgKHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSkgIT09IEdBTUVfSUQpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7fSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG1hbmlmZXN0cyA9IGF3YWl0IGdldE1vZE1hbmlmZXN0cyhtb2RQYXRoKTtcblxuICAgICAgY29uc3QgcGFyc2VkTWFuaWZlc3RzID0gKGF3YWl0IFByb21pc2UuYWxsKG1hbmlmZXN0cy5tYXAoXG4gICAgICAgIGFzeW5jIG1hbmlmZXN0ID0+IHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHBhcnNlTWFuaWZlc3QobWFuaWZlc3QpO1xuICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgbG9nKCd3YXJuJywgJ0ZhaWxlZCB0byBwYXJzZSBtYW5pZmVzdCcsIHsgbWFuaWZlc3RGaWxlOiBtYW5pZmVzdCwgZXJyb3I6IGVyci5tZXNzYWdlIH0pO1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pKSkuZmlsdGVyKG1hbmlmZXN0ID0+IG1hbmlmZXN0ICE9PSB1bmRlZmluZWQpO1xuXG4gICAgICBpZiAocGFyc2VkTWFuaWZlc3RzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHt9KTtcbiAgICAgIH1cblxuICAgICAgLy8gd2UgY2FuIG9ubHkgdXNlIG9uZSBtYW5pZmVzdCB0byBnZXQgdGhlIGlkIGZyb21cbiAgICAgIGNvbnN0IHJlZk1hbmlmZXN0ID0gcGFyc2VkTWFuaWZlc3RzWzBdO1xuXG4gICAgICBjb25zdCBhZGRpdGlvbmFsTG9naWNhbEZpbGVOYW1lcyA9IHBhcnNlZE1hbmlmZXN0c1xuICAgICAgICAuZmlsdGVyKG1hbmlmZXN0ID0+IG1hbmlmZXN0LlVuaXF1ZUlEICE9PSB1bmRlZmluZWQpXG4gICAgICAgIC5tYXAobWFuaWZlc3QgPT4gbWFuaWZlc3QuVW5pcXVlSUQudG9Mb3dlckNhc2UoKSk7XG5cbiAgICAgIGNvbnN0IG1pblNNQVBJVmVyc2lvbiA9IHBhcnNlZE1hbmlmZXN0c1xuICAgICAgICAubWFwKG1hbmlmZXN0ID0+IG1hbmlmZXN0Lk1pbmltdW1BcGlWZXJzaW9uKVxuICAgICAgICAuZmlsdGVyKHZlcnNpb24gPT4gc2VtdmVyLnZhbGlkKHZlcnNpb24pKVxuICAgICAgICAuc29ydCgobGhzLCByaHMpID0+IHNlbXZlci5jb21wYXJlKHJocywgbGhzKSlbMF07XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IHtcbiAgICAgICAgYWRkaXRpb25hbExvZ2ljYWxGaWxlTmFtZXMsXG4gICAgICAgIG1pblNNQVBJVmVyc2lvbixcbiAgICAgIH07XG5cbiAgICAgIGlmIChyZWZNYW5pZmVzdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGRvbid0IHNldCBhIGN1c3RvbSBmaWxlIG5hbWUgZm9yIFNNQVBJXG4gICAgICAgIGlmIChtb2RJbmZvLmRvd25sb2FkLm1vZEluZm8/Lm5leHVzPy5pZHM/Lm1vZElkICE9PSAyNDAwKSB7XG4gICAgICAgICAgcmVzdWx0WydjdXN0b21GaWxlTmFtZSddID0gcmVmTWFuaWZlc3QuTmFtZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0eXBlb2YgKHJlZk1hbmlmZXN0LlZlcnNpb24pID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIHJlc3VsdFsnbWFuaWZlc3RWZXJzaW9uJ10gPSByZWZNYW5pZmVzdC5WZXJzaW9uO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzdWx0KTtcbiAgICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyR2FtZShuZXcgU3RhcmRld1ZhbGxleShjb250ZXh0KSk7XG4gIGNvbnRleHQucmVnaXN0ZXJSZWR1Y2VyKFsnc2V0dGluZ3MnLCAnU0RWJ10sIHNkdlJlZHVjZXJzKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyU2V0dGluZ3MoJ01vZHMnLCBTZXR0aW5ncywgKCkgPT4gKHtcbiAgICBvbk1lcmdlQ29uZmlnVG9nZ2xlOiBhc3luYyAocHJvZmlsZUlkOiBzdHJpbmcsIGVuYWJsZWQ6IGJvb2xlYW4pID0+IHtcbiAgICAgIGlmICghZW5hYmxlZCkge1xuICAgICAgICBhd2FpdCBvblJldmVydEZpbGVzKGNvbnRleHQuYXBpLCBwcm9maWxlSWQpO1xuICAgICAgICBjb250ZXh0LmFwaS5zZW5kTm90aWZpY2F0aW9uKHsgdHlwZTogJ2luZm8nLCBtZXNzYWdlOiAnTW9kIGNvbmZpZ3MgcmV0dXJuZWQgdG8gdGhlaXIgcmVzcGVjdGl2ZSBtb2RzJywgZGlzcGxheU1TOiA1MDAwIH0pO1xuICAgICAgfVxuICAgICAgY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2goc2V0TWVyZ2VDb25maWdzKHByb2ZpbGVJZCwgZW5hYmxlZCkpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cbiAgfSksICgpID0+IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSkgPT09IEdBTUVfSUQsIDE1MCk7XG5cbiAgLy8gUmVnaXN0ZXIgb3VyIFNNQVBJIG1vZCB0eXBlIGFuZCBpbnN0YWxsZXIuIE5vdGU6IFRoaXMgY3VycmVudGx5IGZsYWdzIGFuIGVycm9yIGluIFZvcnRleCBvbiBpbnN0YWxsaW5nIGNvcnJlY3RseS5cbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc21hcGktaW5zdGFsbGVyJywgMzAsIHRvQmx1ZSh0ZXN0U01BUEkpLCB0b0JsdWUoKGZpbGVzLCBkZXN0KSA9PiBQcm9taXNlLnJlc29sdmUoaW5zdGFsbFNNQVBJKGdldERpc2NvdmVyeVBhdGgsIGZpbGVzLCBkZXN0KSkpKTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc2R2cm9vdGZvbGRlcicsIDUwLCB0b0JsdWUodGVzdFJvb3RGb2xkZXIpLCB0b0JsdWUoaW5zdGFsbFJvb3RGb2xkZXIpKTtcbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignc3RhcmRldy12YWxsZXktaW5zdGFsbGVyJywgNTAsIHRvQmx1ZSh0ZXN0U3VwcG9ydGVkKSxcbiAgICB0b0JsdWUoYXN5bmMgKGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpID0+IHtcbiAgICAgIGNvbnN0IGluc3RydWN0aW9uQXJyYXlzID0gYXdhaXQgaW5zdGFsbChjb250ZXh0LmFwaSwgZGVwZW5kZW5jeU1hbmFnZXIsIGZpbGVzLCBkZXN0aW5hdGlvblBhdGgpO1xuICAgICAgLy8gRmxhdHRlbiB0aGUgYXJyYXkgb2YgaW5zdHJ1Y3Rpb24gYXJyYXlzIGludG8gYSBzaW5nbGUgYXJyYXlcbiAgICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IGluc3RydWN0aW9uQXJyYXlzLmZsYXQoKTtcbiAgICAgIHJldHVybiB7IGluc3RydWN0aW9ucyB9O1xuICAgIH0pKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnU01BUEknLCAzMCwgZ2FtZUlkID0+IGdhbWVJZCA9PT0gR0FNRV9JRCwgZ2V0U01BUElQYXRoLCB0b0JsdWUoaXNTTUFQSU1vZFR5cGUpKTtcbiAgY29udGV4dC5yZWdpc3Rlck1vZFR5cGUoTU9EX1RZUEVfQ09ORklHLCAzMCwgKGdhbWVJZCkgPT4gKGdhbWVJZCA9PT0gR0FNRV9JRCksXG4gICAgKCkgPT4gcGF0aC5qb2luKGdldERpc2NvdmVyeVBhdGgoKSwgZGVmYXVsdE1vZHNSZWxQYXRoKCkpLCB0b0JsdWUoKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGZhbHNlKSkpO1xuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnc2R2cm9vdGZvbGRlcicsIDI1LCAoZ2FtZUlkKSA9PiAoZ2FtZUlkID09PSBHQU1FX0lEKSxcbiAgICAoKSA9PiBnZXREaXNjb3ZlcnlQYXRoKCksIHRvQmx1ZSgoaW5zdHJ1Y3Rpb25zKSA9PiB7XG4gICAgICAvLyBPbmx5IGludGVyZXN0ZWQgaW4gY29weSBpbnN0cnVjdGlvbnMuXG4gICAgICBjb25zdCBjb3B5SW5zdHJ1Y3Rpb25zID0gaW5zdHJ1Y3Rpb25zLmZpbHRlcihpbnN0ciA9PiBpbnN0ci50eXBlID09PSAnY29weScpO1xuICAgICAgLy8gVGhpcyBpcyBhIHRyaWNreSBwYXR0ZXJuIHNvIHdlJ3JlIGdvaW5nIHRvIDFzdCBwcmVzZW50IHRoZSBkaWZmZXJlbnQgcGFja2FnaW5nXG4gICAgICAvLyAgcGF0dGVybnMgd2UgbmVlZCB0byBjYXRlciBmb3I6XG4gICAgICAvLyAgMS4gUmVwbGFjZW1lbnQgbW9kIHdpdGggXCJDb250ZW50XCIgZm9sZGVyLiBEb2VzIG5vdCByZXF1aXJlIFNNQVBJIHNvIG5vXG4gICAgICAvLyAgICBtYW5pZmVzdCBmaWxlcyBhcmUgaW5jbHVkZWQuXG4gICAgICAvLyAgMi4gUmVwbGFjZW1lbnQgbW9kIHdpdGggXCJDb250ZW50XCIgZm9sZGVyICsgb25lIG9yIG1vcmUgU01BUEkgbW9kcyBpbmNsdWRlZFxuICAgICAgLy8gICAgYWxvbmdzaWRlIHRoZSBDb250ZW50IGZvbGRlciBpbnNpZGUgYSBcIk1vZHNcIiBmb2xkZXIuXG4gICAgICAvLyAgMy4gQSByZWd1bGFyIFNNQVBJIG1vZCB3aXRoIGEgXCJDb250ZW50XCIgZm9sZGVyIGluc2lkZSB0aGUgbW9kJ3Mgcm9vdCBkaXIuXG4gICAgICAvL1xuICAgICAgLy8gcGF0dGVybiAxOlxuICAgICAgLy8gIC0gRW5zdXJlIHdlIGRvbid0IGhhdmUgbWFuaWZlc3QgZmlsZXNcbiAgICAgIC8vICAtIEVuc3VyZSB3ZSBoYXZlIGEgXCJDb250ZW50XCIgZm9sZGVyXG4gICAgICAvL1xuICAgICAgLy8gVG8gc29sdmUgcGF0dGVybnMgMiBhbmQgMyB3ZSdyZSBnb2luZyB0bzpcbiAgICAgIC8vICBDaGVjayB3aGV0aGVyIHdlIGhhdmUgYW55IG1hbmlmZXN0IGZpbGVzLCBpZiB3ZSBkbywgd2UgZXhwZWN0IHRoZSBmb2xsb3dpbmdcbiAgICAgIC8vICAgIGFyY2hpdmUgc3RydWN0dXJlIGluIG9yZGVyIGZvciB0aGUgbW9kVHlwZSB0byBmdW5jdGlvbiBjb3JyZWN0bHk6XG4gICAgICAvLyAgICBhcmNoaXZlLnppcCA9PlxuICAgICAgLy8gICAgICAuLi9Db250ZW50L1xuICAgICAgLy8gICAgICAuLi9Nb2RzL1xuICAgICAgLy8gICAgICAuLi9Nb2RzL0FfU01BUElfTU9EXFxtYW5pZmVzdC5qc29uXG4gICAgICBjb25zdCBoYXNNYW5pZmVzdCA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxuICAgICAgICBpbnN0ci5kZXN0aW5hdGlvbi5lbmRzV2l0aChNQU5JRkVTVF9GSUxFKSlcbiAgICAgIGNvbnN0IGhhc01vZHNGb2xkZXIgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uc3RhcnRzV2l0aChkZWZhdWx0TW9kc1JlbFBhdGgoKSArIHBhdGguc2VwKSkgIT09IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IGhhc0NvbnRlbnRGb2xkZXIgPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cbiAgICAgICAgaW5zdHIuZGVzdGluYXRpb24uc3RhcnRzV2l0aCgnQ29udGVudCcgKyBwYXRoLnNlcCkpICE9PSB1bmRlZmluZWQ7XG5cbiAgICAgIHJldHVybiAoaGFzTWFuaWZlc3QpXG4gICAgICAgID8gUHJvbWlzZS5yZXNvbHZlKGhhc0NvbnRlbnRGb2xkZXIgJiYgaGFzTW9kc0ZvbGRlcilcbiAgICAgICAgOiBQcm9taXNlLnJlc29sdmUoaGFzQ29udGVudEZvbGRlcik7XG4gICAgfSkpO1xuXG4gIHJlZ2lzdGVyQ29uZmlnTW9kKGNvbnRleHQpO1xuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdtb2QtaWNvbnMnLCA5OTksICdjaGFuZ2Vsb2cnLCB7fSwgJ1NNQVBJIExvZycsXG4gICAgKCkgPT4geyBvblNob3dTTUFQSUxvZyhjb250ZXh0LmFwaSk7IH0sXG4gICAgKCkgPT4ge1xuICAgICAgLy9Pbmx5IHNob3cgdGhlIFNNQVBJIGxvZyBidXR0b24gZm9yIFNEVi4gXG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBnYW1lTW9kZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xuICAgICAgcmV0dXJuIChnYW1lTW9kZSA9PT0gR0FNRV9JRCk7XG4gICAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlckF0dHJpYnV0ZUV4dHJhY3RvcigyNSwgdG9CbHVlKG1hbmlmZXN0RXh0cmFjdG9yKSk7XG5cbiAgY29udGV4dC5yZWdpc3RlclRhYmxlQXR0cmlidXRlKCdtb2RzJywge1xuICAgIGlkOiAnc2R2LWNvbXBhdGliaWxpdHknLFxuICAgIHBvc2l0aW9uOiAxMDAsXG4gICAgY29uZGl0aW9uOiAoKSA9PiBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKGNvbnRleHQuYXBpLmdldFN0YXRlKCkpID09PSBHQU1FX0lELFxuICAgIHBsYWNlbWVudDogJ3RhYmxlJyxcbiAgICBjYWxjOiAobW9kOiB0eXBlcy5JTW9kKSA9PiBtb2QuYXR0cmlidXRlcz8uY29tcGF0aWJpbGl0eVN0YXR1cyxcbiAgICBjdXN0b21SZW5kZXJlcjogKG1vZDogdHlwZXMuSU1vZCwgZGV0YWlsQ2VsbDogYm9vbGVhbiwgdDogdHlwZXMuVEZ1bmN0aW9uKSA9PiB7XG4gICAgICByZXR1cm4gUmVhY3QuY3JlYXRlRWxlbWVudChDb21wYXRpYmlsaXR5SWNvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHsgdCwgbW9kLCBkZXRhaWxDZWxsIH0sIFtdKTtcbiAgICB9LFxuICAgIG5hbWU6ICdDb21wYXRpYmlsaXR5JyxcbiAgICBpc0RlZmF1bHRWaXNpYmxlOiB0cnVlLFxuICAgIGVkaXQ6IHt9LFxuICB9KTtcblxuICAvKlxuICBjb250ZXh0LnJlZ2lzdGVyVGVzdCgnc2R2LW1pc3NpbmctZGVwZW5kZW5jaWVzJywgJ2dhbWVtb2RlLWFjdGl2YXRlZCcsXG4gICAgKCkgPT4gdGVzdE1pc3NpbmdEZXBlbmRlbmNpZXMoY29udGV4dC5hcGksIGRlcGVuZGVuY3lNYW5hZ2VyKSk7XG4gICovXG4gIGNvbnRleHQucmVnaXN0ZXJUZXN0KCdzZHYtaW5jb21wYXRpYmxlLW1vZHMnLCAnZ2FtZW1vZGUtYWN0aXZhdGVkJyxcbiAgICB0b0JsdWUoKCkgPT4gUHJvbWlzZS5yZXNvbHZlKHRlc3RTTUFQSU91dGRhdGVkKGNvbnRleHQuYXBpLCBkZXBlbmRlbmN5TWFuYWdlcikpKSk7XG5cbiAgY29udGV4dC5vbmNlKCgpID0+IHtcbiAgICBjb25zdCBwcm94eSA9IG5ldyBTTUFQSVByb3h5KGNvbnRleHQuYXBpKTtcbiAgICBjb250ZXh0LmFwaS5zZXRTdHlsZXNoZWV0KCdzZHYnLCBwYXRoLmpvaW4oX19kaXJuYW1lLCAnc2R2c3R5bGUuc2NzcycpKTtcblxuICAgIGNvbnRleHQuYXBpLmFkZE1ldGFTZXJ2ZXIoJ3NtYXBpLmlvJywge1xuICAgICAgdXJsOiAnJyxcbiAgICAgIGxvb3BiYWNrQ0I6IHRvQmx1ZSgocXVlcnk6IElRdWVyeSkgPT4ge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHByb3h5LmZpbmQocXVlcnkpKVxuICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gbG9vayB1cCBzbWFwaSBtZXRhIGluZm8nLCBlcnIubWVzc2FnZSk7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFtdKTtcbiAgICAgICAgICB9KTtcbiAgICAgIH0pLFxuICAgICAgY2FjaGVEdXJhdGlvblNlYzogODY0MDAsXG4gICAgICBwcmlvcml0eTogMjUsXG4gICAgfSk7XG4gICAgZGVwZW5kZW5jeU1hbmFnZXIgPSBuZXcgRGVwZW5kZW5jeU1hbmFnZXIoY29udGV4dC5hcGkpO1xuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ2FkZGVkLWZpbGVzJywgKHByb2ZpbGVJZDogc3RyaW5nLCBmaWxlczogYW55W10pID0+IG9uQWRkZWRGaWxlcyhjb250ZXh0LmFwaSwgcHJvZmlsZUlkLCBmaWxlcykgYXMgYW55KTtcblxuICAgIGNvbnRleHQuYXBpLm9uQXN5bmMoJ3dpbGwtZW5hYmxlLW1vZHMnLCAocHJvZmlsZUlkOiBzdHJpbmcsIG1vZElkczogc3RyaW5nW10sIGVuYWJsZWQ6IGJvb2xlYW4sIG9wdGlvbnM6IGFueSkgPT4gb25XaWxsRW5hYmxlTW9kcyhjb250ZXh0LmFwaSwgcHJvZmlsZUlkLCBtb2RJZHMsIGVuYWJsZWQsIG9wdGlvbnMpIGFzIGFueSk7XG5cbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgYXN5bmMgKHByb2ZpbGVJZCkgPT4ge1xuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgICAgIGlmIChwcm9maWxlPy5nYW1lSWQgIT09IEdBTUVfSUQpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzbWFwaU1vZCA9IGZpbmRTTUFQSU1vZChjb250ZXh0LmFwaSk7XG4gICAgICBjb25zdCBwcmltYXJ5VG9vbCA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdpbnRlcmZhY2UnLCAncHJpbWFyeVRvb2wnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgICAgIGlmIChzbWFwaU1vZCAmJiBwcmltYXJ5VG9vbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgJ3NtYXBpJykpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSk7XG5cbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtcHVyZ2UnLCBhc3luYyAocHJvZmlsZUlkKSA9PiB7XG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLnByb2ZpbGVCeUlkKHN0YXRlLCBwcm9maWxlSWQpO1xuICAgICAgaWYgKHByb2ZpbGU/LmdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNtYXBpTW9kID0gZmluZFNNQVBJTW9kKGNvbnRleHQuYXBpKTtcbiAgICAgIGNvbnN0IHByaW1hcnlUb29sID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2ludGVyZmFjZScsICdwcmltYXJ5VG9vbCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xuICAgICAgaWYgKHNtYXBpTW9kICYmIHByaW1hcnlUb29sID09PSAnc21hcGknKSB7XG4gICAgICAgIGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0UHJpbWFyeVRvb2woR0FNRV9JRCwgdW5kZWZpbmVkKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9KTtcblxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZGlkLWluc3RhbGwtbW9kJywgKGdhbWVJZDogc3RyaW5nLCBhcmNoaXZlSWQ6IHN0cmluZywgbW9kSWQ6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB1cGRhdGVDb25mbGljdEluZm8oY29udGV4dC5hcGksIHByb3h5LCBnYW1lSWQsIG1vZElkKVxuICAgICAgICAudGhlbigoKSA9PiBsb2coJ2RlYnVnJywgJ2FkZGVkIGNvbXBhdGliaWxpdHkgaW5mbycsIHsgbW9kSWQgfSkpXG4gICAgICAgIC5jYXRjaChlcnIgPT4gbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gYWRkIGNvbXBhdGliaWxpdHkgaW5mbycsIHsgbW9kSWQsIGVycm9yOiBlcnIubWVzc2FnZSB9KSk7XG5cbiAgICB9KTtcblxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbignZ2FtZW1vZGUtYWN0aXZhdGVkJywgKGdhbWVNb2RlOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChnYW1lTW9kZSAhPT0gR0FNRV9JRCkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgICAgIGxvZygnZGVidWcnLCAndXBkYXRpbmcgU0RWIGNvbXBhdGliaWxpdHkgaW5mbycpO1xuICAgICAgUHJvbWlzZS5hbGwoT2JqZWN0LmtleXMoc3RhdGUucGVyc2lzdGVudC5tb2RzW2dhbWVNb2RlXSA/PyB7fSkubWFwKG1vZElkID0+XG4gICAgICAgIHVwZGF0ZUNvbmZsaWN0SW5mbyhjb250ZXh0LmFwaSwgcHJveHksIGdhbWVNb2RlLCBtb2RJZCkpKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgbG9nKCdkZWJ1ZycsICdkb25lIHVwZGF0aW5nIGNvbXBhdGliaWxpdHkgaW5mbycpO1xuICAgICAgICB9KVxuICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byB1cGRhdGUgY29uZmxpY3QgaW5mbycsIGVyci5tZXNzYWdlKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBpbml0O1xuIl19