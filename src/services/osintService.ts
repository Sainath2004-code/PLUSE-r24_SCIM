  import { NewsItem } from '../types';
import { CITY_COORDINATES, TIER_1_CITIES } from '../constants';

// Authoritative Indian National Intelligence Sources
const RSS_SOURCES = [
  { name: 'PIB Official', url: 'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=2&Regid=3' },
  { name: 'The Hindu National', url: 'https://www.thehindu.com/news/national/feeder/default.rss' },
  { name: 'ANI India', url: 'https://www.aninews.in/rss/feed/' },
  { name: 'India Today National', url: 'https://www.indiatoday.in/rss/home' },
  { name: 'TOI India', url: 'https://timesofindia.indiatimes.com/rssfeeds/-2128936835.cms' },
  { name: 'NDTV India', url: 'https://feeds.feedburner.com/ndtvnews-top-stories' }
];

const RSS2JSON_BASE = '/.netlify/functions/osint-proxy?rss_url=';

// Strategic NLP keywords for severity scoring
const CRITICAL_KEYWORDS = ['attack', 'terror', 'blast', 'crash', 'dead', 'killed', 'cyber', 'hack', 'breach', 'critical', 'explosion', 'ambush', 'insurgency', 'border conflict'];
const HIGH_KEYWORDS = ['arrest', 'threat', 'warning', 'storm', 'flood', 'protest', 'strike', 'scam', 'fraud', 'high', 'emergency', 'fire', 'deployment', 'missile'];

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

  // Check for city matches from Tier-1 Cities ONLY (as per user request)
  TIER_1_CITIES.forEach(city => {
    // Word boundary check to avoid partial matches
    const regex = new RegExp(`\\b${city}\\b`, 'i');
    if (regex.test(text)) {
      tags.add(city.charAt(0).toUpperCase() + city.slice(1));
      foundSpecificLocation = true;
    }
  });

  // Aggressive National Filtering - Only if no Tier-1 city found
  // Note: These will be filtered out in fetchLiveNationalNews if no Tier-1 city is present
  const isNationalSource = text.includes('india') || text.includes('national') || text.includes('pib');
  
  if (!foundSpecificLocation && isNationalSource) {
    tags.add('National');
  }

  return Array.from(tags);
}

export const osintService = {
  fetchLiveNationalNews: async (): Promise<NewsItem[]> => {
    try {
      // Bypassing 3rd party cache by appending a unique 10-minute resolution timestamp
      const cacheBust = Math.floor(Date.now() / 600000);

      const fetchPromises = RSS_SOURCES.map(source => {
        const feedUrl = `${source.url}${source.url.includes('?') ? '&' : '?'}t=${cacheBust}`;
        return fetch(`${RSS2JSON_BASE}${encodeURIComponent(feedUrl)}`)
          .then(res => res.json())
          .then(data => ({ source: source.name, items: data.items || [] }))
          .catch(err => {
            console.warn(`OSINT: Failed to fetch from ${source.name}`, err);
            return { source: source.name, items: [] };
          });
      });

      const results = await Promise.all(fetchPromises);
      const allItems: NewsItem[] = [];

      results.forEach(({ source, items }) => {
        items.forEach((item: any, index: number) => {
          const title = item.title || '';
          const description = item.description || '';
          const severity = determineSeverity(title, description);
          const tags = extractLocationTags(title, description);

          // FILTER: Only keep items that mention at least one Tier-1 city
          // Tags includes 'OSINT' by default, so we check if there's at least one more tag
          // and that tag is NOT 'National' (unless it also has a Tier-1 city)
          const hasTier1City = tags.some(tag => 
            TIER_1_CITIES.some(city => tag.toLowerCase() === city.toLowerCase())
          );

          if (!hasTier1City) {
            // Ignore this item as it doesn't focus on Tier-1 cities
            return;
          }
          
          allItems.push({
            id: `osint-${source}-${index}-${Date.now()}`,
            templateId: 'tpl-1764398847255', // Verified standard template ID
            status: 'pending_approval',
            author: `${source} | Intelligence Feed`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            publishedAt: item.pubDate ? new Date(item.pubDate.replace(/-/g, '/')).toISOString() : new Date().toISOString(),
            severity: severity,
            tags: tags,
            blocks: [
              { blockId: `b1-${index}`, type: 'title', value: title },
              { blockId: `b2-${index}`, type: 'category', value: tags.includes('National') ? 'National' : (tags[1] || 'General') },
              { blockId: `b3-${index}`, type: 'excerpt', value: description.replace(/<[^>]+>/g, '').substring(0, 200) + '...' },
              ...(item.enclosure?.link || item.thumbnail ? [{ 
                blockId: `b4-${index}`, 
                type: 'image', 
                value: { src: item.enclosure?.link || item.thumbnail, caption: `OSINT Visual: ${source}` } 
              }] : []),
              { blockId: `b5-${index}`, type: 'markdown', value: (item.content || item.description || '').replace(/<[^>]+>/g, '\n\n') + `\n\n*Source: ${source} Intelligence*\n\nVerified via national OSINT sensors. [Full Report](${item.link})` }
            ],
            meta: {
              source: 'osint_feed',
              externalLink: item.link,
              guid: item.guid || item.link || title
            }
          });
        });
      });

      // Sort by date (descending) and take top 30
      const sorted = allItems.sort((a, b) => 
        new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime()
      ).slice(0, 30);

      console.log(`OSINT Engine: Aggregated and processed ${sorted.length} national intelligence items.`);
      return sorted;

    } catch (error) {
      console.error('OSINT aggregated fetch failed:', error);
      return [];
    }
  }
};
