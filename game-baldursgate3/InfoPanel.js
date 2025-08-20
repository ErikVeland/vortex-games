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
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfoPanelWrap = void 0;
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
exports.InfoPanelWrap = InfoPanelWrap;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSW5mb1BhbmVsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSW5mb1BhbmVsLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLDZDQUErQjtBQUMvQiwyQ0FBNEM7QUFFNUMscURBQXdDO0FBQ3hDLDZDQUEwQztBQUcxQyxpQ0FBc0M7QUFHdEMsdUNBQTZDO0FBQzdDLHFDQUFtQztBQWNuQyxTQUFnQixhQUFhLENBQUMsS0FBaUI7SUFDN0MsTUFBTSxFQUFFLEdBQUcsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLEVBQzFDLFlBQVksRUFBRSxpQkFBaUIsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUU1QyxNQUFNLGNBQWMsR0FBRyxJQUFBLHlCQUFXLEVBQUMsQ0FBQyxLQUFtQixFQUFFLEVBQUUsV0FDekQsT0FBQSxNQUFBLEtBQUssQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLDBDQUFFLGFBQWEsQ0FBQSxFQUFBLENBQUMsQ0FBQztJQUVqRCxNQUFNLENBQUMsV0FBVyxFQUFFLGNBQWMsQ0FBQyxHQUFHLEtBQUssQ0FBQyxRQUFRLEVBQVUsQ0FBQztJQUUvRCxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtRQUNuQixDQUFDLEdBQVMsRUFBRTtZQUNWLElBQUksQ0FBQyxXQUFXLEVBQUU7Z0JBQ2hCLGNBQWMsQ0FBQyxNQUFNLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDekQ7UUFDSCxDQUFDLENBQUEsQ0FBQyxFQUFFLENBQUM7SUFDUCxDQUFDLEVBQUUsQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLENBQUMsQ0FBQztJQUVsQyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBbUIsRUFBRSxFQUFFO1FBQzdELE1BQU0sSUFBSSxHQUFHLEdBQVMsRUFBRTtZQUN0QixHQUFHLENBQUMsS0FBSyxDQUFDLFFB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QUM1RDtRQUNOLDRCQUFJLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFDckIsQ0FBQyxDQUFDLDBDQUEwQyxDQUFDLENBQzNDO1FBQ0wsaUNBQ0csQ0FBQyxDQUFDLHlJQUF5SSxDQUFDLENBQ3pJO1FBQ04saUNBQ0csQ0FBQyxDQUFDLDZIQUE2SCxDQUFDLENBQzdILENBRUYsQ0FDUCxDQUFDLENBQUMsQ0FBQyxDQUNGLDZCQUFLLEtBQUssRUFBRSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFO1FBQ25FLDRCQUFJLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFDckIsQ0FBQyxDQUFDLHdCQUF3QixDQUFDLENBQ3pCO1FBQ0wsaUNBQ0csQ0FBQyxDQUFDLGdHQUFnRztjQUMvRiw4RkFBOEYsQ0FBQyxDQUMvRjtRQUNOLGlDQUNHLENBQUMsQ0FBQywrRUFBK0UsQ0FBQyxDQUMvRTtRQUNOLG9CQUFDLG9CQUFPLENBQUMsTUFBTSxJQUNiLE9BQU8sRUFBRSxlQUFlLEVBQ3hCLE9BQU8sRUFBRSxjQUFjLElBRXRCLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FDSixDQUNiLENBQ1AsQ0FBQztBQUNKLENBQUM7QUFRRCxTQUFTLGtCQUFrQixDQUFDLFFBQStDO0lBQ3pFLE9BQU87UUFDTCxZQUFZLEVBQUUsQ0FBQyxPQUFlLEVBQUUsRUFBRSxDQUFDLFFBQVEsQ0FBQyxJQUFBLDBCQUFnQixFQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3ZFLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHR5cGVzLCB0b29sdGlwIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEFsZXJ0IH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCB7IHVzZVNlbGVjdG9yIH0gZnJvbSAncmVhY3QtcmVkdXgnO1xuaW1wb3J0ICogYXMgUmVkdXggZnJvbSAncmVkdXgnO1xuXG5pbXBvcnQgeyBmb3JjZVJlZnJlc2ggfSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHsgVGh1bmtEaXNwYXRjaCB9IGZyb20gJ3JlZHV4LXRodW5rJztcblxuaW1wb3J0IHsgc2V0UGxheWVyUHJvZmlsZSB9IGZyb20gJy4vYWN0aW9ucyc7XG5pbXBvcnQgeyBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xuXG5pbnRlcmZhY2UgSUJhc2VQcm9wcyB7XG4gIGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaTtcbiAgZ2V0T3duR2FtZVZlcnNpb246IChzdGF0ZTogdHlwZXMuSVN0YXRlKSA9PiBQcm9taXNlPHN0cmluZz47XG4gIHJlYWRTdG9yZWRMTzogKGFwaTogdHlwZXMuSUV4dGVuc2lvbkFwaSkgPT4gUHJvbWlzZTx2b2lkPjtcbiAgaW5zdGFsbExTTGliOiAoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBnYW1lSWQ6IHN0cmluZykgPT4gUHJvbWlzZTx2b2lkPjtcbiAgZ2V0TGF0ZXN0TFNMaWJNb2Q6IChhcGk6IHR5cGVzLklFeHRlbnNpb25BcGkpID0+IHR5cGVzLklNb2Q7XG59XG5cbmludGVyZmFjZSBJQWN0aW9uUHJvcHMge1xuICBvblNldFByb2ZpbGU6IChwcm9maWxlTmFtZTogc3RyaW5nKSA9PiB2b2lkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gSW5mb1BhbmVsV3JhcChwcm9wczogSUJhc2VQcm9wcykge1xuICBjb25zdCB7IGFwaSwgZ2V0T3duR2FtZVZlcnNpb24sIHJlYWRTdG9yZWRMTyxcbiAgICBpbnN0YWxsTFNMaWIsIGdldExhdGVzdExTTGliTW9kIH0gPSBwcm9wcztcblxuICBjb25zdCBjdXJyZW50UHJvZmlsZSA9IHVzZVNlbGVjdG9yKChzdGF0ZTogdHlwZXMuSVN0YXRlKSA9PlxuICAgIHN0YXRlLnNldHRpbmdzWydiYWxkdXJzZ2F0ZTMnXT8ucGxheWVyUHJvZmlsZSk7XG5cbiAgY29uc3QgW2dhbWVWZXJzaW9uLCBzZXRHYW1lVmVyc2lvbl0gPSBSZWFjdC51c2VTdGF0ZTxzdHJpbmc+KCk7XG5cbiAgUmVhY3QudXNlRWZmZWN0KCgpID0+IHtcbiAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKCFnYW1lVmVyc2lvbikge1xuICAgICAgICBzZXRHYW1lVmVyc2lvbihhd2FpdCBnZXRPd25HYW1lVmVyc2lvbihhcGkuZ2V0U3RhdGUoKSkpO1xuICAgICAgfVxuICAgIH0pKCk7XG4gIH0sIFtnYW1lVmVyc2lvbiwgc2V0R2FtZVZlcnNpb25dKTtcblxuICBjb25zdCBvblNldFByb2ZpbGUgPSBSZWFjdC51c2VDYWxsYmFjaygocHJvZmlsZU5hbWU6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IGltcGwgPSBhc3luYyAoKSA9PiB7XG4gICAgICBhcGkuc3RvcmUuZGlzcGF0Y2goc2V0UGxheWVyUHJvZmlsZShwcm9maWxlTmFtZSkpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgcmVhZFN0b3JlZExPKGFwaSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgYXBpLnNob3dFcnJvck5vdGlmaWNhdGlvbignRmFpbGVkIHRvIHJlYWQgbG9hZCBvcmRlcicsIGVyciwge1xuICAgICAgICAgIG1lc3NhZ2U6ICdQbGVhc2UgcnVuIHRoZSBnYW1lIGJlZm9yZSB5b3Ugc3RhcnQgbW9kZGluZycsXG4gICAgICAgICAgYWxsb3dSZXBvcnQ6IGZhbHNlLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIGZvcmNlUmVmcmVzaChhcGkpO1xuICAgIH07XG4gICAgaW1wbCgpO1xuICB9LCBbYXBpXSk7XG5cbiAgY29uc3QgaXNMc0xpYkluc3RhbGxlZCA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICByZXR1cm4gZ2V0TGF0ZXN0TFNMaWJNb2QoYXBpKSAhPT0gdW5kZWZpbmVkO1xuICB9LCBbYXBpXSk7XG5cbiAgY29uc3Qgb25JbnN0YWxsTFNMaWIgPSBSZWFjdC51c2VDYWxsYmFjaygoKSA9PiB7XG4gICAgaW5zdGFsbExTTGliKGFwaSwgR0FNRV9JRCk7XG4gIH0sIFthcGldKTtcblxuICBpZiAoIWdhbWVWZXJzaW9uKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gKFxuICAgIDxJbmZvUGFuZWxcbiAgICAgIHQ9e2FwaS50cmFuc2xhdGV9XG4gICAgICBnYW1lVmVyc2lvbj17Z2FtZVZlcnNpb259XG4gICAgICBjdXJyZW50UHJvZmlsZT17Y3VycmVudFByb2ZpbGV9XG4gICAgICBvblNldFBsYXllclByb2ZpbGU9e29uU2V0UHJvZmlsZX1cbiAgICAgIGlzTHNMaWJJbnN0YWxsZWQ9e2lzTHNMaWJJbnN0YWxsZWR9XG4gICAgICBvbkluc3RhbGxMU0xpYj17b25JbnN0YWxsTFNMaWJ9XG4gICAgLz5cbiAgKTtcbn1cblxuZnVuY3Rpb24gSW5mb1BhbmVsKHByb3BzOiBhbnkpIHtcbiAgY29uc3QgeyB0LCBvbkluc3RhbGxMU0xpYiwgaXNMc0xpYkluc3RhbGxlZCB9ID0gcHJvcHM7XG5cbiAgcmV0dXJuIGlzTHNMaWJJbnN0YWxsZWQoKSA/IChcbiAgICA8ZGl2IHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzEycHgnLCBtYXJnaW5SaWdodDogJzE2cHgnIH19PlxuICAgICAgPEFsZXJ0IGJzU3R5bGU9J3dhcm5pbmcnIHN0eWxlPXt7IGRpc3BsYXk6ICdmbGV4JywgZmxleERpcmVjdGlvbjogJ2NvbHVtbicsIGdhcDogJzhweCcgfX0+XG4gICAgICAgIDxkaXY+XG4gICAgICAgICAge3QoJ1RvIHN1Y2Nlc3NmdWxseSBzd2l0Y2ggYmV0d2VlbiBkaWZmZXJlbnQgZ2FtZSB2ZXJzaW9ucy9wYXRjaGVzIHBsZWFzZSBmb2xsb3cgdGhlc2Ugc3RlcHM6Jyl9XG4gICAgICAgICAgPHVsPlxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICB7dCgnUHVyZ2UgeW91ciBtb2RzJyl9XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICB7dCgnUnVuIHRoZSBnYW1lIHNvIHRoYXQgdGhlIG1vZHNldHRpbmdzLmxzeCBmaWxlIGdldHMgcmVzZXQgdG8gdGhlIGRlZmF1bHQgdmFsdWVzJyl9XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICB7dCgnQ2xvc2UgdGhlIGdhbWUnKX1cbiAgICAgICAgICAgIDwvbGk+XG4gICAgICAgICAgICA8bGk+XG4gICAgICAgICAgICAgIHt0KCdEZXBsb3kgeW91ciBtb2RzJyl9XG4gICAgICAgICAgICA8L2xpPlxuICAgICAgICAgICAgPGxpPlxuICAgICAgICAgICAgICB7dCgnUnVuIHRoZSBnYW1lIGFnYWluIC0geW91ciBsb2FkIG9yZGVyIHdpbGwgYmUgbWFpbnRhaW5lZCcpfVxuICAgICAgICAgICAgPC9saT5cbiAgICAgICAgICA8L3VsPlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvQWxlcnQ+XG4gICAgICA8ZGl2PlxuICAgICAgICB7dChgQSBiYWNrdXAgaXMgbWFkZSBvZiB0aGUgZ2FtZSdzIG1vZHNldHRpbmdzLmxzeCBmaWxlIGJlZm9yZSBhbnl0aGluZyBpcyBjaGFuZ2VkLlxuICAgICAgICBUaGlzIGNhbiBiZSBmb3VuZCBhdCAlQVBQREFUQSVcXFxcTG9jYWxcXFxcTGFyaWFuIFN0dWRpb3NcXFxcQmFsZHVyJ3MgR2F0ZSAzXFxcXFBsYXllclByb2ZpbGVzXFxcXFB1YmxpY1xcXFxtb2RzZXR0aW5ncy5sc3guYmFja3VwYCl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KGBEcmFnIGFuZCBEcm9wIFBBSyBmaWxlcyB0byByZW9yZGVyIGhvdyB0aGUgZ2FtZSBsb2FkcyB0aGVtLiBQbGVhc2Ugbm90ZSwgc29tZSBtb2RzIGNvbnRhaW4gbXVsdGlwbGUgUEFLIGZpbGVzLmApfVxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2PlxuICAgICAgICB7dChgTW9kIGRlc2NyaXB0aW9ucyBmcm9tIG1vZCBhdXRob3JzIG1heSBoYXZlIGluZm9ybWF0aW9uIHRvIGRldGVybWluZSB0aGUgYmVzdCBvcmRlci5gKX1cbiAgICAgIDwvZGl2PlxuICAgICAgPGRpdj5cbiAgICAgICAge3QoYFNvbWUgbW9kcyBtYXkgYmUgbG9ja2VkIGluIHRoaXMgbGlzdCBiZWNhdXNlIHRoZXkgYXJlIGxvYWRlZCBkaWZmZXJlbnRseSBieSB0aGUgZ2FtZSBhbmQgY2FuIHRoZXJlZm9yZSBub3QgYmUgbG9hZC1vcmRlcmVkIGJ5IG1vZCBtYW5hZ2Vycy4gXG4gICAgICAgIElmIHlvdSBuZWVkIHRvIGRpc2FibGUgc3VjaCBhIG1vZCwgcGxlYXNlIGRvIHNvIGluIFZvcnRleFxcJ3MgTW9kcyBwYWdlLmApfVxuICAgICAgPC9kaXY+XG4gICAgICA8aDQgc3R5bGU9e3sgbWFyZ2luOiAwIH19PlxuICAgICAgICB7dCgnSW1wb3J0IGFuZCBFeHBvcnQnKX1cbiAgICAgIDwvaDQ+XG4gICAgICA8ZGl2PlxuICAgICAgICB7dChgSW1wb3J0IGlzIGFuIGV4cGVyaW1lbnRhbCB0b29sIHRvIGhlbHAgbWlncmF0aW9uIGZyb20gYSBnYW1lIGxvYWQgb3JkZXIgKC5sc3ggZmlsZSkgdG8gVm9ydGV4LiBJdCB3b3JrcyBieSBpbXBvcnRpbmcgdGhlIGdhbWUncyBtb2RzZXR0aW5ncyBmaWxlXG4gICAgICAgIGFuZCBhdHRlbXB0cyB0byBtYXRjaCB1cCBtb2RzIHRoYXQgaGF2ZSBiZWVuIGluc3RhbGxlZCBieSBWb3J0ZXguYCl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KGBFeHBvcnQgY2FuIGJlIHVzZWQgdG8gbWFudWFsbHkgdXBkYXRlIHRoZSBnYW1lJ3MgbW9kc2V0dGluZ3MubHN4IGZpbGUgaWYgJ1NldHRpbmdzID4gTW9kcyA+IEF1dG8gZXhwb3J0IGxvYWQgb3JkZXInIGlzbid0IHNldCB0byBkbyB0aGlzIGF1dG9tYXRpY2FsbHkuIFxuICAgICAgICBJdCBjYW4gYWxzbyBiZSB1c2VkIHRvIGV4cG9ydCB0byBhIGRpZmZlcmVudCBmaWxlIGFzIGEgYmFja3VwLmApfVxuICAgICAgPC9kaXY+XG4gICAgICA8aDQgc3R5bGU9e3sgbWFyZ2luOiAwIH19PlxuICAgICAgICB7dCgnSW1wb3J0IGZyb20gQmFsZHVyXFwncyBHYXRlIDMgTW9kIE1hbmFnZXInKX1cbiAgICAgIDwvaDQ+XG4gICAgICA8ZGl2PlxuICAgICAgICB7dCgnVm9ydGV4IGNhbiBzb3J0IHlvdXIgbG9hZCBvcmRlciBiYXNlZCBvbiBhIEJHM01NIC5qc29uIGxvYWQgb3JkZXIgZmlsZS4gQW55IG1vZHMgdGhhdCBhcmUgbm90IGluc3RhbGxlZCB0aHJvdWdoIFZvcnRleCB3aWxsIGJlIGlnbm9yZWQuJyl9XG4gICAgICA8L2Rpdj5cbiAgICAgIDxkaXY+XG4gICAgICAgIHt0KCdQbGVhc2Ugbm90ZSB0aGF0IGFueSBtb2RzIHRoYXQgYXJlIG5vdCBwcmVzZW50IGluIHRoZSBCRzNNTSBsb2FkIG9yZGVyIGZpbGUgd2lsbCBiZSBwbGFjZWQgYXQgdGhlIGJvdHRvbSBvZiB0aGUgbG9hZCBvcmRlci4nKX1cbiAgICAgIDwvZGl2PlxuXG4gICAgPC9kaXY+XG4gICkgOiAoXG4gICAgPGRpdiBzdHlsZT17eyBkaXNwbGF5OiAnZmxleCcsIGZsZXhEaXJlY3Rpb246ICdjb2x1bW4nLCBnYXA6ICcxMnB4JyB9fT5cbiAgICAgIDxoNCBzdHlsZT17eyBtYXJnaW46IDAgfX0+XG4gICAgICAgIHt0KCdMU0xpYiBpcyBub3QgaW5zdGFsbGVkJyl9XG4gICAgICA8L2g0PlxuICAgICAgPGRpdj5cbiAgICAgICAge3QoJ1RvIHRha2UgZnVsbCBhZHZhbnRhZ2Ugb2YgVm9ydGV4XFwncyBCYWxkdXJcXHMgR2F0ZSAzIG1vZGRpbmcgY2FwYWJpbGl0aWVzIHN1Y2ggYXMgbWFuYWdpbmcgdGhlICdcbiAgICAgICAgICArICdvcmRlciBpbiB3aGljaCBtb2RzIGFyZSBsb2FkZWQgaW50byB0aGUgZ2FtZTsgVm9ydGV4IHJlcXVpcmVzIGEgM3JkIHBhcnR5IHRvb2wgY2FsbGVkIExTTGliLicpfVxuICAgICAgPC9kaXY+XG4gICAgICA8ZGl2PlxuICAgICAgICB7dCgnUGxlYXNlIGluc3RhbGwgdGhlIGxpYnJhcnkgdXNpbmcgdGhlIGJ1dHRvbnMgYmVsb3cgdG8gbWFuYWdlIHlvdXIgbG9hZCBvcmRlci4nKX1cbiAgICAgIDwvZGl2PlxuICAgICAgPHRvb2x0aXAuQnV0dG9uXG4gICAgICAgIHRvb2x0aXA9eydJbnN0YWxsIExTTGliJ31cbiAgICAgICAgb25DbGljaz17b25JbnN0YWxsTFNMaWJ9XG4gICAgICA+XG4gICAgICAgIHt0KCdJbnN0YWxsIExTTGliJyl9XG4gICAgICA8L3Rvb2x0aXAuQnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufVxuXG4vLyBmdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IGFueSk6IElDb25uZWN0ZWRQcm9wcyB7XG4vLyAgIHJldHVybiB7XG4vLyAgICAgY3VycmVudFRoZW1lOiBzdGF0ZS5zZXR0aW5ncy5pbnRlcmZhY2UuY3VycmVudFRoZW1lLFxuLy8gICB9O1xuLy8gfVxuXG5mdW5jdGlvbiBtYXBEaXNwYXRjaFRvUHJvcHMoZGlzcGF0Y2g6IFRodW5rRGlzcGF0Y2g8YW55LCBhbnksIFJlZHV4LkFjdGlvbj4pOiBJQWN0aW9uUHJvcHMge1xuICByZXR1cm4ge1xuICAgIG9uU2V0UHJvZmlsZTogKHByb2ZpbGU6IHN0cmluZykgPT4gZGlzcGF0Y2goc2V0UGxheWVyUHJvZmlsZShwcm9maWxlKSksXG4gIH07XG59Il19