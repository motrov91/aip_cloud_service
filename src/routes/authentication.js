const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const pool = require('../database');
const {isLoggedIn, isNotLoggedIn} = require('../lib/auth');
const passport = require('passport');

router.get('/signin', /* isLoggedIn, */ (req, res) => {
    res.render('auth/signin');
});

router.post('/signin', async (req, res, next) => {
    const {username, password} = req.body
    console.log(username, password);
    const user = await pool.query('SELECT * FROM users WHERE username = ?', [username])

    if(!user){
        //Si el usuario no existe 
        await res.status(401).json({mensaje: 'El usuario no existe'});
        next()
    }else{
        //si el usuario existe, verificar si el pass es correcto
        //console.log('pass', password)
        //console.log('passDB', user[0].password)

        if (!bcrypt.compareSync(password, user[0].password)){
            
            //Si el password es incorrecto
            res.status(401).json({
                mensaje: 'password incorrecto',
                statusCode: 401,
                error: 'Unauthorized'
            })
            return;
        }else{
            //Si el password es correcto, firmar el token
            const token = jwt.sign({
                id: user[0].id,
                username: user[0].username,
                nombre: user[0].nom_user,
                rol_id: user[0].rol_id
            },
            'SECRET-KEY', 
            {
                expiresIn : '24h'
            });

            const projByUser = await pool.query('SELECT * from project_has_user WHERE user_id = ?', [user[0].id]);
            console.log(projByUser);

            res.render('auth/selectProject', { proj: projByUser })

        }
    }
}) 

router.get('/profile', /* isLoggedIn, */ (req, res) => {
    res.send('PROFILE');
});

router.get('/selectProject', /* isLoggedIn, */ async (req, res) => {
    console.log('INGRESA AL SELECTED PROJECT')
    if(req.user.id === 10){
        const projAdmin = await pool.query('SELECT * FROM projects');
        res.render('auth/selectProject', {projAdmin});
    }else{
        const proj = await pool.query('SELECT * from project_has_user WHERE user_id = ?', [req.user.id]);
        res.render('auth/selectProject', {proj: proj});
    }
});

router.post('/selectProject', (req, res) => {
    const { project } = req.body;
    const newData = {
        project
    }
    req.session.project = {
        project: newData.project
    }

    console.log('Contenido de req.session:', req.session);
    console.log('valore del newdata:', newData.project);

    if(newData.project === ''){
        req.flash('message', 'Debes seleccionar algún proyecto para poder ingresar a la plataforma');
        req.logOut()
        res.redirect('/signin')
    }else{
        res.redirect('/survey');
    }

})



module.exports = router;