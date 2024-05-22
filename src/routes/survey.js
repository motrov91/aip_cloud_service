const express = require('express');
const moment = require('moment');
var PDFDocument = require('pdfkit');
var fs = require('fs');

const router = express.Router();

const pool = require('../database');
const {isLoggedIn} = require('../lib/auth');


router.get('/survey', /*isLoggedIn,*/ async (req, res) => {
    console.log('session',req.session)
    console.log(req.user)
    const userType = await pool.query('SELECT * FROM users WHERE id = ?', [req.session.passport.user]);
    if(userType[0].rol_id === 6 || userType[0].rol_id === 7 || userType[0].rol_id === 8){
        const surveyByProject = await pool.query('SELECT survey.id_survey, survey.nom_finca, survey.nom_format, survey.municipio, survey.nom_beneficiario, survey.fecha_creacion, users.nom_user FROM survey INNER JOIN users ON survey.encuestador = users.id where  survey.project_id = ?',  [req.session.project.project]);
        res.render('survey/adminSurvey', {surveyByProject});
    }else{
        const surveyByProject = await pool.query('SELECT survey.id_survey, survey.nom_finca, survey.nom_format, survey.municipio, survey.nom_beneficiario, survey.fecha_creacion, users.nom_user FROM survey INNER JOIN users ON survey.encuestador = users.id where  survey.encuestador = ?', [req.session.passport.user]);
        res.render('survey/adminSurvey', {surveyByProject});
    }
    
})

router.get('/listProductiveSectors', /*isLoggedIn,*/ async (req, res) => {
    const listSectors = await pool.query('SELECT * FROM sectors');
    res.render('survey/listProductiveSectors', {listSectors});
});

router.get('/productiveSectors', /*isLoggedIn,*/ (req, res) =>{
    res.render('survey/productiveSectors'); 
});

router.post('/addProductiveSector', /*isLoggedIn,*/ async (req, res) =>{
    const {nom_sector, description} = req.body;
    const newSector = {
        nom_sector,
        description
    }

    await pool.query('INSERT INTO sectors set ?', [newSector]);
    res.redirect('/listProductiveSectors');

});

router.get('/addQuestion', /*isLoggedIn,*/ (req, res) =>{
    res.render('survey/addQuestion'); 
});

router.post('/addQuestion', /*isLoggedIn,*/ async (req, res) =>{
    const { title, answerOne, answerTwo, answerThree, answerFour, recomendationOne, recomendationTwo, recomendationThree, recomendationFour } = req.body;
    const newQuestion = {
        title,
        answerOne, 
        answerTwo, 
        answerThree, 
        answerFour, 
        recomendationOne, 
        recomendationTwo, 
        recomendationThree, 
        recomendationFour
    }
    await pool.query('INSERT INTO questions set ?', [newQuestion]);
    res.redirect('/questionList')
});

router.get('/formatTypeList/:id', /*isLoggedIn,*/ async (req, res) => {

    const prueba = {
        id: req.params.id
    }
    const sector = await pool.query('SELECT * FROM sectors WHERE id_sector = ?', [prueba.id]);
    const {id_sector, nom_sector} = sector[0];
    const getSector = {
        id_sector
    }
    const format = await pool.query('SELECT * FROM formatType WHERE sector_id = ?', [getSector.id_sector]);
 
    res.render('survey/formatType', {format , prueba , sector});   
});

router.get('/addFormatType/:id', /*isLoggedIn,*/ (req, res) => {
    res.render('survey/addFormatType');
});

router.post('/addFormatType/:id', /*isLoggedIn,*/ async (req, res)=>{
    const { nom_formatType, description } = req.body;
    const newFormatType = {
        nom_formatType,
        description,
        sector_id: req.params.id
    }

    await pool.query('INSERT INTO formatType set ?', [newFormatType]);
    res.redirect('/formatTypeList/' + newFormatType.sector_id);
});

router.get('/addFormat/:id', /*isLoggedIn,*/ async (req, res) => {
    const category = await pool.query('SELECT * FROM formatType WHERE id_formatType = ?', [req.params.id]);
    const {sector_id} = category[0];
    const sec = {
        sector_id
    }
    const sector = await pool.query('SELECT * FROM sectors WHERE id_sector = ?', [sec.sector_id]);
    res.render('survey/addFormat', {category, sector});
});

router.post('/addFormat/:id', /*isLoggedIn,*/ async (req, res) => {
    const {nom_format, nom_formatType} = req.body;
    const category = await pool.query('SELECT * FROM formatType WHERE id_formatType = ?', [req.params.id]);
    const {id_formatType} = category[0];
    const idCategory = {id_formatType};
    const newFormat = {
        nom_format,
        formatType_id: idCategory.id_formatType
    }
    await pool.query('INSERT INTO formats set ?',[newFormat] );
    res.redirect('/formatListByCategory/'+ newFormat.formatType_id);
})

router.get('/formatListByCategory/:id', /*isLoggedIn,*/ async (req, res) => {
    const category = await pool.query('SELECT * FROM formatType WHERE id_formatType = ?', [req.params.id]);
    const formatByCategory = await pool.query('SELECT * FROM formats WHERE formatType_id = ?', [req.params.id]);
    const newData = formatByCategory[0];
    res.render('survey/formatListByCategory', {formatByCategory, category});  
    
});

router.get('/addQuestionsToFormat/:id', /*isLoggedIn,*/ async (req, res) => {
    const format = await pool.query('SELECT * FROM formats WHERE id_format = ?', [req.params.id]);
    const prueba = format[0];
    const cat = await pool.query('SELECT * FROM formatType WHERE id_formatType = ?', [prueba.formatType_id]);
    const sec = cat[0];
    const sector = await pool.query('SELECT * FROM sectors WHERE id_sector = ?', [sec.sector_id]);  
    const questionList = await pool.query('SELECT * FROM questions WHERE format_id = ?', [req.params.id]);

    res.render('survey/agreeQuestionToFormat', {format, cat, sector, questionList});
});

router.post('/addQuestionsToFormat/:id',/*isLoggedIn,*/ async(req, res) => {
    const { title, format, nom_formatType, nom_sector } = req.body;
    const newQuestion = {
        title,
        format_id: req.params.id,
    }

    const dataForm = {
        title, 
        format, 
        nom_formatType, 
        nom_sector,
        format_id: req.params.id,
    }

    /* CREA LA PREGUNTA EN LA BASE DE DATOS  */
    const duplicate = await pool.query('SELECT * FROM questions WHERE title = ?', [newQuestion.title]);
    if(duplicate.length > 0 ){
        req.flash('message', 'La pregunta ya existe');
    }else{
        await pool.query('INSERT INTO questions set ?', [newQuestion])
    }
   
    const questionList = await pool.query('SELECT * FROM questions WHERE format_id = ?', [req.params.id]);

    const formType = await pool.query('SELECT id_formatType FROM formatType WHERE nom_formatType = ?', [dataForm.nom_formatType]);

    res.redirect('/formatListByCategory/'+ formType[0].id_formatType);
});

router.post('/addAnswer', /*isLoggedIn,*/ async (req, res) =>{
    const {nom_formatType} = req.body;
    const newDat = {
        nom_formatType
    }
    const fType = await pool.query('SELECT * FROM formatType WHERE nom_formatType = ?', [newDat.nom_formatType]);

    const {id_formatType} = fType[0];
    const dataForm = {
        id_formatType
    }

    const {answer, conclusion, recomendation, question_id } = req.body; 
    const data = {
        answer,
        recomendation,
        conclusion,
        question_id,
        
    }
    
    await pool.query('INSERT INTO answers set ?', [data]);
    res.redirect('/formatListByCategory/'+ dataForm.id_formatType)  
})

/* Se hacen dos consultas para almacenar las preguntas y las respuestas de cada pregunta, se crea un objeto llamado result
    y dentro se empieza a llenar con objetos llamados pregunta que almacena la pregunta y las respuestas esto se hace a 
    traves de ciclos anidados*/ 

router.get('/previewFormat/:id', /*isLoggedIn,*/ async (req, res) => {
    const nameFormat = await pool.query('SELECT * FROM formats WHERE id_format = ?', [req.params.id]);
    const questions = await pool.query('SELECT * FROM questions WHERE format_id = ?', [req.params.id]);
    const questionsById = await pool.query('SELECT * FROM questions WHERE format_id = ?', [req.params.id]);
    const answers = await pool.query('SELECT * FROM answers');

    result = [];
    
     for(x in questions){
        let cont=0;
        let pregunta = {}
        for(y in answers){
            if(questions[x].id_question === answers[y].question_id){
                pregunta["title"] = questions[x].title;
                pregunta["ans"+[cont]] = answers[y].answer;
                cont = cont+1;      
            }
        }
        result.push(pregunta);
    } 


    res.render('survey/previewFormat', {nameFormat, questionsById, questions, answers, result });
});

router.post('/selectSector', /*isLoggedIn,*/ async (req, res) => {
    //console.log('SELECT SELECTOR',req.body);
    const { id_project_has_farm, proyecto_nom, nom_beneficiario, cedula, nom_finca, municipio, vereda, telefono } = req.body;
    const sector = await pool.query('SELECT * FROM sectors');
    const newSurv = {
        id_project_has_farm, 
        proyecto_nom, 
        nom_beneficiario, 
        cedula, 
        nom_finca,
        municipio, 
        vereda, 
        telefono
    }
    res.render('survey/selectSector', {newSurv, sector});
}); 

router.post('/selectTopic', /*isLoggedIn,*/ async (req, res) => {
    const { id_project_has_farm, proyecto_nom, nom_beneficiario, cedula, nom_finca, municipio, vereda, telefono, sector } = req.body;
    const newSurv = {
        id_project_has_farm, 
        proyecto_nom, 
        nom_beneficiario, 
        cedula, 
        nom_finca,
        municipio, 
        vereda, 
        telefono,
        sector
    }
    const newSector = await pool.query('SELECT * FROM sectors WHERE id_sector = ?', [newSurv.sector] );
    const {nom_sector} = newSector[0];
    const newNom = {
        nom_sector
    }

    const dataTopic = await pool.query('SELECT * FROM formatType WHERE sector_id = ?', [newSurv.sector]);

    
    res.render('survey/selectTopic', {newSurv, newNom, dataTopic});
}); 

router.post('/selectFormat', /*isLoggedIn,*/ async (req, res) => {
    const { id_project_has_farm, proyecto_nom, linea_productiva, nom_beneficiario, cedula, nom_finca, municipio, vereda, telefono, topic } = req.body
    newData = {
        id_project_has_farm, 
        proyecto_nom, 
        linea_productiva, 
        nom_beneficiario, 
        cedula, nom_finca, 
        municipio, 
        vereda, 
        telefono, 
        topic
    }
    formatos = await pool.query('SELECT * FROM formats WHERE formatType_id = ?', [newData.topic]);
    prueba = await pool.query('SELECT * FROM formatType WHERE id_formatType = ?', [newData.topic]);
    const {nom_formatType} = prueba[0];
    const newPru = {
        nom_formatType
    }
    res.render('survey/selectFormat', {newData, formatos, newPru});
}); 

router.post('/structuredFormat', /*isLoggedIn,*/ async (req, res) => {

    const { id_project_has_farm, proyecto_nom, linea_productiva, tematica, nom_beneficiario, cedula, nom_finca, municipio, vereda, telefono, format } = req.body
    newData = {
        id_project_has_farm, 
        proyecto_nom, 
        linea_productiva, 
        nom_beneficiario, 
        cedula, nom_finca, 
        municipio,
        vereda, 
        telefono, 
        format
    }

    const form = await pool.query('SELECT * FROM formats WHERE id_format = ?', [newData.format]);
    const { id_format, nom_format, formatType_id } = form[0];
    const nomFormat = {
        id_format, 
        nom_format, 
        formatType_id
    }

    const questByFormat = await pool.query('SELECT * FROM questions WHERE format_id = ?', [newData.format]);
    const answersByFormat = await pool.query('SELECT answers.id_answer, answers.answer, answers.question_id, questions.format_id FROM answers INNER JOIN questions ON answers.question_id = questions.id_question WHERE questions.format_id = ?', [newData.format]);
    

    result = [];
    
     for(x in questByFormat){
        let pregunta = {}
        let cont = 0;
        for(y in answersByFormat){
            if(questByFormat[x].id_question === answersByFormat[y].question_id){
                pregunta["id"] = questByFormat[x].id_question;
                pregunta["title"] = questByFormat[x].title;
                pregunta["ans"+ [cont] ] = answersByFormat[y].answer;   
                cont = cont + 1;  
            }
            
        }
        result.push(pregunta);
    } 

    res.render('survey/Survey', {newData, nomFormat, questByFormat, result})
});

router.post('/formatConclusion', /*isLoggedIn,*/ async (req, res) => {    
    const dataSurvey = req.body;
    
    const {id_project_has_farm, proyecto_nom, linea_productiva, nom_format, nom_beneficiario, cedula, municipio, vereda, nom_finca } = req.body;

    const dataForm = {
        id_project_has_farm, 
        proyecto_nom, 
        linea_productiva, 
        nom_format, 
        nom_beneficiario, 
        cedula, 
        municipio, 
        vereda, 
        nom_finca
    }

    const formatId = await pool.query('SELECT id_format FROM formats WHERE nom_format = ?', [dataForm.nom_format]);

    const {id_format} = formatId[0];
    const idForm = {
        id_format
    }

    let estado = 'El estado arrojado de la visita es el siguiente: ';
    let conclusiones = 'Como conclusiones a esta encuesta podemos encontrar las siguientes ';
    let recomendaciones = 'Como recomendaciones a esta encuesta podemos decir lo siguiente: ';

    /* obtener los arreglos contenidos en un objeto, hacemos la consulta a la base de datos
    y los almacenamos en un objeto para posteriormente cargarlos en una nueva tabla */

    for(let i=0; i <= Object.keys(dataSurvey).length; i++){  
        for(let j=0; j<=5000; j++){
            if(Object.keys(dataSurvey)[i] === 'res'+[j]){
                if(typeof(dataSurvey[Object.keys(dataSurvey)[i]]) === 'object'){
                    for (let k=0; k < dataSurvey[Object.keys(dataSurvey)[i]].length; k++){
                        const dataConclusion = await pool.query('SELECT conclusion, recomendation FROM answers WHERE answer = ? AND question_id = ?', [dataSurvey[Object.keys(dataSurvey)[i]][k], j])
                        const dataQuestion = await pool.query('SELECT title FROM questions WHERE id_question = ?', [j]);
                        const {title} = dataQuestion[0];
                        const dataTitle = {
                            title
                        }
                        const { conclusion, recomendation } = dataConclusion[0];
                        const dataAnswer = {
                            conclusion, 
                            recomendation
                        }
                        if(k === 0){
                            //console.log('DATACONCLUSION-ARRAY', dataConclusion);
                            estado = estado + ' ' + dataTitle.title + ' ' + dataSurvey[Object.keys(dataSurvey)[i]][k] + ',' + ' ';
                        }else{
                            estado = estado + ' ' + dataSurvey[Object.keys(dataSurvey)[i]][k] + ',' + ' ';
                            recomendaciones = recomendaciones + ' ' + dataAnswer.recomendation + ' ';
                            conclusiones = conclusiones + ' ' + dataAnswer.conclusion + ' ';
                        }
                        
                    }
                }else{
                    const dataConclusion = await pool.query('SELECT recomendation, conclusion FROM answers WHERE answer = ? AND question_id = ?', [dataSurvey[Object.keys(dataSurvey)[i]], j])
                    const dataQuestion = await pool.query('SELECT title FROM questions WHERE id_question = ?', [j]);
                        const {title} = dataQuestion[0];
                        const { conclusion, recomendation } = dataConclusion[0];
                        const dataTitle = {
                            title
                        }
                        const dataAnswer = {
                            conclusion, 
                            recomendation
                        }
                    //console.log('DATACONCLUSION-STRING', dataConclusion);
                    estado = estado + dataTitle.title + ' ' + dataSurvey[Object.keys(dataSurvey)[i]] + ',' + ' ';
                    recomendaciones = recomendaciones + ' ' + dataAnswer.recomendation + ' ';
                    conclusiones = conclusiones + ' ' + dataAnswer.conclusion + ' ';
                }
            } 
        }
    }

    currentDate = new Date();

    const surveyData = {
        project_has_farm_id : dataForm.id_project_has_farm,
        format_id : idForm.id_format,
        nom_format : dataForm.nom_format,
        project_id : req.session.project.project,
        nom_beneficiario : dataForm.nom_beneficiario,
        cedula_beneficiario : dataForm.cedula,
        nom_finca : dataForm.nom_finca,
        municipio : dataForm.municipio,
        vereda : dataForm.vereda,
        fecha_creacion : currentDate,
        coordenadas : ' ',
        situacion_encontrada : estado,
        conclusiones : conclusiones,
        recomendaciones : recomendaciones,
        encuestador : req.session.passport.user
    }

    await pool.query('INSERT INTO survey set ?', [surveyData]);

    const dataUser = await pool.query('SELECT nom_user FROM users WHERE id = ?', [req.session.passport.user]);
    const { nom_user } = dataUser[0];
    const dUser = {
        nom_user
    }

    res.render('survey/conclusions', {surveyData, dUser})
});

router.get('/fullDetailSurvey/:id', /*isLoggedIn,*/ async (req, res) =>{

    const dataSurvey = await pool.query('SELECT * FROM survey WHERE id_survey = ?', [req.params.id]);
    const { encuestador } = dataSurvey[0];
    const idEnc = {
        encuestador
    }
    const nomEnc = await pool.query('SELECT nom_user FROM users WHERE id = ?', [idEnc.encuestador]);

    const {nom_user} = nomEnc[0];
    const dataName = {
        nom_user
    }

    const dataProject = await pool.query('SELECT nom_proyecto FROM projects WHERE id_project = ?', [dataSurvey[0].project_id])
    const {nom_proyecto} = dataProject[0];
    const nProyect = {
        nom_proyecto
    }

    res.render('survey/fullDetailSurvey', {dataSurvey, dataName, nProyect});
});

router.get('/download/:id', /*isLoggedIn,*/ async (req, res)=>{

    const dataSurvey = await pool.query('SELECT * FROM survey WHERE id_survey = ?', [req.params.id]);
    const dataUser = await pool.query('SELECT nom_user FROM users WHERE id = ?', [dataSurvey[0].encuestador])
    const dataProject = await pool.query('SELECT nom_proyecto FROM projects WHERE id_project = ?', [dataSurvey[0].project_id])
    const project = await pool.query('SELECT * FROM projects WHERE id_project = ?', [dataSurvey[0].project_id])
    //console.log('PROJECT', project);

    var pdf = new PDFDocument({        
      layout: 'landscape',
      size: [510, 410], 
      margin: 5,     
      info: {    
         Title: 'Formato de visita de campo',
         Author: 'Fundación AIP cluod',
      }  
    })

    let col1LeftPos = 20;
    let colWidth = 100;
    let col2LeftPos = colWidth + col1LeftPos + 40;
   
    pdf.moveDown()
         .fillColor('black')
         .fontSize(11)
         .text('Formato de acompañamiento técnico',0,70, {
           align: 'center',
           indent: 2,
           height: 2,
           ellipsis: true
         });

    pdf.moveDown()
        .fontSize(9)
        .text(`Identificador: ${dataSurvey[0].id_survey}`, col1LeftPos, 90, {width: colWidth})
        .text(`Sección: ${dataSurvey[0].nom_format}`, col2LeftPos, 90);

    pdf.moveDown()
         .text(`Proyecto: ${dataProject[0].nom_proyecto}`, col1LeftPos, 130, {width: colWidth})
         .text(`Beneficiario: ${dataSurvey[0].nom_beneficiario}`, col2LeftPos, 130)
    
    pdf.moveDown()
         .text(`Cedula: ${dataSurvey[0].cedula_beneficiario}`, col1LeftPos, 150, {width: colWidth})
         .text(`Finca: ${dataSurvey[0].nom_finca}`, col2LeftPos, 150)

    pdf.moveDown()
         .text(`Municipio: ${dataSurvey[0].municipio}`, col1LeftPos, 170, {width: colWidth})
         .text(`Vereda: ${dataSurvey[0].vereda}`, col2LeftPos, 170)

    pdf.moveDown()
         .text(`Fecha: ${moment(dataSurvey[0].fecha_creacion).format('lll')}`, col1LeftPos, 190, {width: colWidth})
         .text(`Encuestador: ${dataUser[0].nom_user}`, col2LeftPos, 190)

    pdf.moveDown()
        .text('  ', col1LeftPos)

    pdf.moveDown()
         .fillColor('black')
         .fontSize(10)
         .text('Situación Encontrada:', {
           height: 2,
           ellipsis: true,
           col1LeftPos
         });

    pdf.fontSize(8).text(`${dataSurvey[0].situacion_encontrada}`);

    pdf.moveDown()
         .fillColor('black')
         .fontSize(10)
         .text('Conclusiones:', {
           height: 2,
           ellipsis: true
         });

    pdf.fontSize(8).text(`${dataSurvey[0].conclusiones}`);

    pdf.moveDown()
         .fillColor('black')
         .fontSize(10)
         .text('Recomendaciones:', {
           height: 2,
           ellipsis: true
         });

    pdf.fontSize(8).text(`${dataSurvey[0].recomendaciones}`);

    pdf.moveDown()
        .text('fundacion AIP cloud', 0.5 * (pdf.page.width - 100), pdf.page.height - 25, {
        width: 100,
        align: 'center',
        lineBreak: false,
        });

    pdf.pipe(res)
    pdf.end()

  

})



module.exports = router;