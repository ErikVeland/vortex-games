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
exports.setMergerConfig = exports.getMergedModName = exports.downloadScriptMerger = exports.getScriptMergerDir = void 0;
const https_1 = __importDefault(require("https"));
const path_1 = __importDefault(require("path"));
const lodash_1 = __importDefault(require("lodash"));
const url_1 = __importDefault(require("url"));
const xml2js_1 = require("xml2js");
const semver_1 = __importDefault(require("semver"));
const exe_version_1 = __importDefault(require("exe-version"));
const vortex_api_1 = require("vortex-api");
const RELEASE_CUTOFF = '0.6.5';
const GITHUB_URL = 'https://api.github.com/repos/IDCs/WitcherScriptMerger';
const MERGER_RELPATH = 'WitcherScriptMerger';
const MERGER_CONFIG_FILE = 'WitcherScriptMerger.exe.config';
const { getHash, MD5ComparisonError, SCRIPT_MERGER_ID } = require('./common');
function query(baseUrl, request) {
    return new Promise((resolve, reject) => {
        const relUrl = url_1.default.parse(`${baseUrl}/${request}`);
        const options = Object.assign(Object.assign({}, lodash_1.default.pick(relUrl, ['port', 'hostname', 'path'])), { headers: {
                'User-Agent': 'Vortex',
            } });
        https_1.default.get(options, (res) => {
            res.setEncoding('utf-8');
            const headers = res.headers;
            const callsRemaining = parseInt(headers === null || headers === void 0 ? void 0 : headers['x-ratelimit-remaining'], 10);
            if ((res.statusCode === 403) && (callsRemaining === 0)) {
                const resetDate = parseInt(headers === null || headers === void 0 ? void 0 : headers['x-ratelimit-reset'], 10) * 1000;
                (0, vortex_api_1.log)('info', 'GitHub rate limit exceeded', { reset_at: (new Date(resetDate)).toString() });
                return reject(new vortex_api_1.util.ProcessCanceled('GitHub rate limit exceeded'));
            }
            let output = '';
            res
                .on('data', data => output += data)
                .on('end', () => {
                try {
                    return resolve(JSON.parse(output));
                }
                catch (parseErr) {
                    return reject(parseErr);
                }
            });
        })
            .on('error', err => {
            return reject(err);
        })
            .end();
    });
}
function getRequestOptions(link) {
    const relUrl = url_1.default.parse(link);
    return (Object.assign(Object.assign({}, lodash_1.default.pick(relUrl, ['port', 'hostname', 'path'])), { headers: {
            'User-Agent': 'Vortex',
        } }));
}
function downloadConsent(api) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => {
            api.showDialog('info', 'Witcher 3 Script Merger', {
                bbcode: api.translate('Many Witcher 3 mods add or edit game scripts. When several mods '
                    + 'editing the same script are installed, these mods need to be merged using a tool '
                    + 'called Witcher 3 Script Merger. Vortex can attempt to download and configure the merger '
                    + 'for you automatically - before doing so - please ensure your account has full read/write permissions '
                    + 'to your game\'s directory. The script merger can be installed at a later point if you wish. [br][/br][br][/br]'
                    + '[url=https://wiki.nexusmods.com/index.php/Tool_Setup:_Witcher_3_Script_Merger]find out more about the script merger.[/url][br][/br][br][/br]'
                    + 'Note: While script merging works well with the vast majority of mods, there is no guarantee for a satisfying outcome in every single case.', { ns: 'game-witcher3' }),
            }, [
                { label: 'Cancel', action: () => reject(new vortex_api_1.util.UserCanceled()) },
                { label: 'Download', action: () => resolve() },
            ]);
        });
    });
}
function getMergerVersion(api) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', 'witcher3'], undefined);
        if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
            return Promise.reject(new vortex_api_1.util.SetupError('Witcher3 is not discovered'));
        }
        const merger = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a.W3ScriptMerger;
        if (merger === undefined) {
            return Promise.resolve(undefined);
        }
        if (!!(merger === null || merger === void 0 ? void 0 : merger.path)) {
            return vortex_api_1.fs.statAsync(merger.path)
                .then(() => {
                if ((merger === null || merger === void 0 ? void 0 : merger.mergerVersion) !== undefined) {
                    return Promise.resolve(merger.mergerVersion);
                }
                const execVersion = (0, exe_version_1.default)(merger.path);
                if (!!execVersion) {
                    const trimmedVersion = execVersion.split('.').slice(0, 3).join('.');
                    const newToolDetails = Object.assign(Object.assign({}, merger), { mergerVersion: trimmedVersion });
                    api.store.dispatch(vortex_api_1.actions.addDiscoveredTool('witcher3', SCRIPT_MERGER_ID, newToolDetails, true));
                    return Promise.resolve(trimmedVersion);
                }
            })
                .catch(err => Promise.resolve(undefined));
        }
        else {
            return Promise.resolve(undefined);
        }
    });
}
let _HASH_CACHE;
function getCache(api) {
    return __awaiter(this, void 0, void 0, function* () {
        if (_HASH_CACHE === undefined) {
            try {
                const data = yield vortex_api_1.fs.readFileAsync(path_1.default.join(__dirname, 'MD5Cache.json'), { encoding: 'utf8' });
                _HASH_CACHE = JSON.parse(data);
            }
            catch (err) {
                api.showErrorNotification('Failed to parse MD5Cache', err);
                return _HASH_CACHE = [];
            }
        }
        return _HASH_CACHE;
    });
}
function onDownloadComplete(api, archivePath, mostRecentVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            let archiveHash;
            try {
                archiveHash = yield getHash(archivePath);
            }
            catch (err) {
                return Promise.reject(new MD5ComparisonError('Failed to calculate hash', archivePath));
            }
            const hashCache = yield getCache(api);
            if (hashCache.find(entry => (entry.archiveChecksum.toLowerCase() === archiveHash)
                && (entry.version === mostRecentVersion)) === undefined) {
                return reject(new MD5ComparisonError('Corrupted archive download', archivePath));
            }
            return resolve(archivePath);
        }))
            .then((archivePath) => extractScriptMerger(api, archivePath))
            .then((mergerPath) => __awaiter(this, void 0, void 0, function* () {
            const mergerExec = path_1.default.join(mergerPath, 'WitcherScriptMerger.exe');
            let execHash;
            try {
                execHash = yield getHash(mergerExec);
            }
            catch (err) {
                return Promise.reject(new MD5ComparisonError('Failed to calculate hash', mergerExec));
            }
            const hashCache = yield getCache(api);
            if (hashCache.find(entry => (entry.execChecksum.toLowerCase() === execHash)
                && (entry.version === mostRecentVersion)) === undefined) {
                return Promise.reject(new MD5ComparisonError('Corrupted executable', mergerExec));
            }
            return Promise.resolve(mergerPath);
        }))
            .then((mergerPath) => setUpMerger(api, mostRecentVersion, mergerPath));
    });
}
function getScriptMergerDir(api, create = false) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', 'witcher3'], undefined);
        if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
            return undefined;
        }
        const currentPath = (_b = (_a = discovery.tools) === null || _a === void 0 ? void 0 : _a.W3ScriptMerger) === null || _b === void 0 ? void 0 : _b.path;
        try {
            if (!currentPath) {
                throw new Error('Script Merger not set up');
            }
            yield vortex_api_1.fs.statAsync(currentPath);
            return currentPath;
        }
        catch (err) {
            const defaultPath = path_1.default.join(discovery.path, MERGER_RELPATH);
            if (create) {
                yield vortex_api_1.fs.ensureDirWritableAsync(defaultPath);
            }
            return defaultPath;
        }
    });
}
exports.getScriptMergerDir = getScriptMergerDir;
function downloadScriptMerger(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', 'witcher3'], undefined);
        if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
            return Promise.reject(new vortex_api_1.util.SetupError('Witcher3 is not discovered'));
        }
        let mostRecentVersion;
        const currentlyInstalledVersion = yield getMergerVersion(api);
        const downloadNotifId = 'download-script-merger-notif';
        return query(GITHUB_URL, 'releases')
            .then((releases) => {
            if (!Array.isArray(releases)) {
                return Promise.reject(new vortex_api_1.util.DataInvalid('expected array of github releases'));
            }
            const current = releases
                .filter(rel => semver_1.default.valid(rel.name) && semver_1.default.gte(rel.name, RELEASE_CUTOFF))
                .sort((lhs, rhs) => semver_1.default.compare(rhs.name, lhs.name));
            return Promise.resolve(current);
        })
            .then((currentRelease) => __awaiter(this, void 0, void 0, function* () {
            var _a;
            mostRecentVersion = currentRelease[0].name;
            const fileName = currentRelease[0].assets[0].name;
            const downloadLink = currentRelease[0].assets[0].browser_download_url;
            if (!!currentlyInstalledVersion && semver_1.default.gte(currentlyInstalledVersion, currentRelease[0].name)) {
                return Promise.reject(new vortex_api_1.util.ProcessCanceled('Already up to date'));
            }
            const downloadNotif = {
                id: downloadNotifId,
                type: 'activity',
                title: 'Adding Script Merger',
                message: 'This may take a minute...',
            };
            const download = () => __awaiter(this, void 0, void 0, function* () {
                api.sendNotification(Object.assign(Object.assign({}, downloadNotif), { progress: 0 }));
                let redirectionURL;
                redirectionURL = yield new Promise((resolve, reject) => {
                    const options = getRequestOptions(downloadLink);
                    https_1.default.request(options, res => {
                        return (res.headers['location'] !== undefined)
                            ? resolve(res.headers['location'])
                            : reject(new vortex_api_1.util.ProcessCanceled('Failed to resolve download location'));
                    })
                        .on('error', err => reject(err))
                        .end();
                });
                return new Promise((resolve, reject) => {
                    const options = getRequestOptions(redirectionURL);
                    https_1.default.request(options, res => {
                        res.setEncoding('binary');
                        const headers = res.headers;
                        const contentLength = parseInt(headers === null || headers === void 0 ? void 0 : headers['content-length'], 10);
                        const callsRemaining = parseInt(headers === null || headers === void 0 ? void 0 : headers['x-ratelimit-remaining'], 10);
                        if ((res.statusCode === 403) && (callsRemaining === 0)) {
                            const resetDate = parseInt(headers === null || headers === void 0 ? void 0 : headers['x-ratelimit-reset'], 10) * 1000;
                            (0, vortex_api_1.log)('info', 'GitHub rate limit exceeded', { reset_at: (new Date(resetDate)).toString() });
                            return reject(new vortex_api_1.util.ProcessCanceled('GitHub rate limit exceeded'));
                        }
                        let output = '';
                        res
                            .on('data', data => {
                            output += data;
                            if (output.length % 500 === 0) {
                                api.sendNotification(Object.assign(Object.assign({}, downloadNotif), { progress: (output.length / contentLength) * 100 }));
                            }
                        })
                            .on('end', () => {
                            api.sendNotification(Object.assign(Object.assign({}, downloadNotif), { progress: 100 }));
                            api.dismissNotification(downloadNotifId);
                            return vortex_api_1.fs.writeFileAsync(path_1.default.join(discovery.path, fileName), output, { encoding: 'binary' })
                                .then(() => resolve(path_1.default.join(discovery.path, fileName)))
                                .catch(err => reject(err));
                        });
                    })
                        .on('error', err => reject(err))
                        .end();
                });
            });
            if (!!currentlyInstalledVersion || ((currentlyInstalledVersion === undefined) && !!((_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a.W3ScriptMerger))) {
                api.sendNotification({
                    id: 'merger-update',
                    type: 'warning',
                    noDismiss: true,
                    message: api.translate('Important Script Merger update available', { ns: 'game-witcher3' }),
                    actions: [{ title: 'Download', action: dismiss => {
                                dismiss();
                                return download()
                                    .then((archivePath) => onDownloadComplete(api, archivePath, mostRecentVersion))
                                    .catch(err => {
                                    api.dismissNotification(extractNotifId);
                                    api.dismissNotification(downloadNotifId);
                                    if (err instanceof MD5ComparisonError || err instanceof vortex_api_1.util.ProcessCanceled) {
                                        (0, vortex_api_1.log)('error', 'Failed to automatically install Script Merger', err.errorMessage);
                                        api.sendNotification({
                                            type: 'error',
                                            message: api.translate('Please install Script Merger manually', { ns: 'game-witcher3' }),
                                            actions: [
                                                {
                                                    title: 'Install Manually',
                                                    action: () => vortex_api_1.util.opn('https://www.nexusmods.com/witcher3/mods/484')
                                                        .catch(err => null)
                                                }
                                            ],
                                        });
                                        return Promise.resolve();
                                    }
                                    api.sendNotification({
                                        type: 'info',
                                        message: api.translate('Update failed due temporary network issue - try again later', { ns: 'game-witcher3' }),
                                    });
                                    return Promise.resolve();
                                });
                            } }],
                });
                return Promise.reject(new vortex_api_1.util.ProcessCanceled('Update'));
            }
            return downloadConsent(api)
                .then(() => download());
        }))
            .then((archivePath) => onDownloadComplete(api, archivePath, mostRecentVersion))
            .catch((err) => __awaiter(this, void 0, void 0, function* () {
            const raiseManualInstallNotif = () => {
                (0, vortex_api_1.log)('error', 'Failed to automatically install Script Merger', err.errorMessage);
                api.sendNotification({
                    type: 'error',
                    message: api.translate('Please install Script Merger manually', { ns: 'game-witcher3' }),
                    actions: [
                        {
                            title: 'Install Manually',
                            action: () => vortex_api_1.util.opn('https://www.nexusmods.com/witcher3/mods/484')
                                .catch(err => null)
                        }
                    ],
                });
            };
            api.dismissNotification(extractNotifId);
            api.dismissNotification(downloadNotifId);
            if (err instanceof MD5ComparisonError) {
                raiseManualInstallNotif();
                return Promise.resolve();
            }
            if (err instanceof vortex_api_1.util.UserCanceled) {
                return Promise.resolve();
            }
            else if (err instanceof vortex_api_1.util.ProcessCanceled) {
                if ((err.message.startsWith('Already')) || (err.message.startsWith('Update'))) {
                    return Promise.resolve();
                }
                else if (err.message.startsWith('Failed to resolve download location')) {
                    (0, vortex_api_1.log)('info', 'failed to resolve W3 script merger re-direction link', err);
                    return Promise.resolve();
                }
                else if (err.message.startsWith('Game is not discovered')) {
                    raiseManualInstallNotif();
                    return Promise.resolve();
                }
            }
            else {
                return Promise.reject(err);
            }
        }));
    });
}
exports.downloadScriptMerger = downloadScriptMerger;
const extractNotifId = 'extracting-script-merger';
const extractNotif = {
    id: extractNotifId,
    type: 'activity',
    title: 'Extracting Script Merger',
};
function extractScriptMerger(api, archivePath) {
    return __awaiter(this, void 0, void 0, function* () {
        const destination = yield getScriptMergerDir(api, true);
        if (destination === undefined) {
            return Promise.reject(new vortex_api_1.util.ProcessCanceled('Game is not discovered'));
        }
        const sZip = new vortex_api_1.util.SevenZip();
        api.sendNotification(extractNotif);
        yield sZip.extractFull(archivePath, destination);
        api.sendNotification({
            type: 'info',
            message: api.translate('W3 Script Merger extracted successfully', { ns: 'game-witcher3' }),
        });
        api.dismissNotification(extractNotifId);
        return Promise.resolve(destination);
    });
}
function setUpMerger(api, mergerVersion, newPath) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', 'witcher3'], undefined);
        const currentDetails = (_a = discovery === null || discovery === void 0 ? void 0 : discovery.tools) === null || _a === void 0 ? void 0 : _a.W3ScriptMerger;
        const newToolDetails = (!!currentDetails)
            ? Object.assign(Object.assign({}, currentDetails), { mergerVersion }) : {
            id: SCRIPT_MERGER_ID,
            name: 'W3 Script Merger',
            logo: 'WitcherScriptMerger.jpg',
            executable: () => 'WitcherScriptMerger.exe',
            requiredFiles: [
                'WitcherScriptMerger.exe',
            ],
            mergerVersion,
        };
        newToolDetails.path = path_1.default.join(newPath, 'WitcherScriptMerger.exe');
        newToolDetails.workingDirectory = newPath;
        yield setMergerConfig(discovery.path, newPath);
        api.store.dispatch(vortex_api_1.actions.addDiscoveredTool('witcher3', SCRIPT_MERGER_ID, newToolDetails, true));
        return Promise.resolve();
    });
}
function getMergedModName(scriptMergerPath) {
    var _a, _b, _c, _d, _e;
    return __awaiter(this, void 0, void 0, function* () {
        const configFilePath = path_1.default.join(scriptMergerPath, MERGER_CONFIG_FILE);
        try {
            const data = yield vortex_api_1.fs.readFileAsync(configFilePath, { encoding: 'utf8' });
            const config = yield (0, xml2js_1.parseStringPromise)(data);
            const configItems = (_c = (_b = (_a = config === null || config === void 0 ? void 0 : config.configuration) === null || _a === void 0 ? void 0 : _a.appSettings) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.add;
            const MergedModName = (_d = configItems === null || configItems === void 0 ? void 0 : configItems.find(item => { var _a; return ((_a = item.$) === null || _a === void 0 ? void 0 : _a.key) === 'MergedModName'; })) !== null && _d !== void 0 ? _d : undefined;
            if (!!((_e = MergedModName === null || MergedModName === void 0 ? void 0 : MergedModName.$) === null || _e === void 0 ? void 0 : _e.value)) {
                return MergedModName.$.value;
            }
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'failed to ascertain merged mod name - using "mod0000_MergedFiles"', err);
            return 'mod0000_MergedFiles';
        }
    });
}
exports.getMergedModName = getMergedModName;
function setMergerConfig(gameRootPath, scriptMergerPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const findIndex = (nodes, id) => {
            var _a;
            return (_a = nodes === null || nodes === void 0 ? void 0 : nodes.findIndex(iter => { var _a; return ((_a = iter.$) === null || _a === void 0 ? void 0 : _a.key) === id; })) !== null && _a !== void 0 ? _a : undefined;
        };
        const configFilePath = path_1.default.join(scriptMergerPath, MERGER_CONFIG_FILE);
        try {
            const data = yield vortex_api_1.fs.readFileAsync(configFilePath, { encoding: 'utf8' });
            const config = yield (0, xml2js_1.parseStringPromise)(data);
            const replaceElement = (id, replacement) => {
                var _a, _b, _c;
                const idx = findIndex((_c = (_b = (_a = config === null || config === void 0 ? void 0 : config.configuration) === null || _a === void 0 ? void 0 : _a.appSettings) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.add, id);
                if (idx !== undefined) {
                    config.configuration.appSettings[0].add[idx].$ = { key: id, value: replacement };
                }
            };
            replaceElement('GameDirectory', gameRootPath);
            replaceElement('VanillaScriptsDirectory', path_1.default.join(gameRootPath, 'content', 'content0', 'scripts'));
            replaceElement('ModsDirectory', path_1.default.join(gameRootPath, 'mods'));
            const builder = new xml2js_1.Builder();
            const xml = builder.buildObject(config);
            yield vortex_api_1.fs.writeFileAsync(configFilePath, xml);
        }
        catch (err) {
            return;
        }
    });
}
exports.setMergerConfig = setMergerConfig;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0bWVyZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NyaXB0bWVyZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGtEQUEwQjtBQUMxQixnREFBd0I7QUFDeEIsb0RBQXVCO0FBQ3ZCLDhDQUFzQjtBQUN0QixtQ0FBcUQ7QUFDckQsb0RBQTRCO0FBQzVCLDhEQUFxQztBQUNyQywyQ0FBMkQ7QUFJM0QsTUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDO0FBQy9CLE1BQU0sVUFBVSxHQUFHLHVEQUF1RCxDQUFDO0FBQzNFLE1BQU0sY0FBYyxHQUFHLHFCQUFxQixDQUFDO0FBRTdDLE1BQU0sa0JBQWtCLEdBQUcsZ0NBQWdDLENBQUM7QUFFNUQsTUFBTSxFQUFFLE9BQU8sRUFBRSxrQkFBa0IsRUFBRSxnQkFBZ0IsRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUc5RSxTQUFTLEtBQUssQ0FBQyxPQUFPLEVBQUUsT0FBTztJQUM3QixPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ3JDLE1BQU0sTUFBTSxHQUFHLGFBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLElBQUksT0FBTyxFQUFFLENBQUMsQ0FBQztRQUNsRCxNQUFNLE9BQU8sbUNBQ1IsZ0JBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQyxLQUMvQyxPQUFPLEVBQUU7Z0JBQ1AsWUFBWSxFQUFFLFFBQVE7YUFDdkIsR0FDRixDQUFDO1FBRUYsZUFBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUN6QixHQUFHLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3pCLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFxQyxDQUFDO1lBQzFELE1BQU0s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TUFBTSxDQUFDLENBQUMsQ0FBQztZQUNqRSxNQUFNLE9BQU8sR0FBRyxJQUFJLGdCQUFPLEVBQUUsQ0FBQztZQUM5QixNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQ3hDLE1BQU0sZUFBRSxDQUFDLGNBQWMsQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDOUM7UUFBQyxPQUFPLEdBQUcsRUFBRTtZQUdaLE9BQU87U0FDUjtJQUNILENBQUM7Q0FBQTtBQTNCRCwwQ0EyQkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xuaW1wb3J0IGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCB1cmwgZnJvbSAndXJsJztcbmltcG9ydCB7IEJ1aWxkZXIsIHBhcnNlU3RyaW5nUHJvbWlzZSB9IGZyb20gJ3htbDJqcyc7XG5pbXBvcnQgc2VtdmVyIGZyb20gJ3NlbXZlcic7XG5pbXBvcnQgZ2V0VmVyc2lvbiBmcm9tICdleGUtdmVyc2lvbic7XG5pbXBvcnQgeyBhY3Rpb25zLCBmcywgdHlwZXMsIGxvZywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBJSW5jb21pbmdHaXRodWJIdHRwSGVhZGVycyB9IGZyb20gJy4vdHlwZXMnO1xuXG5jb25zdCBSRUxFQVNFX0NVVE9GRiA9ICcwLjYuNSc7XG5jb25zdCBHSVRIVUJfVVJMID0gJ2h0dHBzOi8vYXBpLmdpdGh1Yi5jb20vcmVwb3MvSURDcy9XaXRjaGVyU2NyaXB0TWVyZ2VyJztcbmNvbnN0IE1FUkdFUl9SRUxQQVRIID0gJ1dpdGNoZXJTY3JpcHRNZXJnZXInO1xuXG5jb25zdCBNRVJHRVJfQ09ORklHX0ZJTEUgPSAnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUuY29uZmlnJztcblxuY29uc3QgeyBnZXRIYXNoLCBNRDVDb21wYXJpc29uRXJyb3IsIFNDUklQVF9NRVJHRVJfSUQgfSA9IHJlcXVpcmUoJy4vY29tbW9uJyk7XG5cblxuZnVuY3Rpb24gcXVlcnkoYmFzZVVybCwgcmVxdWVzdCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGNvbnN0IHJlbFVybCA9IHVybC5wYXJzZShgJHtiYXNlVXJsfS8ke3JlcXVlc3R9YCk7XG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIC4uLl8ucGljayhyZWxVcmwsIFsncG9ydCcsICdob3N0bmFtZScsICdwYXRoJ10pLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnVXNlci1BZ2VudCc6ICdWb3J0ZXgnLFxuICAgICAgfSxcbiAgICB9O1xuXG4gICAgaHR0cHMuZ2V0KG9wdGlvbnMsIChyZXMpID0+IHtcbiAgICAgIHJlcy5zZXRFbmNvZGluZygndXRmLTgnKTtcbiAgICAgIGNvbnN0IGhlYWRlcnMgPSByZXMuaGVhZGVycyBhcyBJSW5jb21pbmdHaXRodWJIdHRwSGVhZGVycztcbiAgICAgIGNvbnN0IGNhbGxzUmVtYWluaW5nID0gcGFyc2VJbnQoaGVhZGVycz8uWyd4LXJhdGVsaW1pdC1yZW1haW5pbmcnXSwgMTApO1xuICAgICAgaWYgKChyZXMuc3RhdHVzQ29kZSA9PT0gNDAzKSAmJiAoY2FsbHNSZW1haW5pbmcgPT09IDApKSB7XG4gICAgICAgIGNvbnN0IHJlc2V0RGF0ZSA9IHBhcnNlSW50KGhlYWRlcnM/LlsneC1yYXRlbGltaXQtcmVzZXQnXSwgMTApICogMTAwMDtcbiAgICAgICAgbG9nKCdpbmZvJywgJ0dpdEh1YiByYXRlIGxpbWl0IGV4Y2VlZGVkJyxcbiAgICAgICAgICB7IHJlc2V0X2F0OiAobmV3IERhdGUocmVzZXREYXRlKSkudG9TdHJpbmcoKSB9KTtcbiAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dpdEh1YiByYXRlIGxpbWl0IGV4Y2VlZGVkJykpO1xuICAgICAgfVxuXG4gICAgICBsZXQgb3V0cHV0ID0gJyc7XG4gICAgICByZXNcbiAgICAgICAgLm9uKCdkYXRhJywgZGF0YSA9PiBvdXRwdXQgKz0gZGF0YSlcbiAgICAgICAgLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiByZXNvbHZlKEpTT04ucGFyc2Uob3V0cHV0KSk7XG4gICAgICAgICAgfSBjYXRjaCAocGFyc2VFcnIpIHtcbiAgICAgICAgICAgIHJldHVybiByZWplY3QocGFyc2VFcnIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSlcbiAgICAgIC5vbignZXJyb3InLCBlcnIgPT4ge1xuICAgICAgICByZXR1cm4gcmVqZWN0KGVycik7XG4gICAgICB9KVxuICAgICAgLmVuZCgpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0UmVxdWVzdE9wdGlvbnMobGluaykge1xuICBjb25zdCByZWxVcmwgPSB1cmwucGFyc2UobGluayk7XG4gIHJldHVybiAoe1xuICAgIC4uLl8ucGljayhyZWxVcmwsIFsncG9ydCcsICdob3N0bmFtZScsICdwYXRoJ10pLFxuICAgIGhlYWRlcnM6IHtcbiAgICAgICdVc2VyLUFnZW50JzogJ1ZvcnRleCcsXG4gICAgfSxcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkQ29uc2VudChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgXG4gIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnV2l0Y2hlciAzIFNjcmlwdCBNZXJnZXInLCB7XG4gICAgICBiYmNvZGU6IGFwaS50cmFuc2xhdGUoJ01hbnkgV2l0Y2hlciAzIG1vZHMgYWRkIG9yIGVkaXQgZ2FtZSBzY3JpcHRzLiBXaGVuIHNldmVyYWwgbW9kcyAnIFxuICAgICAgICArICdlZGl0aW5nIHRoZSBzYW1lIHNjcmlwdCBhcmUgaW5zdGFsbGVkLCB0aGVzZSBtb2RzIG5lZWQgdG8gYmUgbWVyZ2VkIHVzaW5nIGEgdG9vbCAnIFxuICAgICAgICArICdjYWxsZWQgV2l0Y2hlciAzIFNjcmlwdCBNZXJnZXIuIFZvcnRleCBjYW4gYXR0ZW1wdCB0byBkb3dubG9hZCBhbmQgY29uZmlndXJlIHRoZSBtZXJnZXIgJ1xuICAgICAgICArICdmb3IgeW91IGF1dG9tYXRpY2FsbHkgLSBiZWZvcmUgZG9pbmcgc28gLSBwbGVhc2UgZW5zdXJlIHlvdXIgYWNjb3VudCBoYXMgZnVsbCByZWFkL3dyaXRlIHBlcm1pc3Npb25zICdcbiAgICAgICAgKyAndG8geW91ciBnYW1lXFwncyBkaXJlY3RvcnkuIFRoZSBzY3JpcHQgbWVyZ2VyIGNhbiBiZSBpbnN0YWxsZWQgYXQgYSBsYXRlciBwb2ludCBpZiB5b3Ugd2lzaC4gW2JyXVsvYnJdW2JyXVsvYnJdJ1xuICAgICAgICArICdbdXJsPWh0dHBzOi8vd2lraS5uZXh1c21vZHMuY29tL2luZGV4LnBocC9Ub29sX1NldHVwOl9XaXRjaGVyXzNfU2NyaXB0X01lcmdlcl1maW5kIG91dCBtb3JlIGFib3V0IHRoZSBzY3JpcHQgbWVyZ2VyLlsvdXJsXVticl1bL2JyXVticl1bL2JyXScgXG4gICAgICAgICsgJ05vdGU6IFdoaWxlIHNjcmlwdCBtZXJnaW5nIHdvcmtzIHdlbGwgd2l0aCB0aGUgdmFzdCBtYWpvcml0eSBvZiBtb2RzLCB0aGVyZSBpcyBubyBndWFyYW50ZWUgZm9yIGEgc2F0aXNmeWluZyBvdXRjb21lIGluIGV2ZXJ5IHNpbmdsZSBjYXNlLicsIHsgbnM6ICdnYW1lLXdpdGNoZXIzJyB9KSxcbiAgICB9LCBbXG4gICAgICB7IGxhYmVsOiAnQ2FuY2VsJywgYWN0aW9uOiAoKSA9PiByZWplY3QobmV3IHV0aWwuVXNlckNhbmNlbGVkKCkpIH0sXG4gICAgICB7IGxhYmVsOiAnRG93bmxvYWQnLCBhY3Rpb246ICgpID0+IHJlc29sdmUoKSB9LFxuICAgIF0pO1xuICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gZ2V0TWVyZ2VyVmVyc2lvbihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCAnd2l0Y2hlcjMnXSwgdW5kZWZpbmVkKTtcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlNldHVwRXJyb3IoJ1dpdGNoZXIzIGlzIG5vdCBkaXNjb3ZlcmVkJykpO1xuICB9XG4gIGNvbnN0IG1lcmdlciA9IGRpc2NvdmVyeT8udG9vbHM/LlczU2NyaXB0TWVyZ2VyO1xuICBpZiAobWVyZ2VyID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCk7XG4gIH1cblxuICBpZiAoISFtZXJnZXI/LnBhdGgpIHtcbiAgICByZXR1cm4gZnMuc3RhdEFzeW5jKG1lcmdlci5wYXRoKVxuICAgICAgLnRoZW4oKCkgPT4ge1xuICAgICAgICBpZiAobWVyZ2VyPy5tZXJnZXJWZXJzaW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1lcmdlci5tZXJnZXJWZXJzaW9uKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBleGVjVmVyc2lvbiA9IGdldFZlcnNpb24obWVyZ2VyLnBhdGgpO1xuICAgICAgICBpZiAoISFleGVjVmVyc2lvbikge1xuICAgICAgICAgIGNvbnN0IHRyaW1tZWRWZXJzaW9uID0gZXhlY1ZlcnNpb24uc3BsaXQoJy4nKS5zbGljZSgwLCAzKS5qb2luKCcuJyk7XG4gICAgICAgICAgY29uc3QgbmV3VG9vbERldGFpbHMgPSB7IC4uLm1lcmdlciwgbWVyZ2VyVmVyc2lvbjogdHJpbW1lZFZlcnNpb24gfTtcbiAgICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5hZGREaXNjb3ZlcmVkVG9vbCgnd2l0Y2hlcjMnLCBTQ1JJUFRfTUVSR0VSX0lELCBuZXdUb29sRGV0YWlscywgdHJ1ZSkpO1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodHJpbW1lZFZlcnNpb24pO1xuICAgICAgICB9XG4gICAgICB9KVxuICAgICAgLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG59XG5cbmxldCBfSEFTSF9DQUNIRTtcbmFzeW5jIGZ1bmN0aW9uIGdldENhY2hlKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICBpZiAoX0hBU0hfQ0FDSEUgPT09IHVuZGVmaW5lZCkge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhwYXRoLmpvaW4oX19kaXJuYW1lLCAnTUQ1Q2FjaGUuanNvbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSk7XG4gICAgICBfSEFTSF9DQUNIRSA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAvLyBJZiB0aGlzIGV2ZXIgaGFwcGVucyAtIHRoZSB1c2VyJ3MgbWFjaGluZSBtdXN0IGJlIHNjcmV3ZWQuXG4gICAgICAvLyAgTWF5YmUgdmlydXMgPyBkZWZlY3RpdmUgaGFyZHdhcmUgPyBkaWQgaGUgbWFudWFsbHkgbWFuaXB1bGF0ZVxuICAgICAgLy8gIHRoZSBmaWxlID9cbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byBwYXJzZSBNRDVDYWNoZScsIGVycik7XG4gICAgICByZXR1cm4gX0hBU0hfQ0FDSEUgPSBbXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gX0hBU0hfQ0FDSEU7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG9uRG93bmxvYWRDb21wbGV0ZShhcGksIGFyY2hpdmVQYXRoLCBtb3N0UmVjZW50VmVyc2lvbikge1xuICByZXR1cm4gbmV3IFByb21pc2UoYXN5bmMgKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCBhcmNoaXZlSGFzaDtcbiAgICB0cnkge1xuICAgICAgYXJjaGl2ZUhhc2ggPSBhd2FpdCBnZXRIYXNoKGFyY2hpdmVQYXRoKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgTUQ1Q29tcGFyaXNvbkVycm9yKCdGYWlsZWQgdG8gY2FsY3VsYXRlIGhhc2gnLCBhcmNoaXZlUGF0aCkpO1xuICAgIH1cbiAgICBjb25zdCBoYXNoQ2FjaGUgPSBhd2FpdCBnZXRDYWNoZShhcGkpO1xuICAgIGlmIChoYXNoQ2FjaGUuZmluZChlbnRyeSA9PiAoZW50cnkuYXJjaGl2ZUNoZWNrc3VtLnRvTG93ZXJDYXNlKCkgPT09IGFyY2hpdmVIYXNoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAoZW50cnkudmVyc2lvbiA9PT0gbW9zdFJlY2VudFZlcnNpb24pKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBOb3QgYSB2YWxpZCBoYXNoIC0gc29tZXRoaW5nIG1heSBoYXZlIGhhcHBlbmVkIGR1cmluZyB0aGUgZG93bmxvYWQgP1xuICAgICAgcmV0dXJuIHJlamVjdChuZXcgTUQ1Q29tcGFyaXNvbkVycm9yKCdDb3JydXB0ZWQgYXJjaGl2ZSBkb3dubG9hZCcsIGFyY2hpdmVQYXRoKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc29sdmUoYXJjaGl2ZVBhdGgpO1xuICB9KVxuICAudGhlbigoYXJjaGl2ZVBhdGgpID0+IGV4dHJhY3RTY3JpcHRNZXJnZXIoYXBpLCBhcmNoaXZlUGF0aCkpXG4gIC50aGVuKGFzeW5jIChtZXJnZXJQYXRoKSA9PiB7XG4gICAgY29uc3QgbWVyZ2VyRXhlYyA9IHBhdGguam9pbihtZXJnZXJQYXRoLCAnV2l0Y2hlclNjcmlwdE1lcmdlci5leGUnKTtcbiAgICBsZXQgZXhlY0hhc2g7XG4gICAgdHJ5IHtcbiAgICAgIGV4ZWNIYXNoID0gYXdhaXQgZ2V0SGFzaChtZXJnZXJFeGVjKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgTUQ1Q29tcGFyaXNvbkVycm9yKCdGYWlsZWQgdG8gY2FsY3VsYXRlIGhhc2gnLCBtZXJnZXJFeGVjKSk7XG4gICAgfVxuICAgIGNvbnN0IGhhc2hDYWNoZSA9IGF3YWl0IGdldENhY2hlKGFwaSk7XG4gICAgaWYgKGhhc2hDYWNoZS5maW5kKGVudHJ5ID0+IChlbnRyeS5leGVjQ2hlY2tzdW0udG9Mb3dlckNhc2UoKSA9PT0gZXhlY0hhc2gpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICYmIChlbnRyeS52ZXJzaW9uID09PSBtb3N0UmVjZW50VmVyc2lvbikpID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIE5vdCBhIHZhbGlkIGhhc2ggLSBzb21ldGhpbmcgbWF5IGhhdmUgaGFwcGVuZWQgZHVyaW5nIGV4dHJhY3Rpb24gP1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBNRDVDb21wYXJpc29uRXJyb3IoJ0NvcnJ1cHRlZCBleGVjdXRhYmxlJywgbWVyZ2VyRXhlYykpO1xuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobWVyZ2VyUGF0aCk7XG4gIH0pXG4gIC50aGVuKChtZXJnZXJQYXRoKSA9PiBzZXRVcE1lcmdlcihhcGksIG1vc3RSZWNlbnRWZXJzaW9uLCBtZXJnZXJQYXRoKSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldFNjcmlwdE1lcmdlckRpcihhcGksIGNyZWF0ZSA9IGZhbHNlKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgJ3dpdGNoZXIzJ10sIHVuZGVmaW5lZCk7XG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH1cbiAgY29uc3QgY3VycmVudFBhdGggPSBkaXNjb3ZlcnkudG9vbHM/LlczU2NyaXB0TWVyZ2VyPy5wYXRoO1xuICB0cnkge1xuICAgIGlmICghY3VycmVudFBhdGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignU2NyaXB0IE1lcmdlciBub3Qgc2V0IHVwJyk7XG4gICAgfVxuICAgIGF3YWl0IGZzLnN0YXRBc3luYyhjdXJyZW50UGF0aCk7XG4gICAgcmV0dXJuIGN1cnJlbnRQYXRoO1xuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zdCBkZWZhdWx0UGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgTUVSR0VSX1JFTFBBVEgpO1xuICAgIGlmIChjcmVhdGUpIHtcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMoZGVmYXVsdFBhdGgpO1xuICAgIH1cbiAgICByZXR1cm4gZGVmYXVsdFBhdGg7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkU2NyaXB0TWVyZ2VyKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsICd3aXRjaGVyMyddLCB1bmRlZmluZWQpO1xuICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuU2V0dXBFcnJvcignV2l0Y2hlcjMgaXMgbm90IGRpc2NvdmVyZWQnKSk7XG4gIH1cbiAgbGV0IG1vc3RSZWNlbnRWZXJzaW9uO1xuICBjb25zdCBjdXJyZW50bHlJbnN0YWxsZWRWZXJzaW9uID0gYXdhaXQgZ2V0TWVyZ2VyVmVyc2lvbihhcGkpO1xuICBjb25zdCBkb3dubG9hZE5vdGlmSWQgPSAnZG93bmxvYWQtc2NyaXB0LW1lcmdlci1ub3RpZic7XG4gIHJldHVybiBxdWVyeShHSVRIVUJfVVJMLCAncmVsZWFzZXMnKVxuICAgIC50aGVuKChyZWxlYXNlcykgPT4ge1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHJlbGVhc2VzKSkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuRGF0YUludmFsaWQoJ2V4cGVjdGVkIGFycmF5IG9mIGdpdGh1YiByZWxlYXNlcycpKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGN1cnJlbnQgPSByZWxlYXNlc1xuICAgICAgICAuZmlsdGVyKHJlbCA9PiBzZW12ZXIudmFsaWQocmVsLm5hbWUpICYmIHNlbXZlci5ndGUocmVsLm5hbWUsIFJFTEVBU0VfQ1VUT0ZGKSlcbiAgICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBzZW12ZXIuY29tcGFyZShyaHMubmFtZSwgbGhzLm5hbWUpKTtcblxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjdXJyZW50KTtcbiAgICB9KVxuICAgIC50aGVuKGFzeW5jIGN1cnJlbnRSZWxlYXNlID0+IHtcbiAgICAgIG1vc3RSZWNlbnRWZXJzaW9uID0gY3VycmVudFJlbGVhc2VbMF0ubmFtZTtcbiAgICAgIGNvbnN0IGZpbGVOYW1lID0gY3VycmVudFJlbGVhc2VbMF0uYXNzZXRzWzBdLm5hbWU7XG4gICAgICBjb25zdCBkb3dubG9hZExpbmsgPSBjdXJyZW50UmVsZWFzZVswXS5hc3NldHNbMF0uYnJvd3Nlcl9kb3dubG9hZF91cmw7XG4gICAgICBpZiAoISFjdXJyZW50bHlJbnN0YWxsZWRWZXJzaW9uICYmIHNlbXZlci5ndGUoY3VycmVudGx5SW5zdGFsbGVkVmVyc2lvbiwgY3VycmVudFJlbGVhc2VbMF0ubmFtZSkpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnQWxyZWFkeSB1cCB0byBkYXRlJykpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkb3dubG9hZE5vdGlmOiB0eXBlcy5JTm90aWZpY2F0aW9uID0ge1xuICAgICAgICBpZDogZG93bmxvYWROb3RpZklkLFxuICAgICAgICB0eXBlOiAnYWN0aXZpdHknLFxuICAgICAgICB0aXRsZTogJ0FkZGluZyBTY3JpcHQgTWVyZ2VyJyxcbiAgICAgICAgbWVzc2FnZTogJ1RoaXMgbWF5IHRha2UgYSBtaW51dGUuLi4nLFxuICAgICAgfVxuICAgICAgY29uc3QgZG93bmxvYWQgPSBhc3luYyAoKSA9PiB7XG4gICAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgICAuLi5kb3dubG9hZE5vdGlmLFxuICAgICAgICAgIHByb2dyZXNzOiAwLFxuICAgICAgICB9KTtcbiAgICAgICAgbGV0IHJlZGlyZWN0aW9uVVJMO1xuICAgICAgICByZWRpcmVjdGlvblVSTCA9IGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICBjb25zdCBvcHRpb25zID0gZ2V0UmVxdWVzdE9wdGlvbnMoZG93bmxvYWRMaW5rKTtcbiAgICAgICAgICBodHRwcy5yZXF1ZXN0KG9wdGlvbnMsIHJlcyA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKHJlcy5oZWFkZXJzWydsb2NhdGlvbiddICE9PSB1bmRlZmluZWQpXG4gICAgICAgICAgICAgID8gcmVzb2x2ZShyZXMuaGVhZGVyc1snbG9jYXRpb24nXSlcbiAgICAgICAgICAgICAgOiByZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdGYWlsZWQgdG8gcmVzb2x2ZSBkb3dubG9hZCBsb2NhdGlvbicpKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSlcbiAgICAgICAgICAgIC5lbmQoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGdldFJlcXVlc3RPcHRpb25zKHJlZGlyZWN0aW9uVVJMKTtcbiAgICAgICAgICBodHRwcy5yZXF1ZXN0KG9wdGlvbnMsIHJlcyA9PiB7XG4gICAgICAgICAgICByZXMuc2V0RW5jb2RpbmcoJ2JpbmFyeScpO1xuICAgICAgICAgICAgY29uc3QgaGVhZGVycyA9IHJlcy5oZWFkZXJzIGFzIElJbmNvbWluZ0dpdGh1Ykh0dHBIZWFkZXJzO1xuICAgICAgICAgICAgY29uc3QgY29udGVudExlbmd0aCA9IHBhcnNlSW50KGhlYWRlcnM/LlsnY29udGVudC1sZW5ndGgnXSwgMTApO1xuICAgICAgICAgICAgY29uc3QgY2FsbHNSZW1haW5pbmcgPSBwYXJzZUludChoZWFkZXJzPy5bJ3gtcmF0ZWxpbWl0LXJlbWFpbmluZyddLCAxMCk7XG4gICAgICAgICAgICBpZiAoKHJlcy5zdGF0dXNDb2RlID09PSA0MDMpICYmIChjYWxsc1JlbWFpbmluZyA9PT0gMCkpIHtcbiAgICAgICAgICAgICAgY29uc3QgcmVzZXREYXRlID0gcGFyc2VJbnQoaGVhZGVycz8uWyd4LXJhdGVsaW1pdC1yZXNldCddLCAxMCkgKiAxMDAwO1xuICAgICAgICAgICAgICBsb2coJ2luZm8nLCAnR2l0SHViIHJhdGUgbGltaXQgZXhjZWVkZWQnLFxuICAgICAgICAgICAgICAgIHsgcmVzZXRfYXQ6IChuZXcgRGF0ZShyZXNldERhdGUpKS50b1N0cmluZygpIH0pO1xuICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2l0SHViIHJhdGUgbGltaXQgZXhjZWVkZWQnKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCBvdXRwdXQgPSAnJztcbiAgICAgICAgICAgIHJlc1xuICAgICAgICAgICAgICAub24oJ2RhdGEnLCBkYXRhID0+IHtcbiAgICAgICAgICAgICAgICBvdXRwdXQgKz0gZGF0YVxuICAgICAgICAgICAgICAgIGlmIChvdXRwdXQubGVuZ3RoICUgNTAwID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAvLyBVcGRhdGluZyB0aGUgbm90aWZpY2F0aW9uIGlzIEVYVFJFTUVMWSBleHBlbnNpdmUuXG4gICAgICAgICAgICAgICAgICAvLyAgdGhlIGxlbmd0aCAlIDUwMCA9PT0gMCBsaW5lIGVuc3VyZXMgdGhpcyBpcyBub3QgZG9uZSB0b29cbiAgICAgICAgICAgICAgICAgIC8vICBvZnRlbi5cbiAgICAgICAgICAgICAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgICAgICAgICAgICAgLi4uZG93bmxvYWROb3RpZixcbiAgICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3M6IChvdXRwdXQubGVuZ3RoIC8gY29udGVudExlbmd0aCkgKiAxMDAsXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgIC5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgICAgICAgICAgIC4uLmRvd25sb2FkTm90aWYsXG4gICAgICAgICAgICAgICAgICBwcm9ncmVzczogMTAwLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKGRvd25sb2FkTm90aWZJZCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZzLndyaXRlRmlsZUFzeW5jKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgZmlsZU5hbWUpLCBvdXRwdXQsIHsgZW5jb2Rpbmc6ICdiaW5hcnknIH0pXG4gICAgICAgICAgICAgICAgICAudGhlbigoKSA9PiByZXNvbHZlKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgZmlsZU5hbWUpKSlcbiAgICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gcmVqZWN0KGVycikpO1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KVxuICAgICAgICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSlcbiAgICAgICAgICAgIC5lbmQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGlmICghIWN1cnJlbnRseUluc3RhbGxlZFZlcnNpb24gfHwgKChjdXJyZW50bHlJbnN0YWxsZWRWZXJzaW9uID09PSB1bmRlZmluZWQpICYmICEhZGlzY292ZXJ5Py50b29scz8uVzNTY3JpcHRNZXJnZXIpKSB7XG4gICAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgICBpZDogJ21lcmdlci11cGRhdGUnLFxuICAgICAgICAgIHR5cGU6ICd3YXJuaW5nJyxcbiAgICAgICAgICBub0Rpc21pc3M6IHRydWUsXG4gICAgICAgICAgbWVzc2FnZTogYXBpLnRyYW5zbGF0ZSgnSW1wb3J0YW50IFNjcmlwdCBNZXJnZXIgdXBkYXRlIGF2YWlsYWJsZScsXG4gICAgICAgICAgICB7IG5zOiAnZ2FtZS13aXRjaGVyMycgfSksXG4gICAgICAgICAgYWN0aW9uczogWyB7IHRpdGxlOiAnRG93bmxvYWQnLCBhY3Rpb246IGRpc21pc3MgPT4ge1xuICAgICAgICAgICAgZGlzbWlzcygpO1xuICAgICAgICAgICAgcmV0dXJuIGRvd25sb2FkKClcbiAgICAgICAgICAgICAgLnRoZW4oKGFyY2hpdmVQYXRoKSA9PiBvbkRvd25sb2FkQ29tcGxldGUoYXBpLCBhcmNoaXZlUGF0aCwgbW9zdFJlY2VudFZlcnNpb24pKVxuICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihleHRyYWN0Tm90aWZJZCk7XG4gICAgICAgICAgICAgICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oZG93bmxvYWROb3RpZklkKTtcbiAgICAgICAgICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTUQ1Q29tcGFyaXNvbkVycm9yIHx8IGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvY2Vzc0NhbmNlbGVkKSB7XG4gICAgICAgICAgICAgICAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBhdXRvbWF0aWNhbGx5IGluc3RhbGwgU2NyaXB0IE1lcmdlcicsIGVyci5lcnJvck1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnZXJyb3InLFxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlOiBhcGkudHJhbnNsYXRlKCdQbGVhc2UgaW5zdGFsbCBTY3JpcHQgTWVyZ2VyIG1hbnVhbGx5JywgeyBuczogJ2dhbWUtd2l0Y2hlcjMnIH0pLFxuICAgICAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICAgICAgICAgICAgeyBcbiAgICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnSW5zdGFsbCBNYW51YWxseScsXG4gICAgICAgICAgICAgICAgICAgICAgICBhY3Rpb246ICgpID0+IHV0aWwub3BuKCdodHRwczovL3d3dy5uZXh1c21vZHMuY29tL3dpdGNoZXIzL21vZHMvNDg0JylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICB9XSxcbiAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEN1cnJlbnRseSBBRkFJSyB0aGlzIHdvdWxkIG9ubHkgb2NjdXIgaWYgZ2l0aHViIGlzIGRvd24gZm9yIGFueSByZWFzb25cbiAgICAgICAgICAgICAgICAvLyAgYW5kIHdlIHdlcmUgdW5hYmxlIHRvIHJlc29sdmUgdGhlIHJlLWRpcmVjdGlvbiBsaW5rLiBHaXZlbiB0aGF0IHRoZSB1c2VyXG4gICAgICAgICAgICAgICAgLy8gIGV4cGVjdHMgYSByZXN1bHQgZnJvbSBoaW0gY2xpY2tpbmcgdGhlIGRvd25sb2FkIGJ1dHRvbiwgd2UgbGV0IGhpbSBrbm93XG4gICAgICAgICAgICAgICAgLy8gIHRvIHRyeSBhZ2FpblxuICAgICAgICAgICAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdpbmZvJyxcbiAgICAgICAgICAgICAgICAgIG1lc3NhZ2U6IGFwaS50cmFuc2xhdGUoJ1VwZGF0ZSBmYWlsZWQgZHVlIHRlbXBvcmFyeSBuZXR3b3JrIGlzc3VlIC0gdHJ5IGFnYWluIGxhdGVyJywgeyBuczogJ2dhbWUtd2l0Y2hlcjMnIH0pLFxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICB9KVxuICAgICAgICAgIH0gfSBdLFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdVcGRhdGUnKSk7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBkb3dubG9hZENvbnNlbnQoYXBpKVxuICAgICAgICAudGhlbigoKSA9PiBkb3dubG9hZCgpKTtcbiAgICB9KVxuICAgIC50aGVuKChhcmNoaXZlUGF0aCkgPT4gb25Eb3dubG9hZENvbXBsZXRlKGFwaSwgYXJjaGl2ZVBhdGgsIG1vc3RSZWNlbnRWZXJzaW9uKSlcbiAgICAuY2F0Y2goYXN5bmMgZXJyID0+IHtcbiAgICAgIGNvbnN0IHJhaXNlTWFudWFsSW5zdGFsbE5vdGlmID0gKCkgPT4ge1xuICAgICAgICBsb2coJ2Vycm9yJywgJ0ZhaWxlZCB0byBhdXRvbWF0aWNhbGx5IGluc3RhbGwgU2NyaXB0IE1lcmdlcicsIGVyci5lcnJvck1lc3NhZ2UpO1xuICAgICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICAgICAgdHlwZTogJ2Vycm9yJyxcbiAgICAgICAgICBtZXNzYWdlOiBhcGkudHJhbnNsYXRlKCdQbGVhc2UgaW5zdGFsbCBTY3JpcHQgTWVyZ2VyIG1hbnVhbGx5JywgeyBuczogJ2dhbWUtd2l0Y2hlcjMnIH0pLFxuICAgICAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgdGl0bGU6ICdJbnN0YWxsIE1hbnVhbGx5JyxcbiAgICAgICAgICAgICAgYWN0aW9uOiAoKSA9PiB1dGlsLm9wbignaHR0cHM6Ly93d3cubmV4dXNtb2RzLmNvbS93aXRjaGVyMy9tb2RzLzQ4NCcpXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4gbnVsbClcbiAgICAgICAgICAgIH1dLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKGV4dHJhY3ROb3RpZklkKTtcbiAgICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKGRvd25sb2FkTm90aWZJZCk7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgTUQ1Q29tcGFyaXNvbkVycm9yKSB7XG4gICAgICAgIHJhaXNlTWFudWFsSW5zdGFsbE5vdGlmKCk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9IGVsc2UgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvY2Vzc0NhbmNlbGVkKSB7XG4gICAgICAgIGlmICgoZXJyLm1lc3NhZ2Uuc3RhcnRzV2l0aCgnQWxyZWFkeScpKSB8fCAoZXJyLm1lc3NhZ2Uuc3RhcnRzV2l0aCgnVXBkYXRlJykpKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGVyci5tZXNzYWdlLnN0YXJ0c1dpdGgoJ0ZhaWxlZCB0byByZXNvbHZlIGRvd25sb2FkIGxvY2F0aW9uJykpIHtcbiAgICAgICAgICAvLyBDdXJyZW50bHkgQUZBSUsgdGhpcyB3b3VsZCBvbmx5IG9jY3VyIGlmIGdpdGh1YiBpcyBkb3duIGZvciBhbnkgcmVhc29uXG4gICAgICAgICAgLy8gIGFuZCB3ZSB3ZXJlIHVuYWJsZSB0byByZXNvbHZlIHRoZSByZS1kaXJlY3Rpb24gbGluay4gR2l2ZW4gdGhhdCB0aGlzXG4gICAgICAgICAgLy8gIHdpbGwgbW9zdCBjZXJ0YWlubHkgcmVzb2x2ZSBpdHNlbGYgZXZlbnR1YWxseSAtIHdlIGxvZyB0aGlzIGFuZCBrZWVwIGdvaW5nLlxuICAgICAgICAgIGxvZygnaW5mbycsICdmYWlsZWQgdG8gcmVzb2x2ZSBXMyBzY3JpcHQgbWVyZ2VyIHJlLWRpcmVjdGlvbiBsaW5rJywgZXJyKTtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH0gZWxzZSBpZiAoZXJyLm1lc3NhZ2Uuc3RhcnRzV2l0aCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcpKSB7XG4gICAgICAgICAgcmFpc2VNYW51YWxJbnN0YWxsTm90aWYoKTtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pXG59XG5cbmNvbnN0IGV4dHJhY3ROb3RpZklkID0gJ2V4dHJhY3Rpbmctc2NyaXB0LW1lcmdlcic7XG5jb25zdCBleHRyYWN0Tm90aWYgPSB7XG4gIGlkOiBleHRyYWN0Tm90aWZJZCxcbiAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgdGl0bGU6ICdFeHRyYWN0aW5nIFNjcmlwdCBNZXJnZXInLFxufVxuYXN5bmMgZnVuY3Rpb24gZXh0cmFjdFNjcmlwdE1lcmdlcihhcGksIGFyY2hpdmVQYXRoKSB7XG4gIGNvbnN0IGRlc3RpbmF0aW9uID0gYXdhaXQgZ2V0U2NyaXB0TWVyZ2VyRGlyKGFwaSwgdHJ1ZSk7XG4gIGlmIChkZXN0aW5hdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gSG93ID9cbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdHYW1lIGlzIG5vdCBkaXNjb3ZlcmVkJykpO1xuICB9XG4gIGNvbnN0IHNaaXAgPSBuZXcgdXRpbC5TZXZlblppcCgpO1xuICBhcGkuc2VuZE5vdGlmaWNhdGlvbihleHRyYWN0Tm90aWYpO1xuICBhd2FpdCBzWmlwLmV4dHJhY3RGdWxsKGFyY2hpdmVQYXRoLCBkZXN0aW5hdGlvbik7XG4gIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICB0eXBlOiAnaW5mbycsXG4gICAgbWVzc2FnZTogYXBpLnRyYW5zbGF0ZSgnVzMgU2NyaXB0IE1lcmdlciBleHRyYWN0ZWQgc3VjY2Vzc2Z1bGx5JywgeyBuczogJ2dhbWUtd2l0Y2hlcjMnIH0pLFxuICB9KTtcbiAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oZXh0cmFjdE5vdGlmSWQpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGRlc3RpbmF0aW9uKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc2V0VXBNZXJnZXIoYXBpLCBtZXJnZXJWZXJzaW9uLCBuZXdQYXRoKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgJ3dpdGNoZXIzJ10sIHVuZGVmaW5lZCk7XG4gIGNvbnN0IGN1cnJlbnREZXRhaWxzID0gZGlzY292ZXJ5Py50b29scz8uVzNTY3JpcHRNZXJnZXI7XG5cbiAgY29uc3QgbmV3VG9vbERldGFpbHMgPSAoISFjdXJyZW50RGV0YWlscylcbiAgICA/IHsgLi4uY3VycmVudERldGFpbHMsIG1lcmdlclZlcnNpb24gfVxuICAgIDoge1xuICAgICAgaWQ6IFNDUklQVF9NRVJHRVJfSUQsXG4gICAgICBuYW1lOiAnVzMgU2NyaXB0IE1lcmdlcicsXG4gICAgICBsb2dvOiAnV2l0Y2hlclNjcmlwdE1lcmdlci5qcGcnLFxuICAgICAgZXhlY3V0YWJsZTogKCkgPT4gJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyxcbiAgICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICAgJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyxcbiAgICAgIF0sXG4gICAgICBtZXJnZXJWZXJzaW9uLFxuICAgIH07XG4gIG5ld1Rvb2xEZXRhaWxzLnBhdGggPSBwYXRoLmpvaW4obmV3UGF0aCwgJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyk7XG4gIG5ld1Rvb2xEZXRhaWxzLndvcmtpbmdEaXJlY3RvcnkgPSBuZXdQYXRoO1xuICBhd2FpdCBzZXRNZXJnZXJDb25maWcoZGlzY292ZXJ5LnBhdGgsIG5ld1BhdGgpO1xuICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5hZGREaXNjb3ZlcmVkVG9vbCgnd2l0Y2hlcjMnLCBTQ1JJUFRfTUVSR0VSX0lELCBuZXdUb29sRGV0YWlscywgdHJ1ZSkpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRNZXJnZWRNb2ROYW1lKHNjcmlwdE1lcmdlclBhdGgpIHtcbiAgY29uc3QgY29uZmlnRmlsZVBhdGggPSBwYXRoLmpvaW4oc2NyaXB0TWVyZ2VyUGF0aCwgTUVSR0VSX0NPTkZJR19GSUxFKTtcbiAgdHJ5IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhjb25maWdGaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIGNvbnN0IGNvbmZpZyA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZShkYXRhKTtcbiAgICBjb25zdCBjb25maWdJdGVtcyA9IGNvbmZpZz8uY29uZmlndXJhdGlvbj8uYXBwU2V0dGluZ3M/LlswXT8uYWRkO1xuICAgIGNvbnN0IE1lcmdlZE1vZE5hbWUgPSBjb25maWdJdGVtcz8uZmluZChpdGVtID0+IGl0ZW0uJD8ua2V5ID09PSAnTWVyZ2VkTW9kTmFtZScpID8/IHVuZGVmaW5lZDtcbiAgICBpZiAoISFNZXJnZWRNb2ROYW1lPy4kPy52YWx1ZSkge1xuICAgICAgcmV0dXJuIE1lcmdlZE1vZE5hbWUuJC52YWx1ZTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIFRoaXMgaXMgcHJvYmFibHkgYSBzaWduIG9mIGEgY29ycnVwdCBzY3JpcHQgbWVyZ2VyIGluc3RhbGxhdGlvbi4uLi5cbiAgICBsb2coJ2Vycm9yJywgJ2ZhaWxlZCB0byBhc2NlcnRhaW4gbWVyZ2VkIG1vZCBuYW1lIC0gdXNpbmcgXCJtb2QwMDAwX01lcmdlZEZpbGVzXCInLCBlcnIpO1xuICAgIHJldHVybiAnbW9kMDAwMF9NZXJnZWRGaWxlcyc7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNldE1lcmdlckNvbmZpZyhnYW1lUm9vdFBhdGgsIHNjcmlwdE1lcmdlclBhdGgpIHtcbiAgY29uc3QgZmluZEluZGV4ID0gKG5vZGVzLCBpZCkgPT4ge1xuICAgIHJldHVybiBub2Rlcz8uZmluZEluZGV4KGl0ZXIgPT4gaXRlci4kPy5rZXkgPT09IGlkKSA/PyB1bmRlZmluZWQ7XG4gIH07XG5cbiAgY29uc3QgY29uZmlnRmlsZVBhdGggPSBwYXRoLmpvaW4oc2NyaXB0TWVyZ2VyUGF0aCwgTUVSR0VSX0NPTkZJR19GSUxFKTtcbiAgdHJ5IHtcbiAgICBjb25zdCBkYXRhID0gYXdhaXQgZnMucmVhZEZpbGVBc3luYyhjb25maWdGaWxlUGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgIGNvbnN0IGNvbmZpZyA9IGF3YWl0IHBhcnNlU3RyaW5nUHJvbWlzZShkYXRhKTtcbiAgICBjb25zdCByZXBsYWNlRWxlbWVudCA9IChpZCwgcmVwbGFjZW1lbnQpID0+IHtcbiAgICAgIGNvbnN0IGlkeCA9IGZpbmRJbmRleChjb25maWc/LmNvbmZpZ3VyYXRpb24/LmFwcFNldHRpbmdzPy5bMF0/LmFkZCwgaWQpO1xuICAgICAgaWYgKGlkeCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGNvbmZpZy5jb25maWd1cmF0aW9uLmFwcFNldHRpbmdzWzBdLmFkZFtpZHhdLiQgPSB7IGtleTogaWQsIHZhbHVlOiByZXBsYWNlbWVudCB9O1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXBsYWNlRWxlbWVudCgnR2FtZURpcmVjdG9yeScsIGdhbWVSb290UGF0aCk7XG4gICAgcmVwbGFjZUVsZW1lbnQoJ1ZhbmlsbGFTY3JpcHRzRGlyZWN0b3J5JywgcGF0aC5qb2luKGdhbWVSb290UGF0aCwgJ2NvbnRlbnQnLCAnY29udGVudDAnLCAnc2NyaXB0cycpKTtcbiAgICByZXBsYWNlRWxlbWVudCgnTW9kc0RpcmVjdG9yeScsIHBhdGguam9pbihnYW1lUm9vdFBhdGgsICdtb2RzJykpO1xuICAgIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQnVpbGRlcigpO1xuICAgIGNvbnN0IHhtbCA9IGJ1aWxkZXIuYnVpbGRPYmplY3QoY29uZmlnKTtcbiAgICBhd2FpdCBmcy53cml0ZUZpbGVBc3luYyhjb25maWdGaWxlUGF0aCwgeG1sKTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgLy8gR3Vlc3MgdGhlIHVzZXIgd2lsbCBoYXZlIHRvIHNldCB1cCB0aGUgbWVyZ2VyIGNvbmZpZ3VyYXRpb25cbiAgICAvLyAgdGhyb3VnaCB0aGUgbWVyZ2VyIGRpcmVjdGx5LlxuICAgIHJldHVybjtcbiAgfVxufVxuIl19