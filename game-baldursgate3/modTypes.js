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
exports.isLSLib = isLSLib;
exports.isBG3SE = isBG3SE;
exports.isLoose = isLoose;
exports.isReplacer = isReplacer;
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
function isBG3SE(files) {
    return __awaiter(this, void 0, void 0, function* () {
        const origFile = files.find(iter => (iter.type === 'copy') && (path.basename(iter.destination).toLowerCase() === 'dwrite.dll'));
        return origFile !== undefined
            ? Promise.resolve(true)
            : Promise.resolve(false);
    });
}
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kVHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb2RUeXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQU1BLDBCQU1DO0FBRUQsMEJBTUM7QUFFRCwwQkFpQkM7QUFFRCxnQ0E0QkM7QUFyRUQsMkNBQTZCO0FBRzdCLHFDQUF1RDtBQUN2RCxpQ0FBa0M7QUFFbEMsU0FBc0IsT0FBTyxDQUFDLEtBQTJCOztRQUN2RCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ2pDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxvQkFBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUYsT0FBTyxRQUFRLEtBQUssU0FBUztZQUMzQixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDdkIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0IsQ0FBQztDQUFBO0FBRUQsU0FBc0IsT0FBTyxDQUFDLEtBQTJCOztRQUN2RCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ2pDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLFlBQVksQ0FBQyxDQUFDLENBQUM7UUFDOUYsT0FBTyxRQUFRLEtBQUssU0FBUztZQUMzQixDQUFDLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUM7WUFDdkIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0IsQ0FBQztDQUFBO0FBRUQsU0FBc0IsT0FBTyxDQUFDLFlBQWtDOztRQUU5RCxNQUFNLGdCQUFnQixHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxDQUFDO1FBRzdFLE1BQU0sYUFBYSxHQUFXLGdCQUFnQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUMxRCxLQUFLLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxDQUFDO1FBR2hFLE1BQU0sb0JBQW9CLEdBQVcsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQ2pFLEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25ELEtBQUssQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQy9DLEtBQUssU0FBUyxDQUFDO1FBRWxCLElBQUEsZUFBUSxFQUFDLFNBQVMsRUFBRSxFQUFFLFlBQVksRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLGFBQWEsSUFBSSxvQkFBb0IsRUFBRSxDQUFDLENBQUM7UUFFMUcsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGFBQWEsSUFBSSxvQkFBb0IsQ0FBQyxDQUFDO0lBQ2hFLENBQUM7Q0FBQTtBQUVELFNBQXNCLFVBQVUsQ0FBQyxHQUF3QixFQUFFLEtBQTJCOztRQUVwRixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ2pDLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSx1QkFBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUVoRixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQy9CLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLFdBQVcsRUFBRSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFFdkYsSUFBQSxlQUFRLEVBQUMsWUFBWSxFQUFHLEVBQUMsUUFBUSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUcxRCxJQUFJLENBQUMsUUFBUSxLQUFLLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDN0IsT0FBTyxHQUFHLENBQUMsVUFBVSxDQUFDLFVBQVUsRUFBRSwyQkFBMkIsRUFBRTtnQkFDN0QsTUFBTSxFQUFFLHdGQUF3RjtzQkFDMUYsOENBQThDO3NCQUM5QyxvRkFBb0Y7c0JBQ3BGLDZGQUE2RjtzQkFDN0YsK0RBQStEO3NCQUMvRCxpQ0FBaUM7c0JBQ2pDLHVHQUF1RztzQkFDdkcscUNBQXFDO2FBQzVDLEVBQUU7Z0JBQ0QsRUFBRSxLQUFLLEVBQUUsdUNBQXVDLEVBQUU7Z0JBQ2xELEVBQUUsS0FBSyxFQUFFLHFCQUFxQixFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUU7YUFDaEQsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEtBQUsscUJBQXFCLENBQUMsQ0FBQztRQUM3RCxDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQyxDQUFDO0lBQ0gsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IExTTElCX0ZJTEVTLCBPUklHSU5BTF9GSUxFUyB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IGxvZ0RlYnVnIH0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlzTFNMaWIoZmlsZXM6IHR5cGVzLklJbnN0cnVjdGlvbltdKSB7XG4gIGNvbnN0IG9yaWdGaWxlID0gZmlsZXMuZmluZChpdGVyID0+XG4gICAgKGl0ZXIudHlwZSA9PT0gJ2NvcHknKSAmJiBMU0xJQl9GSUxFUy5oYXMocGF0aC5iYXNlbmFtZShpdGVyLmRlc3RpbmF0aW9uKS50b0xvd2VyQ2FzZSgpKSk7XG4gIHJldHVybiBvcmlnRmlsZSAhPT0gdW5kZWZpbmVkXG4gICAgPyBQcm9taXNlLnJlc29sdmUodHJ1ZSlcbiAgICA6IFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpc0JHM1NFKGZpbGVzOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSkge1xuICBjb25zdCBvcmlnRmlsZSA9IGZpbGVzLmZpbmQoaXRlciA9PlxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgKHBhdGguYmFzZW5hbWUoaXRlci5kZXN0aW5hdGlvbikudG9Mb3dlckNhc2UoKSA9PT0gJ2R3cml0ZS5kbGwnKSk7XG4gIHJldHVybiBvcmlnRmlsZSAhPT0gdW5kZWZpbmVkXG4gICAgPyBQcm9taXNlLnJlc29sdmUodHJ1ZSlcbiAgICA6IFByb21pc2UucmVzb2x2ZShmYWxzZSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpc0xvb3NlKGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10pOiBQcm9taXNlPGJvb2xlYW4+IHsgXG4gIC8vIG9ubHkgaW50ZXJlc3RlZCBpbiBjb3B5IGluc3RydWN0aW9uc1xuICBjb25zdCBjb3B5SW5zdHJ1Y3Rpb25zID0gaW5zdHJ1Y3Rpb25zLmZpbHRlcihpbnN0ciA9PiBpbnN0ci50eXBlID09PSAnY29weScpO1xuXG4gIC8vIGRvIHdlIGhhdmUgYSBkYXRhIGZvbGRlcj8gXG4gIGNvbnN0IGhhc0RhdGFGb2xkZXI6Ym9vbGVhbiA9IGNvcHlJbnN0cnVjdGlvbnMuZmluZChpbnN0ciA9PlxuICAgIGluc3RyLnNvdXJjZS5pbmRleE9mKCdEYXRhJyArIHBhdGguc2VwKSAhPT0gLTEpICE9PSB1bmRlZmluZWQ7XG5cbiAgLy8gZG8gd2UgaGF2ZSBhIHB1YmxpYyBvciBnZW5lcmF0ZWQgZm9sZGVyP1xuICBjb25zdCBoYXNHZW5PclB1YmxpY0ZvbGRlcjpib29sZWFuID0gY29weUluc3RydWN0aW9ucy5maW5kKGluc3RyID0+XG4gICAgaW5zdHIuc291cmNlLmluZGV4T2YoJ0dlbmVyYXRlZCcgKyBwYXRoLnNlcCkgIT09IC0xIHx8IFxuICAgIGluc3RyLnNvdXJjZS5pbmRleE9mKCdQdWJsaWMnICsgcGF0aC5zZXApICE9PSAtMVxuICAgICkgIT09IHVuZGVmaW5lZDtcblxuICBsb2dEZWJ1ZygnaXNMb29zZScsIHsgaW5zdHJ1Y3Rpb25zOiBpbnN0cnVjdGlvbnMsIGhhc0RhdGFGb2xkZXI6IGhhc0RhdGFGb2xkZXIgfHwgaGFzR2VuT3JQdWJsaWNGb2xkZXIgfSk7XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShoYXNEYXRhRm9sZGVyIHx8IGhhc0dlbk9yUHVibGljRm9sZGVyKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGlzUmVwbGFjZXIoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBmaWxlczogdHlwZXMuSUluc3RydWN0aW9uW10pOiBQcm9taXNlPGJvb2xlYW4+IHtcblxuICBjb25zdCBvcmlnRmlsZSA9IGZpbGVzLmZpbmQoaXRlciA9PlxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgT1JJR0lOQUxfRklMRVMuaGFzKGl0ZXIuZGVzdGluYXRpb24udG9Mb3dlckNhc2UoKSkpO1xuXG4gIGNvbnN0IHBha3MgPSBmaWxlcy5maWx0ZXIoaXRlciA9PlxuICAgIChpdGVyLnR5cGUgPT09ICdjb3B5JykgJiYgKHBhdGguZXh0bmFtZShpdGVyLmRlc3RpbmF0aW9uKS50b0xvd2VyQ2FzZSgpID09PSAnLnBhaycpKTtcblxuICBsb2dEZWJ1ZygnaXNSZXBsYWNlcicsICB7b3JpZ0ZpbGU6IG9yaWdGaWxlLCBwYWtzOiBwYWtzfSk7XG5cbiAgLy9pZiAoKG9yaWdGaWxlICE9PSB1bmRlZmluZWQpIHx8IChwYWtzLmxlbmd0aCA9PT0gMCkpIHtcbiAgaWYgKChvcmlnRmlsZSAhPT0gdW5kZWZpbmVkKSkge1xuICAgIHJldHVybiBhcGkuc2hvd0RpYWxvZygncXVlc3Rpb24nLCAnTW9kIGxvb2tzIGxpa2UgYSByZXBsYWNlcicsIHtcbiAgICAgIGJiY29kZTogJ1RoZSBtb2QgeW91IGp1c3QgaW5zdGFsbGVkIGxvb2tzIGxpa2UgYSBcInJlcGxhY2VyXCIsIG1lYW5pbmcgaXQgaXMgaW50ZW5kZWQgdG8gcmVwbGFjZSAnXG4gICAgICAgICAgKyAnb25lIG9mIHRoZSBmaWxlcyBzaGlwcGVkIHdpdGggdGhlIGdhbWUuPGJyLz4nXG4gICAgICAgICAgKyAnWW91IHNob3VsZCBiZSBhd2FyZSB0aGF0IHN1Y2ggYSByZXBsYWNlciBpbmNsdWRlcyBhIGNvcHkgb2Ygc29tZSBnYW1lIGRhdGEgZnJvbSBhICdcbiAgICAgICAgICArICdzcGVjaWZpYyB2ZXJzaW9uIG9mIHRoZSBnYW1lIGFuZCBtYXkgdGhlcmVmb3JlIGJyZWFrIGFzIHNvb24gYXMgdGhlIGdhbWUgZ2V0cyB1cGRhdGVkLjxici8+J1xuICAgICAgICAgICsgJ0V2ZW4gaWYgZG9lc25cXCd0IGJyZWFrLCBpdCBtYXkgcmV2ZXJ0IGJ1Z2ZpeGVzIHRoYXQgdGhlIGdhbWUgJ1xuICAgICAgICAgICsgJ2RldmVsb3BlcnMgaGF2ZSBtYWRlLjxici8+PGJyLz4nXG4gICAgICAgICAgKyAnVGhlcmVmb3JlIFtjb2xvcj1cInJlZFwiXXBsZWFzZSB0YWtlIGV4dHJhIGNhcmUgdG8ga2VlcCB0aGlzIG1vZCB1cGRhdGVkWy9jb2xvcl0gYW5kIHJlbW92ZSBpdCB3aGVuIGl0ICdcbiAgICAgICAgICArICdubyBsb25nZXIgbWF0Y2hlcyB0aGUgZ2FtZSB2ZXJzaW9uLicsXG4gICAgfSwgW1xuICAgICAgeyBsYWJlbDogJ0luc3RhbGwgYXMgTW9kICh3aWxsIGxpa2VseSBub3Qgd29yayknIH0sXG4gICAgICB7IGxhYmVsOiAnSW5zdGFsbCBhcyBSZXBsYWNlcicsIGRlZmF1bHQ6IHRydWUgfSxcbiAgICBdKS50aGVuKHJlc3VsdCA9PiByZXN1bHQuYWN0aW9uID09PSAnSW5zdGFsbCBhcyBSZXBsYWNlcicpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZmFsc2UpO1xuICB9XG59Il19