const express = require('express');
const router = express.Router();
const pool = require('../database');


//Create a producer register attached to with a farm
router.post('/questionsProducerPiscicola/:id', async (req, res) => {
    const dataQuery = req.body;
    
    const dataAnswer = {};
    dataAnswer.farm_id_pis = req.params.id
    for(let i=1 ; i<=52; i++){
        if(dataQuery["respuesta"+[i]]){
            dataAnswer['respuesta'+[i]] = dataQuery["respuesta"+[i]];
        }
        if(dataQuery["comment"+[i]]){
            dataAnswer['comment'+[i]] = dataQuery["comment"+[i]];
        }
    }

    

    dataAnswer.user_id_pis = req.body.user_id_pis
    dataAnswer.comments = req.body.comments
    dataAnswer.project_id_pis = req.body.project_id_pis

    const queryId = await pool.query('SELECT * FROM answerproducerpiscicola WHERE farm_id_pis = ?', [req.params.id])
    console.log(typeof('····',req.params.id))
    console.log('dataAns', dataAnswer)

    if(queryId.length > 0){
        res.json({message: 'La finca ya tiene formato de registro'})
    }else{
        await pool.query('INSERT INTO answerProducerPiscicola set ?', [dataAnswer])
        res.json({message: 'Datos almacenados con exito'})
    } 
})

router.get('/questionsProducerPiscicola/:id', async (req, res) => {
    res.json('Conecta');
})

router.get('/isRegisteredProducerPiscicola/:id', async(req, res) =>{
    const isRegistered = await pool.query('SELECT * FROM answerproducerpiscicola WHERE farm_id_pis = ?', [req.params.id])
    //console.log("size", isRegistered.length)
    if(isRegistered.length > 0 ){
        res.json({"isRegistered": true})
    }else{
        res.json({"isRegistered": false})
    }
})

//List of producer register
/* router.get('/producerSurveyList', async(req, res) =>{
    const querySurvey = await pool.query('SELECT farm.nitProducer, farm.firstName, farm.firstSurname, farm.nameFarm, farm.municipality, farm.vereda, answerFormatProducer.respuesta1, answerFormatProducer.respuesta2, answerFormatProducer.respuesta3, answerFormatProducer.respuesta4, answerFormatProducer.respuesta5, answerFormatProducer.respuesta6, answerFormatProducer.respuesta7, answerFormatProducer.respuesta8, answerFormatProducer.respuesta9, answerFormatProducer.respuesta10, answerFormatProducer.respuesta11, answerFormatProducer.respuesta12, answerFormatProducer.respuesta13, answerFormatProducer.respuesta14, answerFormatProducer.respuesta15, answerFormatProducer.respuesta16, answerFormatProducer.respuesta17, answerFormatProducer.respuesta18, answerFormatProducer.respuesta19, answerFormatProducer.respuesta20, answerFormatProducer.respuesta21, answerFormatProducer.respuesta22, answerFormatProducer.respuesta23, answerFormatProducer.respuesta24, answerFormatProducer.respuesta25, answerFormatProducer.respuesta26, answerFormatProducer.respuesta27, answerFormatProducer.respuesta28, answerFormatProducer.respuesta29, answerFormatProducer.respuesta30, answerFormatProducer.respuesta31, answerFormatProducer.respuesta32, answerFormatProducer.respuesta33, answerFormatProducer.respuesta34, answerFormatProducer.respuesta35, answerFormatProducer.respuesta36, answerFormatProducer.respuesta37, answerFormatProducer.respuesta38, answerFormatProducer.respuesta39, answerFormatProducer.respuesta40, answerFormatProducer.respuesta41 FROM farm INNER JOIN answerFormatProducer ON farm.id_farm = answerFormatProducer.farm_id');
    res.json({querySurvey})
})

 */


//detail of producer register by ID

//update producer register by ID




module.exports = router;