import { toast } from '@/components/ui/Toast';

/**
 * エラーの種類
 */
export enum ErrorType {
  NETWORK = 'network',
  PERMISSION = 'permission',
  NOT_FOUND = 'not_found',
  VALIDATION = 'validation',
  UNKNOWN = 'unknown',
}

/**
 * アプリケーションエラー
 */
export class AppError extends Error {
  constructor(
    public type: ErrorType,
    public userMessage: string,
    public originalError?: unknown
  ) {
    super(userMessage);
    this.name = 'AppError';
  }
}

/**
 * エラーを処理してユーザーメッセージを返す
 */
export function handleError(error: unknown, context: string): string {
  console.error(`Error in ${context}:`, error);

  if (error instanceof AppError) {
    return error.userMessage;
  }

  if (error instanceof Error) {
    // Firebaseエラーの場合
    if (error.message.includes('permission-denied')) {
      return 'アクセス権限がありません';
    }
    if (error.message.includes('not-found')) {
      return 'データが見つかりません';
    }
    if (error.message.includes('network')) {
      return 'ネットワークエラーが発生しました';
    }
  }

  return '予期しないエラーが発生しました';
}

/**
 * エラーをトーストで表示
 */
export function showErrorToast(error: unknown, context: string) {
  const message = handleError(error, context);
  toast.error(message);
}

/**
 * 成功メッセージをトーストで表示
 */
export function showSuccessToast(message: string) {
  toast.success(message);
}
