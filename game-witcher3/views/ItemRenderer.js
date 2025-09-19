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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemRenderer = void 0;
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
exports.ItemRenderer = ItemRenderer;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiSXRlbVJlbmRlcmVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiSXRlbVJlbmRlcmVyLnRzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDZDQUErQjtBQUMvQixxREFBMEQ7QUFDMUQsaURBQStDO0FBQy9DLDZDQUF1RDtBQUV2RCwyQ0FBOEc7QUFDOUcsc0NBQW9EO0FBcUJwRCxTQUFnQixZQUFZLENBQUMsS0FBaUI7O0lBQzVDLElBQUksQ0FBQSxNQUFBLEtBQUssYUFBTCxLQUFLLHVCQUFMLEtBQUssQ0FBRSxJQUFJLDBDQUFFLE9BQU8sTUFBSyxTQUFTLEVBQUU7UUFDdEMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE1BQU0sVUFBVSxHQUFHLElBQUEseUJBQVcsRUFBQyxlQUFlLENBQUMsQ0FBQztJQUNoRCxNQUFNLFFBQVEsR0FBRyxJQUFBLHlCQUFXLEdBQUUsQ0FBQztJQUMvQixNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUN0QyxDQUFDLFNBQWlCLEVBQUUsU0FBMEIsRUFBRSxFQUFFO1FBQ2hELFFBQVEsQ0FBQyxvQkFBTyxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUN6RCxDQUFDLEVBQ0QsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFLEVBQUUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUN4RCxDQUFBO0lBQ0QsT0FBTyxlQUFlLCtDQUFNLEtBQUssR0FBSyxVQUFVLEtBQUUsY0FBYyxJQUFHLENBQUM7QUFDdEUsQ0FBQztBQWJELG9DQWFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFhO0lBQzFDLE1BQU0sRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztJQUMvQyxNQUFNLFlBQVksR0FBRyxDQUFDLGNBQWMsS0FBSyxTQUFTLENBQUM7UUFDakQsQ0FBQyxD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QU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLE9BQU8sQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDM0UsUUFBUSxFQUFFLGlCQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDLFVBQVUsQ0FBQyxFQUFFLEtBQUssQ0FBQztRQUNwRCxJQUFJLEVBQUUsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsWUFBWSxFQUFFLE1BQU0sRUFBRSxnQkFBTyxDQUFDLEVBQUUsRUFBRSxDQUFDO0tBQy9ELENBQUM7QUFDSixDQUFDO0FBRUQsa0JBQWUsWUFBWSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgUmVhY3QgZnJvbSAncmVhY3QnO1xuaW1wb3J0IHsgQ2hlY2tib3gsIExpc3RHcm91cEl0ZW0gfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcbmltcG9ydCB7IHVzZURpc3BhdGNoLCB1c2VTZWxlY3RvciB9IGZyb20gJ3JlYWN0LXJlZHV4JztcblxuaW1wb3J0IHsgYWN0aW9ucywgSWNvbiwgTG9hZE9yZGVySW5kZXhJbnB1dCwgdG9vbHRpcCwgc2VsZWN0b3JzLCB0eXBlcywgdXRpbCwgTWFpbkNvbnRleHQgfSBmcm9tICd2b3J0ZXgtYXBpJztcbmltcG9ydCB7IEkxOE5fTkFNRVNQQUNFLCBHQU1FX0lEIH0gZnJvbSAnLi4vY29tbW9uJztcbmltcG9ydCB7IElJdGVtUmVuZGVyZXJQcm9wcyB9IGZyb20gJy4uL3R5cGVzJztcblxuaW50ZXJmYWNlIElBY3Rpb25Qcm9wcyB7XG4gIG9uU2V0TG9hZE9yZGVyOiAocHJvZmlsZUlkOiBzdHJpbmcsIGxvYWRPcmRlcjogdHlwZXMuTG9hZE9yZGVyKSA9PiB2b2lkO1xufVxuXG5pbnRlcmZhY2UgSUNvbm5lY3RlZFByb3BzIHtcbiAgbW9kU3RhdGU6IGFueTtcbiAgbG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXI7XG4gIHByb2ZpbGU6IHR5cGVzLklQcm9maWxlO1xuICBtb2RzOiB7IFttb2RJZDogc3RyaW5nXTogdHlwZXMuSU1vZCB9O1xufVxuXG5pbnRlcmZhY2UgSUJhc2VQcm9wcyB7XG4gIGNsYXNzTmFtZT86IHN0cmluZztcbiAgaXRlbTogSUl0ZW1SZW5kZXJlclByb3BzO1xufVxuXG50eXBlIElQcm9wcyA9IElCYXNlUHJvcHMgJiBJQ29ubmVjdGVkUHJvcHMgJiBJQWN0aW9uUHJvcHM7XG5cbmV4cG9ydCBmdW5jdGlvbiBJdGVtUmVuZGVyZXIocHJvcHM6IElCYXNlUHJvcHMpIHtcbiAgaWYgKHByb3BzPy5pdGVtPy5sb0VudHJ5ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCBzdGF0ZVByb3BzID0gdXNlU2VsZWN0b3IobWFwU3RhdGVUb1Byb3BzKTtcbiAgY29uc3QgZGlzcGF0Y2ggPSB1c2VEaXNwYXRjaCgpO1xuICBjb25zdCBvblNldExvYWRPcmRlciA9IFJlYWN0LnVzZUNhbGxiYWNrKFxuICAgIChwcm9maWxlSWQ6IHN0cmluZywgbG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIpID0+IHtcbiAgICAgIGRpc3BhdGNoKGFjdGlvbnMuc2V0RkJMb2FkT3JkZXIocHJvZmlsZUlkLCBsb2FkT3JkZXIpKTtcbiAgICB9LFxuICAgIFtkaXNwYXRjaCwgc3RhdGVQcm9wcy5wcm9maWxlLmlkLCBzdGF0ZVByb3BzLmxvYWRPcmRlcl1cbiAgKVxuICByZXR1cm4gcmVuZGVyRHJhZ2dhYmxlKHsgLi4ucHJvcHMsIC4uLnN0YXRlUHJvcHMsIG9uU2V0TG9hZE9yZGVyIH0pO1xufVxuXG5mdW5jdGlvbiByZW5kZXJWYWxpZGF0aW9uRXJyb3IocHJvcHM6IElQcm9wcyk6IEpTWC5FbGVtZW50IHtcbiAgY29uc3QgeyBpbnZhbGlkRW50cmllcywgbG9FbnRyeSB9ID0gcHJvcHMuaXRlbTtcbiAgY29uc3QgaW52YWxpZEVudHJ5ID0gKGludmFsaWRFbnRyaWVzICE9PSB1bmRlZmluZWQpXG4gICAgPyBpbnZhbGlkRW50cmllcy5maW5kKGludiA9PiBpbnYuaWQudG9Mb3dlckNhc2UoKSA9PT0gbG9FbnRyeS5pZC50b0xvd2VyQ2FzZSgpKVxuICAgIDogdW5kZWZpbmVkO1xuICByZXR1cm4gKGludmFsaWRFbnRyeSAhPT0gdW5kZWZpbmVkKVxuICAgID8gKFxuICAgICAgPHRvb2x0aXAuSWNvblxuICAgICAgICBjbGFzc05hbWU9J2ZibG8taW52YWxpZC1lbnRyeSdcbiAgICAgICAgbmFtZT0nZmVlZGJhY2stZXJyb3InXG4gICAgICAgIHRvb2x0aXA9e2ludmFsaWRFbnRyeS5yZWFzb259XG4gICAgICAvPlxuICAgICkgOiBudWxsO1xufVxuXG5mdW5jdGlvbiByZW5kZXJWaWV3TW9kSWNvbihwcm9wczogSVByb3BzKTogSlNYLkVsZW1lbnQge1xuICBjb25zdCB7IGl0ZW0sIG1vZHMgfSA9IHByb3BzO1xuICBpZiAoaXNFeHRlcm5hbChpdGVtLmxvRW50cnkpIHx8IGl0ZW0ubG9FbnRyeS5tb2RJZCA9PT0gaXRlbS5sb0VudHJ5Lm5hbWUpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCBjb250ZXh0ID0gUmVhY3QudXNlQ29udGV4dChNYWluQ29udGV4dCk7XG4gIGNvbnN0IFt0XSA9IHVzZVRyYW5zbGF0aW9uKEkxOE5fTkFNRVNQQUNFKTtcbiAgY29uc3Qgb25DbGljayA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBjb25zdCB7IG1vZElkIH0gPSBpdGVtLmxvRW50cnk7XG4gICAgY29uc3QgbW9kID0gbW9kcz8uW21vZElkXTtcbiAgICBpZiAobW9kID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYmF0Y2hlZCA9IFtcbiAgICAgIGFjdGlvbnMuc2V0QXR0cmlidXRlRmlsdGVyKCdtb2RzJywgJ25hbWUnLCB1dGlsLnJlbmRlck1vZE5hbWUobW9kKSksXG4gICAgXTtcbiAgICB1dGlsLmJhdGNoRGlzcGF0Y2goY29udGV4dC5hcGkuc3RvcmUuZGlzcGF0Y2gsIGJhdGNoZWQpO1xuICAgIGNvbnRleHQuYXBpLmV2ZW50cy5lbWl0KCdzaG93LW1haW4tcGFnZScsICdNb2RzJyk7XG4gIH0sIFtpdGVtLCBtb2RzLCBjb250ZXh0XSk7XG4gIHJldHVybiBpdGVtLmxvRW50cnkubW9kSWQgIT09IHVuZGVmaW5lZCA/IChcbiAgICA8dG9vbHRpcC5JY29uQnV0dG9uXG4gICAgICBjbGFzc05hbWU9J3dpdGNoZXIzLXZpZXctbW9kLWljb24nXG4gICAgICBpY29uPSdvcGVuLWV4dCdcbiAgICAgIHRvb2x0aXA9e3QoJ1ZpZXcgc291cmNlIE1vZCcpfVxuICAgICAgb25DbGljaz17b25DbGlja31cbiAgICAvPlxuICApIDogbnVsbDtcbn1cblxuZnVuY3Rpb24gcmVuZGVyRXh0ZXJuYWxCYW5uZXIoaXRlbTogdHlwZXMuSUxvYWRPcmRlckVudHJ5KTogSlNYLkVsZW1lbnQge1xuICBjb25zdCBbdF0gPSB1c2VUcmFuc2xhdGlvbihJMThOX05BTUVTUEFDRSk7XG4gIHJldHVybiBpc0V4dGVybmFsKGl0ZW0pID8gKFxuICAgIDxkaXYgY2xhc3NOYW1lPSdsb2FkLW9yZGVyLXVubWFuYWdlZC1iYW5uZXInPlxuICAgICAgPEljb24gY2xhc3NOYW1lPSdleHRlcm5hbC1jYXV0aW9uLWxvZ28nIG5hbWU9J2ZlZWRiYWNrLXdhcm5pbmcnIC8+XG4gICAgICA8c3BhbiBjbGFzc05hbWU9J2V4dGVybmFsLXRleHQtYXJlYSc+e3QoJ05vdCBtYW5hZ2VkIGJ5IFZvcnRleCcpfTwvc3Bhbj5cbiAgICA8L2Rpdj5cbiAgKSA6IG51bGw7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckRyYWdnYWJsZShwcm9wczogSVByb3BzKTogSlNYLkVsZW1lbnQge1xuICBjb25zdCB7IGxvYWRPcmRlciwgY2xhc3NOYW1lLCBpdGVtLCBwcm9maWxlIH0gPSBwcm9wcztcbiAgY29uc3Qga2V5ID0gISFpdGVtPy5sb0VudHJ5Py5uYW1lID8gYCR7aXRlbS5sb0VudHJ5Lm5hbWV9YCA6IGAke2l0ZW0ubG9FbnRyeS5pZH1gO1xuICBjb25zdCBjb250ZXh0ID0gUmVhY3QudXNlQ29udGV4dChNYWluQ29udGV4dCk7XG4gIGNvbnN0IGRpc3BhdGNoID0gdXNlRGlzcGF0Y2goKTtcbiAgY29uc3QgcG9zaXRpb24gPSBsb2FkT3JkZXIuZmluZEluZGV4KGVudHJ5ID0+IGVudHJ5LmlkID09PSBpdGVtLmxvRW50cnkuaWQpICsgMTtcblxuICBsZXQgY2xhc3NlcyA9IFsnbG9hZC1vcmRlci1lbnRyeSddO1xuICBpZiAoY2xhc3NOYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICBjbGFzc2VzID0gY2xhc3Nlcy5jb25jYXQoY2xhc3NOYW1lLnNwbGl0KCcgJykpO1xuICB9XG5cbiAgaWYgKGlzRXh0ZXJuYWwoaXRlbS5sb0VudHJ5KSkge1xuICAgIGNsYXNzZXMgPSBjbGFzc2VzLmNvbmNhdCgnZXh0ZXJuYWwnKTtcbiAgfVxuXG4gIGNvbnN0IG9uU3RhdHVzQ2hhbmdlID0gUmVhY3QudXNlQ2FsbGJhY2soKGV2dDogYW55KSA9PiB7XG4gICAgY29uc3QgZW50cnkgPSB7XG4gICAgICAuLi5pdGVtLmxvRW50cnksXG4gICAgICBlbmFibGVkOiBldnQudGFyZ2V0LmNoZWNrZWQsXG4gICAgfTtcbiAgICBkaXNwYXRjaChhY3Rpb25zLnNldEZCTG9hZE9yZGVyRW50cnkocHJvZmlsZS5pZCwgZW50cnkpKVxuICB9LCBbZGlzcGF0Y2gsIHByb2ZpbGUsIGl0ZW1dKTtcblxuICBjb25zdCBvbkFwcGx5SW5kZXggPSBSZWFjdC51c2VDYWxsYmFjaygoaWR4OiBudW1iZXIpID0+IHtcbiAgICBjb25zdCB7IGl0ZW0sIG9uU2V0TG9hZE9yZGVyLCBwcm9maWxlLCBsb2FkT3JkZXIgfSA9IHByb3BzO1xuICAgIGNvbnN0IGN1cnJlbnRJZHggPSBjdXJyZW50UG9zaXRpb24ocHJvcHMpO1xuICAgIGlmIChjdXJyZW50SWR4ID09PSBpZHgpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIFxuICAgIGNvbnN0IGVudHJ5ID0ge1xuICAgICAgLi4uaXRlbS5sb0VudHJ5LFxuICAgICAgaW5kZXg6IGlkeCxcbiAgICB9O1xuICBcbiAgICBjb25zdCBuZXdMTyA9IGxvYWRPcmRlci5maWx0ZXIoKGVudHJ5KSA9PiBlbnRyeS5pZCAhPT0gaXRlbS5sb0VudHJ5LmlkKTtcbiAgICBuZXdMTy5zcGxpY2UoaWR4IC0gMSwgMCwgZW50cnkpO1xuICAgIG9uU2V0TG9hZE9yZGVyKHByb2ZpbGUuaWQsIG5ld0xPKTtcbiAgfSwgW2Rpc3BhdGNoLCBwcm9maWxlLCBpdGVtXSk7XG5cbiAgY29uc3QgY2hlY2tCb3ggPSAoKSA9PiAoaXRlbS5kaXNwbGF5Q2hlY2tib3hlcylcbiAgICA/IChcbiAgICAgIDxDaGVja2JveFxuICAgICAgICBjbGFzc05hbWU9J2VudHJ5LWNoZWNrYm94J1xuICAgICAgICBjaGVja2VkPXtpdGVtLmxvRW50cnkuZW5hYmxlZH1cbiAgICAgICAgZGlzYWJsZWQ9e2lzTG9ja2VkKGl0ZW0ubG9FbnRyeSl9XG4gICAgICAgIG9uQ2hhbmdlPXtvblN0YXR1c0NoYW5nZX1cbiAgICAgIC8+XG4gICAgKVxuICAgIDogbnVsbDtcblxuICBjb25zdCBsb2NrID0gKCkgPT4gKGlzTG9ja2VkKGl0ZW0ubG9FbnRyeSkpXG4gICAgPyAoXG4gICAgICA8SWNvbiBjbGFzc05hbWU9J2xvY2tlZC1lbnRyeS1sb2dvJyBuYW1lPSdsb2NrZWQnIC8+XG4gICAgKSA6IG51bGw7XG5cbiAgcmV0dXJuIChcbiAgICA8TGlzdEdyb3VwSXRlbVxuICAgICAga2V5PXtrZXl9XG4gICAgICBjbGFzc05hbWU9e2NsYXNzZXMuam9pbignICcpfVxuICAgICAgcmVmPXtwcm9wcy5pdGVtLnNldFJlZn1cbiAgICA+XG4gICAgICA8SWNvbiBjbGFzc05hbWU9J2RyYWctaGFuZGxlLWljb24nIG5hbWU9J2RyYWctaGFuZGxlJyAvPlxuICAgICAgPExvYWRPcmRlckluZGV4SW5wdXRcbiAgICAgICAgY2xhc3NOYW1lPSdsb2FkLW9yZGVyLWluZGV4J1xuICAgICAgICBhcGk9e2NvbnRleHQuYXBpfVxuICAgICAgICBpdGVtPXtpdGVtLmxvRW50cnl9XG4gICAgICAgIGN1cnJlbnRQb3NpdGlvbj17Y3VycmVudFBvc2l0aW9uKHByb3BzKX1cbiAgICAgICAgbG9ja2VkRW50cmllc0NvdW50PXtsb2NrZWRFbnRyaWVzQ291bnQocHJvcHMpfVxuICAgICAgICBsb2FkT3JkZXI9e2xvYWRPcmRlcn1cbiAgICAgICAgaXNMb2NrZWQ9e2lzTG9ja2VkfVxuICAgICAgICBvbkFwcGx5SW5kZXg9e29uQXBwbHlJbmRleH1cbiAgICAgIC8+XG4gICAgICB7cmVuZGVyVmFsaWRhdGlvbkVycm9yKHByb3BzKX1cbiAgICAgIDxwIGNsYXNzTmFtZT0nbG9hZC1vcmRlci1uYW1lJz57a2V5fTwvcD5cbiAgICAgIHtyZW5kZXJFeHRlcm5hbEJhbm5lcihpdGVtLmxvRW50cnkpfVxuICAgICAge3JlbmRlclZpZXdNb2RJY29uKHByb3BzKX1cbiAgICAgIHtjaGVja0JveCgpfVxuICAgICAge2xvY2soKX1cbiAgICA8L0xpc3RHcm91cEl0ZW0+XG4gICk7XG59XG5cbmZ1bmN0aW9uIGlzTG9ja2VkKGl0ZW06IHR5cGVzLklMb2FkT3JkZXJFbnRyeSk6IGJvb2xlYW4ge1xuICByZXR1cm4gW3RydWUsICd0cnVlJywgJ2Fsd2F5cyddLmluY2x1ZGVzKGl0ZW0ubG9ja2VkKTtcbn1cblxuZnVuY3Rpb24gaXNFeHRlcm5hbChpdGVtOiB0eXBlcy5JTG9hZE9yZGVyRW50cnkpOiBib29sZWFuIHtcbiAgcmV0dXJuIChpdGVtLm1vZElkICE9PSB1bmRlZmluZWQpID8gZmFsc2UgOiB0cnVlO1xufVxuXG5jb25zdCBjdXJyZW50UG9zaXRpb24gPSAocHJvcHM6IElQcm9wcyk6IG51bWJlciA9PiB7XG4gIGNvbnN0IHsgaXRlbSwgbG9hZE9yZGVyIH0gPSBwcm9wcztcbiAgcmV0dXJuIGxvYWRPcmRlci5maW5kSW5kZXgoZW50cnkgPT4gZW50cnkuaWQgPT09IGl0ZW0ubG9FbnRyeS5pZCkgKyAxO1xufVxuXG5jb25zdCBsb2NrZWRFbnRyaWVzQ291bnQgPSAocHJvcHM6IHsgbG9hZE9yZGVyOiB0eXBlcy5Mb2FkT3JkZXIgfSk6IG51bWJlciA9PiB7XG4gIGNvbnN0IHsgbG9hZE9yZGVyIH0gPSBwcm9wcztcbiAgY29uc3QgbG9ja2VkID0gbG9hZE9yZGVyLmZpbHRlcihpdGVtID0+IGlzTG9ja2VkKGl0ZW0pKTtcbiAgcmV0dXJuIGxvY2tlZC5sZW5ndGg7XG59XG5cbmNvbnN0IGVtcHR5ID0ge307XG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IHR5cGVzLklTdGF0ZSk6IElDb25uZWN0ZWRQcm9wcyB7XG4gIGNvbnN0IHByb2ZpbGU6IHR5cGVzLklQcm9maWxlID0gc2VsZWN0b3JzLmFjdGl2ZVByb2ZpbGUoc3RhdGUpO1xuICByZXR1cm4ge1xuICAgIHByb2ZpbGUsXG4gICAgbG9hZE9yZGVyOiB1dGlsLmdldFNhZmUoc3RhdGUsIFsncGVyc2lzdGVudCcsICdsb2FkT3JkZXInLCBwcm9maWxlLmlkXSwgW10pLFxuICAgIG1vZFN0YXRlOiB1dGlsLmdldFNhZmUocHJvZmlsZSwgWydtb2RTdGF0ZSddLCBlbXB0eSksXG4gICAgbW9kczogdXRpbC5nZXRTYWZlKHN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbW9kcycsIEdBTUVfSURdLCB7fSksXG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IEl0ZW1SZW5kZXJlcjtcbiJdfQ==