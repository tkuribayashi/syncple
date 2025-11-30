'use client';

export default function EnvRibbon() {
  const env = process.env.NEXT_PUBLIC_ENV;

  // 本番環境では表示しない
  if (!env || env === 'production') {
    return null;
  }

  const config = {
    local: {
      label: 'LOCAL',
      bg: 'bg-blue-500',
      text: 'text-white',
      border: 'border-blue-600'
    },
    staging: {
      label: 'STAGING',
      bg: 'bg-yellow-500',
      text: 'text-black',
      border: 'border-yellow-600'
    }
  };

  const current = config[env as keyof typeof config];
  if (!current) return null;

  return (
    <div className="fixed top-0 right-0 z-50 pointer-events-none overflow-hidden h-24 w-24">
      <div className={`
        ${current.bg} ${current.text} ${current.border}
        px-10 py-1 text-xs font-bold
        transform rotate-45 translate-x-6 translate-y-4
        shadow-lg border-b-2
        md:text-sm md:px-12 md:translate-y-6
      `}>
        {current.label}
      </div>
    </div>
  );
}
