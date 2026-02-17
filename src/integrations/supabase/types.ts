export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ads: {
        Row: {
          budget: number | null
          category: string | null
          clicks_count: number | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          link_url: string | null
          media_type: string | null
          media_url: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
          views_count: number | null
        }
        Insert: {
          budget?: number | null
          category?: string | null
          clicks_count?: number | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          link_url?: string | null
          media_type?: string | null
          media_url?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
          views_count?: number | null
        }
        Update: {
          budget?: number | null
          category?: string | null
          clicks_count?: number | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          link_url?: string | null
          media_type?: string | null
          media_url?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          views_count?: number | null
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      call_history: {
        Row: {
          call_type: string
          callee_id: string
          caller_id: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          started_at: string
          status: string
        }
        Insert: {
          call_type?: string
          callee_id: string
          caller_id: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
        }
        Update: {
          call_type?: string
          callee_id?: string
          caller_id?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          status?: string
        }
        Relationships: []
      }
      call_signals: {
        Row: {
          call_type: string
          callee_id: string
          caller_id: string
          created_at: string
          expires_at: string
          id: string
          signal_data: Json
          signal_type: string
        }
        Insert: {
          call_type?: string
          callee_id: string
          caller_id: string
          created_at?: string
          expires_at?: string
          id?: string
          signal_data: Json
          signal_type: string
        }
        Update: {
          call_type?: string
          callee_id?: string
          caller_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          signal_data?: Json
          signal_type?: string
        }
        Relationships: []
      }
      certification_requests: {
        Row: {
          created_at: string
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      channel_subscribers: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_subscribers_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          avatar_url: string | null
          category: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          is_verified: boolean
          name: string
          subscribers_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          name: string
          subscribers_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_verified?: boolean
          name?: string
          subscribers_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_comments_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          avatar_url: string | null
          category: string | null
          cover_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_private: boolean | null
          members_count: number | null
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          members_count?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          members_count?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          community_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          community_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_group_members: {
        Row: {
          added_at: string
          group_id: string
          id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          group_id: string
          id?: string
          user_id: string
        }
        Update: {
          added_at?: string
          group_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "contact_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_groups: {
        Row: {
          avatar_url: string | null
          created_at: string
          creator_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          creator_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      group_call_participants: {
        Row: {
          call_id: string
          id: string
          joined_at: string
          left_at: string | null
          user_id: string
        }
        Insert: {
          call_id: string
          id?: string
          joined_at?: string
          left_at?: string | null
          user_id: string
        }
        Update: {
          call_id?: string
          id?: string
          joined_at?: string
          left_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_call_participants_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "group_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      group_calls: {
        Row: {
          call_type: string
          contact_group_id: string
          ended_at: string | null
          id: string
          initiator_id: string
          started_at: string
          status: string
        }
        Insert: {
          call_type?: string
          contact_group_id: string
          ended_at?: string | null
          id?: string
          initiator_id: string
          started_at?: string
          status?: string
        }
        Update: {
          call_type?: string
          contact_group_id?: string
          ended_at?: string | null
          id?: string
          initiator_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_calls_contact_group_id_fkey"
            columns: ["contact_group_id"]
            isOneToOne: false
            referencedRelation: "contact_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string | null
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_messages: {
        Row: {
          community_id: string | null
          content: string
          created_at: string
          group_id: string | null
          id: string
          media_type: string | null
          media_url: string | null
          reply_to_id: string | null
          user_id: string
        }
        Insert: {
          community_id?: string | null
          content: string
          created_at?: string
          group_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          reply_to_id?: string | null
          user_id: string
        }
        Update: {
          community_id?: string | null
          content?: string
          created_at?: string
          group_id?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          reply_to_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_messages_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "group_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          cover_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          is_private: boolean | null
          members_count: number | null
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          members_count?: number | null
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          members_count?: number | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      interests: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_messages: {
        Row: {
          created_at: string
          id: string
          is_reaction: boolean
          message: string
          reaction_type: string | null
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_reaction?: boolean
          message: string
          reaction_type?: string | null
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_reaction?: boolean
          message?: string
          reaction_type?: string | null
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "live_streams"
            referencedColumns: ["id"]
          },
        ]
      }
      live_streams: {
        Row: {
          description: string | null
          ended_at: string | null
          id: string
          is_live: boolean
          started_at: string
          title: string
          user_id: string
          viewers_count: number
        }
        Insert: {
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean
          started_at?: string
          title: string
          user_id: string
          viewers_count?: number
        }
        Update: {
          description?: string | null
          ended_at?: string | null
          id?: string
          is_live?: boolean
          started_at?: string
          title?: string
          user_id?: string
          viewers_count?: number
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          media_type: string | null
          media_url: string | null
          receiver_id: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_type?: string | null
          media_url?: string | null
          receiver_id: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          media_type?: string | null
          media_url?: string | null
          receiver_id?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          created_at: string
          from_user_id: string | null
          id: string
          is_read: boolean
          post_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          post_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          from_user_id?: string | null
          id?: string
          is_read?: boolean
          post_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          caption: string | null
          channel_id: string | null
          comments_count: number
          community_id: string | null
          created_at: string
          group_id: string | null
          id: string
          likes_count: number
          media_type: string | null
          media_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          channel_id?: string | null
          comments_count?: number
          community_id?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          likes_count?: number
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          channel_id?: string | null
          comments_count?: number
          community_id?: string | null
          created_at?: string
          group_id?: string | null
          id?: string
          likes_count?: number
          media_type?: string | null
          media_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_visits: {
        Row: {
          created_at: string
          id: string
          profile_id: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_id: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_id?: string
          visitor_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birthdate: string | null
          created_at: string
          display_name: string | null
          external_link: string | null
          first_name: string | null
          id: string
          is_online: boolean | null
          is_private: boolean
          is_verified: boolean
          language: string | null
          last_name: string | null
          last_seen: string | null
          location: string | null
          phone_number: string | null
          profession: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string
          display_name?: string | null
          external_link?: string | null
          first_name?: string | null
          id: string
          is_online?: boolean | null
          is_private?: boolean
          is_verified?: boolean
          language?: string | null
          last_name?: string | null
          last_seen?: string | null
          location?: string | null
          phone_number?: string | null
          profession?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birthdate?: string | null
          created_at?: string
          display_name?: string | null
          external_link?: string | null
          first_name?: string | null
          id?: string
          is_online?: boolean | null
          is_private?: boolean
          is_verified?: boolean
          language?: string | null
          last_name?: string | null
          last_seen?: string | null
          location?: string | null
          phone_number?: string | null
          profession?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          created_at: string
          id: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      reposts: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          original_post_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          original_post_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          original_post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reposts_original_post_id_fkey"
            columns: ["original_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          caption: string | null
          created_at: string
          expires_at: string
          id: string
          media_type: string
          media_url: string
          user_id: string
          views_count: number
        }
        Insert: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url: string
          user_id: string
          views_count?: number
        }
        Update: {
          caption?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          media_type?: string
          media_url?: string
          user_id?: string
          views_count?: number
        }
        Relationships: []
      }
      story_views: {
        Row: {
          created_at: string
          id: string
          story_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          story_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          story_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          created_at: string
          id: string
          interest_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interest_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_interest_id_fkey"
            columns: ["interest_id"]
            isOneToOne: false
            referencedRelation: "interests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          content_auto_play: boolean | null
          content_auto_subtitles: boolean | null
          content_auto_translate: boolean | null
          content_high_contrast: boolean | null
          content_restricted_mode: boolean | null
          content_sensitive_filter: boolean | null
          created_at: string
          dark_mode: boolean | null
          id: string
          notifications_comments: boolean | null
          notifications_followers: boolean | null
          notifications_likes: boolean | null
          notifications_lives: boolean | null
          notifications_messages: boolean | null
          notifications_promotions: boolean | null
          notifications_push: boolean | null
          notifications_recommendations: boolean | null
          privacy_allow_comments: string | null
          privacy_allow_downloads: boolean | null
          privacy_allow_duets: string | null
          privacy_allow_mentions: string | null
          privacy_allow_messages: string | null
          privacy_allow_suggestions: boolean | null
          privacy_auto_share: boolean | null
          privacy_show_following: boolean | null
          privacy_sync_contacts: boolean | null
          screen_time_break_reminders: boolean | null
          screen_time_daily_limit: number | null
          screen_time_sleep_end: string | null
          screen_time_sleep_mode: boolean | null
          screen_time_sleep_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content_auto_play?: boolean | null
          content_auto_subtitles?: boolean | null
          content_auto_translate?: boolean | null
          content_high_contrast?: boolean | null
          content_restricted_mode?: boolean | null
          content_sensitive_filter?: boolean | null
          created_at?: string
          dark_mode?: boolean | null
          id?: string
          notifications_comments?: boolean | null
          notifications_followers?: boolean | null
          notifications_likes?: boolean | null
          notifications_lives?: boolean | null
          notifications_messages?: boolean | null
          notifications_promotions?: boolean | null
          notifications_push?: boolean | null
          notifications_recommendations?: boolean | null
          privacy_allow_comments?: string | null
          privacy_allow_downloads?: boolean | null
          privacy_allow_duets?: string | null
          privacy_allow_mentions?: string | null
          privacy_allow_messages?: string | null
          privacy_allow_suggestions?: boolean | null
          privacy_auto_share?: boolean | null
          privacy_show_following?: boolean | null
          privacy_sync_contacts?: boolean | null
          screen_time_break_reminders?: boolean | null
          screen_time_daily_limit?: number | null
          screen_time_sleep_end?: string | null
          screen_time_sleep_mode?: boolean | null
          screen_time_sleep_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content_auto_play?: boolean | null
          content_auto_subtitles?: boolean | null
          content_auto_translate?: boolean | null
          content_high_contrast?: boolean | null
          content_restricted_mode?: boolean | null
          content_sensitive_filter?: boolean | null
          created_at?: string
          dark_mode?: boolean | null
          id?: string
          notifications_comments?: boolean | null
          notifications_followers?: boolean | null
          notifications_likes?: boolean | null
          notifications_lives?: boolean | null
          notifications_messages?: boolean | null
          notifications_promotions?: boolean | null
          notifications_push?: boolean | null
          notifications_recommendations?: boolean | null
          privacy_allow_comments?: string | null
          privacy_allow_downloads?: boolean | null
          privacy_allow_duets?: string | null
          privacy_allow_mentions?: string | null
          privacy_allow_messages?: string | null
          privacy_allow_suggestions?: boolean | null
          privacy_auto_share?: boolean | null
          privacy_show_following?: boolean | null
          privacy_sync_contacts?: boolean | null
          screen_time_break_reminders?: boolean | null
          screen_time_daily_limit?: number | null
          screen_time_sleep_end?: string | null
          screen_time_sleep_mode?: boolean | null
          screen_time_sleep_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          external_link: string | null
          id: string | null
          is_online: boolean | null
          is_private: boolean | null
          is_verified: boolean | null
          language: string | null
          last_seen: string | null
          location: string | null
          profession: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          external_link?: string | null
          id?: string | null
          is_online?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          language?: string | null
          last_seen?: string | null
          location?: string | null
          profession?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          external_link?: string | null
          id?: string | null
          is_online?: boolean | null
          is_private?: boolean | null
          is_verified?: boolean | null
          language?: string | null
          last_seen?: string | null
          location?: string | null
          profession?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_expired_call_signals: { Args: never; Returns: undefined }
      cleanup_expired_rate_limits: { Args: never; Returns: undefined }
      cleanup_old_call_history: { Args: never; Returns: undefined }
      get_safe_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          bio: string
          created_at: string
          display_name: string
          external_link: string
          id: string
          is_online: boolean
          is_private: boolean
          is_verified: boolean
          language: string
          last_seen: string
          location: string
          profession: string
          updated_at: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_ad_clicks: { Args: { ad_id: string }; Returns: undefined }
      increment_ad_views: { Args: { ad_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
