'use strict'
var dbhelper = (function () {
	var AWS = require("aws-sdk");

	AWS.config.update({
		region: "us-east-1",
		endpoint: "https://dynamodb.us-east-1.amazonaws.com"
	});

	var dynamodb = new AWS.DynamoDB.DocumentClient();
	var tableName = 'petrolPrices';
	return {
		getPetrolPrice: function (city, callback) {
			var params = {
				TableName: tableName,
				Key: {
					city: city,
					date: new Date().toISOString().replace('T', ' ').substr(0, 10)
				}
			};
			dynamodb.get(params, function (err, data) {
				console.log(data);
				if (!data || !data.Item || !data.Item.price) {
					callback(null);
				}
				else {
					callback(data.Item);
				}
			});
		},

		insertPetrolPrice: function (data, callback) {
			var params = {
				TableName: tableName,
				Item: {
					city: data.city,
					date: data.date,
					price: data.price
				}
			};
			dynamodb.put(params, function (err, data) {
				console.log('Put : ' + JSON.stringify(data));
				callback();
			});
		}


	}
})();

module.exports = dbhelper;