const moment = require('moment')
const helpers = {};

const pool = require('../database');


helpers.formatDate = (date, format) => {
    return moment(date).format(format);
}

helpers.userState = (val, options) => {
    
    if(val === 10 || val === 31 || val === 41){
        return options.fn(this);
    }
    return options.inverse(this);
} 



module.exports = helpers