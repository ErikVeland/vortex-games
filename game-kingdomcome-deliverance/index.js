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
    ;
    if (isCorrectExec(xboxPath)) {
        return xboxPath;
    }
    ;
    if (isCorrectExec(steamPath)) {
        return steamPath;
    }
    ;
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
                let sorted = transformed.length > 1
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsd0RBQWdDO0FBQ2hDLDZDQUErQjtBQUMvQixvREFBc0M7QUFDdEMsNkNBQXNDO0FBQ3RDLGdEQUF3QjtBQUN4QiwyQ0FBMkc7QUFHM0csMkRBQXFGO0FBQ3JGLDRGQUFvRTtBQUNwRSx1Q0FBeUQ7QUFDekQsaUNBQXFDO0FBRXJDLE1BQU0sY0FBYyxHQUFHLFFBQVEsaUJBQU8sRUFBRSxDQUFDO0FBRXpDLE1BQU0sV0FBVyxHQUFHLFFBQVEsQ0FBQztBQUM3QixNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUM7QUFDekIsTUFBTSxVQUFVLEdBQUcsbUNBQW1DLENBQUM7QUFDdkQsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDO0FBRTNCLE1BQU0sV0FBVyxHQUFHO0lBQ2xCLE9BQU8sRUFBRSxFQUFFO0lBQ1gsUUFBUSxFQUFFLEVBQUU7SUFDWixPQUFPLEVBQUUsRUFBRTtDQUNaLENBQUE7QUFFRCxTQUFTLFFBQVE7SUFDZixPQUFPLGlCQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDM0UsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2pDLENBQUM7QUFFRCxTQUFlLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxLQUFLOztRQUM3QyxJQUFJLEtBQUssS0FBSyxNQUFNLEVBQUU7WUFDbEIsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO2dCQUNuQixRQUFRLEVBQUUsTUFBTTtnQkFDaEIsT0FBTyxFQUFFO29CQUNMLEtBQUssRUFBRSxVQUFVO29CQUNqQixVQUFVLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsQ0FBQztp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LENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLG9CQUFPLENBQUMsc0JBQXNCLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzVHLFVBQVUsRUFBRSxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxvQkFBTyxDQUFDLFlBQVksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDdkYsQ0FBQztBQUNKLENBQUM7QUFFRCxNQUFNLFNBQVMsR0FBRyxJQUFBLHFCQUFPLEVBQUMsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7QUFFOUUsTUFBTSxDQUFDLE9BQU8sR0FBRztJQUNmLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBCbHVlYmlyZCBmcm9tICdibHVlYmlyZCc7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgKiBhcyBCUyBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgYWN0aW9ucywgZnMsIERyYWdnYWJsZUxpc3QsIEZsZXhMYXlvdXQsIHR5cGVzLCBsb2csIE1haW5QYWdlLCBzZWxlY3RvcnMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgSUtDRENvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvdHlwZXMnO1xuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbnNEYXRhLCBwYXJzZUNvbGxlY3Rpb25zRGF0YSB9IGZyb20gJy4vY29sbGVjdGlvbnMvY29sbGVjdGlvbnMnO1xuaW1wb3J0IENvbGxlY3Rpb25zRGF0YVZpZXcgZnJvbSAnLi9jb2xsZWN0aW9ucy9Db2xsZWN0aW9uc0RhdGFWaWV3JztcbmltcG9ydCB7IEdBTUVfSUQsIE1PRFNfT1JERVJfRklMRU5BTUUgfSBmcm9tICcuL3N0YXRpY3MnO1xuaW1wb3J0IHsgdHJhbnNmb3JtSWQgfSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBJMThOX05BTUVTUEFDRSA9IGBnYW1lLSR7R0FNRV9JRH1gO1xuXG5jb25zdCBTVEVBTV9BUFBJRCA9ICczNzk0MzAnO1xuY29uc3QgRVBJQ19BUFBJRCA9ICdFZWwnO1xuY29uc3QgWEJPWF9BUFBJRCA9ICdEZWVwU2lsdmVyLktpbmdkb21Db21lRGVsaXZlcmFuY2UnO1xuY29uc3QgWEJPWEVYRUNOQU1FID0gJ0FwcCc7XG5cbmNvbnN0IF9NT0RTX1NUQVRFID0ge1xuICBlbmFibGVkOiBbXSxcbiAgZGlzYWJsZWQ6IFtdLFxuICBkaXNwbGF5OiBbXSxcbn1cblxuZnVuY3Rpb24gZmluZEdhbWUoKSB7XG4gIHJldHVybiB1dGlsLkdhbWVTdG9yZUhlbHBlci5maW5kQnlBcHBJZChbU1RFQU1fQVBQSUQsIFhCT1hfQVBQSUQsIEVQSUNfQVBQSURdKVxuICAgIC50aGVuKGdhbWUgPT4gZ2FtZS5nYW1lUGF0aCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlcXVpcmVzTGF1bmNoZXIoZ2FtZVBhdGgsIHN0b3JlKSB7XG4gIGlmIChzdG9yZSA9PT0gJ3hib3gnKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgICBsYXVuY2hlcjogJ3hib3gnLFxuICAgICAgICAgIGFkZEluZm86IHtcbiAgICAgICAgICAgICAgYXBwSWQ6IFhCT1hfQVBQSUQsXG4gICAgICAgICAgICAgIHBhcmFtZXRlcnM6IFt7IGFwcEV4ZWNOYW1lOiBYQk9YRVhFQ05BTUUgfV0sXG4gICAgICAgICAgfSxcbiAgICAgIH0pO1xuICB9XG4gaWYgKHN0b3JlID09PSAnZXBpYycpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICAgICAgbGF1bmNoZXI6ICdlcGljJyxcbiAgICAgICAgYWRkSW5mbzoge1xuICAgICAgICAgICAgYXBwSWQ6IEVQSUNfQVBQSUQsXG4gICAgICAgIH0sXG4gICAgfSk7XG4gIH1cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xufVxuXG5mdW5jdGlvbiBnZXRFeGVjdXRhYmxlKGRpc2NvdmVyZWRQYXRoKSB7XG4gIGNvbnN0IHN0ZWFtUGF0aCA9IHBhdGguam9pbignQmluJywgJ1dpbjY0JywgJ0tpbmdkb21Db21lLmV4ZScpO1xuICBjb25zdCBlcGljUGF0aCA9IHBhdGguam9pbignQmluJywgJ1dpbjY0TWFzdGVyTWFzdGVyRXBpY1BHTycsICdLaW5nZG9tQ29tZS5leGUnKTtcbiAgY29uc3QgeGJveFBhdGggPSBwYXRoLmpvaW4oJ2dhbWVsYXVuY2hoZWxwZXIuZXhlJyk7XG4gIGNvbnN0IGlzQ29ycmVjdEV4ZWMgPSAoZXhlYykgPT4ge1xuICAgIHRyeSB7XG4gICAgICBmcy5zdGF0U3luYyhwYXRoLmpvaW4oZGlzY292ZXJlZFBhdGgsIGV4ZWMpKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9O1xuICBpZiAoaXNDb3JyZWN0RXhlYyhlcGljUGF0aCkpIHtcbiAgICByZXR1cm4gZXBpY1BhdGg7XG4gIH07XG4gIGlmIChpc0NvcnJlY3RFeGVjKHhib3hQYXRoKSkge1xuICAgIHJldHVybiB4Ym94UGF0aDtcbiAgfTtcbiAgaWYgKGlzQ29ycmVjdEV4ZWMoc3RlYW1QYXRoKSkge1xuICAgIHJldHVybiBzdGVhbVBhdGg7XG4gIH07XG4gIHJldHVybiBzdGVhbVBhdGg7XG59XG5cblxuZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dCwgZGlzY292ZXJ5KSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKTtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKTtcbiAgcmV0dXJuIGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCAnTW9kcycpLCAoKSA9PiBCbHVlYmlyZC5yZXNvbHZlKCkpXG4gICAgLnRoZW4oKCkgPT4gZ2V0Q3VycmVudE9yZGVyKHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgbW9kc1BhdGgoKSwgTU9EU19PUkRFUl9GSUxFTkFNRSkpKVxuICAgIC5jYXRjaChlcnIgPT4gZXJyLmNvZGUgPT09ICdFTk9FTlQnID8gUHJvbWlzZS5yZXNvbHZlKFtdKSA6IFByb21pc2UucmVqZWN0KGVycikpXG4gICAgLnRoZW4oZGF0YSA9PiBzZXROZXdPcmRlcih7IGNvbnRleHQsIHByb2ZpbGUgfSxcbiAgICAgIEFycmF5LmlzQXJyYXkoZGF0YSkgPyBkYXRhIDogZGF0YS5zcGxpdCgnXFxuJykpKTtcbn1cblxuZnVuY3Rpb24gZ2V0Q3VycmVudE9yZGVyKG1vZE9yZGVyRmlsZXBhdGgpIHtcbiAgcmV0dXJuIGZzLnJlYWRGaWxlQXN5bmMobW9kT3JkZXJGaWxlcGF0aCwgeyBlbmNvZGluZzogJ3V0ZjgnIH0pO1xufVxuXG5mdW5jdGlvbiB3YWxrQXN5bmMoZGlyKSB7XG4gIGxldCBlbnRyaWVzID0gW107XG4gIHJldHVybiBmcy5yZWFkZGlyQXN5bmMoZGlyKS50aGVuKGZpbGVzID0+IHtcbiAgICByZXR1cm4gQmx1ZWJpcmQuZWFjaChmaWxlcywgZmlsZSA9PiB7XG4gICAgICBjb25zdCBmdWxsUGF0aCA9IHBhdGguam9pbihkaXIsIGZpbGUpO1xuICAgICAgcmV0dXJuIGZzLnN0YXRBc3luYyhmdWxsUGF0aCkudGhlbihzdGF0cyA9PiB7XG4gICAgICAgIGlmIChzdGF0cy5pc0RpcmVjdG9yeSgpKSB7XG4gICAgICAgICAgcmV0dXJuIHdhbGtBc3luYyhmdWxsUGF0aClcbiAgICAgICAgICAgIC50aGVuKG5lc3RlZEZpbGVzID0+IHtcbiAgICAgICAgICAgICAgZW50cmllcyA9IGVudHJpZXMuY29uY2F0KG5lc3RlZEZpbGVzKTtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBlbnRyaWVzLnB1c2goZnVsbFBhdGgpO1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pXG4gIC50aGVuKCgpID0+IFByb21pc2UucmVzb2x2ZShlbnRyaWVzKSlcbiAgLmNhdGNoKGVyciA9PiB7XG4gICAgbG9nKCdlcnJvcicsICdVbmFibGUgdG8gcmVhZCBtb2QgZGlyZWN0b3J5JywgZXJyKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGVudHJpZXMpO1xuICB9KTtcbn1cblxuXG5mdW5jdGlvbiByZWFkTW9kc0ZvbGRlcihtb2RzRm9sZGVyLCBhcGkpIHtcbiAgY29uc3QgZXh0TCA9IGlucHV0ID0+IHBhdGguZXh0bmFtZShpbnB1dCkudG9Mb3dlckNhc2UoKTtcbiAgY29uc3QgaXNWYWxpZE1vZCA9IG1vZEZpbGUgPT4gWycucGFrJywgJy5jZmcnLCAnLm1hbmlmZXN0J10uaW5kZXhPZihleHRMKG1vZEZpbGUpKSAhPT0gLTE7XG5cbiAgLy8gUmVhZHMgdGhlIHByb3ZpZGVkIGZvbGRlclBhdGggYW5kIGF0dGVtcHRzIHRvIGlkZW50aWZ5IGFsbFxuICAvLyAgY3VycmVudGx5IGRlcGxveWVkIG1vZHMuXG4gIHJldHVybiBmcy5yZWFkZGlyQXN5bmMobW9kc0ZvbGRlcilcbiAgICAudGhlbihlbnRyaWVzID0+IEJsdWViaXJkLnJlZHVjZShlbnRyaWVzLCAoYWNjdW0sIGN1cnJlbnQpID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRQYXRoID0gcGF0aC5qb2luKG1vZHNGb2xkZXIsIGN1cnJlbnQpO1xuICAgICAgcmV0dXJuIGZzLnJlYWRkaXJBc3luYyhjdXJyZW50UGF0aClcbiAgICAgICAgLnRoZW4obW9kRmlsZXMgPT4ge1xuICAgICAgICAgIGlmIChtb2RGaWxlcy5zb21lKGlzVmFsaWRNb2QpID09PSB0cnVlKSB7XG4gICAgICAgICAgICBhY2N1bS5wdXNoKGN1cnJlbnQpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGFjY3VtKTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiBQcm9taXNlLnJlc29sdmUoYWNjdW0pKVxuICAgIH0sIFtdKSlcbiAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgIGNvbnN0IGFsbG93UmVwb3J0ID0gWydFTk9FTlQnLCAnRVBFUk0nLCAnRUFDQ0VTUyddLmluZGV4T2YoZXJyLmNvZGUpID09PSAtMTtcbiAgICAgIGFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ2ZhaWxlZCB0byByZWFkIGtpbmdkb20gY29tZSBtb2RzIGRpcmVjdG9yeScsXG4gICAgICAgIGVyci5tZXNzYWdlLCB7IGFsbG93UmVwb3J0IH0pO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShbXSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIGxpc3RIYXNNb2QobW9kSWQsIGxpc3QpIHtcbiAgcmV0dXJuICghIWxpc3QpXG4gICAgPyBsaXN0Lm1hcChtb2QgPT5cbiAgICAgICAgdHJhbnNmb3JtSWQobW9kKS50b0xvd2VyQ2FzZSgpKS5pbmNsdWRlcyhtb2RJZC50b0xvd2VyQ2FzZSgpKVxuICAgIDogZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGdldE1hbnVhbGx5QWRkZWRNb2RzKGRpc2FibGVkTW9kcywgZW5hYmxlZE1vZHMsIG1vZE9yZGVyRmlsZXBhdGgsIGFwaSkge1xuICBjb25zdCBtb2RzUGF0aCA9IHBhdGguZGlybmFtZShtb2RPcmRlckZpbGVwYXRoKTtcblxuICByZXR1cm4gcmVhZE1vZHNGb2xkZXIobW9kc1BhdGgsIGFwaSkudGhlbihkZXBsb3llZE1vZHMgPT5cbiAgICBnZXRDdXJyZW50T3JkZXIobW9kT3JkZXJGaWxlcGF0aClcbiAgICAgIC5jYXRjaChlcnIgPT4gKGVyci5jb2RlID09PSAnRU5PRU5UJykgPyBQcm9taXNlLnJlc29sdmUoJycpIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcbiAgICAgIC50aGVuKGRhdGEgPT4ge1xuICAgICAgICAvLyAxLiBDb25maXJtZWQgdG8gZXhpc3QgKGRlcGxveWVkKSBpbnNpZGUgdGhlIG1vZHMgZGlyZWN0b3J5LlxuICAgICAgICAvLyAyLiBJcyBub3QgcGFydCBvZiBhbnkgb2YgdGhlIG1vZCBsaXN0cyB3aGljaCBWb3J0ZXggbWFuYWdlcy5cbiAgICAgICAgY29uc3QgbWFudWFsbHlBZGRlZCA9IGRhdGEuc3BsaXQoJ1xcbicpLmZpbHRlcihlbnRyeSA9PlxuICAgICAgICAgICAgIWxpc3RIYXNNb2QoZW50cnksIGVuYWJsZWRNb2RzKVxuICAgICAgICAgICYmICFsaXN0SGFzTW9kKGVudHJ5LCBkaXNhYmxlZE1vZHMpXG4gICAgICAgICAgJiYgbGlzdEhhc01vZChlbnRyeSwgZGVwbG95ZWRNb2RzKSk7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShtYW51YWxseUFkZGVkKTtcbiAgICAgIH0pKTtcbn1cblxuZnVuY3Rpb24gcmVmcmVzaE1vZExpc3QoY29udGV4dCwgZGlzY292ZXJ5UGF0aCkge1xuICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gIGNvbnN0IGluc3RhbGxhdGlvblBhdGggPSBzZWxlY3RvcnMuaW5zdGFsbFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3QgbW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwgW10pO1xuICBjb25zdCBtb2RLZXlzID0gT2JqZWN0LmtleXMobW9kcyk7XG4gIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xuICBjb25zdCBlbmFibGVkID0gbW9kS2V5cy5maWx0ZXIobW9kID0+ICEhbW9kU3RhdGVbbW9kXSAmJiBtb2RTdGF0ZVttb2RdLmVuYWJsZWQpO1xuICBjb25zdCBkaXNhYmxlZCA9IG1vZEtleXMuZmlsdGVyKGRpcyA9PiAhZW5hYmxlZC5pbmNsdWRlcyhkaXMpKTtcblxuICBjb25zdCBleHRMID0gaW5wdXQgPT4gcGF0aC5leHRuYW1lKGlucHV0KS50b0xvd2VyQ2FzZSgpO1xuICByZXR1cm4gQmx1ZWJpcmQucmVkdWNlKGVuYWJsZWQsIChhY2N1bSwgbW9kKSA9PiB7XG4gICAgaWYgKG1vZHNbbW9kXT8uaW5zdGFsbGF0aW9uUGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfVxuICAgIGNvbnN0IG1vZFBhdGggPSBwYXRoLmpvaW4oaW5zdGFsbGF0aW9uUGF0aCwgbW9kc1ttb2RdLmluc3RhbGxhdGlvblBhdGgpO1xuICAgIHJldHVybiB3YWxrQXN5bmMobW9kUGF0aClcbiAgICAgIC50aGVuKGVudHJpZXMgPT4gKGVudHJpZXMuZmluZChmaWxlTmFtZSA9PiBbJy5wYWsnLCAnLmNmZycsICcubWFuaWZlc3QnXS5pbmNsdWRlcyhleHRMKGZpbGVOYW1lKSkpICE9PSB1bmRlZmluZWQpXG4gICAgICAgID8gYWNjdW0uY29uY2F0KG1vZClcbiAgICAgICAgOiBhY2N1bSk7XG4gIH0sIFtdKS50aGVuKG1hbmFnZWRNb2RzID0+IHtcbiAgICByZXR1cm4gZ2V0TWFudWFsbHlBZGRlZE1vZHMoZGlzYWJsZWQsIGVuYWJsZWQsIHBhdGguam9pbihkaXNjb3ZlcnlQYXRoLCBtb2RzUGF0aCgpLFxuICAgICAgTU9EU19PUkRFUl9GSUxFTkFNRSksIGNvbnRleHQuYXBpKVxuICAgICAgLnRoZW4obWFudWFsbHlBZGRlZCA9PiB7XG4gICAgICAgIF9NT0RTX1NUQVRFLmVuYWJsZWQgPSBbXS5jb25jYXQobWFuYWdlZE1vZHNcbiAgICAgICAgICAubWFwKG1vZCA9PiB0cmFuc2Zvcm1JZChtb2QpKSwgbWFudWFsbHlBZGRlZCk7XG4gICAgICAgIF9NT0RTX1NUQVRFLmRpc2FibGVkID0gZGlzYWJsZWQ7XG4gICAgICAgIF9NT0RTX1NUQVRFLmRpc3BsYXkgPSBfTU9EU19TVEFURS5lbmFibGVkO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9KVxuICB9KTtcbn1cblxuZnVuY3Rpb24gTG9hZE9yZGVyQmFzZShwcm9wcykge1xuICBjb25zdCBnZXRNb2QgPSAoaXRlbSkgPT4ge1xuICAgIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhwcm9wcy5tb2RzKTtcbiAgICBjb25zdCBmb3VuZCA9IGtleXMuZmluZChrZXkgPT4gdHJhbnNmb3JtSWQoa2V5KSA9PT0gaXRlbSk7XG4gICAgcmV0dXJuIGZvdW5kICE9PSB1bmRlZmluZWRcbiAgICAgID8gcHJvcHMubW9kc1tmb3VuZF1cbiAgICAgIDogeyBhdHRyaWJ1dGVzOiB7IG5hbWU6IGl0ZW0gfSB9O1xuICB9O1xuXG4gIGNsYXNzIEl0ZW1SZW5kZXJlciBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG4gICAgcmVuZGVyKCkge1xuICAgICAgaWYgKHByb3BzLm1vZHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgIH1cblxuICAgICAgY29uc3QgaXRlbSA9ICh0aGlzLnByb3BzIGFzIGFueSkuaXRlbTtcbiAgICAgIGNvbnN0IG1vZCA9IGdldE1vZChpdGVtKTtcblxuICAgICAgcmV0dXJuIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuTGlzdEdyb3VwSXRlbSwge1xuICAgICAgICAgICAgc3R5bGU6IHtcbiAgICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiAndmFyKC0tYnJhbmQtYmcsIGJsYWNrKScsXG4gICAgICAgICAgICAgIGJvcmRlckJvdHRvbTogJzJweCBzb2xpZCB2YXIoLS1ib3JkZXItY29sb3IsIHdoaXRlKSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdkaXYnLCB7XG4gICAgICAgICAgICBzdHlsZToge1xuICAgICAgICAgICAgICBmb250U2l6ZTogJzEuMWVtJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdpbWcnLCB7XG4gICAgICAgICAgICBzcmM6ICEhbW9kLmF0dHJpYnV0ZXMucGljdHVyZVVybFxuICAgICAgICAgICAgICAgICAgPyBtb2QuYXR0cmlidXRlcy5waWN0dXJlVXJsXG4gICAgICAgICAgICAgICAgICA6IGAke19fZGlybmFtZX0vZ2FtZWFydC5qcGdgLFxuICAgICAgICAgICAgY2xhc3NOYW1lOiAnbW9kLXBpY3R1cmUnLFxuICAgICAgICAgICAgd2lkdGg6Jzc1cHgnLFxuICAgICAgICAgICAgaGVpZ2h0Oic0NXB4JyxcbiAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgIG1hcmdpbjogJzVweCAxMHB4IDVweCA1cHgnLFxuICAgICAgICAgICAgICBib3JkZXI6ICcxcHggc29saWQgdmFyKC0tYnJhbmQtc2Vjb25kYXJ5LCNENzhGNDYpJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgdXRpbC5yZW5kZXJNb2ROYW1lKG1vZCkpKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBSZWFjdC5jcmVhdGVFbGVtZW50KE1haW5QYWdlLCB7fSxcbiAgICBSZWFjdC5jcmVhdGVFbGVtZW50KE1haW5QYWdlLkJvZHksIHt9LFxuICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChCUy5QYW5lbCwgeyBpZDogJ2tjZC1sb2Fkb3JkZXItcGFuZWwnIH0sXG4gICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoQlMuUGFuZWwuQm9keSwge30sXG4gICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudChGbGV4TGF5b3V0LCB7IHR5cGU6ICdyb3cnIH0sXG4gICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KEZsZXhMYXlvdXQuRmxleCwge30sXG4gICAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRHJhZ2dhYmxlTGlzdCwge1xuICAgICAgICAgICAgICAgIGlkOiAna2NkLWxvYWRvcmRlcicsXG4gICAgICAgICAgICAgICAgaXRlbVR5cGVJZDogJ2tjZC1sb2Fkb3JkZXItaXRlbScsXG4gICAgICAgICAgICAgICAgaXRlbXM6IF9NT0RTX1NUQVRFLmRpc3BsYXksXG4gICAgICAgICAgICAgICAgaXRlbVJlbmRlcmVyOiBJdGVtUmVuZGVyZXIgYXMgYW55LFxuICAgICAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcxMDAlJyxcbiAgICAgICAgICAgICAgICAgIG92ZXJmbG93OiAnYXV0bycsXG4gICAgICAgICAgICAgICAgICBib3JkZXJXaWR0aDogJ3ZhcigtLWJvcmRlci13aWR0aCwgMXB4KScsXG4gICAgICAgICAgICAgICAgICBib3JkZXJTdHlsZTogJ3NvbGlkJyxcbiAgICAgICAgICAgICAgICAgIGJvcmRlckNvbG9yOiAndmFyKC0tYm9yZGVyLWNvbG9yLCB3aGl0ZSknLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgYXBwbHk6IG9yZGVyZWQgPT4ge1xuICAgICAgICAgICAgICAgICAgLy8gV2Ugb25seSB3cml0ZSB0byB0aGUgbW9kX29yZGVyIGZpbGUgd2hlbiB3ZSBkZXBsb3kgdG8gYXZvaWQgKHVubGlrZWx5KSBzaXR1YXRpb25zXG4gICAgICAgICAgICAgICAgICAvLyAgd2hlcmUgYSBmaWxlIGRlc2NyaXB0b3IgcmVtYWlucyBvcGVuLCBibG9ja2luZyBmaWxlIG9wZXJhdGlvbnMgd2hlbiB0aGUgdXNlclxuICAgICAgICAgICAgICAgICAgLy8gIGNoYW5nZXMgdGhlIGxvYWQgb3JkZXIgdmVyeSBxdWlja2x5LiBUaGlzIGlzIGFsbCB0aGVvcmV0aWNhbCBhdCB0aGlzIHBvaW50LlxuICAgICAgICAgICAgICAgICAgcHJvcHMub25TZXREZXBsb3ltZW50TmVjZXNzYXJ5KEdBTUVfSUQsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHNldE5ld09yZGVyKHByb3BzLCBvcmRlcmVkKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgKSxcbiAgICAgICAgICAgIFJlYWN0LmNyZWF0ZUVsZW1lbnQoRmxleExheW91dC5GbGV4LCB7fSxcbiAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnZGl2Jywge1xuICAgICAgICAgICAgICAgIHN0eWxlOiB7XG4gICAgICAgICAgICAgICAgICBwYWRkaW5nOiAndmFyKC0taGFsZi1ndXR0ZXIsIDE1cHgpJyxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgnaDInLCB7fSxcbiAgICAgICAgICAgICAgICAgIHByb3BzLnQoJ0NoYW5naW5nIHlvdXIgbG9hZCBvcmRlcicsIHsgbnM6IEkxOE5fTkFNRVNQQUNFIH0pKSxcbiAgICAgICAgICAgICAgICBSZWFjdC5jcmVhdGVFbGVtZW50KCdwJywge30sXG4gICAgICAgICAgICAgICAgICBwcm9wcy50KCdEcmFnIGFuZCBkcm9wIHRoZSBtb2RzIG9uIHRoZSBsZWZ0IHRvIHJlb3JkZXIgdGhlbS4gS2luZ2RvbSBDb21lOiBEZWxpdmVyYW5jZSB1c2VzIGEgbW9kX29yZGVyLnR4dCBmaWxlICdcbiAgICAgICAgICAgICAgICAgICAgICArICd0byBkZWZpbmUgdGhlIG9yZGVyIGluIHdoaWNoIG1vZHMgYXJlIGxvYWRlZCwgVm9ydGV4IHdpbGwgd3JpdGUgdGhlIGZvbGRlciBuYW1lcyBvZiB0aGUgZGlzcGxheWVkICdcbiAgICAgICAgICAgICAgICAgICAgICArICdtb2RzIGluIHRoZSBvcmRlciB5b3UgaGF2ZSBzZXQuICdcbiAgICAgICAgICAgICAgICAgICAgICArICdNb2RzIHBsYWNlZCBhdCB0aGUgYm90dG9tIG9mIHRoZSBsb2FkIG9yZGVyIHdpbGwgaGF2ZSBwcmlvcml0eSBvdmVyIHRob3NlIGFib3ZlIHRoZW0uJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxuICAgICAgICAgICAgICAgICAgUmVhY3QuY3JlYXRlRWxlbWVudCgncCcsIHt9LFxuICAgICAgICAgICAgICAgICAgcHJvcHMudCgnTm90ZTogVm9ydGV4IHdpbGwgZGV0ZWN0IG1hbnVhbGx5IGFkZGVkIG1vZHMgYXMgbG9uZyBhcyB0aGVzZSBoYXZlIGJlZW4gYWRkZWQgdG8gdGhlIG1vZF9vcmRlci50eHQgZmlsZS4gJ1xuICAgICAgICAgICAgICAgICAgICAgICAgKyAnTWFudWFsbHkgYWRkZWQgbW9kcyBhcmUgbm90IG1hbmFnZWQgYnkgVm9ydGV4IC0gdG8gcmVtb3ZlIHRoZXNlLCB5b3Ugd2lsbCBoYXZlIHRvICdcbiAgICAgICAgICAgICAgICAgICAgICAgICsgJ21hbnVhbGx5IGVyYXNlIHRoZSBlbnRyeSBmcm9tIHRoZSBtb2Rfb3JkZXIudHh0IGZpbGUuJywgeyBuczogSTE4Tl9OQU1FU1BBQ0UgfSkpLFxuICAgICAgICAgICAgICApKVxuICAgICAgICApKSkpKTtcbn1cblxuZnVuY3Rpb24gbW9kc1BhdGgoKSB7XG4gIHJldHVybiAnTW9kcyc7XG59XG5cbmZ1bmN0aW9uIHNldE5ld09yZGVyKHByb3BzLCBvcmRlcmVkKSB7XG4gIGNvbnN0IHsgY29udGV4dCwgcHJvZmlsZSwgb25TZXRPcmRlciB9ID0gcHJvcHM7XG4gIGlmIChwcm9maWxlPy5pZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gTm90IHN1cmUgaG93IHdlIGdvdCBoZXJlIHdpdGhvdXQgYSB2YWxpZCBwcm9maWxlLlxuICAgIC8vICBwb3NzaWJseSB0aGUgdXNlciBjaGFuZ2VkIHByb2ZpbGUgZHVyaW5nIHRoZSBzZXR1cC9wcmVwYXJhdGlvblxuICAgIC8vICBzdGFnZSA/IGh0dHBzOi8vZ2l0aHViLmNvbS9OZXh1cy1Nb2RzL1ZvcnRleC9pc3N1ZXMvNzA1M1xuICAgIGxvZygnZXJyb3InLCAnZmFpbGVkIHRvIHNldCBuZXcgbG9hZCBvcmRlcicsICd1bmRlZmluZWQgcHJvZmlsZScpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIFdlIGZpbHRlciB0aGUgb3JkZXJlZCBsaXN0IGp1c3QgaW4gY2FzZSB0aGVyZSdzIGFuIGVtcHR5XG4gIC8vICBlbnRyeSwgd2hpY2ggaXMgcG9zc2libGUgaWYgdGhlIHVzZXJzIGhhZCBtYW51YWxseSBhZGRlZFxuICAvLyAgZW1wdHkgbGluZXMgaW4gdGhlIGxvYWQgb3JkZXIgZmlsZS5cbiAgY29uc3QgZmlsdGVyZWQgPSBvcmRlcmVkLmZpbHRlcihlbnRyeSA9PiAhIWVudHJ5KTtcbiAgX01PRFNfU1RBVEUuZGlzcGxheSA9IGZpbHRlcmVkO1xuXG4gIHJldHVybiAoISFvblNldE9yZGVyKVxuICAgID8gb25TZXRPcmRlcihwcm9maWxlLmlkLCBmaWx0ZXJlZClcbiAgICA6IGNvbnRleHQuYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGUuaWQsIGZpbHRlcmVkKSk7XG59XG5cbmZ1bmN0aW9uIHdyaXRlT3JkZXJGaWxlKGZpbGVQYXRoLCBtb2RMaXN0KSB7XG4gIHJldHVybiBmcy5yZW1vdmVBc3luYyhmaWxlUGF0aClcbiAgICAuY2F0Y2goZXJyID0+IGVyci5jb2RlID09PSAnRU5PRU5UJyA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSlcbiAgICAudGhlbigoKSA9PiBmcy5lbnN1cmVGaWxlQXN5bmMoZmlsZVBhdGgpKVxuICAgIC50aGVuKCgpID0+IGZzLndyaXRlRmlsZUFzeW5jKGZpbGVQYXRoLCBtb2RMaXN0LmpvaW4oJ1xcbicpLCB7IGVuY29kaW5nOiAndXRmOCcgfSkpO1xufVxuXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcbiAgICBpZDogR0FNRV9JRCxcbiAgICBuYW1lOiAnS2luZ2RvbSBDb21lOlxcdERlbGl2ZXJhbmNlJyxcbiAgICBtZXJnZU1vZHM6IG1vZCA9PiB0cmFuc2Zvcm1JZChtb2QuaWQpLFxuICAgIHF1ZXJ5UGF0aDogZmluZEdhbWUsXG4gICAgcXVlcnlNb2RQYXRoOiBtb2RzUGF0aCxcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxuICAgIGV4ZWN1dGFibGU6IGdldEV4ZWN1dGFibGUsXG4gICAgcmVxdWlyZWRGaWxlczogW1xuICAgICAgJ0RhdGEvTGV2ZWxzL3JhdGFqZS9sZXZlbC5wYWsnLFxuICAgIF0sXG4gICAgc2V0dXA6IChkaXNjb3ZlcnkpID0+IHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQsIGRpc2NvdmVyeSksXG4gICAgLy9yZXF1aXJlc0NsZWFudXA6IHRydWUsIC8vIFRoZW9yZXRpY2FsbHkgbm90IG5lZWRlZCwgYXMgd2UgbG9vayBmb3Igc2V2ZXJhbCBmaWxlIGV4dGVuc2lvbnMgd2hlblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgY2hlY2tpbmcgd2hldGhlciBhIG1vZCBpcyB2YWxpZCBvciBub3QuIFRoaXMgbWF5IGNoYW5nZS5cbiAgICByZXF1aXJlc0xhdW5jaGVyOiByZXF1aXJlc0xhdW5jaGVyIGFzIGFueSxcbiAgICBlbnZpcm9ubWVudDoge1xuICAgICAgU3RlYW1BUFBJZDogU1RFQU1fQVBQSUQsXG4gICAgICBYYm94QVBQSWQ6IFhCT1hfQVBQSUQsXG4gICAgICBFcGljQVBQSWQ6IEVQSUNfQVBQSUQsXG4gICAgfSxcbiAgICBkZXRhaWxzOiB7XG4gICAgICBzdGVhbUFwcElkOiArU1RFQU1fQVBQSUQsXG4gICAgICB4Ym94QXBwSWQ6IFhCT1hfQVBQSUQsXG4gICAgICBlcGljQXBwSWQ6IEVQSUNfQVBQSUQsXG4gICAgfSxcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlck1haW5QYWdlKCdzb3J0LW5vbmUnLCAnTG9hZCBPcmRlcicsIExvYWRPcmRlciwge1xuICAgIGlkOiAna2NkLWxvYWQtb3JkZXInLFxuICAgIGhvdGtleTogJ0UnLFxuICAgIGdyb3VwOiAncGVyLWdhbWUnLFxuICAgIHZpc2libGU6ICgpID0+IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoY29udGV4dC5hcGkuc3RvcmUuZ2V0U3RhdGUoKSkgPT09IEdBTUVfSUQsXG4gICAgcHJvcHM6ICgpID0+ICh7XG4gICAgICB0OiBjb250ZXh0LmFwaS50cmFuc2xhdGUsXG4gICAgfSksXG4gIH0pO1xuXG4gIGNvbnRleHQub3B0aW9uYWwucmVnaXN0ZXJDb2xsZWN0aW9uRmVhdHVyZShcbiAgICAna2NkX2NvbGxlY3Rpb25fZGF0YScsXG4gICAgKGdhbWVJZDogc3RyaW5nLCBpbmNsdWRlZE1vZHM6IHN0cmluZ1tdKSA9PlxuICAgICAgZ2VuQ29sbGVjdGlvbnNEYXRhKGNvbnRleHQsIGdhbWVJZCwgaW5jbHVkZWRNb2RzKSxcbiAgICAoZ2FtZUlkOiBzdHJpbmcsIGNvbGxlY3Rpb246IElLQ0RDb2xsZWN0aW9uc0RhdGEpID0+XG4gICAgICBwYXJzZUNvbGxlY3Rpb25zRGF0YShjb250ZXh0LCBnYW1lSWQsIGNvbGxlY3Rpb24pLFxuICAgICgpID0+IFByb21pc2UucmVzb2x2ZSgpLFxuICAgICh0KSA9PiB0KCdLaW5nZG9tIENvbWU6IERlbGl2ZXJhbmNlIERhdGEnKSxcbiAgICAoc3RhdGU6IHR5cGVzLklTdGF0ZSwgZ2FtZUlkOiBzdHJpbmcpID0+IGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3LFxuICApO1xuXG4gIGNvbnRleHQub25jZSgoKSA9PiB7XG4gICAgY29udGV4dC5hcGkuZXZlbnRzLm9uKCdtb2QtZW5hYmxlZCcsIChwcm9maWxlSWQsIG1vZElkKSA9PiB7XG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLnN0b3JlLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBkaXNjb3ZlcnkgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnZ2FtZU1vZGUnLCAnZGlzY292ZXJlZCcsIEdBTUVfSURdLCB1bmRlZmluZWQpO1xuICAgICAgaWYgKGRpc2NvdmVyeT8ucGF0aCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgcHJvZmlsZSA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ3Byb2ZpbGVzJywgcHJvZmlsZUlkXSwgdW5kZWZpbmVkKTtcbiAgICAgIGlmICghIXByb2ZpbGUgJiYgKHByb2ZpbGUuZ2FtZUlkID09PSBHQU1FX0lEKSAmJiAoX01PRFNfU1RBVEUuZGlzcGxheS5pbmRleE9mKG1vZElkKSA9PT0gLTEpKSB7XG4gICAgICAgIHJlZnJlc2hNb2RMaXN0KGNvbnRleHQsIGRpc2NvdmVyeS5wYXRoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5vbigncHVyZ2UtbW9kcycsICgpID0+IHtcbiAgICAgIGNvbnN0IHN0b3JlID0gY29udGV4dC5hcGkuc3RvcmU7XG4gICAgICBjb25zdCBzdGF0ZSA9IHN0b3JlLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICAgICAgaWYgKHByb2ZpbGUgPT09IHVuZGVmaW5lZCB8fCBwcm9maWxlLmdhbWVJZCAhPT0gR0FNRV9JRCl7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBHQU1FX0lEXSwgdW5kZWZpbmVkKTtcbiAgICAgIGlmICgoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHx8IChkaXNjb3ZlcnkucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAvLyBzaG91bGQgbmV2ZXIgaGFwcGVuIGFuZCBpZiBpdCBkb2VzIGl0IHdpbGwgY2F1c2UgZXJyb3JzIGVsc2V3aGVyZSBhcyB3ZWxsXG4gICAgICAgIGxvZygnZXJyb3InLCAna2luZ2RvbWNvbWVkZWxpdmVyYW5jZSB3YXMgbm90IGRpc2NvdmVyZWQnKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtb2RzT3JkZXJGaWxlUGF0aCA9IHBhdGguam9pbihkaXNjb3ZlcnkucGF0aCwgbW9kc1BhdGgoKSwgTU9EU19PUkRFUl9GSUxFTkFNRSk7XG4gICAgICBjb25zdCBtYW5hZ2VkTW9kcyA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBHQU1FX0lEXSwge30pO1xuICAgICAgY29uc3QgbW9kS2V5cyA9IE9iamVjdC5rZXlzKG1hbmFnZWRNb2RzKTtcbiAgICAgIGNvbnN0IG1vZFN0YXRlID0gdXRpbC5nZXRTYWZlKHByb2ZpbGUsIFsnbW9kU3RhdGUnXSwge30pO1xuICAgICAgY29uc3QgZW5hYmxlZCA9IG1vZEtleXMuZmlsdGVyKG1vZCA9PiAhIW1vZFN0YXRlW21vZF0gJiYgbW9kU3RhdGVbbW9kXS5lbmFibGVkKTtcbiAgICAgIGNvbnN0IGRpc2FibGVkID0gbW9kS2V5cy5maWx0ZXIoZGlzID0+ICFlbmFibGVkLmluY2x1ZGVzKGRpcykpO1xuICAgICAgZ2V0TWFudWFsbHlBZGRlZE1vZHMoZGlzYWJsZWQsIGVuYWJsZWQsIG1vZHNPcmRlckZpbGVQYXRoLCBjb250ZXh0LmFwaSlcbiAgICAgICAgLnRoZW4obWFudWFsbHlBZGRlZCA9PiB7XG4gICAgICAgICAgd3JpdGVPcmRlckZpbGUobW9kc09yZGVyRmlsZVBhdGgsIG1hbnVhbGx5QWRkZWQpXG4gICAgICAgICAgICAudGhlbigoKSA9PiBzZXROZXdPcmRlcih7IGNvbnRleHQsIHByb2ZpbGUgfSwgbWFudWFsbHlBZGRlZCkpXG4gICAgICAgICAgICAuY2F0Y2goZXJyID0+IHtcbiAgICAgICAgICAgICAgY29uc3QgYWxsb3dSZXBvcnQgPSAhKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAmJiAoZXJyWydjb2RlJ10gIT09ICdFUEVSTScpO1xuICAgICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSB0byBsb2FkIG9yZGVyIGZpbGUnLCBlcnIsIHsgYWxsb3dSZXBvcnQgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmNhdGNoKGVyciA9PiB7XG4gICAgICAgICAgY29uc3QgdXNlckNhbmNlbGVkID0gKGVyciBpbnN0YW5jZW9mIHV0aWwuVXNlckNhbmNlbGVkKTtcbiAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byByZS1pbnN0YXRlIG1hbnVhbGx5IGFkZGVkIG1vZHMnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6ICF1c2VyQ2FuY2VsZWQgfSlcbiAgICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBjb250ZXh0LmFwaS5vbkFzeW5jKCdkaWQtZGVwbG95JywgKHByb2ZpbGVJZCwgZGVwbG95bWVudCkgPT4ge1xuICAgICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5wcm9maWxlQnlJZChzdGF0ZSwgcHJvZmlsZUlkKTtcbiAgICAgIGlmIChwcm9maWxlID09PSB1bmRlZmluZWQgfHwgcHJvZmlsZS5nYW1lSWQgIT09IEdBTUVfSUQpIHtcblxuICAgICAgICBpZiAocHJvZmlsZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgbG9nKCdlcnJvcicsICdwcm9maWxlIGRvZXMgbm90IGV4aXN0JywgcHJvZmlsZUlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgbG9hZE9yZGVyID0gc3RhdGUucGVyc2lzdGVudFsnbG9hZE9yZGVyJ10/Lltwcm9maWxlSWRdID8/IFtdO1xuICAgICAgY29uc3QgZGlzY292ZXJ5ID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3NldHRpbmdzJywgJ2dhbWVNb2RlJywgJ2Rpc2NvdmVyZWQnLCBwcm9maWxlLmdhbWVJZF0sIHVuZGVmaW5lZCk7XG5cbiAgICAgIGlmICgoZGlzY292ZXJ5ID09PSB1bmRlZmluZWQpIHx8IChkaXNjb3ZlcnkucGF0aCA9PT0gdW5kZWZpbmVkKSkge1xuICAgICAgICAvLyBzaG91bGQgbmV2ZXIgaGFwcGVuIGFuZCBpZiBpdCBkb2VzIGl0IHdpbGwgY2F1c2UgZXJyb3JzIGVsc2V3aGVyZSBhcyB3ZWxsXG4gICAgICAgIGxvZygnZXJyb3InLCAna2luZ2RvbWNvbWVkZWxpdmVyYW5jZSB3YXMgbm90IGRpc2NvdmVyZWQnKTtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBtb2RzRm9sZGVyID0gcGF0aC5qb2luKGRpc2NvdmVyeS5wYXRoLCBtb2RzUGF0aCgpKTtcbiAgICAgIGNvbnN0IG1vZE9yZGVyRmlsZSA9IHBhdGguam9pbihtb2RzRm9sZGVyLCBNT0RTX09SREVSX0ZJTEVOQU1FKTtcblxuICAgICAgcmV0dXJuIHJlZnJlc2hNb2RMaXN0KGNvbnRleHQsIGRpc2NvdmVyeS5wYXRoKVxuICAgICAgICAudGhlbigoKSA9PiB7XG4gICAgICAgICAgbGV0IG1pc3NpbmcgPSBsb2FkT3JkZXJcbiAgICAgICAgICAgIC5maWx0ZXIobW9kID0+ICFsaXN0SGFzTW9kKHRyYW5zZm9ybUlkKG1vZCksIF9NT0RTX1NUQVRFLmVuYWJsZWQpXG4gICAgICAgICAgICAgICAgICAgICAgICAmJiAhbGlzdEhhc01vZCh0cmFuc2Zvcm1JZChtb2QpLCBfTU9EU19TVEFURS5kaXNhYmxlZClcbiAgICAgICAgICAgICAgICAgICAgICAgICYmIGxpc3RIYXNNb2QodHJhbnNmb3JtSWQobW9kKSwgX01PRFNfU1RBVEUuZGlzcGxheSkpXG4gICAgICAgICAgICAubWFwKG1vZCA9PiB0cmFuc2Zvcm1JZChtb2QpKSB8fCBbXTtcblxuICAgICAgICAgIC8vIFRoaXMgaXMgdGhlb3JldGljYWxseSB1bmVjZXNzYXJ5IC0gYnV0IGl0IHdpbGwgZW5zdXJlIG5vIGR1cGxpY2F0ZXNcbiAgICAgICAgICAvLyAgYXJlIGFkZGVkLlxuICAgICAgICAgIG1pc3NpbmcgPSBbIC4uLm5ldyBTZXQobWlzc2luZykgXTtcbiAgICAgICAgICBjb25zdCB0cmFuc2Zvcm1lZCA9IFsgLi4uX01PRFNfU1RBVEUuZW5hYmxlZCwgLi4ubWlzc2luZyBdO1xuICAgICAgICAgIGNvbnN0IGxvVmFsdWUgPSAoaW5wdXQpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IGlkeCA9IGxvYWRPcmRlci5pbmRleE9mKGlucHV0KTtcbiAgICAgICAgICAgIHJldHVybiBpZHggIT09IC0xID8gaWR4IDogbG9hZE9yZGVyLmxlbmd0aDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBTb3J0XG4gICAgICAgICAgbGV0IHNvcnRlZCA9IHRyYW5zZm9ybWVkLmxlbmd0aCA+IDFcbiAgICAgICAgICAgID8gdHJhbnNmb3JtZWQuc29ydCgobGhzLCByaHMpID0+IGxvVmFsdWUobGhzKSAtIGxvVmFsdWUocmhzKSlcbiAgICAgICAgICAgIDogdHJhbnNmb3JtZWQ7XG5cbiAgICAgICAgICBzZXROZXdPcmRlcih7IGNvbnRleHQsIHByb2ZpbGUgfSwgc29ydGVkKTtcbiAgICAgICAgICByZXR1cm4gd3JpdGVPcmRlckZpbGUobW9kT3JkZXJGaWxlLCB0cmFuc2Zvcm1lZClcbiAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICBjb25zdCB1c2VyQ2FuY2VsZWQgPSAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpO1xuICAgICAgICAgICAgICBjb250ZXh0LmFwaS5zaG93RXJyb3JOb3RpZmljYXRpb24oJ0ZhaWxlZCB0byB3cml0ZSB0byBsb2FkIG9yZGVyIGZpbGUnLCBlcnIsIHsgYWxsb3dSZXBvcnQ6ICF1c2VyQ2FuY2VsZWQgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICB9KTtcbiAgfSk7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZSkge1xuICBjb25zdCBwcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICBjb25zdCBwcm9maWxlSWQgPSBwcm9maWxlPy5pZCB8fCAnJztcbiAgY29uc3QgZ2FtZUlkID0gcHJvZmlsZT8uZ2FtZUlkIHx8ICcnO1xuICByZXR1cm4ge1xuICAgIHByb2ZpbGUsXG4gICAgbW9kU3RhdGU6IHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJ10sIHt9KSxcbiAgICBtb2RzOiB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgZ2FtZUlkXSwgW10pLFxuICAgIG9yZGVyOiB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlSWRdLCBbXSksXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaCkge1xuICByZXR1cm4ge1xuICAgIG9uU2V0RGVwbG95bWVudE5lY2Vzc2FyeTogKGdhbWVJZCwgbmVjZXNzYXJ5KSA9PiBkaXNwYXRjaChhY3Rpb25zLnNldERlcGxveW1lbnROZWNlc3NhcnkoZ2FtZUlkLCBuZWNlc3NhcnkpKSxcbiAgICBvblNldE9yZGVyOiAocHJvZmlsZUlkLCBvcmRlcmVkKSA9PiBkaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlSWQsIG9yZGVyZWQpKSxcbiAgfTtcbn1cblxuY29uc3QgTG9hZE9yZGVyID0gY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIG1hcERpc3BhdGNoVG9Qcm9wcykoTG9hZE9yZGVyQmFzZSk7XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiBtYWluLFxufTtcbiJdfQ==