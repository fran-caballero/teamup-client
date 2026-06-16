export function hasProperty<T>(obj: unknown, property: keyof T): obj is T {
  return typeof obj === 'object' && obj !== null && property in obj;
}

export function parseDatesCustomizer(
  value: unknown,
  key: unknown,
): Date | void {
  if (
    typeof key === 'string' &&
    typeof value === 'string' &&
    ['createdAt', 'updatedAt', 'dueDate'].includes(key)
  ) {
    return new Date(value);
  }
}
