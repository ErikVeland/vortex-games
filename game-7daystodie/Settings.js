"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Settings;
const path_1 = __importDefault(require("path"));
const react_1 = __importDefault(require("react"));
const react_redux_1 = require("react-redux");
const react_i18next_1 = require("react-i18next");
const react_bootstrap_1 = require("react-bootstrap");
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
function Settings(props) {
    const { t } = (0, react_i18next_1.useTranslation)(common_1.I18N_NAMESPACE);
    const { onSelectUDF } = props;
    const connectedProps = (0, react_redux_1.useSelector)(mapStateToProps);
    const [currentUDF, setUDF] = react_1.default.useState(path_1.default.join(connectedProps.udf, 'Mods'));
    const onSelectUDFHandler = react_1.default.useCallback(() => {
        onSelectUDF().then((res) => {
            if (res) {
                setUDF(path_1.default.join(res, 'Mods'));
            }
        });
    }, [onSelectUDF]);
    return (react_1.default.createElement("form", { id: `${common_1.GAME_ID}-settings-form` },
        react_1.default.createElement(react_bootstrap_1.FormGroup, { controlId: 'default-enable' },
            react_1.default.createElement(react_bootstrap_1.ControlLabel, { className: `${common_1.GAME_ID}-settings-heading` }, t('7DTD Settings')),
            react_1.default.createElement(react_bootstrap_1.Panel, { key: `${common_1.GAME_ID}-user-default-folder` },
                react_1.default.createElement(react_bootstrap_1.Panel.Body, null,
                    react_1.default.createElement(react_bootstrap_1.ControlLabel, { className: `${common_1.GAME_ID}-settings-subheading` },
                        t('Current User Default Folder'),
                        react_1.default.createElement(vortex_api_1.More, { id: 'more-udf', name: t('Set User Data Folder') }, t('This will allow you to re-select the User Data Folder (UDF) for 7 Days to Die.'))),
                    react_1.default.createElement(react_bootstrap_1.InputGroup, null,
                        react_1.default.createElement(react_bootstrap_1.FormControl, { className: 'install-path-input', disabled: true, value: currentUDF }),
                        react_1.default.createElement(react_bootstrap_1.Button, { onClick: onSelectUDFHandler },
                            react_1.default.createElement(vortex_api_1.Icon, { name: 'browse' }))))))));
}
function mapStateToProps(state) {
    return {
        udf: vortex_api_1.util.getSafe(state, ['settings', '7daystodie', 'udf'], ''),
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFrQkEsMkJBMENDO0FBNURELGdEQUF3QjtBQUN4QixrREFBMEI7QUFDMUIsNkNBQTBDO0FBQzFDLGlEQUErQztBQUMvQyxxREFBb0g7QUFDcEgsMkNBQThDO0FBRTlDLHFDQUFtRDtBQVduRCxTQUF3QixRQUFRLENBQUMsS0FBYTtJQUM1QyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEdBQUcsSUFBQSw4QkFBYyxFQUFDLHVCQUFjLENBQUMsQ0FBQztJQUM3QyxNQUFNLEVBQUUsV0FBVyxFQUFFLEdBQUcsS0FBSyxDQUFDO0lBQzlCLE1BQU0sY0FBYyxHQUFHLElBQUEseUJBQVcsRUFBQyxlQUFlLENBQUMsQ0FBQztJQUNwRCxNQUFNLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxHQUFHLGVBQUssQ0FBQyxRQUFRLENBQVMsY0FBSSxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFFM0YsTUFBTSxrQkFBa0IsR0FBRyxlQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsRUFBRTtRQUNoRCxXQUFXLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtZQUN6QixJQUFJLEdBQUcsRUFBRSxDQUFDO2dCQUNSLE1BQU0sQ0FBQyxjQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ2pDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDbEIsT0FBTyxDQUNMLHdDQUFNLEVBQUUsRUFBRSxHQUFHLGdCQUFPLGdCQUFnQjtRQUNsQyw4QkFBQywyQkFBUyxJQUFDLFNBQVMsRUFBQyxnQkFBZ0I7WUFDbkMsOEJBQUMsOEJBQVksSUFBQyxTQUFTLEVBQUUsR0FBRyxnQkFBTyxtQkFBbUIsSUFBRyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQWdCO1lBQzNGLDhCQUFDLHVCQUFLLElBQUMsR0FBRyxFQUFFLEdBQUcsZ0JBQU8sc0JBQXNCO2dCQUMxQyw4QkFBQyx1QkFBSyxDQUFDLElBQUk7b0JBQ1QsOEJBQUMsOEJBQVksSUFBQyxTQUFTLEVBQUUsR0FBRyxnQkFBTyxzQkFBc0I7d0JBQ3RELENBQUMsQ0FBQyw2QkFBNkIsQ0FBQzt3QkFDakMsOEJBQUMsaUJBQUksSUFBQyxFQUFFLEVBQUMsVUFBVSxFQUFDLElBQUksRUFBRSxDQUFDLENBQUMsc0JBQXNCLENBQUMsSUFDaEQsQ0FBQyxDQUFDLGdGQUFnRixDQUFDLENBQy9FLENBQ007b0JBQ2YsOEJBQUMsNEJBQVU7d0JBQ1QsOEJBQUMsNkJBQVcsSUFDVixTQUFTLEVBQUMsb0JBQW9CLEVBQzlCLFFBQVEsRUFBRSxJQUFJLEVBQ2QsS0FBSyxFQUFFLFVBQVUsR0FDakI7d0JBQ0YsOEJBQUMsd0JBQU0sSUFDTCxPQUFPLEVBQUUsa0JBQWtCOzRCQUUzQiw4QkFBQyxpQkFBSSxJQUFDLElBQUksRUFBQyxRQUFRLEdBQUcsQ0FDZixDQUNFLENBQ0YsQ0FDUCxDQUNFLENBQ1AsQ0FDUixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLEtBQVU7SUFDakMsT0FBTztRQUNMLEdBQUcsRUFBRSxpQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxVQUFVLEVBQUUsWUFBWSxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQztLQUNoRSxDQUFDO0FBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IFJlYWN0IGZyb20gJ3JlYWN0JztcbmltcG9ydCB7IHVzZVNlbGVjdG9yIH0gZnJvbSAncmVhY3QtcmVkdXgnO1xuaW1wb3J0IHsgdXNlVHJhbnNsYXRpb24gfSBmcm9tICdyZWFjdC1pMThuZXh0JztcbmltcG9ydCB7IEJ1dHRvbiwgRm9ybUdyb3VwLCBDb250cm9sTGFiZWwsIElucHV0R3JvdXAsIEZvcm1Db250cm9sLCBIZWxwQmxvY2ssIFBhbmVsLCBMYWJlbCB9IGZyb20gJ3JlYWN0LWJvb3RzdHJhcCc7XG5pbXBvcnQgeyBJY29uLCBNb3JlLCB1dGlsIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IEdBTUVfSUQsIEkxOE5fTkFNRVNQQUNFIH0gZnJvbSAnLi9jb21tb24nO1xuXG5pbXBvcnQgeyBpc1dpbmRvd3MgfSBmcm9tICcuLi8uLi8uLi9zcmMvdXRpbC9wbGF0Zm9ybSc7XG5pbnRlcmZhY2UgSVByb3BzIHtcbiAgb25TZWxlY3RVREY6ICgpID0+IFByb21pc2U8c3RyaW5nPjtcbn1cblxuaW50ZXJmYWNlIElDb25uZWN0ZWRQcm9wcyB7XG4gIHVkZjogc3RyaW5nO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBTZXR0aW5ncyhwcm9wczogSVByb3BzKSB7XG4gIGNvbnN0IHsgdCB9ID0gdXNlVHJhbnNsYXRpb24oSTE4Tl9OQU1FU1BBQ0UpO1xuICBjb25zdCB7IG9uU2VsZWN0VURGIH0gPSBwcm9wcztcbiAgY29uc3QgY29ubmVjdGVkUHJvcHMgPSB1c2VTZWxlY3RvcihtYXBTdGF0ZVRvUHJvcHMpO1xuICBjb25zdCBbY3VycmVudFVERiwgc2V0VURGXSA9IFJlYWN0LnVzZVN0YXRlPHN0cmluZz4ocGF0aC5qb2luKGNvbm5lY3RlZFByb3BzLnVkZiwgJ01vZHMnKSk7XG5cbiAgY29uc3Qgb25TZWxlY3RVREZIYW5kbGVyID0gUmVhY3QudXNlQ2FsbGJhY2soKCkgPT4ge1xuICAgIG9uU2VsZWN0VURGKCkudGhlbigocmVzKSA9PiB7XG4gICAgICBpZiAocmVzKSB7XG4gICAgICAgIHNldFVERihwYXRoLmpvaW4ocmVzLCAnTW9kcycpKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSwgW29uU2VsZWN0VURGXSk7XG4gIHJldHVybiAoXG4gICAgPGZvcm0gaWQ9e2Ake0dBTUVfSUR9LXNldHRpbmdzLWZvcm1gfT5cbiAgICAgIDxGb3JtR3JvdXAgY29udHJvbElkPSdkZWZhdWx0LWVuYWJsZSc+XG4gICAgICAgIDxDb250cm9sTGFiZWwgY2xhc3NOYW1lPXtgJHtHQU1FX0lEfS1zZXR0aW5ncy1oZWFkaW5nYH0+e3QoJzdEVEQgU2V0dGluZ3MnKX08L0NvbnRyb2xMYWJlbD5cbiAgICAgICAgPFBhbmVsIGtleT17YCR7R0FNRV9JRH0tdXNlci1kZWZhdWx0LWZvbGRlcmB9PlxuICAgICAgICAgIDxQYW5lbC5Cb2R5PlxuICAgICAgICAgICAgPENvbnRyb2xMYWJlbCBjbGFzc05hbWU9e2Ake0dBTUVfSUR9LXNldHRpbmdzLXN1YmhlYWRpbmdgfT5cbiAgICAgICAgICAgICAge3QoJ0N1cnJlbnQgVXNlciBEZWZhdWx0IEZvbGRlcicpfVxuICAgICAgICAgICAgICA8TW9yZSBpZD0nbW9yZS11ZGYnIG5hbWU9e3QoJ1NldCBVc2VyIERhdGEgRm9sZGVyJyl9ID5cbiAgICAgICAgICAgICAgICB7dCgnVGhpcyB3aWxsIGFsbG93IHlvdSB0byByZS1zZWxlY3QgdGhlIFVzZXIgRGF0YSBGb2xkZXIgKFVERikgZm9yIDcgRGF5cyB0byBEaWUuJyl9XG4gICAgICAgICAgICAgIDwvTW9yZT5cbiAgICAgICAgICAgIDwvQ29udHJvbExhYmVsPlxuICAgICAgICAgICAgPElucHV0R3JvdXA+XG4gICAgICAgICAgICAgIDxGb3JtQ29udHJvbFxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT0naW5zdGFsbC1wYXRoLWlucHV0J1xuICAgICAgICAgICAgICAgIGRpc2FibGVkPXt0cnVlfVxuICAgICAgICAgICAgICAgIHZhbHVlPXtjdXJyZW50VURGfVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgICA8QnV0dG9uXG4gICAgICAgICAgICAgICAgb25DbGljaz17b25TZWxlY3RVREZIYW5kbGVyfVxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgPEljb24gbmFtZT0nYnJvd3NlJyAvPlxuICAgICAgICAgICAgICA8L0J1dHRvbj5cbiAgICAgICAgICAgIDwvSW5wdXRHcm91cD5cbiAgICAgICAgICA8L1BhbmVsLkJvZHk+XG4gICAgICAgIDwvUGFuZWw+XG4gICAgICA8L0Zvcm1Hcm91cD5cbiAgICA8L2Zvcm0+XG4gICk7XG59XG5cbmZ1bmN0aW9uIG1hcFN0YXRlVG9Qcm9wcyhzdGF0ZTogYW55KTogSUNvbm5lY3RlZFByb3BzIHtcbiAgcmV0dXJuIHtcbiAgICB1ZGY6IHV0aWwuZ2V0U2FmZShzdGF0ZSwgWydzZXR0aW5ncycsICc3ZGF5c3RvZGllJywgJ3VkZiddLCAnJyksXG4gIH07XG59Il19