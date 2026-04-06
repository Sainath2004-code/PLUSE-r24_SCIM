import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual simple .env parser since we aren't using Vite's server here
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = {};

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            envConfig[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
    });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envConfig['VITE_SUPABASE_URL'];
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || envConfig['VITE_SUPABASE_ANON_KEY'];

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Migration failed: missing Supabase credentials in .env.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TAG_MAP = {
    'all': 'All',
    'geopolitics': 'Diplomatic Visits',
    'defense': 'National Threat',
    'internal security': 'Civil Disturbances',
    'cyber': 'Cyber attacks',
    'economy': 'Major Upcoming events',
    'terrorism': 'Terrorist attack / incident',
    'border intelligence': 'Monitoring',
    'travel': 'Travel Risk',
    'tech': 'Cyber attacks',
    'ai': 'Cyber attacks',
    'future': 'long term issue (updates & Monitoring)'
};

async function migrate() {
    console.log('Fetching news items...');
    const { data: newsItems, error: fetchError } = await supabase.from('news_items').select('*');
    
    if (fetchError) {
        console.error('Error fetching items:', fetchError);
        return;
    }

    if (!newsItems || newsItems.length === 0) {
        console.log('No news items found. Done.');
        return;
    }

    let updatedCount = 0;

    for (const item of newsItems) {
        let changed = false;
        
        // Update tags array
        const oldTags = item.tags || [];
        const newTags = [];
        for (const tag of oldTags) {
            const lowerTag = tag.trim().toLowerCase();
            if (TAG_MAP[lowerTag]) {
                newTags.push(TAG_MAP[lowerTag]);
                changed = true;
            } else {
                newTags.push(tag);
            }
        }
        
        // Re-assign distinct values
        const distinctTags = Array.from(new Set(newTags));
        
        // We also need to update the embedded tags in blocks if they exist
        let newBlocks = item.blocks || [];
        if (Array.isArray(item.blocks)) {
             newBlocks = item.blocks.map(block => {
                 if (block.type === 'tags' && Array.isArray(block.value)) {
                     const updatedBlockTags = block.value.map(t => TAG_MAP[t.trim().toLowerCase()] || t);
                     if (JSON.stringify(block.value) !== JSON.stringify(updatedBlockTags)) {
                         changed = true;
                     }
                     return { ...block, value: Array.from(new Set(updatedBlockTags)) };
                 }
                 return block;
             });
        }

        if (changed) {
            console.log(\`Updating item \${item.id} from \${JSON.stringify(oldTags)} to \${JSON.stringify(distinctTags)}\`);
            const { error: updateError } = await supabase
                .from('news_items')
                .update({ tags: distinctTags, blocks: newBlocks })
                .eq('id', item.id);
                
            if (updateError) {
                console.error(\`Failed to update \${item.id}:\`, updateError);
            } else {
                updatedCount++;
            }
        }
    }

    console.log(\`\\nMigration complete. Updated \${updatedCount} out of \${newsItems.length} news items.\`);
}

migrate().catch(console.error);
