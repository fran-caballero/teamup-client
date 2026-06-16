import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { WorkspaceService } from '@core/services/workspace.service';
import { filter, map, Observable, take } from 'rxjs';

export function spaceExistsGuard(
  route: ActivatedRouteSnapshot,
): boolean | Observable<boolean> {
  const router = inject(Router);
  const workspaceService = inject(WorkspaceService);

  const spaceId = route.paramMap.get('spaceIdFromRoute');

  if (!spaceId) {
    router.navigate(['/404']);
    return false;
  }

  if (spaceId) {
    if (workspaceService.mappedWorkspace()?.spacesMap.has(spaceId)) {
      return true;
    }
  }

  return toObservable(workspaceService.mappedWorkspace).pipe(
    filter((workspace) => !!workspace),
    take(1),
    map((workspace) => {
      if (workspace.spacesMap.has(spaceId)) {
        return true;
      } else {
        router.navigate(['/404']);
        return false;
      }
    }),
  );
}
