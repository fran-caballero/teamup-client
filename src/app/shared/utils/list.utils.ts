import { Status } from '@shared/types/entities.types';

export function filterListStatuses(
  listStatuses: Status[] | undefined,
  listStatusType: Status['type'],
): Status[] | undefined {
  if (!listStatuses) {
    return;
  }
  return listStatuses.filter((status) => status.type === listStatusType);
}

export function normalizeStatusName(
  statusName: string | null | undefined,
): string {
  return statusName?.trim().toUpperCase() ?? '';
}

export function hasDuplicateStatusNameInList(
  listStatuses: Status[] | null | undefined,
  statusName: string | null | undefined,
  excludedStatusId?: string,
): boolean {
  const normalizedStatusName = normalizeStatusName(statusName);

  if (!normalizedStatusName) {
    return false;
  }

  return !!listStatuses?.some(
    (status) =>
      status.id !== excludedStatusId &&
      normalizeStatusName(status.name) === normalizedStatusName,
  );
}
