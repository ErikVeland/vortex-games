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
exports.isReplacer = exports.isLoose = exports.isBG3SE = exports.isLSLib = void 0;
const path = __importStar(require("path"));
const common_1 = require("./common");
const util_1 = require("./util");
function isLSLib(files) {
    return __awaiter(this, void 0, void 0, function* () {
        const origFile = files.find(iter => (iter.type === 'copy') && common_1.LSLIB_FILES.has(path.basename(iter.destination).toLowerCase()));
        return origFile !== undefined
            ? Promise.resolve(true)
            : Promise.resolve(false);
    });
}
exports.isLSLib = isLSLib;
function isBG3SE(files) {
    return __awaiter(this, void 0, void 0, function* () {
        const origFile = files.find(iter => (iter.type === 'copy') && (path.basename(iter.destination).toLowerCase() === 'dwrite.dll'));
        return origFile !== undefined
            ? Promise.resolve(true)
            : Promise.resolve(false);
    });
}
exports.isBG3SE = isBG3SE;
function isLoose(instructions) {
    return __awaiter(this, void 0, void 0, function* () {
        const copyInstructions = instructions.filter(instr => instr.type === 'copy');
        const hasDataFolder = copyInstructions.find(instr => instr.source.indexOf('Data' + path.sep) !== -1) !== undefined;
        const hasGenOrPublicFolder = copyInstructions.find(instr => instr.source.indexOf('Generated' + path.sep) !== -1 ||
            instr.source.indexOf('Public' + path.sep) !== -1) !== undefined;
        (0, util_1.logDebug)('isLoose', { instructions: instructions, hasDataFolder: hasDataFolder || hasGenOrPublicFolder });
        return Promise.resolve(hasDataFolder || hasGenOrPublicFolder);
    });
}
exports.isLoose = isLoose;
function isReplacer(api, files) {
    return __awaiter(this, void 0, void 0, function* () {
        const origFile = files.find(iter => (iter.type === 'copy') && common_1.ORIGINAL_FILES.has(iter.destination.toLowerCase()));
        const paks = files.filter(iter => (iter.type === 'copy') && (path.extname(iter.destination).toLowerCase() === '.pak'));
        (0, util_1.logDebug)('isReplacer', { origFile: origFile, paks: paks });
        if ((origFile !== undefined)) {
            return api.showDialog('question', 'Mod looks like a replacer', {
                bbcode: 'The mod you just installed looks like a "replacer", meaning it is intended to replace '
                    + 'one of the files shipped with the game.<br/>'
                    + 'You should be aware that such a replacer includes a copy of some game data from a '
                    + 'specific version of the game and may therefore break as soon as the game gets updated.<br/>'
                    + 'Even if doesn\'t break, it may revert bugfixes that the game '
                    + 'developers have made.<br/><br/>'
                    + 'Therefore [color="red"]please take extra care to keep this mod updated[/color] and remove it when it '
                    + 'no longer matches the game version.',
            }, [
                { label: 'Install as Mod (will likely not work)' },
                { label: 'Install as Replacer', default: true },
            ]).then(result => result.action === 'Install as Replacer');
        }
        else {
            return Promise.resolve(false);
        }
    });
}
exports.isReplacer = isReplacer;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kVHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb2RUeXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDJDQUE2QjtBQUc3QixxQ0FBdUQ7QUFDdkQsaUNBQWtDO0FBRWxDLFNBQXNCLE9BQU8sQ0FBQyxLQUEyQjs7UUFDdkQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUNqQyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLElBQUksb0JBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQzVGLE9BQU8sUUFBUSxLQUFLLFNBQVM7WUFDM0IsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1lBQ3ZCLENBQUMsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdCLENBQUM7Q0FBQTtBQU5ELDBCQU1DO0FBRUQsU0FBc0IsT0FBTyxDQUFDLEtBQTJCOztRQUN2RCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ2pDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDOUYsT0FBTyxRQUFRLEtBQUssU0FBUztZQUMzQixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDdkIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0IsQ0FBQztDQUFBO0FBTkQsMEJBTUM7QUFFRCxTQUFzQixPQUFPLENBQUMsWUFBa0M7O1FBRTlELE1BQU0sZ0JBQWdCLEdBQUcsWUFBWSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLENBQUM7UUFHN0UsTUFBTSxhQUFhLEdBQVcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQzFELEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLENBQUM7UUFHaEUsTUFBTSxvQkFBb0IsR0FBVyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FDakUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FDakQsS0FBSyxTQUFTLENBQUM7UUFFaEIsSUFBQSxlQUFRLEVBQUMsU0FBUyxFQUFFLEVBQUUsWUFBWSxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsYUFBYSxJQUFJLG9CQUFvQixFQUFFLENBQUMsQ0FBQztRQUUxRyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsYUFBYSxJQUFJLG9CQUFvQixDQUFDLENBQUM7SUFDaEUsQ0FBQztDQUFBO0FBakJELDBCQWlCQztBQUVELFNBQXNCLFVBQVUsQ0FBQyxHQUF3QixFQUFFLEtBQTJCOztRQUVwRixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ2pDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSx1QkFBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVoRixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQy9CLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFFdkYsSUFBQSxlQUFRLEVBQUMsWUFBWSxFQUFHLEVBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUcxRCxJQUFJLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQyxFQUFFO1lBQzVCLE9BQU8sR0FBRyxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsMkJBQTJCLEVBQUU7Z0JBQzdELE1BQU0sRUFBRSx3RkFBd0Y7c0JBQzFGLDhDQUE4QztzQkFDOUMsb0ZBQW9GO3NCQUNwRiw2RkFBNkY7c0JBQzdGLCtEQUErRDtzQkFDL0QsaUNBQWlDO3NCQUNqQyx1R0FBdUc7c0JBQ3ZHLHFDQUFxQzthQUM1QyxFQUFFO2dCQUNELEVBQUUsS0FBSyxFQUFFLHVDQUF1QyxFQUFFO2dCQUNsRCxFQUFFLEtBQUssRUFBRSxxQkFBcUIsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO2FBQ2hELENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLHFCQUFxQixDQUFDLENBQUM7U0FDNUQ7YUFBTTtZQUNMLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUMvQjtJQUNILENBQUM7Q0FBQTtBQTVCRCxnQ0E0QkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwYXRoIGZyb20gJ3BhdGgnO1xuaW1wb3J0IHsgdHlwZXMgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgTFNMSUJfRklMRVMsIE9SSUdJTkFMX0ZJTEVTIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgbG9nRGVidWcgfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gaXNMU0xpYihmaWxlczogdHlwZXMuSUluc3RydWN0aW9uW10pIHtcbiAgY29uc3Qgb3JpZ0ZpbGUgPSBmaWxlcy5maW5kKGl0ZXIgPT5cbiAgICAoaXRlci50eXBlID09PSAnY29weScpICYmIExTTElCX0ZJTEVTLmhhcyhwYXRoLmJhc2VuYW1lKGl0ZXIuZGVzdGluYXRpb24pLnRvTG93ZXJDYXNlKCkpKTtcbiAgcmV0dXJuIG9yaWdGaWxlICE9PSB1bmRlZmluZWRcbiAgICA/IFByb21pc2UucmVzb2x2ZSh0cnVlKVxuICAgIDogUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlzQkczU0UoZmlsZXM6IHR5cGVzLklJbnN0cnVjdGlvbltdKSB7XG4gIGNvbnN0IG9yaWdGaWxlID0gZmlsZXMuZmluZChpdGVyID0+XG4gICAgKGl0ZXIudHlwZSA9PT0gJ2NvcHknKSAmJiAocGF0aC5iYXNlbmFtZShpdGVyLmRlc3RpbmF0aW9uKS50b0xvd2VyQ2FzZSgpID09PSAnZHdyaXRlLmRsbCcpKTtcbiAgcmV0dXJuIG9yaWdGaWxlICE9PSB1bmRlZmluZWRcbiAgICA/IFByb21pc2UucmVzb2x2ZSh0cnVlKVxuICAgIDogUHJvbWlzZS5yZXNvbHZlKGZhbHNlKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlzTG9vc2UoaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSk6IFByb21pc2U8Ym9vbGVhbj4geyBcbiAgLy8gb25seSBpbnRlcmVzdGVkIGluIGNvcHkgaW5zdHJ1Y3Rpb25zXG4gIGNvbnN0IGNvcHlJbnN0cnVjdGlvbnMgPSBpbnN0cnVjdGlvbnMuZmlsdGVyKGluc3RyID0+IGluc3RyLnR5cGUgPT09ICdjb3B5Jyk7XG5cbiAgLy8gZG8gd2UgaGF2ZSBhIGRhdGEgZm9sZGVyPyBcbiAgY29uc3QgaGFzRGF0YUZvbGRlcjpib29sZWFuID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XG4gICAgaW5zdHIuc291cmNlLmluZGV4T2YoJ0RhdGEnICsgcGF0aC5zZXApICE9PSAtMSkgIT09IHVuZGVmaW5lZDtcblxuICAvLyBkbyB3ZSBoYXZlIGEgcHVibGljIG9yIGdlbmVyYXRlZCBmb2xkZXI/XG4gIGNvbnN0IGhhc0dlbk9yUHVibGljRm9sZGVyOmJvb2xlYW4gPSBjb3B5SW5zdHJ1Y3Rpb25zLmZpbmQoaW5zdHIgPT5cbiAgICBpbnN0ci5zb3VyY2UuaW5kZXhPZignR2VuZXJhdGVkJyArIHBhdGguc2VwKSAhPT0gLTEgfHwgXG4gICAgaW5zdHIuc291cmNlLmluZGV4T2YoJ1B1YmxpYycgKyBwYXRoLnNlcCkgIT09IC0xXG4gICkgIT09IHVuZGVmaW5lZDtcblxuICBsb2dEZWJ1ZygnaXNMb29zZScsIHsgaW5zdHJ1Y3Rpb25zOiBpbnN0cnVjdGlvbnMsIGhhc0RhdGFGb2xkZXI6IGhhc0RhdGFGb2xkZXIgfHwgaGFzR2VuT3JQdWJsaWNGb2xkZXIgfSk7XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShoYXNEYXRhRm9sZGVyIHx8IGhhc0dlbk9yUHVibGljRm9sZGVyKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlzUmVwbGFjZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBmaWxlczogdHlwZXMuSUluc3RydWN0aW9uW10pOiBQcm9taXNlPGJvb2xlYW4+IHtcblxuICBjb25zdCBvcmlnRmlsZSA9IGZpbGVzLmZpbmQoaXRlciA9PlxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgT1JJR0lOQUxfRklMRVMuaGFzKGl0ZXIuZGVzdGluYXRpb24udG9Mb3dlckNhc2UoKSkpO1xuXG4gIGNvbnN0IHBha3MgPSBmaWxlcy5maWx0ZXIoaXRlciA9PlxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgKHBhdGguZXh0bmFtZShpdGVyLmRlc3RpbmF0aW9uKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpKTtcblxuICBsb2dEZWJ1ZygnaXNSZXBsYWNlcicsICB7b3JpZ0ZpbGU6IG9yaWdGaWxlLCBwYWtzOiBwYWtzfSk7XG5cbiAgLy9pZiAoKG9yaWdGaWxlICE9PSB1bmRlZmluZWQpIHx8IChwYWtzLmxlbmd0aCA9PT0gMCkpIHtcbiAgaWYgKChvcmlnRmlsZSAhPT0gdW5kZWZpbmVkKSkge1xuICAgIHJldHVybiBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnTW9kIGxvb2tzIGxpa2UgYSByZXBsYWNlcicsIHtcbiAgICAgIGJiY29kZTogJ1RoZSBtb2QgeW91IGp1c3QgaW5zdGFsbGVkIGxvb2tzIGxpa2UgYSBcInJlcGxhY2VyXCIsIG1lYW5pbmcgaXQgaXMgaW50ZW5kZWQgdG8gcmVwbGFjZSAnXG4gICAgICAgICAgKyAnb25lIG9mIHRoZSBmaWxlcyBzaGlwcGVkIHdpdGggdGhlIGdhbWUuPGJyLz4nXG4gICAgICAgICAgKyAnWW91IHNob3VsZCBiZSBhd2FyZSB0aGF0IHN1Y2ggYSByZXBsYWNlciBpbmNsdWRlcyBhIGNvcHkgb2Ygc29tZSBnYW1lIGRhdGEgZnJvbSBhICdcbiAgICAgICAgICArICdzcGVjaWZpYyB2ZXJzaW9uIG9mIHRoZSBnYW1lIGFuZCBtYXkgdGhlcmVmb3JlIGJyZWFrIGFzIHNvb24gYXMgdGhlIGdhbWUgZ2V0cyB1cGRhdGVkLjxici8+J1xuICAgICAgICAgICsgJ0V2ZW4gaWYgZG9lc25cXCd0IGJyZWFrLCBpdCBtYXkgcmV2ZXJ0IGJ1Z2ZpeGVzIHRoYXQgdGhlIGdhbWUgJ1xuICAgICAgICAgICsgJ2RldmVsb3BlcnMgaGF2ZSBtYWRlLjxici8+PGJyLz4nXG4gICAgICAgICAgKyAnVGhlcmVmb3JlIFtjb2xvcj1cInJlZFwiXXBsZWFzZSB0YWtlIGV4dHJhIGNhcmUgdG8ga2VlcCB0aGlzIG1vZCB1cGRhdGVkWy9jb2xvcl0gYW5kIHJlbW92ZSBpdCB3aGVuIGl0ICdcbiAgICAgICAgICArICdubyBsb25nZXIgbWF0Y2hlcyB0aGUgZ2FtZSB2ZXJzaW9uLicsXG4gICAgfSwgW1xuICAgICAgeyBsYWJlbDogJ0luc3RhbGwgYXMgTW9kICh3aWxsIGxpa2VseSBub3Qgd29yayknIH0sXG4gICAgICB7IGxhYmVsOiAnSW5zdGFsbCBhcyBSZXBsYWNlcicsIGRlZmF1bHQ6IHRydWUgfSxcbiAgICBdKS50aGVuKHJlc3VsdCA9PiByZXN1bHQuYWN0aW9uID09PSAnSW5zdGFsbCBhcyBSZXBsYWNlcicpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICB9XG59Il19