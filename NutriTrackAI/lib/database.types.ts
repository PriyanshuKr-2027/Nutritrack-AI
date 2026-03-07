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
      api_daily_usage: {
        Row: {
          call_count: number
          date: string
          provider: string
        }
        Insert: {
          call_count?: number
          date: string
          provider: string
        }
        Update: {
          call_count?: number
          date?: string
          provider?: string
        }
        Relationships: []
      }
      custom_foods: {
        Row: {
          calories_per_100g: number | null
          carbs_per_100g: number | null
          created_at: string | null
          fat_per_100g: number | null
          id: string
          name: string
          protein_per_100g: number | null
          user_id: string | null
        }
        Insert: {
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          created_at?: string | null
          fat_per_100g?: number | null
          id?: string
          name: string
          protein_per_100g?: number | null
          user_id?: string | null
        }
        Update: {
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          created_at?: string | null
          fat_per_100g?: number | null
          id?: string
          name?: string
          protein_per_100g?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'custom_foods_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      ifct_foods: {
        Row: {
          calories_per_100g: number | null
          carbs_per_100g: number | null
          fat_per_100g: number | null
          fiber_per_100g: number | null
          id: string
          local_names: string[] | null
          name: string
          name_search: unknown
          protein_per_100g: number | null
        }
        Insert: {
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          local_names?: string[] | null
          name: string
          name_search?: unknown
          protein_per_100g?: number | null
        }
        Update: {
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          id?: string
          local_names?: string[] | null
          name?: string
          name_search?: unknown
          protein_per_100g?: number | null
        }
        Relationships: []
      }
      label_nutrients: {
        Row: {
          carbs_g: number | null
          energy_kcal: number | null
          fat_g: number | null
          id: string
          meal_item_id: string | null
          protein_g: number | null
          raw_ocr_text: string | null
          serving_size: string | null
          sodium_mg: number | null
          sugar_g: number | null
        }
        Insert: {
          carbs_g?: number | null
          energy_kcal?: number | null
          fat_g?: number | null
          id?: string
          meal_item_id?: string | null
          protein_g?: number | null
          raw_ocr_text?: string | null
          serving_size?: string | null
          sodium_mg?: number | null
          sugar_g?: number | null
        }
        Update: {
          carbs_g?: number | null
          energy_kcal?: number | null
          fat_g?: number | null
          id?: string
          meal_item_id?: string | null
          protein_g?: number | null
          raw_ocr_text?: string | null
          serving_size?: string | null
          sodium_mg?: number | null
          sugar_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'label_nutrients_meal_item_id_fkey'
            columns: ['meal_item_id']
            isOneToOne: false
            referencedRelation: 'meal_items'
            referencedColumns: ['id']
          },
        ]
      }
      meal_items: {
        Row: {
          calories: number
          carbs_g: number | null
          fat_g: number | null
          food_id: string | null
          food_name: string
          food_source: string | null
          id: string
          meal_id: string | null
          protein_g: number | null
          quantity: number
          size: string | null
          weight_g: number | null
        }
        Insert: {
          calories: number
          carbs_g?: number | null
          fat_g?: number | null
          food_id?: string | null
          food_name: string
          food_source?: string | null
          id?: string
          meal_id?: string | null
          protein_g?: number | null
          quantity?: number
          size?: string | null
          weight_g?: number | null
        }
        Update: {
          calories?: number
          carbs_g?: number | null
          fat_g?: number | null
          food_id?: string | null
          food_name?: string
          food_source?: string | null
          id?: string
          meal_id?: string | null
          protein_g?: number | null
          quantity?: number
          size?: string | null
          weight_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'meal_items_meal_id_fkey'
            columns: ['meal_id']
            isOneToOne: false
            referencedRelation: 'meals'
            referencedColumns: ['id']
          },
        ]
      }
      meals: {
        Row: {
          created_at: string | null
          detection_source: string | null
          id: string
          logged_at: string
          meal_type: string | null
          total_calories: number | null
          total_carbs_g: number | null
          total_fat_g: number | null
          total_protein_g: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          detection_source?: string | null
          id?: string
          logged_at: string
          meal_type?: string | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_protein_g?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          detection_source?: string | null
          id?: string
          logged_at?: string
          meal_type?: string | null
          total_calories?: number | null
          total_carbs_g?: number | null
          total_fat_g?: number | null
          total_protein_g?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'meals_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      profiles: {
        Row: {
          activity_level: string | null
          age: number | null
          bmr: number | null
          calorie_goal: number | null
          carbs_goal_g: number | null
          created_at: string | null
          fat_goal_g: number | null
          gender: string | null
          goal: string | null
          goal_weeks: number | null
          height_cm: number | null
          id: string
          name: string | null
          protein_goal_g: number | null
          target_weight_kg: number | null
          tdee: number | null
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          bmr?: number | null
          calorie_goal?: number | null
          carbs_goal_g?: number | null
          created_at?: string | null
          fat_goal_g?: number | null
          gender?: string | null
          goal?: string | null
          goal_weeks?: number | null
          height_cm?: number | null
          id: string
          name?: string | null
          protein_goal_g?: number | null
          target_weight_kg?: number | null
          tdee?: number | null
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          bmr?: number | null
          calorie_goal?: number | null
          carbs_goal_g?: number | null
          created_at?: string | null
          fat_goal_g?: number | null
          gender?: string | null
          goal?: string | null
          goal_weeks?: number | null
          height_cm?: number | null
          id?: string
          name?: string | null
          protein_goal_g?: number | null
          target_weight_kg?: number | null
          tdee?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      usda_foods: {
        Row: {
          calories_per_100g: number | null
          carbs_per_100g: number | null
          fat_per_100g: number | null
          id: string
          name: string
          name_search: unknown
          protein_per_100g: number | null
        }
        Insert: {
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          fat_per_100g?: number | null
          id?: string
          name: string
          name_search?: unknown
          protein_per_100g?: number | null
        }
        Update: {
          calories_per_100g?: number | null
          carbs_per_100g?: number | null
          fat_per_100g?: number | null
          id?: string
          name?: string
          name_search?: unknown
          protein_per_100g?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_api_usage: {
        Args: { p_date: string; p_provider: string }
        Returns: undefined
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

// ─── Convenience type helpers ─────────────────────────────────────────────────

type PublicSchema = Database['public']

/** Row type for any public table */
export type Tables<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Row']

/** Insert type for any public table */
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']

/** Update type for any public table */
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']
