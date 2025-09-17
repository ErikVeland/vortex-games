import Bluebird from 'bluebird';
import path from 'path';
import { actions, fs, log, selectors, types, util } from 'vortex-api';

const GAME_ID = 'cyberpunk2077';
const STEAM_ID = '1091500';
const GOG_ID = '1423049311';
const EPIC_ID = '77f2b98e2cfd40c8a7e58ab7b1b8a6b2';

// Use empty required files to avoid validation issues with CrossOver/Wine installations
// The game detection will be handled by the queryPath function instead
const REQUIRED_FILES: string[] = [];

// Alternative files for different installation types
const ALTERNATIVE_FILES = [
  'Cyberpunk2077.exe', // Sometimes in root
  'bin/Cyberpunk2077.exe', // Alternative location
  'engine/config/platform/pc/engine.ini', // Alternative config location
];

function findGame(): Bluebird<string> {
  // Try to find via game stores first
  return util.GameStoreHelper.findByAppId([STEAM_ID, GOG_ID, EPIC_ID])
    .then(game => {
      log('debug', 'Found Cyberpunk 2077 via game store', { path: game.gamePath });
      return game.gamePath;
    })
    .catch(() => {
      log('debug', 'Game store detection failed, trying manual paths');
      
      // If not found via stores, try common macOS locations
      const commonPaths = [
        // Native macOS locations
        '/Applications/Cyberpunk 2077.app/Contents/Resources',
        '/Applications/Games/Cyberpunk 2077.app/Contents/Resources',
        // CrossOver/Wine locations - use the actual path we found
        path.join(process.env.HOME || '', 'Library/Application Support/CrossOver/Bottles/Steam/drive_c/Program Files (x86)/Steam/steamapps/common/Cyberpunk 2077'),
        // Other potential locations
        path.join(process.env.HOME || '', 'Games/Cyberpunk 2077'),
        path.join(process.env.HOME || '', 'Library/Application Support/Steam/steamapps/common/Cyberpunk 2077'),
      ];

      return Bluebird.mapSeries(commonPaths, (gamePath) => {
        return fs.statAsync(gamePath)
          .then(() => {
            log('debug', 'Found potential Cyberpunk 2077 path', { path: gamePath });
            return gamePath;
          })
          .catch(() => {
            log('debug', 'Path not found', { path: gamePath });
            return undefined;
          });
      }).then((results) => {
        const validPath = results.find(path => path !== undefined);
        if (validPath) {
          log('info', 'Cyberpunk 2077 found at', { path: validPath });
          return validPath;
        }
        log('warn', 'Cyberpunk 2077 not found in any common locations');
        throw new Error('Cyberpunk 2077 not found');
      });
    });
}

function testSupportedContent(files: string[], gameId: string): Bluebird<types.ISupportedResult> {
  // Basic mod support - most Cyberpunk mods are simple file replacements
  const supported = files.find(file => 
    path.extname(file).toLowerCase() === '.archive' ||
    path.extname(file).toLowerCase() === '.xl' ||
    file.toLowerCase().includes('cyberpunk') ||
    file.toLowerCase().includes('redmod')
  ) !== undefined;

  return Bluebird.resolve({
    supported,
    requiredFiles: [],
  });
}

function installContent(files: string[]): Bluebird<types.IInstallResult> {
  // Simple installation - copy files to mod directory
  const instructions: types.IInstruction[] = files.map(file => ({
    type: 'copy',
    source: file,
    destination: file,
  }));

  return Bluebird.resolve({ instructions });
}

function prepareForModding(discovery: types.IDiscoveryResult): Bluebird<void> {
  // Ensure mod directories exist
  const modPath = path.join(discovery.path, 'archive', 'pc', 'mod');
  return fs.ensureDirWritableAsync(modPath);
}

function main(context: types.IExtensionContext) {
  context.registerGame({
    id: GAME_ID,
    name: 'Cyberpunk 2077',
    mergeMods: false,
    queryPath: findGame,
    supportedTools: [],
    queryModPath: () => 'archive/pc/mod',
    logo: 'gameart.jpg',
    executable: (discoveredPath: string) => {
      // Handle macOS app bundle structure
      if (process.platform === 'darwin') {
        // For Steam installations, the discoveredPath points to the folder containing the .app bundle
        // We need to return the path to the executable inside the app bundle
        if (discoveredPath && discoveredPath.includes('steamapps')) {
          return 'Cyberpunk2077.app/Contents/MacOS/Cyberpunk2077';
        }
        // For native macOS installations, the discoveredPath already points to Contents/Resources
        return 'Cyberpunk2077';
      }

      // Check if discoveredPath is valid - handle undefined, null, empty string
      if (!discoveredPath || typeof discoveredPath !== 'string' || discoveredPath.trim() === '') {
        return 'bin/x64/Cyberpunk2077.exe';
      }

      // Try to find the executable in various locations for Windows
      const possibleExecutables = [
        'bin/x64/Cyberpunk2077.exe',
        'Cyberpunk2077.exe',
        'bin/Cyberpunk2077.exe',
      ];

      for (const exe of possibleExecutables) {
        const fullPath = path.join(discoveredPath, exe);
        try {
          if (fs.statSync(fullPath).isFile()) {
            return exe;
          }
        } catch (err) {
          // Continue to next possibility
        }
      }
      
      // Default fallback for Windows
      return 'bin/x64/Cyberpunk2077.exe';
    },
    requiredFiles: REQUIRED_FILES,
    setup: prepareForModding,
    environment: {
      SteamAPPId: STEAM_ID,
    },
    details: {
      steamAppId: parseInt(STEAM_ID, 10),
      gogAppId: GOG_ID,
      epicAppId: EPIC_ID,
    },
  });

  context.registerInstaller('cyberpunk2077-mod', 25, testSupportedContent, installContent);

  return true;
}

export default main;