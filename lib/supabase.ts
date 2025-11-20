import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role (for admin operations)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export type Database = {
  public: {
    Tables: {
      credentials: {
        Row: {
          id: string
          user_id: string
          xai_api_key: string | null
          wordpress_url: string | null
          wordpress_username: string | null
          wordpress_app_password: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          xai_api_key?: string | null
          wordpress_url?: string | null
          wordpress_username?: string | null
          wordpress_app_password?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          xai_api_key?: string | null
          wordpress_url?: string | null
          wordpress_username?: string | null
          wordpress_app_password?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      content: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          keywords: string
          featured_image_url: string | null
          status: 'draft' | 'generated' | 'published' | 'failed'
          wordpress_post_id: string | null
          error_message: string | null
          metadata: any
          created_at: string
          updated_at: string
          scheduled_at: string | null
          published_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          body: string
          keywords: string
          featured_image_url?: string | null
          status?: 'draft' | 'generated' | 'published' | 'failed'
          wordpress_post_id?: string | null
          error_message?: string | null
          metadata?: any
          created_at?: string
          updated_at?: string
          scheduled_at?: string | null
          published_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          body?: string
          keywords?: string
          featured_image_url?: string | null
          status?: 'draft' | 'generated' | 'published' | 'failed'
          wordpress_post_id?: string | null
          error_message?: string | null
          metadata?: any
          created_at?: string
          updated_at?: string
          scheduled_at?: string | null
          published_at?: string | null
        }
      }
      batch_jobs: {
        Row: {
          id: string
          user_id: string
          total_items: number
          completed_items: number
          status: 'pending' | 'processing' | 'completed' | 'failed'
          csv_file_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_items: number
          completed_items?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          csv_file_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_items?: number
          completed_items?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          csv_file_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
