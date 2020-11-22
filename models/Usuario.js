const db = require('../database/db');

class Usuario {
    #nombreUsuario = '';
    #claveUsuario = '';
    #nombrePersonalUsuario = '';
    #apellidoPersonalUsuario = '';
    #fk_rol = 0;


    constructor(nombreUsuario, claveUsuario, nombrePersonalUsuario, apellidoPersonalUsuario, fk_rol) {
        this.#nombreUsuario = nombreUsuario;
        this.#claveUsuario = claveUsuario;
        this.#nombrePersonalUsuario = nombrePersonalUsuario;
        this.#apellidoPersonalUsuario = apellidoPersonalUsuario;
        this.#fk_rol = fk_rol;

    }

    async createUser() {
        const sqlSentences = "INSERT INTO ?? SET ?";
        const sqlPreparing = ['usuario',
            {
                nombreUsuario: this.#nombreUsuario,
                claveUsuario: this.#claveUsuario,
                nombrePersonalUsuario: this.#nombrePersonalUsuario,
                apellidoPersonalUsuario: this.#apellidoPersonalUsuario,
                fk_rol: this.#fk_rol
            }];

        const sql = await db.format(sqlSentences, sqlPreparing);
        const response = await db.query(sql);
        return response;
    }

    static async getUsers() {
        const sqlSentences = `
        select idUsuario,nombreUsuario,nombreRol,nombrePersonalUsuario,apellidoPersonalUsuario, claveUsuario from usuario
        join rol
        on usuario.fk_rol = rol.idRol`;

        const sql = await db.format(sqlSentences);
        const response = await db.query(sql);

        return response;
    }

    static async getUser(idUsuario) {
        const sqlSentences = `
        select idUsuario,fk_rol,nombreUsuario,nombreRol,nombrePersonalUsuario,apellidoPersonalUsuario,claveUsuario from usuario
        join rol
        on usuario.fk_rol = rol.idRol where idUsuario = ?`;

        const sqlPreparing = [idUsuario];
        const sql = await db.format(sqlSentences, sqlPreparing);
        const response = await db.query(sql);

        return response[0];
    }

    static async updateUser(idUsuario,
        { nombreUsuario,
            claveUsuario,
            nombrePersonalUsuario,
            apellidoPersonalUsuario,
            fk_rol,
        }) {

        const sqlSentences = `UPDATE ?? 
        SET 
        nombreUsuario=?, 
        claveUsuario=?,
        nombrePersonalUsuario=?,
        apellidoPersonalUsuario=?,
        fk_rol=?
        WHERE idUsuario=?`;


        const sqlPreparing = ["usuario",
            nombreUsuario,
            claveUsuario,
            nombrePersonalUsuario,
            apellidoPersonalUsuario,
            fk_rol,
            idUsuario];

        console.log(sqlPreparing);
        const sql = await db.format(sqlSentences, sqlPreparing);
        const response = await db.query(sql);

        return response;

    }

    static async deleteUser(idUsuario) {

        //delete de usuario
        const slqSentences = "DELETE FROM ?? WHERE idUsuario=?";
        const sqlPreparing = ["usuario", idUsuario];

        const sql = await db.format(slqSentences, sqlPreparing);
        const response = await db.query(sql);


        return response
    }
    static async validarUsuario(nombreUsuario) {
        try {
            const sqlSentence = "SELECT idUsuario,nombreUsuario,claveUsuario,idRol,nombreRol FROM ?? INNER JOIN rol ON usuario.fk_rol=rol.idRol  WHERE ?? = ?"
            const sqlPreparing = ['usuario', 'nombreUsuario', nombreUsuario]
            const sql = await db.format(sqlSentence, sqlPreparing)
            const responseDb = await db.query(sql)
            const response = responseDb[0]

            return response

        } catch (error) {
            return error
        }
    }
}


module.exports = Usuario;