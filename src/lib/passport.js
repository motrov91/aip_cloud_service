const passport = require('passport');
const localStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('../lib/helpers')

passport.use('local.signin', new localStrategy({
    usernameField:'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {
    console.log(`BODY ${username} ${password}`)

    const rows = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length > 0){
        const user = rows[0];
        const validPassword = await helpers.matchPassword(password, user.password);

        if(validPassword){
            console.log('retorna el user', user)
            return done(null, user);
        }else{
            console.log('retorna el mensaje de error')
            return done(null, false,req.flash('message', 'incorrect password'));
        }
    }else{
        console.log('retorna el usuario no existe')
        return done(null, false, req.flash('message', 'El usuario no existe'))
    }
}));

passport.use('local.signup', new localStrategy({
    usernameField:'username',
    passwordField: 'password',
    passReqToCallback: true
}, async (req, username, password, done) => {

    //console.log(req.body);
    const { cedula, nom_user, telefono_user, rol_id} = req.body;
    const newUser = {
        cedula,
        nom_user,
        telefono_user,
        username,
        password,
        rol_id
    }; 

    //console.log('aaaaaa',newUser);
    newUser.password = await helpers.encryptPassword(password);
    const consultuser = await pool.query('SELECT * FROM users WHERE cedula =?', [newUser.cedula]);
    console.log('consultausuarios', consultuser.length);
    if(consultuser.length === 0){
        const result = await pool.query('INSERT INTO users SET?', [newUser]); 
        newUser.id = result.insertId;
        return done(null, newUser);
    } else{  
        console.log('El usuario ya existe en la base de datos');
        req.flash('message', 'El usuario ya existe en la base de datos');
        return done(null, false, req.flash('message', 'El usuario ya existe en la base de datos'));
    }  
}));

/*
    se utiliza para almacenar información del usuario en una sesión. Cuando un usuario inicia sesión con éxito, 
    Passport necesita determinar qué información del usuario debe almacenarse en la sesión. Para esto, la función 
    serializeUser se encarga de decidir qué datos específicos del usuario deben guardarse en la sesión. Estos datos 
    generalmente se utilizan para identificar al usuario en futuras solicitudes.
*/
passport.serializeUser((user, done) => {
   return done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const rows = await pool.query('SELECT * FROM users WHERE id =?', [id]);
    return done(null, rows[0]);
});

module.exports = passport