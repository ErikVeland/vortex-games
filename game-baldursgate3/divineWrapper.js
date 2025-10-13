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
exports.DivineTimedOut = exports.DivineMissingDotNet = exports.DivineExecMissing = void 0;
exports.extractPak = extractPak;
exports.listPackage = listPackage;
const path = __importStar(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const util_1 = require("./util");
const nodeUtil = __importStar(require("util"));
const child_process = __importStar(require("child_process"));
const exec = nodeUtil.promisify(child_process.exec);
const concurrencyLimiter = new vortex_api_1.util.ConcurrencyLimiter(5, () => true);
const TIMEOUT_MS = 10000;
class DivineExecMissing extends Error {
    constructor() {
        super('Divine executable is missing');
        this.name = 'DivineExecMissing';
    }
}
exports.DivineExecMissing = DivineExecMissing;
class DivineMissingDotNet extends Error {
    constructor() {
        super('LSLib requires .NET 8 Desktop Runtime to be installed.');
        this.name = 'DivineMissingDotNet';
    }
}
exports.DivineMissingDotNet = DivineMissingDotNet;
class DivineTimedOut extends Error {
    constructor() {
        super('Divine process timed out');
        this.name = 'DivineTimedOut';
    }
}
exports.DivineTimedOut = DivineTimedOut;
const execOpts = {
    timeout: TIMEOUT_MS,
};
function runDivine(api, action, divineOpts) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => concurrencyLimiter.do(() => __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield divine(api, action, divineOpts, execOpts);
                return resolve(result);
            }
            catch (err) {
                return reject(err);
            }
        })));
    });
}
function divine(api, action, divineOpts, execOpts) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const state = api.getState();
            const stagingFolder = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const lsLib = (0, util_1.getLatestLSLibMod)(api);
            if (lsLib === undefined) {
                const err = new Error('LSLib/Divine tool is missing');
                err['attachLogOnReport'] = false;
                return reject(err);
            }
            const exe = path.join(stagingFolder, lsLib.installationPath, 'tools', 'divine.exe');
            const args = [
                '--action', action,
                '--source', `"${divineOpts.source}"`,
                '--game', 'bg3',
            ];
            if (divineOpts.loglevel !== undefined) {
                args.push('--loglevel', divineOpts.loglevel);
            }
            else {
                args.push('--loglevel', 'off');
            }
            if (divineOpts.destination !== undefined) {
                args.push('--destination', `"${divineOpts.destination}"`);
            }
            if (divineOpts.expression !== undefined) {
                args.push('--expression', `"${divineOpts.expression}"`);
            }
            try {
                const command = `"${exe}" ${args.join(' ')}`;
                const { stdout, stderr } = yield exec(command, execOpts);
                const stdoutStr = Buffer.isBuffer(stdout) ? stdout.toString() : stdout;
                const stderrStr = Buffer.isBuffer(stderr) ? stderr.toString() : stderr;
                if (!!stderrStr) {
                    return reject(new Error(`divine.exe failed: ${stderrStr}`));
                }
                if (!stdoutStr && action !== 'list-package') {
                    return resolve({ stdout: '', returnCode: 2 });
                }
                if (['error', 'fatal'].some(x => stdoutStr.toLowerCase().startsWith(x))) {
                    return reject(new Error(`divine.exe failed: ${stdoutStr}`));
                }
                else {
                    return resolve({ stdout: stdoutStr, returnCode: 0 });
                }
            }
            catch (err) {
                if (err.code === 'ENOENT') {
                    return reject(new DivineExecMissing());
                }
                if (err.message.includes('You must install or update .NET')) {
                    return reject(new DivineMissingDotNet());
                }
                const error = new Error(`divine.exe failed: ${err.message}`);
                error['attachLogOnReport'] = true;
                return reject(error);
            }
        }));
    });
}
function extractPak(api, pakPath, destPath, pattern) {
    return __awaiter(this, void 0, void 0, function* () {
        return runDivine(api, 'extract-package', { source: pakPath, destination: destPath, expression: pattern });
    });
}
function listPackage(api, pakPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let res;
        try {
            res = yield runDivine(api, 'list-package', { source: pakPath, loglevel: 'off' });
        }
        catch (error) {
            (0, util_1.logError)(`listPackage caught error: `, { error });
            if (error instanceof DivineMissingDotNet) {
                (0, vortex_api_1.log)('error', 'Missing .NET', error.message);
                api.dismissNotification('bg3-reading-paks-activity');
                api.showErrorNotification('LSLib requires .NET 8', 'LSLib requires .NET 8 Desktop Runtime to be installed.' +
                    '[br][/br][br][/br]' +
                    '[list=1][*]Download and Install [url=https://dotnet.microsoft.com/en-us/download/dotnet/thank-you/runtime-desktop-8.0.3-windows-x64-installer].NET 8.0 Desktop Runtime from Microsoft[/url]' +
                    '[*]Close Vortex' +
                    '[*]Restart Computer' +
                    '[*]Open Vortex[/list]', { id: 'bg3-dotnet-error', allowReport: false, isBBCode: true });
            }
        }
        const lines = ((res === null || res === void 0 ? void 0 : res.stdout) || '').split('\n').map(line => line.trim()).filter(line => line.length !== 0);
        return lines;
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGl2aW5lV3JhcHBlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRpdmluZVdyYXBwZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0lBLGdDQUdDO0FBRUQsa0NBNEJDO0FBaEtELDJDQUE2QjtBQUM3QiwyQ0FBeUQ7QUFFekQscUNBQW1DO0FBRW5DLGlDQUFxRDtBQUVyRCwrQ0FBaUM7QUFDakMsNkRBQStDO0FBRS9DLE1BQU0sSUFBSSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBR3BELE1BQU0sa0JBQWtCLEdBQTRCLElBQUksaUJBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7QUFJL0YsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDO0FBRXpCLE1BQWEsaUJBQWtCLFNBQVEsS0FBSztJQUMxQztRQUNFLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO1FBQ3RDLElBQUksQ0FBQyxJQUFJLEdBQUcsbUJBQW1CLENBQUM7SUFDbEMsQ0FBQztDQUNGO0FBTEQsOENBS0M7QUFFRCxNQUFhLG1CQUFvQixTQUFRLEtBQUs7SUFDNUM7UUFDRSxLQUFLLENBQUMsd0RBQXdELENBQUMsQ0FBQztRQUNoRSxJQUFJLENBQUMsSUFBSSxHQUFHLHFCQUFxQixDQUFDO0lBQ3BDLENBQUM7Q0FDRjtBQUxELGtEQUtDO0FBRUQsTUFBYSxjQUFlLFNBQVEsS0FBSztJQUN2QztRQUNFLEtBQUssQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUM7SUFDL0IsQ0FBQztDQUNGO0FBTEQsd0NBS0M7QUFFRCxNQUFNLFFBQVEsR0FBOEI7SUFDMUMsT0FBTyxFQUFFLFVBQVU7Q0FDcEIsQ0FBQztBQUVGLFNBQWUsU0FB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cUIsQ0FBQyx1QkFBdUIsRUFDakQsd0RBQXdEO29CQUN4RCxvQkFBb0I7b0JBQ3BCLDZMQUE2TDtvQkFDN0wsaUJBQWlCO29CQUNqQixxQkFBcUI7b0JBQ3JCLHVCQUF1QixFQUN0QixFQUFFLEVBQUUsRUFBRSxrQkFBa0IsRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ25FLENBQUM7UUFDSCxDQUFDO1FBR0QsTUFBTSxLQUFLLEdBQUcsQ0FBQyxDQUFBLEdBQUcsYUFBSCxHQUFHLHVCQUFILEdBQUcsQ0FBRSxNQUFNLEtBQUksRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFJekcsT0FBTyxLQUFLLENBQUM7SUFDZixDQUFDO0NBQUEiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBlc2xpbnQtZGlzYWJsZSAqL1xyXG5pbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xyXG5pbXBvcnQgeyBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcclxuXHJcbmltcG9ydCB7IEdBTUVfSUQgfSBmcm9tICcuL2NvbW1vbic7XHJcbmltcG9ydCB7IERpdmluZUFjdGlvbiwgSURpdmluZU9wdGlvbnMsIElEaXZpbmVPdXRwdXQgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IHsgZ2V0TGF0ZXN0TFNMaWJNb2QsIGxvZ0Vycm9yIH0gZnJvbSAnLi91dGlsJztcclxuXHJcbmltcG9ydCAqIGFzIG5vZGVVdGlsIGZyb20gJ3V0aWwnO1xyXG5pbXBvcnQgKiBhcyBjaGlsZF9wcm9jZXNzIGZyb20gJ2NoaWxkX3Byb2Nlc3MnO1xyXG5cclxuY29uc3QgZXhlYyA9IG5vZGVVdGlsLnByb21pc2lmeShjaGlsZF9wcm9jZXNzLmV4ZWMpO1xyXG5cclxuLy8gUnVuIDUgY29uY3VycmVudCBEaXZpbmUgcHJvY2Vzc2VzIC0gcmV0cnkgZWFjaCBwcm9jZXNzIDUgdGltZXMgaWYgaXQgZmFpbHMuXHJcbmNvbnN0IGNvbmN1cnJlbmN5TGltaXRlcjogdXRpbC5Db25jdXJyZW5jeUxpbWl0ZXIgPSBuZXcgdXRpbC5Db25jdXJyZW5jeUxpbWl0ZXIoNSwgKCkgPT4gdHJ1ZSk7XHJcblxyXG4vLyBUaGlzIGlzIHByb2JhYmx5IG92ZXJraWxsIC0gbW9kIGV4dHJhY3Rpb24gc2hvdWxkbid0IHRha2VcclxuLy8gIG1vcmUgdGhhbiBhIGZldyBzZWNvbmRzLlxyXG5jb25zdCBUSU1FT1VUX01TID0gMTAwMDA7XHJcblxyXG5leHBvcnQgY2xhc3MgRGl2aW5lRXhlY01pc3NpbmcgZXh0ZW5kcyBFcnJvciB7XHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICBzdXBlcignRGl2aW5lIGV4ZWN1dGFibGUgaXMgbWlzc2luZycpO1xyXG4gICAgdGhpcy5uYW1lID0gJ0RpdmluZUV4ZWNNaXNzaW5nJztcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBEaXZpbmVNaXNzaW5nRG90TmV0IGV4dGVuZHMgRXJyb3Ige1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgc3VwZXIoJ0xTTGliIHJlcXVpcmVzIC5ORVQgOCBEZXNrdG9wIFJ1bnRpbWUgdG8gYmUgaW5zdGFsbGVkLicpO1xyXG4gICAgdGhpcy5uYW1lID0gJ0RpdmluZU1pc3NpbmdEb3ROZXQnO1xyXG4gIH1cclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIERpdmluZVRpbWVkT3V0IGV4dGVuZHMgRXJyb3Ige1xyXG4gIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgc3VwZXIoJ0RpdmluZSBwcm9jZXNzIHRpbWVkIG91dCcpO1xyXG4gICAgdGhpcy5uYW1lID0gJ0RpdmluZVRpbWVkT3V0JztcclxuICB9XHJcbn1cclxuXHJcbmNvbnN0IGV4ZWNPcHRzOiBjaGlsZF9wcm9jZXNzLkV4ZWNPcHRpb25zID0ge1xyXG4gIHRpbWVvdXQ6IFRJTUVPVVRfTVMsXHJcbn07XHJcblxyXG5hc3luYyBmdW5jdGlvbiBydW5EaXZpbmUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiBEaXZpbmVBY3Rpb24sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBkaXZpbmVPcHRzOiBJRGl2aW5lT3B0aW9ucylcclxuICAgICAgICAgICAgICAgICAgICAgICAgIDogUHJvbWlzZTxJRGl2aW5lT3V0cHV0PiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IGNvbmN1cnJlbmN5TGltaXRlci5kbyhhc3luYyAoKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCBkaXZpbmUoYXBpLCBhY3Rpb24sIGRpdmluZU9wdHMsIGV4ZWNPcHRzKTtcclxuICAgICAgcmV0dXJuIHJlc29sdmUocmVzdWx0KTtcclxuICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICByZXR1cm4gcmVqZWN0KGVycik7XHJcbiAgICB9XHJcbiAgfSkpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBkaXZpbmUoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLFxyXG4gIGFjdGlvbjogRGl2aW5lQWN0aW9uLFxyXG4gIGRpdmluZU9wdHM6IElEaXZpbmVPcHRpb25zLFxyXG4gIGV4ZWNPcHRzOiBjaGlsZF9wcm9jZXNzLkV4ZWNPcHRpb25zKTogUHJvbWlzZTxJRGl2aW5lT3V0cHV0PiB7XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlPElEaXZpbmVPdXRwdXQ+KGFzeW5jIChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGNvbnN0IHN0YXRlID0gYXBpLmdldFN0YXRlKCk7XHJcbiAgICBjb25zdCBzdGFnaW5nRm9sZGVyID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XHJcbiAgICBjb25zdCBsc0xpYjogdHlwZXMuSU1vZCA9IGdldExhdGVzdExTTGliTW9kKGFwaSk7XHJcbiAgICBpZiAobHNMaWIgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoJ0xTTGliL0RpdmluZSB0b29sIGlzIG1pc3NpbmcnKTtcclxuICAgICAgZXJyWydhdHRhY2hMb2dPblJlcG9ydCddID0gZmFsc2U7XHJcbiAgICAgIHJldHVybiByZWplY3QoZXJyKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGV4ZSA9IHBhdGguam9pbihzdGFnaW5nRm9sZGVyLCBsc0xpYi5pbnN0YWxsYXRpb25QYXRoLCAndG9vbHMnLCAnZGl2aW5lLmV4ZScpO1xyXG4gICAgY29uc3QgYXJncyA9IFtcclxuICAgICAgJy0tYWN0aW9uJywgYWN0aW9uLFxyXG4gICAgICAnLS1zb3VyY2UnLCBgXCIke2RpdmluZU9wdHMuc291cmNlfVwiYCxcclxuICAgICAgJy0tZ2FtZScsICdiZzMnLFxyXG4gICAgXTtcclxuXHJcbiAgICBpZiAoZGl2aW5lT3B0cy5sb2dsZXZlbCAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgIGFyZ3MucHVzaCgnLS1sb2dsZXZlbCcsIGRpdmluZU9wdHMubG9nbGV2ZWwpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgYXJncy5wdXNoKCctLWxvZ2xldmVsJywgJ29mZicpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChkaXZpbmVPcHRzLmRlc3RpbmF0aW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXJncy5wdXNoKCctLWRlc3RpbmF0aW9uJywgYFwiJHtkaXZpbmVPcHRzLmRlc3RpbmF0aW9ufVwiYCk7XHJcbiAgICB9XHJcbiAgICBpZiAoZGl2aW5lT3B0cy5leHByZXNzaW9uICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgYXJncy5wdXNoKCctLWV4cHJlc3Npb24nLCBgXCIke2RpdmluZU9wdHMuZXhwcmVzc2lvbn1cImApO1xyXG4gICAgfVxyXG5cclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IGNvbW1hbmQgPSBgXCIke2V4ZX1cIiAke2FyZ3Muam9pbignICcpfWA7XHJcbiAgICAgIGNvbnN0IHsgc3Rkb3V0LCBzdGRlcnIgfSA9IGF3YWl0IGV4ZWMoY29tbWFuZCwgZXhlY09wdHMpO1xyXG4gICAgICBcclxuICAgICAgLy8gQ29udmVydCBzdGRvdXQgdG8gc3RyaW5nIGlmIGl0J3MgYSBCdWZmZXJcclxuICAgICAgY29uc3Qgc3Rkb3V0U3RyID0gQnVmZmVyLmlzQnVmZmVyKHN0ZG91dCkgPyBzdGRvdXQudG9TdHJpbmcoKSA6IHN0ZG91dDtcclxuICAgICAgY29uc3Qgc3RkZXJyU3RyID0gQnVmZmVyLmlzQnVmZmVyKHN0ZGVycikgPyBzdGRlcnIudG9TdHJpbmcoKSA6IHN0ZGVycjtcclxuICAgICAgXHJcbiAgICAgIGlmICghIXN0ZGVyclN0cikge1xyXG4gICAgICAgIHJldHVybiByZWplY3QobmV3IEVycm9yKGBkaXZpbmUuZXhlIGZhaWxlZDogJHtzdGRlcnJTdHJ9YCkpO1xyXG4gICAgICB9XHJcbiAgICAgIGlmICghc3Rkb3V0U3RyICYmIGFjdGlvbiAhPT0gJ2xpc3QtcGFja2FnZScpIHtcclxuICAgICAgICByZXR1cm4gcmVzb2x2ZSh7IHN0ZG91dDogJycsIHJldHVybkNvZGU6IDIgfSlcclxuICAgICAgfSAgICAgIFxyXG4gICAgICBpZiAoWydlcnJvcicsICdmYXRhbCddLnNvbWUoeCA9PiBzdGRvdXRTdHIudG9Mb3dlckNhc2UoKS5zdGFydHNXaXRoKHgpKSkge1xyXG4gICAgICAgIC8vIFJlYWxseT9cclxuICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBFcnJvcihgZGl2aW5lLmV4ZSBmYWlsZWQ6ICR7c3Rkb3V0U3RyfWApKTtcclxuICAgICAgfSBlbHNlICB7XHJcbiAgICAgICAgcmV0dXJuIHJlc29sdmUoeyBzdGRvdXQ6IHN0ZG91dFN0ciwgcmV0dXJuQ29kZTogMCB9KTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgIGlmIChlcnIuY29kZSA9PT0gJ0VOT0VOVCcpIHtcclxuICAgICAgICByZXR1cm4gcmVqZWN0KG5ldyBEaXZpbmVFeGVjTWlzc2luZygpKTtcclxuICAgICAgfVxyXG5cclxuICAgICAgaWYoZXJyLm1lc3NhZ2UuaW5jbHVkZXMoJ1lvdSBtdXN0IGluc3RhbGwgb3IgdXBkYXRlIC5ORVQnKSkge1xyXG4gICAgICAgIHJldHVybiByZWplY3QobmV3IERpdmluZU1pc3NpbmdEb3ROZXQoKSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGNvbnN0IGVycm9yID0gbmV3IEVycm9yKGBkaXZpbmUuZXhlIGZhaWxlZDogJHtlcnIubWVzc2FnZX1gKTtcclxuICAgICAgZXJyb3JbJ2F0dGFjaExvZ09uUmVwb3J0J10gPSB0cnVlO1xyXG4gICAgICByZXR1cm4gcmVqZWN0KGVycm9yKTtcclxuICAgIH1cclxuICB9KTtcclxufVxyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGV4dHJhY3RQYWsoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBwYWtQYXRoLCBkZXN0UGF0aCwgcGF0dGVybikge1xyXG4gIHJldHVybiBydW5EaXZpbmUoYXBpLCAnZXh0cmFjdC1wYWNrYWdlJyxcclxuICAgIHsgc291cmNlOiBwYWtQYXRoLCBkZXN0aW5hdGlvbjogZGVzdFBhdGgsIGV4cHJlc3Npb246IHBhdHRlcm4gfSk7XHJcbn1cclxuXHJcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBsaXN0UGFja2FnZShhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIHBha1BhdGg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcclxuICBsZXQgcmVzO1xyXG4gIHRyeSB7XHJcbiAgICByZXMgPSBhd2FpdCBydW5EaXZpbmUoYXBpLCAnbGlzdC1wYWNrYWdlJywgeyBzb3VyY2U6IHBha1BhdGgsIGxvZ2xldmVsOiAnb2ZmJyB9KTtcclxuICB9IGNhdGNoIChlcnJvcikgeyAgICBcclxuICAgIGxvZ0Vycm9yKGBsaXN0UGFja2FnZSBjYXVnaHQgZXJyb3I6IGAsIHsgZXJyb3IgfSk7XHJcbiAgICAvL2xvZygnZGVidWcnLCAnbGlzdFBhY2thZ2UgZXJyb3InLCBlcnJvci5tZXNzYWdlKTtcclxuXHJcbiAgICBpZihlcnJvciBpbnN0YW5jZW9mIERpdmluZU1pc3NpbmdEb3ROZXQpIHsgIFxyXG4gICAgICBsb2coJ2Vycm9yJywgJ01pc3NpbmcgLk5FVCcsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICBhcGkuZGlzbWlzc05vdGlmaWNhdGlvbignYmczLXJlYWRpbmctcGFrcy1hY3Rpdml0eScpO1xyXG4gICAgICBhcGkuc2hvd0Vycm9yTm90aWZpY2F0aW9uKCdMU0xpYiByZXF1aXJlcyAuTkVUIDgnLCBcclxuICAgICAgJ0xTTGliIHJlcXVpcmVzIC5ORVQgOCBEZXNrdG9wIFJ1bnRpbWUgdG8gYmUgaW5zdGFsbGVkLicgK1xyXG4gICAgICAnW2JyXVsvYnJdW2JyXVsvYnJdJyArXHJcbiAgICAgICdbbGlzdD0xXVsqXURvd25sb2FkIGFuZCBJbnN0YWxsIFt1cmw9aHR0cHM6Ly9kb3RuZXQubWljcm9zb2Z0LmNvbS9lbi11cy9kb3dubG9hZC9kb3RuZXQvdGhhbmsteW91L3J1bnRpbWUtZGVza3RvcC04LjAuMy13aW5kb3dzLXg2NC1pbnN0YWxsZXJdLk5FVCA4LjAgRGVza3RvcCBSdW50aW1lIGZyb20gTWljcm9zb2Z0Wy91cmxdJyAgKyBcclxuICAgICAgJ1sqXUNsb3NlIFZvcnRleCcgKyBcclxuICAgICAgJ1sqXVJlc3RhcnQgQ29tcHV0ZXInICsgXHJcbiAgICAgICdbKl1PcGVuIFZvcnRleFsvbGlzdF0nLFxyXG4gICAgICAgeyBpZDogJ2JnMy1kb3RuZXQtZXJyb3InLCBhbGxvd1JlcG9ydDogZmFsc2UsIGlzQkJDb2RlOiB0cnVlIH0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy9sb2dEZWJ1ZyhgbGlzdFBhY2thZ2UgcmVzPWAsIHJlcyk7XHJcbiAgY29uc3QgbGluZXMgPSAocmVzPy5zdGRvdXQgfHwgJycpLnNwbGl0KCdcXG4nKS5tYXAobGluZSA9PiBsaW5lLnRyaW0oKSkuZmlsdGVyKGxpbmUgPT4gbGluZS5sZW5ndGggIT09IDApO1xyXG5cclxuICAvL2xvZ0RlYnVnKGBsaXN0UGFja2FnZSBsaW5lcz1gLCBsaW5lcyk7XHJcblxyXG4gIHJldHVybiBsaW5lcztcclxufSJdfQ==