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
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const react_bootstrap_1 = require("react-bootstrap");
const react_i18next_1 = require("react-i18next");
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
const constants_1 = require("../constants");
const loadorder_1 = require("../loadorder");
const NAMESPACE = 'game-morrowind';
class MorrowindCollectionsDataView extends vortex_api_1.ComponentEx {
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
            this.props.api.events.emit('show-main-page', 'file-based-loadorder');
        };
        this.renderOpenLOButton = () => {
            const { t } = this.props;
            return (React.createElement(react_bootstrap_1.Button, { id: 'btn-more-mods', className: 'collection-add-mods-btn', onClick: this.openLoadOrderPage, bsStyle: 'ghost' }, t('Open Load Order Page')));
        };
        this.renderPlaceholder = () => {
            const { t } = this.props;
            return (React.createElement(vortex_api_1.EmptyPlaceholder, { icon: 'sort-none', text: t('You have no load order entries (for the current mods in the collection)'), subtext: this.renderOpenLOButton() }));
        };
        this.renderModEntry = (loEntry, idx) => {
            const key = loEntry.id + JSON.stringify(loEntry);
            const classes = ['load-order-entry', 'collection-tab'];
            return (React.createElement(react_bootstrap_1.ListGroupItem, { key: key, className: classes.join(' ') },
                React.createElement(vortex_api_1.FlexLayout, { type: 'row' },
                    React.createElement("p", { className: 'load-order-index' }, idx),
                    React.createElement("p", null, loEntry.name))));
        };
        this.initState({
            sortedMods: [],
        });
    }
    componentDidMount() {
        this.updateSortedMods();
    }
    componentDidUpdate(prevProps, prevState) {
        if (JSON.stringify(this.state.sortedMods) !== JSON.stringify(this.props.loadOrder)) {
            this.updateSortedMods();
        }
    }
    render() {
        const { t } = this.props;
        const { sortedMods } = this.state;
        return (!!sortedMods && Object.keys(sortedMods).length !== 0)
            ? (React.createElement("div", { style: { overflow: 'auto' } },
                React.createElement("h4", null, t('Load Order')),
                React.createElement("p", null, t('This is a snapshot of the load order information that '
                    + 'will be exported with this collection.')),
                this.renderLoadOrderEditInfo(),
                React.createElement(react_bootstrap_1.ListGroup, { id: 'collections-load-order-list' }, sortedMods.map((entry, idx) => this.renderModEntry(entry, idx))))) : this.renderPlaceholder();
    }
    updateSortedMods() {
        var _a;
        const includedModIds = (((_a = this.props.collection) === null || _a === void 0 ? void 0 : _a.rules) || []).map(rule => rule.reference.id);
        const mods = Object.keys(this.props.mods).reduce((accum, iter) => {
            if (includedModIds.includes(iter)) {
                accum[iter] = this.props.mods[iter];
            }
            return accum;
        }, {});
        (0, loadorder_1.deserializeLoadOrder)(this.props.api, mods)
            .then(lo => {
            const filtered = lo.filter(entry => (constants_1.NATIVE_PLUGINS.includes(entry.id) || entry.modId !== undefined));
            this.nextState.sortedMods = filtered;
        });
    }
}
const empty = [];
function mapStateToProps(state, ownProps) {
    const profile = vortex_api_1.selectors.activeProfile(state) || undefined;
    let loadOrder = [];
    if (!!(profile === null || profile === void 0 ? void 0 : profile.gameId)) {
        loadOrder = vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profile.id], empty);
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
exports.default = (0, react_i18next_1.withTranslation)(['common', NAMESPACE])((0, react_redux_1.connect)(mapStateToProps, mapDispatchToProps)(MorrowindCollectionsDataView));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSw2Q0FBK0I7QUFDL0IscURBQW1FO0FBQ25FLGlEQUFpRTtBQUNqRSw2Q0FBc0M7QUFHdEMsMkNBQ29EO0FBSXBELDRDQUE4QztBQUU5Qyw0Q0FBb0Q7QUFFcEQsTUFBTSxTQUFTLEdBQVcsZ0JBQWdCLENBQUM7QUF1QjNDLE1BQU0sNEJBQTZCLFNBQVEsd0JBQW9DO0lBQzdFLFlBQVksS0FBYTtRQUN2QixLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFrRFAsNEJBQXVCLEdBQUcsR0FBRyxFQUFFO1lBQ3JDLE1BQU0sRUFBRSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQ3pCLE9BQU8sQ0FDTCxvQkFBQyx1QkFBVSxJQUFDLElBQUksRUFBQyxLQUFLLEVBQUMsRUFBRSxFQUFDLCtDQUErQztnQkFDdkUsb0JBQUMsdUJBQVUsQ0FBQyxLQUFLLElBQUMsU0FBUyxFQUFDLDBCQUEwQjtvQkFDcEQsb0JBQUMsaUJBQUksSUFBQyxJQUFJLEVBQUMsYUFBYSxHQUFFLENBQ1Q7Z0JBQ25CLG9CQUFDLHVCQUFVLENBQUMsS0FBSyxJQUFDLFNBQVMsRUFBQyxxQ0FBcUM7b0JBQzlELENBQUMsQ0FBQyw2Q0FBNkMsQ0FBQztvQkFDakQsMkJBQ0UsU0FBUyxFQUFDLFdBQVcsRUFDckIsT0FBTyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsRUFDL0IsS0FBSyxFQUFFLENBQUMsQ0FBQyx1QkFBdUIsQ0FBQyxJQUVoQyxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FDcEI7b0JBQ0gsQ0FBQyxDQUFDLG1FQUFtRTswQkFDcEUsK0RBQStELENBQUMsQ0FDakQsQ0FDUixDQUNkLENBQUM7UUFDSixDQUFD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IExpc3RHcm91cCwgTGlzdEdyb3VwSXRlbSB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XG5pbXBvcnQgeyBXaXRoVHJhbnNsYXRpb24sIHdpdGhUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgY29ubmVjdCB9IGZyb20gJ3JlYWN0LXJlZHV4JztcblxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSAnLi4vLi4vLi4vLi4vc3JjL3V0aWwvcGxhdGZvcm0nO1xuaW1wb3J0IHsgQ29tcG9uZW50RXgsIEVtcHR5UGxhY2Vob2xkZXIsIEZsZXhMYXlvdXQsIEljb24sXG4gICAgICAgICBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IElFeHRlbmRlZEludGVyZmFjZVByb3BzLCBJTG9hZE9yZGVyRW50cnkgfSBmcm9tICcuLi90eXBlcy90eXBlcyc7XG5cbmltcG9ydCB7IE5BVElWRV9QTFVHSU5TIH0gZnJvbSAnLi4vY29uc3RhbnRzJztcblxuaW1wb3J0IHsgZGVzZXJpYWxpemVMb2FkT3JkZXIgfSBmcm9tICcuLi9sb2Fkb3JkZXInO1xuXG5jb25zdCBOQU1FU1BBQ0U6IHN0cmluZyA9ICdnYW1lLW1vcnJvd2luZCc7XG5cbmludGVyZmFjZSBJQmFzZVN0YXRlIHtcbiAgc29ydGVkTW9kczogSUxvYWRPcmRlckVudHJ5W107XG59XG5cbmludGVyZmFjZSBJQmFzZVByb3BzIHtcbiAgYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpO1xufVxuXG5pbnRlcmZhY2UgSUNvbm5lY3RlZFByb3BzIHtcbiAgZ2FtZUlkOiBzdHJpbmc7XG4gIG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH07XG4gIGxvYWRPcmRlcjogSUxvYWRPcmRlckVudHJ5W107XG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xufVxuXG5pbnRlcmZhY2UgSUFjdGlvblByb3BzIHtcbn1cblxudHlwZSBJUHJvcHMgPSBJQmFzZVByb3BzICYgSUFjdGlvblByb3BzICYgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHMgJiBJQ29ubmVjdGVkUHJvcHM7XG50eXBlIElDb21wb25lbnRTdGF0ZSA9IElCYXNlU3RhdGU7XG5cbmNsYXNzIE1vcnJvd2luZENvbGxlY3Rpb25zRGF0YVZpZXcgZXh0ZW5kcyBDb21wb25lbnRFeDxJUHJvcHMsIElDb21wb25lbnRTdGF0ZT4ge1xuICBjb25zdHJ1Y3Rvcihwcm9wczogSVByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMuaW5pdFN0YXRlKHtcbiAgICAgIHNvcnRlZE1vZHM6IFtdLFxuICAgIH0pO1xuICB9XG5cbiAgcHVibGljIGNvbXBvbmVudERpZE1vdW50KCkge1xuICAgIHRoaXMudXBkYXRlU29ydGVkTW9kcygpO1xuICB9XG5cbiAgcHVibGljIGNvbXBvbmVudERpZFVwZGF0ZShwcmV2UHJvcHM6IElQcm9wcywgcHJldlN0YXRlOiBJQmFzZVN0YXRlKTogdm9pZCB7XG4gICAgaWYgKEpTT04uc3RyaW5naWZ5KHRoaXMuc3RhdGUuc29ydGVkTW9kcykgIT09IEpTT04uc3RyaW5naWZ5KHRoaXMucHJvcHMubG9hZE9yZGVyKSl7XG4gICAgICB0aGlzLnVwZGF0ZVNvcnRlZE1vZHMoKTtcbiAgICB9XG4gIH1cblxuICBwdWJsaWMgcmVuZGVyKCk6IEpTWC5FbGVtZW50IHtcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XG4gICAgY29uc3QgeyBzb3J0ZWRNb2RzIH0gPSB0aGlzLnN0YXRlO1xuICAgIHJldHVybiAoISFzb3J0ZWRNb2RzICYmIE9iamVjdC5rZXlzKHNvcnRlZE1vZHMpLmxlbmd0aCAhPT0gMClcbiAgICAgID8gKFxuICAgICAgICA8ZGl2IHN0eWxlPXt7IG92ZXJmbG93OiAnYXV0bycgfX0+XG4gICAgICAgICAgPGg0Pnt0KCdMb2FkIE9yZGVyJyl9PC9oND5cbiAgICAgICAgICA8cD5cbiAgICAgICAgICAgIHt0KCdUaGlzIGlzIGEgc25hcHNob3Qgb2YgdGhlIGxvYWQgb3JkZXIgaW5mb3JtYXRpb24gdGhhdCAnXG4gICAgICAgICAgICsgJ3dpbGwgYmUgZXhwb3J0ZWQgd2l0aCB0aGlzIGNvbGxlY3Rpb24uJyl9XG4gICAgICAgICAgPC9wPlxuICAgICAgICAgIHt0aGlzLnJlbmRlckxvYWRPcmRlckVkaXRJbmZvKCl9XG4gICAgICAgICAgPExpc3RHcm91cCBpZD0nY29sbGVjdGlvbnMtbG9hZC1vcmRlci1saXN0Jz5cbiAgICAgICAgICAgIHtzb3J0ZWRNb2RzLm1hcCgoZW50cnksIGlkeCkgPT4gdGhpcy5yZW5kZXJNb2RFbnRyeShlbnRyeSwgaWR4KSl9XG4gICAgICAgICAgPC9MaXN0R3JvdXA+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKSA6IHRoaXMucmVuZGVyUGxhY2Vob2xkZXIoKTtcbiAgfVxuXG4gIHByaXZhdGUgdXBkYXRlU29ydGVkTW9kcygpIHtcbiAgICBjb25zdCBpbmNsdWRlZE1vZElkcyA9ICh0aGlzLnByb3BzLmNvbGxlY3Rpb24/LnJ1bGVzIHx8IFtdKS5tYXAocnVsZSA9PiBydWxlLnJlZmVyZW5jZS5pZCk7XG4gICAgY29uc3QgbW9kcyA9IE9iamVjdC5rZXlzKHRoaXMucHJvcHMubW9kcykucmVkdWNlKChhY2N1bSwgaXRlcikgPT4ge1xuICAgICAgaWYgKGluY2x1ZGVkTW9kSWRzLmluY2x1ZGVzKGl0ZXIpKSB7XG4gICAgICAgIGFjY3VtW2l0ZXJdID0gdGhpcy5wcm9wcy5tb2RzW2l0ZXJdO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY3VtO1xuICAgIH0sIHt9KVxuICAgIGRlc2VyaWFsaXplTG9hZE9yZGVyKHRoaXMucHJvcHMuYXBpLCBtb2RzKVxuICAgICAgLnRoZW4obG8gPT4ge1xuICAgICAgICBjb25zdCBmaWx0ZXJlZCA9IGxvLmZpbHRlcihlbnRyeSA9PiAoTkFUSVZFX1BMVUdJTlMuaW5jbHVkZXMoZW50cnkuaWQpIHx8IGVudHJ5Lm1vZElkICE9PSB1bmRlZmluZWQpKTtcbiAgICAgICAgdGhpcy5uZXh0U3RhdGUuc29ydGVkTW9kcyA9IGZpbHRlcmVkO1xuICAgICAgfSlcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTG9hZE9yZGVyRWRpdEluZm8gPSAoKSA9PiB7XG4gICAgY29uc3QgeyB0IH0gPSB0aGlzLnByb3BzO1xuICAgIHJldHVybiAoXG4gICAgICA8RmxleExheW91dCB0eXBlPSdyb3cnIGlkPSdjb2xsZWN0aW9uLWVkaXQtbG9hZG9yZGVyLWVkaXQtaW5mby1jb250YWluZXInPlxuICAgICAgICA8RmxleExheW91dC5GaXhlZCBjbGFzc05hbWU9J2xvYWRvcmRlci1lZGl0LWluZm8taWNvbic+XG4gICAgICAgICAgPEljb24gbmFtZT0nZGlhbG9nLWluZm8nLz5cbiAgICAgICAgPC9GbGV4TGF5b3V0LkZpeGVkPlxuICAgICAgICA8RmxleExheW91dC5GaXhlZCBjbGFzc05hbWU9J2NvbGxlY3Rpb24tZWRpdC1sb2Fkb3JkZXItZWRpdC1pbmZvJz5cbiAgICAgICAgICB7dCgnWW91IGNhbiBtYWtlIGNoYW5nZXMgdG8gdGhpcyBkYXRhIGZyb20gdGhlICcpfVxuICAgICAgICAgIDxhXG4gICAgICAgICAgICBjbGFzc05hbWU9J2Zha2UtbGluaydcbiAgICAgICAgICAgIG9uQ2xpY2s9e3RoaXMub3BlbkxvYWRPcmRlclBhZ2V9XG4gICAgICAgICAgICB0aXRsZT17dCgnR28gdG8gTG9hZCBPcmRlciBQYWdlJyl9XG4gICAgICAgICAgPlxuICAgICAgICAgICAge3QoJ0xvYWQgT3JkZXIgcGFnZS4nKX1cbiAgICAgICAgICA8L2E+XG4gICAgICAgICAge3QoJyBJZiB5b3UgYmVsaWV2ZSBhIGxvYWQgb3JkZXIgZW50cnkgaXMgbWlzc2luZywgcGxlYXNlIGVuc3VyZSB0aGUgJ1xuICAgICAgICAgICsgJ3JlbGV2YW50IG1vZCBpcyBlbmFibGVkIGFuZCBoYXMgYmVlbiBhZGRlZCB0byB0aGUgY29sbGVjdGlvbi4nKX1cbiAgICAgICAgPC9GbGV4TGF5b3V0LkZpeGVkPlxuICAgICAgPC9GbGV4TGF5b3V0PlxuICAgICk7XG4gIH1cblxuICBwcml2YXRlIG9wZW5Mb2FkT3JkZXJQYWdlID0gKCkgPT4ge1xuICAgIHRoaXMucHJvcHMuYXBpLmV2ZW50cy5lbWl0KCdzaG93LW1haW4tcGFnZScsICdmaWxlLWJhc2VkLWxvYWRvcmRlcicpO1xuICB9XG4gIHByaXZhdGUgcmVuZGVyT3BlbkxPQnV0dG9uID0gKCkgPT4ge1xuICAgIGNvbnN0IHsgdCB9ID0gdGhpcy5wcm9wcztcbiAgICByZXR1cm4gKDxCdXR0b25cbiAgICAgIGlkPSdidG4tbW9yZS1tb2RzJ1xuICAgICAgY2xhc3NOYW1lPSdjb2xsZWN0aW9uLWFkZC1tb2RzLWJ0bidcbiAgICAgIG9uQ2xpY2s9e3RoaXMub3BlbkxvYWRPcmRlclBhZ2V9XG4gICAgICBic1N0eWxlPSdnaG9zdCdcbiAgICA+XG4gICAgICB7dCgnT3BlbiBMb2FkIE9yZGVyIFBhZ2UnKX1cbiAgICA8L0J1dHRvbj4pO1xuICB9XG5cbiAgcHJpdmF0ZSByZW5kZXJQbGFjZWhvbGRlciA9ICgpID0+IHtcbiAgICBjb25zdCB7IHQgfSA9IHRoaXMucHJvcHM7XG4gICAgcmV0dXJuIChcbiAgICAgIDxFbXB0eVBsYWNlaG9sZGVyXG4gICAgICAgIGljb249J3NvcnQtbm9uZSdcbiAgICAgICAgdGV4dD17dCgnWW91IGhhdmUgbm8gbG9hZCBvcmRlciBlbnRyaWVzIChmb3IgdGhlIGN1cnJlbnQgbW9kcyBpbiB0aGUgY29sbGVjdGlvbiknKX1cbiAgICAgICAgc3VidGV4dD17dGhpcy5yZW5kZXJPcGVuTE9CdXR0b24oKX1cbiAgICAgIC8+XG4gICAgKTtcbiAgfVxuXG4gIHByaXZhdGUgcmVuZGVyTW9kRW50cnkgPSAobG9FbnRyeTogSUxvYWRPcmRlckVudHJ5LCBpZHg6IG51bWJlcikgPT4ge1xuICAgIGNvbnN0IGtleSA9IGxvRW50cnkuaWQgKyBKU09OLnN0cmluZ2lmeShsb0VudHJ5KTtcbiAgICBjb25zdCBjbGFzc2VzID0gWydsb2FkLW9yZGVyLWVudHJ5JywgJ2NvbGxlY3Rpb24tdGFiJ107XG4gICAgcmV0dXJuIChcbiAgICAgIDxMaXN0R3JvdXBJdGVtXG4gICAgICAgIGtleT17a2V5fVxuICAgICAgICBjbGFzc05hbWU9e2NsYXNzZXMuam9pbignICcpfVxuICAgICAgPlxuICAgICAgICA8RmxleExheW91dCB0eXBlPSdyb3cnPlxuICAgICAgICAgIDxwIGNsYXNzTmFtZT0nbG9hZC1vcmRlci1pbmRleCc+e2lkeH08L3A+XG4gICAgICAgICAgPHA+e2xvRW50cnkubmFtZX08L3A+XG4gICAgICAgIDwvRmxleExheW91dD5cbiAgICAgIDwvTGlzdEdyb3VwSXRlbT5cbiAgICApO1xuICB9XG59XG5cbmNvbnN0IGVtcHR5ID0gW107XG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IHR5cGVzLklTdGF0ZSwgb3duUHJvcHM6IElQcm9wcyk6IElDb25uZWN0ZWRQcm9wcyB7XG4gIGNvbnN0IHByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSkgfHwgdW5kZWZpbmVkO1xuICBsZXQgbG9hZE9yZGVyOiBJTG9hZE9yZGVyRW50cnlbXSA9IFtdO1xuICBpZiAoISFwcm9maWxlPy5nYW1lSWQpIHtcbiAgICBsb2FkT3JkZXIgPSB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlLmlkXSwgZW1wdHkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBnYW1lSWQ6IHByb2ZpbGU/LmdhbWVJZCxcbiAgICBsb2FkT3JkZXIsXG4gICAgbW9kczogdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIHByb2ZpbGUuZ2FtZUlkXSwge30pLFxuICAgIHByb2ZpbGUsXG4gIH07XG59XG5cbmZ1bmN0aW9uIG1hcERpc3BhdGNoVG9Qcm9wcyhkaXNwYXRjaDogYW55KTogSUFjdGlvblByb3BzIHtcbiAgcmV0dXJuIHt9O1xufVxuXG5leHBvcnQgZGVmYXVsdCB3aXRoVHJhbnNsYXRpb24oWydjb21tb24nLCBOQU1FU1BBQ0VdKShcbiAgY29ubmVjdChtYXBTdGF0ZVRvUHJvcHMsIG1hcERpc3BhdGNoVG9Qcm9wcykoXG4gICAgTW9ycm93aW5kQ29sbGVjdGlvbnNEYXRhVmlldykgYXMgYW55KSBhcyBSZWFjdC5Db21wb25lbnRDbGFzczxJQmFzZVByb3BzICYgSUV4dGVuZGVkSW50ZXJmYWNlUHJvcHM+O1xuIl19