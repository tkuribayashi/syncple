import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// メッセージ送信時のプッシュ通知
export const onMessageCreated = functions.firestore
  .document('pairs/{pairId}/messages/{messageId}')
  .onCreate(async (snapshot, context) => {
    const message = snapshot.data();
    const pairId = context.params.pairId;
    const senderId = message.senderId;

    try {
      // ペア情報を取得
      const pairDoc = await admin.firestore().doc(`pairs/${pairId}`).get();
      if (!pairDoc.exists) return;

      const pairData = pairDoc.data();
      if (!pairData) return;

      // 受信者のIDを特定
      const receiverId = pairData.user1Id === senderId
        ? pairData.user2Id
        : pairData.user1Id;

      if (!receiverId) return;

      // 受信者の情報とFCMトークンを取得
      const receiverDoc = await admin.firestore().doc(`users/${receiverId}`).get();
      if (!receiverDoc.exists) return;

      const receiverData = receiverDoc.data();
      if (!receiverData || !receiverData.fcmTokens || receiverData.fcmTokens.length === 0) {
        return;
      }

      // 送信者の名前を取得
      const senderDoc = await admin.firestore().doc(`users/${senderId}`).get();
      const senderName = senderDoc.exists ? senderDoc.data()?.displayName : '不明';

      // プッシュ通知を送信（FCM HTTP v1 API）
      const messages = receiverData.fcmTokens.map((token: string) => ({
        token: token,
        notification: {
          title: `${senderName}からメッセージ`,
          body: message.content,
        },
        data: {
          type: 'message',
          pairId: pairId,
        },
        webpush: {
          fcmOptions: {
            link: '/',
          },
        },
      }));

      const response = await admin.messaging().sendEach(messages);
      console.log('FCM response:', JSON.stringify(response));

      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  });

// 招待コード検証・ペア参加（Callable Function）
export const joinPair = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    );
  }

  const { inviteCode } = data;
  const userId = context.auth.uid;

  try {
    // 招待コードでペアを検索
    const pairsRef = admin.firestore().collection('pairs');
    const querySnapshot = await pairsRef.where('inviteCode', '==', inviteCode).get();

    if (querySnapshot.empty) {
      throw new functions.https.HttpsError('not-found', 'Invalid invite code');
    }

    const pairDoc = querySnapshot.docs[0];
    const pairData = pairDoc.data();

    // 期限チェック
    if (pairData.inviteCodeExpiresAt.toDate() < new Date()) {
      throw new functions.https.HttpsError('failed-precondition', 'Invite code has expired');
    }

    // すでにペアが完成している場合
    if (pairData.user2Id) {
      throw new functions.https.HttpsError('already-exists', 'This pair is already complete');
    }

    // ペアに参加
    await pairDoc.ref.update({
      user2Id: userId,
    });

    // ユーザーのpairIdを更新
    await admin.firestore().doc(`users/${userId}`).update({
      pairId: pairDoc.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, pairId: pairDoc.id };
  } catch (error) {
    console.error('Error joining pair:', error);
    throw error;
  }
});
