# Ovqat AI Database Schema Diagram

## Entity Relationship Diagram

```mermaid
erDiagram
    users ||--o| user_profiles : "has one"
    users ||--o| user_goals : "has one"
    users ||--o{ user_meals : "has many"

    users {
        uuid id PK
        text phone UK
        boolean onboarding_completed
        timestamptz created_at
        timestamptz updated_at
    }

    user_profiles {
        uuid id PK
        uuid user_id FK,UK
        text gender
        integer age
        numeric weight_kg
        numeric height_cm
        text workout_freq
        text primary_goal
        text activity_level
        text diet_type
        timestamptz created_at
        timestamptz updated_at
    }

    user_goals {
        uuid id PK
        uuid user_id FK,UK
        integer goal_calories
        numeric goal_protein_g
        numeric goal_carbs_g
        numeric goal_fat_g
        timestamptz created_at
        timestamptz updated_at
    }

    user_meals {
        uuid id PK
        uuid user_id FK
        text meal_id UK
        date date
        text time
        text name
        text description
        text image_url
        integer calories
        numeric protein_g
        numeric carbs_g
        numeric fat_g
        numeric fiber_g
        integer health_score
        text language
        timestamptz created_at
    }
```

## Data Flow Diagram

```mermaid
flowchart TD
    A[User Registration] --> B[Create users record]
    B --> C{Onboarding?}
    C -->|Yes| D[Complete Questionnaire]
    C -->|No| E[Skip to Home]
    D --> F[Save user_profiles]
    F --> G[Calculate Goals]
    G --> H[Save user_goals]
    H --> E
    
    E --> I[Take Photo]
    I --> J[AI Analysis]
    J --> K[Save user_meals]
    K --> L[Update UI]
    
    style A fill:#e1f5ff
    style B fill:#fff4e1
    style F fill:#fff4e1
    style H fill:#fff4e1
    style K fill:#fff4e1
    style J fill:#ffe1f5
```

## Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant P as Partner App
    participant B as Backend API
    participant S as Supabase
    participant F as Frontend

    U->>P: Enter phone number
    P->>B: POST /api/auth/phone
    B->>S: Check users table
    alt User exists
        S-->>B: Return user_id
        B-->>P: JWT token + user_id
    else New user
        B->>S: INSERT into users
        S-->>B: New user_id
        B-->>P: JWT token + user_id
    end
    P->>F: Open WebView with ?token=xyz
    F->>B: POST /api/auth/verify
    B-->>F: Valid + user_id
    F->>S: Load user data
    S-->>F: Profile + Goals + Meals
    F-->>U: Show Home Screen
```

## Meal Tracking Flow

```mermaid
flowchart LR
    A[📸 Take Photo] --> B[🤖 AI Analysis]
    B --> C{Is Food?}
    C -->|Yes| D[Show Nutrition]
    C -->|No| E[Show Retake]
    D --> F[User Confirms]
    F --> G[Save to DB]
    G --> H[Update Cache]
    H --> I[Show in History]
    
    style A fill:#e1f5ff
    style B fill:#ffe1f5
    style D fill:#e1ffe1
    style E fill:#ffe1e1
    style G fill:#fff4e1
```

## Data Retention

```mermaid
gantt
    title Meal History Retention (4 Days)
    dateFormat YYYY-MM-DD
    section Visible
    Today           :active, 2025-10-25, 1d
    Yesterday       :active, 2025-10-24, 1d
    2 Days Ago      :active, 2025-10-23, 1d
    3 Days Ago      :active, 2025-10-22, 1d
    section Deleted
    4+ Days Ago     :crit, 2025-10-21, 1d
```

## Table Relationships

### One-to-One Relationships
- `users` → `user_profiles` (1:1)
- `users` → `user_goals` (1:1)

### One-to-Many Relationships
- `users` → `user_meals` (1:N)

### Cascade Behavior
- Delete user → Deletes profile, goals, and all meals
- Delete meal → No cascade (isolated delete)

## Indexes Overview

```mermaid
graph TD
    A[user_meals queries] --> B{Query Type}
    B -->|By user & date| C[idx_user_meals_user_id_date]
    B -->|Recent meals| D[idx_user_meals_created_at]
    
    E[users queries] --> F[idx_users_phone]
    
    G[user_profiles queries] --> H[idx_user_profiles_user_id]
    
    I[user_goals queries] --> J[idx_user_goals_user_id]
    
    style C fill:#e1ffe1
    style D fill:#e1ffe1
    style F fill:#e1ffe1
    style H fill:#e1ffe1
    style J fill:#e1ffe1
```

## RLS Policy Structure

```mermaid
graph LR
    A[Request] --> B{RLS Check}
    B -->|SELECT| C[Allow All]
    B -->|INSERT| D[Allow All]
    B -->|UPDATE| E[Allow All]
    B -->|DELETE| F{Table?}
    F -->|user_meals| G[Allow All]
    F -->|others| H[Deny]
    
    style C fill:#e1ffe1
    style D fill:#e1ffe1
    style E fill:#e1ffe1
    style G fill:#e1ffe1
    style H fill:#ffe1e1
```

## Query Performance

### Fast Queries ✅
- Get user by phone: `idx_users_phone`
- Get meals by date: `idx_user_meals_user_id_date`
- Get recent meals: `idx_user_meals_created_at`
- Get profile: `idx_user_profiles_user_id`
- Get goals: `idx_user_goals_user_id`

### Slow Queries ⚠️
- Full table scans without WHERE
- Queries without indexed columns
- Complex JOINs across all tables

## Storage Estimates

### Per User (Average)

| Data Type | Size | Count | Total |
|-----------|------|-------|-------|
| User record | ~200 bytes | 1 | 200 B |
| Profile | ~500 bytes | 1 | 500 B |
| Goals | ~200 bytes | 1 | 200 B |
| Meal (no image) | ~500 bytes | 80 | 40 KB |
| Meal images | ~100 KB | 80 | 8 MB |
| **Total per user** | | | **~8 MB** |

### 10,000 Users
- Database: ~410 MB
- Images: ~80 GB
- **Total: ~80 GB**

## Backup Strategy

```mermaid
flowchart TD
    A[Daily Backup] --> B{Backup Type}
    B -->|Full| C[All Tables]
    B -->|Incremental| D[Changed Records]
    
    C --> E[Store in S3]
    D --> E
    
    E --> F{Retention}
    F -->|Daily| G[Keep 7 days]
    F -->|Weekly| H[Keep 4 weeks]
    F -->|Monthly| I[Keep 12 months]
    
    style A fill:#e1f5ff
    style E fill:#fff4e1
    style G fill:#e1ffe1
    style H fill:#e1ffe1
    style I fill:#e1ffe1
```

---

## Legend

| Symbol | Meaning |
|--------|---------|
| PK | Primary Key |
| FK | Foreign Key |
| UK | Unique Key |
| 📸 | User Action |
| 🤖 | AI Processing |
| ✅ | Optimized |
| ⚠️ | Needs Attention |

---

**Generated:** October 25, 2025  
**Schema Version:** 001  
**Tool:** Mermaid.js
