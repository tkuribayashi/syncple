interface LoadingProps {
  variant?: 'fullscreen' | 'container';
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * スピナーのサイズを取得
 */
function getSpinnerSize(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'w-6 h-6';
    case 'md':
      return 'w-10 h-10';
    case 'lg':
      return 'w-16 h-16';
  }
}

/**
 * テキストのサイズを取得
 */
function getTextSize(size: 'sm' | 'md' | 'lg'): string {
  switch (size) {
    case 'sm':
      return 'text-sm';
    case 'md':
      return 'text-base';
    case 'lg':
      return 'text-lg';
  }
}

/**
 * LoadingSpinner - アイコンスタイルのスピナー
 * ボタン内などで使用する小さなスピナー
 */
export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const spinnerSize = getSpinnerSize(size);

  return (
    <div className={`inline-block ${className}`}>
      <div
        className={`${spinnerSize} border-4 border-gray-300 border-t-purple-600 rounded-full animate-spin`}
        role="status"
        aria-label="読み込み中"
      />
    </div>
  );
}

/**
 * Loading - フル画面またはコンテナ内のローディング表示
 * ページ全体またはセクションのローディング時に使用
 */
export default function Loading({
  variant = 'container',
  size = 'md',
  text = '読み込み中...'
}: LoadingProps) {
  const spinnerSize = getSpinnerSize(size);
  const textSize = getTextSize(size);

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div
        className={`${spinnerSize} border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin`}
        role="status"
        aria-label="読み込み中"
      />
      {text && (
        <p className={`${textSize} text-gray-600 font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (variant === 'fullscreen') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    );
  }

  // container variant
  return (
    <div className="text-center py-8">
      {content}
    </div>
  );
}
