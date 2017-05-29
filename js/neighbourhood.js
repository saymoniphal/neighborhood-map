var startingLocations = [
    {lat: 37.8106392, lng: -122.4137818}, // sea lions
    {lat: 37.2789135, lng: -121.934447},  // chez sovan
    {lat: 37.6646415, lng: -122.4688944}, // moonstar
    {lat: 37.7499201, lng: -122.1488391}, // oakland zoo
    {lat: 37.3234317, lng: -122.0501822}, // kobe pho & grill
];

function NeighbourhoodModel(map, geocoder, infoWindow) {
    this.neighbourhood = {
	'map': map,
	'geocoder': geocoder,
	'infoWindow': infoWindow,
	'places': ko.observableArray(),
    }
}

ko.bindingHandlers.favourites = {
    init: function(element, valueAccessor, allBindings) {
	var neighbourhood = ko.unwrap(valueAccessor());

	var places = ko.unwrap(neighbourhood.places);
	var theMap = neighbourhood.map;

        startingLocations.forEach(function (item) {
            var marker = new google.maps.Marker({
                position: item,
                map: theMap
            });
            marker.addListener('click', function() {
                showInfoFor(neighbourhood.geocoder, theMap, marker,
			    neighbourhood.infoWindow);
            });
            places.push({'marker': marker, 'location': item});
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
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: startingLocations[0],
    });

    var geocoder = new google.maps.Geocoder;
    var infoWindow = new google.maps.InfoWindow;

    ko.applyBindings(new NeighbourhoodModel(map, geocoder, infoWindow));
}

function showInfoFor(geocoder, map, marker, infoWindow) {
    var position = marker.getPosition();
    geocoder.geocode({'location': position}, function(results, status) {
        if (status === 'OK') {
            if (results[0]) {
                infoWindow.setContent(results[0].formatted_address);
                infoWindow.open(map, marker);
            } else {
                window.alert('No results found');
            }
        } else {
            window.alert('Geocoder failed due to: ' + status);
        }
    });
}
