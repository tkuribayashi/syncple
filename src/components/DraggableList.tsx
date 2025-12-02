'use client';

import { ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
  id: string;
  children: ReactNode;
  disabled?: boolean;
}

function SortableItem({ id, children, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="flex gap-2 items-center">
        {/* ドラッグハンドル */}
        <button
          {...attributes}
          {...listeners}
          disabled={disabled}
          className={`touch-none p-2 ${
            disabled
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing'
          }`}
          aria-label="並び替え"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M7 4h6v2H7V4zm0 5h6v2H7V9zm0 5h6v2H7v-2z" />
          </svg>
        </button>

        {/* コンテンツ */}
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

interface DraggableListProps {
  items: Array<{ id: string; content: ReactNode; disabled?: boolean }>;
  onReorder: (newItems: Array<{ id: string; content: ReactNode; disabled?: boolean }>) => void;
}

export default function DraggableList({ items, onReorder }: DraggableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px動かしたらドラッグ開始（誤操作防止）
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {items.map((item) => (
            <SortableItem key={item.id} id={item.id} disabled={item.disabled}>
              {item.content}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
