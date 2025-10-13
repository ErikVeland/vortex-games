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
exports.InfoPanelWrap = InfoPanelWrap;
const React = __importStar(require("react"));
const vortex_api_1 = require("vortex-api");
const react_bootstrap_1 = require("react-bootstrap");
const react_redux_1 = require("react-redux");
const util_1 = require("./util");
const actions_1 = require("./actions");
const common_1 = require("./common");
function InfoPanelWrap(props) {
    const { api, getOwnGameVersion, readStoredLO, installLSLib, getLatestLSLibMod } = props;
    const currentProfile = (0, react_redux_1.useSelector)((state) => { var _a; return (_a = state.settings['baldursgate3']) === null || _a === void 0 ? void 0 : _a.playerProfile; });
    const [gameVersion, setGameVersion] = React.useState();
    React.useEffect(() => {
        (() => __awaiter(this, void 0, void 0, function* () {
            if (!gameVersion) {
                setGameVersion(yield getOwnGameVersion(api.getState()));
            }
        }))();
    }, [gameVersion, setGameVersion]);
    const onSetProfile = React.useCallback((profileName) => {
        const impl = () => __awaiter(this, void 0, void 0, function* () {
            api.store.dispatch((0, actions_1.setPlayerProfile)(profileName));
            try {
                yield readStoredLO(api);
            }
            catch (err) {
                api.showErrorNotification('Failed to read load order', err, {
                    message: 'Please run the game before you start modding',
                    allowReport: false,
                });
            }
            (0, util_1.forceRefresh)(api);
        });
        impl();
    }, [api]);
    const isLsLibInstalled = React.useCallback(() => {
        return getLatestLSLibMod(api) !== undefined;
    }, [api]);
    const onInstallLSLib = React.useCallback(() => {
        installLSLib(api, common_1.GAME_ID);
    }, [api]);
    if (!gameVersion) {
        return null;
    }
    return (React.createElement(InfoPanel, { t: api.translate, gameVersion: gameVersion, currentProfile: currentProfile, onSetPlayerProfile: onSetProfile, isLsLibInstalled: isLsLibInstalled, onInstallLSLib: onInstallLSLib }));
}
function InfoPanel(props) {
    const { t, onInstallLSLib, isLsLibInstalled } = props;
    return isLsLibInstalled() ? (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px', marginRight: '16px' } },
        React.createElement(react_bootstrap_1.Alert, { bsStyle: 'warning', style: { display: 'flex', flexDirection: 'column', gap: '8px' } },
            React.createElement("div", null,
                t('To successfully switch between different game versions/patches please follow these steps:'),
                React.createElement("ul", null,
                    React.createElement("li", null, t('Purge your mods')),
                    React.createElement("li", null, t('Run the game so that the modsettings.lsx file gets reset to the default values')),
                    React.createElement("li", null, t('Close the game')),
                    React.createElement("li", null, t('Deploy your mods')),
                    React.createElement("li", null, t('Run the game again - your load order will be maintained'))))),
        React.createElement("div", null, t(`A backup is made of the game's modsettings.lsx file before anything is changed.
        This can be found at %APPDATA%\\Local\\Larian Studios\\Baldur's Gate 3\\PlayerProfiles\\Public\\modsettings.lsx.backup`)),
        React.createElement("div", null, t(`Drag and Drop PAK files to reorder how the game loads them. Please note, some mods contain multiple PAK files.`)),
        React.createElement("div", null, t(`Mod descriptions from mod authors may have information to determine the best order.`)),
        React.createElement("div", null, t(`Some mods may be locked in this list because they are loaded differently by the game and can therefore not be load-ordered by mod managers. 
        If you need to disable such a mod, please do so in Vortex\'s Mods page.`)),
        React.createElement("h4", { style: { margin: 0 } }, t('Import and Export')),
        React.createElement("div", null, t(`Import is an experimental tool to help migration from a game load order (.lsx file) to Vortex. It works by importing the game's modsettings file
        and attempts to match up mods that have been installed by Vortex.`)),
        React.createElement("div", null, t(`Export can be used to manually update the game's modsettings.lsx file if 'Settings > Mods > Auto export load order' isn't set to do this automatically. 
        It can also be used to export to a different file as a backup.`)),
        React.createElement("h4", { style: { margin: 0 } }, t('Import from Baldur\'s Gate 3 Mod Manager')),
        React.createElement("div", null, t('Vortex can sort your load order based on a BG3MM .json load order file. Any mods that are not installed through Vortex will be ignored.')),
        React.createElement("div", null, t('Please note that any mods that are not present in the BG3MM load order file will be placed at the bottom of the load order.')))) : (React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
        React.createElement("h4", { style: { margin: 0 } }, t('LSLib is not installed')),
        React.createElement("div", null, t('To take full advantage of Vortex\'s Baldur\s Gate 3 modding capabilities such as managing the '
            + 'order in which mods are loaded into the game; Vortex requires a 3rd party tool called LSLib.')),
        React.createElement("div", null, t('Please install the library using the buttons below to manage your load order.')),
        React.createElement(vortex_api_1.tooltip.Button, { tooltip: 'Install LSLib', onClick: onInstallLSLib }, t('Install LSLib'))));
}
function mapDispatchToProps(dispatch) {
    return {
        onSetProfile: (profile) => dispatch((0, actions_1.setPlayerProfile)(profile)),
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5mb1BhbmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW5mb1BhbmVsLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTJCQSxzQ0F1REM7QUFoRkQsNkNBQStCO0FBQy9CLDJDQUE0QztBQUU1QyxxREFBd0M7QUFDeEMsNkNBQTBDO0FBRzFDLGlDQUFzQztBQUd0Qyx1Q0FBNkM7QUFDN0MscUNBQW1DO0FBY25DLFNBQWdCLGFBQWEsQ0FBQyxLQUFpQjtJQUM3QyxNQUFNLEVBQUUsR0FBRyxFQUFFLGlCQUFpQixFQUFFLFlBQVksRUFDMUMsWUFBWSxFQUFFLGlCQUFpQixFQUFFLEdBQUcsS0FBSyxDQUFDO0lBRTVDLE1BQU0sY0FBYyxHQUFHLElBQUEseUJBQVcsRUFBQyxDQUFDLEtBQW1CLEVBQUUsRUFBRSxXQUN6RCxPQUFBLE1BQUEsS0FBSyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsMENBQUUsYUFBYSxDQUFBLEVBQUEsQ0FBQyxDQUFDO0lBRWpELE1BQU0sQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBVSxDQUFDO0lBRS9ELEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFO1FBQ25CLENBQUMsR0FBUyxFQUFFO1lBQ1YsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2dCQUNqQixjQUFjLENBQUMsTUFBTSxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQzFELENBQUM7UUFDSCxDQUFDLENBQUEsQ0FBQyxFQUFFLENBQUM7SUFDUCxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUVsQyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBbUIsRUFBRSxFQUFFO1FBQzdELE1BQU0sSUFBSSxHQUFHLEdBQVMs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QUMrRCxDQUFDLENBQy9EO1FBQ04saUNBQ0csQ0FBQyxDQUFDO3VFQUM0RCxDQUFDLENBQzVEO1FBQ04sNEJBQUksS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUNyQixDQUFDLENBQUMsMENBQTBDLENBQUMsQ0FDM0M7UUFDTCxpQ0FDRyxDQUFDLENBQUMseUlBQXlJLENBQUMsQ0FDekk7UUFDTixpQ0FDRyxDQUFDLENBQUMsNkhBQTZILENBQUMsQ0FDN0gsQ0FFRixDQUNQLENBQUMsQ0FBQyxDQUFDLENBQ0YsNkJBQUssS0FBSyxFQUFFLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUU7UUFDbkUsNEJBQUksS0FBSyxFQUFFLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUNyQixDQUFDLENBQUMsd0JBQXdCLENBQUMsQ0FDekI7UUFDTCxpQ0FDRyxDQUFDLENBQUMsZ0dBQWdHO2NBQy9GLDhGQUE4RixDQUFDLENBQy9GO1FBQ04saUNBQ0csQ0FBQyxDQUFDLCtFQUErRSxDQUFDLENBQy9FO1FBQ04sb0JBQUMsb0JBQU8sQ0FBQyxNQUFNLElBQ2IsT0FBTyxFQUFFLGVBQWUsRUFDeEIsT0FBTyxFQUFFLGNBQWMsSUFFdEIsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUNKLENBQ2IsQ0FDUCxDQUFDO0FBQ0osQ0FBQztBQVFELFNBQVMsa0JBQWtCLENBQUMsUUFBK0M7SUFDekUsT0FBTztRQUNMLFlBQVksRUFBRSxDQUFDLE9BQWUsRUFBRSxFQUFFLENBQUMsUUFBUSxDQUFDLElBQUEsMEJBQWdCLEVBQUMsT0FBTyxDQUFDLENBQUM7S0FDdkUsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tICcuLi8uLi8uLi9zcmMvdXRpbC9wbGF0Zm9ybSc7XG4vKiBlc2xpbnQtZGlzYWJsZSAqL1xuaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgdHlwZXMsIHRvb2x0aXAgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgQWxlcnQgfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xuaW1wb3J0IHsgdXNlU2VsZWN0b3IgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5pbXBvcnQgKiBhcyBSZWR1eCBmcm9tICdyZWR1eCc7XG5cbmltcG9ydCB7IGZvcmNlUmVmcmVzaCB9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQgeyBUaHVua0Rpc3BhdGNoIH0gZnJvbSAncmVkdXgtdGh1bmsnO1xuXG5pbXBvcnQgeyBzZXRQbGF5ZXJQcm9maWxlIH0gZnJvbSAnLi9hY3Rpb25zJztcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XG5cbmludGVyZmFjZSBJQmFzZVByb3BzIHtcbiAgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xuICBnZXRPd25HYW1lVmVyc2lvbjogKHN0YXRlOiB0eXBlcy5JU3RhdGUpID0+IFByb21pc2U8c3RyaW5nPjtcbiAgcmVhZFN0b3JlZExPOiAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpKSA9PiBQcm9taXNlPHZvaWQ+O1xuICBpbnN0YWxsTFNMaWI6IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGdhbWVJZDogc3RyaW5nKSA9PiBQcm9taXNlPHZvaWQ+O1xuICBnZXRMYXRlc3RMU0xpYk1vZDogKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4gdHlwZXMuSU1vZDtcbn1cblxuaW50ZXJmYWNlIElBY3Rpb25Qcm9wcyB7XG4gIG9uU2V0UHJvZmlsZTogKHByb2ZpbGVOYW1lOiBzdHJpbmcpID0+IHZvaWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBJbmZvUGFuZWxXcmFwKHByb3BzOiBJQmFzZVByb3BzKSB7XG4gIGNvbnN0IHsgYXBpLCBnZXRPd25HYW1lVmVyc2lvbiwgcmVhZFN0b3JlZExPLFxuICAgIGluc3RhbGxMU0xpYiwgZ2V0TGF0ZXN0TFNMaWJNb2QgfSA9IHByb3BzO1xuXG4gIGNvbnN0IGN1cnJlbnRQcm9maWxlID0gdXNlU2VsZWN0b3IoKHN0YXRlOiB0eXBlcy5JU3RhdGUpID0+XG4gICAgc3RhdGUuc2V0dGluZ3NbJ2JhbGR1cnNnYXRlMyddPy5wbGF5ZXJQcm9maWxlKTtcblxuICBjb25zdCBbZ2FtZVZlcnNpb24sIHNldEdhbWVWZXJzaW9uXSA9IFJlYWN0LnVzZVN0YXRlPHN0cmluZz4oKTtcblxuICBSZWFjdC51c2VFZmZlY3QoKCkgPT4ge1xuICAgIChhc3luYyAoKSA9PiB7XG4gICAgICBpZiAoIWdhbWVWZXJzaW9uKSB7XG4gICAgICAgIHNldEdhbWVWZXJzaW9uKGF3YWl0IGdldE93bkdhbWVWZXJzaW9uKGFwaS5nZXRTdGF0ZSgpKSk7XG4gICAgICB9XG4gICAgfSkoKTtcbiAgfSwgW2dhbWVWZXJzaW9uLCBzZXRHYW1lVmVyc2lvbl0pO1xuXG4gIGNvbnN0IG9uU2V0UHJvZmlsZSA9IFJlYWN0LnVzZUNhbGxiYWNrKChwcm9maWxlTmFtZTogc3RyaW5nKSA9PiB7XG4gICAgY29uc3QgaW1wbCA9IGFzeW5jICgpID0+IHtcbiAgICAgIGFwaS5zdG9yZS5kaXNwYXRjaChzZXRQbGF5ZXJQcm9maWxlKHByb2ZpbGVOYW1lKSk7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCByZWFkU3RvcmVkTE8oYXBpKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdGYWlsZWQgdG8gcmVhZCBsb2FkIG9yZGVyJywgZXJyLCB7XG4gICAgICAgICAgbWVzc2FnZTogJ1BsZWFzZSBydW4gdGhlIGdhbWUgYmVmb3JlIHlvdSBzdGFydCBtb2RkaW5nJyxcbiAgICAgICAgICBhbGxvd1JlcG9ydDogZmFsc2UsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgZm9yY2VSZWZyZXNoKGFwaSk7XG4gICAgfTtcbiAgICBpbXBsKCk7XG4gIH0sIFthcGldKTtcblxuICBjb25zdCBpc0xzTGliSW5zdGFsbGVkID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIHJldHVybiBnZXRMYXRlc3RMU0xpYk1vZChhcGkpICE9PSB1bmRlZmluZWQ7XG4gIH0sIFthcGldKTtcblxuICBjb25zdCBvbkluc3RhbGxMU0xpYiA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBpbnN0YWxsTFNMaWIoYXBpLCBHQU1FX0lEKTtcbiAgfSwgW2FwaV0pO1xuXG4gIGlmICghZ2FtZVZlcnNpb24pIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEluZm9QYW5lbFxuICAgICAgdD17YXBpLnRyYW5zbGF0ZX1cbiAgICAgIGdhbWVWZXJzaW9uPXtnYW1lVmVyc2lvbn1cbiAgICAgIGN1cnJlbnRQcm9maWxlPXtjdXJyZW50UHJvZmlsZX1cbiAgICAgIG9uU2V0UGxheWVyUHJvZmlsZT17b25TZXRQcm9maWxlfVxuICAgICAgaXNMc0xpYkluc3RhbGxlZD17aXNMc0xpYkluc3RhbGxlZH1cbiAgICAgIG9uSW5zdGFsbExTTGliPXtvbkluc3RhbGxMU0xpYn1cbiAgICAvPlxuICApO1xufVxuXG5mdW5jdGlvbiBJbmZvUGFuZWwocHJvcHM6IGFueSkge1xuICBjb25zdCB7IHQsIG9uSW5zdGFsbExTTGliLCBpc0xzTGliSW5zdGFsbGVkIH0gPSBwcm9wcztcblxuICByZXR1cm4gaXNMc0xpYkluc3RhbGxlZCgpID8gKFxuICAgIDxkaXYgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAnMTJweCcsIG1hcmdpblJpZ2h0OiAnMTZweCcgfX0+XG4gICAgICA8QWxlcnQgYnNTdHlsZT0nd2FybmluZycgc3R5bGU9e3sgZGlzcGxheTogJ2ZsZXgnLCBmbGV4RGlyZWN0aW9uOiAnY29sdW1uJywgZ2FwOiAnOHB4JyB9fT5cbiAgICAgICAgPGRpdj5cbiAgICAgICAgICB7dCgnVG8gc3VjY2Vzc2Z1bGx5IHN3aXRjaCBiZXR3ZWVuIGRpZmZlcmVudCBnYW1lIHZlcnNpb25zL3BhdGNoZXMgcGxlYXNlIGZvbGxvdyB0aGVzZSBzdGVwczonKX1cbiAgICAgICAgICA8dWw+XG4gICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgIHt0KCdQdXJnZSB5b3VyIG1vZHMnKX1cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgIHt0KCdSdW4gdGhlIGdhbWUgc28gdGhhdCB0aGUgbW9kc2V0dGluZ3MubHN4IGZpbGUgZ2V0cyByZXNldCB0byB0aGUgZGVmYXVsdCB2YWx1ZXMnKX1cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgIHt0KCdDbG9zZSB0aGUgZ2FtZScpfVxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICAgIDxsaT5cbiAgICAgICAgICAgICAge3QoJ0RlcGxveSB5b3VyIG1vZHMnKX1cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgIHt0KCdSdW4gdGhlIGdhbWUgYWdhaW4gLSB5b3VyIGxvYWQgb3JkZXIgd2lsbCBiZSBtYWludGFpbmVkJyl9XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgIDwvdWw+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9BbGVydD5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KGBBIGJhY2t1cCBpcyBtYWRlIG9mIHRoZSBnYW1lJ3MgbW9kc2V0dGluZ3MubHN4IGZpbGUgYmVmb3JlIGFueXRoaW5nIGlzIGNoYW5nZWQuXG4gICAgICAgIFRoaXMgY2FuIGJlIGZvdW5kIGF0ICVBUFBEQVRBJVxcXFxMb2NhbFxcXFxMYXJpYW4gU3R1ZGlvc1xcXFxCYWxkdXIncyBHYXRlIDNcXFxcUGxheWVyUHJvZmlsZXNcXFxcUHVibGljXFxcXG1vZHNldHRpbmdzLmxzeC5iYWNrdXBgKX1cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdj5cbiAgICAgICAge3QoYERyYWcgYW5kIERyb3AgUEFLIGZpbGVzIHRvIHJlb3JkZXIgaG93IHRoZSBnYW1lIGxvYWRzIHRoZW0uIFBsZWFzZSBub3RlLCBzb21lIG1vZHMgY29udGFpbiBtdWx0aXBsZSBQQUsgZmlsZXMuYCl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KGBNb2QgZGVzY3JpcHRpb25zIGZyb20gbW9kIGF1dGhvcnMgbWF5IGhhdmUgaW5mb3JtYXRpb24gdG8gZGV0ZXJtaW5lIHRoZSBiZXN0IG9yZGVyLmApfVxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2PlxuICAgICAgICB7dChgU29tZSBtb2RzIG1heSBiZSBsb2NrZWQgaW4gdGhpcyBsaXN0IGJlY2F1c2UgdGhleSBhcmUgbG9hZGVkIGRpZmZlcmVudGx5IGJ5IHRoZSBnYW1lIGFuZCBjYW4gdGhlcmVmb3JlIG5vdCBiZSBsb2FkLW9yZGVyZWQgYnkgbW9kIG1hbmFnZXJzLiBcbiAgICAgICAgSWYgeW91IG5lZWQgdG8gZGlzYWJsZSBzdWNoIGEgbW9kLCBwbGVhc2UgZG8gc28gaW4gVm9ydGV4XFwncyBNb2RzIHBhZ2UuYCl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxoNCBzdHlsZT17eyBtYXJnaW46IDAgfX0+XG4gICAgICAgIHt0KCdJbXBvcnQgYW5kIEV4cG9ydCcpfVxuICAgICAgPC9oND5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KGBJbXBvcnQgaXMgYW4gZXhwZXJpbWVudGFsIHRvb2wgdG8gaGVscCBtaWdyYXRpb24gZnJvbSBhIGdhbWUgbG9hZCBvcmRlciAoLmxzeCBmaWxlKSB0byBWb3J0ZXguIEl0IHdvcmtzIGJ5IGltcG9ydGluZyB0aGUgZ2FtZSdzIG1vZHNldHRpbmdzIGZpbGVcbiAgICAgICAgYW5kIGF0dGVtcHRzIHRvIG1hdGNoIHVwIG1vZHMgdGhhdCBoYXZlIGJlZW4gaW5zdGFsbGVkIGJ5IFZvcnRleC5gKX1cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdj5cbiAgICAgICAge3QoYEV4cG9ydCBjYW4gYmUgdXNlZCB0byBtYW51YWxseSB1cGRhdGUgdGhlIGdhbWUncyBtb2RzZXR0aW5ncy5sc3ggZmlsZSBpZiAnU2V0dGluZ3MgPiBNb2RzID4gQXV0byBleHBvcnQgbG9hZCBvcmRlcicgaXNuJ3Qgc2V0IHRvIGRvIHRoaXMgYXV0b21hdGljYWxseS4gXG4gICAgICAgIEl0IGNhbiBhbHNvIGJlIHVzZWQgdG8gZXhwb3J0IHRvIGEgZGlmZmVyZW50IGZpbGUgYXMgYSBiYWNrdXAuYCl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxoNCBzdHlsZT17eyBtYXJnaW46IDAgfX0+XG4gICAgICAgIHt0KCdJbXBvcnQgZnJvbSBCYWxkdXJcXCdzIEdhdGUgMyBNb2QgTWFuYWdlcicpfVxuICAgICAgPC9oND5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KCdWb3J0ZXggY2FuIHNvcnQgeW91ciBsb2FkIG9yZGVyIGJhc2VkIG9uIGEgQkczTU0gLmpzb24gbG9hZCBvcmRlciBmaWxlLiBBbnkgbW9kcyB0aGF0IGFyZSBub3QgaW5zdGFsbGVkIHRocm91Z2ggVm9ydGV4IHdpbGwgYmUgaWdub3JlZC4nKX1cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdj5cbiAgICAgICAge3QoJ1BsZWFzZSBub3RlIHRoYXQgYW55IG1vZHMgdGhhdCBhcmUgbm90IHByZXNlbnQgaW4gdGhlIEJHM01NIGxvYWQgb3JkZXIgZmlsZSB3aWxsIGJlIHBsYWNlZCBhdCB0aGUgYm90dG9tIG9mIHRoZSBsb2FkIG9yZGVyLicpfVxuICAgICAgPC9kaXY+XG5cbiAgICA8L2Rpdj5cbiAgKSA6IChcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzEycHgnIH19PlxuICAgICAgPGg0IHN0eWxlPXt7IG1hcmdpbjogMCB9fT5cbiAgICAgICAge3QoJ0xTTGliIGlzIG5vdCBpbnN0YWxsZWQnKX1cbiAgICAgIDwvaDQ+XG4gICAgICA8ZGl2PlxuICAgICAgICB7dCgnVG8gdGFrZSBmdWxsIGFkdmFudGFnZSBvZiBWb3J0ZXhcXCdzIEJhbGR1clxccyBHYXRlIDMgbW9kZGluZyBjYXBhYmlsaXRpZXMgc3VjaCBhcyBtYW5hZ2luZyB0aGUgJ1xuICAgICAgICAgICsgJ29yZGVyIGluIHdoaWNoIG1vZHMgYXJlIGxvYWRlZCBpbnRvIHRoZSBnYW1lOyBWb3J0ZXggcmVxdWlyZXMgYSAzcmQgcGFydHkgdG9vbCBjYWxsZWQgTFNMaWIuJyl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KCdQbGVhc2UgaW5zdGFsbCB0aGUgbGlicmFyeSB1c2luZyB0aGUgYnV0dG9ucyBiZWxvdyB0byBtYW5hZ2UgeW91ciBsb2FkIG9yZGVyLicpfVxuICAgICAgPC9kaXY+XG4gICAgICA8dG9vbHRpcC5CdXR0b25cbiAgICAgICAgdG9vbHRpcD17J0luc3RhbGwgTFNMaWInfVxuICAgICAgICBvbkNsaWNrPXtvbkluc3RhbGxMU0xpYn1cbiAgICAgID5cbiAgICAgICAge3QoJ0luc3RhbGwgTFNMaWInKX1cbiAgICAgIDwvdG9vbHRpcC5CdXR0b24+XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbi8vIGZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZTogYW55KTogSUNvbm5lY3RlZFByb3BzIHtcbi8vICAgcmV0dXJuIHtcbi8vICAgICBjdXJyZW50VGhlbWU6IHN0YXRlLnNldHRpbmdzLmludGVyZmFjZS5jdXJyZW50VGhlbWUsXG4vLyAgIH07XG4vLyB9XG5cbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaDogVGh1bmtEaXNwYXRjaDxhbnksIGFueSwgUmVkdXguQWN0aW9uPik6IElBY3Rpb25Qcm9wcyB7XG4gIHJldHVybiB7XG4gICAgb25TZXRQcm9maWxlOiAocHJvZmlsZTogc3RyaW5nKSA9PiBkaXNwYXRjaChzZXRQbGF5ZXJQcm9maWxlKHByb2ZpbGUpKSxcbiAgfTtcbn0iXX0=