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

module.exports = transformInput;