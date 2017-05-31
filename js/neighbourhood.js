var startingLocations = [
    {location: {lat: 37.810635, lng: -122.4115931}, info: "sea lions"}, // sea lions
    {location: {lat: 37.2789093, lng: -121.9322583}, info: "chez sovan"},  // chez sovan
    {location: {lat: 37.664639, lng: -122.467593}, info: "moonstar"}, // moonstar
    {location: {lat: 37.7499159, lng: -122.1466504}, info: "oakland zoo"}, // oakland zoo
    {location: {lat: 37.3234287, lng: -122.0486346}, info: "kobe pho & grill"}, // kobe pho & grill
];

function NeighbourhoodModel(map, geocoder, infoWindow) {
    this.neighbourhood = {
	'map': map,
	'geocoder': geocoder,
	'infoWindow': infoWindow,
	'places': ko.observableArray(),
    }

    this.filterText = ko.observable();

    var self = this;
    this.filterText.subscribe(function (newValue) {
	ko.unwrap(self.neighbourhood.places).forEach(function (item) {
	    if (item['info']().indexOf(newValue) == -1) {
		item['visible'](false);
	    } else {
		item['visible'](true);
	    }
	});
    });
}

ko.bindingHandlers.favourites = {
    init: function(element, valueAccessor, allBindings) {
	var neighbourhood = ko.unwrap(valueAccessor());

	var places = neighbourhood.places;
	var theMap = neighbourhood.map;

        startingLocations.forEach(function (item) {
            var marker = new google.maps.Marker({
                position: item.location,
                map: theMap
            });
	    var visibility = ko.observable(true);
	    var infoText = ko.observable(item.info);
            marker.addListener('click', function() {
                showInfoFor(theMap, marker, neighbourhood.infoWindow, ko.unwrap(infoText));
            });
            places.push({'marker': marker, 'location': item.location,
			 'info': infoText,
			 'visible': visibility});
	    visibility.subscribe(function (newValue) {
		if (newValue) {
		    marker.setMap(theMap);
		} else {
		    marker.setMap(null);
		}
	    });
	    neighbourhood.geocoder.geocode({'location': item.location}, function(results, status) {
		if (status === 'OK') {
		    text = results[0].formatted_address;
		    infoText(text);
		} else {
		    window.alert('Geocoder failed due to: ' + status);
		}
	    });
        });
    },

    update: function(element, valueAccessor, allBindings) {
	var neighbourhood = ko.unwrap(valueAccessor());

	var places = ko.unwrap(neighbourhood.places);
	var theMap = neighbourhood.map;

        places.forEach(function (item) {
            if (item['marker'] != null) {
                return;
            }
            var marker = new google.maps.Marker({
                position: item['location'],
                map: theMap
            });
            marker.addListener('click', function() {
                showInfoFor(neighbourhood.geocoder, theMap, marker,
			    neighbourhood.infoWindow);
            });
            item['marker'] = marker;
        });
    }
}

function initMap() {
    var bounds = new google.maps.LatLngBounds();
    startingLocations.forEach(function (item) {
	bounds.extend(item.location);
    });
    var map = new google.maps.Map(document.getElementById('map'), {
        center: bounds.getCenter(),
	zoom: 9
    });
    map.fitBounds(bounds);

    var geocoder = new google.maps.Geocoder;
    var infoWindow = new google.maps.InfoWindow;

    ko.applyBindings(new NeighbourhoodModel(map, geocoder, infoWindow));
}

function showInfoFor(map, marker, infoWindow, text) {
    infoWindow.setContent(text);
    infoWindow.open(map, marker);
}
