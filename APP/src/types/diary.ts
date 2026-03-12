// 日记类型定义

export interface Diary {
  id: number;
  user_id: number;
  user_plant_id: number;
  content: string;
  images: string[];
  height?: number;
  leaf_count?: number;
  created_at: string;
  plant_name?: string;
}

export interface DiaryCreate {
  user_plant_id: number;
  content: string;
  images?: string[];
  height?: number;
  leaf_count?: number;
}

export interface Plant {
  id: number;
  name: string;
  image?: string;
}
