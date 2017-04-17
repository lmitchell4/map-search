
var model = {
  // These are the place listings that will be shown to the user.
  // Normally we'd have these in a database instead.  
  locations: [
    {title: "Shedd Aquarium", location: {lat: 41.8676217, lng: -87.6136616}},
    // {title: "Brookfield Zoo", location: {lat: 41.8350288, lng: -87.83363030000001}},
    {title: "Lincoln Park Zoo", location: {lat: 41.9187897, lng: -87.635465}},
    // {title: "Museum of Science and Industry", location: {lat: 41.7906088, lng: -87.5830586}},
    {title: "Field Museum of Natural History", location: {lat: 41.8661733, lng: -87.61698620000001}},
    {title: "Art Institute of Chicago", location: {lat: 41.879347, lng: -87.621228}},
    // {title: "National Museum of Mexican Art", location: {lat: 41.8561698, lng: -87.6729641}},
    {title: "Chicago History Museum", location: {lat: 41.9119691, lng: -87.6315025}},
    {title: "International Museum of Surgical Science", location: {lat: 41.910275, lng: -87.62661969999999}},
    {title: "Adler Planetarium", location: {lat: 41.8663557, lng: -87.60661159999999}},
    // {title: "Museum of Contemporary Art", location: {lat: 41.8972116, lng: -87.62107069999999}},
    // {title: "Navy Pier", location: {lat: 41.891731, lng: -87.60225869999999}},
    {title: "Soldier Field", location: {lat: 41.8622646, lng: -87.61663820000001}}
    // {title: "Wrigley Field", location: {lat: 41.9474536, lng: -87.6561341}}
  ]
}



var map;

// Create a new blank array for all the listing markers.
var markers = [];
var allLocations = ko.observableArray([]);

var timer;

// This global polygon variable is to ensure only ONE polygon is rendered.
var polygon = null;

// Create placemarkers array to use in multiple functions to have control
// over the number of places that show.
var placeMarkers = [];


function initMap() {
  // Create a styles array to use with the map.
  var styles = [
    {
      featureType: "water",
      stylers: [
        { color: "#19a0d8" }
      ]
    },{
      featureType: "administrative",
      elementType: "labels.text.stroke",
      stylers: [
        { color: "#ffffff" },
        { weight: 6 }
      ]
    },{
      featureType: "administrative",
      elementType: "labels.text.fill",
      stylers: [
        { color: "#e85113" }
      ]
    },{
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [
        { color: "#efe9e4" },
        { lightness: -40 }
      ]
    },{
      featureType: "transit.station",
      stylers: [
        { weight: 9 },
        { hue: "#e85113" }
      ]
    },{
      featureType: "road.highway",
      elementType: "labels.icon",
      stylers: [
        { visibility: "off" }
      ]
    },{
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [
        { lightness: 100 }
      ]
    },{
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [
        { lightness: -100 }
      ]
    },{
      featureType: "poi",
      elementType: "geometry",
      stylers: [
        { visibility: "on" },
        { color: "#f0e4d3" }
      ]
    },{
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [
        { color: "#efe9e4" },
        { lightness: -25 }
      ]
    }
  ];

  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: 40.7413549, lng: -73.9980244},
    zoom: 13,
    styles: styles,
    mapTypeControl: false
  });

  var locations = myViewModel.getLocations();

  // Initialize the drawing manager.
  var drawingManager = new google.maps.drawing.DrawingManager({
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
    drawingControlOptions: {
      position: google.maps.ControlPosition.TOP_LEFT,
      drawingModes: [
        google.maps.drawing.OverlayType.POLYGON
      ]
    }
  });

  // Style the markers a bit. This will be our listing marker icon.
  var defaultIcon = makeMarkerIcon("0091ff");

  // The following group uses the location array to create an array of markers on initialize.
  for (var i = 0; i < locations.length; i++) {
    // Get the position from the location array.
    var position = locations[i].location;
    var title = locations[i].title;
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      icon: defaultIcon,
      id: i
    });
    
    // Add property indicating whether the marker's infowindow is open.
    marker.infoWindowOpen = false;
    
    // Push the marker to our array of markers.
    markers.push(marker);
    
    // "These events may look like standard DOM events, but they are actually 
    //  part of the Maps JavaScript API."

    // Create an onclick event to open the large infowindow at each marker.
    marker.addListener("click", function() {clickMarker(this)});
    
    // Two event listeners - one for mouseover, one for mouseout,
    // to change the colors back and forth.
    marker.addListener("mouseover", function() {highlightMarker(this)});
    marker.addListener("mouseout", function() {unhighlightMarker(this)});
    
    allLocations.push( {
      title: marker.title,
      marker_id: marker.id
    } ); 

  }
  document.getElementById("show-listings").addEventListener("click", showListings);

  document.getElementById("hide-listings").addEventListener("click", function() {
    hideMarkers(markers);
  });
  
  showListings();
}



function clickMarker(marker) {
  var largeInfowindow = new google.maps.InfoWindow();
  
  marker.setAnimation(google.maps.Animation.BOUNCE);
  clearTimeout(timer);
  timer = setTimeout(function() {
    marker.setAnimation(null);
  }, 750);
  populateInfoWindow(marker, largeInfowindow);
};


function highlightMarker(marker) {
  // Create a "highlighted location" marker color for when the user
  // mouses over the marker.
  var highlightedIcon = makeMarkerIcon("9400D3");
  marker.setIcon(highlightedIcon);
};

function unhighlightMarker(marker) {
  // Style the markers a bit. This will be our listing marker icon.
  var defaultIcon = makeMarkerIcon("0091ff");
  marker.setIcon(defaultIcon);
};



// This function populates the infowindow when the marker is clicked. 
function populateInfoWindow(marker, infowindow) {

  // Check to make sure the infowindow is not already opened on this marker.
  if (!marker.infoWindowOpen) {
    marker.infoWindowOpen = true;

    // Make sure the infoWindowOpen property is cleared if the infowindow is closed.
    infowindow.addListener("closeclick", function() {
      marker.infoWindowOpen = false;
    });

    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
  
    // In case the status is OK, which means the pano was found, compute the
    // position of the streetview image, then calculate the heading, then get a
    // panorama from that and set the options
    function getStreetView(data, status) {
      if (status == google.maps.StreetViewStatus.OK) {
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(
          nearStreetViewLocation, marker.position);
          
        // Set up info window content. 
        // Additional info gets added in API callbacks.
        var pano_id = "pano" + marker.id;
        var content = "<div>" + marker.title + "</div>";
        content += "<div class='pano' id='" + pano_id + "'></div>";
        content += "<div id='wiki-" + marker.id + "'></div>";
        content += "<div id='flickr-" + marker.id + "'></div>";
        infowindow.setContent(content);
        
        // Set up panorma picture:
        var panoramaOptions = {
          position: nearStreetViewLocation,
          pov: {
            heading: heading,
            pitch: 30
          }
        };
        var panorama = new google.maps.StreetViewPanorama(
          document.getElementById(pano_id), panoramaOptions);
        var srcStr = marker.title;
        

        // http://stackoverflow.com/questions/4772774/how-do-i-create-a-link-using-javascript
        
        // Load Wikipedia articles:
        var wikiRequestTimeout = setTimeout(function() {
          console.log("Failed to get Wikipedia resources");
        }, 8000);
        
        $.ajax({
          url: "http://en.wikipedia.org/w/api.php",
          data: {
            action: "query",
            list: "search",
            srsearch: srcStr,
            format: "json"
          },
          dataType: "jsonp",
          // jsonp: "callback",
          success: function (data) {
            var articles = data.query.search;

            var items = [];
            $.each(articles, function(key, article) {
              var article_link = $("<a target='_blank'></a>");
              article_link.attr("href", "http://en.wikipedia.org/wiki/" + article.title);
              article_link.text(article.title); 
              
              var list_item = $("<li></li>");
              list_item.append(article_link);
              items.push(list_item);
            });

            var final_list = items.join("");
            if(items.length > 0) {
              var $wiki = $("<p class='wiki-intro'>Related " + 
                            "<a href='https://www.wikipedia.org/' target='_blank'>" + 
                            "Wikipedia</a> articles:</p>" + 
                            "<ul id='wiki-list-" + marker.id + "'></ul>");
              $("#wiki-" + marker.id).append($wiki);              
              var $wiki_list = $("#wiki-list-" + marker.id);
              $wiki_list.append(items[0]);
              $wiki_list.append(items[1]);              
            }

            clearTimeout(wikiRequestTimeout);
          },
          fail: function(data) {
            console.log("Unable to load Wikipedia resources.");
          }
        });

    

        // Thanks to:
        // http://kylerush.net/blog/tutorial-flickr-api-javascript-jquery-ajax-json-build-detailed-photo-wall/        
        // https://www.flickr.com/services/api/misc.urls.html
        // var flickr_url = "https://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=";
        // flickr_url += flickr_api_key + "&tags=flower&format=json&nojsoncallback=1";
        
        // Load flickr images:
        var flickrRequestTimeout = setTimeout(function() {
          console.log("Failed to get flickr resources");
        }, 8000);
  
        var flickr_url = "https://api.flickr.com/services/rest/?";
        var flickr_photos = [];
        $.ajax({
          url: flickr_url,
          data: {
            method: "flickr.photos.search",
            api_key: flickr_api_key,
            tags: srcStr,
            privacy_filter: 1,
            safe_search: 1,
            format: "json",
            nojsoncallback: "1",
            extras: "owner_name"
          },
          // dataType: "jsonp",
          dataType: "json",
          success: function (data) {
            if(data.photos.photo.length > 0) {
              var $flickr = $("<p>Photos from <a href='https://www.flickr.com/'" + 
                              "target='_blank'>" + 
                              "flickr</a>:</p><div id='img-div-" + marker.id + "'></div>");
              $("#flickr-" + marker.id).append($flickr);
              
              if(data) {
                var n = 3;
                if(data.photos.photo.length < 3) {
                  n = data.photos.photo.length;
                }
                for(var i = 0; i < n; i++) {
                  var photo = data.photos.photo[i];
                  var $imglink = $("<a href='http://flickr.com/photos/" + 
                                  photo.owner + "/" + photo.id + "' target='_blank'></a>");
                  var $img = $("<img class='flickr-img'>");
                  $img.attr("src", "https://farm" + photo.farm + 
                            ".staticflickr.com/" + photo.server + "/" + 
                            photo.id + "_" + photo.secret + "_t.jpg");
                  
                  var $user = $("<p></p>");
                  $user.text(photo.ownername);
                  // $("#img-div-" + marker.id).append($imglink.append($user));
                  $("#img-div-" + marker.id).append($imglink.append($img));
                  $("#img-div-" + marker.id).after($user);
                  
                  
                  flickr_photos[i] = photo;
                }
              }
            }

            clearTimeout(flickrRequestTimeout);
          },
          fail: function(data) {
            console.log("Unable to load flickr resources.");
          }
        });
      } else {
        infowindow.setContent("<div>" + marker.title + "</div>" +
          "<div>No Street View Found</div>");
      }
    }
    // Use streetview service to get the closest streetview image within
    // 50 meters of the markers position
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    // Open the infowindow on the correct marker.
    infowindow.open(map, marker);
  }
}

// This function will loop through the markers array and display them all 
// on the map and in the list.
function showListings() {
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  map.fitBounds(bounds);
}

// This function will loop through the listings and hide them all.
function hideMarkers(markers) {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    "http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|"+ markerColor +
    "|40|_|%E2%80%A2",
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}





// var ListView = function(locations, markers) {
  // var self = this;
  // self.filterCriteria = ko.observable("");
  // self.locationsOA = ko.observableArray(locations);
  // self.filteredLocations = ko.computed(function() {
    // var filter = self.filterCriteria().toLowerCase();
    
    // if(!filter) {
      // return self.locationsOA;
    // } else {
      // return ko.utils.arrayFilter(self.locations(), function(loc) {
        // var match = stringStartsWith(loc.title.toLowerCase(), filter);
        // loc.marker.setVisible(match);
        // return match;
      // });
    // }
  // });
// }





var ViewModel = function() {
  var self = this;

  // Show the same info window whether the marker is clicked or the 
  // list item is clicked.
  self.clickListItem = function(clickedListItem) {  
    var marker = markers[clickedListItem.marker_id];
    clickMarker(marker);
  };
  
  self.mouseOverListItem = function(mousedOverListItem) {
    var marker = markers[mousedOverListItem.marker_id];
    highlightMarker(marker);
  };
  
  self.mouseOutListItem = function(mousedOutListItem) {
    var marker = markers[mousedOutListItem.marker_id];
    unhighlightMarker(marker);
  };

  self.getLocations = function() {
    return model.locations;
  };
  
  self.allLocations = allLocations;
  
  

  
  

  self.filterCriteria = ko.observable("");
  self.filteredLocations = ko.computed(function() {
    var filter = self.filterCriteria();
    
    if(!filter) {
      self.allLocations().forEach(function(loc) {
        markers[loc.marker_id].setVisible(true);
      });
      return self.allLocations();
      
    } else {
      return ko.utils.arrayFilter(self.allLocations(), function(loc) {
        // toLowerCase().indexOf(value.toLowerCase()) >= 0) would be simpler
        var re = new RegExp(filter, "i");
        var match = re.test(loc.title);
        markers[loc.marker_id].setVisible(match);
        return match;
      });
    }
  });



}

// var myListView = new ListView();
var myViewModel = new ViewModel();
ko.applyBindings(myViewModel);





document.addEventListener('DOMContentLoaded', function () {  
  if(document.querySelectorAll('#map').length > 0) {
    if (document.querySelector('html').lang)
      lang = document.querySelector('html').lang;
    else
      lang = 'en';

    var js_file = document.createElement('script');
    js_file.type = 'text/javascript';
    js_file.async = true;
    js_file.defer = true;
    js_file.src = 'https://maps.googleapis.com/maps/api/js?libraries=places,geometry,drawing&key=' + 
                    maps_api_key + '&callback=initMap&language=' + lang;
    document.getElementsByTagName('head')[0].appendChild(js_file);
    
  }
});

