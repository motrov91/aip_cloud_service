const express = require('express')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router()
const {isLoggedIn, isNotLoggedIn} = require('../lib/auth');

const passport = require('passport');

const fn= require('../controllers/functions')
const pool = require('../database');


router.post('/signin', async (req, res, next) => {

    const {username, password} = req.body
    console.log(username, password);

    try {

        const user = await pool.query('SELECT * FROM users WHERE username = ?', [username])

        if(user.length == 0){ 
            //Si el usuario no existe 
            return res.status(401).json({mensaje: 'El usuario no existe'});
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
                    expiresIn : '60 days'
                });
    
                const projByUser = await pool.query('SELECT * from project_has_user WHERE user_id = ?', [user[0].id]);
                
                // console.log('#####', projByUser)
                // console.log('@@@@@@@@', user[0].id)
    
                const dataSignin = {
                    token : token,
                    id : user[0].id,
                    username : user[0].username,
                    name : user[0].nom_user,
                    nit : user[0].cedula,
                    cellphone : user[0].telefono_user,
                    rol: user[0].rol_id,
                    projectsByUser : projByUser
                }
                // Retornamos el token
                return res.status(200).json({dataSignin});
            }
        }
        
    } catch (error) {
        
    }
    

    
}) 

router.get('/selectProject/:id', async (req, res) => { 
    const proj = await pool.query('SELECT * from project_has_user WHERE user_id = ?', [req.params.id]);
    res.render('auth/selectProject', {proj});
});

router.post('/selectProject', (req, res) => {
    const { project } = req.body;
    const newData = {
        project
    }
    req.session.project = {
        project: newData.project
    }

    if(newData.project === ''){
        req.logOut()
        res.redirect('/signin')
    }else{
        res.redirect('/survey');
    }

})


module.exports = router;