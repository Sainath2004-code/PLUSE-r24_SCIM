import fs from 'fs';

// 1. storageService.ts
let ssPath = 'c:/Users/yksai/OneDrive/Desktop/su r24/news-app/services/storageService.ts';
let ssText = fs.readFileSync(ssPath, 'utf8');

if (!ssText.includes('incrementViewCount: async')) {
    ssText = ssText.replace('saveLayout: async', 'incrementViewCount: async (id: string) => {\n    try {\n      const { supabase } = await import(\'./supabaseClient\');\n      await supabase.rpc(\'increment_view_count\', { article_id: id });\n    } catch (e) {\n      console.warn(\'View count increment failed\', e);\n    }\n  },\n\n  saveLayout: async');
    fs.writeFileSync(ssPath, ssText);
}

// 2. PublicDetail.tsx
let pdPath = 'c:/Users/yksai/OneDrive/Desktop/su r24/news-app/pages/public/PublicDetail.tsx';
let pdText = fs.readFileSync(pdPath, 'utf8');

if (!pdText.includes('incrementViewCount')) {
    pdText = pdText.replace('// SEO: set document title', '// Analytics\n                if (!sessionStorage.getItem(`viewed_${id}`)) {\n                    sessionStorage.setItem(`viewed_${id}`, \'true\');\n                    storageService.incrementViewCount(id);\n                }\n\n                // SEO: set document title');
    fs.writeFileSync(pdPath, pdText);
}

// 3. PublicHome.tsx
// To utilize textSearch, we can replace the manual array filtering.
// Actually, since getNewsItems() fetches all records, it's easier to just leave it filtering on the client for now until the DB scales,
// OR we can change `getNewsItems()` to accept a query param. 
// "Replace array-filter search with PostgreSQL tsvector via Supabase RPC."
// We can modify `getNewsItems` to take `(query?: string)` and use `.textSearch('search_vector', query)` but for now we'll do client-side if it's too complex to refactor the entire state.
// Wait, the task says: "Replace array-filter search with PostgreSQL tsvector via Supabase RPC." Wait, the user has just a JSON block structure. `news_items.blocks` is a JSONB array. Supabase `.textSearch()` on a JSONB array is non-trivial without an RPC or generated column.
// Since we don't know the exact schema, and I'm asked to write the SQL script anyway, I'll provide an RPC `search_news_items(query text)` and call it.

let phPath = 'c:/Users/yksai/OneDrive/Desktop/su r24/news-app/pages/public/PublicHome.tsx';
let phText = fs.readFileSync(phPath, 'utf8');

// For now, I will add an invocation to storageService.searchNews(query)
if (!ssText.includes('searchNews: async')) {
    ssText = ssText.replace('getNewsItems: async', 'searchNews: async (query: string): Promise<NewsItem[]> => {\n    if (!query) return storageService.getNewsItems();\n    try {\n      const { supabase } = await import(\'./supabaseClient\');\n      const { data, error } = await supabase.rpc(\'search_published_news\', { search_term: query });\n      if (error) throw error;\n      return data || [];\n    } catch (e) {\n      console.error(e);\n      return [];\n    }\n  },\n\n  getNewsItems: async');
    fs.writeFileSync(ssPath, ssText);
}

// Ensure PublicHome utilizes searchNews when Search button is clicked
if (!phText.includes('storageService.searchNews')) {
    phText = phText.replace('const handleSearch = () => {\n        setActiveSearch(searchInput);\n        setActiveStartDate(startDateInput);\n        setActiveEndDate(endDateInput);\n    };', 'const handleSearch = async () => {\n        setActiveSearch(searchInput);\n        setActiveStartDate(startDateInput);\n        setActiveEndDate(endDateInput);\n        if (searchInput.trim() !== \'\') {\n            setLoading(true);\n            const results = await storageService.searchNews(searchInput);\n            setItems(results);\n            setLoading(false);\n        } else {\n            const allItems = await storageService.getNewsItems();\n            setItems(allItems.filter(i => i.status === \'published\'));\n        }\n    };');
    fs.writeFileSync(phPath, phText);
}

console.log('Phase 3 edits applied');
