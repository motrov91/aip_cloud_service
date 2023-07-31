const express = require('express');
const morgan = require('morgan');
const expresshbs = require('express-handlebars').engine;
const path = require('path');
const passport = require('passport'); 
const flash = require('connect-flash');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const multer = require('multer');

const timeout = require('connect-timeout')

const haltOnTimedout = (req, res, next) => {
    if (!req.timedout) {
      next();
    }
  }


const { database } = require('./keys');
const { Server } = require('http');

    let pathGlobal=__dirname + '/public/';
    const storage = multer.diskStorage({
    destination: path.join(__dirname + '/public/uploads/'),
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
}) 

// let storage = multer.diskStorage({
//     destination:(req, file, cb) =>{
//         cb(null, './public/uploads' )
//     },
//     filename:(req, file, cb) =>{
//         cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//     }
// }) 


//initializations
const app = express();
require('./lib/passport');

//Settings
app.set('port', process.env.PORT || 4000);
app.set('json spaces', 2)


app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', expresshbs({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars')
}));
app.set('view engine', '.hbs');


//Middleware
const sessionStore = new MySQLStore(database);
app.set('trust proxy', 1)
app.use(session({
    secret:'fundsession',
    resave: false,
    saveUninitialized: false,
    cookie: {secure: true},
    store: sessionStore
}))


app.use(flash()); 
app.use(morgan('dev'));
app.use(timeout('1240s'))
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));
app.use(haltOnTimedout)
app.use(passport.initialize());
app.use(passport.session());



app.use(multer({
    storage,
    dest: path.join(__dirname + '/public/uploads/')
}).single('img')); 


//global variables
app.use((req, res, next) => {
    app.locals.success = req.flash('success');
    app.locals.message = req.flash('message');
    app.locals.user = req.user;
    next();
})

//Routes
app.use(require('./routes/index'));
app.use(require('./routes/authentication'));
app.use(require('./routes/admin'));
app.use(require('./routes/survey'));
app.use(require('./routes/projects'));
app.use(require('./routes/farms'));
app.use('/api',require('./routes/dataServiceFarms'));
app.use('/api',require('./routes/dataServiceProductorRegister'));
app.use('/api',require('./routes/dataServiceProductorRegisterPiscicola'));
app.use('/api',require('./routes/dataServiceAuth'));


app.use ((err, req, res, next) => { 
    res.send ('timed out'); 
  })


//Public
//Este es el que funciona con las otras imagenes 
app.use(express.static(path.join(__dirname + '/public/')));
//console.log('pathhh', path.join(__dirname + '/public/'))


app.set('views', path.join(__dirname, 'views'));
dataa = path.join(__dirname + '/public/');


app.listen(app.get('port'), ()=>{
    console.log('SERVER ON PORT', app.get('port'));
});

