'use client';

type CalendarViewMode = '2weeks' | 'month';

interface CalendarViewSectionProps {
  calendarViewMode: CalendarViewMode;
  onChangeMode: (mode: CalendarViewMode) => void;
}

export default function CalendarViewSection({
  calendarViewMode,
  onChangeMode,
}: CalendarViewSectionProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">カレンダー表示</h2>
      <div className="space-y-3">
        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="calendarViewMode"
            value="2weeks"
            checked={calendarViewMode === '2weeks'}
            onChange={() => onChangeMode('2weeks')}
            className="w-4 h-4"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">2週間表示</div>
            <div className="text-xs text-gray-500">14日分を2列で表示（デフォルト）</div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
          <input
            type="radio"
            name="calendarViewMode"
            value="month"
            checked={calendarViewMode === 'month'}
            onChange={() => onChangeMode('month')}
            className="w-4 h-4"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-900">1ヶ月表示</div>
            <div className="text-xs text-gray-500">30日分をカレンダーグリッドで表示</div>
          </div>
        </label>
      </div>
    </div>
  );
}
