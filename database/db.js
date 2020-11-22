const mysql = require('mysql')
const { promisify } = require('util')

// const connection = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASS,
//     database: process.env.DB_NAME,
//     port: process.env.PORT_DB
// });



// function iniciarConexionDB() {
//     connection.connect(function (err) {

//         if (err) {
//             console.error('error connecting: ' + err.stack);
//             iniciarConexionDB()
//             return;
//         }

//         console.log('conexion db exitosa!--> connected as id ' + connection.threadId);
//     });
//     connection.query = promisify(connection.query)

// }

// iniciarConexionDB()





// module.exports = connection


//probando conexion tipo clase para evitar desconexiones
class Mysql {
    constructor() {
        this.conectar()
    }
    conectar() {
        const connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            port: process.env.PORT_DB
        });

        connection.connect((err) => {
            if (err) {
                console.log(new Error(err));
            } else {
                console.log("conectado con exito a la db");
            }

        })

        connection.on("err", (err) => {
            if (err) console.log(err);

        })
        connection.query = promisify(connection.query)
        return connection
    }
}

let dataBase = new Mysql()

module.exports = dataBase.conectar()