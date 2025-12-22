# CarShopper SaaS Architecture

## 1. High-Level Architecture

```mermaid
graph TD
    User[User] -->|HTTPS| Frontend[Next.js App]
    Frontend -->|Auth & Data| Supabase[Supabase (Auth/DB)]
    Frontend -->|API Calls| Backend[Node.js Backend]
    
    Backend -->|Cron/Trigger| Apify[Apify Platform]
    Apify -->|Scrape Data| ExtSites[eBay / FB Marketplace]
    Apify -->|Webhook/Result| Backend
    
    Backend -->|Fetch Inventory| AutoDev[Auto.dev API]
    
    Backend -->|Store/Update Listings| Supabase
```

## 2. Components

### 2.1 Frontend (Next.js)
- **Framework**: Next.js 14+ (App Router).
- **Styling**: Tailwind CSS.
- **State Management**: React Query (for server state), Zustand (for UI state).
- **Hosting**: Vercel (recommended).

### 2.2 Backend (Node.js)
- **Role**: Data Aggregation Service.
- **Framework**: Express.js or Next.js API Routes (Serverless). *Recommendation: Standalone Node.js service for robust cron/long-running scraping tasks.*
- **Responsibilities**:
    - `POST /api/refresh-listings`: Triggers scraping jobs for active user searches.
    - `POST /webhooks/apify`: Receives scraped data.
    - `GET /api/inventory`: Complex filtering API (if Supabase direct query isn't sufficient).
    - **Deduplication**: Logic to merge duplicates across sources (VIN matching).

### 2.3 Database (Supabase PostgreSQL)

#### Schema Overview

**Users**
- `id` (UUID, PK) -> links to `auth.users`
- `email`
- `created_at`

**UserProiles (Search Preferences)**
- `user_id` (FK)
- `makes` (Array)
- `min_price`, `max_price`
- `min_year`, `max_year`
- `max_mileage`
- `zip_code`
- `radius_miles`

**Vehicles_Inventory**
- `id` (UUID, PK)
- `source_id` (String, unique per source)
- `source` (Enum: 'autodev', 'ebay', 'facebook')
- `vin` (String, nullable)
- `make`, `model`, `year`, `trim`
- `price` (Int)
- `mileage` (Int)
- `location_raw` (String)
- `images` (JSONB Array)
- `url` (String)
- `status` (Active, Sold)
- `last_updated` (Timestamp)

**User_Interactions**
- `user_id` (FK)
- `vehicle_id` (FK)
- `status` (Enum: 'favorite', 'rejected')
- `created_at`

### 2.4 Data Flow
1.  **Search Creation**: User sets preferences in Dashboard.
2.  **Ingestion**: 
    - **Scheduled**: Backend runs daily jobs for all active user preferences.
    - **On-Demand**: User clicks "Refresh" -> Triggers immediate check (rate limited).
3.  **Scraping**: 
    - Apify actors launched with search parameters.
    - Auto.dev API queried for dealer stock.
4.  **Normalization**: All incoming data mapped to `Vehicles_Inventory` schema.
5.  **Presentation**: 
    - Front-end queries `Vehicles_Inventory`.
    - Filters: `WHERE matches_user_prefs AND id NOT IN (SELECT vehicle_id FROM User_Interactions WHERE status='rejected')`.
    - Sorts: Rank by algorithm.
    - Limits: Top 10.
