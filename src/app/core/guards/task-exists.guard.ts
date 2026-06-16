import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { UserService } from '@core/services/user.service';
import { WorkspaceService } from '@core/services/workspace.service';
import { combineLatest, filter, map, Observable, take } from 'rxjs';

export function taskExistsGuard(
  route: ActivatedRouteSnapshot,
): boolean | Observable<boolean> {
  const router = inject(Router);
  const workspaceService = inject(WorkspaceService);
  const userService = inject(UserService);
  const spaceId = route.paramMap.get('spaceIdFromRoute');
  const folderId = route.paramMap.get('folderIdFromRoute');
  const listId = route.paramMap.get('listIdFromRoute');
  const taskId = route.paramMap.get('taskIdFromRoute');

  if (!taskId) {
    router.navigate(['/404']);
    return false;
  }

  const workspace$ = toObservable(workspaceService.mappedWorkspace);
  const personalList$ = toObservable(userService.mappedPersonalList);

  return combineLatest([workspace$, personalList$]).pipe(
    filter(([workspace, personalList]) => !!workspace && !!personalList),
    take(1),
    map(([workspace, personalList]) => {
      const isSpaceValid =
        (spaceId && workspace!.spacesMap.has(spaceId)) || !spaceId;
      const isFolderValid =
        (folderId && workspace!.foldersMap.has(folderId)) || !folderId;
      const isListValid =
        (listId && workspace!.listsMap.has(listId)) || !listId;

      if (
        (isSpaceValid &&
          isFolderValid &&
          isListValid &&
          workspace!.tasksMap.has(taskId)) ||
        personalList!.has(taskId)
      ) {
        return true;
      } else {
        router.navigate(['/404']);
        return false;
      }
    }),
  );
}
