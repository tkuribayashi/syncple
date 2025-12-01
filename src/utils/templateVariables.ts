export interface Variable {
  placeholder: string;  // "{数}" または "{数=30}"
  defaultValue: string; // デフォルト値（あれば）
}

/**
 * テンプレート文字列から {数} 変数を抽出する
 * @param template テンプレート文字列
 * @returns Variable | null
 */
export function extractVariable(template: string): Variable | null {
  const match = template.match(/\{数(?:=(\d+))?\}/);

  if (!match) return null;

  return {
    placeholder: match[0],      // "{数}" または "{数=30}"
    defaultValue: match[1] || '' // デフォルト値（あれば）
  };
}

/**
 * テンプレート文字列の変数を値で置換する
 * @param template テンプレート文字列
 * @param variable 変数情報
 * @param value 置換する値
 * @returns 置換後の文字列
 */
export function replaceVariable(
  template: string,
  variable: Variable,
  value: string
): string {
  return template.replace(variable.placeholder, value);
}
