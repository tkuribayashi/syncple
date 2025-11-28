'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';
import { useFCMToken } from '@/hooks/useFCMToken';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateDisplayName: (newDisplayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // FCMトークンの初期化
  useFCMToken(user?.uid || null);

  useEffect(() => {
    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser) {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return authUnsubscribe;
  }, []);

  // ユーザープロフィールをリアルタイムで監視
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);

    // リアルタイム監視を設定
    const unsubscribe = onSnapshot(userDocRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        setUserProfile(docSnapshot.data() as User);
        setLoading(false);
      } else {
        // ドキュメントが存在しない場合は作成
        const now = Timestamp.now();
        const newUserProfile: User = {
          email: user.email || '',
          displayName: user.displayName || 'ユーザー',
          pairId: null,
          fcmTokens: [],
          status: 'available',
          statusUpdatedAt: now,
          createdAt: now,
          updatedAt: now,
        };
        await setDoc(userDocRef, newUserProfile);
        setUserProfile(newUserProfile);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error listening to user profile:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const { user: newUser } = await signInWithPopup(auth, provider);

    // ユーザープロフィールが存在するか確認
    const userDoc = await getDoc(doc(db, 'users', newUser.uid));

    // 初回ログイン時のみFirestoreにユーザープロフィールを作成
    if (!userDoc.exists()) {
      const now = Timestamp.now();
      const userProfile: User = {
        email: newUser.email || '',
        displayName: newUser.displayName || 'ユーザー',
        pairId: null,
        fcmTokens: [],
        status: 'available',
        statusUpdatedAt: now,
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(doc(db, 'users', newUser.uid), userProfile);
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

    // Firestoreにユーザープロフィールを作成
    const now = Timestamp.now();
    const userProfile: User = {
      email,
      displayName,
      pairId: null,
      fcmTokens: [],
      status: 'available',
      statusUpdatedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, 'users', newUser.uid), userProfile);
  };

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  const updateDisplayName = async (newDisplayName: string) => {
    if (!user) {
      throw new Error('ログインしていません');
    }

    if (!newDisplayName.trim()) {
      throw new Error('表示名を入力してください');
    }

    const now = Timestamp.now();
    const userRef = doc(db, 'users', user.uid);

    // Firestoreのユーザープロフィールを更新
    await setDoc(userRef, {
      displayName: newDisplayName.trim(),
      updatedAt: now,
    }, { merge: true });

    // ローカルステートを更新
    if (userProfile) {
      setUserProfile({
        ...userProfile,
        displayName: newDisplayName.trim(),
        updatedAt: now,
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signUp, signIn, signOut, updateDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
