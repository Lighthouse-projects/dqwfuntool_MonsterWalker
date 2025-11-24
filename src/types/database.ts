// Database types for Supabase
// Auto-generated types can be created with: supabase gen types typescript --linked > src/types/database.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum types
export type MonsterCategory = 'hokora' | 'megamon' | 'gigamon';
export type StrategyType = 'oneshot' | 'semiauto' | 'auto' | 'manual';
export type JobRank = 'basic' | 'advanced' | 'special';
export type RequestCategory = 'monster' | 'weapon' | 'job' | 'bug' | 'feature' | 'question' | 'other';
export type RequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          nickname: string;
          avatar_url: string | null;
          x_account_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          nickname: string;
          avatar_url?: string | null;
          x_account_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          nickname?: string;
          avatar_url?: string | null;
          x_account_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ng_words: {
        Row: {
          ng_word_no: number;
          word: string;
          created_at: string;
        };
        Insert: {
          ng_word_no?: never;
          word: string;
          created_at?: string;
        };
        Update: {
          ng_word_no?: never;
          word?: string;
          created_at?: string;
        };
      };
      mw_mst_monsters: {
        Row: {
          monster_no: number;
          monster_category: MonsterCategory;
          monster_name: string;
          star_rank: number;
          release_date: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          monster_no?: never;
          monster_category: MonsterCategory;
          monster_name: string;
          star_rank: number;
          release_date?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          monster_no?: never;
          monster_category?: MonsterCategory;
          monster_name?: string;
          star_rank?: number;
          release_date?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      mw_mst_weapons: {
        Row: {
          weapon_no: number;
          weapon_name: string;
          star_rank: number;
          release_date: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          weapon_no?: never;
          weapon_name: string;
          star_rank: number;
          release_date?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          weapon_no?: never;
          weapon_name?: string;
          star_rank?: number;
          release_date?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      mw_mst_jobs: {
        Row: {
          job_no: number;
          job_name: string;
          job_rank: JobRank;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          job_no?: never;
          job_name: string;
          job_rank: JobRank;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          job_no?: never;
          job_name?: string;
          job_rank?: JobRank;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      mw_strategies: {
        Row: {
          strategy_no: number;
          user_id: string;
          monster_no: number;
          strategy_type: StrategyType;
          action_description: string | null;
          like_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          strategy_no?: never;
          user_id: string;
          monster_no: number;
          strategy_type: StrategyType;
          action_description?: string | null;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          strategy_no?: never;
          user_id?: string;
          monster_no?: number;
          strategy_type?: StrategyType;
          action_description?: string | null;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      mw_strategy_members: {
        Row: {
          member_no: number;
          strategy_no: number;
          member_order: number;
          weapon_no: number | null;
          job_no: number | null;
          screenshot_front_url: string | null;
          screenshot_back_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          member_no?: never;
          strategy_no: number;
          member_order: number;
          weapon_no?: number | null;
          job_no?: number | null;
          screenshot_front_url?: string | null;
          screenshot_back_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          member_no?: never;
          strategy_no?: number;
          member_order?: number;
          weapon_no?: number | null;
          job_no?: number | null;
          screenshot_front_url?: string | null;
          screenshot_back_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      mw_likes: {
        Row: {
          like_no: number;
          user_id: string;
          strategy_no: number;
          created_at: string;
        };
        Insert: {
          like_no?: never;
          user_id: string;
          strategy_no: number;
          created_at?: string;
        };
        Update: {
          like_no?: never;
          user_id?: string;
          strategy_no?: number;
          created_at?: string;
        };
      };
      mw_favorites_strategies: {
        Row: {
          favorite_strategy_no: number;
          user_id: string;
          strategy_no: number;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          favorite_strategy_no?: never;
          user_id: string;
          strategy_no: number;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          favorite_strategy_no?: never;
          user_id?: string;
          strategy_no?: number;
          sort_order?: number;
          created_at?: string;
        };
      };
      mw_favorites_searches: {
        Row: {
          favorite_search_no: number;
          user_id: string;
          monster_no: number | null;
          weapon_no: number | null;
          display_name: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          favorite_search_no?: never;
          user_id: string;
          monster_no?: number | null;
          weapon_no?: number | null;
          display_name: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          favorite_search_no?: never;
          user_id?: string;
          monster_no?: number | null;
          weapon_no?: number | null;
          display_name?: string;
          sort_order?: number;
          created_at?: string;
        };
      };
      mw_reports: {
        Row: {
          report_no: number;
          reporter_user_id: string;
          strategy_no: number;
          created_at: string;
        };
        Insert: {
          report_no?: never;
          reporter_user_id: string;
          strategy_no: number;
          created_at?: string;
        };
        Update: {
          report_no?: never;
          reporter_user_id?: string;
          strategy_no?: number;
          created_at?: string;
        };
      };
      mw_requests: {
        Row: {
          request_no: number;
          user_id: string;
          request_category: RequestCategory;
          request_content: string;
          request_status: RequestStatus;
          admin_comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          request_no?: never;
          user_id: string;
          request_category: RequestCategory;
          request_content: string;
          request_status?: RequestStatus;
          admin_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          request_no?: never;
          user_id?: string;
          request_category?: RequestCategory;
          request_content?: string;
          request_status?: RequestStatus;
          admin_comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      monster_category_enum: MonsterCategory;
      strategy_type_enum: StrategyType;
      job_rank_enum: JobRank;
      request_category_enum: RequestCategory;
      request_status_enum: RequestStatus;
    };
  };
}
