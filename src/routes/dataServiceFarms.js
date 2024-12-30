const express = require("express");
const router = express.Router();
const fn = require("../controllers/functions");
const pool = require("../database");
const fs = require("fs");
const cloudinary = require("cloudinary");
const http = require("http");
const path = require('path');
const xl = require('excel4node');
let PDFDocument = require('pdfkit');
const imageToBase64 = require('image-to-base64');

const image2base64 = require("image-to-base64");

cloudinary.config({
  cloud_name: "tecnologia-aplicada-octa",
  api_key: "392792575655893",
  api_secret: "8iQ0ASIr6lRkyYstUjd2mnrlYL4",
});

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

//Creando una finca
router.post("/newFarm", async (req, res, next) => {

  const existFarm = await pool.query(
    "SELECT * from farm WHERE nitProducer = ?",
    [req.body.nitProducer]
  );

  if(existFarm.length != 0){
    return res.json({
      mensaje: "Los datos se han almacenado con exito",
      id_farm: existFarm[0].id_farm,
      img_beneficiario: existFarm[0].imgBeneficiario,
      firstName: existFarm[0].firstName,
      secondName: existFarm[0].secondName,
      firstSurname: existFarm[0].firstSurname,
      secondSurname: existFarm[0].secondSurname,
      nitProducer: existFarm[0].nitProducer,
      expedition: existFarm[0].expedition,
      birthdate: existFarm[0].birthdate,
      ethnicity: existFarm[0].ethnicity,
      celphone1: existFarm[0].celphone1,
      celphone2: existFarm[0].celphone2,
      email: existFarm[0].email,
      gender: existFarm[0].gender,
      scholarLevel: existFarm[0].scholarLevel,
      organization: existFarm[0].organization,
      maritalStatus: existFarm[0].maritalStatus,
      fullnameSpouse: existFarm[0].fullnameSpouse,
      nitSpouse: existFarm[0].nitProducer,
      expeditionSpouse: existFarm[0].expeditionSpouse,
      dateSpouse: existFarm[0].dateSpouse,
      celphoneSpouse: existFarm[0].celphoneSpouse,
      emailSpouse: existFarm[0].emailSpouse,
      nameFarm: existFarm[0].nameFarm,
      municipality: existFarm[0].municipality,
      corregimiento: existFarm[0].corregimiento,
      vereda: existFarm[0].vereda,
      possession: existFarm[0].possession,
      totalExtension: existFarm[0].totalExtension,
      cropsArea: existFarm[0].cropsArea,
      freeArea: existFarm[0].freeArea,
      conservationArea: existFarm[0].conservationArea,
      currentProjects: existFarm[0].currentProjects,
      agrochemical: existFarm[0].agrochemical,
      bestPractices: existFarm[0].bestPractices,
      otherAreas: existFarm[0].otherAreas,
      afluentes: existFarm[0].afluentes,
      vocationAndLandUse: existFarm[0].vocationAndLandUse,
      productiveLine: existFarm[0].productiveLine,
      certificationType: existFarm[0].certificationType,
      purlieuNorth: existFarm[0].purlieuNorth,
      purlieuSouth: existFarm[0].purlieuSouth,
      purlieuEast: existFarm[0].purlieuEast,
      purlieuWest: existFarm[0].purlieuWest,
      altura: existFarm[0].altura,
      latitudeLongitude: existFarm[0].latitudeLongitude,
      anosPropiedad: existFarm[0].anosPropiedad,
      productiveLine1: existFarm[0].productiveLine1,
      productiveLine2: existFarm[0].productiveLine2,
      productiveLine3: existFarm[0].productiveLine3,
      knowProductiveLine1: existFarm[0].knowProductiveLine1,
      knowProductiveLine2: existFarm[0].knowProductiveLine2,
      knowPeoductiveLine3: existFarm[0].knowPeoductiveLine3,
      comercializationType: existFarm[0].comercializationType,
      biopreparadosProduction: existFarm[0].biopreparadosProduction,
      waterAvailable: existFarm[0].waterAvailable,
      accessRoads: existFarm[0].accessRoads,
      electricityAvailability: existFarm[0].electricityAvailability,
      ComunicationAvailable: existFarm[0].ComunicationAvailable,
      projectParticipation: existFarm[0].projectParticipation,
      cropTools: existFarm[0].cropTools,
      firstAidKit: existFarm[0].firstAidKit,
      fumigateKit: existFarm[0].fumigateKit,
      irrigationSystem: existFarm[0].irrigationSystem,
      machines: existFarm[0].machines,
      ParticipateInProyects: existFarm[0].ParticipateInProyects,
      workingCapital: existFarm[0].workingCapital,
      implementationTecnologyLevel: existFarm[0].implementationTecnologyLevel,
      productLine1: existFarm[0].productLine1,
      variety1: existFarm[0].variety1,
      cantPlants1: existFarm[0].cantPlants1,
      plantsDistance1: existFarm[0].plantsDistance1,
      groovesDistance1: existFarm[0].groovesDistance1,
      ageCrop1: existFarm[0].ageCrop1,
      stageCrop1: existFarm[0].stageCrop1,
      cantKgProducedByYear1: existFarm[0].cantKgProducedByYear1,
      cropStatus1: existFarm[0].cropStatus1,
      aproxArea1: existFarm[0].aproxArea1,
      coordenates1: existFarm[0].coordenates1,
      useType: existFarm[0].useType,
      promKgComercializateValue: existFarm[0].promKgComercializateValue,
      productLine2: existFarm[0].productLine2,
      variety2: existFarm[0].variety2,
      cantPlants2: existFarm[0].cantPlants2,
      plantsDistance2: existFarm[0].plantsDistance2,
      groovesDistance2: existFarm[0].groovesDistance2,
      ageCrop2: existFarm[0].ageCrop2,
      stageCrop2: existFarm[0].stageCrop2,
      cantKgProducedByYear2: existFarm[0].cantKgProducedByYear2,
      cropStatus2: existFarm[0].cropStatus2,
      aproxArea2: existFarm[0].aproxArea2,
      coordenates2: existFarm[0].coordenates2,
      useType2: existFarm[0].useType2,
      promKgComercializateValu2: existFarm[0].promKgComercializateValu2,
      productLine3: existFarm[0].productLine3,
      variety3: existFarm[0].variety3,
      cantPlants3: existFarm[0].cantPlants3,
      plantsDistance3: existFarm[0].plantsDistance3,
      groovesDistance3: existFarm[0].groovesDistance3,
      ageCrop3: existFarm[0].ageCrop3,
      stageCrop3: existFarm[0].stageCrop3,
      cantKgProducedByYear3: existFarm[0].cantKgProducedByYear3,
      cropStatus3: existFarm[0].cropStatus3,
      aproxArea3: existFarm[0].aproxArea3,
      coordenates3: existFarm[0].coordenates3,
      useType3: existFarm[0].useType3,
      promKgComercializateValu3: existFarm[0].promKgComercializateValu3,
      projectId: existFarm[0].projectId,
      productLine4Pecuaria: existFarm[0].productLine4Pecuaria,
      breed: existFarm[0].breed,
      cantAnimals: existFarm[0].cantAnimals,
      numberPlaces: existFarm[0].numberPlaces,
      ageAverageAnimals: existFarm[0].ageAverageAnimals,
      ageCrop4: existFarm[0].ageCrop4,
      cantKgProducedByYear4: existFarm[0].cantKgProducedByYear4,
      cropStatus4: existFarm[0].cropStatus4,
      aproxArea4: existFarm[0].aproxArea4,
      coordenates4: existFarm[0].coordenates4,
      nutritionType: existFarm[0].nutritionType,
      promKgComercializateValu4: existFarm[0].promKgComercializateValu4,
      productLine5Pecuaria: existFarm[0].productLine5Pecuaria,
      breed5: existFarm[0].breed5,
      cantAnimals5: existFarm[0].cantAnimals5,
      numberPlaces5: existFarm[0].numberPlaces5,
      ageAverageAnimals5: existFarm[0].ageAverageAnimals5,
      ageCrop5: existFarm[0].ageCrop5,
      cantKgProducedByYear5: existFarm[0].cantKgProducedByYear5,
      cropStatus5: existFarm[0].cropStatus5,
      aproxArea5: existFarm[0].aproxArea5,
      coordenates5: existFarm[0].coordenates5,
      nutritionType5: existFarm[0].nutritionType5,
      promKgComercializateValu5: existFarm[0].promKgComercializateValu5,
      imgSignature: existFarm[0].imgSig,
      creationDate: existFarm[0].creationDate,
      userId: existFarm[0].userId,
      comments: existFarm[0].comments,
      knowProductiveLine4: existFarm[0].knowProductiveLine4,
      knowProductiveLine5: existFarm[0].knowProductiveLine5,
      cant_kg_by_year_lote4: existFarm[0].cant_kg_by_year_lote4,
      cant_kg_by_year_lote5: existFarm[0].cant_kg_by_year_lote5,
      price_kg_sold_lote4: existFarm[0].price_kg_sold_lote4,
      price_kg_sold_lote5: existFarm[0].price_kg_sold_lote5,
      typeofanimal:existFarm[0].typeofanimal,
      typeofanimal5:existFarm[0].typeofanimal5,
      nombreLineaProductiva5: existFarm[0].nombreLineaProductiva5,
      numeroTotalAnimales5 : existFarm[0].numeroTotalAnimales5,
      numeroHembras5 : existFarm[0].numeroHembras5,
      numeroMachos5 : existFarm[0].numeroMachos5,
      numeroVacasOrdeno5 : existFarm[0].numeroVacasOrdeno5,
      tipoProduccion5 : existFarm[0].tipoProduccion5,
      tipoExplotacion5 : existFarm[0].tipoExplotacion5,
      raza5: existFarm[0].raza5,
      areaAproxAnimales5 : existFarm[0].areaAproxAnimales5,
      tipoManejo5 : existFarm[0].tipoManejo5,
      numeroLotesPastoreo5 : existFarm[0].numeroLotesPastoreo5,
      tipoFertilizacionPastos5 : existFarm[0].tipoFertilizacionPastos5,
      implementaBPG5 : existFarm[0].implementaBPG5,
      implementaBPO5 : existFarm[0].implementaBPO5,
      tratamientoAguasResiduales5 : existFarm[0].tratamientoAguasResiduales5,
      estadoGeneralAnimales5 : existFarm[0].estadoGeneralAnimales5,
      manejoProductivo5 : existFarm[0].manejoProductivo5,
      tipoAlimentacion5 : existFarm[0].tipoAlimentacion5,
      cantidadLitrosDia5 : existFarm[0].cantidadLitrosDia5,
      destinoFinalLeche5 : existFarm[0].destinoFinalLeche5,
      precioVentaLecheLitro5 : existFarm[0].precioVentaLecheLitro5,
      cantidadKGANO5: existFarm[0].cantidadKGANO5,
      precioVentaKGCarne5 : existFarm[0].precioVentaKGCarne5,
      formaComercializacionProducto5 : existFarm[0].formaComercializacionProducto5,
      frecuenciaEntrega5: existFarm[0].frecuenciaEntrega5,
      nombreLineaProductiva6: existFarm[0].nombreLineaProductiva6,
      areaGalpon6: existFarm[0].areaGalpon6,
      numeroAnimales6: existFarm[0].numeroAnimales6,
      tipoExplotacion6: existFarm[0].tipoExplotacion6,
      tipoAlimentacion6: existFarm[0].tipoAlimentacion6,
      granjaBiosegura6: existFarm[0].granjaBiosegura6,
      planSanitario6: existFarm[0].planSanitario6,
      implementaBPA6: existFarm[0].implementaBPA6,
      estadoGeneralAnimales6: existFarm[0].estadoGeneralAnimales6,
      tratamientoAguasResiduales6: existFarm[0].tratamientoAguasResiduales6,
      tipoRazaPostura6: existFarm[0].tipoRazaPostura6,
      numeroSemanasAves6: existFarm[0].numeroSemanasAves6,
      galloEnGalpon6: existFarm[0].galloEnGalpon6,
      cantidadHuevosSemana6: existFarm[0].cantidadHuevosSemana6,
      porcentajePosturaSemanal6: existFarm[0].porcentajePosturaSemanal6,
      clasificaHuevosPorPeso6: existFarm[0].clasificaHuevosPorPeso6,
      tipoComercializacion6: existFarm[0].tipoComercializacion6,
      precioUnidadHuevo6: existFarm[0].precioUnidadHuevo6,
      presentacion6: existFarm[0].presentacion6,
      porcentajeMortalidadPostura6: existFarm[0].porcentajeMortalidadPostura6,
      formaComercializacionProducto6: existFarm[0].formaComercializacionProducto6,
      cantidadKgCarnePollosPorCiclo6: existFarm[0].cantidadKgCarnePollosPorCiclo6,
      precioVentaCarneKg6: existFarm[0].precioVentaCarneKg6,
      porcentajeMortalidadCicloEngorde6: existFarm[0].porcentajeMortalidadCicloEngorde6,
      frecuenciaEntrega6: existFarm[0].frecuenciaEntrega6,
      nombreLineaProductiva7: existFarm[0].nombreLineaProductiva7,
      numeroTotalAnimales7: existFarm[0].numeroTotalAnimales7,
      numeroHembras7: existFarm[0].numeroHembras7,
      numeroMachos7: existFarm[0].numeroMachos7,
      raza7: existFarm[0].raza7,
      areaUsadaAnimales7: existFarm[0].areaUsadaAnimales7,
      implementaBPP7: existFarm[0].implementaBPP7,
      estadoGeneralAnimales7: existFarm[0].estadoGeneralAnimales7,
      tratamientoAguasResiduales7: existFarm[0].tratamientoAguasResiduales7,
      tipoProduccion7: existFarm[0].tipoProduccion7,
      tipoAlimentacion7: existFarm[0].tipoAlimentacion7,
      numeroHembrasCria7: existFarm[0].numeroHembrasCria7,
      numeroLechonesLactantes7: existFarm[0].numeroLechonesLactantes7,
      numeroAnimalesLevanteCeba7: existFarm[0].numeroAnimalesLevanteCeba7,
      numeroMachosReporductores7: existFarm[0].numeroMachosReporductores7,
      porcentajeMortalidad7: existFarm[0].porcentajeMortalidad7,
      cantidadKgEtapa7: existFarm[0].cantidadKgEtapa7,
      precioVentaCarneKg7: existFarm[0].precioVentaCarneKg7,
      formaComercializacionProducto7: existFarm[0].formaComercializacionProducto7,
      ventaAnimales7: existFarm[0].ventaAnimales7,
      frecuenciaEntrega7: existFarm[0].frecuenciaEntrega7,
      nombreLineaProductiva8: existFarm[0].nombreLineaProductiva8,
      numeroEstanques8: existFarm[0].numeroEstanques8,
      areaUsadaAnimales8: existFarm[0].areaUsadaAnimales8,
      densidadSiembra8: existFarm[0].densidadSiembra8,
      orientacionGranja8: existFarm[0].orientacionGranja8,
      sistemaProduccion8: existFarm[0].sistemaProduccion8,
      infraestructura8: existFarm[0].infraestructura8,
      implementaBPP8: existFarm[0].implementaBPP8,
      estadoGeneralAnimales8: existFarm[0].estadoGeneralAnimales8,
      tratamientoAguasResiduales8: existFarm[0].tratamientoAguasResiduales8,
      procentajeMortalidadAnual8: existFarm[0].procentajeMortalidadAnual8,
      comoTratanAguas8: existFarm[0].comoTratanAguas8,
      tipoAlimentacion8: existFarm[0].tipoAlimentacion8,
      promedioAlevinosSembradosAno8: existFarm[0].promedioAlevinosSembradosAno8,
      formaComercializacionProducto8: existFarm[0].formaComercializacionProducto8,
      totalPecesCosechadosCiclo8: existFarm[0].totalPecesCosechadosCiclo8,
      precioVentaCarne8: existFarm[0].precioVentaCarne8,
      presentacionVenta8: existFarm[0].presentacionVenta8,
      frecuenciaEntrega8: existFarm[0].frecuenciaEntrega8,
      numeroColemnas9: existFarm[0].numeroColemnas9,
      especie9: existFarm[0].especie9,
      areaApiario9: existFarm[0].areaApiario9,
      tipoApicultura9: existFarm[0].tipoApicultura9,
      numeroPromedioAbejasColmena9: existFarm[0].numeroPromedioAbejasColmena9,
      implementaBPP9: existFarm[0].implementaBPP9,
      estadoGeneralAnimales9: existFarm[0].estadoGeneralAnimales9,
      calendariosFloracion9: existFarm[0].calendariosFloracion9,
      variedadFloracionZona9: existFarm[0].variedadFloracionZona9,
      tipoSuplementacion9: existFarm[0].tipoSuplementacion9,
      formacionTecnicaActividad9: existFarm[0].formacionTecnicaActividad9,
      enfermedadColmena9: existFarm[0].enfermedadColmena9,
      tipoProducto9: existFarm[0].tipoProducto9,
      tipoEmpaque9: existFarm[0].tipoEmpaque9,
      cantidadLitrosCosechaSemestre9: existFarm[0].cantidadLitrosCosechaSemestre9,
      precioVentaLitro9: existFarm[0].precioVentaLitro9,
      formaComercializacionProducto9: existFarm[0].formaComercializacionProducto9,
      frecuenciaEntrega9: existFarm[0].frecuenciaEntrega9,
      nombreLineaProductiva10: existFarm[0].nombreLineaProductiva10,
      numeroTotalAnimales10: existFarm[0].numeroTotalAnimales10,
      numeroHembras10: existFarm[0].numeroHembras10,
      numeroMachos10: existFarm[0].numeroMachos10,
      raza10: existFarm[0].raza10,
      areaUsadaAnimales10: existFarm[0].areaUsadaAnimales10,
      instalaciones10: existFarm[0].instalaciones10,
      implementaBPP10: existFarm[0].implementaBPP10,
      estadoGeneralAnimales10: existFarm[0].estadoGeneralAnimales10,
      tratamientoAguasResiduales10: existFarm[0].tratamientoAguasResiduales10,
      tipoProduccion10: existFarm[0].tipoProduccion10,
      tipoAlimentacion10: existFarm[0].tipoAlimentacion10,
      numeroHembrasCria10: existFarm[0].numeroHembrasCria10,
      numeroGazaposLactantes10: existFarm[0].numeroGazaposLactantes10,
      numeroAnimalesLevanteCeba10: existFarm[0].numeroAnimalesLevanteCeba10,
      numeroMachosReproductores10: existFarm[0].numeroMachosReproductores10,
      porcentajeMortalidad10: existFarm[0].porcentajeMortalidad10,
      cantidadKgEtapa10: existFarm[0].cantidadKgEtapa10,
      precioVentaCarneKg10: existFarm[0].precioVentaCarneKg10,
      formaComercializacionProducto10: existFarm[0].formaComercializacionProducto10,
      ventaAnimales10: existFarm[0].ventaAnimales10,
      frecuenciaEntrega10: existFarm[0].frecuenciaEntrega10,
      tipoDocumento: existFarm[0].tipoDocumento,
      edad: existFarm[0].edad,
      tipoEtnia: existFarm[0].tipoEtnia,
      orientacionSexualAfectiva: existFarm[0].orientacionSexualAfectiva,
      identidadGenero: existFarm[0].identidadGenero,
      tipoViolenciaGenero: existFarm[0].tipoViolenciaGenero,
      denunciasTipodeViolencia: existFarm[0].denunciasTipodeViolencia,
      regimen: existFarm[0].regimen,
      eps: existFarm[0].eps,
      tieneSISBEN: existFarm[0].tieneSISBEN,
      categoriaSISBEN: existFarm[0].categoriaSISBEN,
      victimaConflicto: existFarm[0].victimaConflicto,
      desplazamientoForzado: existFarm[0].desplazamientoForzado,
      num_personas_vive_usted: existFarm[0].num_personas_vive_usted,
      hijos_menores_18_viven_con_usted: existFarm[0].hijos_menores_18_viven_con_usted,
      hijos_entre_18_28_viven_con_usted: existFarm[0].hijos_entre_18_28_viven_con_usted,
      num_adultos_mayores_viven_con_usted: existFarm[0].num_adultos_mayores_viven_con_usted,
      condicionVulnerabilidad: existFarm[0].condicionVulnerabilidad,
      tipoCondicionVulnerabilidad: existFarm[0].tipoCondicionVulnerabilidad,
      presentaCondicionVulnerabilidadEnNucleo: existFarm[0].presentaCondicionVulnerabilidadEnNucleo,
      predioRegistradoICA: existFarm[0].predioRegistradoICA,
      limitantesSistemaProductivo: existFarm[0].limitantesSistemaProductivo,
    });
  }


  let result = {};
  let imgSignat = {};
  const imgBeneficiario = req.body.img_beneficiario;
  const imgSig = req.body.imgSignature;

  //console.log("request:",req.body)

  if (req.body.img_beneficiario != "") {
    const imagen = req.body.img_beneficiario;
    let uploadStr = 'data:image/jpeg;base64,' + imagen;

    result = await cloudinary.v2.uploader.upload(
      uploadStr,
      {
        overwrite: true,
        invalidate: true,
        width: 810, 
        height: 656,
        //crop: "crop",
      },
      function (error, result) {
        console.log("error", error);
        console.log("result", result);
      }
    );

    //ruta del servidor /app/src/public/
  }

  if (req.body.imgSignature != "") {
    const imgSignature = req.body.imgSignature;
    let uploadStr = 'data:image/jpeg;base64,' + imgSignature;
    imgSignat = await cloudinary.v2.uploader.upload(
      uploadStr,
      {
        overwrite: true,
        invalidate: true,
        width: 810,
        height: 456,
        //crop: "fill",
      },
      function (error, result) {
        console.log("error", error);
        console.log("result", result);
      }
    );
  }

  const {
    firstName,
    secondName,
    firstSurname,
    secondSurname,
    nitProducer,
    expedition,
    birthdate,
    ethnicity,
    celphone1,
    celphone2,
    email,
    gender,
    scholarLevel,
    organization,
    maritalStatus,
    fullnameSpouse,
    nitSpouse,
    expeditionSpouse,
    dateSpouse,
    celphoneSpouse,
    emailSpouse,
    nameFarm,
    municipality,
    corregimiento,
    vereda,
    possession,
    totalExtension,
    cropsArea,
    freeArea,
    conservationArea,
    currentProjects,
    agrochemical,
    bestPractices,
    otherAreas,
    afluentes,
    vocationAndLandUse,
    productiveLine,
    certificationType,
    purlieuNorth,
    purlieuSouth,
    purlieuEast,
    purlieuWest,
    altura,
    latitudeLongitude,
    anosPropiedad,
    productiveLine1,
    productiveLine2,
    productiveLine3,
    productiveLine4,
    productiveLine5,
    knowProductiveLine1,
    knowProductiveLine2,
    knowPeoductiveLine3,
    comercializationType,
    biopreparadosProduction,
    waterAvailable,
    accessRoads,
    electricityAvailability,
    ComunicationAvailable,
    projectParticipation,
    cropTools,
    firstAidKit,
    fumigateKit,
    irrigationSystem,
    machines,
    ParticipateInProyects,
    workingCapital,
    implementationTecnologyLevel,
    productLine1,
    variety1,
    cantPlants1,
    ageCrop1,
    stageCrop1,
    cantKgProducedByYear1,
    cropStatus1,
    aproxArea1,
    coordenates1,
    useType,
    promKgComercializateValue,
    productLine2,
    variety2,
    cantPlants2,
    ageCrop2,
    stageCrop2,
    cantKgProducedByYear2,
    cropStatus2,
    aproxArea2,
    coordenates2,
    useType2,
    promKgComercializateValu2,
    productLine3,
    variety3,
    cantPlants3,
    ageCrop3,
    stageCrop3,
    cantKgProducedByYear3,
    cropStatus3,
    aproxArea3,
    coordenates3,
    useType3,
    promKgComercializateValu3,
    projectId,
    productLine4Pecuaria,
    breed,
    cantAnimals,
    numberPlaces,
    ageAverageAnimals,
    ageCrop4, 
    cantKgProducedByYear4,
    cropStatus4,
    aproxArea4,
    coordenates4,
    nutritionType,
    promKgComercializateValu4,
    productLine5Pecuaria,
    breed5,
    cantAnimals5,
    numberPlaces5,
    ageAverageAnimals5,
    ageCrop5, 
    cantKgProducedByYear5,
    cropStatus5,
    aproxArea5,
    coordenates5,
    nutritionType5,
    promKgComercializateValu5,
    imgSignature,
    creationDate,
    userId,
    comments,
    plantsDistance1,
    groovesDistance1,
    plantsDistance2,
    groovesDistance2,
    plantsDistance3,
    groovesDistance3,
    knowProductiveLine4,
    knowProductiveLine5,
    cant_kg_by_year_lote4,
    cant_kg_by_year_lote5,
    price_kg_sold_lote4,
    price_kg_sold_lote5,
    typeofanimal,
    typeofanimal5,
    nombreLineaProductiva5,
    numeroTotalAnimales5,
    numeroHembras5,
    numeroMachos5,
    numeroVacasOrdeno5,
    tipoProduccion5,
    tipoExplotacion5,
    raza5,
    areaAproxAnimales5,
    tipoManejo5,
    numeroLotesPastoreo5,
    tipoFertilizacionPastos5,
    implementaBPG5,
    implementaBPO5,
    tratamientoAguasResiduales5,
    estadoGeneralAnimales5,
    manejoProductivo5,
    tipoAlimentacion5,
    cantidadLitrosDia5,
    destinoFinalLeche5,
    precioVentaLecheLitro5,
    cantidadKGANO5,
    precioVentaKGCarne5,
    formaComercializacionProducto5,
    frecuenciaEntrega5,
    nombreLineaProductiva6,
    areaGalpon6,
    numeroAnimales6,
    tipoExplotacion6,
    tipoAlimentacion6,
    granjaBiosegura6,
    planSanitario6,
    implementaBPA6,
    estadoGeneralAnimales6,
    tratamientoAguasResiduales6,
    tipoRazaPostura6,
    numeroSemanasAves6,
    galloEnGalpon6,
    cantidadHuevosSemana6,
    porcentajePosturaSemanal6,
    clasificaHuevosPorPeso6,
    tipoComercializacion6,
    precioUnidadHuevo6,
    presentacion6,
    porcentajeMortalidadPostura6,
    formaComercializacionProducto6,
    cantidadKgCarnePollosPorCiclo6,
    precioVentaCarneKg6,
    porcentajeMortalidadCicloEngorde6,
    frecuenciaEntrega6,
    nombreLineaProductiva7,
    numeroTotalAnimales7,
    numeroHembras7,
    numeroMachos7,
    raza7,
    areaUsadaAnimales7,
    implementaBPP7,
    estadoGeneralAnimales7,
    tratamientoAguasResiduales7,
    tipoProduccion7,
    tipoAlimentacion7,
    numeroHembrasCria7,
    numeroLechonesLactantes7,
    numeroAnimalesLevanteCeba7,
    numeroMachosReporductores7,
    porcentajeMortalidad7,
    cantidadKgEtapa7,
    precioVentaCarneKg7,
    formaComercializacionProducto7,
    ventaAnimales7,
    frecuenciaEntrega7,
    nombreLineaProductiva8,
    numeroEstanques8,
    areaUsadaAnimales8,
    densidadSiembra8,
    orientacionGranja8,
    sistemaProduccion8,
    infraestructura8,
    implementaBPP8,
    estadoGeneralAnimales8,
    tratamientoAguasResiduales8,
    procentajeMortalidadAnual8,
    comoTratanAguas8,
    tipoAlimentacion8,
    promedioAlevinosSembradosAno8,
    formaComercializacionProducto8,
    totalPecesCosechadosCiclo8,
    precioVentaCarne8,
    presentacionVenta8,
    frecuenciaEntrega8,
    numeroColemnas9,
    especie9,
    areaApiario9,
    tipoApicultura9,
    numeroPromedioAbejasColmena9,
    implementaBPP9,
    estadoGeneralAnimales9,
    calendariosFloracion9,
    variedadFloracionZona9,
    tipoSuplementacion9,
    formacionTecnicaActividad9,
    enfermedadColmena9,
    tipoProducto9,
    tipoEmpaque9,
    cantidadLitrosCosechaSemestre9,
    precioVentaLitro9,
    formaComercializacionProducto9,
    frecuenciaEntrega9,
    nombreLineaProductiva10,
    numeroTotalAnimales10,
    numeroHembras10,
    numeroMachos10,
    raza10,
    areaUsadaAnimales10,
    instalaciones10,
    implementaBPP10,
    estadoGeneralAnimales10,
    tratamientoAguasResiduales10,
    tipoProduccion10,
    tipoAlimentacion10,
    numeroHembrasCria10,
    numeroGazaposLactantes10,
    numeroAnimalesLevanteCeba10,
    numeroMachosReproductores10,
    porcentajeMortalidad10,
    cantidadKgEtapa10,
    precioVentaCarneKg10,
    formaComercializacionProducto10,
    ventaAnimales10,
    frecuenciaEntrega10,
    tipoDocumento,
    edad,
    tipoEtnia,
    orientacionSexualAfectiva,
    identidadGenero,
    tipoViolenciaGenero,
    denunciasTipodeViolencia,
    regimen,
    eps,
    tieneSISBEN,
    categoriaSISBEN,
    victimaConflicto,
    desplazamientoForzado,
    num_personas_vive_usted,
    hijos_menores_18_viven_con_usted,
    hijos_entre_18_28_viven_con_usted,
    num_adultos_mayores_viven_con_usted,
    condicionVulnerabilidad,
    tipoCondicionVulnerabilidad,
    presentaCondicionVulnerabilidadEnNucleo,
    predioRegistradoICA,
    limitantesSistemaProductivo,
  } = req.body;

  const newFarm = {
    img_beneficiario: result.url,
    firstName,
    secondName,
    firstSurname,
    secondSurname,
    nitProducer,
    expedition,
    birthdate,
    ethnicity,
    celphone1,
    celphone2,
    email,
    gender,
    scholarLevel,
    organization,
    maritalStatus,
    fullnameSpouse,
    nitSpouse,
    expeditionSpouse,
    dateSpouse,
    celphoneSpouse,
    emailSpouse,
    nameFarm,
    municipality,
    corregimiento,
    vereda,
    possession,
    totalExtension,
    cropsArea,
    freeArea,
    conservationArea,
    currentProjects,
    agrochemical,
    bestPractices,
    otherAreas,
    afluentes,
    vocationAndLandUse,
    productiveLine,
    certificationType,
    purlieuNorth,
    purlieuSouth,
    purlieuEast,
    purlieuWest,
    altura,
    latitudeLongitude,
    anosPropiedad,
    productiveLine1,
    productiveLine2,
    productiveLine3,
    knowProductiveLine1,
    knowProductiveLine2,
    knowPeoductiveLine3,
    comercializationType,
    biopreparadosProduction,
    waterAvailable,
    accessRoads,
    electricityAvailability,
    ComunicationAvailable,
    projectParticipation,
    cropTools,
    firstAidKit,
    fumigateKit,
    irrigationSystem,
    machines,
    ParticipateInProyects,
    workingCapital,
    implementationTecnologyLevel,
    productLine1,
    variety1,
    cantPlants1,
    ageCrop1,
    stageCrop1,
    cantKgProducedByYear1,
    cropStatus1,
    aproxArea1,
    coordenates1,
    useType,
    promKgComercializateValue,
    productLine2,
    variety2,
    cantPlants2,
    ageCrop2,
    stageCrop2,
    cantKgProducedByYear2,
    cropStatus2,
    aproxArea2,
    coordenates2,
    useType2,
    promKgComercializateValu2,
    productLine3,
    variety3,
    cantPlants3,
    ageCrop3,
    stageCrop3,
    cantKgProducedByYear3,
    cropStatus3,
    aproxArea3,
    coordenates3,
    useType3,
    promKgComercializateValu3,
    projectId,
    productLine4Pecuaria,
    breed,
    cantAnimals,
    numberPlaces,
    ageAverageAnimals,
    ageCrop4,
    cantKgProducedByYear4,
    cropStatus4,
    aproxArea4,
    coordenates4,
    nutritionType,
    promKgComercializateValu4,
    productLine5Pecuaria,
    breed5,
    cantAnimals5,
    numberPlaces5,
    ageAverageAnimals5,
    ageCrop5,
    cantKgProducedByYear5,
    cropStatus5,
    aproxArea5,
    coordenates5,
    nutritionType5,
    promKgComercializateValu5,
    productiveLine4,
    productiveLine5,
    imgSignature: imgSignat.url,
    creationDate,
    userId,
    comments,
    plantsDistance1,
    groovesDistance1,
    plantsDistance2,
    groovesDistance2,
    plantsDistance3,
    groovesDistance3,
    knowProductiveLine4,
    knowProductiveLine5,
    cant_kg_by_year_lote4,
    cant_kg_by_year_lote5,
    price_kg_sold_lote4,
    price_kg_sold_lote5,
    typeofanimal,
    typeofanimal5,
    nombreLineaProductiva5,
    numeroTotalAnimales5,
    numeroHembras5,
    numeroMachos5,
    numeroVacasOrdeno5,
    tipoProduccion5,
    tipoExplotacion5,
    raza5,
    areaAproxAnimales5,
    tipoManejo5,
    numeroLotesPastoreo5,
    tipoFertilizacionPastos5,
    implementaBPG5,
    implementaBPO5,
    tratamientoAguasResiduales5,
    estadoGeneralAnimales5,
    manejoProductivo5,
    tipoAlimentacion5,
    cantidadLitrosDia5,
    destinoFinalLeche5,
    precioVentaLecheLitro5,
    cantidadKGANO5,
    precioVentaKGCarne5,
    formaComercializacionProducto5,
    frecuenciaEntrega5,
    nombreLineaProductiva6,
    areaGalpon6,
    numeroAnimales6,
    tipoExplotacion6,
    tipoAlimentacion6,
    granjaBiosegura6,
    planSanitario6,
    implementaBPA6,
    estadoGeneralAnimales6,
    tratamientoAguasResiduales6,
    tipoRazaPostura6,
    numeroSemanasAves6,
    galloEnGalpon6,
    cantidadHuevosSemana6,
    porcentajePosturaSemanal6,
    clasificaHuevosPorPeso6,
    tipoComercializacion6,
    precioUnidadHuevo6,
    presentacion6,
    porcentajeMortalidadPostura6,
    formaComercializacionProducto6,
    cantidadKgCarnePollosPorCiclo6,
    precioVentaCarneKg6,
    porcentajeMortalidadCicloEngorde6,
    frecuenciaEntrega6,
    nombreLineaProductiva7,
    numeroTotalAnimales7,
    numeroHembras7,
    numeroMachos7,
    raza7,
    areaUsadaAnimales7,
    implementaBPP7,
    estadoGeneralAnimales7,
    tratamientoAguasResiduales7,
    tipoProduccion7,
    tipoAlimentacion7,
    numeroHembrasCria7,
    numeroLechonesLactantes7,
    numeroAnimalesLevanteCeba7,
    numeroMachosReporductores7,
    porcentajeMortalidad7,
    cantidadKgEtapa7,
    precioVentaCarneKg7,
    formaComercializacionProducto7,
    ventaAnimales7,
    frecuenciaEntrega7,
    nombreLineaProductiva8,
    numeroEstanques8,
    areaUsadaAnimales8,
    densidadSiembra8,
    orientacionGranja8,
    sistemaProduccion8,
    infraestructura8,
    implementaBPP8,
    estadoGeneralAnimales8,
    tratamientoAguasResiduales8,
    procentajeMortalidadAnual8,
    comoTratanAguas8,
    tipoAlimentacion8,
    promedioAlevinosSembradosAno8,
    formaComercializacionProducto8,
    totalPecesCosechadosCiclo8,
    precioVentaCarne8,
    presentacionVenta8,
    frecuenciaEntrega8,
    numeroColemnas9,
    especie9,
    areaApiario9,
    tipoApicultura9,
    numeroPromedioAbejasColmena9,
    implementaBPP9,
    estadoGeneralAnimales9,
    calendariosFloracion9,
    variedadFloracionZona9,
    tipoSuplementacion9,
    formacionTecnicaActividad9,
    enfermedadColmena9,
    tipoProducto9,
    tipoEmpaque9,
    cantidadLitrosCosechaSemestre9,
    precioVentaLitro9,
    formaComercializacionProducto9,
    frecuenciaEntrega9,
    nombreLineaProductiva10,
    numeroTotalAnimales10,
    numeroHembras10,
    numeroMachos10,
    raza10,
    areaUsadaAnimales10,
    instalaciones10,
    implementaBPP10,
    estadoGeneralAnimales10,
    tratamientoAguasResiduales10,
    tipoProduccion10,
    tipoAlimentacion10,
    numeroHembrasCria10,
    numeroGazaposLactantes10,
    numeroAnimalesLevanteCeba10,
    numeroMachosReproductores10,
    porcentajeMortalidad10,
    cantidadKgEtapa10,
    precioVentaCarneKg10,
    formaComercializacionProducto10,
    ventaAnimales10,
    frecuenciaEntrega10,
    tipoDocumento,
    edad,
    tipoEtnia,
    orientacionSexualAfectiva,
    identidadGenero,
    tipoViolenciaGenero,
    denunciasTipodeViolencia,
    regimen,
    eps,
    tieneSISBEN,
    categoriaSISBEN,
    victimaConflicto,
    desplazamientoForzado,
    num_personas_vive_usted,
    hijos_menores_18_viven_con_usted,
    hijos_entre_18_28_viven_con_usted,
    num_adultos_mayores_viven_con_usted,
    condicionVulnerabilidad,
    tipoCondicionVulnerabilidad,
    presentaCondicionVulnerabilidadEnNucleo,
    predioRegistradoICA,
    limitantesSistemaProductivo,
  };

    await pool.query("INSERT INTO farm set ?", [newFarm]);

  const dataSaved = await pool.query(
    "SELECT * from farm WHERE nitProducer = ? AND nameFarm = ?",
    [newFarm.nitProducer, newFarm.nameFarm]
  );


  res.json({
    mensaje: "Los datos se han almacenado con exito",
    id_farm: dataSaved[0].id_farm,
    img_beneficiario: imgBeneficiario,
    firstName: dataSaved[0].firstName,
    secondName: dataSaved[0].secondName,
    firstSurname: dataSaved[0].firstSurname,
    secondSurname: dataSaved[0].secondSurname,
    nitProducer: dataSaved[0].nitProducer,
    expedition: dataSaved[0].expedition,
    birthdate: dataSaved[0].birthdate,
    ethnicity: dataSaved[0].ethnicity,
    celphone1: dataSaved[0].celphone1,
    celphone2: dataSaved[0].celphone2,
    email: dataSaved[0].email,
    gender: dataSaved[0].gender,
    scholarLevel: dataSaved[0].scholarLevel,
    organization: dataSaved[0].organization,
    maritalStatus: dataSaved[0].maritalStatus,
    fullnameSpouse: dataSaved[0].fullnameSpouse,
    nitSpouse: dataSaved[0].nitProducer,
    expeditionSpouse: dataSaved[0].expeditionSpouse,
    dateSpouse: dataSaved[0].dateSpouse,
    celphoneSpouse: dataSaved[0].celphoneSpouse,
    emailSpouse: dataSaved[0].emailSpouse,
    nameFarm: dataSaved[0].nameFarm,
    municipality: dataSaved[0].municipality,
    corregimiento: dataSaved[0].corregimiento,
    vereda: dataSaved[0].vereda,
    possession: dataSaved[0].possession,
    totalExtension: dataSaved[0].totalExtension,
    cropsArea: dataSaved[0].cropsArea,
    freeArea: dataSaved[0].freeArea,
    conservationArea: dataSaved[0].conservationArea,
    currentProjects: dataSaved[0].currentProjects,
    agrochemical: dataSaved[0].agrochemical,
    bestPractices: dataSaved[0].bestPractices,
    otherAreas: dataSaved[0].otherAreas,
    afluentes: dataSaved[0].afluentes,
    vocationAndLandUse: dataSaved[0].vocationAndLandUse,
    productiveLine: dataSaved[0].productiveLine,
    certificationType: dataSaved[0].certificationType,
    purlieuNorth: dataSaved[0].purlieuNorth,
    purlieuSouth: dataSaved[0].purlieuSouth,
    purlieuEast: dataSaved[0].purlieuEast,
    purlieuWest: dataSaved[0].purlieuWest,
    altura: dataSaved[0].altura,
    latitudeLongitude: dataSaved[0].latitudeLongitude,
    anosPropiedad: dataSaved[0].anosPropiedad,
    productiveLine1: dataSaved[0].productiveLine1,
    productiveLine2: dataSaved[0].productiveLine2,
    productiveLine3: dataSaved[0].productiveLine3,
    knowProductiveLine1: dataSaved[0].knowProductiveLine1,
    knowProductiveLine2: dataSaved[0].knowProductiveLine2,
    knowPeoductiveLine3: dataSaved[0].knowPeoductiveLine3,
    comercializationType: dataSaved[0].comercializationType,
    biopreparadosProduction: dataSaved[0].biopreparadosProduction,
    waterAvailable: dataSaved[0].waterAvailable,
    accessRoads: dataSaved[0].accessRoads,
    electricityAvailability: dataSaved[0].electricityAvailability,
    ComunicationAvailable: dataSaved[0].ComunicationAvailable,
    projectParticipation: dataSaved[0].projectParticipation,
    cropTools: dataSaved[0].cropTools,
    firstAidKit: dataSaved[0].firstAidKit,
    fumigateKit: dataSaved[0].fumigateKit,
    irrigationSystem: dataSaved[0].irrigationSystem,
    machines: dataSaved[0].machines,
    ParticipateInProyects: dataSaved[0].ParticipateInProyects,
    workingCapital: dataSaved[0].workingCapital,
    implementationTecnologyLevel: dataSaved[0].implementationTecnologyLevel,
    productLine1: dataSaved[0].productLine1,
    variety1: dataSaved[0].variety1,
    cantPlants1: dataSaved[0].cantPlants1,
    plantsDistance1: dataSaved[0].plantsDistance1,
    groovesDistance1: dataSaved[0].groovesDistance1,
    ageCrop1: dataSaved[0].ageCrop1,
    stageCrop1: dataSaved[0].stageCrop1,
    cantKgProducedByYear1: dataSaved[0].cantKgProducedByYear1,
    cropStatus1: dataSaved[0].cropStatus1,
    aproxArea1: dataSaved[0].aproxArea1,
    coordenates1: dataSaved[0].coordenates1,
    useType: dataSaved[0].useType,
    promKgComercializateValue: dataSaved[0].promKgComercializateValue,
    productLine2: dataSaved[0].productLine2,
    variety2: dataSaved[0].variety2,
    cantPlants2: dataSaved[0].cantPlants2,
    plantsDistance2: dataSaved[0].plantsDistance2,
    groovesDistance2: dataSaved[0].groovesDistance2,
    ageCrop2: dataSaved[0].ageCrop2,
    stageCrop2: dataSaved[0].stageCrop2,
    cantKgProducedByYear2: dataSaved[0].cantKgProducedByYear2,
    cropStatus2: dataSaved[0].cropStatus2,
    aproxArea2: dataSaved[0].aproxArea2,
    coordenates2: dataSaved[0].coordenates2,
    useType2: dataSaved[0].useType2,
    promKgComercializateValu2: dataSaved[0].promKgComercializateValu2,
    productLine3: dataSaved[0].productLine3,
    variety3: dataSaved[0].variety3,
    cantPlants3: dataSaved[0].cantPlants3,
    plantsDistance3: dataSaved[0].plantsDistance3,
    groovesDistance3: dataSaved[0].groovesDistance3,
    ageCrop3: dataSaved[0].ageCrop3,
    stageCrop3: dataSaved[0].stageCrop3,
    cantKgProducedByYear3: dataSaved[0].cantKgProducedByYear3,
    cropStatus3: dataSaved[0].cropStatus3,
    aproxArea3: dataSaved[0].aproxArea3,
    coordenates3: dataSaved[0].coordenates3,
    useType3: dataSaved[0].useType3,
    promKgComercializateValu3: dataSaved[0].promKgComercializateValu3,
    projectId: dataSaved[0].projectId,
    productLine4Pecuaria: dataSaved[0].productLine4Pecuaria,
    breed: dataSaved[0].breed,
    cantAnimals: dataSaved[0].cantAnimals,
    numberPlaces: dataSaved[0].numberPlaces,
    ageAverageAnimals: dataSaved[0].ageAverageAnimals,
    ageCrop4: dataSaved[0].ageCrop4,
    cantKgProducedByYear4: dataSaved[0].cantKgProducedByYear4,
    cropStatus4: dataSaved[0].cropStatus4,
    aproxArea4: dataSaved[0].aproxArea4,
    coordenates4: dataSaved[0].coordenates4,
    nutritionType: dataSaved[0].nutritionType,
    promKgComercializateValu4: dataSaved[0].promKgComercializateValu4,
    productLine5Pecuaria: dataSaved[0].productLine5Pecuaria,
    breed5: dataSaved[0].breed5,
    cantAnimals5: dataSaved[0].cantAnimals5,
    numberPlaces5: dataSaved[0].numberPlaces5,
    ageAverageAnimals5: dataSaved[0].ageAverageAnimals5,
    ageCrop5: dataSaved[0].ageCrop5,
    cantKgProducedByYear5: dataSaved[0].cantKgProducedByYear5,
    cropStatus5: dataSaved[0].cropStatus5,
    aproxArea5: dataSaved[0].aproxArea5,
    coordenates5: dataSaved[0].coordenates5,
    nutritionType5: nutritionType5,
    promKgComercializateValu5: dataSaved[0].promKgComercializateValu5,
    imgSignature: imgSig,
    creationDate: dataSaved[0].creationDate,
    userId: dataSaved[0].userId,
    comments: dataSaved[0].comments,
    knowProductiveLine4: dataSaved[0].knowProductiveLine4,
    knowProductiveLine5: dataSaved[0].knowProductiveLine5,
    cant_kg_by_year_lote4: dataSaved[0].cant_kg_by_year_lote4,
    cant_kg_by_year_lote5: dataSaved[0].cant_kg_by_year_lote5,
    price_kg_sold_lote4: dataSaved[0].price_kg_sold_lote4,
    price_kg_sold_lote5: dataSaved[0].price_kg_sold_lote5,
    typeofanimal:dataSaved[0].typeofanimal,
    typeofanimal5: dataSaved[0].typeofanimal5,
    nombreLineaProductiva5: dataSaved[0].nombreLineaProductiva5,
    numeroTotalAnimales5 : dataSaved[0].numeroTotalAnimales5,
    numeroHembras5 : dataSaved[0].numeroHembras5,
    numeroMachos5 : dataSaved[0].numeroMachos5,
    numeroVacasOrdeno5 : dataSaved[0].numeroVacasOrdeno5,
    tipoProduccion5 : dataSaved[0].tipoProduccion5,
    tipoExplotacion5 : dataSaved[0].tipoExplotacion5,
    raza5: dataSaved[0].raza5,
    areaAproxAnimales5 : dataSaved[0].areaAproxAnimales5,
    tipoManejo5 : dataSaved[0].tipoManejo5,
    numeroLotesPastoreo5 : dataSaved[0].numeroLotesPastoreo5,
    tipoFertilizacionPastos5 : dataSaved[0].tipoFertilizacionPastos5,
    implementaBPG5 : dataSaved[0].implementaBPG5,
    implementaBPO5 : dataSaved[0].implementaBPO5,
    tratamientoAguasResiduales5 : dataSaved[0].tratamientoAguasResiduales5,
    estadoGeneralAnimales5 : dataSaved[0].estadoGeneralAnimales5,
    manejoProductivo5 : dataSaved[0].manejoProductivo5,
    tipoAlimentacion5 : dataSaved[0].tipoAlimentacion5,
    cantidadLitrosDia5 : dataSaved[0].cantidadLitrosDia5,
    destinoFinalLeche5 : dataSaved[0].destinoFinalLeche5,
    precioVentaLecheLitro5 : dataSaved[0].precioVentaLecheLitro5,
    cantidadKGANO5: dataSaved[0].cantidadKGANO5,
    precioVentaKGCarne5 : dataSaved[0].precioVentaKGCarne5,
    formaComercializacionProducto5 : dataSaved[0].formaComercializacionProducto5,
    frecuenciaEntrega5: dataSaved[0].frecuenciaEntrega5,
    nombreLineaProductiva6 : dataSaved[0].nombreLineaProductiva6,
    areaGalpon6 : dataSaved[0].areaGalpon6,
    numeroAnimales6 : dataSaved[0].numeroAnimales6,
    tipoExplotacin6 : dataSaved[0].tipoExplotacion6,
    tipoAlimentacion6 : dataSaved[0].tipoAlimentacion6,
    granjaBiosegura6 : dataSaved[0].granjaBiosegura6,
    planSanitario6 : dataSaved[0].planSanitario6,
    implementaBPA6 : dataSaved[0].implementaBPA6,
    estadoGeneralAnimales6 : dataSaved[0].estadoGeneralAnimales6,
    tratamientoAguasResiduales6 : dataSaved[0].tratamientoAguasResiduales6,
    tipoRazaPostura6 : dataSaved[0].tipoRazaPostura6,
    numeroSemanasAves6 : dataSaved[0].numeroSemanasAves6,
    galloEnGalpon6 : dataSaved[0].galloEnGalpon6,
    cantidadHuevosSemana6 : dataSaved[0].cantidadHuevosSemana6,
    porcentajePosturaSemanal6 : dataSaved[0].porcentajePosturaSemanal6,
    clasificaHuevosPorPeso6 : dataSaved[0].clasificaHuevosPorPeso6,
    tipoComercializacion6 : dataSaved[0].tipoComercializacion6,
    precioUnidadHuevo6 : dataSaved[0].precioUnidadHuevo6,
    presentacion6 : dataSaved[0].presentacion6,
    porcentajeMortalidadPostura6 : dataSaved[0].porcentajeMortalidadPostura6,
    formaComercializacionProducto6 : dataSaved[0].formaComercializacionProducto6,
    cantidadKgCarnePollosPorCiclo6 : dataSaved[0].cantidadKgCarnePollosPorCiclo6,
    precioVentaCarneKg6 : dataSaved[0].precioVentaCarneKg6,
    porcentajeMortalidadCicloEngorde6 : dataSaved[0].porcentajeMortalidadCicloEngorde6,
    frecuenciaEntrega6 : dataSaved[0].frecuenciaEntrega6,
    nombreLineaProductiva7 : dataSaved[0].nombreLineaProductiva7,
    numeroTotalAnimales7 : dataSaved[0].numeroTotalAnimales7,
    numeroHembras7 : dataSaved[0].numeroHembras7,
    numeroMachos7 : dataSaved[0].numeroMachos7,
    raza7 : dataSaved[0].raza7,
    areaUsadaAnimales7 : dataSaved[0].areaUsadaAnimales7,
    implementaBPP7 : dataSaved[0].implementaBPP7,
    estadoGeneralAnimales7 : dataSaved[0].estadoGeneralAnimales7,
    tratamientoAguasResiduales7 : dataSaved[0].tratamientoAguasResiduales7,
    tipoProduccion7 : dataSaved[0].tipoProduccion7,
    tipoAlimentacion7 : dataSaved[0].tipoAlimentacion7,
    numeroHembrasCria7 : dataSaved[0].numeroHembrasCria7,
    numeroLechonesLactantes7 : dataSaved[0].numeroLechonesLactantes7,
    numeroAnimalesLevanteCeba7 : dataSaved[0].numeroAnimalesLevanteCeba7,
    numeroMachosReporductores7 : dataSaved[0].numeroMachosReporductores7,
    porcentajeMortalidad7 : dataSaved[0].porcentajeMortalidad7,
    cantidadKgEtapa7 : dataSaved[0].cantidadKgEtapa7,
    precioVentaCarneKg7 : dataSaved[0].precioVentaCarneKg7,
    formaComercializacionProducto7 : dataSaved[0].formaComercializacionProducto7,
    ventaAnimales7 : dataSaved[0].ventaAnimales7,
    frecuenciaEntrega7 : dataSaved[0].frecuenciaEntrega7,
    nombreLineaProductiva8 : dataSaved[0].nombreLineaProductiva8,
    numeroEstanques8 : dataSaved[0].numeroEstanques8,
    areaUsadaAnimales8 : dataSaved[0].areaUsadaAnimales8,
    densidadSiembra8 : dataSaved[0].densidadSiembra8,
    orientacionGranja8 : dataSaved[0].orientacionGranja8,
    sistemaProduccion8 : dataSaved[0].sistemaProduccion8,
    infraestructura8 : dataSaved[0].infraestructura8,
    implementaBPP8 : dataSaved[0].implementaBPP8,
    estadoGeneralAnimales8 : dataSaved[0].estadoGeneralAnimales8,
    tratamientoAguasResiduales8 : dataSaved[0].tratamientoAguasResiduales8,
    procentajeMortalidadAnual8 : dataSaved[0].procentajeMortalidadAnual8,
    comoTratanAguas8 : dataSaved[0].comoTratanAguas8,
    tipoAlimentacion8 : dataSaved[0].tipoAlimentacion8,
    promedioAlevinosSembradosAno8 : dataSaved[0].promedioAlevinosSembradosAno8,
    formaComercializacionProducto8 : dataSaved[0].formaComercializacionProducto8,
    totalPecesCosechadosCiclo8 : dataSaved[0].totalPecesCosechadosCiclo8,
    precioVentaCarne8 : dataSaved[0].precioVentaCarne8,
    presentacionVenta8 : dataSaved[0].presentacionVenta8,
    frecuenciaEntrega8 : dataSaved[0].frecuenciaEntrega8,
    numeroColemnas9 : dataSaved[0].numeroColemnas9,
    especie9 : dataSaved[0].especie9,
    areaApiario9 : dataSaved[0].areaApiario9,
    tipoApicultura9 : dataSaved[0].tipoApicultura9,
    numeroPromedioAbejasColmena9 : dataSaved[0].numeroPromedioAbejasColmena9,
    implementaBPP9 : dataSaved[0].implementaBPP9,
    estadoGeneralAnimales9 : dataSaved[0].estadoGeneralAnimales9,
    calendariosFloracion9 : dataSaved[0].calendariosFloracion9,
    variedadFloracionZona9 : dataSaved[0].variedadFloracionZona9,
    tipoSuplementacion9 : dataSaved[0].tipoSuplementacion9,
    formacionTecnicaActividad9 : dataSaved[0].formacionTecnicaActividad9,
    enfermedadColmena9 : dataSaved[0].enfermedadColmena9,
    tipoProducto9 : dataSaved[0].tipoProducto9,
    tipoEmpaque9 : dataSaved[0].tipoEmpaque9,
    cantidadLitrosCosechaSemestre9 : dataSaved[0].cantidadLitrosCosechaSemestre9,
    precioVentaLitro9 : dataSaved[0].precioVentaLitro9,
    formaComercializacionProducto9 : dataSaved[0].formaComercializacionProducto9,
    frecuenciaEntrega9 : dataSaved[0].frecuenciaEntrega9,
    nombreLineaProductiva10 : dataSaved[0].nombreLineaProductiva10,
    numeroTotalAnimales10 : dataSaved[0].numeroTotalAnimales10,
    numeroHembras10 : dataSaved[0].numeroHembras10,
    numeroMachos10 : dataSaved[0].numeroMachos10,
    raza10 : dataSaved[0].raza10,
    areaUsadaAnimales10 : dataSaved[0].areaUsadaAnimales10,
    instalaciones10 : dataSaved[0].instalaciones10,
    implementaBPP10 : dataSaved[0].implementaBPP10,
    estadoGeneralAnimales10 : dataSaved[0].estadoGeneralAnimales10,
    tratamientoAguasResiduales10 : dataSaved[0].tratamientoAguasResiduales10,
    tipoProduccion10 : dataSaved[0].tipoProduccion10,
    tipoAlimentacion10 : dataSaved[0].tipoAlimentacion10,
    numeroHembrasCria10 : dataSaved[0].numeroHembrasCria10,
    numeroGazaposLactantes10 : dataSaved[0].numeroGazaposLactantes10,
    numeroAnimalesLevanteCeba10 : dataSaved[0].numeroAnimalesLevanteCeba10,
    numeroMachosReproductores10 : dataSaved[0].numeroMachosReproductores10,
    porcentajeMortalidad10 : dataSaved[0].porcentajeMortalidad10,
    cantidadKgEtapa10 : dataSaved[0].cantidadKgEtapa10,
    precioVentaCarneKg10 : dataSaved[0].precioVentaCarneKg10,
    formaComercializacionProducto10 : dataSaved[0].formaComercializacionProducto10,
    ventaAnimales10 : dataSaved[0].ventaAnimales10,
    frecuenciaEntrega10: dataSaved[0].frecuenciaEntrega10,
    tipoDocumento: dataSaved[0].tipoDocumento,
    edad: dataSaved[0].edad,
    tipoEtnia: dataSaved[0].tipoEtnia,
    orientacionSexualAfectiva: dataSaved[0].orientacionSexualAfectiva,
    identidadGenero: dataSaved[0].identidadGenero,
    tipoViolenciaGenero: dataSaved[0].tipoViolenciaGenero,
    denunciasTipodeViolencia: dataSaved[0].denunciasTipodeViolencia,
    regimen: dataSaved[0].regimen,
    eps: dataSaved[0].eps,
    tieneSISBEN: dataSaved[0].tieneSISBEN,
    categoriaSISBEN: dataSaved[0].categoriaSISBEN,
    victimaConflicto: dataSaved[0].victimaConflicto,
    desplazamientoForzado: dataSaved[0].desplazamientoForzado,
    num_personas_vive_usted: dataSaved[0].num_personas_vive_usted,
    hijos_menores_18_viven_con_usted: dataSaved[0].hijos_menores_18_viven_con_usted,
    hijos_entre_18_28_viven_con_usted: dataSaved[0].hijos_entre_18_28_viven_con_usted,
    num_adultos_mayores_viven_con_usted: dataSaved[0].num_adultos_mayores_viven_con_usted,
    condicionVulnerabilidad: dataSaved[0].condicionVulnerabilidad,
    tipoCondicionVulnerabilidad: dataSaved[0].tipoCondicionVulnerabilidad,
    presentaCondicionVulnerabilidadEnNucleo: dataSaved[0].presentaCondicionVulnerabilidadEnNucleo,
    predioRegistradoICA: dataSaved[0].predioRegistradoICA,
    limitantesSistemaProductivo: dataSaved[0].limitantesSistemaProductivo,
  });
});

//Listar todas las fincas
router.get("/characterizationListByProject/:id", async (req, res) => {
  let resultado = await pool.query("SELECT * FROM farm WHERE projectId = ?", [req.params.id] );
  
  fn.asyncForEach(resultado, async (result, idx) => {
    resultado[idx].img_beneficiario = result.img_beneficiario.toString().trim();
  });


  res.json({resultado});
});

router.post("/characterizationListByUser", async (req, res) => {

  const { userId, projectId } = req.body;

  let resultado = await pool.query("SELECT * FROM farm WHERE projectId = ? AND userId = ?", [projectId, userId] );
  
  fn.asyncForEach(resultado, async (result, idx) => {
    resultado[idx].img_beneficiario = result.img_beneficiario.toString().trim();
  });

  res.json({resultado});
});

//Mostrar una finca por ID
router.get("/farmDetails/:id", async (req, res) => {
  let imgData = {};

  const dataFarm = await pool.query("SELECT * FROM farm WHERE id_farm = ?", [
    req.params.id,
  ]);

  imgData = await image2base64(dataFarm[0].img_beneficiario);

  dataFarm[0].img_beneficiario = imgData;

  res.json({ Data: dataFarm[0] });
});

//Update a farm
router.put("/updateFarm/:id", async (req, res, next) => {
  const updImage = req.file.path;
  const updString = updImage.slice(15);
  const {
    firstName,
    secondName,
    firstSurname,
    secondSurname,
    nitProducer,
    expedition,
    birthdate,
    ethnicity,
    celphone1,
    celphone2,
    email,
    gender,
    scholarLevel,
    organization,
    maritalStatus,
    fullnameSpouse,
    nitSpouse,
    expeditionSpouse,
    dateSpouse,
    celphoneSpouse,
    emailSpouse,
    nameFarm,
    municipality,
    corregimiento,
    vereda,
    possession,
    totalExtension,
    cropsArea,
    freeArea,
    conservationArea,
    currentProjects,
    agrochemical,
    agroquimicos,
    otherAreas,
    afluentes,
    vocationAndLandUse,
    productiveLine,
    certificationType,
    purlieuNorth,
    purlieuSouth,
    purlieuEast,
    purlieuWest,
    altura,
    latitudeLongitude,
    anosPropiedad,
    productiveLine1,
    productiveLine2,
    productiveLine3,
    knowProductiveLine1,
    knowProductiveLine2,
    knowPeoductiveLine3,
    comercializationType,
    biopreparadosProduction,
    waterAvailable,
    accessRoads,
    electricityAvailability,
    ComunicationAvailable,
    projectParticipation,
    cropTools,
    firstAidKit,
    fumigateKit,
    irrigationSystem,
    machines,
    ParticipateInProyects,
    projectInterest,
    implementationTecnologyLevel,
    productLine1,
    variety1,
    cantPlants1,
    sowingDistance1,
    ageCrop1,
    stageCrop1,
    cantKgProducedByYear1,
    cropStatus1,
    aproxArea1,
    coordenates1,
    useType,
    promKgComercializateValue,
    productLine2,
    variety2,
    cantPlants2,
    sowingDistance2,
    ageCrop2,
    stageCrop2,
    cantKgProducedByYear2,
    cropStatus2,
    aproxArea2,
    coordenates2,
    useType2,
    promKgComercializateValu2,
    productLine3,
    variety3,
    cantPlants3,
    sowingDistance3,
    ageCrop3,
    stageCrop3,
    cantKgProducedByYear3,
    cropStatus3,
    aproxArea3,
    coordenates3,
    useType3,
    promKgComercializateValu3,
    knowProductiveLine4,
    knowProductiveLine5,
  } = req.body;

  const updFarm = {
    img_beneficiario: updString,
    firstName,
    secondName,
    firstSurname,
    secondSurname,
    nitProducer,
    expedition,
    birthdate,
    ethnicity,
    celphone1,
    celphone2,
    email,
    gender,
    scholarLevel,
    organization,
    maritalStatus,
    fullnameSpouse,
    nitSpouse,
    expeditionSpouse,
    dateSpouse,
    celphoneSpouse,
    emailSpouse,
    nameFarm,
    municipality,
    corregimiento,
    vereda,
    possession,
    totalExtension,
    cropsArea,
    freeArea,
    conservationArea,
    currentProjects,
    agrochemical,
    agroquimicos,
    otherAreas,
    afluentes,
    vocationAndLandUse,
    productiveLine,
    certificationType,
    purlieuNorth,
    purlieuSouth,
    purlieuEast,
    purlieuWest,
    altura,
    latitudeLongitude,
    anosPropiedad,
    productiveLine1,
    productiveLine2,
    productiveLine3,
    knowProductiveLine1,
    knowProductiveLine2,
    knowPeoductiveLine3,
    comercializationType,
    biopreparadosProduction,
    waterAvailable,
    accessRoads,
    electricityAvailability,
    ComunicationAvailable,
    projectParticipation,
    cropTools,
    firstAidKit,
    fumigateKit,
    irrigationSystem,
    machines,
    ParticipateInProyects,
    projectInterest,
    implementationTecnologyLevel,
    productLine1,
    variety1,
    cantPlants1,
    sowingDistance1,
    ageCrop1,
    stageCrop1,
    cantKgProducedByYear1,
    cropStatus1,
    aproxArea1,
    coordenates1,
    useType,
    promKgComercializateValue,
    productLine2,
    variety2,
    cantPlants2,
    sowingDistance2,
    ageCrop2,
    stageCrop2,
    cantKgProducedByYear2,
    cropStatus2,
    aproxArea2,
    coordenates2,
    useType2,
    promKgComercializateValu2,
    productLine3,
    variety3,
    cantPlants3,
    sowingDistance3,
    ageCrop3,
    stageCrop3,
    cantKgProducedByYear3,
    cropStatus3,
    aproxArea3,
    coordenates3,
    useType3,
    promKgComercializateValu3,
    knowProductiveLine4,
    knowProductiveLine5,
  };

  try {
    await pool.query("UPDATE farm set ? WHERE id_farm = ?", [
      updFarm,
      req.params.id,
    ]);
    res.json({ mensaje: "Datos actualizados con exito" });
  } catch (error) {
    console.log(error);
    next();
  }
});

//Descarga de PDF
router.get('/downloadExcelByCharacterization/:id', async (req, res, next) => {
  try {

    setTimeout (async() => { 
      if (req.timedout) { 
        next (); 
      } 
      else { 
          
          const charaterizationFarmList = await pool.query('select * from farm WHERE projectId = ?', req.params.id) 
          
          //console.log('CARACTERIZATION', charaterizationFarmList )
          cp.cell(1,1).string('Proyecto').style(styles)
          cp.cell(1,2).string('Tipo documento').style(styles)
          cp.cell(1,3).string('Cedula').style(styles)
          cp.cell(1,4).string('Primer Nombre').style(styles)
          cp.cell(1,5).string('Segundo Nombre').style(styles)
          cp.cell(1,6).string('Primer Apellido').style(styles)
          cp.cell(1,7).string('Segundo Apellido').style(styles)
          cp.cell(1,8).string('Fecha de nacimiento').style(styles)
          cp.cell(1,9).string('Edad').style(styles)
          cp.cell(1,10).string('Identidad de genero').style(styles)
          cp.cell(1,11).string('Orientacion sexual afectiva').style(styles)
          cp.cell(1,12).string('Etnia').style(styles)
          cp.cell(1,13).string('Celular1').style(styles)
          cp.cell(1,14).string('Celular2').style(styles)
          cp.cell(1,15).string('Email').style(styles)
          cp.cell(1,16).string('Género').style(styles)
          cp.cell(1,17).string('Nivel Escolar').style(styles)
          cp.cell(1,18).string('Organizaciones').style(styles)
          cp.cell(1,19).string('Estado Civil').style(styles)
          cp.cell(1,20).string('Nombre completo conyuge').style(styles)
          cp.cell(1,21).string('Cedula Conyuge').style(styles)
          cp.cell(1,22).string('Lugar de expedición cedula conyuge').style(styles)
          cp.cell(1,23).string('Fecha de nacimiento conyuge').style(styles)
          cp.cell(1,24).string('Celular conyuge').style(styles)
          cp.cell(1,25).string('Email conyuge').style(styles)
          cp.cell(1,26).string('¿Sufre de algún tipo de violencia basado en género?').style(styles)
          cp.cell(1,27).string('¿Denuncias este tipo de violencia?').style(styles)
          cp.cell(1,28).string('Régimen').style(styles)
          cp.cell(1,29).string('EPS').style(styles)
          cp.cell(1,30).string('¿SISBEN?').style(styles)
          cp.cell(1,31).string('Categoría del Sisbén').style(styles)
          cp.cell(1,32).string('¿Víctima del conflicto armado?').style(styles)
          cp.cell(1,33).string('¿Desplazamiento forzado?').style(styles)
          cp.cell(1,34).string('Número de personas del grupo familiar que viven con usted').style(styles)
          cp.cell(1,35).string('Número de hijos menores a 18 años que viven con usted').style(styles)
          cp.cell(1,36).string('Número de hijos entre 18-28 años que viven con usted').style(styles)
          cp.cell(1,37).string('Número de Adultos mayores que viven con usted').style(styles)
          cp.cell(1,38).string('Condición de vulnerabilidad').style(styles)
          cp.cell(1,39).string('¿En el núcleo familiar presenta alguna de las condiciones anteriores?').style(styles)
          cp.cell(1,40).string('Otra condición').style(styles)
          cp.cell(1,41).string('Nombre de la finca').style(styles)
          cp.cell(1,42).string('¿Predio registrado ante el ICA?').style(styles)
          cp.cell(1,43).string('Municipio').style(styles)
          cp.cell(1,44).string('Corregimiento').style(styles)
          cp.cell(1,45).string('Vereda').style(styles)
          cp.cell(1,46).string('Titulo de posesión').style(styles)
          cp.cell(1,47).string('Extensión total del terreno').style(styles)
          cp.cell(1,48).string('Area Cultivada').style(styles)
          cp.cell(1,49).string('Area de Libre Destinación').style(styles)
          cp.cell(1,50).string('Area de conservación').style(styles)
          cp.cell(1,51).string('Presencia de proyectos actuales').style(styles)
          cp.cell(1,52).string('Manejo de agroquimicos').style(styles)
          cp.cell(1,53).string('Implementación de buenas prácticas').style(styles)
          cp.cell(1,54).string('Area de otros usos').style(styles)
          cp.cell(1,55).string('Metros Líneales de Afluentes').style(styles)
          ws.cell(1,56).string('Uso de Suelo y su Vocación').style(styles)
          cp.cell(1,57).string('Linea Productiva mas Implementada').style(styles)
          cp.cell(1,58).string('Tipo de certificación').style(styles)
          cp.cell(1,59).string('Lindero al Norte').style(styles)
          cp.cell(1,60).string('Lindero al Sur').style(styles)
          cp.cell(1,61).string('Lindero al Oriente').style(styles)
          cp.cell(1,62).string('Lindero al Occidente').style(styles)
          cp.cell(1,63).string('Altura').style(styles)
          cp.cell(1,64).string('Latitud').style(styles)
          cp.cell(1,65).string('Longitud').style(styles)
          cp.cell(1,66).string('Años en la propiedad').style(styles)
          cp.cell(1,67).string('Principales limitantes para el desarrollo del sistema productivo').style(styles)
          cp.cell(1,68).string('Linea Productiva 1').style(styles)
          cp.cell(1,69).string('Linea Productiva 2').style(styles)
          cp.cell(1,70).string('Linea Productiva 3').style(styles)
          cp.cell(1,71).string('Linea Productiva 4').style(styles)
          cp.cell(1,72).string('Linea Productiva 5').style(styles)
          cp.cell(1,73).string('Conocimiento de la linea productiva 1').style(styles)
          cp.cell(1,74).string('Conocimiento de la linea productiva 2').style(styles)
          cp.cell(1,75).string('Conocimiento de la linea productiva 3').style(styles)
          cp.cell(1,76).string('Conocimiento de la linea productiva 4').style(styles)
          cp.cell(1,77).string('Conocimiento de la linea productiva 5').style(styles)
          cp.cell(1,78).string('Tipo de comercialización').style(styles)
          cp.cell(1,79).string('Productos de biopreparados').style(styles)
          cp.cell(1,80).string('Disponibilidad de agua').style(styles)
          cp.cell(1,81).string('Disponibilidad de vías de acceso').style(styles)
          cp.cell(1,82).string('Disponibilidad de electricidad').style(styles)
          ws.cell(1,83).string('Disponibilidad de redes de comunicación').style(styles)
          cp.cell(1,84).string('Disponibilidad para participar en proyectos de asistencia técnica').style(styles)
          cp.cell(1,85).string('Variedad de herramientas básicas de uso en el cultivo').style(styles)
          cp.cell(1,86).string('Tenencia de botiquin de primeros auxilios').style(styles)
          cp.cell(1,87).string('Tenencia de equipos de fumigación').style(styles)
          cp.cell(1,88).string('Tenencia de sistemas de riego').style(styles)
          cp.cell(1,89).string('Tenencia de maquinaria libiana ').style(styles)
          cp.cell(1,90).string('Interes en participar en proyectos de asistencia técnica').style(styles)
          cp.cell(1,91).string('Origen del capital de trabajo').style(styles)
          cp.cell(1,92).string('Grado de implementación de tecnologías de producción').style(styles)
          cp.cell(1,93).string('Linea Productiva 1').style(styles)
          cp.cell(1,94).string('Variedad').style(styles)
          cp.cell(1,95).string('Cantidad de plantulas').style(styles)
          cp.cell(1,96).string('Distancia entre surcos').style(styles)
          cp.cell(1,97).string('Distancia entre plantas').style(styles)
          cp.cell(1,98).string('Edad de cultivo (Años)').style(styles)
          cp.cell(1,99).string('Etapa del cultivo').style(styles)
          cp.cell(1,100).string('Cantidad de Kilogramos Producidos por Año').style(styles)
          cp.cell(1,101).string('Estado General del cultivo').style(styles)
          cp.cell(1,102).string('Area Aproximada (m2)').style(styles)
          cp.cell(1,103).string('Latitud Lote1').style(styles)
          cp.cell(1,104).string('Longitud Lote1').style(styles)
          cp.cell(1,105).string('Tipo de manejo').style(styles)
          cp.cell(1,106).string('Valor promedo de KG comercializado en pesos en el año').style(styles)
          cp.cell(1,107).string('Linea Productiva 2').style(styles)
          cp.cell(1,108).string('Variedad').style(styles)
          cp.cell(1,109).string('Cantidad de plantulas').style(styles)
          cp.cell(1,110).string('Distancia entre surcos').style(styles)
          cp.cell(1,111).string('Distancia entre plantas').style(styles)
          cp.cell(1,112).string('Edad de cultivo (Años)').style(styles)
          cp.cell(1,113).string('Etapa del cultivo').style(styles)
          cp.cell(1,114).string('Cantidad de Kilogramos Producidos por Año').style(styles)
          cp.cell(1,115).string('Estado General del cultivo').style(styles)
          cp.cell(1,116).string('Area Aproximada (m2)').style(styles)
          cp.cell(1,117).string('Latitud Lote2').style(styles)
          cp.cell(1,118).string('Longitud Lote2').style(styles)
          cp.cell(1,119).string('Tipo de manejo').style(styles)
          cp.cell(1,120).string('Valor promedo de KG comercializado en pesos en el año').style(styles)
          cp.cell(1,121).string('Linea Productiva 3').style(styles)
          cp.cell(1,122).string('Variedad').style(styles)
          cp.cell(1,123).string('Cantidad de plantulas').style(styles)
          cp.cell(1,124).string('Distancia entre surcos').style(styles)
          cp.cell(1,125).string('Distancia entre plantas').style(styles)
          cp.cell(1,126).string('Edad de cultivo (Años)').style(styles)
          cp.cell(1,127).string('Etapa del cultivo').style(styles)
          cp.cell(1,128).string('Cantidad de Kilogramos Producidos por Año').style(styles)
          cp.cell(1,129).string('Estado General del cultivo').style(styles)
          cp.cell(1,130).string('Area Aproximada (m2)').style(styles)
          cp.cell(1,132).string('Latitud Lote3').style(styles)
          cp.cell(1,133).string('Longitud Lote3').style(styles)
          cp.cell(1,134).string('Tipo de manejo').style(styles)
          cp.cell(1,135).string('Valor promedo de KG comercializado en pesos en el año').style(styles)
          cp.cell(1,136).string('Linea Productiva 4 (Pecuario)').style(styles)
          cp.cell(1,137).string('Raza').style(styles)
          cp.cell(1,138).string('Cantidad de animales').style(styles)
          cp.cell(1,138).string('numero de corrales').style(styles)
          cp.cell(1,140).string('Edad promedio de los animales').style(styles)
          cp.cell(1,141).string('Etapa productiva').style(styles)
          cp.cell(1,142).string('Cantidad de Kilogramos Producidos por Año').style(styles)
          cp.cell(1,143).string('Estado General del cultivo').style(styles)
          cp.cell(1,144).string('Area Aproximada (m2)').style(styles)
          cp.cell(1,145).string('Latitud Lote4').style(styles)
          cp.cell(1,146).string('Longitud Lote4').style(styles)
          cp.cell(1,147).string('Tipo de nutrición').style(styles)
          cp.cell(1,148).string('Valor promedo de KG comercializado en pesos en el año').style(styles)
          cp.cell(1,149).string('Linea Productiva 5 (BOVINO/CAPRINO/OVINO/BUFALINO)').style(styles)
          cp.cell(1,150).string('Número total de animales').style(styles)
          cp.cell(1,151).string('Número de hembras').style(styles)
          cp.cell(1,152).string('Número de machos').style(styles)
          cp.cell(1,153).string('Número de vacas en ordeño').style(styles)
          cp.cell(1,154).string('Tipo de producción').style(styles)
          cp.cell(1,155).string('Tipo de explotación').style(styles)
          cp.cell(1,156).string('Raza').style(styles)
          cp.cell(1,157).string('Área aproximada usada por los animales m2').style(styles)
          cp.cell(1,158).string('Tipo de manejo').style(styles)
          cp.cell(1,159).string('Número de lotes pastoreo').style(styles)
          cp.cell(1,160).string('Tipo de fertilización pasto').style(styles)
          cp.cell(1,161).string('Implementa BPG').style(styles)
          cp.cell(1,162).string('Implementa BPO').style(styles)
          cp.cell(1,163).string('Realiza tratamiento de aguas residuales de la producción').style(styles)
          cp.cell(1,164).string('Estado general de los animales').style(styles)
          cp.cell(1,165).string('Manejo reproductivo').style(styles)
          cp.cell(1,166).string('Tipo de alimentación').style(styles)
          cp.cell(1,167).string('Cantidad de litros/día').style(styles)
          cp.cell(1,168).string('Destino final de la leche').style(styles)
          cp.cell(1,169).string('Precio de venta leche ($/L)').style(styles)
          cp.cell(1,170).string('Cantidad de Kg carne/ producidos en el año:').style(styles)
          cp.cell(1,171).string('Precio de venta carne ($/Kg)').style(styles)
          cp.cell(1,172).string('Forma de comercialización de su producto').style(styles)
          cp.cell(1,173).string('Frecuencia de entrega o venta del producto').style(styles)
          
          //LOTE 6
          cp.cell(1,174).string('Nombre linea productiva 6').style(styles)
          cp.cell(1,175).string('Área de Galpón (m2)').style(styles)
          cp.cell(1,176).string('Número de animales').style(styles)
          cp.cell(1,177).string('Tipo de explotación').style(styles)
          cp.cell(1,178).string('Tipo de alimentación').style(styles)
          cp.cell(1,179).string('Certificación Granja Avícola Biosegura').style(styles)
          cp.cell(1,180).string('Presenta Plan Sanitario').style(styles)
          cp.cell(1,181).string('Maneja BPA').style(styles)
          cp.cell(1,182).string('Estado general de los animales').style(styles)
          cp.cell(1,183).string('Realiza tratamiento de aguas residuales de la producción').style(styles)
          cp.cell(1,184).string('Tipo de raza que maneja postura').style(styles)
          cp.cell(1,185).string('Número de semanas de las aves').style(styles)
          cp.cell(1,186).string('Maneja gallo dentro del galpón').style(styles)
          cp.cell(1,187).string('Cantidad de huevos semana').style(styles)
          cp.cell(1,188).string('Porcentaje (%) de postura semanal').style(styles)
          cp.cell(1,189).string('Clasifica los huevos según peso').style(styles)
          cp.cell(1,190).string('Tipo de comercialización').style(styles)
          cp.cell(1,191).string('Precio ($/unidad huevo)').style(styles)
          cp.cell(1,192).string('Presentación').style(styles)
          cp.cell(1,193).string('Porcentaje de mortalidad (%) en un periodo de postura').style(styles)
          cp.cell(1,194).string('Forma de comercialización del producto').style(styles)
          cp.cell(1,195).string('Cantidad de Kg carne pollos de engorde/ producidos por ciclo (45 días)').style(styles)
          cp.cell(1,196).string('Precio de venta carne ($/Kg)').style(styles)
          cp.cell(1,197).string('Forma comercialización').style(styles)
          cp.cell(1,198).string('Porcentaje de mortalidad (%) en el ciclo de engorde (45 días)').style(styles)
          cp.cell(1,199).string('Frecuencia de entrega o venta del producto').style(styles)
        
          //Lote 7 
          cp.cell(1,200).string('nombre de la linea productiva').style(styles)
          cp.cell(1,201).string('Numero total de animales').style(styles)
          cp.cell(1,202).string('Numero de hembras').style(styles)
          cp.cell(1,203).string('Numero de machos').style(styles)
          cp.cell(1,204).string('Raza').style(styles)
          cp.cell(1,205).string('Área aproximada usada por los animales m2').style(styles)
          cp.cell(1,206).string('Implementa BPP').style(styles)
          cp.cell(1,207).string('Estado general de los animales').style(styles)
          cp.cell(1,208).string('Realiza tratamiento de aguas residuales de la producción').style(styles)
          cp.cell(1,209).string('Tipo de producción').style(styles)
          cp.cell(1,210).string('Tipo de alimentación').style(styles)
          cp.cell(1,211).string('Número de hembras de cría').style(styles)
          cp.cell(1,212).string('Número de lechones lactantes').style(styles)
          cp.cell(1,213).string('Número de animales de levante – ceba').style(styles)
          cp.cell(1,214).string('Número de machos reproductores').style(styles)
          cp.cell(1,215).string('% de mortalidad').style(styles)
          cp.cell(1,216).string('Cantidad Kg/ por etapa').style(styles)
          cp.cell(1,217).string('Precio de venta carne ($/Kg)').style(styles)
          cp.cell(1,218).string('Forma de comercialización de su producto').style(styles)
          cp.cell(1,219).string('Venta de los animales').style(styles)
          cp.cell(1,220).string('Frecuencia de entrega o venta del producto').style(styles)
              
          //Lote 8    
          cp.cell(1,221).string('nombre de la linea productiva').style(styles)
          cp.cell(1,222).string('Número de animales total').style(styles)
          cp.cell(1,223).string('Qué especies cultiva').style(styles)
          cp.cell(1,224).string('Número de estanques').style(styles)
          cp.cell(1,225).string('Área Total de estanques utilizados').style(styles)
          cp.cell(1,226).string('Densidad de siembra por estanque').style(styles)
          cp.cell(1,227).string('Orientación de la granja').style(styles)
          cp.cell(1,228).string('Sistema de producción').style(styles)
          cp.cell(1,229).string('Infraestructura').style(styles)
          cp.cell(1,230).string('Implementa BPP').style(styles)
          cp.cell(1,231).string('Estado general de los animales').style(styles)
          cp.cell(1,232).string('Realiza tratamiento de aguas residuales de la producción').style(styles)
          cp.cell(1,233).string('Porcentaje de mortalidad anual(%)').style(styles)
          cp.cell(1,234).string('como es el tratamiento de aguas').style(styles)
          cp.cell(1,235).string('Tipo de alimentación').style(styles)
          cp.cell(1,236).string('Promedio alevinos sembrados por año (kg)').style(styles)
          cp.cell(1,237).string('Forma de comercialización de su producto').style(styles)
          cp.cell(1,238).string('Total peces cosechados por ciclo (kg)').style(styles)
          cp.cell(1,239).string('Precio de venta carne ($/Kg)').style(styles)
          cp.cell(1,240).string('Presentación de venta').style(styles)
          cp.cell(1,241).string('Frecuencia de entrega o venta del producto').style(styles)  
          
          //Lote 9
          cp.cell(1,242).string('Número de colmenas').style(styles) 
          cp.cell(1,243).string('Especie').style(styles) 
          cp.cell(1,244).string('Área de apiario (m2)').style(styles) 
          cp.cell(1,245).string('Tipo de apicultura que desarrolla').style(styles) 
          cp.cell(1,246).string('Número promedio de abejas por colmena').style(styles) 
          cp.cell(1,247).string('Implementa BPP').style(styles) 
          cp.cell(1,248).string('Estado general de los animales').style(styles) 
          cp.cell(1,249).string('Maneja calendarios de floración').style(styles) 
          cp.cell(1,250).string('Qué variedad de floración se encuentra en la zona').style(styles) 
          cp.cell(1,251).string('Maneja algún tipo de suplementación').style(styles) 
          cp.cell(1,252).string('Formación técnica relacionada a la actividad apícola').style(styles) 
          cp.cell(1,253).string('Su colmena ha presentado alguna de estas enfermedades').style(styles) 
          cp.cell(1,254).string('Especificar tipo de producto').style(styles) 
          cp.cell(1,255).string('Tipo de empaque para comercializar').style(styles) 
          cp.cell(1,256).string('Cantidad de litros/por cosecha (semestral)').style(styles) 
          cp.cell(1,257).string('Precio de venta miel ($/L)').style(styles) 
          cp.cell(1,258).string('Forma de comercialización de su producto').style(styles) 
          cp.cell(1,259).string('Frecuencia de entrega o venta del producto').style(styles)
              
          //LOTE 10    
          cp.cell(1,260).string('nombre de la linea productiva').style(styles)
          cp.cell(1,261).string('Numero total de animales').style(styles) 
          cp.cell(1,262).string('Numero de hembras').style(styles) 
          cp.cell(1,263).string('Numero de machos').style(styles) 
          cp.cell(1,264).string('Raza').style(styles) 
          cp.cell(1,265).string('Área aproximada usada por los animales m2').style(styles) 
          cp.cell(1,266).string('Cuenta con instalaciones').style(styles) 
          cp.cell(1,267).string('Implementa BPP').style(styles) 
          cp.cell(1,268).string('Estado general de los animales').style(styles) 
          cp.cell(1,269).string('Realiza tratamiento de aguas residuales de la producción').style(styles) 
          cp.cell(1,270).string('Tipo de producción').style(styles) 
          cp.cell(1,271).string('Tipo de alimentación').style(styles) 
          cp.cell(1,272).string('Número de hembras de cría').style(styles) 
          cp.cell(1,273).string('Número de gazapos lactantes').style(styles) 
          cp.cell(1,274).string('Número de animales de levante – ceba').style(styles) 
          cp.cell(1,275).string('Número de machos reproductores').style(styles) 
          cp.cell(1,276).string('% de mortalidad').style(styles) 
          cp.cell(1,277).string('Cantidad Kg/ por etapa').style(styles) 
          cp.cell(1,278).string('Precio de venta carne ($/Kg)').style(styles) 
          cp.cell(1,279).string('Forma de comercialización de su producto').style(styles) 
          cp.cell(1,280).string('Venta de los animales').style(styles) 
          cp.cell(1,281).string('Frecuencia de entrega o venta del producto').style(styles)
              
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
              const project = await pool.query('select * from projects WHERE id_project = ?', [req.params.id])
              //console.log('project', project)
              
              cp.cell(2+i, 1) .string(project[0].nom_proyecto)
              cp.cell(2+i, 1) .string(project[0].tipoDocumento)
              cp.cell(2+i, 2).string(charaterizationFarmList[i].nitProducer)
              cp.cell(2+i, 3).string(charaterizationFarmList[i].firstName)
              cp.cell(2+i, 4).string(charaterizationFarmList[i].secondName)
              cp.cell(2+i, 5).string(charaterizationFarmList[i].firstSurname)
              cp.cell(2+i, 6).string(charaterizationFarmList[i].secondSurname)
              cp.cell(2+i, 7).string(charaterizationFarmList[i].birthdate)
              cp.cell(2+i, 7).string(charaterizationFarmList[i].edad)
              cp.cell(2+i, 7).string(charaterizationFarmList[i].identidadGenero)
              cp.cell(2+i, 7).string(charaterizationFarmList[i].orientacionSexualAfectiva)
              cp.cell(2+i, 8).string(charaterizationFarmList[i].ethnicity)
              cp.cell(2+i, 8).string(charaterizationFarmList[i].tipoEtnia)
              cp.cell(2+i, 9).string(charaterizationFarmList[i].celphone1)
              cp.cell(2+i, 10).string(charaterizationFarmList[i].celphone2)
              cp.cell(2+i, 11).string(charaterizationFarmList[i].email)
              cp.cell(2+i, 12).string(charaterizationFarmList[i].gender)
              cp.cell(2+i, 13).string(charaterizationFarmList[i].scholarLevel)
              cp.cell(2+i, 14).string(charaterizationFarmList[i].organization)
              cp.cell(2+i, 15).string(charaterizationFarmList[i].maritalStatus)
              cp.cell(2+i, 16).string(charaterizationFarmList[i].fullnameSpouse)
              cp.cell(2+i, 17).string(charaterizationFarmList[i].nitSpouse)
              cp.cell(2+i, 18).string(charaterizationFarmList[i].expeditionSpouse)
              cp.cell(2+i, 19).string(charaterizationFarmList[i].dateSpouse)
              cp.cell(2+i, 20).string(charaterizationFarmList[i].celphoneSpouse)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].emailSpouse)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].tipoViolenciaGenero)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].denunciasTipodeViolencia)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].regimen)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].eps)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].tieneSISBEN)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].categoriaSISBEN)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].victimaConflicto)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].desplazamientoForzado)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].num_personas_vive_usted)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].hijos_menores_18_viven_con_usted)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].hijos_entre_18_28_viven_con_usted)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].num_adultos_mayores_viven_con_usted)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].condicionVulnerabilidad)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].tipoCondicionVulnerabilidad)
              cp.cell(2+i, 21).string(charaterizationFarmList[i].presentaCondicionVulnerabilidadEnNucleo)
              cp.cell(2+i, 22).string(charaterizationFarmList[i].nameFarm)
              cp.cell(2+i, 22).string(charaterizationFarmList[i].predioRegistradoICA)
              cp.cell(2+i, 23).string(charaterizationFarmList[i].municipality)
              cp.cell(2+i, 24).string(charaterizationFarmList[i].corregimiento)
              cp.cell(2+i, 25).string(charaterizationFarmList[i].vereda)
              cp.cell(2+i, 26).string(charaterizationFarmList[i].possession)
              cp.cell(2+i, 27).string(charaterizationFarmList[i].totalExtension)
              cp.cell(2+i, 28).string(charaterizationFarmList[i].cropsArea)
              cp.cell(2+i, 29).string(charaterizationFarmList[i].freeArea)
              cp.cell(2+i, 30).string(charaterizationFarmList[i].conservationArea)
              cp.cell(2+i, 31).string(charaterizationFarmList[i].currentProjects)
              cp.cell(2+i, 32).string(charaterizationFarmList[i].agrochemical)
              cp.cell(2+i, 33).string(charaterizationFarmList[i].bestPractices)
              cp.cell(2+i, 34).string(charaterizationFarmList[i].otherAreas)
              cp.cell(2+i, 35).string(charaterizationFarmList[i].afluentes)
              cp.cell(2+i, 36).string(charaterizationFarmList[i].vocationAndLandUse)
              cp.cell(2+i, 37).string(charaterizationFarmList[i].productiveLine)
              cp.cell(2+i, 38).string(charaterizationFarmList[i].certificationType)
              cp.cell(2+i, 39).string(charaterizationFarmList[i].purlieuNorth)
              cp.cell(2+i, 40).string(charaterizationFarmList[i].purlieuSouth)
              cp.cell(2+i, 41).string(charaterizationFarmList[i].purlieuEast)
              cp.cell(2+i, 42).string(charaterizationFarmList[i].purlieuWest)
              cp.cell(2+i, 43).string(charaterizationFarmList[i].altura)
              cp.cell(2+i, 44).string(arrayCoordenates[0])
              cp.cell(2+i, 45).string(arrayCoordenates[1])
              cp.cell(2+i, 46).string(charaterizationFarmList[i].anosPropiedad)
              cp.cell(2+i, 46).string(charaterizationFarmList[i].limitantesSistemaProductivo)
              cp.cell(2+i, 47).string(charaterizationFarmList[i].productiveLine1)
              cp.cell(2+i, 48).string(charaterizationFarmList[i].productiveLine2)
              cp.cell(2+i, 49).string(charaterizationFarmList[i].productiveLine3)
              cp.cell(2+i, 50).string(charaterizationFarmList[i].productiveLine4)
              cp.cell(2+i, 51).string(charaterizationFarmList[i].productiveLine5)
              cp.cell(2+i, 52).string(charaterizationFarmList[i].knowProductiveLine1)
              cp.cell(2+i, 53).string(charaterizationFarmList[i].knowProductiveLine2)
              cp.cell(2+i, 54).string(charaterizationFarmList[i].knowPeoductiveLine3)
              cp.cell(2+i, 55).string(charaterizationFarmList[i].knowProductiveLine4)
              cp.cell(2+i, 56).string(charaterizationFarmList[i].knowProductiveLine5)
              cp.cell(2+i, 57).string(charaterizationFarmList[i].comercializationType)
              cp.cell(2+i, 58).string(charaterizationFarmList[i].biopreparadosProduction)
              cp.cell(2+i, 59).string(charaterizationFarmList[i].waterAvailable)
              cp.cell(2+i, 60).string(charaterizationFarmList[i].accessRoads)
              cp.cell(2+i, 61).string(charaterizationFarmList[i].electricityAvailability)
              cp.cell(2+i, 62).string(charaterizationFarmList[i].ComunicationAvailable)
              cp.cell(2+i, 63).string(charaterizationFarmList[i].projectParticipation)
              cp.cell(2+i, 64).string(charaterizationFarmList[i].cropTools)
              cp.cell(2+i, 65).string(charaterizationFarmList[i].firstAidKit)
              cp.cell(2+i, 66).string(charaterizationFarmList[i].fumigateKit)
              cp.cell(2+i, 67).string(charaterizationFarmList[i].irrigationSystem)
              cp.cell(2+i, 68).string(charaterizationFarmList[i].machines)
              cp.cell(2+i, 69).string(charaterizationFarmList[i].ParticipateInProyects)
              cp.cell(2+i, 70).string(charaterizationFarmList[i].workingCapital)
              cp.cell(2+i, 71).string(charaterizationFarmList[i].implementationTecnologyLevel)
              cp.cell(2+i, 72).string(charaterizationFarmList[i].productLine1)
              cp.cell(2+i, 73).string(charaterizationFarmList[i].variety1)
              cp.cell(2+i, 74).string(charaterizationFarmList[i].cantPlants1)
              cp.cell(2+i, 75).string(charaterizationFarmList[i].groovesDistance1)
              cp.cell(2+i, 76).string(charaterizationFarmList[i].plantsDistance1)
              cp.cell(2+i, 77).string(charaterizationFarmList[i].ageCrop1)
              cp.cell(2+i, 78).string(charaterizationFarmList[i].stageCrop1)
              cp.cell(2+i, 79).string(charaterizationFarmList[i].cantKgProducedByYear1)
              cp.cell(2+i, 80).string(charaterizationFarmList[i].cropStatus1)
              cp.cell(2+i, 81).string(charaterizationFarmList[i].aproxArea1)
              cp.cell(2+i, 82).string(arrayCoordenates1[0])
              cp.cell(2+i, 83).string(arrayCoordenates1[1])
              cp.cell(2+i, 84).string(charaterizationFarmList[i].useType)
              cp.cell(2+i, 85).string(charaterizationFarmList[i].promKgComercializateValue)
              cp.cell(2+i, 86).string(charaterizationFarmList[i].productLine2)
              cp.cell(2+i, 87).string(charaterizationFarmList[i].variety2)
              cp.cell(2+i, 88).string(charaterizationFarmList[i].cantPlants2)
              cp.cell(2+i, 89).string(charaterizationFarmList[i].groovesDistance2)
              cp.cell(2+i, 90).string(charaterizationFarmList[i].plantsDistance2)
              cp.cell(2+i, 91).string(charaterizationFarmList[i].ageCrop2)
              cp.cell(2+i, 92).string(charaterizationFarmList[i].stageCrop2)
              cp.cell(2+i, 93).string(charaterizationFarmList[i].cantKgProducedByYear2)
              cp.cell(2+i, 94).string(charaterizationFarmList[i].cropStatus2)
              cp.cell(2+i, 95).string(charaterizationFarmList[i].aproxArea2)
              cp.cell(2+i, 96).string(arrayCoordenates2[0])
              cp.cell(2+i, 97).string(arrayCoordenates2[1])
              cp.cell(2+i, 98).string(charaterizationFarmList[i].useType2)
              cp.cell(2+i, 99).string(charaterizationFarmList[i].promKgComercializateValu2)
              cp.cell(2+i, 100).string(charaterizationFarmList[i].productLine3)
              cp.cell(2+i, 101).string(charaterizationFarmList[i].variety3)
              cp.cell(2+i, 102).string(charaterizationFarmList[i].cantPlants3)
              cp.cell(2+i, 103).string(charaterizationFarmList[i].groovesDistance3)
              cp.cell(2+i, 104).string(charaterizationFarmList[i].plantsDistance3)
              cp.cell(2+i, 105).string(charaterizationFarmList[i].ageCrop3)
              cp.cell(2+i, 106).string(charaterizationFarmList[i].stageCrop3)
              cp.cell(2+i, 107).string(charaterizationFarmList[i].cantKgProducedByYear3)
              cp.cell(2+i, 108).string(charaterizationFarmList[i].cropStatus3)
              cp.cell(2+i, 109).string(charaterizationFarmList[i].aproxArea3)
              cp.cell(2+i, 110).string(arrayCoordenates3[0])
              cp.cell(2+i, 111).string(arrayCoordenates3[1])
              cp.cell(2+i, 112).string(charaterizationFarmList[i].useType3)
              cp.cell(2+i, 113).string(charaterizationFarmList[i].promKgComercializateValu3)
              cp.cell(2+i, 114).string(charaterizationFarmList[i].productLine4Pecuaria)
              cp.cell(2+i, 115).string(charaterizationFarmList[i].breed)
              cp.cell(2+i, 116).string(charaterizationFarmList[i].cantAnimals)
              cp.cell(2+i, 117).string(charaterizationFarmList[i].numberPlaces)
              cp.cell(2+i, 118).string(charaterizationFarmList[i].ageAverageAnimals)
              cp.cell(2+i, 119).string(charaterizationFarmList[i].ageCrop4)
              cp.cell(2+i, 120).string(charaterizationFarmList[i].cantKgProducedByYear4)
              cp.cell(2+i, 121).string(charaterizationFarmList[i].cropStatus4)
              cp.cell(2+i, 122).string(charaterizationFarmList[i].aproxArea4)
              ws.cell(2+i, 123).string(arrayCoordenates4[0])
              cp.cell(2+i, 124).string(arrayCoordenates4[1])
              cp.cell(2+i, 125).string(charaterizationFarmList[i].nutritionType)
              cp.cell(2+i, 126).string(charaterizationFarmList[i].promKgComercializateValu4)
              cp.cell(2+i, 127).string(charaterizationFarmList[i].nombreLineaProductiva5)
              cp.cell(2+i, 128).string(charaterizationFarmList[i].numeroTotalAnimales5)
              cp.cell(2+i, 129).string(charaterizationFarmList[i].numeroHembras5)
              cp.cell(2+i, 130).string(charaterizationFarmList[i].numeroMachos5)
              cp.cell(2 + i, 131).string(charaterizationFarmList[i].numeroVacasOrdeno5)
              switch (charaterizationFarmList[i].tipoProduccion5) {
                case 1:
                    cp.cell(2+i, 132).string("Cria")
                  break;
                case 2:
                    cp.cell(2+i, 132).string("Levante")
                  break;
                case 3:
                    cp.cell(2+i, 132).string("Ceba")
                  break;
                case 4:
                    cp.cell(2+i, 132).string("Ciclo completo")
                  break;
                default:
                  console.log("No coincide con 1, 2, 3 0 4");
              }
              cp.cell(2+i, 132).string(charaterizationFarmList[i].tipoProduccion5)
              cp.cell(2+i, 133).string(charaterizationFarmList[i].tipoExplotacion5)
              cp.cell(2+i, 134).string(charaterizationFarmList[i].raza5)
              cp.cell(2+i, 135).string(charaterizationFarmList[i].areaAproxAnimales5)
              cp.cell(2+i, 138).string(charaterizationFarmList[i].tipoManejo5)
              cp.cell(2+i, 139).string(charaterizationFarmList[i].numeroLotesPastoreo5)
              cp.cell(2+i, 139).string(charaterizationFarmList[i].tipoFertilizacionPastos5)
              cp.cell(2+i, 139).string(charaterizationFarmList[i].implementaBPG5)
              cp.cell(2+i, 139).string(charaterizationFarmList[i].implementaBPO5)
              cp.cell(2+i, 139).string(charaterizationFarmList[i].tratamientoAguasResiduales5)
              cp.cell(2+i, 139).string(charaterizationFarmList[i].estadoGeneralAnimales5)
              cp.cell(2+i, 139).string(charaterizationFarmList[i].manejoProductivo5)
              cp.cell(2+i, 139).string(charaterizationFarmList[i].tipoAlimentacion5)
              cp.cell(2+i, 139).string(charaterizationFarmList[i].cantidadLitrosDia5)
              cp.cell(2+i, 139).string(charaterizationFarmList[i].destinoFinalLeche5)
              cp.cell(2+i, 139).string(charaterizationFarmList[i].precioVentaLecheLitro5)
              cp.cell(2+i, 139).string(charaterizationFarmList[i].cantidadKGANO5)
              cp.cell(2+i, 139).string(charaterizationFarmList[i].precioVentaKGCarne5)
              cp.cell(2+i, 139).string(charaterizationFarmList[i].formaComercializacionProducto5)
              cp.cell(2 + i, 139).string(charaterizationFarmList[i].frecuenciaEntrega5)
              
              cp.cell(2+i, 140).string(charaterizationFarmList[i].time_creation.toString())
              cp.cell(2+i, 141).string(userPollster[0].nom_user)
              cp.cell(2+i, 142).string(charaterizationFarmList[i].comments)

          }

          wf.write('Malla predios caracterizados.xlsx', res)

      } 
    } , Math.random () * 7000); 

  } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
  }
})

router.get('/downloadPdfCharacterizationFarm/:id', async(req, res) =>{


  let logoUnoTrans = null;
  let logoDosTrans = null;
  let logoTresTrans = null;
  let logoCuatroTrans = null;
  let logoCincoTrans = null;
  let logoSeisTrans = null;
  let logoSieteTrans = null;
  let logoOchoTrans = null;

  const queryCharacterizationFarm = await pool.query('SELECT * FROM farm WHERE id_farm = ?', [req.params.id])
  const queryImageProject = await pool.query('SELECT * FROM projects WHERE id_project = 81')

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
  .image('data:image/jpeg;base64,'+imgFarmer , col1LeftPos, 100, {width: 120, height: 80})
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
      .text(`Valor prom de KG comercializado en pesos en el año: ${queryCharacterizationFarm[0].promKgComercializateValu5}`, col2LeftPos, 380, { width: 150 })
      
      .text('Firma del titular del predio', 153, 460)
        

  pdf.moveDown()
      .fillColor('black')
      .fontSize(11)
      .text('Datos de la linea productiva 5 producción pecuaria', 0, 210, {
      align: 'center',
      indent: 2,
      height: 2,
      ellipsis: true
      })
      .translate(-200, 620)
      .rotate(-90)
      .image('data:image/jpeg;base64,'+imgFarmerSignature, 160, 340, {width: 40, height:140})
          
  pdf.pipe(res)
  pdf.end()     

})

//Registro agricola todas las encuestas del proyecto
router.get('/producerSurveyList/:id', async (req, res) => {
  
  const resultado = await pool.query('SELECT farm.id_farm, farm.nitProducer, farm.firstName, farm.firstSurname, farm.nameFarm, farm.municipality, farm.vereda FROM farm INNER JOIN answerformatproducer ON farm.id_farm = answerformatproducer.farm_id AND answerformatproducer.projectId =?', [req.params.id]);
  //const producerSurveyCharacterization = await pool.query('SELECT id_farm, nitProducer, firstName, firstsurname, secondSurname, nameFarm, municipality, vereda from farm WHERE projectId = ?', [req.session.project.project])
  return res.status(200).json({resultado});
  
})

router.get('/downloadPdfProducerRegister/:id', async(req, res) =>{

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
  const queryImageProject = await pool.query('SELECT * FROM projects WHERE id_project = 81')


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

router.get('/downloadExcel', async (req, res) => {          
  const producerSurvey = await pool.query('SELECT farm.nitProducer, farm.firstName, farm.secondName, firstsurname, secondSurname, farm.nameFarm, farm.municipality,  farm.vereda, farm.time_creation, farm.userId, answerformatproducer.respuesta1, answerformatproducer.respuesta2, answerformatproducer.respuesta3, answerformatproducer.respuesta4, answerformatproducer.respuesta5, answerformatproducer.respuesta6, answerformatproducer.respuesta7, answerformatproducer.respuesta8, answerformatproducer.respuesta9, answerformatproducer.respuesta10, answerformatproducer.respuesta11, answerformatproducer.respuesta12, answerformatproducer.respuesta13, answerformatproducer.respuesta14, answerformatproducer.respuesta15, answerformatproducer.respuesta16, answerformatproducer.respuesta17, answerformatproducer.respuesta18, answerformatproducer.respuesta19, answerformatproducer.respuesta20, answerformatproducer.respuesta21, answerformatproducer.respuesta22, answerformatproducer.respuesta23, answerformatproducer.respuesta24, answerformatproducer.respuesta25, answerformatproducer.respuesta26, answerformatproducer.respuesta27, answerformatproducer.respuesta28, answerformatproducer.respuesta29, answerformatproducer.respuesta30, answerformatproducer.respuesta31, answerformatproducer.respuesta32, answerformatproducer.respuesta33, answerformatproducer.respuesta34, answerformatproducer.respuesta35, answerformatproducer.respuesta36, answerformatproducer.respuesta37, answerformatproducer.respuesta38, answerformatproducer.respuesta39, answerformatproducer.respuesta40, answerformatproducer.respuesta41, answerformatproducer.respuesta42, answerformatproducer.respuesta43, answerformatproducer.respuesta44, answerformatproducer.respuesta45, answerformatproducer.comment1, answerformatproducer.comment2, answerformatproducer.comment3, answerformatproducer.comment4, answerformatproducer.comment5, answerformatproducer.comment6, answerformatproducer.comment7, answerformatproducer.comment8, answerformatproducer.comment9, answerformatproducer.comment10, answerformatproducer.comment11, answerformatproducer.comment12, answerformatproducer.comment13, answerformatproducer.comment14, answerformatproducer.comment15, answerformatproducer.comment16, answerformatproducer.comment17, answerformatproducer.comment18, answerformatproducer.comment19, answerformatproducer.comment20, answerformatproducer.comment21, answerformatproducer.comment22, answerformatproducer.comment23, answerformatproducer.comment24, answerformatproducer.comment25, answerformatproducer.comment26, answerformatproducer.comment27, answerformatproducer.comment28, answerformatproducer.comment29, answerformatproducer.comment30, answerformatproducer.comment31, answerformatproducer.comment32, answerformatproducer.comment33, answerformatproducer.comment34, answerformatproducer.comment35, answerformatproducer.comment36, answerformatproducer.comment37, answerformatproducer.comment38, answerformatproducer.comment39, answerformatproducer.comment40, answerformatproducer.comment41, answerformatproducer.comment42, answerformatproducer.comment43, answerformatproducer.comment44, answerformatproducer.comment45 FROM farm INNER JOIN answerformatproducer ON farm.id_farm = answerformatproducer.farm_id AND answerformatproducer.projectId = 81') 
  //const producerSurvey = await pool.query('SELECT farm.vereda, answerproducerpiscicola.respuesta1, answerproducerpiscicola.respuesta2, answerproducerpiscicola.respuesta3, answerproducerpiscicola.respuesta4, answerproducerpiscicola.respuesta5, answerproducerpiscicola.respuesta6, answerproducerpiscicola.respuesta7, answerproducerpiscicola.respuesta8, answerproducerpiscicola.respuesta9, answerproducerpiscicola.respuesta10, answerproducerpiscicola.respuesta11, answerproducerpiscicola.respuesta12, answerproducerpiscicola.respuesta13, answerproducerpiscicola.respuesta14, answerproducerpiscicola.respuesta15, answerproducerpiscicola.respuesta16, answerproducerpiscicola.respuesta17, answerproducerpiscicola.respuesta18, answerproducerpiscicola.respuesta19, answerproducerpiscicola.respuesta20, answerproducerpiscicola.respuesta21, answerproducerpiscicola.respuesta22, answerproducerpiscicola.respuesta23, answerproducerpiscicola.respuesta24, answerproducerpiscicola.respuesta25, answerproducerpiscicola.respuesta26, answerproducerpiscicola.respuesta27, answerproducerpiscicola.respuesta28, answerproducerpiscicola.respuesta29, answerproducerpiscicola.respuesta30, answerproducerpiscicola.respuesta31, answerproducerpiscicola.respuesta32, answerproducerpiscicola.respuesta33, answerproducerpiscicola.respuesta34, answerproducerpiscicola.respuesta35, answerproducerpiscicola.respuesta36, answerproducerpiscicola.respuesta37, answerproducerpiscicola.respuesta38, answerproducerpiscicola.respuesta39, answerproducerpiscicola.respuesta40, answerproducerpiscicola.respuesta41, answerproducerpiscicola.respuesta42, answerproducerpiscicola.respuesta43, answerproducerpiscicola.respuesta44, answerproducerpiscicola.respuesta45, answerproducerpiscicola.respuesta46, answerproducerpiscicola.respuesta47, answerproducerpiscicola.respuesta48, answerproducerpiscicola.respuesta49, answerproducerpiscicola.respuesta50, answerproducerpiscicola.respuesta51, answerproducerpiscicola.respuesta52, answerproducerpiscicola.comment1, answerproducerpiscicola.comment2, answerproducerpiscicola.comment3, answerproducerpiscicola.comment4, answerproducerpiscicola.comment5, answerproducerpiscicola.comment6, answerproducerpiscicola.comment7, answerproducerpiscicola.comment8, answerproducerpiscicola.comment9, answerproducerpiscicola.comment10, answerproducerpiscicola.comment11, answerproducerpiscicola.comment12, answerproducerpiscicola.comment13, answerproducerpiscicola.comment14, answerproducerpiscicola.comment15, answerproducerpiscicola.comment16, answerproducerpiscicola.comment17, answerproducerpiscicola.comment18, answerproducerpiscicola.comment19, answerproducerpiscicola.comment20, answerproducerpiscicola.comment21, answerproducerpiscicola.comment22, answerproducerpiscicola.comment23, answerproducerpiscicola.comment24, answerproducerpiscicola.comment25, answerproducerpiscicola.comment26, answerproducerpiscicola.comment27, answerproducerpiscicola.comment28, answerproducerpiscicola.comment29, answerproducerpiscicola.comment30, answerproducerpiscicola.comment31, answerproducerpiscicola.comment32, answerproducerpiscicola.comment33, answerproducerpiscicola.comment34, answerproducerpiscicola.comment35, answerproducerpiscicola.comment36, answerproducerpiscicola.comment37, answerproducerpiscicola.comment38, answerproducerpiscicola.comment39, answerproducerpiscicola.comment40, answerproducerpiscicola.comment41, answerproducerpiscicola.comment42, answerproducerpiscicola.comment43, answerproducerpiscicola.comment44, answerproducerpiscicola.comment45, answerproducerpiscicola.comment46, answerproducerpiscicola.comment47, answerproducerpiscicola.comment48, answerproducerpiscicola.comment49, answerproducerpiscicola.comment50, answerproducerpiscicola.comment51, answerproducerpiscicola.comment52 FROM farm INNER JOIN answerproducerpiscicola ON farm.id_farm = answerproducerpiscicola.farm_id_pis AND answerproducerpiscicola.project_id_pis =81'/*, [req.session.project.project]*/) 
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

module.exports = router;
