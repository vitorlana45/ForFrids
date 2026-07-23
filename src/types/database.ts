// 'lifetime' descontinuado (2026-07): valor mantido dormante no enum do banco
// para dados legados; nao e mais emitido nem oferecido. Normalizado -> 'premium'.
export type PlanId = 'free' | 'premium';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  guardian_title: string | null;
  bio: string | null;
  plan_id: PlanId;
  terms_accepted_at: string | null;
  terms_version: string | null;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;
  death_date: string | null;
  avatar_url: string | null;
  memorial_slug: string;
  is_public: boolean;
  tribute_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineEntry {
  id: string;
  pet_id: string;
  title: string;
  description: string | null;
  date: string;
  photo_urls: string[];
  created_at: string;
}

export interface Tribute {
  id: string;
  pet_id: string;
  author_user_id: string | null;
  author_name: string;
  author_relation: string | null;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string | null;
  created_at: string;
}

export interface TimeCapsule {
  id: string;
  pet_id: string;
  title: string;
  message: string;
  open_at: string;
  opened: boolean;
  created_at: string;
}

export interface MemorialReaction {
  id: string;
  pet_id: string;
  user_id: string;
  reaction_type: 'heart';
  created_at: string;
}

export interface Chronicle {
  id: string;
  pet_id: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_url: string | null;
  event_date: string | null;
  life_phase: string | null;
  mood: string | null;
  is_published: boolean;
  reading_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  profile_id: string;
  provider: 'stripe';
  provider_customer_id: string | null;
  provider_subscription_id: string | null;
  provider_checkout_id: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_id: PlanId;
  status: string;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string | null;
  type: 'support' | 'suggestion' | 'bug' | 'donation_intent';
  status: 'open' | 'in_progress' | 'resolved';
  title: string;
  message: string;
  category: string | null;
  impact: string | null;
  steps: string | null;
  expected_result: string | null;
  actual_result: string | null;
  contact_email: string | null;
  page_url: string | null;
  user_agent: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;
      };
      pets: {
        Row: Pet;
        Insert: Omit<Pet, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Pet, 'id' | 'owner_id' | 'created_at' | 'updated_at'>>;
      };
      timeline_entries: {
        Row: TimelineEntry;
        Insert: Omit<TimelineEntry, 'id' | 'created_at'>;
        Update: Partial<Omit<TimelineEntry, 'id' | 'pet_id' | 'created_at'>>;
      };
      time_capsules: {
        Row: TimeCapsule;
        Insert: Omit<TimeCapsule, 'id' | 'opened' | 'created_at'> & { title: string };
        Update: Partial<Pick<TimeCapsule, 'opened'>>;
      };
      tributes: {
        Row: Tribute;
        Insert: Omit<Tribute, 'id' | 'reviewed_at' | 'created_at'> & {
          status?: Tribute['status'];
        };
        Update: Partial<Pick<Tribute, 'status' | 'reviewed_at'>>;
      };
      memorial_reactions: {
        Row: MemorialReaction;
        Insert: Omit<MemorialReaction, 'id' | 'created_at' | 'reaction_type'> & {
          reaction_type?: MemorialReaction['reaction_type'];
        };
        Update: Partial<Pick<MemorialReaction, 'reaction_type'>>;
      };
      chronicles: {
        Row: Chronicle;
        Insert: Omit<Chronicle, 'id' | 'reading_minutes' | 'created_at' | 'updated_at'> & {
          reading_minutes?: number;
        };
        Update: Partial<Omit<Chronicle, 'id' | 'pet_id' | 'created_at' | 'updated_at'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<
          Subscription,
          | 'id'
          | 'provider'
          | 'provider_customer_id'
          | 'provider_subscription_id'
          | 'provider_checkout_id'
          | 'canceled_at'
          | 'created_at'
          | 'updated_at'
        > &
          Partial<Pick<
            Subscription,
            'provider' | 'provider_customer_id' | 'provider_subscription_id' | 'provider_checkout_id' | 'canceled_at'
          >>;
        Update: Partial<Omit<Subscription, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>;
      };
      support_tickets: {
        Row: SupportTicket;
        Insert: Omit<SupportTicket, 'id' | 'status' | 'created_at' | 'updated_at'> & {
          status?: SupportTicket['status'];
        };
        Update: Partial<Omit<SupportTicket, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
};
