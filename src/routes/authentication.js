const express = require('express');
const router = express.Router();

const pool = require('../database');
const {isLoggedIn, isNotLoggedIn} = require('../lib/auth');
const passport = require('passport');

router.get('/signin', isNotLoggedIn, (req, res) => {
    res.render('auth/signin');
});

router.post('/signin', (req, res) => {
    console.log('ALCANZA A INGRESAR A ESTA VISTA')
    passport.authenticate('local.signin', {
        successRedirect: '/selectProject',
        failureRedirect: '/signin',
    })(req, res);
});

router.get('/profile', isLoggedIn, (req, res) => {
    res.send('PROFILE');
});

router.get('/selectProject', isLoggedIn, async (req, res) => {
    console.log('INGRESA AL SELECTED PROJECT')
    if(req.user.id === 10){
        const projAdmin = await pool.query('SELECT * FROM projects');
        res.render('auth/selectProject', {projAdmin});
    }else{
        const proj = await pool.query('SELECT * from project_has_user WHERE user_id = ?', [req.user.id]);
        res.render('auth/selectProject', {proj});
    }
});

router.post('/selectProject', (req, res) => {
    console.log('INSESA AL SELECTEDPROJECT POST')
    const { project } = req.body;
    const newData = {
        project
    }
    req.session.project = {
        project: newData.project
    }

    if(newData.project === ''){
        req.flash('message', 'Debes seleccionar algún proyecto para poder ingresar a la plataforma');
        req.logOut()
        res.redirect('/signin')
    }else{
        res.redirect('/survey');
    }

})



module.exports = router;