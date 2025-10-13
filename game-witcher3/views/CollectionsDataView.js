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
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const react_bootstrap_1 = require("react-bootstrap");
const react_i18next_1 = require("react-i18next");
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
const util_1 = require("../collections/util");
const NAMESPACE = 'generic-load-order-extension';
class CollectionsDataView extends vortex_api_1.ComponentEx {
    static getDerivedStateFromProps(newProps, state) {
        const { loadOrder, mods, collection } = newProps;
        const sortedMods = (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection);
        return (sortedMods !== state.sortedMods) ? { sortedMods } : null;
    }
    constructor(props) {
        super(props);
        this.renderLoadOrderEditInfo = () => {
            const { t } = this.props;
            return (React.createElement(vortex_api_1.FlexLayout, { type: 'row', id: 'collection-edit-loadorder-edit-info-container' },
                React.createElement(vortex_api_1.FlexLayout.Fixed, { className: 'loadorder-edit-info-icon' },
                    React.createElement(vortex_api_1.Icon, { name: 'dialog-info' })),
                React.createElement(vortex_api_1.FlexLayout.Fixed, { className: 'collection-edit-loadorder-edit-info' },
                    t('You can make changes to this data from the '),
                    React.createElement("a", { className: 'fake-link', onClick: this.openLoadOrderPage, title: t('Go to Load Order Page') }, t('Load Order page.')),
                    t(' If you believe a load order entry is missing, please ensure the '
                        + 'relevant mod is enabled and has been added to the collection.'))));
        };
        this.openLoadOrderPage = () => {
            this.context.api.events.emit('show-main-page', 'generic-loadorder');
        };
        this.renderOpenLOButton = () => {
            const { t } = this.props;
            return (React.createElement(react_bootstrap_1.Button, { id: 'btn-more-mods', className: 'collection-add-mods-btn', onClick: this.openLoadOrderPage, bsStyle: 'ghost' }, t('Open Load Order Page')));
        };
        this.renderPlaceholder = () => {
            const { t } = this.props;
            return (React.createElement(vortex_api_1.EmptyPlaceholder, { icon: 'sort-none', text: t('You have no load order entries (for the current mods in the collection)'), subtext: this.renderOpenLOButton() }));
        };
        this.renderModEntry = (loEntry, index) => {
            var _a, _b;
            const key = loEntry.modId + JSON.stringify(loEntry);
            const name = loEntry.modId
                ? `${(_a = vortex_api_1.util.renderModName(this.props.mods[loEntry.modId])) !== null && _a !== void 0 ? _a : loEntry.id} (${loEntry.name})`
                : (_b = loEntry.name) !== null && _b !== void 0 ? _b : loEntry.id;
            const classes = ['load-order-entry', 'collection-tab'];
            return (React.createElement(react_bootstrap_1.ListGroupItem, { key: key, className: classes.join(' ') },
                React.createElement(vortex_api_1.FlexLayout, { type: 'row' },
                    React.createElement("p", { className: 'load-order-index' }, index + 1),
                    React.createElement("p", null, name))));
        };
        const { loadOrder, mods, collection } = props;
        this.initState({
            sortedMods: (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection) || [],
        });
    }
    componentDidMount() {
        const { loadOrder, mods, collection } = this.props;
        this.nextState.sortedMods = (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection);
    }
    render() {
        const { t } = this.props;
        const { sortedMods } = this.state;
        return (!!sortedMods && sortedMods.length !== 0)
            ? (React.createElement("div", { style: { overflow: 'auto' } },
                React.createElement("h4", null, t('Witcher 3 Merged Data')),
                React.createElement("p", null, t('The Witcher 3 game extension executes a series of file merges for UI/menu mods '
                    + 'whenever the mods are deployed - these will be included in the collection. '
                    + '(separate from the ones done using the script '
                    + 'merger utility) To ensure that Vortex includes the correct data when '
                    + 'uploading this collection, please make sure that the mods are enabled and '
                    + 'deployed before attempting to upload the collection.')),
                React.createElement("p", null, t('Additionally - please remember that any script merges (if applicable) done '
                    + 'through the script merger utility, should be reviewed before uploading, to '
                    + 'only include merges that are necessary for the collection to function correctly. '
                    + 'Merged scripts referencing a mod that is not included in your collection will most '
                    + 'definitively cause the game to crash!')),
                React.createElement("h4", null, t('Load Order')),
                React.createElement("p", null, t('This is a snapshot of the load order information that '
                    + 'will be exported with this collection.')),
                this.renderLoadOrderEditInfo(),
                React.createElement(react_bootstrap_1.ListGroup, { id: 'collections-load-order-list' }, sortedMods.map(this.renderModEntry)))) : this.renderPlaceholder();
    }
}
function mapStateToProps(state, ownProps) {
    const profile = vortex_api_1.selectors.activeProfile(state) || undefined;
    let loadOrder = [];
    if (!!(profile === null || profile === void 0 ? void 0 : profile.gameId)) {
        loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profile.id], []);
    }
    return {
        gameId: profile === null || profile === void 0 ? void 0 : profile.gameId,
        loadOrder,
        mods: vortex_api_1.util.getSafe(state, ['persistent', 'mods', profile.gameId], {}),
        profile,
    };
}
exports.default = (0, react_i18next_1.withTranslation)(['common', NAMESPACE])((0, react_redux_1.connect)(mapStateToProps)(CollectionsDataView));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsNkNBQStCO0FBQy9CLHFEQUFtRTtBQUNuRSxpREFBZ0Q7QUFDaEQsNkNBQXNDO0FBRXRDLDJDQUM2QztBQUc3Qyw4Q0FBNkQ7QUFHN0QsTUFBTSxTQUFTLEdBQVcsOEJBQThCLENBQUM7QUFnQnpELE1BQU0sbUJBQW9CLFNBQVEsd0JBQW9DO0lBQzdELE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxRQUFnQixFQUFFLEtBQXNCO1FBQzdFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLFFBQVEsQ0FBQztRQUNqRCxNQUFNLFVBQVUsR0FBRyxJQUFBLDZCQUFzQixFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdkUsT0FBTyxDQUFDLFVBQVUsS0FBSyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNuRSxDQUFDO0lBRUQsWUFBWSxLQUFhO1FBQ3ZCLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQStDUCw0QkFBdUIsR0FBRyxHQUFHLEVBQUU7WUFDckMsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDekIsT0FBTyxDQUNMLG9CQUFDLHVCQUFVLElBQUMsSUFBSSxFQUFDLEtBQUssRUFBQyxFQUFFLEVBQUMsK0NBQStDO2dCQUN2RSxvQkFBQyx1QkFBVSxDQUFDLEtBQUssSUFBQyxTQUFTLEVBQUMsMEJBQTBCO29CQUNwRCxvQkFBQyxpQkFBSSxJQUFDLElBQUksRUFBQyxhQUFhLEdBQUUsQ0FDVDtnQkFDbkIsb0JBQUMsdUJB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Q0FzRUY7QUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFtQixFQUFFLFFBQWdCO0lBQzVELE1BQU0sT0FBTyxHQUFHLHNCQUFTLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLFNBQVMsQ0FBQztJQUM1RCxJQUFJLFNBQVMsR0FBb0IsRUFBRSxDQUFDO0lBQ3BDLElBQUksQ0FBQyxDQUFDLENBQUEsT0FBTyxhQUFQLE9BQU8sdUJBQVAsT0FBTyxDQUFFLE1BQU0sQ0FBQSxFQUFFLENBQUM7UUFDdEIsU0FBUyxHQUFHLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQy9FLENBQUM7SUFFRCxPQUFPO1FBQ0wsTUFBTSxFQUFFLE9BQU8sYUFBUCxPQUFPLHVCQUFQLE9BQU8sQ0FBRSxNQUFNO1FBQ3ZCLFNBQVM7UUFDVCxJQUFJLEVBQUUsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQ3JFLE9BQU87S0FDUixDQUFDO0FBQ0osQ0FBQztBQUVELGtCQUFlLElBQUEsK0JBQWUsRUFBQyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUNuRCxJQUFBLHFCQUFPLEVBQUMsZUFBZSxDQUFDLENBQ3RCLG1CQUFtQixDQUFRLENBQWtELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBfIGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBCdXR0b24sIExpc3RHcm91cCwgTGlzdEdyb3VwSXRlbSB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XG5pbXBvcnQgeyB3aXRoVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcbmltcG9ydCB7IGNvbm5lY3QgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5cbmltcG9ydCB7IENvbXBvbmVudEV4LCBFbXB0eVBsYWNlaG9sZGVyLCBGbGV4TGF5b3V0LCBJY29uLFxuICBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IElFeHRlbmRlZEludGVyZmFjZVByb3BzLCBJTG9hZE9yZGVyLCBJTG9hZE9yZGVyRW50cnkgfSBmcm9tICcuLi9jb2xsZWN0aW9ucy90eXBlcyc7XG5pbXBvcnQgeyBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyIH0gZnJvbSAnLi4vY29sbGVjdGlvbnMvdXRpbCc7XG5pbXBvcnQgeyBJRkJMT0xvYWRPcmRlckVudHJ5IH0gZnJvbSAndm9ydGV4LWFwaS9saWIvdHlwZXMvYXBpJztcblxuY29uc3QgTkFNRVNQQUNFOiBzdHJpbmcgPSAnZ2VuZXJpYy1sb2FkLW9yZGVyLWV4dGVuc2lvbic7XG5cbmludGVyZmFjZSBJQmFzZVN0YXRlIHtcbiAgc29ydGVkTW9kczogdHlwZXMuSUZCTE9Mb2FkT3JkZXJFbnRyeVtdO1xufVxuXG5pbnRlcmZhY2UgSUNvbm5lY3RlZFByb3BzIHtcbiAgZ2FtZUlkOiBzdHJpbmc7XG4gIG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH07XG4gIGxvYWRPcmRlcjogdHlwZXMuSUZCTE9Mb2FkT3JkZXJFbnRyeVtdO1xuICBwcm9maWxlOiB0eXBlcy5JUHJvZmlsZTtcbn1cblxudHlwZSBJUHJvcHMgPSBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcyAmIElDb25uZWN0ZWRQcm9wcztcbnR5cGUgSUNvbXBvbmVudFN0YXRlID0gSUJhc2VTdGF0ZTtcblxuY2xhc3MgQ29sbGVjdGlvbnNEYXRhVmlldyBleHRlbmRzIENvbXBvbmVudEV4PElQcm9wcywgSUNvbXBvbmVudFN0YXRlPiB7XG4gIHB1YmxpYyBzdGF0aWMgZ2V0RGVyaXZlZFN0YXRlRnJvbVByb3BzKG5ld1Byb3BzOiBJUHJvcHMsIHN0YXRlOiBJQ29tcG9uZW50U3RhdGUpIHtcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gbmV3UHJvcHM7XG4gICAgY29uc3Qgc29ydGVkTW9kcyA9IGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIobG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uKTtcbiAgICByZXR1cm4gKHNvcnRlZE1vZHMgIT09IHN0YXRlLnNvcnRlZE1vZHMpID8geyBzb3J0ZWRNb2RzIH0gOiBudWxsO1xuICB9XG5cbiAgY29uc3RydWN0b3IocHJvcHM6IElQcm9wcykge1xuICAgIHN1cGVyKHByb3BzKTtcbiAgICBjb25zdCB7IGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbiB9ID0gcHJvcHM7XG4gICAgdGhpcy5pbml0U3RhdGUoe1xuICAgICAgc29ydGVkTW9kczogZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24pIHx8IFtdLFxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uIH0gPSB0aGlzLnByb3BzO1xuICAgIHRoaXMubmV4dFN0YXRlLnNvcnRlZE1vZHMgPSBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbik7XG4gIH1cblxuICBwdWJsaWMgcmVuZGVyKCk6IEpTWC5FbGVtZW50IHtcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgeyBzb3J0ZWRNb2RzIH0gPSB0aGlzLnN0YXRlO1xuICAgIHJldHVybiAoISFzb3J0ZWRNb2RzICYmIHNvcnRlZE1vZHMubGVuZ3RoICE9PSAwKVxuICAgICAgPyAoXG4gICAgICAgIDxkaXYgc3R5bGU9e3sgb3ZlcmZsb3c6ICdhdXRvJyB9fT5cbiAgICAgICAgICA8aDQ+e3QoJ1dpdGNoZXIgMyBNZXJnZWQgRGF0YScpfTwvaDQ+XG4gICAgICAgICAgPHA+XG4gICAgICAgICAge3QoJ1RoZSBXaXRjaGVyIDMgZ2FtZSBleHRlbnNpb24gZXhlY3V0ZXMgYSBzZXJpZXMgb2YgZmlsZSBtZXJnZXMgZm9yIFVJL21lbnUgbW9kcyAnXG4gICAgICAgICAgICsgJ3doZW5ldmVyIHRoZSBtb2RzIGFyZSBkZXBsb3llZCAtIHRoZXNlIHdpbGwgYmUgaW5jbHVkZWQgaW4gdGhlIGNvbGxlY3Rpb24uICdcbiAgICAgICAgICAgKyAnKHNlcGFyYXRlIGZyb20gdGhlIG9uZXMgZG9uZSB1c2luZyB0aGUgc2NyaXB0ICdcbiAgICAgICAgICAgKyAnbWVyZ2VyIHV0aWxpdHkpIFRvIGVuc3VyZSB0aGF0IFZvcnRleCBpbmNsdWRlcyB0aGUgY29ycmVjdCBkYXRhIHdoZW4gJ1xuICAgICAgICAgICArICd1cGxvYWRpbmcgdGhpcyBjb2xsZWN0aW9uLCBwbGVhc2UgbWFrZSBzdXJlIHRoYXQgdGhlIG1vZHMgYXJlIGVuYWJsZWQgYW5kICdcbiAgICAgICAgICAgKyAnZGVwbG95ZWQgYmVmb3JlIGF0dGVtcHRpbmcgdG8gdXBsb2FkIHRoZSBjb2xsZWN0aW9uLicpfVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgICA8cD5cbiAgICAgICAgICB7dCgnQWRkaXRpb25hbGx5IC0gcGxlYXNlIHJlbWVtYmVyIHRoYXQgYW55IHNjcmlwdCBtZXJnZXMgKGlmIGFwcGxpY2FibGUpIGRvbmUgJ1xuICAgICAgICAgICArICd0aHJvdWdoIHRoZSBzY3JpcHQgbWVyZ2VyIHV0aWxpdHksIHNob3VsZCBiZSByZXZpZXdlZCBiZWZvcmUgdXBsb2FkaW5nLCB0byAnXG4gICAgICAgICAgICsgJ29ubHkgaW5jbHVkZSBtZXJnZXMgdGhhdCBhcmUgbmVjZXNzYXJ5IGZvciB0aGUgY29sbGVjdGlvbiB0byBmdW5jdGlvbiBjb3JyZWN0bHkuICdcbiAgICAgICAgICAgKyAnTWVyZ2VkIHNjcmlwdHMgcmVmZXJlbmNpbmcgYSBtb2QgdGhhdCBpcyBub3QgaW5jbHVkZWQgaW4geW91ciBjb2xsZWN0aW9uIHdpbGwgbW9zdCAnXG4gICAgICAgICAgICsgJ2RlZmluaXRpdmVseSBjYXVzZSB0aGUgZ2FtZSB0byBjcmFzaCEnKX1cbiAgICAgICAgICA8L3A+XG4gICAgICAgICAgPGg0Pnt0KCdMb2FkIE9yZGVyJyl9PC9oND5cbiAgICAgICAgICA8cD5cbiAgICAgICAgICB7dCgnVGhpcyBpcyBhIHNuYXBzaG90IG9mIHRoZSBsb2FkIG9yZGVyIGluZm9ybWF0aW9uIHRoYXQgJ1xuICAgICAgICAgICArICd3aWxsIGJlIGV4cG9ydGVkIHdpdGggdGhpcyBjb2xsZWN0aW9uLicpfVxuICAgICAgICAgIDwvcD5cbiAgICAgICAgICB7dGhpcy5yZW5kZXJMb2FkT3JkZXJFZGl0SW5mbygpfVxuICAgICAgICAgIDxMaXN0R3JvdXAgaWQ9J2NvbGxlY3Rpb25zLWxvYWQtb3JkZXItbGlzdCc+XG4gICAgICAgICAgICB7c29ydGVkTW9kcy5tYXAodGhpcy5yZW5kZXJNb2RFbnRyeSl9XG4gICAgICAgICAgPC9MaXN0R3JvdXA+XG4gICAgICAgIDwvZGl2PlxuICAgICkgOiB0aGlzLnJlbmRlclBsYWNlaG9sZGVyKCk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlckxvYWRPcmRlckVkaXRJbmZvID0gKCkgPT4ge1xuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcbiAgICByZXR1cm4gKFxuICAgICAgPEZsZXhMYXlvdXQgdHlwZT0ncm93JyBpZD0nY29sbGVjdGlvbi1lZGl0LWxvYWRvcmRlci1lZGl0LWluZm8tY29udGFpbmVyJz5cbiAgICAgICAgPEZsZXhMYXlvdXQuRml4ZWQgY2xhc3NOYW1lPSdsb2Fkb3JkZXItZWRpdC1pbmZvLWljb24nPlxuICAgICAgICAgIDxJY29uIG5hbWU9J2RpYWxvZy1pbmZvJy8+XG4gICAgICAgIDwvRmxleExheW91dC5GaXhlZD5cbiAgICAgICAgPEZsZXhMYXlvdXQuRml4ZWQgY2xhc3NOYW1lPSdjb2xsZWN0aW9uLWVkaXQtbG9hZG9yZGVyLWVkaXQtaW5mbyc+XG4gICAgICAgICAge3QoJ1lvdSBjYW4gbWFrZSBjaGFuZ2VzIHRvIHRoaXMgZGF0YSBmcm9tIHRoZSAnKX1cbiAgICAgICAgICA8YVxuICAgICAgICAgICAgY2xhc3NOYW1lPSdmYWtlLWxpbmsnXG4gICAgICAgICAgICBvbkNsaWNrPXt0aGlzLm9wZW5Mb2FkT3JkZXJQYWdlfVxuICAgICAgICAgICAgdGl0bGU9e3QoJ0dvIHRvIExvYWQgT3JkZXIgUGFnZScpfVxuICAgICAgICAgID5cbiAgICAgICAgICAgIHt0KCdMb2FkIE9yZGVyIHBhZ2UuJyl9XG4gICAgICAgICAgPC9hPlxuICAgICAgICAgIHt0KCcgSWYgeW91IGJlbGlldmUgYSBsb2FkIG9yZGVyIGVudHJ5IGlzIG1pc3NpbmcsIHBsZWFzZSBlbnN1cmUgdGhlICdcbiAgICAgICAgICArICdyZWxldmFudCBtb2QgaXMgZW5hYmxlZCBhbmQgaGFzIGJlZW4gYWRkZWQgdG8gdGhlIGNvbGxlY3Rpb24uJyl9XG4gICAgICAgIDwvRmxleExheW91dC5GaXhlZD5cbiAgICAgIDwvRmxleExheW91dD5cbiAgICApO1xuICB9XG5cbiAgcHJpdmF0ZSBvcGVuTG9hZE9yZGVyUGFnZSA9ICgpID0+IHtcbiAgICB0aGlzLmNvbnRleHQuYXBpLmV2ZW50cy5lbWl0KCdzaG93LW1haW4tcGFnZScsICdnZW5lcmljLWxvYWRvcmRlcicpO1xuICB9XG4gIHByaXZhdGUgcmVuZGVyT3BlbkxPQnV0dG9uID0gKCkgPT4ge1xuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcbiAgICByZXR1cm4gKDxCdXR0b25cbiAgICAgIGlkPSdidG4tbW9yZS1tb2RzJ1xuICAgICAgY2xhc3NOYW1lPSdjb2xsZWN0aW9uLWFkZC1tb2RzLWJ0bidcbiAgICAgIG9uQ2xpY2s9e3RoaXMub3BlbkxvYWRPcmRlclBhZ2V9XG4gICAgICBic1N0eWxlPSdnaG9zdCdcbiAgICA+XG4gICAgICB7dCgnT3BlbiBMb2FkIE9yZGVyIFBhZ2UnKX1cbiAgICA8L0J1dHRvbj4pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJQbGFjZWhvbGRlciA9ICgpID0+IHtcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XG4gICAgcmV0dXJuIChcbiAgICAgIDxFbXB0eVBsYWNlaG9sZGVyXG4gICAgICAgIGljb249J3NvcnQtbm9uZSdcbiAgICAgICAgdGV4dD17dCgnWW91IGhhdmUgbm8gbG9hZCBvcmRlciBlbnRyaWVzIChmb3IgdGhlIGN1cnJlbnQgbW9kcyBpbiB0aGUgY29sbGVjdGlvbiknKX1cbiAgICAgICAgc3VidGV4dD17dGhpcy5yZW5kZXJPcGVuTE9CdXR0b24oKX1cbiAgICAgIC8+XG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTW9kRW50cnkgPSAobG9FbnRyeTogSUZCTE9Mb2FkT3JkZXJFbnRyeSwgaW5kZXg6IG51bWJlcikgPT4ge1xuICAgIGNvbnN0IGtleSA9IGxvRW50cnkubW9kSWQgKyBKU09OLnN0cmluZ2lmeShsb0VudHJ5KTtcbiAgICBjb25zdCBuYW1lID0gbG9FbnRyeS5tb2RJZFxuICAgICAgPyBgJHt1dGlsLnJlbmRlck1vZE5hbWUodGhpcy5wcm9wcy5tb2RzW2xvRW50cnkubW9kSWRdKSA/PyBsb0VudHJ5LmlkfSAoJHtsb0VudHJ5Lm5hbWV9KWBcbiAgICAgIDogbG9FbnRyeS5uYW1lID8/IGxvRW50cnkuaWQ7XG5cbiAgICBjb25zdCBjbGFzc2VzID0gWydsb2FkLW9yZGVyLWVudHJ5JywgJ2NvbGxlY3Rpb24tdGFiJ107XG4gICAgcmV0dXJuIChcbiAgICAgIDxMaXN0R3JvdXBJdGVtXG4gICAgICAgIGtleT17a2V5fVxuICAgICAgICBjbGFzc05hbWU9e2NsYXNzZXMuam9pbignICcpfVxuICAgICAgPlxuICAgICAgICA8RmxleExheW91dCB0eXBlPSdyb3cnPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT0nbG9hZC1vcmRlci1pbmRleCc+e2luZGV4ICsgMX08L3A+XG4gICAgICAgICAgPHA+e25hbWV9PC9wPlxuICAgICAgICA8L0ZsZXhMYXlvdXQ+XG4gICAgICA8L0xpc3RHcm91cEl0ZW0+XG4gICAgKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IHR5cGVzLklTdGF0ZSwgb3duUHJvcHM6IElQcm9wcyk6IElDb25uZWN0ZWRQcm9wcyB7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSkgfHwgdW5kZWZpbmVkO1xuICBsZXQgbG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIgPSBbXTtcbiAgaWYgKCEhcHJvZmlsZT8uZ2FtZUlkKSB7XG4gICAgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvZmlsZS5pZF0sIFtdKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgZ2FtZUlkOiBwcm9maWxlPy5nYW1lSWQsXG4gICAgbG9hZE9yZGVyLFxuICAgIG1vZHM6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ21vZHMnLCBwcm9maWxlLmdhbWVJZF0sIHt9KSxcbiAgICBwcm9maWxlLFxuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCB3aXRoVHJhbnNsYXRpb24oWydjb21tb24nLCBOQU1FU1BBQ0VdKShcbiAgY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMpKFxuICAgIENvbGxlY3Rpb25zRGF0YVZpZXcpIGFzIGFueSkgYXMgUmVhY3QuQ29tcG9uZW50Q2xhc3M8SUV4dGVuZGVkSW50ZXJmYWNlUHJvcHM+O1xuIl19