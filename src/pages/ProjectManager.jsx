import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  createGameFolder,
  deleteGameFolder,
  deployProjectToVercel,
  closeGeminiTerminalSession,
  createGeminiTerminalSession,
  discoverLocalProjects,
  getWorkspaceRoot,
  isDesktopApp,
  loadStore,
  onGeminiTerminalData,
  onGeminiTerminalExit,
  onProjectDeployProgress,
  openExternalUrl,
  resizeGeminiTerminalSession,
  saveStore,
  scanProject,
  writeGeminiTerminalSession,
} from '../lib/desktopApi';

const GAMES_ROOT_RELATIVE = 'src/games';
const PUBLIC_SERVICE_URL = 'https://jhgame.vercel.app';
const ROUTE_DEFAULT_NAMES = {
  '/defense': '디펜스 기갑 탱크',
  '/zombie': '수비대: 좀비 습격',
  '/baseball': '마구마구갓',
  '/proverb': '속담 파워',
};
const ROUTE_DEFAULT_DESCRIPTIONS = {
  '/defense': '전략적인 배치와 합성을 통해 몰려오는 적들을 막아내세요.',
  '/zombie': '끊임없이 몰려오는 좀비 무리로부터 생존하십시오.',
  '/baseball': '타이밍을 맞춰 홈런을 날리세요! 리듬과 야구의 만남.',
  '/proverb': '무한 난이도 속담 퀴즈! 당신의 어휘력을 테스트하세요.',
};
const AUTO_GAME_ICONS = ['⚡', '🧟', '🛡️', '⚾', '🔥', '🎯', '🚀', '🧩', '🐉', '🎮'];
const AUTO_GAME_COLORS = [
  'bg-indigo-900',
  'bg-green-900',
  'bg-blue-900',
  'bg-slate-800',
  'bg-red-900',
  'bg-emerald-900',
  'bg-cyan-900',
  'bg-violet-900',
  'bg-amber-900',
  'bg-zinc-800',
];

function hashText(input) {
  return Array.from(String(input || '')).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function autoGameIcon(seed) {
  return AUTO_GAME_ICONS[hashText(seed) % AUTO_GAME_ICONS.length];
}

function autoGameColor(seed) {
  return AUTO_GAME_COLORS[hashText(seed) % AUTO_GAME_COLORS.length];
}

function normalizeRoutePath(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) {
    return '';
  }

  const prefixed = raw.startsWith('/') ? raw : `/${raw}`;
  const cleaned = prefixed
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9/_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/\/+/g, '/');

  return cleaned === '/' ? '' : cleaned;
}

function folderNameFromRoutePath(routePath) {
  const normalized = normalizeRoutePath(routePath);
  if (!normalized) {
    return '';
  }

  const parts = normalized.split('/').filter(Boolean);
  return normalizeFolderName(parts[parts.length - 1] || '');
}

function deriveRoutePathFromProject(project) {
  const normalizedPath = toPosixPath(project?.path);
  const marker = '/src/games/';
  const markerIndex = normalizedPath.indexOf(marker);
  if (markerIndex === -1) {
    return '';
  }

  const folderName = normalizedPath.slice(markerIndex + marker.length).split('/')[0];
  return normalizeRoutePath(`/${folderName}`);
}

function deriveFolderNameFromProject(project) {
  const normalizedPath = toPosixPath(project?.path);
  const marker = '/src/games/';
  const markerIndex = normalizedPath.indexOf(marker);
  if (markerIndex !== -1) {
    const folderName = normalizedPath.slice(markerIndex + marker.length).split('/')[0];
    return normalizeFolderName(folderName);
  }

  if (Array.isArray(project?.tags) && project.tags.includes('local-game') && project.tags[1]) {
    return normalizeFolderName(project.tags[1]);
  }

  return folderNameFromRoutePath(project?.routePath || project?.pathAlias || '');
}

function normalizePathLikeName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^\//, '')
    .replace(/[\s_-]+/g, '');
}

function shouldUseDefaultRouteName(name, routePath) {
  if (!routePath) {
    return false;
  }

  const segment = String(routePath).split('/').filter(Boolean).pop() || '';
  const normalizedName = normalizePathLikeName(name);
  const normalizedSegment = normalizePathLikeName(segment);

  return !normalizedName || normalizedName === normalizedSegment;
}

function normalizeProject(project) {
  const normalizedRoutePath = normalizeRoutePath(project.routePath || project.pathAlias || deriveRoutePathFromProject(project));
  const description = String(project.description || project.desc || '').trim() || (ROUTE_DEFAULT_DESCRIPTIONS[normalizedRoutePath] || '');
  const nextName = String(project.name || '').trim();
  const resolvedName = shouldUseDefaultRouteName(nextName, normalizedRoutePath)
    ? (ROUTE_DEFAULT_NAMES[normalizedRoutePath] || nextName || '새 프로젝트')
    : nextName;
  const displaySeed = resolvedName || normalizedRoutePath || project.id || project.path;

  return {
    ...project,
    name: resolvedName,
    description,
    desc: description,
    routePath: normalizedRoutePath,
    pathAlias: normalizedRoutePath,
    icon: project.icon || autoGameIcon(displaySeed),
    color: project.color || autoGameColor(displaySeed),
    tags: Array.isArray(project.tags) ? project.tags : [],
    createdAt: project.createdAt || new Date().toISOString(),
    updatedAt: project.updatedAt || new Date().toISOString(),
  };
}

function mergeDiscoveredProjects(currentProjects, discoveredProjects) {
  const discoveredMap = new Map(discoveredProjects.map((project) => [project.id, normalizeProject(project)]));
  const merged = [...currentProjects];

  discoveredMap.forEach((nextProject, projectId) => {
    const existingIndex = merged.findIndex((project) => project.id === projectId);

    if (existingIndex === -1) {
      merged.unshift(nextProject);
      return;
    }

    const existingProject = normalizeProject(merged[existingIndex]);
    const preferredName = String(existingProject.name || nextProject.name || '').trim() || nextProject.name;
    const preferredDescription = String(
      existingProject.description || existingProject.desc || nextProject.description || nextProject.desc || '',
    ).trim();
    const preferredRoutePath = normalizeRoutePath(
      existingProject.routePath || existingProject.pathAlias || nextProject.routePath || nextProject.pathAlias || '',
    );

    merged[existingIndex] = normalizeProject({
      ...nextProject,
      ...existingProject,
      path: nextProject.path,
      version: nextProject.version,
      packageManager: nextProject.packageManager,
      scripts: nextProject.scripts,
      engineType: nextProject.engineType,
      git: nextProject.git,
      lastModified: nextProject.lastModified,
      gamesRootRelative: nextProject.gamesRootRelative,
      gameFolders: nextProject.gameFolders,
      name: preferredName,
      description: preferredDescription,
      desc: preferredDescription,
      routePath: preferredRoutePath,
      pathAlias: preferredRoutePath,
      icon: existingProject.icon || nextProject.icon,
      color: existingProject.color || nextProject.color,
      tags: Array.isArray(existingProject.tags) && existingProject.tags.length > 0
        ? existingProject.tags
        : nextProject.tags,
    });
  });

  return merged;
}

function normalizeFolderName(rawValue) {
  return String(rawValue || '')
    .trim()
    .replace(/[\\/]+/g, '-')
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}._-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^[.-]+/, '')
    .slice(0, 64);
}

function toPosixPath(inputPath) {
  return String(inputPath || '').replace(/\\/g, '/');
}

function deriveWorkspaceRootFromProjectPath(projectPath) {
  const normalizedPath = toPosixPath(projectPath);
  const marker = '/src/games/';
  const markerIndex = normalizedPath.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return normalizedPath.slice(0, markerIndex) || '/';
}

function extractDeployUrl(rawOutput) {
  const urlMatches = String(rawOutput || '').match(/https?:\/\/[^\s"'`<>]+/g) || [];
  if (urlMatches.length === 0) {
    return '';
  }

  const normalizedUrls = urlMatches.map((url) => url.replace(/[),.;\]}]+$/, ''));
  return normalizedUrls.find((url) => url.includes('.vercel.app')) || normalizedUrls[0] || '';
}

const DEPLOY_STEP_ORDER = ['git-root', 'git-remote', 'git-add', 'git-diff', 'git-commit', 'git-push', 'vercel-deploy'];
const MIN_SPLIT_RATIO = 0.2;
const MAX_SPLIT_RATIO = 0.8;
const MAIN_SPLITTER_PX = 14;
const DEPLOY_STEP_LABELS = {
  'git-root': '저장소 루트 확인',
  'git-remote': 'origin 확인',
  'git-add': '변경사항 스테이징',
  'git-diff': '변경사항 검사',
  'git-commit': '커밋 생성',
  'git-push': '원격 푸시',
  'vercel-deploy': 'Vercel 배포',
};

function createInitialDeploySteps() {
  return DEPLOY_STEP_ORDER.map((stepKey) => ({
    stepKey,
    label: DEPLOY_STEP_LABELS[stepKey] || stepKey,
    status: 'pending',
  }));
}

function upsertDeployStep(steps, nextStepKey, updater) {
  return steps.map((step) => (
    step.stepKey === nextStepKey
      ? { ...step, ...updater(step) }
      : step
  ));
}

function trimDeployLog(logText, maxLength = 18000) {
  const text = String(logText || '');
  if (text.length <= maxLength) {
    return text;
  }

  return text.slice(text.length - maxLength);
}

function clampSplitRatio(value) {
  return Math.min(MAX_SPLIT_RATIO, Math.max(MIN_SPLIT_RATIO, value));
}

function resolveProjectPreviewUrl(project) {
  if (!project) {
    return '';
  }

  const routePath = normalizeRoutePath(
    project.routePath || project.pathAlias || deriveRoutePathFromProject(project),
  ) || '/';

  if (typeof window === 'undefined') {
    return routePath;
  }

  return `${window.location.origin}${routePath}`;
}

export default function ProjectManager() {
  const [projects, setProjects] = useState([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isAddLayerOpen, setIsAddLayerOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    routePath: '',
  });
  const [addLayerMode, setAddLayerMode] = useState('create');
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [addLayerError, setAddLayerError] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isDeployingProject, setIsDeployingProject] = useState(false);
  const [isDeployLayerOpen, setIsDeployLayerOpen] = useState(false);
  const [deployStatusText, setDeployStatusText] = useState('');
  const [deploySteps, setDeploySteps] = useState(() => createInitialDeploySteps());
  const [deployLogs, setDeployLogs] = useState('');
  const [deployUrl, setDeployUrl] = useState('');
  const [deployFinishedOk, setDeployFinishedOk] = useState(null);
  const [browserRefreshTick, setBrowserRefreshTick] = useState(0);
  const [splitRatio, setSplitRatio] = useState(0.4);
  const [isSplitResizing, setIsSplitResizing] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [workspaceRootHint, setWorkspaceRootHint] = useState(null);

  const menuPanelRef = useRef(null);
  const menuToggleRef = useRef(null);
  const terminalHostRef = useRef(null);
  const splitContainerRef = useRef(null);
  const terminalByProjectRef = useRef(new Map());

  const sessionByProjectRef = useRef(new Map());
  const projectBySessionRef = useRef(new Map());
  const activeProjectIdRef = useRef(null);
  const syncTerminalSizeRef = useRef(() => {});
  const activeDeployRequestIdRef = useRef(null);

  function disposeProjectTerminal(projectId) {
    const entry = terminalByProjectRef.current.get(projectId);
    if (!entry) {
      return;
    }

    entry.disposed = true;

    if (entry.inputDisposable) {
      entry.inputDisposable.dispose();
    }

    if (entry.terminal) {
      entry.terminal.dispose();
    }

    if (entry.hostElement && entry.hostElement.parentNode) {
      entry.hostElement.parentNode.removeChild(entry.hostElement);
    }

    terminalByProjectRef.current.delete(projectId);
  }

  function fitAndResizeProjectTerminal(projectId) {
    const entry = terminalByProjectRef.current.get(projectId);
    if (!entry || !entry.fitAddon || !entry.terminal) {
      return;
    }

    entry.fitAddon.fit();

    if (!entry.sessionId) {
      return;
    }

    resizeGeminiTerminalSession({
      sessionId: entry.sessionId,
      cols: entry.terminal.cols,
      rows: entry.terminal.rows,
    }).catch(() => {
      // Ignore resize errors while sessions are switching or closing.
    });
  }

  function showProjectTerminal(projectId) {
    terminalByProjectRef.current.forEach((entry, entryProjectId) => {
      if (!entry.hostElement) {
        return;
      }

      entry.hostElement.style.display = entryProjectId === projectId ? 'block' : 'none';
    });

    activeProjectIdRef.current = projectId || null;

    if (projectId) {
      fitAndResizeProjectTerminal(projectId);
    }
  }

  function startProjectSession(entry, project) {
    if (entry.disposed || entry.sessionId || entry.sessionPromise) {
      return;
    }

    entry.terminal.reset();
    entry.terminal.writeln(`[${project.name}] Gemini 세션 시작 중...`);

    entry.sessionPromise = createGeminiTerminalSession({
      projectPath: project.path,
      cols: entry.terminal.cols,
      rows: entry.terminal.rows,
      model: 'auto',
      fastMode: true,
    }).then((result) => {
      if (!result || !result.sessionId) {
        if (!entry.disposed) {
          entry.terminal.writeln('\r\n[터미널 세션 생성 실패]');
        }
        return;
      }

      if (entry.disposed) {
        closeGeminiTerminalSession({ sessionId: result.sessionId }).catch(() => {});
        return;
      }

      entry.sessionId = result.sessionId;
      sessionByProjectRef.current.set(project.id, result.sessionId);
      projectBySessionRef.current.set(result.sessionId, project.id);

      if (activeProjectIdRef.current === project.id) {
        fitAndResizeProjectTerminal(project.id);
      }
    }).catch((error) => {
      if (entry.disposed) {
        return;
      }

      const message = error instanceof Error ? error.message : '세션 생성 오류';
      entry.terminal.writeln(`\r\n[오류] ${message}`);
    }).finally(() => {
      entry.sessionPromise = null;
    });
  }

  async function ensureProjectTerminal(project) {
    if (!terminalHostRef.current) {
      return null;
    }

    const existing = terminalByProjectRef.current.get(project.id);
    if (existing) {
      startProjectSession(existing, project);
      return existing;
    }

    const hostElement = document.createElement('div');
    hostElement.className = 'terminal-pty-instance';
    hostElement.style.display = 'none';
    terminalHostRef.current.appendChild(hostElement);

    const terminal = new Terminal({
      cursorBlink: true,
      convertEol: true,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 14,
      lineHeight: 1.2,
      theme: {
        background: '#040913',
        foreground: '#d9e9ff',
        cursor: '#f9a03f',
        selectionBackground: '#2a3240',
      },
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(hostElement);

    const entry = {
      projectId: project.id,
      hostElement,
      terminal,
      fitAddon,
      sessionId: null,
      sessionPromise: null,
      inputDisposable: null,
      disposed: false,
    };

    entry.inputDisposable = terminal.onData((data) => {
      if (!entry.sessionId) {
        return;
      }

      writeGeminiTerminalSession({ sessionId: entry.sessionId, data }).catch(() => {
        // Ignore transient write errors while switching sessions.
      });
    });

    terminalByProjectRef.current.set(project.id, entry);
    startProjectSession(entry, project);

    return entry;
  }

  function closeProjectSession(projectId) {
    const sessionId = sessionByProjectRef.current.get(projectId);

    if (sessionId) {
      sessionByProjectRef.current.delete(projectId);
      projectBySessionRef.current.delete(sessionId);
      closeGeminiTerminalSession({ sessionId }).catch(() => {
        // Ignore close failures during shutdown or race conditions.
      });
    }

    if (activeProjectIdRef.current === projectId) {
      activeProjectIdRef.current = null;
    }

    disposeProjectTerminal(projectId);
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        const store = await loadStore();
        if (!isMounted) {
          return;
        }

        const loaded = (store.projects || []).map(normalizeProject);
        let nextProjects = loaded;

        if (isDesktopApp()) {
          const discovered = await discoverLocalProjects();
          if (!isMounted) {
            return;
          }

          if (discovered.length > 0) {
            nextProjects = mergeDiscoveredProjects(loaded, discovered);
          }
        }

        setProjects(nextProjects);
        setIsHydrated(true);
        setSelectedId(nextProjects[0]?.id || null);
      } catch (_error) {
        if (!isMounted) {
          return;
        }

        setProjects([]);
        setIsHydrated(true);
        setSelectedId(null);
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveStore({ projects }).catch(() => {
      // Ignore save failure to keep the UI simple.
    });
  }, [isHydrated, projects]);

  const filteredProjects = useMemo(() => {
    return [...projects].sort((a, b) => new Date(b.updatedAt).valueOf() - new Date(a.updatedAt).valueOf());
  }, [projects]);

  const selectedProject = useMemo(() => {
    if (!selectedId) {
      return null;
    }

    return projects.find((project) => project.id === selectedId) || null;
  }, [projects, selectedId]);

  const previewUrl = useMemo(
    () => resolveProjectPreviewUrl(selectedProject),
    [selectedProject?.id, selectedProject?.routePath, selectedProject?.pathAlias, selectedProject?.path],
  );
  const isAnyLayerOpen = isAddLayerOpen || isDeployLayerOpen;

  useEffect(() => {
    if (projects.length === 0) {
      if (selectedId) {
        setSelectedId(null);
      }
      return;
    }

    if (!selectedId || !projects.some((project) => project.id === selectedId)) {
      setSelectedId(projects[0].id);
    }
  }, [projects, selectedId]);

  useEffect(() => {
    if (!isDesktopApp()) {
      return;
    }

    const activeProjectIds = new Set(projects.map((project) => project.id));

    Array.from(sessionByProjectRef.current.keys()).forEach((projectId) => {
      if (!activeProjectIds.has(projectId)) {
        closeProjectSession(projectId);
      }
    });
  }, [projects]);

  useEffect(() => {
    if (!isDesktopApp()) {
      return;
    }

    let cancelled = false;

    getWorkspaceRoot().then((workspaceRoot) => {
      if (cancelled || !workspaceRoot) {
        return;
      }

      setWorkspaceRootHint(toPosixPath(workspaceRoot));
    }).catch(() => {
      // Ignore unavailable workspace hint.
    });

    return () => {
      cancelled = true;
    };
  }, []);

  function resolveWorkspaceRootPath() {
    const workspaceTaggedProject = projects.find((project) => Array.isArray(project.tags) && project.tags.includes('workspace'));
    if (workspaceTaggedProject?.path) {
      return workspaceTaggedProject.path;
    }

    const selectedProject = projects.find((project) => project.id === selectedId);
    const selectedDerivedRoot = deriveWorkspaceRootFromProjectPath(selectedProject?.path);
    if (selectedDerivedRoot) {
      return selectedDerivedRoot;
    }

    const firstDerivedRoot = projects
      .map((project) => deriveWorkspaceRootFromProjectPath(project.path))
      .find(Boolean);

    if (firstDerivedRoot) {
      return firstDerivedRoot;
    }

    if (workspaceRootHint) {
      return workspaceRootHint;
    }

    return null;
  }

  function openAddProjectLayer() {
    setAddForm({
      name: '',
      description: '',
      routePath: '',
    });
    setAddLayerMode('create');
    setEditingProjectId(null);
    setAddLayerError('');
    setIsAddLayerOpen(true);
  }

  function openEditProjectLayer(project) {
    if (!project) {
      return;
    }

    const normalizedRoutePath = normalizeRoutePath(
      project.routePath || project.pathAlias || deriveRoutePathFromProject(project),
    );

    setAddForm({
      name: String(project.name || '').trim(),
      description: String(project.description || project.desc || '').trim(),
      routePath: normalizedRoutePath,
    });
    setAddLayerMode('edit');
    setEditingProjectId(project.id);
    setAddLayerError('');
    setIsAddLayerOpen(true);
  }

  function closeAddProjectLayer() {
    setIsAddLayerOpen(false);
    setAddLayerMode('create');
    setEditingProjectId(null);
    setAddLayerError('');
  }

  async function handleCreateProjectFromLayer(event) {
    event.preventDefault();
    if (isCreatingProject) {
      return;
    }

    const isEditMode = addLayerMode === 'edit' && Boolean(editingProjectId);
    const editingProject = isEditMode
      ? projects.find((project) => project.id === editingProjectId) || null
      : null;

    const menuTitle = String(addForm.name || '').trim();
    if (!menuTitle) {
      setAddLayerError('메뉴명(한글 제목)을 입력해주세요.');
      return;
    }

    if (!/[가-힣]/.test(menuTitle)) {
      setAddLayerError('메뉴명은 한글 제목으로 입력해주세요.');
      return;
    }

    const normalizedRoutePath = normalizeRoutePath(addForm.routePath);
    if (!normalizedRoutePath) {
      setAddLayerError('path를 입력해주세요. 예: /proverb');
      return;
    }

    if (isEditMode && !editingProject) {
      setAddLayerError('수정할 프로젝트를 찾지 못했습니다.');
      return;
    }

    const displayName = menuTitle;
    const description = String(addForm.description || '').trim();
    const nowIso = new Date().toISOString();

    setIsCreatingProject(true);
    setAddLayerError('');

    try {
      let nextProject;

      if (isEditMode && editingProject) {
        nextProject = normalizeProject({
          ...editingProject,
          name: displayName,
          description,
          desc: description,
          routePath: normalizedRoutePath,
          pathAlias: normalizedRoutePath,
          icon: editingProject.icon || autoGameIcon(displayName),
          color: editingProject.color || autoGameColor(displayName),
          updatedAt: nowIso,
        });
      } else {
        const normalizedFolderName = folderNameFromRoutePath(normalizedRoutePath);
        if (!normalizedFolderName) {
          throw new Error('path 마지막 이름을 폴더명으로 사용할 수 없습니다.');
        }

        const workspaceRootPath = resolveWorkspaceRootPath();
        if (!workspaceRootPath) {
          throw new Error('워크스페이스 경로를 찾을 수 없습니다.');
        }

        const gameProjectPath = toPosixPath(`${workspaceRootPath}/${GAMES_ROOT_RELATIVE}/${normalizedFolderName}`);

        if (isDesktopApp()) {
          await createGameFolder({
            projectPath: workspaceRootPath,
            folderName: normalizedFolderName,
          });

          const scanned = await scanProject(gameProjectPath);
          if (!scanned) {
            throw new Error('프로젝트 정보를 읽지 못했습니다.');
          }

          nextProject = normalizeProject({
            ...scanned,
            name: displayName,
            description,
            desc: description,
            routePath: normalizedRoutePath,
            pathAlias: normalizedRoutePath,
            icon: autoGameIcon(displayName),
            color: autoGameColor(displayName),
            engineType: scanned.engineType === 'General' ? 'Game Module' : scanned.engineType,
            tags: ['local-game', normalizedFolderName],
            updatedAt: nowIso,
          });

          const discovered = await discoverLocalProjects();
          if (discovered.length > 0) {
            setProjects((prev) => mergeDiscoveredProjects(prev, discovered));
          }
        } else {
          nextProject = normalizeProject({
            id: `local-${normalizedFolderName}-${Date.now()}`,
            name: displayName,
            description,
            desc: description,
            routePath: normalizedRoutePath,
            pathAlias: normalizedRoutePath,
            path: gameProjectPath,
            version: null,
            packageManager: 'npm',
            scripts: [],
            engineType: 'Game Module',
            git: false,
            lastModified: nowIso,
            gamesRootRelative: GAMES_ROOT_RELATIVE,
            gameFolders: [],
            tags: ['local-game', normalizedFolderName],
            icon: autoGameIcon(displayName),
            color: autoGameColor(displayName),
            updatedAt: nowIso,
          });
        }
      }

      setProjects((prev) => {
        const existingIndex = prev.findIndex((project) => project.id === nextProject.id);
        if (existingIndex === -1) {
          return [nextProject, ...prev];
        }

        const clone = [...prev];
        clone[existingIndex] = {
          ...clone[existingIndex],
          ...nextProject,
        };

        return clone;
      });

      setSelectedId(nextProject.id);
      setIsAddLayerOpen(false);
      setAddLayerMode('create');
      setEditingProjectId(null);
      setAddForm({
        name: '',
        description: '',
        routePath: '',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '프로젝트를 생성하지 못했습니다.';
      setAddLayerError(message);
    } finally {
      setIsCreatingProject(false);
    }
  }

  async function handleDeleteProject(projectId) {
    if (!projectId) {
      return;
    }

    const targetProject = projects.find((project) => project.id === projectId);
    const targetLabel = targetProject ? targetProject.name : '프로젝트';
    const shouldDelete = window.confirm(`"${targetLabel}"를 정말 삭제할까요?`);

    if (!shouldDelete) {
      return;
    }

    if (isDesktopApp() && targetProject) {
      const workspaceRootPath = resolveWorkspaceRootPath();
      const folderName = deriveFolderNameFromProject(targetProject);
      const isLocalGameProject = Array.isArray(targetProject.tags) && targetProject.tags.includes('local-game');
      const isGamesPathProject = toPosixPath(targetProject.path).includes('/src/games/');

      if (workspaceRootPath && folderName && (isLocalGameProject || isGamesPathProject)) {
        try {
          await deleteGameFolder({
            projectPath: workspaceRootPath,
            folderName,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : '게임 폴더 삭제 실패';

          // If the folder is already missing, proceed with removing the stale list item.
          if (!message.includes('찾지 못했습니다')) {
            window.alert(message);
            return;
          }
        }
      }
    }

    closeProjectSession(projectId);

    const nextProjects = projects.filter((project) => project.id !== projectId);
    setProjects(nextProjects);

    if (selectedId === projectId) {
      setSelectedId(nextProjects[0]?.id || null);
    }
  }

  async function handleDeploySelectedProject() {
    if (isDeployingProject) {
      setIsDeployLayerOpen(true);
      return;
    }

    if (!selectedProject) {
      return;
    }

    const shouldDeploy = window.confirm('배포 할까요?');

    if (!shouldDeploy) {
      return;
    }

    const deployRequestId = `deploy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    activeDeployRequestIdRef.current = deployRequestId;

    setIsDeployLayerOpen(true);
    setDeployStatusText('배포를 시작합니다...');
    setDeploySteps(createInitialDeploySteps());
    setDeployLogs('');
    setDeployUrl('');
    setDeployFinishedOk(null);
    setIsDeployingProject(true);

    try {
      const deployRoutePath = normalizeRoutePath(
        selectedProject.routePath || selectedProject.pathAlias || deriveRoutePathFromProject(selectedProject),
      );

      const result = await deployProjectToVercel({
        projectPath: selectedProject.path,
        routePath: deployRoutePath,
        requestId: deployRequestId,
      });

      const combinedLog = [result.stdout, result.stderr].filter(Boolean).join('\n');
      const nextDeployUrl = extractDeployUrl(combinedLog);
      if (nextDeployUrl) {
        setDeployUrl(nextDeployUrl);
      }
      if (combinedLog) {
        setDeployLogs((prev) => trimDeployLog(`${prev}${prev ? '\n' : ''}${combinedLog}`));
      }

      if (result.timedOut) {
        setDeployStatusText('배포 시간이 초과되었습니다.');
        setDeployFinishedOk(false);
        return;
      }

      if (result.exitCode === 0) {
        setDeployStatusText(nextDeployUrl ? `배포 완료: ${nextDeployUrl}` : '배포 완료');
        setDeployFinishedOk(true);
        return;
      }

      setDeployStatusText('배포 실패');
      setDeployFinishedOk(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : '배포 실행 중 오류가 발생했습니다.';
      setDeployStatusText(message);
      setDeployFinishedOk(false);
    } finally {
      setIsDeployingProject(false);
    }
  }

  function closeDeployLayer() {
    setIsDeployLayerOpen(false);
  }

  function startSplitResize(event) {
    event.preventDefault();
    setIsSplitResizing(true);
  }

  function handleOpenPublicService() {
    openExternalUrl(PUBLIC_SERVICE_URL).catch(() => {
      // Ignore open failures to keep UI simple.
    });
  }

  useEffect(() => {
    if (!isSplitResizing) {
      return;
    }

    function handleMouseMove(event) {
      const container = splitContainerRef.current;
      if (!container) {
        return;
      }

      const rect = container.getBoundingClientRect();
      if (!rect || rect.width <= 0) {
        return;
      }

      const nextRatio = clampSplitRatio((event.clientX - rect.left) / rect.width);
      setSplitRatio(nextRatio);
    }

    function stopSplitResize() {
      setIsSplitResizing(false);
    }

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopSplitResize);
    window.addEventListener('blur', stopSplitResize);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopSplitResize);
      window.removeEventListener('blur', stopSplitResize);
    };
  }, [isSplitResizing]);

  useEffect(() => {
    if (!isDesktopApp() || !terminalHostRef.current) {
      return;
    }

    const unsubscribeData = onGeminiTerminalData(({ sessionId, data }) => {
      const projectId = projectBySessionRef.current.get(sessionId);
      if (!projectId) {
        return;
      }

      const entry = terminalByProjectRef.current.get(projectId);
      if (!entry || entry.disposed || !entry.terminal) {
        return;
      }

      entry.terminal.write(data);
    });

    const unsubscribeExit = onGeminiTerminalExit(({ sessionId, exitCode }) => {
      const projectId = projectBySessionRef.current.get(sessionId);
      if (!projectId) {
        return;
      }

      if (sessionByProjectRef.current.get(projectId) === sessionId) {
        sessionByProjectRef.current.delete(projectId);
      }
      projectBySessionRef.current.delete(sessionId);

      const entry = terminalByProjectRef.current.get(projectId);
      if (!entry || entry.disposed) {
        return;
      }

      entry.sessionId = null;
      entry.terminal.writeln(`\r\n[세션 종료: ${exitCode}]`);
    });

    function syncTerminalSize() {
      const activeProjectId = activeProjectIdRef.current;
      if (!activeProjectId) {
        return;
      }

      fitAndResizeProjectTerminal(activeProjectId);
    }

    syncTerminalSizeRef.current = syncTerminalSize;

    const resizeObserver = new ResizeObserver(() => syncTerminalSize());
    resizeObserver.observe(terminalHostRef.current);
    window.addEventListener('resize', syncTerminalSize);

    return () => {
      unsubscribeData();
      unsubscribeExit();
      resizeObserver.disconnect();
      window.removeEventListener('resize', syncTerminalSize);
      syncTerminalSizeRef.current = () => {};

      const allProjectIds = new Set([
        ...sessionByProjectRef.current.keys(),
        ...terminalByProjectRef.current.keys(),
      ]);

      Array.from(allProjectIds).forEach((projectId) => {
        closeProjectSession(projectId);
      });

      sessionByProjectRef.current.clear();
      projectBySessionRef.current.clear();
      terminalByProjectRef.current.clear();
      activeProjectIdRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isDesktopApp()) {
      return;
    }

    const unsubscribe = onProjectDeployProgress((eventPayload) => {
      const requestId = String(eventPayload?.requestId || '');
      if (!requestId || requestId !== activeDeployRequestIdRef.current) {
        return;
      }

      const payloadType = String(eventPayload?.type || '');

      if (payloadType === 'status') {
        const message = String(eventPayload?.message || '').trim();
        if (message) {
          setDeployStatusText(message);
        }
        return;
      }

      if (payloadType === 'step-start') {
        const stepKey = String(eventPayload?.stepKey || '');
        if (!stepKey) {
          return;
        }

        setDeploySteps((prev) => upsertDeployStep(prev, stepKey, () => ({ status: 'running' })));
        return;
      }

      if (payloadType === 'step-end') {
        const stepKey = String(eventPayload?.stepKey || '');
        if (!stepKey) {
          return;
        }

        const exitCode = Number(eventPayload?.exitCode);
        const timedOut = Boolean(eventPayload?.timedOut);
        const nextStatus = timedOut ? 'error' : (exitCode === 0 ? 'done' : 'error');
        setDeploySteps((prev) => upsertDeployStep(prev, stepKey, () => ({ status: nextStatus })));
        return;
      }

      if (payloadType === 'output') {
        const chunk = String(eventPayload?.chunk || '');
        if (!chunk) {
          return;
        }

        setDeployLogs((prev) => trimDeployLog(`${prev}${chunk}`));
        const foundUrl = extractDeployUrl(chunk);
        if (foundUrl) {
          setDeployUrl(foundUrl);
        }
        return;
      }

      if (payloadType === 'complete') {
        const ok = Boolean(eventPayload?.ok);
        const message = String(eventPayload?.message || '').trim();
        setDeployFinishedOk(ok);
        if (message) {
          setDeployStatusText(message);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isDesktopApp() || !terminalHostRef.current) {
      return;
    }

    let cancelled = false;

    async function activateProjectTerminal() {
      if (!selectedProject) {
        showProjectTerminal(null);
        return;
      }

      const entry = await ensureProjectTerminal(selectedProject);
      if (cancelled || !entry) {
        return;
      }

      showProjectTerminal(selectedProject.id);

      if (entry.sessionPromise) {
        await entry.sessionPromise;
      }

      if (!cancelled) {
        syncTerminalSizeRef.current();
      }
    }

    activateProjectTerminal();

    return () => {
      cancelled = true;
    };
  }, [selectedProject?.id, selectedProject?.path, selectedProject?.name]);

  useEffect(() => {
    if (!isMenuExpanded || isAnyLayerOpen) {
      return;
    }

    function handleOutsideMenuClick(event) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (menuPanelRef.current?.contains(target)) {
        return;
      }

      if (menuToggleRef.current?.contains(target)) {
        return;
      }

      setIsMenuExpanded(false);
    }

    document.addEventListener('mousedown', handleOutsideMenuClick);
    document.addEventListener('touchstart', handleOutsideMenuClick, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleOutsideMenuClick);
      document.removeEventListener('touchstart', handleOutsideMenuClick);
    };
  }, [isMenuExpanded, isAnyLayerOpen]);

  useEffect(() => {
    if (!isAnyLayerOpen) {
      return;
    }

    function handleLayerEscape(event) {
      if (event.key !== 'Escape') {
        return;
      }

      event.preventDefault();

      if (isAddLayerOpen) {
        closeAddProjectLayer();
        return;
      }

      if (isDeployLayerOpen) {
        closeDeployLayer();
      }
    }

    document.addEventListener('keydown', handleLayerEscape);
    return () => {
      document.removeEventListener('keydown', handleLayerEscape);
    };
  }, [isAnyLayerOpen, isAddLayerOpen, isDeployLayerOpen]);

  return (
    <div className="manager-shell h-screen box-border text-[#E8F0FA] p-3 overflow-hidden">
      <div className="manager-noise" aria-hidden="true" />

      <div ref={menuPanelRef} className={`manager-floating-menu ${isMenuExpanded ? 'is-open' : 'is-collapsed'}`}>
        <section className="panel-shell manager-floating-menu-panel p-3 h-full flex flex-col overflow-hidden">
          <div className="space-y-2 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
            {filteredProjects.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#38506A] px-4 py-5 text-sm text-[#8FA4B8]">
                프로젝트가 없습니다.
              </div>
            )}

            {filteredProjects.map((project) => (
              <div key={project.id} className="project-card-wrap">
                <div
                  className={`project-card ${project.id === selectedId ? 'is-active' : ''}`}
                  onClick={() => setSelectedId(project.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedId(project.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-pressed={project.id === selectedId}
                >
                  <h3 className="text-[14px] leading-tight font-semibold tracking-tight">{project.name}</h3>
                </div>
                <div className="project-card-actions">
                  <button
                    className="project-card-action project-card-edit"
                    onClick={() => openEditProjectLayer(project)}
                    type="button"
                    aria-label={`${project.name} 수정`}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                      <path
                        d="M3 17.25V21h3.75L17.8 9.95l-3.75-3.75L3 17.25zm2.92 2.33H5v-.92l8.07-8.07.92.92L5.92 19.58zM20.71 7.04a1 1 0 0 0 0-1.41L18.37 3.3a1 1 0 0 0-1.41 0L15.1 5.16l3.75 3.75 1.86-1.87z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                  <button
                    className="project-card-action project-card-delete"
                    onClick={() => handleDeleteProject(project.id)}
                    type="button"
                    aria-label={`${project.name} 삭제`}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
                      <path
                        d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM8 9h2v8H8V9zm-1 12h10a2 2 0 0 0 2-2V8H5v11a2 2 0 0 0 2 2z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 shrink-0 flex items-center gap-2">
            <button
              className="manager-btn flex-1 h-10 px-4 text-[14px] whitespace-nowrap"
              onClick={handleDeploySelectedProject}
              type="button"
              disabled={!selectedProject}
            >
              {isDeployingProject ? '배포 중...' : '배포'}
            </button>
            <button className="manager-btn manager-btn-primary flex-1 h-10 px-3 text-[14px]" onClick={openAddProjectLayer} type="button">
              프로젝트 추가
            </button>
          </div>
        </section>
      </div>

      <button
        ref={menuToggleRef}
        className={`manager-menu-toggle ${isMenuExpanded ? 'is-open' : 'is-collapsed'}`}
        type="button"
        onClick={() => setIsMenuExpanded((prev) => !prev)}
        aria-label={isMenuExpanded ? '메뉴 접기' : '메뉴 펼치기'}
      >
        {isMenuExpanded ? (
          <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
            <path d="M5 5 15 15M15 5 5 15" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false">
            <rect x="3" y="3.7" width="14" height="2.6" rx="1.3" fill="currentColor" />
            <rect x="3" y="8.7" width="14" height="2.6" rx="1.3" fill="currentColor" />
            <rect x="3" y="13.7" width="14" height="2.6" rx="1.3" fill="currentColor" />
          </svg>
        )}
      </button>

      <main className="relative z-10 h-full">
        <div ref={splitContainerRef} className={`manager-main-split ${isSplitResizing ? 'is-resizing' : ''}`}>
          <section
            className="panel-shell manager-main-outer-panel manager-main-outer-panel-left p-0 h-full min-w-0 overflow-hidden"
            style={{ flex: `0 0 calc(${splitRatio * 100}% - ${MAIN_SPLITTER_PX / 2}px)` }}
          >
            <div className="h-full relative">
              <div ref={terminalHostRef} className="terminal-pty-host manager-center-terminal-host manager-main-content-surface" />

              {!selectedProject && (
                <div className="absolute inset-0 flex items-center justify-center text-[#95A8BA] text-center pointer-events-none">
                  <p>프로젝트를 선택하세요.</p>
                </div>
              )}
            </div>
          </section>

          <div
            className={`manager-splitter ${isSplitResizing ? 'is-active' : ''}`}
            onMouseDown={startSplitResize}
            role="separator"
            aria-orientation="vertical"
            aria-label="패널 크기 조절"
          />

          <section
            className="panel-shell manager-main-outer-panel manager-main-outer-panel-right p-0 h-full min-w-0 flex flex-col overflow-hidden relative"
            style={{ flex: `0 0 calc(${(1 - splitRatio) * 100}% - ${MAIN_SPLITTER_PX / 2}px)` }}
          >
            <div className="manager-browser-actions">
              <button
                className="manager-url-link h-8 px-3 text-[11px] leading-none font-semibold"
                type="button"
                onClick={handleOpenPublicService}
                aria-label="배포 서비스 열기"
                title={PUBLIC_SERVICE_URL}
              >
                게임바로가기
              </button>
              <button
                className="manager-icon-btn h-8 w-8 px-0 inline-flex items-center justify-center"
                type="button"
                onClick={() => setBrowserRefreshTick((prev) => prev + 1)}
                disabled={!previewUrl}
                aria-label="브라우저 새로고침"
              >
                <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
                  <path
                    d="M16.8 9.2a6.8 6.8 0 1 1-1.9-4.7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16.8 3.8v4.5h-4.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <div className="manager-browser-surface manager-main-content-surface flex-1 min-h-0 overflow-hidden">
              {selectedProject && previewUrl ? (
                <iframe
                  key={`${previewUrl}-${browserRefreshTick}`}
                  title={`${selectedProject.name} 미리보기`}
                  src={previewUrl}
                  className="w-full h-full border-0 bg-[#020712]"
                />
              ) : (
                <div className="h-full flex items-center justify-center text-[#95A8BA] text-sm">
                  프로젝트를 선택하세요.
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      {isAddLayerOpen && (
        <div className="manager-modal-backdrop" onClick={closeAddProjectLayer} role="presentation">
          <div
            className="manager-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label={addLayerMode === 'edit' ? '프로젝트 수정' : '프로젝트 추가'}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">{addLayerMode === 'edit' ? '프로젝트 수정' : '프로젝트 추가'}</h3>
            <form className="mt-3 space-y-3" onSubmit={handleCreateProjectFromLayer}>
              <label className="manager-field-label" htmlFor="project-add-title">
                메뉴명 (한글 제목)
              </label>
              <input
                id="project-add-title"
                className="manager-input"
                value={addForm.name}
                onChange={(event) => setAddForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="예: 좀비 서바이벌"
                disabled={isCreatingProject}
                autoFocus
              />

              <label className="manager-field-label" htmlFor="project-add-description">
                설명
              </label>
              <input
                id="project-add-description"
                className="manager-input"
                value={addForm.description}
                onChange={(event) => setAddForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="예: 무한 난이도 속담 퀴즈! 당신의 어휘력을 테스트하세요."
                disabled={isCreatingProject}
              />

              <label className="manager-field-label" htmlFor="project-add-route-path">
                path(폴더경로)
              </label>
              <input
                id="project-add-route-path"
                className="manager-input"
                value={addForm.routePath}
                onChange={(event) => setAddForm((prev) => ({ ...prev, routePath: event.target.value }))}
                placeholder="예: /proverb"
                disabled={isCreatingProject}
              />

              {addLayerError && <p className="text-sm text-[#ffb3b3]">{addLayerError}</p>}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button className="manager-btn inline-flex items-center justify-center leading-none h-9 px-4 text-sm" type="button" onClick={closeAddProjectLayer} disabled={isCreatingProject}>
                  취소
                </button>
                <button className="manager-btn manager-btn-primary inline-flex items-center justify-center leading-none h-9 px-4 text-sm" type="submit" disabled={isCreatingProject}>
                  {isCreatingProject
                    ? (addLayerMode === 'edit' ? '수정 중...' : '생성 중...')
                    : (addLayerMode === 'edit' ? '수정' : '생성')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeployLayerOpen && (
        <div className="manager-modal-backdrop" onClick={closeDeployLayer} role="presentation">
          <div
            className="manager-modal-card manager-deploy-modal"
            role="dialog"
            aria-modal="true"
            aria-label="배포 진행상황"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">배포 진행상황</h3>
              </div>
              <span className={`text-xs font-semibold ${
                deployFinishedOk == null
                  ? 'text-[#b9cde0]'
                  : deployFinishedOk
                    ? 'text-[#98e7b2]'
                    : 'text-[#ffb3b3]'
              }`}
              >
                {isDeployingProject ? '진행 중' : (deployFinishedOk ? '완료' : '실패')}
              </span>
            </div>

            <p className="mt-3 text-sm text-[#d5e4f3]">{deployStatusText || '로그 대기 중...'}</p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {deploySteps.map((step) => (
                <div key={step.stepKey} className="rounded-xl border border-[#2c4259] bg-[#08111d] px-3 py-2 flex items-center justify-between gap-3">
                  <span className="text-xs text-[#c5d5e6]">{step.label}</span>
                  <span className={`text-[11px] font-semibold ${
                    step.status === 'done'
                      ? 'text-[#98e7b2]'
                      : step.status === 'error'
                        ? 'text-[#ffb3b3]'
                        : step.status === 'running'
                          ? 'text-[#f9cf8d]'
                          : 'text-[#7f96ac]'
                  }`}
                  >
                    {step.status === 'done'
                      ? '완료'
                      : step.status === 'error'
                        ? '실패'
                        : step.status === 'running'
                          ? '진행'
                          : '대기'}
                  </span>
                </div>
              ))}
            </div>

            <pre className="manager-log mt-3 custom-scrollbar h-[260px]">{deployLogs || '[출력 없음]'}</pre>

            {deployUrl && (
              <div className="mt-2 text-xs text-[#9bc8ff] break-all">{deployUrl}</div>
            )}

            <div className="mt-3 flex items-center justify-end">
              <button
                className="manager-btn inline-flex items-center justify-center leading-none h-9 px-4 text-sm"
                type="button"
                onClick={closeDeployLayer}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
