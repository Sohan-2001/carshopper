require('dotenv').config({ path: '../.env' });
const { ApifyClient } = require('apify-client');
const { createClient } = require('@supabase/supabase-js');

// --- CONFIGURATION ---
// Toggle this to TRUE when testing new scrapers, FALSE for production
const USE_STAGING = true;
const TABLE_NAME = USE_STAGING ? 'staging_vehicles' : 'vehicles';

// The list of cars to scrape daily
const CARS_TO_SCRAPE = [
    { make: 'Honda', model: 'Civic' },
    { make: 'Toyota', model: 'Camry' },
    { make: 'Ford', model: 'F-150' }
];

const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase Environment Variables!');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'NOT SET');
    console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'NOT SET');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function saveToDatabase(vehicles) {
    if (vehicles.length === 0) return;

    // Save to the configured table (vehicles OR staging_vehicles)
    const { error } = await supabase
        .from(TABLE_NAME)
        .upsert(vehicles, { onConflict: 'marketplace_url' });

    if (error) console.error(`❌ Supabase Error (${TABLE_NAME}):`, error.message);
    else console.log(`✅ Saved ${vehicles.length} cars to '${TABLE_NAME}'.`);
}

// --- SCRAPER: Cars.com ---
async function scrapeCarsCom(make, model) {
    console.log(`\n🚗 [Cars.com] Scraping ${make} ${model}...`);
    const searchUrl = `https://www.cars.com/shopping/results/?stock_type=used&makes[]=${make.toLowerCase()}&models[]=${make.toLowerCase()}-${model.toLowerCase()}&list_price_max=100000&maximum_distance=all&zip=90210`;

    try {
        const run = await apifyClient.actor('agenscrape/cars-com-scraper').call({
            searchUrl: searchUrl,
            maxResults: 20
        });

        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

        return items.map(item => ({
            title: item.title || `${item.year} ${item.make} ${item.model}`,
            price: item.price ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : 0,
            mileage: item.mileage ? `${item.mileage} miles` : 'N/A',
            location: 'USA',
            image_url: item.image || (item.images?.length ? item.images[0] : null),
            marketplace_url: `https://www.cars.com${item.url}`,
            source: 'Cars.com',
            search_term: `${make} ${model}`,
            make: make,
            model: model,
            year: item.year ? parseInt(item.year) : null,
            posted_date: new Date().toISOString()
        }));
    } catch (err) {
        console.error(`[Cars.com] Failed:`, err.message);
        return [];
    }
}

async function runBatch() {
    console.log(`Starting Bulk Scrape -> Target Table: ${TABLE_NAME}`);

    for (const car of CARS_TO_SCRAPE) {
        // Run Scraper
        const carsComData = await scrapeCarsCom(car.make, car.model);
        await saveToDatabase(carsComData);

        // Wait 5 seconds between cars to be polite
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    console.log("\n--- Bulk Scrape Complete ---");
}

runBatch();