
import { CITY_COORDINATES } from './constants';

function extractLocationTags(title, content) {
  const text = (title + ' ' + content).toLowerCase();
  const tags = new Set(['OSINT']);
  
  let foundSpecificLocation = false;

  // Check for city matches from constants
  Object.keys(CITY_COORDINATES).forEach(city => {
    if (city === 'national') return;
    // Word boundary check to avoid partial matches
    const regex = new RegExp(`\\b${city}\\b`, 'i');
    if (regex.test(text)) {
      tags.add(city.charAt(0).toUpperCase() + city.slice(1));
      foundSpecificLocation = true;
    }
  });

  // Aggressive National Filtering
  const isNationalSource = text.includes('india') || text.includes('national') || text.includes('pib');
  
  // Only add 'National' if we didn't find a specific city OR if it's explicitly a national-level keyword
  if (!foundSpecificLocation || (isNationalSource && !foundSpecificLocation)) {
    tags.add('National');
  }

  return Array.from(tags);
}

const testTitle = "Bengaluru, Chennai, Mumbai Hotels Flag LPG Cylinder Shortage, Centre Responds";
const testContent = "Dummy content about hotels in various cities.";
console.log("Result Tags:", extractLocationTags(testTitle, testContent));
