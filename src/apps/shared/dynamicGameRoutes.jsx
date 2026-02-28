import React, { Suspense, lazy, useMemo } from 'react';

const gameEntryLoaders = {
  ...import.meta.glob('../../games/*/*Game.{jsx,tsx,js,ts}'),
  ...import.meta.glob('../../games/*/App.{jsx,tsx,js,ts}'),
  ...import.meta.glob('../../games/*/index.{jsx,tsx,js,ts}'),
};

function entryPriority(filePath) {
  if (/\/[^/]+Game\.(jsx|tsx|js|ts)$/.test(filePath)) {
    return 3;
  }

  if (/\/App\.(jsx|tsx|js|ts)$/.test(filePath)) {
    return 2;
  }

  return 1;
}

function folderFromPath(filePath) {
  const match = String(filePath || '').match(/\/games\/([^/]+)\//);
  return match?.[1] || '';
}

const loaderByFolder = new Map();

Object.entries(gameEntryLoaders).forEach(([filePath, loader]) => {
  const folderName = folderFromPath(filePath);
  if (!folderName) {
    return;
  }

  const nextEntry = {
    filePath,
    loader,
    priority: entryPriority(filePath),
  };

  const previousEntry = loaderByFolder.get(folderName);
  if (!previousEntry || nextEntry.priority > previousEntry.priority) {
    loaderByFolder.set(folderName, nextEntry);
  }
});

export const dynamicGameRouteDefs = Array.from(loaderByFolder.entries())
  .sort(([left], [right]) => left.localeCompare(right, 'en'))
  .map(([folderName, entry]) => ({
    folderName,
    path: `/${folderName}`,
    loadEntry: entry.loader,
    sourceFile: entry.filePath,
  }));

export function DynamicGameRoute({ routePath, loadEntry }) {
  const LazyGameComponent = useMemo(
    () => lazy(async () => {
      try {
        const gameModule = await loadEntry();
        const Component = gameModule?.default;

        if (!Component) {
          throw new Error('게임 엔트리의 default export를 찾지 못했습니다.');
        }

        return { default: Component };
      } catch (error) {
        console.error(`[GameRoute] "${routePath}" 로드 실패`, error);
        return { default: () => <div className="h-full w-full bg-[#020712]" /> };
      }
    }),
    [loadEntry, routePath],
  );

  return (
    <Suspense fallback={<div className="h-full w-full bg-[#020712]" />}>
      <LazyGameComponent />
    </Suspense>
  );
}
