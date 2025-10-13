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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testLSLib = testLSLib;
exports.testModFixer = testModFixer;
exports.testEngineInjector = testEngineInjector;
exports.installBG3SE = installBG3SE;
exports.installModFixer = installModFixer;
exports.installEngineInjector = installEngineInjector;
exports.installLSLib = installLSLib;
exports.testBG3SE = testBG3SE;
exports.testReplacer = testReplacer;
exports.installReplacer = installReplacer;
const exe_version_1 = __importDefault(require("exe-version"));
const path = __importStar(require("path"));
const semver = __importStar(require("semver"));
const common_1 = require("./common");
const util_1 = require("./util");
function testLSLib(files, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (gameId !== common_1.GAME_ID) {
            return Promise.resolve({ supported: false, requiredFiles: [] });
        }
        const matchedFiles = files.filter(file => common_1.LSLIB_FILES.has(path.basename(file).toLowerCase()));
        return Promise.resolve({
            supported: matchedFiles.length >= 2,
            requiredFiles: [],
        });
    });
}
function testModFixer(files, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        const notSupported = { supported: false, requiredFiles: [] };
        if (gameId !== common_1.GAME_ID) {
            return Promise.resolve(notSupported);
        }
        const lowered = files.map(file => file.toLowerCase());
        const hasModFixerPak = lowered.find(file => path.basename(file) === 'modfixer.pak') !== undefined;
        if (!hasModFixerPak) {
            return Promise.resolve(notSupported);
        }
        return Promise.resolve({
            supported: true,
            requiredFiles: []
        });
    });
}
function testEngineInjector(files, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        const notSupported = { supported: false, requiredFiles: [] };
        if (gameId !== common_1.GAME_ID) {
            return Promise.resolve(notSupported);
        }
        const lowered = files.map(file => file.toLowerCase());
        const hasBinFolder = lowered.find(file => file.indexOf('bin' + path.sep) !== -1) !== undefined;
        if (!hasBinFolder) {
            return Promise.resolve(notSupported);
        }
        return Promise.resolve({
            supported: true,
            requiredFiles: []
        });
    });
}
function installBG3SE(files) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, util_1.logDebug)('installBG3SE files:', files);
        files = files.filter(f => path.extname(f) !== '' && !f.endsWith(path.sep));
        files = files.filter(f => path.extname(f) === '.dll');
        const instructions = files.reduce((accum, filePath) => {
            accum.push({
                type: 'copy',
                source: filePath,
                destination: path.basename(filePath),
            });
            return accum;
        }, []);
        (0, util_1.logDebug)('installBG3SE instructions:', instructions);
        return Promise.resolve({ instructions });
    });
}
function installModFixer(files) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, util_1.logDebug)('installModFixer files:', files);
        files = files.filter(f => path.extname(f) !== '' && !f.endsWith(path.sep));
        files = files.filter(f => path.extname(f) === '.pak');
        const modFixerAttribute = { type: 'attribute', key: 'modFixer', value: true };
        const instructions = files.reduce((accum, filePath) => {
            accum.push({
                type: 'copy',
                source: filePath,
                destination: path.basename(filePath),
            });
            return accum;
        }, [modFixerAttribute]);
        (0, util_1.logDebug)('installModFixer instructions:', instructions);
        return Promise.resolve({ instructions });
    });
}
function installEngineInjector(files) {
    return __awaiter(this, void 0, void 0, function* () {
        (0, util_1.logDebug)('installEngineInjector files:', files);
        files = files.filter(f => path.extname(f) !== '' && !f.endsWith(path.sep));
        const modtypeAttr = { type: 'setmodtype', value: 'dinput' };
        const instructions = files.reduce((accum, filePath) => {
            const binIndex = filePath.toLowerCase().indexOf('bin' + path.sep);
            if (binIndex !== -1) {
                (0, util_1.logDebug)(filePath.substring(binIndex));
                accum.push({
                    type: 'copy',
                    source: filePath,
                    destination: filePath.substring(binIndex),
                });
            }
            return accum;
        }, [modtypeAttr]);
        (0, util_1.logDebug)('installEngineInjector instructions:', instructions);
        return Promise.resolve({ instructions });
    });
}
function installLSLib(files, destinationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const exe = files.find(file => path.basename(file.toLowerCase()) === 'divine.exe');
        const exePath = path.join(destinationPath, exe);
        let ver = yield (0, exe_version_1.default)(exePath);
        ver = ver.split('.').slice(0, 3).join('.');
        const fileName = path.basename(destinationPath, path.extname(destinationPath));
        const idx = fileName.indexOf('-v');
        const fileNameVer = fileName.slice(idx + 2);
        if (semver.valid(fileNameVer) && ver !== fileNameVer) {
            ver = fileNameVer;
        }
        const versionAttr = { type: 'attribute', key: 'version', value: ver };
        const modtypeAttr = { type: 'setmodtype', value: 'bg3-lslib-divine-tool' };
        const instructions = files.reduce((accum, filePath) => {
            if (filePath.toLowerCase()
                .split(path.sep)
                .indexOf('tools') !== -1
                && !filePath.endsWith(path.sep)) {
                accum.push({
                    type: 'copy',
                    source: filePath,
                    destination: path.join('tools', path.basename(filePath)),
                });
            }
            return accum;
        }, [modtypeAttr, versionAttr]);
        return Promise.resolve({ instructions });
    });
}
function testBG3SE(files, gameId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (gameId !== common_1.GAME_ID) {
            return Promise.resolve({ supported: false, requiredFiles: [] });
        }
        const hasDWriteDll = files.find(file => path.basename(file).toLowerCase() === 'dwrite.dll') !== undefined;
        return Promise.resolve({
            supported: hasDWriteDll,
            requiredFiles: [],
        });
    });
}
function testReplacer(files, gameId) {
    if (gameId !== common_1.GAME_ID) {
        return Promise.resolve({ supported: false, requiredFiles: [] });
    }
    const paks = files.filter(file => path.extname(file).toLowerCase() === '.pak');
    const hasGenOrPublicFolder = ['generated', 'public'].some(segment => files.find(file => file.toLowerCase().indexOf(segment + path.sep) !== -1) !== undefined);
    return Promise.resolve({
        supported: hasGenOrPublicFolder || paks.length === 0,
        requiredFiles: [],
    });
}
function installReplacer(files) {
    return __awaiter(this, void 0, void 0, function* () {
        const directories = Array.from(new Set(files.map(file => path.dirname(file).toUpperCase())));
        let dataPath = undefined;
        const genOrPublic = directories
            .find(dir => ['PUBLIC', 'GENERATED'].includes(path.basename(dir)));
        if (genOrPublic !== undefined) {
            dataPath = path.dirname(genOrPublic);
        }
        if (dataPath === undefined) {
            dataPath = directories.find(dir => path.basename(dir) === 'DATA');
        }
        const instructions = (dataPath !== undefined)
            ? files.reduce((prev, filePath) => {
                if (filePath.endsWith(path.sep)) {
                    return prev;
                }
                const relPath = path.relative(dataPath, filePath);
                if (!relPath.startsWith('..')) {
                    prev.push({
                        type: 'copy',
                        source: filePath,
                        destination: relPath,
                    });
                }
                return prev;
            }, [])
            : files.map((filePath) => ({
                type: 'copy',
                source: filePath,
                destination: filePath,
            }));
        return Promise.resolve({
            instructions,
        });
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdGFsbGVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImluc3RhbGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFTQSw4QkFVQztBQUVELG9DQXVCQztBQUVELGdEQXVCQztBQUVELG9DQXNCQztBQUVELDBDQXdCQztBQUVELHNEQWdDQztBQUVELG9DQWtDQztBQUVELDhCQVlDO0FBRUQsb0NBYUM7QUFFRCwwQ0FvQ0M7QUEvUEQsOERBQXFDO0FBQ3JDLDJDQUE2QjtBQUM3QiwrQ0FBaUM7QUFHakMscUNBQWdEO0FBQ2hELGlDQUFrQztBQUVsQyxTQUFzQixTQUFTLENBQUMsS0FBZSxFQUFFLE1BQWM7O1FBQzdELElBQUksTUFBTSxLQUFLLGdCQUFPLEVBQUUsQ0FBQztZQUN2QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQ2xFLENBQUM7UUFDRCxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsb0JBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFFOUYsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDO1lBQ3JCLFNBQVMsRUFBRSxZQUFZLENBQUMsTUFBTSxJQUFJLENBQUM7WUFDbkMsYUFBYSxFQUFFLEVBQUU7U0FDbEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUFBO0FBRUQsU0FBc0IsWUFBWSxDQUFDLEtBQWUsRUFBRSxNQUFjOztRQUVoRSxNQUFNLFlBQVksR0FBRyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLEVBQUUsRUFBRSxDQUFDO1FBRTdELElBQUksTUFBTSxLQUFLLGdC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RUFBc0IsRUFBRSxDQUFDLENBQUM7Z0JBQ25ELElBQUksRUFBRSxNQUFNO2dCQUNaLE1BQU0sRUFBRSxRQUFRO2dCQUNoQixXQUFXLEVBQUUsUUFBUTthQUN0QixDQUFDLENBQUMsQ0FBQztRQUVSLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQztZQUNyQixZQUFZO1NBQ2IsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUFBIiwic291cmNlc0NvbnRlbnQiOlsiLyogZXNsaW50LWRpc2FibGUgKi9cbmltcG9ydCBnZXRWZXJzaW9uIGZyb20gJ2V4ZS12ZXJzaW9uJztcbmltcG9ydCAqIGFzIHBhdGggZnJvbSAncGF0aCc7XG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcbmltcG9ydCB7IHR5cGVzIH0gZnJvbSAndm9ydGV4LWFwaSc7XG5cbmltcG9ydCB7IExTTElCX0ZJTEVTLCBHQU1FX0lEIH0gZnJvbSAnLi9jb21tb24nO1xuaW1wb3J0IHsgbG9nRGVidWcgfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdExTTGliKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcbiAgfVxuICBjb25zdCBtYXRjaGVkRmlsZXMgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBMU0xJQl9GSUxFUy5oYXMocGF0aC5iYXNlbmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpKSk7XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgc3VwcG9ydGVkOiBtYXRjaGVkRmlsZXMubGVuZ3RoID49IDIsXG4gICAgcmVxdWlyZWRGaWxlczogW10sXG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdGVzdE1vZEZpeGVyKGZpbGVzOiBzdHJpbmdbXSwgZ2FtZUlkOiBzdHJpbmcpOiBQcm9taXNlPHR5cGVzLklTdXBwb3J0ZWRSZXN1bHQ+IHtcblxuICBjb25zdCBub3RTdXBwb3J0ZWQgPSB7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH07XG5cbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIC8vIGRpZmZlcmVudCBnYW1lLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcbiAgfVxuXG4gIGNvbnN0IGxvd2VyZWQgPSBmaWxlcy5tYXAoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkpO1xuICAvL2NvbnN0IGJpbkZvbGRlciA9IGxvd2VyZWQuZmluZChmaWxlID0+IGZpbGUuc3BsaXQocGF0aC5zZXApLmluZGV4T2YoJ2JpbicpICE9PSAtMSk7XG5cbiAgY29uc3QgaGFzTW9kRml4ZXJQYWsgPSBsb3dlcmVkLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpID09PSAnbW9kZml4ZXIucGFrJykgIT09IHVuZGVmaW5lZDtcblxuICBpZiAoIWhhc01vZEZpeGVyUGFrKSB7XG4gICAgLy8gdGhlcmUncyBubyBtb2RmaXhlci5wYWsgZm9sZGVyLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcbiAgfVxuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgc3VwcG9ydGVkOiB0cnVlLFxuICAgICAgcmVxdWlyZWRGaWxlczogW11cbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0RW5naW5lSW5qZWN0b3IoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IFByb21pc2U8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xuXG4gIGNvbnN0IG5vdFN1cHBvcnRlZCA9IHsgc3VwcG9ydGVkOiBmYWxzZSwgcmVxdWlyZWRGaWxlczogW10gfTtcblxuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgLy8gZGlmZmVyZW50IGdhbWUuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShub3RTdXBwb3J0ZWQpO1xuICB9XG5cbiAgY29uc3QgbG93ZXJlZCA9IGZpbGVzLm1hcChmaWxlID0+IGZpbGUudG9Mb3dlckNhc2UoKSk7XG4gIC8vY29uc3QgYmluRm9sZGVyID0gbG93ZXJlZC5maW5kKGZpbGUgPT4gZmlsZS5zcGxpdChwYXRoLnNlcCkuaW5kZXhPZignYmluJykgIT09IC0xKTtcblxuICBjb25zdCBoYXNCaW5Gb2xkZXIgPSBsb3dlcmVkLmZpbmQoZmlsZSA9PiBmaWxlLmluZGV4T2YoJ2JpbicgKyBwYXRoLnNlcCkgIT09IC0xKSAhPT0gdW5kZWZpbmVkO1xuXG4gIGlmICghaGFzQmluRm9sZGVyKSB7XG4gICAgLy8gdGhlcmUncyBubyBiaW4gZm9sZGVyLlxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobm90U3VwcG9ydGVkKTtcbiAgfVxuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgICAgc3VwcG9ydGVkOiB0cnVlLFxuICAgICAgcmVxdWlyZWRGaWxlczogW11cbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsQkczU0UoZmlsZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xuICBcbiAgbG9nRGVidWcoJ2luc3RhbGxCRzNTRSBmaWxlczonLCBmaWxlcyk7XG5cbiAgLy8gRmlsdGVyIG91dCBmb2xkZXJzIGFzIHRoaXMgYnJlYWtzIHRoZSBpbnN0YWxsZXIuXG4gIGZpbGVzID0gZmlsZXMuZmlsdGVyKGYgPT4gcGF0aC5leHRuYW1lKGYpICE9PSAnJyAmJiAhZi5lbmRzV2l0aChwYXRoLnNlcCkpO1xuXG4gIC8vIEZpbHRlciBvbmx5IGRsbCBmaWxlcy5cbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgPT09ICcuZGxsJyk7XG5cbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IGZpbGVzLnJlZHVjZSgoYWNjdW06IHR5cGVzLklJbnN0cnVjdGlvbltdLCBmaWxlUGF0aDogc3RyaW5nKSA9PiB7ICAgIFxuICAgICAgYWNjdW0ucHVzaCh7XG4gICAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcbiAgICAgICAgZGVzdGluYXRpb246IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpLFxuICAgICAgfSk7ICAgIFxuICAgIHJldHVybiBhY2N1bTtcbiAgfSwgW10pO1xuXG4gIGxvZ0RlYnVnKCdpbnN0YWxsQkczU0UgaW5zdHJ1Y3Rpb25zOicsIGluc3RydWN0aW9ucyk7XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcbn0gXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsTW9kRml4ZXIoZmlsZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xuICBcbiAgbG9nRGVidWcoJ2luc3RhbGxNb2RGaXhlciBmaWxlczonLCBmaWxlcyk7XG5cbiAgLy8gRmlsdGVyIG91dCBmb2xkZXJzIGFzIHRoaXMgYnJlYWtzIHRoZSBpbnN0YWxsZXIuXG4gIGZpbGVzID0gZmlsZXMuZmlsdGVyKGYgPT4gcGF0aC5leHRuYW1lKGYpICE9PSAnJyAmJiAhZi5lbmRzV2l0aChwYXRoLnNlcCkpO1xuXG4gIC8vIEZpbHRlciBvbmx5IHBhayBmaWxlcy5cbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgPT09ICcucGFrJyk7XG5cbiAgY29uc3QgbW9kRml4ZXJBdHRyaWJ1dGU6IHR5cGVzLklJbnN0cnVjdGlvbiA9IHsgdHlwZTogJ2F0dHJpYnV0ZScsIGtleTogJ21vZEZpeGVyJywgdmFsdWU6IHRydWUgfVxuXG4gIGNvbnN0IGluc3RydWN0aW9uczogdHlwZXMuSUluc3RydWN0aW9uW10gPSBmaWxlcy5yZWR1Y2UoKGFjY3VtOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSwgZmlsZVBhdGg6IHN0cmluZykgPT4geyAgICBcbiAgICAgIGFjY3VtLnB1c2goe1xuICAgICAgICB0eXBlOiAnY29weScsXG4gICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmJhc2VuYW1lKGZpbGVQYXRoKSxcbiAgICAgIH0pOyAgICBcbiAgICByZXR1cm4gYWNjdW07XG4gIH0sIFsgbW9kRml4ZXJBdHRyaWJ1dGUgXSk7XG5cbiAgbG9nRGVidWcoJ2luc3RhbGxNb2RGaXhlciBpbnN0cnVjdGlvbnM6JywgaW5zdHJ1Y3Rpb25zKTtcblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHsgaW5zdHJ1Y3Rpb25zIH0pO1xufSBcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGluc3RhbGxFbmdpbmVJbmplY3RvcihmaWxlczogc3RyaW5nW10pOiBQcm9taXNlPHR5cGVzLklJbnN0YWxsUmVzdWx0PiB7XG4gIFxuICBsb2dEZWJ1ZygnaW5zdGFsbEVuZ2luZUluamVjdG9yIGZpbGVzOicsIGZpbGVzKTtcblxuICAvLyBGaWx0ZXIgb3V0IGZvbGRlcnMgYXMgdGhpcyBicmVha3MgdGhlIGluc3RhbGxlci5cbiAgZmlsZXMgPSBmaWxlcy5maWx0ZXIoZiA9PiBwYXRoLmV4dG5hbWUoZikgIT09ICcnICYmICFmLmVuZHNXaXRoKHBhdGguc2VwKSk7XG5cbiAgY29uc3QgbW9kdHlwZUF0dHI6IHR5cGVzLklJbnN0cnVjdGlvbiA9IHsgdHlwZTogJ3NldG1vZHR5cGUnLCB2YWx1ZTogJ2RpbnB1dCcgfSBcblxuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID0gZmlsZXMucmVkdWNlKChhY2N1bTogdHlwZXMuSUluc3RydWN0aW9uW10sIGZpbGVQYXRoOiBzdHJpbmcpID0+IHtcbiAgICBcbiAgICAvLyBzZWUgaWYgd2UgaGF2ZSBhIGJpbiBmb2xkZXJcbiAgICAvLyB0aGVuIHdlIG5lZWQgdG8gdXNlIHRoYXQgYXMgYSBuZXcgcm9vdCBpbmNhc2UgdGhlIC9iaW4gaXMgbmVzdGVkXG5cbiAgICBjb25zdCBiaW5JbmRleCA9IGZpbGVQYXRoLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignYmluJyArIHBhdGguc2VwKTtcblxuICAgIGlmIChiaW5JbmRleCAhPT0gLTEpIHtcblxuICAgICAgbG9nRGVidWcoZmlsZVBhdGguc3Vic3RyaW5nKGJpbkluZGV4KSk7XG5cbiAgICAgIGFjY3VtLnB1c2goe1xuICAgICAgICB0eXBlOiAnY29weScsXG4gICAgICAgIHNvdXJjZTogZmlsZVBhdGgsXG4gICAgICAgIGRlc3RpbmF0aW9uOiBmaWxlUGF0aC5zdWJzdHJpbmcoYmluSW5kZXgpLFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBhY2N1bTtcbiAgfSwgWyBtb2R0eXBlQXR0ciBdKTtcblxuICBsb2dEZWJ1ZygnaW5zdGFsbEVuZ2luZUluamVjdG9yIGluc3RydWN0aW9uczonLCBpbnN0cnVjdGlvbnMpO1xuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsTFNMaWIoZmlsZXM6IHN0cmluZ1tdLCBkZXN0aW5hdGlvblBhdGg6IHN0cmluZyk6IFByb21pc2U8dHlwZXMuSUluc3RhbGxSZXN1bHQ+IHtcbiAgY29uc3QgZXhlID0gZmlsZXMuZmluZChmaWxlID0+IHBhdGguYmFzZW5hbWUoZmlsZS50b0xvd2VyQ2FzZSgpKSA9PT0gJ2RpdmluZS5leGUnKTtcbiAgY29uc3QgZXhlUGF0aCA9IHBhdGguam9pbihkZXN0aW5hdGlvblBhdGgsIGV4ZSk7XG4gIGxldCB2ZXI6IHN0cmluZyA9IGF3YWl0IGdldFZlcnNpb24oZXhlUGF0aCk7XG4gIHZlciA9IHZlci5zcGxpdCgnLicpLnNsaWNlKDAsIDMpLmpvaW4oJy4nKTtcblxuICAvLyBVbmZvcnR1bmF0ZWx5IHRoZSBMU0xpYiBkZXZlbG9wZXIgaXMgbm90IGNvbnNpc3RlbnQgd2hlbiBjaGFuZ2luZ1xuICAvLyAgZmlsZSB2ZXJzaW9ucyAtIHRoZSBleGVjdXRhYmxlIGF0dHJpYnV0ZSBtaWdodCBoYXZlIGFuIG9sZGVyIHZlcnNpb25cbiAgLy8gIHZhbHVlIHRoYW4gdGhlIG9uZSBzcGVjaWZpZWQgYnkgdGhlIGZpbGVuYW1lIC0gd2UncmUgZ29pbmcgdG8gdXNlXG4gIC8vICB0aGUgZmlsZW5hbWUgYXMgdGhlIHBvaW50IG9mIHRydXRoICp1Z2gqXG4gIGNvbnN0IGZpbGVOYW1lID0gcGF0aC5iYXNlbmFtZShkZXN0aW5hdGlvblBhdGgsIHBhdGguZXh0bmFtZShkZXN0aW5hdGlvblBhdGgpKTtcbiAgY29uc3QgaWR4ID0gZmlsZU5hbWUuaW5kZXhPZignLXYnKTtcbiAgY29uc3QgZmlsZU5hbWVWZXIgPSBmaWxlTmFtZS5zbGljZShpZHggKyAyKTtcbiAgaWYgKHNlbXZlci52YWxpZChmaWxlTmFtZVZlcikgJiYgdmVyICE9PSBmaWxlTmFtZVZlcikge1xuICAgIHZlciA9IGZpbGVOYW1lVmVyO1xuICB9XG4gIGNvbnN0IHZlcnNpb25BdHRyOiB0eXBlcy5JSW5zdHJ1Y3Rpb24gPSB7IHR5cGU6ICdhdHRyaWJ1dGUnLCBrZXk6ICd2ZXJzaW9uJywgdmFsdWU6IHZlciB9O1xuICBjb25zdCBtb2R0eXBlQXR0cjogdHlwZXMuSUluc3RydWN0aW9uID0geyB0eXBlOiAnc2V0bW9kdHlwZScsIHZhbHVlOiAnYmczLWxzbGliLWRpdmluZS10b29sJyB9O1xuICBjb25zdCBpbnN0cnVjdGlvbnM6IHR5cGVzLklJbnN0cnVjdGlvbltdID1cbiAgICBmaWxlcy5yZWR1Y2UoKGFjY3VtOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSwgZmlsZVBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKGZpbGVQYXRoLnRvTG93ZXJDYXNlKClcbiAgICAgICAgLnNwbGl0KHBhdGguc2VwKVxuICAgICAgICAuaW5kZXhPZigndG9vbHMnKSAhPT0gLTFcbiAgICAgICAgJiYgIWZpbGVQYXRoLmVuZHNXaXRoKHBhdGguc2VwKSkge1xuICAgICAgICBhY2N1bS5wdXNoKHtcbiAgICAgICAgICB0eXBlOiAnY29weScsXG4gICAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcbiAgICAgICAgICBkZXN0aW5hdGlvbjogcGF0aC5qb2luKCd0b29scycsIHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpKSxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gYWNjdW07XG4gICAgfSwgW21vZHR5cGVBdHRyLCB2ZXJzaW9uQXR0cl0pO1xuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBpbnN0cnVjdGlvbnMgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB0ZXN0QkczU0UoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IFByb21pc2U8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xuICBcbiAgaWYgKGdhbWVJZCAhPT0gR0FNRV9JRCkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoeyBzdXBwb3J0ZWQ6IGZhbHNlLCByZXF1aXJlZEZpbGVzOiBbXSB9KTtcbiAgfVxuXG4gIGNvbnN0IGhhc0RXcml0ZURsbCA9IGZpbGVzLmZpbmQoZmlsZSA9PiBwYXRoLmJhc2VuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09ICdkd3JpdGUuZGxsJykgIT09IHVuZGVmaW5lZDtcblxuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHtcbiAgICBzdXBwb3J0ZWQ6IGhhc0RXcml0ZURsbCxcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcbiAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXN0UmVwbGFjZXIoZmlsZXM6IHN0cmluZ1tdLCBnYW1lSWQ6IHN0cmluZyk6IFByb21pc2U8dHlwZXMuSVN1cHBvcnRlZFJlc3VsdD4ge1xuICBpZiAoZ2FtZUlkICE9PSBHQU1FX0lEKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHN1cHBvcnRlZDogZmFsc2UsIHJlcXVpcmVkRmlsZXM6IFtdIH0pO1xuICB9XG4gIGNvbnN0IHBha3MgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PiBwYXRoLmV4dG5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gJy5wYWsnKTtcbiAgLy8gZG8gd2UgaGF2ZSBhIHB1YmxpYyBvciBnZW5lcmF0ZWQgZm9sZGVyP1xuICBjb25zdCBoYXNHZW5PclB1YmxpY0ZvbGRlcjogYm9vbGVhbiA9IFsnZ2VuZXJhdGVkJywgJ3B1YmxpYyddLnNvbWUoc2VnbWVudCA9PlxuICAgIGZpbGVzLmZpbmQoZmlsZSA9PiBmaWxlLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihzZWdtZW50ICsgcGF0aC5zZXApICE9PSAtMSkgIT09IHVuZGVmaW5lZCk7XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7XG4gICAgc3VwcG9ydGVkOiBoYXNHZW5PclB1YmxpY0ZvbGRlciB8fCBwYWtzLmxlbmd0aCA9PT0gMCxcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbnN0YWxsUmVwbGFjZXIoZmlsZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx0eXBlcy5JSW5zdGFsbFJlc3VsdD4ge1xuICBjb25zdCBkaXJlY3RvcmllcyA9IEFycmF5LmZyb20obmV3IFNldChmaWxlcy5tYXAoZmlsZSA9PiBwYXRoLmRpcm5hbWUoZmlsZSkudG9VcHBlckNhc2UoKSkpKTtcbiAgbGV0IGRhdGFQYXRoID0gdW5kZWZpbmVkO1xuICBjb25zdCBnZW5PclB1YmxpYyA9IGRpcmVjdG9yaWVzXG4gICAgLmZpbmQoZGlyID0+IFsnUFVCTElDJywgJ0dFTkVSQVRFRCddLmluY2x1ZGVzKHBhdGguYmFzZW5hbWUoZGlyKSkpO1xuICBpZiAoZ2VuT3JQdWJsaWMgIT09IHVuZGVmaW5lZCkge1xuICAgIGRhdGFQYXRoID0gcGF0aC5kaXJuYW1lKGdlbk9yUHVibGljKTtcbiAgfVxuICBpZiAoZGF0YVBhdGggPT09IHVuZGVmaW5lZCkge1xuICAgIGRhdGFQYXRoID0gZGlyZWN0b3JpZXMuZmluZChkaXIgPT4gcGF0aC5iYXNlbmFtZShkaXIpID09PSAnREFUQScpO1xuICB9XG5cbiAgY29uc3QgaW5zdHJ1Y3Rpb25zOiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSA9IChkYXRhUGF0aCAhPT0gdW5kZWZpbmVkKVxuICAgID8gZmlsZXMucmVkdWNlKChwcmV2OiB0eXBlcy5JSW5zdHJ1Y3Rpb25bXSwgZmlsZVBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgaWYgKGZpbGVQYXRoLmVuZHNXaXRoKHBhdGguc2VwKSkge1xuICAgICAgICByZXR1cm4gcHJldjtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlbFBhdGggPSBwYXRoLnJlbGF0aXZlKGRhdGFQYXRoLCBmaWxlUGF0aCk7XG4gICAgICBpZiAoIXJlbFBhdGguc3RhcnRzV2l0aCgnLi4nKSkge1xuICAgICAgICBwcmV2LnB1c2goe1xuICAgICAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgICAgICBzb3VyY2U6IGZpbGVQYXRoLFxuICAgICAgICAgIGRlc3RpbmF0aW9uOiByZWxQYXRoLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBwcmV2O1xuICAgIH0sIFtdKVxuICAgIDogZmlsZXMubWFwKChmaWxlUGF0aDogc3RyaW5nKTogdHlwZXMuSUluc3RydWN0aW9uID0+ICh7XG4gICAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgICAgc291cmNlOiBmaWxlUGF0aCxcbiAgICAgICAgZGVzdGluYXRpb246IGZpbGVQYXRoLFxuICAgICAgfSkpO1xuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgIGluc3RydWN0aW9ucyxcbiAgfSk7XG59XG5cbiJdfQ==