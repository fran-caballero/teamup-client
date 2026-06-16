import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { WorkspaceService } from '@core/services/workspace.service';
import { filter, map, Observable, take } from 'rxjs';

export function listExistsGuard(
  route: ActivatedRouteSnapshot,
): boolean | Observable<boolean> {
  const router = inject(Router);
  const workspaceService = inject(WorkspaceService);
  const spaceId = route.paramMap.get('spaceIdFromRoute');
  const folderId = route.paramMap.get('folderIdFromRoute');
  const listId = route.paramMap.get('listIdFromRoute');

  if (!listId) {
    router.navigate(['/404']);
    return false;
  }

  return toObservable(workspaceService.mappedWorkspace).pipe(
    filter((workspace) => !!workspace),
    take(1),
    map((workspace) => {
      const isSpaceValid =
        (spaceId && workspace.spacesMap.has(spaceId)) || !spaceId;
      const isFolderValid =
        (folderId && workspace.foldersMap.has(folderId)) || !folderId;

      if (isSpaceValid && isFolderValid && workspace.listsMap.has(listId)) {
        return true;
      } else {
        router.navigate(['/404']);
        return false;
      }
    }),
  );
}
