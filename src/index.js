'use strict';
const alexa = require('alexa-sdk');
const util = require('util');
const databaseHelper = require('./helpers/database');
const scrapper = require('./helpers/scrapper');
const skillName = 'Petrol Price';
const resultCountLimit = 2;

var messages = {
    'welcomeMessage': 'Welcome to ' + skillName + '. You can get the latest petrol price for major cities in India. ',
    'helpMessage' : skillName + ' skill gives you the latest petrol price for major cities in India. ',
    'promptForCity': 'For which city do you want to know the price? ',
    'rePromptForCity': 'Please say the city name. ',
    'priceMessage': 'It is %s rupees per litre in %s. ',
    'priceUpMessage': 'The price has gone up by %s. ',
    'priceDownMessage': 'The price has gone down by %s. ',
    'cityNotSupportedMessage': 'Sorry. Currently we do not have the petrol price updates for %s. ',
    'citySlotMissingMessage': 'Sorry. I did not get the city name. ',
    'exitMessage' : 'godspeed'
}

exports.handler = function (event, context, callback) {
    var alexaHandler = alexa.handler(event, context);
    alexaHandler.registerHandlers(handlers);
    alexaHandler.execute();
}


const handlers = {
    'LaunchRequest': function () {
        this.response.speak(messages.welcomeMessage + messages.promptForCity).listen(messages.rePromptForCity);
        this.emit(':responseReady');
    },

    'PriceIntent': function () {
        var emitter = this;
        var citySlot = this.event.request.intent.slots.city;     
        console.log('input : ' + JSON.stringify(citySlot));
        if (!citySlot || !citySlot.value) {
            console.error('city slot missing');
            this.response.speak(messages.citySlotMissingMessage + messages.promptForCity).listen(messages.rePromptForCity);
            this.emit(':responseReady');
        }
        else {
            var city = transformInput(citySlot.value).toLowerCase();
            databaseHelper.getLatestPetrolPrices(city, resultCountLimit, true, function (data) {
                if (!data) {
                    scrapper.scrapPetrolPrice(city, function (scrappedData) {
                        if (!scrappedData) {
                            console.error('city not supported - empty scrapped data');
                            emitter.response.speak(util.format(messages.cityNotSupportedMessage, citySlot.value));
                            emitter.emit(':responseReady');
                        }
                        else {
                            databaseHelper.insertPetrolPrice(scrappedData, function () {
                                emitter.response.speak(util.format(messages.priceMessage, scrappedData.price, city));
                                emitter.emit(':responseReady');
                            });
                        }
                    })

                }
                else {
                    if (data.length > 1) {
                        var response;
                        var dateDifference = dateDiffInDays(new Date(data[1].date), new Date(data[0].date));
                        var dateDifferenceMsg = dateDifference > 1 ? ' over the last ' + dateDifference + ' days' : ' since yesterday';
                        if (data[0].price > data[1].price) {
                            response = util.format(messages.priceMessage, data[0].price, city) + util.format(messages.priceUpMessage, Number(data[0].price - data[1].price).toFixed(2) + dateDifferenceMsg);
                        }
                        else if (data[0].price < data[1].price) {
                            response = util.format(messages.priceMessage, data[0].price, city) + util.format(messages.priceDownMessage, Number(data[1].price - data[0].price).toFixed(2) + dateDifferenceMsg);
                        }
                        else {
                            response = util.format(messages.priceMessage, data[0].price, city);
                        }
                        emitter.response.speak(response);
                        emitter.emit(':responseReady');

                    }
                    else {
                        emitter.response.speak(util.format(messages.priceMessage, data[0].price, city));
                        emitter.emit(':responseReady');
                    }
                }
            });
        }
    },

    'AMAZON.HelpIntent': function () {
        this.response.speak(messages.helpMessage + messages.promptForCity).listen(messages.rePromptForCity);
        this.emit(':responseReady');
    },
    'AMAZON.CancelIntent': function () {
        this.response.speak(messages.exitMessage);
        this.emit(':responseReady');
    },
    'AMAZON.StopIntent': function () {
        this.response.speak(messages.exitMessage);
        this.emit(':responseReady');
    }
};

//transform synonymous city names to the name stored in db
//eg : new delhi -> delhi
function transformInput(city) {
    switch (city.toLowerCase()) {
        case 'new delhi': {
            return 'delhi';
        }
        case 'bangalore': {
            return 'bengaluru';
        }
        case 'bombay': {
            return 'mumbai';
        }
        case 'madras': {
            return 'chennai';
        }
        case 'calcutta': {
            return 'kolkata';
        }
        default: {
            return city;
        }
    }
}

function dateDiffInDays(a, b) {
    var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((utc2 - utc1) / (1000 * 60 * 60 * 24));
}
