import { Timestamp } from 'firebase/firestore';

export interface User {
  email: string;
  displayName: string;
  pairId: string | null;
  fcmTokens: string[];
  status: 'available' | 'in_meeting' | 'commuting' | 'focusing' | 'break';
  statusUpdatedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Pair {
  user1Id: string;
  user2Id: string | null;
  inviteCode: string;
  inviteCodeExpiresAt: Timestamp;
  createdAt: Timestamp;
}

export interface Schedule {
  id?: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  title: string;
  category: 'remote' | 'office' | 'business_trip' | 'vacation' | 'outing' | 'other';
  memo: string | null;
  isAllDay: boolean;
  startTime: string | null; // "HH:mm"
  endTime: string | null; // "HH:mm"
  repeat: {
    pattern: 'none' | 'daily' | 'weekly' | 'monthly';
    dayOfWeek?: number; // 0(日)〜6(土)
    dayOfMonth?: number; // 1〜31
    endDate?: string; // "YYYY-MM-DD"
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Message {
  id?: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: Timestamp;
}

export interface QuickMessage {
  id?: string;
  userId: string | null; // nullの場合はプリセット（共有）
  content: string; // "{分}分後に帰ります" など
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ShoppingItem {
  id?: string;
  name: string;
  isPurchased: boolean;
  purchasedBy: string | null;
  purchasedAt: Timestamp | null;
  createdBy: string;
  createdAt: Timestamp;
}

export interface DinnerStatus {
  id?: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  status: 'alone' | 'cooking' | 'cooking_together' | 'undecided';
  updatedAt: Timestamp;
}

export const SCHEDULE_CATEGORIES = {
  remote: '在宅勤務',
  office: '出社',
  business_trip: '出張',
  vacation: '休暇',
  outing: '外出',
  other: 'その他',
} as const;

export const USER_STATUSES = {
  available: '手が空いてる',
  in_meeting: '会議中',
  commuting: '移動中',
  focusing: '集中作業中',
  break: '休憩中',
} as const;

export const DEFAULT_QUICK_MESSAGES = [
  '今から帰ります',
  '遅くなります',
  'ご飯炊いておいて',
  '買い物ある？',
  '了解',
  'ありがとう',
];

export const DINNER_STATUSES = {
  alone: '1人で済ませる',
  cooking: '2人分作る',
  cooking_together: '一緒に作る',
  undecided: '未定',
} as const;

export type DinnerStatusType = keyof typeof DINNER_STATUSES;
