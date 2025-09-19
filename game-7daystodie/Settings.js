const { isWindows } = require('vortex-api');
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.default = Settings;
function mapStateToProps(state) {
    return {
        udf: vortex_api_1.util.getSafe(state, ['settings', '7daystodie', 'udf'], ''),
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJTZXR0aW5ncy50c3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSxnREFBd0I7QUFDeEIsa0RBQTBCO0FBQzFCLDZDQUEwQztBQUMxQyxpREFBK0M7QUFDL0MscURBQW9IO0FBQ3BILDJDQUE4QztBQUU5QyxxQ0FBbUQ7QUFVbkQsU0FBd0IsUUFBUSxDQUFDLEtBQWE7SUFDNUMsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLElBQUEsOEJBQWMsRUFBQyx1QkFBYyxDQUFDLENBQUM7SUFDN0MsTUFBTSxFQUFFLFdBQVcsRUFBRSxHQUFHLEtBQUssQ0FBQztJQUM5QixNQUFNLGNBQWMsR0FBRyxJQUFBLHlCQUFXLEVBQUMsZUFBZSxDQUFDLENBQUM7SUFDcEQsTUFBTSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsR0FBRyxlQUFLLENBQUMsUUFBUSxDQUFTLGNBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBRTNGLE1BQU0sa0JBQWtCLEdBQUcsZUFBSyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUU7UUFDaEQsV0FBVyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7WUFDekIsSUFBSSxHQUFHLEVBQUU7Z0JBQ1AsTUFBTSxDQUFDLGNBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUM7YUFDaEM7UUFDSCxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUM7SUFDbEIsT0FBTyxDQUNMLHdDQUFNLEVBQUUsRUFBRSxHQUFHLGdCQUFPLGdCQUFnQjtRQUNsQyw4QkFBQywyQkFBUyxJQUFDLFNBQVMsRUFBQyxnQkFBZ0I7WUFDbkMsOEJBQUMsOEJBQVksSUFBQyxTQUFTLEVBQUUsR0FBRyxnQkFBTyxtQkFBbUIsSUFBRyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQWdCO1lBQzNGLDhCQUFDLHVCQUFLLElBQUMsR0FBRyxFQUFFLEdBQUcsZ0JBQU8sc0JBQXNCO2dCQUMxQyw4QkFBQyx1QkFBSyxDQUFDLElBQUk7b0JBQ1QsOEJBQUMsOEJBQVksSUFBQyxTQUFTLEVBQUUsR0FBRyxnQkFBTyxzQkFBc0I7d0JBQ3RELENBQUMsQ0FBQyw2QkFBNkIsQ0FBQzt3QkFDakMsOEJBQUMsaUJBQUksSUFBQyxFQUFFLEVBQUMsVUFBVSxFQUFDLElBQUksRUFBRSxDQUFDLENBQUMsc0JBQXNCLENBQUMsSUFDaEQsQ0FBQyxDQUFDLGdGQUFnRixDQUFDLENBQy9FLENBQ007b0JBQ2YsOEJBQUMsNEJBQVU7d0JBQ1QsOEJBQUMsNkJBQVcsSUFDVixTQUFTLEVBQUMsb0JBQW9CLEVBQzlCLFFBQVEsRUFBRSxJQUFJLEVBQ2QsS0FBSyxFQUFFLFVBQVUsR0FDakI7d0JBQ0YsOEJBQUMsd0JBQU0sSUFDTCxPQUFPLEVBQUUsa0JBQWtCOzRCQUUzQiw4QkFBQyxpQkFBSSxJQUFDLElBQUksRUFBQyxRQUFRLEdBQUcsQ0FDZixDQUNFLENBQ0YsQ0FDUCxDQUNFLENBQ1AsQ0FDUixDQUFDO0FBQ0osQ0FBQztBQTFDRCwyQkEwQ0M7QUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFVO0lBQ2pDLE9BQU87UUFDTCxHQUFHLEVBQUUsaUJBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsVUFBVSxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUM7S0FDaEUsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCBSZWFjdCBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VTZWxlY3RvciB9IGZyb20gJ3JlYWN0LXJlZHV4JztcbmltcG9ydCB7IHVzZVRyYW5zbGF0aW9uIH0gZnJvbSAncmVhY3QtaTE4bmV4dCc7XG5pbXBvcnQgeyBCdXR0b24sIEZvcm1Hcm91cCwgQ29udHJvbExhYmVsLCBJbnB1dEdyb3VwLCBGb3JtQ29udHJvbCwgSGVscEJsb2NrLCBQYW5lbCwgTGFiZWwgfSBmcm9tICdyZWFjdC1ib290c3RyYXAnO1xuaW1wb3J0IHsgSWNvbiwgTW9yZSwgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBHQU1FX0lELCBJMThOX05BTUVTUEFDRSB9IGZyb20gJy4vY29tbW9uJztcblxuaW50ZXJmYWNlIElQcm9wcyB7XG4gIG9uU2VsZWN0VURGOiAoKSA9PiBQcm9taXNlPHN0cmluZz47XG59XG5cbmludGVyZmFjZSBJQ29ubmVjdGVkUHJvcHMge1xuICB1ZGY6IHN0cmluZztcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gU2V0dGluZ3MocHJvcHM6IElQcm9wcykge1xuICBjb25zdCB7IHQgfSA9IHVzZVRyYW5zbGF0aW9uKEkxOE5fTkFNRVNQQUNFKTtcbiAgY29uc3QgeyBvblNlbGVjdFVERiB9ID0gcHJvcHM7XG4gIGNvbnN0IGNvbm5lY3RlZFByb3BzID0gdXNlU2VsZWN0b3IobWFwU3RhdGVUb1Byb3BzKTtcbiAgY29uc3QgW2N1cnJlbnRVREYsIHNldFVERl0gPSBSZWFjdC51c2VTdGF0ZTxzdHJpbmc+KHBhdGguam9pbihjb25uZWN0ZWRQcm9wcy51ZGYsICdNb2RzJykpO1xuXG4gIGNvbnN0IG9uU2VsZWN0VURGSGFuZGxlciA9IFJlYWN0LnVzZUNhbGxiYWNrKCgpID0+IHtcbiAgICBvblNlbGVjdFVERigpLnRoZW4oKHJlcykgPT4ge1xuICAgICAgaWYgKHJlcykge1xuICAgICAgICBzZXRVREYocGF0aC5qb2luKHJlcywgJ01vZHMnKSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0sIFtvblNlbGVjdFVERl0pO1xuICByZXR1cm4gKFxuICAgIDxmb3JtIGlkPXtgJHtHQU1FX0lEfS1zZXR0aW5ncy1mb3JtYH0+XG4gICAgICA8Rm9ybUdyb3VwIGNvbnRyb2xJZD0nZGVmYXVsdC1lbmFibGUnPlxuICAgICAgICA8Q29udHJvbExhYmVsIGNsYXNzTmFtZT17YCR7R0FNRV9JRH0tc2V0dGluZ3MtaGVhZGluZ2B9Pnt0KCc3RFREIFNldHRpbmdzJyl9PC9Db250cm9sTGFiZWw+XG4gICAgICAgIDxQYW5lbCBrZXk9e2Ake0dBTUVfSUR9LXVzZXItZGVmYXVsdC1mb2xkZXJgfT5cbiAgICAgICAgICA8UGFuZWwuQm9keT5cbiAgICAgICAgICAgIDxDb250cm9sTGFiZWwgY2xhc3NOYW1lPXtgJHtHQU1FX0lEfS1zZXR0aW5ncy1zdWJoZWFkaW5nYH0+XG4gICAgICAgICAgICAgIHt0KCdDdXJyZW50IFVzZXIgRGVmYXVsdCBGb2xkZXInKX1cbiAgICAgICAgICAgICAgPE1vcmUgaWQ9J21vcmUtdWRmJyBuYW1lPXt0KCdTZXQgVXNlciBEYXRhIEZvbGRlcicpfSA+XG4gICAgICAgICAgICAgICAge3QoJ1RoaXMgd2lsbCBhbGxvdyB5b3UgdG8gcmUtc2VsZWN0IHRoZSBVc2VyIERhdGEgRm9sZGVyIChVREYpIGZvciA3IERheXMgdG8gRGllLicpfVxuICAgICAgICAgICAgICA8L01vcmU+XG4gICAgICAgICAgICA8L0NvbnRyb2xMYWJlbD5cbiAgICAgICAgICAgIDxJbnB1dEdyb3VwPlxuICAgICAgICAgICAgICA8Rm9ybUNvbnRyb2xcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9J2luc3RhbGwtcGF0aC1pbnB1dCdcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17dHJ1ZX1cbiAgICAgICAgICAgICAgICB2YWx1ZT17Y3VycmVudFVERn1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPEJ1dHRvblxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e29uU2VsZWN0VURGSGFuZGxlcn1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxJY29uIG5hbWU9J2Jyb3dzZScgLz5cbiAgICAgICAgICAgICAgPC9CdXR0b24+XG4gICAgICAgICAgICA8L0lucHV0R3JvdXA+XG4gICAgICAgICAgPC9QYW5lbC5Cb2R5PlxuICAgICAgICA8L1BhbmVsPlxuICAgICAgPC9Gb3JtR3JvdXA+XG4gICAgPC9mb3JtPlxuICApO1xufVxuXG5mdW5jdGlvbiBtYXBTdGF0ZVRvUHJvcHMoc3RhdGU6IGFueSk6IElDb25uZWN0ZWRQcm9wcyB7XG4gIHJldHVybiB7XG4gICAgdWRmOiB1dGlsLmdldFNhZmUoc3RhdGUsIFsnc2V0dGluZ3MnLCAnN2RheXN0b2RpZScsICd1ZGYnXSwgJycpLFxuICB9O1xufSJdfQ==