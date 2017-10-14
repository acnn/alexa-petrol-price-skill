'use strict';
const alexa = require('alexa-sdk');
const util = require('util');
const databaseHelper = require('./helpers/database');
const scrapper = require('./helpers/scrapper');
const transformInput = require('./helpers/input-transform');
const skillName = 'Petrol Price';

var messages = {
    'welcomeMessage': 'Welcome to ' + skillName + '. You can get the latest petrol prices for major cities in India. ',
    'promptForCity': 'For which city do you want to know the price? ',
    'rePromptForCity': 'Please say the city name. ',
    'priceMessage': 'It is %s rupees per litre in %s. ',
    'priceUpMessage': 'The price has gone up by %s since yesterday. ',
    'priceDownMessage': 'The price has gone down by %s since yesterday. ',
    'priceLevelMessage': 'The price is same as yesterday. ',
    'cityNotSupportedMessage': 'Sorry. Currently we do not have the petrol price updates for %s. ',
    'citySlotMissingMessage': 'Sorry. I did not get the city name. '
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
        if (!citySlot || !citySlot.value) {
            this.response.speak(messages.citySlotMissingMessage + messages.promptForCity).listen(messages.rePromptForCity);
            this.emit(':responseReady');
        }
        else {
            var city = transformInput(citySlot.value).toLowerCase();
            databaseHelper.getPetrolPrice(city, function (data) {
                if (!data) {
                    scrapper.scrapPetrolPrice(city, function (scrappedData) {
                        if (!scrappedData) {
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
                    emitter.response.speak(util.format(messages.priceMessage, data.price, city));
                    emitter.emit(':responseReady');
                }
            });
        }
    }
};

