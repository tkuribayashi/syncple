/**
 * メッセージ関連の定数
 */
export const MESSAGE = {
  /** ダブルタップの判定時間（ms） */
  DOUBLE_TAP_DELAY: 300,
  /** アニメーションの実行時間（ms） */
  ANIMATION_DURATION: 600,
  /** 長押しの判定時間（ms） */
  LONG_PRESS_DELAY: 500,
  /** ポインター移動の閾値（px） */
  POINTER_MOVE_THRESHOLD: 10,
  /** ホーム画面のメッセージ表示件数 */
  HOME_MESSAGE_LIMIT: 10,
} as const;

/**
 * クイックメッセージ関連の定数
 */
export const QUICK_MESSAGE = {
  /** クイックメッセージの最大数 */
  MAX: 12,
  /** クイックメッセージの最小数 */
  MIN: 1,
} as const;

/**
 * カレンダー関連の定数
 */
export const CALENDAR = {
  /** 2週間表示の日数 */
  TWO_WEEKS_DAYS: 14,
  /** 月表示の日数（4週間） */
  MONTH_DAYS: 28,
} as const;

/**
 * 予定カテゴリ関連の定数
 */
export const SCHEDULE_CATEGORY = {
  /** 予定カテゴリの最大数 */
  MAX: 12,
  /** 予定カテゴリの最小数（0も許容） */
  MIN: 0,
} as const;

/**
 * 晩ご飯ステータス関連の定数
 */
export const DINNER_STATUS = {
  /** 晩ご飯ステータスの最大数 */
  MAX: 12,
  /** 晩ご飯ステータスの最小数（0も許容） */
  MIN: 0,
} as const;
