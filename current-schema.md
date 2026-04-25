## Table `chronicles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `pet_id` | `uuid` |  |
| `title` | `text` |  |
| `content` | `text` |  |
| `excerpt` | `text` |  Nullable |
| `cover_url` | `text` |  Nullable |
| `event_date` | `date` |  Nullable |
| `life_phase` | `text` |  Nullable |
| `mood` | `text` |  Nullable |
| `is_published` | `bool` |  |
| `reading_minutes` | `int4` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `memorial_reactions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `pet_id` | `uuid` |  |
| `user_id` | `uuid` |  |
| `reaction_type` | `text` |  |
| `created_at` | `timestamptz` |  |

## Table `pets`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `owner_id` | `uuid` |  |
| `name` | `text` |  |
| `species` | `text` |  |
| `breed` | `text` |  Nullable |
| `birth_date` | `date` |  Nullable |
| `death_date` | `date` |  Nullable |
| `avatar_url` | `text` |  Nullable |
| `memorial_slug` | `text` |  Unique |
| `is_public` | `bool` |  |
| `tribute_text` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `email` | `text` |  |
| `full_name` | `text` |  Nullable |
| `avatar_url` | `text` |  Nullable |
| `plan_id` | `text` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `subscriptions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `profile_id` | `uuid` |  |
| `stripe_customer_id` | `text` |  Nullable |
| `stripe_subscription_id` | `text` |  Nullable Unique |
| `plan_id` | `text` |  |
| `status` | `text` |  |
| `current_period_end` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `provider` | `text` |  |
| `provider_customer_id` | `text` |  Nullable |
| `provider_subscription_id` | `text` |  Nullable |
| `provider_checkout_id` | `text` |  Nullable |
| `canceled_at` | `timestamptz` |  Nullable |

## Table `time_capsules`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `pet_id` | `uuid` |  |
| `message` | `text` |  |
| `open_at` | `timestamptz` |  |
| `opened` | `bool` |  |
| `created_at` | `timestamptz` |  |
| `title` | `text` |  |

## Table `timeline_entries`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `pet_id` | `uuid` |  |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `date` | `date` |  |
| `photo_urls` | `_text` |  |
| `created_at` | `timestamptz` |  |

## Table `tributes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `pet_id` | `uuid` |  |
| `author_name` | `text` |  |
| `author_relation` | `text` |  Nullable |
| `message` | `text` |  |
| `created_at` | `timestamptz` |  |
| `author_user_id` | `uuid` |  Nullable |
| `status` | `text` |  |
| `reviewed_at` | `timestamptz` |  Nullable |

