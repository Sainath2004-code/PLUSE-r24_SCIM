import fs from 'fs';

async function fetchDatameet() {
    const urls = [
        "https://raw.githubusercontent.com/coderash/India-State-GeoJson/master/india_state.geojson",
        "https://raw.githubusercontent.com/Subhash9325/GeoJson-Data-of-Indian-States/master/Indian_States",
        "https://raw.githubusercontent.com/datameet/maps/master/States/Admin2.geojson", 
        "https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson"
    ];
    
    for (const url of urls) {
        try {
            console.log("Trying " + url);
            const res = await fetch(url);
            if (!res.ok) continue;
            
            let data = await res.text();
            
            // Validate it looks like JSON
            if (data.includes("FeatureCollection")) {
                fs.writeFileSync('src/assets/india_states.json', data);
                console.log("Successfully downloaded and saved from " + url);
                console.log("Size: " + data.length + " bytes");
                return;
            }
        } catch (e) {
            console.error(e.message);
        }
    }
    console.log("Failed to find a valid geojson.");
}

fetchDatameet();
