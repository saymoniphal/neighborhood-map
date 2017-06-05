// -*- indent-tabs-mode: nil -*-

// Locations to be marked on the map
var startingLocations = [
    {location: {lat: 37.810635, lng: -122.4115931}, info: "sea lions"},
    {location: {lat: 37.2789093, lng: -121.9322583}, info: "chez sovan"},
    {location: {lat: 37.664639, lng: -122.467593}, info: "moonstar"},
    {location: {lat: 37.7499159, lng: -122.1466504}, info: "oakland zoo"},
    {location: {lat: 37.3720051, lng: -122.0389073}, info: "sunnyvale library"},
];

// 
function NeighbourhoodModel(map, geocoder, placesService, infoWindow) {
    this.neighbourhood = {
        'map': map,
        'geocoder': geocoder,
        'placesService': placesService,
        'infoWindow': infoWindow,
        'places': ko.observableArray(),
        'currentActive': null,
        'nearby': ko.observableArray(),
    }

    this.filterText = ko.observable();

    var self = this;
    this.filterText.subscribe(function (newValue) {
        ko.unwrap(self.neighbourhood.places).forEach(function (item) {
            if (item.displayText().toLowerCase().indexOf(newValue.toLowerCase()) == -1) {
                item.visible(false);
            } else {
                item.visible(true);
            }
        });
    });
}

// Use wikipedia API to get nearby places
function loadNearby(place, neighbourhood) {
    url = 'https://en.wikipedia.org/w/api.php?origin=*';
    query = {
        action: 'query',
        format: 'json',
        list: 'geosearch',
        gsradius: '1000',
        gscoord: place.location.lat + '|' + place.location.lng,
    };
    neighbourhood.nearby.removeAll();
    $.getJSON(url, query)
        .done(function(data) {
            data.query.geosearch.forEach(function (item) {
                neighbourhood.nearby.push({'name': item.title,
                                       'pageid': item.pageid});
            });
        })
        .fail(function() {
            console.log("Error querying wikipedia for nearby location!");
        });
}

function gotoPage(nearbyPlace) {
    url = 'https://en.wikipedia.org/w/api.php?origin=*';
    query = {
        action: 'query',
        format: 'json',
        prop: 'info',
        inprop: 'url',
        pageids: nearbyPlace.pageid,
    };
    $.getJSON(url, query)
        .done(function(data) {
            wikipediaUrl = data.query.pages[nearbyPlace.pageid].fullurl;
            window.location.href = wikipediaUrl;
        })
        .fail(function() {
            console.log("Fail to go to wikipedia page!");
        });
}

function makeActive(newPlace, neighbourhood) {
    if (neighbourhood.currentActive !== null) {
        neighbourhood.currentActive.active(false);
    }
    newPlace.active(true);
    neighbourhood.currentActive = newPlace;
    loadNearby(newPlace, neighbourhood);
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
            var addressText = ko.observable('');
            var active = ko.observable(false);
            var newPlace = {'marker': marker, 'location': item.location,
                            'info': infoText, 'address': addressText,
                            'visible': visibility, 'active': active};
            marker.addListener('click', function() {
                makeActive(newPlace, neighbourhood);
            });
            // animate the marker on the map when a place is selected
            active.subscribe(function (newValue) {
                if (newValue) {
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                    showInfoFor(theMap, neighbourhood.infoWindow, newPlace);
                } else {
                    marker.setAnimation(null);
                }
            });
            var displayText = ko.computed(function() {
                return '<div>' + '<h4>' + newPlace.info() + '</h4>\n<p>' +
                                        newPlace.address() + '</p>';
            }, newPlace);
            newPlace.displayText = displayText;
            places.push(newPlace);
            visibility.subscribe(function (newValue) {
                if (newValue) {
                    marker.setMap(theMap);
                } else {
                    marker.setMap(null);
                }
            });
            ko.tasks.schedule(function() {
                neighbourhood.geocoder.geocode({'location': item.location},
                                                function(results, status) {
                    if (status === 'OK') {
                        text = results[0].formatted_address;
                        addressText(text);
                    } else {
                        window.alert('Geocoder failed due to: ' + status);
                    }
                })
            });
            var nearbyRequest = {
                location: item.location,
                type: 'point_of_interest',
                rankBy: google.maps.places.RankBy.DISTANCE
            };
            neighbourhood.placesService.nearbySearch(nearbyRequest,
                                                    function(results, status) {
                if (status === 'OK') {
                    infoText(results[0].name);
                } else {
                    window.alert('Places search failed due to: ' + status);
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
        zoom: 9,
        styles: [{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#747474"},{"lightness":"23"}]},{"featureType":"poi.attraction","elementType":"geometry.fill","stylers":[{"color":"#f38eb0"}]},{"featureType":"poi.government","elementType":"geometry.fill","stylers":[{"color":"#ced7db"}]},{"featureType":"poi.medical","elementType":"geometry.fill","stylers":[{"color":"#ffa5a8"}]},{"featureType":"poi.park","elementType":"geometry.fill","stylers":[{"color":"#c7e5c8"}]},{"featureType":"poi.place_of_worship","elementType":"geometry.fill","stylers":[{"color":"#d6cbc7"}]},{"featureType":"poi.school","elementType":"geometry.fill","stylers":[{"color":"#c4c9e8"}]},{"featureType":"poi.sports_complex","elementType":"geometry.fill","stylers":[{"color":"#b1eaf1"}]},{"featureType":"road","elementType":"geometry","stylers":[{"lightness":"100"}]},{"featureType":"road","elementType":"labels","stylers":[{"visibility":"off"},{"lightness":"100"}]},{"featureType":"road.highway","elementType":"geometry.fill","stylers":[{"color":"#ffd4a5"}]},{"featureType":"road.arterial","elementType":"geometry.fill","stylers":[{"color":"#ffe9d2"}]},{"featureType":"road.local","elementType":"all","stylers":[{"visibility":"simplified"}]},{"featureType":"road.local","elementType":"geometry.fill","stylers":[{"weight":"3.00"}]},{"featureType":"road.local","elementType":"geometry.stroke","stylers":[{"weight":"0.30"}]},{"featureType":"road.local","elementType":"labels.text","stylers":[{"visibility":"on"}]},{"featureType":"road.local","elementType":"labels.text.fill","stylers":[{"color":"#747474"},{"lightness":"36"}]},{"featureType":"road.local","elementType":"labels.text.stroke","stylers":[{"color":"#e9e5dc"},{"lightness":"30"}]},{"featureType":"transit.line","elementType":"geometry","stylers":[{"visibility":"on"},{"lightness":"100"}]},{"featureType":"water","elementType":"all","stylers":[{"color":"#d2e7f7"}]}]
    });
    map.fitBounds(bounds);

    var geocoder = new google.maps.Geocoder;
    var placesService = new google.maps.places.PlacesService(map);
    var infoWindow = new google.maps.InfoWindow;

    ko.applyBindings(new NeighbourhoodModel(map, geocoder, placesService, infoWindow));
}

function showInfoFor(map, infoWindow, place) {
    infoWindow.setContent(place.displayText());
    infoWindow.open(map, place.marker);
}
