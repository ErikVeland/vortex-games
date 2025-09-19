"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_bootstrap_1 = require("react-bootstrap");
const react_i18next_1 = require("react-i18next");
const react_redux_1 = require("react-redux");
const vortex_api_1 = require("vortex-api");
const actions_1 = require("./actions");
function Settings() {
    const store = (0, react_redux_1.useStore)();
    const autoExportLoadOrder = (0, react_redux_1.useSelector)((state) => { var _a; return (_a = state.settings['baldursgate3']) === null || _a === void 0 ? void 0 : _a.autoExportLoadOrder; });
    const setUseAutoExportLoadOrderToGame = react_1.default.useCallback((enabled) => {
        console.log(`setAutoExportLoadOrder=${enabled}`);
        store.dispatch((0, actions_1.setAutoExportLoadOrder)(enabled));
    }, []);
    const { t } = (0, react_i18next_1.useTranslation)();
    return (react_1.default.createElement("form", null,
        react_1.default.createElement(react_bootstrap_1.FormGroup, { controlId: 'default-enable' },
            react_1.default.createElement(react_bootstrap_1.Panel, null,
                react_1.default.createElement(react_bootstrap_1.Panel.Body, null,
                    react_1.default.createElement(react_bootstrap_1.ControlLabel, null, t('Baldur\'s Gate 3')),
                    react_1.default.createElement(vortex_api_1.Toggle, { checked: autoExportLoadOrder, onToggle: setUseAutoExportLoadOrderToGame }, t('Auto export load order')),
                    react_1.default.createElement(react_bootstrap_1.HelpBlock, null, t(`If enabled, when Vortex saves it's load order, it will also update the games load order. 
              If disabled, and you wish the game to use your load order, then this will need to be completed 
              manually using the Export to Game button on the load order screen`)))))));
}
exports.default = Settings;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxrREFBMEI7QUFDMUIscURBQTRFO0FBQzVFLGlEQUErQztBQUMvQyw2Q0FBb0Q7QUFDcEQsMkNBQTJDO0FBQzNDLHVDQUFtRDtBQUduRCxTQUFTLFFBQVE7SUFFZixNQUFNLEtBQUssR0FBRyxJQUFBLHNCQUFRLEdBQUUsQ0FBQztJQUV6QixNQUFNLG1CQUFtQixHQUFHLElBQUEseUJBQVcsRUFBQyxDQUFDLEtBQW1CLEVBQUUsRUFBRSxXQUM5RCxPQUFBLE1BQUEsS0FBSyxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsMENBQUUsbUJBQW1CLENBQUEsRUFBQSxDQUFDLENBQUM7SUFFdkQsTUFBTSwrQkFBK0IsR0FBRyxlQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsT0FBZ0IsRUFBRSxFQUFFO1FBQzdFLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLE9BQU8sRUFBRSxDQUFDLENBQUE7UUFDaEQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFBLGdDQUFzQixFQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7SUFDbEQsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRVAsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUEsOEJBQWMsR0FBRSxDQUFDO0lBRS9CLE9BQU8sQ0FDTDtRQUNFLDhCQUFDLDJCQUFTLElBQUMsU0FBUyxFQUFDLGdCQUFnQjtZQUNuQyw4QkFBQyx1QkFBSztnQkFDSiw4QkFBQyx1QkFBSyxDQUFDLElBQUk7b0JBQ1QsOEJBQUMsOEJBQVksUUFBRSxDQUFDLENBQUMsa0JBQWtCLENBQUMsQ0FBZ0I7b0JBQ3BELDhCQUFDLG1CQUFNLElBQ0wsT0FBTyxFQUFFLG1CQUFtQixFQUM1QixRQUFRLEVBQUUsK0JBQStCLElBRXhDLENBQUMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUNyQjtvQkFDVCw4QkFBQywyQkFBUyxRQUNQLENBQUMsQ0FBQzs7Z0ZBRStELENBQUMsQ0FDekQsQ0FDRCxDQUNQLENBQ0UsQ0FDUCxDQUNSLENBQUM7QUFDSixDQUFDO0FBRUQsa0JBQWUsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IENvbnRyb2xMYWJlbCwgRm9ybUdyb3VwLCBIZWxwQmxvY2ssIFBhbmVsIH0gZnJvbSAncmVhY3QtYm9vdHN0cmFwJztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyB1c2VTZWxlY3RvciwgdXNlU3RvcmUgfSBmcm9tICdyZWFjdC1yZWR1eCc7XG5pbXBvcnQgeyBUb2dnbGUsIHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5pbXBvcnQgeyBzZXRBdXRvRXhwb3J0TG9hZE9yZGVyIH0gZnJvbSAnLi9hY3Rpb25zJztcblxuaW1wb3J0IHsgaXNXaW5kb3dzIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5mdW5jdGlvbiBTZXR0aW5ncygpIHtcblxuICBjb25zdCBzdG9yZSA9IHVzZVN0b3JlKCk7XG5cbiAgY29uc3QgYXV0b0V4cG9ydExvYWRPcmRlciA9IHVzZVNlbGVjdG9yKChzdGF0ZTogdHlwZXMuSVN0YXRlKSA9PlxuICAgIHN0YXRlLnNldHRpbmdzWydiYWxkdXJzZ2F0ZTMnXT8uYXV0b0V4cG9ydExvYWRPcmRlcik7XG5cbiAgY29uc3Qgc2V0VXNlQXV0b0V4cG9ydExvYWRPcmRlclRvR2FtZSA9IFJlYWN0LnVzZUNhbGxiYWNrKChlbmFibGVkOiBib29sZWFuKSA9PiB7XG4gICAgY29uc29sZS5sb2coYHNldEF1dG9FeHBvcnRMb2FkT3JkZXI9JHtlbmFibGVkfWApXG4gICAgc3RvcmUuZGlzcGF0Y2goc2V0QXV0b0V4cG9ydExvYWRPcmRlcihlbmFibGVkKSk7XG4gIH0sIFtdKTtcbiAgXG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oKTtcblxuICByZXR1cm4gKFxuICAgIDxmb3JtPlxuICAgICAgPEZvcm1Hcm91cCBjb250cm9sSWQ9J2RlZmF1bHQtZW5hYmxlJz5cbiAgICAgICAgPFBhbmVsPlxuICAgICAgICAgIDxQYW5lbC5Cb2R5PlxuICAgICAgICAgICAgPENvbnRyb2xMYWJlbD57dCgnQmFsZHVyXFwncyBHYXRlIDMnKX08L0NvbnRyb2xMYWJlbD5cbiAgICAgICAgICAgIDxUb2dnbGVcbiAgICAgICAgICAgICAgY2hlY2tlZD17YXV0b0V4cG9ydExvYWRPcmRlcn1cbiAgICAgICAgICAgICAgb25Ub2dnbGU9e3NldFVzZUF1dG9FeHBvcnRMb2FkT3JkZXJUb0dhbWV9XG4gICAgICAgICAgICA+XG4gICAgICAgICAgICAgIHt0KCdBdXRvIGV4cG9ydCBsb2FkIG9yZGVyJyl9XG4gICAgICAgICAgICA8L1RvZ2dsZT5cbiAgICAgICAgICAgIDxIZWxwQmxvY2s+XG4gICAgICAgICAgICAgIHt0KGBJZiBlbmFibGVkLCB3aGVuIFZvcnRleCBzYXZlcyBpdCdzIGxvYWQgb3JkZXIsIGl0IHdpbGwgYWxzbyB1cGRhdGUgdGhlIGdhbWVzIGxvYWQgb3JkZXIuIFxuICAgICAgICAgICAgICBJZiBkaXNhYmxlZCwgYW5kIHlvdSB3aXNoIHRoZSBnYW1lIHRvIHVzZSB5b3VyIGxvYWQgb3JkZXIsIHRoZW4gdGhpcyB3aWxsIG5lZWQgdG8gYmUgY29tcGxldGVkIFxuICAgICAgICAgICAgICBtYW51YWxseSB1c2luZyB0aGUgRXhwb3J0IHRvIEdhbWUgYnV0dG9uIG9uIHRoZSBsb2FkIG9yZGVyIHNjcmVlbmApfVxuICAgICAgICAgICAgPC9IZWxwQmxvY2s+XG4gICAgICAgICAgPC9QYW5lbC5Cb2R5PlxuICAgICAgICA8L1BhbmVsPlxuICAgICAgPC9Gb3JtR3JvdXA+XG4gICAgPC9mb3JtPlxuICApO1xufVxuXG5leHBvcnQgZGVmYXVsdCBTZXR0aW5ncztcbiJdfQ==