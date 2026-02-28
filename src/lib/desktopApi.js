const LOCAL_KEY = 'jihun-project-manager-store-v1';

function hasDesktopApi() {
  return typeof window !== 'undefined' && typeof window.desktopApi !== 'undefined';
}

function readLocalStore() {
  try {
    const raw = window.localStorage.getItem(LOCAL_KEY);
    const parsed = raw ? JSON.parse(raw) : null;

    if (!parsed || !Array.isArray(parsed.projects)) {
      return { projects: [] };
    }

    return parsed;
  } catch (_error) {
    return { projects: [] };
  }
}

function writeLocalStore(store) {
  const nextStore = store && Array.isArray(store.projects)
    ? { projects: store.projects }
    : { projects: [] };

  window.localStorage.setItem(LOCAL_KEY, JSON.stringify(nextStore));

  return {
    ok: true,
    store: nextStore,
  };
}

export function isDesktopApp() {
  return hasDesktopApi();
}

export async function loadStore() {
  if (hasDesktopApi()) {
    const remote = await window.desktopApi.loadProjects();

    if (!remote || !Array.isArray(remote.projects)) {
      return { projects: [] };
    }

    return remote;
  }

  return readLocalStore();
}

export async function saveStore(store) {
  if (hasDesktopApi()) {
    const response = await window.desktopApi.saveProjects(store);

    if (response && response.store) {
      return response.store;
    }

    return store;
  }

  return writeLocalStore(store).store;
}

export async function discoverLocalProjects() {
  if (!hasDesktopApi()) {
    return [];
  }

  const discovered = await window.desktopApi.discoverLocalProjects();
  return Array.isArray(discovered) ? discovered : [];
}

export async function selectProjectFolder() {
  if (!hasDesktopApi()) {
    return null;
  }

  return window.desktopApi.selectProjectFolder();
}

export async function scanProject(projectPath) {
  if (!projectPath) {
    return null;
  }

  if (!hasDesktopApi()) {
    const name = projectPath.split('/').filter(Boolean).pop() || 'Web Project';

    return {
      id: `local-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name,
      path: projectPath,
      version: null,
      packageManager: 'npm',
      scripts: [],
      engineType: 'Web/Node',
      git: false,
      lastModified: new Date().toISOString(),
      gamesRootRelative: 'src/games',
      gameFolders: [],
    };
  }

  return window.desktopApi.scanProject(projectPath);
}

export async function getWorkspaceRoot() {
  if (!hasDesktopApi()) {
    return null;
  }

  return window.desktopApi.getWorkspaceRoot();
}

export async function listGameFolders(projectPath) {
  if (!projectPath) {
    return {
      gamesRootRelative: 'src/games',
      gameFolders: [],
    };
  }

  if (!hasDesktopApi()) {
    return {
      gamesRootRelative: 'src/games',
      gameFolders: [],
    };
  }

  return window.desktopApi.listGameFolders(projectPath);
}

export async function createGameFolder(payload) {
  if (!hasDesktopApi()) {
    return {
      gamesRootRelative: 'src/games',
      gameFolders: [],
    };
  }

  return window.desktopApi.createGameFolder(payload);
}

export async function deleteGameFolder(payload) {
  if (!hasDesktopApi()) {
    return {
      gamesRootRelative: 'src/games',
      gameFolders: [],
    };
  }

  return window.desktopApi.deleteGameFolder(payload);
}

export async function openPath(targetPath) {
  if (!targetPath || !hasDesktopApi()) {
    return { ok: false, error: 'Desktop API unavailable.' };
  }

  return window.desktopApi.openPath(targetPath);
}

export async function openExternalUrl(targetUrl) {
  if (!targetUrl) {
    return { ok: false, error: 'URL is required.' };
  }

  if (!hasDesktopApi()) {
    if (typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
      return { ok: true };
    }

    return { ok: false, error: 'Desktop API unavailable.' };
  }

  return window.desktopApi.openExternalUrl(targetUrl);
}

export async function runProjectScript(payload) {
  if (!hasDesktopApi()) {
    return {
      command: 'unavailable',
      exitCode: 1,
      timedOut: false,
      stdout: '',
      stderr: 'Electron 환경에서만 스크립트 실행이 가능합니다.',
    };
  }

  return window.desktopApi.runProjectScript(payload);
}

export async function runProjectGemini(payload) {
  if (!hasDesktopApi()) {
    return {
      command: 'gemini',
      exitCode: 1,
      timedOut: false,
      stdout: '',
      stderr: 'Electron 환경에서만 Gemini 실행이 가능합니다.',
    };
  }

  return window.desktopApi.runProjectGemini(payload);
}

export async function deployProjectToVercel(payload) {
  if (!hasDesktopApi()) {
    return {
      command: 'vercel --prod --yes',
      exitCode: 1,
      timedOut: false,
      stdout: '',
      stderr: 'Electron 환경에서만 Vercel 배포가 가능합니다.',
    };
  }

  return window.desktopApi.deployProjectToVercel(payload);
}

export async function createGeminiTerminalSession(payload) {
  if (!hasDesktopApi()) {
    throw new Error('Desktop API unavailable.');
  }

  return window.desktopApi.createGeminiTerminalSession(payload);
}

export async function writeGeminiTerminalSession(payload) {
  if (!hasDesktopApi()) {
    return { ok: false };
  }

  return window.desktopApi.writeGeminiTerminalSession(payload);
}

export async function resizeGeminiTerminalSession(payload) {
  if (!hasDesktopApi()) {
    return { ok: false };
  }

  return window.desktopApi.resizeGeminiTerminalSession(payload);
}

export async function closeGeminiTerminalSession(payload) {
  if (!hasDesktopApi()) {
    return { ok: false };
  }

  return window.desktopApi.closeGeminiTerminalSession(payload);
}

export function onGeminiTerminalData(callback) {
  if (!hasDesktopApi()) {
    return () => {};
  }

  return window.desktopApi.onGeminiTerminalData(callback);
}

export function onGeminiTerminalExit(callback) {
  if (!hasDesktopApi()) {
    return () => {};
  }

  return window.desktopApi.onGeminiTerminalExit(callback);
}

export function onProjectDeployProgress(callback) {
  if (!hasDesktopApi() || typeof window.desktopApi.onProjectDeployProgress !== 'function') {
    return () => {};
  }

  return window.desktopApi.onProjectDeployProgress(callback);
}
