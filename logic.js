function createMap(earthquakePoints) {

  // Create the tile layer that will be the background of our map
  var lightmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/light-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}", {
    attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.light",
    accessToken: API_KEY
  });

  var outdoormap = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.outdoor",
    accessToken: API_KEY
  });

  var satellitemap = L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: "Map data &copy; <a href=\"http://openstreetmap.org\">OpenStreetMap</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"http://mapbox.com\">Mapbox</a>",
    maxZoom: 18,
    id: "mapbox.satellite",
    accessToken: API_KEY
  });

  // Create a baseMaps object to hold the lightmap layer
  var baseMaps = {
    "Satellite" : satellitemap,
    "Grayscale": lightmap,
    "Outdoors" : outdoormap
  };

    // Create the map object with options
    var map = L.map("map", {
      center: [37.7749, -122.4194],
      zoom: 4,
      layers: [satellitemap, earthquakePoints]
    });

  var platelayer = plates();
  platelayer.addTo(map);

  // Create an overlayMaps object to hold the earthquakePoints layer
  var overlayMaps = {
    "Earthquakes": earthquakePoints,
    "Fault Lines" : platelayer
  };

  // Create a layer control, pass in the baseMaps and overlayMaps. Add the layer control to the map
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false
  }).addTo(map);


  var legend = L.control({position: 'bottomright'});
  legend.onAdd = function (map) {

    var div = L.DomUtil.create('div', 'legend'),
        mag = [0.5, 1.5, 2.5, 3.5, 4.5, 5.5],
        labels = ["0-1", "1-2", "2-3", "3-4", "4-5", "5+"];

    // loop through our density intervals and generate a label with a colored square for each interval
    for (var i = 0; i < mag.length; i++) {
        div.innerHTML +=
            '<div><span style="background-color: ' + chooseColor(mag[i]) + '"></span>' + labels[i] +'</div>';
    }
    
    return div;
  };
  legend.addTo(map);

}

function plates(){
  var plates = new L.layerGroup();

  platesURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json"

  d3.json(platesURL, function(response) {
    function lineStyle(feature) {
      return {
        weight: 2,
        color: "orange"
      };
    }

    L.geoJSON(response, {
      style: lineStyle
    }).addTo(plates);
  })
  return plates;
}

function chooseColor(mag) {
  //console.log(mag);
  switch (true) {
  case (mag < 1.0):
    return "#B7F34D";
  case mag >= 1.0 && mag <2.0:
    return "#E1F34D";
  case mag >= 2.0 && mag <3.0:
    return "#F3DB4D";
  case mag >= 3.0 && mag <4.0:
    return "#F3BA4D";
  case mag >= 4.0 && mag <5.0:
    return "#F0A76B";
  default:
    return "#F06B6B";
  }
}

function createMarkers(response) {

  // Pull the "earthquakes" property off of response.data
  var earthquakes = response.features;

  // Initialize an array to hold earthquakes markers
  var earthquakesMarkers = [];

  // Loop through the earthquakes array
  for (var index = 0; index < earthquakes.length; index++) {
    var earthquake = earthquakes[index];

    // For each earthquake, create a marker and bind a popup with the earthquake's name
    var earthquakesMarker = L.circle([earthquake.geometry.coordinates[1], earthquake.geometry.coordinates[0]], {
      fillOpacity: 0.75,
      color: "black",
      fillColor: chooseColor(earthquake.properties.mag),
      radius: earthquake.properties.mag * 20000,
      weight: .25
    })
      .bindPopup("<h3>Place: " + earthquake.properties.place + "</h3><h4>Magnitude: " + earthquake.properties.mag + "</h4><h4>Date & Time: " + Date(earthquake.properties.time)  + "</h4>");

    // Add the marker to the earthquakesMarkers array
    earthquakesMarkers.push(earthquakesMarker);
  }

  // Create a layer group made from the bike markers array, pass it into the createMap function
  createMap(L.layerGroup(earthquakesMarkers));
  //createPolyLine();
}

// Perform an API call to the Citi Bike API to get earthquake information. Call createMarkers when complete
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson", createMarkers);

