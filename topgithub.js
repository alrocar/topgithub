var fs = require('fs');
var request = require("request"),
    syncRequest = require("sync-request"),
    cheerio = require("cheerio"),
    sleep = require("sleep"),
    Levenshtein = require('levenshtein'),
    url = 'https://github.com/JJ/top-github-users-data/blob/master/formatted/top-alt-Spain.md';

var replaceAll = function(find, replace, str) {
    var find = find.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return str.replace(new RegExp(find, 'g'), replace);
};

var createDir = function(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
};

var topgithub = function() {};

var position, username, commits, stars, language, city, avatar, $td;
var users = [], usr;

var features = [];
var cities = {};
var citiesObj = JSON.parse(fs.readFileSync('municipios.json'));
topgithub.prototype.request = function(url) {
    var self = this;
    request(url, function(error, response, body) {
        if (!error) {
            var $ = cheerio.load(body);

            var result = [];

            $('.container #readme table tr').filter(function(i, el) {
                $td = $(this).find('td').first();
                position = $td.text();
                username = $td.next().text();
                commits = $td.next().next().text();
                stars = $td.next().next().next().text();
                languages = $td.next().next().next().next().text();
                city = $td.next().next().next().next().next().text();
                avatar = $td.next().next().next().next().next().next().find('a').attr('href');

                user = {
                    'position': position.trim(),
                    'username': username,
                    'commits': commits,
                    'stars': stars,
                    'languages': languages,
                    'city': city,
                    'avatar': avatar
                };

                var coords = self.getLonLat(city);

                if (username && coords) {
                    features.push({
                        'type': 'Feature',
                        'geometry' : {
                            'type': 'Point',
                            'coordinates': coords
                        },
                        'properties': user
                    });
                }
            });

            var es = {
                'type': 'FeatureCollection',
                'features': features
            };
            
            var output = 'top_github_ES.geojson';

            fs.writeFileSync(output, JSON.stringify(es, null, 4));

            console.log('File successfully written! - Check your project directory for the ' + output + ' file');
        } else {
            console.log("We’ve encountered an error: " + error);
        }
    });
};

topgithub.prototype.getLonLat = function(city) {
    var cityParts = city.split(',');
    if (cityParts.length == 1) {
        cityParts = cityParts[0].split('-');
    }

    if (cityParts.length == 1) {
        cityParts = cityParts[0].split('.');
    }

    if (cityParts.length == 1) {
        cityParts = cityParts[0].split('(');
    }
    var c, coord, found = false;
    for (var i = 0; i < cityParts.length; i++) {
        if (found) {
            break;
        }

        c = cityParts[i].trim().toLowerCase();

        if (!cities[c]) {
            for (var j = 0; j < citiesObj.length; j++) {
                if (citiesObj[j].municipio.toLowerCase() == c
                    || citiesObj[j].municipio.toLowerCase().indexOf(c) != -1
                    || c.indexOf(citiesObj[j].municipio.toLowerCase()) != -1) {
                    coord = [citiesObj[j].longitud, citiesObj[j].latitud];
                    cities[c] = coord;
                    found = true;
                    break;
                }
            }
        } else {
            coord = cities[c];
            found = true;
        }
    }

    if (!found) {
        // console.log(city);
    }
    return coord;
}

var ttt = new topgithub();
ttt.request(url);

exports = module.exports = topgithub;