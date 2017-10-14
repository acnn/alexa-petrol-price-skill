var request = require('request');
var cheerio = require('cheerio');
var scrapper = (function () {
    return {
        scrapPetrolPrice: function (city, callback) {
            var searchPhrase = city.toLowerCase() + ' petrol price';
            request('https://www.mypetrolprice.com/petrol-price-in-india.aspx', function (error, response, html) {
                if (error) {
                    callback(null);
                }
                else {
                    var $ = cheerio.load(html);
                    var target = $('a').filter(function () {
                        var title = $(this).attr('title');
                        if (title) {
                            return title.toLowerCase().indexOf(searchPhrase) > -1;
                        }
                    });
                    var cityLink = target.attr('href');
                    if (!cityLink) {
                        callback(null);
                    }
                    else {
                        request(cityLink, function (error, response, html) {
                            if (error) {
                                callback(null);
                            }
                            else {
                                var $ = cheerio.load(html);
                                var price = $('#CPH1_lblCurrent').text();
                                console.log('got price : ' + price);
                                price = price.substring(price.indexOf('=') + 1, price.indexOf('Rs')).trim()
                                callback({
                                    price: price,
                                    city: city,
                                    date: new Date().toISOString().replace('T', ' ').substr(0, 10)
                                });
                            }
                        });
                    }
                }
            });
        }
    }
})();

module.exports = scrapper;
