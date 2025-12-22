# CarShopper SaaS Requirements

## 1. Overview
CarShopper is a SaaS platform that aggregates vehicle listings from multiple sources (dealers, private sellers) to provide users with a curated "Top 10" list of vehicles matching their specific preferences.

## 2. Core Features

### 2.1 User Profiles & Authentication (Supabase)
- **Sign Up / Login**: Email/Password and Social Login via Supabase Auth.
- **User Preferences**:
    - Make, Model, Year range.
    - Price range (Min/Max).
    - Mileage range.
    - Location / Radius.
    - "Rejected" vehicle history (database of VINs/IDs user has swiped left on).
- **Favorites**: Save specific vehicles.
- **Alerts**: Email/SMS notifications for new matches (optional/future).

### 2.2 Vehicle Search & Aggregation
- **Sources**:
    1.  **Dealer Inventory**: Fetched via **auto.dev API**.
    2.  **Private Sellers**: Scraped from **eBay Motors** and **Facebook Marketplace** using **Apify**.
- **Data Points**:
    - Price, Mileage, Year, Make, Model, Trim.
    - Location (City, State, Zip).
    - Images (thumbnail + gallery).
    - Original Listing Link.
    - Source (Dealer, eBay, FB).

### 2.3 The "Top 10" Dashboard
- **Always-on Dashboard**: The main view for logged-in users.
- **Algorithm**:
    - Filters inventory based on user preferences.
    - Excludes "Rejected" vehicles.
    - Ranks remaining vehicles (logic to be defined, likely best price/mileage ratio or newest listing).
    - limit to top 10 results.
- **Interactions**:
    - **View Details**: Open modal or page with more info.
    - **Favorite**: Save to shortlist.
    - **Reject**: Remove from dashboard permanently (add to rejected list).
    - **Go to Listing**: External link to the source.

### 2.4 Backend & Scraping
- **Node.js Backend**:
    - Orchestrates data fetching.
    - Scheduled jobs (Cron) to trigger Apify runs and Auto.dev syncs.
    - API endpoints for the frontend dashboard.
- **Apify Integration**:
    - Task management for scraping jobs.
    - Webhook handling or polling for results.

## 3. Technology Stack
- **Frontend**: React, Next.js, Tailwind CSS.
- **Backend**: Node.js (Express or Next.js API Routes).
- **Database**: Supabase (PostgreSQL).
- **Scraping**: Apify (eBay, FB Marketplace).
- **Dealer API**: Auto.dev.
