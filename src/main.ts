import "leaflet/dist/leaflet.css";
import "./style.css";
import leaflet from "leaflet";
import luck from "./luck";
import "./leafletWorkaround";

const MERRILL_CLASSROOM = leaflet.latLng({
    lat: 36.9995,
    lng: -122.0533
});

const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const PIT_SPAWN_PROBABILITY = 0.1;

const mapContainer = document.querySelector<HTMLElement>("#map")!;

const map = leaflet.map(mapContainer, {
    center: MERRILL_CLASSROOM,
    zoom: GAMEPLAY_ZOOM_LEVEL,
    minZoom: GAMEPLAY_ZOOM_LEVEL,
    maxZoom: GAMEPLAY_ZOOM_LEVEL,
    zoomControl: false,
    scrollWheelZoom: false
});

leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
}).addTo(map);

const playerMarker = leaflet.marker(MERRILL_CLASSROOM);
playerMarker.bindTooltip("That's you!");
playerMarker.addTo(map);

let points = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "No points yet...";

// Store cache data in an array
const caches = [];

function makePit(i, j) {
    const bounds = leaflet.latLngBounds([
        [MERRILL_CLASSROOM.lat + i * TILE_DEGREES,
        MERRILL_CLASSROOM.lng + j * TILE_DEGREES],
        [MERRILL_CLASSROOM.lat + (i + 1) * TILE_DEGREES,
        MERRILL_CLASSROOM.lng + (j + 1) * TILE_DEGREES],
    ]);

    // Generate deterministically random coin value
    const coinValue = Math.floor(luck([i, j, "coinValue"].toString()) * 100);

    // Create a cache object
    const cache = {
        location: [i, j],
        coins: coinValue
    };

    // Add a cache to the map with a popup
    const pit = leaflet.rectangle(bounds) as leaflet.Layer;
    pit.bindPopup(() => {
        const container = document.createElement("div");
        container.innerHTML = `
            <div>Cache at "${i},${j}"</div>
            <div>Coins: <span id="coinValue">${coinValue}</span></div>
            <button id="collect">Collect Coins</button>
            <button id="deposit">Deposit Coins</button>`;
        const collectButton = container.querySelector<HTMLButtonElement>("#collect")!;
        const depositButton = container.querySelector<HTMLButtonElement>("#deposit")!;
        const coinValueDisplay = container.querySelector<HTMLSpanElement>("#coinValue")!;

        collectButton.addEventListener("click", () => {
            if (cache.coins > 0) {
                cache.coins--;
                points++;
                coinValueDisplay.textContent = cache.coins.toString();
                statusPanel.innerHTML = `${points} points accumulated`;
            }
        });

        depositButton.addEventListener("click", () => {
            if (points > 0) {
                points--;
                cache.coins++;
                coinValueDisplay.textContent = cache.coins.toString();
                statusPanel.innerHTML = `${points} points accumulated`;
            }
        });

        return container;
    });

    caches.push(cache);
    pit.addTo(map);
}

for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
    for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
        if (luck([i, j].toString()) < PIT_SPAWN_PROBABILITY) {
            makePit(i, j);
        }
    }
}
