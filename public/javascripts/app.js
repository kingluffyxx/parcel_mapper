var raw;//define an array to store coordinates
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
	
  });

  function init(){
  Array.prototype.contains = function(v) {
    for(var i = 0; i < this.length; i++) {
        if(this[i] === v) return true;
    }
    return false;
    };

    Array.prototype.unique = function() {
        var arr = [];
        for(var i = 0; i < this.length; i++) {
            if(!arr.contains(this[i])) {
                arr.push(this[i]);
            }
        }
        return arr; 
    }
  /*load saved session select*/
  pullCartoDBData("POST","http://admin2.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT the_geom,session_name FROM sei_weld_parcels WHERE session_name NOT IN ('null')&api_key=f5019774d855a7103161059c8f1a73972442dd70","json",null,null,null,'false','true');
  /* Basemap Layers */
  var mapquestOSM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
    maxZoom: 19,
      subdomains: ["otile1", "otile2", "otile3", "otile4"],
      attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
  }).addTo(map);
  var osmb = new OSMBuildings(map)
    .date(new Date(2015, 5, 15, 17, 30))
    .load()
  map.removeLayer(osmb);
  var mapquestHYB = L.layerGroup([L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
    maxZoom: 18,
    subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"]
  }), L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/hyb/{z}/{x}/{y}.png", {
    maxZoom: 19,
    subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
    attribution: 'Labels courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
  })]);
    $("[data-widget='spatialQuery']").click(function() {
         $('#spatialQueryModal').modal('show'); 
    });
    $("[data-widget='saveSession']").click(function() {
        $('#saveSessionModal').modal('show'); 
    });
    $("[data-widget='loadSession']").click(function() {
       loadSession();
    });
    $("[data-widget='saveToSessionButton']").click(function() {
        var sessionName = $("#sessionName").val();
        $('#savedSessions').append($('<option>', { option: sessionName }).text(sessionName));
        var geo = sessionParcelsNotSaved.toGeoJSON();
        $.each(geo.features, function (i,v){
            var cdb_id = v.properties.cartodb_id;
            writeCartoDBData("POST","http://admin2.cartodb.com/api/v2/sql?q=UPDATE sei_weld_parcels SET session_name='"+sessionName+"' WHERE  cartodb_id = "+ cdb_id + " &api_key=f5019774d855a7103161059c8f1a73972442dd70")
        })
    })
    $("[data-widget='refreshMap']").click(function() {
       parcelsDefinedArea.clearLayers();
       drawnItems.clearLayers();
       sessionParcelsNotSaved.clearLayers(); 
       resetHighlight();
    });
    $("[data-widget='runSpatialQuery']").click(function() {
        var lineString = '';
        $.each(con.options.layer._layers, function( index, value ) {         
            $.each(value.feature.geometry.coordinates, function(i,v){
              lineString = lineString + String(v[0]) + " " + String(v[1]) + ","
            })
        lineString = lineString.substring(0, lineString.length - 1);
        console.log(lineString);
        });
        pullCartoDBSpatialQuery("POST","http://admin2.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM sei_weld_parcels WHERE ST_Intersects(the_geom, ST_GeomFromText('LINESTRING("+ lineString + ")',4326)) &api_key=f5019774d855a7103161059c8f1a73972442dd70","json",'true');
    });
     $("[data-widget='tableDefined']").click(function() {
          var ele = $("#definedResults");
              ele.empty();
          var geojson = parcelsDefinedArea.toGeoJSON();
          $.each(geojson.features,function(index,feat){
              var tr = ('<tr><td>'+ feat.properties.owner_name + '<a class="btn pull-right" cartodb_id='+feat.properties.cartodb_id+' href="#" id="zoomToParcel" lat='+feat.properties.lat+' long='+feat.properties.long+'><i class="fa fa-arrows-alt pull-right"></a></td><td>'+ feat.properties.pin + '</td><td>'+ feat.properties.situs + '</td></tr>');
                ele.append(tr);
          });
        $('#showResults').modal('show');
        var dataTable = $('#definedResultsTable').dataTable();
    });
     $("[data-widget='tableSession']").click(function() {
          var ele = $("#definedResults");
              ele.empty();
          var geojson = sessionParcelsSaved.toGeoJSON();
          $.each(geojson.features,function(index,feat){
              var tr = ('<tr><td>'+ feat.properties.owner_name + '<a class="btn pull-right" cartodb_id='+feat.properties.cartodb_id+' href="#" id="zoomToParcel" lat='+feat.properties.lat+' long='+feat.properties.long+'><i class="fa fa-arrows-alt pull-right"></a></td><td>'+ feat.properties.pin + '</td><td>'+ feat.properties.situs + '</td></tr>');
                ele.append(tr);
          });
        $('#showResults').modal('show');
        var dataTable = $('#definedResultsTable').dataTable();
        $('#showResults').modal('show');
        var dataTable = $('#definedResultsTable').dataTable();
    });

    $(".exportDefined").on('click', function (event) {
        // Export CSV
        generateReport.apply(this, [(parcelsDefinedArea), 'export.csv']);
    });
     $(".exportSession").on('click', function (event) {
        // Export CSV
        generateReport.apply(this, [(sessionParcelsSaved), 'export.csv']);
    });
     $('#showResults').on('hide.bs.modal', function (e) {
        var tables = $.fn.dataTable.fnTables(true);
        $(tables).each(function () {
            $(this).dataTable().fnDestroy();
        });
    });
    $("[data-widget='saveNotes']").click(function() {
        var cdb_id = $("#editID").text();
        var notes = $("#notesTextArea").val();
        writeCartoDBData("POST","http://admin2.cartodb.com/api/v2/sql?q=UPDATE sei_weld_parcels SET notes='" + notes + "' WHERE  cartodb_id = "+ cdb_id + " &api_key=f5019774d855a7103161059c8f1a73972442dd70")
    });
    $('.wrapper').on('click', '#zoomToParcel', function(e) {
        var cdb_id = $(this).attr('cartodb_id');
        $('#showResults').modal('hide');
              var latlng = L.latLng($(this).attr('lat'), $(this).attr('long'));
              map.setView(latlng,14) 
              $.each(parcelsDefinedArea._layers,function(i,v){
                if(v.cartodb_id==cdb_id){
                  v.setStyle({
                    weight: 5,
                    color: 'red',
                    dashArray: '',
                    fillOpacity: 0.1,
                    opacity:1
                  });
                  v.openPopup();
                }
              });
     })
    $('.wrapper').on('click', '#addToSession', function(e) {
        e.preventDefault();
        var cdb_id = $(this).attr('cartodb_id');
        pullCartoDBData("POST","http://admin2.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM sei_weld_parcels WHERE cartodb_id = "+ cdb_id + " &api_key=f5019774d855a7103161059c8f1a73972442dd70","json","data",sessionParcelsNotSaved,'sessionParcelsNotSaved');

    });
    $('.wrapper').on('click', '#removeFromSession', function(e) {
        e.preventDefault();
        var cdb_id = $(this).attr('cartodb_id');
        sessionLayer;
    });
    $('.wrapper').on('click', '#editNotes', function(e) {
        e.preventDefault();
        var cdb_id = $(this).attr('cartodb_id');
        var notes = $(this).attr('notes');
        $("#editID").text(cdb_id);
        $("#notesTextArea").text(notes);
        $('#notes').modal('show');
    });
    $('.data-item').on('click', function(){
    function getHTML(id) {
      var oldHtml = {
        'sessionKML': function () {
          if (map.hasLayer(kmlLayer)){
            map.removeLayer(kmlLayer);
            return "<i class='fa fa-upload'></i>Session KML Data <i class='fa fa-plus-square pull-right'></i>";
          } else {
            map.addLayer(kmlLayer);
            return "<i class='fa fa-upload'></i>Session KML Data <i class='fa fa-check pull-right'></i>";
          }
        },
        'definedAreaParcels': function () {
          if (map.hasLayer(parcelsDefinedArea)){
            map.removeLayer(parcelsDefinedArea);
            return "<i class='fa fa-square-o'></i>Defined Area <i class='fa fa-plus-square pull-right'></i>";
          } else {
            map.addLayer(parcelsDefinedArea);
            return "<i class='fa fa-square-o'></i>Defined Area <i class='fa fa-check pull-right'></i>";
          }
        },
        'sessionParcelsNotSaved': function () {
          if (map.hasLayer(sessionParcelsNotSaved)){
            map.removeLayer(sessionParcelsNotSaved);
            return "<i class='fa fa-asterisk'></i>Session Parcels <i class='fa fa-plus-square pull-right'></i>";
          } else {
            map.addLayer(sessionParcelsNotSaved);
            return "<i class='fa fa-asterisk'></i>Session Parcels <i class='fa fa-check pull-right'></i>";
          }
        },
        'sessionParcelsSaved': function () {
          if (map.hasLayer( sessionParcelsSaved)){
            map.removeLayer( sessionParcelsSaved);
            return "<i class='fa fa-upload'></i>Loaded Session Parcels <i class='fa fa-plus-square pull-right'></i>";
          } else {
            map.addLayer( sessionParcelsSaved);
            return "<i class='fa fa-upload'></i>Loaded Session Parcels <i class='fa fa-check pull-right'></i>";
          }
        },
        'visibleAreaParcels': function () {
            if (parcelsVisibleArea.getMap() === null){
              parcelsVisibleArea.setMap(map);
              return "<i class='fa fa-square-o'></i>Visible Area <i class='fa fa-check pull-right'></i>";
              } else {
              parcelsVisibleArea.setMap(null);
              return "<i class='fa fa-square-o'></i>Visible Area <i class='fa fa-plus-square pull-right'></i>";
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
        'imagery': function () {
              if (map.hasLayer(mapquestHYB)){
                map.removeLayer(mapquestHYB);
                map.addLayer(mapquestOSM);
                return "<i class='fa fa-square-o'></i>Imagery<i class='fa fa-plus-square fa-fw pull-right'></i>";
              } else {
                map.addLayer(mapquestHYB);
                map.removeLayer(mapquestOSM);
                return "<i class='fa fa-square-o'></i>Imagery<i class='fa fa-check fa-fw pull-right'></i>";
              }
            },
        'osmBuildings': function () {
          if (map.hasLayer(osmb)){
            map.removeLayer(osmb);
            return "<i class='fa fa-plus-square-o'></i>Buildings<i class='fa fa-plus-square fa-fw pull-right'></i>";
          } else {
            map.addLayer(osmb);
            return "<i class='fa fa-plus-square-o'></i>Buildings<i class='fa fa-check fa-fw pull-right'></i>";
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
  var sessionLayerStyle = {
      fillColor: "#F0F5FF",
      fillOpacity: 1,
      weight: 1.75,
      color: "#0000FF"
    };
  var savedSessionLayerStyle = {
      fillColor: "#F0F5FF",
      fillOpacity: .1,
      weight: 1.75,
      color: "black"
    };
	var parcelStyle = {
			fillColor: "#F0F5FF",
      fillOpacity: 0.1,
      weight: 1.75,
      color: "#0000FF"
		};
  function highlightFeature(e) {
      var layer = e.target;
      clicked = e.target;
      layer.setStyle({
        weight: 5,
        color: 'red',
        dashArray: '',
        fillOpacity: 0.1,
        opacity:1
      });
  }
  function resetHighlight(e) {
       parcelsDefinedArea.resetStyle(parcelsDefinedArea);  
       sessionParcelsNotSaved.resetStyle(sessionParcelsNotSaved);  
       sessionParcelsSaved.resetStyle(sessionParcelsSaved);  
  } 
  function generateReport(d, filename){
    var s = "";
    var c = 0;
    var geojson = d.toGeoJSON();
    console.log(geojson);

    $.each(geojson.features,function(index,value){
       if(c==0){
           $.each(value.properties, function(i,p){
              if(i != 'created_at' && i != 'updated_at' && i != 'cartodb_id'){
                name = i.replace("_"," ")
                s += name.toUpperCase() + ",";
              }
           });
          c += 1
          s +=  "\r\n";
        }
      $.each(value.properties, function(i,p){
        console.log(i);
        if(i != 'created_at' && i != 'updated_at' && i != 'cartodb_id'){
          s +=  String(p).replace(",",";") + ","
        }
      })
      s +=  "\r\n";  

    });
    csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(s);
    $(this)
            .attr({
            'download': filename,
                'href': csvData,
                'target': '_blank'
        });

  }
	function loadSession(){
    sessionParcelsSaved.clearLayers();
    var sessionName = $("#savedSessions option:selected").text();
    pullCartoDBData("POST","http://admin2.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM sei_weld_parcels WHERE county NOT IN ('null') AND session_name IN ('"+ sessionName +"')&api_key=f5019774d855a7103161059c8f1a73972442dd70","json",null,sessionParcelsSaved,'sessionParcelsSaved','false','false');    
  }
  function buildPopUp(feature){
    if (feature.properties.county == 'Denver') {
              var mapnum = feature.properties.schednum.substring(0,5);
              var popupContent = ('<div><h4>Owner: ' + feature.properties.owner_name + ' </h4><table class="condensed-table"><tr>\
              <th>Parcel # </th><td>&nbsp'+ feature.properties.pin +' </td></tr><tr>\
              <th>Schedule #</th><td> &nbsp'+ feature.properties.schednum +'</td></tr><tr>\
              <th>Situs Address</th><td> &nbsp'+ feature.properties.situs +'</td></tr>\
              <th>PLSS</th><td>&nbsp Sec '+ feature.properties.sec +' &nbsp TS '+ feature.properties.ts +' </td></tr><tr>\
              <th>Notes: </th><td>&nbsp'+ feature.properties.notes +'</td></tr></table></div><div class="popup-content">\
              <a class="btn " href="#" id="addToSession" cartodb_id="' + feature.properties.cartodb_id +'"><i class="fa fa-bolt"></i></a>\
              <a class="btn " href="http://www.denvergov.org/Property/realproperty/summary/' + feature.properties.pin + '" target="_blank" id="parcelPage" cartodb_id="' + feature.properties.cartodb_id +'" notes="' + feature.properties.notes + '"><i class="fa fa-external-link-square"></i></a>\
              <a class="btn " href="http://www.denvergov.org/denvermaps/documents/assmt/assessormaps/asmt_'+ mapnum + '.pdf" target="_blank" id="parcelMap" cartodb_id="' + feature.properties.cartodb_id +'" notes="' + feature.properties.notes + '"><i class="fa fa-file-photo-o"></i></a>\
              <a class="btn " href="#" id="editNotes" cartodb_id="' + feature.properties.cartodb_id +'" notes="' + feature.properties.notes + '"><i class="fa fa-pencil"></i></a></br></div>')
            }
            if (feature.properties.county == 'Weld') {
              var popupContent =('<div><h4>Owner: ' + feature.properties.owner_name + ' </h4><table class="condensed-table"><tr>\
              <th>Parcel # </th><td>&nbsp'+ feature.properties.pin +' </td></tr><tr>\
              <th>Schedule #</th><td> &nbsp'+ feature.properties.schednum +'</td></tr><tr>\
              <th>Situs Address</th><td> &nbsp'+ feature.properties.situs +'</td></tr>\
              <th>PLSS</th><td>&nbsp Sec '+ feature.properties.sec +' &nbsp TS '+ feature.properties.ts +' </td></tr><tr>\
              <th>Notes: </th><td>&nbsp'+ feature.properties.notes +'</td></tr></table></div><div class="popup-content">\
              <a class="btn " href="#" id="addToSession" cartodb_id="' + feature.properties.cartodb_id +'"><i class="fa fa-bolt"></i></a>\
              <a class="btn " href="#" id="editNotes" cartodb_id="' + feature.properties.cartodb_id +'" notes="' + feature.properties.notes + '"><i class="fa fa-pencil"></i></a></br></div>')
            }
            if (feature.properties.county == 'Logan') {
              var popupContent =('<div><h4>Owner: ' + feature.properties.owner_name + ' </h4><table class="condensed-table"><tr>\
              <th>Parcel # </th><td>&nbsp'+ feature.properties.pin +' </td></tr><tr>\
              <th>Situs Address</th><td> &nbsp'+ feature.properties.situs +'</td></tr>\
              <th>PLSS</th><td>&nbsp Sec '+ feature.properties.sec +' &nbsp TS '+ feature.properties.ts +' </td></tr><tr>\
              <th>Notes: </th><td>&nbsp'+ feature.properties.notes +'</td></tr></table></div><div class="popup-content">\
              <a class="btn " href="#" id="addToSession" cartodb_id="' + feature.properties.cartodb_id +'"><i class="fa fa-bolt"></i></a>\
              <a class="btn " href="http://www.logancountycoaat.com/search/commonsearch.aspx?mode=owner" target="_blank" id="parcelPage" cartodb_id="' + feature.properties.cartodb_id +'" notes="' + feature.properties.notes + '"><i class="fa fa-external-link-square"></i></a>\
              <a class="btn " href="#" id="editNotes" cartodb_id="' + feature.properties.cartodb_id +'" notes="' + feature.properties.notes + '"><i class="fa fa-pencil"></i></a></br></div>')
            }
      return popupContent;
  }
  	var parcelsDefinedArea = L.geoJson(null, {
			style: parcelStyle,
			position: "back",
	        onEachFeature: function (feature, layer) {
            layer.cartodb_id=feature.properties.cartodb_id;
            layer.bindPopup(buildPopUp(feature));
            layer.on({click: resetHighlight});
            layer.on({click: highlightFeature});
			}
	    }).addTo(map);

    var sessionParcelsNotSaved = L.geoJson(null, {
      style: sessionLayerStyle,
      position: "back",
        onEachFeature: function (feature, layer) {
            layer.cartodb_id=feature.properties.cartodb_id;
            layer.bindPopup(buildPopUp(feature));
            layer.on({click: resetHighlight});
            layer.on({click: highlightFeature});

      }
      });
    var sessionParcelsSaved = L.geoJson(null, {
      style: savedSessionLayerStyle,
      position: "back",
        onEachFeature: function (feature, layer) {
            layer.cartodb_id=feature.properties.cartodb_id;
            layer.bindPopup(buildPopUp(feature));
            layer.on({click: resetHighlight});
            layer.on({click: highlightFeature});
      }
      });
    var kmlLayer = L.geoJson(null, {

                  style: {color:'red', weight:5.5},
                  onEachFeature: function(feature,layer){
                    layer.bindPopup('<div><h4>KML Data</div')
              }
      });

    /*Map Services*/
    var plssLayer = new L.esri.dynamicMapLayer('http://www.geocommunicator.gov/ArcGIS/rest/services/PLSS/MapServer', {
      opacity: 0.45,
      layers: [1,2,9,10,11,12],
      useCORS: true,
      position: "back"
    });
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
	          fillOpacity: .0,
            weight: .75
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
	         parcelsDefinedArea.clearLayers();
	        var latLngs = e.layer._latlngs
	        var strQuery ="null";
	          strQuery = strQuery.replace(/,+$/, "");
	      if (strQuery =="null"){
	        pullCartoDBSpatialQuery("POST","http://admin2.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM sei_weld_parcels WHERE county NOT IN ('null') AND the_geom %26%26 ST_SetSRID(ST_MakeBox2D(ST_Point(" + latLngs[1].lng + "," + latLngs[1].lat + "), ST_Point(" + latLngs[3].lng + "," + latLngs[3].lat + ")), 4326) LIMIT " + parcelThreshold + " &api_key=f5019774d855a7103161059c8f1a73972442dd70","json",'true');
	        //drawnItems.clearLayers();
	      } else {
	        pullCartoDBSpatialQuery("POST","http://admin2.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM sei_weld_parcels WHERE county NOT IN ('null') AND the_geom %26%26 ST_SetSRID(ST_MakeBox2D(ST_Point(" + latLngs[1].lng + "," + latLngs[1].lat + "), ST_Point(" + latLngs[3].lng + "," + latLngs[3].lat + ")), 4326) LIMIT " + parcelThreshold + " &api_key=f5019774d855a7103161059c8f1a73972442dd70","json",'true');
	        //drawnItems.clearLayers();
	      }
	    }   
	});
  function refreshDefinedArea(){
    parcelsDefinedArea.clearLayers();
    var parcelThreshold = $('#parcelThreshold').val();
    var drawnArea = drawnItems.getLayers();
    var latLngs = drawnArea[0]._latlngs
    pullCartoDBSpatialQuery("POST","http://admin2.cartodb.com/api/v2/sql?format=GeoJSON&q=SELECT * FROM sei_weld_parcels WHERE county NOT IN ('null') AND the_geom %26%26 ST_SetSRID(ST_MakeBox2D(ST_Point(" + latLngs[1].lng + "," + latLngs[1].lat + "), ST_Point(" + latLngs[3].lng + "," + latLngs[3].lat + ")), 4326) LIMIT " + parcelThreshold + " &api_key=f5019774d855a7103161059c8f1a73972442dd70","json",'true');

  }
  function loadSessionNames(d){
    var nameArray = [];
    $.each(d.features, function (i,v){
      nameArray.push(v.properties.session_name)
    })
    var uniques = nameArray.unique(); // result = [1,3,4,2,8]
    $.each(uniques, function(key, value) {   
      $('#savedSessions')
      .append($('<option>', { value : key })
      .text(value)); 
    }); 
  }
    /*Data Pull Functions*/
    function pullCartoDBData(type,url,dataType,data,target,targetName,write,sessionLoad){
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
            if (sessionLoad == "true"){loadSessionNames(data)}
            if (targetName == "zoom"){
              
             
              //map.fitBounds(data.features[0].geometry);
            }
            },
          error: function (responseData, textStatus, errorThrown) {
            console.log("Bad");
           // map.spin(false);
          }
        });
      }
  function writeCartoDBData(type,url,dataType,data,target,targetName,write){
    $.ajax({
          type:type,
          url: url,
          dataType: dataType,
          data: data,
          success: function(data,textStatus, XMLHttpRequest) {
            console.log("Successfully Updated CartoDB");
            loadSession();
            refreshDefinedArea();
            },
          error: function (responseData, textStatus, errorThrown) {
            console.log("Bad");
           // map.spin(false);
          }
        });
  }
	function pullCartoDBSpatialQuery(type,url,dataType,defined){
      $.ajax({
          type:type,
          url: url,
          dataType: dataType,
          data: "",
          success: function(data,textStatus, XMLHttpRequest) {
            console.log("Successfully pulled parcels from CartoDB");
           
            if (defined === 'true'){
              parcelsDefinedArea.addData(data);
            }

          },
          error: function (responseData, textStatus, errorThrown) {
            console.log("Bad Request");
            document.getElementById("map").style.cursor = "default";
            map.spin(false);
          }
      });
    }
    geoControl = new L.Control.geocoder({
        position: 'topleft',
    }).addTo(map);
    
    var raw;
  con = L.Control.fileLayerLoad({
        // See http://leafletjs.com/reference.html#geojson-options
        /*
        layerOptions: {style: {color:'red'},
                      onEachFeature: function(feature,layer){layer.bindPopup('<div><h4>Owner:</div')
              }
        },
        */
        // Add to map after loading (default: true) ?
        addToMap: true,
        // File size limit in kb (default: 1024) ?
        fileSizeLimit: 10024,
        //Define Layer to add data to
        layer: kmlLayer,
         //Define Layer to add data to
        rawData: raw,
        // Restrict accepted file formats (default: .geojson, .kml, and .gpx) ?
        formats: [
            '.geojson',
            '.kml'
        ]
    }).addTo(map);



}
