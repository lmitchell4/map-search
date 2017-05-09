
var model = {
  // Hard code the locations of interest for now.
  // Normally they would be in a database.
  locations: [
    {title: 'Museum of Science and Industry', location: {lat: 41.7906088, lng: -87.5830586}},
    {title: 'Museum of Contemporary Art', location: {lat: 41.8972116, lng: -87.62107069999999}},
    {title: 'Shedd Aquarium', location: {lat: 41.8676217, lng: -87.6136616}},
    {title: 'Lincoln Park Zoo', location: {lat: 41.9211, lng: -87.6340}},
    {title: 'Field Museum of Natural History', location: {lat: 41.8661733, lng: -87.61698620000001}},
    {title: 'Art Institute of Chicago', location: {lat: 41.879347, lng: -87.621228}},
    {title: 'Chicago History Museum', location: {lat: 41.9119691, lng: -87.6315025}},
    {title: 'Adler Planetarium', location: {lat: 41.8663557, lng: -87.60661159999999}},
    {title: 'Soldier Field', location: {lat: 41.8622646, lng: -87.61663820000001}}
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

  // Clicked marker:
  self.clickedMarker = ko.observable();
  
  // For text bindings:
  self.rscLocationName = ko.observable();

  // For value bindings:
  self.toggleListingsBtnText = ko.observable();
  
  
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
  self.filterCriteria = ko.observable('');
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
        var re = new RegExp(filter, 'i');
        var match = re.test(loc.title);
        self.markers[loc.marker_id].setVisible(match);
        return match;
      });
    }
  });

  // Handle photo slider event handling with Knockout bindings.
  self.sliderArrow = viewMap.sliderArrow;
  
  // Close resource panel using Knockout click binding:
  self.closeResourcePanel = viewMap.closeResourcePanel;
  
  // Toggle showing or hiding markers:
  self.toggleListings = viewMap.toggleListings;
  
  // Click binding function for showing the resource panel:
  self.showResourcePanel = viewMap.showResourcePanel;
  
  // Set class properties:
  self.wikiErrorStatus = ko.observable('hidden');
  self.flickrErrorStatus = ko.observable('hidden');
  self.rscContainerStatus = ko.observable('hidden');
  self.mapErrorStatus = ko.observable('hidden');

  self.init = function() {
    viewMap.init();
    viewMap.renderMap();
  };
}



var viewMapConstructor = function() {
  var self = this;

  self.init = function() {
    self.map;
    self.timer;   // Timer for marker animation
    self.slider = $('#flickr-list');   // slider = ul element
    self.sliderWorking = false;
    
    self.mapBounds = {lat: 41.8781, lng: -87.6298};
    
    self.infoWindowLoaded = false;
    self.infoWindow = new google.maps.InfoWindow();
  };

  // Thanks to Stacy from the Udacity forum for help in setting up an infowindow template:
  // https://discussions.udacity.com/t/knockout-binding-from-infowindow/189235/4
  // http://jsfiddle.net/SittingFox/nr8tr5oo/
  self.initializeInfoWindow = function() {
    var infoWindowHTML =
        '<div id="info-window"' +
        'data-bind="template: { name: \'info-window-template\', data: clickedMarker }">' +
        '</div>';
    self.infoWindow.setContent(infoWindowHTML);
    
    // Bind infowindow to Knockout one time only.
    google.maps.event.addListener(self.infoWindow, 'domready', function () {
      if(!self.infoWindowLoaded) {
        ko.applyBindings(viewModel, $('#info-window')[0]);
        self.infoWindowLoaded = true;
      }
    });
  };
  
  // This function has been modified from the Udacity real estate sample project.
  self.renderMap = function() {  
    // Create the map:
    self.map = new google.maps.Map(document.getElementById('map'), {
      // center: {lat: 41.8781, lng: -87.6298},
      center: self.mapBounds,
      zoom: 13,
      mapTypeControl: false
    });
    
    google.maps.event.addDomListener(self.map, 'resize', function() {
      map.fitBounds(self.mapBounds); // `bounds` is a `LatLngBounds` object
    });
    
    var locations = viewModel.getLocations();

    // Set styles for the markers:
    var defaultIcon = self.makeMarkerIcon('0091ff');

    // Create the markers:
    for(var i = 0; i < locations.length; i++) {
      // Get the position and title of the current location:
      var position = locations[i].location;
      var title = locations[i].title;

      // Create a marker.
      var marker = new google.maps.Marker({
        position: position,
        title: title,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon,
        id: i,
      });

      // Push the marker to our array of markers.
      viewModel.markers.push(marker);

      // The click, mouseover, and mouseout event listeners on markers look
      // like standard DOM events, but are actually part of the
      // Maps JavaScript API.

      // Open an infowindow when the marker is clicked.
      // marker.addListener('click', function() {self.clickMarker(this)});
      google.maps.event.addListener(marker, 'click', function() {self.clickMarker(this)});


      // Change marker color when mousing over it.
      marker.addListener('mouseover', function() {self.highlightMarker(this)});
      marker.addListener('mouseout', function() {self.unhighlightMarker(this)});

      viewModel.allLocations.push( {
        title: marker.title,
        marker_id: marker.id
      } );
    }

    viewModel.toggleListings();
    self.initializeInfoWindow();
  };

  self.clickMarker = function(marker) {
    // Fix bug where animations do not stop:
    for(var j = 0; j < viewModel.markers.length; j++) {
      viewModel.markers[j].setAnimation(null);
    }
    
    marker.setAnimation(google.maps.Animation.BOUNCE);
    clearTimeout(self.timer);
    self.timer = setTimeout(function() {
      marker.setAnimation(null);
    }, 700);
    self.populateInfoWindow(marker);    
  };

  self.highlightMarker = function(marker) {
    // Change the marker color from the default:
    var highlightedIcon = self.makeMarkerIcon('9400D3');
    marker.setIcon(highlightedIcon);
  };


  self.unhighlightMarker = function(marker) {
    // Return to normal marker color:
    var defaultIcon = self.makeMarkerIcon('0091ff');
    marker.setIcon(defaultIcon);
  };

  // Populate the infowindow when the marker is clicked.
  // This function has been modified from the Udacity real estate sample project.
  self.populateInfoWindow = function(marker) {
    // In case the status is OK, which means the pano was found, compute the
    // position of the streetview image, then calculate the heading, then get a
    // panorama from that and set the options.
    function getStreetView(data, status) {
      if(status == google.maps.StreetViewStatus.OK) {
        var nearStreetViewLocation = data.location.latLng;
        var heading = google.maps.geometry.spherical.computeHeading(
          nearStreetViewLocation, marker.position);

        // Set up panorma picture:
        var panoramaOptions = {
          position: nearStreetViewLocation,
          pov: {
            heading: heading,
            pitch: 30
          }
        };
        var panorama = new google.maps.StreetViewPanorama(
          document.getElementById('pano_id'), panoramaOptions);
      } else {
        // No street view.
      }
    }

    // Get the closest streetview image within 50 meters of the marker:
    var streetViewService = new google.maps.StreetViewService();
    var radius = 50;
    streetViewService.getPanoramaByLocation(marker.position, radius, getStreetView);
    
    // Open the window before changing the content (i.e. before changing 
    // clickedMarker, otherwise there is a problem with the binding.
    self.infoWindow.open(self.map, marker);
    viewModel.clickedMarker(marker);
  };

  self.showResourcePanel= function() {
    var title = viewModel.clickedMarker().title;

    viewModel.rscLocationName(title);
    viewModel.wikiErrorStatus('hidden');
    viewModel.flickrErrorStatus('hidden');
    $('#map').height('calc(100vh - 40px - ' + $('#rsc-container').height() + 'px');
    viewModel.rscContainerStatus('');
    
    // Reset the location of the photo slider each time this function runs:
    self.slider.css('left',0);

    // Clear the observableArrays each time this function is run.
    viewModel.flickrPhotos.removeAll();
    viewModel.wikiLinks.removeAll();

    // Load Wikipedia resources:
    $.ajax({
      url: 'http://en.wikipedia.org/w/api.php',
      data: {
        action: 'query',
        list: 'search',
        srsearch: title,
        format: 'json'
      },
      dataType: 'jsonp',
      timeout: 2000,
      success: function(data) {
        var articles = data.query.search;

        for(var i = 0; i < Math.min(5,articles.length); i++) {
          viewModel.wikiLinks.push({
            title: articles[i].title,
            url: 'http://en.wikipedia.org/wiki/' + articles[i].title
          });
        }
      }
    }).fail(function() {
      viewModel.wikiErrorStatus('');
      console.log('Unable to load Wikipedia resources.');
    });


    // Load flickr resources:
    var flickr_url = 'https://api.flickr.com/services/rest/?';
    $.ajax({
      url: flickr_url,
      data: {
        method: 'flickr.photos.search',
        api_key: flickr_api_key,
        tags: title,
        privacy_filter: 1,
        safe_search: 1,
        format: 'json',
        nojsoncallback: '1',
        extras: 'owner_name'
      },
      dataType: 'json',
      timeout: 2000,
      success: function(data) {
        var photos = data.photos.photo;
        var photo;

        for(var i = 0; i < Math.min(10,photos.length); i++) {
          photo = photos[i];
          viewModel.flickrPhotos.push( {
            src: 'https://farm' + photo.farm + '.staticflickr.com/' +
                  photo.server + '/' + photo.id + '_' + photo.secret + '_t.jpg',
            url: 'http://flickr.com/photos/' + photo.owner + '/' + photo.id
          } );
        }
      }
    }).fail(function() {
      viewModel.flickrErrorStatus('');      
      console.log('Unable to load flickr resources.');
    });
  };

  // Close the resource panel:
  self.closeResourcePanel = function() {
    $('#map').height('calc(100vh - 40px)');
    viewModel.rscContainerStatus('hidden');
    viewModel.flickrPhotos.removeAll();
    viewModel.wikiLinks.removeAll();
  };
  
  // Display the locations in the list and on the map:
  self.toggleListings = function() {
    if(viewModel.markersVisible) {
      // Hide the markers:
      for(var i=0; i < viewModel.markers.length; i++) {
        viewModel.markers[i].setMap(null);
      }
      viewModel.toggleListingsBtnText('Show Locations');
      viewModel.markersVisible = false;
    } else {
      // Show the markers:
      var bounds = new google.maps.LatLngBounds();
      // Extend the boundaries of the map for each marker and display the marker
      for(var i=0; i < viewModel.markers.length; i++) {
        viewModel.markers[i].setMap(self.map);
        bounds.extend(viewModel.markers[i].position);
      }
      self.map.fitBounds(bounds);
      viewModel.toggleListingsBtnText('Hide Locations');
      viewModel.markersVisible = true;
    }
  };

  // This function takes in a COLOR, and then creates a new marker
  // icon of that color. The icon will be 21 px wide by 34 high, have an origin
  // of 0, 0 and be anchored at 10, 34).
  // This function has been modified from the Udacity real estate sample project.
  self.makeMarkerIcon = function(markerColor) {
    var markerImage = new google.maps.MarkerImage(
      'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
      '|40|_|%E2%80%A2',
      new google.maps.Size(21, 34),
      new google.maps.Point(0, 0),
      new google.maps.Point(10, 34),
      new google.maps.Size(21,34));
    return markerImage;
  };

  // The click event handler for the photo slider buttons:
  self.sliderArrow = function(whichButton) {
    if(!self.sliderWorking) {
      self.sliderWorking = true;

      var leftProperty = parseInt(self.slider.css('left'));
      var newLeftProperty = leftProperty;
      
      // Figure out the new left property:
      if(whichButton == 'left' && leftProperty < 0) {
        // Left arrow clicked.
        newLeftProperty = leftProperty + 155;
      } else if(whichButton == 'right' && leftProperty > 155*(1 - viewModel.flickrPhotos().length)) {
        // Right arrow clicked.
        newLeftProperty = leftProperty - 155;
      }
      
      if(newLeftProperty != leftProperty) {
        // Animate the movement of the panel:
        self.slider.animate( {left: newLeftProperty}, 800, function() {
          self.sliderWorking = false;
        });
      } else {
        self.sliderWorking = false;
      }
    }
  };
};


mapError = function() {
  // Handle google maps API error:
  viewModel.mapErrorStatus("error");
};


var viewMap = new viewMapConstructor();
var viewModel = new ViewModelConstructor();
ko.applyBindings(viewModel);


// Create and load script element to call Google Maps API:
$(document).ready(function() {
  var mapsScriptElem = document.createElement('script');
  mapsScriptElem.type = 'text/javascript';
  mapsScriptElem.onerror = mapError;
  mapsScriptElem.src = 'https://maps.googleapis.com/maps/api/js?libraries=places&key=' +
                        maps_api_key + '&callback=viewModel.init';
  mapsScriptElem.async;
  mapsScriptElem.defer;
  document.getElementsByTagName('head')[0].appendChild(mapsScriptElem);
});
