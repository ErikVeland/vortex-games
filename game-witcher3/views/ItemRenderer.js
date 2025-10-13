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
exports.ItemRenderer = ItemRenderer;
const React = __importStar(require("react"));
const react_bootstrap_1 = require("react-bootstrap");
const react_i18next_1 = require("react-i18next");
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
const common_1 = require("../common");
function ItemRenderer(props) {
    var _a;
    if (((_a = props === null || props === void 0 ? void 0 : props.item) === null || _a === void 0 ? void 0 : _a.loEntry) === undefined) {
        return null;
    }
    const stateProps = (0, react_redux_1.useSelector)(mapStateToProps);
    const dispatch = (0, react_redux_1.useDispatch)();
    const onSetLoadOrder = React.useCallback((profileId, loadOrder) => {
        dispatch(vortex_api_1.actions.setFBLoadOrder(profileId, loadOrder));
    }, [dispatch, stateProps.profile.id, stateProps.loadOrder]);
    return renderDraggable(Object.assign(Object.assign(Object.assign({}, props), stateProps), { onSetLoadOrder }));
}
function renderValidationError(props) {
    const { invalidEntries, loEntry } = props.item;
    const invalidEntry = (invalidEntries !== undefined)
        ? invalidEntries.find(inv => inv.id.toLowerCase() === loEntry.id.toLowerCase())
        : undefined;
    return (invalidEntry !== undefined)
        ? (React.createElement(vortex_api_1.tooltip.Icon, { className: 'fblo-invalid-entry', name: 'feedback-error', tooltip: invalidEntry.reason })) : null;
}
function renderViewModIcon(props) {
    const { item, mods } = props;
    if (isExternal(item.loEntry) || item.loEntry.modId === item.loEntry.name) {
        return null;
    }
    const context = React.useContext(vortex_api_1.MainContext);
    const [t] = (0, react_i18next_1.useTranslation)(common_1.I18N_NAMESPACE);
    const onClick = React.useCallback(() => {
        const { modId } = item.loEntry;
        const mod = mods === null || mods === void 0 ? void 0 : mods[modId];
        if (mod === undefined) {
            return;
        }
        const batched = [
            vortex_api_1.actions.setAttributeFilter('mods', 'name', vortex_api_1.util.renderModName(mod)),
        ];
        vortex_api_1.util.batchDispatch(context.api.store.dispatch, batched);
        context.api.events.emit('show-main-page', 'Mods');
    }, [item, mods, context]);
    return item.loEntry.modId !== undefined ? (React.createElement(vortex_api_1.tooltip.IconButton, { className: 'witcher3-view-mod-icon', icon: 'open-ext', tooltip: t('View source Mod'), onClick: onClick })) : null;
}
function renderExternalBanner(item) {
    const [t] = (0, react_i18next_1.useTranslation)(common_1.I18N_NAMESPACE);
    return isExternal(item) ? (React.createElement("div", { className: 'load-order-unmanaged-banner' },
        React.createElement(vortex_api_1.Icon, { className: 'external-caution-logo', name: 'feedback-warning' }),
        React.createElement("span", { className: 'external-text-area' }, t('Not managed by Vortex')))) : null;
}
function renderDraggable(props) {
    var _a;
    const { loadOrder, className, item, profile } = props;
    const key = !!((_a = item === null || item === void 0 ? void 0 : item.loEntry) === null || _a === void 0 ? void 0 : _a.name) ? `${item.loEntry.name}` : `${item.loEntry.id}`;
    const context = React.useContext(vortex_api_1.MainContext);
    const dispatch = (0, react_redux_1.useDispatch)();
    const position = loadOrder.findIndex(entry => entry.id === item.loEntry.id) + 1;
    let classes = ['load-order-entry'];
    if (className !== undefined) {
        classes = classes.concat(className.split(' '));
    }
    if (isExternal(item.loEntry)) {
        classes = classes.concat('external');
    }
    const onStatusChange = React.useCallback((evt) => {
        const entry = Object.assign(Object.assign({}, item.loEntry), { enabled: evt.target.checked });
        dispatch(vortex_api_1.actions.setFBLoadOrderEntry(profile.id, entry));
    }, [dispatch, profile, item]);
    const onApplyIndex = React.useCallback((idx) => {
        const { item, onSetLoadOrder, profile, loadOrder } = props;
        const currentIdx = currentPosition(props);
        if (currentIdx === idx) {
            return;
        }
        const entry = Object.assign(Object.assign({}, item.loEntry), { index: idx });
        const newLO = loadOrder.filter((entry) => entry.id !== item.loEntry.id);
        newLO.splice(idx - 1, 0, entry);
        onSetLoadOrder(profile.id, newLO);
    }, [dispatch, profile, item]);
    const checkBox = () => (item.displayCheckboxes)
        ? (React.createElement(react_bootstrap_1.Checkbox, { className: 'entry-checkbox', checked: item.loEntry.enabled, disabled: isLocked(item.loEntry), onChange: onStatusChange }))
        : null;
    const lock = () => (isLocked(item.loEntry))
        ? (React.createElement(vortex_api_1.Icon, { className: 'locked-entry-logo', name: 'locked' })) : null;
    return (React.createElement(react_bootstrap_1.ListGroupItem, { key: key, className: classes.join(' '), ref: props.item.setRef },
        React.createElement(vortex_api_1.Icon, { className: 'drag-handle-icon', name: 'drag-handle' }),
        React.createElement(vortex_api_1.LoadOrderIndexInput, { className: 'load-order-index', api: context.api, item: item.loEntry, currentPosition: currentPosition(props), lockedEntriesCount: lockedEntriesCount(props), loadOrder: loadOrder, isLocked: isLocked, onApplyIndex: onApplyIndex }),
        renderValidationError(props),
        React.createElement("p", { className: 'load-order-name' }, key),
        renderExternalBanner(item.loEntry),
        renderViewModIcon(props),
        checkBox(),
        lock()));
}
function isLocked(item) {
    return [true, 'true', 'always'].includes(item.locked);
}
function isExternal(item) {
    return (item.modId !== undefined) ? false : true;
}
const currentPosition = (props) => {
    const { item, loadOrder } = props;
    return loadOrder.findIndex(entry => entry.id === item.loEntry.id) + 1;
};
const lockedEntriesCount = (props) => {
    const { loadOrder } = props;
    const locked = loadOrder.filter(item => isLocked(item));
    return locked.length;
};
const empty = {};
function mapStateToProps(state) {
    const profile = vortex_api_1.selectors.activeProfile(state);
    return {
        profile,
        loadOrder: vortex_api_1.util.getSafe(state, ['persistent', 'loadOrder', profile.id], []),
        modState: vortex_api_1.util.getSafe(profile, ['modState'], empty),
        mods: vortex_api_1.util.getSafe(state, ['persistent', 'mods', common_1.GAME_ID], {}),
    };
}
exports.default = ItemRenderer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSXRlbVJlbmRlcmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSXRlbVJlbmRlcmVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTRCQSxvQ0FhQztBQXpDRCw2Q0FBK0I7QUFDL0IscURBQTBEO0FBQzFELGlEQUErQztBQUMvQyw2Q0FBdUQ7QUFFdkQsMkNBQThHO0FBQzlHLHNDQUFvRDtBQXNCcEQsU0FBZ0IsWUFBWSxDQUFDLEtBQWlCOztJQUM1QyxJQUFJLENBQUEsTUFBQSxLQUFLLGFBQUwsS0FBSyx1QkFBTCxLQUFLLENBQUUsSUFBSSwwQ0FBRSxPQUFPLE1BQUssU0FBUyxFQUFFLENBQUM7UUFDdkMsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0QsTUFBTSxVQUFVLEdBQUcsSUFBQSx5QkFBVyxFQUFDLGVBQWUsQ0FBQyxDQUFDO0lBQ2hELE1BQU0sUUFBUSxHQUFHLElBQUEseUJBQVcsR0FBRSxDQUFDO0lBQy9CLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxXQUFXLENBQ3RDLENBQUMsU0FBaUIsRUFBRSxTQUEwQixFQUFFLEVBQUU7UUFDaEQsUUFBUSxDQUFDLG9CQUFPLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO0lBQ3pELENBQUMsRUFDRCxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsRUFBRSxVQUFVLENBQUMsU0FBUyxDQUFDLENBQ3hELENBQUE7SUFDRCxPQUFPLGVBQWUsK0NBQU0sS0FBSyxHQUFLLFVBQVUsS0FBRSxjQUFjLElBQUcsQ0FBQztBQUN0RSxDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFhO0lBQzFDLE1BQU0sRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztJQUMvQyxNQUFNLFlBQVksR0FBRyxDQUFDLGNBQWMsS0FBSyxT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YSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9ELE9BQU87UUFDTCxPQUFPO1FBQ1AsU0FBUyxFQUFFLGlCQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLFlBQVksRUFBRSxXQUFXLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUMzRSxRQUFRLEVBQUUsaUJBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsVUFBVSxDQUFDLEVBQUUsS0FBSyxDQUFDO1FBQ3BELElBQUksRUFBRSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsTUFBTSxFQUFFLGdCQUFPLENBQUMsRUFBRSxFQUFFLENBQUM7S0FDL0QsQ0FBQztBQUNKLENBQUM7QUFFRCxrQkFBZSxZQUFZLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyBDaGVja2JveCwgTGlzdEdyb3VwSXRlbSB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XG5pbXBvcnQgeyB1c2VUcmFuc2xhdGlvbiB9IGZyb20gJ3JlYWN0LWkxOG5leHQnO1xuaW1wb3J0IHsgdXNlRGlzcGF0Y2gsIHVzZVNlbGVjdG9yIH0gZnJvbSAncmVhY3QtcmVkdXgnO1xuXG5pbXBvcnQgeyBhY3Rpb25zLCBJY29uLCBMb2FkT3JkZXJJbmRleElucHV0LCB0b29sdGlwLCBzZWxlY3RvcnMsIHR5cGVzLCB1dGlsLCBNYWluQ29udGV4dCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuaW1wb3J0IHsgSTE4Tl9OQU1FU1BBQ0UsIEdBTUVfSUQgfSBmcm9tICcuLi9jb21tb24nO1xuaW1wb3J0IHsgSUl0ZW1SZW5kZXJlclByb3BzIH0gZnJvbSAnLi4vdHlwZXMnO1xuXG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tICcuLi8uLi8uLi8uLi9zcmMvdXRpbC9wbGF0Zm9ybSc7XG5pbnRlcmZhY2UgSUFjdGlvblByb3BzIHtcbiAgb25TZXRMb2FkT3JkZXI6IChwcm9maWxlSWQ6IHN0cmluZywgbG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIpID0+IHZvaWQ7XG59XG5cbmludGVyZmFjZSBJQ29ubmVjdGVkUHJvcHMge1xuICBtb2RTdGF0ZTogYW55O1xuICBsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlcjtcbiAgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGU7XG4gIG1vZHM6IHsgW21vZElkOiBzdHJpbmddOiB0eXBlcy5JTW9kIH07XG59XG5cbmludGVyZmFjZSBJQmFzZVByb3BzIHtcbiAgY2xhc3NOYW1lPzogc3RyaW5nO1xuICBpdGVtOiBJSXRlbVJlbmRlcmVyUHJvcHM7XG59XG5cbnR5cGUgSVByb3BzID0gSUJhc2VQcm9wcyAmIElDb25uZWN0ZWRQcm9wcyAmIElBY3Rpb25Qcm9wcztcblxuZXhwb3J0IGZ1bmN0aW9uIEl0ZW1SZW5kZXJlcihwcm9wczogSUJhc2VQcm9wcykge1xuICBpZiAocHJvcHM/Lml0ZW0/LmxvRW50cnkgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IHN0YXRlUHJvcHMgPSB1c2VTZWxlY3RvcihtYXBTdGF0ZVRvUHJvcHMpO1xuICBjb25zdCBkaXNwYXRjaCA9IHVzZURpc3BhdGNoKCk7XG4gIGNvbnN0IG9uU2V0TG9hZE9yZGVyID0gUmVhY3QudXNlQ2FsbGJhY2soXG4gICAgKHByb2ZpbGVJZDogc3RyaW5nLCBsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlcikgPT4ge1xuICAgICAgZGlzcGF0Y2goYWN0aW9ucy5zZXRGQkxvYWRPcmRlcihwcm9maWxlSWQsIGxvYWRPcmRlcikpO1xuICAgIH0sXG4gICAgW2Rpc3BhdGNoLCBzdGF0ZVByb3BzLnByb2ZpbGUuaWQsIHN0YXRlUHJvcHMubG9hZE9yZGVyXVxuICApXG4gIHJldHVybiByZW5kZXJEcmFnZ2FibGUoeyAuLi5wcm9wcywgLi4uc3RhdGVQcm9wcywgb25TZXRMb2FkT3JkZXIgfSk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlclZhbGlkYXRpb25FcnJvcihwcm9wczogSVByb3BzKTogSlNYLkVsZW1lbnQge1xuICBjb25zdCB7IGludmFsaWRFbnRyaWVzLCBsb0VudHJ5IH0gPSBwcm9wcy5pdGVtO1xuICBjb25zdCBpbnZhbGlkRW50cnkgPSAoaW52YWxpZEVudHJpZXMgIT09IHVuZGVmaW5lZClcbiAgICA/IGludmFsaWRFbnRyaWVzLmZpbmQoaW52ID0+IGludi5pZC50b0xvd2VyQ2FzZSgpID09PSBsb0VudHJ5LmlkLnRvTG93ZXJDYXNlKCkpXG4gICAgOiB1bmRlZmluZWQ7XG4gIHJldHVybiAoaW52YWxpZEVudHJ5ICE9PSB1bmRlZmluZWQpXG4gICAgPyAoXG4gICAgICA8dG9vbHRpcC5JY29uXG4gICAgICAgIGNsYXNzTmFtZT0nZmJsby1pbnZhbGlkLWVudHJ5J1xuICAgICAgICBuYW1lPSdmZWVkYmFjay1lcnJvcidcbiAgICAgICAgdG9vbHRpcD17aW52YWxpZEVudHJ5LnJlYXNvbn1cbiAgICAgIC8+XG4gICAgKSA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlbmRlclZpZXdNb2RJY29uKHByb3BzOiBJUHJvcHMpOiBKU1guRWxlbWVudCB7XG4gIGNvbnN0IHsgaXRlbSwgbW9kcyB9ID0gcHJvcHM7XG4gIGlmIChpc0V4dGVybmFsKGl0ZW0ubG9FbnRyeSkgfHwgaXRlbS5sb0VudHJ5Lm1vZElkID09PSBpdGVtLmxvRW50cnkubmFtZSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGNvbnRleHQgPSBSZWFjdC51c2VDb250ZXh0KE1haW5Db250ZXh0KTtcbiAgY29uc3QgW3RdID0gdXNlVHJhbnNsYXRpb24oSTE4Tl9OQU1FU1BBQ0UpO1xuICBjb25zdCBvbkNsaWNrID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIGNvbnN0IHsgbW9kSWQgfSA9IGl0ZW0ubG9FbnRyeTtcbiAgICBjb25zdCBtb2QgPSBtb2RzPy5bbW9kSWRdO1xuICAgIGlmIChtb2QgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBiYXRjaGVkID0gW1xuICAgICAgYWN0aW9ucy5zZXRBdHRyaWJ1dGVGaWx0ZXIoJ21vZHMnLCAnbmFtZScsIHV0aWwucmVuZGVyTW9kTmFtZShtb2QpKSxcbiAgICBdO1xuICAgIHV0aWwuYmF0Y2hEaXNwYXRjaChjb250ZXh0LmFwaS5zdG9yZS5kaXNwYXRjaCwgYmF0Y2hlZCk7XG4gICAgY29udGV4dC5hcGkuZXZlbnRzLmVtaXQoJ3Nob3ctbWFpbi1wYWdlJywgJ01vZHMnKTtcbiAgfSwgW2l0ZW0sIG1vZHMsIGNvbnRleHRdKTtcbiAgcmV0dXJuIGl0ZW0ubG9FbnRyeS5tb2RJZCAhPT0gdW5kZWZpbmVkID8gKFxuICAgIDx0b29sdGlwLkljb25CdXR0b25cbiAgICAgIGNsYXNzTmFtZT0nd2l0Y2hlcjMtdmlldy1tb2QtaWNvbidcbiAgICAgIGljb249J29wZW4tZXh0J1xuICAgICAgdG9vbHRpcD17dCgnVmlldyBzb3VyY2UgTW9kJyl9XG4gICAgICBvbkNsaWNrPXtvbkNsaWNrfVxuICAgIC8+XG4gICkgOiBudWxsO1xufVxuXG5mdW5jdGlvbiByZW5kZXJFeHRlcm5hbEJhbm5lcihpdGVtOiB0eXBlcy5JTG9hZE9yZGVyRW50cnkpOiBKU1guRWxlbWVudCB7XG4gIGNvbnN0IFt0XSA9IHVzZVRyYW5zbGF0aW9uKEkxOE5fTkFNRVNQQUNFKTtcbiAgcmV0dXJuIGlzRXh0ZXJuYWwoaXRlbSkgPyAoXG4gICAgPGRpdiBjbGFzc05hbWU9J2xvYWQtb3JkZXItdW5tYW5hZ2VkLWJhbm5lcic+XG4gICAgICA8SWNvbiBjbGFzc05hbWU9J2V4dGVybmFsLWNhdXRpb24tbG9nbycgbmFtZT0nZmVlZGJhY2std2FybmluZycgLz5cbiAgICAgIDxzcGFuIGNsYXNzTmFtZT0nZXh0ZXJuYWwtdGV4dC1hcmVhJz57dCgnTm90IG1hbmFnZWQgYnkgVm9ydGV4Jyl9PC9zcGFuPlxuICAgIDwvZGl2PlxuICApIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVuZGVyRHJhZ2dhYmxlKHByb3BzOiBJUHJvcHMpOiBKU1guRWxlbWVudCB7XG4gIGNvbnN0IHsgbG9hZE9yZGVyLCBjbGFzc05hbWUsIGl0ZW0sIHByb2ZpbGUgfSA9IHByb3BzO1xuICBjb25zdCBrZXkgPSAhIWl0ZW0/LmxvRW50cnk/Lm5hbWUgPyBgJHtpdGVtLmxvRW50cnkubmFtZX1gIDogYCR7aXRlbS5sb0VudHJ5LmlkfWA7XG4gIGNvbnN0IGNvbnRleHQgPSBSZWFjdC51c2VDb250ZXh0KE1haW5Db250ZXh0KTtcbiAgY29uc3QgZGlzcGF0Y2ggPSB1c2VEaXNwYXRjaCgpO1xuICBjb25zdCBwb3NpdGlvbiA9IGxvYWRPcmRlci5maW5kSW5kZXgoZW50cnkgPT4gZW50cnkuaWQgPT09IGl0ZW0ubG9FbnRyeS5pZCkgKyAxO1xuXG4gIGxldCBjbGFzc2VzID0gWydsb2FkLW9yZGVyLWVudHJ5J107XG4gIGlmIChjbGFzc05hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgIGNsYXNzZXMgPSBjbGFzc2VzLmNvbmNhdChjbGFzc05hbWUuc3BsaXQoJyAnKSk7XG4gIH1cblxuICBpZiAoaXNFeHRlcm5hbChpdGVtLmxvRW50cnkpKSB7XG4gICAgY2xhc3NlcyA9IGNsYXNzZXMuY29uY2F0KCdleHRlcm5hbCcpO1xuICB9XG5cbiAgY29uc3Qgb25TdGF0dXNDaGFuZ2UgPSBSZWFjdC51c2VDYWxsYmFjaygoZXZ0OiBhbnkpID0+IHtcbiAgICBjb25zdCBlbnRyeSA9IHtcbiAgICAgIC4uLml0ZW0ubG9FbnRyeSxcbiAgICAgIGVuYWJsZWQ6IGV2dC50YXJnZXQuY2hlY2tlZCxcbiAgICB9O1xuICAgIGRpc3BhdGNoKGFjdGlvbnMuc2V0RkJMb2FkT3JkZXJFbnRyeShwcm9maWxlLmlkLCBlbnRyeSkpXG4gIH0sIFtkaXNwYXRjaCwgcHJvZmlsZSwgaXRlbV0pO1xuXG4gIGNvbnN0IG9uQXBwbHlJbmRleCA9IFJlYWN0LnVzZUNhbGxiYWNrKChpZHg6IG51bWJlcikgPT4ge1xuICAgIGNvbnN0IHsgaXRlbSwgb25TZXRMb2FkT3JkZXIsIHByb2ZpbGUsIGxvYWRPcmRlciB9ID0gcHJvcHM7XG4gICAgY29uc3QgY3VycmVudElkeCA9IGN1cnJlbnRQb3NpdGlvbihwcm9wcyk7XG4gICAgaWYgKGN1cnJlbnRJZHggPT09IGlkeCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgXG4gICAgY29uc3QgZW50cnkgPSB7XG4gICAgICAuLi5pdGVtLmxvRW50cnksXG4gICAgICBpbmRleDogaWR4LFxuICAgIH07XG4gIFxuICAgIGNvbnN0IG5ld0xPID0gbG9hZE9yZGVyLmZpbHRlcigoZW50cnkpID0+IGVudHJ5LmlkICE9PSBpdGVtLmxvRW50cnkuaWQpO1xuICAgIG5ld0xPLnNwbGljZShpZHggLSAxLCAwLCBlbnRyeSk7XG4gICAgb25TZXRMb2FkT3JkZXIocHJvZmlsZS5pZCwgbmV3TE8pO1xuICB9LCBbZGlzcGF0Y2gsIHByb2ZpbGUsIGl0ZW1dKTtcblxuICBjb25zdCBjaGVja0JveCA9ICgpID0+IChpdGVtLmRpc3BsYXlDaGVja2JveGVzKVxuICAgID8gKFxuICAgICAgPENoZWNrYm94XG4gICAgICAgIGNsYXNzTmFtZT0nZW50cnktY2hlY2tib3gnXG4gICAgICAgIGNoZWNrZWQ9e2l0ZW0ubG9FbnRyeS5lbmFibGVkfVxuICAgICAgICBkaXNhYmxlZD17aXNMb2NrZWQoaXRlbS5sb0VudHJ5KX1cbiAgICAgICAgb25DaGFuZ2U9e29uU3RhdHVzQ2hhbmdlfVxuICAgICAgLz5cbiAgICApXG4gICAgOiBudWxsO1xuXG4gIGNvbnN0IGxvY2sgPSAoKSA9PiAoaXNMb2NrZWQoaXRlbS5sb0VudHJ5KSlcbiAgICA/IChcbiAgICAgIDxJY29uIGNsYXNzTmFtZT0nbG9ja2VkLWVudHJ5LWxvZ28nIG5hbWU9J2xvY2tlZCcgLz5cbiAgICApIDogbnVsbDtcblxuICByZXR1cm4gKFxuICAgIDxMaXN0R3JvdXBJdGVtXG4gICAgICBrZXk9e2tleX1cbiAgICAgIGNsYXNzTmFtZT17Y2xhc3Nlcy5qb2luKCcgJyl9XG4gICAgICByZWY9e3Byb3BzLml0ZW0uc2V0UmVmfVxuICAgID5cbiAgICAgIDxJY29uIGNsYXNzTmFtZT0nZHJhZy1oYW5kbGUtaWNvbicgbmFtZT0nZHJhZy1oYW5kbGUnIC8+XG4gICAgICA8TG9hZE9yZGVySW5kZXhJbnB1dFxuICAgICAgICBjbGFzc05hbWU9J2xvYWQtb3JkZXItaW5kZXgnXG4gICAgICAgIGFwaT17Y29udGV4dC5hcGl9XG4gICAgICAgIGl0ZW09e2l0ZW0ubG9FbnRyeX1cbiAgICAgICAgY3VycmVudFBvc2l0aW9uPXtjdXJyZW50UG9zaXRpb24ocHJvcHMpfVxuICAgICAgICBsb2NrZWRFbnRyaWVzQ291bnQ9e2xvY2tlZEVudHJpZXNDb3VudChwcm9wcyl9XG4gICAgICAgIGxvYWRPcmRlcj17bG9hZE9yZGVyfVxuICAgICAgICBpc0xvY2tlZD17aXNMb2NrZWR9XG4gICAgICAgIG9uQXBwbHlJbmRleD17b25BcHBseUluZGV4fVxuICAgICAgLz5cbiAgICAgIHtyZW5kZXJWYWxpZGF0aW9uRXJyb3IocHJvcHMpfVxuICAgICAgPHAgY2xhc3NOYW1lPSdsb2FkLW9yZGVyLW5hbWUnPntrZXl9PC9wPlxuICAgICAge3JlbmRlckV4dGVybmFsQmFubmVyKGl0ZW0ubG9FbnRyeSl9XG4gICAgICB7cmVuZGVyVmlld01vZEljb24ocHJvcHMpfVxuICAgICAge2NoZWNrQm94KCl9XG4gICAgICB7bG9jaygpfVxuICAgIDwvTGlzdEdyb3VwSXRlbT5cbiAgKTtcbn1cblxuZnVuY3Rpb24gaXNMb2NrZWQoaXRlbTogdHlwZXMuSUxvYWRPcmRlckVudHJ5KTogYm9vbGVhbiB7XG4gIHJldHVybiBbdHJ1ZSwgJ3RydWUnLCAnYWx3YXlzJ10uaW5jbHVkZXMoaXRlbS5sb2NrZWQpO1xufVxuXG5mdW5jdGlvbiBpc0V4dGVybmFsKGl0ZW06IHR5cGVzLklMb2FkT3JkZXJFbnRyeSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKGl0ZW0ubW9kSWQgIT09IHVuZGVmaW5lZCkgPyBmYWxzZSA6IHRydWU7XG59XG5cbmNvbnN0IGN1cnJlbnRQb3NpdGlvbiA9IChwcm9wczogSVByb3BzKTogbnVtYmVyID0+IHtcbiAgY29uc3QgeyBpdGVtLCBsb2FkT3JkZXIgfSA9IHByb3BzO1xuICByZXR1cm4gbG9hZE9yZGVyLmZpbmRJbmRleChlbnRyeSA9PiBlbnRyeS5pZCA9PT0gaXRlbS5sb0VudHJ5LmlkKSArIDE7XG59XG5cbmNvbnN0IGxvY2tlZEVudHJpZXNDb3VudCA9IChwcm9wczogeyBsb2FkT3JkZXI6IHR5cGVzLkxvYWRPcmRlciB9KTogbnVtYmVyID0+IHtcbiAgY29uc3QgeyBsb2FkT3JkZXIgfSA9IHByb3BzO1xuICBjb25zdCBsb2NrZWQgPSBsb2FkT3JkZXIuZmlsdGVyKGl0ZW0gPT4gaXNMb2NrZWQoaXRlbSkpO1xuICByZXR1cm4gbG9ja2VkLmxlbmd0aDtcbn1cblxuY29uc3QgZW1wdHkgPSB7fTtcbmZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZTogdHlwZXMuSVN0YXRlKTogSUNvbm5lY3RlZFByb3BzIHtcbiAgY29uc3QgcHJvZmlsZTogdHlwZXMuSVByb2ZpbGUgPSBzZWxlY3RvcnMuYWN0aXZlUHJvZmlsZShzdGF0ZSk7XG4gIHJldHVybiB7XG4gICAgcHJvZmlsZSxcbiAgICBsb2FkT3JkZXI6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydwZXJzaXN0ZW50JywgJ2xvYWRPcmRlcicsIHByb2ZpbGUuaWRdLCBbXSksXG4gICAgbW9kU3RhdGU6IHV0aWwuZ2V0U2FmZShwcm9maWxlLCBbJ21vZFN0YXRlJ10sIGVtcHR5KSxcbiAgICBtb2RzOiB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdtb2RzJywgR0FNRV9JRF0sIHt9KSxcbiAgfTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgSXRlbVJlbmRlcmVyO1xuIl19