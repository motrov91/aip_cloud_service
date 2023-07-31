const express = require('express');
const crypto = require('crypto');
const helpers = require('../lib/helpers');
const bcrypt = require('bcryptjs');
const router = express.Router();
const xl = require('excel4node');
let PDFDocument = require('pdfkit');
const imageToBase64 = require('image-to-base64');
const fs = require('fs');

let timeout = require('connect-timeout')

const path = require('path');


const pool = require('../database');
const passport = require('passport');
const {isLoggedIn} = require('../lib/auth');
const { nextTick } = require('process');

/* ----------------- Configuración para descargar archivos en excel registor de productores------------------ */
const wb = new xl.Workbook({
    dateFormat: 'm/d/yy hh:mm:ss'
});
const ws = wb.addWorksheet('Sheet 1');
let style = wb.createStyle({
    font: {
      size: 12,
      bold: true,
      color: '000000'
    }
  })

/* ----------------- Configuración para descargar archivos en excel firmas------------------ */
const wt = new xl.Workbook({
    dateFormat: 'm/d/yy hh:mm:ss'
});
const ct = wt.addWorksheet('Firmas');
let stylesheet = wt.createStyle({
    font: {
      size: 12,
      bold: true,
      color: '000000'
    }
  })

/* ----------------- Configuración para descargar archivos en excel caracterizacion de predios------------------ */
const wf = new xl.Workbook({
    dateFormat: 'm/d/yy hh:mm:ss'
});
const cp = wf.addWorksheet('Sheet 2');
let styles = wf.createStyle({
    font: {
      size: 12,
      bold: true,
      color: '000000'
    }
  })

/* ----------------- Configuración para descargar archivos en excel registro de productor piscicola ------------------ */
const wx = new xl.Workbook({
    dateFormat: 'm/d/yy hh:mm:ss'
});
const rp = wx.addWorksheet('Sheet 1');
let styleP = wx.createStyle({
    font: {
      size: 12,
      bold: true,
      color: '000000'
    }
  })


router.get('/adminUsers', isLoggedIn, (req, res) => {
    res.render('admin/adminUsers');
});

router.get('/signup', isLoggedIn, (req, res) => {
    res.render('admin/signup');
});

router.post('/signup', isLoggedIn, passport.authenticate('local.signup', {
    successRedirect: '/adminListUsers',
    failureRedirect: '/signup',
    //failureFlash: true
}));

 //Reestablecer Contraseña
router.get('/reset', isLoggedIn, (req, res)=>{
    res.render('admin/reset');
});

router.post('/reset', isLoggedIn, async (req, res)=>{
    const userVerify = await pool.query('SELECT * FROM users WHERE username = ?',[req.body.username]);
    
    if(userVerify.length === 0){
        req.flash('message', 'El usuario no existe en la base de datos')
        res.redirect('/reset')
    }

    const token = crypto.randomBytes(20).toString('hex');

    await pool.query('UPDATE users set token = ? WHERE username = ?', [token, req.body.username]);

    //url de reset
    const resetUrl = `http://${req.headers.host}/reset/${token}`;
    res.redirect(resetUrl);

});

 router.get('/reset/:token', isLoggedIn, async (req, res)=>{
    const usuario = await pool.query('SELECT * FROM users WHERE token = ?', [req.params.token])

    if(usuario.length === 0){
        req.flash('message', 'Token invalido');
        res.redirect('/reset');
    }

    res.render('admin/resetPassword');
})

router.post('/reset/:token', isLoggedIn, async (req, res)=>{
    const usuario = await pool.query('SELECT * FROM users WHERE token = ?', [req.params.token] );
    if(usuario.length === 0){
        req.flash('message', 'No Válido');
        res.redirect('/reset');
    }
    
    const { pass } = req.body;
    const updUser = {
        pass
    } 
    const { id, cedula, nom_user, telefono_user, username, password, rol_id, token } = usuario[0];
    const userUpdate = {
        id, 
        cedula, 
        nom_user, 
        telefono_user, 
        username, 
        password, 
        rol_id, 
        token
    } 
    userUpdate.password = await helpers.encryptPassword(updUser.pass);
    userUpdate.token = null;

    await pool.query('UPDATE users set password = ?, token = ? WHERE id = ?', [userUpdate.password, userUpdate.token, userUpdate.id] )
    
    res.redirect('/adminListUsers')
})

router.get('/adminListUsers', isLoggedIn, async (req, res) => {
    const listUsers = await pool.query('SELECT users.id, users.nom_user, users.username, rol.nom_rol FROM users INNER JOIN rol ON users.rol_id = rol.id_rol');
    
    res.render('admin/adminListUsers', {listUsers});
    req.flash('success', 'Password cambiado con exito');    
});

router.get('/updateUser/:id', isLoggedIn, (req, res)=>{
    res.send('actualizando datos');
});

router.get('/logout', isLoggedIn, (req, res) => {
    req.logOut();
    res.redirect('/signin');
});

router.get('/detailUser/:id', isLoggedIn, async (req, res) =>{
    const usr = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    const proj = await pool.query('SELECT * FROM projects');
    const projxuser = await pool.query('SELECT * FROM project_has_user WHERE user_id = ?', [req.params.id]);
    res.render('admin/detailUser', {usr, proj, projxuser});
});

router.post('/detailUser/:id', isLoggedIn, async (req, res) => {
    //console.log('aaaaaa',req.body);
    const {project} = req.body;
    const newproj = {
        project,
    }
    const usr = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    const proj = await pool.query('SELECT * FROM projects WHERE id_project = ?', [newproj.project]);

    const newUsrXproj = {
        project_id: proj[0].id_project,
        user_id: usr[0].id,
        user_nom: usr[0].username,
        project_nom: proj[0].nom_proyecto
    }
    await pool.query('INSERT INTO project_has_user set ?', [newUsrXproj]);
    res.redirect('/detailUser/'+ req.params.id)
});

router.get('/producerSurveyList', isLoggedIn, async(req, res) =>{
    if(req.session.passport.user === 10){
        //console.log('administrator')
        const querySurvey = await pool.query('SELECT farm.id_farm, farm.nitProducer, farm.firstName, farm.firstSurname, farm.nameFarm, farm.municipality, farm.vereda FROM farm INNER JOIN answerFormatProducer ON farm.id_farm = answerFormatProducer.farm_id AND answerFormatProducer.projectId =?', [req.session.project.project]);
        //const producerSurveyCharacterization = await pool.query('SELECT id_farm, nitProducer, firstName, firstsurname, secondSurname, nameFarm, municipality, vereda from farm WHERE projectId = ?', [req.session.project.project])
        res.render('admin/producerSurveyList', {querySurvey})
    } else {
        //console.log('extencionista')
        const querySurvey = await pool.query('SELECT farm.id_farm, farm.nitProducer, farm.firstName, farm.firstSurname, farm.nameFarm, farm.municipality, farm.vereda FROM farm INNER JOIN answerFormatProducer ON farm.id_farm = answerFormatProducer.farm_id AND answerFormatProducer.projectId =? AND answerFormatProducer.userId =?', [req.session.project.project, req.session.passport.user]);
        //const producerSurveyCharacterization = await pool.query('SELECT id_farm, nitProducer, firstName, firstsurname, secondSurname, nameFarm, municipality, vereda from farm WHERE projectId = ?', [req.session.project.project])
        res.render('admin/producerSurveyList', {querySurvey})
    }
    
})

router.get('/editProducerRegister/:id', isLoggedIn, async(req, res) => {
    const infoRegistro = await pool.query('SELECT * FROM answerFormatProducer where farm_id =?', [req.params.id])
    const answers = await pool.query('SELECT * FROM answerFormatProducer where farm_id =?', [req.params.id])

    let newData;
    let newRegistro;

    if(answers){
        newData = answers[0]
    }

    for(let i=0; i<infoRegistro.length; i++){
        let cont = 0;

        if(infoRegistro[i].respuesta1 === 'A'){
            infoRegistro[i].respuesta1 = 'Agronegocio'
            cont = cont+1
        }if(infoRegistro[i].respuesta1 === 'B'){
            infoRegistro[i].respuesta1 = 'Predio productivo no tradicional especializado'
            cont = cont+1
        }if(infoRegistro[i].respuesta1 === 'C'){
            infoRegistro[i].respuesta1 = 'Productor tradicional'
            cont = cont+1
        }if(infoRegistro[i].respuesta1 === 'D'){
            infoRegistro[i].respuesta1 = 'Productor de subsistencia'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta2 === 'A'){
            infoRegistro[i].respuesta2 = 'Con enfoque de agronegocio.'
            cont = cont+1
        }if(infoRegistro[i].respuesta2 === 'B'){
            infoRegistro[i].respuesta2 = 'Como complemento a la actividad productiva principal.'
            cont = cont+1
        }if(infoRegistro[i].respuesta2 === 'C'){
            infoRegistro[i].respuesta2 = 'De forma temporal o no especializada.'
            cont = cont+1
        }if(infoRegistro[i].respuesta2 === 'D'){
            infoRegistro[i].respuesta2 = 'No tiene identificada una línea productiva secundaria.'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta3 === 'A'){
            infoRegistro[i].respuesta3 = 'Acceso ilimitado- especializado, según la actividad productiva y con componente tecnológico.'
            cont = cont+1
        }if(infoRegistro[i].respuesta3 === 'B'){
            infoRegistro[i].respuesta3 = 'Acceso ilimitado a elementos comunes del mercado'
            cont = cont+1
        }if(infoRegistro[i].respuesta3 === 'C'){
            infoRegistro[i].respuesta3 = 'Acceso limitado'
            cont = cont+1
        }if(infoRegistro[i].respuesta3 === 'D'){
            infoRegistro[i].respuesta3 = 'Acceso restringido'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta4 === 'A'){
            infoRegistro[i].respuesta4 = 'Acceso ilimitado a fuentes propias, tradicionales y alternativas.'
            cont = cont+1
        }if(infoRegistro[i].respuesta4 === 'B'){
            infoRegistro[i].respuesta4 = 'Acceso ilimitado a fuentes tradicionales.'
            cont = cont+1
        }if(infoRegistro[i].respuesta4 === 'C'){
            infoRegistro[i].respuesta4 = 'Acceso limitado'
            cont = cont+1
        }if(infoRegistro[i].respuesta4 === 'D'){
            infoRegistro[i].respuesta4 = 'Acceso restringido'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta5 === 'A'){
            infoRegistro[i].respuesta5 = 'Está certificado en BPA con el ICA y/o con otras certificaciones de inocuidad'
            cont = cont+1
        }if(infoRegistro[i].respuesta5 === 'B'){
            infoRegistro[i].respuesta5 = 'Conoce y aplica las BPA, y está en proceso de certificación con el ICA'
            cont = cont+1
        }if(infoRegistro[i].respuesta5 === 'C'){
            infoRegistro[i].respuesta5 = 'Conoce parcialmente las BPA, pero no las aplica.'
            cont = cont+1
        }if(infoRegistro[i].respuesta5 === 'D'){
            infoRegistro[i].respuesta5 = 'No conoce las BPA'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta6 === 'A'){
            infoRegistro[i].respuesta6 = 'Planificado'
            cont = cont+1
        }if(infoRegistro[i].respuesta6 === 'B'){
            infoRegistro[i].respuesta6 = 'No planificado'
            cont = cont+1
        }if(infoRegistro[i].respuesta6 === 'C'){
            infoRegistro[i].respuesta6 = 'Conoce, pero no implementa.'
            cont = cont+1
        }if(infoRegistro[i].respuesta6 === 'D'){
            infoRegistro[i].respuesta6 = 'No conoce ni implementa'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta7 === 'A'){
            infoRegistro[i].respuesta7 = 'No conoce las BPG.'
        }if(infoRegistro[i].respuesta7 === 'B'){
            infoRegistro[i].respuesta7 = 'Conoce parcialmente las BPG, pero no las aplica.'
        }if(infoRegistro[i].respuesta7 === 'C'){
            infoRegistro[i].respuesta7 = 'Conoce y aplica las BPG, y está en proceso de certificación con el ICA.'
        }if(infoRegistro[i].respuesta7 === 'D'){
            infoRegistro[i].respuesta7 = 'Está certificado en BPG con el ICA y/o con otras certificaciones de inocuidad.'
        }
        
        if(infoRegistro[i].respuesta8 === 'A'){
            infoRegistro[i].respuesta8 = 'No conoce ni implementa.'
        }if(infoRegistro[i].respuesta8 === 'B'){
            infoRegistro[i].respuesta8 = 'Conoce, pero no implementa.'
        }if(infoRegistro[i].respuesta8 === 'C'){
            infoRegistro[i].respuesta8 = 'No planificado.'
        }if(infoRegistro[i].respuesta8 === 'D'){
            infoRegistro[i].respuesta8 = 'Planificado.'
        }

        if(infoRegistro[i].respuesta9 === 'A'){
            infoRegistro[i].respuesta9 = 'No conoce ningún plan nutricional animal.'
        }if(infoRegistro[i].respuesta9 === 'B'){
            infoRegistro[i].respuesta9 = 'Conoce el plan nutricional animal pero no aplica.'
        }if(infoRegistro[i].respuesta9 === 'C'){
            infoRegistro[i].respuesta9 = 'Conoce el plan nutricional animal pero no siempre las aplica.'
        }if(infoRegistro[i].respuesta9 === 'D'){
            infoRegistro[i].respuesta9 = 'Implementa el plan en nutrición animal.'
        }
        
        if(infoRegistro[i].respuesta10 === 'A'){
            infoRegistro[i].respuesta10 = 'No conoce la selección y clasificación genética ni los métodos de biotecnología reproductiva.'
        }if(infoRegistro[i].respuesta10 === 'B'){
            infoRegistro[i].respuesta10 = 'Conoce pero no selecciona ni clasifica el material genético, ni implementa métodos de biotecnología.'
        }if(infoRegistro[i].respuesta10 === 'C'){
            infoRegistro[i].respuesta10 = 'Conoce pero no siempre aplica la selección y clasificación del material genético, para la implementación de biotecnologías reproductivas.'
        }if(infoRegistro[i].respuesta10 === 'D'){
            infoRegistro[i].respuesta10 = 'Selecciona y clasifica el material genético a utilizar en biotecnologías reproductivas.'
        }

        if(infoRegistro[i].respuesta11 === 'A'){
            infoRegistro[i].respuesta11 = 'Planificada especializada y/o bidireccional.'
            cont = cont+1
        }if(infoRegistro[i].respuesta11 === 'B'){
            infoRegistro[i].respuesta11 = 'Planificado tradicional.'
            cont = cont+1
        }if(infoRegistro[i].respuesta11 === 'C'){
            infoRegistro[i].respuesta11 = 'Tradicional'
            cont = cont+1
        }if(infoRegistro[i].respuesta11 === 'D'){
            infoRegistro[i].respuesta11 = 'Autoconsumo'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta12 === 'A'){
            infoRegistro[i].respuesta12 = 'Especializado'
            cont = cont+1
        }if(infoRegistro[i].respuesta12 === 'B'){
            infoRegistro[i].respuesta12 = 'Tradicional'
            cont = cont+1
        }if(infoRegistro[i].respuesta12 === 'C'){
            infoRegistro[i].respuesta12 = 'Básico.'
            cont = cont+1
        }if(infoRegistro[i].respuesta12 === 'D'){
            infoRegistro[i].respuesta12 = 'No cuenta con esquema de comercialización'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta13 === 'A'){
            infoRegistro[i].respuesta13 = 'Especializado.'
            cont = cont+1
        }if(infoRegistro[i].respuesta13 === 'B'){
            infoRegistro[i].respuesta13 = 'Tradicional.'
            cont = cont+1
        }if(infoRegistro[i].respuesta13 === 'C'){
            infoRegistro[i].respuesta13 = 'Básico.'
            cont = cont+1
        }if(infoRegistro[i].respuesta13 === 'D'){
            infoRegistro[i].respuesta13 = 'Local.'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta14 === 'A'){
            infoRegistro[i].respuesta14 = 'Especializado, hasta producto transformado.'
            cont = cont+1
        }if(infoRegistro[i].respuesta14 === 'B'){
            infoRegistro[i].respuesta14 = 'Especializado, sin producto transformado.'
            cont = cont+1
        }if(infoRegistro[i].respuesta14 === 'C'){
            infoRegistro[i].respuesta14 = 'Básico por demanda'
            cont = cont+1
        }if(infoRegistro[i].respuesta14 === 'D'){
            infoRegistro[i].respuesta14 = 'Ninguno'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta15 === 'A'){
            infoRegistro[i].respuesta15 = 'Sistematizado'
            cont = cont+1
        }if(infoRegistro[i].respuesta15 === 'B'){
            infoRegistro[i].respuesta15 = 'Manual.'
            cont = cont+1
        }if(infoRegistro[i].respuesta15 === 'C'){
            infoRegistro[i].respuesta15 = 'Básico.'
            cont = cont+1
        }if(infoRegistro[i].respuesta15 === 'D'){
            infoRegistro[i].respuesta15 = 'No lleva registros.'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta16 === 'A'){
            infoRegistro[i].respuesta16 = 'Alto'
            cont = cont+1
        }if(infoRegistro[i].respuesta16 === 'B'){
            infoRegistro[i].respuesta16 = 'Intermedio'
            cont = cont+1
        }if(infoRegistro[i].respuesta16 === 'C'){
            infoRegistro[i].respuesta16 = 'Básico'
            cont = cont+1
        }if(infoRegistro[i].respuesta16 === 'D'){
            infoRegistro[i].respuesta16 = 'Ninguno'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta17 === 'A'){
            infoRegistro[i].respuesta17 = 'Formal, con estructura administrativa'
            cont = cont+1
        }if(infoRegistro[i].respuesta17 === 'B'){
            infoRegistro[i].respuesta17 = 'Formal, sin estructura administrativa'
            cont = cont+1
        }if(infoRegistro[i].respuesta17 === 'C'){
            infoRegistro[i].respuesta17 = 'Informal'
            cont = cont+1
        }if(infoRegistro[i].respuesta17 === 'D'){
            infoRegistro[i].respuesta17 = 'Informal sin contrato'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta18 === 'A'){
            infoRegistro[i].respuesta18 = 'Permanentemente'
            cont = cont+1
        }if(infoRegistro[i].respuesta18 === 'B'){
            infoRegistro[i].respuesta18 = 'Ocasionalmente'
            cont = cont+1
        }if(infoRegistro[i].respuesta18 === 'C'){
            infoRegistro[i].respuesta18 = 'Según oferta - necesidades'
            cont = cont+1
        }if(infoRegistro[i].respuesta18 === 'D'){
            infoRegistro[i].respuesta18 = 'No capacita'
            cont = cont+1
        }
        if(infoRegistro[i].respuesta19 === 'A'){
            infoRegistro[i].respuesta19 = 'Formal, enfocado al crecimiento del negocio'
            cont = cont+1
        }if(infoRegistro[i].respuesta19 === 'B'){
            infoRegistro[i].respuesta19 = 'Formal bancarizado'
            cont = cont+1
        }if(infoRegistro[i].respuesta19 === 'C'){
            infoRegistro[i].respuesta19 = 'Formal, no bancarizado'
            cont = cont+1
        }if(infoRegistro[i].respuesta19 === 'D'){
            infoRegistro[i].respuesta19 = 'Informal'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta20 === 'A'){
            infoRegistro[i].respuesta20 = 'Con Acceso vinculado al agronegocio'
            cont = cont+1
        }if(infoRegistro[i].respuesta20 === 'B'){
            infoRegistro[i].respuesta20 = 'Con acceso no vinculado al agronegocio'
            cont = cont+1
        }if(infoRegistro[i].respuesta20 === 'C'){
            infoRegistro[i].respuesta20 = 'Con acceso, pero no muestra interés'
            cont = cont+1
        }if(infoRegistro[i].respuesta20 === 'D'){
            infoRegistro[i].respuesta20 = 'Sin acceso'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta21 === 'A'){
            infoRegistro[i].respuesta21 = 'Si'
            cont = cont+1
        }if(infoRegistro[i].respuesta21 === 'B'){
            infoRegistro[i].respuesta21 = 'No'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta22 === 'A'){
            infoRegistro[i].respuesta22 = 'Activo'
            cont = cont+1
        }if(infoRegistro[i].respuesta22 === 'B'){
            infoRegistro[i].respuesta22 = 'Sin participación'
            cont = cont+1
        }if(infoRegistro[i].respuesta22 === 'C'){
            infoRegistro[i].respuesta22 = 'No formalizado'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta23 === 'A'){
            infoRegistro[i].respuesta23 = 'Activo'
            cont = cont+1
        }if(infoRegistro[i].respuesta23 === 'B'){
            infoRegistro[i].respuesta23 = 'Frecuente'
            cont = cont+1
        }if(infoRegistro[i].respuesta23 === 'C'){
            infoRegistro[i].respuesta23 = 'Eventual'
            cont = cont+1
        }if(infoRegistro[i].respuesta23 === 'D'){
            infoRegistro[i].respuesta23 = 'Sin participación'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta24 === 'A'){
            infoRegistro[i].respuesta24 = 'Asociativa / organizado'
            cont = cont+1
        }if(infoRegistro[i].respuesta24 === 'B'){
            infoRegistro[i].respuesta24 = 'Asociativa sin organización'
            cont = cont+1
        }if(infoRegistro[i].respuesta24 === 'C'){
            infoRegistro[i].respuesta24 = 'Individual'
            cont = cont+1
        }if(infoRegistro[i].respuesta24 === 'D'){
            infoRegistro[i].respuesta24 = 'Sin participación'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta25 === 'A'){
            infoRegistro[i].respuesta25 = 'Formal y continua'
            cont = cont+1
        }if(infoRegistro[i].respuesta25 === 'B'){
            infoRegistro[i].respuesta25 = 'Parcialmente'
            cont = cont+1
        }if(infoRegistro[i].respuesta25 === 'C'){
            infoRegistro[i].respuesta25 = 'No participa'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta26 === 'A'){
            infoRegistro[i].respuesta26 = 'Permanente y especializada'
            cont = cont+1
        }if(infoRegistro[i].respuesta26 === 'B'){
            infoRegistro[i].respuesta26 = 'Colectiva según necesidades comunes'
            cont = cont+1
        }if(infoRegistro[i].respuesta26 === 'C'){
            infoRegistro[i].respuesta26 = 'Acceso sin cobertura adecuada a la necesidad'
            cont = cont+1
        }if(infoRegistro[i].respuesta26 === 'D'){
            infoRegistro[i].respuesta26 = 'Sin acceso'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta27 === 'A'){
            infoRegistro[i].respuesta27 = 'Cuenta con certificación'
            cont = cont+1
        }if(infoRegistro[i].respuesta27 === 'B'){
            infoRegistro[i].respuesta27 = 'Está en proceso'
            cont = cont+1
        }if(infoRegistro[i].respuesta27 === 'C'){
            infoRegistro[i].respuesta27 = 'No le interesa'
            cont = cont+1
        }if(infoRegistro[i].respuesta27 === 'D'){
            infoRegistro[i].respuesta27 = 'No conoce'
            cont = cont+1
}
        
        if(infoRegistro[i].respuesta28 === 'A'){
            infoRegistro[i].respuesta28 = 'Los tiene en cuenta'
            cont = cont+1
        }if(infoRegistro[i].respuesta28 === 'B'){
            infoRegistro[i].respuesta28 = 'Los conoce'
            cont = cont+1
        }if(infoRegistro[i].respuesta28 === 'C'){
            infoRegistro[i].respuesta28 = 'Conocimiento básico'
            cont = cont+1
        }if(infoRegistro[i].respuesta28 === 'D'){
            infoRegistro[i].respuesta28 = 'Ningún conocimiento'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta29 === 'A'){
            infoRegistro[i].respuesta29 = 'Todas las fuentes'
            cont = cont+1
        }if(infoRegistro[i].respuesta29 === 'B'){
            infoRegistro[i].respuesta29 = 'Mayoría de fuentes'
            cont = cont+1
        }if(infoRegistro[i].respuesta29 === 'C'){
            infoRegistro[i].respuesta29 = 'Algunas'
            cont = cont+1
        }if(infoRegistro[i].respuesta29 === 'D'){
            infoRegistro[i].respuesta29 = 'Pocas'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta30 === 'A'){
            infoRegistro[i].respuesta30 = 'Permanente'
            cont = cont+1
        }if(infoRegistro[i].respuesta30 === 'B'){
            infoRegistro[i].respuesta30 = 'Frecuente'
            cont = cont+1
        }if(infoRegistro[i].respuesta30 === 'C'){
            infoRegistro[i].respuesta30 = 'Regular'
            cont = cont+1
        }if(infoRegistro[i].respuesta30 === 'D'){
            infoRegistro[i].respuesta30 = 'Ninguno'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta31 === 'A'){
            infoRegistro[i].respuesta31 = 'Todas'
            cont = cont+1
        }if(infoRegistro[i].respuesta31 === 'B'){
            infoRegistro[i].respuesta31 = 'Algunas'
            cont = cont+1
        }if(infoRegistro[i].respuesta31 === 'C'){
            infoRegistro[i].respuesta31 = 'Ninguna'
            cont = cont+1
        }if(infoRegistro[i].respuesta31 === 'D'){
            infoRegistro[i].respuesta31 = 'Sin acceso'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta32 === 'A'){
            infoRegistro[i].respuesta32 = 'Alta'
            cont = cont+1
        }if(infoRegistro[i].respuesta32 === 'B'){
            infoRegistro[i].respuesta32 = 'Media'
            cont = cont+1
        }if(infoRegistro[i].respuesta32 === 'C'){
            infoRegistro[i].respuesta32 = 'Básica'
            cont = cont+1
        }if(infoRegistro[i].respuesta32 === 'D'){
            infoRegistro[i].respuesta32 = 'Ninguna'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta33 === 'A'){
            infoRegistro[i].respuesta33 = 'Superior'
            cont = cont+1
        }if(infoRegistro[i].respuesta33 === 'B'){
            infoRegistro[i].respuesta33 = 'Alto'
            cont = cont+1
        }if(infoRegistro[i].respuesta33 === 'C'){
            infoRegistro[i].respuesta33 = 'Intermedio'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta34 === 'A'){
            infoRegistro[i].respuesta34 = 'Cuenta e implementa un plan de conservación'
            cont = cont+1
        }if(infoRegistro[i].respuesta34 === 'B'){
            infoRegistro[i].respuesta34 = 'Implementa sin planificación'
            cont = cont+1
        }if(infoRegistro[i].respuesta34 === 'C'){
            infoRegistro[i].respuesta34 = 'Conoce, pero no implementa prácticas'
            cont = cont+1
        }if(infoRegistro[i].respuesta34 === 'D'){
            infoRegistro[i].respuesta34 = 'No conoce ni implementa'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta35 === 'A'){
            infoRegistro[i].respuesta35 = 'Dispone de un plan de conservación y lo implementa'
            cont = cont+1
        }if(infoRegistro[i].respuesta35 === 'B'){
            infoRegistro[i].respuesta35 = 'Implementa sin planificación'
            cont = cont+1
        }if(infoRegistro[i].respuesta35 === 'C'){
            infoRegistro[i].respuesta35 = 'Conoce, pero no implementa prácticas'
            cont = cont+1
        }if(infoRegistro[i].respuesta35 === 'D'){
            infoRegistro[i].respuesta35 = 'No conoce ni implementa'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta36 === 'A'){
            infoRegistro[i].respuesta36 = 'Manejo planificado del suelo'
            cont = cont+1
        }if(infoRegistro[i].respuesta36 === 'B'){
            infoRegistro[i].respuesta36 = 'Manejo intermedio no planificado'
            cont = cont+1
        }if(infoRegistro[i].respuesta36 === 'C'){
            infoRegistro[i].respuesta36 = 'Manejo básico no planificado'
            cont = cont+1
        }if(infoRegistro[i].respuesta36 === 'D'){
            infoRegistro[i].respuesta36 = 'Sin Manejo'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta37 === 'A'){
            infoRegistro[i].respuesta37 = 'Conoce y cuenta con un plan de mitigación y adaptación'
            cont = cont+1
        }if(infoRegistro[i].respuesta37 === 'B'){
            infoRegistro[i].respuesta37 = 'Conoce e implementa'
            cont = cont+1
        }if(infoRegistro[i].respuesta37 === 'C'){
            infoRegistro[i].respuesta37 = 'Conoce medidas, pero no las implementa'
            cont = cont+1
        }if(infoRegistro[i].respuesta37 === 'D'){
            infoRegistro[i].respuesta37 = 'No conoce'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta38 === 'A'){
            infoRegistro[i].respuesta38 = 'Planificación avanzada'
            cont = cont+1
        }if(infoRegistro[i].respuesta38 === 'B'){
            infoRegistro[i].respuesta38 = 'Conoce y planifica'
            cont = cont+1
        }if(infoRegistro[i].respuesta38 === 'C'){
            infoRegistro[i].respuesta38 = 'Conoce, pero no planifica'
            cont = cont+1
        }if(infoRegistro[i].respuesta38 === 'D'){
            infoRegistro[i].respuesta38 = 'No conoce'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta39 === 'A'){
            infoRegistro[i].respuesta39 = 'Conoce e implementa acciones'
            cont = cont+1
        }if(infoRegistro[i].respuesta39 === 'B'){
            infoRegistro[i].respuesta39 = 'Conoce, pero no implementa acciones'
            cont = cont+1
        }if(infoRegistro[i].respuesta39 === 'C'){
            infoRegistro[i].respuesta39 = 'No conoce, pero sus acciones no afectan'
            cont = cont+1
        }if(infoRegistro[i].respuesta39 === 'D'){
            infoRegistro[i].respuesta39 = 'No conoce, pero sus acciones si afectan'
            cont = cont + 1
}
        
        if(infoRegistro[i].respuesta40 === 'A'){
            infoRegistro[i].respuesta40 = 'Si'
            cont = cont+1
        }if(infoRegistro[i].respuesta40=== 'B'){
            infoRegistro[i].respuesta40 = 'No'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta41 === 'A'){
            infoRegistro[i].respuesta41 = 'Certificado'
            cont = cont+1
        }if(infoRegistro[i].respuesta41 === 'B'){
            infoRegistro[i].respuesta41 = 'En proceso de certificación'
            cont = cont+1
        }if(infoRegistro[i].respuesta41 === 'C'){
            infoRegistro[i].respuesta41 = 'Conoce y aplica normatividad nacional.'
            cont = cont+1
        }if(infoRegistro[i].respuesta41 === 'D'){
            infoRegistro[i].respuesta41 = 'No cumple'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta42 === 'A'){
            infoRegistro[i].respuesta42 = 'Conoce y participa activamente'
            cont = cont+1
        }if(infoRegistro[i].respuesta42 === 'B'){
            infoRegistro[i].respuesta42 = 'Conoce al menos cinco (5) mecanismos de participación'
            cont = cont+1
        }if(infoRegistro[i].respuesta42 === 'C'){
            infoRegistro[i].respuesta21 = 'Conoce al menos tres (3) mecanismos de participación'
            cont = cont+1
        }if(infoRegistro[i].respuesta42 === 'D'){
            infoRegistro[i].respuesta42 = 'No tiene conocimientos'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta43 === 'A'){
            infoRegistro[i].respuesta43 = 'Conoce todas las herramientas'
            cont = cont+1
        }if(infoRegistro[i].respuesta43 === 'B'){
            infoRegistro[i].respuesta43 = 'Al menos tres (3) herramientas'
            cont = cont+1
        }if(infoRegistro[i].respuesta43 === 'C'){
            infoRegistro[i].respuesta43 = 'Al menos una (1) herramienta'
            cont = cont+1
        }if(infoRegistro[i].respuesta43 === 'D'){
            infoRegistro[i].respuesta43 = 'No tiene conocimientos'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta44 === 'A'){
            infoRegistro[i].respuesta44 = 'Todos los mecanismos'
            cont = cont+1
        }if(infoRegistro[i].respuesta44 === 'B'){
            infoRegistro[i].respuesta44 = 'Al menos un (1) mecanismo y sí ha participado'
            cont = cont+1
        }if(infoRegistro[i].respuesta44 === 'C'){
            infoRegistro[i].respuesta44 = 'Al menos un (1) mecanismo y no ha participado'
            cont = cont+1
        }if(infoRegistro[i].respuesta44 === 'D'){
            infoRegistro[i].respuesta44 = 'No tiene conocimientos'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta45 === 'A'){
            infoRegistro[i].respuesta45 = 'Líder comunitario'
            cont = cont+1
        }if(infoRegistro[i].respuesta45 === 'B'){
            infoRegistro[i].respuesta45 = 'Gestión Colectiva'
            cont = cont+1
        }if(infoRegistro[i].respuesta45 === 'C'){
            infoRegistro[i].respuesta45 = 'Gestión Individual'
            cont = cont+1
        }if(infoRegistro[i].respuesta45 === 'D'){
            infoRegistro[i].respuesta45 = 'No ha gestionado'
            cont = cont+1
        }
     }

     if(infoRegistro){
        newRegistro = infoRegistro[0]
     }

    res.render('admin/editProducerRegister', {infoRegistro, newData, newRegistro})
})

router.get('/editProducerRegisterPiscicola/:id', isLoggedIn, async(req, res) => {
    const infoRegistro = await pool.query('SELECT * FROM answerproducerpiscicola where farm_id_pis =?', [req.params.id])
    const answers = await pool.query('SELECT * FROM answerproducerpiscicola where farm_id_pis =?', [req.params.id])

    let newData;
    let newRegistro;

    
    
    if(answers){
        newData = answers[0]
    }


    for(let i=0; i<infoRegistro.length; i++){

        let cont = 0;

        if(infoRegistro[i].respuesta1 === 'A'){
            answers[i].respuesta1 = 'De subsistencia'
            cont = cont+1
        }if(infoRegistro[i].respuesta1 === 'B'){
            answers[i].respuesta1 = 'De investigación'
            cont = cont+1
        }if(infoRegistro[i].respuesta1 === 'C'){
            answers[i].respuesta1 = 'Deportiva'
            cont = cont+1
        }if(infoRegistro[i].respuesta1 === 'D'){
            answers[i].respuesta1 = 'Comercial'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta2 === 'A'){
            answers[i].respuesta2 = 'Pesca continental, que podrá ser fluvial o lacustre'
            cont = cont+1
        }if(infoRegistro[i].respuesta2 === 'B'){
            answers[i].respuesta2 = 'Pesca marina, que podrá ser costera, de bajura o de altura.'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta3 === 'A'){
            answers[i].respuesta3 = 'Pesca de Altura'
            cont = cont+1
        }if(infoRegistro[i].respuesta3 === 'B'){
            answers[i].respuesta3 = 'Pesca de bajura.'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta4 === 'A'){
            answers[i].respuesta4 = 'Subsistencia'
            cont = cont+1
        }if(infoRegistro[i].respuesta4 === 'B'){
            answers[i].respuesta4 = 'Ocasional'
            cont = cont+1
        }if(infoRegistro[i].respuesta4 === 'C'){
            answers[i].respuesta4 = 'Estacional'
            cont = cont+1
        }if(infoRegistro[i].respuesta4 === 'D'){
            answers[i].respuesta4 = 'Permanente'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta5 === 'A'){
            answers[i].respuesta5 = 'Embarcación de casco de madera o fibra con canalete de menos de 25 pies de eslora '
            cont = cont+1
        }if(infoRegistro[i].respuesta5 === 'B'){
            answers[i].respuesta5 = 'Embarcación de casco de madera o fibra con motor fuera de borda hasta 27 pies de eslora'
            cont = cont+1
        }if(infoRegistro[i].respuesta5 === 'C'){
            answers[i].respuesta5 = 'Embarcación de casco de madera o fibra con motor interno /o fuera de borda de 38 pies o más de eslora'
            cont = cont+1
        }if(infoRegistro[i].respuesta5 === 'D'){
            answers[i].respuesta5 = 'Embarcación de casco de hierro con motor interno de más de 40 pies de eslora'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta6 === 'A'){
            answers[i].respuesta6 = 'No tiene línea segundaria definida'
            cont = cont+1
        }if(infoRegistro[i].respuesta6 === 'B'){
            answers[i].respuesta6 = 'Temporal o no especializada '
            cont = cont+1
        }if(infoRegistro[i].respuesta6 === 'C'){
            answers[i].respuesta6 = 'Como complemento de la actividad principal.'
            cont = cont+1
        }if(infoRegistro[i].respuesta6 === 'D'){
            answers[i].respuesta6 = 'Con enfoque de agronegocio'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta7 === 'A'){
            answers[i].respuesta7 = 'Línea de Mano.'
        }if(infoRegistro[i].respuesta7 === 'B'){
            answers[i].respuesta7 = 'Vara o caña de pescar'
        }if(infoRegistro[i].respuesta7 === 'C'){
            answers[i].respuesta7 = 'Flecha'
        }if(infoRegistro[i].respuesta7 === 'D'){
            answers[i].respuesta7 = 'Nasa'
        }if(infoRegistro[i].respuesta7 === 'E'){
            answers[i].respuesta7 = 'Cóngolo'
        }if(infoRegistro[i].respuesta7 === 'F'){
            answers[i].respuesta7 = 'Atarraya'
        }if(infoRegistro[i].respuesta7 === 'G'){
            answers[i].respuesta7 = 'Redes de tiro'
        }if(infoRegistro[i].respuesta7 === 'H'){
            answers[i].respuesta7 = 'Redes de arrastre'
        }if(infoRegistro[i].respuesta7 === 'I'){
            answers[i].respuesta7 = 'Redes agalleras o de enmalle'
        }if(infoRegistro[i].respuesta7 === 'J'){
            answers[i].respuesta7 = 'Palangre y línea de mano considerando sus denominaciones respectivamente'
        }if(infoRegistro[i].respuesta7 === 'K'){
            answers[i].respuesta7 = 'Polivalentes'
        }
        
        if(infoRegistro[i].respuesta8 === 'A'){
            answers[i].respuesta8 = 'Dos'
        }if(infoRegistro[i].respuesta8 === 'B'){
            answers[i].respuesta8 = 'Entre 3 Y 5.'
        }if(infoRegistro[i].respuesta8 === 'C'){
            answers[i].respuesta8 = 'Más De 5.'
        }

        if(infoRegistro[i].respuesta9 === 'A'){
            answers[i].respuesta9 = 'MAL ESTADO'
        }if(infoRegistro[i].respuesta9 === 'B'){
            answers[i].respuesta9 = 'REGULAR ESTADO'
        }if(infoRegistro[i].respuesta9 === 'C'){
            answers[i].respuesta9 = 'OPTIMO ESTADO'
        }
        
        if(infoRegistro[i].respuesta10 === 'A'){
            answers[i].respuesta10 = 'De 0 a 4,9 kilos '
        }if(infoRegistro[i].respuesta10 === 'B'){
            answers[i].respuesta10 = 'De 5 a 9,9 kilos'
        }if(infoRegistro[i].respuesta10 === 'C'){
            answers[i].respuesta10 = 'De 10 a 40 kilos'
        }if(infoRegistro[i].respuesta10 === 'D'){
            answers[i].respuesta10 = 'Mas de 40 kilos '
        }

        

        if(infoRegistro[i].respuesta11 === 'A'){
            answers[i].respuesta11 = 'De 0 a 145 SMMLV.'
            cont = cont+1
        }if(infoRegistro[i].respuesta11 === 'B'){
            answers[i].respuesta11 = '146 a 5.000 SMMLV. Mediano Productor.'
            cont = cont+1
        }if(infoRegistro[i].respuesta11 === 'C'){
            answers[i].respuesta11 = 'Superior a 5.000 SMMLV. Gran Productor'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta12 === 'A'){
            answers[i].respuesta12 = 'No posee BPP ni le interesa'
            cont = cont+1
        }if(infoRegistro[i].respuesta12 === 'B'){
            answers[i].respuesta12 = 'Conoce las BPP, pero no las implementa'
            cont = cont+1
        }if(infoRegistro[i].respuesta12 === 'C'){
            answers[i].respuesta12 = 'En trámite proceso de BPP'
            cont = cont+1
        }if(infoRegistro[i].respuesta12 === 'D'){
            answers[i].respuesta12 = 'Cuenta con certificación de BPP'
            cont = cont+1
        }if(infoRegistro[i].respuesta12 === 'E'){
            answers[i].respuesta12 = 'Realiza y/o implementa buenas prácticas pesqueras '
            cont = cont+1
        }

        if(infoRegistro[i].respuesta13 === 'A'){
            answers[i].respuesta13 = 'Salado.'
            cont = cont+1
        }if(infoRegistro[i].respuesta13 === 'B'){
            answers[i].respuesta13 = 'Hielo.'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta14 === 'A'){
            answers[i].respuesta14 = 'Asfixia'
            cont = cont+1
        }if(infoRegistro[i].respuesta14 === 'B'){
            answers[i].respuesta14 = 'Golpe'
            cont = cont+1
        }if(infoRegistro[i].respuesta14 === 'C'){
            answers[i].respuesta14 = 'Shock Térmico'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta15 === 'A'){
            answers[i].respuesta15 = 'NO CUMPLE 0%'
            cont = cont+1
        }if(infoRegistro[i].respuesta15 === 'B'){
            answers[i].respuesta15 = 'CUMPLE 50%'
            cont = cont+1
        }if(infoRegistro[i].respuesta15 === 'C'){
            answers[i].respuesta15 = 'CUMPLE 75%'
            cont = cont+1
        }if(infoRegistro[i].respuesta15 === 'D'){
            answers[i].respuesta15 = 'CUMPLE 100%'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta16 === 'A'){
            answers[i].respuesta16 = 'NUNCA'
            cont = cont+1
        }if(infoRegistro[i].respuesta16 === 'B'){
            answers[i].respuesta16 = 'ALGUNAS VECES'
            cont = cont+1
        }if(infoRegistro[i].respuesta16 === 'C'){
            answers[i].respuesta16 = 'SIEMPRE'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta17 === 'A'){
            answers[i].respuesta17 = 'LOS ECHA AL MAR'
            cont = cont+1
        }if(infoRegistro[i].respuesta17 === 'B'){
            answers[i].respuesta17 = 'LOS LLEVA A TIERRA PARA USARLO EN OTRAS ACTIVIDADES'
            cont = cont+1
        }if(infoRegistro[i].respuesta17 === 'C'){
            answers[i].respuesta17 = 'OTRAS'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta18 === 'A'){
            answers[i].respuesta18 = 'Nunca'
            cont = cont+1
        }if(infoRegistro[i].respuesta18 === 'B'){
            answers[i].respuesta18 = 'Algunas veces'
            cont = cont+1
        }if(infoRegistro[i].respuesta18 === 'C'){
            answers[i].respuesta18 = 'Siempre'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta19 === 'A'){
            answers[i].respuesta19 = 'MUJERES DE LA COMUNIDAD'
            cont = cont+1
        }if(infoRegistro[i].respuesta19 === 'B'){
            answers[i].respuesta19 = 'FAMILIARES '
            cont = cont+1
        }if(infoRegistro[i].respuesta19 === 'C'){
            answers[i].respuesta19 = 'INTERMEDIARIOS '
            cont = cont+1
        }

                
        if(infoRegistro[i].respuesta20 === 'A'){
            answers[i].respuesta20 = 'SI'
            cont = cont+1
        }if(infoRegistro[i].respuesta20 === 'B'){
            answers[i].respuesta20 = 'NO'
            cont = cont+1
        }

            

        if(infoRegistro[i].respuesta21 === 'A'){
            answers[i].respuesta21 = 'Sitio de desembarco o playa'
            cont = cont+1
        }if(infoRegistro[i].respuesta21 === 'B'){
            answers[i].respuesta21 = 'Mercado local'
            cont = cont+1
        }if(infoRegistro[i].respuesta21 === 'C'){
            answers[i].respuesta21 = 'Mercado regional'
            cont = cont+1
        }if(infoRegistro[i].respuesta21 === 'D'){
            answers[i].respuesta21 = 'Mercado nacional'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta22 === 'A'){
            answers[i].respuesta22 = 'Transformación de los recursos pesqueros con marca propia, empaque y permisos de entidades.'
            cont = cont+1
        }if(infoRegistro[i].respuesta22 === 'B'){
            answers[i].respuesta22 = 'Proceso de transformación de los recursos pesqueros, con marca y empaque propio, pero no tienen permiso o están en trámites.'
            cont = cont+1
        }if(infoRegistro[i].respuesta22 === 'C'){
            answers[i].respuesta22 = 'Transformación de los recursos pesqueros, pero no cuentan con marca, ni empaque ni permiso'
            cont = cont+1
        }if(infoRegistro[i].respuesta22 === 'D'){
            answers[i].respuesta22 = 'No realiza transformación de los recursos pesqueros'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta23 === 'A'){
            answers[i].respuesta23 = 'No lleva ningún tipo de registro'
            cont = cont+1
        }if(infoRegistro[i].respuesta23 === 'B'){
            answers[i].respuesta23 = 'Manejo de registros manuales'
            cont = cont+1
        }if(infoRegistro[i].respuesta23 === 'C'){
            answers[i].respuesta23 = 'Usa software para el manejo de los registros'
            cont = cont+1
        }if(infoRegistro[i].respuesta23 === 'D'){
            answers[i].respuesta23 = 'Utiliza software para el manejo técnico y productivo'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta24 === 'A'){
            answers[i].respuesta24 = 'no lleva ningún tipo de registro'
            cont = cont+1
        }if(infoRegistro[i].respuesta24 === 'B'){
            answers[i].respuesta24 = 'manejo de registros manuales'
            cont = cont+1
        }if(infoRegistro[i].respuesta24 === 'C'){
            answers[i].respuesta24 = 'usa software para el manejo de los registros'
            cont = cont+1
        }if(infoRegistro[i].respuesta24 === 'D'){
            answers[i].respuesta24 = 'utiliza software para el manejo técnico y productivo'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta25 === 'A'){
            answers[i].respuesta25 = 'No tiene ninguna'
            cont = cont+1
        }if(infoRegistro[i].respuesta25 === 'B'){
            answers[i].respuesta25 = 'Personal no cuenta con capacitación ni certificación para realizar actividades de faenas de pesca, pero tiene experiencia'
            cont = cont+1
        }if(infoRegistro[i].respuesta25 === 'C'){
            answers[i].respuesta25 = 'Personal calificado, certificado y con experticia en las faenas de pesca'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta26 === 'A'){
            answers[i].respuesta26 = 'Desconoce el portafolio de los servicios bancarios para los créditos del sector'
            cont = cont+1
        }if(infoRegistro[i].respuesta26 === 'B'){
            answers[i].respuesta26 = 'Conoce la oferta bancaria pero no ha solicitado el crédito.'
            cont = cont+1
        }if(infoRegistro[i].respuesta26 === 'C'){
            answers[i].respuesta26 = 'Ha tramitado, pero no ha sido aprobado el crédito'
            cont = cont+1
        }if(infoRegistro[i].respuesta26 === 'D'){
            answers[i].respuesta26 = 'Tramitado y ha sido probado crédito bancario'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta27 === 'A'){
            answers[i].respuesta27 = 'Menos de 284slmv'
            cont = cont+1
        }if(infoRegistro[i].respuesta27 === 'B'){
            answers[i].respuesta27 = 'Entre 284 a 5000 slmv'
            cont = cont+1
        }if(infoRegistro[i].respuesta27 === 'C'){
            answers[i].respuesta27 = 'Superior a 5000 slmv'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta28 === 'A'){
            answers[i].respuesta28 = 'Hasta 22 toneladas/ año'
            cont = cont+1
        }if(infoRegistro[i].respuesta28 === 'B'){
            answers[i].respuesta28 = 'Entre 22.1 a 240 toneladas/año'
            cont = cont+1
        }if(infoRegistro[i].respuesta28 === 'C'){
            answers[i].respuesta28 = 'más de 240 toneladas/año'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta29 === 'A'){
            answers[i].respuesta29 = 'No se encuentra vinculado a ninguna figura asociativa'
            cont = cont+1
        }if(infoRegistro[i].respuesta29 === 'B'){
            answers[i].respuesta29 = 'Junta de acción comunal'
            cont = cont+1
        }if(infoRegistro[i].respuesta29 === 'C'){
            answers[i].respuesta29 = 'Alguna figura asociativa nivel veredal, municipal o departamental'
            cont = cont+1
        }if(infoRegistro[i].respuesta29 === 'D'){
            answers[i].respuesta29 = 'Gremio nivel regional o nacional'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta30 === 'A'){
            answers[i].respuesta30 = 'Sin participación'
            cont = cont+1
        }if(infoRegistro[i].respuesta30 === 'B'){
            answers[i].respuesta30 = 'Eventual'
            cont = cont+1
        }if(infoRegistro[i].respuesta30 === 'C'){
            answers[i].respuesta30 = 'Frecuente'
            cont = cont+1
        }if(infoRegistro[i].respuesta30 === 'D'){
            answers[i].respuesta30 = 'Activo'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta31 === 'A'){
            answers[i].respuesta31 = 'No hace parte de ninguna apuesta de carácter asociativo y no genera procesos de emprendimiento'
            cont = cont+1
        }if(infoRegistro[i].respuesta31 === 'B'){
            answers[i].respuesta31 = 'Han generados nuevas apuestas asociativas que conllevaron a proyectos de emprendimiento '
            cont = cont+1
        }if(infoRegistro[i].respuesta31 === 'C'){
            answers[i].respuesta31 = 'Dentro de las figuras de carácter asociativo existentes y de las cuales es miembro se han consolidados proyectos de emprendimientos'
            cont = cont+1
        }if(infoRegistro[i].respuesta31 === 'D'){
            answers[i].respuesta31 = 'Como pescador artesanal individual ha generado proyectos de emprendimiento '
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta32 === 'A'){
            answers[i].respuesta32 = 'No se cuenta con aliados estratégicos para la comercialización'
            cont = cont+1
        }if(infoRegistro[i].respuesta32 === 'B'){
            answers[i].respuesta32 = 'o acuerdos de compra, que generan la posibilidad de comercialización de los recursos pesqueros, pero que se definen en cuanto a volumen y precios en el momento de desembarco en el sitio de pesca '
            cont = cont+1
        }if(infoRegistro[i].respuesta32 === 'C'){
            answers[i].respuesta32 = 'Alianza de carácter comercial que garantizan comprador y precios, con actores del nivel local'
            cont = cont+1
        }if(infoRegistro[i].respuesta32 === 'D'){
            answers[i].respuesta32 = 'Alianza de carácter comercial que garantizan comprador, distribución y precios, con actores del nivel regional y nacional'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta33 === 'A'){
            answers[i].respuesta33 = 'No cuenta con el servicio de asistencia técnica '
            cont = cont+1
        }if(infoRegistro[i].respuesta33 === 'B'){
            answers[i].respuesta33 = 'UMATA y/o EPSEAS, empresas descentralizadas del gobierno'
            cont = cont+1
        }if(infoRegistro[i].respuesta33 === 'C'){
            answers[i].respuesta33 = 'Profesional particular y/o profesional del área comercial '
            cont = cont+1
        }if(infoRegistro[i].respuesta33 === 'D'){
            answers[i].respuesta33 = 'Gremio y/o profesional particular'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta34 === 'A'){
            answers[i].respuesta34 = 'No tiene conocimiento de la importancia de acceder y de certificarse'
            cont = cont+1
        }if(infoRegistro[i].respuesta34 === 'B'){
            answers[i].respuesta34 = 'Tiene conocimiento de importancia de estar certificado y ha iniciado el proceso para acceder a estos'
            cont = cont+1
        }if(infoRegistro[i].respuesta34 === 'C'){
            answers[i].respuesta34 = 'Tiene conocimiento de la importancia del certificado de calidad'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta35 === 'A'){
            answers[i].respuesta35 = 'No conoce'
            cont = cont+1
        }if(infoRegistro[i].respuesta35 === 'B'){
            answers[i].respuesta35 = 'No le interesa '
            cont = cont+1
        }if(infoRegistro[i].respuesta35 === 'C'){
            answers[i].respuesta35 = 'Está en proceso'
            cont = cont+1
        }if(infoRegistro[i].respuesta35 === 'D'){
            answers[i].respuesta35 = 'Cuenta con certificación'
            cont = cont+1
        }

        
        if(infoRegistro[i].respuesta36 === 'A'){
            answers[i].respuesta36 = 'no tiene acceso la información'
            cont = cont+1
        }if(infoRegistro[i].respuesta36 === 'B'){
            answers[i].respuesta36 = 'tiene acceso parcial a la información'
            cont = cont+1
        }if(infoRegistro[i].respuesta36 === 'C'){
            answers[i].respuesta36 = 'tiene acceso total a esta información'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta37 === 'A'){
            answers[i].respuesta37 = 'No tiene acceso a herramientas de información y comunicación'
            cont = cont+1
        }if(infoRegistro[i].respuesta37 === 'B'){
            answers[i].respuesta37 = 'Tiene acceso a mínimo a una (1) herramienta de información y comunicación'
            cont = cont+1
        }if(infoRegistro[i].respuesta37 === 'C'){
            answers[i].respuesta37 = 'Tiene acceso a mínimo tres (3) herramientas de información y comunicación'
            cont = cont+1
        }if(infoRegistro[i].respuesta37 === 'D'){
            answers[i].respuesta37 = 'Tiene acceso a mínimo cinco (5) herramientas de información y comunicación'
            cont = cont+1
        }
        
        if(infoRegistro[i].respuesta38 === 'A'){
            answers[i].respuesta38 = 'Nunca'
            cont = cont+1
        }if(infoRegistro[i].respuesta38 === 'B'){
            answers[i].respuesta38 = 'Muy poco'
            cont = cont+1
        }if(infoRegistro[i].respuesta38 === 'C'){
            answers[i].respuesta38 = 'casi siempre'
            cont = cont+1
        }if(infoRegistro[i].respuesta38 === 'D'){
            answers[i].respuesta38 = 'Siempre'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta39 === 'A'){
            answers[i].respuesta39 = 'no maneja las herramientas existentes'
            cont = cont+1
        }if(infoRegistro[i].respuesta39 === 'B'){
            answers[i].respuesta39 = 'maneja parcialmente las herramientas existentes y desconoce las fuentes de información'
            cont = cont+1
        }if(infoRegistro[i].respuesta39 === 'C'){
            answers[i].respuesta39 = 'maneja parcialmente las herramientas existentes, pero conoce las fuentes de información'
            cont = cont+1
        }if(infoRegistro[i].respuesta39 === 'D'){
            answers[i].respuesta39 = 'maneja plenamente las herramientas existentes y conoce las fuentes de información'
            cont = cont + 1
    }
        
        if(infoRegistro[i].respuesta40 === 'A'){
            answers[i].respuesta40 = 'no le interesa'
            cont = cont+1
        }if(infoRegistro[i].respuesta40=== 'B'){
            answers[i].respuesta40 = 'comparte conocimiento'
            cont = cont+1
        }if(infoRegistro[i].respuesta40=== 'C'){
            answers[i].respuesta40 = 'participa en nuevas apuestas'
            cont = cont+1
        }if(infoRegistro[i].respuesta40=== 'D'){
            answers[i].respuesta40 = 'innova con los conocimientos adquiridos'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta41 === 'A'){
            answers[i].respuesta41 = 'NO CONOCE NI IMPLEMENTA '
            cont = cont+1
        }if(infoRegistro[i].respuesta41 === 'B'){
            answers[i].respuesta41 = 'CONOCE, PERO NO IMPLEMENTA'
            cont = cont+1
        }if(infoRegistro[i].respuesta41 === 'C'){
            answers[i].respuesta41 = 'CUENTA E IMPLEMENTA PLAN DE CONSERVACION'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta42 === 'A'){
            answers[i].respuesta42 = 'No cuenta con permiso para realizar faenas de pesca'
            cont = cont+1
        }if(infoRegistro[i].respuesta42 === 'B'){
            answers[i].respuesta42 = 'Está tramitando permiso para realizar faenas de pesca'
            cont = cont+1
        }if(infoRegistro[i].respuesta42 === 'C'){
            answers[i].respuesta42 = 'Cuenta con permiso para realizar faenas de pesca en áreas permitidas'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta43 === 'A'){
            answers[i].respuesta43 = 'NUNCA'
            cont = cont+1
        }if(infoRegistro[i].respuesta43 === 'B'){
            answers[i].respuesta43 = 'ALGUNAS VECES'
            cont = cont+1
        }if(infoRegistro[i].respuesta43 === 'C'){
            answers[i].respuesta43 = 'CASI SIEMPRE'
            cont = cont+1
        }if(infoRegistro[i].respuesta43 === 'D'){
            answers[i].respuesta43 = 'SIEMPRE'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta44 === 'A'){
            answers[i].respuesta44 = 'Si'
            cont = cont+1
        }if(infoRegistro[i].respuesta44 === 'B'){
            answers[i].respuesta44 = 'No'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta45 === 'A'){
            answers[i].respuesta45 = 'NO CONOCE NI IMPLEMENTA'
            cont = cont+1
        }if(infoRegistro[i].respuesta45 === 'B'){
            answers[i].respuesta45 = 'CONOCE, PERO NO IMPLEMENTA'
            cont = cont+1
        }if(infoRegistro[i].respuesta45 === 'C'){
            answers[i].respuesta45 = 'IMPLEMENTA SIN PLANIFCACION'
            cont = cont+1
        }if(infoRegistro[i].respuesta45 === 'D'){
            answers[i].respuesta45 = 'CUENTA E IMPLEMENTA PLAN DE CONSERVACION'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta46 === 'A'){
            answers[i].respuesta46 = 'No utiliza estrategias de adaptación al cambio y variedad climática '
            cont = cont+1
        }if(infoRegistro[i].respuesta46 === 'B'){
            answers[i].respuesta46 = 'Utiliza estrategias de adaptación al cambio y variedad climática'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta47 === 'A'){
            answers[i].respuesta47 = 'LA UEP no cuenta con los permisos de las entidades'
            cont = cont+1
        }if(infoRegistro[i].respuesta47 === 'B'){
            answers[i].respuesta47 = 'LA UEP está tramitando permisos ante las entidades '
            cont = cont+1
        }if(infoRegistro[i].respuesta47 === 'C'){
            answers[i].respuesta47 = 'La UEP cuenta con los permisos de las entidades'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta48 === 'A'){
            answers[i].respuesta48 = 'apatía para ejercer liderazgos ante la comunidad y las entidades'
            cont = cont+1
        }if(infoRegistro[i].respuesta48 === 'B'){
            answers[i].respuesta48 = 'participación en espacios institucionales, sociales y políticos no son su prioridad'
            cont = cont+1
        }if(infoRegistro[i].respuesta48 === 'C'){
            answers[i].respuesta48 = 'Participación en congresos, asambleas giras, reuniones en negocios nacionales e internacionales '
            cont = cont+1
        }if(infoRegistro[i].respuesta48 === 'D'){
            answers[i].respuesta48 = 'Participa en giras, congresos internacionales del gremio pesquero artesanal'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta49 === 'A'){
            answers[i].respuesta49 = 'desconoce las herramientas de participación'
            cont = cont+1
        }if(infoRegistro[i].respuesta49 === 'B'){
            answers[i].respuesta49 = 'reconoce las herramientas de participación, pero desconoce su alcance y aplicabilidad'
            cont = cont+1
        }if(infoRegistro[i].respuesta49 === 'C'){
            answers[i].respuesta49 = 'reconoce las herramientas de participación y sus alcances, pero no su aplicabilidad '
            cont = cont+1
        }if(infoRegistro[i].respuesta49 === 'D'){
            answers[i].respuesta49 = 'reconoce las herramientas de participación su alcance y aplicabilidad'
            cont = cont+1
        }

        if(infoRegistro[i].respuesta50 === 'A'){
            answers[i].respuesta50 = 'desconoce el control social y las herramientas con que se cuenta para realizarlo '
            cont = cont+1
        }if(infoRegistro[i].respuesta50 === 'B'){
            answers[i].respuesta50 = 'conoce que es el control social, pero desconoce las herramientas con que se cuenta para realizarlo'
            cont = cont+1
        }if(infoRegistro[i].respuesta50 === 'C'){
            answers[i].respuesta50 = 'entiende en que consiste el control social y conoce las herramientas con que se cuenta para realizarlo, pero desconoce su alcance y aplicabilidad'
            cont = cont+1
        }if(infoRegistro[i].respuesta50 === 'D'){
            answers[i].respuesta50 = 'entiende el control social, así como las herramientas que lo permiten, su alcance y su aplicabilidad'
            cont = cont+1
        }


        if(infoRegistro[i].respuesta51 === 'A'){
            answers[i].respuesta51 = 'Se encuentran vinculados por la acción comunal pero no presentan acciones de gestión'
            cont = cont+1
        }if(infoRegistro[i].respuesta51 === 'B'){
            answers[i].respuesta51 = 'Solo cuenta con la vinculación a las juntas de acción comunal su junta directiva es la encargada de gestionar los recursos y liderar procesos'
            cont = cont+1
        }if(infoRegistro[i].respuesta51 === 'C'){
            answers[i].respuesta51 = 'No se encuentran conformados legalmente bajo una figura asociativa, pero se encuentran agrupados en la junta de acción comunal, sin embargo, dentro de la comunidad existen actividades de trabajo social y recolección de recursos para intereses colectivos'
            cont = cont+1
        }if(infoRegistro[i].respuesta51 === 'D'){
            answers[i].respuesta51 = 'Están conformado como cooperativas u otra figura asociativa formal o empresa privada'
            cont = cont+1
        }
            
    }

     if(infoRegistro){
        newRegistro = answers[0]
     }

     let info = infoRegistro[0]


    res.render('admin/editProducerPiscicola', {info, newData, newRegistro})
})

router.post('/modifyCommentsFormat/:id', isLoggedIn, async(req, res) =>{

    //------------------- Ojo este funciona super bien ----------------------------------
    /* ************************************************************************************ */

    const { respuesta1, respuesta2, respuesta3, respuesta4, respuesta5, respuesta6, respuesta7, respuesta8, respuesta9, respuesta10, respuesta11, respuesta12, respuesta13, respuesta14, respuesta15, respuesta16, respuesta17, respuesta18, respuesta19, respuesta20, respuesta21, respuesta22, respuesta23, respuesta24, respuesta25, respuesta26, respuesta27, respuesta28, respuesta29, respuesta30, respuesta31, respuesta32, respuesta33, respuesta34, respuesta35, respuesta36, respuesta37, respuesta38, respuesta39, respuesta40, respuesta41, respuesta42, respuesta43, respuesta44, respuesta45, comment1, comment2, comment3, comment4, comment5, comment6, comment7, comment8, comment9, comment10, comment11, comment12, comment13, comment14, comment15, comment16, comment17, comment18, comment19, comment20, comment21, comment22, comment23, comment24, comment25, comment26, comment27, comment28, comment29, comment30, comment31, comment32, comment33, comment34, comment35, comment36, comment37, comment38, comment39, comment40, comment41, comment42, comment43, comment44, comment45 } = req.body;

    await pool.query('UPDATE answerFormatProducer set respuesta1 = ?, respuesta2 = ?, respuesta3 = ?, respuesta4 = ?, respuesta5 = ?, respuesta6 = ?, respuesta7 = ?, respuesta8 = ?, respuesta9 = ?, respuesta10 = ?, respuesta11 = ?, respuesta12 = ?, respuesta13 = ?, respuesta14 = ?, respuesta15 = ?, respuesta16 = ?, respuesta17 = ?, respuesta18 = ?, respuesta19 = ?, respuesta20 = ?, respuesta21 = ?, respuesta22 = ?, respuesta23 = ?, respuesta24 = ?, respuesta25 = ?, respuesta26 = ?, respuesta27 = ?, respuesta28 = ?, respuesta29 = ?, respuesta30 = ?, respuesta31 = ?, respuesta32 = ?, respuesta33 = ?, respuesta34 = ?, respuesta35 = ?, respuesta36 = ?, respuesta37 = ?, respuesta38 = ?, respuesta39 = ?, respuesta40 = ?, respuesta41 = ?, respuesta42 = ?, respuesta43 = ?, respuesta44 = ?, respuesta45 = ?, comment1 = ?, comment2 = ?, comment3 = ?, comment4 = ?, comment5 = ?, comment6 = ?, comment7 = ?, comment8 = ?, comment9 = ?, comment10 = ?, comment11 = ?, comment12 = ?, comment13 = ?, comment14 = ?, comment15 = ?, comment16 = ?, comment17 = ?, comment18 = ?, comment19 = ?, comment20 = ?, comment21 = ?, comment22 = ?, comment23 = ?, comment24 = ?, comment25 = ?, comment26 = ?, comment27 = ?, comment28 = ?, comment29 = ?, comment30 = ?, comment31 = ?, comment32 = ?, comment33 = ?, comment34 = ?, comment35 = ?, comment36 = ?, comment37 = ?, comment38 = ?, comment39 = ?, comment40 = ?, comment41 = ?, comment42 = ?, comment43 = ?, comment44 = ?, comment45 = ? WHERE id_answerFormatProducer = ?', [respuesta1, respuesta2, respuesta3, respuesta4, respuesta5, respuesta6, respuesta7, respuesta8, respuesta9, respuesta10, respuesta11, respuesta12, respuesta13, respuesta14, respuesta15, respuesta16, respuesta17, respuesta18, respuesta19, respuesta20, respuesta21, respuesta22, respuesta23, respuesta24, respuesta25, respuesta26, respuesta27, respuesta28, respuesta29, respuesta30, respuesta31, respuesta32, respuesta33, respuesta34, respuesta35, respuesta36, respuesta37, respuesta38, respuesta39, respuesta40, respuesta41, respuesta42, respuesta43, respuesta44, respuesta45, comment1, comment2, comment3, comment4, comment5, comment6, comment7, comment8, comment9, comment10, comment11, comment12, comment13, comment14, comment15, comment16, comment17, comment18, comment19, comment20, comment21, comment22, comment23, comment24, comment25, comment26, comment27, comment28, comment29, comment30, comment31, comment32, comment33, comment34, comment35, comment36, comment37, comment38, comment39, comment40, comment41, comment42, comment43, comment44, comment45, req.params.id])
 
    res.redirect('/producerSurveyList');

    //------------------- Ojo este funciona super bien ----------------------------------
    /* ************************************************************************************ */
})

router.post('/modifyCommentsFormatPiscicola/:id', isLoggedIn, async(req, res) =>{

    console.log('req.BODY', req.body)
    
    const { respuesta1, respuesta2, respuesta3, respuesta4, respuesta5, respuesta6, respuesta7, respuesta8, respuesta9, respuesta10, respuesta11, respuesta12, respuesta13, respuesta14, respuesta15, respuesta16, respuesta17, respuesta18, respuesta19, respuesta20, respuesta21, respuesta22, respuesta23, respuesta24, respuesta25, respuesta26, respuesta27, respuesta28, respuesta29, respuesta30, respuesta31, respuesta32, respuesta33, respuesta34, respuesta35, respuesta36, respuesta37, respuesta38, respuesta39, respuesta40, respuesta41, respuesta42, respuesta43, respuesta44, respuesta45, respuesta46, respuesta47,respuesta48,respuesta49,respuesta50,respuesta51, comment1, comment2, comment3, comment4, comment5, comment6, comment7, comment8, comment9, comment10, comment11, comment12, comment13, comment14, comment15, comment16, comment17, comment18, comment19, comment20, comment21, comment22, comment23, comment24, comment25, comment26, comment27, comment28, comment29, comment30, comment31, comment32, comment33, comment34, comment35, comment36, comment37, comment38, comment39, comment40, comment41, comment42, comment43, comment44, comment45, comment46, comment47, comment48, comment49, comment50, comment51} = req.body;

    await pool.query('UPDATE answerproducerpiscicola set respuesta1 = ?, respuesta2 = ?, respuesta3 = ?, respuesta4 = ?, respuesta5 = ?, respuesta6 = ?, respuesta7 = ?, respuesta8 = ?, respuesta9 = ?, respuesta10 = ?, respuesta11 = ?, respuesta12 = ?, respuesta13 = ?, respuesta14 = ?, respuesta15 = ?, respuesta16 = ?, respuesta17 = ?, respuesta18 = ?, respuesta19 = ?, respuesta20 = ?, respuesta21 = ?, respuesta22 = ?, respuesta23 = ?, respuesta24 = ?, respuesta25 = ?, respuesta26 = ?, respuesta27 = ?, respuesta28 = ?, respuesta29 = ?, respuesta30 = ?, respuesta31 = ?, respuesta32 = ?, respuesta33 = ?, respuesta34 = ?, respuesta35 = ?, respuesta36 = ?, respuesta37 = ?, respuesta38 = ?, respuesta39 = ?, respuesta40 = ?, respuesta41 = ?, respuesta42 = ?, respuesta43 = ?, respuesta44 = ?, respuesta45 = ?, respuesta46 = ?, respuesta47 = ?, respuesta48 = ?, respuesta49 = ?, respuesta50 = ?, respuesta51 = ?, comment1 = ?, comment2 = ?, comment3 = ?, comment4 = ?, comment5 = ?, comment6 = ?, comment7 = ?, comment8 = ?, comment9 = ?, comment10 = ?, comment11 = ?, comment12 = ?, comment13 = ?, comment14 = ?, comment15 = ?, comment16 = ?, comment17 = ?, comment18 = ?, comment19 = ?, comment20 = ?, comment21 = ?, comment22 = ?, comment23 = ?, comment24 = ?, comment25 = ?, comment26 = ?, comment27 = ?, comment28 = ?, comment29 = ?, comment30 = ?, comment31 = ?, comment32 = ?, comment33 = ?, comment34 = ?, comment35 = ?, comment36 = ?, comment37 = ?, comment38 = ?, comment39 = ?, comment40 = ?, comment41 = ?, comment42 = ?, comment43 = ?, comment44 = ?, comment45 = ? , comment46 = ? , comment47 = ? , comment48 = ? , comment49 = ?, comment50 = ?, comment51 = ? WHERE id_answerProducerPiscicola = ?', [respuesta1, respuesta2, respuesta3, respuesta4, respuesta5, respuesta6, respuesta7, respuesta8, respuesta9, respuesta10, respuesta11, respuesta12, respuesta13, respuesta14, respuesta15, respuesta16, respuesta17, respuesta18, respuesta19, respuesta20, respuesta21, respuesta22, respuesta23, respuesta24, respuesta25, respuesta26, respuesta27, respuesta28, respuesta29, respuesta30, respuesta31, respuesta32, respuesta33, respuesta34, respuesta35, respuesta36, respuesta37, respuesta38, respuesta39, respuesta40, respuesta41, respuesta42, respuesta43, respuesta44, respuesta45, respuesta46, respuesta47, respuesta48, respuesta49, respuesta50, respuesta51, comment1, comment2, comment3, comment4, comment5, comment6, comment7, comment8, comment9, comment10, comment11, comment12, comment13, comment14, comment15, comment16, comment17, comment18, comment19, comment20, comment21, comment22, comment23, comment24, comment25, comment26, comment27, comment28, comment29, comment30, comment31, comment32, comment33, comment34, comment35, comment36, comment37, comment38, comment39, comment40, comment41, comment42, comment43, comment44, comment45, comment46,comment47,comment48,comment49,comment50,comment51, req.params.id])

    res.redirect('/producerPiscicolaList'); 
})

router.get('/downloadExcel', isLoggedIn, async (req, res) => {          
    const producerSurvey = await pool.query('SELECT farm.nitProducer, farm.firstName, farm.secondName, firstsurname, secondSurname, farm.nameFarm, farm.municipality,  farm.vereda, farm.time_creation, farm.userId, answerFormatProducer.respuesta1, answerFormatProducer.respuesta2, answerFormatProducer.respuesta3, answerFormatProducer.respuesta4, answerFormatProducer.respuesta5, answerFormatProducer.respuesta6, answerFormatProducer.respuesta7, answerFormatProducer.respuesta8, answerFormatProducer.respuesta9, answerFormatProducer.respuesta10, answerFormatProducer.respuesta11, answerFormatProducer.respuesta12, answerFormatProducer.respuesta13, answerFormatProducer.respuesta14, answerFormatProducer.respuesta15, answerFormatProducer.respuesta16, answerFormatProducer.respuesta17, answerFormatProducer.respuesta18, answerFormatProducer.respuesta19, answerFormatProducer.respuesta20, answerFormatProducer.respuesta21, answerFormatProducer.respuesta22, answerFormatProducer.respuesta23, answerFormatProducer.respuesta24, answerFormatProducer.respuesta25, answerFormatProducer.respuesta26, answerFormatProducer.respuesta27, answerFormatProducer.respuesta28, answerFormatProducer.respuesta29, answerFormatProducer.respuesta30, answerFormatProducer.respuesta31, answerFormatProducer.respuesta32, answerFormatProducer.respuesta33, answerFormatProducer.respuesta34, answerFormatProducer.respuesta35, answerFormatProducer.respuesta36, answerFormatProducer.respuesta37, answerFormatProducer.respuesta38, answerFormatProducer.respuesta39, answerFormatProducer.respuesta40, answerFormatProducer.respuesta41, answerFormatProducer.respuesta42, answerFormatProducer.respuesta43, answerFormatProducer.respuesta44, answerFormatProducer.respuesta45, answerformatProducer.comment1, answerformatProducer.comment2, answerformatProducer.comment3, answerformatProducer.comment4, answerformatProducer.comment5, answerformatProducer.comment6, answerformatProducer.comment7, answerformatProducer.comment8, answerformatProducer.comment9, answerformatProducer.comment10, answerformatProducer.comment11, answerformatProducer.comment12, answerformatProducer.comment13, answerformatProducer.comment14, answerformatProducer.comment15, answerformatProducer.comment16, answerformatProducer.comment17, answerformatProducer.comment18, answerformatProducer.comment19, answerformatProducer.comment20, answerformatProducer.comment21, answerformatProducer.comment22, answerformatProducer.comment23, answerformatProducer.comment24, answerformatProducer.comment25, answerformatProducer.comment26, answerformatProducer.comment27, answerformatProducer.comment28, answerformatProducer.comment29, answerformatProducer.comment30, answerformatProducer.comment31, answerformatProducer.comment32, answerformatProducer.comment33, answerformatProducer.comment34, answerformatProducer.comment35, answerformatProducer.comment36, answerformatProducer.comment37, answerformatProducer.comment38, answerformatProducer.comment39, answerformatProducer.comment40, answerformatProducer.comment41, answerformatProducer.comment42, answerformatProducer.comment43, answerformatProducer.comment44, answerformatProducer.comment45 FROM farm INNER JOIN answerFormatProducer ON farm.id_farm = answerFormatProducer.farm_id AND answerFormatProducer.projectId =?', [req.session.project.project]) 
    //const producerSurvey = await pool.query('SELECT farm.vereda, answerproducerpiscicola.respuesta1, answerproducerpiscicola.respuesta2, answerproducerpiscicola.respuesta3, answerproducerpiscicola.respuesta4, answerproducerpiscicola.respuesta5, answerproducerpiscicola.respuesta6, answerproducerpiscicola.respuesta7, answerproducerpiscicola.respuesta8, answerproducerpiscicola.respuesta9, answerproducerpiscicola.respuesta10, answerproducerpiscicola.respuesta11, answerproducerpiscicola.respuesta12, answerproducerpiscicola.respuesta13, answerproducerpiscicola.respuesta14, answerproducerpiscicola.respuesta15, answerproducerpiscicola.respuesta16, answerproducerpiscicola.respuesta17, answerproducerpiscicola.respuesta18, answerproducerpiscicola.respuesta19, answerproducerpiscicola.respuesta20, answerproducerpiscicola.respuesta21, answerproducerpiscicola.respuesta22, answerproducerpiscicola.respuesta23, answerproducerpiscicola.respuesta24, answerproducerpiscicola.respuesta25, answerproducerpiscicola.respuesta26, answerproducerpiscicola.respuesta27, answerproducerpiscicola.respuesta28, answerproducerpiscicola.respuesta29, answerproducerpiscicola.respuesta30, answerproducerpiscicola.respuesta31, answerproducerpiscicola.respuesta32, answerproducerpiscicola.respuesta33, answerproducerpiscicola.respuesta34, answerproducerpiscicola.respuesta35, answerproducerpiscicola.respuesta36, answerproducerpiscicola.respuesta37, answerproducerpiscicola.respuesta38, answerproducerpiscicola.respuesta39, answerproducerpiscicola.respuesta40, answerproducerpiscicola.respuesta41, answerproducerpiscicola.respuesta42, answerproducerpiscicola.respuesta43, answerproducerpiscicola.respuesta44, answerproducerpiscicola.respuesta45, answerproducerpiscicola.respuesta46, answerproducerpiscicola.respuesta47, answerproducerpiscicola.respuesta48, answerproducerpiscicola.respuesta49, answerproducerpiscicola.respuesta50, answerproducerpiscicola.respuesta51, answerproducerpiscicola.respuesta52, answerproducerpiscicola.comment1, answerproducerpiscicola.comment2, answerproducerpiscicola.comment3, answerproducerpiscicola.comment4, answerproducerpiscicola.comment5, answerproducerpiscicola.comment6, answerproducerpiscicola.comment7, answerproducerpiscicola.comment8, answerproducerpiscicola.comment9, answerproducerpiscicola.comment10, answerproducerpiscicola.comment11, answerproducerpiscicola.comment12, answerproducerpiscicola.comment13, answerproducerpiscicola.comment14, answerproducerpiscicola.comment15, answerproducerpiscicola.comment16, answerproducerpiscicola.comment17, answerproducerpiscicola.comment18, answerproducerpiscicola.comment19, answerproducerpiscicola.comment20, answerproducerpiscicola.comment21, answerproducerpiscicola.comment22, answerproducerpiscicola.comment23, answerproducerpiscicola.comment24, answerproducerpiscicola.comment25, answerproducerpiscicola.comment26, answerproducerpiscicola.comment27, answerproducerpiscicola.comment28, answerproducerpiscicola.comment29, answerproducerpiscicola.comment30, answerproducerpiscicola.comment31, answerproducerpiscicola.comment32, answerproducerpiscicola.comment33, answerproducerpiscicola.comment34, answerproducerpiscicola.comment35, answerproducerpiscicola.comment36, answerproducerpiscicola.comment37, answerproducerpiscicola.comment38, answerproducerpiscicola.comment39, answerproducerpiscicola.comment40, answerproducerpiscicola.comment41, answerproducerpiscicola.comment42, answerproducerpiscicola.comment43, answerproducerpiscicola.comment44, answerproducerpiscicola.comment45, answerproducerpiscicola.comment46, answerproducerpiscicola.comment47, answerproducerpiscicola.comment48, answerproducerpiscicola.comment49, answerproducerpiscicola.comment50, answerproducerpiscicola.comment51, answerproducerpiscicola.comment52 FROM farm INNER JOIN answerproducerpiscicola ON farm.id_farm = answerproducerpiscicola.farm_id_pis AND answerproducerpiscicola.project_id_pis =?', [req.session.project.project]) 
    //console.log('*****>', producerSurvey);
    ws.cell(1,1)
    .string('Cedula')
    .style(style)
    ws.cell(1,2)
    .string('Primer Nombre')
    .style(style)
    ws.cell(1,3)
    .string('Seg Nombre')
    .style(style)
    ws.cell(1,4)
    .string('Primer Apellido')
    .style(style)
    ws.cell(1,5)
    .string('Seg Apellido')
    .style(style)
    ws.cell(1,6)
    .string('Nom_finca')
    .style(style)
    ws.cell(1,7)
    .string('Municipio')
    .style(style)
    ws.cell(1,8)
    .string('Vereda')
    .style(style)
    ws.cell(1,9)
    .string('¿Según su sistema productivo, con cuál de las siguientes opciones se identifica?')
    .style(style)
    ws.cell(1,10)
    .string('Observacion')
    .style(style)
    ws.cell(1,11)
    .string('¿El productor presenta actividades productivas secundarias con qué enfoque o proyección?')
    .style(style)
    ws.cell(1,12)
    .string('Observacion')
    .style(style)
    ws.cell(1,13)
    .string('¿Cómo es su acceso a tipo de herramientas y equipos para ser empleados en su proceso productivo?')
    .style(style)
    ws.cell(1,14)
    .string('Observacion')
    .style(style)
    ws.cell(1,15)
    .string('¿Cómo es su acceso a fuentes de energía?')
    .style(style)
    ws.cell(1,16)
    .string('Observacion')
    .style(style)
    ws.cell(1,17)
    .string('¿Cuál es su estado actual con respecto a las BPA?')
    .style(style)
    ws.cell(1,18)
    .string('Observacion')
    .style(style)
    ws.cell(1,19)
    .string('¿Cómo realiza el manejo de plagas y enfermedades (MIPE)?')
    .style(style)
    ws.cell(1,20)
    .string('Observacion')
    .style(style)
    ws.cell(1,21)
    .string('¿Cuál es su estado actual con respecto a las BPG?')
    .style(style)
    ws.cell(1,22)
    .string('Observacion')
    .style(style)
    ws.cell(1,23)
    .string('¿Con relación al manejo sanitario?')
    .style(style)
    ws.cell(1,24)
    .string('Observacion')
    .style(style)
    ws.cell(1,25)
    .string('¿Cómo maneja el sistema de nutrición de su producción?')
    .style(style)
    ws.cell(1,26)
    .string('Observacion')
    .style(style)
    ws.cell(1,27)
    .string('¿Implementa manejo genético y reproductivo en su predio?')
    .style(style)
    ws.cell(1,28)
    .string('Observacion')
    .style(style)
    ws.cell(1,29)
    .string('¿Cómo es la forma de comercialización del productor?')
    .style(style)
    ws.cell(1,30)
    .string('Observacion')
    .style(style)
    ws.cell(1,31)
    .string('¿Cómo es su esquema de comercialización?')
    .style(style)
    ws.cell(1,32)
    .string('Observacion')
    .style(style)
    ws.cell(1,33)
    .string('¿A qué tipo de mercado lleva su producto?')
    .style(style)
    ws.cell(1,34)
    .string('Observacion')
    .style(style)
    ws.cell(1,35)
    .string('¿A qué nivel de valor agregado lleva su producto?')
    .style(style)
    ws.cell(1,36)
    .string('Observacion')
    .style(style)
    ws.cell(1,37)
    .string('¿Gestiona registros de su sistema productivo?')
    .style(style)
    ws.cell(1,38)
    .string('Observacion')
    .style(style)
    ws.cell(1,39)
    .string('¿Qué nivel de conocimientos administrativos posee sobre su sistema de producción?')
    .style(style)
    ws.cell(1,40)
    .string('Observacion')
    .style(style)
    ws.cell(1,41)
    .string('¿Cómo es la vinculación de mano de obra?')
    .style(style)
    ws.cell(1,42)
    .string('Observacion')
    .style(style)
    ws.cell(1,43)
    .string('¿Hace capacitación, formación a la mano de obra?')
    .style(style)
    ws.cell(1,44)
    .string('Observacion')
    .style(style)
    ws.cell(1,45)
    .string('¿Tiene acceso a créditos?')
    .style(style)
    ws.cell(1,46)
    .string('Observacion')
    .style(style)
    ws.cell(1,47)
    .string('¿Tiene acceso al sistema financiero formal, está bancarizado?')
    .style(style)
    ws.cell(1,48)
    .string('Observacion')
    .style(style)
    ws.cell(1,49)
    .string('¿Está vinculado a algún tipo de organización?')
    .style(style)
    ws.cell(1,50)
    .string('Observacion')
    .style(style)
    ws.cell(1,51)
    .string('En caso de estar vinculado, ¿Cómo es la participación en la organización?')
    .style(style)
    ws.cell(1,52)
    .string('Observacion')
    .style(style)
    ws.cell(1,53)
    .string('¿Participa en actividades productivas de manera colectiva?')
    .style(style)
    ws.cell(1,54)
    .string('Observacion')
    .style(style)
    ws.cell(1,55)
    .string('¿Participa el productor en procesos de emprendimiento y asociatividad?')
    .style(style)
    ws.cell(1,56)
    .string('Observacion')
    .style(style)
    ws.cell(1,57)
    .string('¿Participa en alianzas comerciales?')
    .style(style)
    ws.cell(1,58)
    .string('Observacion')
    .style(style)
    ws.cell(1,59)
    .string('¿Accede a apoyo técnico para el manejo de su sistema productivo?')
    .style(style)
    ws.cell(1,60)
    .string('Observacion')
    .style(style)
    ws.cell(1,61)
    .string('¿Cuenta con sellos de calidad y certificaciones?')
    .style(style)
    ws.cell(1,62)
    .string('Observacion')
    .style(style)
    ws.cell(1,63)
    .string('¿Qué conocimientos sobre propiedad intelectual posee?')
    .style(style)
    ws.cell(1,64)
    .string('Observacion')
    .style(style)
    ws.cell(1,65)
    .string('¿Qué acceso tiene a fuentes de información relacionadas con su sistema productivo?')
    .style(style)
    ws.cell(1,66)
    .string('Observacion')
    .style(style)
    ws.cell(1,67)
    .string('¿Qué acceso tiene a las TIC?')
    .style(style)
    ws.cell(1,68)
    .string('Observacion')
    .style(style)
    ws.cell(1,69)
    .string('¿Qué tanto utiliza las TIC para toma de decisiones?')
    .style(style)
    ws.cell(1,70)
    .string('Observacion')
    .style(style)
    ws.cell(1,71)
    .string('Para el manejo del agronegocio, ¿qué habilidades y competencias tiene en el uso de las TIC?')
    .style(style)
    ws.cell(1,72)
    .string('Observacion')
    .style(style)
    ws.cell(1,73)
    .string('¿Cómo es el nivel de apropiación social del conocimiento tradicional y científico?')
    .style(style)
    ws.cell(1,74)
    .string('Observacion')
    .style(style)
    ws.cell(1,75)
    .string('¿Conoce y planifica en su sistema productivo, actividades de conservación de la biodiversidad y el medio ambiente?')
    .style(style)
    ws.cell(1,76)
    .string('Observacion')
    .style(style)
    ws.cell(1,77)
    .string('¿Conoce y planifica actividades de conservación del recurso hídrico en su sistema productivo?')
    .style(style)
    ws.cell(1,78)
    .string('Observacion')
    .style(style)
    ws.cell(1,79)
    .string('¿Cómo realiza el manejo de suelos y nutrición para fines productivos?')
    .style(style)
    ws.cell(1,80)
    .string('Observacion')
    .style(style)
    ws.cell(1,81)
    .string('¿Tiene conocimiento e implementa acciones de prevención y/o recuperación del medio ambiente enfocado en la mitigación y adaptación al cambio climático?')
    .style(style)
    ws.cell(1,82)
    .string('Observacion')
    .style(style)
    ws.cell(1,83)
    .string('¿Conoce y planifica la producción agropecuaria en su predio teniendo en cuenta la información climática histórica y de pronósticos climáticos?')
    .style(style)
    ws.cell(1,84)
    .string('Observacion')
    .style(style)
    ws.cell(1,85)
    .string('¿El productor conoce e implementa acciones que contribuyan a disminuir el calentamiento global?')
    .style(style)
    ws.cell(1,86)
    .string('Observacion')
    .style(style)
    ws.cell(1,87)
    .string('¿Conoce la normatividad ambiental?')
    .style(style)
    ws.cell(1,88)
    .string('Observacion')
    .style(style)
    ws.cell(1,89)
    .string('¿Cumple la normatividad ambiental?')
    .style(style)
    ws.cell(1,90)
    .string('Observacion')
    .style(style)
    ws.cell(1,91)
    .string('¿Tiene Conocimiento sobre instancias y mecanismos de participación?')
    .style(style)
    ws.cell(1,92)
    .string('Observacion')
    .style(style)
    ws.cell(1,93)
    .string('¿Tiene Conocimiento sobre herramientas para la participación?')
    .style(style)
    ws.cell(1,94)
    .string('Observacion')
    .style(style)
    ws.cell(1,95)
    .string('¿Conoce los mecanismos de control político y social? Y ¿ha participado en los mismos?')
    .style(style)
    ws.cell(1,96)
    .string('Observacion')
    .style(style)
    ws.cell(1,97)
    .string('¿Cuál ha sido el rol del productor en la autogestión de las comunidades?')
    .style(style)
    ws.cell(1,98)
    .string('Observacion')
    .style(style)
    ws.cell(1,99)
    .string('Fecha')
    .style(style)

    for(let i=0; i<producerSurvey.length; i++){
        //console.log('**>>', producerSurvey)
        //console.log('**>>', producerSurvey.length)
        const userName = await pool.query('select * from users WHERE id = ?', [producerSurvey[i].userId])
        ws.cell(2+i, 1)
        .string(producerSurvey[i].nitProducer)
        ws.cell(2+i, 2)
        .string(producerSurvey[i].firstName)
        ws.cell(2+i, 3)
        .string(producerSurvey[i].secondName)
        ws.cell(2+i, 4)
        .string(producerSurvey[i].firstsurname)
        ws.cell(2+i, 5)
        .string(producerSurvey[i].secondSurname)
        ws.cell(2+i, 6)
        .string(producerSurvey[i].nameFarm)
        ws.cell(2+i, 7)
        .string(producerSurvey[i].municipality)
        ws.cell(2+i, 8)
        .string(producerSurvey[i].vereda)
        ws.cell(2+i, 9)
        .string(producerSurvey[i].respuesta1)
        ws.cell(2+i, 10)
        .string(producerSurvey[i].comment1)
        ws.cell(2+i, 11)
        .string(producerSurvey[i].respuesta2)
        ws.cell(2+i, 12)
        .string(producerSurvey[i].comment2)
        ws.cell(2+i, 13)
        .string(producerSurvey[i].respuesta3)
        ws.cell(2+i, 14)
        .string(producerSurvey[i].comment3)
        ws.cell(2+i, 15)
        .string(producerSurvey[i].respuesta4)
        ws.cell(2+i, 16)
        .string(producerSurvey[i].comment4)
        ws.cell(2+i, 17)
        .string(producerSurvey[i].respuesta5)
        ws.cell(2+i, 18)
        .string(producerSurvey[i].comment5)
        ws.cell(2+i, 19)
        .string(producerSurvey[i].respuesta6)
        ws.cell(2+i, 20)
        .string(producerSurvey[i].comment6)
        ws.cell(2+i, 21)
        .string(producerSurvey[i].respuesta7)
        ws.cell(2+i, 22)
        .string(producerSurvey[i].comment7)
        ws.cell(2+i, 23)
        .string(producerSurvey[i].respuesta8)
        ws.cell(2+i, 24)
        .string(producerSurvey[i].comment8)
        ws.cell(2+i, 25)
        .string(producerSurvey[i].respuesta9)
        ws.cell(2+i, 26)
        .string(producerSurvey[i].comment9)
        ws.cell(2+i, 27)
        .string(producerSurvey[i].respuesta10)
        ws.cell(2+i, 28)
        .string(producerSurvey[i].comment10)
        ws.cell(2+i, 29)
        .string(producerSurvey[i].respuesta11)
        ws.cell(2+i, 30)
        .string(producerSurvey[i].comment11)
        ws.cell(2+i, 31)
        .string(producerSurvey[i].respuesta12)
        ws.cell(2+i, 32)
        .string(producerSurvey[i].comment12)
        ws.cell(2+i, 33)
        .string(producerSurvey[i].respuesta13)
        ws.cell(2+i, 34)
        .string(producerSurvey[i].comment13)
        ws.cell(2+i, 35)
        .string(producerSurvey[i].respuesta14)
        ws.cell(2+i, 36)
        .string(producerSurvey[i].comment14)
        ws.cell(2+i, 37)
        .string(producerSurvey[i].respuesta15)
        ws.cell(2+i, 38)
        .string(producerSurvey[i].comment15)
        ws.cell(2+i, 39)
        .string(producerSurvey[i].respuesta16)
        ws.cell(2+i, 40)
        .string(producerSurvey[i].comment16)
        ws.cell(2+i, 41)
        .string(producerSurvey[i].respuesta17)
        ws.cell(2+i, 42)
        .string(producerSurvey[i].comment17)
        ws.cell(2+i, 43)
        .string(producerSurvey[i].respuesta18)
        ws.cell(2+i, 44)
        .string(producerSurvey[i].comment18)
        ws.cell(2+i, 45)
        .string(producerSurvey[i].respuesta19)
        ws.cell(2+i, 46)
        .string(producerSurvey[i].comment19)
        ws.cell(2+i, 47)
        .string(producerSurvey[i].respuesta20)
        ws.cell(2+i, 48)
        .string(producerSurvey[i].comment20)
        ws.cell(2+i, 49)
        .string(producerSurvey[i].respuesta21)
        ws.cell(2+i, 50)
        .string(producerSurvey[i].comment21)
        ws.cell(2+i, 51)
        .string(producerSurvey[i].respuesta22)
        ws.cell(2+i, 52)
        .string(producerSurvey[i].comment22)
        ws.cell(2+i, 53)
        .string(producerSurvey[i].respuesta23)
        ws.cell(2+i, 54)
        .string(producerSurvey[i].comment23)
        ws.cell(2+i, 55)
        .string(producerSurvey[i].respuesta24)
        ws.cell(2+i, 56)
        .string(producerSurvey[i].comment24)
        ws.cell(2+i, 57)
        .string(producerSurvey[i].respuesta25)
        ws.cell(2+i, 58)
        .string(producerSurvey[i].comment25)
        ws.cell(2+i, 59)
        .string(producerSurvey[i].respuesta26)
        ws.cell(2+i, 60)
        .string(producerSurvey[i].comment26)
        ws.cell(2+i, 61)
        .string(producerSurvey[i].respuesta27)
        ws.cell(2+i, 62)
        .string(producerSurvey[i].comment27)
        ws.cell(2+i, 63)
        .string(producerSurvey[i].respuesta28)
        ws.cell(2+i, 64)
        .string(producerSurvey[i].comment28)
        ws.cell(2+i, 65)
        .string(producerSurvey[i].respuesta29)
        ws.cell(2+i, 66)
        .string(producerSurvey[i].comment29)
        ws.cell(2+i, 67)
        .string(producerSurvey[i].respuesta30)
        ws.cell(2+i, 68)
        .string(producerSurvey[i].comment30)
        ws.cell(2+i, 69)
        .string(producerSurvey[i].respuesta31)
        ws.cell(2+i, 70)
        .string(producerSurvey[i].comment31)
        ws.cell(2+i, 71)
        .string(producerSurvey[i].respuesta32)
        ws.cell(2+i, 72)
        .string(producerSurvey[i].comment32)
        ws.cell(2+i, 73)
        .string(producerSurvey[i].respuesta33)
        ws.cell(2+i, 74)
        .string(producerSurvey[i].comment33)
        ws.cell(2+i, 75)
        .string(producerSurvey[i].respuesta34)
        ws.cell(2+i, 76)
        .string(producerSurvey[i].comment34)
        ws.cell(2+i, 77)
        .string(producerSurvey[i].respuesta35)
        ws.cell(2+i, 78)
        .string(producerSurvey[i].comment35)
        ws.cell(2+i, 79)
        .string(producerSurvey[i].respuesta36)
        ws.cell(2+i, 80)
        .string(producerSurvey[i].comment36)
        ws.cell(2+i, 81)
        .string(producerSurvey[i].respuesta37)
        ws.cell(2+i, 82)
        .string(producerSurvey[i].comment37)
        ws.cell(2+i, 83)
        .string(producerSurvey[i].respuesta38)
        ws.cell(2+i, 84)
        .string(producerSurvey[i].comment38)
        ws.cell(2+i, 85)
        .string(producerSurvey[i].respuesta39)
        ws.cell(2+i, 86)
        .string(producerSurvey[i].comment39)
        ws.cell(2+i, 87)
        .string(producerSurvey[i].respuesta40)
        ws.cell(2+i, 88)
        .string(producerSurvey[i].comment40)
        ws.cell(2+i, 89)
        .string(producerSurvey[i].respuesta41)
        ws.cell(2+i, 90)
        .string(producerSurvey[i].comment41)
        ws.cell(2+i, 91)
        .string(producerSurvey[i].respuesta42)
        ws.cell(2+i, 92)
        .string(producerSurvey[i].comment42)
        ws.cell(2+i, 93)
        .string(producerSurvey[i].respuesta43)
        ws.cell(2+i, 94)
        .string(producerSurvey[i].comment43)
        ws.cell(2+i, 95)
        .string(producerSurvey[i].respuesta44)
        ws.cell(2+i, 96)
        .string(producerSurvey[i].comment44)
        ws.cell(2+i, 97)
        .string(producerSurvey[i].respuesta45)
        ws.cell(2+i, 98)
        .string(producerSurvey[i].comment45)
        ws.cell(2+i, 99)
        .string(producerSurvey[i].time_creation.toString())
        ws.cell(2+i, 100)
        .string(userName[0].nom_user)
        ws.cell(2+i, 101)
    }

    wb.write('Malla encuesta Productores Agricola.xlsx', res)
})

router.get('/producerPiscicolaList', isLoggedIn, async(req, res) => {
    const querySurvey = await pool.query('SELECT farm.id_farm, farm.nitProducer, farm.firstName, farm.firstSurname, farm.nameFarm, farm.municipality, farm.vereda FROM farm INNER JOIN answerproducerpiscicola ON farm.id_farm = answerproducerpiscicola.farm_id_pis AND answerproducerpiscicola.project_id_pis =?', [req.session.project.project]);
    res.render('admin/producerPiscicolaList', {querySurvey})
})

router.get('/propertyCharacterizationList', isLoggedIn, async(req, res) => {
    const producerSurveyCharacterization = await pool.query('SELECT id_farm, nitProducer, firstName, firstsurname, secondSurname, nameFarm, municipality, vereda, time_creation, creationDate from farm WHERE projectId = ?', [req.session.project.project])
    //console.log('DATA',producerSurveyCharacterization)
    res.render('admin/propertyCharacterizationList', {producerSurveyCharacterization})
})

router.get('/downloadExcelByCharacterization', isLoggedIn, (req, res, next) => {

    setTimeout (async() => { 
        if (req.timedout) { 
          next (); 
        } 
        else { 
          
            
            const charaterizationFarmList = await pool.query('select * from farm WHERE projectId = ?', [req.session.project.project]) 
            
            //console.log('CARACTERIZATION', charaterizationFarmList )
            cp.cell(1,1)
            .string('Proyecto')
            .style(styles)
            cp.cell(1,2)
            .string('Cedula')
            .style(styles)
            cp.cell(1,3)
            .string('Primer Nombre')
            .style(styles)
            cp.cell(1,4)
            .string('Segundo Nombre')
            .style(styles)
            cp.cell(1,5)
            .string('Primer Apellido')
            .style(styles)
            cp.cell(1,6)
            .string('Segundo Apellido')
            .style(styles)
            cp.cell(1,7)
            .string('Fecha de nacimiento')
            .style(styles)
            cp.cell(1,8)
            .string('Etnia')
            .style(styles)
            cp.cell(1,9)
            .string('Celular1')
            .style(styles)
            cp.cell(1,10)
            .string('Celular2')
            .style(styles)
            cp.cell(1,11)
            .string('Email')
            .style(styles)
            cp.cell(1,12)
            .string('Género')
            .style(styles)
            cp.cell(1,13)
            .string('Nivel Escolar')
            .style(styles)
            cp.cell(1,14)
            .string('Organizaciones')
            .style(styles)
            cp.cell(1,15)
            .string('Estado Civil')
            .style(styles)
            cp.cell(1,16)
            .string('Nombre completo conyuge')
            .style(styles)
            cp.cell(1,17)
            .string('Cedula Conyuge')
            .style(styles)
            cp.cell(1,18)
            .string('Lugar de expedición cedula conyuge')
            .style(styles)
            cp.cell(1,19)
            .string('Fecha de nacimiento conyuge')
            .style(styles)
            cp.cell(1,20)
            .string('Celular conyuge')
            .style(styles)
            cp.cell(1,21)
            .string('Email conyuge')
            .style(styles)
            cp.cell(1,22)
            .string('Nombre de la finca')
            .style(styles)
            cp.cell(1,23)
            .string('Municipio')
            .style(styles)
            cp.cell(1,24)
            .string('Corregimiento')
            .style(styles)
            cp.cell(1,25)
            .string('Vereda')
            .style(styles)
            cp.cell(1,26)
            .string('Titulo de posesión')
            .style(styles)
            cp.cell(1,27)
            .string('Extensión total del terreno')
            .style(styles)
            cp.cell(1,28)
            .string('Area Cultivada')
            .style(styles)
            cp.cell(1,29)
            .string('Area de Libre Destinación')
            .style(styles)
            cp.cell(1,30)
            .string('Area de conservación')
            .style(styles)
            cp.cell(1,31)
            .string('Presencia de proyectos actuales')
            .style(styles)
            cp.cell(1,32)
            .string('Manejo de agroquimicos')
            .style(styles)
            cp.cell(1,33)
            .string('Implementación de buenas prácticas')
            .style(styles)
            cp.cell(1,34)
            .string('Area de otros usos')
            .style(styles)
            cp.cell(1,35)
            .string('Metros Líneales de Afluentes')
            .style(styles)
            ws.cell(1,36)
            .string('Uso de Suelo y su Vocación')
            .style(styles)
            cp.cell(1,37)
            .string('Linea Productiva mas Implementada')
            .style(styles)
            cp.cell(1,38)
            .string('Tipo de certificación')
            .style(styles)
            cp.cell(1,39)
            .string('Lindero al Norte')
            .style(styles)
            cp.cell(1,40)
            .string('Lindero al Sur')
            .style(styles)
            cp.cell(1,41)
            .string('Lindero al Oriente')
            .style(styles)
            cp.cell(1,42)
            .string('Lindero al Occidente')
            .style(styles)
            cp.cell(1,43)
            .string('Altura')
            .style(styles)
            cp.cell(1,44)
            .string('Latitud')
            .style(styles)
            cp.cell(1,45)
            .string('Longitud')
            .style(styles)
            cp.cell(1,46)
            .string('Años en la propiedad')
            .style(styles)
            cp.cell(1,47)
            .string('Linea Productiva 1')
            .style(styles)
            cp.cell(1,48)
            .string('Linea Productiva 2')
            .style(styles)
            cp.cell(1,49)
            .string('Linea Productiva 3')
            .style(styles)
            cp.cell(1,50)
            .string('Linea Productiva 4')
            .style(styles)
            cp.cell(1,51)
            .string('Linea Productiva 5')
            .style(styles)
            cp.cell(1,52)
            .string('Conocimiento de la linea productiva 1')
            .style(styles)
            cp.cell(1,53)
            .string('Conocimiento de la linea productiva 2')
            .style(styles)
            cp.cell(1,54)
            .string('Conocimiento de la linea productiva 3')
            .style(styles)
            cp.cell(1,55)
            .string('Conocimiento de la linea productiva 4')
            .style(styles)
            cp.cell(1,56)
            .string('Conocimiento de la linea productiva 5')
            .style(styles)
            cp.cell(1,57)
            .string('Tipo de comercialización')
            .style(styles)
            cp.cell(1,58)
            .string('Productos de biopreparados')
            .style(styles)
            cp.cell(1,59)
            .string('Disponibilidad de agua')
            .style(styles)
            cp.cell(1,60)
            .string('Disponibilidad de vías de acceso')
            .style(styles)
            cp.cell(1,61)
            .string('Disponibilidad de electricidad')
            .style(styles)
            ws.cell(1,62)
            .string('Disponibilidad de redes de comunicación')
            .style(styles)
            cp.cell(1,63)
            .string('Disponibilidad para participar en proyectos de asistencia técnica')
            .style(styles)
            cp.cell(1,64)
            .string('Variedad de herramientas básicas de uso en el cultivo')
            .style(styles)
            cp.cell(1,65)
            .string('Tenencia de botiquin de primeros auxilios')
            .style(styles)
            cp.cell(1,66)
            .string('Tenencia de equipos de fumigación')
            .style(styles)
            cp.cell(1,67)
            .string('Tenencia de sistemas de riego')
            .style(styles)
            cp.cell(1,68)
            .string('Tenencia de maquinaria libiana ')
            .style(styles)
            cp.cell(1,69)
            .string('Interes en participar en proyectos de asistencia técnica')
            .style(styles)
            cp.cell(1,70)
            .string('Origen del capital de trabajo')
            .style(styles)
            cp.cell(1,71)
            .string('Grado de implementación de tecnologías de producción')
            .style(styles)
            cp.cell(1,72)
            .string('Linea Productiva 1')
            .style(styles)
            cp.cell(1,73)
            .string('Variedad')
            .style(styles)
            cp.cell(1,74)
            .string('Cantidad de plantulas')
            .style(styles)
            cp.cell(1,75)
            .string('Distancia entre surcos')
            .style(styles)
            cp.cell(1,76)
            .string('Distancia entre plantas')
            .style(styles)
            cp.cell(1,77)
            .string('Edad de cultivo (Años)')
            .style(styles)
            cp.cell(1,78)
            .string('Etapa del cultivo')
            .style(styles)
            cp.cell(1,79)
            .string('Cantidad de Kilogramos Producidos por Año')
            .style(styles)
            cp.cell(1,80)
            .string('Estado General del cultivo')
            .style(styles)
            cp.cell(1,81)
            .string('Area Aproximada (m2)')
            .style(styles)
            cp.cell(1,82)
            .string('Latitud Lote1')
            .style(styles)
            cp.cell(1,83)
            .string('Longitud Lote1')
            .style(styles)
            cp.cell(1,84)
            .string('Tipo de manejo')
            .style(styles)
            cp.cell(1,85)
            .string('Valor promedo de KG comercializado en pesos en el año')
            .style(styles)
            cp.cell(1,86)
            .string('Linea Productiva 2')
            .style(styles)
            cp.cell(1,87)
            .string('Variedad')
            .style(styles)
            cp.cell(1,88)
            .string('Cantidad de plantulas')
            .style(styles)
            cp.cell(1,89)
            .string('Distancia entre surcos')
            .style(styles)
            cp.cell(1,90)
            .string('Distancia entre plantas')
            .style(styles)
            cp.cell(1,91)
            .string('Edad de cultivo (Años)')
            .style(styles)
            cp.cell(1,92)
            .string('Etapa del cultivo')
            .style(styles)
            cp.cell(1,93)
            .string('Cantidad de Kilogramos Producidos por Año')
            .style(styles)
            cp.cell(1,94)
            .string('Estado General del cultivo')
            .style(styles)
            cp.cell(1,95)
            .string('Area Aproximada (m2)')
            .style(styles)
            cp.cell(1,96)
            .string('Latitud Lote2')
            .style(styles)
            cp.cell(1,97)
            .string('Longitud Lote2')
            .style(styles)
            cp.cell(1,98)
            .string('Tipo de manejo')
            .style(styles)
            cp.cell(1,99)
            .string('Valor promedo de KG comercializado en pesos en el año')
            .style(styles)
            cp.cell(1,100)
            .string('Linea Productiva 3')
            .style(styles)
            cp.cell(1,101)
            .string('Variedad')
            .style(styles)
            cp.cell(1,102)
            .string('Cantidad de plantulas')
            .style(styles)
            cp.cell(1,103)
            .string('Distancia entre surcos')
            .style(styles)
            cp.cell(1,104)
            .string('Distancia entre plantas')
            .style(styles)
            cp.cell(1,105)
            .string('Edad de cultivo (Años)')
            .style(styles)
            cp.cell(1,106)
            .string('Etapa del cultivo')
            .style(styles)
            cp.cell(1,107)
            .string('Cantidad de Kilogramos Producidos por Año')
            .style(styles)
            cp.cell(1,108)
            .string('Estado General del cultivo')
            .style(styles)
            cp.cell(1,109)
            .string('Area Aproximada (m2)')
            .style(styles)
            cp.cell(1,110)
            .string('Latitud Lote3')
            .style(styles)
            cp.cell(1,111)
            .string('Longitud Lote3')
            .style(styles)
            cp.cell(1,112)
            .string('Tipo de manejo')
            .style(styles)
            cp.cell(1,113)
            .string('Valor promedo de KG comercializado en pesos en el año')
            .style(styles)
            cp.cell(1,114)
            .string('Linea Productiva 4 (Pecuario)')
            .style(styles)
            cp.cell(1,115)
            .string('Raza')
            .style(styles)
            cp.cell(1,116)
            .string('Cantidad de animales')
            .style(styles)
            cp.cell(1,117)
            .string('numero de corrales')
            .style(styles)
            cp.cell(1,118)
            .string('Edad promedio de los animales')
            .style(styles)
            cp.cell(1,119)
            .string('Etapa productiva')
            .style(styles)
            cp.cell(1,120)
            .string('Cantidad de Kilogramos Producidos por Año')
            .style(styles)
            cp.cell(1,121)
            .string('Estado General del cultivo')
            .style(styles)
            cp.cell(1,122)
            .string('Area Aproximada (m2)')
            .style(styles)
            cp.cell(1,123)
            .string('Latitud Lote4')
            .style(styles)
            cp.cell(1,124)
            .string('Longitud Lote4')
            .style(styles)
            cp.cell(1,125)
            .string('Tipo de nutrición')
            .style(styles)
            cp.cell(1,126)
            .string('Valor promedo de KG comercializado en pesos en el año')
            .style(styles)
            cp.cell(1,127)
            .string('Linea Productiva 5 (Pecuario)')
            .style(styles)
            cp.cell(1,128)
            .string('Raza')
            .style(styles)
            cp.cell(1,129)
            .string('Cantidad de animales')
            .style(styles)
            cp.cell(1,130)
            .string('numero de corrales')
            .style(styles)
            cp.cell(1,131)
            .string('Edad promedio de los animales')
            .style(styles)
            cp.cell(1,132)
            .string('Etapa productiva')
            .style(styles)
            cp.cell(1,133)
            .string('Cantidad de Kilogramos Producidos por Año')
            .style(styles)
            cp.cell(1,134)
            .string('Estado General del cultivo')
            .style(styles)
            cp.cell(1,135)
            .string('Area Aproximada (m2)')
            .style(styles)
            cp.cell(1,136)
            .string('Latitud Lote5')
            .style(styles)
            cp.cell(1,137)
            .string('Longitud Lote5')
            .style(styles)
            cp.cell(1,138)
            .string('Tipo de nutrición')
            .style(styles)
            cp.cell(1,139)
            .string('Valor promedo de KG comercializado en pesos en el año')
            .style(styles)
            cp.cell(1,140)
            .string('Fecha de caracterización de predio')
            .style(styles)
            cp.cell(1,141)
            .string('Encuestador')
            .style(styles)
            cp.cell(1,142)
            .string('Comentarios')
            .style(styles)
            

            for(let i=0; i<charaterizationFarmList.length; i++){
                //console.log('aaa', charaterizationFarmList[i].latitudeLongitude);
                let arrayCoordenates = charaterizationFarmList[i].latitudeLongitude.split(',');
                let arrayCoordenates1 = charaterizationFarmList[i].coordenates1.split(',');
                let arrayCoordenates2 = charaterizationFarmList[i].coordenates2.split(',');
                let arrayCoordenates3 = charaterizationFarmList[i].coordenates3.split(',');
                let arrayCoordenates4 = charaterizationFarmList[i].coordenates4.split(',');
                let arrayCoordenates5 = charaterizationFarmList[i].coordenates5.split(',');
                const userPollster = await pool.query('select * from users WHERE id = ?', [charaterizationFarmList[i].userId])
                const project = await pool.query('select * from projects WHERE id_project = ?', [req.session.project.project])
                //console.log('project', project)
                
                cp.cell(2+i, 1)
                .string(project[0].nom_proyecto)
                cp.cell(2+i, 2)
                .string(charaterizationFarmList[i].nitProducer)
                cp.cell(2+i, 3)
                .string(charaterizationFarmList[i].firstName)
                cp.cell(2+i, 4)
                .string(charaterizationFarmList[i].secondName)
                cp.cell(2+i, 5)
                .string(charaterizationFarmList[i].firstSurname)
                cp.cell(2+i, 6)
                .string(charaterizationFarmList[i].secondSurname)
                cp.cell(2+i, 7)
                .string(charaterizationFarmList[i].birthdate)
                cp.cell(2+i, 8)
                .string(charaterizationFarmList[i].ethnicity)
                cp.cell(2+i, 9)
                .string(charaterizationFarmList[i].celphone1)
                cp.cell(2+i, 10)
                .string(charaterizationFarmList[i].celphone2)
                cp.cell(2+i, 11)
                .string(charaterizationFarmList[i].email)
                cp.cell(2+i, 12)
                .string(charaterizationFarmList[i].gender)
                cp.cell(2+i, 13)
                .string(charaterizationFarmList[i].scholarLevel)
                cp.cell(2+i, 14)
                .string(charaterizationFarmList[i].organization)
                cp.cell(2+i, 15)
                .string(charaterizationFarmList[i].maritalStatus)
                cp.cell(2+i, 16)
                .string(charaterizationFarmList[i].fullnameSpouse)
                cp.cell(2+i, 17)
                .string(charaterizationFarmList[i].nitSpouse)
                cp.cell(2+i, 18)
                .string(charaterizationFarmList[i].expeditionSpouse)
                cp.cell(2+i, 19)
                .string(charaterizationFarmList[i].dateSpouse)
                cp.cell(2+i, 20)
                .string(charaterizationFarmList[i].celphoneSpouse)
                cp.cell(2+i, 21)
                .string(charaterizationFarmList[i].emailSpouse)
                cp.cell(2+i, 22)
                .string(charaterizationFarmList[i].nameFarm)
                cp.cell(2+i, 23)
                .string(charaterizationFarmList[i].municipality)
                cp.cell(2+i, 24)
                .string(charaterizationFarmList[i].corregimiento)
                cp.cell(2+i, 25)
                .string(charaterizationFarmList[i].vereda)
                cp.cell(2+i, 26)
                .string(charaterizationFarmList[i].possession)
                cp.cell(2+i, 27)
                .string(charaterizationFarmList[i].totalExtension)
                cp.cell(2+i, 28)
                .string(charaterizationFarmList[i].cropsArea)
                cp.cell(2+i, 29)
                .string(charaterizationFarmList[i].freeArea)
                cp.cell(2+i, 30)
                .string(charaterizationFarmList[i].conservationArea)
                cp.cell(2+i, 31)
                .string(charaterizationFarmList[i].currentProjects)
                cp.cell(2+i, 32)
                .string(charaterizationFarmList[i].agrochemical)
                cp.cell(2+i, 33)
                .string(charaterizationFarmList[i].bestPractices)
                cp.cell(2+i, 34)
                .string(charaterizationFarmList[i].otherAreas)
                cp.cell(2+i, 35)
                .string(charaterizationFarmList[i].afluentes)
                cp.cell(2+i, 36)
                .string(charaterizationFarmList[i].vocationAndLandUse)
                cp.cell(2+i, 37)
                .string(charaterizationFarmList[i].productiveLine)
                cp.cell(2+i, 38)
                .string(charaterizationFarmList[i].certificationType)
                cp.cell(2+i, 39)
                .string(charaterizationFarmList[i].purlieuNorth)
                cp.cell(2+i, 40)
                .string(charaterizationFarmList[i].purlieuSouth)
                cp.cell(2+i, 41)
                .string(charaterizationFarmList[i].purlieuEast)
                cp.cell(2+i, 42)
                .string(charaterizationFarmList[i].purlieuWest)
                cp.cell(2+i, 43)
                .string(charaterizationFarmList[i].altura)
                cp.cell(2+i, 44)
                .string(arrayCoordenates[0])
                cp.cell(2+i, 45)
                .string(arrayCoordenates[1])
                cp.cell(2+i, 46)
                .string(charaterizationFarmList[i].anosPropiedad)
                cp.cell(2+i, 47)
                .string(charaterizationFarmList[i].productiveLine1)
                cp.cell(2+i, 48)
                .string(charaterizationFarmList[i].productiveLine2)
                cp.cell(2+i, 49)
                .string(charaterizationFarmList[i].productiveLine3)
                cp.cell(2+i, 50)
                .string(charaterizationFarmList[i].productiveLine4)
                cp.cell(2+i, 51)
                .string(charaterizationFarmList[i].productiveLine5)
                cp.cell(2+i, 52)
                .string(charaterizationFarmList[i].knowProductiveLine1)
                cp.cell(2+i, 53)
                .string(charaterizationFarmList[i].knowProductiveLine2)
                cp.cell(2+i, 54)
                .string(charaterizationFarmList[i].knowPeoductiveLine3)
                cp.cell(2+i, 55)
                .string(charaterizationFarmList[i].knowProductiveLine4)
                cp.cell(2+i, 56)
                .string(charaterizationFarmList[i].knowProductiveLine5)
                cp.cell(2+i, 57)
                .string(charaterizationFarmList[i].comercializationType)
                cp.cell(2+i, 58)
                .string(charaterizationFarmList[i].biopreparadosProduction)
                cp.cell(2+i, 59)
                .string(charaterizationFarmList[i].waterAvailable)
                cp.cell(2+i, 60)
                .string(charaterizationFarmList[i].accessRoads)
                cp.cell(2+i, 61)
                .string(charaterizationFarmList[i].electricityAvailability)
                cp.cell(2+i, 62)
                .string(charaterizationFarmList[i].ComunicationAvailable)
                cp.cell(2+i, 63)
                .string(charaterizationFarmList[i].projectParticipation)
                cp.cell(2+i, 64)
                .string(charaterizationFarmList[i].cropTools)
                cp.cell(2+i, 65)
                .string(charaterizationFarmList[i].firstAidKit)
                cp.cell(2+i, 66)
                .string(charaterizationFarmList[i].fumigateKit)
                cp.cell(2+i, 67)
                .string(charaterizationFarmList[i].irrigationSystem)
                cp.cell(2+i, 68)
                .string(charaterizationFarmList[i].machines)
                cp.cell(2+i, 69)
                .string(charaterizationFarmList[i].ParticipateInProyects)
                cp.cell(2+i, 70)
                .string(charaterizationFarmList[i].workingCapital)
                cp.cell(2+i, 71)
                .string(charaterizationFarmList[i].implementationTecnologyLevel)
                cp.cell(2+i, 72)
                .string(charaterizationFarmList[i].productLine1)
                cp.cell(2+i, 73)
                .string(charaterizationFarmList[i].variety1)
                cp.cell(2+i, 74)
                .string(charaterizationFarmList[i].cantPlants1)
                cp.cell(2+i, 75)
                .string(charaterizationFarmList[i].groovesDistance1)
                cp.cell(2+i, 76)
                .string(charaterizationFarmList[i].plantsDistance1)
                cp.cell(2+i, 77)
                .string(charaterizationFarmList[i].ageCrop1)
                cp.cell(2+i, 78)
                .string(charaterizationFarmList[i].stageCrop1)
                cp.cell(2+i, 79)
                .string(charaterizationFarmList[i].cantKgProducedByYear1)
                cp.cell(2+i, 80)
                .string(charaterizationFarmList[i].cropStatus1)
                cp.cell(2+i, 81)
                .string(charaterizationFarmList[i].aproxArea1)
                cp.cell(2+i, 82)
                .string(arrayCoordenates1[0])
                cp.cell(2+i, 83)
                .string(arrayCoordenates1[1])
                cp.cell(2+i, 84)
                .string(charaterizationFarmList[i].useType)
                cp.cell(2+i, 85)
                .string(charaterizationFarmList[i].promKgComercializateValue)
                cp.cell(2+i, 86)
                .string(charaterizationFarmList[i].productLine2)
                cp.cell(2+i, 87)
                .string(charaterizationFarmList[i].variety2)
                cp.cell(2+i, 88)
                .string(charaterizationFarmList[i].cantPlants2)
                cp.cell(2+i, 89)
                .string(charaterizationFarmList[i].groovesDistance2)
                cp.cell(2+i, 90)
                .string(charaterizationFarmList[i].plantsDistance2)
                cp.cell(2+i, 91)
                .string(charaterizationFarmList[i].ageCrop2)
                cp.cell(2+i, 92)
                .string(charaterizationFarmList[i].stageCrop2)
                cp.cell(2+i, 93)
                .string(charaterizationFarmList[i].cantKgProducedByYear2)
                cp.cell(2+i, 94)
                .string(charaterizationFarmList[i].cropStatus2)
                cp.cell(2+i, 95)
                .string(charaterizationFarmList[i].aproxArea2)
                cp.cell(2+i, 96)
                .string(arrayCoordenates2[0])
                cp.cell(2+i, 97)
                .string(arrayCoordenates2[1])
                cp.cell(2+i, 98)
                .string(charaterizationFarmList[i].useType2)
                cp.cell(2+i, 99)
                .string(charaterizationFarmList[i].promKgComercializateValu2)
                cp.cell(2+i, 100)
                .string(charaterizationFarmList[i].productLine3)
                cp.cell(2+i, 101)
                .string(charaterizationFarmList[i].variety3)
                cp.cell(2+i, 102)
                .string(charaterizationFarmList[i].cantPlants3)
                cp.cell(2+i, 103)
                .string(charaterizationFarmList[i].groovesDistance3)
                cp.cell(2+i, 104)
                .string(charaterizationFarmList[i].plantsDistance3)
                cp.cell(2+i, 105)
                .string(charaterizationFarmList[i].ageCrop3)
                cp.cell(2+i, 106)
                .string(charaterizationFarmList[i].stageCrop3)
                cp.cell(2+i, 107)
                .string(charaterizationFarmList[i].cantKgProducedByYear3)
                cp.cell(2+i, 108)
                .string(charaterizationFarmList[i].cropStatus3)
                cp.cell(2+i, 109)
                .string(charaterizationFarmList[i].aproxArea3)
                cp.cell(2+i, 110)
                .string(arrayCoordenates3[0])
                cp.cell(2+i, 111)
                .string(arrayCoordenates3[1])
                cp.cell(2+i, 112)
                .string(charaterizationFarmList[i].useType3)
                cp.cell(2+i, 113)
                .string(charaterizationFarmList[i].promKgComercializateValu3)
                cp.cell(2+i, 114)
                .string(charaterizationFarmList[i].productLine4Pecuaria)
                cp.cell(2+i, 115)
                .string(charaterizationFarmList[i].breed)
                cp.cell(2+i, 116)
                .string(charaterizationFarmList[i].cantAnimals)
                cp.cell(2+i, 117)
                .string(charaterizationFarmList[i].numberPlaces)
                cp.cell(2+i, 118)
                .string(charaterizationFarmList[i].ageAverageAnimals)
                cp.cell(2+i, 119)
                .string(charaterizationFarmList[i].ageCrop4)
                cp.cell(2+i, 120)
                .string(charaterizationFarmList[i].cantKgProducedByYear4)
                cp.cell(2+i, 121)
                .string(charaterizationFarmList[i].cropStatus4)
                cp.cell(2+i, 122)
                .string(charaterizationFarmList[i].aproxArea4)
                ws.cell(2+i, 123)
                .string(arrayCoordenates4[0])
                cp.cell(2+i, 124)
                .string(arrayCoordenates4[1])
                cp.cell(2+i, 125)
                .string(charaterizationFarmList[i].nutritionType)
                cp.cell(2+i, 126)
                .string(charaterizationFarmList[i].promKgComercializateValu4)
                cp.cell(2+i, 127)
                .string(charaterizationFarmList[i].productLine5Pecuaria)
                cp.cell(2+i, 128)
                .string(charaterizationFarmList[i].breed5)
                cp.cell(2+i, 129)
                .string(charaterizationFarmList[i].cantAnimals5)
                cp.cell(2+i, 130)
                .string(charaterizationFarmList[i].numberPlaces5)
                cp.cell(2+i, 131)
                .string(charaterizationFarmList[i].ageAverageAnimals5)
                cp.cell(2+i, 132)
                .string(charaterizationFarmList[i].ageCrop5)
                cp.cell(2+i, 133)
                .string(charaterizationFarmList[i].cantKgProducedByYear5)
                cp.cell(2+i, 134)
                .string(charaterizationFarmList[i].cropStatus5)
                cp.cell(2+i, 135)
                .string(charaterizationFarmList[i].aproxArea5)
                cp.cell(2+i, 136)
                .string(arrayCoordenates5[0])
                cp.cell(2+i, 137)
                .string(arrayCoordenates5[1])
                cp.cell(2+i, 138)
                .string(charaterizationFarmList[i].nutritionType5)
                cp.cell(2+i, 139)
                .string(charaterizationFarmList[i].promKgComercializateValu5)
                cp.cell(2+i, 140)
                .string(charaterizationFarmList[i].time_creation.toString())
                cp.cell(2+i, 141)
                .string(userPollster[0].nom_user)
                cp.cell(2+i, 142)
                .string(charaterizationFarmList[i].comments)

            }

            wf.write('Malla predios caracterizados.xlsx', res)



        } 
      } , Math.random () * 7000); 


    
})

router.get('/downloadExcelRegisterPiscicola', isLoggedIn, async(req, res, next) => {
        
        const producerSurvey = await pool.query('SELECT farm.nitProducer, farm.firstName, farm.secondName, firstsurname, secondSurname, farm.nameFarm, farm.municipality,  farm.vereda, answerproducerpiscicola.respuesta1, answerproducerpiscicola.respuesta2, answerproducerpiscicola.respuesta3, answerproducerpiscicola.respuesta4, answerproducerpiscicola.respuesta5, answerproducerpiscicola.respuesta6, answerproducerpiscicola.respuesta7, answerproducerpiscicola.respuesta8, answerproducerpiscicola.respuesta9, answerproducerpiscicola.respuesta10, answerproducerpiscicola.respuesta11, answerproducerpiscicola.respuesta12, answerproducerpiscicola.respuesta13, answerproducerpiscicola.respuesta14, answerproducerpiscicola.respuesta15, answerproducerpiscicola.respuesta16, answerproducerpiscicola.respuesta17, answerproducerpiscicola.respuesta18, answerproducerpiscicola.respuesta19, answerproducerpiscicola.respuesta20, answerproducerpiscicola.respuesta21, answerproducerpiscicola.respuesta22, answerproducerpiscicola.respuesta23, answerproducerpiscicola.respuesta24, answerproducerpiscicola.respuesta25, answerproducerpiscicola.respuesta26, answerproducerpiscicola.respuesta27, answerproducerpiscicola.respuesta28, answerproducerpiscicola.respuesta29, answerproducerpiscicola.respuesta30, answerproducerpiscicola.respuesta31, answerproducerpiscicola.respuesta32, answerproducerpiscicola.respuesta33, answerproducerpiscicola.respuesta34, answerproducerpiscicola.respuesta35, answerproducerpiscicola.respuesta36, answerproducerpiscicola.respuesta37, answerproducerpiscicola.respuesta38, answerproducerpiscicola.respuesta39, answerproducerpiscicola.respuesta40, answerproducerpiscicola.respuesta41, answerproducerpiscicola.respuesta42, answerproducerpiscicola.respuesta43, answerproducerpiscicola.respuesta44, answerproducerpiscicola.respuesta45, answerproducerpiscicola.respuesta46, answerproducerpiscicola.respuesta47, answerproducerpiscicola.respuesta48, answerproducerpiscicola.respuesta49, answerproducerpiscicola.respuesta50, answerproducerpiscicola.respuesta51, answerproducerpiscicola.respuesta52, answerproducerpiscicola.comment1, answerproducerpiscicola.comment2, answerproducerpiscicola.comment3, answerproducerpiscicola.comment4, answerproducerpiscicola.comment5, answerproducerpiscicola.comment6, answerproducerpiscicola.comment7, answerproducerpiscicola.comment8, answerproducerpiscicola.comment9, answerproducerpiscicola.comment10, answerproducerpiscicola.comment11, answerproducerpiscicola.comment12, answerproducerpiscicola.comment13, answerproducerpiscicola.comment14, answerproducerpiscicola.comment15, answerproducerpiscicola.comment16, answerproducerpiscicola.comment17, answerproducerpiscicola.comment18, answerproducerpiscicola.comment19, answerproducerpiscicola.comment20, answerproducerpiscicola.comment21, answerproducerpiscicola.comment22, answerproducerpiscicola.comment23, answerproducerpiscicola.comment24, answerproducerpiscicola.comment25, answerproducerpiscicola.comment26, answerproducerpiscicola.comment27, answerproducerpiscicola.comment28, answerproducerpiscicola.comment29, answerproducerpiscicola.comment30, answerproducerpiscicola.comment31, answerproducerpiscicola.comment32, answerproducerpiscicola.comment33, answerproducerpiscicola.comment34, answerproducerpiscicola.comment35, answerproducerpiscicola.comment36, answerproducerpiscicola.comment37, answerproducerpiscicola.comment38, answerproducerpiscicola.comment39, answerproducerpiscicola.comment40, answerproducerpiscicola.comment41, answerproducerpiscicola.comment42, answerproducerpiscicola.comment43, answerproducerpiscicola.comment44, answerproducerpiscicola.comment45, answerproducerpiscicola.comment46, answerproducerpiscicola.comment47, answerproducerpiscicola.comment48, answerproducerpiscicola.comment49, answerproducerpiscicola.comment50, answerproducerpiscicola.comment51, answerproducerpiscicola.comment52 FROM farm INNER JOIN answerproducerpiscicola ON farm.id_farm = answerproducerpiscicola.farm_id_pis AND answerproducerpiscicola.project_id_pis =?', [req.session.project.project]) 
        rp.cell(1,1)
        .string('Cedula')
        .style(styleP)
        rp.cell(1,2)
        .string('Primer Nombre')
        .style(styleP)
        rp.cell(1,3)
        .string('Seg Nombre')
        .style(styleP)
        rp.cell(1,4)
        .string('Primer Apellido')
        .style(styleP)
        rp.cell(1,5)
        .string('Seg Apellido')
        .style(styleP)
        rp.cell(1,6)
        .string('Nom_finca')
        .style(styleP)
        rp.cell(1,7)
        .string('Municipio')
        .style(styleP)
        rp.cell(1,8)
        .string('Vereda')
        .style(styleP)
        rp.cell(1,9)
        .string('De acuerdo a su actividad pesquera que realiza, se encontraría en cual línea según la finalidad:')
        .style(styleP)
        rp.cell(1,10)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,11)
        .string('Por el lugar donde realiza las faenas es:')
        .style(styleP)
        rp.cell(1,12)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,13)
        .string('Si es pesca Marina defina si es')
        .style(styleP)
        rp.cell(1,14)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,15)
        .string('Actividad Anual')
        .style(styleP)
        rp.cell(1,16)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,17)
        .string('CARACTERISTICA DE LA UNIDAD ECONOMICA DE PESCA (UEP)')
        .style(styleP)
        rp.cell(1,18)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,19)
        .string('El pescador presenta actividades secundarias con que enfoque o proyección')
        .style(styleP)
        rp.cell(1,20)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,21)
        .string('TIPO DE HERRAMIENTAS Y EQUIPOS EMPLEADOS EN LA FAENAS DE PESCA')
        .style(styleP)
        rp.cell(1,22)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,23)
        .string('Cuantos pescadores faenan en su unidad económica de pesca')
        .style(styleP)
        rp.cell(1,24)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,25)
        .string('Cuál es el estado de su unidad económica de pesca')
        .style(styleP)
        rp.cell(1,26)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,27)
        .string('Volumen de captura en kilos diarios.')
        .style(styleP)
        rp.cell(1,28)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,29)
        .string('Ingresos per cápita por pescador o activos totales. (Pequeño activos totales no superiores a 145 salarios mínimos mensuales legales vigentes (SMMLV, es decir $93.430.750)')
        .style(styleP)
        rp.cell(1,30)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,31)
        .string('Uso de buenas prácticas pesqueras BPP.')
        .style(styleP)
        rp.cell(1,32)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,33)
        .string('Con relación al manejo sanitario como conserva su captura')
        .style(styleP)
        rp.cell(1,34)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,35)
        .string('La muerte después de la captura, lo hace')
        .style(styleP)
        rp.cell(1,36)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,37)
        .string('La unidad económica de pesca tiene espacio adecuado para cumplir con las normas básicas de higiene y sanidad')
        .style(styleP)
        rp.cell(1,38)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,39)
        .string('En su unidad económica de pesca realiza actividades de eviscerados, escamados, descabezado')
        .style(styleP)
        rp.cell(1,40)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,41)
        .string('Que hace con los desechos')
        .style(styleP)
        rp.cell(1,42)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,43)
        .string('¿LA UNIDAD ECONÓMICA DE PESCA TIENE VÍNCULOS FORMALES PARA COMERCIALIZACIÓN DE LOS RECURSOS PESQUEROS?')
        .style(styleP)
        rp.cell(1,44)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,45)
        .string('Comercializa sus capturas con:')
        .style(styleP)
        rp.cell(1,46)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,47)
        .string('Deja de la pesca para autoconsumo:')
        .style(styleP)
        rp.cell(1,48)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,49)
        .string('A qué tipo de mercado lleva sus capturas')
        .style(styleP)
        rp.cell(1,50)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,51)
        .string('A qué nivel de valor agregado lleva sus capturas')
        .style(styleP)
        rp.cell(1,52)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,53)
        .string('LLEVA REGISTRO DE DONDE DE PESCA')
        .style(styleP)
        rp.cell(1,54)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,55)
        .string('REGISTRO DE SUS CAPTURAS')
        .style(styleP)
        rp.cell(1,56)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,57)
        .string('TIPO DE MANO DE OBRA EMPLEADA')
        .style(styleP)
        rp.cell(1,58)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,59)
        .string('EL PESCADOR ARTESANAL SE ENCUENTRA BANCARIZADO')
        .style(styleP)
        rp.cell(1,60)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,61)
        .string('EL VALOR DE SU UNIDAD ECONÓMICA DE PESCA EXPRESADO EN SLMV AL AÑO')
        .style(styleP)
        rp.cell(1,62)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,63)
        .string('¿CUANTO FUE SU CAPTURA EXPRESADO EN TONELADAS / AÑO?')
        .style(styleP)
        rp.cell(1,64)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,65)
        .string('DESARROLLO PARA LAS CAPACIDADES SOCIALES INTEGRALES Y EL FORTALECIMIENTO DE LA ASOCIATIVIDAD')
        .style(styleP)
        rp.cell(1,66)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,67)
        .string('PARTICIPA EN ACTIVIDADES PRODUCTIVAS DE MANERA COLECTIVA')
        .style(styleP)
        rp.cell(1,68)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,69)
        .string('A PARTIR DE LOS PROCESOS ASOCIATIVOS O INDIVIDUALES EN LO QUE ESTA INMERSO EL PESCADOR ARTESANAL')
        .style(styleP)
        rp.cell(1,70)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,71)
        .string('A PARTIR DE PROCESOS ASOCIATIVOS, COMUNITARIOS O INDIVIDUALES Y CON EL PROPÓSITO DE GARANTIZAR ACCESO A NUEVOS MERCADOS Y PRECIOS COMPETITIVOS SE GENERAN')
        .style(styleP)
        rp.cell(1,72)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,73)
        .string('LA ASISTENCIA TÉCNICA A SU UNIDAD ECONÓMICA DE PESCA LA REALIZA POR INTERMEDIO DE')
        .style(styleP)
        rp.cell(1,74)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,75)
        .string('COMO PESCADOR ARTESANAL Y EN ARAS DE GENERAR MAYOR COMPETIVIDAD A LOS RECURSOS PESQUEROS QUE GENERA EL SECTOR, CUENTA CON ALGUNA CERTIFICACION GLOBAL')
        .style(styleP)
        rp.cell(1,76)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,77)
        .string('CUENTA CON SELLOS DE CALIDAD Y CERTIFICACIONES')
        .style(styleP)
        rp.cell(1,78)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,79)
        .string('ACCESO A LA INFORMACIÓN Y USO DE LAS TIC')
        .style(styleP)
        rp.cell(1,80)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,81)
        .string('TENIENDO EN CUENTA EL ACCESO A LA INFORMACION A PARTIR DE LAS HERRAMIENTAS EXISTENTES PUEDE ACCEDER A')
        .style(styleP)
        rp.cell(1,82)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,83)
        .string('PARA LAS TOMA DE DECISIONES EN EL MANEJO, APROVECHAMIENTO, COMERCIALIZACION DE SU ACTIVIDAD PRODUCTIVA UTILIZA COMO INSTRUMENTOS DE PLANEACION LAS TIC')
        .style(styleP)
        rp.cell(1,84)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,85)
        .string('AL EXISTIR LAS HERRAMIENTAS QUE PERMITAN LA TRANSFERENCIA DE CONOCIMIENTO DEL SECTOR, EL LIMITANTE QUE SE PRESENTA COMO PRODUCTOR ES LA HABILIDAD PARA EL MANEJO DE ESTAS EN TAL SENTIDO USTED:')
        .style(styleP)
        rp.cell(1,86)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,87)
        .string('TENIENDO EN CUENTA LOS PROCESOS DE TRANSFERENCIA DEL CONOCIMIENTO TRADICIONAL, TECNOLOGICO Y CIENTIFICO QUE CONLLEVE A MEJORAR LOS PROCESOS PRODUCTIVOS COMO PESCADOR COMO LO ASUME')
        .style(styleP)
        rp.cell(1,88)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,89)
        .string('CONOCE Y PLANIFICA EN SUS ACTIVDADS PESQUERAS ACCIONES DE CONSERVACION DE LA BIODIVERSIDAD Y EL MEDIO AMBIENTE EN LAS FAENAS DE PESCA')
        .style(styleP)
        rp.cell(1,90)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,91)
        .string('AREAS DE PESCA')
        .style(styleP)
        rp.cell(1,92)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,93)
        .string('CONOCE Y CAPTURA RECURSOS PESQUEROS CON LAS TALLAS PERMITIDAS')
        .style(styleP)
        rp.cell(1,94)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,95)
        .string('CONOCE SOBRE CUOTAS DE PESCA')
        .style(styleP)
        rp.cell(1,96)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,97)
        .string('USTED CONOCE ALGUNA ACCIÓN PARA PROTEGER SUS CUERPOS DE AGUA CUENTA E IMPLEMENTA PLAN DE CONSERVACION')
        .style(styleP)
        rp.cell(1,98)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,99)
        .string('Dentro de los métodos de adaptación al cambio climático se encuentra la utilización de energías renovables entre otra energía eólica, solar, en su actividad de pesca')
        .style(styleP)
        rp.cell(1,100)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,101)
        .string('LA UNIDAD ECONOMICA DE PESCA (UEP) CUENTA CON LOS PERMISOS PARA RELIZAR FAENAS DE PESCA')
        .style(styleP)
        rp.cell(1,102)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,103)
        .string('CONOCIMIENTO SOBRE INSTANCIAS Y MECANISMOS DE PARTICIPACION')
        .style(styleP)
        rp.cell(1,104)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,105)
        .string('TENIENDO EN CUENTA LAS HERRAMIENTAS DE PARTICIPACION ESTABLECIDAS, (PETICION, QUEJAS, DENUNCIAS ACCION DE GRUPO, TUTEL ACCION POPULAR Y DE CUMPLIMIENTO) LAS CUALES ESTAN DISEÑADAS CON EL PROPOSITO QUE EL CIUDADANO REALICE CONTROL Y SE LE RECONOZCAN SUS DERECHOS TANTO ENTIDADES PÚBLICAS COMO PRIVADAS USTED COMO PESCADOR ARTESANAL:')
        .style(styleP)
        rp.cell(1,106)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,107)
        .string('EL CONTROL SOCIAL ES UN DERECHO Y UN DEBER QUE TIENEN TODAS LOS CIUDADANOS A VIGILAR Y FISCALIZAR LA GESTION PUBLICA CON EL FIN DE ACOMPAÑAR EL CUMPLIMIENTO DE LOS FINES DEL ESTADO PARA LO CUAL SE ESTABLECEN DIFERENTES MODALIDADES PARA REALIZAR ESTE CONTROL VEEDURIAS CIUDADANAS, JUNTAS DE VIGILANCIAS, COMITES DE DESARROLLO Y CONTROL SOCIAL DE LOS SERVICIOS PUBLICOS DOMICILIARIOS, AUDITORIAS CIUDADANAS Y OTRAS INSTANCIAS DE PARTICIPACION TENIENDO EN CUENTA LO ANTERIOR')
        .style(styleP)
        rp.cell(1,108)
        .string('Observacion')
        .style(styleP)
        rp.cell(1,109)
        .string('TENIENDO EN CUENTA QUE LA AUTOGESTION COMUNITARIA ESTA DADA POR LA ACCION PARTICIPATIVA DE LA SOCIEDAD EN LOS AMBITOS PERSONALES FAMILIARES Y COMUNITARIOS PARA LA TOMA DE DECISIONES EN EL PROCESO DE DESARROLLO, LA CUAL CONLLEVA A LA AUTORESPONSABILIDAD, COLABORACION, CONTRIBUCION Y TRABAJO VOLUNTARIO PARA LA BUSQUEDA DE SOLUCIONES, DENTRO DE SUS ACTIVIDADES PRODUCTIVAS LA COMUNIDAD A LA QUE PERTENECE')
        .style(styleP)
        rp.cell(1,110)
        .string('Observacion')
        .style(styleP)

        
        for(let i=0; i<producerSurvey.length; i++){
            //console.log('**>>', producerSurvey)
            //console.log('**>>', producerSurvey.length)
            rp.cell(2+i, 1)
            .string(producerSurvey[i].nitProducer)
            rp.cell(2+i, 2)
            .string(producerSurvey[i].firstName)
            rp.cell(2+i, 3)
            .string(producerSurvey[i].secondName)
            rp.cell(2+i, 4)
            .string(producerSurvey[i].firstsurname)
            rp.cell(2+i, 5)
            .string(producerSurvey[i].secondSurname)
            rp.cell(2+i, 6)
            .string(producerSurvey[i].nameFarm)
            rp.cell(2+i, 7)
            .string(producerSurvey[i].municipality)
            rp.cell(2+i, 8)
            .string(producerSurvey[i].vereda)
            rp.cell(2+i, 9)
            .string(producerSurvey[i].respuesta1)
            rp.cell(2+i, 10)
            .string(producerSurvey[i].comment1)
            rp.cell(2+i, 11)
            .string(producerSurvey[i].respuesta2)
            rp.cell(2+i, 12)
            .string(producerSurvey[i].comment2)
            rp.cell(2+i, 13)
            .string(producerSurvey[i].respuesta3)
            rp.cell(2+i, 14)
            .string(producerSurvey[i].comment3)
            rp.cell(2+i, 15)
            .string(producerSurvey[i].respuesta4)
            rp.cell(2+i, 16)
            .string(producerSurvey[i].comment4)
            rp.cell(2+i, 17)
            .string(producerSurvey[i].respuesta5)
            rp.cell(2+i, 18)
            .string(producerSurvey[i].comment5)
            rp.cell(2+i, 19)
            .string(producerSurvey[i].respuesta6)
            rp.cell(2+i, 20)
            .string(producerSurvey[i].comment6)
            rp.cell(2+i, 21)
            .string(producerSurvey[i].respuesta7)
            rp.cell(2+i, 22)
            .string(producerSurvey[i].comment7)
            rp.cell(2+i, 23)
            .string(producerSurvey[i].respuesta8)
            rp.cell(2+i, 24)
            .string(producerSurvey[i].comment8)
            rp.cell(2+i, 25)
            .string(producerSurvey[i].respuesta9)
            rp.cell(2+i, 26)
            .string(producerSurvey[i].comment9)
            rp.cell(2+i, 27)
            .string(producerSurvey[i].respuesta10)
            rp.cell(2+i, 28)
            .string(producerSurvey[i].comment10)
            rp.cell(2+i, 29)
            .string(producerSurvey[i].respuesta11)
            rp.cell(2+i, 30)
            .string(producerSurvey[i].comment11)
            rp.cell(2+i, 31)
            .string(producerSurvey[i].respuesta12)
            rp.cell(2+i, 32)
            .string(producerSurvey[i].comment12)
            rp.cell(2+i, 33)
            .string(producerSurvey[i].respuesta13)
            rp.cell(2+i, 34)
            .string(producerSurvey[i].comment13)
            rp.cell(2+i, 35)
            .string(producerSurvey[i].respuesta14)
            rp.cell(2+i, 36)
            .string(producerSurvey[i].comment14)
            rp.cell(2+i, 37)
            .string(producerSurvey[i].respuesta15)
            rp.cell(2+i, 38)
            .string(producerSurvey[i].comment15)
            rp.cell(2+i, 39)
            .string(producerSurvey[i].respuesta16)
            rp.cell(2+i, 40)
            .string(producerSurvey[i].comment16)
            rp.cell(2+i, 41)
            .string(producerSurvey[i].respuesta17)
            rp.cell(2+i, 42)
            .string(producerSurvey[i].comment17)
            rp.cell(2+i, 43)
            .string(producerSurvey[i].respuesta18)
            rp.cell(2+i, 44)
            .string(producerSurvey[i].comment18)
            rp.cell(2+i, 45)
            .string(producerSurvey[i].respuesta19)
            rp.cell(2+i, 46)
            .string(producerSurvey[i].comment19)
            rp.cell(2+i, 47)
            .string(producerSurvey[i].respuesta20)
            rp.cell(2+i, 48)
            .string(producerSurvey[i].comment20)
            rp.cell(2+i, 49)
            .string(producerSurvey[i].respuesta21)
            rp.cell(2+i, 50)
            .string(producerSurvey[i].comment21)
            rp.cell(2+i, 51)
            .string(producerSurvey[i].respuesta22)
            rp.cell(2+i, 52)
            .string(producerSurvey[i].comment22)
            rp.cell(2+i, 53)
            .string(producerSurvey[i].respuesta23)
            rp.cell(2+i, 54)
            .string(producerSurvey[i].comment23)
            rp.cell(2+i, 55)
            .string(producerSurvey[i].respuesta24)
            rp.cell(2+i, 56)
            .string(producerSurvey[i].comment24)
            rp.cell(2+i, 57)
            .string(producerSurvey[i].respuesta25)
            rp.cell(2+i, 58)
            .string(producerSurvey[i].comment25)
            rp.cell(2+i, 59)
            .string(producerSurvey[i].respuesta26)
            rp.cell(2+i, 60)
            .string(producerSurvey[i].comment26)
            rp.cell(2+i, 61)
            .string(producerSurvey[i].respuesta27)
            rp.cell(2+i, 62)
            .string(producerSurvey[i].comment27)
            rp.cell(2+i, 63)
            .string(producerSurvey[i].respuesta28)
            rp.cell(2+i, 64)
            .string(producerSurvey[i].comment28)
            rp.cell(2+i, 65)
            .string(producerSurvey[i].respuesta29)
            rp.cell(2+i, 66)
            .string(producerSurvey[i].comment29)
            rp.cell(2+i, 67)
            .string(producerSurvey[i].respuesta30)
            rp.cell(2+i, 68)
            .string(producerSurvey[i].comment30)
            rp.cell(2+i, 69)
            .string(producerSurvey[i].respuesta31)
            rp.cell(2+i, 70)
            .string(producerSurvey[i].comment31)
            rp.cell(2+i, 71)
            .string(producerSurvey[i].respuesta32)
            rp.cell(2+i, 72)
            .string(producerSurvey[i].comment32)
            rp.cell(2+i, 73)
            .string(producerSurvey[i].respuesta33)
            rp.cell(2+i, 74)
            .string(producerSurvey[i].comment33)
            rp.cell(2+i, 75)
            .string(producerSurvey[i].respuesta34)
            rp.cell(2+i, 76)
            .string(producerSurvey[i].comment34)
            rp.cell(2+i, 77)
            .string(producerSurvey[i].respuesta35)
            rp.cell(2+i, 78)
            .string(producerSurvey[i].comment35)
            rp.cell(2+i, 79)
            .string(producerSurvey[i].respuesta36)
            rp.cell(2+i, 80)
            .string(producerSurvey[i].comment36)
            rp.cell(2+i, 81)
            .string(producerSurvey[i].respuesta37)
            rp.cell(2+i, 82)
            .string(producerSurvey[i].comment37)
            rp.cell(2+i, 83)
            .string(producerSurvey[i].respuesta38)
            rp.cell(2+i, 84)
            .string(producerSurvey[i].comment38)
            rp.cell(2+i, 85)
            .string(producerSurvey[i].respuesta39)
            rp.cell(2+i, 86)
            .string(producerSurvey[i].comment39)
            rp.cell(2+i, 87)
            .string(producerSurvey[i].respuesta40)
            rp.cell(2+i, 88)
            .string(producerSurvey[i].comment40)
            rp.cell(2+i, 89)
            .string(producerSurvey[i].respuesta41)
            rp.cell(2+i, 90)
            .string(producerSurvey[i].comment41)
            rp.cell(2+i, 91)
            .string(producerSurvey[i].respuesta42)
            rp.cell(2+i, 92)
            .string(producerSurvey[i].comment42)
            rp.cell(2+i, 93)
            .string(producerSurvey[i].respuesta43)
            rp.cell(2+i, 94)
            .string(producerSurvey[i].comment43)
            rp.cell(2+i, 95)
            .string(producerSurvey[i].respuesta44)
            rp.cell(2+i, 96)
            .string(producerSurvey[i].comment44)
            rp.cell(2+i, 97)
            .string(producerSurvey[i].respuesta45)
            rp.cell(2+i, 98)
            .string(producerSurvey[i].comment45)
            rp.cell(2+i, 99)
            .string(producerSurvey[i].respuesta46)
            rp.cell(2+i, 100)
            .string(producerSurvey[i].comment46)
            rp.cell(2+i, 101)
            .string(producerSurvey[i].respuesta47)
            rp.cell(2+i, 102)
            .string(producerSurvey[i].comment47)
            rp.cell(2+i, 103)
            .string(producerSurvey[i].respuesta48)
            rp.cell(2+i, 104)
            .string(producerSurvey[i].comment48)
            rp.cell(2+i, 105)
            .string(producerSurvey[i].respuesta49)
            rp.cell(2+i, 106)
            .string(producerSurvey[i].comment49)
            rp.cell(2+i, 107)
            .string(producerSurvey[i].respuesta50)
            rp.cell(2+i, 108)
            .string(producerSurvey[i].comment50)
            rp.cell(2+i, 109)
            .string(producerSurvey[i].respuesta51)
            rp.cell(2+i, 110)
            .string(producerSurvey[i].comment52)
            
        }
        wx.write('Malla registro productor piscicola.xlsx', res)
})

router.get('/detailCharacterizationFarm/:id', isLoggedIn, async(req, res) => {
    const dataCharacterization = await pool.query('SELECT * FROM farm WHERE id_farm = ?', [req.params.id])
    //console.log(req.params.id)
    //console.log(dataCharacterization)
    res.render('admin/detailCharacterizationFarm', {dataCharacterization})
})

router.get('/downloadPdfCharacterizatioFarm/:id', isLoggedIn, async(req, res) =>{

    let logoUnoTrans = null;
    let logoDosTrans = null;
    let logoTresTrans = null;
    let logoCuatroTrans = null;
    let logoCincoTrans = null;
    let logoSeisTrans = null;
    let logoSieteTrans = null;
    let logoOchoTrans = null;

    const queryCharacterizationFarm = await pool.query('SELECT * FROM farm WHERE id_farm = ?', [req.params.id])
    const queryImageProject = await pool.query('SELECT * FROM projects WHERE id_project = ?', [req.session.project.project])

    let newName = queryCharacterizationFarm[0].firstName + " " + queryCharacterizationFarm[0].secondName+ " " + queryCharacterizationFarm[0].firstSurname + " " + queryCharacterizationFarm[0].secondSurname + "   " + queryCharacterizationFarm[0].nitProducer;


    if(queryCharacterizationFarm[0].secondName === null){
        queryCharacterizationFarm[0].secondName = ""
    }

    if(queryCharacterizationFarm[0].celphone2 === null){
        queryCharacterizationFarm[0].celphone2 = ""
    }

    if(queryCharacterizationFarm[0].email === null){
        queryCharacterizationFarm[0].email = ""
    }

    if(queryCharacterizationFarm[0].fullnameSpouse === null){
        queryCharacterizationFarm[0].fullnameSpouse = ""
    }

    if(queryCharacterizationFarm[0].nitSpouse === null){
        queryCharacterizationFarm[0].nitSpouse = ""
    }

    if(queryCharacterizationFarm[0].expeditionSpouse === null){
        queryCharacterizationFarm[0].expeditionSpouse = ""
    }

    if(queryCharacterizationFarm[0].dateSpouse === null){
        queryCharacterizationFarm[0].dateSpouse = ""
    }

    if(queryCharacterizationFarm[0].celphoneSpouse === null){
        queryCharacterizationFarm[0].celphoneSpouse = ""
    }

    if(queryCharacterizationFarm[0].corregimiento === null){
        queryCharacterizationFarm[0].corregimiento = ""
    }

    if(queryCharacterizationFarm[0].afluentes === null){
        queryCharacterizationFarm[0].afluentes = ""
    }



    
    let imgFarmer = await new Promise(function(resolve,reject){
        imageToBase64(queryCharacterizationFarm[0].img_beneficiario) // you can also to use url
        .then(
            (response) => {resolve(response);}
        )
        .catch(
            (error) => {
                resolve(false);
                console.log(error); 
            }
        ) 
    });


    let imgFarmerSignature = await new Promise(function(resolve,reject){
        imageToBase64(queryCharacterizationFarm[0].imgSignature) // you can also to use url
        .then(
            (response) => {resolve(response);}
        )
        .catch(
            (error) => {
                resolve(false);
                console.log(error); 
            }
        ) 
    });


    //Logos transformacion
    if(queryImageProject[0].logoUno){
        logoUnoTrans = await new Promise(function(resolve,reject){
            imageToBase64(queryImageProject[0].logoUno) // you can also to use url
            .then(
                (response) => {resolve(response);}
            )
            .catch(
                (error) => {
                    resolve(false);
                    console.log(error); 
                }
            ) 
        });
    }

    if(queryImageProject[0].logoDos){
        logoDosTrans = await new Promise(function(resolve,reject){
            imageToBase64(queryImageProject[0].logoUno) // you can also to use url
            .then(
                (response) => {resolve(response);}
            )
            .catch(
                (error) => {
                    resolve(false);
                    console.log(error); 
                }
            ) 
        });
    }

    if(queryImageProject[0].logoTres){
        logoTresTrans = await new Promise(function(resolve,reject){
            imageToBase64(queryImageProject[0].logoTres) // you can also to use url
            .then(
                (response) => {resolve(response);}
            )
            .catch(
                (error) => {
                    resolve(false);
                    console.log(error); 
                }
            ) 
        });
    }

    if(queryImageProject[0].logoCuatro){
        logoCuatroTrans = await new Promise(function(resolve,reject){
            imageToBase64(queryImageProject[0].logoCuatro) // you can also to use url
            .then(
                (response) => {resolve(response);}
            )
            .catch(
                (error) => {
                    resolve(false);
                    console.log(error); 
                }
            ) 
        });
    }

    if(queryImageProject[0].logoCinco){
        logoCincoTrans = await new Promise(function(resolve,reject){
            imageToBase64(queryImageProject[0].logoCinco) // you can also to use url
            .then(
                (response) => {resolve(response);}
            )
            .catch(
                (error) => {
                    resolve(false);
                    console.log(error); 
                }
            ) 
        });
    }
    
    let pdf = new PDFDocument({
        layout: 'landscape',
        size: [510, 410],
        margin: 5,
        info:{
            title:'Formato de caracterización de predios',
            Author: 'Fundación AIP cloud'
        }
    })

    pdf.info['Title'] = newName;

    let col1LeftPos = 20;
    let colWidth = 100;
    let col2LeftPos = colWidth + col1LeftPos + 30;
    let col3LeftPos = colWidth + col1LeftPos + 160;

   if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro && queryImageProject[0].logoCinco && queryImageProject[0].logoSeis && queryImageProject[0].logoSiete && queryImageProject[0].logoOcho){
        pdf.moveDown()
        .image('data:image/jpeg;base64,'+logoUnoTrans , 10, 10, {width: 40})
        .image('data:image/jpeg;base64,'+logoDosTrans , 10, 10, {width: 40})
    }else{ 
        if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro && queryImageProject[0].logoCinco && queryImageProject[0].logoSeis && queryImageProject[0].logoSiete ){
            pdf.moveDown()
            .image('data:image/jpeg;base64,'+logoUnoTrans , 10, 10, {width: 40})
            .image('data:image/jpeg;base64,'+logoDosTrans , 10, 10, {width: 40})
        }else{
            if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro && queryImageProject[0].logoCinco && queryImageProject[0].logoSeis ){
                pdf.moveDown()
                .image('data:image/jpeg;base64,'+logoUnoTrans , 10, 10, {width: 40})
                .image('data:image/jpeg;base64,'+logoDosTrans , 10, 10, {width: 40})
            }else{
                if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro && queryImageProject[0].logoCinco ){
                    pdf.moveDown()
                    .image('data:image/jpeg;base64,'+logoUnoTrans , 30, 10, {width: 40})
                    .image('data:image/jpeg;base64,'+logoDosTrans , 130, 10, {width: 40})
                    .image('data:image/jpeg;base64,'+logoTresTrans , 230, 10, {width: 40})
                    .image('data:image/jpeg;base64,'+logoTresTrans , 340, 10, {width: 40})
                    .image('data:image/jpeg;base64,'+logoCincoTrans , 185, 466, {width: 40})
                }else{
                    if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro ){
                        pdf.moveDown()
                        .image('data:image/jpeg;base64,'+logoUnoTrans , 30, 10, {width: 40})
                        .image('data:image/jpeg;base64,'+logoDosTrans , 130, 10, {width: 40})
                        .image('data:image/jpeg;base64,'+logoTresTrans , 230, 10, {width: 40})
                        .image('data:image/jpeg;base64,'+logoTresTrans , 340, 10, {width: 40})
                    }else{
                        if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres ){
                            pdf.moveDown()
                            .image('data:image/jpeg;base64,'+logoUnoTrans , 50, 10, {width: 40})
                            .image('data:image/jpeg;base64,'+logoDosTrans , 180, 10, {width: 40})
                            .image('data:image/jpeg;base64,'+logoTresTrans , 320, 10, {width: 40})
                        }else{
                            if(queryImageProject[0].logoUno && queryImageProject[0].logoDos){
                                pdf.moveDown()
                                .image('data:image/jpeg;base64,'+logoUnoTrans , 50, 10, {width: 40})
                                .image('data:image/jpeg;base64,'+logoDosTrans , 320, 10, {width: 40})
                            }else{
                                if(queryImageProject[0].logoUno){
                                    pdf.moveDown()
                                    .image('data:image/jpeg;base64,'+logoUnoTrans , 15, 15, {width: 380})
                                }
                            }
                        }
                    }
                }
            }
        } 
    } 

    pdf.moveDown()
    .fontSize(9)
    .image('data:image/jpeg;base64,'+imgFarmer , col1LeftPos, 90, {width: 120})
    .text(`Id de la finca: ${queryCharacterizationFarm[0].id_farm}`, col2LeftPos, 90)
    .text(`Nombre: ${queryCharacterizationFarm[0].firstName}  ${queryCharacterizationFarm[0].secondName}  ${queryCharacterizationFarm[0].firstSurname}`, col2LeftPos, 105)
    .text(`Cedula: ${queryCharacterizationFarm[0].nitProducer} de ${queryCharacterizationFarm[0].expedition}`, col2LeftPos, 120)
    .text(`Fecha nac: ${queryCharacterizationFarm[0].birthdate}`, col2LeftPos, 135)
    .text(`Telefono1: ${queryCharacterizationFarm[0].celphone1}`, col2LeftPos, 150)
    .text(`Telefono2: ${queryCharacterizationFarm[0].celphone2}`, col2LeftPos, 165)
    .text(`Email: ${queryCharacterizationFarm[0].email}`, col2LeftPos, 180)
    .text(`Organización báse: ${queryCharacterizationFarm[0].organization}`, col2LeftPos, 195)
    .text(`Genero: ${queryCharacterizationFarm[0].gender}`, col1LeftPos, 210)
    .text(`Etnia: ${queryCharacterizationFarm[0].ethnicity}`, col2LeftPos, 210)
    .text(`Estudios: ${queryCharacterizationFarm[0].scholarLevel}`, col3LeftPos, 210)
    .text(`Estado civil: ${queryCharacterizationFarm[0].maritalStatus}`, col3LeftPos, 230, {width: colWidth})
    .text(`Nombre Conyuge: ${queryCharacterizationFarm[0].fullnameSpouse}`, col1LeftPos, 230)
    .text(`Cedula: ${queryCharacterizationFarm[0].nitSpouse} de ${queryCharacterizationFarm[0].expeditionSpouse}`, col1LeftPos, 250, {width: colWidth})
    .text(`Fecha nac: ${queryCharacterizationFarm[0].dateSpouse}`, col2LeftPos, 250)
    .text(`Contacto conyuge: ${queryCharacterizationFarm[0].celphoneSpouse}`, col3LeftPos, 250)
    .text(`Email: ${queryCharacterizationFarm[0].emailSpouse}`, col1LeftPos, 275, {width: colWidth})
    .text(`Nombre finca: ${queryCharacterizationFarm[0].nameFarm}`, col2LeftPos, 275)
    .text(`Municipio: ${queryCharacterizationFarm[0].municipality}`, col3LeftPos, 275)
    .text(`Corregimiento: ${queryCharacterizationFarm[0].corregimiento}`, col1LeftPos, 300, {width: colWidth})
    .text(`Vereda: ${queryCharacterizationFarm[0].vereda}`, col2LeftPos, 300)
    .text(`Posesión: ${queryCharacterizationFarm[0].possession}`, col3LeftPos, 300)
    .text(`Ext total (m2): ${queryCharacterizationFarm[0].totalExtension}`, col1LeftPos, 330, {width: colWidth})
    .text(`Área cosechada (m2): ${queryCharacterizationFarm[0].cropsArea}`, col2LeftPos, 330)
    .text(`Área Libre dest: ${queryCharacterizationFarm[0].freeArea}`, col3LeftPos, 330)
    .text(`Área consevación: ${queryCharacterizationFarm[0].conservationArea}`, col1LeftPos, 350, {width: colWidth})
    .text(`Participación en proyectos: ${queryCharacterizationFarm[0].currentProjects}`, col2LeftPos, 350, {width: colWidth})
    .text(`Agroquimicos: ${queryCharacterizationFarm[0].agrochemical}`, col3LeftPos, 350)
    .text(`Buenas prácticas: ${queryCharacterizationFarm[0].bestPractices}`, col1LeftPos, 380, {width: colWidth})
    .text(`Otras areas (m2): ${queryCharacterizationFarm[0].otherAreas}`, col2LeftPos, 380)
    .text(`Afluentes: ${queryCharacterizationFarm[0].afluentes}`, col3LeftPos, 380)
    .text(`Vocacion y uso de la tierra: ${queryCharacterizationFarm[0].vocationAndLandUse}`, col1LeftPos, 400, {width: colWidth})
    .text(`Linea prod principal: ${queryCharacterizationFarm[0].productiveLine}`, col2LeftPos, 400)
    .text(`Tipo de certificación: ${queryCharacterizationFarm[0].certificationType}`, col3LeftPos, 400, {width: colWidth})
    .text(`Lindero norte: ${queryCharacterizationFarm[0].purlieuNorth}`, col1LeftPos, 435, {width: colWidth})
    .text(`Lindero sur: ${queryCharacterizationFarm[0].purlieuSouth}`, col2LeftPos, 435)
    .text(`Lindero oriente: ${queryCharacterizationFarm[0].purlieuEast}`, col3LeftPos, 435)

    pdf.moveDown()
            .fillColor('black')
            .fontSize(11)
            .text('',0,60, {
            align: 'center',
            indent: 2,
            height: 2,
            ellipsis: true
            });

        
    pdf.addPage()
        .fontSize(9)
        .text(`Lindero Occidente ${queryCharacterizationFarm[0].purlieuWest}`, col1LeftPos, 30, {width: colWidth})
        .text(`Altura (m): ${queryCharacterizationFarm[0].altura}`, col2LeftPos, 30)
        .text(`Coordenadas: ${queryCharacterizationFarm[0].latitudeLongitude}`, col3LeftPos, 30)
        .text(`Años en la propiedad: ${queryCharacterizationFarm[0].anosPropiedad}`, col1LeftPos, 60)
        .text(`Linea prod 1: ${queryCharacterizationFarm[0].productiveLine1}`, col2LeftPos, 60)
        .text(`Linea prod 2: ${queryCharacterizationFarm[0].productiveLine2}`, col3LeftPos, 60)
        .text(`Linea prod 3: ${queryCharacterizationFarm[0].productiveLine3}`, col1LeftPos, 80, {width: colWidth})
        .text(`Conocimiento linea 1: ${queryCharacterizationFarm[0].knowProductiveLine1}`, col2LeftPos, 80)
        .text(`Conocimiento linea 2: ${queryCharacterizationFarm[0].knowProductiveLine2}`, col3LeftPos, 80)
        .text(`Linea prod 3: ${queryCharacterizationFarm[0].productiveLine3}`, col1LeftPos, 100, {width: colWidth})
        .text(`Conocimiento linea 1: ${queryCharacterizationFarm[0].knowProductiveLine1}`, col2LeftPos, 100)
        .text(`Conocimiento linea 2: ${queryCharacterizationFarm[0].knowProductiveLine2}`, col3LeftPos, 100)
        .text(`Conocimiento linea 3: ${queryCharacterizationFarm[0].knowPeoductiveLine3}`, col1LeftPos, 120, {width: colWidth})
        .text(`Produccion Biopreparados: ${queryCharacterizationFarm[0].biopreparadosProduction}`, col2LeftPos, 120, {width: colWidth})
        .text(`Tipo comercialización: ${queryCharacterizationFarm[0].comercializationType}`, col3LeftPos, 120)
        .text(`Vía de acceso: ${queryCharacterizationFarm[0].accessRoads}`, col1LeftPos, 150, {width: colWidth})
        .text(`Disp de agua: ${queryCharacterizationFarm[0].waterAvailable}`, col2LeftPos, 150)
        .text(`Disp de electricidad: ${queryCharacterizationFarm[0].electricityAvailability}`, col3LeftPos, 150)
        .text(`Medios comunicación: ${queryCharacterizationFarm[0].ComunicationAvailable}`, col1LeftPos, 180, {width: colWidth})
        .text(`Participación en proy: ${queryCharacterizationFarm[0].projectParticipation}`, col2LeftPos, 180)
        .text(`Herramientas de cosecha: ${queryCharacterizationFarm[0].cropTools}`, col3LeftPos, 180 , {width: colWidth})
        .text(`Botiquín: ${queryCharacterizationFarm[0].firstAidKit}`, col1LeftPos, 210, {width: colWidth})
        .text(`kit fumigación: ${queryCharacterizationFarm[0].fumigateKit}`, col2LeftPos, 210)
        .text(`sistema de riego: ${queryCharacterizationFarm[0].irrigationSystem}`, col3LeftPos, 210)
        .text(`Maquinaria: ${queryCharacterizationFarm[0].machines}`, col1LeftPos, 230, {width: colWidth})
        .text(`Participacion en proy: ${queryCharacterizationFarm[0].ParticipateInProyects}`, col2LeftPos, 230)
        .text(`Capital de trabajo: ${queryCharacterizationFarm[0].workingCapital}`, col3LeftPos, 230, {width: colWidth})
        .text(`Implementación Tecnológica: ${queryCharacterizationFarm[0].implementationTecnologyLevel}`, col1LeftPos, 260, {width: colWidth})

    pdf.moveDown()
        .fillColor('black')
        .fontSize(11)
        .text('Datos de la linea productiva 1', 0, 310, {
            align: 'center',
            indent: 2,
            height: 2,
            ellipsis: true
        });

    pdf.moveDown()
        .fontSize(9)
        .text(`Linea productiva: ${queryCharacterizationFarm[0].productLine1}`, col1LeftPos, 350, {width: colWidth})
        .text(`Cant plantulas: ${queryCharacterizationFarm[0].cantPlants1}`, col2LeftPos, 350)
        .text(`Variedad: ${queryCharacterizationFarm[0].variety1}`, col3LeftPos, 350)
        .text(`Distancia de siembra: ${queryCharacterizationFarm[0].sowingDistance1}`, col1LeftPos, 380, {width: colWidth})
        .text(`Etapa del cultivo: ${queryCharacterizationFarm[0].ageCrop1}`, col2LeftPos, 380)
        .text(`Estado del cultivo: ${queryCharacterizationFarm[0].stageCrop1}`, col3LeftPos, 380)
        .text(`cant producida X año ${queryCharacterizationFarm[0].cantKgProducedByYear1}`, col1LeftPos, 410, {width: colWidth})
        .text(`Estado del cultivo: ${queryCharacterizationFarm[0].cropStatus1}`, col2LeftPos, 410)
        .text(`Area aproximada: ${queryCharacterizationFarm[0].aproxArea1}`, col3LeftPos, 410)
        .text(`Coordenadas: ${queryCharacterizationFarm[0].coordenates1}`, col1LeftPos, 440, {width: colWidth})
        .text(`Tipo de uso: ${queryCharacterizationFarm[0].useType}`, col2LeftPos, 440, {width: colWidth})
        .text(`Kilogramos prom comercializado al año: ${queryCharacterizationFarm[0].promKgComercializateValue}`, col3LeftPos, 440)


    pdf.addPage()
        .fontSize(9)
        .text(`Linea productiva: ${queryCharacterizationFarm[0].productLine2}`, col1LeftPos, 90, {width: colWidth})
        .text(`Cant plantulas: ${queryCharacterizationFarm[0].cantPlants2}`, col2LeftPos, 90)
        .text(`Variedad: ${queryCharacterizationFarm[0].variety2}`, col3LeftPos, 90)
        .text(`Distancia de siembra: ${queryCharacterizationFarm[0].sowingDistance2}`, col1LeftPos, 110, {width: colWidth})
        .text(`Etapa del cultivo: ${queryCharacterizationFarm[0].ageCrop2}`, col2LeftPos, 110)
        .text(`Estado del cultivo: ${queryCharacterizationFarm[0].stageCrop2}`, col3LeftPos, 110, {width: 110} )
        .text(`cant producida X año: ${queryCharacterizationFarm[0].cantKgProducedByYear2}`, col1LeftPos, 140, {width: colWidth})
        .text(`Estado del cultivo: ${queryCharacterizationFarm[0].cropStatus2}`, col2LeftPos, 140, {width: colWidth})
        .text(`Area aproximada: ${queryCharacterizationFarm[0].aproxArea2}`, col3LeftPos, 140)
        .text(`Coordenadas: ${queryCharacterizationFarm[0].coordenates2}`, col3LeftPos, 170)
        .text(`Kilogramos prom comercializado al año: ${queryCharacterizationFarm[0].promKgComercializateValu2}`, col1LeftPos, 170, {width: colWidth})
        .text(`Tipo de uso: ${queryCharacterizationFarm[0].useType2}`, col2LeftPos, 170)

    pdf.moveDown()
        .fillColor('black')
        .fontSize(11)
        .text('Datos de la linea productiva 2', 0, 60, {
        align: 'center',
        indent: 2,
        height: 2,
        ellipsis: true
        });
    
    pdf.moveDown()
        .fillColor('black')
        .fontSize(11)
        .text('Datos de la linea productiva 3', 0, 220, {
        align: 'center',
        indent: 2,
        height: 2,
        ellipsis: true
        });

    pdf.moveDown()
            .fontSize(9)
            .text(`Linea productiva: ${queryCharacterizationFarm[0].productLine2}`, col1LeftPos, 250, {width: colWidth})
            .text(`Cant plantulas: ${queryCharacterizationFarm[0].cantPlants2}`, col2LeftPos, 250)
            .text(`Variedad: ${queryCharacterizationFarm[0].variety2}`, col3LeftPos, 250)
            .text(`Distancia de siembra: ${queryCharacterizationFarm[0].sowingDistance2}`, col1LeftPos, 280, {width: colWidth})
            .text(`Etapa del cultivo: ${queryCharacterizationFarm[0].ageCrop2}`, col2LeftPos, 280)
            .text(`Estado del cultivo: ${queryCharacterizationFarm[0].stageCrop2}`, col3LeftPos, 280)
            .text(`cant producida X año: ${queryCharacterizationFarm[0].cantKgProducedByYear2}`, col1LeftPos, 310, {width: colWidth})
            .text(`Estado del cultivo: ${queryCharacterizationFarm[0].cropStatus2}`, col2LeftPos, 310, {width: colWidth})
            .text(`Area aproximada: ${queryCharacterizationFarm[0].aproxArea2}`, col3LeftPos, 310)
            .text(`Coordenadas: ${queryCharacterizationFarm[0].coordenates2}`, col3LeftPos, 340)
            .text(`Kilogramos prom comercializado al año: ${queryCharacterizationFarm[0].promKgComercializateValu2}`, col1LeftPos, 340, {width: colWidth})
            .text(`Tipo de uso: ${queryCharacterizationFarm[0].useType2}`, col2LeftPos, 340)
                
    pdf.moveDown()
        .fillColor('black')
        .fontSize(11)
        .text('Datos de la linea productiva 4 producción pecuaria', 0, 390, {
        align: 'center',
        indent: 2,
        height: 2,
        ellipsis: true
        });

    pdf.moveDown()
            .fontSize(9)
            .text(`Linea productiva pecuaria 4: ${queryCharacterizationFarm[0].productLine4Pecuaria}`, col1LeftPos, 420, {width: colWidth})
            .text(`Raza o tipo: ${queryCharacterizationFarm[0].breed}`, col2LeftPos, 420)
            .text(`Cantidad de animales: ${queryCharacterizationFarm[0].cantAnimals}`, col3LeftPos, 420, {width: colWidth})
            
    pdf.addPage()
        .text(`Num lotes usados para la actividad: ${queryCharacterizationFarm[0].numberPlaces}`, col1LeftPos, 70, {width: colWidth})
        .text(`Edad prom de los animales: ${queryCharacterizationFarm[0].ageAverageAnimals}`, col2LeftPos, 70, {width: colWidth})
        .text(`Etapa productiva: ${queryCharacterizationFarm[0].ageCrop4}`, col3LeftPos, 70, {width: colWidth})
        .text(`Cant de litros producidos por año: ${queryCharacterizationFarm[0].cantKgProducedByYear4}`, col1LeftPos, 100, {width: colWidth})
        .text(`Área aproximada usada por los animales (m2): ${queryCharacterizationFarm[0].aproxArea4}`, col2LeftPos, 100, {width: 150})
        .text(`Est general de los animales: ${queryCharacterizationFarm[0].cropStatus4}`, col2LeftPos, 130)
        .text(`Tipo de alimentación: ${queryCharacterizationFarm[0].nutritionType}`, col1LeftPos, 130, {width: colWidth})
        .text(`Coordenadas: ${queryCharacterizationFarm[0].coordenates4}`, col1LeftPos, 160, {width: colWidth})
        .text(`Valor prom de KG comercializado en pesos en el año: ${queryCharacterizationFarm[0].promKgComercializateValu4}`, col2LeftPos, 160, {width: 150})
        .text(`Linea productiva pecuaria 5: ${queryCharacterizationFarm[0].productLine5Pecuaria}`, col1LeftPos, 240, {width: colWidth})
        .text(`Raza o tipo: ${queryCharacterizationFarm[0].breed5}`, col2LeftPos, 240)
        .text(`Cantidad de animales: ${queryCharacterizationFarm[0].cantAnimals5}`, col3LeftPos, 240, {width: colWidth})
        .text(`Num lotes usados para la actividad: ${queryCharacterizationFarm[0].numberPlaces}`, col1LeftPos, 270, {width: colWidth})
        .text(`Edad prom de los animales en años: ${queryCharacterizationFarm[0].ageAverageAnimals5}`, col2LeftPos, 270, {width:colWidth})
        .text(`Etapa productiva: ${queryCharacterizationFarm[0].ageCrop5}`, col3LeftPos, 270, {width:colWidth})
        .text(`Cant de litros producidos por año: ${queryCharacterizationFarm[0].cantKgProducedByYear5}`, col1LeftPos, 300, {width: colWidth})
        .text(`Área aproximada usada por los animales (m2): ${queryCharacterizationFarm[0].aproxArea5}`, col2LeftPos, 300, {width:colWidth})
        .text(`Est general de los animales: ${queryCharacterizationFarm[0].cropStatus5}`, col2LeftPos, 340)
        .text(`Tipo de alimentación: ${queryCharacterizationFarm[0].nutritionType5}`, col1LeftPos, 340, {width: colWidth})
        .text(`Coordenadas: ${queryCharacterizationFarm[0].coordenates5}`, col1LeftPos, 380, {width: colWidth})
        .text(`Valor prom de KG comercializado en pesos en el año: ${queryCharacterizationFarm[0].promKgComercializateValu5}`, col2LeftPos, 380, {width:150})
        .image('data:image/jpeg;base64,'+imgFarmerSignature, 160, 410, {width: 90})
        .text('Firma del titular del predio', 153, 460)

    pdf.moveDown()
        .fillColor('black')
        .fontSize(11)
        .text('Datos de la linea productiva 5 producción pecuaria', 0, 210, {
        align: 'center',
        indent: 2,
        height: 2,
        ellipsis: true
        });
            
    pdf.pipe(res)
    pdf.end()     

})

router.get('/downloadPdfProducerRegister/:id', isLoggedIn, async(req, res) =>{

    let logoUnoTrans = null;
    let logoDosTrans = null;
    let logoTresTrans = null;
    let logoCuatroTrans = null;
    let logoCincoTrans = null;
    let logoSeisTrans = null;
    let logoSieteTrans = null;
    let logoOchoTrans = null;

    const questionsProducer = await pool.query('SELECT * FROM questions_producer')
    const answersFormatProducer = await pool.query('SELECT * FROM answerformatproducer WHERE farm_id = ?', [req.params.id])
    const answersProducer = await pool.query('SELECT * FROM answersproducer');
    const dataFarm = await pool.query('SELECT img_beneficiario, firstName, secondName, firstSurname, secondSurname, nitProducer, celphone1, municipality, corregimiento, birthdate, vereda, time_creation, nameFarm, imgSignature FROM farm WHERE id_farm = ?', [req.params.id])
    const queryImageProject = await pool.query('SELECT * FROM projects WHERE id_project = ?', [req.session.project.project])


    let imgFarmerSignature = await new Promise(function(resolve,reject){
        imageToBase64(dataFarm[0].imgSignature) // you can also to use url
        .then(
            (response) => {resolve(response);}
        )
        .catch(
            (error) => {
                resolve(false);
                console.log(error); 
            }
        ) 
    });


    //Logos transformacion
    if(queryImageProject[0].logoUno){
        logoUnoTrans = await new Promise(function(resolve,reject){
            imageToBase64(queryImageProject[0].logoUno) // you can also to use url
            .then(
                (response) => {resolve(response);}
            )
            .catch(
                (error) => {
                    resolve(false);
                    console.log(error); 
                }
            ) 
        });
    }

    if(queryImageProject[0].logoDos){
        logoDosTrans = await new Promise(function(resolve,reject){
            imageToBase64(queryImageProject[0].logoDos) // you can also to use url
            .then(
                (response) => {resolve(response);}
            )
            .catch(
                (error) => {
                    resolve(false);
                    console.log(error); 
                }
            ) 
        });
    }

    if(queryImageProject[0].logoTres){
        logoTresTrans = await new Promise(function(resolve,reject){
            imageToBase64(queryImageProject[0].logoTres) // you can also to use url
            .then(
                (response) => {resolve(response);}
            )
            .catch(
                (error) => {
                    resolve(false);
                    console.log(error); 
                }
            ) 
        });
    }

    if(queryImageProject[0].logoCuatro){
        logoCuatroTrans = await new Promise(function(resolve,reject){
            imageToBase64(queryImageProject[0].logoCuatro) // you can also to use url
            .then(
                (response) => {resolve(response);}
            )
            .catch(
                (error) => {
                    resolve(false);
                    console.log(error); 
                }
            ) 
        });
    }

    if(queryImageProject[0].logoCinco){
        logoCincoTrans = await new Promise(function(resolve,reject){
            imageToBase64(queryImageProject[0].logoCinco) // you can also to use url
            .then(
                (response) => {resolve(response);}
            )
            .catch(
                (error) => {
                    resolve(false);
                    console.log(error); 
                }
            ) 
        });
    }


    let answers ={};

    for(let i=0; i<answersFormatProducer.length; i++){
        let cont = 0;

        if(answersFormatProducer[i].respuesta1 === 'A'){
            answers.respuesta1 = 'Agronegocio'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta1 === 'B'){
            answers.respuesta1 = 'Predio productivo no tradicional especializado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta1 === 'C'){
            answers.respuesta1 = 'Productor tradicional'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta1 === 'D'){
            answers.respuesta1 = 'Productor de subsistencia'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta2 === 'A'){
            answers.respuesta2 = 'Con enfoque de agronegocio.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta2 === 'B'){
            answers.respuesta2 = 'Como complemento a la actividad productiva principal.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta2 === 'C'){
            answers.respuesta2 = 'De forma temporal o no especializada.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta2 === 'D'){
            answers.respuesta2 = 'No tiene identificada una línea productiva secundaria.'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta3 === 'A'){
            answers.respuesta3 = 'Acceso ilimitado- especializado, según la actividad productiva y con componente tecnológico.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta3 === 'B'){
            answers.respuesta3 = 'Acceso ilimitado a elementos comunes del mercado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta3 === 'C'){
            answers.respuesta3 = 'Acceso limitado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta3 === 'D'){
            answers.respuesta3 = 'Acceso restringido'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta4 === 'A'){
            answers.respuesta4 = 'Acceso ilimitado a fuentes propias, tradicionales y alternativas.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta4 === 'B'){
            answers.respuesta4 = 'Acceso ilimitado a fuentes tradicionales.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta4 === 'C'){
            answers.respuesta4 = 'Acceso limitado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta4 === 'D'){
            answers.respuesta4 = 'Acceso restringido'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta5 === 'A'){
            answers.respuesta5 = 'Está certificado en BPA con el ICA y/o con otras certificaciones de inocuidad'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta5 === 'B'){
            answers.respuesta5 = 'Conoce y aplica las BPA, y está en proceso de certificación con el ICA'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta5 === 'C'){
            answers.respuesta5 = 'Conoce parcialmente las BPA, pero no las aplica.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta5 === 'D'){
            answers.respuesta5 = 'No conoce las BPA'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta6 === 'A'){
            answers.respuesta6 = 'Planificado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta6 === 'B'){
            answers.respuesta6 = 'No planificado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta6 === 'C'){
            answers.respuesta6 = 'Conoce, pero no implementa.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta6 === 'D'){
            answers.respuesta6 = 'No conoce ni implementa'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta7 === 'A'){
            answers.respuesta7 = 'No conoce las BPG.'
        }if(answersFormatProducer[i].respuesta7 === 'B'){
            answers.respuesta7 = 'Conoce parcialmente las BPG, pero no las aplica.'
        }if(answersFormatProducer[i].respuesta7 === 'C'){
            answers.respuesta7 = 'Conoce y aplica las BPG, y está en proceso de certificación con el ICA.'
        }if(answersFormatProducer[i].respuesta7 === 'D'){
            answers.respuesta7 = 'Está certificado en BPG con el ICA y/o con otras certificaciones de inocuidad.'
        }
        
        if(answersFormatProducer[i].respuesta8 === 'A'){
            answers.respuesta8 = 'No conoce ni implementa.'
        }if(answersFormatProducer[i].respuesta8 === 'B'){
            answers.respuesta8 = 'Conoce, pero no implementa.'
        }if(answersFormatProducer[i].respuesta8 === 'C'){
            answers.respuesta8 = 'No planificado.'
        }if(answersFormatProducer[i].respuesta8 === 'D'){
            answers.respuesta8 = 'Planificado.'
        }

        if(answersFormatProducer[i].respuesta9 === 'A'){
            answers.respuesta9 = 'No conoce ningún plan nutricional animal.'
        }if(answersFormatProducer[i].respuesta9 === 'B'){
            answers.respuesta9 = 'Conoce el plan nutricional animal pero no aplica.'
        }if(answersFormatProducer[i].respuesta9 === 'C'){
            answers.respuesta9 = 'Conoce el plan nutricional animal pero no siempre las aplica.'
        }if(answersFormatProducer[i].respuesta9 === 'D'){
            answers.respuesta9 = 'Implementa el plan en nutrición animal.'
        }
        
        if(answersFormatProducer[i].respuesta10 === 'A'){
            answers.respuesta10 = 'No conoce la selección y clasificación genética ni los métodos de biotecnología reproductiva.'
        }if(answersFormatProducer[i].respuesta10 === 'B'){
            answers.respuesta10 = 'Conoce pero no selecciona ni clasifica el material genético, ni implementa métodos de biotecnología.'
        }if(answersFormatProducer[i].respuesta10 === 'C'){
            answers.respuesta10 = 'Conoce pero no siempre aplica la selección y clasificación del material genético, para la implementación de biotecnologías reproductivas.'
        }if(answersFormatProducer[i].respuesta10 === 'D'){
            answers.respuesta10 = 'Selecciona y clasifica el material genético a utilizar en biotecnologías reproductivas.'
        }

        if(answersFormatProducer[i].respuesta11 === 'A'){
            answers.respuesta11 = 'Planificada especializada y/o bidireccional.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta11 === 'B'){
            answers.respuesta11 = 'Planificado tradicional.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta11 === 'C'){
            answers.respuesta11 = 'Tradicional'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta11 === 'D'){
            answers.respuesta11 = 'Autoconsumo'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta12 === 'A'){
            answers.respuesta12 = 'Especializado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta12 === 'B'){
            answers.respuesta12 = 'Tradicional'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta12 === 'C'){
            answers.respuesta12 = 'Básico.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta12 === 'D'){
            answers.respuesta12 = 'No cuenta con esquema de comercialización'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta13 === 'A'){
            answers.respuesta13 = 'Especializado.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta13 === 'B'){
            answers.respuesta13 = 'Tradicional.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta13 === 'C'){
            answers.respuesta13 = 'Básico.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta13 === 'D'){
            answers.respuesta13 = 'Local.'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta14 === 'A'){
            answers.respuesta14 = 'Especializado, hasta producto transformado.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta14 === 'B'){
            answers.respuesta14 = 'Especializado, sin producto transformado.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta14 === 'C'){
            answers.respuesta14 = 'Básico por demanda'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta14 === 'D'){
            answers.respuesta14 = 'Ninguno'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta15 === 'A'){
            answers.respuesta15 = 'Sistematizado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta15 === 'B'){
            answers.respuesta15 = 'Manual.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta15 === 'C'){
            answers.respuesta15 = 'Básico.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta15 === 'D'){
            answers.respuesta15 = 'No lleva registros.'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta16 === 'A'){
            answers.respuesta16 = 'Alto'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta16 === 'B'){
            answers.respuesta16 = 'Intermedio'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta16 === 'C'){
            answers.respuesta16 = 'Básico'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta16 === 'D'){
            answers.respuesta16 = 'Ninguno'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta17 === 'A'){
            answers.respuesta17 = 'Formal, con estructura administrativa'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta17 === 'B'){
            answers.respuesta17 = 'Formal, sin estructura administrativa'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta17 === 'C'){
            answers.respuesta17 = 'Informal'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta17 === 'D'){
            answers.respuesta17 = 'Informal sin contrato'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta18 === 'A'){
            answers.respuesta18 = 'Permanentemente'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta18 === 'B'){
            answers.respuesta18 = 'Ocasionalmente'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta18 === 'C'){
            answers.respuesta18 = 'Según oferta - necesidades'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta18 === 'D'){
            answers.respuesta18 = 'No capacita'
            cont = cont+1
        }
        if(answersFormatProducer[i].respuesta19 === 'A'){
            answers.respuesta19 = 'Formal, enfocado al crecimiento del negocio'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta19 === 'B'){
            answers.respuesta19 = 'Formal bancarizado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta19 === 'C'){
            answers.respuesta19 = 'Formal, no bancarizado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta19 === 'D'){
            answers.respuesta19 = 'Informal'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta20 === 'A'){
            answers.respuesta20 = 'Con Acceso vinculado al agronegocio'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta20 === 'B'){
            answers.respuesta20 = 'Con acceso no vinculado al agronegocio'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta20 === 'C'){
            answers.respuesta20 = 'Con acceso, pero no muestra interés'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta20 === 'D'){
            answers.respuesta20 = 'Sin acceso'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta21 === 'A'){
            answers.respuesta21 = 'Si'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta21 === 'B'){
            answers.respuesta21 = 'No'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta22 === 'A'){
            answers.respuesta22 = 'Activo'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta22 === 'B'){
            answers.respuesta22 = 'Sin participación'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta22 === 'C'){
            answers.respuesta22 = 'No formalizado'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta23 === 'A'){
            answers.respuesta23 = 'Activo'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta23 === 'B'){
            answers.respuesta23 = 'Frecuente'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta23 === 'C'){
            answers.respuesta23 = 'Eventual'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta23 === 'D'){
            answers.respuesta23 = 'Sin participación'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta24 === 'A'){
            answers.respuesta24 = 'Asociativa / organizado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta24 === 'B'){
            answers.respuesta24 = 'Asociativa sin organización'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta24 === 'C'){
            answers.respuesta24 = 'Individual'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta24 === 'D'){
            answers.respuesta24 = 'Sin participación'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta25 === 'A'){
            answers.respuesta25 = 'Formal y continua'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta25 === 'B'){
            answers.respuesta25 = 'Parcialmente'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta25 === 'C'){
            answers.respuesta25 = 'No participa'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta26 === 'A'){
            answers.respuesta26 = 'Permanente y especializada'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta26 === 'B'){
            answers.respuesta26 = 'Colectiva según necesidades comunes'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta26 === 'C'){
            answers.respuesta26 = 'Acceso sin cobertura adecuada a la necesidad'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta26 === 'D'){
            answers.respuesta26 = 'Sin acceso'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta27 === 'A'){
            answers.respuesta27 = 'Cuenta con certificación'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta27 === 'B'){
            answers.respuesta27 = 'Está en proceso'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta27 === 'C'){
            answers.respuesta27 = 'No le interesa'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta27 === 'D'){
            answers.respuesta27 = 'No conoce'
            cont = cont+1
}
        
        if(answersFormatProducer[i].respuesta28 === 'A'){
            answers.respuesta28 = 'Los tiene en cuenta'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta28 === 'B'){
            answers.respuesta28 = 'Los conoce'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta28 === 'C'){
            answers.respuesta28 = 'Conocimiento básico'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta28 === 'D'){
            answers.respuesta28 = 'Ningún conocimiento'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta29 === 'A'){
            answers.respuesta29 = 'Todas las fuentes'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta29 === 'B'){
            answers.respuesta29 = 'Mayoría de fuentes'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta29 === 'C'){
            answers.respuesta29 = 'Algunas'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta29 === 'D'){
            answers.respuesta29 = 'Pocas'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta30 === 'A'){
            answers.respuesta30 = 'Permanente'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta30 === 'B'){
            answers.respuesta30 = 'Frecuente'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta30 === 'C'){
            answers.respuesta30 = 'Regular'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta30 === 'D'){
            answers.respuesta30 = 'Ninguno'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta31 === 'A'){
            answers.respuesta31 = 'Todas'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta31 === 'B'){
            answers.respuesta31 = 'Algunas'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta31 === 'C'){
            answers.respuesta31 = 'Ninguna'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta31 === 'D'){
            answers.respuesta31 = 'Sin acceso'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta32 === 'A'){
            answers.respuesta32 = 'Alta'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta32 === 'B'){
            answers.respuesta32 = 'Media'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta32 === 'C'){
            answers.respuesta32 = 'Básica'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta32 === 'D'){
            answers.respuesta32 = 'Ninguna'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta33 === 'A'){
            answers.respuesta33 = 'Superior'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta33 === 'B'){
            answers.respuesta33 = 'Alto'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta33 === 'C'){
            answers.respuesta33 = 'Intermedio'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta34 === 'A'){
            answers.respuesta34 = 'Cuenta e implementa un plan de conservación'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta34 === 'B'){
            answers.respuesta34 = 'Implementa sin planificación'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta34 === 'C'){
            answers.respuesta34 = 'Conoce, pero no implementa prácticas'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta34 === 'D'){
            answers.respuesta34 = 'No conoce ni implementa'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta35 === 'A'){
            answers.respuesta35 = 'Dispone de un plan de conservación y lo implementa'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta35 === 'B'){
            answers.respuesta35 = 'Implementa sin planificación'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta35 === 'C'){
            answers.respuesta35 = 'Conoce, pero no implementa prácticas'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta35 === 'D'){
            answers.respuesta35 = 'No conoce ni implementa'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta36 === 'A'){
            answers.respuesta36 = 'Manejo planificado del suelo'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta36 === 'B'){
            answers.respuesta36 = 'Manejo intermedio no planificado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta36 === 'C'){
            answers.respuesta36 = 'Manejo básico no planificado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta36 === 'D'){
            answers.respuesta36 = 'Sin Manejo'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta37 === 'A'){
            answers.respuesta37 = 'Conoce y cuenta con un plan de mitigación y adaptación'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta37 === 'B'){
            answers.respuesta37 = 'Conoce e implementa'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta37 === 'C'){
            answers.respuesta37 = 'Conoce medidas, pero no las implementa'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta37 === 'D'){
            answers.respuesta37 = 'No conoce'
            cont = cont+1
        }
        
        if(answersFormatProducer[i].respuesta38 === 'A'){
            answers.respuesta38 = 'Planificación avanzada'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta38 === 'B'){
            answers.respuesta38 = 'Conoce y planifica'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta38 === 'C'){
            answers.respuesta38 = 'Conoce, pero no planifica'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta38 === 'D'){
            answers.respuesta38 = 'No conoce'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta39 === 'A'){
            answers.respuesta39 = 'Conoce e implementa acciones'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta39 === 'B'){
            answers.respuesta39 = 'Conoce, pero no implementa acciones'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta39 === 'C'){
            answers.respuesta39 = 'No conoce, pero sus acciones no afectan'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta39 === 'D'){
            answers.respuesta39 = 'No conoce, pero sus acciones si afectan'
            cont = cont + 1
}
        
        if(answersFormatProducer[i].respuesta40 === 'A'){
            answers.respuesta40 = 'Si'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta40=== 'B'){
            answers.respuesta40 = 'No'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta41 === 'A'){
            answers.respuesta41 = 'Certificado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta41 === 'B'){
            answers.respuesta41 = 'En proceso de certificación'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta41 === 'C'){
            answers.respuesta41 = 'Conoce y aplica normatividad nacional.'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta41 === 'D'){
            answers.respuesta41 = 'No cumple'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta42 === 'A'){
            answers.respuesta42 = 'Conoce y participa activamente'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta42 === 'B'){
            answers.respuesta42 = 'Conoce al menos cinco (5) mecanismos de participación'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta42 === 'C'){
            answers.respuesta42 = 'Conoce al menos tres (3) mecanismos de participación'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta42 === 'D'){
            answers.respuesta42 = 'No tiene conocimientos'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta43 === 'A'){
            answers.respuesta43 = 'Conoce todas las herramientas'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta43 === 'B'){
            answers.respuesta43 = 'Al menos tres (3) herramientas'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta43 === 'C'){
            answers.respuesta43 = 'Al menos una (1) herramienta'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta43 === 'D'){
            answers.respuesta43 = 'No tiene conocimientos'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta44 === 'A'){
            answers.respuesta44 = 'Todos los mecanismos'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta44 === 'B'){
            answers.respuesta44 = 'Al menos un (1) mecanismo y sí ha participado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta44 === 'C'){
            answers.respuesta44 = 'Al menos un (1) mecanismo y no ha participado'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta44 === 'D'){
            answers.respuesta44 = 'No tiene conocimientos'
            cont = cont+1
        }

        if(answersFormatProducer[i].respuesta45 === 'A'){
            answers.respuesta45 = 'Líder comunitario'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta45 === 'B'){
            answers.respuesta45 = 'Gestión Colectiva'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta45 === 'C'){
            answers.respuesta45 = 'Gestión Individual'
            cont = cont+1
        }if(answersFormatProducer[i].respuesta45 === 'D'){
            answers.respuesta45 = 'No ha gestionado'
            cont = cont+1
        }
              
     }


    let doc = new PDFDocument({
        layout: 'landscape',
        size: [510, 410],
        margin: 5,
        info:{
            title:'Formato de Registro de Productor',
            Author: 'Fundación AIP cloud'
        }
    })  

    if (dataFarm[0].secondName === null){
        dataFarm[0].secondName = ' '
    }

    if (dataFarm[0].secondSurname === null){
        dataFarm[0].secondSurname = ' '
    }

    if (dataFarm[0].vereda === null){
        dataFarm[0].vereda = ' '
    }

    if (dataFarm[0].corregimiento === null){
        dataFarm[0].corregimiento = ' '
    }

    let newName = dataFarm[0].firstName + " " + dataFarm[0].secondName+ " " + dataFarm[0].firstSurname + " " + dataFarm[0].secondSurname + "   " + dataFarm[0].nitProducer;

    doc.info['Title'] = newName;
    

    let col1LeftPos = 20;
    let col2LeftPos = col1LeftPos+40;

    if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro && queryImageProject[0].logoCinco && queryImageProject[0].logoSeis && queryImageProject[0].logoSiete && queryImageProject[0].logoOcho){
        doc.moveDown()
        .image('data:image/jpeg;base64,'+logoUnoTrans , 10, 10, {width: 40})
        .image('data:image/jpeg;base64,'+logoDosTrans , 10, 10, {width: 40})
    }else{ 
        if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro && queryImageProject[0].logoCinco && queryImageProject[0].logoSeis && queryImageProject[0].logoSiete ){
            doc.moveDown()
            .image('data:image/jpeg;base64,'+logoUnoTrans , 10, 10, {width: 40})
            .image('data:image/jpeg;base64,'+logoDosTrans , 10, 10, {width: 40})
        }else{
            if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro && queryImageProject[0].logoCinco && queryImageProject[0].logoSeis ){
                doc.moveDown()
                .image('data:image/jpeg;base64,'+logoUnoTrans , 10, 10, {width: 40})
                .image('data:image/jpeg;base64,'+logoDosTrans , 10, 10, {width: 40})
            }else{
                if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro && queryImageProject[0].logoCinco ){
                    doc.moveDown()
                    .image('data:image/jpeg;base64,'+logoUnoTrans , 30, 10, {width: 40})
                    .image('data:image/jpeg;base64,'+logoDosTrans , 130, 10, {width: 40})
                    .image('data:image/jpeg;base64,'+logoTresTrans , 230, 10, {width: 40})
                    .image('data:image/jpeg;base64,'+logoTresTrans , 340, 10, {width: 40})
                    .image('data:image/jpeg;base64,'+logoCincoTrans , 185, 466, {width: 40})
                }else{
                    if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro ){
                        doc.moveDown()
                        .image('data:image/jpeg;base64,'+logoUnoTrans , 30, 10, {width: 40})
                        .image('data:image/jpeg;base64,'+logoDosTrans , 130, 10, {width: 40})
                        .image('data:image/jpeg;base64,'+logoTresTrans , 230, 10, {width: 40})
                        .image('data:image/jpeg;base64,'+logoTresTrans , 340, 10, {width: 40})
                    }else{
                        if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres ){
                            doc.moveDown()
                            .image('data:image/jpeg;base64,'+logoUnoTrans , 50, 10, {width: 40})
                            .image('data:image/jpeg;base64,'+logoDosTrans , 170, 20, {width: 70, height:20})
                            .image('data:image/jpeg;base64,'+logoTresTrans , 320, 15, {width: 40, height:30})
                        }else{
                            if(queryImageProject[0].logoUno && queryImageProject[0].logoDos){
                                doc.moveDown()
                                .image('data:image/jpeg;base64,'+logoUnoTrans , 50, 10, {width: 40})
                                .image('data:image/jpeg;base64,'+logoDosTrans , 320, 10, {width: 40})
                            }else{
                                if(queryImageProject[0].logoUno){
                                    doc.moveDown()
                                    .image('data:image/jpeg;base64,'+logoUnoTrans , 15, 15, {width: 380})
                                }
                            }
                        }
                    }
                }
            }
        } 
    } 


    doc.moveDown()
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Formato de Registro de Productor', 100, 90)

    doc.moveDown()
        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[0].num_item1, col1LeftPos, 120)
        .text(questionsProducer[0].title1, col2LeftPos, 120)
        .text(questionsProducer[0].num_item2, col1LeftPos, 135)
        .text(questionsProducer[0].title2, col2LeftPos, 135)
        .text(questionsProducer[0].num_item3, col1LeftPos, 150)
        .text(questionsProducer[0].title3, col2LeftPos, 150)
        .fontSize(7)
        .text(questionsProducer[0].description2, col1LeftPos, 160)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta1}` , col1LeftPos, 175)

    
        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[1].num_item1, col1LeftPos, 195)
        .text(questionsProducer[1].title1, col2LeftPos, 195)
        .text(questionsProducer[1].num_item2, col1LeftPos, 210)
        .text(questionsProducer[1].title2, col2LeftPos, 210)
        .text(questionsProducer[1].num_item3, col1LeftPos, 225)
        .text(questionsProducer[1].title3, col2LeftPos, 225)
        .fontSize(7)
        .text(questionsProducer[1].description2, col1LeftPos, 235)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta2}`, col1LeftPos, 255)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[2].num_item1, col1LeftPos, 275)
        .text(questionsProducer[2].title1, col2LeftPos, 275)
        .text(questionsProducer[2].num_item2, col1LeftPos, 290)
        .text(questionsProducer[2].title2, col2LeftPos, 290)
        .text(questionsProducer[2].num_item3, col1LeftPos, 305)
        .text(questionsProducer[2].title3, col2LeftPos, 305)
        .fontSize(7)
        .text(questionsProducer[2].description2, col1LeftPos, 315)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta3}`, col1LeftPos, 335)

        
        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[3].num_item1, col1LeftPos, 355)
        .text(questionsProducer[3].title1, col2LeftPos, 355)
        .fontSize(7)
        .text(questionsProducer[3].description2, col1LeftPos, 370)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta4}`, col1LeftPos, 390)
        .text(`____________________________________`, col1LeftPos,395)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[4].num_item1, col1LeftPos, 415)
        .text(questionsProducer[4].title1, col2LeftPos, 415)
        .text(questionsProducer[4].num_item2, col1LeftPos, 430)
        .text(questionsProducer[4].title2, col2LeftPos, 430)
        .fontSize(7)
        .text(questionsProducer[4].description2, col1LeftPos, 440)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta5}`, col1LeftPos, 470)

    //---------------------------------------------------- New PAGE --------------------------------------------------

    doc.addPage()
        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[5].num_item1, col1LeftPos, 30)
        .text(questionsProducer[5].title1, col2LeftPos, 30)
        .fontSize(7)
        .text(questionsProducer[5].description1, col1LeftPos, 45)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta6}`, col1LeftPos, 70)

        .text(`____________________________________`, col1LeftPos, 80)

        .fontSize(9)
        .font('Helvetica')
        .text("1.1.4", col1LeftPos, 100)
        .text("Uso de Buenas Prácticas Ganaderas", col2LeftPos, 100)
        .fontSize(9)
        .text("1.1.4.1", col1LeftPos, 115)
        .text("¿Cuál es su estado actual con respecto a las BPG?", col2LeftPos, 115)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta7}`, col1LeftPos, 130)

        .fontSize(9)
        .font('Helvetica')
        .text("1.1.4.2", col1LeftPos, 150)
        .text("¿Con relación al manejo sanitario?:", col2LeftPos, 150)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta8}`, col1LeftPos, 165)

        .fontSize(9)
        .font('Helvetica')
        .text("1.1.4.3", col1LeftPos, 185)
        .text("¿Cómo maneja el sistema de nutrición de su producción?", col2LeftPos, 185)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta9}`, col1LeftPos, 200)

        .fontSize(9)
        .font('Helvetica')
        .text("1.1.4.4", col1LeftPos, 220)
        .text("¿Implementa manejo genético y reproductivo en su predio?", col2LeftPos, 220)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta10}`, col1LeftPos, 235)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[6].num_item1, col1LeftPos, 265)
        .text(questionsProducer[6].title1, col2LeftPos, 265)
        .fontSize(7)
        .text(questionsProducer[6].description2, col1LeftPos, 280)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta11}`, col1LeftPos, 295)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[7].num_item1, col1LeftPos, 315)
        .text(questionsProducer[7].title1, col2LeftPos, 315)
        .fontSize(7)
        .text(questionsProducer[7].description2, col1LeftPos, 330)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta12}`, col1LeftPos, 350)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[8].num_item1, col1LeftPos, 365)
        .text(questionsProducer[8].title1, col2LeftPos, 365)
        .text(questionsProducer[8].num_item2, col1LeftPos, 380)
        .text(questionsProducer[8].title2, col2LeftPos, 380)
        .fontSize(7)
        .text(questionsProducer[8].description2, col1LeftPos, 395)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta13}`, col1LeftPos, 415)

    /* -------------------------------------------------NEW PAGE------------------------------------------------------- */
    doc.addPage()
        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[9].num_item1, col1LeftPos, 30)
        .text(questionsProducer[9].title1, col2LeftPos, 30)
        .text(questionsProducer[9].num_item2, col1LeftPos, 45)
        .text(questionsProducer[9].title2, col2LeftPos, 45)
        .fontSize(7)
        .text(questionsProducer[9].description2, col1LeftPos, 60)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta14}`, col1LeftPos, 80) 
        
        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[10].num_item1, col1LeftPos, 95)
        .text(questionsProducer[10].title1, col2LeftPos, 95)
        .text(questionsProducer[10].num_item2, col1LeftPos, 110)
        .text(questionsProducer[10].title2, col2LeftPos, 110)
        .fontSize(7)
        .text(questionsProducer[10].description2, col1LeftPos, 125)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta15}`, col1LeftPos, 140)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[11].num_item1, col1LeftPos, 160)
        .text(questionsProducer[11].title1, col2LeftPos, 160)
        .fontSize(7)
        .text(questionsProducer[11].description2, col1LeftPos, 175)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta16}`, col1LeftPos, 195)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[12].num_item1, col1LeftPos, 215)
        .text(questionsProducer[12].title1, col2LeftPos, 215)
        .text(questionsProducer[12].num_item2, col1LeftPos, 230)
        .text(questionsProducer[12].title2, col2LeftPos, 230)
        .fontSize(7)
        .text(questionsProducer[12].description2, col1LeftPos, 245)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta17}`, col1LeftPos, 265)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[13].num_item1, col1LeftPos, 285)
        .text(questionsProducer[13].title1, col2LeftPos, 285)
        .fontSize(7)
        .text(questionsProducer[13].description2, col1LeftPos, 300)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta18}`, col1LeftPos, 320)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[14].num_item1, col1LeftPos, 335)
        .text(questionsProducer[14].title1, col2LeftPos, 335)
        .text(questionsProducer[14].num_item2, col1LeftPos, 350)
        .text(questionsProducer[14].title2, col2LeftPos, 350)
        .fontSize(7)
        .text(questionsProducer[14].description2, col1LeftPos, 365)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta19}`, col1LeftPos, 380)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[15].num_item1, col1LeftPos, 400)
        .text(questionsProducer[15].title1, col2LeftPos, 400)
        .fontSize(7)
        .text(questionsProducer[15].description1, col1LeftPos, 415)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta20}`, col1LeftPos, 435)


    /* -------------------------------------------------NEW PAGE------------------------------------------------------- */
    doc.addPage()
        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[16].num_item1, col1LeftPos, 30)
        .text(questionsProducer[16].title1, col2LeftPos, 30)
        .text(questionsProducer[16].num_item2, col1LeftPos, 50)
        .text(questionsProducer[16].title2, col2LeftPos, 50)
        .fontSize(7)
        .text(questionsProducer[16].description2, col1LeftPos, 60)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta21}`, col1LeftPos, 75)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[17].num_item1, col1LeftPos, 95)
        .text(questionsProducer[17].title1, col2LeftPos, 95)
        .fontSize(7)
        .text(questionsProducer[17].description2, col1LeftPos, 110)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta22}`, col1LeftPos, 125)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[18].num_item1, col1LeftPos, 145)
        .text(questionsProducer[18].title1, col2LeftPos, 145)
        .text(questionsProducer[18].num_item2, col1LeftPos, 160)
        .text(questionsProducer[18].title2, col2LeftPos, 160)
        .fontSize(7)
        .text(questionsProducer[18].description2, col1LeftPos, 175)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta23}`, col1LeftPos, 195)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[19].num_item1, col1LeftPos, 210)
        .text(questionsProducer[19].title1, col2LeftPos, 210)
        .text(questionsProducer[19].num_item2, col1LeftPos, 225)
        .text(questionsProducer[19].title2, col2LeftPos, 225)
        .fontSize(7)
        .text(questionsProducer[19].description2, col1LeftPos, 240)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta24}`, col1LeftPos, 270)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[20].num_item1, col1LeftPos, 285)
        .text(questionsProducer[20].title1, col2LeftPos, 285)
        .text(questionsProducer[20].num_item2, col1LeftPos, 300)
        .text(questionsProducer[20].title2, col2LeftPos, 300)
        .fontSize(7)
        .text(questionsProducer[20].description2, col1LeftPos, 315)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta25}`, col1LeftPos, 335)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[21].num_item1, col1LeftPos, 350)
        .text(questionsProducer[21].title1, col2LeftPos, 350)
        .text(questionsProducer[21].num_item2, col1LeftPos, 365)
        .text(questionsProducer[21].title2, col2LeftPos, 365)
        .fontSize(7)
        .text(questionsProducer[21].description2, col1LeftPos, 380)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta26}`, col1LeftPos, 400)

    /* -------------------------------------------------NEW PAGE------------------------------------------------------- */
    doc.addPage()
        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[22].num_item1, col1LeftPos, 30)
        .text(questionsProducer[22].title1, col2LeftPos, 30)
        .text(questionsProducer[22].num_item2, col1LeftPos, 45)
        .text(questionsProducer[22].title2, col2LeftPos, 45)
        .fontSize(7)
        .text(questionsProducer[22].description2, col1LeftPos, 60)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta27}`, col1LeftPos, 80)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[23].num_item1, col1LeftPos, 100)
        .text(questionsProducer[23].title1, col2LeftPos, 100)
        .text(questionsProducer[23].num_item2, col1LeftPos, 115)
        .text(questionsProducer[23].title2, col2LeftPos, 115)
        .fontSize(7)
        .text(questionsProducer[23].description2, col1LeftPos, 130)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta28}`, col1LeftPos, 145)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[24].num_item1, col1LeftPos, 165)
        .text(questionsProducer[24].title1, col2LeftPos, 165)
        .text(questionsProducer[24].num_item2, col1LeftPos, 180)
        .text(questionsProducer[24].title2, col2LeftPos, 180)
        .text(questionsProducer[24].num_item3, col1LeftPos, 195)
        .text(questionsProducer[24].title3, col2LeftPos, 195)
        .fontSize(7)
        .text(questionsProducer[12].description2, col1LeftPos, 210)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta29}`, col1LeftPos, 230)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[25].num_item1, col1LeftPos, 250)
        .text(questionsProducer[25].title1, col2LeftPos, 250)
        .text(questionsProducer[25].num_item2, col1LeftPos, 265)
        .text(questionsProducer[25].title2, col2LeftPos, 265)
        .fontSize(7)
        .text(questionsProducer[25].description2, col1LeftPos, 280)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta30}`, col1LeftPos, 300)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[26].num_item1, col1LeftPos, 320)
        .text(questionsProducer[26].title1, col2LeftPos, 320)
        .text(questionsProducer[26].num_item2, col1LeftPos, 335)
        .text(questionsProducer[26].title2, col2LeftPos, 335)
        .fontSize(7)
        .text(questionsProducer[26].description2, col1LeftPos, 350)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta31}`, col1LeftPos, 370)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[27].num_item1, col1LeftPos, 390)
        .text(questionsProducer[27].title1, col2LeftPos, 390)
        .text(questionsProducer[27].num_item2, col1LeftPos, 405)
        .text(questionsProducer[27].title2, col2LeftPos, 405)
        .fontSize(7)
        .text(questionsProducer[27].description2, col1LeftPos, 425)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta32}`, col1LeftPos, 445)
        .fontSize(9)

    /* -------------------------------------------------NEW PAGE------------------------------------------------------- */
    doc.addPage()
        .font('Helvetica')
        .text(questionsProducer[28].num_item1, col1LeftPos, 30)
        .text(questionsProducer[28].title1, col2LeftPos, 30)
        .text(questionsProducer[28].num_item2, col1LeftPos, 45)
        .text(questionsProducer[28].title2, col2LeftPos, 45)
        .fontSize(7)
        .text(questionsProducer[28].description2, col1LeftPos, 60)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta33}`, col1LeftPos, 80)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[29].num_item1, col1LeftPos, 100)
        .text(questionsProducer[29].title1, col2LeftPos, 100)
        .text(questionsProducer[29].num_item2, col1LeftPos, 115)
        .text(questionsProducer[29].title2, col2LeftPos, 115)
        .text(questionsProducer[29].num_item3, col1LeftPos, 130)
        .text(questionsProducer[29].title3, col2LeftPos, 130)
        .fontSize(7)
        .text(questionsProducer[29].description2, col1LeftPos, 155)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta34}`, col1LeftPos, 175)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[30].num_item1, col1LeftPos, 195)
        .text(questionsProducer[30].title1, col2LeftPos, 195)
        .text(questionsProducer[30].num_item2, col1LeftPos, 210)
        .text(questionsProducer[30].title2, col2LeftPos, 210)
        .fontSize(7)
        .text(questionsProducer[30].description2, col1LeftPos, 235)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta35}`, col1LeftPos, 255)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[31].num_item1, col1LeftPos, 275)
        .text(questionsProducer[31].title1, col2LeftPos, 275)
        .fontSize(7)
        .text(questionsProducer[31].description2, col1LeftPos, 290)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta36}`, col1LeftPos, 310)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[32].num_item1, col1LeftPos, 330)
        .text(questionsProducer[32].title1, col2LeftPos, 330)
        .text(questionsProducer[32].num_item2, col1LeftPos, 345)
        .text(questionsProducer[32].title2, col2LeftPos, 345)
        .fontSize(7)
        .text(questionsProducer[32].description2, col1LeftPos, 370)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta37}`, col1LeftPos, 390)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[33].num_item1, col1LeftPos, 410)
        .text(questionsProducer[33].title1, col2LeftPos, 410)
        .fontSize(7)
        .text(questionsProducer[33].description2, col1LeftPos, 430)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta38}`, col1LeftPos, 450)

    /* -------------------------------------------------NEW PAGE------------------------------------------------------- */
    doc.addPage()
        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[34].num_item1, col1LeftPos, 30)
        .text(questionsProducer[34].title1, col2LeftPos, 30)
        .fontSize(7)
        .text(questionsProducer[34].description2, col1LeftPos, 55)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta39}`, col1LeftPos, 75)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[35].num_item1, col1LeftPos, 95)
        .text(questionsProducer[35].title1, col2LeftPos, 95)
        .text(questionsProducer[35].num_item2, col1LeftPos, 110)
        .text(questionsProducer[35].title2, col2LeftPos, 110)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta40}`, col1LeftPos, 125)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[36].num_item1, col1LeftPos, 140)
        .text(questionsProducer[36].title1, col2LeftPos, 140)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta41}`, col1LeftPos, 155)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[37].num_item1, col1LeftPos, 175)
        .text(questionsProducer[37].title1, col2LeftPos, 175)
        .fontSize(7)
        .text(questionsProducer[37].description1, col1LeftPos, 190)
        .fontSize(9)
        .text(questionsProducer[37].num_item2, col1LeftPos, 210)
        .text(questionsProducer[37].title2, col2LeftPos, 210)
        .text(questionsProducer[37].num_item3, col1LeftPos, 225)
        .text(questionsProducer[37].title3, col2LeftPos, 225)
        .fontSize(7)
        .text(questionsProducer[37].description2, col1LeftPos, 240)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta42}`, col1LeftPos, 260)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[38].num_item1, col1LeftPos, 280)
        .text(questionsProducer[38].title1, col2LeftPos, 280)
        .text(questionsProducer[38].num_item2, col1LeftPos, 295)
        .text(questionsProducer[38].title2, col2LeftPos, 295)
        .fontSize(7)
        .text(questionsProducer[38].description2, col1LeftPos, 310)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta43}`, col1LeftPos, 330)

        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[39].num_item1, col1LeftPos, 350)
        .text(questionsProducer[39].title1, col2LeftPos, 350)
        .text(questionsProducer[39].num_item2, col1LeftPos, 365)
        .text(questionsProducer[39].title2, col2LeftPos, 365)
        .fontSize(7)
        .text(questionsProducer[39].description2, col1LeftPos, 385)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta44}`, col1LeftPos, 405)

    /* -------------------------------------------------NEW PAGE------------------------------------------------------- */
    doc.addPage()
        .fontSize(9)
        .font('Helvetica')
        .text(questionsProducer[40].num_item1, col1LeftPos, 60)
        .text(questionsProducer[40].title1, col2LeftPos, 60)
        .text(questionsProducer[40].num_item2, col1LeftPos, 75)
        .text(questionsProducer[40].title2, col2LeftPos, 75)
        .fontSize(7)
        .text(questionsProducer[40].description2, col1LeftPos, 90)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta45}`, col1LeftPos, 110)

        doc.moveDown()
        .fontSize(9)
        .font('Helvetica')
        .text(`Fecha de Apliaccion: ${dataFarm[0].time_creation}`, col1LeftPos, 150)
        .text(`Nombre: ${dataFarm[0].firstName} ${dataFarm[0].secondName} ${dataFarm[0].firstSurname} ${dataFarm[0].secondSurname}`, col1LeftPos, 175)
        .text(`Fecha Nacimiento: ${dataFarm[0].birthdate}`, col1LeftPos, 190)
        .text(`Teléfono: ${dataFarm[0].celphone1}`, col1LeftPos, 205)
        .text(`Identificacion Usuario: ${dataFarm[0].nitProducer}`, col1LeftPos, 220)
        .text(`Municipio: ${dataFarm[0].municipality}`, col1LeftPos, 235)
        .text(`Corregimiento: ${dataFarm[0].corregimiento}`, col1LeftPos, 250)
        .text(`Vereda: ${dataFarm[0].vereda}`, col1LeftPos, 265)
        .text(`Nombre: ${dataFarm[0].nameFarm}`, col1LeftPos, 280)


        //.image('data:image/jpeg;base64,'+imgFarmerSignature, 130, 315, {width: 160})
        //.text('Firma del titular del predio', 153, 400)

    doc.pipe(res)
    doc.end() 


})

router.get('/downloadProducerRegisterPiscicola/:id', isLoggedIn, async (req, res) => {

    let col1LeftPos = 20;
    let col2LeftPos = col1LeftPos+40;

    const answersProducerPiscicola = await pool.query('SELECT * FROM answerproducerpiscicola WHERE farm_id_pis = ?', [req.params.id]);
    const queryImageProject = await pool.query('SELECT * FROM projects WHERE id_project = ?', [req.session.project.project])
    const dataFarm = await pool.query('SELECT img_beneficiario, firstName, secondName, firstSurname, secondSurname, nitProducer, celphone1, municipality, corregimiento, birthdate, vereda, time_creation, nameFarm, imgSignature FROM farm WHERE id_farm = ?', [req.params.id])


    let imgFarmerSignature = await new Promise(function(resolve,reject){
        imageToBase64(dataFarm[0].imgSignature) // you can also to use url
        .then(
            (response) => {resolve(response);}
        )
        .catch(
            (error) => {
                resolve(false);
                console.log(error); 
            }
        ) 
    });
    //Logos transformacion
    if(queryImageProject[0].logoUno){
        logoUnoTrans = await new Promise(function(resolve,reject){
            imageToBase64(queryImageProject[0].logoUno) // you can also to use url
            .then(
                (response) => {resolve(response);}
            )
            .catch(
                (error) => {
                    resolve(false);
                    console.log(error); 
                }
            ) 
        });
    }

    let answers ={};

    //console.log('answerProducerPiscicola', answersProducerPiscicola)

    for(let i=0; i<answersProducerPiscicola.length; i++){
        let cont = 0;

        if(answersProducerPiscicola[i].respuesta1 === 'A'){
            answers.respuesta1 = 'De subsistencia'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta1 === 'B'){
            answers.respuesta1 = 'De investigación'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta1 === 'C'){
            answers.respuesta1 = 'Deportiva'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta1 === 'D'){
            answers.respuesta1 = 'Comercial'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta2 === 'A'){
            answers.respuesta2 = 'Pesca continental, que podrá ser fluvial o lacustre'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta2 === 'B'){
            answers.respuesta2 = 'Pesca marina, que podrá ser costera, de bajura o de altura.'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta3 === 'A'){
            answers.respuesta3 = 'Pesca de Altura'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta3 === 'B'){
            answers.respuesta3 = 'Pesca de bajura.'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta4 === 'A'){
            answers.respuesta4 = 'Subsistencia'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta4 === 'B'){
            answers.respuesta4 = 'Ocasional'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta4 === 'C'){
            answers.respuesta4 = 'Estacional'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta4 === 'D'){
            answers.respuesta4 = 'Permanente'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta5 === 'A'){
            answers.respuesta5 = 'Embarcación de casco de madera o fibra con canalete de menos de 25 pies de eslora '
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta5 === 'B'){
            answers.respuesta5 = 'Embarcación de casco de madera o fibra con motor fuera de borda hasta 27 pies de eslora'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta5 === 'C'){
            answers.respuesta5 = 'Embarcación de casco de madera o fibra con motor interno /o fuera de borda de 38 pies o más de eslora'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta5 === 'D'){
            answers.respuesta5 = 'Embarcación de casco de hierro con motor interno de más de 40 pies de eslora'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta6 === 'A'){
            answers.respuesta6 = 'No tiene línea segundaria definida'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta6 === 'B'){
            answers.respuesta6 = 'Temporal o no especializada '
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta6 === 'C'){
            answers.respuesta6 = 'Como complemento de la actividad principal.'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta6 === 'D'){
            answers.respuesta6 = 'Con enfoque de agronegocio'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta7 === 'A'){
            answers.respuesta7 = 'Línea de Mano.'
        }if(answersProducerPiscicola[i].respuesta7 === 'B'){
            answers.respuesta7 = 'Vara o caña de pescar'
        }if(answersProducerPiscicola[i].respuesta7 === 'C'){
            answers.respuesta7 = 'Flecha'
        }if(answersProducerPiscicola[i].respuesta7 === 'D'){
            answers.respuesta7 = 'Nasa'
        }if(answersProducerPiscicola[i].respuesta7 === 'E'){
            answers.respuesta7 = 'Cóngolo'
        }if(answersProducerPiscicola[i].respuesta7 === 'F'){
            answers.respuesta7 = 'Atarraya'
        }if(answersProducerPiscicola[i].respuesta7 === 'G'){
            answers.respuesta7 = 'Redes de tiro'
        }if(answersProducerPiscicola[i].respuesta7 === 'H'){
            answers.respuesta7 = 'Redes de arrastre'
        }if(answersProducerPiscicola[i].respuesta7 === 'I'){
            answers.respuesta7 = 'Redes agalleras o de enmalle'
        }if(answersProducerPiscicola[i].respuesta7 === 'J'){
            answers.respuesta7 = 'Palangre y línea de mano considerando sus denominaciones respectivamente'
        }if(answersProducerPiscicola[i].respuesta7 === 'K'){
            answers.respuesta7 = 'Polivalentes'
        }
        
        if(answersProducerPiscicola[i].respuesta8 === 'A'){
            answers.respuesta8 = 'Dos'
        }if(answersProducerPiscicola[i].respuesta8 === 'B'){
            answers.respuesta8 = 'Entre 3 Y 5.'
        }if(answersProducerPiscicola[i].respuesta8 === 'C'){
            answers.respuesta8 = 'Más De 5.'
        }

        if(answersProducerPiscicola[i].respuesta9 === 'A'){
            answers.respuesta9 = 'MAL ESTADO'
        }if(answersProducerPiscicola[i].respuesta9 === 'B'){
            answers.respuesta9 = 'REGULAR ESTADO'
        }if(answersProducerPiscicola[i].respuesta9 === 'C'){
            answers.respuesta9 = 'OPTIMO ESTADO'
        }
        
        if(answersProducerPiscicola[i].respuesta10 === 'A'){
            answers.respuesta10 = 'De 0 a 4,9 kilos '
        }if(answersProducerPiscicola[i].respuesta10 === 'B'){
            answers.respuesta10 = 'De 5 a 9,9 kilos'
        }if(answersProducerPiscicola[i].respuesta10 === 'C'){
            answers.respuesta10 = 'De 10 a 40 kilos'
        }if(answersProducerPiscicola[i].respuesta10 === 'D'){
            answers.respuesta10 = 'Mas de 40 kilos '
        }

        

        if(answersProducerPiscicola[i].respuesta11 === 'A'){
            answers.respuesta11 = 'De 0 a 145 SMMLV.'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta11 === 'B'){
            answers.respuesta11 = '146 a 5.000 SMMLV. Mediano Productor.'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta11 === 'C'){
            answers.respuesta11 = 'Superior a 5.000 SMMLV. Gran Productor'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta12 === 'A'){
            answers.respuesta12 = 'No posee BPP ni le interesa'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta12 === 'B'){
            answers.respuesta12 = 'Conoce las BPP, pero no las implementa'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta12 === 'C'){
            answers.respuesta12 = 'En trámite proceso de BPP'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta12 === 'D'){
            answers.respuesta12 = 'Cuenta con certificación de BPP'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta12 === 'E'){
            answers.respuesta12 = 'Realiza y/o implementa buenas prácticas pesqueras '
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta13 === 'A'){
            answers.respuesta13 = 'Salado.'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta13 === 'B'){
            answers.respuesta13 = 'Hielo.'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta14 === 'A'){
            answers.respuesta14 = 'Asfixia'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta14 === 'B'){
            answers.respuesta14 = 'Golpe'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta14 === 'C'){
            answers.respuesta14 = 'Shock Térmico'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta15 === 'A'){
            answers.respuesta15 = 'NO CUMPLE 0%'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta15 === 'B'){
            answers.respuesta15 = 'CUMPLE 50%'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta15 === 'C'){
            answers.respuesta15 = 'CUMPLE 75%'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta15 === 'D'){
            answers.respuesta15 = 'CUMPLE 100%'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta16 === 'A'){
            answers.respuesta16 = 'NUNCA'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta16 === 'B'){
            answers.respuesta16 = 'ALGUNAS VECES'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta16 === 'C'){
            answers.respuesta16 = 'SIEMPRE'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta17 === 'A'){
            answers.respuesta17 = 'LOS ECHA AL MAR'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta17 === 'B'){
            answers.respuesta17 = 'LOS LLEVA A TIERRA PARA USARLO EN OTRAS ACTIVIDADES'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta17 === 'C'){
            answers.respuesta17 = 'OTRAS'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta18 === 'A'){
            answers.respuesta18 = 'Nunca'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta18 === 'B'){
            answers.respuesta18 = 'Algunas veces'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta18 === 'C'){
            answers.respuesta18 = 'Siempre'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta19 === 'A'){
            answers.respuesta19 = 'MUJERES DE LA COMUNIDAD'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta19 === 'B'){
            answers.respuesta19 = 'FAMILIARES '
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta19 === 'C'){
            answers.respuesta19 = 'INTERMEDIARIOS '
            cont = cont+1
        }

                
        if(answersProducerPiscicola[i].respuesta20 === 'A'){
            answers.respuesta20 = 'SI'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta20 === 'B'){
            answers.respuesta20 = 'NO'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta21 === 'A'){
            answers.respuesta21 = 'Sitio de desembarco o playa'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta21 === 'B'){
            answers.respuesta21 = 'Mercado local'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta21 === 'B'){
            answers.respuesta21 = 'Mercado regional'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta21 === 'B'){
            answers.respuesta21 = 'Mercado nacional'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta22 === 'A'){
            answers.respuesta22 = 'Transformación de los recursos pesqueros con marca propia, empaque y permisos de entidades.'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta22 === 'B'){
            answers.respuesta22 = 'Proceso de transformación de los recursos pesqueros, con marca y empaque propio, pero no tienen permiso o están en trámites.'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta22 === 'C'){
            answers.respuesta22 = 'Transformación de los recursos pesqueros, pero no cuentan con marca, ni empaque ni permiso'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta22 === 'C'){
            answers.respuesta22 = 'No realiza transformación de los recursos pesqueros'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta23 === 'A'){
            answers.respuesta23 = 'No lleva ningún tipo de registro'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta23 === 'B'){
            answers.respuesta23 = 'Manejo de registros manuales'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta23 === 'C'){
            answers.respuesta23 = 'Usa software para el manejo de los registros'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta23 === 'D'){
            answers.respuesta23 = 'Utiliza software para el manejo técnico y productivo'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta24 === 'A'){
            answers.respuesta24 = 'no lleva ningún tipo de registro'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta24 === 'B'){
            answers.respuesta24 = 'manejo de registros manuales'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta24 === 'C'){
            answers.respuesta24 = 'usa software para el manejo de los registros'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta24 === 'D'){
            answers.respuesta24 = 'utiliza software para el manejo técnico y productivo'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta25 === 'A'){
            answers.respuesta25 = 'No tiene ninguna'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta25 === 'B'){
            answers.respuesta25 = 'Personal no cuenta con capacitación ni certificación para realizar actividades de faenas de pesca, pero tiene experiencia'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta25 === 'C'){
            answers.respuesta25 = 'Personal calificado, certificado y con experticia en las faenas de pesca'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta26 === 'A'){
            answers.respuesta26 = 'Desconoce el portafolio de los servicios bancarios para los créditos del sector'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta26 === 'B'){
            answers.respuesta26 = 'Conoce la oferta bancaria pero no ha solicitado el crédito.'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta26 === 'C'){
            answers.respuesta26 = 'Ha tramitado, pero no ha sido aprobado el crédito'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta26 === 'D'){
            answers.respuesta26 = 'Tramitado y ha sido probado crédito bancario'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta27 === 'A'){
            answers.respuesta27 = 'Menos de 284slmv'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta27 === 'B'){
            answers.respuesta27 = 'Entre 284 a 5000 slmv'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta27 === 'C'){
            answers.respuesta27 = 'Superior a 5000 slmv'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta28 === 'A'){
            answers.respuesta28 = 'Hasta 22 toneladas/ año'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta28 === 'B'){
            answers.respuesta28 = 'Entre 22.1 a 240 toneladas/año'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta28 === 'C'){
            answers.respuesta28 = 'más de 240 toneladas/año'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta29 === 'A'){
            answers.respuesta29 = 'No se encuentra vinculado a ninguna figura asociativa'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta29 === 'B'){
            answers.respuesta29 = 'Junta de acción comunal'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta29 === 'C'){
            answers.respuesta29 = 'Alguna figura asociativa nivel veredal, municipal o departamental'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta29 === 'D'){
            answers.respuesta29 = 'Gremio nivel regional o nacional'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta30 === 'A'){
            answers.respuesta30 = 'Sin participación'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta30 === 'B'){
            answers.respuesta30 = 'Eventual'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta30 === 'C'){
            answers.respuesta30 = 'Frecuente'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta30 === 'D'){
            answers.respuesta30 = 'Activo'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta31 === 'A'){
            answers.respuesta31 = 'No hace parte de ninguna apuesta de carácter asociativo y no genera procesos de emprendimiento'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta31 === 'Han generados nuevas apuestas asociativas que conllevaron a proyectos de emprendimiento '){
            answers.respuesta31 = 'Algunas'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta31 === 'Dentro de las figuras de carácter asociativo existentes y de las cuales es miembro se han consolidados proyectos de emprendimientos'){
            answers.respuesta31 = 'Ninguna'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta31 === 'D'){
            answers.respuesta31 = 'Como pescador artesanal individual ha generado proyectos de emprendimiento '
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta32 === 'A'){
            answers.respuesta32 = 'No se cuenta con aliados estratégicos para la comercialización'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta32 === 'B'){
            answers.respuesta32 = 'o acuerdos de compra, que generan la posibilidad de comercialización de los recursos pesqueros, pero que se definen en cuanto a volumen y precios en el momento de desembarco en el sitio de pesca '
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta32 === 'C'){
            answers.respuesta32 = 'Alianza de carácter comercial que garantizan comprador y precios, con actores del nivel local'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta32 === 'D'){
            answers.respuesta32 = 'Alianza de carácter comercial que garantizan comprador, distribución y precios, con actores del nivel regional y nacional'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta33 === 'A'){
            answers.respuesta33 = 'No cuenta con el servicio de asistencia técnica '
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta33 === 'B'){
            answers.respuesta33 = 'UMATA y/o EPSEAS, empresas descentralizadas del gobierno'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta33 === 'C'){
            answers.respuesta33 = 'Profesional particular y/o profesional del área comercial '
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta33 === 'C'){
            answers.respuesta33 = 'Gremio y/o profesional particular'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta34 === 'A'){
            answers.respuesta34 = 'No tiene conocimiento de la importancia de acceder y de certificarse'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta34 === 'B'){
            answers.respuesta34 = 'Tiene conocimiento de importancia de estar certificado y ha iniciado el proceso para acceder a estos'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta34 === 'C'){
            answers.respuesta34 = 'Tiene conocimiento de la importancia del certificado de calidad'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta35 === 'A'){
            answers.respuesta35 = 'No conoce'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta35 === 'B'){
            answers.respuesta35 = 'No le interesa '
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta35 === 'C'){
            answers.respuesta35 = 'Está en proceso'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta35 === 'D'){
            answers.respuesta35 = 'Cuenta con certificación'
            cont = cont+1
        }

        
        if(answersProducerPiscicola[i].respuesta36 === 'A'){
            answers.respuesta36 = 'no tiene acceso la información'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta36 === 'B'){
            answers.respuesta36 = 'tiene acceso parcial a la información'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta36 === 'C'){
            answers.respuesta36 = 'tiene acceso total a esta información'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta37 === 'A'){
            answers.respuesta37 = 'No tiene acceso a herramientas de información y comunicación'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta37 === 'B'){
            answers.respuesta37 = 'Tiene acceso a mínimo a una (1) herramienta de información y comunicación'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta37 === 'C'){
            answers.respuesta37 = 'Tiene acceso a mínimo tres (3) herramientas de información y comunicación'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta37 === 'D'){
            answers.respuesta37 = 'Tiene acceso a mínimo cinco (5) herramientas de información y comunicación'
            cont = cont+1
        }
        
        if(answersProducerPiscicola[i].respuesta38 === 'A'){
            answers.respuesta38 = 'Nunca'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta38 === 'B'){
            answers.respuesta38 = 'Muy poco'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta38 === 'C'){
            answers.respuesta38 = 'casi siempre'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta38 === 'D'){
            answers.respuesta38 = 'Siempre'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta39 === 'A'){
            answers.respuesta39 = 'no maneja las herramientas existentes'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta39 === 'B'){
            answers.respuesta39 = 'maneja parcialmente las herramientas existentes y desconoce las fuentes de información'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta39 === 'C'){
            answers.respuesta39 = 'maneja parcialmente las herramientas existentes, pero conoce las fuentes de información'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta39 === 'D'){
            answers.respuesta39 = 'maneja plenamente las herramientas existentes y conoce las fuentes de información'
            cont = cont + 1
}
        
        if(answersProducerPiscicola[i].respuesta40 === 'A'){
            answers.respuesta40 = 'no le interesa'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta40=== 'B'){
            answers.respuesta40 = 'comparte conocimiento'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta40=== 'C'){
            answers.respuesta40 = 'participa en nuevas apuestas'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta40=== 'D'){
            answers.respuesta40 = 'innova con los conocimientos adquiridos'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta41 === 'A'){
            answers.respuesta41 = 'NO CONOCE NI IMPLEMENTA '
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta41 === 'B'){
            answers.respuesta41 = 'CONOCE, PERO NO IMPLEMENTA'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta41 === 'C'){
            answers.respuesta41 = 'CUENTA E IMPLEMENTA PLAN DE CONSERVACION'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta42 === 'A'){
            answers.respuesta42 = 'No cuenta con permiso para realizar faenas de pesca'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta42 === 'B'){
            answers.respuesta42 = 'Está tramitando permiso para realizar faenas de pesca'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta42 === 'C'){
            answers.respuesta42 = 'Cuenta con permiso para realizar faenas de pesca en áreas permitidas'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta43 === 'A'){
            answers.respuesta43 = 'NUNCA'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta43 === 'B'){
            answers.respuesta43 = 'ALGUNAS VECES'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta43 === 'C'){
            answers.respuesta43 = 'CASI SIEMPRE'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta43 === 'D'){
            answers.respuesta43 = 'SIEMPRE'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta44 === 'A'){
            answers.respuesta44 = 'Si'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta44 === 'B'){
            answers.respuesta44 = 'No'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta45 === 'A'){
            answers.respuesta45 = 'NO CONOCE NI IMPLEMENTA'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta45 === 'B'){
            answers.respuesta45 = 'CONOCE, PERO NO IMPLEMENTA'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta45 === 'C'){
            answers.respuesta45 = 'IMPLEMENTA SIN PLANIFCACION'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta45 === 'D'){
            answers.respuesta45 = 'CUENTA E IMPLEMENTA PLAN DE CONSERVACION'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta46 === 'A'){
            answers.respuesta46 = 'No utiliza estrategias de adaptación al cambio y variedad climática '
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta46 === 'B'){
            answers.respuesta46 = 'Utiliza estrategias de adaptación al cambio y variedad climática'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta47 === 'A'){
            answers.respuesta47 = 'LA UEP no cuenta con los permisos de las entidades'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta47 === 'B'){
            answers.respuesta47 = 'LA UEP está tramitando permisos ante las entidades '
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta47 === 'C'){
            answers.respuesta47 = 'La UEP cuenta con los permisos de las entidades'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta48 === 'A'){
            answers.respuesta48 = 'apatía para ejercer liderazgos ante la comunidad y las entidades'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta48 === 'B'){
            answers.respuesta48 = 'participación en espacios institucionales, sociales y políticos no son su prioridad'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta48 === 'C'){
            answers.respuesta48 = 'Participación en congresos, asambleas giras, reuniones en negocios nacionales e internacionales '
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta48 === 'D'){
            answers.respuesta48 = 'Participa en giras, congresos internacionales del gremio pesquero artesanal'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta49 === 'A'){
            answers.respuesta49 = 'desconoce las herramientas de participación'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta49 === 'B'){
            answers.respuesta49 = 'reconoce las herramientas de participación, pero desconoce su alcance y aplicabilidad'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta49 === 'C'){
            answers.respuesta49 = 'reconoce las herramientas de participación y sus alcances, pero no su aplicabilidad '
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta49 === 'D'){
            answers.respuesta49 = 'reconoce las herramientas de participación su alcance y aplicabilidad'
            cont = cont+1
        }

        if(answersProducerPiscicola[i].respuesta50 === 'A'){
            answers.respuesta50 = 'desconoce el control social y las herramientas con que se cuenta para realizarlo '
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta50 === 'B'){
            answers.respuesta50 = 'conoce que es el control social, pero desconoce las herramientas con que se cuenta para realizarlo'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta50 === 'C'){
            answers.respuesta50 = 'entiende en que consiste el control social y conoce las herramientas con que se cuenta para realizarlo, pero desconoce su alcance y aplicabilidad'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta50 === 'D'){
            answers.respuesta50 = 'entiende el control social, así como las herramientas que lo permiten, su alcance y su aplicabilidad'
            cont = cont+1
        }


        if(answersProducerPiscicola[i].respuesta51 === 'A'){
            answers.respuesta51 = 'Se encuentran vinculados por la acción comunal pero no presentan acciones de gestión'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta51 === 'B'){
            answers.respuesta51 = 'Solo cuenta con la vinculación a las juntas de acción comunal su junta directiva es la encargada de gestionar los recursos y liderar procesos'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta51 === 'C'){
            answers.respuesta51 = 'No se encuentran conformados legalmente bajo una figura asociativa, pero se encuentran agrupados en la junta de acción comunal, sin embargo, dentro de la comunidad existen actividades de trabajo social y recolección de recursos para intereses colectivos'
            cont = cont+1
        }if(answersProducerPiscicola[i].respuesta51 === 'D'){
            answers.respuesta51 = 'Están conformado como cooperativas u otra figura asociativa formal o empresa privada'
            cont = cont+1
        }
              
     }

     
    
    let doc1 = new PDFDocument({
        layout: 'landscape',
        size: [510, 410],
        margin: 5,
        info:{
            title:'Formato de Registro de Productor',
            Author: 'Fundación AIP cloud'
        }
    })  

    let newName = dataFarm[0].firstName + " " + dataFarm[0].secondName+ " " + dataFarm[0].firstSurname + " " + dataFarm[0].secondSurname + "   " + dataFarm[0].nitProducer;
    doc1.info['Title'] = newName;

    if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro && queryImageProject[0].logoCinco && queryImageProject[0].logoSeis && queryImageProject[0].logoSiete && queryImageProject[0].logoOcho){
        doc1.moveDown()
        .image('data:image/jpeg;base64,'+logoUnoTrans , 10, 10, {width: 40})
        .image('data:image/jpeg;base64,'+logoDosTrans , 10, 10, {width: 40})
    }else{ 
        if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro && queryImageProject[0].logoCinco && queryImageProject[0].logoSeis && queryImageProject[0].logoSiete ){
            doc1.moveDown()
            .image('data:image/jpeg;base64,'+logoUnoTrans , 10, 10, {width: 40})
            .image('data:image/jpeg;base64,'+logoDosTrans , 10, 10, {width: 40})
        }else{
            if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro && queryImageProject[0].logoCinco && queryImageProject[0].logoSeis ){
                doc1.moveDown()
                .image('data:image/jpeg;base64,'+logoUnoTrans , 10, 10, {width: 40})
                .image('data:image/jpeg;base64,'+logoDosTrans , 10, 10, {width: 40})
            }else{
                if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro && queryImageProject[0].logoCinco ){
                    doc1.moveDown()
                    .image('data:image/jpeg;base64,'+logoUnoTrans , 30, 10, {width: 40})
                    .image('data:image/jpeg;base64,'+logoDosTrans , 130, 10, {width: 40})
                    .image('data:image/jpeg;base64,'+logoTresTrans , 230, 10, {width: 40})
                    .image('data:image/jpeg;base64,'+logoTresTrans , 340, 10, {width: 40})
                    .image('data:image/jpeg;base64,'+logoCincoTrans , 185, 466, {width: 40})
                }else{
                    if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres && queryImageProject[0].logoCuatro ){
                        doc1.moveDown()
                        .image('data:image/jpeg;base64,'+logoUnoTrans , 30, 10, {width: 40})
                        .image('data:image/jpeg;base64,'+logoDosTrans , 130, 10, {width: 40})
                        .image('data:image/jpeg;base64,'+logoTresTrans , 230, 10, {width: 40})
                        .image('data:image/jpeg;base64,'+logoTresTrans , 340, 10, {width: 40})
                    }else{
                        if(queryImageProject[0].logoUno && queryImageProject[0].logoDos && queryImageProject[0].logoTres ){
                            doc1.moveDown()
                            .image('data:image/jpeg;base64,'+logoUnoTrans , 50, 10, {width: 40})
                            .image('data:image/jpeg;base64,'+logoDosTrans , 170, 20, {width: 70, height:20})
                            .image('data:image/jpeg;base64,'+logoTresTrans , 320, 15, {width: 40, height:30})
                        }else{
                            if(queryImageProject[0].logoUno && queryImageProject[0].logoDos){
                                doc1.moveDown()
                                .image('data:image/jpeg;base64,'+logoUnoTrans , 50, 10, {width: 40})
                                .image('data:image/jpeg;base64,'+logoDosTrans , 320, 10, {width: 40})
                            }else{
                                if(queryImageProject[0].logoUno){
                                    doc1.moveDown()
                                    .image('data:image/jpeg;base64,'+logoUnoTrans , 15, 15, {width: 380})
                                }
                            }
                        }
                    }
                }
            }
        } 
    } 

    //console.log('answer', answers)

    doc1.moveDown()
    .fontSize(12)
    .font('Helvetica-Bold')
    .text('Formato de Registro de Productor', 100, 80)
    .text('Piscicola', 170, 95)

    doc1.moveDown()
        .fontSize(9)
        .font('Helvetica')
        .text(' 1.1 ', col1LeftPos, 120)
        .text(' DESARROLLO DE CAPACIDADES HUMANAS Y TÉCNICAS. ', col2LeftPos, 120)
        .text('1.1.1', col1LeftPos, 135)
        .text('Identificación de la actividad productiva principal.', col2LeftPos, 135)
        .text('1.1.1.1', col1LeftPos, 150)
        .text('De acuerdo a su actividad pesquera que realiza, se encontraría en cual línea según la finalidad:', col2LeftPos, 150)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta1}` , col1LeftPos, 175)


        .fontSize(9)
        .font('Helvetica')
        .text('1.1.1.2', col1LeftPos, 195)
        .text('Por el lugar donde realiza las faenas es:', col2LeftPos, 195)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta2}`, col1LeftPos, 210)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.1.3', col1LeftPos, 225)
        .text('Si es pesca Marina defina si es', col2LeftPos, 225)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta3}`, col1LeftPos, 240)

        
        .fontSize(9)
        .font('Helvetica')
        .text('1.1.1.4', col1LeftPos, 255)
        .text('Actividad Anual', col2LeftPos, 255)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta4}`, col1LeftPos, 270)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.1.5', col1LeftPos, 285)
        .text('CARACTERISTICA DE LA UNIDAD ECONOMICA DE PESCA (UEP)', col2LeftPos, 285)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`Respuesta: ${answers.respuesta5}`, col1LeftPos, 300)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.2', col1LeftPos, 325)
        .text('IDENTIFICACIÓN DE ACTIVIDADES PRODUCTIVAS SECUNDARIAS', col2LeftPos, 325)
        .fontSize(7)
        .text('1.1.2.1', col1LeftPos, 340)
        .text('El pescador presenta actividades secundarias con que enfoque o proyección', col2LeftPos, 340)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta6}`, col1LeftPos, 355)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.3', col1LeftPos, 370)
        .text('TIPO DE HERRAMIENTAS Y EQUIPOS EMPLEADOS EN LA FAENAS DE PESCA', col2LeftPos, 370)
        .fontSize(7)
        .text('1.1.3.1', col1LeftPos, 385)
        .text('Artes y a aparejos utilizados en sus faenas.', col2LeftPos, 385)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta7}`, col1LeftPos, 400)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.3.2', col1LeftPos, 415)
        .text('Cuantos pescadores faenan en su unidad económica de pesca', col2LeftPos, 415)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta8}`, col1LeftPos, 430)



    //---------------------------------------------------- New PAGE --------------------------------------------------

    doc1.addPage()
        .fontSize(9)
        .font('Helvetica')
        .text('1.1.3.3', col1LeftPos, 30)
        .text('Cuál es el estado de su unidad económica de pesca', col2LeftPos, 30)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`Respuesta: ${answers.respuesta9}`, col1LeftPos, 45)

        .fontSize(9)
        .font('Helvetica')
        .text("1.1.3.4", col1LeftPos, 60)
        .text("Volumen de captura en kilos diarios.", col2LeftPos, 60)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`Respuesta: ${answers.respuesta10}`, col1LeftPos, 75)

        .fontSize(9)
        .font('Helvetica')
        .text("1.1.3.5", col1LeftPos, 90)
        .text("Ingresos per cápita por pescador o activos totales. (Pequeño activos totales no superiores a 145 salarios mínimos mensuales legales vigentes (SMMLV, es decir $93.430.750),", col2LeftPos, 90)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta11}`, col1LeftPos, 125)

        .fontSize(9)
        .font('Helvetica')
        .text("1.1.3.6", col1LeftPos, 140)
        .text("Uso de buenas prácticas pesqueras BPP.", col2LeftPos, 140)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta12}`, col1LeftPos, 155)

        .fontSize(9)
        .font('Helvetica')
        .text("1.1.4.2", col1LeftPos, 170)
        .text("Con relación al manejo sanitario como conserva su captura", col2LeftPos, 170)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta13}`, col1LeftPos, 185)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.4.3', col1LeftPos, 200)
        .text('La muerte después de la captura, lo hace', col2LeftPos, 200)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta14}`, col1LeftPos, 215)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.4.4',col1LeftPos, 230)
        .text('La unidad económica de pesca tiene espacio adecuado para cumplir con las normas básicas de higiene y sanidad',col2LeftPos, 230)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta15}`, col1LeftPos, 255)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.4.5', col1LeftPos, 270)
        .text('En su unidad económica de pesca realiza actividades de eviscerados, escamados, descabezado', col2LeftPos, 270)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta16}`, col1LeftPos, 295)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.4.6', col1LeftPos, 310)
        .text('Que hace con los desechos', col2LeftPos, 310)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta17}`, col1LeftPos, 325) 

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.5', col1LeftPos, 340)
        .text('Esquemas de comercialización', col2LeftPos, 340)
        .text('1.1.5.1', col1LeftPos, 355)
        .text('¿LA UNIDAD ECONÓMICA DE PESCA TIENE VÍNCULOS FORMALES PARA COMERCIALIZACIÓN DE LOS RECURSOS PESQUEROS?', col2LeftPos, 355)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta18}`, col1LeftPos, 380) 

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.5.2', col1LeftPos, 395)
        .text('Comercializa sus capturas con', col2LeftPos, 395)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta19}`, col1LeftPos, 410) 
        

    /* ---------DESDE AQUI CUADRAR----------------------------------------NEW PAGE------------------------------------------------------- */
    doc1.addPage()
        .fontSize(9)
        .font('Helvetica')
        .text('1.1.5.3', col1LeftPos, 30)
        .text('Deja de la pesca para autoconsumo', col2LeftPos, 30)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta20}`, col1LeftPos, 45) 
        
        .fontSize(9)
        .font('Helvetica')
        .text('1.1.6', col1LeftPos, 60)
        .text('MERCADOS', col2LeftPos, 60)
        .text('1.1.6.1', col1LeftPos, 75)
        .text('A qué tipo de mercado lleva sus capturas ', col2LeftPos, 75)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta21}`, col1LeftPos, 90)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.7', col1LeftPos, 105)
        .text('VALOR AGREGADO EN LOS RECURSOS PESQUEROS EXTRAIDOS', col2LeftPos, 105)
        .text('1.1.7.1', col1LeftPos, 120)
        .text('A qué nivel de valor agregado lleva sus capturas', col2LeftPos, 120)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta22}`, col1LeftPos, 135)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.8', col1LeftPos, 160)
        .text('REGISTROS', col2LeftPos, 160)
        .text('1.1.8.1', col1LeftPos, 175)
        .text('LLEVA REGISTRO DE DONDE DE PESCA', col2LeftPos, 175)       
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta23}`, col1LeftPos, 190)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.8.2', col1LeftPos, 205)
        .text('REGISTRO DE SUS CAPTURAS', col2LeftPos, 205)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta24}`, col1LeftPos, 220)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.9', col1LeftPos, 235)
        .text('TIPO DE MANO DE OBRA EMPLEADA', col2LeftPos, 235)
        .text('1.1.9.1', col1LeftPos, 250)
        .text('Como es la vinculación de la mano de obra', col2LeftPos, 250)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta25}`, col1LeftPos, 265)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.10', col1LeftPos, 280)
        .text('ACESO A CREDITO Y BANCARIZACION', col2LeftPos, 280)
        .text('1.1.10.1', col1LeftPos, 295)
        .text('EL PESCADOR ARTESANAL SE ENCUENTRA BANCARIZADO', col2LeftPos,295)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta26}`, col1LeftPos, 310)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.10.2', col1LeftPos, 325)
        .text('EL VALOR DE SU UNIDAD ECONÓMICA DE PESCA EXPRESADO EN SLMV AL AÑO', col2LeftPos, 325)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta27}`, col1LeftPos, 360)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.10.3', col1LeftPos, 375)
        .text('¿CUANTO FUE SU CAPTURA EXPRESADO EN TONELADAS / AÑO?', col2LeftPos, 375)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta28}`, col1LeftPos, 390)

        .fontSize(9)
        .font('Helvetica')
        .text('1.2', col1LeftPos, 405)
        .text('DESARROLLO PARA LAS CAPACIDADES SOCIALES INTEGRALES Y EL FORTALECIMIENTO DE LA ASOCIATIVIDAD', col2LeftPos, 405)
        .text('1.2.1', col1LeftPos, 430)
        .text('VINCULACION A ALGUN TIPO DE ORGANIZACIÓN', col2LeftPos, 430)
        .text('1.2.1.1', col1LeftPos, 445)
        .text('su empresa es de tipo', col2LeftPos, 445)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta29}`, col1LeftPos, 460)


    /* -------------------------------------------------NEW PAGE------------------------------------------------------- */
    doc1.addPage()
        .fontSize(9)
        .font('Helvetica')
        .text('1.2.2', col1LeftPos, 30)
        .text('REALIZACION DE ACTIVIDADES PRODUCTIVAS DE MANERA COLECTIVA', col2LeftPos, 30)
        .text('1.2.2.1', col1LeftPos, 45)
        .text('PARTICIPA EN ACTIVIDADES PRODUCTIVAS DE MANERA COLECTIVA', col2LeftPos, 45)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta30}`, col1LeftPos, 60)

        .fontSize(9)
        .font('Helvetica')
        .text('1.2.3', col1LeftPos, 75)
        .text('PROCESOS DE EMPRENDIMIENTO Y ASOCIATIVIDAD', col2LeftPos, 75)
        .text('1.2.3.1 ', col1LeftPos, 90)
        .text('A PARTIR DE LOS PROCESOS ASOCIATIVOS O INDIVIDUALES EN LO QUE ESTA INMERSO EL PESCADOR ARTESANAL', col2LeftPos, 90)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta31}`, col1LeftPos, 115)

        .fontSize(9)
        .font('Helvetica')
        .text('1.2.4', col1LeftPos, 140)
        .text('PARTICIPACION EN ALIANZAS COMERCIALES', col2LeftPos, 140)
        .text('1.2.4.1', col1LeftPos, 155)
        .text('A PARTIR DE PROCESOS ASOCIATIVOS, COMUNITARIOS O INDIVIDUALES Y CON EL PROPÓSITO DE GARANTIZAR ACCESO A NUEVOS MERCADOS Y PRECIOS COMPETITIVOS SE GENERAN', col2LeftPos, 155)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta32}`, col1LeftPos, 190)

        .fontSize(9)
        .font('Helvetica')
        .text('1.2.5', col1LeftPos, 205)
        .text('ACCESO A APOYO TÉCNICO PARA EL MANEJO DE SU UNIDAD ECONÓMICA DE PESCA', col2LeftPos, 205)
        .text('1.2.5.1', col1LeftPos, 215)
        .text('LA ASISTENCIA TÉCNICA A SU UNIDAD ECONÓMICA DE PESCA LA REALIZA POR INTERMEDIO DE', col2LeftPos, 225)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta33}`, col1LeftPos, 250)

        .fontSize(9)
        .font('Helvetica')
        .text('1.2.5.2', col1LeftPos, 265)
        .text('COMO PESCADOR ARTESANAL Y EN ARAS DE GENERAR MAYOR COMPETIVIDAD A LOS RECURSOS PESQUEROS QUE GENERA EL SECTOR, CUENTA CON ALGUNA CERTIFICACION GLOBAL', col2LeftPos, 265)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta34}`, col1LeftPos, 300)

        .fontSize(9)
        .font('Helvetica')
        .text('1.2.6', col1LeftPos, 325)
        .text('USO DE SELLOS DE CALIDAD Y CERTIFICACIONES', col2LeftPos, 325)
        .text('1.2.6.1', col1LeftPos, 340)
        .text('CUENTA CON SELLOS DE CALIDAD Y CERTIFICACIONES', col2LeftPos, 340)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta35}`, col1LeftPos, 355)

        .fontSize(9)
        .font('Helvetica')
        .text('1.3', col1LeftPos, 370)
        .text('ACCESO A LA INFORMACIÓN Y USO DE LAS TIC', col2LeftPos, 370)
        .text('1.3.1', col1LeftPos, 385)
        .text('ACCESO FUENTES DE INFORMACION', col2LeftPos, 385)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta36}`, col1LeftPos, 395)

        .fontSize(9)
        .font('Helvetica')
        .text('1.3.2', col1LeftPos, 410)
        .text('ACCESO A LAS TIC', col2LeftPos, 410)
        .text('1.3.2.1', col1LeftPos, 425)
        .text('TENIENDO EN CUENTA EL ACCESO A LA INFORMACION A PARTIR DE LAS HERRAMIENTAS EXISTENTES PUEDE ACCEDER A', col2LeftPos, 425)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta37}`, col1LeftPos, 450)

    /* -------------------------------------------------NEW PAGE------------------------------------------------------- */
    doc1.addPage()
        .fontSize(9)
        .font('Helvetica')
        .text('1.3.3', col1LeftPos, 30)
        .text('USO DE LAS TIC COMO HERRAMIENTAS DE TOMA DE DECISIONES', col2LeftPos, 30)
        .text('1.3.3.1', col1LeftPos, 45)
        .text('PARA LAS TOMA DE DECISIONES EN EL MANEJO, APROVECHAMIENTO, COMERCIALIZACION DE SU ACTIVIDAD PRODUCTIVA UTILIZA COMO INSTRUMENTOS DE PLANEACION LAS TIC', col2LeftPos, 45)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta38}`, col1LeftPos, 85)

        .font('Helvetica')
        .text('1.3.4', col1LeftPos, 100)
        .text('HABILIDADES Y COMPETENCIAS EN EL USO DE LAS TIC', col2LeftPos, 100)
        .text('1.3.4.1', col1LeftPos, 115)
        .text('AL EXISTIR LAS HERRAMIENTAS QUE PERMITAN LA TRANSFERENCIA DE CONOCIMIENTO DEL SECTOR, EL LIMITANTE QUE SE PRESENTA COMO PRODUCTOR ES LA HABILIDAD PARA EL MANEJO DE ESTAS EN TAL SENTIDO USTED:', col2LeftPos, 115)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta39}`, col1LeftPos, 160)

        .fontSize(9)
        .font('Helvetica')
        .text('1.3.5', col1LeftPos, 185)
        .text('APROPIACION SOCIAL DEL CONOCIMIENTO TRADICIONAL Y CIENTIFICO', col2LeftPos, 185)
        .text('1.3.5.1', col1LeftPos, 200)
        .text('TENIENDO EN CUENTA LOS PROCESOS DE TRANSFERENCIA DEL CONOCIMIENTO TRADICIONAL, TECNOLOGICO Y CIENTIFICO QUE CONLLEVE A MEJORAR LOS PROCESOS PRODUCTIVOS COMO PESCADOR COMO LO ASUME', col2LeftPos, 200)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta40}`, col1LeftPos, 245)

        .fontSize(9)
        .font('Helvetica')
        .text('1.4', col1LeftPos, 260)
        .text('GESTION SOSTENIBLE DE LOS RECURSOS NATURALES', col2LeftPos, 260)
        .text('1.4.1.1', col1LeftPos, 275)
        .text('CONOCE Y PLANIFICA EN SUS ACTIVDADS PESQUERAS ACCIONES DE CONSERVACION DE LA BIODIVERSIDAD Y EL MEDIO AMBIENTE EN LAS FAENAS DE PESCA', col2LeftPos, 275)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta41}`, col1LeftPos, 310)

        .fontSize(9)
        .font('Helvetica')
        .text('1.4.1.2', col1LeftPos, 325)
        .text('AREAS DE PESCA', col2LeftPos, 325)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta42}`, col1LeftPos, 340)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.4.2', col1LeftPos, 355)
        .text('PRÁCTICAS AMBIENTALES SOSTENIBLES Y/O SUSTENTABLES', col2LeftPos, 355)
        .text('1.1.4.2.1', col1LeftPos, 370)
        .text('CONOCE Y CAPTURA RECURSOS PESQUEROS CON LAS TALLAS PERMITIDAS', col2LeftPos, 370)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta43}`, col1LeftPos, 390)

        .fontSize(9)
        .font('Helvetica')
        .text('1.1.4.2', col1LeftPos, 405)
        .text('CONOCE SOBRE CUOTAS DE PESCA', col2LeftPos, 405)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta44}`, col1LeftPos, 420)

    /* -------------------------------------------------NEW PAGE------------------------------------------------------- */
    doc1.addPage()
        .fontSize(9)
        .font('Helvetica')
        .text('1.4.3', col1LeftPos, 30)
        .text('ACTIVIDADES DE MITIGACION Y ADAPTACION AL CAMBIO CLIMATICO', col2LeftPos, 30)
        .text('1.4.3.1', col1LeftPos, 45)
        .text('USTED CONOCE ALGUNA ACCIÓN PARA PROTEGER SUS CUERPOS DE AGUA CUENTA E IMPLEMENTA PLAN DE CONSERVACION', col2LeftPos, 45)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta45}`, col1LeftPos, 70)

        .fontSize(9)
        .font('Helvetica')
        .text('1.4.3', col1LeftPos, 85)
        .text('ACTIVIDADES DE MITIGACION Y ADAPTACION AL CAMBIO CLIMATICO', col2LeftPos, 85)
        .text('1.1.4.3.1', col1LeftPos, 100)
        .text('Dentro de los métodos de adaptación al cambio climático se encuentra la utilización de energías renovables entre otra energía eólica, solar, en su actividad de pesca', col2LeftPos, 100)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta46}`, col1LeftPos, 125)

        .fontSize(9)
        .font('Helvetica')
        .text('1.4.4', col1LeftPos, 140)
        .text('CUMPLIMIENTO DE LA NORMATIVIDAD AMBIENTAL', col2LeftPos, 140)
        .text('1.4.4.1', col1LeftPos, 155)
        .text('LA UNIDAD ECONOMICA DE PESCA (UEP) CUENTA CON LOS PERMISOS PARA RELIZAR FAENAS DE PESCA', col2LeftPos, 155)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta47}`, col1LeftPos, 180)

        .fontSize(9)
        .font('Helvetica')
        .text('1.5', col1LeftPos, 195)
        .text('DESARROLLO DE HABILIDADES PARA LA PARTICIPACION', col2LeftPos, 195)
        .text('1.5.1', col1LeftPos, 210)
        .text('CONOCIMIENTO SOBRE INSTANCIAS Y MECANISMOS DE PARTICIPACION', col2LeftPos, 210)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta48}`, col1LeftPos, 225)

        .fontSize(9)
        .font('Helvetica')
        .text('1.5.2', col1LeftPos, 250)
        .text('CONOCIMIENTO SOBRE HERRAMIENTAS PARA LA PARTICIPACION', col2LeftPos, 250)
        .text('1.5.2.1', col1LeftPos, 265)
        .text('TENIENDO EN CUENTA LAS HERRAMIENTAS DE PARTICIPACION ESTABLECIDAS, (PETICION, QUEJAS, DENUNCIAS ACCION DE GRUPO, TUTEL ACCION POPULAR Y DE CUMPLIMIENTO) LAS CUALES ESTAN DISEÑADAS CON EL PROPOSITO QUE EL CIUDADANO REALICE CONTROL Y SE LE RECONOZCAN SUS DERECHOS TANTO ENTIDADES PÚBLICAS COMO PRIVADAS USTED COMO PESCADOR ARTESANAL:', col2LeftPos, 265)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta49}`, col1LeftPos, 330)

        .fontSize(9)
        .font('Helvetica')
        .text('1.5.3', col1LeftPos, 355)
        .text('EJERCICIO DEL CONTROL POLITICO Y SOCIAL', col2LeftPos, 355)
        .text('1.5.3.1', col1LeftPos, 370)
        .text('EL CONTROL SOCIAL ES UN DERECHO Y UN DEBER QUE TIENEN TODAS LOS CIUDADANOS A VIGILAR Y FISCALIZAR LA GESTION PUBLICA CON EL FIN DE ACOMPAÑAR EL CUMPLIMIENTO DE LOS FINES DEL ESTADO PARA LO CUAL SE ESTABLECEN DIFERENTES MODALIDADES PARA REALIZAR ESTE CONTROL VEEDURIAS CIUDADANAS, JUNTAS DE VIGILANCIAS, COMITES DE DESARROLLO Y CONTROL SOCIAL DE LOS SERVICIOS PUBLICOS DOMICILIARIOS, AUDITORIAS CIUDADANAS Y OTRAS INSTANCIAS DE PARTICIPACION TENIENDO EN CUENTA LO ANTERIOR', col2LeftPos, 370)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta50}`, col1LeftPos, 455)

    /* -------------------------------------------------NEW PAGE------------------------------------------------------- */
    doc1.addPage()
        .fontSize(9)
        .font('Helvetica')
        .text('1.5.4', col1LeftPos, 30)
        .text('FOMENTO DE LA AUTOGESTION DE LAS COMUNIDADES', col2LeftPos, 30)
        .text('1.5.4.1', col1LeftPos, 45)
        .text('TENIENDO EN CUENTA QUE LA AUTOGESTION COMUNITARIA ESTA DADA POR LA ACCION PARTICIPATIVA DE LA SOCIEDAD EN LOS AMBITOS PERSONALES FAMILIARES Y COMUNITARIOS PARA LA TOMA DE DECISIONES EN EL PROCESO DE DESARROLLO, LA CUAL CONLLEVA A LA AUTORESPONSABILIDAD, COLABORACION, CONTRIBUCION Y TRABAJO VOLUNTARIO PARA LA BUSQUEDA DE SOLUCIONES, DENTRO DE SUS ACTIVIDADES PRODUCTIVAS LA COMUNIDAD A LA QUE PERTENECE', col2LeftPos, 45)
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`Respuesta: ${answers.respuesta51}`, col1LeftPos, 120)

        //.image('data:image/jpeg;base64,'+imgFarmerSignature, 130, 315, {width: 160})
        //.text('Firma del titular del predio', 153, 400)


    doc1.pipe(res)
    doc1.end() 
})

router.get('/downloadSignatureExcel', isLoggedIn, async(req, res) => {
    const data = await pool.query('SELECT firstName, secondName, firstSurname, secondSurname, nitProducer, nameFarm, municipality, vereda, imgSignature FROM farm')
 
    ct.cell(1,1)
    .string('Cedula')
    .style(stylesheet)
    ct.cell(1,2)
    .string('Primer Nombre')
    .style(stylesheet)
    ct.cell(1,3)
    .string('Seg Nombre')
    .style(stylesheet)
    ct.cell(1,4)
    .string('Primer Apellido')
    .style(stylesheet)
    ct.cell(1,5)
    .string('Seg Apellido')
    .style(stylesheet)
    ct.cell(1,6)
    .string('Nom_finca')
    .style(stylesheet)
    ct.cell(1,7)
    .string('Municipio')
    .style(stylesheet)
    ct.cell(1,8)
    .string('Vereda')
    .style(stylesheet)
    ct.cell(1,9)
    .string('Firma')
    .style(stylesheet)

    for(let i=0; i<data.length; i++){
        ct.cell(2+i, 1)
        .string(data[i].nitProducer)
        ct.cell(2+i, 2)
        .string(data[i].firstName)
        ct.cell(2+i, 3)
        .string(data[i].secondName)
        ct.cell(2+i, 4)
        .string(data[i].firstSurname)
        ct.cell(2+i, 5)
        .string(data[i].secondSurname)
        ct.cell(2+i, 6)
        .string(data[i].nameFarm)
        ct.cell(2+i, 7)
        .string(data[i].municipality)
        ct.cell(2+i, 8)
        .string(data[i].vereda)
        ct.cell(2+i, 9)
        .string(data[i].imgSignature)
    } 

    wt.write('Firmas productores.xlsx', res)
})

router.get('/mapBoyaca', async(req, res) =>{
    res.render('admin/mapBoyaca');
})



module.exports = router;
