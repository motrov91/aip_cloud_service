const bcrypt = require('bcryptjs');
const fs = require('fs');

const helpers = {}

helpers.encryptPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;

}; 

//Metodo para verificar el login
helpers.matchPassword = async (password, savedPassword) => {
    try { 
        return await bcrypt.compare(password, savedPassword);
    } catch(e){
        console.log(e);
    }
};

helpers.decodeBase64Image = (base64String, filename) => {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const response = {};

    if (matches.length !== 3) {
        return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.date = Buffer.from(matches[2], 'base64');
    fs.writeFileSync(filename, response.data, 'binary');

    return filename
}


module.exports = helpers