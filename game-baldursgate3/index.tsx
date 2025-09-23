import { isWindows } from '../../../../src/util/platform';
/* eslint-disable */
/**
 * Important - although we no longer define the info panel here,
 *  we still need to keep the index file's '.tsx' extension.
 *  At least while our update process for bundled plugins remains
 *  through the 'release' branch.
 * 
 * Removing files from bundled plugins without stubbing the extension
 *  can potentially break the extension on the user's end.
 */
import Bluebird from 'bluebird';
import * as _ from 'lodash';
import * as path from 'path';
import * as React from 'react';
import { fs, selectors, types, util } from 'vortex-api';

import { GAME_ID, IGNORE_PATTERNS,
  MOD_TYPE_BG3SE, MOD_TYPE_LOOSE, MOD_TYPE_LSLIB, MOD_TYPE_REPLACER,
} from './common';
import * as gitHubDownloader from './githubDownloader';
import Settings from './Settings';
import reducer from './reducers';
import { migrate } from './migrations';

import {
  logDebug, forceRefresh, getLatestInstalledLSLibVer,
  getGameDataPath, getGamePath, globalProfilePath, modsPath,
  getLatestLSLibMod, getOwnGameVersion, readStoredLO,
  getDefaultModSettings,
  getDefaultModSettingsFormat,
  getActivePlayerProfile,
  profilesPath,
  convertV6toV7,
  convertToV8,
} from './util';

// Removed incorrect installers import
// import {
//   testLSLib, testBG3SE, testEngineInjector, testModFixer, testReplacer,
//   installLSLib, installBG3SE, installEngineInjector, installModFixer, installReplacer,
// } from './installers';

import {
  isBG3SE, isLSLib, isLoose, isReplacer,
} from './modTypes';

import {
  deserialize, importModSettingsFile, importModSettingsGame,
  importFromBG3MM, serialize, exportToGame, exportToFile, validate,
  getNodes,
} from './loadOrder';

import { InfoPanelWrap } from './InfoPanel'
import PakInfoCache from './cache';

const STOP_PATTERNS = ['[^/]*\\.pak$'];

const GOG_ID = '1456460669';
const STEAM_ID = '1086940';

function toWordExp(input) {
  return '(^|/)' + input + '(/|$)';
}

function findGame(): any {
  return util.GameStoreHelper.findByAppId([GOG_ID, STEAM_ID])
    .then(async game => {
      const basePath = game.gamePath;
      if (process.platform === 'darwin') {
        const macOSDir = path.join(basePath, "Baldur's Gate 3.app", 'Contents', 'MacOS');
        try {
          await fs.statAsync(macOSDir);
          return macOSDir;
        } catch (err) {
          // fall back to the store-provided path
        }
      }
      return basePath;
    });
}

async function ensureGlobalProfile(api: types.IExtensionApi, discovery: types.IDiscoveryResult) {
  if (discovery?.path) {
    const profilePath = await globalProfilePath(api);
    try {
      await fs.ensureDirWritableAsync(profilePath);
      const modSettingsFilePath = path.join(profilePath, 'modsettings.lsx');
      try {
        await fs.statAsync(modSettingsFilePath);
      } catch (err) {
        const defaultModSettings = await getDefaultModSettings(api);
        await fs.writeFileAsync(modSettingsFilePath, defaultModSettings, { encoding: 'utf8' });
      }
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

async function prepareForModding(api: types.IExtensionApi, discovery) {
  const mp = modsPath();  

  const format = await getDefaultModSettingsFormat(api);
  if (!['v7', 'v8'].includes(format)) {
    showFullReleaseModFixerRecommendation(api);
  }
  
  return fs.statAsync(mp)
    .catch(() => fs.ensureDirWritableAsync(mp, () => Bluebird.resolve() as any))
    .finally(() => ensureGlobalProfile(api, discovery));
}

function showFullReleaseModFixerRecommendation(api: types.IExtensionApi) {
  // check to see if mod is installed first?
  const mods = api.store.getState().persistent?.mods?.baldursgate3;
  if(mods !== undefined) {
    const modArray: types.IMod[] = mods ? Object.values(mods) : [];
    logDebug('modArray', modArray);
  
    const modFixerInstalled:boolean =  modArray.filter(mod => !!mod?.attributes?.modFixer).length != 0;  
    logDebug('modFixerInstalled', modFixerInstalled);

    // if we've found an installed modfixer, then don't bother showing notification 
    if(modFixerInstalled) {
      return;
    }
  }

  // no mods found
  api.sendNotification({
    type: 'warning',
    title: 'Recommended Mod',
    message: 'Most mods require this mod.',
    id: 'bg3-recommended-mod',
    allowSuppress: true,
    actions: [
      {
        title: 'More', action: dismiss => {
          api.showDialog('question', 'Recommended Mods', {
            text:
              'We recommend installing "Baldur\'s Gate 3 Mod Fixer" to be able to mod Baldur\'s Gate 3.\n\n' + 
              'This can be downloaded from Nexus Mods and installed using Vortex by pressing "Open Nexus Mods'
          }, [
            { label: 'Dismiss' },
            { label: 'Open Nexus Mods', default: true },
          ])
            .then(result => {
              dismiss();
              if (result.action === 'Open Nexus Mods') {
                util.opn('https://www.nexusmods.com/baldursgate3/mods/141?tab=description').catch(() => null)
              } else if (result.action === 'Cancel') {
                // dismiss anyway
              }
              return Promise.resolve();
            });
        }
      }
    ],
  });
}

async function onCheckModVersion(api: types.IExtensionApi, gameId: string, mods: types.IMod[]) {
  const profile = selectors.activeProfile(api.getState());
  if (profile.gameId !== GAME_ID || gameId !== GAME_ID) {
    return;
  }

  const latestVer: string = getLatestInstalledLSLibVer(api);

  if (latestVer === '0.0.0') {
    // Nothing to update.
    return;
  }

  const newestVer: string = await gitHubDownloader.checkForUpdates(api, latestVer);
  if (!newestVer || newestVer === latestVer) {
    return;
  }
}

async function onGameModeActivated(api: types.IExtensionApi, gameId: string) {
  if (gameId !== GAME_ID) {
    PakInfoCache.getInstance(api).save();
    return;
  }
  try {
    await migrate(api);
    const bg3ProfileId = await getActivePlayerProfile(api);
    const gameSettingsPath: string = path.join(profilesPath(), bg3ProfileId, 'modsettings.lsx');
    let nodes = await getNodes(gameSettingsPath);
    const { modsNode, modsOrderNode } = nodes;
    if ((modsNode.children === undefined) || ((modsNode.children[0] as any) === '')) {
      modsNode.children = [{ node: [] }];
    }


    const format = await getDefaultModSettingsFormat(api);
    if (modsOrderNode === undefined && ['v7', 'v8'].includes(format)) {
      const convFunc = format === 'v7' ? convertV6toV7 : convertToV8;
      const data = await fs.readFileAsync(gameSettingsPath, { encoding: 'utf8' });
      const newData = await convFunc(data);
      await fs.removeAsync(gameSettingsPath).catch(err => Promise.resolve());
      await fs.writeFileAsync(gameSettingsPath, newData, { encoding: 'utf8' });
    }
  } catch (err) {
    api.showErrorNotification(
      'Failed to migrate', err, {
        //message: 'Please run the game before you start modding',
        allowReport: false,
    });
  }

  try {
    await readStoredLO(api);
    PakInfoCache.getInstance(api);
  } catch (err) {
    api.showErrorNotification(
      'Failed to read load order', err, {
        message: 'Please run the game before you start modding',
        allowReport: false,
    });
  }

  const latestVer: string = getLatestInstalledLSLibVer(api);
  if (latestVer === '0.0.0') {
    await gitHubDownloader.downloadDivine(api);
  }
}

function main(context: types.IExtensionContext) {
  context.registerReducer(['settings', 'baldursgate3'], reducer);

  context.registerGame({
    id: GAME_ID,
    name: 'Baldur\'s Gate 3',
    mergeMods: true,
    queryPath: findGame,
    supportedTools: process.platform === 'darwin' ? [] : [
      {
        id: 'exevulkan',
        name: 'Baldur\'s Gate 3 (Vulkan)',
        executable: () => 'bin/bg3.exe',
        requiredFiles: [
          'bin/bg3.exe',
        ],
        relative: true,
      },
    ],
    queryModPath: modsPath,
    logo: 'gameart.jpg',
    executable: () => (process.platform === 'darwin' ? 'Baldurs Gate 3' : 'bin/bg3_dx11.exe'),
    setup: discovery => prepareForModding(context.api, discovery) as any,
    requiredFiles: process.platform === 'darwin'
      ? [
        'Baldurs Gate 3',
      ]
      : [
        'bin/bg3_dx11.exe',
      ],
    environment: {
      SteamAPPId: STEAM_ID,
    },
    details: {
      // ignored files to be left in staging (plugins.txt, skyrim.ini, etc.)
      stopPatterns: STOP_PATTERNS.map(toWordExp),
      // accepted mod extensions for this game (what will be claimed in mod page)
      supportedTools: [
        {
          id: 'exe',
          name: 'Baldur\'s Gate 3 (DX11)',
          executable: 'bin/bg3_dx11.exe',
        },
        {
          id: 'exevulkan',
          name: 'Baldur\'s Gate 3 (Vulkan)',
          executable: 'bin/bg3.exe',
        },
      ],
      gameDataPath: getGameDataPath(context.api),
      supportedModTypes: [MOD_TYPE_LSLIB, MOD_TYPE_LOOSE, MOD_TYPE_BG3SE, MOD_TYPE_REPLACER],
      autoDeploy: true,
      ignoreConflicts: IGNORE_PATTERNS,
      showWrongGameWarning: true,
      shell: false,
    },
  });

  context.registerSettings('Mods', Settings);

  // context.registerModType(MOD_TYPE_REPLACER, 98)
  // context.registerModType(MOD_TYPE_LSLIB, 99)
  // context.registerModType(MOD_TYPE_BG3SE, 100)
  // context.registerModType(MOD_TYPE_LOOSE, 200)

  // Loose mods must be rerouted to the user mods folder. BG3 can throw exceptions
  // when mods are moved, so we must move the mods ourselves and the dispatch the change.
  context.registerModType(
    MOD_TYPE_LOOSE,
    200,
    (gameId) => gameId === GAME_ID,
    (_game) => modsPath(),
    (instructions) => Bluebird.resolve(isLoose(instructions)),
  );
  context.registerModType(
    MOD_TYPE_REPLACER,
    100,
    (gameId) => gameId === GAME_ID,
    (_game) => getGamePath(context.api),
    (instructions) => Bluebird.resolve(isReplacer(context.api, instructions)),
  );
  context.registerModType(
    MOD_TYPE_LSLIB,
    99,
    (gameId) => gameId === GAME_ID,
    (_game) => getGamePath(context.api),
    (instructions) => Bluebird.resolve(isLSLib(instructions)),
  );
  context.registerModType(
    MOD_TYPE_BG3SE,
    100,
    (gameId) => gameId === GAME_ID,
    (_game) => path.join(getGamePath(context.api), 'bin'),
    (instructions) => Bluebird.resolve(isBG3SE(instructions)),
  );

  context.registerAction('mods-action-icons', 999, 'update', {}, 'Check Mod Versions', (instanceIds) => {
      void onCheckModVersion(context.api, selectors.activeGameId(context.api.getState()), []);
  });

  context.once(() => {
    context.api.onAsync('did-deploy', (profileId, profileType, deployment) => {
      forceRefresh(context.api);
      return Bluebird.resolve();
    });
  });

}

export default main;
