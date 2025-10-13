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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestReleases = getLatestReleases;
exports.checkForUpdates = checkForUpdates;
exports.downloadDivine = downloadDivine;
const https = __importStar(require("https"));
const _ = __importStar(require("lodash"));
const semver = __importStar(require("semver"));
const url = __importStar(require("url"));
const common_1 = require("./common");
const vortex_api_1 = require("vortex-api");
const GITHUB_URL = 'https://api.github.com/repos/Norbyte/lslib';
function query(baseUrl, request) {
    return new Promise((resolve, reject) => {
        const getRequest = getRequestOptions(`${baseUrl}/${request}`);
        https.get(getRequest, (res) => {
            res.setEncoding('utf-8');
            const msgHeaders = res.headers;
            const callsRemaining = parseInt(vortex_api_1.util.getSafe(msgHeaders, ['x-ratelimit-remaining'], '0'), 10);
            if ((res.statusCode === 403) && (callsRemaining === 0)) {
                const resetDate = parseInt(vortex_api_1.util.getSafe(msgHeaders, ['x-ratelimit-reset'], '0'), 10);
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
    const relUrl = url.parse(link);
    return (Object.assign(Object.assign({}, _.pick(relUrl, ['port', 'hostname', 'path'])), { headers: {
            'User-Agent': 'Vortex',
        } }));
}
function downloadConsent(api) {
    return __awaiter(this, void 0, void 0, function* () {
        return api.showDialog('error', 'Divine tool is missing', {
            bbcode: api.translate('Baldur\'s Gate 3\'s modding pattern in most (if not all) cases will require a 3rd '
                + 'party tool named "{{name}}" to manipulate game files.[br][/br][br][/br]'
                + 'Vortex can download and install this tool for you as a mod entry. Please ensure that the '
                + 'tool is always enabled and deployed on the mods page.[br][/br][br][/br]'
                + 'Please note that some Anti-Virus software may flag this tool as malicious due '
                + 'to the nature of the tool (unpacks .pak files). We suggest you ensure that '
                + 'your security software is configured to allow this tool to install.', { replace: { name: 'LSLib' } }),
        }, [
            { label: 'Cancel' },
            { label: 'Download' },
        ])
            .then(result => (result.action === 'Cancel')
            ? Promise.reject(new vortex_api_1.util.UserCanceled())
            : Promise.resolve());
    });
}
function notifyUpdate(api, latest, current) {
    return __awaiter(this, void 0, void 0, function* () {
        const gameId = vortex_api_1.selectors.activeGameId(api.store.getState());
        const t = api.translate;
        return new Promise((resolve, reject) => {
            api.sendNotification({
                type: 'info',
                id: `divine-update`,
                noDismiss: true,
                allowSuppress: true,
                title: 'Update for {{name}}',
                message: 'Latest: {{latest}}, Installed: {{current}}',
                replace: {
                    latest,
                    current,
                },
                actions: [
                    { title: 'More', action: (dismiss) => {
                            api.showDialog('info', '{{name}} Update', {
                                text: 'Vortex has detected a newer version of {{name}} ({{latest}}) available to download from {{website}}. You currently have version {{current}} installed.'
                                    + '\nVortex can download and attempt to install the new update for you.',
                                parameters: {
                                    name: 'LSLib/Divine Tool',
                                    website: common_1.LSLIB_URL,
                                    latest,
                                    current,
                                },
                            }, [
                                {
                                    label: 'Download',
                                    action: () => {
                                        resolve();
                                        dismiss();
                                    },
                                },
                            ]);
                        },
                    },
                    {
                        title: 'Dismiss',
                        action: (dismiss) => {
                            resolve();
                            dismiss();
                        },
                    },
                ],
            });
        });
    });
}
function getLatestReleases(currentVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        if (GITHUB_URL) {
            return query(GITHUB_URL, 'releases')
                .then((releases) => {
                if (!Array.isArray(releases)) {
                    return Promise.reject(new vortex_api_1.util.DataInvalid('expected array of github releases'));
                }
                const current = releases
                    .filter(rel => {
                    const tagName = vortex_api_1.util.getSafe(rel, ['tag_name'], undefined);
                    const isPreRelease = vortex_api_1.util.getSafe(rel, ['prerelease'], false);
                    const version = semver.valid(tagName);
                    return (!isPreRelease
                        && (version !== null)
                        && ((currentVersion === undefined) || (semver.gte(version, currentVersion))));
                })
                    .sort((lhs, rhs) => semver.compare(rhs.tag_name, lhs.tag_name));
                return Promise.resolve(current);
            });
        }
    });
}
function startDownload(api, downloadLink) {
    return __awaiter(this, void 0, void 0, function* () {
        const redirectionURL = yield new Promise((resolve, reject) => {
            https.request(getRequestOptions(downloadLink), res => {
                return resolve(res.headers['location']);
            })
                .on('error', err => reject(err))
                .end();
        });
        const dlInfo = {
            game: common_1.GAME_ID,
            name: 'LSLib/Divine Tool',
        };
        api.events.emit('start-download', [redirectionURL], dlInfo, undefined, (error, id) => {
            if (error !== null) {
                if ((error.name === 'AlreadyDownloaded')
                    && (error.downloadId !== undefined)) {
                    id = error.downloadId;
                }
                else {
                    api.showErrorNotification('Download failed', error, { allowReport: false });
                    return Promise.resolve();
                }
            }
            api.events.emit('start-install-download', id, true, (err, modId) => {
                if (err !== null) {
                    api.showErrorNotification('Failed to install LSLib', err, { allowReport: false });
                }
                const state = api.getState();
                const profileId = vortex_api_1.selectors.lastActiveProfileForGame(state, common_1.GAME_ID);
                api.store.dispatch(vortex_api_1.actions.setModEnabled(profileId, modId, true));
                return Promise.resolve();
            });
        }, 'ask');
    });
}
function resolveDownloadLink(currentReleases) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const archives = currentReleases[0].assets.filter(asset => asset.name.match(/(ExportTool-v[0-9]+.[0-9]+.[0-9]+.zip)/i));
        const downloadLink = (_a = archives[0]) === null || _a === void 0 ? void 0 : _a.browser_download_url;
        return (downloadLink === undefined)
            ? Promise.reject(new vortex_api_1.util.DataInvalid('Failed to resolve browser download url'))
            : Promise.resolve(downloadLink);
    });
}
function checkForUpdates(api, currentVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        return getLatestReleases(currentVersion)
            .then((currentReleases) => __awaiter(this, void 0, void 0, function* () {
            if (currentReleases[0] === undefined) {
                (0, vortex_api_1.log)('error', 'Unable to update LSLib', 'Failed to find any releases');
                return Promise.resolve(currentVersion);
            }
            const mostRecentVersion = currentReleases[0].tag_name.slice(1);
            const downloadLink = yield resolveDownloadLink(currentReleases);
            if (semver.valid(mostRecentVersion) === null) {
                return Promise.resolve(currentVersion);
            }
            else {
                if (semver.gt(mostRecentVersion, currentVersion)) {
                    return notifyUpdate(api, mostRecentVersion, currentVersion)
                        .then(() => startDownload(api, downloadLink))
                        .then(() => Promise.resolve(mostRecentVersion));
                }
                else {
                    return Promise.resolve(currentVersion);
                }
            }
        })).catch(err => {
            if (err instanceof vortex_api_1.util.UserCanceled || err instanceof vortex_api_1.util.ProcessCanceled) {
                return Promise.resolve(currentVersion);
            }
            api.showErrorNotification('Unable to update LSLib', err);
            return Promise.resolve(currentVersion);
        });
    });
}
function downloadDivine(api) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.store.getState();
        const gameId = vortex_api_1.selectors.activeGameId(state);
        return getLatestReleases(undefined)
            .then((currentReleases) => __awaiter(this, void 0, void 0, function* () {
            const downloadLink = yield resolveDownloadLink(currentReleases);
            return downloadConsent(api)
                .then(() => startDownload(api, downloadLink));
        }))
            .catch(err => {
            if (err instanceof vortex_api_1.util.UserCanceled || err instanceof vortex_api_1.util.ProcessCanceled) {
                return Promise.resolve();
            }
            else {
                api.showErrorNotification('Unable to download/install LSLib', err);
                return Promise.resolve();
            }
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0aHViRG93bmxvYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImdpdGh1YkRvd25sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF5SEEsOENBc0JDO0FBbURELDBDQStCQztBQUVELHdDQWlCQztBQXBQRCw2Q0FBK0I7QUFDL0IsMENBQTRCO0FBQzVCLCtDQUFpQztBQUNqQyx5Q0FBMkI7QUFFM0IscUNBQThDO0FBRzlDLDJDQUFrRTtBQUVsRSxNQUFNLFVBQVUsR0FBRyw0Q0FBNEMsQ0FBQztBQUVoRSxTQUFTLEtBQUssQ0FBQyxPQUFlLEVBQUUsT0FBZTtJQUM3QyxPQUFPLElBQUksT0FBTyxDQUFDLENBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxFQUFFO1FBQ3JDLE1BQU0sVUFBVSxHQUFHLGlCQUFpQixDQUFDLEdBQUcsT0FBTyxJQUFJLE9BQU8sRUFBRSxDQUFDLENBQUM7UUFDOUQsS0FBSyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFvQixFQUFFLEVBQUU7WUFDN0MsR0FBRyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUN6QixNQUFNLFVBQVUsR0FBd0IsR0FBRyxDQUFDLE9BQU8sQ0FBQztZQUNwRCxNQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsdUJBQXVCLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUM5RixJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsS0FBSyxHQUFHLENBQUMsSUFBSSxDQUFDLGNBQWMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDO2dCQUN2RCxNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUMsaUJBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxFQUFFLENBQUMsbUJBQW1CLENBQUMsRUFBRSxHQUFHLENB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LE9BQU8sRUFBRSxDQUFDO1lBQzNCLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGh0dHBzIGZyb20gJ2h0dHBzJztcbmltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tICdzZW12ZXInO1xuaW1wb3J0ICogYXMgdXJsIGZyb20gJ3VybCc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIExTTElCX1VSTCB9IGZyb20gJy4vY29tbW9uJztcblxuaW1wb3J0IHsgSW5jb21pbmdIdHRwSGVhZGVycywgSW5jb21pbmdNZXNzYWdlIH0gZnJvbSAnaHR0cCc7XG5pbXBvcnQgeyBhY3Rpb25zLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuY29uc3QgR0lUSFVCX1VSTCA9ICdodHRwczovL2FwaS5naXRodWIuY29tL3JlcG9zL05vcmJ5dGUvbHNsaWInO1xuXG5mdW5jdGlvbiBxdWVyeShiYXNlVXJsOiBzdHJpbmcsIHJlcXVlc3Q6IHN0cmluZyk6IFByb21pc2U8YW55PiB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgY29uc3QgZ2V0UmVxdWVzdCA9IGdldFJlcXVlc3RPcHRpb25zKGAke2Jhc2VVcmx9LyR7cmVxdWVzdH1gKTtcbiAgICBodHRwcy5nZXQoZ2V0UmVxdWVzdCwgKHJlczogSW5jb21pbmdNZXNzYWdlKSA9PiB7XG4gICAgICByZXMuc2V0RW5jb2RpbmcoJ3V0Zi04Jyk7XG4gICAgICBjb25zdCBtc2dIZWFkZXJzOiBJbmNvbWluZ0h0dHBIZWFkZXJzID0gcmVzLmhlYWRlcnM7XG4gICAgICBjb25zdCBjYWxsc1JlbWFpbmluZyA9IHBhcnNlSW50KHV0aWwuZ2V0U2FmZShtc2dIZWFkZXJzLCBbJ3gtcmF0ZWxpbWl0LXJlbWFpbmluZyddLCAnMCcpLCAxMCk7XG4gICAgICBpZiAoKHJlcy5zdGF0dXNDb2RlID09PSA0MDMpICYmIChjYWxsc1JlbWFpbmluZyA9PT0gMCkpIHtcbiAgICAgICAgY29uc3QgcmVzZXREYXRlID0gcGFyc2VJbnQodXRpbC5nZXRTYWZlKG1zZ0hlYWRlcnMsIFsneC1yYXRlbGltaXQtcmVzZXQnXSwgJzAnKSwgMTApO1xuICAgICAgICBsb2coJ2luZm8nLCAnR2l0SHViIHJhdGUgbGltaXQgZXhjZWVkZWQnLFxuICAgICAgICAgIHsgcmVzZXRfYXQ6IChuZXcgRGF0ZShyZXNldERhdGUpKS50b1N0cmluZygpIH0pO1xuICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyB1dGlsLlByb2Nlc3NDYW5jZWxlZCgnR2l0SHViIHJhdGUgbGltaXQgZXhjZWVkZWQnKSk7XG4gICAgICB9XG5cbiAgICAgIGxldCBvdXRwdXQ6IHN0cmluZyA9ICcnO1xuICAgICAgcmVzXG4gICAgICAgIC5vbignZGF0YScsIGRhdGEgPT4gb3V0cHV0ICs9IGRhdGEpXG4gICAgICAgIC5vbignZW5kJywgKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXR1cm4gcmVzb2x2ZShKU09OLnBhcnNlKG91dHB1dCkpO1xuICAgICAgICAgIH0gY2F0Y2ggKHBhcnNlRXJyKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0KHBhcnNlRXJyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG4gICAgICAub24oJ2Vycm9yJywgZXJyID0+IHtcbiAgICAgICAgcmV0dXJuIHJlamVjdChlcnIpO1xuICAgICAgfSlcbiAgICAgIC5lbmQoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldFJlcXVlc3RPcHRpb25zKGxpbmspIHtcbiAgY29uc3QgcmVsVXJsID0gdXJsLnBhcnNlKGxpbmspO1xuICByZXR1cm4gKHtcbiAgICAuLi5fLnBpY2socmVsVXJsLCBbJ3BvcnQnLCAnaG9zdG5hbWUnLCAncGF0aCddKSxcbiAgICBoZWFkZXJzOiB7XG4gICAgICAnVXNlci1BZ2VudCc6ICdWb3J0ZXgnLFxuICAgIH0sXG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBkb3dubG9hZENvbnNlbnQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKTogUHJvbWlzZTx2b2lkPiB7XG4gIHJldHVybiBhcGkuc2hvd0RpYWxvZygnZXJyb3InLCAnRGl2aW5lIHRvb2wgaXMgbWlzc2luZycsIHtcbiAgICBiYmNvZGU6IGFwaS50cmFuc2xhdGUoJ0JhbGR1clxcJ3MgR2F0ZSAzXFwncyBtb2RkaW5nIHBhdHRlcm4gaW4gbW9zdCAoaWYgbm90IGFsbCkgY2FzZXMgd2lsbCByZXF1aXJlIGEgM3JkICdcbiAgICAgICsgJ3BhcnR5IHRvb2wgbmFtZWQgXCJ7e25hbWV9fVwiIHRvIG1hbmlwdWxhdGUgZ2FtZSBmaWxlcy5bYnJdWy9icl1bYnJdWy9icl0nXG4gICAgICArICdWb3J0ZXggY2FuIGRvd25sb2FkIGFuZCBpbnN0YWxsIHRoaXMgdG9vbCBmb3IgeW91IGFzIGEgbW9kIGVudHJ5LiBQbGVhc2UgZW5zdXJlIHRoYXQgdGhlICdcbiAgICAgICsgJ3Rvb2wgaXMgYWx3YXlzIGVuYWJsZWQgYW5kIGRlcGxveWVkIG9uIHRoZSBtb2RzIHBhZ2UuW2JyXVsvYnJdW2JyXVsvYnJdJ1xuICAgICAgKyAnUGxlYXNlIG5vdGUgdGhhdCBzb21lIEFudGktVmlydXMgc29mdHdhcmUgbWF5IGZsYWcgdGhpcyB0b29sIGFzIG1hbGljaW91cyBkdWUgJ1xuICAgICAgKyAndG8gdGhlIG5hdHVyZSBvZiB0aGUgdG9vbCAodW5wYWNrcyAucGFrIGZpbGVzKS4gV2Ugc3VnZ2VzdCB5b3UgZW5zdXJlIHRoYXQgJ1xuICAgICAgKyAneW91ciBzZWN1cml0eSBzb2Z0d2FyZSBpcyBjb25maWd1cmVkIHRvIGFsbG93IHRoaXMgdG9vbCB0byBpbnN0YWxsLicsIHsgcmVwbGFjZTogeyBuYW1lOiAnTFNMaWInIH0gfSksXG4gIH0sIFtcbiAgICB7IGxhYmVsOiAnQ2FuY2VsJyB9LFxuICAgIHsgbGFiZWw6ICdEb3dubG9hZCcgfSxcbiAgXSlcbiAgLnRoZW4ocmVzdWx0ID0+IChyZXN1bHQuYWN0aW9uID09PSAnQ2FuY2VsJylcbiAgICA/IFByb21pc2UucmVqZWN0KG5ldyB1dGlsLlVzZXJDYW5jZWxlZCgpKVxuICAgIDogUHJvbWlzZS5yZXNvbHZlKCkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBub3RpZnlVcGRhdGUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBsYXRlc3Q6IHN0cmluZywgY3VycmVudDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IGdhbWVJZCA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoYXBpLnN0b3JlLmdldFN0YXRlKCkpO1xuICBjb25zdCB0ID0gYXBpLnRyYW5zbGF0ZTtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBhcGkuc2VuZE5vdGlmaWNhdGlvbih7XG4gICAgICB0eXBlOiAnaW5mbycsXG4gICAgICBpZDogYGRpdmluZS11cGRhdGVgLFxuICAgICAgbm9EaXNtaXNzOiB0cnVlLFxuICAgICAgYWxsb3dTdXBwcmVzczogdHJ1ZSxcbiAgICAgIHRpdGxlOiAnVXBkYXRlIGZvciB7e25hbWV9fScsXG4gICAgICBtZXNzYWdlOiAnTGF0ZXN0OiB7e2xhdGVzdH19LCBJbnN0YWxsZWQ6IHt7Y3VycmVudH19JyxcbiAgICAgIHJlcGxhY2U6IHtcbiAgICAgICAgbGF0ZXN0LFxuICAgICAgICBjdXJyZW50LFxuICAgICAgfSxcbiAgICAgIGFjdGlvbnM6IFtcbiAgICAgICAgeyB0aXRsZSA6ICdNb3JlJywgYWN0aW9uOiAoZGlzbWlzczogKCkgPT4gdm9pZCkgPT4ge1xuICAgICAgICAgICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAne3tuYW1lfX0gVXBkYXRlJywge1xuICAgICAgICAgICAgICB0ZXh0OiAnVm9ydGV4IGhhcyBkZXRlY3RlZCBhIG5ld2VyIHZlcnNpb24gb2Yge3tuYW1lfX0gKHt7bGF0ZXN0fX0pIGF2YWlsYWJsZSB0byBkb3dubG9hZCBmcm9tIHt7d2Vic2l0ZX19LiBZb3UgY3VycmVudGx5IGhhdmUgdmVyc2lvbiB7e2N1cnJlbnR9fSBpbnN0YWxsZWQuJ1xuICAgICAgICAgICAgICArICdcXG5Wb3J0ZXggY2FuIGRvd25sb2FkIGFuZCBhdHRlbXB0IHRvIGluc3RhbGwgdGhlIG5ldyB1cGRhdGUgZm9yIHlvdS4nLFxuICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiB7XG4gICAgICAgICAgICAgICAgbmFtZTogJ0xTTGliL0RpdmluZSBUb29sJyxcbiAgICAgICAgICAgICAgICB3ZWJzaXRlOiBMU0xJQl9VUkwsXG4gICAgICAgICAgICAgICAgbGF0ZXN0LFxuICAgICAgICAgICAgICAgIGN1cnJlbnQsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LCBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgbGFiZWw6ICdEb3dubG9hZCcsXG4gICAgICAgICAgICAgICAgICBhY3Rpb246ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICBkaXNtaXNzKCk7XG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0pO1xuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0aXRsZTogJ0Rpc21pc3MnLFxuICAgICAgICAgIGFjdGlvbjogKGRpc21pc3MpID0+IHtcbiAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIGRpc21pc3MoKTtcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRMYXRlc3RSZWxlYXNlcyhjdXJyZW50VmVyc2lvbjogc3RyaW5nKSB7XG4gIGlmIChHSVRIVUJfVVJMKSB7XG4gICAgcmV0dXJuIHF1ZXJ5KEdJVEhVQl9VUkwsICdyZWxlYXNlcycpXG4gICAgLnRoZW4oKHJlbGVhc2VzKSA9PiB7XG4gICAgICBpZiAoIUFycmF5LmlzQXJyYXkocmVsZWFzZXMpKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnZXhwZWN0ZWQgYXJyYXkgb2YgZ2l0aHViIHJlbGVhc2VzJykpO1xuICAgICAgfVxuICAgICAgY29uc3QgY3VycmVudCA9IHJlbGVhc2VzXG4gICAgICAgIC5maWx0ZXIocmVsID0+IHtcbiAgICAgICAgICBjb25zdCB0YWdOYW1lID0gdXRpbC5nZXRTYWZlKHJlbCwgWyd0YWdfbmFtZSddLCB1bmRlZmluZWQpO1xuICAgICAgICAgIGNvbnN0IGlzUHJlUmVsZWFzZSA9IHV0aWwuZ2V0U2FmZShyZWwsIFsncHJlcmVsZWFzZSddLCBmYWxzZSk7XG4gICAgICAgICAgY29uc3QgdmVyc2lvbiA9IHNlbXZlci52YWxpZCh0YWdOYW1lKTtcblxuICAgICAgICAgIHJldHVybiAoIWlzUHJlUmVsZWFzZVxuICAgICAgICAgICAgJiYgKHZlcnNpb24gIT09IG51bGwpXG4gICAgICAgICAgICAmJiAoKGN1cnJlbnRWZXJzaW9uID09PSB1bmRlZmluZWQpIHx8IChzZW12ZXIuZ3RlKHZlcnNpb24sIGN1cnJlbnRWZXJzaW9uKSkpKTtcbiAgICAgICAgfSlcbiAgICAgICAgLnNvcnQoKGxocywgcmhzKSA9PiBzZW12ZXIuY29tcGFyZShyaHMudGFnX25hbWUsIGxocy50YWdfbmFtZSkpO1xuXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGN1cnJlbnQpO1xuICAgIH0pO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN0YXJ0RG93bmxvYWQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBkb3dubG9hZExpbms6IHN0cmluZykge1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6IG5vLXNoYWRvd2VkLXZhcmlhYmxlIC0gd2h5IGlzIHRoaXMgZXZlbiByZXF1aXJlZCA/XG4gIGNvbnN0IHJlZGlyZWN0aW9uVVJMID0gYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGh0dHBzLnJlcXVlc3QoZ2V0UmVxdWVzdE9wdGlvbnMoZG93bmxvYWRMaW5rKSwgcmVzID0+IHtcbiAgICAgIHJldHVybiByZXNvbHZlKHJlcy5oZWFkZXJzWydsb2NhdGlvbiddKTtcbiAgICB9KVxuICAgICAgLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSlcbiAgICAgIC5lbmQoKTtcbiAgfSk7XG4gIGNvbnN0IGRsSW5mbyA9IHtcbiAgICBnYW1lOiBHQU1FX0lELFxuICAgIG5hbWU6ICdMU0xpYi9EaXZpbmUgVG9vbCcsXG4gIH07XG4gIGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtZG93bmxvYWQnLCBbcmVkaXJlY3Rpb25VUkxdLCBkbEluZm8sIHVuZGVmaW5lZCxcbiAgICAoZXJyb3IsIGlkKSA9PiB7XG4gICAgICBpZiAoZXJyb3IgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKChlcnJvci5uYW1lID09PSAnQWxyZWFkeURvd25sb2FkZWQnKVxuICAgICAgICAgICAgJiYgKGVycm9yLmRvd25sb2FkSWQgIT09IHVuZGVmaW5lZCkpIHtcbiAgICAgICAgICBpZCA9IGVycm9yLmRvd25sb2FkSWQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRG93bmxvYWQgZmFpbGVkJyxcbiAgICAgICAgICAgIGVycm9yLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGFwaS5ldmVudHMuZW1pdCgnc3RhcnQtaW5zdGFsbC1kb3dubG9hZCcsIGlkLCB0cnVlLCAoZXJyLCBtb2RJZCkgPT4ge1xuICAgICAgICBpZiAoZXJyICE9PSBudWxsKSB7XG4gICAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIGluc3RhbGwgTFNMaWInLFxuICAgICAgICAgICAgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gICAgICAgIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5sYXN0QWN0aXZlUHJvZmlsZUZvckdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goYWN0aW9ucy5zZXRNb2RFbmFibGVkKHByb2ZpbGVJZCwgbW9kSWQsIHRydWUpKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSwgJ2FzaycpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXNvbHZlRG93bmxvYWRMaW5rKGN1cnJlbnRSZWxlYXNlczogYW55W10pIHtcbiAgY29uc3QgYXJjaGl2ZXMgPSBjdXJyZW50UmVsZWFzZXNbMF0uYXNzZXRzLmZpbHRlcihhc3NldCA9PlxuICAgIGFzc2V0Lm5hbWUubWF0Y2goLyhFeHBvcnRUb29sLXZbMC05XSsuWzAtOV0rLlswLTldKy56aXApL2kpKTtcblxuICBjb25zdCBkb3dubG9hZExpbmsgPSBhcmNoaXZlc1swXT8uYnJvd3Nlcl9kb3dubG9hZF91cmw7XG4gIHJldHVybiAoZG93bmxvYWRMaW5rID09PSB1bmRlZmluZWQpXG4gICAgPyBQcm9taXNlLnJlamVjdChuZXcgdXRpbC5EYXRhSW52YWxpZCgnRmFpbGVkIHRvIHJlc29sdmUgYnJvd3NlciBkb3dubG9hZCB1cmwnKSlcbiAgICA6IFByb21pc2UucmVzb2x2ZShkb3dubG9hZExpbmspO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gY2hlY2tGb3JVcGRhdGVzKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZlcnNpb246IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gIHJldHVybiBnZXRMYXRlc3RSZWxlYXNlcyhjdXJyZW50VmVyc2lvbilcbiAgICAudGhlbihhc3luYyBjdXJyZW50UmVsZWFzZXMgPT4ge1xuICAgICAgaWYgKGN1cnJlbnRSZWxlYXNlc1swXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIFdlIGZhaWxlZCB0byBjaGVjayBmb3IgdXBkYXRlcyAtIHRoYXQncyB1bmZvcnR1bmF0ZSBidXQgc2hvdWxkbid0XG4gICAgICAgIC8vICBiZSByZXBvcnRlZCB0byB0aGUgdXNlciBhcyBpdCB3aWxsIGp1c3QgY29uZnVzZSB0aGVtLlxuICAgICAgICBsb2coJ2Vycm9yJywgJ1VuYWJsZSB0byB1cGRhdGUgTFNMaWInLCAnRmFpbGVkIHRvIGZpbmQgYW55IHJlbGVhc2VzJyk7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3VycmVudFZlcnNpb24pO1xuICAgICAgfVxuICAgICAgY29uc3QgbW9zdFJlY2VudFZlcnNpb24gPSBjdXJyZW50UmVsZWFzZXNbMF0udGFnX25hbWUuc2xpY2UoMSk7XG4gICAgICBjb25zdCBkb3dubG9hZExpbmsgPSBhd2FpdCByZXNvbHZlRG93bmxvYWRMaW5rKGN1cnJlbnRSZWxlYXNlcyk7XG4gICAgICBpZiAoc2VtdmVyLnZhbGlkKG1vc3RSZWNlbnRWZXJzaW9uKSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGN1cnJlbnRWZXJzaW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChzZW12ZXIuZ3QobW9zdFJlY2VudFZlcnNpb24sIGN1cnJlbnRWZXJzaW9uKSkge1xuICAgICAgICAgIHJldHVybiBub3RpZnlVcGRhdGUoYXBpLCBtb3N0UmVjZW50VmVyc2lvbiwgY3VycmVudFZlcnNpb24pXG4gICAgICAgICAgICAudGhlbigoKSA9PiBzdGFydERvd25sb2FkKGFwaSwgZG93bmxvYWRMaW5rKSlcbiAgICAgICAgICAgIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShtb3N0UmVjZW50VmVyc2lvbikpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY3VycmVudFZlcnNpb24pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCB8fCBlcnIgaW5zdGFuY2VvZiB1dGlsLlByb2Nlc3NDYW5jZWxlZCkge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGN1cnJlbnRWZXJzaW9uKTtcbiAgICAgIH1cblxuICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignVW5hYmxlIHRvIHVwZGF0ZSBMU0xpYicsIGVycik7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGN1cnJlbnRWZXJzaW9uKTtcbiAgICB9KTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGRvd25sb2FkRGl2aW5lKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBzdGF0ZSA9IGFwaS5zdG9yZS5nZXRTdGF0ZSgpO1xuICBjb25zdCBnYW1lSWQgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcbiAgcmV0dXJuIGdldExhdGVzdFJlbGVhc2VzKHVuZGVmaW5lZClcbiAgICAudGhlbihhc3luYyBjdXJyZW50UmVsZWFzZXMgPT4ge1xuICAgICAgY29uc3QgZG93bmxvYWRMaW5rID0gYXdhaXQgcmVzb2x2ZURvd25sb2FkTGluayhjdXJyZW50UmVsZWFzZXMpO1xuICAgICAgcmV0dXJuIGRvd25sb2FkQ29uc2VudChhcGkpXG4gICAgICAgIC50aGVuKCgpID0+IHN0YXJ0RG93bmxvYWQoYXBpLCBkb3dubG9hZExpbmspKTtcbiAgICB9KVxuICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkIHx8IGVyciBpbnN0YW5jZW9mIHV0aWwuUHJvY2Vzc0NhbmNlbGVkKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ1VuYWJsZSB0byBkb3dubG9hZC9pbnN0YWxsIExTTGliJywgZXJyKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuICAgIH0pO1xufVxuIl19