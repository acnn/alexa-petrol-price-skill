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
		getLatestPetrolPrices: function (city, limit, forceIncludeToday, callback) {
			var params = {
				TableName: tableName,
				KeyConditionExpression: '#city = :city',
				ExpressionAttributeNames: {
					'#city': 'city'
				},
				ExpressionAttributeValues: {
					':city': city
				},
				Limit: limit,
				ScanIndexForward: false
			};
			dynamodb.query(params, function (err, data) {
				if (err) {
					console.error('dynamodb query error : ' + JSON.stringify(err));
					callback(null);
				}
				else {
					if (!data || data.Count < 1) {
						callback(null);
					}
					else {
						if (forceIncludeToday && data.Items[0].date != new Date().toISOString().replace('T', ' ').substr(0, 10))
							callback(null);
						else
							callback(data.Items);
					}
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
				if(err){
					console.error('dynamodb put error : ' + JSON.stringify(err));
				}
				callback();
			});
		}


	}
})();

module.exports = dbhelper;