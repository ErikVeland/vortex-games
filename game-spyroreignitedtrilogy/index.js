const { isWindows } = require('vortex-api');
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
const path_1 = __importDefault(require("path"));
const vortex_api_1 = require("vortex-api");
const common_1 = require("./common");
const loadOrder_1 = require("./loadOrder");
const migrations_1 = require("./migrations");
const util_1 = require("./util");
const STEAM_ID = '996580';
function findGame() {
    return __awaiter(this, void 0, void 0, function* () {
        return vortex_api_1.util.GameStoreHelper.findByAppId([STEAM_ID])
            .then(game => game.gamePath);
    });
}
function externalFilesWarning(api, externalMods) {
    return __awaiter(this, void 0, void 0, function* () {
        const t = api.translate;
        if (externalMods.length === 0) {
            return Promise.resolve(undefined);
        }
        return new Promise((resolve, reject) => {
            api.showDialog('info', 'External Mod Files Detected', {
                bbcode: t('Vortex has discovered the following unmanaged/external files in the '
                    + 'the game\'s mods directory:[br][/br][br][/br]{{files}}'
                    + '[br][/br]Please note that the existence of these mods interferes with Vortex\'s '
                    + 'load ordering functionality and as such, they should be removed using the same '
                    + 'medium through which they have been added.[br][/br][br][/br]'
                    + 'Alternatively, Vortex can try to import these files into its mods list which will '
                    + 'allow Vortex to take control over them and display them inside the load ordering page. '
                    + 'Vortex\'s load ordering functionality will not display external mod entries unless imported!', { replace: { files: externalMods.map(mod => `"${mod}"`).join('[br][/br]') } }),
            }, [
                { label: 'Close', action: () => reject(new vortex_api_1.util.UserCanceled()) },
                { label: 'Import External Mods', action: () => resolve(undefined) },
            ]);
        });
    });
}
function ImportExternalMods(api, external) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = api.getState();
        const downloadsPath = vortex_api_1.selectors.downloadPathForGame(state, common_1.GAME_ID);
        const szip = new vortex_api_1.util.SevenZip();
        for (const modFile of external) {
            const archivePath = path_1.default.join(downloadsPath, path_1.default.basename(modFile, common_1.MOD_FILE_EXT) + '.zip');
            try {
                yield szip.add(archivePath, [modFile], { raw: ['-r'] });
                yield vortex_api_1.fs.removeAsync(modFile);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }
    });
}
function prepareForModding(context, discovery) {
    return __awaiter(this, void 0, void 0, function* () {
        const state = context.api.getState();
        const modsPath = path_1.default.join(discovery.path, (0, common_1.modsRelPath)());
        try {
            yield vortex_api_1.fs.ensureDirWritableAsync(modsPath);
            const installPath = vortex_api_1.selectors.installPathForGame(state, common_1.GAME_ID);
            const managedFiles = yield (0, util_1.getPakFiles)(installPath);
            const deployedFiles = yield (0, util_1.getPakFiles)(modsPath);
            const modifier = (filePath) => path_1.default.basename(filePath).toLowerCase();
            const unManagedPredicate = (filePath) => managedFiles.find(managed => modifier(managed) === modifier(filePath)) === undefined;
            const externalMods = deployedFiles.filter(unManagedPredicate);
            try {
                yield externalFilesWarning(context.api, externalMods);
                yield ImportExternalMods(context.api, externalMods);
            }
            catch (err) {
                if (err instanceof vortex_api_1.util.UserCanceled) {
                }
                else {
                    return Promise.reject(err);
                }
            }
        }
        catch (err) {
            return Promise.reject(err);
        }
    });
}
function installContent(files) {
    const modFile = files.find(file => path_1.default.extname(file).toLowerCase() === common_1.MOD_FILE_EXT);
    const idx = modFile.indexOf(path_1.default.basename(modFile));
    const rootPath = path_1.default.dirname(modFile);
    const filtered = files.filter(file => ((file.indexOf(rootPath) !== -1)
        && (!file.endsWith(path_1.default.sep))));
    const instructions = filtered.map(file => {
        return {
            type: 'copy',
            source: file,
            destination: path_1.default.join(file.substr(idx)),
        };
    });
    return Promise.resolve({ instructions });
}
function testSupportedContent(files, gameId) {
    let supported = (gameId === common_1.GAME_ID) &&
        (files.find(file => path_1.default.extname(file).toLowerCase() === common_1.MOD_FILE_EXT) !== undefined);
    if (supported && files.find(file => (path_1.default.basename(file).toLowerCase() === 'moduleconfig.xml')
        && (path_1.default.basename(path_1.default.dirname(file)).toLowerCase() === 'fomod'))) {
        supported = false;
    }
    return Promise.resolve({
        supported,
        requiredFiles: [],
    });
}
function toLOPrefix(context, mod) {
    var _a;
    const props = (0, util_1.genProps)(context);
    if (props === undefined) {
        return 'ZZZZ-' + mod.id;
    }
    const loadOrder = vortex_api_1.util.getSafe(props.state, ['persistent', 'loadOrder', props.profile.id], []);
    const loEntry = loadOrder.find(loEntry => loEntry.id === mod.id);
    return (((_a = loEntry === null || loEntry === void 0 ? void 0 : loEntry.data) === null || _a === void 0 ? void 0 : _a.prefix) !== undefined)
        ? loEntry.data.prefix + '-' + mod.id
        : 'ZZZZ-' + mod.id;
}
function main(context) {
    context.registerGame({
        id: common_1.GAME_ID,
        name: 'Spyro Reignited Trilogy',
        mergeMods: (mod) => toLOPrefix(context, mod),
        queryPath: (0, util_1.toBlue)(findGame),
        requiresCleanup: true,
        supportedTools: [],
        queryModPath: () => (0, common_1.modsRelPath)(),
        logo: 'gameart.jpg',
        executable: () => 'Spyro.exe',
        requiredFiles: [
            'Spyro.exe',
        ],
        setup: (0, util_1.toBlue)((discovery) => prepareForModding(context, discovery)),
        environment: {
            SteamAPPId: STEAM_ID,
        },
        details: {
            steamAppId: +STEAM_ID,
        },
    });
    context.registerLoadOrder({
        deserializeLoadOrder: () => (0, loadOrder_1.deserialize)(context),
        serializeLoadOrder: (loadOrder) => (0, loadOrder_1.serialize)(context, loadOrder),
        validate: loadOrder_1.validate,
        gameId: common_1.GAME_ID,
        toggleableEntries: false,
        usageInstructions: 'Re-position entries by drag and dropping them - note that '
            + 'the mod with the higher index value will win any conflicts.',
    });
    context.registerInstaller('spyroreignitedtrilogy-mod', 25, (0, util_1.toBlue)(testSupportedContent), (0, util_1.toBlue)(installContent));
    context.registerMigration((0, util_1.toBlue)(oldVer => (0, migrations_1.migrate100)(context, oldVer)));
    return true;
}
module.exports = {
    default: main,
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUFBLGdEQUF3QjtBQUN4QiwyQ0FBNkQ7QUFFN0QscUNBQThEO0FBQzlELDJDQUErRDtBQUMvRCw2Q0FBMEM7QUFFMUMsaUNBQXVEO0FBRXZELE1BQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQztBQUUxQixTQUFlLFFBQVE7O1FBQ3JCLE9BQU8saUJBQUksQ0FBQyxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pDLENBQUM7Q0FBQTtBQUVELFNBQWUsb0JBQW9CLENBQUMsR0FBd0IsRUFBRSxZQUFzQjs7UUFDbEYsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLFNBQVMsQ0FBQztRQUN4QixJQUFJLFlBQVksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFO1lBQzdCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUNuQztRQUNELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLEVBQUU7WUFDckMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsNkJBQTZCLEVBQUU7Z0JBQ3BELE1BQU0sRUFBRSxDQUFDLENBQUMsc0VBQXNFO3NCQUM1RSx3REFBd0Q7c0JBQ3hELGtGQUFrRjtzQkFDbEYsaUZBQWlGO3NCQUNqRiw4REFBOEQ7c0JBQzlELG9GQUFvRjtzQkFDcEYseUZBQXlGO3NCQUN6Riw4RkFBOEYsRUFDeEYsRUFBRSxPQUFPLEVBQUUsRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFD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LENBQUMsQ0FBQztJQUVILE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQztRQUN4QixvQkFBb0IsRUFBRSxHQUFHLEVBQUUsQ0FBQyxJQUFBLHVCQUFXLEVBQUMsT0FBTyxDQUFDO1FBQ2hELGtCQUFrQixFQUFFLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxJQUFBLHFCQUFTLEVBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBQztRQUNoRSxRQUFRLEVBQVIsb0JBQVE7UUFDUixNQUFNLEVBQUUsZ0JBQU87UUFDZixpQkFBaUIsRUFBRSxLQUFLO1FBQ3hCLGlCQUFpQixFQUFFLDREQUE0RDtjQUMzRSw2REFBNkQ7S0FDbEUsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLGlCQUFpQixDQUFDLDJCQUEyQixFQUFFLEVBQUUsRUFDL0IsSUFBQSxhQUFNLEVBQUMsb0JBQW9CLENBQUMsRUFBRSxJQUFBLGFBQU0sRUFBQyxjQUFjLENBQUMsQ0FBQyxDQUFDO0lBRWhGLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFBLGFBQU0sRUFBQyxNQUFNLENBQUMsRUFBRSxDQUFDLElBQUEsdUJBQVUsRUFBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBRXpFLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sQ0FBQyxPQUFPLEdBQUc7SUFDZixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcbmltcG9ydCB7IGZzLCBsb2csIHNlbGVjdG9ycywgdHlwZXMsIHV0aWwgfSBmcm9tICd2b3J0ZXgtYXBpJztcblxuaW1wb3J0IHsgR0FNRV9JRCwgTU9EX0ZJTEVfRVhULCBtb2RzUmVsUGF0aCB9IGZyb20gJy4vY29tbW9uJztcbmltcG9ydCB7IGRlc2VyaWFsaXplLCBzZXJpYWxpemUsIHZhbGlkYXRlIH0gZnJvbSAnLi9sb2FkT3JkZXInO1xuaW1wb3J0IHsgbWlncmF0ZTEwMCB9IGZyb20gJy4vbWlncmF0aW9ucyc7XG5pbXBvcnQgeyBJTG9hZE9yZGVyRW50cnksIElQcm9wcywgTG9hZE9yZGVyIH0gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQgeyBnZW5Qcm9wcywgZ2V0UGFrRmlsZXMsIHRvQmx1ZSB9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IFNURUFNX0lEID0gJzk5NjU4MCc7XG5cbmFzeW5jIGZ1bmN0aW9uIGZpbmRHYW1lKCkge1xuICByZXR1cm4gdXRpbC5HYW1lU3RvcmVIZWxwZXIuZmluZEJ5QXBwSWQoW1NURUFNX0lEXSlcbiAgICAudGhlbihnYW1lID0+IGdhbWUuZ2FtZVBhdGgpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBleHRlcm5hbEZpbGVzV2FybmluZyhhcGk6IHR5cGVzLklFeHRlbnNpb25BcGksIGV4dGVybmFsTW9kczogc3RyaW5nW10pIHtcbiAgY29uc3QgdCA9IGFwaS50cmFuc2xhdGU7XG4gIGlmIChleHRlcm5hbE1vZHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh1bmRlZmluZWQpO1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgYXBpLnNob3dEaWFsb2coJ2luZm8nLCAnRXh0ZXJuYWwgTW9kIEZpbGVzIERldGVjdGVkJywge1xuICAgICAgYmJjb2RlOiB0KCdWb3J0ZXggaGFzIGRpc2NvdmVyZWQgdGhlIGZvbGxvd2luZyB1bm1hbmFnZWQvZXh0ZXJuYWwgZmlsZXMgaW4gdGhlICdcbiAgICAgICAgKyAndGhlIGdhbWVcXCdzIG1vZHMgZGlyZWN0b3J5Olticl1bL2JyXVticl1bL2JyXXt7ZmlsZXN9fSdcbiAgICAgICAgKyAnW2JyXVsvYnJdUGxlYXNlIG5vdGUgdGhhdCB0aGUgZXhpc3RlbmNlIG9mIHRoZXNlIG1vZHMgaW50ZXJmZXJlcyB3aXRoIFZvcnRleFxcJ3MgJ1xuICAgICAgICArICdsb2FkIG9yZGVyaW5nIGZ1bmN0aW9uYWxpdHkgYW5kIGFzIHN1Y2gsIHRoZXkgc2hvdWxkIGJlIHJlbW92ZWQgdXNpbmcgdGhlIHNhbWUgJ1xuICAgICAgICArICdtZWRpdW0gdGhyb3VnaCB3aGljaCB0aGV5IGhhdmUgYmVlbiBhZGRlZC5bYnJdWy9icl1bYnJdWy9icl0nXG4gICAgICAgICsgJ0FsdGVybmF0aXZlbHksIFZvcnRleCBjYW4gdHJ5IHRvIGltcG9ydCB0aGVzZSBmaWxlcyBpbnRvIGl0cyBtb2RzIGxpc3Qgd2hpY2ggd2lsbCAnXG4gICAgICAgICsgJ2FsbG93IFZvcnRleCB0byB0YWtlIGNvbnRyb2wgb3ZlciB0aGVtIGFuZCBkaXNwbGF5IHRoZW0gaW5zaWRlIHRoZSBsb2FkIG9yZGVyaW5nIHBhZ2UuICdcbiAgICAgICAgKyAnVm9ydGV4XFwncyBsb2FkIG9yZGVyaW5nIGZ1bmN0aW9uYWxpdHkgd2lsbCBub3QgZGlzcGxheSBleHRlcm5hbCBtb2QgZW50cmllcyB1bmxlc3MgaW1wb3J0ZWQhJyxcbiAgICAgICAgICAgICAgICB7IHJlcGxhY2U6IHsgZmlsZXM6IGV4dGVybmFsTW9kcy5tYXAobW9kID0+IGBcIiR7bW9kfVwiYCkuam9pbignW2JyXVsvYnJdJykgfSB9KSxcbiAgICB9LCBbXG4gICAgICB7IGxhYmVsOiAnQ2xvc2UnLCBhY3Rpb246ICgpID0+IHJlamVjdChuZXcgdXRpbC5Vc2VyQ2FuY2VsZWQoKSkgfSxcbiAgICAgIHsgbGFiZWw6ICdJbXBvcnQgRXh0ZXJuYWwgTW9kcycsIGFjdGlvbjogKCkgPT4gcmVzb2x2ZSh1bmRlZmluZWQpIH0sXG4gICAgXSk7XG4gIH0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBJbXBvcnRFeHRlcm5hbE1vZHMoYXBpOiB0eXBlcy5JRXh0ZW5zaW9uQXBpLCBleHRlcm5hbDogc3RyaW5nW10pIHtcbiAgY29uc3Qgc3RhdGUgPSBhcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgZG93bmxvYWRzUGF0aCA9IHNlbGVjdG9ycy5kb3dubG9hZFBhdGhGb3JHYW1lKHN0YXRlLCBHQU1FX0lEKTtcbiAgY29uc3Qgc3ppcCA9IG5ldyB1dGlsLlNldmVuWmlwKCk7XG4gIGZvciAoY29uc3QgbW9kRmlsZSBvZiBleHRlcm5hbCkge1xuICAgIGNvbnN0IGFyY2hpdmVQYXRoID0gcGF0aC5qb2luKGRvd25sb2Fkc1BhdGgsIHBhdGguYmFzZW5hbWUobW9kRmlsZSwgTU9EX0ZJTEVfRVhUKSArICcuemlwJyk7XG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IHN6aXAuYWRkKGFyY2hpdmVQYXRoLCBbIG1vZEZpbGUgXSwgeyByYXc6IFsnLXInXSB9KTtcbiAgICAgIGF3YWl0IGZzLnJlbW92ZUFzeW5jKG1vZEZpbGUpO1xuICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgfVxuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHByZXBhcmVGb3JNb2RkaW5nKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGlzY292ZXJ5OiB0eXBlcy5JRGlzY292ZXJ5UmVzdWx0KSB7XG4gIGNvbnN0IHN0YXRlID0gY29udGV4dC5hcGkuZ2V0U3RhdGUoKTtcbiAgY29uc3QgbW9kc1BhdGggPSBwYXRoLmpvaW4oZGlzY292ZXJ5LnBhdGgsIG1vZHNSZWxQYXRoKCkpO1xuICB0cnkge1xuICAgIGF3YWl0IGZzLmVuc3VyZURpcldyaXRhYmxlQXN5bmMobW9kc1BhdGgpO1xuICAgIGNvbnN0IGluc3RhbGxQYXRoID0gc2VsZWN0b3JzLmluc3RhbGxQYXRoRm9yR2FtZShzdGF0ZSwgR0FNRV9JRCk7XG4gICAgY29uc3QgbWFuYWdlZEZpbGVzID0gYXdhaXQgZ2V0UGFrRmlsZXMoaW5zdGFsbFBhdGgpO1xuICAgIGNvbnN0IGRlcGxveWVkRmlsZXMgPSBhd2FpdCBnZXRQYWtGaWxlcyhtb2RzUGF0aCk7XG4gICAgY29uc3QgbW9kaWZpZXIgPSAoZmlsZVBhdGgpID0+IHBhdGguYmFzZW5hbWUoZmlsZVBhdGgpLnRvTG93ZXJDYXNlKCk7XG4gICAgY29uc3QgdW5NYW5hZ2VkUHJlZGljYXRlID0gKGZpbGVQYXRoOiBzdHJpbmcpID0+XG4gICAgICBtYW5hZ2VkRmlsZXMuZmluZChtYW5hZ2VkID0+IG1vZGlmaWVyKG1hbmFnZWQpID09PSBtb2RpZmllcihmaWxlUGF0aCkpID09PSB1bmRlZmluZWQ7XG4gICAgY29uc3QgZXh0ZXJuYWxNb2RzID0gZGVwbG95ZWRGaWxlcy5maWx0ZXIodW5NYW5hZ2VkUHJlZGljYXRlKTtcbiAgICB0cnkge1xuICAgICAgYXdhaXQgZXh0ZXJuYWxGaWxlc1dhcm5pbmcoY29udGV4dC5hcGksIGV4dGVybmFsTW9kcyk7XG4gICAgICBhd2FpdCBJbXBvcnRFeHRlcm5hbE1vZHMoY29udGV4dC5hcGksIGV4dGVybmFsTW9kcyk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBpZiAoZXJyIGluc3RhbmNlb2YgdXRpbC5Vc2VyQ2FuY2VsZWQpIHtcbiAgICAgICAgLy8gbm9wXG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIHJldHVybiBQcm9taXNlLnJlamVjdChlcnIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluc3RhbGxDb250ZW50KGZpbGVzKSB7XG4gIGNvbnN0IG1vZEZpbGUgPSBmaWxlcy5maW5kKGZpbGUgPT4gcGF0aC5leHRuYW1lKGZpbGUpLnRvTG93ZXJDYXNlKCkgPT09IE1PRF9GSUxFX0VYVCk7XG4gIGNvbnN0IGlkeCA9IG1vZEZpbGUuaW5kZXhPZihwYXRoLmJhc2VuYW1lKG1vZEZpbGUpKTtcbiAgY29uc3Qgcm9vdFBhdGggPSBwYXRoLmRpcm5hbWUobW9kRmlsZSk7XG5cbiAgLy8gUmVtb3ZlIGRpcmVjdG9yaWVzIGFuZCBhbnl0aGluZyB0aGF0IGlzbid0IGluIHRoZSByb290UGF0aC5cbiAgY29uc3QgZmlsdGVyZWQgPSBmaWxlcy5maWx0ZXIoZmlsZSA9PlxuICAgICgoZmlsZS5pbmRleE9mKHJvb3RQYXRoKSAhPT0gLTEpXG4gICAgJiYgKCFmaWxlLmVuZHNXaXRoKHBhdGguc2VwKSkpKTtcblxuICBjb25zdCBpbnN0cnVjdGlvbnMgPSBmaWx0ZXJlZC5tYXAoZmlsZSA9PiB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6ICdjb3B5JyxcbiAgICAgIHNvdXJjZTogZmlsZSxcbiAgICAgIGRlc3RpbmF0aW9uOiBwYXRoLmpvaW4oZmlsZS5zdWJzdHIoaWR4KSksXG4gICAgfTtcbiAgfSk7XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IGluc3RydWN0aW9ucyB9KTtcbn1cblxuZnVuY3Rpb24gdGVzdFN1cHBvcnRlZENvbnRlbnQoZmlsZXMsIGdhbWVJZCkge1xuICAvLyBNYWtlIHN1cmUgd2UncmUgYWJsZSB0byBzdXBwb3J0IHRoaXMgbW9kLlxuICBsZXQgc3VwcG9ydGVkID0gKGdhbWVJZCA9PT0gR0FNRV9JRCkgJiZcbiAgICAoZmlsZXMuZmluZChmaWxlID0+IHBhdGguZXh0bmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpID09PSBNT0RfRklMRV9FWFQpICE9PSB1bmRlZmluZWQpO1xuXG4gIGlmIChzdXBwb3J0ZWQgJiYgZmlsZXMuZmluZChmaWxlID0+XG4gICAgKHBhdGguYmFzZW5hbWUoZmlsZSkudG9Mb3dlckNhc2UoKSA9PT0gJ21vZHVsZWNvbmZpZy54bWwnKVxuICAgICAgJiYgKHBhdGguYmFzZW5hbWUocGF0aC5kaXJuYW1lKGZpbGUpKS50b0xvd2VyQ2FzZSgpID09PSAnZm9tb2QnKSkpIHtcbiAgICBzdXBwb3J0ZWQgPSBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoe1xuICAgIHN1cHBvcnRlZCxcbiAgICByZXF1aXJlZEZpbGVzOiBbXSxcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHRvTE9QcmVmaXgoY29udGV4dDogdHlwZXMuSUV4dGVuc2lvbkNvbnRleHQsIG1vZDogdHlwZXMuSU1vZCk6IHN0cmluZyB7XG4gIGNvbnN0IHByb3BzOiBJUHJvcHMgPSBnZW5Qcm9wcyhjb250ZXh0KTtcbiAgaWYgKHByb3BzID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gJ1paWlotJyArIG1vZC5pZDtcbiAgfVxuXG4gIC8vIFJldHJpZXZlIHRoZSBsb2FkIG9yZGVyIGFzIHN0b3JlZCBpbiBWb3J0ZXgncyBhcHBsaWNhdGlvbiBzdGF0ZS5cbiAgY29uc3QgbG9hZE9yZGVyID0gdXRpbC5nZXRTYWZlKHByb3BzLnN0YXRlLCBbJ3BlcnNpc3RlbnQnLCAnbG9hZE9yZGVyJywgcHJvcHMucHJvZmlsZS5pZF0sIFtdKTtcblxuICAvLyBGaW5kIHRoZSBtb2QgZW50cnkgaW4gdGhlIGxvYWQgb3JkZXIgc3RhdGUgYW5kIGluc2VydCB0aGUgcHJlZml4IGluIGZyb250XG4gIC8vICBvZiB0aGUgbW9kJ3MgbmFtZS9pZC93aGF0ZXZlclxuICBjb25zdCBsb0VudHJ5OiBJTG9hZE9yZGVyRW50cnkgPSBsb2FkT3JkZXIuZmluZChsb0VudHJ5ID0+IGxvRW50cnkuaWQgPT09IG1vZC5pZCk7XG4gIHJldHVybiAobG9FbnRyeT8uZGF0YT8ucHJlZml4ICE9PSB1bmRlZmluZWQpXG4gICAgPyBsb0VudHJ5LmRhdGEucHJlZml4ICsgJy0nICsgbW9kLmlkXG4gICAgOiAnWlpaWi0nICsgbW9kLmlkO1xufVxuXG5mdW5jdGlvbiBtYWluKGNvbnRleHQ6IHR5cGVzLklFeHRlbnNpb25Db250ZXh0KSB7XG4gIGNvbnRleHQucmVnaXN0ZXJHYW1lKHtcbiAgICBpZDogR0FNRV9JRCxcbiAgICBuYW1lOiAnU3B5cm8gUmVpZ25pdGVkIFRyaWxvZ3knLFxuICAgIG1lcmdlTW9kczogKG1vZCkgPT4gdG9MT1ByZWZpeChjb250ZXh0LCBtb2QpLFxuICAgIHF1ZXJ5UGF0aDogdG9CbHVlKGZpbmRHYW1lKSxcbiAgICByZXF1aXJlc0NsZWFudXA6IHRydWUsXG4gICAgc3VwcG9ydGVkVG9vbHM6IFtdLFxuICAgIHF1ZXJ5TW9kUGF0aDogKCkgPT4gbW9kc1JlbFBhdGgoKSxcbiAgICBsb2dvOiAnZ2FtZWFydC5qcGcnLFxuICAgIGV4ZWN1dGFibGU6ICgpID0+ICdTcHlyby5leGUnLFxuICAgIHJlcXVpcmVkRmlsZXM6IFtcbiAgICAgICdTcHlyby5leGUnLFxuICAgIF0sXG4gICAgc2V0dXA6IHRvQmx1ZSgoZGlzY292ZXJ5KSA9PiBwcmVwYXJlRm9yTW9kZGluZyhjb250ZXh0LCBkaXNjb3ZlcnkpKSxcbiAgICBlbnZpcm9ubWVudDoge1xuICAgICAgU3RlYW1BUFBJZDogU1RFQU1fSUQsXG4gICAgfSxcbiAgICBkZXRhaWxzOiB7XG4gICAgICBzdGVhbUFwcElkOiArU1RFQU1fSUQsXG4gICAgfSxcbiAgfSk7XG5cbiAgY29udGV4dC5yZWdpc3RlckxvYWRPcmRlcih7XG4gICAgZGVzZXJpYWxpemVMb2FkT3JkZXI6ICgpID0+IGRlc2VyaWFsaXplKGNvbnRleHQpLFxuICAgIHNlcmlhbGl6ZUxvYWRPcmRlcjogKGxvYWRPcmRlcikgPT4gc2VyaWFsaXplKGNvbnRleHQsIGxvYWRPcmRlciksXG4gICAgdmFsaWRhdGUsXG4gICAgZ2FtZUlkOiBHQU1FX0lELFxuICAgIHRvZ2dsZWFibGVFbnRyaWVzOiBmYWxzZSxcbiAgICB1c2FnZUluc3RydWN0aW9uczogJ1JlLXBvc2l0aW9uIGVudHJpZXMgYnkgZHJhZyBhbmQgZHJvcHBpbmcgdGhlbSAtIG5vdGUgdGhhdCAnXG4gICAgICArICd0aGUgbW9kIHdpdGggdGhlIGhpZ2hlciBpbmRleCB2YWx1ZSB3aWxsIHdpbiBhbnkgY29uZmxpY3RzLicsXG4gIH0pO1xuXG4gIGNvbnRleHQucmVnaXN0ZXJJbnN0YWxsZXIoJ3NweXJvcmVpZ25pdGVkdHJpbG9neS1tb2QnLCAyNSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0b0JsdWUodGVzdFN1cHBvcnRlZENvbnRlbnQpLCB0b0JsdWUoaW5zdGFsbENvbnRlbnQpKTtcblxuICBjb250ZXh0LnJlZ2lzdGVyTWlncmF0aW9uKHRvQmx1ZShvbGRWZXIgPT4gbWlncmF0ZTEwMChjb250ZXh0LCBvbGRWZXIpKSk7XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBkZWZhdWx0OiBtYWluLFxufTtcbiJdfQ==