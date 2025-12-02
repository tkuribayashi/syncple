/**
 * 型ガード関数
 * オプショナルなidプロパティを持つオブジェクトが、実際にidを持っているかチェックする
 */

/**
 * idが存在し、文字列であることを確認する型ガード
 */
export function hasId<T extends { id?: string }>(item: T): item is T & { id: string } {
  return typeof item.id === 'string' && item.id.length > 0;
}

/**
 * オブジェクトの配列から、idを持つ要素のみをフィルタリングする
 */
export function filterWithId<T extends { id?: string }>(items: T[]): Array<T & { id: string }> {
  return items.filter(hasId);
}

/**
 * nullまたはundefinedでないことを確認する型ガード
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
