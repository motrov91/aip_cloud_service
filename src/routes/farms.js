const express = require('express');

const router = express.Router();
const pool = require('../database');
const {isLoggedIn} = require('../lib/auth');

router.get('/farmsList', isLoggedIn, async (req, res) => {
    const farmList = await pool.query('SELECT * FROM farm ORDER BY nitProducer ASC');
    res.render('farms/farmsList', {farmList});
});

router.get('/addFarm', isLoggedIn, (req, res) => {
    //console.log('dataaaaa', req.session.project.project)
    res.render('farms/addFarm')
});

router.post('/addFarm', isLoggedIn, async (req, res) => {
    //console.log('URL-IMAGE',req.file.path)
    //console.log('url',req.file.path)
    const projId = req.session.project.project;
    const dataImage = req.file.path;
    const newString = dataImage.slice(15, )
    //console.log(newString)
    const { firstName, secondName, firstSurname, secondSurname, nitProducer, expedition, birthdate,
        ethnicity, celphone1, celphone2, email, gender, scholarLevel, organization, maritalStatus,
        fullnameSpouse, nitSpouse, expeditionSpouse, dateSpouse, celphoneSpouse,
        emailSpouse, nameFarm, municipality, corregimiento, vereda, possession,
        totalExtension, cropsArea, freeArea, conservationArea, currentProjects,
        agrochemical, bestPractices, otherAreas, afluentes, vocationAndLandUse,
        productiveLine, certificationType, purlieuNorth, purlieuSouth, purlieuEast,
        purlieuWest, altura, latitudeLongitude, anosPropiedad, productiveLine1, productiveLine2,
        productiveLine3, knowProductiveLine1, knowProductiveLine2, knowPeoductiveLine3,
        comercializationType, biopreparadosProduction, waterAvailable, accessRoads,
        electricityAvailability, ComunicationAvailable, projectParticipation, cropTools,
        firstAidKit, fumigateKit, irrigationSystem, machines, ParticipateInProyects,
        workingCapital, implementationTecnologyLevel, productLine1, variety1, cantPlants1,
        sowingDistance1, ageCrop1, stageCrop1, cantKgProducedByYear1, cropStatus1, aproxArea1,
        coordenates1, useType, promKgComercializateValue, productLine2, variety2, cantPlants2,
        sowingDistance2, ageCrop2, stageCrop2, cantKgProducedByYear2, cropStatus2, aproxArea2,
        coordenates2, useType2, promKgComercializateValu2, productLine3, variety3, cantPlants3,
        sowingDistance3, ageCrop3, stageCrop3, cantKgProducedByYear3, cropStatus3, aproxArea3, coordenates3,
        useType3, promKgComercializateValu3,

        productLine4Pecuaria, breed, cantAnimals,
        numberPlaces, ageAverageAnimals, ageCrop4,
        cantKgProducedByYear4, cropStatus4,
        aproxArea4, coordenates4, nutritionType,
        promKgComercializateValu4, productLine5Pecuaria, breed5,
        cantAnimals5, numberPlaces5, ageAverageAnimals5,
        ageCrop5, cantKgProducedByYear5, cropStatus5,
        aproxArea5, coordenates5, nutritionType5, promKgComercializateValu5 } = req.body; 
    
        const newFarm = {
        img_beneficiario: newString,
        firstName, secondName, firstSurname,
        secondSurname, nitProducer, expedition,
        birthdate, ethnicity, celphone1,
        celphone2, email, gender,
        scholarLevel, organization,
        maritalStatus, fullnameSpouse, nitSpouse, expeditionSpouse, dateSpouse,
        celphoneSpouse, emailSpouse, nameFarm,
        municipality, corregimiento, vereda,
        possession, totalExtension, cropsArea, freeArea,
        conservationArea, currentProjects, agrochemical,
        bestPractices, otherAreas,
        afluentes, vocationAndLandUse, productiveLine,
        certificationType, purlieuNorth, purlieuSouth,
        purlieuEast, purlieuWest, altura,
        latitudeLongitude, anosPropiedad, productiveLine1,
        productiveLine2, productiveLine3, knowProductiveLine1,
        knowProductiveLine2, knowPeoductiveLine3, comercializationType,
        biopreparadosProduction, waterAvailable, accessRoads,
        electricityAvailability, ComunicationAvailable, projectParticipation,
        cropTools, firstAidKit, fumigateKit,
        irrigationSystem, machines, ParticipateInProyects, workingCapital, implementationTecnologyLevel,
        productLine1, variety1, cantPlants1, sowingDistance1, ageCrop1, stageCrop1,
        cantKgProducedByYear1, cropStatus1, aproxArea1,
        coordenates1, useType, promKgComercializateValue,
        productLine2, variety2, cantPlants2, sowingDistance2,
        ageCrop2, stageCrop2, cantKgProducedByYear2,
        cropStatus2, aproxArea2, coordenates2,
        useType2, promKgComercializateValu2,
        productLine3, variety3, cantPlants3,
        sowingDistance3, ageCrop3, stageCrop3,
        cantKgProducedByYear3, cropStatus3,
        aproxArea3, coordenates3,useType3,
        promKgComercializateValu3,
        projectId: projId,
        productLine4Pecuaria, breed, cantAnimals,
        numberPlaces, ageAverageAnimals, ageCrop4,
        cantKgProducedByYear4, cropStatus4,
        aproxArea4, coordenates4, nutritionType,
        promKgComercializateValu4, productLine5Pecuaria, breed5,
        cantAnimals5, numberPlaces5, ageAverageAnimals5,
        ageCrop5, cantKgProducedByYear5, cropStatus5,
        aproxArea5, coordenates5, nutritionType5, promKgComercializateValu5

    }

    await pool.query('INSERT INTO farm set ?', [newFarm]);
    res.redirect('/farmsList');
    
});

router.get('/questionsProducer/:id', isLoggedIn, async(req, res) =>{
    dataIdFarm = req.params.id
    const dataQuestionsProducer = await pool.query('SELECT questions_producer.id_questions_producer, questions_producer.num_item1, questions_producer.title1, questions_producer.description1, questions_producer.num_item2, questions_producer.title2, questions_producer.num_item3, questions_producer.title3, questions_producer.description2, answersProducer.answer1, answersProducer.answer2, answersProducer.answer3, answersProducer.answer4  FROM questions_producer INNER JOIN answersProducer ON  questions_producer.answersProducer_id = answersProducer.id_answersProducer');
    //console.log('dataQuestionsProducer', dataQuestionsProducer)
    res.render('farms/questionsProducer', {dataQuestionsProducer, dataIdFarm})
})

router.post('/questionsProducer/:id', isLoggedIn, async(req, res)=>{
    const dataQuery = req.body
    const dataAnswer = {};
    dataAnswer.farm_id = req.params.id
    //console.log('***>', dataQuery)
    for(let i=1 ; i<=Object.keys(dataQuery).length; i++){
        dataAnswer['respuesta'+[i]] = dataQuery[i];
    }
    const queryId = await pool.query('SELECT * FROM answerFormatProducer WHERE farm_id = ?', [req.params.id])
    //console.log('=====>',queryId);
    if(queryId.length > 0){
        req.flash('message', 'Este usuario ya ha sido gestionado');
        res.redirect('/detailFarm/'+ req.params.id)
    }else{
        await pool.query('INSERT INTO answerFormatProducer set ?', [dataAnswer])
        req.flash('success', 'Se han guardado los datos con exito');
        res.redirect('/detailFarm/'+ req.params.id)
    } 

    res.send('Enviando datos')
    
})

router.get('/detailFarm/:id', isLoggedIn, async (req, res) => {
    dataId = req.params.id
    const farm = await pool.query('SELECT * FROM farm WHERE id_farm = ?', [req.params.id]);
    //console.log('IMG charged', farm[0].img_beneficiario);
    /* if(farm[0].img_beneficiario !== null){
        console.log(farm[0].img_beneficiario)
        const newString = farm[0].img_beneficiario.slice(15, )
        console.log('NEWSTRING', newString);
        farm[0].img_beneficiario = newString;
    } */

    const proj = await pool.query('SELECT * FROM projects');
    const projXfarm = await pool.query('SELECT * FROM project_has_farm WHERE farm_id = ?', [req.params.id])
    res.render('farms/detailFarm', {farm, proj, projXfarm, dataId });
});

router.get('/editFarm/:id', isLoggedIn, async (req, res) =>{
    const {id} = req.params;
    const updFarm = await pool.query('SELECT * FROM farm WHERE id_farm = ?', [id])
    //console.log(updFarm)

    res.render('farms/updateFarm', {updFarm});
})

router.post('/editFarm/:id', isLoggedIn, async (req, res) => {
    const {firstName, nitProducer, municipality, vereda, nameFarm, celphone1} = req.body; 
    const updFarm = {
        firstName,
        nitProducer,
        municipality,
        vereda,
        nameFarm,
        celphone1
    }
    
    await pool.query('UPDATE farm set ? WHERE id_farm = ?', [updFarm, req.params.id]);
    res.redirect('/detailFarm/' + req.params.id );

});

router.post('/projXfarm/:id', isLoggedIn, async (req, res) => {
    const datFarm = await pool.query('SELECT * FROM farm WHERE id_farm = ?', [req.params.id]);
    const {project} = req.body;
    const datProj = await pool.query('SELECT * FROM project_has_user WHERE project_id = ?', [project]);

    const newProjXFarm = {
        project_id_project: datProj[0].project_id,
        farm_id: datFarm[0].id_farm,
        user_id_user: datProj[0].user_id,
        cedula_farm: datFarm[0].cedula, 
        proyecto_nom: datProj[0].project_nom
    }
    const consul = await pool.query('SELECT * FROM project_has_farm WHERE project_id_project = ? AND farm_id = ?', [newProjXFarm.project_id_project, newProjXFarm.farm_id]);
    if(consul.length > 0){
        req.flash('message', 'Esta finca ya esta vinculada al proyecto ' + newProjXFarm.proyecto_nom);
        res.redirect('/admin/detailFarm/' + req.params.id);
    }else{
        await pool.query('INSERT INTO project_has_farm set ?', [newProjXFarm]);
        res.redirect('/detailFarm/' + req.params.id);
    }
    
});

router.get('/farmsByProject', isLoggedIn, async (req, res) =>{
    const proj = await pool.query('SELECT * FROM projects WHERE id_project = ?', [req.session.project.project]);
    const farmsByProject = await pool.query('SELECT farm.id_farm, farm.firstName, farm.nitProducer, farm.municipality, farm.vereda, farm.nameFarm, farm.celphone1, project_has_farm.proyecto_nom, project_has_farm.id_project_has_farm FROM project_has_farm INNER JOIN farm ON project_has_farm.farm_id = farm.id_farm where project_has_farm.project_id_project = ?', [req.session.project.project]);
    res.render('farms/farmsByProject', {farmsByProject, proj})
});

router.get('/projectTracking/:id', isLoggedIn, async (req, res) =>{
    const { id } = req.params;

    const join = await pool.query('SELECT farm.id_farm, farm.firstName, farm.nitProducer, farm.municipality, farm.vereda, farm.nameFarm, farm.celphone1, project_has_farm.id_project_has_farm, project_has_farm.proyecto_nom, project_has_farm.id_project_has_farm FROM project_has_farm INNER JOIN farm ON project_has_farm.farm_id = farm.id_farm where id_project_has_farm = ? AND project_id_project = ?', [id, req.session.project.project]);
    const survByFarm = await pool.query('SELECT * FROM survey WHERE project_has_farm_id = ? ORDER BY fecha_creacion DESC', [req.params.id]);

    res.render('survey/surveyByFarm', {join, survByFarm});
})



module.exports = router;