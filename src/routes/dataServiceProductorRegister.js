const express = require('express');
const router = express.Router();
const pool = require('../database');


//Create a producer register attached to with a farm
router.post('/questionsProducer/:id', async (req, res) => {

    console.log('req registro de productor', req.body);

    const dataQuery = req.body;
    
    const dataAnswer = {};
    dataAnswer.farm_id = req.params.id
    for(let i=1 ; i<=45; i++){
        if(dataQuery["respuesta"+[i]]){
            dataAnswer['respuesta'+[i]] = dataQuery["respuesta"+[i]];
        }
        if(dataQuery["comment"+[i]]){
            dataAnswer['comment'+[i]] = dataQuery["comment"+[i]];
        }
    }

    dataAnswer.userId = req.body.user_id
    dataAnswer.comments = req.body.comments
    dataAnswer.projectId = req.body.projectId

    const queryId = await pool.query('SELECT * FROM answerformatproducer WHERE farm_id = ?', [req.params.id])

    if(queryId.length > 0){
        res.json({message: 'La finca ya tiene formato de registro'})
    }else{
        await pool.query('INSERT INTO answerformatproducer set ?', [dataAnswer])
        res.json({message: 'Datos almacenados con exito'})
    }
    
})

//List of producer register
router.get('/producerSurveyList', async(req, res) =>{
    const querySurvey = await pool.query('SELECT farm.nitProducer, farm.firstName, farm.firstSurname, farm.nameFarm, farm.municipality, farm.vereda, answerformatproducer.respuesta1, answerformatproducer.respuesta2, answerformatproducer.respuesta3, answerformatproducer.respuesta4, answerformatproducer.respuesta5, answerformatproducer.respuesta6, answerformatproducer.respuesta7, answerformatproducer.respuesta8, answerformatproducer.respuesta9, answerformatproducer.respuesta10, answerformatproducer.respuesta11, answerformatproducer.respuesta12, answerformatproducer.respuesta13, answerformatproducer.respuesta14, answerformatproducer.respuesta15, answerformatproducer.respuesta16, answerformatproducer.respuesta17, answerformatproducer.respuesta18, answerformatproducer.respuesta19, answerformatproducer.respuesta20, answerformatproducer.respuesta21, answerformatproducer.respuesta22, answerformatproducer.respuesta23, answerformatproducer.respuesta24, answerformatproducer.respuesta25, answerformatproducer.respuesta26, answerformatproducer.respuesta27, answerformatproducer.respuesta28, answerformatproducer.respuesta29, answerformatproducer.respuesta30, answerformatproducer.respuesta31, answerformatproducer.respuesta32, answerformatproducer.respuesta33, answerformatproducer.respuesta34, answerformatproducer.respuesta35, answerformatproducer.respuesta36, answerformatproducer.respuesta37, answerformatproducer.respuesta38, answerformatproducer.respuesta39, answerformatproducer.respuesta40, answerformatproducer.respuesta41 FROM farm INNER JOIN answerformatproducer ON farm.id_farm = answerformatproducer.farm_id');
    res.json({querySurvey})
})

router.get('/isRegisteredProducer/:id', async(req, res) =>{
    const isRegistered = await pool.query('SELECT * FROM answerformatproducer WHERE farm_id = ?', [req.params.id])
    //console.log("size", isRegistered.length)
    if(isRegistered.length > 0 ){
        res.json({"isRegistered": true})
    }else{
        res.json({"isRegistered": false})
    }
})


//detail of producer register by ID

//update producer register by ID




module.exports = router;