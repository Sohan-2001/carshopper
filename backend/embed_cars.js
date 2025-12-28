require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Init Supabase with SERVICE ROLE KEY (Admin Access)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // <--- ✅ CHANGED TO ADMIN KEY
);

// Init Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

async function generateEmbedding(text) {
    const result = await model.embedContent(text);
    return result.embedding.values; // Returns array of 768 numbers
}

async function processBatch() {
    console.log("🧠 Starting Gemini Embedding process...");

    // 1. Fetch cars without embeddings
    const { data: cars, error } = await supabase
        .from('staging_vehicles')
        .select('id, title, price, mileage, make, model')
        .is('embedding', null)
        .limit(50);

    if (error) {
        console.error("Fetch error:", error);
        return;
    }

    if (!cars || cars.length === 0) {
        console.log("✅ All cars embedded! Exiting...");
        return;
    }

    console.log(`Processing ${cars.length} cars...`);

    for (const car of cars) {
        // Descriptive string
        const description = `For Sale: ${car.year || ''} ${car.make} ${car.model} ${car.title}. Price: $${car.price}. Mileage: ${car.mileage}.`;

        try {
            const vector = await generateEmbedding(description);

            // Save back to DB
            const { error: updateError } = await supabase
                .from('staging_vehicles')
                .update({ embedding: vector })
                .eq('id', car.id);

            if (updateError) throw updateError;

            process.stdout.write("."); // Progress dot
        } catch (err) {
            console.error(`\nError embedding car ${car.id}:`, err.message);
        }
    }
    console.log("\nBatch complete.");
}

processBatch();