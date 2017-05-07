

# Map Search

Map Search is a project that uses the [Google Maps API](https://developers.google.com/maps/), 
[Wiki API](https://www.mediawiki.org/wiki/API:Main_page), and 
[flickr API](https://www.flickr.com/services/api/) 
to let the user explore points of interest in Chicago. It uses the 
[Knockout](http://knockoutjs.com/) library and [Bootstrap](http://getbootstrap.com/)
 framework. 

This project started with base code from the [Udacity GitHub account](https://github.com/udacity/ud864).

### Installation

1. Download and install [Git](https://git-scm.com/downloads)

2. Fork and clone this repo on GitHub.

3. Alternatively, download the repo directly from GitHub.


### Getting API Keys
Running the site properly requires obtaining a Google Maps API key and a 
flickr API key and adding them to the file `api_keys.js`. When you first 
fork, clone, or download the repo this file contains a string of X's 
where each key will go. 

You can get a Google Maps API key by following the 
instructions 
[here](https://developers.google.com/maps/documentation/javascript/get-api-key).
Note that this will require logging in to the Google Developer Console with a 
gmail account, which you can set up [here](https://accounts.google.com/SignUp) 
if you don't already have one. When generating your key you'll need to 
indicate which API libraries you want to use. This project currently only 
requires the **places** library. 
In `api_keys.js`, replace all the X's in the `maps_api_key` variable with 
your key, leaving the double quotes so that your key is defined as a string.

To get a flickr API key, follow the instructions 
[here](https://www.flickr.com/services/api/misc.api_keys.html). 
Note that this will require logging in to a Yahoo mail account. You can sign 
up for one [here](https://login.yahoo.com/account/create) if you don't already 
have one. Once you have your key, use it to update the `flickr_api_key` 
variable the same way you updated the `maps_api_key` variable.


### Running the Site Locally
Open the file `index.html` to run the site locally. The Chicago points of 
interest are shown in a list on the left side of the page. Hover over each 
list item to find out where it is located on the map to the right. Click 
on a list item or its map marker to see a Google StreetView image, and 
click on the "Show additional resources" button to see a list of related 
Wikipedia articles and photos from flickr.


### License

This project is released under the [MIT License](https://github.com/lmitchell4/alpha-blog/blob/master/LICENSE).

