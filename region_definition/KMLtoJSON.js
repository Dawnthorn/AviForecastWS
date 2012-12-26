//
// required packages
//
var fs = require('fs');


KMLFileToJSONFile('esac/ESACRegions_simplified.kml','esac/esac_simplified.json','esac','http://esavalanche.org/advisory');
// KMLFileToJSONFile('btac/JHAFC_Zones_simplified.kml','btac/btac_simplified.json','btac','http://jhavalanche.org/viewOther?area=');
// KMLFileToJSONFile('gnfac/GNFAC.kml','gnfac/gnfac.json','gnfac','http://www.mtavalanche.com/current');
// KMLFileToJSONFile('snfac/Advisory Region Map 2011 - zones.kml','snfac/snfac.json','snfac','http://www.sawtoothavalanche.com/adv_current.php');
// KMLFileToJSONFile('sac/SACForecastArea_simplified.kml','sac/sac_simplified.json','sac','http://www.sierraavalanchecenter.org/advisory');
// KMLFileToJSONFile('uac/uac_simplified.kml','uac/uac_simplified.json','uac','http://utahavalanchecenter.org/advisory/');
// KMLFileToJSONFile('caic/caic_simplified.kml','caic/caic_simplified.json','caic','http://avalanche.state.co.us/pub_bc_avo.php?zone_id=');
// KMLFileToJSONFile('Canada_all/canada_regions_simplified.kml','Canada_all/canada_regions_simplified.json','canada','');
// KMLFileToJSONFile('nwac/nwac_regions.kml','nwac/nwac_regions.json','nwac','http://www.nwac.us/forecast/avalanche/current/zone/');


function KMLFileToJSONFile(KMLFileName, JSONFileName, regionPrefix, URLPrefix) {
    var JSONString = KMLStringToJSONString(fs.readFileSync(KMLFileName, 'utf8'), regionPrefix, URLPrefix);
    if (JSONString) {
        fs.writeFileSync(JSONFileName, JSONString, 'utf8');
    }
}

function KMLStringToJSONString(KML, regionPrefix, URLPrefix) {

    var JSONString = null;

    // grab all the placemarks from the KML
    var placemarkBlocks = KML.match(/<Placemark[^>]*>[\S\s]*?<\/Placemark>/g);
    if (placemarkBlocks) {

        var data = [placemarkBlocks.length];

        for (var i = 0; i < placemarkBlocks.length; i++) {
            //console.log('placemarkBlocks[' + i + ']: ' + placemarkBlocks[i]);

            // for each placemark, grab the data we need

            var nameMatch = placemarkBlocks[i].match(/<name>([\S\s]*?)<\/name>/);
            var name = (nameMatch && nameMatch.length > 1) ? nameMatch[1] : 'TBD';
            //console.log('name: ' + name);

            var oneBasedIndex = i + 1;
            data[i] = {'regionId': regionPrefix + '_' + oneBasedIndex, 'displayName': name, 'URL' : URLPrefix, 'points':[]};

            var coordinatesMatch = placemarkBlocks[i].match(/<coordinates>\s*([\S\s]*?)\s*<\/coordinates>/);
            var coordinatesList = (coordinatesMatch && coordinatesMatch.length > 1) ? coordinatesMatch[1] : '';
            //console.log('coordinatesList: ' + coordinatesList);

            var coordinates = coordinatesList.match(/\s*(\S+)\s*/g);
            if (coordinates) {
                for (var j = 0; j < coordinates.length; j++) {
                    //console.log('coordinates[' + j + ']: ' + coordinates[j]);

                    var components = coordinates[j].match(/[-+]?\d+(?:\.\d*)?/g);
                    if (components && components.length >= 2) {
                        // NOTE latitude comes after longitude in KML ... weird
                        var lat = components[1];
                        var lon = components[0];
                        //console.log('lat: ' + lat + '; lon: ' + lon);

                        data[i].points[j] = {'lat': lat, 'lon': lon};
                    }
                }
            }
        }

        JSONString = JSON.stringify(data, null, 4);
        //console.log(JSONString);
    }

    return JSONString;
}
