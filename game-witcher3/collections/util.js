"use strict";
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
exports.CollectionParseError = exports.CollectionGenerateError = void 0;
exports.isValidMod = isValidMod;
exports.isModInCollection = isModInCollection;
exports.genCollectionLoadOrder = genCollectionLoadOrder;
exports.walkDirPath = walkDirPath;
exports.prepareFileData = prepareFileData;
exports.cleanUpEntries = cleanUpEntries;
exports.restoreFileData = restoreFileData;
exports.hex2Buffer = hex2Buffer;
const path_1 = __importDefault(require("path"));
const shortid_1 = require("shortid");
const turbowalk_1 = __importDefault(require("turbowalk"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("../common");
class CollectionGenerateError extends Error {
    constructor(why) {
        super(`Failed to generate game specific data for collection: ${why}`);
        this.name = 'CollectionGenerateError';
    }
}
exports.CollectionGenerateError = CollectionGenerateError;
class CollectionParseError extends Error {
    constructor(collectionName, why) {
        super(`Failed to parse game specific data for collection ${collectionName}: ${why}`);
        this.name = 'CollectionGenerateError';
    }
}
exports.CollectionParseError = CollectionParseError;
function isValidMod(mod) {
    return (mod !== undefined) && (mod.type !== 'collection');
}
function isModInCollection(collectionMod, mod) {
    if (collectionMod.rules === undefined) {
        return false;
    }
    return collectionMod.rules.find(rule => vortex_api_1.util.testModReference(mod, rule.reference)) !== undefined;
}
function genCollectionLoadOrder(loadOrder, mods, collection) {
    const sortedMods = loadOrder.filter(entry => {
        const isLocked = entry.modId.includes(common_1.LOCKED_PREFIX);
        return isLocked || ((collection !== undefined)
            ? isValidMod(mods[entry.modId]) && (isModInCollection(collection, mods[entry.modId]))
            : isValidMod(mods[entry.modId]));
    })
        .sort((lhs, rhs) => lhs.data.prefix - rhs.data.prefix)
        .reduce((accum, iter, idx) => {
        accum.push(iter);
        return accum;
    }, []);
    return sortedMods;
}
function walkDirPath(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        let fileEntries = [];
        yield (0, turbowalk_1.default)(dirPath, (entries) => {
            fileEntries = fileEntries.concat(entries);
        })
            .catch({ systemCode: 3 }, () => Promise.resolve())
            .catch(err => ['ENOTFOUND', 'ENOENT'].includes(err.code)
            ? Promise.resolve() : Promise.reject(err));
        return fileEntries;
    });
}
function prepareFileData(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const sevenZip = new vortex_api_1.util.SevenZip();
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(common_1.W3_TEMP_DATA_DIR);
            const archivePath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, (0, shortid_1.generate)() + '.zip');
            const entries = yield vortex_api_1.fs.readdirAsync(dirPath);
            yield sevenZip.add(archivePath, entries.map(entry => path_1.default.join(dirPath, entry)), { raw: ['-r'] });
            const data = yield vortex_api_1.fs.readFileAsync(archivePath);
            yield vortex_api_1.fs.removeAsync(archivePath);
            return data;
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
function cleanUpEntries(fileEntries) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            fileEntries.sort((lhs, rhs) => rhs.filePath.length - lhs.filePath.length);
            for (const entry of fileEntries) {
                yield vortex_api_1.fs.removeAsync(entry.filePath);
            }
        }
        catch (err) {
            (0, vortex_api_1.log)('error', 'file entry cleanup failed', err);
        }
    });
}
function restoreFileData(fileData, destination) {
    return __awaiter(this, void 0, void 0, function* () {
        const sevenZip = new vortex_api_1.util.SevenZip();
        let archivePath;
        let fileEntries = [];
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(common_1.W3_TEMP_DATA_DIR);
            archivePath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, (0, shortid_1.generate)() + '.zip');
            yield vortex_api_1.fs.writeFileAsync(archivePath, fileData);
            const targetDirPath = path_1.default.join(common_1.W3_TEMP_DATA_DIR, path_1.default.basename(archivePath, '.zip'));
            yield sevenZip.extractFull(archivePath, targetDirPath);
            fileEntries = yield walkDirPath(targetDirPath);
            for (const entry of fileEntries) {
                const relPath = path_1.default.relative(targetDirPath, entry.filePath);
                const dest = path_1.default.join(destination, relPath);
                yield vortex_api_1.fs.ensureDirWritableAsync(path_1.default.dirname(dest));
                yield vortex_api_1.fs.copyAsync(entry.filePath, dest);
            }
            cleanUpEntries(fileEntries);
            return Promise.resolve();
        }
        catch (err) {
            cleanUpEntries(fileEntries);
            return Promise.reject(err);
        }
    });
}
function hex2Buffer(hexData) {
    const byteArray = new Uint8Array(hexData.length / 2);
    for (let x = 0; x < byteArray.length; x++) {
        byteArray[x] = parseInt(hexData.substr(x * 2, 2), 16);
    }
    const buffer = Buffer.from(byteArray);
    return buffer;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInV0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBc0JBLGdDQUVDO0FBRUQsOENBT0M7QUFFRCx3REFlQztBQUVELGtDQVVDO0FBRUQsMENBZUM7QUFFRCx3Q0FTQztBQUVELDBDQXVCQztBQUVELGdDQVFDO0FBNUhELGdEQUF3QjtBQUN4QixxQ0FBbUM7QUFDbkMsMERBQThDO0FBQzlDLDJDQUFrRDtBQUVsRCxzQ0FBNEQ7QUFFNUQsTUFBYSx1QkFBd0IsU0FBUSxLQUFLO0lBQ2hELFlBQVksR0FBVztRQUNyQixLQUFLLENBQUMseURBQXlELEdBQUcsRUFBRSxDQUFDLENBQUM7UUFDdEUsSUFBSSxDQUFDLElBQUksR0FBRyx5QkFBeUIsQ0FBQztJQUN4QyxDQUFDO0NBQ0Y7QUFMRCwwREFLQztBQUVELE1BQWEsb0JBQXFCLFNBQVEsS0FBSztJQUM3QyxZQUFZLGNBQXNCLEVBQUUsR0FBVztRQUM3QyxLQUFLLENBQUMscURBQXFELGNBQWMsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ3JGLElBQUksQ0FBQyxJQUFJLEdBQUcseUJBQXlCLENBQUM7SUFDeEMsQ0FBQztDQUNGO0FBTEQsb0RBS0M7QUFFRCxTQUFnQixVQUFVLENBQUMsR0FBZTtJQUN4QyxPQUFPLENBQUMsR0FBRyxLQUFLLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksS0FBSyxZQUFZLENBQUMsQ0FBQztBQUM1RCxDQUFDO0FBRUQsU0FBZ0IsaUJBQWlCLENBQUMsYUFBeUIsRUFBRSxHQUFlO0lBQzFFLElBQUksYUFBYSxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztRQUN0QyxPQUFPLEtBQUssQ0FBQztJQUNmLENBQUM7SUFFRCxPQUFPLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQ3JDLGlCQUFJLENBQUMsZ0JBQWdCLENB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LENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUMxQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN4RCxDQUFDO0lBRUQsTUFBTSxNQUFNLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN0QyxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIGVzbGludC1kaXNhYmxlICovXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGdlbmVyYXRlIH0gZnJvbSAnc2hvcnRpZCc7XG5pbXBvcnQgdHVyYm93YWxrLCB7IElFbnRyeSB9IGZyb20gJ3R1cmJvd2Fsayc7XG5pbXBvcnQgeyBmcywgbG9nLCB0eXBlcywgdXRpbCB9IGZyb20gJ3ZvcnRleC1hcGknO1xuXG5pbXBvcnQgeyBMT0NLRURfUFJFRklYLCBXM19URU1QX0RBVEFfRElSIH0gZnJvbSAnLi4vY29tbW9uJztcblxuZXhwb3J0IGNsYXNzIENvbGxlY3Rpb25HZW5lcmF0ZUVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3Rvcih3aHk6IHN0cmluZykge1xuICAgIHN1cGVyKGBGYWlsZWQgdG8gZ2VuZXJhdGUgZ2FtZSBzcGVjaWZpYyBkYXRhIGZvciBjb2xsZWN0aW9uOiAke3doeX1gKTtcbiAgICB0aGlzLm5hbWUgPSAnQ29sbGVjdGlvbkdlbmVyYXRlRXJyb3InO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDb2xsZWN0aW9uUGFyc2VFcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IoY29sbGVjdGlvbk5hbWU6IHN0cmluZywgd2h5OiBzdHJpbmcpIHtcbiAgICBzdXBlcihgRmFpbGVkIHRvIHBhcnNlIGdhbWUgc3BlY2lmaWMgZGF0YSBmb3IgY29sbGVjdGlvbiAke2NvbGxlY3Rpb25OYW1lfTogJHt3aHl9YCk7XG4gICAgdGhpcy5uYW1lID0gJ0NvbGxlY3Rpb25HZW5lcmF0ZUVycm9yJztcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNWYWxpZE1vZChtb2Q6IHR5cGVzLklNb2QpIHtcbiAgcmV0dXJuIChtb2QgIT09IHVuZGVmaW5lZCkgJiYgKG1vZC50eXBlICE9PSAnY29sbGVjdGlvbicpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNNb2RJbkNvbGxlY3Rpb24oY29sbGVjdGlvbk1vZDogdHlwZXMuSU1vZCwgbW9kOiB0eXBlcy5JTW9kKSB7XG4gIGlmIChjb2xsZWN0aW9uTW9kLnJ1bGVzID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICByZXR1cm4gY29sbGVjdGlvbk1vZC5ydWxlcy5maW5kKHJ1bGUgPT5cbiAgICB1dGlsLnRlc3RNb2RSZWZlcmVuY2UobW9kLCBydWxlLnJlZmVyZW5jZSkpICE9PSB1bmRlZmluZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZW5Db2xsZWN0aW9uTG9hZE9yZGVyKGxvYWRPcmRlcjogdHlwZXMuSUZCTE9Mb2FkT3JkZXJFbnRyeVtdLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kczogeyBbbW9kSWQ6IHN0cmluZ106IHR5cGVzLklNb2QgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxlY3Rpb24/OiB0eXBlcy5JTW9kKTogdHlwZXMuTG9hZE9yZGVyIHtcbiAgY29uc3Qgc29ydGVkTW9kcyA9IGxvYWRPcmRlci5maWx0ZXIoZW50cnkgPT4ge1xuICAgIGNvbnN0IGlzTG9ja2VkID0gZW50cnkubW9kSWQuaW5jbHVkZXMoTE9DS0VEX1BSRUZJWCk7XG4gICAgcmV0dXJuIGlzTG9ja2VkIHx8ICgoY29sbGVjdGlvbiAhPT0gdW5kZWZpbmVkKVxuICAgICAgPyBpc1ZhbGlkTW9kKG1vZHNbZW50cnkubW9kSWRdKSAmJiAoaXNNb2RJbkNvbGxlY3Rpb24oY29sbGVjdGlvbiwgbW9kc1tlbnRyeS5tb2RJZF0pKVxuICAgICAgOiBpc1ZhbGlkTW9kKG1vZHNbZW50cnkubW9kSWRdKSk7XG4gIH0pXG4gICAgLnNvcnQoKGxocywgcmhzKSA9PiBsaHMuZGF0YS5wcmVmaXggLSByaHMuZGF0YS5wcmVmaXgpXG4gICAgLnJlZHVjZSgoYWNjdW0sIGl0ZXIsIGlkeCkgPT4ge1xuICAgICAgYWNjdW0ucHVzaChpdGVyKTtcbiAgICAgIHJldHVybiBhY2N1bTtcbiAgICB9LCBbXSk7XG4gIHJldHVybiBzb3J0ZWRNb2RzO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2Fsa0RpclBhdGgoZGlyUGF0aDogc3RyaW5nKTogUHJvbWlzZTxJRW50cnlbXT4ge1xuICBsZXQgZmlsZUVudHJpZXM6IElFbnRyeVtdID0gW107XG4gIGF3YWl0IHR1cmJvd2FsayhkaXJQYXRoLCAoZW50cmllczogSUVudHJ5W10pID0+IHtcbiAgICBmaWxlRW50cmllcyA9IGZpbGVFbnRyaWVzLmNvbmNhdChlbnRyaWVzKTtcbiAgfSlcbiAgICAuY2F0Y2goeyBzeXN0ZW1Db2RlOiAzIH0sICgpID0+IFByb21pc2UucmVzb2x2ZSgpKVxuICAgIC5jYXRjaChlcnIgPT4gWydFTk9URk9VTkQnLCAnRU5PRU5UJ10uaW5jbHVkZXMoZXJyLmNvZGUpXG4gICAgICA/IFByb21pc2UucmVzb2x2ZSgpIDogUHJvbWlzZS5yZWplY3QoZXJyKSk7XG5cbiAgcmV0dXJuIGZpbGVFbnRyaWVzO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcHJlcGFyZUZpbGVEYXRhKGRpclBhdGg6IHN0cmluZyk6IFByb21pc2U8QnVmZmVyPiB7XG4gIGNvbnN0IHNldmVuWmlwID0gbmV3IHV0aWwuU2V2ZW5aaXAoKTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKFczX1RFTVBfREFUQV9ESVIpO1xuICAgIGNvbnN0IGFyY2hpdmVQYXRoID0gcGF0aC5qb2luKFczX1RFTVBfREFUQV9ESVIsIGdlbmVyYXRlKCkgKyAnLnppcCcpO1xuICAgIGNvbnN0IGVudHJpZXM6IHN0cmluZ1tdID0gYXdhaXQgZnMucmVhZGRpckFzeW5jKGRpclBhdGgpO1xuICAgIGF3YWl0IHNldmVuWmlwLmFkZChhcmNoaXZlUGF0aCwgZW50cmllcy5tYXAoZW50cnkgPT5cbiAgICAgIHBhdGguam9pbihkaXJQYXRoLCBlbnRyeSkpLCB7IHJhdzogWyctciddIH0pO1xuXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IGZzLnJlYWRGaWxlQXN5bmMoYXJjaGl2ZVBhdGgpO1xuICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKGFyY2hpdmVQYXRoKTtcbiAgICByZXR1cm4gZGF0YTtcbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gIH1cbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFuVXBFbnRyaWVzKGZpbGVFbnRyaWVzOiBJRW50cnlbXSkge1xuICB0cnkge1xuICAgIGZpbGVFbnRyaWVzLnNvcnQoKGxocywgcmhzKSA9PiByaHMuZmlsZVBhdGgubGVuZ3RoIC0gbGhzLmZpbGVQYXRoLmxlbmd0aCk7XG4gICAgZm9yIChjb25zdCBlbnRyeSBvZiBmaWxlRW50cmllcykge1xuICAgICAgYXdhaXQgZnMucmVtb3ZlQXN5bmMoZW50cnkuZmlsZVBhdGgpO1xuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgbG9nKCdlcnJvcicsICdmaWxlIGVudHJ5IGNsZWFudXAgZmFpbGVkJywgZXJyKTtcbiAgfVxufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVzdG9yZUZpbGVEYXRhKGZpbGVEYXRhOiBCdWZmZXIsIGRlc3RpbmF0aW9uOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3Qgc2V2ZW5aaXAgPSBuZXcgdXRpbC5TZXZlblppcCgpO1xuICBsZXQgYXJjaGl2ZVBhdGg7XG4gIGxldCBmaWxlRW50cmllczogSUVudHJ5W10gPSBbXTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBmcy5lbnN1cmVEaXJXcml0YWJsZUFzeW5jKFczX1RFTVBfREFUQV9ESVIpO1xuICAgIGFyY2hpdmVQYXRoID0gcGF0aC5qb2luKFczX1RFTVBfREFUQV9ESVIsIGdlbmVyYXRlKCkgKyAnLnppcCcpO1xuICAgIGF3YWl0IGZzLndyaXRlRmlsZUFzeW5jKGFyY2hpdmVQYXRoLCBmaWxlRGF0YSk7XG4gICAgY29uc3QgdGFyZ2V0RGlyUGF0aCA9IHBhdGguam9pbihXM19URU1QX0RBVEFfRElSLCBwYXRoLmJhc2VuYW1lKGFyY2hpdmVQYXRoLCAnLnppcCcpKTtcbiAgICBhd2FpdCBzZXZlblppcC5leHRyYWN0RnVsbChhcmNoaXZlUGF0aCwgdGFyZ2V0RGlyUGF0aCk7XG4gICAgZmlsZUVudHJpZXMgPSBhd2FpdCB3YWxrRGlyUGF0aCh0YXJnZXREaXJQYXRoKTtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGZpbGVFbnRyaWVzKSB7XG4gICAgICBjb25zdCByZWxQYXRoID0gcGF0aC5yZWxhdGl2ZSh0YXJnZXREaXJQYXRoLCBlbnRyeS5maWxlUGF0aCk7XG4gICAgICBjb25zdCBkZXN0ID0gcGF0aC5qb2luKGRlc3RpbmF0aW9uLCByZWxQYXRoKTtcbiAgICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMocGF0aC5kaXJuYW1lKGRlc3QpKTtcbiAgICAgIGF3YWl0IGZzLmNvcHlBc3luYyhlbnRyeS5maWxlUGF0aCwgZGVzdCk7XG4gICAgfVxuICAgIGNsZWFuVXBFbnRyaWVzKGZpbGVFbnRyaWVzKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNsZWFuVXBFbnRyaWVzKGZpbGVFbnRyaWVzKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaGV4MkJ1ZmZlcihoZXhEYXRhOiBzdHJpbmcpIHtcbiAgY29uc3QgYnl0ZUFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoaGV4RGF0YS5sZW5ndGggLyAyKTtcbiAgZm9yIChsZXQgeCA9IDA7IHggPCBieXRlQXJyYXkubGVuZ3RoOyB4KyspIHtcbiAgICBieXRlQXJyYXlbeF0gPSBwYXJzZUludChoZXhEYXRhLnN1YnN0cih4ICogMiwgMiksIDE2KTtcbiAgfVxuXG4gIGNvbnN0IGJ1ZmZlciA9IEJ1ZmZlci5mcm9tKGJ5dGVBcnJheSk7XG4gIHJldHVybiBidWZmZXI7XG59XG4iXX0=