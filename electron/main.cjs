const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const { spawn } = require('child_process');
const { createHash } = require('crypto');
const pty = require('node-pty');

const MAX_LOG_CHARS = 250000;
const GAMES_ROOT_RELATIVE = 'src/games';
const GEMINI_DEFAULT_MODEL = 'auto';
const GEMINI_REQUIRED_EMAIL = 'demoon84@gmail.com';
const REQUIRED_DEPLOY_REPO_SLUG = 'demoon84/jihun-games';
const REQUIRED_VERCEL_PROJECT_NAME = 'jhgame';
const terminalSessions = new Map();
let terminalSessionCounter = 0;
let nodePtyHelperPrepared = false;

function storeFilePath() {
  return path.join(app.getPath('userData'), 'project-manager-store.json');
}

function hashFromPath(inputPath) {
  return createHash('sha1').update(inputPath).digest('hex').slice(0, 12);
}

function detectPackageManager(projectPath) {
  if (fsSync.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }

  if (fsSync.existsSync(path.join(projectPath, 'yarn.lock'))) {
    return 'yarn';
  }

  if (
    fsSync.existsSync(path.join(projectPath, 'bun.lock')) ||
    fsSync.existsSync(path.join(projectPath, 'bun.lockb'))
  ) {
    return 'bun';
  }

  return 'npm';
}

async function detectEngineType(projectPath) {
  if (
    fsSync.existsSync(path.join(projectPath, 'Assets')) &&
    fsSync.existsSync(path.join(projectPath, 'ProjectSettings'))
  ) {
    return 'Unity';
  }

  if (fsSync.existsSync(path.join(projectPath, 'project.godot'))) {
    return 'Godot';
  }

  try {
    const files = await fs.readdir(projectPath);

    if (files.some((name) => name.endsWith('.uproject'))) {
      return 'Unreal';
    }
  } catch (_error) {
    // Ignore listing errors and fall back to other checks.
  }

  if (fsSync.existsSync(path.join(projectPath, 'package.json'))) {
    return 'Web/Node';
  }

  return 'General';
}

function trimLog(log) {
  if (!log) {
    return '';
  }

  if (log.length <= MAX_LOG_CHARS) {
    return log;
  }

  return log.slice(log.length - MAX_LOG_CHARS);
}

async function readStore() {
  try {
    const raw = await fs.readFile(storeFilePath(), 'utf8');
    const parsed = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') {
      return { projects: [] };
    }

    if (!Array.isArray(parsed.projects)) {
      return { projects: [] };
    }

    return parsed;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return { projects: [] };
    }

    return { projects: [] };
  }
}

async function writeStore(nextStore) {
  const validated = nextStore && Array.isArray(nextStore.projects)
    ? { projects: nextStore.projects }
    : { projects: [] };

  const filePath = storeFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(validated, null, 2), 'utf8');

  return validated;
}

function toPosixPath(inputPath) {
  return inputPath.split(path.sep).join('/');
}

function resolveGamesRoot(projectPath) {
  return path.resolve(projectPath, 'src', 'games');
}

function normalizeGameFolderName(rawName) {
  const normalized = String(rawName || '')
    .trim()
    .replace(/[\\/]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}._-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^[.-]+/, '')
    .slice(0, 64);

  return normalized;
}

function isInsidePath(rootPath, targetPath) {
  const relative = path.relative(rootPath, targetPath);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
}

function toGameFolderItem(projectPath, folderName) {
  const absolutePath = path.join(resolveGamesRoot(projectPath), folderName);
  const relativePath = toPosixPath(path.relative(projectPath, absolutePath));

  return {
    id: hashFromPath(absolutePath),
    name: folderName,
    relativePath,
    absolutePath,
  };
}

async function listGameFolders(projectPath) {
  if (!projectPath) {
    throw new Error('projectPath is required.');
  }

  const gamesRootPath = resolveGamesRoot(projectPath);
  let gameFolders = [];

  try {
    const entries = await fs.readdir(gamesRootPath, { withFileTypes: true });
    gameFolders = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => toGameFolderItem(projectPath, entry.name))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      throw error;
    }
  }

  return {
    gamesRootRelative: GAMES_ROOT_RELATIVE,
    gamesRootPath,
    gameFolders,
  };
}

async function createGameFolder({ projectPath, folderName }) {
  if (!projectPath || !folderName) {
    throw new Error('projectPath and folderName are required.');
  }

  const normalizedFolderName = normalizeGameFolderName(folderName);
  if (!normalizedFolderName) {
    throw new Error('유효한 폴더 이름을 입력해주세요.');
  }

  const gamesRootPath = resolveGamesRoot(projectPath);
  const targetPath = path.resolve(gamesRootPath, normalizedFolderName);

  if (!isInsidePath(gamesRootPath, targetPath)) {
    throw new Error('잘못된 폴더 경로입니다.');
  }

  await fs.mkdir(gamesRootPath, { recursive: true });
  if (fsSync.existsSync(targetPath)) {
    throw new Error('이미 존재하는 게임 폴더입니다.');
  }
  await fs.mkdir(targetPath);

  return listGameFolders(projectPath);
}

async function deleteGameFolder({ projectPath, folderName }) {
  if (!projectPath || !folderName) {
    throw new Error('projectPath and folderName are required.');
  }

  const sanitizedFolderName = String(folderName || '').trim();
  if (
    !sanitizedFolderName ||
    sanitizedFolderName === '.' ||
    sanitizedFolderName === '..' ||
    sanitizedFolderName.includes('/') ||
    sanitizedFolderName.includes('\\')
  ) {
    throw new Error('삭제할 폴더 이름이 올바르지 않습니다.');
  }

  const gamesRootPath = resolveGamesRoot(projectPath);
  const targetPath = path.resolve(gamesRootPath, sanitizedFolderName);

  if (!isInsidePath(gamesRootPath, targetPath)) {
    throw new Error('잘못된 폴더 경로입니다.');
  }

  if (!fsSync.existsSync(targetPath)) {
    throw new Error('삭제할 게임 폴더를 찾지 못했습니다.');
  }

  await fs.rm(targetPath, { recursive: true, force: false });

  return listGameFolders(projectPath);
}

async function scanProject(projectPath) {
  const stats = await fs.stat(projectPath);
  if (!stats.isDirectory()) {
    throw new Error('Project path must be a directory.');
  }

  const packageJsonPath = path.join(projectPath, 'package.json');
  const packageManager = detectPackageManager(projectPath);

  let scripts = [];
  let version = null;
  let projectName = path.basename(projectPath);

  if (fsSync.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      projectName = packageJson.name || projectName;
      version = packageJson.version || null;
      scripts = Object.keys(packageJson.scripts || {});
    } catch (_error) {
      // Package metadata is optional for non-JS projects.
    }
  }

  const gameSnapshot = await listGameFolders(projectPath);

  return {
    id: hashFromPath(projectPath),
    name: projectName,
    path: projectPath,
    version,
    packageManager,
    scripts,
    engineType: await detectEngineType(projectPath),
    git: fsSync.existsSync(path.join(projectPath, '.git')),
    lastModified: stats.mtime.toISOString(),
    gamesRootRelative: gameSnapshot.gamesRootRelative,
    gameFolders: gameSnapshot.gameFolders,
  };
}

function toCommandBinary(packageManager) {
  const manager = packageManager || 'npm';
  const isWindows = process.platform === 'win32';

  if (manager === 'yarn') {
    return isWindows ? 'yarn.cmd' : 'yarn';
  }

  if (manager === 'pnpm') {
    return isWindows ? 'pnpm.cmd' : 'pnpm';
  }

  if (manager === 'bun') {
    return isWindows ? 'bun.cmd' : 'bun';
  }

  return isWindows ? 'npm.cmd' : 'npm';
}

function toCommandArgs(packageManager, scriptName) {
  if (packageManager === 'yarn') {
    return [scriptName];
  }

  return ['run', scriptName];
}

async function runScript({ projectPath, scriptName, packageManager, timeoutMs }) {
  if (!projectPath || !scriptName) {
    throw new Error('projectPath and scriptName are required.');
  }

  const commandBinary = toCommandBinary(packageManager);
  const commandArgs = toCommandArgs(packageManager, scriptName);
  const command = `${commandBinary} ${commandArgs.join(' ')}`;

  return new Promise((resolve) => {
    const safeTimeout = Number.isFinite(timeoutMs) ? Math.max(1000, timeoutMs) : 120000;

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(commandBinary, commandArgs, {
      cwd: projectPath,
      shell: false,
      env: process.env,
    });

    child.stdout.on('data', (chunk) => {
      stdout = trimLog(stdout + chunk.toString());
    });

    child.stderr.on('data', (chunk) => {
      stderr = trimLog(stderr + chunk.toString());
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, safeTimeout);

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({
        command,
        exitCode,
        timedOut,
        stdout,
        stderr,
      });
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        command,
        exitCode: 1,
        timedOut,
        stdout,
        stderr: trimLog(`${stderr}\n${error.message}`),
      });
    });
  });
}

function formatDisplayNameFromFolder(folderName) {
  const base = String(folderName || '').trim();
  if (!base) {
    return 'Untitled Game';
  }

  return base
    .split(/[-_]/g)
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
}

async function discoverLocalProjects() {
  const workspaceRoot = app.getAppPath();
  const gamesRoot = path.join(workspaceRoot, 'src', 'games');

  let discovered = [];

  try {
    const entries = await fs.readdir(gamesRoot, { withFileTypes: true });
    const gameFolders = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);

    discovered = await Promise.all(
      gameFolders.map(async (folderName) => {
        const gamePath = path.join(gamesRoot, folderName);
        const scanned = await scanProject(gamePath);

        return {
          ...scanned,
          name: formatDisplayNameFromFolder(folderName),
          engineType: scanned.engineType === 'General' ? 'Game Module' : scanned.engineType,
          tags: ['local-game', folderName],
        };
      }),
    );
  } catch (error) {
    if (!error || error.code !== 'ENOENT') {
      throw error;
    }
  }

  if (discovered.length > 0) {
    return discovered;
  }

  const rootScanned = await scanProject(workspaceRoot);
  return [
    {
      ...rootScanned,
      name: rootScanned.name || 'Workspace',
      tags: ['workspace'],
    },
  ];
}

function geminiBinary() {
  return process.platform === 'win32' ? 'gemini.cmd' : 'gemini';
}

function vercelBinary() {
  return process.platform === 'win32' ? 'vercel.cmd' : 'vercel';
}

function gitBinary() {
  return process.platform === 'win32' ? 'git.exe' : 'git';
}

function extractGithubRepoSlug(remoteUrl) {
  const value = String(remoteUrl || '').trim();
  if (!value) {
    return null;
  }

  const match = value.match(/github\.com[:/]([^/\s]+\/[^/\s]+?)(?:\.git)?$/i);
  if (!match || !match[1]) {
    return null;
  }

  return match[1].toLowerCase();
}

function isNonFastForwardPushFailure(result) {
  const combined = `${result && result.stdout ? result.stdout : ''}\n${result && result.stderr ? result.stderr : ''}`.toLowerCase();

  return [
    'non-fast-forward',
    'updates were rejected because the remote contains work that you do not have locally',
    'fetch first',
    '[rejected]',
  ].some((pattern) => combined.includes(pattern));
}

function normalizeDeployRoutePath(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) {
    return '';
  }

  const prefixed = raw.startsWith('/') ? raw : `/${raw}`;
  return prefixed
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9/_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/\/+/g, '/');
}

function deriveDeployRouteFromRelativeProjectPath(relativeProjectPath) {
  const normalized = String(relativeProjectPath || '').replace(/\\/g, '/');
  const marker = 'src/games/';
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex === -1) {
    return '';
  }

  const folderName = normalized.slice(markerIndex + marker.length).split('/')[0];
  return normalizeDeployRoutePath(folderName ? `/${folderName}` : '');
}

function sendDeployProgress(event, payload) {
  if (!event || !event.sender) {
    return;
  }

  try {
    if (!event.sender.isDestroyed()) {
      event.sender.send('project:deploy-progress', payload);
    }
  } catch (_error) {
    // Ignore renderer teardown race conditions.
  }
}

function shellBinary() {
  if (process.platform === 'win32') {
    return process.env.COMSPEC || 'powershell.exe';
  }

  const candidates = [process.env.SHELL, '/bin/zsh', '/bin/bash', '/bin/sh'].filter(Boolean);
  const found = candidates.find((candidate) => fsSync.existsSync(candidate));

  return found || '/bin/sh';
}

function ensureNodePtyHelperExecutable() {
  if (nodePtyHelperPrepared || process.platform === 'win32') {
    return;
  }

  nodePtyHelperPrepared = true;

  try {
    const nodePtyRoot = path.dirname(require.resolve('node-pty/package.json'));
    const targetDirs = new Set([
      `darwin-${process.arch}`,
      'darwin-arm64',
      'darwin-x64',
    ]);

    targetDirs.forEach((targetDir) => {
      const helperPath = path.join(nodePtyRoot, 'prebuilds', targetDir, 'spawn-helper');

      if (fsSync.existsSync(helperPath)) {
        fsSync.chmodSync(helperPath, 0o755);
      }
    });
  } catch (error) {
    console.warn('[pty] Failed to ensure spawn-helper permissions:', error && error.message ? error.message : error);
  }
}

function toGeminiStartupCommand({ model, fastMode }) {
  const selectedModel = String(model || GEMINI_DEFAULT_MODEL).trim() || GEMINI_DEFAULT_MODEL;
  const useFastMode = fastMode !== false;
  const parts = [`gemini --model ${selectedModel}`];

  if (useFastMode) {
    parts.push('--approval-mode yolo');
  }

  return parts.join(' ');
}

function getGeminiCliHomeDir() {
  return process.env.GEMINI_CLI_HOME || process.env.HOME || app.getPath('home');
}

function getGeminiGlobalDir() {
  return path.join(getGeminiCliHomeDir(), '.gemini');
}

function getGeminiAccountsPath() {
  return path.join(getGeminiGlobalDir(), 'google_accounts.json');
}

function getGeminiOauthCredsPath() {
  return path.join(getGeminiGlobalDir(), 'oauth_creds.json');
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return null;
  }
}

function parseEmailFromIdToken(idToken) {
  const raw = String(idToken || '');
  const parts = raw.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(parts[1].length / 4) * 4, '=');
    const decoded = Buffer.from(payload, 'base64').toString('utf8');
    const parsed = safeJsonParse(decoded);
    const email = normalizeEmail(parsed && parsed.email);
    return email || null;
  } catch (_error) {
    return null;
  }
}

async function readGeminiCurrentAccountEmail() {
  const accountsPath = getGeminiAccountsPath();
  const oauthCredsPath = getGeminiOauthCredsPath();

  let activeEmail = null;
  let oldEmails = [];

  try {
    const accountsRaw = await fs.readFile(accountsPath, 'utf8');
    const accounts = safeJsonParse(accountsRaw);
    activeEmail = normalizeEmail(accounts && accounts.active);
    oldEmails = Array.isArray(accounts && accounts.old)
      ? accounts.old.map((value) => normalizeEmail(value)).filter(Boolean)
      : [];
  } catch (_error) {
    // Accounts file is optional.
  }

  if (activeEmail) {
    return { activeEmail, oldEmails };
  }

  try {
    const oauthRaw = await fs.readFile(oauthCredsPath, 'utf8');
    const oauth = safeJsonParse(oauthRaw);
    const tokenEmail = parseEmailFromIdToken(oauth && oauth.id_token);

    if (tokenEmail) {
      return { activeEmail: tokenEmail, oldEmails };
    }
  } catch (_error) {
    // Credentials file is optional.
  }

  return { activeEmail: null, oldEmails };
}

async function enforceGeminiRequiredEmail(requiredEmail) {
  const required = normalizeEmail(requiredEmail);
  if (!required) {
    return { isMatch: true, currentEmail: null, reset: false };
  }

  const accountsPath = getGeminiAccountsPath();
  const oauthCredsPath = getGeminiOauthCredsPath();
  const { activeEmail, oldEmails } = await readGeminiCurrentAccountEmail();

  if (!activeEmail) {
    return { isMatch: false, currentEmail: null, reset: false };
  }

  if (activeEmail === required) {
    return { isMatch: true, currentEmail: activeEmail, reset: false };
  }

  await fs.rm(oauthCredsPath, { force: true });

  const nextOld = Array.from(new Set([...oldEmails, activeEmail]));
  const nextAccounts = {
    active: null,
    old: nextOld,
  };

  await fs.mkdir(path.dirname(accountsPath), { recursive: true });
  await fs.writeFile(accountsPath, JSON.stringify(nextAccounts, null, 2), 'utf8');

  return { isMatch: false, currentEmail: activeEmail, reset: true };
}

function getTerminalSessionOrThrow(sessionId) {
  const session = terminalSessions.get(sessionId);
  if (!session) {
    throw new Error('터미널 세션을 찾을 수 없습니다.');
  }

  return session;
}

async function createGeminiTerminalSession(event, payload) {
  const {
    projectPath,
    cols = 120,
    rows = 30,
    model = GEMINI_DEFAULT_MODEL,
    fastMode = true,
  } = payload || {};

  if (!projectPath) {
    throw new Error('projectPath is required.');
  }

  const sessionId = `term-${++terminalSessionCounter}`;
  const startupCommand = toGeminiStartupCommand({ model, fastMode });
  const accountCheck = await enforceGeminiRequiredEmail(GEMINI_REQUIRED_EMAIL);
  ensureNodePtyHelperExecutable();
  const terminalEnv = {
    ...process.env,
    TERM: 'xterm-256color',
    COLORTERM: 'truecolor',
  };
  delete terminalEnv.NO_COLOR;
  const ptyProcess = pty.spawn(shellBinary(), [], {
    name: 'xterm-256color',
    cwd: fsSync.existsSync(projectPath) ? projectPath : app.getAppPath(),
    cols: Math.max(40, Number(cols) || 120),
    rows: Math.max(10, Number(rows) || 30),
    env: terminalEnv,
  });

  terminalSessions.set(sessionId, {
    ptyProcess,
    senderId: event.sender.id,
  });

  ptyProcess.onData((data) => {
    event.sender.send('terminal:data', {
      sessionId,
      data,
    });
  });

  ptyProcess.onExit(({ exitCode, signal }) => {
    terminalSessions.delete(sessionId);
    event.sender.send('terminal:exit', {
      sessionId,
      exitCode,
      signal,
    });
  });

  setTimeout(() => {
    if (terminalSessions.has(sessionId)) {
      if (!accountCheck.isMatch) {
        const currentEmail = accountCheck.currentEmail || 'none';
        const summary =
          `\r\n[계정 확인] Gemini 계정은 ${GEMINI_REQUIRED_EMAIL} 이어야 합니다.` +
          `\r\n현재 계정: ${currentEmail}\r\n`;

        ptyProcess.write(summary);

        if (accountCheck.reset) {
          ptyProcess.write('[안내] 기존 인증을 정리했습니다. 브라우저 로그인에서 demoon84@gmail.com 을 선택하세요.\r\n\r\n');
        } else {
          ptyProcess.write('[안내] 첫 로그인 또는 계정 확인이 필요합니다. demoon84@gmail.com 으로 로그인해주세요.\r\n\r\n');
        }
      }

      ptyProcess.write(`${startupCommand}\r`);
    }
  }, 80);

  return {
    sessionId,
    startupCommand,
  };
}

async function writeGeminiTerminalSession(event, payload) {
  const { sessionId, data } = payload || {};
  if (!sessionId) {
    throw new Error('sessionId is required.');
  }

  const session = getTerminalSessionOrThrow(sessionId);
  if (session.senderId !== event.sender.id) {
    throw new Error('권한이 없는 터미널 세션입니다.');
  }

  session.ptyProcess.write(String(data || ''));
  return { ok: true };
}

async function resizeGeminiTerminalSession(event, payload) {
  const { sessionId, cols, rows } = payload || {};
  if (!sessionId) {
    throw new Error('sessionId is required.');
  }

  const session = getTerminalSessionOrThrow(sessionId);
  if (session.senderId !== event.sender.id) {
    throw new Error('권한이 없는 터미널 세션입니다.');
  }

  const nextCols = Math.max(40, Number(cols) || 120);
  const nextRows = Math.max(10, Number(rows) || 30);
  session.ptyProcess.resize(nextCols, nextRows);

  return { ok: true };
}

async function closeGeminiTerminalSession(event, payload) {
  const { sessionId } = payload || {};
  if (!sessionId) {
    throw new Error('sessionId is required.');
  }

  const session = getTerminalSessionOrThrow(sessionId);
  if (session.senderId !== event.sender.id) {
    throw new Error('권한이 없는 터미널 세션입니다.');
  }

  session.ptyProcess.kill();
  terminalSessions.delete(sessionId);

  return { ok: true };
}

async function runGeminiPrompt({ projectPath, prompt, model, fastMode, timeoutMs }) {
  if (!projectPath || !prompt) {
    throw new Error('projectPath and prompt are required.');
  }

  const selectedModel = String(model || GEMINI_DEFAULT_MODEL).trim() || GEMINI_DEFAULT_MODEL;
  const useFastMode = fastMode !== false;
  const args = ['--model', selectedModel, '--prompt', String(prompt), '--output-format', 'text'];

  if (useFastMode) {
    args.push('--approval-mode', 'yolo');
  }

  return new Promise((resolve) => {
    const safeTimeout = Number.isFinite(timeoutMs) ? Math.max(1000, timeoutMs) : 180000;
    const commandBinary = geminiBinary();
    const command = `${commandBinary} ${args.join(' ')}`;

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(commandBinary, args, {
      cwd: projectPath,
      shell: false,
      env: process.env,
    });

    child.stdout.on('data', (chunk) => {
      stdout = trimLog(stdout + chunk.toString());
    });

    child.stderr.on('data', (chunk) => {
      stderr = trimLog(stderr + chunk.toString());
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, safeTimeout);

    child.on('close', (exitCode) => {
      clearTimeout(timer);
      resolve({
        command,
        exitCode,
        timedOut,
        stdout,
        stderr,
      });
    });

    child.on('error', (error) => {
      clearTimeout(timer);
      resolve({
        command,
        exitCode: 1,
        timedOut,
        stdout,
        stderr: trimLog(`${stderr}\n${error.message}`),
      });
    });
  });
}

async function deployProjectToVercel(event, { projectPath, routePath, timeoutMs, requestId }) {
  if (!projectPath) {
    throw new Error('projectPath is required.');
  }

  const safeTimeout = Number.isFinite(timeoutMs) ? Math.max(5000, timeoutMs) : 600000;
  const gitCommand = gitBinary();
  const deployRequestId = String(requestId || `deploy-${Date.now()}`);
  const stdoutChunks = [];
  const stderrChunks = [];
  const pushProgress = (payload) => {
    sendDeployProgress(event, {
      requestId: deployRequestId,
      projectPath,
      timestamp: new Date().toISOString(),
      ...payload,
    });
  };

  pushProgress({
    type: 'status',
    message: '배포 준비를 시작합니다.',
  });

  function appendLog(stepLabel, result) {
    if (result.stdout) {
      stdoutChunks.push(`[${stepLabel}]`);
      stdoutChunks.push(result.stdout);
    }

    if (result.stderr) {
      stderrChunks.push(`[${stepLabel}]`);
      stderrChunks.push(result.stderr);
    }
  }

  function toFailureResult(stepLabel, result, extraMessage) {
    appendLog(stepLabel, result);
    if (extraMessage) {
      stderrChunks.push(extraMessage);
    }

    const failureResult = {
      command: 'git add/commit/push + vercel --prod --yes',
      exitCode: result && Number.isFinite(result.exitCode) ? result.exitCode : 1,
      timedOut: Boolean(result && result.timedOut),
      stdout: trimLog(stdoutChunks.join('\n')),
      stderr: trimLog(stderrChunks.join('\n')),
      requestId: deployRequestId,
    };

    pushProgress({
      type: 'complete',
      ok: false,
      message: extraMessage || '배포가 실패했습니다.',
      timedOut: failureResult.timedOut,
      exitCode: failureResult.exitCode,
    });

    return failureResult;
  }

  function runCommand(stepKey, stepLabel, commandBinary, args, cwd, commandTimeoutMs) {
    const command = `${commandBinary} ${args.join(' ')}`;
    pushProgress({
      type: 'step-start',
      stepKey,
      stepLabel,
      command,
    });

    return new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const child = spawn(commandBinary, args, {
        cwd,
        shell: false,
        env: process.env,
      });

      child.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        stdout = trimLog(stdout + text);
        pushProgress({
          type: 'output',
          stepKey,
          stream: 'stdout',
          chunk: text,
        });
      });

      child.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        stderr = trimLog(stderr + text);
        pushProgress({
          type: 'output',
          stepKey,
          stream: 'stderr',
          chunk: text,
        });
      });

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, commandTimeoutMs);

      child.on('close', (exitCode) => {
        clearTimeout(timer);
        pushProgress({
          type: 'step-end',
          stepKey,
          stepLabel,
          exitCode,
          timedOut,
        });
        resolve({
          command,
          exitCode,
          timedOut,
          stdout,
          stderr,
        });
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        pushProgress({
          type: 'step-end',
          stepKey,
          stepLabel,
          exitCode: 1,
          timedOut,
          error: error.message,
        });
        resolve({
          command,
          exitCode: 1,
          timedOut,
          stdout,
          stderr: trimLog(`${stderr}\n${error.message}`),
        });
      });
    });
  }

  const rootResult = await runCommand(
    'git-root',
    'Git 저장소 루트 확인',
    gitCommand,
    ['rev-parse', '--show-toplevel'],
    projectPath,
    15000,
  );
  if (rootResult.timedOut || rootResult.exitCode !== 0) {
    return toFailureResult('git-root', rootResult, 'Git 저장소 루트를 찾지 못했습니다.');
  }

  appendLog('git-root', rootResult);
  const gitRoot = String(rootResult.stdout || '').trim().split(/\r?\n/).pop() || '';

  const relativeProjectPath = (path.relative(gitRoot, projectPath) || '.').split(path.sep).join('/');
  if (!relativeProjectPath || relativeProjectPath.startsWith('..') || path.isAbsolute(relativeProjectPath)) {
    return toFailureResult('git-root', rootResult, '선택한 프로젝트가 Git 저장소 내부에 있지 않습니다.');
  }

  const deployRoutePath = normalizeDeployRoutePath(routePath) || deriveDeployRouteFromRelativeProjectPath(relativeProjectPath);
  if (!deployRoutePath) {
    return toFailureResult(
      'git-root',
      rootResult,
      '게임 배포 경로를 확인하지 못했습니다. 프로젝트 routePath를 확인해주세요.',
    );
  }

  const remoteResult = await runCommand(
    'git-remote',
    'origin 저장소 확인',
    gitCommand,
    ['-C', gitRoot, 'remote', 'get-url', 'origin'],
    gitRoot,
    15000,
  );
  if (remoteResult.timedOut || remoteResult.exitCode !== 0) {
    return toFailureResult('git-remote', remoteResult, 'origin 원격 저장소를 확인하지 못했습니다.');
  }

  appendLog('git-remote', remoteResult);
  const remoteUrl = String(remoteResult.stdout || '').trim().split(/\r?\n/).pop() || '';
  const remoteSlug = extractGithubRepoSlug(remoteUrl);
  if (remoteSlug !== REQUIRED_DEPLOY_REPO_SLUG) {
    return toFailureResult(
      'git-remote',
      remoteResult,
      `origin 저장소가 ${REQUIRED_DEPLOY_REPO_SLUG} 가 아닙니다. 현재: ${remoteUrl || 'unknown'}`,
    );
  }

  const addResult = await runCommand(
    'git-add',
    '전체 변경사항 스테이징',
    gitCommand,
    ['-C', gitRoot, 'add', '-A'],
    gitRoot,
    30000,
  );
  if (addResult.timedOut || addResult.exitCode !== 0) {
    return toFailureResult('git-add', addResult, '전체 변경사항을 스테이징하지 못했습니다.');
  }
  appendLog('git-add', addResult);

  const diffResult = await runCommand(
    'git-diff',
    '스테이징 변경 확인',
    gitCommand,
    ['-C', gitRoot, 'diff', '--cached', '--quiet'],
    gitRoot,
    10000,
  );

  if (diffResult.timedOut || (diffResult.exitCode !== 0 && diffResult.exitCode !== 1)) {
    return toFailureResult('git-diff', diffResult, '스테이징된 변경사항 확인에 실패했습니다.');
  }
  appendLog('git-diff', diffResult);

  let committed = false;
  if (diffResult.exitCode === 1) {
    const commitMessage = `chore: deploy ${path.basename(projectPath)} (${deployRoutePath}) ${new Date().toISOString()}`;
    const commitResult = await runCommand(
      'git-commit',
      '커밋 생성',
      gitCommand,
      ['-C', gitRoot, 'commit', '-m', commitMessage],
      gitRoot,
      60000,
    );

    if (commitResult.timedOut || commitResult.exitCode !== 0) {
      return toFailureResult('git-commit', commitResult, '커밋에 실패했습니다.');
    }

    committed = true;
    appendLog('git-commit', commitResult);
  } else {
    stdoutChunks.push('[git-commit]');
    stdoutChunks.push('커밋할 변경사항이 없어 기존 커밋 상태로 배포를 진행합니다.');
    pushProgress({
      type: 'status',
      stepKey: 'git-commit',
      message: '커밋할 변경사항이 없습니다. 기존 커밋으로 계속 진행합니다.',
    });
    pushProgress({
      type: 'step-end',
      stepKey: 'git-commit',
      stepLabel: '커밋 생성',
      exitCode: 0,
      timedOut: false,
    });
  }

  let rebasedBeforePush = false;

  const pushResult = await runCommand(
    'git-push',
    '원격 저장소 푸시',
    gitCommand,
    ['-C', gitRoot, 'push', 'origin'],
    gitRoot,
    180000,
  );
  appendLog('git-push', pushResult);
  if (pushResult.timedOut) {
    return toFailureResult('git-push', pushResult, '원격 저장소 푸시에 실패했습니다.');
  }

  if (pushResult.exitCode !== 0) {
    const nonFastForwardLikely = isNonFastForwardPushFailure(pushResult);

    pushProgress({
      type: 'status',
      stepKey: 'git-push',
      message: nonFastForwardLikely
        ? '원격 변경사항을 자동 동기화한 뒤 다시 푸시합니다.'
        : '푸시 실패를 자동 복구 시도합니다. 동기화 후 재푸시합니다.',
    });

    const currentBranchResult = await runCommand(
      'git-push',
      '현재 브랜치 확인',
      gitCommand,
      ['-C', gitRoot, 'rev-parse', '--abbrev-ref', 'HEAD'],
      gitRoot,
      10000,
    );
    appendLog('git-current-branch', currentBranchResult);
    if (currentBranchResult.timedOut || currentBranchResult.exitCode !== 0) {
      return toFailureResult('git-current-branch', currentBranchResult, '현재 브랜치를 확인하지 못했습니다.');
    }

    const currentBranch = String(currentBranchResult.stdout || '').trim().split(/\r?\n/).pop() || '';
    if (!currentBranch || currentBranch === 'HEAD') {
      return toFailureResult(
        'git-current-branch',
        currentBranchResult,
        '현재 브랜치를 확인하지 못해 자동 동기화를 진행할 수 없습니다.',
      );
    }

    const pullRebaseResult = await runCommand(
      'git-push',
      '원격 변경사항 동기화',
      gitCommand,
      ['-C', gitRoot, 'pull', '--rebase', '--autostash', 'origin', currentBranch],
      gitRoot,
      180000,
    );
    appendLog('git-pull-rebase', pullRebaseResult);
    if (pullRebaseResult.timedOut || pullRebaseResult.exitCode !== 0) {
      return toFailureResult(
        'git-pull-rebase',
        pullRebaseResult,
        '원격 저장소 푸시 실패 후 자동 동기화(pull --rebase)에도 실패했습니다.',
      );
    }
    rebasedBeforePush = true;

    const pushRetryResult = await runCommand(
      'git-push',
      '원격 저장소 재푸시',
      gitCommand,
      ['-C', gitRoot, 'push', 'origin'],
      gitRoot,
      180000,
    );
    appendLog('git-push-retry', pushRetryResult);
    if (pushRetryResult.timedOut || pushRetryResult.exitCode !== 0) {
      return toFailureResult('git-push-retry', pushRetryResult, '원격 저장소 재푸시에 실패했습니다.');
    }
  }

  const vercelProjectConfigPath = path.join(gitRoot, '.vercel', 'project.json');
  let vercelProjectName = '';

  try {
    const rawVercelProject = await fs.readFile(vercelProjectConfigPath, 'utf8');
    const parsedVercelProject = JSON.parse(rawVercelProject);
    vercelProjectName = String(parsedVercelProject?.projectName || '').trim();
  } catch (_error) {
    vercelProjectName = '';
  }

  if (vercelProjectName && vercelProjectName !== REQUIRED_VERCEL_PROJECT_NAME) {
    return toFailureResult(
      'vercel-project-check',
      {
        command: `read ${vercelProjectConfigPath}`,
        exitCode: 1,
        timedOut: false,
        stdout: '',
        stderr: `Detected Vercel project: ${vercelProjectName}`,
      },
      `루트 Vercel 프로젝트가 ${REQUIRED_VERCEL_PROJECT_NAME} 가 아닙니다. 현재: ${vercelProjectName}`,
    );
  }

  const vercelResult = await runCommand(
    'vercel-deploy',
    'Vercel 프로덕션 배포(게임 화면)',
    vercelBinary(),
    ['--prod', '--yes', '--build-env', `VITE_DEPLOY_GAME_PATH=${deployRoutePath}`],
    gitRoot,
    safeTimeout,
  );
  appendLog('vercel-deploy', vercelResult);

  const successResult = {
    command: 'git add/commit/push + vercel --prod --yes',
    exitCode: vercelResult.exitCode,
    timedOut: vercelResult.timedOut,
    stdout: trimLog(stdoutChunks.join('\n')),
    stderr: trimLog(stderrChunks.join('\n')),
    requestId: deployRequestId,
    git: {
      root: gitRoot,
      relativePath: relativeProjectPath,
      deployRoutePath,
      remoteUrl,
      committed,
      rebasedBeforePush,
      pushed: true,
    },
  };

  pushProgress({
    type: 'complete',
    ok: successResult.exitCode === 0 && !successResult.timedOut,
    timedOut: successResult.timedOut,
    exitCode: successResult.exitCode,
    message: successResult.exitCode === 0
      ? '배포가 완료되었습니다.'
      : '배포가 실패했습니다.',
  });

  return successResult;
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1460,
    height: 940,
    minWidth: 1180,
    minHeight: 760,
    title: 'Game Project Control',
    backgroundColor: '#0B0F14',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    mainWindow.loadURL(devServerUrl);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  ipcMain.handle('project:select-folder', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || !result.filePaths[0]) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle('project:scan', async (_event, projectPath) => scanProject(projectPath));
  ipcMain.handle('project:get-workspace-root', async () => app.getAppPath());
  ipcMain.handle('project:list-game-folders', async (_event, projectPath) => listGameFolders(projectPath));
  ipcMain.handle('project:create-game-folder', async (_event, payload) =>
    createGameFolder(payload || {}),
  );
  ipcMain.handle('project:delete-game-folder', async (_event, payload) =>
    deleteGameFolder(payload || {}),
  );

  ipcMain.handle('project:open-path', async (_event, targetPath) => {
    if (!targetPath) {
      return { ok: false, error: 'Path is required.' };
    }

    const openError = await shell.openPath(targetPath);

    if (openError) {
      return { ok: false, error: openError };
    }

    return { ok: true };
  });

  ipcMain.handle('project:open-external-url', async (_event, targetUrl) => {
    if (!targetUrl) {
      return { ok: false, error: 'URL is required.' };
    }

    try {
      await shell.openExternal(String(targetUrl));
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : '외부 링크를 열지 못했습니다.',
      };
    }
  });

  ipcMain.handle('projects:load', async () => readStore());
  ipcMain.handle('projects:discover-local', async () => discoverLocalProjects());

  ipcMain.handle('projects:save', async (_event, payload) => {
    const saved = await writeStore(payload);

    return {
      ok: true,
      store: saved,
    };
  });

  ipcMain.handle('project:run-script', async (_event, payload) => runScript(payload || {}));
  ipcMain.handle('project:run-gemini', async (_event, payload) => runGeminiPrompt(payload || {}));
  ipcMain.handle('project:deploy-vercel', async (event, payload) => deployProjectToVercel(event, payload || {}));
  ipcMain.handle('terminal:create-gemini-session', async (event, payload) =>
    createGeminiTerminalSession(event, payload || {}),
  );
  ipcMain.handle('terminal:write', async (event, payload) => writeGeminiTerminalSession(event, payload || {}));
  ipcMain.handle('terminal:resize', async (event, payload) =>
    resizeGeminiTerminalSession(event, payload || {}),
  );
  ipcMain.handle('terminal:close', async (event, payload) => closeGeminiTerminalSession(event, payload || {}));

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  terminalSessions.forEach((session) => {
    try {
      session.ptyProcess.kill();
    } catch (_error) {
      // Ignore process cleanup errors.
    }
  });
  terminalSessions.clear();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
