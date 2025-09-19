const { isWindows } = require('vortex-api');
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
const bluebird_1 = __importDefault(require("bluebird"));
const React = __importStar(require("react"));
const BS = __importStar(require("react-bootstrap"));
const react_redux_1 = require("react-redux");
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const collections_1 = require("./collections/collections");
const CollectionsDataView_1 = __importDefault(require("./collections/CollectionsDataView"));
const statics_1 = require("./statics");
const util_1 = require("./util");
const I18N_NAMESPACE = `game-${statics_1.GAME_ID}`;
const STEAM_APPID = '379430';
const EPIC_APPID = 'Eel';
const XBOX_APPID = 'DeepSilver.KingdomComeDeliverance';
const XBOXEXECNAME = 'App';
const _MODS_STATE = {
    enabled: [],
    disabled: [],
    display: [],
};
function findGame() {
    return vortex_api_1.util.GameStoreHelper.findByAppId([STEAM_APPID, XBOX_APPID, EPIC_APPID])
        .then(game => game.gamePath);
}
function requiresLauncher(gamePath, store) {
    return __awaiter(this, void 0, void 0, function* () {
        if (store === 'xbox') {
            return Promise.resolve({
                launcher: 'xbox',
                addInfo: {
                    appId: XBOX_APPID,
                    parameters: [{ appExecName: XBOXEXECNAME }],
                },
            });
        }
        if (store === 'epic') {
            return Promise.resolve({
                launcher: 'epic',
                addInfo: {
                    appId: EPIC_APPID,
                },
            });
        }
        return Promise.resolve(undefined);
    });
}
function getExecutable(discoveredPath) {
    const steamPath = path_1.default.join('Bin', 'Win64', 'KingdomCome.exe');
    const epicPath = path_1.default.join('Bin', 'Win64MasterMasterEpicPGO', 'KingdomCome.exe');
    const xboxPath = path_1.default.join('gamelaunchhelper.exe');
    const isCorrectExec = (exec) => {
        try {
            vortex_api_1.fs.statSync(path_1.default.join(discoveredPath, exec));
            return true;
        }
        catch (err) {
            return false;
        }
    };
    if (isCorrectExec(epicPath)) {
        return epicPath;
    }
    if (isCorrectExec(xboxPath)) {
        return xboxPath;
    }
    if (isCorrectExec(steamPath)) {
        return steamPath;
    }
    return steamPath;
}
function prepareForModding(context, discovery) {
    const state = context.api.store.getState();
    const profile = vortex_api_1.selectors.activeProfile(state);
    return vortex_api_1.fs.ensureDirWritableAsync(path_1.default.join(discovery.path, 'Mods'), () => bluebird_1.default.resolve())
        .then(() => getCurrentOrder(path_1.default.join(discovery.path, modsPath(), statics_1.MODS_ORDER_FILENAME)))
        .catch(err => err.code === 'ENOENT' ? Promise.resolve([]) : Promise.reject(err))
        .then(data => setNewOrder({ context, profile }, Array.isArray(data) ? data : data.split('\n')));
}
function getCurrentOrder(modOrderFilepath) {
    return vortex_api_1.fs.readFileAsync(modOrderFilepath, { encoding: 'utf8' });
}
function walkAsync(dir) {
    let entries = [];
    return vortex_api_1.fs.readdirAsync(dir).then(files => {
        return bluebird_1.default.each(files, file => {
            const fullPath = path_1.default.join(dir, file);
            return vortex_api_1.fs.statAsync(fullPath).then(stats => {
                if (stats.isDirectory()) {
                    return walkAsync(fullPath)
                        .then(nestedFiles => {
                        entries = entries.concat(nestedFiles);
                        return Promise.resolve();
                    });
                }
                else {
                    entries.push(fullPath);
                    return Promise.resolve();
                }
            });
        });
    })
        .then(() => Promise.resolve(entries))
        .catch(err => {
        (0, vortex_api_1.log)('error', 'Unable to read mod directory', err);
        return Promise.resolve(entries);
    });
}
function readModsFolder(modsFolder, api) {
    const extL = input => path_1.default.extname(input).toLowerCase();
    const isValidMod = modFile => ['.pak', '.cfg', '.manifest'].indexOf(extL(modFile)) !== -1;
    return vortex_api_1.fs.readdirAsync(modsFolder)
        .then(entries => bluebird_1.default.reduce(entries, (accum, current) => {
        const currentPath = path_1.default.join(modsFolder, current);
        return vortex_api_1.fs.readdirAsync(currentPath)
            .then(modFiles => {
            if (modFiles.some(isValidMod) === true) {
                accum.push(current);
            }
            return Promise.resolve(accum);
        })
            .catch(err => Promise.resolve(accum));
    }, []))
        .catch(err => {
        const allowReport = ['ENOENT', 'EPERM', 'EACCESS'].indexOf(err.code) === -1;
        api.showErrorNotification('failed to read kingdom come mods directory', err.message, { allowReport });
        return Promise.resolve([]);
    });
}
function listHasMod(modId, list) {
    return (!!list)
        ? list.map(mod => (0, util_1.transformId)(mod).toLowerCase()).includes(modId.toLowerCase())
        : false;
}
function getManuallyAddedMods(disabledMods, enabledMods, modOrderFilepath, api) {
    const modsPath = path_1.default.dirname(modOrderFilepath);
    return readModsFolder(modsPath, api).then(deployedMods => getCurrentOrder(modOrderFilepath)
        .catch(err => (err.code === 'ENOENT') ? Promise.resolve('') : Promise.reject(err))
        .then(data => {
        const manuallyAdded = data.split('\n').filter(entry => !listHasMod(entry, enabledMods)
            && !listHasMod(entry, disabledMods)
            && listHasMod(entry, deployedMods));
        return Promise.resolve(manuallyAdded);
    }));
}
function refreshModList(context, discoveryPath) {
    const state = context.api.store.getState();
    const profile = vortex_api_1.selectors.activeProfile(state);
    const installationPath = vortex_api_1.selectors.installPathForGame(state, statics_1.GAME_ID);
    const mods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', statics_1.GAME_ID], []);
    const modKeys = Object.keys(mods);
    const modState = vortex_api_1.util.getSafe(profile, ['modState'], {});
    const enabled = modKeys.filter(mod => !!modState[mod] && modState[mod].enabled);
    const disabled = modKeys.filter(dis => !enabled.includes(dis));
    const extL = input => path_1.default.extname(input).toLowerCase();
    return bluebird_1.default.reduce(enabled, (accum, mod) => {
        var _a;
        if (((_a = mods[mod]) === null || _a === void 0 ? void 0 : _a.installationPath) === undefined) {
            return accum;
        }
        const modPath = path_1.default.join(installationPath, mods[mod].installationPath);
        return walkAsync(modPath)
            .then(entries => (entries.find(fileName => ['.pak', '.cfg', '.manifest'].includes(extL(fileName))) !== undefined)
            ? accum.concat(mod)
            : accum);
    }, []).then(managedMods => {
        return getManuallyAddedMods(disabled, enabled, path_1.default.join(discoveryPath, modsPath(), statics_1.MODS_ORDER_FILENAME), context.api)
            .then(manuallyAdded => {
            _MODS_STATE.enabled = [].concat(managedMods
                .map(mod => (0, util_1.transformId)(mod)), manuallyAdded);
            _MODS_STATE.disabled = disabled;
            _MODS_STATE.display = _MODS_STATE.enabled;
            return Promise.resolve();
        });
    });
}
function LoadOrderBase(props) {
    const getMod = (item) => {
        const keys = Object.keys(props.mods);
        const found = keys.find(key => (0, util_1.transformId)(key) === item);
        return found !== undefined
            ? props.mods[found]
            : { attributes: { name: item } };
    };
    class ItemRenderer extends React.Component {
        render() {
            if (props.mods === undefined) {
                return null;
            }
            const item = this.props.item;
            const mod = getMod(item);
            return React.createElement(BS.ListGroupItem, {
                style: {
                    backgroundColor: 'var(--brand-bg, black)',
                    borderBottom: '2px solid var(--border-color, white)'
                },
            }, React.createElement('div', {
                style: {
                    fontSize: '1.1em',
                },
            }, React.createElement('img', {
                src: !!mod.attributes.pictureUrl
                    ? mod.attributes.pictureUrl
                    : `${__dirname}/gameart.jpg`,
                className: 'mod-picture',
                width: '75px',
                height: '45px',
                style: {
                    margin: '5px 10px 5px 5px',
                    border: '1px solid var(--brand-secondary,#D78F46)',
                },
            }), vortex_api_1.util.renderModName(mod)));
        }
    }
    return React.createElement(vortex_api_1.MainPage, {}, React.createElement(vortex_api_1.MainPage.Body, {}, React.createElement(BS.Panel, { id: 'kcd-loadorder-panel' }, React.createElement(BS.Panel.Body, {}, React.createElement(vortex_api_1.FlexLayout, { type: 'row' }, React.createElement(vortex_api_1.FlexLayout.Flex, {}, React.createElement(vortex_api_1.DraggableList, {
        id: 'kcd-loadorder',
        itemTypeId: 'kcd-loadorder-item',
        items: _MODS_STATE.display,
        itemRenderer: ItemRenderer,
        style: {
            height: '100%',
            overflow: 'auto',
            borderWidth: 'var(--border-width, 1px)',
            borderStyle: 'solid',
            borderColor: 'var(--border-color, white)',
        },
        apply: ordered => {
            props.onSetDeploymentNecessary(statics_1.GAME_ID, true);
            return setNewOrder(props, ordered);
        },
    })), React.createElement(vortex_api_1.FlexLayout.Flex, {}, React.createElement('div', {
        style: {
            padding: 'var(--half-gutter, 15px)',
        }
    }, React.createElement('h2', {}, props.t('Changing your load order', { ns: I18N_NAMESPACE })), React.createElement('p', {}, props.t('Drag and drop the mods on the left to reorder them. Kingdom Come: Deliverance uses a mod_order.txt file '
        + 'to define the order in which mods are loaded, Vortex will write the folder names of the displayed '
        + 'mods in the order you have set. '
        + 'Mods placed at the bottom of the load order will have priority over those above them.', { ns: I18N_NAMESPACE })), React.createElement('p', {}, props.t('Note: Vortex will detect manually added mods as long as these have been added to the mod_order.txt file. '
        + 'Manually added mods are not managed by Vortex - to remove these, you will have to '
        + 'manually erase the entry from the mod_order.txt file.', { ns: I18N_NAMESPACE })))))))));
}
function modsPath() {
    return 'Mods';
}
function setNewOrder(props, ordered) {
    const { context, profile, onSetOrder } = props;
    if ((profile === null || profile === void 0 ? void 0 : profile.id) === undefined) {
        (0, vortex_api_1.log)('error', 'failed to set new load order', 'undefined profile');
        return;
    }
    const filtered = ordered.filter(entry => !!entry);
    _MODS_STATE.display = filtered;
    return (!!onSetOrder)
        ? onSetOrder(profile.id, filtered)
        : context.api.store.dispatch(vortex_api_1.actions.setLoadOrder(profile.id, filtered));
}
function writeOrderFile(filePath, modList) {
    return vortex_api_1.fs.removeAsync(filePath)
        .catch(err => err.code === 'ENOENT' ? Promise.resolve() : Promise.reject(err))
        .then(() => vortex_api_1.fs.ensureFileAsync(filePath))
        .then(() => vortex_api_1.fs.writeFileAsync(filePath, modList.join('\n'), { encoding: 'utf8' }));
}
function main(context) {
    context.registerGame({
        id: statics_1.GAME_ID,
        name: 'Kingdom Come:\tDeliverance',
        mergeMods: mod => (0, util_1.transformId)(mod.id),
        queryPath: findGame,
        queryModPath: modsPath,
        logo: 'gameart.jpg',
        executable: getExecutable,
        requiredFiles: [
            'Data/Levels/rataje/level.pak',
        ],
        setup: (discovery) => prepareForModding(context, discovery),
        requiresLauncher: requiresLauncher,
        environment: {
            SteamAPPId: STEAM_APPID,
            XboxAPPId: XBOX_APPID,
            EpicAPPId: EPIC_APPID,
        },
        details: {
            steamAppId: +STEAM_APPID,
            xboxAppId: XBOX_APPID,
            epicAppId: EPIC_APPID,
        },
    });
    context.registerMainPage('sort-none', 'Load Order', LoadOrder, {
        id: 'kcd-load-order',
        hotkey: 'E',
        group: 'per-game',
        visible: () => vortex_api_1.selectors.activeGameId(context.api.store.getState()) === statics_1.GAME_ID,
        props: () => ({
            t: context.api.translate,
        }),
    });
    context.optional.registerCollectionFeature('kcd_collection_data', (gameId, includedMods) => (0, collections_1.genCollectionsData)(context, gameId, includedMods), (gameId, collection) => (0, collections_1.parseCollectionsData)(context, gameId, collection), () => Promise.resolve(), (t) => t('Kingdom Come: Deliverance Data'), (state, gameId) => gameId === statics_1.GAME_ID, CollectionsDataView_1.default);
    context.once(() => {
        context.api.events.on('mod-enabled', (profileId, modId) => {
            const state = context.api.store.getState();
            const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', statics_1.GAME_ID], undefined);
            if ((discovery === null || discovery === void 0 ? void 0 : discovery.path) === undefined) {
                return;
            }
            const profile = vortex_api_1.util.getSafe(state, ['persistent', 'profiles', profileId], undefined);
            if (!!profile && (profile.gameId === statics_1.GAME_ID) && (_MODS_STATE.display.indexOf(modId) === -1)) {
                refreshModList(context, discovery.path);
            }
        });
        context.api.events.on('purge-mods', () => {
            const store = context.api.store;
            const state = store.getState();
            const profile = vortex_api_1.selectors.activeProfile(state);
            if (profile === undefined || profile.gameId !== statics_1.GAME_ID) {
                return;
            }
            const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', statics_1.GAME_ID], undefined);
            if ((discovery === undefined) || (discovery.path === undefined)) {
                (0, vortex_api_1.log)('error', 'kingdomcomedeliverance was not discovered');
                return;
            }
            const modsOrderFilePath = path_1.default.join(discovery.path, modsPath(), statics_1.MODS_ORDER_FILENAME);
            const managedMods = vortex_api_1.util.getSafe(state, ['persistent', 'mods', statics_1.GAME_ID], {});
            const modKeys = Object.keys(managedMods);
            const modState = vortex_api_1.util.getSafe(profile, ['modState'], {});
            const enabled = modKeys.filter(mod => !!modState[mod] && modState[mod].enabled);
            const disabled = modKeys.filter(dis => !enabled.includes(dis));
            getManuallyAddedMods(disabled, enabled, modsOrderFilePath, context.api)
                .then(manuallyAdded => {
                writeOrderFile(modsOrderFilePath, manuallyAdded)
                    .then(() => setNewOrder({ context, profile }, manuallyAdded))
                    .catch(err => {
                    const allowReport = !(err instanceof vortex_api_1.util.UserCanceled)
                        && (err['code'] !== 'EPERM');
                    context.api.showErrorNotification('Failed to write to load order file', err, { allowReport });
                });
            })
                .catch(err => {
                const userCanceled = (err instanceof vortex_api_1.util.UserCanceled);
                context.api.showErrorNotification('Failed to re-instate manually added mods', err, { allowReport: !userCanceled });
            });
        });
        context.api.onAsync('did-deploy', (profileId, deployment) => {
            var _a, _b;
            const state = context.api.getState();
            const profile = vortex_api_1.selectors.profileById(state, profileId);
            if (profile === undefined || profile.gameId !== statics_1.GAME_ID) {
                if (profile === undefined) {
                    (0, vortex_api_1.log)('error', 'profile does not exist', profileId);
                }
                return Promise.resolve();
            }
            const loadOrder = (_b = (_a = state.persistent['loadOrder']) === null || _a === void 0 ? void 0 : _a[profileId]) !== null && _b !== void 0 ? _b : [];
            const discovery = vortex_api_1.util.getSafe(state, ['settings', 'gameMode', 'discovered', profile.gameId], undefined);
            if ((discovery === undefined) || (discovery.path === undefined)) {
                (0, vortex_api_1.log)('error', 'kingdomcomedeliverance was not discovered');
                return Promise.resolve();
            }
            const modsFolder = path_1.default.join(discovery.path, modsPath());
            const modOrderFile = path_1.default.join(modsFolder, statics_1.MODS_ORDER_FILENAME);
            return refreshModList(context, discovery.path)
                .then(() => {
                let missing = loadOrder
                    .filter(mod => !listHasMod((0, util_1.transformId)(mod), _MODS_STATE.enabled)
                    && !listHasMod((0, util_1.transformId)(mod), _MODS_STATE.disabled)
                    && listHasMod((0, util_1.transformId)(mod), _MODS_STATE.display))
                    .map(mod => (0, util_1.transformId)(mod)) || [];
                missing = [...new Set(missing)];
                const transformed = [..._MODS_STATE.enabled, ...missing];
                const loValue = (input) => {
                    const idx = loadOrder.indexOf(input);
                    return idx !== -1 ? idx : loadOrder.length;
                };
                const sorted = transformed.length > 1
                    ? transformed.sort((lhs, rhs) => loValue(lhs) - loValue(rhs))
                    : transformed;
                setNewOrder({ context, profile }, sorted);
                return writeOrderFile(modOrderFile, transformed)
                    .catch(err => {
                    const userCanceled = (err instanceof vortex_api_1.util.UserCanceled);
                    context.api.showErrorNotification('Failed to write to load order file', err, { allowReport: !userCanceled });
                });
            });
        });
    });
    return true;
}
function mapStateToProps(state) {
    const profile = vortex_api_1.selectors.activeProfile(state);
    const profileId = (profile === null || profile === void 0 ? void 0 : profile.id) || '';
    const gameId = (profile === null || profile === void 0 ? void 0 : profile.gameId) || '';
    return {
        profile,
        modState: vortex_api_1.util.getSafe(profile, ['modState'], {}),
        mods: vortex_api_1.util.getSafe(state, ['persistent', 'mods', gameId], []),
        order: vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profileId], []),
    };
}
function mapDispatchToProps(dispatch) {
    return {
        onSetDeploymentNecessary: (gameId, necessary) => dispatch(vortex_api_1.actions.setDeploymentNecessary(gameId, necessary)),
        onSetOrder: (profileId, ordered) => dispatch(vortex_api_1.actions.setLoadOrder(profileId, ordered)),
    };
}
const LoadOrder = (0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(LoadOrderBase);
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLDZDQUErQjtBQUMvQixvREFBc0M7QUFDdEMsNkNBQXNDO0FBQ3RDLGdEQUF3QjtBQUN4QiwyQ0FBMkc7QUFHM0csMkRBQXFGO0FBQ3JGLDRGQUFvRTtBQUNwRSx1Q0FBeUQ7QUFDekQsaUNBQXFDO0FBRXJDLE1BQU0sY0FBYyxHQUFHLFFBQVEsaUJBQU8sRUFBRSxDQUFDO0FBRXpDLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQztBQUM3QixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUM7QUFDekIsTUFBTSxVQUFVLEdBQUcsbUNBQW1DLENBQUM7QUFDdkQsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDO0FBRTNCLE1BQU0sV0FBVyxHQUFHO0lBQ2xCLE9BQU8sRUFBRSxFQUFFO0lBQ1gsUUFBUSxFQUFFLEVBQUU7SUFDWixPQUFPLEVBQUUsRUFBRTtDQUNaLENBQUE7QUFFRCxTQUFTLFFBQVE7SUFDZixPQUFPLGlCQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDM0UsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pDLENBQUM7QUFFRCxTQUFlLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxLQUFLOztRQUM3QyxJQUFJLEtBQUssS0FBSyxNQUFNLEVBQUU7WUFDcEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO2dCQUNyQixRQUFRLEVBQUUsTUFBTTtnQkFDaEIsT0FBTyxFQUFFO29CQUNQLEtBQUssRUFBRSxVQUFVO29CQUNqQixVQUFVLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsQ0FBQztp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RSxDQUFDLFFBQVEsQ0FBQyxvQkFBTyxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztRQUM1RyxVQUFVLEVBQUUsQ0FBQyxTQUFTLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQyxRQUFRLENBQUMsb0JBQU8sQ0FBQyxZQUFZLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3ZGLENBQUM7QUFDSixDQUFDO0FBRUQsTUFBTSxTQUFTLEdBQUcsSUFBQSxxQkFBTyxFQUFDLGVBQWUsRUFBRSxrQkFBa0IsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBRTlFLE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQmx1ZWJpcmQgZnJvbSAnYmx1ZWJpcmQnO1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0ICogYXMgQlMgZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBEcmFnZ2FibGVMaXN0LCBGbGV4TGF5b3V0LCB0eXBlcywgbG9nLCBNYWluUGFnZSwgc2VsZWN0b3JzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IElLQ0RDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL3R5cGVzJztcbmltcG9ydCB7IGdlbkNvbGxlY3Rpb25zRGF0YSwgcGFyc2VDb2xsZWN0aW9uc0RhdGEgfSBmcm9tICcuL2NvbGxlY3Rpb25zL2NvbGxlY3Rpb25zJztcbmltcG9ydCBDb2xsZWN0aW9uc0RhdGFWaWV3IGZyb20gJy4vY29sbGVjdGlvbnMvQ29sbGVjdGlvbnNEYXRhVmlldyc7XG5pbXBvcnQgeyBHQU1FX0lELCBNT0RTX09SREVSX0ZJTEVOQU1FIH0gZnJvbSAnLi9zdGF0aWNzJztcbmltcG9ydCB7IHRyYW5zZm9ybUlkIH0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgSTE4Tl9OQU1FU1BBQ0UgPSBgZ2FtZS0ke0dBTUVfSUR9YDtcblxuY29uc3QgU1RFQU1fQVBQSUQgPSAnMzc5NDMwJztcbmNvbnN0IEVQSUNfQVBQSUQgPSAnRWVsJztcbmNvbnN0IFhCT1hfQVBQSUQgPSAnRGVlcFNpbHZlci5LaW5nZG9tQ29tZURlbGl2ZXJhbmNlJztcbmNvbnN0IFhCT1hFWEVDTkFNRSA9ICdBcHAnO1xuXG5jb25zdCBfTU9EU19TVEFURSA9IHtcbiAgZW5hYmxlZDogW10sXG4gIGRpc2FibGVkOiBbXSxcbiAgZGlzcGxheTogW10sXG59XG5cbmZ1bmN0aW9uIGZpbmRHYW1lKCkge1xuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW1NURUFNX0FQUElELCBYQk9YX0FQUElELCBFUElDX0FQUElEXSlcbiAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZXF1aXJlc0xhdW5jaGVyKGdhbWVQYXRoLCBzdG9yZSkge1xuICBpZiAoc3RvcmUgPT09ICd4Ym94Jykge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgbGF1bmNoZXI6ICd4Ym94JyxcbiAgICAgIGFkZEluZm86IHtcbiAgICAgICAgYXBwSWQ6IFhCT1hfQVBQSUQsXG4gICAgICAgIHBhcmFtZXRlcnM6IFt7IGFwcEV4ZWNOYW1lOiBYQk9YRVhFQ05BTUUgfV0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG4gIGlmIChzdG9yZSA9PT0gJ2VwaWMnKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgICBsYXVuY2hlcjogJ2VwaWMnLFxuICAgICAgYWRkSW5mbzoge1xuICAgICAgICBhcHBJZDogRVBJQ19BUFBJRCxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xufVxuXG5mdW5jdGlvbiBnZXRFeGVjdXRhYmxlKGRpc2NvdmVyZWRQYXRoKSB7XG4gIGNvbnN0IHN0ZWFtUGF0aCA9IHBhdGguam9pbignQmluJywgJ1dpbjY0JywgJ0tpbmdkb21Db21lLmV4ZScpO1xuICBjb25zdCBlcGljUGF0aCA9IHBhdGguam9pbignQmluJywgJ1dpbjY0TWFzdGVyTWFzdGVyRXBpY1BHTycsICdLaW5nZG9tQ29tZS5leGUnKTtcbiAgY29uc3QgeGJveFBhdGggPSBwYXRoLmpvaW4oJ2dhbWVsYXVuY2hoZWxwZXIuZXhlJyk7XG4gIGNvbnN0IGlzQ29ycmVjdEV4ZWMgPSAoZXhlYykgPT4ge1xuICAgIHRyeSB7XG4gICAgICBmcy5zdGF0U3luYyhwYXRoLmpvaW4oZGlzY292ZXJlZFBhdGgsIGV4ZWMpKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9O1xuICBpZiAoaXNDb3JyZWN0RXhlYyhlcGljUGF0aCkpIHtcbiAgICByZXR1cm4gZXBpY1BhdGg7XG4gIH1cbiAgaWYgKGlzQ29ycmVjdEV4ZWMoeGJveFBhdGgpKSB7XG4gICAgcmV0dXJuIHhib3hQYXRoO1xuICB9XG4gIGlmIChpc0NvcnJlY3RFeGVjKHN0ZWFtUGF0aCkpIHtcbiAgICByZXR1cm4gc3RlYW1QYXRoO1xuICB9XG4gIHJldHVybiBzdGVhbVBhdGg7XG59XG5cblxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5KSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgcmV0dXJuIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKCkpXG4gICAgLnRoZW4oKCkgPT4gZ2V0Q3VycmVudE9yZGVyKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgbW9kc1BhdGgoKSwgTU9EU19PUkRFUl9GSUxFTkFNRSkpKVxuICAgIC5jYXRjaChlcnIgPT4gZXJyLmNvZGUgPT09ICdFTk9FTlQnID8gUHJvbWlzZS5yZXNvbHZlKFtdKSA6IFByb21pc2UucmVqZWN0KGVycikpXG4gICAgLnRoZW4oZGF0YSA9PiBzZXROZXdPcmRlcih7IGNvbnRleHQsIHByb2ZpbGUgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEFycmF5LmlzQXJyYXkoZGF0YSkgPyBkYXRhIDogZGF0YS5zcGxpdCgnXFxuJykpKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q3VycmVudE9yZGVyKG1vZE9yZGVyRmlsZXBhdGgpIHtcbiAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMobW9kT3JkZXJGaWxlcGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xufVxuXG5mdW5jdGlvbiB3YWxrQXN5bmMoZGlyKSB7XG4gIGxldCBlbnRyaWVzID0gW107XG4gIHJldHVybiBmcy5yZWFkZGlyQXN5bmMoZGlyKS50aGVuKGZpbGVzID0+IHtcbiAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChmaWxlcywgZmlsZSA9PiB7XG4gICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXIsIGZpbGUpO1xuICAgICAgcmV0dXJuIGZzLnN0YXRBc3luYyhmdWxsUGF0aCkudGhlbihzdGF0cyA9PiB7XG4gICAgICAgIGlmIChzdGF0cy5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgcmV0dXJuIHdhbGtBc3luYyhmdWxsUGF0aClcbiAgICAgICAgICAgIC50aGVuKG5lc3RlZEZpbGVzID0+IHtcbiAgICAgICAgICAgICAgZW50cmllcyA9IGVudHJpZXMuY29uY2F0KG5lc3RlZEZpbGVzKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnRyaWVzLnB1c2goZnVsbFBhdGgpO1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pXG4gICAgLnRoZW4oKCkgPT4gUHJvbWlzZS5yZXNvbHZlKGVudHJpZXMpKVxuICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgbG9nKCdlcnJvcicsICdVbmFibGUgdG8gcmVhZCBtb2QgZGlyZWN0b3J5JywgZXJyKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZW50cmllcyk7XG4gICAgfSk7XG59XG5cblxuZnVuY3Rpb24gcmVhZE1vZHNGb2xkZXIobW9kc0ZvbGRlciwgYXBpKSB7XG4gIGNvbnN0IGV4dEwgPSBpbnB1dCA9PiBwYXRoLmV4dG5hbWUoaW5wdXQpLnRvTG93ZXJDYXNlKCk7XG4gIGNvbnN0IGlzVmFsaWRNb2QgPSBtb2RGaWxlID0+IFsnLnBhaycsICcuY2ZnJywgJy5tYW5pZmVzdCddLmluZGV4T2YoZXh0TChtb2RGaWxlKSkgIT09IC0xO1xuXG4gIC8vIFJlYWRzIHRoZSBwcm92aWRlZCBmb2xkZXJQYXRoIGFuZCBhdHRlbXB0cyB0byBpZGVudGlmeSBhbGxcbiAgLy8gIGN1cnJlbnRseSBkZXBsb3llZCBtb2RzLlxuICByZXR1cm4gZnMucmVhZGRpckFzeW5jKG1vZHNGb2xkZXIpXG4gICAgLnRoZW4oZW50cmllcyA9PiBCbHVlYmlyZC5yZWR1Y2UoZW50cmllcywgKGFjY3VtLCBjdXJyZW50KSA9PiB7XG4gICAgICBjb25zdCBjdXJyZW50UGF0aCA9IHBhdGguam9pbihtb2RzRm9sZGVyLCBjdXJyZW50KTtcbiAgICAgIHJldHVybiBmcy5yZWFkZGlyQXN5bmMoY3VycmVudFBhdGgpXG4gICAgICAgIC50aGVuKG1vZEZpbGVzID0+IHtcbiAgICAgICAgICBpZiAobW9kRmlsZXMuc29tZShpc1ZhbGlkTW9kKSA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgYWNjdW0ucHVzaChjdXJyZW50KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhY2N1bSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5jYXRjaChlcnIgPT4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKSlcbiAgICB9LCBbXSkpXG4gICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICBjb25zdCBhbGxvd1JlcG9ydCA9IFsnRU5PRU5UJywgJ0VQRVJNJywgJ0VBQ0NFU1MnXS5pbmRleE9mKGVyci5jb2RlKSA9PT0gLTE7XG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdmYWlsZWQgdG8gcmVhZCBraW5nZG9tIGNvbWUgbW9kcyBkaXJlY3RvcnknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnIubWVzc2FnZSwgeyBhbGxvd1JlcG9ydCB9KTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoW10pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBsaXN0SGFzTW9kKG1vZElkLCBsaXN0KSB7XG4gIHJldHVybiAoISFsaXN0KVxuICAgID8gbGlzdC5tYXAobW9kID0+XG4gICAgICB0cmFuc2Zvcm1JZChtb2QpLnRvTG93ZXJDYXNlKCkpLmluY2x1ZGVzKG1vZElkLnRvTG93ZXJDYXNlKCkpXG4gICAgOiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gZ2V0TWFudWFsbHlBZGRlZE1vZHMoZGlzYWJsZWRNb2RzLCBlbmFibGVkTW9kcywgbW9kT3JkZXJGaWxlcGF0aCwgYXBpKSB7XG4gIGNvbnN0IG1vZHNQYXRoID0gcGF0aC5kaXJuYW1lKG1vZE9yZGVyRmlsZXBhdGgpO1xuXG4gIHJldHVybiByZWFkTW9kc0ZvbGRlcihtb2RzUGF0aCwgYXBpKS50aGVuKGRlcGxveWVkTW9kcyA9PlxuICAgIGdldEN1cnJlbnRPcmRlcihtb2RPcmRlckZpbGVwYXRoKVxuICAgICAgLmNhdGNoKGVyciA9PiAoZXJyLmNvZGUgPT09ICdFTk9FTlQnKSA/IFByb21pc2UucmVzb2x2ZSgnJykgOiBQcm9taXNlLnJlamVjdChlcnIpKVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIC8vIDEuIENvbmZpcm1lZCB0byBleGlzdCAoZGVwbG95ZWQpIGluc2lkZSB0aGUgbW9kcyBkaXJlY3RvcnkuXG4gICAgICAgIC8vIDIuIElzIG5vdCBwYXJ0IG9mIGFueSBvZiB0aGUgbW9kIGxpc3RzIHdoaWNoIFZvcnRleCBtYW5hZ2VzLlxuICAgICAgICBjb25zdCBtYW51YWxseUFkZGVkID0gZGF0YS5zcGxpdCgnXFxuJykuZmlsdGVyKGVudHJ5ID0+XG4gICAgICAgICAgIWxpc3RIYXNNb2QoZW50cnksIGVuYWJsZWRNb2RzKVxuICAgICAgICAgICYmICFsaXN0SGFzTW9kKGVudHJ5LCBkaXNhYmxlZE1vZHMpXG4gICAgICAgICAgJiYgbGlzdEhhc01vZChlbnRyeSwgZGVwbG95ZWRNb2RzKSk7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtYW51YWxseUFkZGVkKTtcbiAgICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gcmVmcmVzaE1vZExpc3QoY29udGV4dCwgZGlzY292ZXJ5UGF0aCkge1xuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gIGNvbnN0IGluc3RhbGxhdGlvblBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwgW10pO1xuICBjb25zdCBtb2RLZXlzID0gT2JqZWN0LmtleXMobW9kcyk7XG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xuICBjb25zdCBlbmFibGVkID0gbW9kS2V5cy5maWx0ZXIobW9kID0+ICEhbW9kU3RhdGVbbW9kXSAmJiBtb2RTdGF0ZVttb2RdLmVuYWJsZWQpO1xuICBjb25zdCBkaXNhYmxlZCA9IG1vZEtleXMuZmlsdGVyKGRpcyA9PiAhZW5hYmxlZC5pbmNsdWRlcyhkaXMpKTtcblxuICBjb25zdCBleHRMID0gaW5wdXQgPT4gcGF0aC5leHRuYW1lKGlucHV0KS50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKGVuYWJsZWQsIChhY2N1bSwgbW9kKSA9PiB7XG4gICAgaWYgKG1vZHNbbW9kXT8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfVxuICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbGF0aW9uUGF0aCwgbW9kc1ttb2RdLmluc3RhbGxhdGlvblBhdGgpO1xuICAgIHJldHVybiB3YWxrQXN5bmMobW9kUGF0aClcbiAgICAgIC50aGVuKGVudHJpZXMgPT4gKGVudHJpZXMuZmluZChmaWxlTmFtZSA9PiBbJy5wYWsnLCAnLmNmZycsICcubWFuaWZlc3QnXS5pbmNsdWRlcyhleHRMKGZpbGVOYW1lKSkpICE9PSB1bmRlZmluZWQpXG4gICAgICAgID8gYWNjdW0uY29uY2F0KG1vZClcbiAgICAgICAgOiBhY2N1bSk7XG4gIH0sIFtdKS50aGVuKG1hbmFnZWRNb2RzID0+IHtcbiAgICByZXR1cm4gZ2V0TWFudWFsbHlBZGRlZE1vZHMoZGlzYWJsZWQsIGVuYWJsZWQsIHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCBtb2RzUGF0aCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1PRFNfT1JERVJfRklMRU5BTUUpLCBjb250ZXh0LmFwaSlcbiAgICAgIC50aGVuKG1hbnVhbGx5QWRkZWQgPT4ge1xuICAgICAgICBfTU9EU19TVEFURS5lbmFibGVkID0gW10uY29uY2F0KG1hbmFnZWRNb2RzXG4gICAgICAgICAgLm1hcChtb2QgPT4gdHJhbnNmb3JtSWQobW9kKSksIG1hbnVhbGx5QWRkZWQpO1xuICAgICAgICBfTU9EU19TVEFURS5kaXNhYmxlZCA9IGRpc2FibGVkO1xuICAgICAgICBfTU9EU19TVEFURS5kaXNwbGF5ID0gX01PRFNfU1RBVEUuZW5hYmxlZDtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfSlcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIExvYWRPcmRlckJhc2UocHJvcHMpIHtcbiAgY29uc3QgZ2V0TW9kID0gKGl0ZW0pID0+IHtcbiAgICBjb25zdCBrZXlzID0gT2JqZWN0LmtleXMocHJvcHMubW9kcyk7XG4gICAgY29uc3QgZm91bmQgPSBrZXlzLmZpbmQoa2V5ID0+IHRyYW5zZm9ybUlkKGtleSkgPT09IGl0ZW0pO1xuICAgIHJldHVybiBmb3VuZCAhPT0gdW5kZWZpbmVkXG4gICAgICA/IHByb3BzLm1vZHNbZm91bmRdXG4gICAgICA6IHsgYXR0cmlidXRlczogeyBuYW1lOiBpdGVtIH0gfTtcbiAgfTtcblxuICBjbGFzcyBJdGVtUmVuZGVyZXIgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuICAgIHJlbmRlcigpIHtcbiAgICAgIGlmIChwcm9wcy5tb2RzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGl0ZW0gPSAodGhpcy5wcm9wcyBhcyBhbnkpLml0ZW07XG4gICAgICBjb25zdCBtb2QgPSBnZXRNb2QoaXRlbSk7XG5cbiAgICAgIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KEJTLkxpc3RHcm91cEl0ZW0sIHtcbiAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICBiYWNrZ3JvdW5kQ29sb3I6ICd2YXIoLS1icmFuZC1iZywgYmxhY2spJyxcbiAgICAgICAgICBib3JkZXJCb3R0b206ICcycHggc29saWQgdmFyKC0tYm9yZGVyLWNvbG9yLCB3aGl0ZSknXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvbnRTaXplOiAnMS4xZW0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaW1nJywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNyYzogISFtb2QuYXR0cmlidXRlcy5waWN0dXJlVXJsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IG1vZC5hdHRyaWJ1dGVzLnBpY3R1cmVVcmxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogYCR7X19kaXJuYW1lfS9nYW1lYXJ0LmpwZ2AsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lOiAnbW9kLXBpY3R1cmUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZHRoOic3NXB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6JzQ1cHgnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXJnaW46ICc1cHggMTBweCA1cHggNXB4JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlcjogJzFweCBzb2xpZCB2YXIoLS1icmFuZC1zZWNvbmRhcnksI0Q3OEY0NiknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1dGlsLnJlbmRlck1vZE5hbWUobW9kKSkpXG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoTWFpblBhZ2UsIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KE1haW5QYWdlLkJvZHksIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuUGFuZWwsIHsgaWQ6ICdrY2QtbG9hZG9yZGVyLXBhbmVsJyB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCUy5QYW5lbC5Cb2R5LCB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LCB7IHR5cGU6ICdyb3cnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChEcmFnZ2FibGVMaXN0LCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAna2NkLWxvYWRvcmRlcicsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW1UeXBlSWQ6ICdrY2QtbG9hZG9yZGVyLWl0ZW0nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpdGVtczogX01PRFNfU1RBVEUuZGlzcGxheSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXRlbVJlbmRlcmVyOiBJdGVtUmVuZGVyZXIgYXMgYW55LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogJzEwMCUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG92ZXJmbG93OiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYm9yZGVyV2lkdGg6ICd2YXIoLS1ib3JkZXItd2lkdGgsIDFweCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlclN0eWxlOiAnc29saWQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiAndmFyKC0tYm9yZGVyLWNvbG9yLCB3aGl0ZSknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhcHBseTogb3JkZXJlZCA9PiB7XG4gICAgICAgICAgICAgICAgICAvLyBXZSBvbmx5IHdyaXRlIHRvIHRoZSBtb2Rfb3JkZXIgZmlsZSB3aGVuIHdlIGRlcGxveSB0byBhdm9pZCAodW5saWtlbHkpIHNpdHVhdGlvbnNcbiAgICAgICAgICAgICAgICAgIC8vICB3aGVyZSBhIGZpbGUgZGVzY3JpcHRvciByZW1haW5zIG9wZW4sIGJsb2NraW5nIGZpbGUgb3BlcmF0aW9ucyB3aGVuIHRoZSB1c2VyXG4gICAgICAgICAgICAgICAgICAvLyAgY2hhbmdlcyB0aGUgbG9hZCBvcmRlciB2ZXJ5IHF1aWNrbHkuIFRoaXMgaXMgYWxsIHRoZW9yZXRpY2FsIGF0IHRoaXMgcG9pbnQuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcHMub25TZXREZXBsb3ltZW50TmVjZXNzYXJ5KEdBTUVfSUQsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzZXROZXdPcmRlcihwcm9wcywgb3JkZXJlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LkZsZXgsIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhZGRpbmc6ICd2YXIoLS1oYWxmLWd1dHRlciwgMTVweCknLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdoMicsIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzLnQoJ0NoYW5naW5nIHlvdXIgbG9hZCBvcmRlcicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BzLnQoJ0RyYWcgYW5kIGRyb3AgdGhlIG1vZHMgb24gdGhlIGxlZnQgdG8gcmVvcmRlciB0aGVtLiBLaW5nZG9tIENvbWU6IERlbGl2ZXJhbmNlIHVzZXMgYSBtb2Rfb3JkZXIudHh0IGZpbGUgJ1xuICAgICAgICAgICAgICAgICAgICAgICsgJ3RvIGRlZmluZSB0aGUgb3JkZXIgaW4gd2hpY2ggbW9kcyBhcmUgbG9hZGVkLCBWb3J0ZXggd2lsbCB3cml0ZSB0aGUgZm9sZGVyIG5hbWVzIG9mIHRoZSBkaXNwbGF5ZWQgJ1xuICAgICAgICAgICAgICAgICAgICAgICsgJ21vZHMgaW4gdGhlIG9yZGVyIHlvdSBoYXZlIHNldC4gJ1xuICAgICAgICAgICAgICAgICAgICAgICsgJ01vZHMgcGxhY2VkIGF0IHRoZSBib3R0b20gb2YgdGhlIGxvYWQgb3JkZXIgd2lsbCBoYXZlIHByaW9yaXR5IG92ZXIgdGhvc2UgYWJvdmUgdGhlbS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoJ3AnLCB7fSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wcy50KCdOb3RlOiBWb3J0ZXggd2lsbCBkZXRlY3QgbWFudWFsbHkgYWRkZWQgbW9kcyBhcyBsb25nIGFzIHRoZXNlIGhhdmUgYmVlbiBhZGRlZCB0byB0aGUgbW9kX29yZGVyLnR4dCBmaWxlLiAnXG4gICAgICAgICAgICAgICAgICAgICAgICArICdNYW51YWxseSBhZGRlZCBtb2RzIGFyZSBub3QgbWFuYWdlZCBieSBWb3J0ZXggLSB0byByZW1vdmUgdGhlc2UsIHlvdSB3aWxsIGhhdmUgdG8gJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKyAnbWFudWFsbHkgZXJhc2UgdGhlIGVudHJ5IGZyb20gdGhlIG1vZF9vcmRlci50eHQgZmlsZS4nLCB7IG5zOiBJMThOX05BTUVTUEFDRSB9KSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICApKSkpKTtcbn1cblxuZnVuY3Rpb24gbW9kc1BhdGgoKSB7XG4gIHJldHVybiAnTW9kcyc7XG59XG5cbmZ1bmN0aW9uIHNldE5ld09yZGVyKHByb3BzLCBvcmRlcmVkKSB7XG4gIGNvbnN0IHsgY29udGV4dCwgcHJvZmlsZSwgb25TZXRPcmRlciB9ID0gcHJvcHM7XG4gIGlmIChwcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gTm90IHN1cmUgaG93IHdlIGdvdCBoZXJlIHdpdGhvdXQgYSB2YWxpZCBwcm9maWxlLlxuICAgIC8vICBwb3NzaWJseSB0aGUgdXNlciBjaGFuZ2VkIHByb2ZpbGUgZHVyaW5nIHRoZSBzZXR1cC9wcmVwYXJhdGlvblxuICAgIC8vICBzdGFnZSA/IGh0dHBzOi8vZ2l0aHViLmNvbS9OZXh1cy1Nb2RzL1ZvcnRleC9pc3N1ZXMvNzA1M1xuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHNldCBuZXcgbG9hZCBvcmRlcicsICd1bmRlZmluZWQgcHJvZmlsZScpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFdlIGZpbHRlciB0aGUgb3JkZXJlZCBsaXN0IGp1c3QgaW4gY2FzZSB0aGVyZSdzIGFuIGVtcHR5XG4gIC8vICBlbnRyeSwgd2hpY2ggaXMgcG9zc2libGUgaWYgdGhlIHVzZXJzIGhhZCBtYW51YWxseSBhZGRlZFxuICAvLyAgZW1wdHkgbGluZXMgaW4gdGhlIGxvYWQgb3JkZXIgZmlsZS5cbiAgY29uc3QgZmlsdGVyZWQgPSBvcmRlcmVkLmZpbHRlcihlbnRyeSA9PiAhIWVudHJ5KTtcbiAgX01PRFNfU1RBVEUuZGlzcGxheSA9IGZpbHRlcmVkO1xuXG4gIHJldHVybiAoISFvblNldE9yZGVyKVxuICAgID8gb25TZXRPcmRlcihwcm9maWxlLmlkLCBmaWx0ZXJlZClcbiAgICA6IGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGUuaWQsIGZpbHRlcmVkKSk7XG59XG5cbmZ1bmN0aW9uIHdyaXRlT3JkZXJGaWxlKGZpbGVQYXRoLCBtb2RMaXN0KSB7XG4gIHJldHVybiBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcbiAgICAuY2F0Y2goZXJyID0+IGVyci5jb2RlID09PSAnRU5PRU5UJyA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcbiAgICAudGhlbigoKSA9PiBmcy5lbnN1cmVGaWxlQXN5bmMoZmlsZVBhdGgpKVxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCBtb2RMaXN0LmpvaW4oJ1xcbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSkpO1xufVxuXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcbiAgICBpZDogR0FNRV9JRCxcbiAgICBuYW1lOiAnS2luZ2RvbSBDb21lOlxcdERlbGl2ZXJhbmNlJyxcbiAgICBtZXJnZU1vZHM6IG1vZCA9PiB0cmFuc2Zvcm1JZChtb2QuaWQpLFxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RzUGF0aCxcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxuICAgIGV4ZWN1dGFibGU6IGdldEV4ZWN1dGFibGUsXG4gICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgJ0RhdGEvTGV2ZWxzL3JhdGFqZS9sZXZlbC5wYWsnLFxuICAgIF0sXG4gICAgc2V0dXA6IChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSksXG4gICAgLy9yZXF1aXJlc0NsZWFudXA6IHRydWUsIC8vIFRoZW9yZXRpY2FsbHkgbm90IG5lZWRlZCwgYXMgd2UgbG9vayBmb3Igc2V2ZXJhbCBmaWxlIGV4dGVuc2lvbnMgd2hlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgY2hlY2tpbmcgd2hldGhlciBhIG1vZCBpcyB2YWxpZCBvciBub3QuIFRoaXMgbWF5IGNoYW5nZS5cbiAgICByZXF1aXJlc0xhdW5jaGVyOiByZXF1aXJlc0xhdW5jaGVyIGFzIGFueSxcbiAgICBlbnZpcm9ubWVudDoge1xuICAgICAgU3RlYW1BUFBJZDogU1RFQU1fQVBQSUQsXG4gICAgICBYYm94QVBQSWQ6IFhCT1hfQVBQSUQsXG4gICAgICBFcGljQVBQSWQ6IEVQSUNfQVBQSUQsXG4gICAgfSxcbiAgICBkZXRhaWxzOiB7XG4gICAgICBzdGVhbUFwcElkOiArU1RFQU1fQVBQSUQsXG4gICAgICB4Ym94QXBwSWQ6IFhCT1hfQVBQSUQsXG4gICAgICBlcGljQXBwSWQ6IEVQSUNfQVBQSUQsXG4gICAgfSxcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlck1haW5QYWdlKCdzb3J0LW5vbmUnLCAnTG9hZCBPcmRlcicsIExvYWRPcmRlciwge1xuICAgIGlkOiAna2NkLWxvYWQtb3JkZXInLFxuICAgIGhvdGtleTogJ0UnLFxuICAgIGdyb3VwOiAncGVyLWdhbWUnLFxuICAgIHZpc2libGU6ICgpID0+IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKSkgPT09IEdBTUVfSUQsXG4gICAgcHJvcHM6ICgpID0+ICh7XG4gICAgICB0OiBjb250ZXh0LmFwaS50cmFuc2xhdGUsXG4gICAgfSksXG4gIH0pO1xuXG4gIGNvbnRleHQub3B0aW9uYWwucmVnaXN0ZXJDb2xsZWN0aW9uRmVhdHVyZShcbiAgICAna2NkX2NvbGxlY3Rpb25fZGF0YScsXG4gICAgKGdhbWVJZDogc3RyaW5nLCBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdKSA9PlxuICAgICAgZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgaW5jbHVkZWRNb2RzKSxcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGNvbGxlY3Rpb246IElLQ0RDb2xsZWN0aW9uc0RhdGEpID0+XG4gICAgICBwYXJzZUNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGNvbGxlY3Rpb24pLFxuICAgICgpID0+IFByb21pc2UucmVzb2x2ZSgpLFxuICAgICh0KSA9PiB0KCdLaW5nZG9tIENvbWU6IERlbGl2ZXJhbmNlIERhdGEnKSxcbiAgICAoc3RhdGU6IHR5cGVzLklTdGF0ZSwgZ2FtZUlkOiBzdHJpbmcpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3LFxuICApO1xuXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdtb2QtZW5hYmxlZCcsIChwcm9maWxlSWQsIG1vZElkKSA9PiB7XG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xuICAgICAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcHJvZmlsZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJywgcHJvZmlsZUlkXSwgdW5kZWZpbmVkKTtcbiAgICAgIGlmICghIXByb2ZpbGUgJiYgKHByb2ZpbGUuZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoX01PRFNfU1RBVEUuZGlzcGxheS5pbmRleE9mKG1vZElkKSA9PT0gLTEpKSB7XG4gICAgICAgIHJlZnJlc2hNb2RMaXN0KGNvbnRleHQsIGRpc2NvdmVyeS5wYXRoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbigncHVyZ2UtbW9kcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHN0b3JlID0gY29udGV4dC5hcGkuc3RvcmU7XG4gICAgICBjb25zdCBzdGF0ZSA9IHN0b3JlLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICAgICAgaWYgKHByb2ZpbGUgPT09IHVuZGVmaW5lZCB8fCBwcm9maWxlLmdhbWVJZCAhPT0gR0FNRV9JRCl7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgICAgIGlmICgoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHx8IChkaXNjb3ZlcnkucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAvLyBzaG91bGQgbmV2ZXIgaGFwcGVuIGFuZCBpZiBpdCBkb2VzIGl0IHdpbGwgY2F1c2UgZXJyb3JzIGVsc2V3aGVyZSBhcyB3ZWxsXG4gICAgICAgIGxvZygnZXJyb3InLCAna2luZ2RvbWNvbWVkZWxpdmVyYW5jZSB3YXMgbm90IGRpc2NvdmVyZWQnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtb2RzT3JkZXJGaWxlUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgbW9kc1BhdGgoKSwgTU9EU19PUkRFUl9GSUxFTkFNRSk7XG4gICAgICBjb25zdCBtYW5hZ2VkTW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICAgICAgY29uc3QgbW9kS2V5cyA9IE9iamVjdC5rZXlzKG1hbmFnZWRNb2RzKTtcbiAgICAgIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xuICAgICAgY29uc3QgZW5hYmxlZCA9IG1vZEtleXMuZmlsdGVyKG1vZCA9PiAhIW1vZFN0YXRlW21vZF0gJiYgbW9kU3RhdGVbbW9kXS5lbmFibGVkKTtcbiAgICAgIGNvbnN0IGRpc2FibGVkID0gbW9kS2V5cy5maWx0ZXIoZGlzID0+ICFlbmFibGVkLmluY2x1ZGVzKGRpcykpO1xuICAgICAgZ2V0TWFudWFsbHlBZGRlZE1vZHMoZGlzYWJsZWQsIGVuYWJsZWQsIG1vZHNPcmRlckZpbGVQYXRoLCBjb250ZXh0LmFwaSlcbiAgICAgICAgLnRoZW4obWFudWFsbHlBZGRlZCA9PiB7XG4gICAgICAgICAgd3JpdGVPcmRlckZpbGUobW9kc09yZGVyRmlsZVBhdGgsIG1hbnVhbGx5QWRkZWQpXG4gICAgICAgICAgICAudGhlbigoKSA9PiBzZXROZXdPcmRlcih7IGNvbnRleHQsIHByb2ZpbGUgfSwgbWFudWFsbHlBZGRlZCkpXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgYWxsb3dSZXBvcnQgPSAhKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAoZXJyWydjb2RlJ10gIT09ICdFUEVSTScpO1xuICAgICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSB0byBsb2FkIG9yZGVyIGZpbGUnLCBlcnIsIHsgYWxsb3dSZXBvcnQgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgY29uc3QgdXNlckNhbmNlbGVkID0gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKTtcbiAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZS1pbnN0YXRlIG1hbnVhbGx5IGFkZGVkIG1vZHMnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6ICF1c2VyQ2FuY2VsZWQgfSlcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT4ge1xuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgICAgIGlmIChwcm9maWxlID09PSB1bmRlZmluZWQgfHwgcHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQpIHtcblxuICAgICAgICBpZiAocHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgbG9nKCdlcnJvcicsICdwcm9maWxlIGRvZXMgbm90IGV4aXN0JywgcHJvZmlsZUlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gc3RhdGUucGVyc2lzdGVudFsnbG9hZE9yZGVyJ10/Lltwcm9maWxlSWRdID8/IFtdO1xuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBwcm9maWxlLmdhbWVJZF0sIHVuZGVmaW5lZCk7XG5cbiAgICAgIGlmICgoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHx8IChkaXNjb3ZlcnkucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAvLyBzaG91bGQgbmV2ZXIgaGFwcGVuIGFuZCBpZiBpdCBkb2VzIGl0IHdpbGwgY2F1c2UgZXJyb3JzIGVsc2V3aGVyZSBhcyB3ZWxsXG4gICAgICAgIGxvZygnZXJyb3InLCAna2luZ2RvbWNvbWVkZWxpdmVyYW5jZSB3YXMgbm90IGRpc2NvdmVyZWQnKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtb2RzRm9sZGVyID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBtb2RzUGF0aCgpKTtcbiAgICAgIGNvbnN0IG1vZE9yZGVyRmlsZSA9IHBhdGguam9pbihtb2RzRm9sZGVyLCBNT0RTX09SREVSX0ZJTEVOQU1FKTtcblxuICAgICAgcmV0dXJuIHJlZnJlc2hNb2RMaXN0KGNvbnRleHQsIGRpc2NvdmVyeS5wYXRoKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgbGV0IG1pc3NpbmcgPSBsb2FkT3JkZXJcbiAgICAgICAgICAgIC5maWx0ZXIobW9kID0+ICFsaXN0SGFzTW9kKHRyYW5zZm9ybUlkKG1vZCksIF9NT0RTX1NUQVRFLmVuYWJsZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiAhbGlzdEhhc01vZCh0cmFuc2Zvcm1JZChtb2QpLCBfTU9EU19TVEFURS5kaXNhYmxlZClcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIGxpc3RIYXNNb2QodHJhbnNmb3JtSWQobW9kKSwgX01PRFNfU1RBVEUuZGlzcGxheSkpXG4gICAgICAgICAgICAubWFwKG1vZCA9PiB0cmFuc2Zvcm1JZChtb2QpKSB8fCBbXTtcblxuICAgICAgICAgIC8vIFRoaXMgaXMgdGhlb3JldGljYWxseSB1bmVjZXNzYXJ5IC0gYnV0IGl0IHdpbGwgZW5zdXJlIG5vIGR1cGxpY2F0ZXNcbiAgICAgICAgICAvLyAgYXJlIGFkZGVkLlxuICAgICAgICAgIG1pc3NpbmcgPSBbIC4uLm5ldyBTZXQobWlzc2luZykgXTtcbiAgICAgICAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IFsgLi4uX01PRFNfU1RBVEUuZW5hYmxlZCwgLi4ubWlzc2luZyBdO1xuICAgICAgICAgIGNvbnN0IGxvVmFsdWUgPSAoaW5wdXQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGlkeCA9IGxvYWRPcmRlci5pbmRleE9mKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpZHggIT09IC0xID8gaWR4IDogbG9hZE9yZGVyLmxlbmd0aDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBTb3J0XG4gICAgICAgICAgY29uc3Qgc29ydGVkID0gdHJhbnNmb3JtZWQubGVuZ3RoID4gMVxuICAgICAgICAgICAgPyB0cmFuc2Zvcm1lZC5zb3J0KChsaHMsIHJocykgPT4gbG9WYWx1ZShsaHMpIC0gbG9WYWx1ZShyaHMpKVxuICAgICAgICAgICAgOiB0cmFuc2Zvcm1lZDtcblxuICAgICAgICAgIHNldE5ld09yZGVyKHsgY29udGV4dCwgcHJvZmlsZSB9LCBzb3J0ZWQpO1xuICAgICAgICAgIHJldHVybiB3cml0ZU9yZGVyRmlsZShtb2RPcmRlckZpbGUsIHRyYW5zZm9ybWVkKVxuICAgICAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgICAgIGNvbnN0IHVzZXJDYW5jZWxlZCA9IChlcnIgaW5zdGFuY2VvZiB1dGlsLlVzZXJDYW5jZWxlZCk7XG4gICAgICAgICAgICAgIGNvbnRleHQuYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHdyaXRlIHRvIGxvYWQgb3JkZXIgZmlsZScsIGVyciwgeyBhbGxvd1JlcG9ydDogIXVzZXJDYW5jZWxlZCB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH0pO1xuICB9KTtcblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gbWFwU3RhdGVUb1Byb3BzKHN0YXRlKSB7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gIGNvbnN0IHByb2ZpbGVJZCA9IHByb2ZpbGU/LmlkIHx8ICcnO1xuICBjb25zdCBnYW1lSWQgPSBwcm9maWxlPy5nYW1lSWQgfHwgJyc7XG4gIHJldHVybiB7XG4gICAgcHJvZmlsZSxcbiAgICBtb2RTdGF0ZTogdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pLFxuICAgIG1vZHM6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBnYW1lSWRdLCBbXSksXG4gICAgb3JkZXI6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbWFwRGlzcGF0Y2hUb1Byb3BzKGRpc3BhdGNoKSB7XG4gIHJldHVybiB7XG4gICAgb25TZXREZXBsb3ltZW50TmVjZXNzYXJ5OiAoZ2FtZUlkLCBuZWNlc3NhcnkpID0+IGRpc3BhdGNoKGFjdGlvbnMuc2V0RGVwbG95bWVudE5lY2Vzc2FyeShnYW1lSWQsIG5lY2Vzc2FyeSkpLFxuICAgIG9uU2V0T3JkZXI6IChwcm9maWxlSWQsIG9yZGVyZWQpID0+IGRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGVJZCwgb3JkZXJlZCkpLFxuICB9O1xufVxuXG5jb25zdCBMb2FkT3JkZXIgPSBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcywgbWFwRGlzcGF0Y2hUb1Byb3BzKShMb2FkT3JkZXJCYXNlKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGRlZmF1bHQ6IG1haW4sXG59O1xuIl19