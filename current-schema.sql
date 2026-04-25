-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.chronicles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pet_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  cover_url text,
  event_date date,
  life_phase text,
  mood text,
  is_published boolean NOT NULL DEFAULT true,
  reading_minutes integer NOT NULL DEFAULT 1 CHECK (reading_minutes >= 1),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chronicles_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id)
);
CREATE TABLE public.memorial_reactions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pet_id uuid NOT NULL,
  user_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'heart'::text CHECK (reaction_type = 'heart'::text),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT memorial_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT memorial_reactions_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id),
  CONSTRAINT memorial_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.pets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  species text NOT NULL,
  breed text,
  birth_date date,
  death_date date,
  avatar_url text,
  memorial_slug text NOT NULL UNIQUE,
  is_public boolean NOT NULL DEFAULT true,
  tribute_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT pets_pkey PRIMARY KEY (id),
  CONSTRAINT pets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  plan_id text NOT NULL DEFAULT 'free'::text CHECK (plan_id = ANY (ARRAY['free'::text, 'premium'::text, 'lifetime'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  profile_id uuid NOT NULL,
  stripe_customer_id text,
  stripe_subscription_id text UNIQUE,
  plan_id text NOT NULL DEFAULT 'free'::text CHECK (plan_id = ANY (ARRAY['free'::text, 'premium'::text, 'lifetime'::text])),
  status text NOT NULL DEFAULT 'inactive'::text,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  provider text NOT NULL DEFAULT 'stripe'::text,
  provider_customer_id text,
  provider_subscription_id text,
  provider_checkout_id text,
  canceled_at timestamp with time zone,
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.time_capsules (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pet_id uuid NOT NULL,
  message text NOT NULL,
  open_at timestamp with time zone NOT NULL,
  opened boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL DEFAULT 'Capsula do tempo'::text,
  CONSTRAINT time_capsules_pkey PRIMARY KEY (id),
  CONSTRAINT time_capsules_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id)
);
CREATE TABLE public.timeline_entries (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pet_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  photo_urls ARRAY NOT NULL DEFAULT '{}'::text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT timeline_entries_pkey PRIMARY KEY (id),
  CONSTRAINT timeline_entries_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id)
);
CREATE TABLE public.tributes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  pet_id uuid NOT NULL,
  author_name text NOT NULL,
  author_relation text,
  message text NOT NULL CHECK (char_length(message) <= 600),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  author_user_id uuid,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  reviewed_at timestamp with time zone,
  CONSTRAINT tributes_pkey PRIMARY KEY (id),
  CONSTRAINT tributes_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id),
  CONSTRAINT tributes_author_user_id_fkey FOREIGN KEY (author_user_id) REFERENCES public.profiles(id)
);