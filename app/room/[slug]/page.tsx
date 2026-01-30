'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [roomName, setRoomName] = useState('');

  const generateSlug = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const nums = '0123456789';
    let str = '';
    for (let i = 0; i < 3; i++) str += chars.charAt(Math.floor(Math.random() * chars.length));
    str += '-';
    for (let i = 0; i < 3; i++) str += nums.charAt(Math.floor(Math.random() * nums.length));
    return str;
  };

  // ★ 追加: 「次の日本時間 午前3:00」を計算する関数
  const getNextJst3AM = () => {
    // 現在時刻を取得
    const now = new Date();
    
    // UTC時間に変換して計算することで、ユーザーのPCのタイムゾーン設定に依存せずJSTを扱う
    // JSTは UTC+9
    const jstOffset = 9 * 60; 
    const currentUtcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const currentJstTime = new Date(currentUtcTime + (jstOffset * 60000));

    // JST基準で「今日の3時」を作る
    const targetJst = new Date(currentJstTime);
    targetJst.setHours(3, 0, 0, 0);

    // もし「現在のJST」が「今日の3時」を過ぎていたら、ターゲットは「明日の3時」
    if (currentJstTime > targetJst) {
      targetJst.setDate(targetJst.getDate() + 1);
    }

    // 計算したJSTのターゲット時刻を、DB保存用にUTCに戻す（ISO文字列化でOK）
    // ※ 手動でUTCに戻すより、Dateオブジェクトのメソッドを使うため、
    //    一度「ターゲット時刻と同じ時刻を示すローカルDate」等を経由せず、
    //    ISOString形式で渡すためにUTC換算値を計算し直す。
    
    // シンプルに: targetJst は「JSTでの時刻を表すDateオブジェクト」になっている（中身の数値はずれている）ので
    // ここから9時間を引いて本来のUTCタイムスタンプに戻す
    const targetUtcTimestamp = targetJst.getTime() - (jstOffset * 60000);
    return new Date(targetUtcTimestamp).toISOString();
  };

  const createRoom = async () => {
    setLoading(true);
    try {
      const slug = generateSlug();
      const ownerToken = uuidv4();
      
      const finalName = roomName.trim() || 'たまりば';
      const expiresAt = getNextJst3AM(); // ★ 有効期限を計算

      const { error } = await supabase
        .from('tm_rooms')
        .insert([
          { 
            slug: slug, 
            owner_token: ownerToken,
            name: finalName,
            expires_at: expiresAt // ★ DBに追加
          }
        ]);

      if (error) {
        console.error('Error creating room:', error);
        alert('エラーが発生しました。もう一度お試しください。');
        setLoading(false);
        return;
      }

      localStorage.setItem(`tamariba_owner_${slug}`, ownerToken);
      
      router.push(`/room/${slug}?created=true`);

    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full text-center space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">たまりば</h1>
          <p className="mt-4 text-lg text-gray-600">
            URLひとつで、匿名・クローズド・気兼ねなし。<br />
            登録不要のチャットルームを一瞬で作成。
            <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-base font-bold mt-2">
              🌙 毎日AM3:00に全員解散
            </span>
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label className="block text-left text-sm font-medium text-gray-700 mb-1">ルーム名（任意）</label>
            <input
              type="text"
              placeholder="たまりば"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
          </div>

          <button
            onClick={createRoom}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
          >
            {loading ? '作成中...' : 'たまり場を作る'}
          </button>
          
          <p className="mt-4 text-xs text-gray-400">
            ボタンを押すと即座にルームが作成され、<br />
            専用のURLへ移動します。
          </p>
        </div>

        <div className="text-sm text-gray-500">
          <p>💡 メンバー招待はURLをシェアするだけ</p>
          <p>💡 ルームの削除権限は作った人だけ</p>
        </div>
      </div>
    </main>
  );
}