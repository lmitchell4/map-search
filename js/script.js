// $(function(){

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


var ViewModelConstructor = function() {
  var self = this;

  // Array for location markers on the map:
  self.markers = [];
  self.markersVisible = false;
  
  self.allLocations = ko.observableArray([]); // Array for location list
  self.wikiLinks = ko.observableArray([]);    // Wiki links
  self.flickrPhotos = ko.observableArray([]); // flickr photos

  self.getLocations = function() {
    return model.locations;
  };

  // When a location list item is clicked or moused over, show same
  // results as when the marker is clicked or moused over:
  self.clickListItem = function(clickedListItem) {
    var marker = self.markers[clickedListItem.marker_id];
    viewMap.clickMarker(marker);
  };

  self.mouseOverListItem = function(mousedOverListItem) {
    var marker = self.markers[mousedOverListItem.marker_id];
    viewMap.highlightMarker(marker);
  };

  self.mouseOutListItem = function(mousedOutListItem) {
    var marker = self.markers[mousedOutListItem.marker_id];
    viewMap.unhighlightMarker(marker);
  };

  // Implement filter functionality:
  self.filterCriteria = ko.observable("");
  self.filteredLocations = ko.computed(function() {
    var filter = self.filterCriteria();

    if(!filter) {
      self.allLocations().forEach(function(loc) {
        self.markers[loc.marker_id].setVisible(true);
      });
      return self.allLocations();

    } else {
      return ko.utils.arrayFilter(self.allLocations(), function(loc) {
        // toLowerCase().indexOf(value.toLowerCase()) >= 0) would be simpler
        var re = new RegExp(filter, "i");
        var match = re.test(loc.title);
        self.markers[loc.marker_id].setVisible(match);
        return match;
      });
    }
  });
  
  self.init = function() {
    viewMap.init();
  };
}



var viewMapConstructor = function() {
  var self = this;
  
  self.init = function() {
    this.map;
    this.timer;   // Timer for marker animation
    this.sliderWorking = false;

    // the click event handler for the right button
    $("#right-btn").click(function() {
      if(!sliderWorking) {
        sliderWorking = true;

        // Get current value of left property:
        var leftProperty = parseInt(slider.css("left"));
        
        // Figure out the new left property:
        if(leftProperty - 155 > -155*viewModel.flickrPhotos().length) {
          var newLeftProperty = leftProperty - 155;

          // Animate the movement of the panel:
          slider.animate({left: newLeftProperty}, 800, function() {
            sliderWorking = false;
          });
        }
      }
    });

    // the click event handler for the left button
    $("#left-btn").click(function() {
      if(!sliderWorking) {
        sliderWorking = true;

        // Get current value of left property:
        var leftProperty = parseInt(slider.css("left"));

        // Figure out the new left property:
        if(leftProperty < 0) {
          var newLeftProperty = leftProperty + 155;

          // Animate the movement of the panel:
          slider.animate( {left: newLeftProperty}, 800, function() {
            sliderWorking = false;
          });
        }
      }
    });

    $("#rsc-close").click(function() {
      $("#map").height("calc(100vh - 40px)");
      $("#rsc-container").attr("class","hidden"); 
      viewModel.flickrPhotos.removeAll();
      viewModel.wikiLinks.removeAll();
    })
  };

  self.renderMap = function() {
    // Create the map:
    this.map = new google.maps.Map(document.getElementById("map"), {
      center: {lat: 41.8781, lng: -87.6298},
      zoom: 13,
      mapTypeControl: false
    });

    var locations = viewModel.getLocations();

    // Set styles for the markers:
    var defaultIcon = this.makeMarkerIcon("0091ff");

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
      viewModel.markers.push(marker);

      // The click, mouseover, and mouseout event listeners on markers look
      // like standard DOM events, but are actually part of the
      // Maps JavaScript API.

      // Open an infowindow when the marker is clicked.
      marker.addListener("click", function() {self.clickMarker(this)});

      // Change marker color when mousing over it.
      marker.addListener("mouseover", function() {self.highlightMarker(this)});
      marker.addListener("mouseout", function() {self.unhighlightMarker(this)});

      viewModel.allLocations.push( {
        title: marker.title,
        marker_id: marker.id
      } );
    }

    document.getElementById("toggle-listings").addEventListener("click", 
                                                      this.toggleListings);  
    this.toggleListings();
  };


  self.clickMarker = function(marker) {
    var largeInfowindow = new google.maps.InfoWindow();

    marker.setAnimation(google.maps.Animation.BOUNCE);
    clearTimeout(this.timer);
    this.timer = setTimeout(function() {
      marker.setAnimation(null);
    }, 750);
    this.populateInfoWindow(marker, largeInfowindow);
  };


  self.highlightMarker = function(marker) {
    // Change the marker color from the default:
    var highlightedIcon = this.makeMarkerIcon("9400D3");
    marker.setIcon(highlightedIcon);
  };


  self.unhighlightMarker = function(marker) {
    // Return to normal marker color:
    var defaultIcon = this.makeMarkerIcon("0091ff");
    marker.setIcon(defaultIcon);
  };


  // Populate the infowindow when the marker is clicked:
  self.populateInfoWindow = function(marker, infowindow) {
    
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
          
          $("#" + marker.id).click(function() {
            self.showResourcePanel(marker.title)
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
      infowindow.open(this.map, marker);
    }
  };

  self.showResourcePanel= function(title) {
    $("#map").height("calc(100vh - 40px - " + $("#rsc-container").height() + "px");
    $("#rsc-container").removeClass("hidden");
    $("#rsc-location-name").text(title);

    // Reset the location of the photo slider each time this function runs:
    $("#flickr-list").css("left",0);
    
    // Clear the observableArrays each time this function is run.
    viewModel.flickrPhotos.removeAll();
    viewModel.wikiLinks.removeAll();

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
          viewModel.wikiLinks.push( {
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
          viewModel.flickrPhotos.push( {
            src: "https://farm" + photo.farm + ".staticflickr.com/" + 
                  photo.server + "/" + photo.id + "_" + photo.secret + "_t.jpg",
            url: "http://flickr.com/photos/" + photo.owner + "/" + photo.id
          } );
        }
      }
    }).fail(function() {
      console.log("Unable to load flickr resources.");
    });
  };

  // Display the locations in the list and on the map:
  self.toggleListings = function() {
    if(viewModel.markersVisible) {
      // Hide the markers:
      for(var i=0; i < viewModel.markers.length; i++) {
        viewModel.markers[i].setMap(null);
      }
      $("#toggle-listings").val("Show Locations");
      viewModel.markersVisible = false;
    } else {
      // Show the markers:
      var bounds = new google.maps.LatLngBounds();
      // Extend the boundaries of the map for each marker and display the marker
      for(var i=0; i < viewModel.markers.length; i++) {
        viewModel.markers[i].setMap(this.map);
        bounds.extend(viewModel.markers[i].position);
      }
      this.map.fitBounds(bounds);
      $("#toggle-listings").val("Hide Locations");
      viewModel.markersVisible = true;
    }
  };

  // This function takes in a COLOR, and then creates a new marker
  // icon of that color. The icon will be 21 px wide by 34 high, have an origin
  // of 0, 0 and be anchored at 10, 34).
  self.makeMarkerIcon = function(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      "http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|"+ markerColor +
      "|40|_|%E2%80%A2",
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21,34));
    return markerImage;
  }
};



// // // Separate views for list and map?

var viewMap = new viewMapConstructor();
var viewModel = new ViewModelConstructor();

viewModel.init();
ko.applyBindings(viewModel);


document.addEventListener("DOMContentLoaded", function () {
  var lang;
  if(document.querySelector("html").lang) {
    lang = document.querySelector("html").lang;
  } else {
    lang = "en";
  }

  $.ajax({
    url: "https://maps.googleapis.com/maps/api/js?libraries=places&key=" +
            maps_api_key + "&callback=viewMap.renderMap&language=" + lang,
    dataType: "script",
    async: true,
    success: function() {
    }
  }).fail(function() {
    $("#map").append("<h3 class='error'>Unfortunately, we were unable to load Google Maps.</h3>" +
                     "<h3 class='error'>Please try again later.</h3>");
  });;
});



// });