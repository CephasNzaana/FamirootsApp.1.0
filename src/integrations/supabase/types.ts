export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      family_trees: {
        Row: {
          clan: string
          created_at: string
          id: string
          surname: string
          tribe: string
          updated_at: string
          user_id: string
          fallback: boolean | null
          members: Json[]
        }
        Insert: {
          clan: string
          created_at?: string
          id?: string
          surname: string
          tribe: string
          updated_at?: string
          user_id: string
          fallback?: boolean | null
          members: Json[]
        }
        Update: {
          clan?: string
          created_at?: string
          id?: string
          surname?: string
          tribe?: string
          updated_at?: string
          user_id?: string
          fallback?: boolean | null
          members?: Json[]
        }
        Relationships: [
          {
            foreignKeyName: "family_trees_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_profile: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}