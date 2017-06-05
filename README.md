# Neighbourhood Map

A single page web application featuring a map a neighborhood (favorite
places). Functionality of this map include highlighted locations,
additional data about those locations and various ways to browse the
content.

## Running

The application uses the Wikipedia GeoData service to show nearby
services when a location is selected.  To use this service, the
browser's cross-origin request policy may need to be modified to allow
the page served from a file: URL to make a request to the wikipedia
service.
For the firefox browser, the Cross Domain - CORS extension
(https://addons.mozilla.org/en-US/firefox/addon/cross-domain-cors/)
will let you do that.
For Chrome, Access-Control-Allow-Origin extension
(https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi?hl=en)

To use the application, open `index.html` in a web browser.
