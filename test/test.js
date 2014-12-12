//
// required packages
//
var should = require('should');
var winston = require('winston');
var fs = require('fs');
var moment = require('moment');
var forecasts = require('../forecasts.js');


// set up the logger
winston.remove(winston.transports.Console);
// verbose, info, warn, error are the log levels we're using
winston.add(winston.transports.Console, {level: 'error', handleExceptions: true});


describe('aviLevelFromName', function(){
    describe('matching strings', function(){
        it('should return the correct avi Level', function(){
            forecasts.aviLevelFromName('low').should.equal(1);
            forecasts.aviLevelFromName('moderate').should.equal(2);
            forecasts.aviLevelFromName('considerable').should.equal(3);
            forecasts.aviLevelFromName('high').should.equal(4);
            forecasts.aviLevelFromName('extreme').should.equal(5);
            forecasts.aviLevelFromName('Low').should.equal(1);
            forecasts.aviLevelFromName('lOW').should.equal(1);
            forecasts.aviLevelFromName(' low').should.equal(1);
            forecasts.aviLevelFromName('low ').should.equal(1);
            forecasts.aviLevelFromName(' low ').should.equal(1);
            forecasts.aviLevelFromName('   lOw ').should.equal(1);
        })
    })
    describe('non-matching strings', function(){
        it('should return 0', function(){
            forecasts.aviLevelFromName('foo').should.equal(0);
            forecasts.aviLevelFromName('lower').should.equal(0);
            forecasts.aviLevelFromName('no-data').should.equal(0);
            forecasts.aviLevelFromName('').should.equal(0);
            forecasts.aviLevelFromName(null).should.equal(0);
        })
    })
})

describe('findHighestAviLevelInString', function(){
    describe('matching strings', function(){
        it('should return the correct avi Level', function(){
            forecasts.findHighestAviLevelInString('low').should.equal(1);
            forecasts.findHighestAviLevelInString('moderate').should.equal(2);
            forecasts.findHighestAviLevelInString('considerable').should.equal(3);
            forecasts.findHighestAviLevelInString('high').should.equal(4);
            forecasts.findHighestAviLevelInString('extreme').should.equal(5);
            forecasts.findHighestAviLevelInString('Low').should.equal(1);
            forecasts.findHighestAviLevelInString('lOW').should.equal(1);
            forecasts.findHighestAviLevelInString(' low').should.equal(1);
            forecasts.findHighestAviLevelInString('low ').should.equal(1);
            forecasts.findHighestAviLevelInString(' low ').should.equal(1);
            forecasts.findHighestAviLevelInString('   lOw ').should.equal(1);
        })
    })
    describe('non-matching strings', function(){
        it('should return 0', function(){
            forecasts.findHighestAviLevelInString('foo').should.equal(0);
            forecasts.findHighestAviLevelInString('lower').should.equal(0);
            forecasts.findHighestAviLevelInString('lowhigh').should.equal(0);
            forecasts.findHighestAviLevelInString('').should.equal(0);
            forecasts.findHighestAviLevelInString(null).should.equal(0);
        })
    })
    describe('multiple matching strings', function(){
        it('should return the highest level', function(){
            forecasts.findHighestAviLevelInString('low high').should.equal(4);
            forecasts.findHighestAviLevelInString(' low high   ').should.equal(4);
            forecasts.findHighestAviLevelInString('high low').should.equal(4);
            forecasts.findHighestAviLevelInString('low low').should.equal(1);
            forecasts.findHighestAviLevelInString('low high low').should.equal(4);
            forecasts.findHighestAviLevelInString('low highways').should.equal(1);
        })
    })
})

describe('getRegionDetailsForRegionId', function(){
    describe('matching strings', function(){
        it('should return the correct region details', function(){
            forecasts.getRegionDetailsForRegionId('nwac_olympics').should.have.property('provider','nwac');
            forecasts.getRegionDetailsForRegionId('cac_1').should.have.property('provider','cac');
            forecasts.getRegionDetailsForRegionId('pc_1').should.have.property('provider','pc');
            forecasts.getRegionDetailsForRegionId('caic_1b').should.have.property('provider','caic');
        })
    })
    describe('non-matching strings', function(){
        it('should return null', function(){
            should.not.exist(forecasts.getRegionDetailsForRegionId('foo'));
            should.not.exist(forecasts.getRegionDetailsForRegionId('foo_bar'));
            should.not.exist(forecasts.getRegionDetailsForRegionId(''));
            should.not.exist(forecasts.getRegionDetailsForRegionId(null));
            should.not.exist(forecasts.getRegionDetailsForRegionId('caic_0123456'));
        })
    })
})

describe('validateForecast', function(){
    describe('null forecasts', function(){
        it('should return false, unless it is a known exception region', function(){
            forecasts.validateForecast('nwac_olympics', null).should.be.false;
            forecasts.validateForecast('cacb_northrockies', null).should.be.true;     // NOTE this region currently never issues danger levels
        })
    })
    describe('valid forecasts', function(){
        it('should return true', function(){
            forecasts.validateForecast('nwac_olympics',
                forecasts.parseForecast_nwac(fs.readFileSync('test/data/nwac/file001.json','utf8'),
                forecasts.getRegionDetailsForRegionId('nwac_olympics')), false).should.be.true;

            forecasts.validateForecast('cac_sea-to-sky',
                forecasts.parseForecast_cac(fs.readFileSync('test/data/cac/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('cac_sea-to-sky')), false).should.be.true;

            forecasts.validateForecast('caic_8',
                forecasts.parseForecast_simple_caaml(fs.readFileSync('test/data/caic/file002.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('caic_8')), false).should.be.true;
        })
    })
    describe('forecasts with bad dates', function(){
        it('should return false', function(){
            forecasts.validateForecast('nwac_olympics', [{date:'2012-01-01', aviLevel:1},{date:'2012-01-03', aviLevel:1}], false).should.be.false;
            forecasts.validateForecast('nwac_olympics', [{date:'2012-01-01', aviLevel:1},{date:'2012-01-01', aviLevel:1}], false).should.be.false;
            forecasts.validateForecast('nwac_olympics', [{date:'2012-01-01', aviLevel:1},{date:'2011-12-31', aviLevel:1}], false).should.be.false;
            forecasts.validateForecast('nwac_olympics', [{date:'2012-01-01', aviLevel:1},{date:'2012-01-02', aviLevel:1},{date:'2012-01-04', aviLevel:1}], false).should.be.false;
            forecasts.validateForecast('nwac_olympics', [{date:'2012-01-01', aviLevel:1},{date:'2012-01-02', aviLevel:1},{date:'2012-01-01', aviLevel:1}], false).should.be.false;
        })
    })
    describe('forecasts with bad aviLevels', function(){
        it('should return false', function(){
            forecasts.validateForecast('nwac_olympics', [{date:'2012-01-01', aviLevel:1},{date:'2012-01-02', aviLevel:0}], false).should.be.false;
            forecasts.validateForecast('nwac_olympics', [{date:'2012-01-01', aviLevel:0},{date:'2012-01-02', aviLevel:1}], false).should.be.false;
            forecasts.validateForecast('nwac_olympics', [{date:'2012-01-01', aviLevel:4},{date:'2012-01-02', aviLevel:1},{date:'2012-01-03', aviLevel:0}], false).should.be.false;
        })
    })
})

describe('validateForecastForCurrentDay', function(){
    describe('current date is not represented', function(){
        it('should return false', function(){
            forecasts.validateForecastForCurrentDay('nwac_olympics', [{date:'2012-01-01', aviLevel:2},{date:'2012-01-02', aviLevel:3}]).should.be.false;
        })
    })
    describe('current date is not represented', function(){
        it('should return true', function(){
            // NOTE this is run using current local time...
            forecasts.validateForecastForCurrentDay('nwac_olympics',
                [{date:moment().format('YYYY-MM-DD'), aviLevel:2},{date:moment().add(1, 'days').format('YYYY-MM-DD'), aviLevel:3}]).should.be.true;
        })
    })
})

describe('dateStringFromDateTimeString_caaml', function(){
    describe('valid strings', function(){
        it('should return the correct date', function(){
            forecasts.dateStringFromDateTimeString_caaml('2012-02-02T18:14:00').should.equal('2012-02-02');
            forecasts.dateStringFromDateTimeString_caaml('2012-02-10T00:00:00Z').should.equal('2012-02-10');
            forecasts.dateStringFromDateTimeString_caaml('2012-02-02').should.equal('2012-02-02');
        })
    })
})

describe('parseForecast_nwac', function(){
    describe('file000.json', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_nwac(fs.readFileSync('test/data/nwac/file000.json','utf8'),
                forecasts.getRegionDetailsForRegionId('nwac_olympics'));

            should.not.exist(forecast);
        })
    })
    describe('file001.json', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_nwac(fs.readFileSync('test/data/nwac/file001.json','utf8'),
                forecasts.getRegionDetailsForRegionId('nwac_olympics'));

            should.exist(forecast);
            forecast.length.should.equal(3);
            forecast[0].date.should.equal('2013-12-05');
            forecast[1].date.should.equal('2013-12-06');
            forecast[2].date.should.equal('2013-12-07');
            forecast[0].aviLevel.should.equal(2);
            forecast[1].aviLevel.should.equal(2);
            forecast[2].aviLevel.should.equal(3);
        })
    })
    describe('file002.json', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_nwac(fs.readFileSync('test/data/nwac/file002.json','utf8'),
                forecasts.getRegionDetailsForRegionId('nwac_mt-hood'));

            should.exist(forecast);
            forecast.length.should.equal(3);
            forecast[0].date.should.equal('2013-12-05');
            forecast[1].date.should.equal('2013-12-06');
            forecast[2].date.should.equal('2013-12-07');
            forecast[0].aviLevel.should.equal(0);
            forecast[1].aviLevel.should.equal(0);
            forecast[2].aviLevel.should.equal(0);
        })
    })
    describe('file003.json', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_nwac(fs.readFileSync('test/data/nwac/file003.json','utf8'),
                forecasts.getRegionDetailsForRegionId('nwac_cascade-west-stevens-pass'));

            should.exist(forecast);
            forecast.length.should.equal(3);
            forecast[0].date.should.equal('2013-12-05');
            forecast[1].date.should.equal('2013-12-06');
            forecast[2].date.should.equal('2013-12-07');
            forecast[0].aviLevel.should.equal(3);
            forecast[1].aviLevel.should.equal(3);
            forecast[2].aviLevel.should.equal(3);
        })
    })
})

describe('parseForecast_cac', function(){
    describe('file000.xml', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_cac(fs.readFileSync('test/data/cac/file000.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('cac_0'));

            should.not.exist(forecast);
        })
    })
    describe('file001.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_cac(fs.readFileSync('test/data/cac/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('cac_kananaskis'));

            should.exist(forecast);
            forecast.length.should.equal(5);
            forecast[0].date.should.equal('2012-12-04');
            forecast[1].date.should.equal('2012-12-05');
            forecast[2].date.should.equal('2012-12-06');
            forecast[3].date.should.equal('2012-12-07');
            forecast[4].date.should.equal('2012-12-08');
            forecast[0].aviLevel.should.equal(3);
            forecast[1].aviLevel.should.equal(3);
            forecast[2].aviLevel.should.equal(4);
            forecast[3].aviLevel.should.equal(3);
            forecast[4].aviLevel.should.equal(2);
        })
    })
    describe('file002.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_cac(fs.readFileSync('test/data/cac/file002.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('cac_sea-to-sky'));

            should.exist(forecast);
            forecast.length.should.equal(5);
            forecast[0].date.should.equal('2012-12-04');
            forecast[1].date.should.equal('2012-12-05');
            forecast[2].date.should.equal('2012-12-06');
            forecast[3].date.should.equal('2012-12-07');
            forecast[4].date.should.equal('2012-12-08');
            forecast[0].aviLevel.should.equal(4);
            forecast[1].aviLevel.should.equal(4);
            forecast[2].aviLevel.should.equal(4);
            forecast[3].aviLevel.should.equal(3);
            forecast[4].aviLevel.should.equal(3);
        })
    })
})

describe('parseForecast_pc', function(){
    describe('file000.xml', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_pc(fs.readFileSync('test/data/pc/file000.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('pc_0'));

            should.not.exist(forecast);
        })
    })
    describe('file001.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_pc(fs.readFileSync('test/data/pc/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('pc_1'));

            should.exist(forecast);
            forecast.length.should.equal(4);
            forecast[0].date.should.equal('2012-02-10');
            forecast[1].date.should.equal('2012-02-11');
            forecast[2].date.should.equal('2012-02-12');
            forecast[3].date.should.equal('2012-02-13');
            forecast[0].aviLevel.should.equal(1);
            forecast[1].aviLevel.should.equal(1);
            forecast[2].aviLevel.should.equal(1);
            forecast[3].aviLevel.should.equal(1);
        })
    })
    describe('file002.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_pc(fs.readFileSync('test/data/pc/file002.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('pc_3'));

            should.exist(forecast);
            forecast.length.should.equal(4);
            forecast[0].date.should.equal('2012-02-08');
            forecast[1].date.should.equal('2012-02-09');
            forecast[2].date.should.equal('2012-02-10');
            forecast[3].date.should.equal('2012-02-11');
            forecast[0].aviLevel.should.equal(2);
            forecast[1].aviLevel.should.equal(2);
            forecast[2].aviLevel.should.equal(2);
            forecast[3].aviLevel.should.equal(2);
        })
    })
    describe('file003.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_pc(fs.readFileSync('test/data/pc/file003.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('pc_2'));

            // NOTE this test case if for the case where there is a bogus issued timestamp that is in the future
            // (this forecast was actually issued on 2012-02-16, but says it was issued on 2012-02-17)
            should.exist(forecast);
            forecast.length.should.equal(4);
            forecast[0].date.should.equal('2012-02-16');
            forecast[1].date.should.equal('2012-02-17');
            forecast[2].date.should.equal('2012-02-18');
            forecast[3].date.should.equal('2012-02-19');
            forecast[0].aviLevel.should.equal(1);
            forecast[1].aviLevel.should.equal(1);
            forecast[2].aviLevel.should.equal(1);
            forecast[3].aviLevel.should.equal(1);
        })
    })
    describe('file004.xml', function(){
        it('should return the correct forecast details, meaning level 0 for everything', function(){
            var forecast = forecasts.parseForecast_pc(fs.readFileSync('test/data/pc/file004.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('pc_4'));

            // NOTE this test case if for the case where there is a bogus issued timestamp that is in the future
            // (this forecast was actually issued on 2012-02-16, but says it was issued on 2012-02-17)
            should.exist(forecast);
            forecast.length.should.equal(4);
            forecast[0].date.should.equal('2012-04-17');
            forecast[1].date.should.equal('2012-04-18');
            forecast[2].date.should.equal('2012-04-19');
            forecast[3].date.should.equal('2012-04-20');
            forecast[0].aviLevel.should.equal(0);
            forecast[1].aviLevel.should.equal(0);
            forecast[2].aviLevel.should.equal(0);
            forecast[3].aviLevel.should.equal(0);
        })
    })
})

describe('parseForecast_simple_caaml caic', function(){
    describe('file000.xml', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_simple_caaml(fs.readFileSync('test/data/caic/file000.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('caic_0a'));

            should.not.exist(forecast);
        })
    })
    describe('file001.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_simple_caaml(fs.readFileSync('test/data/caic/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('caic_4'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2012-02-13');
            forecast[0].aviLevel.should.equal(3);
        })
    })
    describe('file002.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_simple_caaml(fs.readFileSync('test/data/caic/file002.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('caic_8'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2012-02-13');
            forecast[0].aviLevel.should.equal(4);
        })
    })
})

describe('parseForecast_simple_caaml btac', function(){
    describe('file001.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_simple_caaml(fs.readFileSync('test/data/btac/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('btac_teton'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2012-12-14');
            forecast[0].aviLevel.should.equal(2);
        })
    })
})

describe('parseForecast_simple_caaml gnfac', function(){
    describe('file001.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_simple_caaml(fs.readFileSync('test/data/gnfac/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('gnfac_Bridgers'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2012-12-30');
            forecast[0].aviLevel.should.equal(2);
        })
    })
    describe('file002.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_simple_caaml(fs.readFileSync('test/data/gnfac/file002.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('gnfac_Lionhead_Area'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2012-12-30');
            forecast[0].aviLevel.should.equal(2);
        })
    })
})

describe('parseForecast_simple_caaml snfac', function(){
    describe('file001.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_simple_caaml(fs.readFileSync('test/data/snfac/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('snfac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-01-22');
            forecast[0].aviLevel.should.equal(2);
        })
    })
    describe('file002.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_simple_caaml(fs.readFileSync('test/data/snfac/file002.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('snfac_4'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-01-22');
            forecast[0].aviLevel.should.equal(0);
        })
    })
})

describe('parseForecast_uac', function(){
    describe('file000.json', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_uac(fs.readFileSync('test/data/uac/file000.json','utf8'),
                forecasts.getRegionDetailsForRegionId('uac_slc'));

            should.not.exist(forecast);
        })
    })
    describe('file001.json', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_uac(fs.readFileSync('test/data/uac/file001.json','utf8'),
                forecasts.getRegionDetailsForRegionId('uac_ogden'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-02-03');
            forecast[0].aviLevel.should.equal(2);
        })
    })
    describe('file002.json', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_uac(fs.readFileSync('test/data/uac/file002.json','utf8'),
                forecasts.getRegionDetailsForRegionId('uac_salt-lake'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-01-20');
            forecast[0].aviLevel.should.equal(2);
        })
    })
})

describe('parseForecastIssuedDate_viac', function(){
    it('should return the correct date', function(){
        var forecastIssuedDate;

        forecastIssuedDate = forecasts.parseForecastIssuedDate_viac('<div class="date" title="1330111140000"><span class="date_prefix">Date Issued </span>February 24, 2012 at 11:19AM</div>',
            forecasts.getRegionDetailsForRegionId('viac_'));
        moment(forecastIssuedDate).format('YYYY-MM-DD').should.equal('2012-02-24');

        forecastIssuedDate = forecasts.parseForecastIssuedDate_viac('<div class="date" title="1330111140000"><span class="date_prefix">Date Issued </span>February 24th, 2012 at 11:19AM</div>',
            forecasts.getRegionDetailsForRegionId('viac_'));
        moment(forecastIssuedDate).format('YYYY-MM-DD').should.equal('2012-02-24');
    })
})

describe('parseForecast_viac', function(){
    describe('file000.html', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_viac(fs.readFileSync('test/data/viac/file000.html','utf8'),
                forecasts.getRegionDetailsForRegionId('viac_'));

            should.not.exist(forecast);
        })
    })
    describe('file001.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_viac(fs.readFileSync('test/data/viac/file001.html','utf8'),
                forecasts.getRegionDetailsForRegionId('viac_'));

            should.exist(forecast);
            forecast.length.should.equal(3);
            forecast[0].date.should.equal('2012-11-28');
            forecast[1].date.should.equal('2012-11-29');
            forecast[2].date.should.equal('2012-11-30');
            forecast[0].aviLevel.should.equal(2);
            forecast[1].aviLevel.should.equal(4);
            forecast[2].aviLevel.should.equal(4);
        })
    })
})

describe('parseForecast_sac', function(){
    describe('file000.xml', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_sac(fs.readFileSync('test/data/sac/file000.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('sac_1'));

            should.not.exist(forecast);
        })
    })
    describe('file001.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_sac(fs.readFileSync('test/data/sac/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('sac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-04-11');
            forecast[0].aviLevel.should.equal(2);
        })
    })
})

describe('parseForecast_esac', function(){
    describe('file000.html', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_esac(fs.readFileSync('test/data/esac/file000.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('esac_north'));

            should.not.exist(forecast);
        })
    })
    describe('file001.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_esac(fs.readFileSync('test/data/esac/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('esac_mammoth'));

            should.exist(forecast);
            forecast.length.should.equal(2);
            forecast[0].date.should.equal('2013-12-24');
            forecast[1].date.should.equal('2013-12-25');
            forecast[0].aviLevel.should.equal(0);
            forecast[1].aviLevel.should.equal(0);
        })
    })
    describe('file002.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_esac(fs.readFileSync('test/data/esac/file002.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('esac_mammoth'));

            should.exist(forecast);
            forecast.length.should.equal(2);
            forecast[0].date.should.equal('2014-01-31');
            forecast[1].date.should.equal('2014-02-01');
            forecast[0].aviLevel.should.equal(3);
            forecast[1].aviLevel.should.equal(3);
        })
    })
})

describe('parseForecast_wcmac', function(){
    describe('file000.xml', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_wcmac(fs.readFileSync('test/data/wcmac/file000.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('wcmac_north'));

            should.not.exist(forecast);
        })
    })
    describe('file001.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_wcmac(fs.readFileSync('test/data/wcmac/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('wcmac_north'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-01-09');
            forecast[0].aviLevel.should.equal(4);
        })
    })
    describe('file002.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_wcmac(fs.readFileSync('test/data/wcmac/file002.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('wcmac_north'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-01-11');
            forecast[0].aviLevel.should.equal(4);
        })
    })
})

describe('parseForecast_wb', function(){
    describe('file000.html', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_wb(fs.readFileSync('test/data/wb/file000.html','utf8'),
                forecasts.getRegionDetailsForRegionId('wb_'));

            should.not.exist(forecast);
        })
    })
    describe('file001.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_wb(fs.readFileSync('test/data/wb/file001.html','utf8'),
                forecasts.getRegionDetailsForRegionId('wb_'));

            should.exist(forecast);
            forecast.length.should.equal(3);
            forecast[0].date.should.equal('2013-02-03');
            forecast[1].date.should.equal('2013-02-04');
            forecast[2].date.should.equal('2013-02-05');
            forecast[0].aviLevel.should.equal(1);
            forecast[1].aviLevel.should.equal(1);
            forecast[2].aviLevel.should.equal(3);
        })
    })
    describe('file002.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_wb(fs.readFileSync('test/data/wb/file002.html','utf8'),
                forecasts.getRegionDetailsForRegionId('wb_'));

            should.exist(forecast);
            forecast.length.should.equal(3);
            forecast[0].date.should.equal('2013-02-05');
            forecast[1].date.should.equal('2013-02-06');
            forecast[2].date.should.equal('2013-02-07');
            forecast[0].aviLevel.should.equal(3);
            forecast[1].aviLevel.should.equal(3);
            forecast[2].aviLevel.should.equal(3);
        })
    })
})

describe('parseForecast_ipac', function(){
    describe('file000.html', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_ipac(fs.readFileSync('test/data/ipac/file000.html','utf8'),
                forecasts.getRegionDetailsForRegionId('ipac_4'));

            should.not.exist(forecast);
        })
    })
    describe('file001.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_ipac(fs.readFileSync('test/data/ipac/file001.html','utf8'),
                forecasts.getRegionDetailsForRegionId('ipac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-02-08');
            forecast[0].aviLevel.should.equal(2);
        })
    })
    describe('file002.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_ipac(fs.readFileSync('test/data/ipac/file002.html','utf8'),
                forecasts.getRegionDetailsForRegionId('ipac_2'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-02-15');
            forecast[0].aviLevel.should.equal(2);
        })
    })
    describe('file003.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_ipac(fs.readFileSync('test/data/ipac/file003.html','utf8'),
                forecasts.getRegionDetailsForRegionId('ipac_3'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-02-15');
            forecast[0].aviLevel.should.equal(2);
        })
    })
    describe('file004.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_ipac(fs.readFileSync('test/data/ipac/file004.html','utf8'),
                forecasts.getRegionDetailsForRegionId('ipac_4'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-02-22');
            forecast[0].aviLevel.should.equal(3);
        })
    })
    describe('file005.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_ipac(fs.readFileSync('test/data/ipac/file005.html','utf8'),
                forecasts.getRegionDetailsForRegionId('ipac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-03-08');
            forecast[0].aviLevel.should.equal(3);
        })
    })
    describe('file006.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_ipac(fs.readFileSync('test/data/ipac/file006.html','utf8'),
                forecasts.getRegionDetailsForRegionId('ipac_4'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-03-15');
            forecast[0].aviLevel.should.equal(2);
        })
    })
    describe('file007.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_ipac(fs.readFileSync('test/data/ipac/file007.html','utf8'),
                forecasts.getRegionDetailsForRegionId('ipac_3'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-12-20');
            forecast[0].aviLevel.should.equal(2);
        })
    })
})

describe('parseForecast_fac', function(){
    describe('file000.xml', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_fac(fs.readFileSync('test/data/fac/file000.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('fac_1'));

            should.not.exist(forecast);
        })
    })
    describe('file001.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_fac(fs.readFileSync('test/data/fac/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('fac_3'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2014-12-11');
            forecast[0].aviLevel.should.equal(2);
        })
    })
    describe('file002.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_fac(fs.readFileSync('test/data/fac/file002.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('fac_2'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2014-12-11');
            forecast[0].aviLevel.should.equal(2);
        })
    })
})

describe('parseForecast_cnfaic', function(){
    describe('file000.xml', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_cnfaic(fs.readFileSync('test/data/cnfaic/file000.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('cnfaic_turnagain'));

            should.not.exist(forecast);
        })
    })
    describe('file001.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_cnfaic(fs.readFileSync('test/data/cnfaic/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('cnfaic_turnagain'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-03-16');
            forecast[0].aviLevel.should.equal(1);
        })
    })
    describe('file001.xml other region', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_cnfaic(fs.readFileSync('test/data/cnfaic/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('cnfaic_summit'));

            should.not.exist(forecast);
        })
    })
    describe('file002.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_cnfaic(fs.readFileSync('test/data/cnfaic/file002.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('cnfaic_turnagain'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-03-17');
            forecast[0].aviLevel.should.equal(1);
        })
    })
})

describe('parseForecast_jac', function(){
    describe('file000.html', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_jac(fs.readFileSync('test/data/jac/file000.html','utf8'),
                forecasts.getRegionDetailsForRegionId('jac_1'));

            should.not.exist(forecast);
        })
    })
    describe('file001.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_jac(fs.readFileSync('test/data/jac/file001.html','utf8'),
                forecasts.getRegionDetailsForRegionId('jac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-12-16');
            forecast[0].aviLevel.should.equal(2);
        })
    })
    describe('file002.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_jac(fs.readFileSync('test/data/jac/file002.html','utf8'),
                forecasts.getRegionDetailsForRegionId('jac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-12-17');
            forecast[0].aviLevel.should.equal(1);
        })
    })
    describe('file003.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_jac(fs.readFileSync('test/data/jac/file003.html','utf8'),
                forecasts.getRegionDetailsForRegionId('jac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-12-21');
            forecast[0].aviLevel.should.equal(1);
        })
    })
    describe('file004.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_jac(fs.readFileSync('test/data/jac/file004.html','utf8'),
                forecasts.getRegionDetailsForRegionId('jac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2013-12-22');
            forecast[0].aviLevel.should.equal(2);
        })
    })
    describe('file005.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_jac(fs.readFileSync('test/data/jac/file005.html','utf8'),
                forecasts.getRegionDetailsForRegionId('jac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2014-01-08');
            forecast[0].aviLevel.should.equal(1);
        })
    })
    describe('file006.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_jac(fs.readFileSync('test/data/jac/file006.html','utf8'),
                forecasts.getRegionDetailsForRegionId('jac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2014-01-23');
            forecast[0].aviLevel.should.equal(1);
        })
    })
})

describe('parseForecast_hg', function(){
    describe('file000.html', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_hg(fs.readFileSync('test/data/hg/file000.html','utf8'),
                forecasts.getRegionDetailsForRegionId('hg_'));

            should.not.exist(forecast);
        })
    })
    describe('file001.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_hg(fs.readFileSync('test/data/hg/file001.html','utf8'),
                forecasts.getRegionDetailsForRegionId('hg_'));

            should.exist(forecast);
            forecast.length.should.equal(3);
            forecast[0].date.should.equal('2014-01-18');
            forecast[1].date.should.equal('2014-01-19');
            forecast[2].date.should.equal('2014-01-20');
            forecast[0].aviLevel.should.equal(2);
            forecast[1].aviLevel.should.equal(2);
            forecast[2].aviLevel.should.equal(2);
        })
    })
    describe('file002.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_hg(fs.readFileSync('test/data/hg/file002.html','utf8'),
                forecasts.getRegionDetailsForRegionId('hg_'));

            should.exist(forecast);
            forecast.length.should.equal(3);
            forecast[0].date.should.equal('2014-01-24');
            forecast[1].date.should.equal('2014-01-25');
            forecast[2].date.should.equal('2014-01-26');
            forecast[0].aviLevel.should.equal(2);
            forecast[1].aviLevel.should.equal(3);
            forecast[2].aviLevel.should.equal(3);
        })
    })
    describe('file003.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_hg(fs.readFileSync('test/data/hg/file003.html','utf8'),
                forecasts.getRegionDetailsForRegionId('hg_'));

            should.exist(forecast);
            forecast.length.should.equal(3);
            forecast[0].date.should.equal('2014-01-28');
            forecast[1].date.should.equal('2014-01-29');
            forecast[2].date.should.equal('2014-01-30');
            forecast[0].aviLevel.should.equal(3);
            forecast[1].aviLevel.should.equal(2);
            forecast[2].aviLevel.should.equal(2);
        })
    })
})

describe('parseForecast_mwac', function(){
    describe('file000.xml', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_mwac(fs.readFileSync('test/data/mwac/file000.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('mwac_1'));

            should.not.exist(forecast);
        })
    })
    describe('file001.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_mwac(fs.readFileSync('test/data/mwac/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('mwac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2014-02-16');
            forecast[0].aviLevel.should.equal(3);
        })
    })
    describe('file002.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_mwac(fs.readFileSync('test/data/mwac/file002.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('mwac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2014-03-02');
            forecast[0].aviLevel.should.equal(3);
        })
    })
})

describe('parseForecast_msac', function(){
    describe('file000.xml', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_msac(fs.readFileSync('test/data/msac/file000.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('msac_1'));

            should.not.exist(forecast);
        })
    })
    describe('file001.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_msac(fs.readFileSync('test/data/msac/file001.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('msac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2014-03-08');
            forecast[0].aviLevel.should.equal(2);
        })
    })
    describe('file002.xml', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_msac(fs.readFileSync('test/data/msac/file002.xml','utf8'),
                forecasts.getRegionDetailsForRegionId('msac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2014-03-09');
            forecast[0].aviLevel.should.equal(2);
        })
    })
})

describe('parseForecast_pac', function(){
    describe('file000.html', function(){
        it('should fail gracefully on bad input', function(){
            var forecast = forecasts.parseForecast_pac(fs.readFileSync('test/data/pac/file000.html','utf8'),
                forecasts.getRegionDetailsForRegionId('pac_1'));

            should.not.exist(forecast);
        })
    })
    describe('file001.html', function(){
        it('should return the correct forecast details', function(){
            var forecast = forecasts.parseForecast_pac(fs.readFileSync('test/data/pac/file001.html','utf8'),
                forecasts.getRegionDetailsForRegionId('pac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2014-03-29');
            forecast[0].aviLevel.should.equal(3);
        })
    })
    describe('file002.html', function(){
        it('should return the correct parseForecast_pac details', function(){
            var forecast = forecasts.parseForecast_pac(fs.readFileSync('test/data/pac/file002.html','utf8'),
                forecasts.getRegionDetailsForRegionId('pac_1'));

            should.exist(forecast);
            forecast.length.should.equal(1);
            forecast[0].date.should.equal('2014-01-07');
            forecast[0].aviLevel.should.equal(2);
        })
    })
})
