const db = require('../database/db');

class AreaFundo {

    #fk_fundo = 0;
    #fk_area = 0;
    #fk_ceco = 0;
    #fk_usuario = 0;

    constructor(fk_fundo, fk_area, fk_ceco, fk_usuario) {
        this.#fk_fundo = fk_fundo;
        this.#fk_area = fk_area;
        this.#fk_ceco = fk_ceco;
        this.#fk_usuario = fk_usuario;
    }


    async createFundoArea() {
        try {
            const sqlSentence = "INSERT INTO ?? SET ?";
            const sqlPreparing = ["fundo_area", {
                fk_fundo: this.#fk_fundo,
                fk_area: this.#fk_area,
                fk_ceco: this.#fk_ceco,
                fk_usuario: this.#fk_usuario
            }];

            const sql = await db.format(sqlSentence, sqlPreparing);

            const response = await db.query(sql);

            return response;

        } catch (error) {
            return error;
        }
    };

    static async getFundosAreas() {
        try {
            const sqlSentences = `SELECT idFundoArea,nombreSede,nombreFundo,nombreArea,fk_fundo,fk_area,nombreCeco,fk_usuario,nombrePersonalUsuario FROM ?? 
            JOIN fundo 
            ON fundo_area.fk_fundo = fundo.idFundo
            JOIN area
            ON fundo_area.fk_area = area.idArea
            JOIN sede
            ON fundo.fk_sede = sede.idSede
            JOIN ceco
            ON fundo_area.fk_ceco = ceco.idCeco
            JOIN usuario
            ON fundo_area.fk_usuario = usuario.idUsuario`
                ;

            const sqlPreparing = ["fundo_area"];
            const sql = await db.format(sqlSentences, sqlPreparing);
            const areasFundo = await db.query(sql);
            return areasFundo;

        } catch (error) {
            return error;
        }
    };

    static async getFundoArea(idFundoArea) {

        try {
            const sqlSentence = "SELECT*FROM ?? WHERE ??=?";
            const sqlPreparing = ['fundo_area', 'idFundoArea', idFundoArea];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const area = await db.query(sql);

            return area[0];

        } catch (error) {
            return error;
        }
    };

    static async updateFundoArea(idFundoArea, { fk_fundo, fk_area, fk_ceco, fk_usuario }) {

        try {
            const sqlSentence = "UPDATE ?? SET  fk_fundo = ?, fk_area=?, fk_ceco = ?,fk_usuario=? WHERE idFundoArea=?";
            const sqlPreparing = ['fundo_area', fk_fundo, fk_area, fk_ceco, fk_usuario, idFundoArea];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const response = await db.query(sql);
            return response;

        } catch (error) {
            return error;
        }

    };

    static async deleteFundoArea(idFundoArea) {
        try {
            const sqlSentence = "DELETE FROM ?? WHERE ??=?";
            const sqlPreparing = ['fundo_area', 'idFundoArea', idFundoArea];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const response = await db.query(sql);

            return response;

        } catch (error) {
            return error;
        }

    }
    //no esta pasando el id o el id es string
    static async getFundoAreaUsuario(idUsuario) {

        try {
            const sqlSentence = `SELECT nombreArea,idCeco,idArea,
            nombreFundo,nombreSede,apellidoPersonalUsuario,nombrePersonalUsuario
             FROM ?? 
            JOIN area
            ON fundo_area.fk_area = area.idArea
            JOIN fundo
            ON fundo_area.fk_fundo = fundo.idFundo
            JOIN sede
            ON fundo.fk_sede = sede.idSede
            JOIN ceco
            ON fundo_area.fk_ceco = ceco.idCeco
            JOIN usuario
            ON fundo_area.fk_usuario = usuario.idUsuario
            WHERE ?? =? `;
            const sqlPreparing = ['fundo_area', 'fk_usuario', idUsuario];
            const sql = await db.format(sqlSentence, sqlPreparing);

            const area = await db.query(sql);

            return area[0];

        } catch (error) {
            return error;
        }
    }

}


module.exports = AreaFundo;