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
const path_1 = __importDefault(require("path"));
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
const React = __importStar(require("react"));
const actions_1 = require("./actions");
const reducers_1 = require("./reducers");
const common_1 = require("./common");
const loadOrder_1 = require("./loadOrder");
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const Settings_1 = __importDefault(require("./Settings"));
const STEAM_ID = '251570';
const STEAM_DLL = 'steamclient64.dll';
const ROOT_MOD_CANDIDATES = ['bepinex'];
function resetPrefixOffset(api) {
    var _a;
    const state = api.getState();
    const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
    if (profileId === undefined) {
        api.showErrorNotification('No active profile for 7dtd', undefined, { allowReport: false });
        return;
    }
    api.store.dispatch((0, actions_1.setPrefixOffset)(profileId, 0));
    const loadOrder = vortex_api_1.util.getSafe(api.getState(), ['persistent', 'loadOrder', profileId], []);
    const newLO = loadOrder.map((entry, idx) => (Object.assign(Object.assign({}, entry), { data: {
            prefix: (0, util_1.makePrefix)(idx),
        } })));
    api.store.dispatch(vortex_api_1.actions.setLoadOrder(profileId, newLO));
}
function setPrefixOffsetDialog(api) {
    return api.showDialog('question', 'Set New Prefix Offset', {
        text: api.translate('Insert new prefix offset for modlets (AAA-ZZZ):'),
        input: [
            {
                id: '7dtdprefixoffsetinput',
                label: 'Prefix Offset',
                type: 'text',
                placeholder: 'AAA',
            }
        ],
    }, [{ label: 'Cancel' }, { label: 'Set', default: true }])
        .then(result => {
        var _a;
        if (result.action === 'Set') {
            const prefix = result.input['7dtdprefixoffsetinput'];
            let offset = 0;
            try {
                offset = (0, util_1.reversePrefix)(prefix);
            }
            catch (err) {
                return Promise.reject(err);
            }
            const state = api.getState();
            const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
            if (profileId === undefined) {
                api.showErrorNotification('No active profile for 7dtd', undefined, { allowReport: false });
                return;
            }
            api.store.dispatch((0, actions_1.setPrefixOffset)(profileId, offset));
            const loadOrder = vortex_api_1.util.getSafe(api.getState(), ['persistent', 'loadOrder', profileId], []);
            const newLO = loadOrder.map(entry => (Object.assign(Object.assign({}, entry), { data: {
                    prefix: (0, util_1.makePrefix)((0, util_1.reversePrefix)(entry.data.prefix) + offset),
                } })));
            api.store.dispatch(vortex_api_1.actions.setLoadOrder(profileId, newLO));
        }
        return Promise.resolve();
    })
        .catch(err => {
        api.showErrorNotification('Failed to set prefix offset', err, { allowReport: false });
        return Promise.resolve();
    });
}
function findGame() {
    return __awaiter(this, void 0, void 0, function* () {
        return vortex_api_1.util.GameStoreHelper.findByAppId([STEAM_ID])
            .then(game => game.gamePath);
    });
}
function prepareForModding(context, discovery) {
    return __awaiter(this, void 0, void 0, function* () {
        const isUDFSet = vortex_api_1.util.getSafe(context.api.getState(), ['settings', '7daystodie', 'udf'], undefined) != null;
        return (!isUDFSet) ? (0, util_1.selectUDF)(context) : Promise.resolve();
    });
}
function installContent(files, destinationPath, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        const modFile = files.find(file => path_1.default.basename(file).toLowerCase() === common_1.MOD_INFO);
        const rootPath = path_1.default.dirname(modFile);
        return (0, util_1.getModName)(path_1.default.join(destinationPath, modFile))
            .then(modName => {
            modName = modName.replace(/[^a-zA-Z0-9]/g, '');
            const filtered = files.filter(filePath => filePath.startsWith(rootPath) && !filePath.endsWith(path_1.default.sep));
            const instructions = filtered.map(filePath => {
                return {
                    type: 'copy',
                    source: filePath,
                    destination: path_1.default.relative(rootPath, filePath),
                };
            });
            return Promise.resolve({ instructions });
        });
    });
}
function testSupportedContent(files, gameId) {
    const supported = (gameId === common_1.GAME_ID) &&
        (files.find(file => path_1.default.basename(file).toLowerCase() === common_1.MOD_INFO) !== undefined);
    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}
function findCandFile(files) {
    return files.find(file => file.toLowerCase().split(path_1.default.sep)
        .find(seg => ROOT_MOD_CANDIDATES.includes(seg)) !== undefined);
}
function hasCandidate(files) {
    const candidate = findCandFile(files);
    return candidate !== undefined;
}
function installRootMod(files, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        const filtered = files.filter(file => !file.endsWith(path_1.default.sep));
        const candidate = findCandFile(files);
        const candIdx = candidate.toLowerCase().split(path_1.default.sep)
            .findIndex(seg => ROOT_MOD_CANDIDATES.includes(seg));
        const instructions = filtered.reduce((accum, iter) => {
            accum.push({
                type: 'copy',
                source: iter,
                destination: iter.split(path_1.default.sep).slice(candIdx).join(path_1.default.sep),
            });
            return accum;
        }, []);
        return Promise.resolve({ instructions });
    });
}
function testRootMod(files, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.resolve({
            requiredFiles: [],
            supported: hasCandidate(files) && gameId === common_1.GAME_ID,
        });
    });
}
function toLOPrefix(context, mod) {
    var _a;
    const props = (0, util_1.genProps)(context);
    if (props === undefined) {
        return 'ZZZZ-' + mod.id;
    }
    const loadOrder = vortex_api_1.util.getSafe(props.state, ['persistent', 'loadOrder', props.profile.id], []);
    let loEntry = loadOrder.find(loEntry => loEntry.id === mod.id);
    if (loEntry === undefined) {
        const prev = vortex_api_1.util.getSafe(props.state, ['settings', '7daystodie', 'previousLO', props.profile.id], []);
        loEntry = prev.find(loEntry => loEntry.id === mod.id);
    }
    return (((_a = loEntry === null || loEntry === void 0 ? void 0 : loEntry.data) === null || _a === void 0 ? void 0 : _a.prefix) !== undefined)
        ? loEntry.data.prefix + '-' + mod.id
        : 'ZZZZ-' + mod.id;
}
function requiresLauncher(gamePath) {
    return vortex_api_1.fs.readdirAsync(gamePath)
        .then(files => (files.find(file => file.endsWith(STEAM_DLL)) !== undefined)
        ? Promise.resolve({ launcher: 'steam' })
        : Promise.resolve(undefined))
        .catch(err => Promise.reject(err));
}
function InfoPanel(props) {
    const { t, currentOffset } = props;
    return (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', padding: '16px' } },
        React.createElement("div", { style: { display: 'flex', whiteSpace: 'nowrap', alignItems: 'center' } },
            t('Current Prefix Offset: '),
            React.createElement("hr", null),
            React.createElement("label", { style: { color: 'red' } }, currentOffset)),
        React.createElement("hr", null),
        React.createElement("div", null, t('7 Days to Die loads mods in alphabetic order so Vortex prefixes '
            + 'the directory names with "AAA, AAB, AAC, ..." to ensure they load in the order you set here.'))));
}
function InfoPanelWrap(props) {
    const { api, profileId } = props;
    const currentOffset = (0, react_redux_1.useSelector)((state) => (0, util_1.makePrefix)(vortex_api_1.util.getSafe(state, ['settings', '7daystodie', 'prefixOffset', profileId], 0)));
    return (React.createElement(InfoPanel, { t: api.translate, currentOffset: currentOffset }));
}
function main(context) {
    context.registerReducer(['settings', '7daystodie'], reducers_1.reducer);
    context.registerGame({
        id: common_1.GAME_ID,
        name: '7 Days to Die',
        mergeMods: (mod) => toLOPrefix(context, mod),
        queryPath: (0, util_1.toBlue)(findGame),
        supportedTools: [],
        queryModPath: () => (0, util_1.getModsPath)(context.api),
        logo: 'gameart.jpg',
        executable: common_1.gameExecutable,
        requiredFiles: [],
        requiresLauncher,
        setup: (0, util_1.toBlue)((discovery) => prepareForModding(context, discovery)),
        environment: {
            SteamAPPId: STEAM_ID,
        },
        details: {
            steamAppId: +STEAM_ID,
            hashFiles: ['7DaysToDie_Data/Managed/Assembly-CSharp.dll'],
        },
    });
    context.registerLoadOrder({
        deserializeLoadOrder: () => (0, loadOrder_1.deserialize)(context),
        serializeLoadOrder: ((loadOrder, prev) => (0, loadOrder_1.serialize)(context, loadOrder, prev)),
        validate: loadOrder_1.validate,
        gameId: common_1.GAME_ID,
        toggleableEntries: false,
        usageInstructions: (() => {
            var _a;
            const state = context.api.getState();
            const profileId = (_a = vortex_api_1.selectors.activeProfile(state)) === null || _a === void 0 ? void 0 : _a.id;
            if (profileId === undefined) {
                return null;
            }
            return (React.createElement(InfoPanelWrap, { api: context.api, profileId: profileId }));
        }),
    });
    context.registerSettings('Mods', Settings_1.default, () => ({
        onSelectUDF: () => (0, util_1.selectUDF)(context).catch(() => null),
    }), () => {
        const state = context.api.getState();
        const activeGame = vortex_api_1.selectors.activeGameId(state);
        return activeGame === common_1.GAME_ID;
    });
    context.registerAction('fb-load-order-icons', 150, 'loot-sort', {}, 'Prefix Offset Assign', () => {
        setPrefixOffsetDialog(context.api);
    }, () => {
        const state = context.api.getState();
        const activeGame = vortex_api_1.selectors.activeGameId(state);
        return activeGame === common_1.GAME_ID;
    });
    context.registerAction('fb-load-order-icons', 150, 'loot-sort', {}, 'Prefix Offset Reset', () => {
        resetPrefixOffset(context.api);
    }, () => {
        const state = context.api.getState();
        const activeGame = vortex_api_1.selectors.activeGameId(state);
        return activeGame === common_1.GAME_ID;
    });
    const getOverhaulPath = (game) => {
        const state = context.api.getState();
        const discovery = vortex_api_1.selectors.discoveryByGame(state, common_1.GAME_ID);
        return discovery === null || discovery === void 0 ? void 0 : discovery.path;
    };
    context.registerInstaller('7dtd-mod', 25, (0, util_1.toBlue)(testSupportedContent), (0, util_1.toBlue)(installContent));
    context.registerInstaller('7dtd-root-mod', 20, (0, util_1.toBlue)(testRootMod), (0, util_1.toBlue)(installRootMod));
    context.registerModType('7dtd-root-mod', 20, (gameId) => gameId === common_1.GAME_ID, getOverhaulPath, (instructions) => {
        const candidateFound = hasCandidate(instructions
            .filter(instr => !!instr.destination)
            .map(instr => instr.destination));
        return Promise.resolve(candidateFound);
    }, { name: 'Root Directory Mod', mergeMods: true, deploymentEssential: false });
    context.registerMigration((0, util_1.toBlue)(old => (0, migrations_1.migrate020)(context.api, old)));
    context.registerMigration((0, util_1.toBlue)(old => (0, migrations_1.migrate100)(context, old)));
    context.registerMigration((0, util_1.toBlue)(old => (0, migrations_1.migrate1011)(context, old)));
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxnREFBd0I7QUFDeEIsNkNBQTBDO0FBQzFDLDJDQUFpRTtBQUVqRSw2Q0FBK0I7QUFFL0IsdUNBQTRDO0FBQzVDLHlDQUFxQztBQUVyQyxxQ0FBa0g7QUFDbEgsMkNBQStEO0FBQy9ELDZDQUFtRTtBQUVuRSxpQ0FBeUc7QUFDekcsMERBQWtDO0FBRWxDLE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUMxQixNQUFNLFNBQVMsR0FBRyxtQkFBbUIsQ0FBQztBQUV0QyxNQUFNLG1CQUFtQixHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7QUFFeEMsU0FBUyxpQkFBaUIsQ0FBQyxHQUF3Qjs7SUFDakQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzdCLE1BQU0sU0FBUyxHQUFHLE1BQUEsc0JBQVMsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLDBDQUFFLEVBQUUsQ0FBQztJQUNyRCxJQUFJLFNBQVMsS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUU1QixHQUFHLENBQUMscUJBQXFCLENBQUMsNEJBQTRCLEVBQUUsU0FBUyxFQUFFLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDM0YsT0FBTztJQUNULENBQUM7SUFFRCxHQUFHLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLHlCQUFlLEVBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbEQsTUFBTSxTQUFTLEdBQUcsaUJBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsWUFBWSxFQUFFLFdBQVcsRUFBRSxTQUFTLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUMzRixNQUFNLEtBQUss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QUFLLENBQUMsV0FBVyxDQUFDO2FBQ3BDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDO1FBQ3BDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQVEsQ0FBQztJQUNoRCxDQUFDLEVBQ0MsRUFBRSxJQUFJLEVBQUUsb0JBQW9CLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxtQkFBbUIsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBRWpGLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFBLGFBQU0sRUFBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUEsdUJBQVUsRUFBQyxPQUFPLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RSxPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFBLHVCQUFVLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNuRSxPQUFPLENBQUMsaUJBQWlCLENBQUMsSUFBQSxhQUFNLEVBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFBLHdCQUFXLEVBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVwRSxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2YsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgeyB1c2VTZWxlY3RvciB9IGZyb20gJ3JlYWN0LXJlZHV4JztcbmltcG9ydCB7IGFjdGlvbnMsIGZzLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcblxuaW1wb3J0IHsgc2V0UHJlZml4T2Zmc2V0IH0gZnJvbSAnLi9hY3Rpb25zJztcbmltcG9ydCB7IHJlZHVjZXIgfSBmcm9tICcuL3JlZHVjZXJzJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgZ2FtZUV4ZWN1dGFibGUsIE1PRF9JTkZPLCBsYXVuY2hlclNldHRpbmdzRmlsZVBhdGgsIERFRkFVTFRfTEFVTkNIRVJfU0VUVElOR1MgfSBmcm9tICcuL2NvbW1vbic7XG5pbXBvcnQgeyBkZXNlcmlhbGl6ZSwgc2VyaWFsaXplLCB2YWxpZGF0ZSB9IGZyb20gJy4vbG9hZE9yZGVyJztcbmltcG9ydCB7IG1pZ3JhdGUwMjAsIG1pZ3JhdGUxMDAsIG1pZ3JhdGUxMDExIH0gZnJvbSAnLi9taWdyYXRpb25zJztcbmltcG9ydCB7IElMb2FkT3JkZXJFbnRyeSwgSVByb3BzIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBnZW5Qcm9wcywgZ2V0TW9kTmFtZSwgZ2V0TW9kc1BhdGgsIG1ha2VQcmVmaXgsIHJldmVyc2VQcmVmaXgsIHNlbGVjdFVERiwgdG9CbHVlIH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCBTZXR0aW5ncyBmcm9tICcuL1NldHRpbmdzJztcblxuY29uc3QgU1RFQU1fSUQgPSAnMjUxNTcwJztcbmNvbnN0IFNURUFNX0RMTCA9ICdzdGVhbWNsaWVudDY0LmRsbCc7XG5cbmNvbnN0IFJPT1RfTU9EX0NBTkRJREFURVMgPSBbJ2JlcGluZXgnXTtcblxuZnVuY3Rpb24gcmVzZXRQcmVmaXhPZmZzZXQoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSB7XG4gIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XG4gIGNvbnN0IHByb2ZpbGVJZCA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKT8uaWQ7XG4gIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIEhvdyA/XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignTm8gYWN0aXZlIHByb2ZpbGUgZm9yIDdkdGQnLCB1bmRlZmluZWQsIHsgYWxsb3dSZXBvcnQ6IGZhbHNlIH0pO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGFwaS5zdG9yZS5kaXNwYXRjaChzZXRQcmVmaXhPZmZzZXQocHJvZmlsZUlkLCAwKSk7XG4gIGNvbnN0IGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShhcGkuZ2V0U3RhdGUoKSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGVJZF0sIFtdKTtcbiAgY29uc3QgbmV3TE8gPSBsb2FkT3JkZXIubWFwKChlbnRyeSwgaWR4KSA9PiAoe1xuICAgIC4uLmVudHJ5LFxuICAgIGRhdGE6IHtcbiAgICAgIHByZWZpeDogbWFrZVByZWZpeChpZHgpLFxuICAgIH0sXG4gIH0pKTtcbiAgYXBpLnN0b3JlLmRpc3BhdGNoKGFjdGlvbnMuc2V0TG9hZE9yZGVyKHByb2ZpbGVJZCwgbmV3TE8pKTtcbn1cblxuZnVuY3Rpb24gc2V0UHJlZml4T2Zmc2V0RGlhbG9nKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkge1xuICByZXR1cm4gYXBpLnNob3dEaWFsb2coJ3F1ZXN0aW9uJywgJ1NldCBOZXcgUHJlZml4IE9mZnNldCcsIHtcbiAgICB0ZXh0OiBhcGkudHJhbnNsYXRlKCdJbnNlcnQgbmV3IHByZWZpeCBvZmZzZXQgZm9yIG1vZGxldHMgKEFBQS1aWlopOicpLFxuICAgIGlucHV0OiBbXG4gICAgICB7XG4gICAgICAgIGlkOiAnN2R0ZHByZWZpeG9mZnNldGlucHV0JyxcbiAgICAgICAgbGFiZWw6ICdQcmVmaXggT2Zmc2V0JyxcbiAgICAgICAgdHlwZTogJ3RleHQnLFxuICAgICAgICBwbGFjZWhvbGRlcjogJ0FBQScsXG4gICAgICB9XSxcbiAgfSwgWyB7IGxhYmVsOiAnQ2FuY2VsJyB9LCB7IGxhYmVsOiAnU2V0JywgZGVmYXVsdDogdHJ1ZSB9IF0pXG4gIC50aGVuKHJlc3VsdCA9PiB7XG4gICAgaWYgKHJlc3VsdC5hY3Rpb24gPT09ICdTZXQnKSB7XG4gICAgICBjb25zdCBwcmVmaXggPSByZXN1bHQuaW5wdXRbJzdkdGRwcmVmaXhvZmZzZXRpbnB1dCddO1xuICAgICAgbGV0IG9mZnNldCA9IDA7XG4gICAgICB0cnkge1xuICAgICAgICBvZmZzZXQgPSByZXZlcnNlUHJlZml4KHByZWZpeCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgICBjb25zdCBzdGF0ZSA9IGFwaS5nZXRTdGF0ZSgpO1xuICAgICAgY29uc3QgcHJvZmlsZUlkID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpPy5pZDtcbiAgICAgIGlmIChwcm9maWxlSWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAvLyBIb3cgP1xuICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdObyBhY3RpdmUgcHJvZmlsZSBmb3IgN2R0ZCcsIHVuZGVmaW5lZCwgeyBhbGxvd1JlcG9ydDogZmFsc2UgfSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgYXBpLnN0b3JlLmRpc3BhdGNoKHNldFByZWZpeE9mZnNldChwcm9maWxlSWQsIG9mZnNldCkpO1xuICAgICAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKGFwaS5nZXRTdGF0ZSgpLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZUlkXSwgW10pO1xuICAgICAgY29uc3QgbmV3TE8gPSBsb2FkT3JkZXIubWFwKGVudHJ5ID0+ICh7XG4gICAgICAgIC4uLmVudHJ5LFxuICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgcHJlZml4OiBtYWtlUHJlZml4KHJldmVyc2VQcmVmaXgoZW50cnkuZGF0YS5wcmVmaXgpICsgb2Zmc2V0KSxcbiAgICAgICAgfSxcbiAgICAgIH0pKTtcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChhY3Rpb25zLnNldExvYWRPcmRlcihwcm9maWxlSWQsIG5ld0xPKSk7XG4gICAgfVxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfSlcbiAgLmNhdGNoKGVyciA9PiB7XG4gICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHNldCBwcmVmaXggb2Zmc2V0JywgZXJyLCB7IGFsbG93UmVwb3J0OiBmYWxzZSB9KTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBmaW5kR2FtZSgpIHtcbiAgcmV0dXJuIHV0aWwuR2FtZVN0b3JlSGVscGVyLmZpbmRCeUFwcElkKFtTVEVBTV9JRF0pXG4gICAgLnRoZW4oZ2FtZSA9PiBnYW1lLmdhbWVQYXRoKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcHJlcGFyZUZvck1vZGRpbmcoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNjb3Zlcnk6IHR5cGVzLklEaXNjb3ZlcnlSZXN1bHQpIHtcbiAgY29uc3QgaXNVREZTZXQgPSB1dGlsLmdldFNhZmUoY29udGV4dC5hcGkuZ2V0U3RhdGUoKSxcbiAgICBbJ3NldHRpbmdzJywgJzdkYXlzdG9kaWUnLCAndWRmJ10sIHVuZGVmaW5lZCkgIT0gbnVsbDtcbiAgcmV0dXJuICghaXNVREZTZXQpID8gc2VsZWN0VURGKGNvbnRleHQpIDogUHJvbWlzZS5yZXNvbHZlKCk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluc3RhbGxDb250ZW50KGZpbGVzOiBzdHJpbmdbXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uUGF0aDogc3RyaW5nLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XG4gIC8vIFRoZSBtb2RpbmZvLnhtbCBmaWxlIGlzIGV4cGVjdGVkIHRvIGFsd2F5cyBiZSBwb3NpdGlvbmVkIGluIHRoZSByb290IGRpcmVjdG9yeVxuICAvLyAgb2YgdGhlIG1vZCBpdHNlbGY7IHdlJ3JlIGdvaW5nIHRvIGRpc3JlZ2FyZCBhbnl0aGluZyBwbGFjZWQgb3V0c2lkZSB0aGUgcm9vdC5cbiAgY29uc3QgbW9kRmlsZSA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9JTkZPKTtcbiAgY29uc3Qgcm9vdFBhdGggPSBwYXRoLmRpcm5hbWUobW9kRmlsZSk7XG4gIHJldHVybiBnZXRNb2ROYW1lKHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIG1vZEZpbGUpKVxuICAgIC50aGVuKG1vZE5hbWUgPT4ge1xuICAgICAgbW9kTmFtZSA9IG1vZE5hbWUucmVwbGFjZSgvW15hLXpBLVowLTldL2csICcnKTtcblxuICAgICAgLy8gUmVtb3ZlIGRpcmVjdG9yaWVzIGFuZCBhbnl0aGluZyB0aGF0IGlzbid0IGluIHRoZSByb290UGF0aCAoYWxzbyBkaXJlY3RvcmllcykuXG4gICAgICBjb25zdCBmaWx0ZXJlZCA9IGZpbGVzLmZpbHRlcihmaWxlUGF0aCA9PlxuICAgICAgICBmaWxlUGF0aC5zdGFydHNXaXRoKHJvb3RQYXRoKSAmJiAhZmlsZVBhdGguZW5kc1dpdGgocGF0aC5zZXApKTtcblxuICAgICAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGZpbHRlcmVkLm1hcChmaWxlUGF0aCA9PiB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgdHlwZTogJ2NvcHknLFxuICAgICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgICAgZGVzdGluYXRpb246IHBhdGgucmVsYXRpdmUocm9vdFBhdGgsIGZpbGVQYXRoKSxcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiB0ZXN0U3VwcG9ydGVkQ29udGVudChmaWxlcywgZ2FtZUlkKSB7XG4gIC8vIE1ha2Ugc3VyZSB3ZSdyZSBhYmxlIHRvIHN1cHBvcnQgdGhpcyBtb2QuXG4gIGNvbnN0IHN1cHBvcnRlZCA9IChnYW1lSWQgPT09IEdBTUVfSUQpICYmXG4gICAgKGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9JTkZPKSAhPT0gdW5kZWZpbmVkKTtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgc3VwcG9ydGVkLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtdLFxuICB9KTtcbn1cblxuZnVuY3Rpb24gZmluZENhbmRGaWxlKGZpbGVzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gIHJldHVybiBmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKVxuICAgIC5maW5kKHNlZyA9PiBST09UX01PRF9DQU5ESURBVEVTLmluY2x1ZGVzKHNlZykpICE9PSB1bmRlZmluZWQpO1xufVxuXG5mdW5jdGlvbiBoYXNDYW5kaWRhdGUoZmlsZXM6IHN0cmluZ1tdKTogYm9vbGVhbiB7XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IGZpbmRDYW5kRmlsZShmaWxlcyk7XG4gIHJldHVybiBjYW5kaWRhdGUgIT09IHVuZGVmaW5lZDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5zdGFsbFJvb3RNb2QoZmlsZXM6IHN0cmluZ1tdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XG4gIGNvbnN0IGZpbHRlcmVkID0gZmlsZXMuZmlsdGVyKGZpbGUgPT4gIWZpbGUuZW5kc1dpdGgocGF0aC5zZXApKTtcbiAgY29uc3QgY2FuZGlkYXRlID0gZmluZENhbmRGaWxlKGZpbGVzKTtcbiAgY29uc3QgY2FuZElkeCA9IGNhbmRpZGF0ZS50b0xvd2VyQ2FzZSgpLnNwbGl0KHBhdGguc2VwKVxuICAgIC5maW5kSW5kZXgoc2VnID0+IFJPT1RfTU9EX0NBTkRJREFURVMuaW5jbHVkZXMoc2VnKSk7XG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBmaWx0ZXJlZC5yZWR1Y2UoKGFjY3VtLCBpdGVyKSA9PiB7XG4gICAgYWNjdW0ucHVzaCh7XG4gICAgICB0eXBlOiAnY29weScsXG4gICAgICBzb3VyY2U6IGl0ZXIsXG4gICAgICBkZXN0aW5hdGlvbjogaXRlci5zcGxpdChwYXRoLnNlcCkuc2xpY2UoY2FuZElkeCkuam9pbihwYXRoLnNlcCksXG4gICAgfSk7XG4gICAgcmV0dXJuIGFjY3VtO1xuICB9LCBbXSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHRlc3RSb290TW9kKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgcmVxdWlyZWRGaWxlczogW10sXG4gICAgc3VwcG9ydGVkOiBoYXNDYW5kaWRhdGUoZmlsZXMpICYmIGdhbWVJZCA9PT0gR0FNRV9JRCxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRvTE9QcmVmaXgoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIG1vZDogdHlwZXMuSU1vZCk6IHN0cmluZyB7XG4gIGNvbnN0IHByb3BzOiBJUHJvcHMgPSBnZW5Qcm9wcyhjb250ZXh0KTtcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gJ1paWlotJyArIG1vZC5pZDtcbiAgfVxuXG4gIC8vIFJldHJpZXZlIHRoZSBsb2FkIG9yZGVyIGFzIHN0b3JlZCBpbiBWb3J0ZXgncyBhcHBsaWNhdGlvbiBzdGF0ZS5cbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHByb3BzLnN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvcHMucHJvZmlsZS5pZF0sIFtdKTtcblxuICAvLyBGaW5kIHRoZSBtb2QgZW50cnkgaW4gdGhlIGxvYWQgb3JkZXIgc3RhdGUgYW5kIGluc2VydCB0aGUgcHJlZml4IGluIGZyb250XG4gIC8vICBvZiB0aGUgbW9kJ3MgbmFtZS9pZC93aGF0ZXZlclxuICBsZXQgbG9FbnRyeTogSUxvYWRPcmRlckVudHJ5ID0gbG9hZE9yZGVyLmZpbmQobG9FbnRyeSA9PiBsb0VudHJ5LmlkID09PSBtb2QuaWQpO1xuICBpZiAobG9FbnRyeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gVGhlIG1vZCBlbnRyeSB3YXNuJ3QgZm91bmQgaW4gdGhlIGxvYWQgb3JkZXIgc3RhdGUgLSB0aGlzIGlzIHBvdGVudGlhbGx5XG4gICAgLy8gIGR1ZSB0byB0aGUgbW9kIGJlaW5nIHJlbW92ZWQgYXMgcGFydCBvZiBhbiB1cGRhdGUgb3IgdW5pbnN0YWxsYXRpb24uXG4gICAgLy8gIEl0J3MgaW1wb3J0YW50IHdlIGZpbmQgdGhlIHByZWZpeCBvZiB0aGUgbW9kIGluIHRoaXMgY2FzZSwgYXMgdGhlIGRlcGxveW1lbnRcbiAgICAvLyAgbWV0aG9kIGNvdWxkIHBvdGVudGlhbGx5IGZhaWwgdG8gcmVtb3ZlIHRoZSBtb2QhIFdlJ3JlIGdvaW5nIHRvIGNoZWNrXG4gICAgLy8gIHRoZSBwcmV2aW91cyBsb2FkIG9yZGVyIHNhdmVkIGZvciB0aGlzIHByb2ZpbGUgYW5kIHVzZSB0aGF0IGlmIGl0IGV4aXN0cy5cbiAgICBjb25zdCBwcmV2ID0gdXRpbC5nZXRTYWZlKHByb3BzLnN0YXRlLCBbJ3NldHRpbmdzJywgJzdkYXlzdG9kaWUnLCAncHJldmlvdXNMTycsIHByb3BzLnByb2ZpbGUuaWRdLCBbXSk7XG4gICAgbG9FbnRyeSA9IHByZXYuZmluZChsb0VudHJ5ID0+IGxvRW50cnkuaWQgPT09IG1vZC5pZCk7XG4gIH1cblxuICByZXR1cm4gKGxvRW50cnk/LmRhdGE/LnByZWZpeCAhPT0gdW5kZWZpbmVkKVxuICAgID8gbG9FbnRyeS5kYXRhLnByZWZpeCArICctJyArIG1vZC5pZFxuICAgIDogJ1paWlotJyArIG1vZC5pZDtcbn1cblxuZnVuY3Rpb24gcmVxdWlyZXNMYXVuY2hlcihnYW1lUGF0aCkge1xuICByZXR1cm4gZnMucmVhZGRpckFzeW5jKGdhbWVQYXRoKVxuICAgIC50aGVuKGZpbGVzID0+IChmaWxlcy5maW5kKGZpbGUgPT4gZmlsZS5lbmRzV2l0aChTVEVBTV9ETEwpKSAhPT0gdW5kZWZpbmVkKVxuICAgICAgPyBQcm9taXNlLnJlc29sdmUoeyBsYXVuY2hlcjogJ3N0ZWFtJyB9KVxuICAgICAgOiBQcm9taXNlLnJlc29sdmUodW5kZWZpbmVkKSlcbiAgICAuY2F0Y2goZXJyID0+IFByb21pc2UucmVqZWN0KGVycikpO1xufVxuXG5mdW5jdGlvbiBJbmZvUGFuZWwocHJvcHMpIHtcbiAgY29uc3QgeyB0LCBjdXJyZW50T2Zmc2V0IH0gPSBwcm9wcztcblxuICByZXR1cm4gKFxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgcGFkZGluZzogJzE2cHgnIH19PlxuICAgICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIHdoaXRlU3BhY2U6ICdub3dyYXAnLCBhbGlnbkl0ZW1zOiAnY2VudGVyJyB9fT5cbiAgICAgICAge3QoJ0N1cnJlbnQgUHJlZml4IE9mZnNldDogJyl9XG4gICAgICAgIDxoci8+XG4gICAgICAgIDxsYWJlbCBzdHlsZT17eyBjb2xvcjogJ3JlZCcgfX0+e2N1cnJlbnRPZmZzZXR9PC9sYWJlbD5cbiAgICAgIDwvZGl2PlxuICAgICAgPGhyLz5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KCc3IERheXMgdG8gRGllIGxvYWRzIG1vZHMgaW4gYWxwaGFiZXRpYyBvcmRlciBzbyBWb3J0ZXggcHJlZml4ZXMgJ1xuICAgICAgICAgKyAndGhlIGRpcmVjdG9yeSBuYW1lcyB3aXRoIFwiQUFBLCBBQUIsIEFBQywgLi4uXCIgdG8gZW5zdXJlIHRoZXkgbG9hZCBpbiB0aGUgb3JkZXIgeW91IHNldCBoZXJlLicpfVxuICAgICAgPC9kaXY+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmZ1bmN0aW9uIEluZm9QYW5lbFdyYXAocHJvcHM6IHsgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwcm9maWxlSWQ6IHN0cmluZyB9KSB7XG4gIGNvbnN0IHsgYXBpLCBwcm9maWxlSWQgfSA9IHByb3BzO1xuICBjb25zdCBjdXJyZW50T2Zmc2V0ID0gdXNlU2VsZWN0b3IoKHN0YXRlOiB0eXBlcy5JU3RhdGUpID0+XG4gICAgbWFrZVByZWZpeCh1dGlsLmdldFNhZmUoc3RhdGUsXG4gICAgICBbJ3NldHRpbmdzJywgJzdkYXlzdG9kaWUnLCAncHJlZml4T2Zmc2V0JywgcHJvZmlsZUlkXSwgMCkpKTtcblxuICByZXR1cm4gKFxuICAgIDxJbmZvUGFuZWxcbiAgICAgIHQ9e2FwaS50cmFuc2xhdGV9XG4gICAgICBjdXJyZW50T2Zmc2V0PXtjdXJyZW50T2Zmc2V0fVxuICAgIC8+XG4gICk7XG59XG5cbmZ1bmN0aW9uIG1haW4oY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQpIHtcbiAgY29udGV4dC5yZWdpc3RlclJlZHVjZXIoWydzZXR0aW5ncycsICc3ZGF5c3RvZGllJ10sIHJlZHVjZXIpO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcbiAgICBpZDogR0FNRV9JRCxcbiAgICBuYW1lOiAnNyBEYXlzIHRvIERpZScsXG4gICAgbWVyZ2VNb2RzOiAobW9kKSA9PiB0b0xPUHJlZml4KGNvbnRleHQsIG1vZCksXG4gICAgcXVlcnlQYXRoOiB0b0JsdWUoZmluZEdhbWUpLFxuICAgIHN1cHBvcnRlZFRvb2xzOiBbXSxcbiAgICBxdWVyeU1vZFBhdGg6ICgpID0+IGdldE1vZHNQYXRoKGNvbnRleHQuYXBpKSxcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxuICAgIGV4ZWN1dGFibGU6IGdhbWVFeGVjdXRhYmxlLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICBdLFxuICAgIHJlcXVpcmVzTGF1bmNoZXIsXG4gICAgc2V0dXA6IHRvQmx1ZSgoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpKSxcbiAgICBlbnZpcm9ubWVudDoge1xuICAgICAgU3RlYW1BUFBJZDogU1RFQU1fSUQsXG4gICAgfSxcbiAgICBkZXRhaWxzOiB7XG4gICAgICBzdGVhbUFwcElkOiArU1RFQU1fSUQsXG4gICAgICBoYXNoRmlsZXM6IFsnN0RheXNUb0RpZV9EYXRhL01hbmFnZWQvQXNzZW1ibHktQ1NoYXJwLmRsbCddLFxuICAgIH0sXG4gIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJMb2FkT3JkZXIoe1xuICAgIGRlc2VyaWFsaXplTG9hZE9yZGVyOiAoKSA9PiBkZXNlcmlhbGl6ZShjb250ZXh0KSxcbiAgICBzZXJpYWxpemVMb2FkT3JkZXI6ICgobG9hZE9yZGVyLCBwcmV2KSA9PiBzZXJpYWxpemUoY29udGV4dCwgbG9hZE9yZGVyLCBwcmV2KSkgYXMgYW55LFxuICAgIHZhbGlkYXRlLFxuICAgIGdhbWVJZDogR0FNRV9JRCxcbiAgICB0b2dnbGVhYmxlRW50cmllczogZmFsc2UsXG4gICAgdXNhZ2VJbnN0cnVjdGlvbnM6ICgoKSA9PiB7XG4gICAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gICAgICBjb25zdCBwcm9maWxlSWQgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk/LmlkO1xuICAgICAgaWYgKHByb2ZpbGVJZCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgICAgfVxuICAgICAgcmV0dXJuIChcbiAgICAgICAgPEluZm9QYW5lbFdyYXAgYXBpPXtjb250ZXh0LmFwaX0gcHJvZmlsZUlkPXtwcm9maWxlSWR9IC8+XG4gICAgICApO1xuICAgIH0pIGFzIGFueSxcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlclNldHRpbmdzKCdNb2RzJywgU2V0dGluZ3MsICgpID0+ICh7XG4gICAgb25TZWxlY3RVREY6ICgpID0+IHNlbGVjdFVERihjb250ZXh0KS5jYXRjaCgoKSA9PiBudWxsKSxcbiAgfSksICgpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgYWN0aXZlR2FtZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xuICAgIHJldHVybiBhY3RpdmVHYW1lID09PSBHQU1FX0lEO1xuICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTUwLCAnbG9vdC1zb3J0Jywge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ1ByZWZpeCBPZmZzZXQgQXNzaWduJywgKCkgPT4ge1xuICAgIHNldFByZWZpeE9mZnNldERpYWxvZyhjb250ZXh0LmFwaSk7XG4gIH0sICgpID0+IHtcbiAgICBjb25zdCBzdGF0ZSA9IGNvbnRleHQuYXBpLmdldFN0YXRlKCk7XG4gICAgY29uc3QgYWN0aXZlR2FtZSA9IHNlbGVjdG9ycy5hY3RpdmVHYW1lSWQoc3RhdGUpO1xuICAgIHJldHVybiBhY3RpdmVHYW1lID09PSBHQU1FX0lEO1xuICB9KTtcblxuICBjb250ZXh0LnJlZ2lzdGVyQWN0aW9uKCdmYi1sb2FkLW9yZGVyLWljb25zJywgMTUwLCAnbG9vdC1zb3J0Jywge30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgJ1ByZWZpeCBPZmZzZXQgUmVzZXQnLCAoKSA9PiB7XG4gICAgcmVzZXRQcmVmaXhPZmZzZXQoY29udGV4dC5hcGkpO1xuICB9LCAoKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGFjdGl2ZUdhbWUgPSBzZWxlY3RvcnMuYWN0aXZlR2FtZUlkKHN0YXRlKTtcbiAgICByZXR1cm4gYWN0aXZlR2FtZSA9PT0gR0FNRV9JRDtcbiAgfSk7XG5cbiAgY29uc3QgZ2V0T3ZlcmhhdWxQYXRoID0gKGdhbWU6IHR5cGVzLklHYW1lKSA9PiB7XG4gICAgY29uc3Qgc3RhdGUgPSBjb250ZXh0LmFwaS5nZXRTdGF0ZSgpO1xuICAgIGNvbnN0IGRpc2NvdmVyeSA9IHNlbGVjdG9ycy5kaXNjb3ZlcnlCeUdhbWUoc3RhdGUsIEdBTUVfSUQpO1xuICAgIHJldHVybiBkaXNjb3Zlcnk/LnBhdGg7XG4gIH07XG5cbiAgY29udGV4dC5yZWdpc3Rlckluc3RhbGxlcignN2R0ZC1tb2QnLCAyNSxcbiAgICB0b0JsdWUodGVzdFN1cHBvcnRlZENvbnRlbnQpLCB0b0JsdWUoaW5zdGFsbENvbnRlbnQpKTtcblxuICBjb250ZXh0LnJlZ2lzdGVySW5zdGFsbGVyKCc3ZHRkLXJvb3QtbW9kJywgMjAsIHRvQmx1ZSh0ZXN0Um9vdE1vZCksIHRvQmx1ZShpbnN0YWxsUm9vdE1vZCkpO1xuICBjb250ZXh0LnJlZ2lzdGVyTW9kVHlwZSgnN2R0ZC1yb290LW1vZCcsIDIwLCAoZ2FtZUlkKSA9PiBnYW1lSWQgPT09IEdBTUVfSUQsXG4gICAgZ2V0T3ZlcmhhdWxQYXRoLCAoaW5zdHJ1Y3Rpb25zKSA9PiB7XG4gICAgICBjb25zdCBjYW5kaWRhdGVGb3VuZCA9IGhhc0NhbmRpZGF0ZShpbnN0cnVjdGlvbnNcbiAgICAgICAgLmZpbHRlcihpbnN0ciA9PiAhIWluc3RyLmRlc3RpbmF0aW9uKVxuICAgICAgICAubWFwKGluc3RyID0+IGluc3RyLmRlc3RpbmF0aW9uKSk7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNhbmRpZGF0ZUZvdW5kKSBhcyBhbnk7XG4gICAgfSxcbiAgICAgIHsgbmFtZTogJ1Jvb3QgRGlyZWN0b3J5IE1vZCcsIG1lcmdlTW9kczogdHJ1ZSwgZGVwbG95bWVudEVzc2VudGlhbDogZmFsc2UgfSk7XG5cbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbih0b0JsdWUob2xkID0+IG1pZ3JhdGUwMjAoY29udGV4dC5hcGksIG9sZCkpKTtcbiAgY29udGV4dC5yZWdpc3Rlck1pZ3JhdGlvbih0b0JsdWUob2xkID0+IG1pZ3JhdGUxMDAoY29udGV4dCwgb2xkKSkpO1xuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKHRvQmx1ZShvbGQgPT4gbWlncmF0ZTEwMTEoY29udGV4dCwgb2xkKSkpO1xuXG4gIHJldHVybiB0cnVlO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZGVmYXVsdDogbWFpbixcbn07XG4iXX0=