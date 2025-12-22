# Functional Test Plan (Automated)

This document outlines the Automated Tests required for the CarShopper system, written in plain English.

## 1. Authentication & User Management
- **Test 1.1**: User can sign up with a valid email and password.
    - *Expectation*: User account is created in Supabase, user is logged in, and redirected to the onboarding/preference setup page.
- **Test 1.2**: User can log in with valid credentials.
    - *Expectation*: Successful login, redirection to Dashboard.
- **Test 1.3**: User cannot log in with invalid credentials.
    - *Expectation*: Error message displayed, user remains on login page.
- **Test 1.4**: User can log out.
    - *Expectation*: Session cleared, redirected to Landing/Login page.

## 2. Preference Management
- **Test 2.1**: User can save search preferences (Make: Toyota, Model: Camry, Price: <$20k).
    - *Expectation*: Preferences are saved to `UserProfiles` table. Dashboard indicates "Loading recommendations...".
- **Test 2.2**: User can update existing preferences.
    - *Expectation*: New values replace old ones in the database.

## 3. Data Aggregation (Backend Integration)
- **Test 3.1**: Mock Auto.dev API response is correctly parsed and inserted into `Vehicles_Inventory`.
    - *Expectation*: Database contains new vehicle records matching the mock data.
- **Test 3.2**: Mock Apify webhook payload (eBay/FB) is correctly parsed and inserted into `Vehicles_Inventory`.
    - *Expectation*: Database contains new vehicle records matching the scrape data.
- **Test 3.3**: Duplicate vehicles (same VIN or Source ID) update the existing record instead of creating duplicates.
    - *Expectation*: `last_updated` timestamp changes, count of records does not increase.

## 4. Dashboard & Recommendation Logic
- **Test 4.1**: Dashboard displays vehicles matching user preferences.
    - *Setup*: Insert 5 matching vehicles and 5 non-matching vehicles into DB.
    - *Expectation*: Only the 5 matching vehicles appear in the list.
- **Test 4.2**: Dashboard limits results to Top 10.
    - *Setup*: Insert 20 matching vehicles.
    - *Expectation*: Only 10 items are displayed.
- **Test 4.3**: "Rejected" vehicles do not reappear.
    - *Step 1*: User clicks "Reject" on Vehicle A.
    - *Step 2*: Refresh Dashboard.
    - *Expectation*: Vehicle A is no longer visible.
- **Test 4.4**: "Favorited" vehicles are accessible in Favorites list.
    - *Step 1*: User clicks "Favorite" on Vehicle B.
    - *Step 2*: Navigate to Favorites page.
    - *Expectation*: Vehicle B is listed there.

## 5. System Resilience
- **Test 5.1**: API Gracefully handles Auto.dev timeouts.
    - *Expectation*: System logs error, but dashboard still loads whatever other data is available.
- **Test 5.2**: API Gracefully handles Apify failures.
    - *Expectation*: System logs error, notifies admin (optional), user sees "Data from [Source] currently unavailable".
