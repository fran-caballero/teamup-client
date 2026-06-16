export function getSpaceLink(spaceId: string): string {
  return `/spaces/${spaceId}`;
}

export function getFolderLink(spaceId: string, folderId: string): string {
  return `/spaces/${spaceId}/folders/${folderId}`;
}

export function getListLink(
  spaceId: string,
  folderId: string | null,
  listId: string,
): string {
  if (folderId) {
    return `/spaces/${spaceId}/folders/${folderId}/lists/${listId}`;
  }
  return `/spaces/${spaceId}/lists/${listId}`;
}

export function buildTaskLinkArray(
  spaceId: string | null,
  folderId: string | null,
  listId: string,
  taskId: string,
): string[] {
  const finalLinkArray = ['/'];

  if (!spaceId) {
    finalLinkArray.push('personal-list', taskId);
    return finalLinkArray;
  }
  finalLinkArray.push('spaces', spaceId);

  if (folderId) {
    finalLinkArray.push('folders', folderId);
  }
  finalLinkArray.push('lists', listId, 'tasks', taskId);

  return finalLinkArray;
}
