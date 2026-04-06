import { LayoutTemplate, NewsItem } from './types';


export const MOCK_LAYOUTS: LayoutTemplate[] = [
  {
    templateId: "tpl-standard",
    name: "Standard Article",
    gridColumns: 12,
    blocks: [
      { id: "b1", type: "title", label: "Headline", grid: { colSpan: 12 } },
      { id: "b2", type: "image", label: "Hero Image", grid: { colSpan: 12 } },
      { id: "b3", type: "author", label: "Author", grid: { colSpan: 6 } },
      { id: "b4", type: "publishDate", label: "Publish Date", grid: { colSpan: 6 } },
      { id: "b5", type: "excerpt", label: "Summary", grid: { colSpan: 12 } },
      { id: "b6", type: "markdown", label: "Main Content", grid: { colSpan: 8 } },
      { id: "b7", type: "tags", label: "Tags", grid: { colSpan: 4 } },
      { id: "b8", type: "divider", label: "Footer Split", grid: { colSpan: 12 } }
    ]
  },
  {
    templateId: "tpl-visual",
    name: "Visual Story",
    gridColumns: 12,
    blocks: [
      { id: "vb1", type: "image", label: "Cover Image", grid: { colSpan: 12 } },
      { id: "vb2", type: "title", label: "Title Overlay", grid: { colSpan: 8 } },
      { id: "vb3", type: "markdown", label: "Intro", grid: { colSpan: 4 } },
      { id: "vb4", type: "divider", label: "Separator", grid: { colSpan: 12 } },
      { id: "vb5", type: "markdown", label: "Story Body", grid: { colSpan: 12 } }
    ]
  }
];

export const MOCK_NEWS_ITEMS: NewsItem[] = [
  {
    id: "news-001",
    templateId: "tpl-standard",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date(Date.now() - 86400000).toISOString(),
    status: "published",
    author: "Jane Doe",
    tags: ["Cyber attacks", "Critical Infrastructure accident"],
    blocks: [
      { blockId: "b1", type: "title", value: "The Future of AI in Web Development" },
      { blockId: "b2", type: "image", value: { src: "https://picsum.photos/800/400?random=1", caption: "AI coding assistant" } },
      { blockId: "b3", type: "author", value: "Jane Doe" },
      { blockId: "b4", type: "publishDate", value: new Date(Date.now() - 86400000).toISOString() },
      { blockId: "b5", type: "excerpt", value: "How generative models are reshaping the landscape of frontend engineering." },
      { blockId: "b6", type: "markdown", value: "## A New Era\n\nArtificial Intelligence is no longer just a buzzword. From **code generation** to automated testing, it's everywhere.\n\n* Efficiency\n* Creativity\n* Speed\n\nDevelopers can now focus on architecture." },
      { blockId: "b7", type: "tags", value: ["Cyber attacks", "Critical Infrastructure accident"] }
    ]
  },
  {
    id: "news-002",
    templateId: "tpl-standard",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: null,
    status: "pending_approval",
    author: "John Smith",
    tags: ["Health Risk"],
    blocks: [
      { blockId: "b1", type: "title", value: "Top 10 Coffee Shops in Seattle" },
      { blockId: "b2", type: "image", value: { src: "https://picsum.photos/800/400?random=2", caption: "Latte Art" } },
      { blockId: "b5", type: "excerpt", value: "A curated list of the best brews in the Emerald City." },
      { blockId: "b6", type: "markdown", value: "If you love caffeine, you're in the right place..." },
      { blockId: "b7", type: "tags", value: ["Health Risk"] }
    ]
  },
  {
    id: "news-003",
    templateId: "tpl-visual",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    publishedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    status: "published",
    author: "Visual Team",
    tags: ["Travel Risk", "Natural Hazards"],
    blocks: [
      { blockId: "vb1", type: "image", value: { src: "https://picsum.photos/1200/600?random=3", caption: "Mountain Peak" } },
      { blockId: "vb2", type: "title", value: "Alpine Adventures" },
      { blockId: "vb3", type: "markdown", value: "**Climbing higher** than ever before." },
      { blockId: "vb5", type: "markdown", value: "The air was thin, but the view was worth it. We started our journey at dawn..." },
      { blockId: "vb6", type: "tags", value: ["Travel Risk", "Natural Hazards"] }
    ]
  },
];

export const CITY_COORDINATES: Record<string, [number, number]> = {
  'delhi': [77.2090, 28.6139],
  'mumbai': [72.8777, 19.0760],
  'bengaluru': [77.5946, 12.9716],
  'chennai': [80.2707, 13.0827],
  'hyderabad': [78.4867, 17.3850],
  'kolkata': [88.3639, 22.5726],
  'pune': [73.8567, 18.5204],
  'kashmir': [74.7973, 34.0837],
  'srinagar': [74.7973, 34.0837],
  'northeast': [91.7362, 26.1445],
  'guwahati': [91.7362, 26.1445],
  'border': [74.8723, 31.6340],
  'amritsar': [74.8723, 31.6340],
  'ahmedabad': [72.5714, 23.0225],
  'jaipur': [75.7873, 26.9124],
  'lucknow': [80.9462, 26.8467],
  'patna': [85.1376, 25.5941],
  'bhopal': [77.4126, 23.2599],
  'chandigarh': [76.7794, 30.7333],
  'kochi': [76.2673, 9.9312],
  'trivandrum': [76.9366, 8.5241],
  'bhubaneswar': [85.8245, 20.2961],
  'dehradun': [78.0322, 30.3165],
  'ranchi': [85.3090, 23.3441],
  'raipur': [81.6296, 21.2514],
  'shimla': [77.1734, 31.1048],
  'panaji': [73.8567, 15.4909],
  'itanagar': [93.6053, 27.0844],
  'dispur': [91.7898, 26.1433],
  'agartala': [91.2863, 23.8315],
  'shillong': [91.8833, 25.5788],
  'aizawl': [92.7176, 23.7271],
  'kohima': [94.1086, 25.6751],
  'imphal': [93.9368, 24.8170],
  'gangtok': [88.6138, 27.3314],
  'vijayawada': [80.6480, 16.5062],
  'vizag': [83.2185, 17.6868],
  'visakhapatnam': [83.2185, 17.6868],
  'kanpur': [80.3319, 26.4499],
  'nagpur': [79.0882, 21.1458],
  'indore': [75.8577, 22.7196],
  'thane': [72.9775, 19.2183],
  'ludhiana': [75.8573, 30.9010],
  'surat': [72.8311, 21.1702],
  'national': [78.9629, 22.5937],
  'india': [78.9629, 22.5937]
};

export const TIER_1_CITIES = [
  'mumbai',
  'delhi',
  'bengaluru',
  'chennai',
  'kolkata',
  'hyderabad',
  'pune'
];

