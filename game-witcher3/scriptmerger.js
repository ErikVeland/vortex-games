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
exports.getScriptMergerDir = getScriptMergerDir;
exports.downloadScriptMerger = downloadScriptMerger;
exports.getMergedModName = getMergedModName;
exports.setMergerConfig = setMergerConfig;
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
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
function getScriptMergerDir(api_1) {
    return __awaiter(this, arguments, void 0, function* (api, create = false) {
        var _a, _b;
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
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
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
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2NyaXB0bWVyZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsic2NyaXB0bWVyZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBK0tBLGdEQW9CQztBQUVELG9EQXFMQztBQWlERCw0Q0FlQztBQUVELDBDQTJCQztBQXRkRCxrREFBMEI7QUFDMUIsZ0RBQXdCO0FBQ3hCLG9EQUF1QjtBQUN2Qiw4Q0FBc0I7QUFDdEIsbUNBQXFEO0FBQ3JELG9EQUE0QjtBQUM1Qiw4REFBcUM7QUFDckMsMkNBQTJEO0FBSTNELE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQztBQUMvQixNQUFNLFVBQVUsR0FBRyx1REFBdUQsQ0FBQztBQUMzRSxNQUFNLGNBQWMsR0FBRyxxQkFBcUIsQ0FBQztBQUU3QyxNQUFNLGtCQUFrQixHQUFHLGdDQUFnQyxDQUFDO0FBRTVELE1BQU0sRUFBRSxPQUFPLEVBQUUsa0JBQWtCLEVBQUUsZ0JBQWdCLEVBQUUsR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDLENBQUM7QUFHOUUsU0FBUyxLQUFLLENBQUMsT0FBTyxFQUFFLE9BQU87SUFDN0IsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxNQUFNLE1BQU0sR0FBRyxhQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsT0FBTyxJQUFJLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDbEQsTUFBTSxPQUFPLG1DQUNSLGdCQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFVLEVBQUUsTUFBTSxDQUFDLENBQUMsS0FDL0MsT0FBTyxFQUFFO2dCQUNQLFlBQVksRUFBRSxRQUFRO2FBQ3ZCLEdBQ0YsQ0FBQztRQUVGLGVBQUssQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDekIsR0FBRyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6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QkFBTixNQUFNLENBQUUsYUFBYSwwQ0FBRSxXQUFXLDBDQUFHLENBQUMsQ0FBQywwQ0FBRSxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUM7Z0JBQ3hFLElBQUksR0FBRyxLQUFLLFNBQVMsRUFBRSxDQUFDO29CQUN0QixNQUFNLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLENBQUM7Z0JBQ25GLENBQUM7WUFDSCxDQUFDLENBQUM7WUFFRixjQUFjLENBQUMsZUFBZSxFQUFFLFlBQVksQ0FBQyxDQUFDO1lBQzlDLGNBQWMsQ0FBQyx5QkFBeUIsRUFBRSxjQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxTQUFTLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDckcsY0FBYyxDQUFDLGVBQWUsRUFBRSxjQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2pFLE1BQU0sT0FBTyxHQUFHLElBQUksZ0JBQU8sRUFBRSxDQUFDO1lBQzlCLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDeEMsTUFBTSxlQUFFLENBQUMsY0FBYyxDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsQ0FBQztRQUMvQyxDQUFDO1FBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztZQUdiLE9BQU87UUFDVCxDQUFDO0lBQ0gsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBodHRwcyBmcm9tICdodHRwcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgdXJsIGZyb20gJ3VybCc7XG5pbXBvcnQgeyBCdWlsZGVyLCBwYXJzZVN0cmluZ1Byb21pc2UgfSBmcm9tICd4bWwyanMnO1xuaW1wb3J0IHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0IGdldFZlcnNpb24gZnJvbSAnZXhlLXZlcnNpb24nO1xuaW1wb3J0IHsgYWN0aW9ucywgZnMsIHR5cGVzLCBsb2csIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgSUluY29taW5nR2l0aHViSHR0cEhlYWRlcnMgfSBmcm9tICcuL3R5cGVzJztcblxuY29uc3QgUkVMRUFTRV9DVVRPRkYgPSAnMC42LjUnO1xuY29uc3QgR0lUSFVCX1VSTCA9ICdodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zL0lEQ3MvV2l0Y2hlclNjcmlwdE1lcmdlcic7XG5jb25zdCBNRVJHRVJfUkVMUEFUSCA9ICdXaXRjaGVyU2NyaXB0TWVyZ2VyJztcblxuY29uc3QgTUVSR0VSX0NPTkZJR19GSUxFID0gJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlLmNvbmZpZyc7XG5cbmNvbnN0IHsgZ2V0SGFzaCwgTUQ1Q29tcGFyaXNvbkVycm9yLCBTQ1JJUFRfTUVSR0VSX0lEIH0gPSByZXF1aXJlKCcuL2NvbW1vbicpO1xuXG5cbmZ1bmN0aW9uIHF1ZXJ5KGJhc2VVcmwsIHJlcXVlc3QpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCByZWxVcmwgPSB1cmwucGFyc2UoYCR7YmFzZVVybH0vJHtyZXF1ZXN0fWApO1xuICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAuLi5fLnBpY2socmVsVXJsLCBbJ3BvcnQnLCAnaG9zdG5hbWUnLCAncGF0aCddKSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ1VzZXItQWdlbnQnOiAnVm9ydGV4JyxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIGh0dHBzLmdldChvcHRpb25zLCAocmVzKSA9PiB7XG4gICAgICByZXMuc2V0RW5jb2RpbmcoJ3V0Zi04Jyk7XG4gICAgICBjb25zdCBoZWFkZXJzID0gcmVzLmhlYWRlcnMgYXMgSUluY29taW5nR2l0aHViSHR0cEhlYWRlcnM7XG4gICAgICBjb25zdCBjYWxsc1JlbWFpbmluZyA9IHBhcnNlSW50KGhlYWRlcnM/LlsneC1yYXRlbGltaXQtcmVtYWluaW5nJ10sIDEwKTtcbiAgICAgIGlmICgocmVzLnN0YXR1c0NvZGUgPT09IDQwMykgJiYgKGNhbGxzUmVtYWluaW5nID09PSAwKSkge1xuICAgICAgICBjb25zdCByZXNldERhdGUgPSBwYXJzZUludChoZWFkZXJzPy5bJ3gtcmF0ZWxpbWl0LXJlc2V0J10sIDEwKSAqIDEwMDA7XG4gICAgICAgIGxvZygnaW5mbycsICdHaXRIdWIgcmF0ZSBsaW1pdCBleGNlZWRlZCcsXG4gICAgICAgICAgeyByZXNldF9hdDogKG5ldyBEYXRlKHJlc2V0RGF0ZSkpLnRvU3RyaW5nKCkgfSk7XG4gICAgICAgIHJldHVybiByZWplY3QobmV3IHV0aWwuUHJvY2Vzc0NhbmNlbGVkKCdHaXRIdWIgcmF0ZSBsaW1pdCBleGNlZWRlZCcpKTtcbiAgICAgIH1cblxuICAgICAgbGV0IG91dHB1dCA9ICcnO1xuICAgICAgcmVzXG4gICAgICAgIC5vbignZGF0YScsIGRhdGEgPT4gb3V0cHV0ICs9IGRhdGEpXG4gICAgICAgIC5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShKU09OLnBhcnNlKG91dHB1dCkpO1xuICAgICAgICAgIH0gY2F0Y2ggKHBhcnNlRXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KHBhcnNlRXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG4gICAgICAub24oJ2Vycm9yJywgZXJyID0+IHtcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgfSlcbiAgICAgIC5lbmQoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFJlcXVlc3RPcHRpb25zKGxpbmspIHtcbiAgY29uc3QgcmVsVXJsID0gdXJsLnBhcnNlKGxpbmspO1xuICByZXR1cm4gKHtcbiAgICAuLi5fLnBpY2socmVsVXJsLCBbJ3BvcnQnLCAnaG9zdG5hbWUnLCAncGF0aCddKSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnVXNlci1BZ2VudCc6ICdWb3J0ZXgnLFxuICAgIH0sXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBkb3dubG9hZENvbnNlbnQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIFxuICByZXR1cm4gbmV3IFByb21pc2U8dm9pZD4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGFwaS5zaG93RGlhbG9nKCdpbmZvJywgJ1dpdGNoZXIgMyBTY3JpcHQgTWVyZ2VyJywge1xuICAgICAgYmJjb2RlOiBhcGkudHJhbnNsYXRlKCdNYW55IFdpdGNoZXIgMyBtb2RzIGFkZCBvciBlZGl0IGdhbWUgc2NyaXB0cy4gV2hlbiBzZXZlcmFsIG1vZHMgJyBcbiAgICAgICAgKyAnZWRpdGluZyB0aGUgc2FtZSBzY3JpcHQgYXJlIGluc3RhbGxlZCwgdGhlc2UgbW9kcyBuZWVkIHRvIGJlIG1lcmdlZCB1c2luZyBhIHRvb2wgJyBcbiAgICAgICAgKyAnY2FsbGVkIFdpdGNoZXIgMyBTY3JpcHQgTWVyZ2VyLiBWb3J0ZXggY2FuIGF0dGVtcHQgdG8gZG93bmxvYWQgYW5kIGNvbmZpZ3VyZSB0aGUgbWVyZ2VyICdcbiAgICAgICAgKyAnZm9yIHlvdSBhdXRvbWF0aWNhbGx5IC0gYmVmb3JlIGRvaW5nIHNvIC0gcGxlYXNlIGVuc3VyZSB5b3VyIGFjY291bnQgaGFzIGZ1bGwgcmVhZC93cml0ZSBwZXJtaXNzaW9ucyAnXG4gICAgICAgICsgJ3RvIHlvdXIgZ2FtZVxcJ3MgZGlyZWN0b3J5LiBUaGUgc2NyaXB0IG1lcmdlciBjYW4gYmUgaW5zdGFsbGVkIGF0IGEgbGF0ZXIgcG9pbnQgaWYgeW91IHdpc2guIFticl1bL2JyXVticl1bL2JyXSdcbiAgICAgICAgKyAnW3VybD1odHRwczovL3dpa2kubmV4dXNtb2RzLmNvbS9pbmRleC5waHAvVG9vbF9TZXR1cDpfV2l0Y2hlcl8zX1NjcmlwdF9NZXJnZXJdZmluZCBvdXQgbW9yZSBhYm91dCB0aGUgc2NyaXB0IG1lcmdlci5bL3VybF1bYnJdWy9icl1bYnJdWy9icl0nIFxuICAgICAgICArICdOb3RlOiBXaGlsZSBzY3JpcHQgbWVyZ2luZyB3b3JrcyB3ZWxsIHdpdGggdGhlIHZhc3QgbWFqb3JpdHkgb2YgbW9kcywgdGhlcmUgaXMgbm8gZ3VhcmFudGVlIGZvciBhIHNhdGlzZnlpbmcgb3V0Y29tZSBpbiBldmVyeSBzaW5nbGUgY2FzZS4nLCB7IG5zOiAnZ2FtZS13aXRjaGVyMycgfSksXG4gICAgfSwgW1xuICAgICAgeyBsYWJlbDogJ0NhbmNlbCcsIGFjdGlvbjogKCkgPT4gcmVqZWN0KG5ldyB1dGlsLlVzZXJDYW5jZWxlZCgpKSB9LFxuICAgICAgeyBsYWJlbDogJ0Rvd25sb2FkJywgYWN0aW9uOiAoKSA9PiByZXNvbHZlKCkgfSxcbiAgICBdKTtcbiAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldE1lcmdlclZlcnNpb24oYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IGRpc2NvdmVyeSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICdnYW1lTW9kZScsICdkaXNjb3ZlcmVkJywgJ3dpdGNoZXIzJ10sIHVuZGVmaW5lZCk7XG4gIGlmIChkaXNjb3Zlcnk/LnBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5TZXR1cEVycm9yKCdXaXRjaGVyMyBpcyBub3QgZGlzY292ZXJlZCcpKTtcbiAgfVxuICBjb25zdCBtZXJnZXIgPSBkaXNjb3Zlcnk/LnRvb2xzPy5XM1NjcmlwdE1lcmdlcjtcbiAgaWYgKG1lcmdlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG5cbiAgaWYgKCEhbWVyZ2VyPy5wYXRoKSB7XG4gICAgcmV0dXJuIGZzLnN0YXRBc3luYyhtZXJnZXIucGF0aClcbiAgICAgIC50aGVuKCgpID0+IHtcbiAgICAgICAgaWYgKG1lcmdlcj8ubWVyZ2VyVmVyc2lvbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtZXJnZXIubWVyZ2VyVmVyc2lvbik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgZXhlY1ZlcnNpb24gPSBnZXRWZXJzaW9uKG1lcmdlci5wYXRoKTtcbiAgICAgICAgaWYgKCEhZXhlY1ZlcnNpb24pIHtcbiAgICAgICAgICBjb25zdCB0cmltbWVkVmVyc2lvbiA9IGV4ZWNWZXJzaW9uLnNwbGl0KCcuJykuc2xpY2UoMCwgMykuam9pbignLicpO1xuICAgICAgICAgIGNvbnN0IG5ld1Rvb2xEZXRhaWxzID0geyAuLi5tZXJnZXIsIG1lcmdlclZlcnNpb246IHRyaW1tZWRWZXJzaW9uIH07XG4gICAgICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuYWRkRGlzY292ZXJlZFRvb2woJ3dpdGNoZXIzJywgU0NSSVBUX01FUkdFUl9JRCwgbmV3VG9vbERldGFpbHMsIHRydWUpKTtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRyaW1tZWRWZXJzaW9uKTtcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKHVuZGVmaW5lZCkpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKTtcbiAgfVxufVxuXG5sZXQgX0hBU0hfQ0FDSEU7XG5hc3luYyBmdW5jdGlvbiBnZXRDYWNoZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgaWYgKF9IQVNIX0NBQ0hFID09PSB1bmRlZmluZWQpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMocGF0aC5qb2luKF9fZGlybmFtZSwgJ01ENUNhY2hlLmpzb24nKSwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xuICAgICAgX0hBU0hfQ0FDSEUgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgLy8gSWYgdGhpcyBldmVyIGhhcHBlbnMgLSB0aGUgdXNlcidzIG1hY2hpbmUgbXVzdCBiZSBzY3Jld2VkLlxuICAgICAgLy8gIE1heWJlIHZpcnVzID8gZGVmZWN0aXZlIGhhcmR3YXJlID8gZGlkIGhlIG1hbnVhbGx5IG1hbmlwdWxhdGVcbiAgICAgIC8vICB0aGUgZmlsZSA/XG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcGFyc2UgTUQ1Q2FjaGUnLCBlcnIpO1xuICAgICAgcmV0dXJuIF9IQVNIX0NBQ0hFID0gW107XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIF9IQVNIX0NBQ0hFO1xufVxuXG5hc3luYyBmdW5jdGlvbiBvbkRvd25sb2FkQ29tcGxldGUoYXBpLCBhcmNoaXZlUGF0aCwgbW9zdFJlY2VudFZlcnNpb24pIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgYXJjaGl2ZUhhc2g7XG4gICAgdHJ5IHtcbiAgICAgIGFyY2hpdmVIYXNoID0gYXdhaXQgZ2V0SGFzaChhcmNoaXZlUGF0aCk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IE1ENUNvbXBhcmlzb25FcnJvcignRmFpbGVkIHRvIGNhbGN1bGF0ZSBoYXNoJywgYXJjaGl2ZVBhdGgpKTtcbiAgICB9XG4gICAgY29uc3QgaGFzaENhY2hlID0gYXdhaXQgZ2V0Q2FjaGUoYXBpKTtcbiAgICBpZiAoaGFzaENhY2hlLmZpbmQoZW50cnkgPT4gKGVudHJ5LmFyY2hpdmVDaGVja3N1bS50b0xvd2VyQ2FzZSgpID09PSBhcmNoaXZlSGFzaClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJiYgKGVudHJ5LnZlcnNpb24gPT09IG1vc3RSZWNlbnRWZXJzaW9uKSkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gTm90IGEgdmFsaWQgaGFzaCAtIHNvbWV0aGluZyBtYXkgaGF2ZSBoYXBwZW5lZCBkdXJpbmcgdGhlIGRvd25sb2FkID9cbiAgICAgIHJldHVybiByZWplY3QobmV3IE1ENUNvbXBhcmlzb25FcnJvcignQ29ycnVwdGVkIGFyY2hpdmUgZG93bmxvYWQnLCBhcmNoaXZlUGF0aCkpO1xuICAgIH1cblxuICAgIHJldHVybiByZXNvbHZlKGFyY2hpdmVQYXRoKTtcbiAgfSlcbiAgLnRoZW4oKGFyY2hpdmVQYXRoKSA9PiBleHRyYWN0U2NyaXB0TWVyZ2VyKGFwaSwgYXJjaGl2ZVBhdGgpKVxuICAudGhlbihhc3luYyAobWVyZ2VyUGF0aCkgPT4ge1xuICAgIGNvbnN0IG1lcmdlckV4ZWMgPSBwYXRoLmpvaW4obWVyZ2VyUGF0aCwgJ1dpdGNoZXJTY3JpcHRNZXJnZXIuZXhlJyk7XG4gICAgbGV0IGV4ZWNIYXNoO1xuICAgIHRyeSB7XG4gICAgICBleGVjSGFzaCA9IGF3YWl0IGdldEhhc2gobWVyZ2VyRXhlYyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IE1ENUNvbXBhcmlzb25FcnJvcignRmFpbGVkIHRvIGNhbGN1bGF0ZSBoYXNoJywgbWVyZ2VyRXhlYykpO1xuICAgIH1cbiAgICBjb25zdCBoYXNoQ2FjaGUgPSBhd2FpdCBnZXRDYWNoZShhcGkpO1xuICAgIGlmIChoYXNoQ2FjaGUuZmluZChlbnRyeSA9PiAoZW50cnkuZXhlY0NoZWNrc3VtLnRvTG93ZXJDYXNlKCkgPT09IGV4ZWNIYXNoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAoZW50cnkudmVyc2lvbiA9PT0gbW9zdFJlY2VudFZlcnNpb24pKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBOb3QgYSB2YWxpZCBoYXNoIC0gc29tZXRoaW5nIG1heSBoYXZlIGhhcHBlbmVkIGR1cmluZyBleHRyYWN0aW9uID9cbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgTUQ1Q29tcGFyaXNvbkVycm9yKCdDb3JydXB0ZWQgZXhlY3V0YWJsZScsIG1lcmdlckV4ZWMpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG1lcmdlclBhdGgpO1xuICB9KVxuICAudGhlbigobWVyZ2VyUGF0aCkgPT4gc2V0VXBNZXJnZXIoYXBpLCBtb3N0UmVjZW50VmVyc2lvbiwgbWVyZ2VyUGF0aCkpXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTY3JpcHRNZXJnZXJEaXIoYXBpLCBjcmVhdGUgPSBmYWxzZSkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsICd3aXRjaGVyMyddLCB1bmRlZmluZWQpO1xuICBpZiAoZGlzY292ZXJ5Py5wYXRoID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9XG4gIGNvbnN0IGN1cnJlbnRQYXRoID0gZGlzY292ZXJ5LnRvb2xzPy5XM1NjcmlwdE1lcmdlcj8ucGF0aDtcbiAgdHJ5IHtcbiAgICBpZiAoIWN1cnJlbnRQYXRoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NjcmlwdCBNZXJnZXIgbm90IHNldCB1cCcpO1xuICAgIH1cbiAgICBhd2FpdCBmcy5zdGF0QXN5bmMoY3VycmVudFBhdGgpO1xuICAgIHJldHVybiBjdXJyZW50UGF0aDtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc3QgZGVmYXVsdFBhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIE1FUkdFUl9SRUxQQVRIKTtcbiAgICBpZiAoY3JlYXRlKSB7XG4gICAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKGRlZmF1bHRQYXRoKTtcbiAgICB9XG4gICAgcmV0dXJuIGRlZmF1bHRQYXRoO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkb3dubG9hZFNjcmlwdE1lcmdlcihhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCAnd2l0Y2hlcjMnXSwgdW5kZWZpbmVkKTtcbiAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlNldHVwRXJyb3IoJ1dpdGNoZXIzIGlzIG5vdCBkaXNjb3ZlcmVkJykpO1xuICB9XG4gIGxldCBtb3N0UmVjZW50VmVyc2lvbjtcbiAgY29uc3QgY3VycmVudGx5SW5zdGFsbGVkVmVyc2lvbiA9IGF3YWl0IGdldE1lcmdlclZlcnNpb24oYXBpKTtcbiAgY29uc3QgZG93bmxvYWROb3RpZklkID0gJ2Rvd25sb2FkLXNjcmlwdC1tZXJnZXItbm90aWYnO1xuICByZXR1cm4gcXVlcnkoR0lUSFVCX1VSTCwgJ3JlbGVhc2VzJylcbiAgICAudGhlbigocmVsZWFzZXMpID0+IHtcbiAgICAgIGlmICghQXJyYXkuaXNBcnJheShyZWxlYXNlcykpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLkRhdGFJbnZhbGlkKCdleHBlY3RlZCBhcnJheSBvZiBnaXRodWIgcmVsZWFzZXMnKSk7XG4gICAgICB9XG4gICAgICBjb25zdCBjdXJyZW50ID0gcmVsZWFzZXNcbiAgICAgICAgLmZpbHRlcihyZWwgPT4gc2VtdmVyLnZhbGlkKHJlbC5uYW1lKSAmJiBzZW12ZXIuZ3RlKHJlbC5uYW1lLCBSRUxFQVNFX0NVVE9GRikpXG4gICAgICAgIC5zb3J0KChsaHMsIHJocykgPT4gc2VtdmVyLmNvbXBhcmUocmhzLm5hbWUsIGxocy5uYW1lKSk7XG5cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3VycmVudCk7XG4gICAgfSlcbiAgICAudGhlbihhc3luYyBjdXJyZW50UmVsZWFzZSA9PiB7XG4gICAgICBtb3N0UmVjZW50VmVyc2lvbiA9IGN1cnJlbnRSZWxlYXNlWzBdLm5hbWU7XG4gICAgICBjb25zdCBmaWxlTmFtZSA9IGN1cnJlbnRSZWxlYXNlWzBdLmFzc2V0c1swXS5uYW1lO1xuICAgICAgY29uc3QgZG93bmxvYWRMaW5rID0gY3VycmVudFJlbGVhc2VbMF0uYXNzZXRzWzBdLmJyb3dzZXJfZG93bmxvYWRfdXJsO1xuICAgICAgaWYgKCEhY3VycmVudGx5SW5zdGFsbGVkVmVyc2lvbiAmJiBzZW12ZXIuZ3RlKGN1cnJlbnRseUluc3RhbGxlZFZlcnNpb24sIGN1cnJlbnRSZWxlYXNlWzBdLm5hbWUpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0FscmVhZHkgdXAgdG8gZGF0ZScpKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZG93bmxvYWROb3RpZjogdHlwZXMuSU5vdGlmaWNhdGlvbiA9IHtcbiAgICAgICAgaWQ6IGRvd25sb2FkTm90aWZJZCxcbiAgICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICAgICAgdGl0bGU6ICdBZGRpbmcgU2NyaXB0IE1lcmdlcicsXG4gICAgICAgIG1lc3NhZ2U6ICdUaGlzIG1heSB0YWtlIGEgbWludXRlLi4uJyxcbiAgICAgIH1cbiAgICAgIGNvbnN0IGRvd25sb2FkID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICAgICAgLi4uZG93bmxvYWROb3RpZixcbiAgICAgICAgICBwcm9ncmVzczogMCxcbiAgICAgICAgfSk7XG4gICAgICAgIGxldCByZWRpcmVjdGlvblVSTDtcbiAgICAgICAgcmVkaXJlY3Rpb25VUkwgPSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGdldFJlcXVlc3RPcHRpb25zKGRvd25sb2FkTGluayk7XG4gICAgICAgICAgaHR0cHMucmVxdWVzdChvcHRpb25zLCByZXMgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIChyZXMuaGVhZGVyc1snbG9jYXRpb24nXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgICA/IHJlc29sdmUocmVzLmhlYWRlcnNbJ2xvY2F0aW9uJ10pXG4gICAgICAgICAgICAgIDogcmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnRmFpbGVkIHRvIHJlc29sdmUgZG93bmxvYWQgbG9jYXRpb24nKSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpXG4gICAgICAgICAgICAuZW5kKCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBnZXRSZXF1ZXN0T3B0aW9ucyhyZWRpcmVjdGlvblVSTCk7XG4gICAgICAgICAgaHR0cHMucmVxdWVzdChvcHRpb25zLCByZXMgPT4ge1xuICAgICAgICAgICAgcmVzLnNldEVuY29kaW5nKCdiaW5hcnknKTtcbiAgICAgICAgICAgIGNvbnN0IGhlYWRlcnMgPSByZXMuaGVhZGVycyBhcyBJSW5jb21pbmdHaXRodWJIdHRwSGVhZGVycztcbiAgICAgICAgICAgIGNvbnN0IGNvbnRlbnRMZW5ndGggPSBwYXJzZUludChoZWFkZXJzPy5bJ2NvbnRlbnQtbGVuZ3RoJ10sIDEwKTtcbiAgICAgICAgICAgIGNvbnN0IGNhbGxzUmVtYWluaW5nID0gcGFyc2VJbnQoaGVhZGVycz8uWyd4LXJhdGVsaW1pdC1yZW1haW5pbmcnXSwgMTApO1xuICAgICAgICAgICAgaWYgKChyZXMuc3RhdHVzQ29kZSA9PT0gNDAzKSAmJiAoY2FsbHNSZW1haW5pbmcgPT09IDApKSB7XG4gICAgICAgICAgICAgIGNvbnN0IHJlc2V0RGF0ZSA9IHBhcnNlSW50KGhlYWRlcnM/LlsneC1yYXRlbGltaXQtcmVzZXQnXSwgMTApICogMTAwMDtcbiAgICAgICAgICAgICAgbG9nKCdpbmZvJywgJ0dpdEh1YiByYXRlIGxpbWl0IGV4Y2VlZGVkJyxcbiAgICAgICAgICAgICAgICB7IHJlc2V0X2F0OiAobmV3IERhdGUocmVzZXREYXRlKSkudG9TdHJpbmcoKSB9KTtcbiAgICAgICAgICAgICAgcmV0dXJuIHJlamVjdChuZXcgdXRpbC5Qcm9jZXNzQ2FuY2VsZWQoJ0dpdEh1YiByYXRlIGxpbWl0IGV4Y2VlZGVkJykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBsZXQgb3V0cHV0ID0gJyc7XG4gICAgICAgICAgICByZXNcbiAgICAgICAgICAgICAgLm9uKCdkYXRhJywgZGF0YSA9PiB7XG4gICAgICAgICAgICAgICAgb3V0cHV0ICs9IGRhdGFcbiAgICAgICAgICAgICAgICBpZiAob3V0cHV0Lmxlbmd0aCAlIDUwMCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgLy8gVXBkYXRpbmcgdGhlIG5vdGlmaWNhdGlvbiBpcyBFWFRSRU1FTFkgZXhwZW5zaXZlLlxuICAgICAgICAgICAgICAgICAgLy8gIHRoZSBsZW5ndGggJSA1MDAgPT09IDAgbGluZSBlbnN1cmVzIHRoaXMgaXMgbm90IGRvbmUgdG9vXG4gICAgICAgICAgICAgICAgICAvLyAgb2Z0ZW4uXG4gICAgICAgICAgICAgICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICAgICAgICAgICAgICAgIC4uLmRvd25sb2FkTm90aWYsXG4gICAgICAgICAgICAgICAgICAgIHByb2dyZXNzOiAob3V0cHV0Lmxlbmd0aCAvIGNvbnRlbnRMZW5ndGgpICogMTAwLFxuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAub24oJ2VuZCcsICgpID0+IHtcbiAgICAgICAgICAgICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICAgICAgICAgICAgICAuLi5kb3dubG9hZE5vdGlmLFxuICAgICAgICAgICAgICAgICAgcHJvZ3Jlc3M6IDEwMCxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihkb3dubG9hZE5vdGlmSWQpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmcy53cml0ZUZpbGVBc3luYyhwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIGZpbGVOYW1lKSwgb3V0cHV0LCB7IGVuY29kaW5nOiAnYmluYXJ5JyB9KVxuICAgICAgICAgICAgICAgICAgLnRoZW4oKCkgPT4gcmVzb2x2ZShwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIGZpbGVOYW1lKSkpXG4gICAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IHJlamVjdChlcnIpKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAgIC5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpXG4gICAgICAgICAgICAuZW5kKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoISFjdXJyZW50bHlJbnN0YWxsZWRWZXJzaW9uIHx8ICgoY3VycmVudGx5SW5zdGFsbGVkVmVyc2lvbiA9PT0gdW5kZWZpbmVkKSAmJiAhIWRpc2NvdmVyeT8udG9vbHM/LlczU2NyaXB0TWVyZ2VyKSkge1xuICAgICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICAgICAgaWQ6ICdtZXJnZXItdXBkYXRlJyxcbiAgICAgICAgICB0eXBlOiAnd2FybmluZycsXG4gICAgICAgICAgbm9EaXNtaXNzOiB0cnVlLFxuICAgICAgICAgIG1lc3NhZ2U6IGFwaS50cmFuc2xhdGUoJ0ltcG9ydGFudCBTY3JpcHQgTWVyZ2VyIHVwZGF0ZSBhdmFpbGFibGUnLFxuICAgICAgICAgICAgeyBuczogJ2dhbWUtd2l0Y2hlcjMnIH0pLFxuICAgICAgICAgIGFjdGlvbnM6IFsgeyB0aXRsZTogJ0Rvd25sb2FkJywgYWN0aW9uOiBkaXNtaXNzID0+IHtcbiAgICAgICAgICAgIGRpc21pc3MoKTtcbiAgICAgICAgICAgIHJldHVybiBkb3dubG9hZCgpXG4gICAgICAgICAgICAgIC50aGVuKChhcmNoaXZlUGF0aCkgPT4gb25Eb3dubG9hZENvbXBsZXRlKGFwaSwgYXJjaGl2ZVBhdGgsIG1vc3RSZWNlbnRWZXJzaW9uKSlcbiAgICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgICAgYXBpLmRpc21pc3NOb3RpZmljYXRpb24oZXh0cmFjdE5vdGlmSWQpO1xuICAgICAgICAgICAgICAgIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKGRvd25sb2FkTm90aWZJZCk7XG4gICAgICAgICAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIE1ENUNvbXBhcmlzb25FcnJvciB8fCBlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCkge1xuICAgICAgICAgICAgICAgICAgbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gYXV0b21hdGljYWxseSBpbnN0YWxsIFNjcmlwdCBNZXJnZXInLCBlcnIuZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgIGFwaS5zZW5kTm90aWZpY2F0aW9uKHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2Vycm9yJyxcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZTogYXBpLnRyYW5zbGF0ZSgnUGxlYXNlIGluc3RhbGwgU2NyaXB0IE1lcmdlciBtYW51YWxseScsIHsgbnM6ICdnYW1lLXdpdGNoZXIzJyB9KSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uczogW1xuICAgICAgICAgICAgICAgICAgICAgIHsgXG4gICAgICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ0luc3RhbGwgTWFudWFsbHknLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAoKSA9PiB1dGlsLm9wbignaHR0cHM6Ly93d3cubmV4dXNtb2RzLmNvbS93aXRjaGVyMy9tb2RzLzQ4NCcpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBDdXJyZW50bHkgQUZBSUsgdGhpcyB3b3VsZCBvbmx5IG9jY3VyIGlmIGdpdGh1YiBpcyBkb3duIGZvciBhbnkgcmVhc29uXG4gICAgICAgICAgICAgICAgLy8gIGFuZCB3ZSB3ZXJlIHVuYWJsZSB0byByZXNvbHZlIHRoZSByZS1kaXJlY3Rpb24gbGluay4gR2l2ZW4gdGhhdCB0aGUgdXNlclxuICAgICAgICAgICAgICAgIC8vICBleHBlY3RzIGEgcmVzdWx0IGZyb20gaGltIGNsaWNraW5nIHRoZSBkb3dubG9hZCBidXR0b24sIHdlIGxldCBoaW0ga25vd1xuICAgICAgICAgICAgICAgIC8vICB0byB0cnkgYWdhaW5cbiAgICAgICAgICAgICAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICAgICAgICAgICAgICB0eXBlOiAnaW5mbycsXG4gICAgICAgICAgICAgICAgICBtZXNzYWdlOiBhcGkudHJhbnNsYXRlKCdVcGRhdGUgZmFpbGVkIGR1ZSB0ZW1wb3JhcnkgbmV0d29yayBpc3N1ZSAtIHRyeSBhZ2FpbiBsYXRlcicsIHsgbnM6ICdnYW1lLXdpdGNoZXIzJyB9KSxcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICB9IH0gXSxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnVXBkYXRlJykpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gZG93bmxvYWRDb25zZW50KGFwaSlcbiAgICAgICAgLnRoZW4oKCkgPT4gZG93bmxvYWQoKSk7XG4gICAgfSlcbiAgICAudGhlbigoYXJjaGl2ZVBhdGgpID0+IG9uRG93bmxvYWRDb21wbGV0ZShhcGksIGFyY2hpdmVQYXRoLCBtb3N0UmVjZW50VmVyc2lvbikpXG4gICAgLmNhdGNoKGFzeW5jIGVyciA9PiB7XG4gICAgICBjb25zdCByYWlzZU1hbnVhbEluc3RhbGxOb3RpZiA9ICgpID0+IHtcbiAgICAgICAgbG9nKCdlcnJvcicsICdGYWlsZWQgdG8gYXV0b21hdGljYWxseSBpbnN0YWxsIFNjcmlwdCBNZXJnZXInLCBlcnIuZXJyb3JNZXNzYWdlKTtcbiAgICAgICAgYXBpLnNlbmROb3RpZmljYXRpb24oe1xuICAgICAgICAgIHR5cGU6ICdlcnJvcicsXG4gICAgICAgICAgbWVzc2FnZTogYXBpLnRyYW5zbGF0ZSgnUGxlYXNlIGluc3RhbGwgU2NyaXB0IE1lcmdlciBtYW51YWxseScsIHsgbnM6ICdnYW1lLXdpdGNoZXIzJyB9KSxcbiAgICAgICAgICBhY3Rpb25zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHRpdGxlOiAnSW5zdGFsbCBNYW51YWxseScsXG4gICAgICAgICAgICAgIGFjdGlvbjogKCkgPT4gdXRpbC5vcG4oJ2h0dHBzOi8vd3d3Lm5leHVzbW9kcy5jb20vd2l0Y2hlcjMvbW9kcy80ODQnKVxuICAgICAgICAgICAgICAgICAgICAuY2F0Y2goZXJyID0+IG51bGwpXG4gICAgICAgICAgICB9XSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihleHRyYWN0Tm90aWZJZCk7XG4gICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbihkb3dubG9hZE5vdGlmSWQpO1xuICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIE1ENUNvbXBhcmlzb25FcnJvcikge1xuICAgICAgICByYWlzZU1hbnVhbEluc3RhbGxOb3RpZigpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfSBlbHNlIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCkge1xuICAgICAgICBpZiAoKGVyci5tZXNzYWdlLnN0YXJ0c1dpdGgoJ0FscmVhZHknKSkgfHwgKGVyci5tZXNzYWdlLnN0YXJ0c1dpdGgoJ1VwZGF0ZScpKSkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfSBlbHNlIGlmIChlcnIubWVzc2FnZS5zdGFydHNXaXRoKCdGYWlsZWQgdG8gcmVzb2x2ZSBkb3dubG9hZCBsb2NhdGlvbicpKSB7XG4gICAgICAgICAgLy8gQ3VycmVudGx5IEFGQUlLIHRoaXMgd291bGQgb25seSBvY2N1ciBpZiBnaXRodWIgaXMgZG93biBmb3IgYW55IHJlYXNvblxuICAgICAgICAgIC8vICBhbmQgd2Ugd2VyZSB1bmFibGUgdG8gcmVzb2x2ZSB0aGUgcmUtZGlyZWN0aW9uIGxpbmsuIEdpdmVuIHRoYXQgdGhpc1xuICAgICAgICAgIC8vICB3aWxsIG1vc3QgY2VydGFpbmx5IHJlc29sdmUgaXRzZWxmIGV2ZW50dWFsbHkgLSB3ZSBsb2cgdGhpcyBhbmQga2VlcCBnb2luZy5cbiAgICAgICAgICBsb2coJ2luZm8nLCAnZmFpbGVkIHRvIHJlc29sdmUgVzMgc2NyaXB0IG1lcmdlciByZS1kaXJlY3Rpb24gbGluaycsIGVycik7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9IGVsc2UgaWYgKGVyci5tZXNzYWdlLnN0YXJ0c1dpdGgoJ0dhbWUgaXMgbm90IGRpc2NvdmVyZWQnKSkge1xuICAgICAgICAgIHJhaXNlTWFudWFsSW5zdGFsbE5vdGlmKCk7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9KVxufVxuXG5jb25zdCBleHRyYWN0Tm90aWZJZCA9ICdleHRyYWN0aW5nLXNjcmlwdC1tZXJnZXInO1xuY29uc3QgZXh0cmFjdE5vdGlmID0ge1xuICBpZDogZXh0cmFjdE5vdGlmSWQsXG4gIHR5cGU6ICdhY3Rpdml0eScsXG4gIHRpdGxlOiAnRXh0cmFjdGluZyBTY3JpcHQgTWVyZ2VyJyxcbn1cbmFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RTY3JpcHRNZXJnZXIoYXBpLCBhcmNoaXZlUGF0aCkge1xuICBjb25zdCBkZXN0aW5hdGlvbiA9IGF3YWl0IGdldFNjcmlwdE1lcmdlckRpcihhcGksIHRydWUpO1xuICBpZiAoZGVzdGluYXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIEhvdyA/XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2FtZSBpcyBub3QgZGlzY292ZXJlZCcpKTtcbiAgfVxuICBjb25zdCBzWmlwID0gbmV3IHV0aWwuU2V2ZW5aaXAoKTtcbiAgYXBpLnNlbmROb3RpZmljYXRpb24oZXh0cmFjdE5vdGlmKTtcbiAgYXdhaXQgc1ppcC5leHRyYWN0RnVsbChhcmNoaXZlUGF0aCwgZGVzdGluYXRpb24pO1xuICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgdHlwZTogJ2luZm8nLFxuICAgIG1lc3NhZ2U6IGFwaS50cmFuc2xhdGUoJ1czIFNjcmlwdCBNZXJnZXIgZXh0cmFjdGVkIHN1Y2Nlc3NmdWxseScsIHsgbnM6ICdnYW1lLXdpdGNoZXIzJyB9KSxcbiAgfSk7XG4gIGFwaS5kaXNtaXNzTm90aWZpY2F0aW9uKGV4dHJhY3ROb3RpZklkKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShkZXN0aW5hdGlvbik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNldFVwTWVyZ2VyKGFwaSwgbWVyZ2VyVmVyc2lvbiwgbmV3UGF0aCkge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsICd3aXRjaGVyMyddLCB1bmRlZmluZWQpO1xuICBjb25zdCBjdXJyZW50RGV0YWlscyA9IGRpc2NvdmVyeT8udG9vbHM/LlczU2NyaXB0TWVyZ2VyO1xuXG4gIGNvbnN0IG5ld1Rvb2xEZXRhaWxzID0gKCEhY3VycmVudERldGFpbHMpXG4gICAgPyB7IC4uLmN1cnJlbnREZXRhaWxzLCBtZXJnZXJWZXJzaW9uIH1cbiAgICA6IHtcbiAgICAgIGlkOiBTQ1JJUFRfTUVSR0VSX0lELFxuICAgICAgbmFtZTogJ1czIFNjcmlwdCBNZXJnZXInLFxuICAgICAgbG9nbzogJ1dpdGNoZXJTY3JpcHRNZXJnZXIuanBnJyxcbiAgICAgIGV4ZWN1dGFibGU6ICgpID0+ICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZScsXG4gICAgICByZXF1aXJlZEZpbGVzOiBbXG4gICAgICAgICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZScsXG4gICAgICBdLFxuICAgICAgbWVyZ2VyVmVyc2lvbixcbiAgICB9O1xuICBuZXdUb29sRGV0YWlscy5wYXRoID0gcGF0aC5qb2luKG5ld1BhdGgsICdXaXRjaGVyU2NyaXB0TWVyZ2VyLmV4ZScpO1xuICBuZXdUb29sRGV0YWlscy53b3JraW5nRGlyZWN0b3J5ID0gbmV3UGF0aDtcbiAgYXdhaXQgc2V0TWVyZ2VyQ29uZmlnKGRpc2NvdmVyeS5wYXRoLCBuZXdQYXRoKTtcbiAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuYWRkRGlzY292ZXJlZFRvb2woJ3dpdGNoZXIzJywgU0NSSVBUX01FUkdFUl9JRCwgbmV3VG9vbERldGFpbHMsIHRydWUpKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0TWVyZ2VkTW9kTmFtZShzY3JpcHRNZXJnZXJQYXRoKSB7XG4gIGNvbnN0IGNvbmZpZ0ZpbGVQYXRoID0gcGF0aC5qb2luKHNjcmlwdE1lcmdlclBhdGgsIE1FUkdFUl9DT05GSUdfRklMRSk7XG4gIHRyeSB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoY29uZmlnRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICBjb25zdCBjb25maWcgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoZGF0YSk7XG4gICAgY29uc3QgY29uZmlnSXRlbXMgPSBjb25maWc/LmNvbmZpZ3VyYXRpb24/LmFwcFNldHRpbmdzPy5bMF0/LmFkZDtcbiAgICBjb25zdCBNZXJnZWRNb2ROYW1lID0gY29uZmlnSXRlbXM/LmZpbmQoaXRlbSA9PiBpdGVtLiQ/LmtleSA9PT0gJ01lcmdlZE1vZE5hbWUnKSA/PyB1bmRlZmluZWQ7XG4gICAgaWYgKCEhTWVyZ2VkTW9kTmFtZT8uJD8udmFsdWUpIHtcbiAgICAgIHJldHVybiBNZXJnZWRNb2ROYW1lLiQudmFsdWU7XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICAvLyBUaGlzIGlzIHByb2JhYmx5IGEgc2lnbiBvZiBhIGNvcnJ1cHQgc2NyaXB0IG1lcmdlciBpbnN0YWxsYXRpb24uLi4uXG4gICAgbG9nKCdlcnJvcicsICdmYWlsZWQgdG8gYXNjZXJ0YWluIG1lcmdlZCBtb2QgbmFtZSAtIHVzaW5nIFwibW9kMDAwMF9NZXJnZWRGaWxlc1wiJywgZXJyKTtcbiAgICByZXR1cm4gJ21vZDAwMDBfTWVyZ2VkRmlsZXMnO1xuICB9XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRNZXJnZXJDb25maWcoZ2FtZVJvb3RQYXRoLCBzY3JpcHRNZXJnZXJQYXRoKSB7XG4gIGNvbnN0IGZpbmRJbmRleCA9IChub2RlcywgaWQpID0+IHtcbiAgICByZXR1cm4gbm9kZXM/LmZpbmRJbmRleChpdGVyID0+IGl0ZXIuJD8ua2V5ID09PSBpZCkgPz8gdW5kZWZpbmVkO1xuICB9O1xuXG4gIGNvbnN0IGNvbmZpZ0ZpbGVQYXRoID0gcGF0aC5qb2luKHNjcmlwdE1lcmdlclBhdGgsIE1FUkdFUl9DT05GSUdfRklMRSk7XG4gIHRyeSB7XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoY29uZmlnRmlsZVBhdGgsIHsgZW5jb2Rpbmc6ICd1dGY4JyB9KTtcbiAgICBjb25zdCBjb25maWcgPSBhd2FpdCBwYXJzZVN0cmluZ1Byb21pc2UoZGF0YSk7XG4gICAgY29uc3QgcmVwbGFjZUVsZW1lbnQgPSAoaWQsIHJlcGxhY2VtZW50KSA9PiB7XG4gICAgICBjb25zdCBpZHggPSBmaW5kSW5kZXgoY29uZmlnPy5jb25maWd1cmF0aW9uPy5hcHBTZXR0aW5ncz8uWzBdPy5hZGQsIGlkKTtcbiAgICAgIGlmIChpZHggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb25maWcuY29uZmlndXJhdGlvbi5hcHBTZXR0aW5nc1swXS5hZGRbaWR4XS4kID0geyBrZXk6IGlkLCB2YWx1ZTogcmVwbGFjZW1lbnQgfTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmVwbGFjZUVsZW1lbnQoJ0dhbWVEaXJlY3RvcnknLCBnYW1lUm9vdFBhdGgpO1xuICAgIHJlcGxhY2VFbGVtZW50KCdWYW5pbGxhU2NyaXB0c0RpcmVjdG9yeScsIHBhdGguam9pbihnYW1lUm9vdFBhdGgsICdjb250ZW50JywgJ2NvbnRlbnQwJywgJ3NjcmlwdHMnKSk7XG4gICAgcmVwbGFjZUVsZW1lbnQoJ01vZHNEaXJlY3RvcnknLCBwYXRoLmpvaW4oZ2FtZVJvb3RQYXRoLCAnbW9kcycpKTtcbiAgICBjb25zdCBidWlsZGVyID0gbmV3IEJ1aWxkZXIoKTtcbiAgICBjb25zdCB4bWwgPSBidWlsZGVyLmJ1aWxkT2JqZWN0KGNvbmZpZyk7XG4gICAgYXdhaXQgZnMud3JpdGVGaWxlQXN5bmMoY29uZmlnRmlsZVBhdGgsIHhtbCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIC8vIEd1ZXNzIHRoZSB1c2VyIHdpbGwgaGF2ZSB0byBzZXQgdXAgdGhlIG1lcmdlciBjb25maWd1cmF0aW9uXG4gICAgLy8gIHRocm91Z2ggdGhlIG1lcmdlciBkaXJlY3RseS5cbiAgICByZXR1cm47XG4gIH1cbn1cbiJdfQ==