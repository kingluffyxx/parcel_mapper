$( document ).ready(function() {

	map = L.map("map",{
		zoomControl: true,
	  	attributionControl: false
	});
	map.on('load', function(e) {
    	init();
	});
	map.fitBounds([
		[40.521, -104.416],
		[39.892, -105.179]
	]);
	/* Basemap Layers */
	var mapquestOSM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
		maxZoom: 19,
	  	subdomains: ["otile1", "otile2", "otile3", "otile4"],
	  	attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
	}).addTo(map);

})

function init(){
    $('.data-item').on('click', function(){
    function getHTML(id) {
      var oldHtml = {
        'definedAreaParcels': function () {
          if (map.hasLayer(parcelsDefinedArea)){
            map.removeLayer(parcelsDefinedArea);
            return "<i class='fa fa-square-o'></i>Defined Area <i class='fa fa-plus-square pull-right'></i>";
          } else {
            map.addLayer(parcelsDefinedArea);
            return "<i class='fa fa-square-o'></i>Defined Area <i class='fa fa-check pull-right'></i>";
          }
        },
        'visibleAreaParcels': function () {
            if (parcelsVisibleArea.getMap() === null){
              parcelsVisibleArea.setMap(map);
              return "<i class='fa fa-square-o'></i>Visible Area <i class='fa fa-plus-square pull-right'></i>";
              } else {
              parcelsVisibleArea.setMap(null);
              return "<i class='fa fa-square-o'></i>Visible Area <i class='fa fa-check pull-right'></i>";
            }
        },  
        'plss': function () {
          if (map.hasLayer(plssLayer)){
            map.removeLayer(plssLayer);
            return "<i class='fa fa-square-o'></i>PLSS<i class='fa fa-plus-square pull-right'></i>";
          } else {
            map.addLayer(plssLayer);
            return "<i class='fa fa-square-o'></i>PLSS<i class='fa fa-check pull-right'></i>";
          }
        },
        };
     
      if (typeof oldHtml[id] !== 'function') {
        throw new Error('Invalid action.');
      }
      return oldHtml[id]();
      
      }
    var newHtml = getHTML(this.id)
    $("#" + this.id).html(newHtml);  
    //orderLayers();
  });
	var parcelStyle = {
			'fillColor': '#A4A4A4',
			'weight': 2.5,
			'opacity': .9,
			'color': 'white',
			'dashArray': '3',
			'fillOpacity': 0.1
		};
    // Add fuse search control
    
	var searchAddress = new L.esri.Geocoding.Controls.Geosearch().addTo(map);
	var results = new L.LayerGroup().addTo(map);
		searchAddress.on('results', function(data){
    		results.clearLayers();
    		for (var i = data.results.length - 1; i >= 0; i--) {
    			var icon = L.MakiMarkers.icon({icon: "marker-stroked", color: "#3c8dbc", size: "m"});
      			results.addLayer(L.marker(data.results[i].latlng,{icon: icon}).bindPopup(data.results[0].address ));
    		}
  		});

  	var parcelsDefinedArea = L.geoJson(null, {
			style: parcelStyle,
			position: "back",
	        onEachFeature: function (feature, layer) {
	        	layer.cartodb_id=feature.properties.cartodb_id;
			    layer.bindPopup("<div style='font-size:16px;'><b>" + feature.properties.name + "</b><br>Parcel Number: " + feature.properties.parcel + "<br>Account Number: " + feature.properties.accountno + "</div>");
				//layer.on({click: highlightFeature});
			}
	    }).addTo(map);

  	parcelsVisibleArea = new lvector.CartoDB({
    user: "admin2",
    table: "sei_weld_parcels",
    fields: "cartodb_id,parcel,name,legal,accountno,accounttyp,sec,ts,st_simplify(the_geom,0.000008) the_geom",
    key: "f5019774d855a7103161059c8f1a73972442dd70",
    scaleRange: [15, 20],
    map: map,
    symbology: {
        type: "single", // Defines the symbology as a single type of representation for all features
        vectorOptions: { // Leaflet Path options for all features
            fillColor: "#F0F5FF",
            fillOpacity: 0.1,
            weight: .75,
            color: "#0000FF"
        } 
    },
      popupTemplate: '<div class="iw-content"><h4>Owner: {name}</h4><table class="condensed-table"><tr><th>Parcel #</th><td> &nbsp {parcel}</td></tr><tr><th>Account Type</th><td> &nbsp {accounttyp}</td></tr><tr><th>Account Number</th><td> &nbsp {accountno}</td></tr><th>Location</th><td> &nbsp {sec} &nbsp {ts}</td></tr></table></div>',
      singlePopup: true
    });
    /*Map Services
    var plssLayer = new L.esri.dynamicMapLayer('http://www.geocommunicator.gov/ArcGIS/rest/services/PLSS/MapServer', {
      opacity: 0.45,
      layers: [1,2,9,10,11,12],
      useCORS: true,
      position: "back"
    });
    */
  	//pullCartoDBData("POST","http://admin2.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM sei_weld_parcels &api_key=f5019774d855a7103161059c8f1a73972442dd70","json","data",parcels,'parcels');
  	/*Draw Control to Define Well & Permit Area*/
	var drawnItems = new L.FeatureGroup();
	  map.addLayer(drawnItems);

	  // Initialise the draw control and pass it the FeatureGroup of editable layers
	  var drawControlOptions = {
	    position: 'topleft',
	    draw: {
	      polyline: false, // Turn off tool
	      polygon: false, // Turn off tool 
	      circle: false, // Turn off tool
	      rectangle: {
	        shapeOptions: {
	          clickable: true,
	          fillOpacity: .1
	        }
	        
	      },
	      marker: false,
	    },
	    edit: false,
	  };

  	var drawControl = new L.Control.Draw(drawControlOptions);
	  map.addControl(drawControl);
	  map.on('draw:created', function(e) {
	      drawnItems.clearLayers()
	      drawnItems.addLayer(e.layer);
	      if (e.layerType === "rectangle") {
	        //map.spin(true);
	        var parcelThreshold = $('#parcelThreshold').val();
	        $('.resultRow').remove();
	        parcelsDefinedArea.clearLayers();
	        var latLngs = e.layer._latlngs
	        var strQuery ="null";
	          strQuery = strQuery.replace(/,+$/, "");
	      if (strQuery =="null"){
	        pullCartoDBSpatialQuery("POST","http://admin2.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM sei_weld_parcels WHERE the_geom %26%26 ST_SetSRID(ST_MakeBox2D(ST_Point(" + latLngs[1].lng + "," + latLngs[1].lat + "), ST_Point(" + latLngs[3].lng + "," + latLngs[3].lat + ")), 4326) LIMIT " + parcelThreshold + " &api_key=f5019774d855a7103161059c8f1a73972442dd70","json",'true');
	        drawnItems.clearLayers();
	      } else {
	        pullCartoDBSpatialQuery("POST","http://admin2.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM sei_weld_parcels WHERE the_geom %26%26 ST_SetSRID(ST_MakeBox2D(ST_Point(" + latLngs[1].lng + "," + latLngs[1].lat + "), ST_Point(" + latLngs[3].lng + "," + latLngs[3].lat + ")), 4326) LIMIT " + parcelThreshold + " &api_key=f5019774d855a7103161059c8f1a73972442dd70","json",'true');
	        drawnItems.clearLayers();
	      }
	    }   
	});
    /*Data Pull Functions*/
    function pullCartoDBData(type,url,dataType,data,target,targetName,write){
        //map.spin(true);
        $.ajax({
          type:type,
          url: url,
          dataType: dataType,
          data: data,
          success: function(data,textStatus, XMLHttpRequest) {
            console.log("Successfully pulled from CartoDB");
            if (target !=null){target.addData(data)}
            if (write =="true"){writeResults(data)} 
            map.spin(false);
            },
          error: function (responseData, textStatus, errorThrown) {
            console.log("Bad");
           // map.spin(false);
          }
        });
      }
	function pullCartoDBSpatialQuery(type,url,dataType,parcels){
      $.ajax({
          type:type,
          url: url,
          dataType: dataType,
          data: "",
          success: function(data,textStatus, XMLHttpRequest) {
            console.log("Successfully pulled parcels from CartoDB");
           
            if (parcels === 'true'){

              parcelsDefinedArea.addData(data);

            }

          },
          error: function (responseData, textStatus, errorThrown) {
            console.log("Bad");
            document.getElementById("map").style.cursor = "default";
            map.spin(false);
          }
      });
    }

}
