export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string
          price: number
          image_url: string
          category: string
          likes_count: number
          average_rating: number
          reviews_count: number
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description: string
          price: number
          image_url: string
          category: string
          likes_count?: number
          average_rating?: number
          reviews_count?: number
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string
          price?: number
          image_url?: string
          category?: string
          likes_count?: number
          average_rating?: number
          reviews_count?: number
          is_active?: boolean
        }
      }
      likes: {
        Row: {
          id: string
          created_at: string
          product_id: string
          user_id: string
          user_ip: string
        }
        Insert: {
          id?: string
          created_at?: string
          product_id: string
          user_id: string
          user_ip: string
        }
        Update: {
          id?: string
          created_at?: string
          product_id?: string
          user_id?: string
          user_ip?: string
        }
      }
      reviews: {
        Row: {
          id: string
          created_at: string
          product_id: string
          user_name: string
          rating: number
          comment: string
          is_approved: boolean
          admin_response?: string
        }
        Insert: {
          id?: string
          created_at?: string
          product_id: string
          user_name: string
          rating: number
          comment: string
          is_approved?: boolean
          admin_response?: string
        }
        Update: {
          id?: string
          created_at?: string
          product_id?: string
          user_name?: string
          rating?: number
          comment?: string
          is_approved?: boolean
          admin_response?: string
        }
      }
      questions: {
        Row: {
          id: string
          created_at: string
          product_id: string
          user_name: string
          question: string
          answer?: string
          is_answered: boolean
          answered_at?: string
        }
        Insert: {
          id?: string
          created_at?: string
          product_id: string
          user_name: string
          question: string
          answer?: string
          is_answered?: boolean
          answered_at?: string
        }
        Update: {
          id?: string
          created_at?: string
          product_id?: string
          user_name?: string
          question?: string
          answer?: string
          is_answered?: boolean
          answered_at?: string
        }
      }
    }
  }
}

export type Product = Database['public']['Tables']['products']['Row']
export type Like = Database['public']['Tables']['likes']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Question = Database['public']['Tables']['questions']['Row']