const db = require('../database/db');

class Producto {
    #skuProducto = "";
    #nombreProducto = "";
    #tipoProducto = "";
    #precioReferencialProducto = 0;
    #unidadProducto = "";
    #fk_categoria = 0;
    #fk_area = 0;
    #fk_ceco = 0;

    constructor(skuProducto, nombreProducto, tipoProducto, precioReferencialProducto, unidadProducto, fk_categoria, fk_area, fk_ceco) {
        this.#skuProducto = skuProducto;
        this.#nombreProducto = nombreProducto;
        this.#tipoProducto = tipoProducto;
        this.#precioReferencialProducto = precioReferencialProducto;
        this.#unidadProducto = unidadProducto;
        this.#fk_categoria = fk_categoria;
        this.#fk_area = fk_area;
        this.#fk_ceco = fk_ceco;
    }


    async createProducto() {
        try {
            const sqlSentences = "INSERT INTO ?? SET ?";
            const sqlPreparing = ["producto",
                {
                    skuProducto: this.#skuProducto,
                    nombreProducto: this.#nombreProducto,
                    tipoProducto: this.#tipoProducto,
                    precioReferencialProducto: this.#precioReferencialProducto,
                    unidadProducto: this.#unidadProducto,
                    fk_categoria: this.#fk_categoria,
                    fk_area: this.#fk_area,
                    fk_ceco: this.#fk_ceco
                }];

            const sql = await db.format(sqlSentences, sqlPreparing);
            const response = await db.query(sql);
            return response;

        } catch (error) {
            console.log(error);
        }
    }

    static async getProductoId(id) {

        try {
            const sqlSentences = "SELECT*FROM ?? WHERE ??=?";
            const sqlPreparing = ["producto", 'idProducto', id];
            const sql = await db.format(sqlSentences, sqlPreparing);
            const response = await db.query(sql);
            return response[0];

        } catch (error) {
            console.log(error);
        }
    }
    static async getProductoIdAreas(idArea) {

        try {
            const sqlSentences = `SELECT idProducto,nombreProducto,nombreCeco FROM ?? 
            JOIN ceco
            ON producto.fk_ceco = ceco.idCeco
            WHERE ??=?`;
            const sqlPreparing = ["producto", 'fk_Area', idArea];
            const sql = await db.format(sqlSentences, sqlPreparing);
            const response = await db.query(sql);
            return response;

        } catch (error) {
            console.log(error);
        }
    }

    static async getProductos() {

        try {
            const sqlSentences = `
            SELECT nombreCategoria,idProducto,skuProducto,nombreProducto,tipoProducto,precioReferencialProducto,unidadProducto,nombreArea,nombreCeco FROM ?? 
            JOIN area
            ON producto.fk_area = area.idArea 
            JOIN ceco
            ON producto.fk_ceco = ceco.idCeco
            JOIN categoria
            ON producto.fk_categoria = categoria.idCategoria`;

            const sqlPreparing = ["producto"]
            const sql = await db.format(sqlSentences, sqlPreparing);
            const response = await db.query(sql);
            return response;

        } catch (error) {
            console.log(error);
        }
    }

    static async updateProducto(id, producto) {

        try {
            const sqlSentences = `UPDATE ?? SET 
            skuProducto=?,
            nombreProducto=?,
            tipoProducto=?,
            precioReferencialProducto=?,
            unidadProducto=?,
            fk_categoria=?
            WHERE idProducto =?`;

            const sqlPreparing = ["producto",
                producto.skuProducto,
                producto.nombreProducto,
                producto.tipoProducto,
                producto.precioReferencialProducto,
                producto.unidadProducto,
                producto.fk_categoria,
                id
            ];

            const sql = await db.format(sqlSentences, sqlPreparing);
            const response = await db.query(sql);
            return response;

        } catch (error) {
            console.log(error);
        }
    }

    static async deleteProductoId(id) {
        try {
            const sqlSentences = "DELETE FROM ?? WHERE idProducto=?";
            const sqlPreparing = ["producto", id];
            const sql = db.format(sqlSentences, sqlPreparing);
            const response = db.query(sql);
            return response;

        } catch (error) {

        }
    }

    static async subidaMasiva(productos) {
        // console.log(productos);
        try {

            for (let index = 0; index < productos.length; index++) {
                const sqlSentencesMaterial = "SELECT*FROM ?? WHERE ??=?";
                const sqlPreparingMaterial = ["producto", 'skuProducto', productos[index].sku];
                const sqlMaterial = await db.format(sqlSentencesMaterial, sqlPreparingMaterial);
                const responseMaterial = await db.query(sqlMaterial);

                if (!responseMaterial[0]) {

                    //obtener categoria
                    const sqlSentenceCategoria = "SELECT*FROM ?? WHERE ??=?";
                    const sqlPreparingCategoria = ['categoria', 'nombreCategoria', productos[index].categoria];
                    const sqlCategoria = await db.format(sqlSentenceCategoria, sqlPreparingCategoria);
                    const categoria = await db.query(sqlCategoria);

                    //obtener ceco
                    const sqlSentenceCeco = "SELECT*FROM ?? WHERE ??=?";
                    const sqlPreparingCeco = ['ceco', 'nombreCeco', productos[index].ceco];
                    const sqlCeco = await db.format(sqlSentenceCeco, sqlPreparingCeco);
                    const ceco = await db.query(sqlCeco);

                    //obtener area
                    const sqlSentenceArea = "SELECT*FROM ?? WHERE ??=?";
                    const sqlPreparingArea = ['area', 'nombreArea', productos[index].area];
                    const sqlArea = await db.format(sqlSentenceArea, sqlPreparingArea);
                    const area = await db.query(sqlArea);







                    //insertar producto
                    const sqlSentences = "INSERT INTO ?? SET ?";
                    const sqlPreparing = ["producto",
                        {
                            skuProducto: productos[index].sku,
                            nombreProducto: productos[index].material,
                            tipoProducto: productos[index].tipo,
                            precioReferencialProducto: productos[index].precio,
                            unidadProducto: productos[index].unidad,
                            fk_categoria: categoria[0].idCategoria,
                            fk_area: area[0].idArea,
                            fk_ceco: ceco[0].idCeco
                        }];

                    const sql = await db.format(sqlSentences, sqlPreparing);
                    const response = await db.query(sql);
                }


            }


        } catch (error) {

        }
    }
}


module.exports = Producto;