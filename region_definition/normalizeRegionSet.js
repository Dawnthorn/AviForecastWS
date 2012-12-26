//
// required packages
//
var fs = require('fs');
var _ = require('underscore');

normalizeRegionSetInRegionsJSONFile('../public/v1test/regions.json', './output0.json');
normalizeRegionSetInRegionsJSONFile('../public/v1/regions.json', './output1.json');

function normalizeRegionSetInRegionsJSONFile(inputFilePath, outputFilePath) {
    var input = fs.readFileSync(inputFilePath, 'utf8');
    var output = normalizeRegionSet(input);
    fs.writeFileSync(outputFilePath, output, 'utf8');
}

function normalizeRegionSet(input) {
    var regions = JSON.parse(input);

    // remove points
    for (var i = 0; i < regions.length; i++) {
        delete regions[i].points;
    }
    
    // sort by regionId
    regions = _.sortBy(regions, 'regionId');

    return (JSON.stringify(regions, null, 4));
}
