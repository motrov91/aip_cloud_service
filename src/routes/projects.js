const express = require('express');
const router = express.Router();

const pool = require('../database');
const {isLoggedIn} = require('../lib/auth');
const cloudinary = require("cloudinary");

router.get('/projectList', isLoggedIn, async (req, res) => {
    const proj = await pool.query('SELECT * FROM projects');
    res.render('projects/projectList', {proj});
});

router.get('/addProject', isLoggedIn, (req, res) =>{
    res.render('projects/addProject')
})

router.post('/addProject', isLoggedIn, async(req, res) =>{
    const {nom_proyecto, descripcion} = req.body;

    const dataImage = req.file.path;
    const newString = dataImage.slice(15, )

    const newProj = {
        nom_proyecto,
        descripcion,
        logoUno:newString
    } 
    await pool.query('INSERT INTO projects set ?', [newProj]);
    res.redirect('/projectList');
})

router.get('/addLogo/:id', isLoggedIn, async(req, res) => {
    const projectSelected = await pool.query('SELECT * FROM projects WHERE id_project = ?', [req.params.id]);

    res.render('projects/addLogo', {projectSelected});
});

router.post('/addLogo/:id', isLoggedIn, async (req, res)=>{
   const dataImage = req.file.path; 
    //console.log("request:",req.body)

    if (dataImage != "") {
        let uploadStr = dataImage;

        result = await cloudinary.v2.uploader.upload(
        uploadStr,
        {
            overwrite: true,
            invalidate: true,
            width: 480,
            height: 456,
            crop: "scale"
        },
        function (error, result) {
            console.log("error", error);
            console.log("result", result);
        }
        );

        console.log('result', result.url)
        //ruta del servidor /app/src/public/
    }

   const selecProy = await pool.query('SELECT * FROM projects WHERE id_project = ?', [req.params.id]);
   const newUrlLogo = result.url

    if(selecProy[0].logoUno === null){
        selecProy[0].logoUno = newUrlLogo;
        await pool.query('UPDATE projects set ? WHERE id_project = ?', [selecProy[0], req.params.id])
    }else{
        if(selecProy[0].logoDos === null){
            selecProy[0].logoDos = newUrlLogo;
            await pool.query('UPDATE projects set ? WHERE id_project = ?', [selecProy[0], req.params.id])
        }else{
            if(selecProy[0].logoTres === null){
                selecProy[0].logoTres = newUrlLogo;
                await pool.query('UPDATE projects set ? WHERE id_project = ?', [selecProy[0], req.params.id])
            }else{
                if(selecProy[0].logoCuatro === null){
                    selecProy[0].logoCuatro = newUrlLogo;
                    await pool.query('UPDATE projects set ? WHERE id_project = ?', [selecProy[0], req.params.id])
                }else{
                    if(selecProy[0].logoCinco === null){
                        selecProy[0].logoCinco = newUrlLogo;
                        await pool.query('UPDATE projects set ? WHERE id_project = ?', [selecProy[0], req.params.id])
                    }else{
                        if(selecProy[0].logoSeis === null){
                            selecProy[0].logoSeis = newUrlLogo;
                            await pool.query('UPDATE projects set ? WHERE id_project = ?', [selecProy[0], req.params.id])
                        }else{
                            if(selecProy[0].logoSiete === null){
                                selecProy[0].logoSiete = newUrlLogo;
                                await pool.query('UPDATE projects set ? WHERE id_project = ?', [selecProy[0], req.params.id])
                            }else{
                                if(selecProy[0].logoOcho === null){
                                    selecProy[0].logoOcho = newUrlLogo;
                                    await pool.query('UPDATE projects set ? WHERE id_project = ?', [selecProy[0], req.params.id])
                                }else{
                                    console.log('Ya no se pueden cargar mas logos')
                                    res.redirect('/admin/projectList')
                                }
                            }
                        }
                    }
                }
            }
        }
    } 
    res.redirect('/projectList')
})







module.exports = router;