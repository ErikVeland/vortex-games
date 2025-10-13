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
exports.getPlayerProfiles = void 0;
exports.getGamePath = getGamePath;
exports.getGameDataPath = getGameDataPath;
exports.documentsPath = documentsPath;
exports.modsPath = modsPath;
exports.profilesPath = profilesPath;
exports.globalProfilePath = globalProfilePath;
exports.gameSupportsProfile = gameSupportsProfile;
exports.getOwnGameVersion = getOwnGameVersion;
exports.getActivePlayerProfile = getActivePlayerProfile;
exports.parseModNode = parseModNode;
exports.logError = logError;
exports.logDebug = logDebug;
exports.forceRefresh = forceRefresh;
exports.findNode = findNode;
exports.getLatestInstalledLSLibVer = getLatestInstalledLSLibVer;
exports.getDefaultModSettingsFormat = getDefaultModSettingsFormat;
exports.getDefaultModSettings = getDefaultModSettings;
exports.convertToV8 = convertToV8;
exports.convertV6toV7 = convertV6toV7;
exports.getLatestLSLibMod = getLatestLSLibMod;
exports.extractPakInfoImpl = extractPakInfoImpl;
exports.extractMeta = extractMeta;
exports.writeModSettings = writeModSettings;
exports.parseLSXFile = parseLSXFile;
exports.readModSettings = readModSettings;
exports.readStoredLO = readStoredLO;
const path = __importStar(require("path"));
const semver = __importStar(require("semver"));
const shortid_1 = require("shortid");
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const xml2js_1 = require("xml2js");
const common_1 = require("./common");
const divineWrapper_1 = require("./divineWrapper");
function getGamePath(api) {
    var _a, _b;
    const state = api.getState();
    return (_b = (_a = state.settings.gameMode.discovered) === null || _a === void 0 ? void 0 : _a[common_1.GAME_ID]) === null || _b === void 0 ? void 0 : _b.path;
}
function getGameDataPath(api) {
    var _a, _b;
    const state = api.getState();
    const gamePath = (_b = (_a = state.settings.gameMode.discovered) === null || _a === void 0 ? void 0 : _a[common_1.GAME_ID]) === null || _b === void 0 ? void 0 : _b.path;
    if (gamePath !== undefined) {
        return path.join(gamePath, 'Data');
    }
    else {
        return undefined;
    }
}
function documentsPath() {
    return path.join(vortex_api_1.util.getVortexPath('localAppData'), 'Larian Studios', 'Baldur\'s Gate 3');
}
function modsPath() {
    return path.join(documentsPath(), 'Mods');
}
function profilesPath() {
    return path.join(documentsPath(), 'PlayerProfiles');
}
function globalProfilePath(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const bg3ProfileId = yield getActivePlayerProfile(api);
        return path.join(documentsPath(), bg3ProfileId);
    });
}
exports.getPlayerProfiles = (() => {
    let cached = [];
    try {
        cached = vortex_api_1.fs.readdirSync(profilesPath())
            .filter(name => (path.extname(name) === '') && (name !== 'Default'));
    }
    catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }
    return () => cached;
})();
function gameSupportsProfile(gameVersion) {
    return semver.lt(semver.coerce(gameVersion), '4.1.206');
}
function getOwnGameVersion(state) {
    return __awaiter(this, void 0, void 0, function* () {
        const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
        return yield vortex_api_1.util.getGame(common_1.GAME_ID).getInstalledVersion(discovery);
    });
}
function getActivePlayerProfile(api) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        return gameSupportsProfile(yield getOwnGameVersion(api.getState()))
            ? ((_a = api.store.getState().settings.baldursgate3) === null || _a === void 0 ? void 0 : _a.playerProfile) || 'global'
            : 'Public';
    });
}
function parseModNode(node) {
    const name = findNode(node.attribute, 'Name').$.value;
    return {
        id: name,
        name,
        data: findNode(node.attribute, 'UUID').$.value,
    };
}
const resolveMeta = (metadata) => {
    return (metadata !== undefined)
        ? typeof metadata === 'string'
            ? metadata
            : JSON.stringify(metadata)
        : undefined;
};
function logError(message, metadata) {
    const meta = resolveMeta(metadata);
    (0, vortex_api_1.log)('debug', message, meta);
}
function logDebug(message, metadata) {
    if (common_1.DEBUG) {
        const meta = resolveMeta(metadata);
        (0, vortex_api_1.log)('debug', message, meta);
    }
}
function forceRefresh(api) {
    const state = api.getState();
    const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
    const action = {
        type: 'SET_FB_FORCE_UPDATE',
        payload: {
            profileId,
        },
    };
    api.store.dispatch(action);
}
function findNode(nodes, id) {
    var _a;
    return (_a = nodes === null || nodes === void 0 ? void 0 : nodes.find(iter => iter.$.id === id)) !== null && _a !== void 0 ? _a : undefined;
}
function getLatestInstalledLSLibVer(api) {
    const state = api.getState();
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
    return Object.keys(mods).reduce((prev, id) => {
        if (mods[id].type === 'bg3-lslib-divine-tool') {
            const arcId = mods[id].archiveId;
            const dl = vortex_api_1.util.getSafe(state, ['persistent', 'downloads', 'files', arcId], undefined);
            const storedVer = vortex_api_1.util.getSafe(mods[id], ['attributes', 'version'], '0.0.0');
            try {
                if (semver.gt(storedVer, prev)) {
                    prev = storedVer;
                }
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'invalid version stored for lslib mod', { id, version: storedVer });
            }
            if (dl !== undefined) {
                const fileName = path.basename(dl.localPath, path.extname(dl.localPath));
                const idx = fileName.indexOf('-v');
                try {
                    const ver = semver.coerce(fileName.slice(idx + 2)).version;
                    if (semver.valid(ver) && ver !== storedVer) {
                        api.store.dispatch(vortex_api_1.actions.setModAttribute(common_1.GAME_ID, id, 'version', ver));
                        prev = ver;
                    }
                }
                catch (err) {
                    api.store.dispatch(vortex_api_1.actions.setModAttribute(common_1.GAME_ID, id, 'version', '1.0.0'));
                    prev = '1.0.0';
                }
            }
        }
        return prev;
    }, '0.0.0');
}
let _FORMAT = null;
const PATCH_8 = '4.67.58';
const PATCH_7 = '4.58.49';
const PATCH_6 = '4.50.22';
function getDefaultModSettingsFormat(api) {
    return __awaiter(this, void 0, void 0, function* () {
        if (_FORMAT !== null) {
            return _FORMAT;
        }
        _FORMAT = 'v8';
        try {
            const state = api.getState();
            const gameVersion = yield getOwnGameVersion(state);
            const coerced = gameVersion ? semver.coerce(gameVersion) : PATCH_8;
            if (semver.gte(coerced, PATCH_8)) {
                _FORMAT = 'v8';
            }
            else if (semver.gte(coerced, PATCH_7)) {
                _FORMAT = 'v7';
            }
            else if (semver.gte(coerced, PATCH_6)) {
                _FORMAT = 'v6';
            }
            else {
                _FORMAT = 'pre-v6';
            }
        }
        catch (err) {
            (0, vortex_api_1.log)('warn', 'failed to get game version', err);
        }
        return _FORMAT;
    });
}
function getDefaultModSettings(api) {
    return __awaiter(this, void 0, void 0, function* () {
        if (_FORMAT === null) {
            _FORMAT = yield getDefaultModSettingsFormat(api);
        }
        return {
            'v8': common_1.DEFAULT_MOD_SETTINGS_V8,
            'v7': common_1.DEFAULT_MOD_SETTINGS_V7,
            'v6': common_1.DEFAULT_MOD_SETTINGS_V6,
            'pre-v6': common_1.DEFAULT_MOD_SETTINGS_V6
        }[_FORMAT];
    });
}
function convertToV8(someXml) {
    return __awaiter(this, void 0, void 0, function* () {
        const v7Xml = yield convertV6toV7(someXml);
        const v7Json = yield (0, xml2js_1.parseStringPromise)(v7Xml);
        v7Json.save.version[0].$.major = '4';
        v7Json.save.version[0].$.minor = '8';
        v7Json.save.version[0].$.revision = '0';
        v7Json.save.version[0].$.build = '10';
        const moduleSettingsChildren = v7Json.save.region[0].node[0].children[0].node;
        const modsNode = moduleSettingsChildren.find((n) => n.$.id === 'Mods');
        if (modsNode) {
            var gustavEntry = modsNode.children[0].node.find((n) => n.attribute.some((attr) => attr.$.id === 'Name' && attr.$.value === 'GustavDev'));
            if (gustavEntry) {
                gustavEntry.attribute = [
                    { $: { id: 'Folder', type: 'LSString', value: 'GustavX' } },
                    { $: { id: 'MD5', type: 'LSString', value: '' } },
                    { $: { id: 'Name', type: 'LSString', value: 'GustavX' } },
                    { $: { id: 'PublishHandle', type: 'uint64', value: '0' } },
                    { $: { id: 'UUID', type: 'guid', value: 'cb555efe-2d9e-131f-8195-a89329d218ea' } },
                    { $: { id: 'Version64', type: 'int64', value: '36028797018963968' } }
                ];
            }
        }
        const builder = new xml2js_1.Builder();
        const v8Xml = builder.buildObject(v7Json);
        return v8Xml;
    });
}
function convertV6toV7(v6Xml) {
    return __awaiter(this, void 0, void 0, function* () {
        const v6Json = yield (0, xml2js_1.parseStringPromise)(v6Xml);
        v6Json.save.version[0].$.major = '4';
        v6Json.save.version[0].$.minor = '7';
        v6Json.save.version[0].$.revision = '1';
        v6Json.save.version[0].$.build = '3';
        const moduleSettingsChildren = v6Json.save.region[0].node[0].children[0].node;
        const modOrderIndex = moduleSettingsChildren.findIndex((n) => n.$.id === 'ModOrder');
        if (modOrderIndex !== -1) {
            moduleSettingsChildren.splice(modOrderIndex, 1);
        }
        const modsNode = moduleSettingsChildren.find((n) => n.$.id === 'Mods');
        if (modsNode) {
            for (let i = 0; i < modsNode.children[0].node.length; i++) {
                const moduleShortDescNode = modsNode.children[0].node[i];
                if (moduleShortDescNode) {
                    const uuidAttribute = moduleShortDescNode.attribute.find((attr) => attr.$.id === 'UUID');
                    if (uuidAttribute) {
                        uuidAttribute.$.type = 'guid';
                    }
                    const publishHandleAtt = moduleShortDescNode.attribute.find((attr) => attr.$.id === 'PublishHandle');
                    if (publishHandleAtt === undefined) {
                        moduleShortDescNode.attribute.push({
                            $: { id: 'publishHandle', type: 'uint64', value: '0' }
                        });
                    }
                }
            }
        }
        const builder = new xml2js_1.Builder();
        const v7Xml = builder.buildObject(v6Json);
        return v7Xml;
    });
}
function getLatestLSLibMod(api) {
    const state = api.getState();
    const mods = state.persistent.mods[common_1.GAME_ID];
    if (mods === undefined) {
        (0, vortex_api_1.log)('warn', 'LSLib is not installed');
        return undefined;
    }
    const lsLib = Object.keys(mods).reduce((prev, id) => {
        if (mods[id].type === common_1.MOD_TYPE_LSLIB) {
            const latestVer = vortex_api_1.util.getSafe(prev, ['attributes', 'version'], '0.0.0');
            const currentVer = vortex_api_1.util.getSafe(mods[id], ['attributes', 'version'], '0.0.0');
            try {
                if (semver.gt(currentVer, latestVer)) {
                    prev = mods[id];
                }
            }
            catch (err) {
                (0, vortex_api_1.log)('warn', 'invalid mod version', { modId: id, version: currentVer });
            }
        }
        return prev;
    }, undefined);
    if (lsLib === undefined) {
        (0, vortex_api_1.log)('warn', 'LSLib is not installed');
        return undefined;
    }
    return lsLib;
}
function extractPakInfoImpl(api, pakPath, mod, isListed) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const meta = yield extractMeta(api, pakPath, mod);
        const config = findNode((_a = meta === null || meta === void 0 ? void 0 : meta.save) === null || _a === void 0 ? void 0 : _a.region, 'Config');
        const configRoot = findNode(config === null || config === void 0 ? void 0 : config.node, 'root');
        const moduleInfo = findNode((_c = (_b = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.node, 'ModuleInfo');
        const attr = (name, fallback) => { var _a, _b, _c; return (_c = (_b = (_a = findNode(moduleInfo === null || moduleInfo === void 0 ? void 0 : moduleInfo.attribute, name)) === null || _a === void 0 ? void 0 : _a.$) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : fallback(); };
        const genName = path.basename(pakPath, path.extname(pakPath));
        return {
            author: attr('Author', () => 'Unknown'),
            description: attr('Description', () => 'Missing'),
            folder: attr('Folder', () => genName),
            md5: attr('MD5', () => ''),
            name: attr('Name', () => genName),
            type: attr('Type', () => 'Adventure'),
            uuid: attr('UUID', () => require('uuid').v4()),
            version: attr('Version64', () => '1'),
            publishHandle: attr('PublishHandle', () => '0'),
            isListed: isListed
        };
    });
}
function extractMeta(api, pakPath, mod) {
    return __awaiter(this, void 0, void 0, function* () {
        const metaPath = path.join(vortex_api_1.util.getVortexPath('temp'), 'lsmeta', (0, shortid_1.generate)());
        yield vortex_api_1.fs.ensureDirAsync(metaPath);
        yield (0, divineWrapper_1.extractPak)(api, pakPath, metaPath, '*/meta.lsx');
        try {
            let metaLSXPath = path.join(metaPath, 'meta.lsx');
            yield (0, turbowalk_1.default)(metaPath, entries => {
                const temp = entries.find(e => path.basename(e.filePath).toLowerCase() === 'meta.lsx');
                if (temp !== undefined) {
                    metaLSXPath = temp.filePath;
                }
            });
            const dat = yield vortex_api_1.fs.readFileAsync(metaLSXPath);
            const meta = yield (0, xml2js_1.parseStringPromise)(dat);
            yield vortex_api_1.fs.removeAsync(metaPath);
            return meta;
        }
        catch (err) {
            yield vortex_api_1.fs.removeAsync(metaPath);
            if (err.code === 'ENOENT') {
                return Promise.resolve(undefined);
            }
            else if (err.message.includes('Column') && (err.message.includes('Line'))) {
                api.sendNotification({
                    type: 'warning',
                    message: 'The meta.lsx file in "{{modName}}" is invalid, please report this to the author',
                    actions: [{
                            title: 'More',
                            action: () => {
                                api.showDialog('error', 'Invalid meta.lsx file', {
                                    message: err.message,
                                }, [{ label: 'Close' }]);
                            }
                        }],
                    replace: {
                        modName: vortex_api_1.util.renderModName(mod),
                    }
                });
                return Promise.resolve(undefined);
            }
            else {
                throw err;
            }
        }
    });
}
let storedLO = [];
function writeModSettings(api, data, bg3profile) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!bg3profile) {
            return;
        }
        const globalProfile = yield globalProfilePath(api);
        const settingsPath = (bg3profile !== 'global')
            ? path.join(profilesPath(), bg3profile, 'modsettings.lsx')
            : path.join(globalProfile, 'modsettings.lsx');
        const builder = new xml2js_1.Builder();
        const xml = builder.buildObject(data);
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(path.dirname(settingsPath));
            yield vortex_api_1.fs.writeFileAsync(settingsPath, xml);
        }
        catch (err) {
            storedLO = [];
            const allowReport = ['ENOENT', 'EPERM'].includes(err.code);
            api.showErrorNotification('Failed to write mod settings', err, { allowReport });
            return;
        }
    });
}
function parseLSXFile(lsxPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const dat = yield vortex_api_1.fs.readFileAsync(lsxPath, { encoding: 'utf8' });
        return (0, xml2js_1.parseStringPromise)(dat);
    });
}
function readModSettings(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const bg3profile = yield getActivePlayerProfile(api);
        const playerProfiles = (0, exports.getPlayerProfiles)();
        if (playerProfiles.length === 0) {
            storedLO = [];
            const settingsPath = path.join(profilesPath(), 'Public', 'modsettings.lsx');
            return parseLSXFile(settingsPath);
        }
        const globalProfile = yield globalProfilePath(api);
        const settingsPath = (bg3profile !== 'global')
            ? path.join(profilesPath(), bg3profile, 'modsettings.lsx')
            : path.join(globalProfile, 'modsettings.lsx');
        return parseLSXFile(settingsPath);
    });
}
function readStoredLO(api) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        const modSettings = yield readModSettings(api);
        const config = findNode((_a = modSettings === null || modSettings === void 0 ? void 0 : modSettings.save) === null || _a === void 0 ? void 0 : _a.region, 'ModuleSettings');
        const configRoot = findNode(config === null || config === void 0 ? void 0 : config.node, 'root');
        const modOrderRoot = findNode((_c = (_b = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.node, 'ModOrder');
        const modsRoot = findNode((_e = (_d = configRoot === null || configRoot === void 0 ? void 0 : configRoot.children) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.node, 'Mods');
        const modOrderNodes = (_h = (_g = (_f = modOrderRoot === null || modOrderRoot === void 0 ? void 0 : modOrderRoot.children) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.node) !== null && _h !== void 0 ? _h : [];
        const modNodes = (_l = (_k = (_j = modsRoot === null || modsRoot === void 0 ? void 0 : modsRoot.children) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.node) !== null && _l !== void 0 ? _l : [];
        const modOrder = modOrderNodes.map(node => { var _a; return (_a = findNode(node.attribute, 'UUID').$) === null || _a === void 0 ? void 0 : _a.value; });
        const state = api.store.getState();
        const vProfile = vortex_api_1.selectors.activeProfile(state);
        const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {});
        const enabled = Object.keys(mods).filter(id => vortex_api_1.util.getSafe(vProfile, ['modState', id, 'enabled'], false));
        const bg3profile = (_m = state.settings.baldursgate3) === null || _m === void 0 ? void 0 : _m.playerProfile;
        if (enabled.length > 0 && modNodes.length === 1) {
            const lastWrite = (_p = (_o = state.settings.baldursgate3) === null || _o === void 0 ? void 0 : _o.settingsWritten) === null || _p === void 0 ? void 0 : _p[bg3profile];
            if ((lastWrite !== undefined) && (lastWrite.count > 1)) {
                api.showDialog('info', '"modsettings.lsx" file was reset', {
                    text: 'The game reset the list of active mods and ran without them.\n'
                        + 'This happens when an invalid or incompatible mod is installed. '
                        + 'The game will not load any mods if one of them is incompatible, unfortunately '
                        + 'there is no easy way to find out which one caused the problem.',
                }, [
                    { label: 'Continue' },
                ]);
            }
        }
        storedLO = modNodes
            .map(node => parseModNode(node))
            .filter(entry => !entry.id.startsWith('Gustav'))
            .sort((lhs, rhs) => modOrder
            .findIndex(i => i === lhs.data) - modOrder.findIndex(i => i === rhs.data));
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBV0Esa0NBR0M7QUFFRCwwQ0FRQztBQUVELHNDQUVDO0FBRUQsNEJBRUM7QUFFRCxvQ0FFQztBQUVELDhDQUdDO0FBZUQsa0RBRUM7QUFFRCw4Q0FHQztBQUVELHdEQUlDO0FBRUQsb0NBT0M7QUFVRCw0QkFHQztBQUVELDRCQU1DO0FBRUQsb0NBVUM7QUFFRCw0QkFFQztBQUVELGdFQTJDQztBQU1ELGtFQXdCQztBQUVELHNEQVVDO0FBRUQsa0NBZ0NDO0FBRUQsc0NBNENDO0FBRUQsOENBNEJDO0FBRUQsZ0RBdUJDO0FBRUQsa0NBNENDO0FBR0QsNENBcUJDO0FBRUQsb0NBR0M7QUFFRCwwQ0FjQztBQUVELG9DQXNDQztBQW5kRCwyQ0FBNkI7QUFDN0IsK0NBQWlDO0FBQ2pDLHFDQUE4QztBQUM5QywwREFBNkI7QUFDN0IsMkNBQXNFO0FBQ3RFLG1DQUFxRDtBQUNyRCxxQ0FBcUk7QUFDckksbURBQTZDO0FBRzdDLFNBQWdCLFdBQVcsQ0FBQyxHQUFHOztJQUM3QixNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7SUFDN0IsT0FBTyxNQUFBLE1BQUEsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSwwQ0FBRyxnQkFBTyxDQUFDLDBDQUFFLElBQWMsQ0FBQztBQUN2RSxDQUFDO0FBRUQsU0FBZ0IsZUFBZSxDQUFDLEdBQUc7O0lBQ2pDLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztJQUM3QixNQUFNLFFBQVEsR0FBRyxNQUFBLE1BQUEsS0FBSyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSwwQ0FBRyxnQkFBTyxDQUFDLDBDQUFFLElBQUksQ0FBQztJQUNyRSxJQUFJLFFBQVEs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QUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsQ0FBQyxRQUFRO2FBQ3pCLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUNqRixDQUFDO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0IHsgZ2VuZXJhdGUgYXMgc2hvcnRpZCB9IGZyb20gJ3Nob3J0aWQnO1xuaW1wb3J0IHdhbGsgZnJvbSAndHVyYm93YWxrJztcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCB0eXBlcywgc2VsZWN0b3JzLCBsb2csIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IEJ1aWxkZXIsIHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XG5pbXBvcnQgeyBERUJVRywgTU9EX1RZUEVfTFNMSUIsIEdBTUVfSUQsIERFRkFVTFRfTU9EX1NFVFRJTkdTX1Y4LCBERUZBVUxUX01PRF9TRVRUSU5HU19WNywgREVGQVVMVF9NT0RfU0VUVElOR1NfVjYgfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBleHRyYWN0UGFrIH0gZnJvbSAnLi9kaXZpbmVXcmFwcGVyJztcbmltcG9ydCB7IElNb2RTZXR0aW5ncywgSVBha0luZm8sIElNb2ROb2RlLCBJWG1sTm9kZSwgTE9Gb3JtYXQgfSBmcm9tICcuL3R5cGVzJztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEdhbWVQYXRoKGFwaSk6IHN0cmluZyB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIHJldHVybiBzdGF0ZS5zZXR0aW5ncy5nYW1lTW9kZS5kaXNjb3ZlcmVkPy5bR0FNRV9JRF0/LnBhdGggYXMgc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0R2FtZURhdGFQYXRoKGFwaSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBnYW1lUGF0aCA9IHN0YXRlLnNldHRpbmdzLmdhbWVNb2RlLmRpc2NvdmVyZWQ/LltHQU1FX0lEXT8ucGF0aDtcbiAgaWYgKGdhbWVQYXRoICE9PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gcGF0aC5qb2luKGdhbWVQYXRoLCAnRGF0YScpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRvY3VtZW50c1BhdGgoKSB7XG4gIHJldHVybiBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCdsb2NhbEFwcERhdGEnKSwgJ0xhcmlhbiBTdHVkaW9zJywgJ0JhbGR1clxcJ3MgR2F0ZSAzJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtb2RzUGF0aCgpIHtcbiAgcmV0dXJuIHBhdGguam9pbihkb2N1bWVudHNQYXRoKCksICdNb2RzJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm9maWxlc1BhdGgoKSB7XG4gIHJldHVybiBwYXRoLmpvaW4oZG9jdW1lbnRzUGF0aCgpLCAnUGxheWVyUHJvZmlsZXMnKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdsb2JhbFByb2ZpbGVQYXRoKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICBjb25zdCBiZzNQcm9maWxlSWQgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XG4gIHJldHVybiBwYXRoLmpvaW4oZG9jdW1lbnRzUGF0aCgpLCBiZzNQcm9maWxlSWQpO1xufVxuXG5leHBvcnQgY29uc3QgZ2V0UGxheWVyUHJvZmlsZXMgPSAoKCkgPT4ge1xuICBsZXQgY2FjaGVkID0gW107XG4gIHRyeSB7XG4gICAgY2FjaGVkID0gKGZzIGFzIGFueSkucmVhZGRpclN5bmMocHJvZmlsZXNQYXRoKCkpXG4gICAgICAuZmlsdGVyKG5hbWUgPT4gKHBhdGguZXh0bmFtZShuYW1lKSA9PT0gJycpICYmIChuYW1lICE9PSAnRGVmYXVsdCcpKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgaWYgKGVyci5jb2RlICE9PSAnRU5PRU5UJykge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxuICByZXR1cm4gKCkgPT4gY2FjaGVkO1xufSkoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdhbWVTdXBwb3J0c1Byb2ZpbGUoZ2FtZVZlcnNpb246IHN0cmluZykge1xuICByZXR1cm4gc2VtdmVyLmx0KHNlbXZlci5jb2VyY2UoZ2FtZVZlcnNpb24pLCAnNC4xLjIwNicpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0T3duR2FtZVZlcnNpb24oc3RhdGU6IHR5cGVzLklTdGF0ZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICByZXR1cm4gYXdhaXQgdXRpbC5nZXRHYW1lKEdBTUVfSUQpLmdldEluc3RhbGxlZFZlcnNpb24oZGlzY292ZXJ5KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldEFjdGl2ZVBsYXllclByb2ZpbGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgcmV0dXJuIGdhbWVTdXBwb3J0c1Byb2ZpbGUoYXdhaXQgZ2V0T3duR2FtZVZlcnNpb24oYXBpLmdldFN0YXRlKCkpKVxuICAgID8gYXBpLnN0b3JlLmdldFN0YXRlKCkuc2V0dGluZ3MuYmFsZHVyc2dhdGUzPy5wbGF5ZXJQcm9maWxlIHx8ICdnbG9iYWwnXG4gICAgOiAnUHVibGljJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlTW9kTm9kZShub2RlOiBJTW9kTm9kZSkge1xuICBjb25zdCBuYW1lID0gZmluZE5vZGUobm9kZS5hdHRyaWJ1dGUsICdOYW1lJykuJC52YWx1ZTtcbiAgcmV0dXJuIHtcbiAgICBpZDogbmFtZSxcbiAgICBuYW1lLFxuICAgIGRhdGE6IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQudmFsdWUsXG4gIH07XG59XG5cbmNvbnN0IHJlc29sdmVNZXRhID0gKG1ldGFkYXRhPzogYW55KSA9PiB7XG4gIHJldHVybiAobWV0YWRhdGEgIT09IHVuZGVmaW5lZClcbiAgICA/IHR5cGVvZiBtZXRhZGF0YSA9PT0gJ3N0cmluZydcbiAgICAgID8gbWV0YWRhdGFcbiAgICAgIDogSlNPTi5zdHJpbmdpZnkobWV0YWRhdGEpXG4gICAgOiB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2dFcnJvcihtZXNzYWdlOiBzdHJpbmcsIG1ldGFkYXRhPzogYW55KSB7XG4gIGNvbnN0IG1ldGEgPSByZXNvbHZlTWV0YShtZXRhZGF0YSk7XG4gIGxvZygnZGVidWcnLCBtZXNzYWdlLCBtZXRhKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvZ0RlYnVnKG1lc3NhZ2U6IHN0cmluZywgbWV0YWRhdGE/OiBhbnkpIHtcbiAgaWYgKERFQlVHKSB7XG4gICAgLy8gc28gbWV0YVxuICAgIGNvbnN0IG1ldGEgPSByZXNvbHZlTWV0YShtZXRhZGF0YSk7XG4gICAgbG9nKCdkZWJ1ZycsIG1lc3NhZ2UsIG1ldGEpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmb3JjZVJlZnJlc2goYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICBjb25zdCBhY3Rpb24gPSB7XG4gICAgdHlwZTogJ1NFVF9GQl9GT1JDRV9VUERBVEUnLFxuICAgIHBheWxvYWQ6IHtcbiAgICAgIHByb2ZpbGVJZCxcbiAgICB9LFxuICB9O1xuICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9uKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmROb2RlPFQgZXh0ZW5kcyBJWG1sTm9kZTx7IGlkOiBzdHJpbmcgfT4sIFU+KG5vZGVzOiBUW10sIGlkOiBzdHJpbmcpOiBUIHtcbiAgcmV0dXJuIG5vZGVzPy5maW5kKGl0ZXIgPT4gaXRlci4kLmlkID09PSBpZCkgPz8gdW5kZWZpbmVkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TGF0ZXN0SW5zdGFsbGVkTFNMaWJWZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH0gPVxuICAgIHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuXG4gIHJldHVybiBPYmplY3Qua2V5cyhtb2RzKS5yZWR1Y2UoKHByZXYsIGlkKSA9PiB7XG4gICAgaWYgKG1vZHNbaWRdLnR5cGUgPT09ICdiZzMtbHNsaWItZGl2aW5lLXRvb2wnKSB7XG4gICAgICBjb25zdCBhcmNJZCA9IG1vZHNbaWRdLmFyY2hpdmVJZDtcbiAgICAgIGNvbnN0IGRsOiB0eXBlcy5JRG93bmxvYWQgPSB1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgICAgIFsncGVyc2lzdGVudCcsICdkb3dubG9hZHMnLCAnZmlsZXMnLCBhcmNJZF0sIHVuZGVmaW5lZCk7XG4gICAgICBjb25zdCBzdG9yZWRWZXIgPSB1dGlsLmdldFNhZmUobW9kc1tpZF0sIFsnYXR0cmlidXRlcycsICd2ZXJzaW9uJ10sICcwLjAuMCcpO1xuXG4gICAgICB0cnkge1xuICAgICAgICBpZiAoc2VtdmVyLmd0KHN0b3JlZFZlciwgcHJldikpIHtcbiAgICAgICAgICBwcmV2ID0gc3RvcmVkVmVyO1xuICAgICAgICB9XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbG9nKCd3YXJuJywgJ2ludmFsaWQgdmVyc2lvbiBzdG9yZWQgZm9yIGxzbGliIG1vZCcsIHsgaWQsIHZlcnNpb246IHN0b3JlZFZlciB9KTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRsICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gVGhlIExTTGliIGRldmVsb3BlciBkb2Vzbid0IGFsd2F5cyB1cGRhdGUgdGhlIHZlcnNpb24gb24gdGhlIGV4ZWN1dGFibGVcbiAgICAgICAgLy8gIGl0c2VsZiAtIHdlJ3JlIGdvaW5nIHRvIHRyeSB0byBleHRyYWN0IGl0IGZyb20gdGhlIGFyY2hpdmUgd2hpY2ggdGVuZHNcbiAgICAgICAgLy8gIHRvIHVzZSB0aGUgY29ycmVjdCB2ZXJzaW9uLlxuICAgICAgICBjb25zdCBmaWxlTmFtZSA9IHBhdGguYmFzZW5hbWUoZGwubG9jYWxQYXRoLCBwYXRoLmV4dG5hbWUoZGwubG9jYWxQYXRoKSk7XG4gICAgICAgIGNvbnN0IGlkeCA9IGZpbGVOYW1lLmluZGV4T2YoJy12Jyk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgdmVyID0gc2VtdmVyLmNvZXJjZShmaWxlTmFtZS5zbGljZShpZHggKyAyKSkudmVyc2lvbjtcbiAgICAgICAgICBpZiAoc2VtdmVyLnZhbGlkKHZlcikgJiYgdmVyICE9PSBzdG9yZWRWZXIpIHtcbiAgICAgICAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldE1vZEF0dHJpYnV0ZShHQU1FX0lELCBpZCwgJ3ZlcnNpb24nLCB2ZXIpKTtcbiAgICAgICAgICAgIHByZXYgPSB2ZXI7XG4gICAgICAgICAgfVxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAvLyBXZSBmYWlsZWQgdG8gZ2V0IHRoZSB2ZXJzaW9uLi4uIE9oIHdlbGwuLiBTZXQgYSBib2d1cyB2ZXJzaW9uIHNpbmNlXG4gICAgICAgICAgLy8gIHdlIGNsZWFybHkgaGF2ZSBsc2xpYiBpbnN0YWxsZWQgLSB0aGUgdXBkYXRlIGZ1bmN0aW9uYWxpdHkgc2hvdWxkIHRha2VcbiAgICAgICAgICAvLyAgY2FyZSBvZiB0aGUgcmVzdCAod2hlbiB0aGUgdXNlciBjbGlja3MgdGhlIGNoZWNrIGZvciB1cGRhdGVzIGJ1dHRvbilcbiAgICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RBdHRyaWJ1dGUoR0FNRV9JRCwgaWQsICd2ZXJzaW9uJywgJzEuMC4wJykpO1xuICAgICAgICAgIHByZXYgPSAnMS4wLjAnO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcmV2O1xuICB9LCAnMC4wLjAnKTtcbn1cblxubGV0IF9GT1JNQVQ6IExPRm9ybWF0ID0gbnVsbDtcbmNvbnN0IFBBVENIXzggPSAnNC42Ny41OCc7XG5jb25zdCBQQVRDSF83ID0gJzQuNTguNDknO1xuY29uc3QgUEFUQ0hfNiA9ICc0LjUwLjIyJztcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXREZWZhdWx0TW9kU2V0dGluZ3NGb3JtYXQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTxMT0Zvcm1hdD4ge1xuICBpZiAoX0ZPUk1BVCAhPT0gbnVsbCkge1xuICAgIHJldHVybiBfRk9STUFUO1xuICB9XG4gIF9GT1JNQVQgPSAndjgnO1xuICB0cnkge1xuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgZ2FtZVZlcnNpb24gPSBhd2FpdCBnZXRPd25HYW1lVmVyc2lvbihzdGF0ZSk7XG4gICAgY29uc3QgY29lcmNlZCA9IGdhbWVWZXJzaW9uID8gc2VtdmVyLmNvZXJjZShnYW1lVmVyc2lvbikgOiBQQVRDSF84O1xuICAgIGlmIChzZW12ZXIuZ3RlKGNvZXJjZWQsIFBBVENIXzgpKSB7XG4gICAgICBfRk9STUFUID0gJ3Y4JztcbiAgICB9IGVsc2UgaWYgKHNlbXZlci5ndGUoY29lcmNlZCwgUEFUQ0hfNykpIHtcbiAgICAgIF9GT1JNQVQgPSAndjcnO1xuICAgIH0gZWxzZSBpZiAoc2VtdmVyLmd0ZShjb2VyY2VkLCBQQVRDSF82KSkge1xuICAgICAgX0ZPUk1BVCA9ICd2Nic7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9GT1JNQVQgPSAncHJlLXY2JztcbiAgICB9XG4gIH1cbiAgY2F0Y2ggKGVycikge1xuICAgIGxvZygnd2FybicsICdmYWlsZWQgdG8gZ2V0IGdhbWUgdmVyc2lvbicsIGVycik7XG4gIH1cblxuICByZXR1cm4gX0ZPUk1BVDtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldERlZmF1bHRNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPHN0cmluZz4ge1xuICBpZiAoX0ZPUk1BVCA9PT0gbnVsbCkge1xuICAgIF9GT1JNQVQgPSBhd2FpdCBnZXREZWZhdWx0TW9kU2V0dGluZ3NGb3JtYXQoYXBpKTtcbiAgfVxuICByZXR1cm4ge1xuICAgICd2OCc6IERFRkFVTFRfTU9EX1NFVFRJTkdTX1Y4LFxuICAgICd2Nyc6IERFRkFVTFRfTU9EX1NFVFRJTkdTX1Y3LFxuICAgICd2Nic6IERFRkFVTFRfTU9EX1NFVFRJTkdTX1Y2LFxuICAgICdwcmUtdjYnOiBERUZBVUxUX01PRF9TRVRUSU5HU19WNlxuICB9W19GT1JNQVRdO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29udmVydFRvVjgoc29tZVhtbDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgLy8gTWFrZSBzdXJlIHdlIGNvbnZlcnQgdjYgdG8gdjcgZmlyc3RcbiAgLy8gVGhpcyBpcyBhIGJpdCBvZiBhIGhhY2sgYnV0IG1laC5cbiAgY29uc3QgdjdYbWwgPSBhd2FpdCBjb252ZXJ0VjZ0b1Y3KHNvbWVYbWwpO1xuICBjb25zdCB2N0pzb24gPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UodjdYbWwpO1xuICB2N0pzb24uc2F2ZS52ZXJzaW9uWzBdLiQubWFqb3IgPSAnNCc7XG4gIHY3SnNvbi5zYXZlLnZlcnNpb25bMF0uJC5taW5vciA9ICc4JztcbiAgdjdKc29uLnNhdmUudmVyc2lvblswXS4kLnJldmlzaW9uID0gJzAnO1xuICB2N0pzb24uc2F2ZS52ZXJzaW9uWzBdLiQuYnVpbGQgPSAnMTAnO1xuXG4gIGNvbnN0IG1vZHVsZVNldHRpbmdzQ2hpbGRyZW4gPSB2N0pzb24uc2F2ZS5yZWdpb25bMF0ubm9kZVswXS5jaGlsZHJlblswXS5ub2RlO1xuICBjb25zdCBtb2RzTm9kZSA9IG1vZHVsZVNldHRpbmdzQ2hpbGRyZW4uZmluZCgobjogYW55KSA9PiBuLiQuaWQgPT09ICdNb2RzJyk7XG4gIGlmIChtb2RzTm9kZSkge1xuICAgIHZhciBndXN0YXZFbnRyeSA9IG1vZHNOb2RlLmNoaWxkcmVuWzBdLm5vZGUuZmluZCgobjogYW55KSA9PiBcbiAgICAgIG4uYXR0cmlidXRlLnNvbWUoKGF0dHI6IGFueSkgPT4gYXR0ci4kLmlkID09PSAnTmFtZScgJiYgYXR0ci4kLnZhbHVlID09PSAnR3VzdGF2RGV2JykpO1xuICAgIGlmIChndXN0YXZFbnRyeSkge1xuICAgICAgLy8gVGhpcyBpcyB0aGUgb2xkIEd1c3RhdiBFbnRyeSAtIHdlIG5lZWQgdG8gdXBkYXRlIGl0IHRvIHRoZSBuZXcgb25lXG4gICAgICBndXN0YXZFbnRyeS5hdHRyaWJ1dGUgPSBbXG4gICAgICAgIHsgJDogeyBpZDogJ0ZvbGRlcicsIHR5cGU6ICdMU1N0cmluZycsIHZhbHVlOiAnR3VzdGF2WCcgfSB9LFxuICAgICAgICB7ICQ6IHsgaWQ6ICdNRDUnLCB0eXBlOiAnTFNTdHJpbmcnLCB2YWx1ZTogJycgfSB9LFxuICAgICAgICB7ICQ6IHsgaWQ6ICdOYW1lJywgdHlwZTogJ0xTU3RyaW5nJywgdmFsdWU6ICdHdXN0YXZYJyB9IH0sXG4gICAgICAgIHsgJDogeyBpZDogJ1B1Ymxpc2hIYW5kbGUnLCB0eXBlOiAndWludDY0JywgdmFsdWU6ICcwJyB9IH0sXG4gICAgICAgIHsgJDogeyBpZDogJ1VVSUQnLCB0eXBlOiAnZ3VpZCcsIHZhbHVlOiAnY2I1NTVlZmUtMmQ5ZS0xMzFmLTgxOTUtYTg5MzI5ZDIxOGVhJyB9IH0sXG4gICAgICAgIHsgJDogeyBpZDogJ1ZlcnNpb242NCcsIHR5cGU6ICdpbnQ2NCcsIHZhbHVlOiAnMzYwMjg3OTcwMTg5NjM5NjgnIH0gfVxuICAgICAgXTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoKTtcbiAgY29uc3QgdjhYbWwgPSBidWlsZGVyLmJ1aWxkT2JqZWN0KHY3SnNvbik7XG5cbiAgcmV0dXJuIHY4WG1sO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY29udmVydFY2dG9WNyh2NlhtbDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgY29uc3QgdjZKc29uID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKHY2WG1sKTtcbiAgdjZKc29uLnNhdmUudmVyc2lvblswXS4kLm1ham9yID0gJzQnO1xuICB2Nkpzb24uc2F2ZS52ZXJzaW9uWzBdLiQubWlub3IgPSAnNyc7XG4gIHY2SnNvbi5zYXZlLnZlcnNpb25bMF0uJC5yZXZpc2lvbiA9ICcxJztcbiAgdjZKc29uLnNhdmUudmVyc2lvblswXS4kLmJ1aWxkID0gJzMnO1xuXG4gIGNvbnN0IG1vZHVsZVNldHRpbmdzQ2hpbGRyZW4gPSB2Nkpzb24uc2F2ZS5yZWdpb25bMF0ubm9kZVswXS5jaGlsZHJlblswXS5ub2RlO1xuICBjb25zdCBtb2RPcmRlckluZGV4ID0gbW9kdWxlU2V0dGluZ3NDaGlsZHJlbi5maW5kSW5kZXgoKG46IGFueSkgPT4gbi4kLmlkID09PSAnTW9kT3JkZXInKTtcbiAgaWYgKG1vZE9yZGVySW5kZXggIT09IC0xKSB7XG4gICAgLy8gUmVtb3ZlIHRoZSAnTW9kT3JkZXInIG5vZGUgaWYgaXQgZXhpc3RzXG4gICAgbW9kdWxlU2V0dGluZ3NDaGlsZHJlbi5zcGxpY2UobW9kT3JkZXJJbmRleCwgMSk7XG4gIH1cblxuICAvLyBGaW5kIHRoZSAnTW9kcycgbm9kZSB0byBtb2RpZnkgYXR0cmlidXRlc1xuICBjb25zdCBtb2RzTm9kZSA9IG1vZHVsZVNldHRpbmdzQ2hpbGRyZW4uZmluZCgobjogYW55KSA9PiBuLiQuaWQgPT09ICdNb2RzJyk7XG5cbiAgaWYgKG1vZHNOb2RlKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb2RzTm9kZS5jaGlsZHJlblswXS5ub2RlLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBtb2R1bGVTaG9ydERlc2NOb2RlID0gbW9kc05vZGUuY2hpbGRyZW5bMF0ubm9kZVtpXTtcblxuICAgICAgaWYgKG1vZHVsZVNob3J0RGVzY05vZGUpIHtcbiAgICAgICAgLy8gVXBkYXRlIHRoZSAnVVVJRCcgYXR0cmlidXRlIHR5cGUgZnJvbSAnRml4ZWRTdHJpbmcnIHRvICdndWlkJ1xuICAgICAgICBjb25zdCB1dWlkQXR0cmlidXRlID0gbW9kdWxlU2hvcnREZXNjTm9kZS5hdHRyaWJ1dGUuZmluZCgoYXR0cjogYW55KSA9PiBhdHRyLiQuaWQgPT09ICdVVUlEJyk7XG4gICAgICAgIGlmICh1dWlkQXR0cmlidXRlKSB7XG4gICAgICAgICAgdXVpZEF0dHJpYnV0ZS4kLnR5cGUgPSAnZ3VpZCc7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwdWJsaXNoSGFuZGxlQXR0ID0gbW9kdWxlU2hvcnREZXNjTm9kZS5hdHRyaWJ1dGUuZmluZCgoYXR0cjogYW55KSA9PiBhdHRyLiQuaWQgPT09ICdQdWJsaXNoSGFuZGxlJyk7XG4gICAgICAgIGlmIChwdWJsaXNoSGFuZGxlQXR0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICBtb2R1bGVTaG9ydERlc2NOb2RlLmF0dHJpYnV0ZS5wdXNoKHtcbiAgICAgICAgICAgICQ6IHsgaWQ6ICdwdWJsaXNoSGFuZGxlJywgdHlwZTogJ3VpbnQ2NCcsIHZhbHVlOiAnMCcgfVxuICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICAvLyBNaWdodCBuZWVkIHRvIGV4cGFuZCBvbiB0aGlzIGxhdGVyIChyZW1vdmluZyB1c2VsZXNzIGF0dHJpYnV0ZXMsIGV0YylcbiAgICAgIH0gXG4gICAgfVxuICB9XG5cbiAgY29uc3QgYnVpbGRlciA9IG5ldyBCdWlsZGVyKCk7XG4gIGNvbnN0IHY3WG1sID0gYnVpbGRlci5idWlsZE9iamVjdCh2Nkpzb24pO1xuXG4gIHJldHVybiB2N1htbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldExhdGVzdExTTGliTW9kKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9ID0gc3RhdGUucGVyc2lzdGVudC5tb2RzW0dBTUVfSURdO1xuICBpZiAobW9kcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbG9nKCd3YXJuJywgJ0xTTGliIGlzIG5vdCBpbnN0YWxsZWQnKTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIGNvbnN0IGxzTGliOiB0eXBlcy5JTW9kID0gT2JqZWN0LmtleXMobW9kcykucmVkdWNlKChwcmV2OiB0eXBlcy5JTW9kLCBpZDogc3RyaW5nKSA9PiB7XG4gICAgaWYgKG1vZHNbaWRdLnR5cGUgPT09IE1PRF9UWVBFX0xTTElCKSB7XG4gICAgICBjb25zdCBsYXRlc3RWZXIgPSB1dGlsLmdldFNhZmUocHJldiwgWydhdHRyaWJ1dGVzJywgJ3ZlcnNpb24nXSwgJzAuMC4wJyk7XG4gICAgICBjb25zdCBjdXJyZW50VmVyID0gdXRpbC5nZXRTYWZlKG1vZHNbaWRdLCBbJ2F0dHJpYnV0ZXMnLCAndmVyc2lvbiddLCAnMC4wLjAnKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmIChzZW12ZXIuZ3QoY3VycmVudFZlciwgbGF0ZXN0VmVyKSkge1xuICAgICAgICAgIHByZXYgPSBtb2RzW2lkXTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGxvZygnd2FybicsICdpbnZhbGlkIG1vZCB2ZXJzaW9uJywgeyBtb2RJZDogaWQsIHZlcnNpb246IGN1cnJlbnRWZXIgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBwcmV2O1xuICB9LCB1bmRlZmluZWQpO1xuXG4gIGlmIChsc0xpYiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgbG9nKCd3YXJuJywgJ0xTTGliIGlzIG5vdCBpbnN0YWxsZWQnKTtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG5cbiAgcmV0dXJuIGxzTGliO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFBha0luZm9JbXBsKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgcGFrUGF0aDogc3RyaW5nLCBtb2Q6IHR5cGVzLklNb2QsIGlzTGlzdGVkOiBib29sZWFuKTogUHJvbWlzZTxJUGFrSW5mbz4ge1xuICBjb25zdCBtZXRhID0gYXdhaXQgZXh0cmFjdE1ldGEoYXBpLCBwYWtQYXRoLCBtb2QpO1xuICBjb25zdCBjb25maWcgPSBmaW5kTm9kZShtZXRhPy5zYXZlPy5yZWdpb24sICdDb25maWcnKTtcbiAgY29uc3QgY29uZmlnUm9vdCA9IGZpbmROb2RlKGNvbmZpZz8ubm9kZSwgJ3Jvb3QnKTtcbiAgY29uc3QgbW9kdWxlSW5mbyA9IGZpbmROb2RlKGNvbmZpZ1Jvb3Q/LmNoaWxkcmVuPy5bMF0/Lm5vZGUsICdNb2R1bGVJbmZvJyk7XG5cbiAgY29uc3QgYXR0ciA9IChuYW1lOiBzdHJpbmcsIGZhbGxiYWNrOiAoKSA9PiBhbnkpID0+XG4gICAgZmluZE5vZGUobW9kdWxlSW5mbz8uYXR0cmlidXRlLCBuYW1lKT8uJD8udmFsdWUgPz8gZmFsbGJhY2soKTtcblxuICBjb25zdCBnZW5OYW1lID0gcGF0aC5iYXNlbmFtZShwYWtQYXRoLCBwYXRoLmV4dG5hbWUocGFrUGF0aCkpO1xuXG4gIHJldHVybiB7XG4gICAgYXV0aG9yOiBhdHRyKCdBdXRob3InLCAoKSA9PiAnVW5rbm93bicpLFxuICAgIGRlc2NyaXB0aW9uOiBhdHRyKCdEZXNjcmlwdGlvbicsICgpID0+ICdNaXNzaW5nJyksXG4gICAgZm9sZGVyOiBhdHRyKCdGb2xkZXInLCAoKSA9PiBnZW5OYW1lKSxcbiAgICBtZDU6IGF0dHIoJ01ENScsICgpID0+ICcnKSxcbiAgICBuYW1lOiBhdHRyKCdOYW1lJywgKCkgPT4gZ2VuTmFtZSksXG4gICAgdHlwZTogYXR0cignVHlwZScsICgpID0+ICdBZHZlbnR1cmUnKSxcbiAgICB1dWlkOiBhdHRyKCdVVUlEJywgKCkgPT4gcmVxdWlyZSgndXVpZCcpLnY0KCkpLFxuICAgIHZlcnNpb246IGF0dHIoJ1ZlcnNpb242NCcsICgpID0+ICcxJyksXG4gICAgcHVibGlzaEhhbmRsZTogYXR0cignUHVibGlzaEhhbmRsZScsICgpID0+ICcwJyksXG4gICAgaXNMaXN0ZWQ6IGlzTGlzdGVkXG4gIH07XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBleHRyYWN0TWV0YShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZywgbW9kOiB0eXBlcy5JTW9kKTogUHJvbWlzZTxJTW9kU2V0dGluZ3M+IHtcbiAgY29uc3QgbWV0YVBhdGggPSBwYXRoLmpvaW4odXRpbC5nZXRWb3J0ZXhQYXRoKCd0ZW1wJyksICdsc21ldGEnLCBzaG9ydGlkKCkpO1xuICBhd2FpdCBmcy5lbnN1cmVEaXJBc3luYyhtZXRhUGF0aCk7XG4gIGF3YWl0IGV4dHJhY3RQYWsoYXBpLCBwYWtQYXRoLCBtZXRhUGF0aCwgJyovbWV0YS5sc3gnKTtcbiAgdHJ5IHtcbiAgICAvLyB0aGUgbWV0YS5sc3ggbWF5IGJlIGluIGEgc3ViZGlyZWN0b3J5LiBUaGVyZSBpcyBwcm9iYWJseSBhIHBhdHRlcm4gaGVyZVxuICAgIC8vIGJ1dCB3ZSdsbCBqdXN0IHVzZSBpdCBmcm9tIHdoZXJldmVyXG4gICAgbGV0IG1ldGFMU1hQYXRoOiBzdHJpbmcgPSBwYXRoLmpvaW4obWV0YVBhdGgsICdtZXRhLmxzeCcpO1xuICAgIGF3YWl0IHdhbGsobWV0YVBhdGgsIGVudHJpZXMgPT4ge1xuICAgICAgY29uc3QgdGVtcCA9IGVudHJpZXMuZmluZChlID0+IHBhdGguYmFzZW5hbWUoZS5maWxlUGF0aCkudG9Mb3dlckNhc2UoKSA9PT0gJ21ldGEubHN4Jyk7XG4gICAgICBpZiAodGVtcCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIG1ldGFMU1hQYXRoID0gdGVtcC5maWxlUGF0aDtcbiAgICAgIH1cbiAgICB9KTtcbiAgICBjb25zdCBkYXQgPSBhd2FpdCBmcy5yZWFkRmlsZUFzeW5jKG1ldGFMU1hQYXRoKTtcbiAgICBjb25zdCBtZXRhID0gYXdhaXQgcGFyc2VTdHJpbmdQcm9taXNlKGRhdCk7XG4gICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMobWV0YVBhdGgpO1xuICAgIHJldHVybiBtZXRhO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBhd2FpdCBmcy5yZW1vdmVBc3luYyhtZXRhUGF0aCk7XG4gICAgaWYgKGVyci5jb2RlID09PSAnRU5PRU5UJykge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICAgIH0gZWxzZSBpZiAoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ0NvbHVtbicpICYmIChlcnIubWVzc2FnZS5pbmNsdWRlcygnTGluZScpKSkge1xuICAgICAgLy8gYW4gZXJyb3IgbWVzc2FnZSBzcGVjaWZ5aW5nIGNvbHVtbiBhbmQgcm93IGluZGljYXRlIGEgcHJvYmxlbSBwYXJzaW5nIHRoZSB4bWwgZmlsZVxuICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgICB0eXBlOiAnd2FybmluZycsXG4gICAgICAgIG1lc3NhZ2U6ICdUaGUgbWV0YS5sc3ggZmlsZSBpbiBcInt7bW9kTmFtZX19XCIgaXMgaW52YWxpZCwgcGxlYXNlIHJlcG9ydCB0aGlzIHRvIHRoZSBhdXRob3InLFxuICAgICAgICBhY3Rpb25zOiBbe1xuICAgICAgICAgIHRpdGxlOiAnTW9yZScsXG4gICAgICAgICAgYWN0aW9uOiAoKSA9PiB7XG4gICAgICAgICAgICBhcGkuc2hvd0RpYWxvZygnZXJyb3InLCAnSW52YWxpZCBtZXRhLmxzeCBmaWxlJywge1xuICAgICAgICAgICAgICBtZXNzYWdlOiBlcnIubWVzc2FnZSxcbiAgICAgICAgICAgIH0sIFt7IGxhYmVsOiAnQ2xvc2UnIH1dKVxuICAgICAgICAgIH1cbiAgICAgICAgfV0sXG4gICAgICAgIHJlcGxhY2U6IHtcbiAgICAgICAgICBtb2ROYW1lOiB1dGlsLnJlbmRlck1vZE5hbWUobW9kKSxcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgZXJyO1xuICAgIH1cbiAgfVxufVxuXG5sZXQgc3RvcmVkTE8gPSBbXTtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3cml0ZU1vZFNldHRpbmdzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSwgZGF0YTogSU1vZFNldHRpbmdzLCBiZzNwcm9maWxlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKCFiZzNwcm9maWxlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZ2xvYmFsUHJvZmlsZSA9IGF3YWl0IGdsb2JhbFByb2ZpbGVQYXRoKGFwaSk7XG4gIGNvbnN0IHNldHRpbmdzUGF0aCA9IChiZzNwcm9maWxlICE9PSAnZ2xvYmFsJylcbiAgICA/IHBhdGguam9pbihwcm9maWxlc1BhdGgoKSwgYmczcHJvZmlsZSwgJ21vZHNldHRpbmdzLmxzeCcpXG4gICAgOiBwYXRoLmpvaW4oZ2xvYmFsUHJvZmlsZSwgJ21vZHNldHRpbmdzLmxzeCcpO1xuXG4gIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQnVpbGRlcigpO1xuICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkT2JqZWN0KGRhdGEpO1xuICB0cnkge1xuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKHNldHRpbmdzUGF0aCkpO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKHNldHRpbmdzUGF0aCwgeG1sKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgc3RvcmVkTE8gPSBbXTtcbiAgICBjb25zdCBhbGxvd1JlcG9ydCA9IFsnRU5PRU5UJywgJ0VQRVJNJ10uaW5jbHVkZXMoZXJyLmNvZGUpO1xuICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSBtb2Qgc2V0dGluZ3MnLCBlcnIsIHsgYWxsb3dSZXBvcnQgfSk7XG4gICAgcmV0dXJuO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBwYXJzZUxTWEZpbGUobHN4UGF0aDogc3RyaW5nKTogUHJvbWlzZTxJTW9kU2V0dGluZ3M+IHtcbiAgY29uc3QgZGF0ID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhsc3hQYXRoLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gIHJldHVybiBwYXJzZVN0cmluZ1Byb21pc2UoZGF0KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRNb2RTZXR0aW5ncyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpOiBQcm9taXNlPElNb2RTZXR0aW5ncz4ge1xuICBjb25zdCBiZzNwcm9maWxlOiBzdHJpbmcgPSBhd2FpdCBnZXRBY3RpdmVQbGF5ZXJQcm9maWxlKGFwaSk7XG4gIGNvbnN0IHBsYXllclByb2ZpbGVzID0gZ2V0UGxheWVyUHJvZmlsZXMoKTtcbiAgaWYgKHBsYXllclByb2ZpbGVzLmxlbmd0aCA9PT0gMCkge1xuICAgIHN0b3JlZExPID0gW107XG4gICAgY29uc3Qgc2V0dGluZ3NQYXRoID0gcGF0aC5qb2luKHByb2ZpbGVzUGF0aCgpLCAnUHVibGljJywgJ21vZHNldHRpbmdzLmxzeCcpO1xuICAgIHJldHVybiBwYXJzZUxTWEZpbGUoc2V0dGluZ3NQYXRoKTtcbiAgfVxuXG4gIGNvbnN0IGdsb2JhbFByb2ZpbGUgPSBhd2FpdCBnbG9iYWxQcm9maWxlUGF0aChhcGkpO1xuICBjb25zdCBzZXR0aW5nc1BhdGggPSAoYmczcHJvZmlsZSAhPT0gJ2dsb2JhbCcpXG4gICAgPyBwYXRoLmpvaW4ocHJvZmlsZXNQYXRoKCksIGJnM3Byb2ZpbGUsICdtb2RzZXR0aW5ncy5sc3gnKVxuICAgIDogcGF0aC5qb2luKGdsb2JhbFByb2ZpbGUsICdtb2RzZXR0aW5ncy5sc3gnKTtcbiAgcmV0dXJuIHBhcnNlTFNYRmlsZShzZXR0aW5nc1BhdGgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZFN0b3JlZExPKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICBjb25zdCBtb2RTZXR0aW5ncyA9IGF3YWl0IHJlYWRNb2RTZXR0aW5ncyhhcGkpO1xuICBjb25zdCBjb25maWcgPSBmaW5kTm9kZShtb2RTZXR0aW5ncz8uc2F2ZT8ucmVnaW9uLCAnTW9kdWxlU2V0dGluZ3MnKTtcbiAgY29uc3QgY29uZmlnUm9vdCA9IGZpbmROb2RlKGNvbmZpZz8ubm9kZSwgJ3Jvb3QnKTtcbiAgY29uc3QgbW9kT3JkZXJSb290ID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZE9yZGVyJyk7XG4gIGNvbnN0IG1vZHNSb290ID0gZmluZE5vZGUoY29uZmlnUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSwgJ01vZHMnKTtcbiAgY29uc3QgbW9kT3JkZXJOb2RlcyA9IG1vZE9yZGVyUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSA/PyBbXTtcbiAgY29uc3QgbW9kTm9kZXMgPSBtb2RzUm9vdD8uY2hpbGRyZW4/LlswXT8ubm9kZSA/PyBbXTtcbiAgY29uc3QgbW9kT3JkZXIgPSBtb2RPcmRlck5vZGVzLm1hcChub2RlID0+IGZpbmROb2RlKG5vZGUuYXR0cmlidXRlLCAnVVVJRCcpLiQ/LnZhbHVlKTtcblxuICAvLyByZXR1cm4gdXRpbC5zZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzV3JpdHRlbicsIHByb2ZpbGVdLCB7IHRpbWUsIGNvdW50IH0pO1xuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCB2UHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICBjb25zdCBlbmFibGVkID0gT2JqZWN0LmtleXMobW9kcykuZmlsdGVyKGlkID0+XG4gICAgdXRpbC5nZXRTYWZlKHZQcm9maWxlLCBbJ21vZFN0YXRlJywgaWQsICdlbmFibGVkJ10sIGZhbHNlKSk7XG4gIGNvbnN0IGJnM3Byb2ZpbGU6IHN0cmluZyA9IHN0YXRlLnNldHRpbmdzLmJhbGR1cnNnYXRlMz8ucGxheWVyUHJvZmlsZTtcbiAgaWYgKGVuYWJsZWQubGVuZ3RoID4gMCAmJiBtb2ROb2Rlcy5sZW5ndGggPT09IDEpIHtcbiAgICBjb25zdCBsYXN0V3JpdGUgPSBzdGF0ZS5zZXR0aW5ncy5iYWxkdXJzZ2F0ZTM/LnNldHRpbmdzV3JpdHRlbj8uW2JnM3Byb2ZpbGVdO1xuICAgIGlmICgobGFzdFdyaXRlICE9PSB1bmRlZmluZWQpICYmIChsYXN0V3JpdGUuY291bnQgPiAxKSkge1xuICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnXCJtb2RzZXR0aW5ncy5sc3hcIiBmaWxlIHdhcyByZXNldCcsIHtcbiAgICAgICAgdGV4dDogJ1RoZSBnYW1lIHJlc2V0IHRoZSBsaXN0IG9mIGFjdGl2ZSBtb2RzIGFuZCByYW4gd2l0aG91dCB0aGVtLlxcbidcbiAgICAgICAgICArICdUaGlzIGhhcHBlbnMgd2hlbiBhbiBpbnZhbGlkIG9yIGluY29tcGF0aWJsZSBtb2QgaXMgaW5zdGFsbGVkLiAnXG4gICAgICAgICAgKyAnVGhlIGdhbWUgd2lsbCBub3QgbG9hZCBhbnkgbW9kcyBpZiBvbmUgb2YgdGhlbSBpcyBpbmNvbXBhdGlibGUsIHVuZm9ydHVuYXRlbHkgJ1xuICAgICAgICAgICsgJ3RoZXJlIGlzIG5vIGVhc3kgd2F5IHRvIGZpbmQgb3V0IHdoaWNoIG9uZSBjYXVzZWQgdGhlIHByb2JsZW0uJyxcbiAgICAgIH0sIFtcbiAgICAgICAgeyBsYWJlbDogJ0NvbnRpbnVlJyB9LFxuICAgICAgXSk7XG4gICAgfVxuICB9XG5cbiAgc3RvcmVkTE8gPSBtb2ROb2Rlc1xuICAgIC5tYXAobm9kZSA9PiBwYXJzZU1vZE5vZGUobm9kZSkpXG4gICAgLy8gR3VzdGF2IGlzIHRoZSBjb3JlIGdhbWVcbiAgICAuZmlsdGVyKGVudHJ5ID0+ICFlbnRyeS5pZC5zdGFydHNXaXRoKCdHdXN0YXYnKSlcbiAgICAvLyBzb3J0IGJ5IHRoZSBpbmRleCBvZiBlYWNoIG1vZCBpbiB0aGUgbW9kT3JkZXIgbGlzdFxuICAgIC5zb3J0KChsaHMsIHJocykgPT4gbW9kT3JkZXJcbiAgICAgIC5maW5kSW5kZXgoaSA9PiBpID09PSBsaHMuZGF0YSkgLSBtb2RPcmRlci5maW5kSW5kZXgoaSA9PiBpID09PSByaHMuZGF0YSkpO1xufSJdfQ==