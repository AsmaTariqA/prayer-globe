import React, { useState, useEffect, useRef } from "react";
import Globe from "react-globe.gl";


// Helper function to convert 24-hour format to 12-hour format (AM/PM)
const convertTo12HourFormat = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const isPM = hours >= 12;
    const adjustedHours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
    const adjustedMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${adjustedHours}:${adjustedMinutes} ${isPM ? "PM" : "AM"}`;
};

export default function GlobeComponent() {
    const [prayerTimes, setPrayerTimes] = useState({});
    const [globeData, setGlobeData] = useState({ countries: { features: [] } });
    const [loading, setLoading] = useState(false);
    const globeEl = useRef();
   

    const [countryDetails, setCountryDetails] = useState({}); // Store country and capital mappings
    const [cityInput, setCityInput] = useState("");
    const [countryInput, setCountryInput] = useState("");

    // Fetch GeoJSON and countries data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch GeoJSON
                const geoResponse = await fetch("./countries.geo.json");
                const geoJson = await geoResponse.json();

                // Fetch countries.json
                const countriesResponse = await fetch("./countries.json");
                const countriesJson = await countriesResponse.json();

                // Map country names to capitals for quick lookup
                const details = {};
                countriesJson.forEach((item) => {
                    details[item.name] = item.capital;
                });

                setCountryDetails(details); // Set the country-capital mapping

                setGlobeData({ countries: geoJson });
            } catch (error) {
                console.error("Error fetching data:", error.message);
            }
            setLoading(false);
        };

        fetchData();
    }, []);

    // Fetch prayer times for a capital city
    const fetchPrayerTimes = async (city, country) => {
        try {
            const response = await fetch(
                `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=2`
            );
            const prayerData = await response.json();
            setPrayerTimes(prayerData.data.timings); // Set prayer times
        } catch (error) {
            console.error("Error fetching prayer times:", error);
        }
    };

    const handleSearch = () => {
        // Fetch prayer times for the city and country input
        fetchPrayerTimes(cityInput, countryInput);
    };

    return (
        <div style={{ display: "flex", height: "100vh", backgroundColor: "#111" }}>
            {/* Sidebar */}
            <div
                style={{
                    width: "250px",
                    background: "#222",
                    color: "#fff",
                    padding: "20px",
                    overflowY: "auto",
                    height: "100vh", 
                    flexShrink: 0,
                    borderRight: "2px solid #444",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                }}
            >
                <div>
                    <h3 style={{ marginBottom: "20px" }}>Search Prayer Times</h3>
                    <div style={{ marginBottom: "15px" }}>
                        <input
                            type="text"
                            placeholder="City"
                            value={cityInput}
                            onChange={(e) => setCityInput(e.target.value)}
                            style={{
                                padding: "10px",
                                width: "80%",
                                marginBottom: "10px",
                                borderRadius: "5px",
                                border: "1px solid #ccc",
                                fontSize: "16px",
                                backgroundColor: "#333", 
                                color: "#fff", 
                            }}
                        />
                        <input
                            type="text"
                            placeholder="Country"
                            value={countryInput}
                            onChange={(e) => setCountryInput(e.target.value)}
                            style={{
                                padding: "10px",
                                width: "80%",
                                marginBottom: "15px",
                                borderRadius: "5px",
                                border: "1px solid #ccc",
                                fontSize: "16px",
                                backgroundColor: "#333", 
                                color: "#fff", 
                            }}
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        style={{
                            padding: "10px 20px",
                            background: "#4CAF50",
                            color: "#fff",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            width: "100%",
                        }}
                    >
                        Search
                    </button>
                </div>

                {/* Prayer Times */}
                {prayerTimes && (
                    <div style={{marginBottom: "72px"}}>
                        <h4 style={{ fontSize: "18px", fontWeight: "bold",  }}>Prayer Times</h4>
                        <ul style={{ listStyleType: "none", paddingLeft: "0" }}>
                            {Object.keys(prayerTimes).map((key) => (
                                <li key={key} style={{  fontSize: "14px", marginTop: "12px" }}>
                                    <strong>{key}: </strong>{convertTo12HourFormat(prayerTimes[key])}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Globe */}
            <div style={{ flex: 1 }}>
                {loading && <p style={{ color: "#fff", textAlign: "center" }}>Loading...</p>}
                <Globe
                    ref={globeEl}
                    globeImageUrl="./earth-image.jpg"
                    backgroundImageUrl="./night-sky.png"
                    showAtmosphere={true}
                    hexPolygonsData={globeData.countries.features} 
                    hexPolygonResolution={3} 
                    hexPolygonMargin={0.3} 
                    hexPolygonUseDots={true} 
                    hexPolygonColor={() =>
                        `#${Math.round(Math.random() * Math.pow(2, 24))
                            .toString(16)
                            .padStart(6, "0")}` // Random hex colors
                    }
                    onHexPolygonHover={(polygon) => {
                        if (polygon?.properties) {
                            const countryName = polygon.properties?.name || polygon.properties?.ADMIN;
                            if (countryName) {
                                fetchPrayerTimes(countryDetails[countryName], countryName); 
                            }
                        }
                    }}
                    hexPolygonLabel={({ properties: d }) => {
                        const name = d.ADMIN || d.name; // Country name
                        const capital = countryDetails[name]; // Get the capital
                        const countryPrayerTimes = prayerTimes; // Get all prayer times

                        // Get individual prayer times and convert to 12-hour format
                        const fajr = convertTo12HourFormat(countryPrayerTimes?.Fajr || "N/A");
                        const dhuhr = convertTo12HourFormat(countryPrayerTimes?.Dhuhr || "N/A");
                        const asr = convertTo12HourFormat(countryPrayerTimes?.Asr || "N/A");
                        const maghrib = convertTo12HourFormat(countryPrayerTimes?.Maghrib || "N/A");
                        const isha = convertTo12HourFormat(countryPrayerTimes?.Isha || "N/A");

                        return ` 
                            <div style="padding: 12px 16px; background: rgba(255, 255, 255, 0.85); border-radius: 10px; font-family: 'Arial', sans-serif; font-size: 14px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);">
                                <strong style="font-size: 16px; color: #333;">${name}</strong><br/>
                                <em style="font-size: 13px; color: #666;">Capital: ${capital || "N/A"}</em><br/>
                                <hr style="border: none; border-top: 1px solid #ccc; margin: 8px 0;" />
                                <div style="font-size: 14px; color: #333;">
                                    <strong>Prayer Times:</strong><br/>
                                    <div><strong>Fajr:</strong> ${fajr}</div>
                                    <div><strong>Dhuhr:</strong> ${dhuhr}</div>
                                    <div><strong>Asr:</strong> ${asr}</div>
                                    <div><strong>Maghrib:</strong> ${maghrib}</div>
                                    <div><strong>Isha:</strong> ${isha}</div>
                                </div>
                            </div>
                        `;
                    }}
                />
            </div>
        </div>
    );
}
