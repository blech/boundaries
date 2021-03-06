// For what you are about to read, please forgive me.
// tom@tomtaylor.co.uk

$(document).ready(function() {
	// PLEASE GET YOUR OWN KEYS.
	var flickr_api_key = '9fd414a14e7cb7378546995888aea55f';
	var yahoo_geoplanet_api_key = 'dE28hNrV34GDiruGoUMw0JqPSRFyCpnYZpdZSDwdGzN_Nis5gaZevZRJkfswvaxsqQ7w';
	
	var gmap = new GMap2(document.getElementById("map"));
	gmap.addControl(new GSmallMapControl());
	gmap.addMapType(G_PHYSICAL_MAP);
	gmap.addControl(new GMenuMapTypeControl());
	var startingPoint = new GLatLng(51.506325,-0.127144);
	gmap.setCenter(startingPoint, 13);
	
	var bounds = new GLatLngBounds();
	
	var colours = ["red", "blue", "green", "purple", "orange", "yellow", "darkred", "darkblue", "darkgreen", "darkslategrey", "darkviolet"];
	var woeid   = 34709;
	var type    = "neighbors";

	function displayPolygon(woeid) {
		$.getJSON('http://api.flickr.com/services/rest/?method=flickr.places.getInfo&api_key=' + flickr_api_key + '&woe_id=' + woeid + '&format=json&jsoncallback=?', function(data) {
			if(data.place.has_shapedata == 1) {
			
				var colour = colours.shift();
				var name = data.place.name.split(',')[0];

				$('ul.legend-items').append('<li><div class="colour" style="background-color:' + colour + '"></div><a href="#' + data.place.woeid + '">' + name + '</a></li>');

				$.each(data.place.shapedata.polylines.polyline, function(index,polyline) {
					thepoints = [];
					$.each(polyline._content.split(/ /), function(pindex, point) {
						lat = parseFloat(point.split(/,/)[0]);
						lng = parseFloat(point.split(/,/)[1]);
						thepoints[pindex] = new GLatLng(lat, lng);
					});
					
					var polyOptions = {geodesic:true};
					
					var polygon = new GPolygon(thepoints, colour, 5, 1, colour, 0.2, polyOptions);
					gmap.addOverlay(polygon);
					
					$.each(thepoints, function(pindex, point) {
						bounds.extend(point);
					});
				});
			
				if(!bounds.isEmpty()) {
					gmap.setCenter(bounds.getCenter(), gmap.getBoundsZoomLevel(bounds));
				}

				$('ul.legend-items li a').click(
					function() {
						var link = $(this).attr('href');
						woeid = parseInt(link.slice(1,link.length));						

						// TODO this block is getting a bit repetitive. Refactor out
						// "reset boundaries"?
						colours = ["red", "blue", "green", "purple", "orange", "yellow", "darkred", "darkblue", "darkgreen"];
						$('ul.legend-items').empty();
						gmap.clearOverlays();
						var type = $('#type-search select option:selected').text();
						displayNeighbours(woeid, type);
												
						return false;
				});
			}
		});
	}
	
	function displayNeighbours(woeid, type) {
		type = type || 'neighbors';
		if (type == "neighbours") { type = "neighbors" };
		$.getJSON('http://where.yahooapis.com/v1/place/' + woeid + '/' + type + '?appid=' + yahoo_geoplanet_api_key + '&format=json&callback=?', function(data) {
			$.each(data.places.place, function(index, place) {
				displayPolygon(place.woeid, place.name);
			});
		});
	}
	
	if (window.location.hash) {
		var hash = window.location.hash;
		woeid = parseInt(hash.slice(1,hash.length));
		$('#neighbourhood-field').val('');
	}

	var type = $('#type-search select option:selected').text();
		
	displayPolygon(woeid);
	displayNeighbours(woeid, type);
	
	$('#neighbourhood-search').submit(function(){
		// reset bounds
		bounds = new GLatLngBounds(); 
		colours = ["red", "blue", "green", "purple", "orange", "yellow", "darkred", "darkblue", "darkgreen"];
		var text = $('#neighbourhood-field').val();
		
		$.getJSON('http://where.yahooapis.com/v1/places.q(' + text + ')?appid=dE28hNrV34GDiruGoUMw0JqPSRFyCpnYZpdZSDwdGzN_Nis5gaZevZRJkfswvaxsqQ7w&format=json&callback=?', function(data) {
			if (data.places.place[0]) {
				woeid = data.places.place[0].woeid;
				window.location.hash = woeid;
				gmap.clearOverlays();
				$('ul.legend-items').empty();
				displayPolygon(woeid);
				var type = $('#type-search select option:selected').text();
				displayNeighbours(woeid, type);
			} else {
				alert("Couldn't find that place");
			}
		});
		return false;
	});

	$('#type-search').change(function(){
		var type = $(this).find('select option:selected').text();
		
		colours = ["red", "blue", "green", "purple", "orange", "yellow", "darkred", "darkblue", "darkgreen"];
		gmap.clearOverlays();
		$('ul.legend-items').empty();
		displayNeighbours(woeid, type);

	});
	
	// $.each(neighbours, function(i, n) {
	// 	alert(n);
	// 	// displayPolygon(this[0]);
	// });
	
	// displayPolygon(38629, "green", "lightgreen") // upper clapton
	// 	displayPolygon(43295, "red", "pink"); // lower clapton
	// 	displayPolygon(20089379, "blue", "lightblue"); // homerton
	// 	displayPolygon(20094311, "orange", "yellow") // clapton
	// 	displayPolygon(20089378, "purple", "pink")
	
});