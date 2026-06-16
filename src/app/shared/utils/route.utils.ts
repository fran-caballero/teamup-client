import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  UrlSegment,
} from '@angular/router';
import { filter, map, merge, Observable, of, switchMap } from 'rxjs';

export function getRoute(
  route: ActivatedRoute,
  router: Router,
): Observable<UrlSegment[]> {
  const getLeafRoute = (route: ActivatedRoute): ActivatedRoute => {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  };

  const initialRoute$ = of(getLeafRoute(route).snapshot?.url);

  const navigationEnd$ = router.events.pipe(
    filter((event) => event instanceof NavigationEnd),
    map(() => getLeafRoute(route)),
    switchMap((route) => route.url),
  );

  return merge(initialRoute$, navigationEnd$);
}
