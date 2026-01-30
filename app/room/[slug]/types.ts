export type Message = {
  id: string;
  nickname: string;
  content: string;
  created_at: string;
  image_url?: string | null;
  parent_id?: string | null; // 追加
};