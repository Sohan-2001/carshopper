require('dotenv').config();
const { ApifyClient } = require('apify-client');
const { createClient } = require('@supabase/supabase-js');

// --- CONFIGURATION ---
// Keep STAGING=true if you want to verify data first, or false to go live
const USE_STAGING = true;
const TABLE_NAME = USE_STAGING ? 'staging_vehicles' : 'vehicles';

const CARS_TO_SCRAPE = [
    { make: 'Honda', model: 'Civic' },
    { make: 'Toyota', model: 'Camry' },
    { make: 'Ford', model: 'F-150' },
    { make: 'Nissan', model: 'Altima' }
];

const apifyClient = new ApifyClient({
    token: process.env.APIFY_API_TOKEN,
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function saveToDatabase(vehicles) {
    if (vehicles.length === 0) return;

    const { error } = await supabase
        .from(TABLE_NAME)
        .upsert(vehicles, { onConflict: 'marketplace_url' });

    if (error) console.error(`❌ Supabase Error:`, error.message);
    else console.log(`✅ Saved ${vehicles.length} cars to '${TABLE_NAME}'.`);
}

async function scrapeCarsCom(make, model) {
    console.log(`\n🚗 [Cars.com] Scraping ${make} ${model}...`);
    // Search constraints: Used cars, Max Price $100k, Nationwide
    const searchUrl = `https://www.cars.com/shopping/results/?stock_type=used&makes[]=${make.toLowerCase()}&models[]=${make.toLowerCase()}-${model.toLowerCase()}&list_price_max=100000&maximum_distance=all&zip=90210`;

    try {
        const run = await apifyClient.actor('agenscrape/cars-com-scraper').call({
            searchUrl: searchUrl,
            maxResults: 20 // Adjust this number based on your budget/needs
        });

        const { items } = await apifyClient.dataset(run.defaultDatasetId).listItems();

        if (!items || items.length === 0) {
            console.log(`No items found for ${make} ${model}`);
            return [];
        }

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
    console.log(`--- STARTING BATCH SCRAPE -> ${TABLE_NAME} ---`);

    for (const car of CARS_TO_SCRAPE) {
        const vehicles = await scrapeCarsCom(car.make, car.model);
        await saveToDatabase(vehicles);

        // Polite delay
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    console.log("--- BATCH COMPLETE ---");
}

runBatch();