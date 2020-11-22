const db = require('../database/db');

class Area {

    #nombreArea = "";

    constructor(nombreArea) {
        this.#nombreArea = nombreArea;

    }


    async createArea() {
        try {
            const sqlSentence = "INSERT INTO ?? SET ?";
            const sqlPreparing = ["area", { nombreArea: this.#nombreArea }];
            const sql = await db.format(sqlSentence, sqlPreparing);

            const response = await db.query(sql);

            return response;

        } catch (error) {
            return error;
        }
    };

    static async getAreas() {
        try {
            const sqlSentences = "SELECT*FROM ??";
            const sqlPreparing = ["area"];
            const sql = await db.format(sqlSentences, sqlPreparing);
            const areas = await db.query(sql);
            return areas;

        } catch (error) {
            return error;
        }
    };

    static async getArea(idArea) {

        try {
            const sqlSentence = "SELECT*FROM ?? WHERE ??=?";
            const sqlPreparing = ['area', 'idArea', idArea];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const area = await db.query(sql);

            return area[0];

        } catch (error) {
            return error;
        }
    };

    static async updateArea(idArea, { nombreArea }) {

        try {
            const sqlSentence = "UPDATE ?? SET  nombreArea = ? WHERE idArea=?";
            const sqlPreparing = ['area', nombreArea, idArea];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const response = await db.query(sql);
            return response;

        } catch (error) {
            return error;
        }

    };

    static async deleteArea(idArea) {
        try {
            const sqlSentence = "DELETE FROM ?? WHERE ??=?";
            const sqlPreparing = ['area', 'idArea', idArea];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const response = await db.query(sql);

            return response;

        } catch (error) {
            return error;
        }

    }

}


module.exports = Area;