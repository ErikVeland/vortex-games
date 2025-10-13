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
const util_1 = require("./util");
const vortex_api_1 = require("vortex-api");
const NAMESPACE = 'generic-load-order-extension';
class CollectionsDataView extends vortex_api_1.ComponentEx {
    static getDerivedStateFromProps(newProps, state) {
        const { loadOrder, mods, collection } = newProps;
        const sortedMods = (0, util_1.genCollectionLoadOrder)(loadOrder, mods, collection);
        return (sortedMods !== state.sortedMods) ? { sortedMods } : null;
    }
    constructor(props) {
        super(props);
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
        this.renderModEntry = (loId) => {
            const { mods } = this.props;
            const { sortedMods } = this.state;
            const loEntry = this.state.sortedMods[loId];
            const idx = this.state.sortedMods.indexOf(loId);
            const key = `${idx}-${loId}`;
            const modId = (0, util_1.getModId)(mods, loId);
            const name = vortex_api_1.util.renderModName(this.props.mods[modId]) || modId;
            const classes = ['load-order-entry', 'collection-tab'];
            return (React.createElement(react_bootstrap_1.ListGroupItem, { key: key, className: classes.join(' ') },
                React.createElement(vortex_api_1.FlexLayout, { type: 'row' },
                    React.createElement("p", { className: 'load-order-index' }, idx),
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
        return (!!sortedMods && Object.keys(sortedMods).length !== 0)
            ? (React.createElement("div", { style: { overflow: 'auto' } },
                React.createElement("h4", null, t('Load Order')),
                React.createElement("p", null, t('Below is a preview of the load order for the mods that ' +
                    'are included in the current collection. If you wish to modify the load ' +
                    'please do so by opening the Load Order page; any changes made there ' +
                    'will be reflected in this collection.')),
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
function mapDispatchToProps(dispatch) {
    return {};
}
exports.default = (0, react_i18next_1.withTranslation)(['common', NAMESPACE])((0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(CollectionsDataView));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIkNvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQ0EsNkNBQStCO0FBQy9CLHFEQUFtRTtBQUNuRSxpREFBZ0Q7QUFDaEQsNkNBQXNDO0FBRXRDLGlDQUEwRDtBQUUxRCwyQ0FDb0Q7QUFFcEQsTUFBTSxTQUFTLEdBQVcsOEJBQThCLENBQUM7QUF1QnpELE1BQU0sbUJBQW9CLFNBQVEsd0JBQW9DO0lBQzdELE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxRQUFnQixFQUFFLEtBQXNCO1FBQzdFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLFFBQVEsQ0FBQztRQUNqRCxNQUFNLFVBQVUsR0FBRyxJQUFBLDZCQUFzQixFQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDdkUsT0FBTyxDQUFDLFVBQVUsS0FBSyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNuRSxDQUFDO0lBRUQsWUFBWSxLQUFhO1FBQ3ZCLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQWlDUCxzQkFBaUIsR0FBRyxHQUFHLEVBQUU7WUFDL0IsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ3RFLENBQUMsQ0FBQTtRQUNPLHVCQUFrQixHQUFHLEdBQUcsRUFBRTtZQUNoQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUN6QixPQUFPLENBQUMsb0JBQUMsd0JBQU0sSUFDYixFQUFFLEVBQUMsZUFBZSxFQUNsQixTQUFT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LFNBQVMsQ0FBQyxDQUFDLENBQ25ELElBQUEscUJBQU8sRUFBQyxlQUFlLEVBQUUsa0JBQWtCLENBQUMsQ0FDMUMsbUJBQW1CLENBQVEsQ0FBa0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIF8gZnJvbSAnbG9kYXNoJztcbmltcG9ydCAqIGFzIFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IEJ1dHRvbiwgTGlzdEdyb3VwLCBMaXN0R3JvdXBJdGVtIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCB7IHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcblxuaW1wb3J0IHsgZ2VuQ29sbGVjdGlvbkxvYWRPcmRlciwgZ2V0TW9kSWQgfSBmcm9tICcuL3V0aWwnO1xuXG5pbXBvcnQgeyBDb21wb25lbnRFeCwgRW1wdHlQbGFjZWhvbGRlciwgRmxleExheW91dCxcbiAgc2VsZWN0b3JzLCB0eXBlcywgVXNhZ2UsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuY29uc3QgTkFNRVNQQUNFOiBzdHJpbmcgPSAnZ2VuZXJpYy1sb2FkLW9yZGVyLWV4dGVuc2lvbic7XG5cbmludGVyZmFjZSBJRXh0ZW5kZWRJbnRlcmZhY2VQcm9wcyB7XG4gIGNvbGxlY3Rpb246IHR5cGVzLklNb2Q7XG59XG5cbmludGVyZmFjZSBJQmFzZVN0YXRlIHtcbiAgc29ydGVkTW9kczogc3RyaW5nW107XG59XG5cbmludGVyZmFjZSBJQ29ubmVjdGVkUHJvcHMge1xuICBnYW1lSWQ6IHN0cmluZztcbiAgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfTtcbiAgbG9hZE9yZGVyOiBzdHJpbmdbXTtcbiAgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGU7XG59XG5cbmludGVyZmFjZSBJQWN0aW9uUHJvcHMge1xufVxuXG50eXBlIElQcm9wcyA9IElBY3Rpb25Qcm9wcyAmIElFeHRlbmRlZEludGVyZmFjZVByb3BzICYgSUNvbm5lY3RlZFByb3BzO1xudHlwZSBJQ29tcG9uZW50U3RhdGUgPSBJQmFzZVN0YXRlO1xuXG5jbGFzcyBDb2xsZWN0aW9uc0RhdGFWaWV3IGV4dGVuZHMgQ29tcG9uZW50RXg8SVByb3BzLCBJQ29tcG9uZW50U3RhdGU+IHtcbiAgcHVibGljIHN0YXRpYyBnZXREZXJpdmVkU3RhdGVGcm9tUHJvcHMobmV3UHJvcHM6IElQcm9wcywgc3RhdGU6IElDb21wb25lbnRTdGF0ZSkge1xuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uIH0gPSBuZXdQcm9wcztcbiAgICBjb25zdCBzb3J0ZWRNb2RzID0gZ2VuQ29sbGVjdGlvbkxvYWRPcmRlcihsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24pO1xuICAgIHJldHVybiAoc29ydGVkTW9kcyAhPT0gc3RhdGUuc29ydGVkTW9kcykgPyB7IHNvcnRlZE1vZHMgfSA6IG51bGw7XG4gIH1cblxuICBjb25zdHJ1Y3Rvcihwcm9wczogSVByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIGNvbnN0IHsgbG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uIH0gPSBwcm9wcztcbiAgICB0aGlzLmluaXRTdGF0ZSh7XG4gICAgICBzb3J0ZWRNb2RzOiBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlciwgbW9kcywgY29sbGVjdGlvbikgfHwgW10sXG4gICAgfSk7XG4gIH1cblxuICBwdWJsaWMgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgY29uc3QgeyBsb2FkT3JkZXIsIG1vZHMsIGNvbGxlY3Rpb24gfSA9IHRoaXMucHJvcHM7XG4gICAgdGhpcy5uZXh0U3RhdGUuc29ydGVkTW9kcyA9IGdlbkNvbGxlY3Rpb25Mb2FkT3JkZXIobG9hZE9yZGVyLCBtb2RzLCBjb2xsZWN0aW9uKTtcbiAgfVxuXG4gIHB1YmxpYyByZW5kZXIoKTogSlNYLkVsZW1lbnQge1xuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7IHNvcnRlZE1vZHMgfSA9IHRoaXMuc3RhdGU7XG4gICAgcmV0dXJuICghIXNvcnRlZE1vZHMgJiYgT2JqZWN0LmtleXMoc29ydGVkTW9kcykubGVuZ3RoICE9PSAwKVxuICAgICAgPyAoXG4gICAgICAgIDxkaXYgc3R5bGU9e3sgb3ZlcmZsb3c6ICdhdXRvJyB9fT5cbiAgICAgICAgICA8aDQ+e3QoJ0xvYWQgT3JkZXInKX08L2g0PlxuICAgICAgICAgIDxwPlxuICAgICAgICAgIHt0KCdCZWxvdyBpcyBhIHByZXZpZXcgb2YgdGhlIGxvYWQgb3JkZXIgZm9yIHRoZSBtb2RzIHRoYXQgJyArXG4gICAgICAgICAgICAgJ2FyZSBpbmNsdWRlZCBpbiB0aGUgY3VycmVudCBjb2xsZWN0aW9uLiBJZiB5b3Ugd2lzaCB0byBtb2RpZnkgdGhlIGxvYWQgJyArXG4gICAgICAgICAgICAgJ3BsZWFzZSBkbyBzbyBieSBvcGVuaW5nIHRoZSBMb2FkIE9yZGVyIHBhZ2U7IGFueSBjaGFuZ2VzIG1hZGUgdGhlcmUgJyArXG4gICAgICAgICAgICAgJ3dpbGwgYmUgcmVmbGVjdGVkIGluIHRoaXMgY29sbGVjdGlvbi4nKVxuICAgICAgICAgIH1cbiAgICAgICAgICA8L3A+XG4gICAgICAgICAgPExpc3RHcm91cCBpZD0nY29sbGVjdGlvbnMtbG9hZC1vcmRlci1saXN0Jz5cbiAgICAgICAgICAgIHtzb3J0ZWRNb2RzLm1hcCh0aGlzLnJlbmRlck1vZEVudHJ5KX1cbiAgICAgICAgICA8L0xpc3RHcm91cD5cbiAgICAgICAgPC9kaXY+XG4gICAgKSA6IHRoaXMucmVuZGVyUGxhY2Vob2xkZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgb3BlbkxvYWRPcmRlclBhZ2UgPSAoKSA9PiB7XG4gICAgdGhpcy5jb250ZXh0LmFwaS5ldmVudHMuZW1pdCgnc2hvdy1tYWluLXBhZ2UnLCAnZ2VuZXJpYy1sb2Fkb3JkZXInKTtcbiAgfVxuICBwcml2YXRlIHJlbmRlck9wZW5MT0J1dHRvbiA9ICgpID0+IHtcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XG4gICAgcmV0dXJuICg8QnV0dG9uXG4gICAgICBpZD0nYnRuLW1vcmUtbW9kcydcbiAgICAgIGNsYXNzTmFtZT0nY29sbGVjdGlvbi1hZGQtbW9kcy1idG4nXG4gICAgICBvbkNsaWNrPXt0aGlzLm9wZW5Mb2FkT3JkZXJQYWdlfVxuICAgICAgYnNTdHlsZT0nZ2hvc3QnXG4gICAgPlxuICAgICAge3QoJ09wZW4gTG9hZCBPcmRlciBQYWdlJyl9XG4gICAgPC9CdXR0b24+KTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyUGxhY2Vob2xkZXIgPSAoKSA9PiB7XG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoXG4gICAgICA8RW1wdHlQbGFjZWhvbGRlclxuICAgICAgICBpY29uPSdzb3J0LW5vbmUnXG4gICAgICAgIHRleHQ9e3QoJ1lvdSBoYXZlIG5vIGxvYWQgb3JkZXIgZW50cmllcyAoZm9yIHRoZSBjdXJyZW50IG1vZHMgaW4gdGhlIGNvbGxlY3Rpb24pJyl9XG4gICAgICAgIHN1YnRleHQ9e3RoaXMucmVuZGVyT3BlbkxPQnV0dG9uKCl9XG4gICAgICAvPlxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIHJlbmRlck1vZEVudHJ5ID0gKGxvSWQ6IHN0cmluZykgPT4ge1xuICAgIGNvbnN0IHsgbW9kcyB9ID0gdGhpcy5wcm9wcztcbiAgICBjb25zdCB7IHNvcnRlZE1vZHMgfSA9IHRoaXMuc3RhdGU7XG4gICAgY29uc3QgbG9FbnRyeTogc3RyaW5nID0gdGhpcy5zdGF0ZS5zb3J0ZWRNb2RzW2xvSWRdO1xuICAgIGNvbnN0IGlkeCA9IHRoaXMuc3RhdGUuc29ydGVkTW9kcy5pbmRleE9mKGxvSWQpO1xuICAgIGNvbnN0IGtleSA9IGAke2lkeH0tJHtsb0lkfWA7XG4gICAgY29uc3QgbW9kSWQgPSBnZXRNb2RJZChtb2RzLCBsb0lkKTtcbiAgICBjb25zdCBuYW1lID0gdXRpbC5yZW5kZXJNb2ROYW1lKHRoaXMucHJvcHMubW9kc1ttb2RJZF0pIHx8IG1vZElkO1xuICAgIGNvbnN0IGNsYXNzZXMgPSBbJ2xvYWQtb3JkZXItZW50cnknLCAnY29sbGVjdGlvbi10YWInXTtcbiAgICByZXR1cm4gKFxuICAgICAgPExpc3RHcm91cEl0ZW1cbiAgICAgICAga2V5PXtrZXl9XG4gICAgICAgIGNsYXNzTmFtZT17Y2xhc3Nlcy5qb2luKCcgJyl9XG4gICAgICA+XG4gICAgICAgIDxGbGV4TGF5b3V0IHR5cGU9J3Jvdyc+XG4gICAgICAgICAgPHAgY2xhc3NOYW1lPSdsb2FkLW9yZGVyLWluZGV4Jz57aWR4fTwvcD5cbiAgICAgICAgICA8cD57bmFtZX08L3A+XG4gICAgICAgIDwvRmxleExheW91dD5cbiAgICAgIDwvTGlzdEdyb3VwSXRlbT5cbiAgICApO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZTogdHlwZXMuSVN0YXRlLCBvd25Qcm9wczogSVByb3BzKTogSUNvbm5lY3RlZFByb3BzIHtcbiAgY29uc3QgcHJvZmlsZSA9IHNlbGVjdG9ycy5hY3RpdmVQcm9maWxlKHN0YXRlKSB8fCB1bmRlZmluZWQ7XG4gIGxldCBsb2FkT3JkZXI6IHN0cmluZ1tdID0gW107XG4gIGlmICghIXByb2ZpbGU/LmdhbWVJZCkge1xuICAgIGxvYWRPcmRlciA9IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGUuaWRdLCBbXSk7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGdhbWVJZDogcHJvZmlsZT8uZ2FtZUlkLFxuICAgIGxvYWRPcmRlcixcbiAgICBtb2RzOiB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgcHJvZmlsZS5nYW1lSWRdLCB7fSksXG4gICAgcHJvZmlsZSxcbiAgfTtcbn1cblxuZnVuY3Rpb24gbWFwRGlzcGF0Y2hUb1Byb3BzKGRpc3BhdGNoOiBhbnkpOiBJQWN0aW9uUHJvcHMge1xuICByZXR1cm4ge307XG59XG5cbmV4cG9ydCBkZWZhdWx0IHdpdGhUcmFuc2xhdGlvbihbJ2NvbW1vbicsIE5BTUVTUEFDRV0pKFxuICBjb25uZWN0KG1hcFN0YXRlVG9Qcm9wcywgbWFwRGlzcGF0Y2hUb1Byb3BzKShcbiAgICBDb2xsZWN0aW9uc0RhdGFWaWV3KSBhcyBhbnkpIGFzIFJlYWN0LkNvbXBvbmVudENsYXNzPElFeHRlbmRlZEludGVyZmFjZVByb3BzPjtcbiJdfQ==