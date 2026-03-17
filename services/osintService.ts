import { NewsItem } from '../types';
import { CITY_COORDINATES } from '../constants';

// Indian National Intelligence Sources
const RSS_SOURCES = [
  { name: 'TOI National', url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms' },
  { name: 'NDTV National', url: 'https://feeds.feedburner.com/ndtvnews-top-stories' },
  { name: 'ANI National', url: 'https://www.aninews.in/rss/feed/' }
];

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';

// Simple NLP keywords for scoring
const CRITICAL_KEYWORDS = ['attack', 'terror', 'blast', 'crash', 'dead', 'killed', 'cyber', 'hack', 'breach', 'critical', 'explosion', 'ambush'];
const HIGH_KEYWORDS = ['arrest', 'threat', 'warning', 'storm', 'flood', 'protest', 'strike', 'scam', 'fraud', 'high', 'emergency', 'fire'];

function determineSeverity(title: string, content: string): NewsItem['severity'] {
  const text = (title + ' ' + content).toLowerCase();
  if (CRITICAL_KEYWORDS.some(kw => text.includes(kw))) return 'critical';
  if (HIGH_KEYWORDS.some(kw => text.includes(kw))) return 'high';
  return 'info';
}

function extractLocationTags(title: string, content: string): string[] {
  const text = (title + ' ' + content).toLowerCase();
  const tags: Set<string> = new Set(['OSINT']);
  
  let foundSpecificLocation = false;

  // Check for city matches from constants
  Object.keys(CITY_COORDINATES).forEach(city => {
    // Basic word boundary check to avoid partial matches (e.g. "it" in "digital")
    const regex = new RegExp(`\\b${city}\\b`, 'i');
    if (regex.test(text)) {
      tags.add(city.charAt(0).toUpperCase() + city.slice(1));
      foundSpecificLocation = true;
    }
  });

  if (!foundSpecificLocation) {
    tags.add('National');
  } else {
    // If specific cities found, can still be national
    if (text.includes('india') || text.includes('national')) {
      tags.add('National');
    }
  }

  return Array.from(tags);
}

export const osintService = {
  fetchLiveNationalNews: async (): Promise<NewsItem[]> => {
    try {
      const fetchPromises = RSS_SOURCES.map(source => 
        fetch(`${RSS2JSON_BASE}${encodeURIComponent(source.url)}`)
          .then(res => res.json())
          .then(data => ({ source: source.name, items: data.items || [] }))
          .catch(err => {
            console.warn(`OSINT: Failed to fetch from ${source.name}`, err);
            return { source: source.name, items: [] };
          })
      );

      const results = await Promise.all(fetchPromises);
      const allItems: NewsItem[] = [];

      results.forEach(({ source, items }) => {
        items.forEach((item: any, index: number) => {
          const title = item.title || '';
          const description = item.description || '';
          const severity = determineSeverity(title, description);
          const tags = extractLocationTags(title, description);
          
          allItems.push({
            id: `osint-${source}-${index}-${Date.now()}`,
            templateId: 'tpl-standard',
            status: 'pending_approval',
            author: `${source} | Intelligence Feed`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: item.pubDate ? new Date(item.pubDate.replace(/-/g, '/')).toISOString() : new Date().toISOString(),
            severity: severity,
            tags: tags,
            blocks: [
              { blockId: `b1-${index}`, type: 'title', value: title },
              { blockId: `b2-${index}`, type: 'excerpt', value: description.replace(/<[^>]+>/g, '').substring(0, 200) + '...' },
              ...(item.enclosure?.link || item.thumbnail ? [{ 
                blockId: `b3-${index}`, 
                type: 'image', 
                value: { src: item.enclosure?.link || item.thumbnail, caption: `OSINT Visual: ${source}` } 
              }] : []),
              { blockId: `b4-${index}`, type: 'markdown', value: (item.content || item.description || '').replace(/<[^>]+>/g, '\n\n') + `\n\n*Source: ${source} Intelligence*\n\nVerified via national OSINT sensors. [Full Report](${item.link})` }
            ],
            meta: {
              source: 'osint_feed',
              externalLink: item.link,
              guid: item.guid || item.link
            }
          });
        });
      });

      // Sort by date (descending) and take top 30
      const sorted = allItems.sort((a, b) => 
        new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime()
      ).slice(0, 30);

      console.log(`OSINT Engine: Aggragated and processed ${sorted.length} national intelligence items.`);
      return sorted;

    } catch (error) {
      console.error('OSINT aggregated fetch failed:', error);
      return [];
    }
  }
};
