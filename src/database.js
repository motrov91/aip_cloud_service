const mysql = require('mysql2');
const { promisify } = require('util');

const dotenv = require('dotenv');
dotenv.config({path: 'variables.env'})

/*
 * En local la base de datos no trabaja con port hay que comentarlo
 * en produccion hay que habilitar la opción de puerto. 
*/
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    // port: process.env.DB_PORT,
    // waitForConnections: true,
    // connectionLimit: 10,
    // maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
    // idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
    // queueLimit: 0,
    // enableKeepAlive: true,
    // keepAliveInitialDelay: 0
});

pool.on('acquire', (connection) => {
    console.log('Se adquirió una conexión de la bd.');
    // Aquí puedes ejecutar acciones adicionales si lo deseas
});

pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error al conectarse a la base de datos:', err.message);
      // Manejar el error de conexión aquí
      return;
    }
  
    console.log('Conexión exitosa a la base de datos.');
    // Aquí puedes realizar consultas u operaciones con la base de datos utilizando la conexión
  
    // Cuando hayas terminado con la conexión, asegúrate de liberarla de vuelta al pool
    connection.release();
  });

//promisify pool querys
pool.query = promisify(pool.query);

module.exports = pool;