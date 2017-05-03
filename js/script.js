
var model = {
  // Hard code the locations of interest for now.
  // Normally they would be in a database.
  locations: [
    // {title: "Brookfield Zoo", location: {lat: 41.8350288, lng: -87.83363030000001}},
    // {title: "Museum of Science and Industry", location: {lat: 41.7906088, lng: -87.5830586}},
    // {title: "National Museum of Mexican Art", location: {lat: 41.8561698, lng: -87.6729641}},
    // {title: "Museum of Contemporary Art", location: {lat: 41.8972116, lng: -87.62107069999999}},
    // {title: "Navy Pier", location: {lat: 41.891731, lng: -87.60225869999999}},
    // {title: "Wrigley Field", location: {lat: 41.9474536, lng: -87.6561341}},
    {title: "Shedd Aquarium", location: {lat: 41.8676217, lng: -87.6136616}},
    {title: "Lincoln Park Zoo", location: {lat: 41.9211, lng: -87.6340}},
    {title: "Field Museum of Natural History", location: {lat: 41.8661733, lng: -87.61698620000001}},
    {title: "Art Institute of Chicago", location: {lat: 41.879347, lng: -87.621228}},
    {title: "Chicago History Museum", location: {lat: 41.9119691, lng: -87.6315025}},
    {title: "International Museum of Surgical Science", location: {lat: 41.910275, lng: -87.62661969999999}},
    {title: "Adler Planetarium", location: {lat: 41.8663557, lng: -87.60661159999999}},
    {title: "Soldier Field", location: {lat: 41.8622646, lng: -87.61663820000001}}
  ]
}



var map;

// Array for location markers on the map:
var markers = [];

// Array for location list:
var allLocations = ko.observableArray([]);

// Timer for marker animation:
var timer;

// Wiki links:
var wikiLinks = ko.observableArray([]);

// flickr photos:
var flickrPhotos = ko.observableArray([]);


function initMap() {
  // Create the map:
  map = new google.maps.Map(document.getElementById("map"), {
    center: {lat: 41.8781, lng: -87.6298},
    zoom: 13,
    mapTypeControl: false
  });

  var locations = myViewModel.getLocations();

  // Set styles for the markers:
  var defaultIcon = makeMarkerIcon("0091ff");

  // Create the markers:
  for(var i = 0; i < locations.length; i++) {
    // Get the position and title of the current location:
    var position = locations[i].location;
    var title = locations[i].title;

    // Create a marker.
    // infoWindowOpen is a custom property indicating whether the
    //  marker's infowindow is open.
    var marker = new google.maps.Marker({
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      icon: defaultIcon,
      id: i,
      infoWindowOpen: false
    });


    // Push the marker to our array of markers.
    markers.push(marker);

    // The click, mouseover, and mouseout event listeners on markers look
    // like standard DOM events, but are actually part of the
    // Maps JavaScript API.

    // Open an infowindow when the marker is clicked.
    marker.addListener("click", function() {clickMarker(this)});

    // Change marker color when mousing over it.
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
  // Change the marker color from the default:
  var highlightedIcon = makeMarkerIcon("9400D3");
  marker.setIcon(highlightedIcon);
};


function unhighlightMarker(marker) {
  // Return to normal marker color:
  var defaultIcon = makeMarkerIcon("0091ff");
  marker.setIcon(defaultIcon);
};


// Populate the infowindow when the marker is clicked:
function populateInfoWindow(marker, infowindow) {

  // Check that the infowindow for this marker is not already open:
  if(!marker.infoWindowOpen) {
    marker.infoWindowOpen = true;

    infowindow.addListener("closeclick", function() {
      // Reset this property when infowindow is closed:
      
      // $("#rsc-container").attr("class", "hidden");
      marker.infoWindowOpen = false;
      
    });

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
        var pano_id = "pano-" + marker.id;
        var content = "<h4>" + marker.title + "</h4>";
        content += "<div class='pano' id='" + pano_id + "'></div><br>";
        content += "<div class='rsc-btn' id='" + marker.id + "'>Show additional resources</div>";
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
        
        // If the resource window is already open from another marker,
        // update it for this marker:
        if($("#rsc-container").attr("class") != "hidden") {
          // showResourcePanel(marker.title);
        }
        $("#" + marker.id).click(function() {
          showResourcePanel(marker.title)
        });


      } else {
        infowindow.setContent("<div>" + marker.title + "</div>" +
          "<div>No Street View Found</div>");
      }
    }

    // Get the closest streetview image within 50 meters of the marker:
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);

    // Open the infowindow on the correct marker:
    infowindow.open(map, marker);
  }
}



var slider = $("#flickr-list");   // slider = ul element
var leftProperty, newleftProperty;
var sliderWorking = false;

// the click event handler for the right button
$("#right-btn").click(function() {
  if(!sliderWorking) {
    sliderWorking = true;

    // Get current value of left property:
    leftProperty = parseInt(slider.css("left"));
    
    // Figure out the new left property:
    if(leftProperty - 155 > -155*flickrPhotos().length) {
      newLeftProperty = leftProperty - 155;
    }

    // Animate the movement of the panel:
    slider.animate({left: newLeftProperty}, 800, function() {
      sliderWorking = false;
    });
  }
});

// the click event handler for the left button
$("#left-btn").click(function() {
  if(!sliderWorking) {
    sliderWorking = true;

    // Get current value of left property:
    leftProperty = parseInt(slider.css("left"));

    // Figure out the new left property:
    if(leftProperty < 0) {
      newLeftProperty = leftProperty + 155;
    }

    // Animate the movement of the panel:
    slider.animate( {left: newLeftProperty}, 800, function() {
      sliderWorking = false;
    });
  }
});

$("#rsc-close").click(function() {
  $("#map").height("calc(100vh - 40px)");
  $("#rsc-container").attr("class","hidden"); 
  flickrPhotos.removeAll();
  wikiLinks.removeAll();
})

function showResourcePanel(title) {
  $("#map").height("calc(100vh - 40px - " + $("#rsc-container").height() + "px");
  $("#rsc-container").removeClass("hidden");
  $("#rsc-location-name").text(title);

  // Reset the location of the photo slider each time this function runs:
  $("#flickr-list").css("left",0);
  
  // Clear the observableArrays each time this function is run.
  flickrPhotos.removeAll();
  wikiLinks.removeAll();

  // Load Wikipedia resources:
  $.ajax({
    url: "http://en.wikipedia.org/w/api.php",
    data: {
      action: "query",
      list: "search",
      srsearch: title,
      format: "json"
    },
    dataType: "jsonp",
    timeout: 6000,
    // jsonp: "callback",
    success: function(data) {
      var articles = data.query.search;

      for(var i = 0; i < Math.min(5,articles.length); i++) {
        wikiLinks.push( {
          title: articles[i].title,
          url: "http://en.wikipedia.org/wiki/" + articles[i].title
        } );
      }
    }
  }).fail(function() {
    console.log("Unable to load Wikipedia resources.");
  });


  // Load flickr resources:
  var flickr_url = "https://api.flickr.com/services/rest/?";
  $.ajax({
    url: flickr_url,
    data: {
      method: "flickr.photos.search",
      api_key: flickr_api_key,
      tags: title,
      privacy_filter: 1,
      safe_search: 1,
      format: "json",
      nojsoncallback: "1",
      extras: "owner_name"
    },
    // dataType: "jsonp",
    dataType: "json",
    timeout: 6000,
    success: function(data) {
      var photos = data.photos.photo;
      var photo;
      
      for(var i = 0; i < Math.min(10,photos.length); i++) {
        photo = photos[i];
        flickrPhotos.push( {
          src: "https://farm" + photo.farm + ".staticflickr.com/" + 
                photo.server + "/" + photo.id + "_" + photo.secret + "_t.jpg",
          url: "http://flickr.com/photos/" + photo.owner + "/" + photo.id
        } );
      }
        
        // var $flickr = $("<p>Photos from <a href='https://www.flickr.com/'" +
                        // "target='_blank'>" +
                        // "flickr</a>:</p><div id='img-div-" + marker.id + "'></div>");
        // $("#flickr-" + marker.id).append($flickr);

        // if(data) {
          // var n = 3;
          // if(data.photos.photo.length < 3) {
            // n = data.photos.photo.length;
          // }
          // for(var i = 0; i < n; i++) {
            // var photo = data.photos.photo[i];
            // var $imglink = $("<a href='http://flickr.com/photos/" +
                            // photo.owner + "/" + photo.id + "' target='_blank'></a>");
            // var $img = $("<img class='flickr-img'>");
            // $img.attr("src", "https://farm" + photo.farm +
                      // ".staticflickr.com/" + photo.server + "/" +
                      // photo.id + "_" + photo.secret + "_t.jpg");

            // var $user = $("<p></p>");
            // $user.text(photo.ownername);
            // $("#img-div-" + marker.id).append($imglink.append($img));
            // $("#img-div-" + marker.id).after($user);
          // }
        // }
      // }
    }
  }).fail(function() {
    console.log("Unable to load flickr resources.");
  });
}








// Display the locations in the list and on the map:
function showListings() {
  var bounds = new google.maps.LatLngBounds();
  // Extend the boundaries of the map for each marker and display the marker
  for(var i=0; i < markers.length; i++) {
    markers[i].setMap(map);
    bounds.extend(markers[i].position);
  }
  map.fitBounds(bounds);
}

// This function will loop through the listings and hide them all.
function hideMarkers(markers) {
  for(var i=0; i < markers.length; i++) {
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




var ViewModel = function() {
  var self = this;

  self.getLocations = function() {
    return model.locations;
  };

  self.allLocations = allLocations;


  // When a location list item is clicked or moused over, show same
  // results as when the marker is clicked or moused over:
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


  // Implement filter functionality:
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

  self.wikiLinks = wikiLinks;
  self.flickrPhotos = flickrPhotos;
}

var myViewModel = new ViewModel();
ko.applyBindings(myViewModel);












document.addEventListener("DOMContentLoaded", function () {
  var lang;
  if(document.querySelector("html").lang) {
    lang = document.querySelector("html").lang;
  } else {
    lang = "en";
  }

  $.ajax({
    url: "https://maps.googleapis.com/maps/api/js?libraries=places&key=" +
            maps_api_key + "&callback=initMap&language=" + lang,
    dataType: "script",
    async: true,
    success: function() {
    }
  }).fail(function() {
    $("#map").append("<h3 class='error'>Unfortunately, we were unable to load Google Maps.</h3>" +
                     "<h3 class='error'>Please try again later.</h3>");
  });;
});
