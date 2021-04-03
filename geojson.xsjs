/*var s = $.request.parameters.get("top");
var l = $.request.parameters.get("limit");*/

var ret_data = {
	"type" : "FeatureCollection",
	"features" : []
};

// select "State","2010","2011","2012","2013" from "SYSTEM"."AvgPREMIUMS"
var conn = $.db.getConnection();

var result = [];
var i = 1;// voltage,customer count, criti

/*
 * var sqlArea = ''+ ' SELECT top 10 '+ ' OBJECTID, NAME,'+ '
 * CIRCUIT_CLASSIFICATION,'+ '"TOTAL_CI"/("CUSTOMERS"+.0001),'+ ' NOMINAL_VO,'+
 */


var sqlArea = '' + ' SELECT  "MeasuredLe",' + '	"LengthSour",'
		+ '	"ConductorC",' + '	round("MeasuredLe"),' + '	"ConductorC",'
		+ '   SHAPE.ST_AsGeoJSON() '
		+ ' FROM "SAP_ELEC_DIST"."PriOHElectricLineSegment"  ';


var psArea = conn.prepareStatement(sqlArea);
psArea.execute();
var z = "";
var rsArea = psArea.getResultSet();

while (rsArea.next()) {

	var feature = {
		"type" : "Feature",
		"id" : rsArea.getString(1),
		"properties" : {}
	};
	feature.properties = {
		"id" : rsArea.getString(1),
		"cType" : '1',
		"und" : "0",
		"show_on_map" : true,
		"NAME" : rsArea.getString(2),
		"CIRCUIT_CLASSIFICATION" : rsArea.getString(3),
		"CUST" : rsArea.getString(4),
		"VOLT" : rsArea.getString(5)

	};
	feature.geometry = JSON.parse(rsArea.getString(6));

	ret_data.features.push(feature);
	i++;
}



$.response.contentType = "application/json";
$.response.setBody(JSON.stringify(ret_data));