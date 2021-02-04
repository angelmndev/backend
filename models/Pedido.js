const db = require('../database/db');
const excel = require("exceljs");
class Pedido {


    static async createPedido(materiales, fk_usuario, fk_ceco) {

        //VALIDAR SI EL MONTO DEL PEDIDO ES MAYOR AL PRESUPUESTO DEL CECO
        try {
            let costoTotalDelPedidoActual = 0;

            for (let index = 0; index < materiales.length; index++) {
                //1- OBTENIENDO PRECIO DE LA DB
                const queryPrecio = "SELECT precioReferencialProducto FROM ?? WHERE idProducto=?"
                const queryProtected = ["producto", materiales[index].fk_producto_almacen]
                const queryReady = await db.format(queryPrecio, queryProtected)

                const queryResponse = await db.query(queryReady)

                const costoMaterial = queryResponse[0].precioReferencialProducto;
                const costoDelPedido = costoMaterial * materiales[index].cantidadProducto;
                costoTotalDelPedidoActual = costoTotalDelPedidoActual + costoDelPedido

            }


            //OBTENIENDO PRESUPUESTO DEL CECO ESCOGIDO
            const queryCeco = "SELECT presupuestoCeco FROM ?? WHERE idCeco = ?"
            const queryCecoProtected = ["ceco", fk_ceco]
            const queryCecoReady = await db.format(queryCeco, queryCecoProtected)
            const queryResponse = await db.query(queryCecoReady)
            const presupuestoCeco = queryResponse[0].presupuestoCeco
            // console.log('Presupusetoceco');
            // console.log(presupuestoCeco);
            // console.log('el costo');
            // console.log(costoTotalDelPedidoActual);
            // console.log('resta de Presupuestoceco - el costo');
            // console.log(presupuestoCeco - costoTotalDelPedidoActual);

            if (presupuestoCeco < costoTotalDelPedidoActual) {
                // console.log('si el pedido es mayor al presupuesto');
                // console.log(costoTotalDelPedidoActual - presupuestoCeco);
                // console.log(`el pedido se excede por ${costoTotalDelPedidoActual - presupuestoCeco}`);

                return { excede: true, excedePorCantidad: costoTotalDelPedidoActual - presupuestoCeco }

            } else {

                const sqlSentence = "INSERT INTO ?? SET ?";
                const sqlPreparing = ["pedido", {
                    fk_usuario: fk_usuario,
                    fk_ceco: fk_ceco
                }];

                const sql = await db.format(sqlSentence, sqlPreparing);
                const response = await db.query(sql);



                //obtener el ultimo insert
                const sqlUltimo = "SELECT @@identity AS id";
                const res = await db.query(sqlUltimo);
                const idPedido = res[0].id;

                // insertando detalle_registro
                materiales.map(async (material) => {
                    // console.log(material);
                    const sqlSentenceDetalle = "INSERT INTO ?? SET ?";
                    const sqlPreparingDetalle = ["detalle_pedido", {
                        fk_pedido: idPedido,
                        cantidadPedido: material.cantidadProducto,
                        fk_producto_almacen: material.fk_producto_almacen

                    }];


                    const sql = await db.format(sqlSentenceDetalle, sqlPreparingDetalle);
                    const response = await db.query(sql);

                })
                return response;

            }

        } catch (error) {
            console.log(error);
        }

    };

    static async getPedidos() {

        try {
            
            

           /* const sqlSentences = `SELECT 
                idPedido,
                DATE_FORMAT(create_date, "%d/%m/%Y") as fecha ,
                estado,
                nombrePersonalUsuario,
                nombreCeco,
                nombreSede,
                idCeco,
                maquinaDestino
                FROM ??
                JOIN usuario
                ON pedido.fk_usuario = usuario.idUsuario
                JOIN ceco
                ON pedido.fk_ceco = ceco.idCeco
                JOIN sede
                ON ceco.fk_sede= sede.idSede ORDER BY create_date DESC
            `;*/

            const sqlSentences = `SELECT
            p.idPedido,
            DATE_FORMAT(p.create_date, "%d/%m/%Y") AS fecha ,
            p.estado,
            u.nombrePersonalUsuario,
            f.nombreFundo,
            s.nombreSede,
            c.idCeco,
            p.maquinaDestino
            FROM pedido p
            JOIN ceco c on p.fk_ceco = c.idCeco
            JOIN sede s ON c.fk_sede = s.idSede
            JOIN usuario u  on p.fk_usuario = u.idUsuario
            LEFT OUTER JOIN fundo_area fa ON (p.fk_ceco = fa.fk_ceco)
            INNER JOIN fundo f ON fa.fk_fundo = f.idFundo            
            `;

            const sqlPreparing = ["pedido"];
            const sql = await db.format(sqlSentences, sqlPreparing);
            const areas = await db.query(sql);
            return areas;

        } catch (error) {
            return error;
        }
    };

    static async getDetalles(fk_pedido) {
        console.log(fk_pedido);

        
        try {
            /*const sqlSentences = `SELECT 
               fk_pedido,
               idDetalle_pedido,
               nombreProducto,
               skuProducto,
               cantidadPedido,
               unidadProducto as unidad,
               precioReferencialProducto,
               (cantidadPedido*precioReferencialProducto) as total,
               nombreArea,
               nombreCeco
                FROM ??
                JOIN producto
                ON detalle_pedido.fk_producto_almacen = producto.idProducto
                JOIN area
                ON producto.fk_area = area.idArea
                JOIN ceco
                ON producto.fk_ceco = ceco.idCeco
                JOIN sede
                ON ceco.fk_sede= sede.idSede
                WHERE 
                fk_pedido = ?
            `;*/
           

            const query_almacen = `SELECT abr,codigoInventario FROM ?? JOIN sede ON fk_sede = idSede WHERE idSede = ?`;
            const prepare_almacen = ['inventario',1];
            const sql_almacen = await db.format(query_almacen,prepare_almacen);
            const res_almacen =await db.query(sql_almacen);

           
            var case_when_query = "";            
            var concat_nombre_query = "";
            res_almacen.forEach((element,index) => {                        
                case_when_query += ` SUM(CASE WHEN producto_almacen.fk_inventario  = ${element.codigoInventario} AND producto_almacen.fk_producto = detalle_pedido.fk_producto_almacen  THEN cantidadProductoAlmacen ELSE 0 END) AS ${element.abr}`;                                            

                if(index < res_almacen.length -1){
                    case_when_query += `,`;
                }

                concat_nombre_query += `' ${element.abr}:',ROUND(${element.abr})`;               
                
                
                if(index < res_almacen.length -1){
                    concat_nombre_query += `,`;
                }
            });

            /* fk_productoalmacen hace referencia a la tabla "producto" */
            var query_main = `SELECT ALMACEN.*,CONCAT(${concat_nombre_query}) AS almacen FROM
            (SELECT
                fk_pedido,
                idDetalle_pedido,
                nombreProducto,
                skuProducto,
                cantidadPedido,
                unidadProducto AS unidad,
                precioReferencialProducto,
                (cantidadPedido*precioReferencialProducto) AS total,
                nombreArea,
                nombreCeco,
                abr,
                ${case_when_query}
            FROM detalle_pedido
                INNER JOIN pedido ON detalle_pedido.fk_pedido = pedido.idPedido
                INNER JOIN inventario ON pedido.codigo_almacen = inventario.codigoInventario
                INNER JOIN producto_almacen ON detalle_pedido.fk_producto_almacen = producto_almacen.fk_producto
                INNER JOIN producto ON producto_almacen.fk_producto = producto.idProducto
                INNER JOIN area ON producto.fk_area = area.idArea
                INNER JOIN ceco ON producto.fk_ceco = ceco.idCeco
                WHERE fk_pedido = ${fk_pedido}
                GROUP BY idDetalle_pedido
            ) AS ALMACEN`;


            const detalles = await db.query(query_main);
            console.log(query_main);
            return detalles;

        } catch (error) {
            console.log(sqlSentences);            
            return error;
        }
    }



    static async updateDetallePedidoId(id, cantidadPedido) {

        try {
            const sqlSentences = `UPDATE ?? SET 
            cantidadPedido=?
            WHERE idDetalle_pedido =?`;

            const sqlPreparing = ["detalle_pedido",
                cantidadPedido,
                id
            ];


            const sql = await db.format(sqlSentences, sqlPreparing);
            const response = await db.query(sql);
            return response;

        } catch (error) {
            console.log(error);
        }

    }

    static async deleteDetallePedidoId(id) {
        try {
            const sqlSentence = "DELETE FROM ?? WHERE ??=?";
            const sqlPreparing = ['detalle_pedido', 'idDetalle_pedido', id];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const response = await db.query(sql);

            return response;

        } catch (error) {
            return error;
        }

    }


    static async aprobarPedidoId(id, idCeco) {
        try {
            const sqlSentences = `UPDATE ?? SET 
            estado='aprobado'
            WHERE idPedido =?`;

            const sqlPreparing = ["pedido", id];


            const sql = await db.format(sqlSentences, sqlPreparing);
            const response = await db.query(sql);
            // return response;



            //sumando el monto de todos mis productos 
            const sqlDetallePedido = `SELECT SUM(cantidadPedido*producto.precioReferencialProducto) as total
            FROM detalle_pedido
            JOIN producto
            ON detalle_pedido.fk_producto_almacen = producto.idProducto
            WHERE detalle_pedido.fk_pedido = ?`

            const sqlPreparingDetalle = [id]
            const sqlDetalleSumaTotal = await db.format(sqlDetallePedido, sqlPreparingDetalle);
            const responseTotal = await db.query(sqlDetalleSumaTotal)

            //monto total del pedido
            let { total } = responseTotal[0]



            // //restando al centro de costo el monto del pedido aprobado
            const sqlCecoReduccion = "UPDATE ?? SET presupuestoCeco = (presupuestoCeco - ?) WHERE idCeco =?"
            const sqlCecoReduccionpreparing = ['ceco', total, idCeco]
            const responseDbCeco = await db.format(sqlCecoReduccion, sqlCecoReduccionpreparing)
            const responseFinal = await db.query(responseDbCeco)
            return responseFinal

        } catch (error) {
            console.log(error);
        }

    }

    static async rechazarPedidoId(id) {
        try {
            const sqlSentences = `UPDATE ?? SET 
            estado='rechazado'
            WHERE idPedido =?`;

            const sqlPreparing = ["pedido", id];


            const sql = await db.format(sqlSentences, sqlPreparing);
            const response = await db.query(sql);
            return response;

        } catch (error) {
            console.log(error);
        }
    }

    static async obtenerProductoPorCeco(fk_ceco) {
        const query_ceco = `SELECT * FROM ?? where idCeco = ?`//obtenemos la sede del ceco
        const prepared_ceco = ['ceco', fk_ceco];
        const sql_ceco = await db.format(query_ceco, prepared_ceco)
        const res_ceco = await db.query(sql_ceco)
        const fk_sede = res_ceco[0].fk_sede

        const query_almacen = `SELECT * FROM ?? where fk_sede = ?`
        const prepared_almacen = ['inventario', fk_sede]
        const sql_almacen = await db.format(query_almacen, prepared_almacen)
        const res_almacen = await db.query(sql_almacen)

        var pre_pivot_query = "";

        var pre_sub_query = ",concat(";

        res_almacen.forEach(element => {
            // console.log(element)
            pre_pivot_query += `,max(case when producto_almacen.fk_inventario = ${element.codigoInventario} then inventario.nombreInventario else '' end) as "nombre_${element.codigoInventario}"`
            pre_pivot_query += `,max(case when producto_almacen.fk_inventario = ${element.codigoInventario} then producto_almacen.cantidadProductoAlmacen else 0 end) as "cantidad_${element.codigoInventario}"`
            pre_sub_query += `'${element.abr}',':',cantidad_${element.codigoInventario},' ',`
        });
        pre_sub_query += `"") as descripcion`;

        var pivot_query = `SELECT producto.idProducto,producto.skuProducto,producto.nombreProducto ${pre_pivot_query} FROM producto
        join producto_almacen on producto.idProducto = producto_almacen.fk_producto 
        join inventario on producto_almacen.fk_inventario = inventario.codigoInventario group by producto.idProducto`

        const sub_query = `SELECT SUBQUERY.idProducto,SUBQUERY.nombreProducto,SUBQUERY.skuProducto${pre_sub_query} FROM (${pivot_query}) SUBQUERY`
        console.log(sub_query);
        const sql = await db.format(sub_query)
        const response = await db.query(sql)
        return response
    }

    static async obtenerProductoPorCantidad(fk_producto) {
        const query = `SELECT*FROM ?? 
        JOIN producto
        ON  producto_almacen.fk_producto = producto.idProducto
        WHERE fk_producto =?`

        const prepared = ['producto_almacen', fk_producto]

        const sql = await db.format(query, prepared)
        const response = await db.query(sql)
        return response[0]
    }

    static async buscarProductoPorCodigo(sku) {
        try {
            const sqlSentences = "SELECT*FROM ?? WHERE ??=?";
            const sqlPreparing = ["producto", 'skuProducto', sku];
            const sql = await db.format(sqlSentences, sqlPreparing);
            const response = await db.query(sql);
            const skuProducto = response[0].skuProducto;

            //buscando existencias de producto en mi almacen
            const sqlSentencesSearch = `SELECT *,
            SUM(
                CASE 
                WHEN fk_inventario = '0061' 
                    THEN cantidadProductoAlmacen
                    ELSE 0
                END
            ) as CantAlmacenGeneral,
            SUM(
                 CASE 
                WHEN fk_inventario = '0062' 
                    THEN cantidadProductoAlmacen
                    ELSE 0
                END
            ) as CantAlmacenMantenimiento
            FROM ??
            JOIN producto
            ON producto_almacen.fk_producto = producto.idProducto
            WHERE producto.skuProducto = ?`;
            const sqlPreparingSearch = ['producto_almacen', skuProducto];
            const sqlSearch = await db.format(sqlSentencesSearch, sqlPreparingSearch);

            const responseSearch = await db.query(sqlSearch);


            //validar si existe en almacen o sino para seleccionar de la lista de materiales
            if (responseSearch[0].idProductoAlmacen === null) {
                return { success: false, response: response[0] }
            } else {

                return { success: true, response: responseSearch[0] }
            }


        } catch (error) {
            return { success: false }
        }
    }

    static async crearPedidoApi({ fk_ceco, maquinaDestino, tipoMantenimiento, materiales, fk_usuario, fk_area }) {

        try {
            let costoTotalDelPedidoActual = 0;

            for (let index = 0; index < materiales.length; index++) {
                //1- OBTENIENDO PRECIO DE LA DB
                const queryPrecio = "SELECT precioReferencialProducto FROM ?? WHERE skuProducto=?"
                const queryProtected = ["producto", materiales[index].codigo]
                const queryReady = await db.format(queryPrecio, queryProtected)

                const queryResponse = await db.query(queryReady)

                const costoMaterial = queryResponse[0].precioReferencialProducto;
                const costoDelPedido = costoMaterial * materiales[index].cantidad;
                costoTotalDelPedidoActual = costoTotalDelPedidoActual + costoDelPedido

            }


            //OBTENIENDO PRESUPUESTO DEL CECO ESCOGIDO
            const queryCeco = "SELECT presupuestoCeco FROM ?? WHERE idCeco = ?"
            const queryCecoProtected = ["ceco", fk_ceco]
            const queryCecoReady = await db.format(queryCeco, queryCecoProtected)
            const queryResponse = await db.query(queryCecoReady)
            const presupuestoCeco = queryResponse[0].presupuestoCeco

            if (presupuestoCeco < costoTotalDelPedidoActual) {
                return { excede: true }

            } else {
                const sqlSentencePedido = "INSERT INTO ?? SET ?";
                const sqlPreparingPedido = ["pedido", {
                    fk_usuario: fk_usuario,
                    fk_ceco: fk_ceco,
                    maquinaDestino: maquinaDestino,
                    tipoMantenimiento: tipoMantenimiento
                }];

                const sqlPedido = await db.format(sqlSentencePedido, sqlPreparingPedido);
                const responsePedido = await db.query(sqlPedido);

                //ultimo pedido insertado
                const sqlUltimo = "SELECT @@identity AS id";
                const res = await db.query(sqlUltimo);
                const idPedido = res[0].id;
                let httpResponse = {}

                //actualizando ceco y area de producto
                for (let i = 0; i < materiales.length; i++) {

                    const sqlSentenceUpdateProducto = `UPDATE producto SET
                fk_ceco =?,
                fk_area =?
                WHERE idProducto = ?`

                    const sqlPreparingUpdateProducto = [
                        fk_ceco,
                        fk_area,
                        materiales[i].idProducto
                    ];
                    const sqlResponseUpdateProducto = await db.format(sqlSentenceUpdateProducto, sqlPreparingUpdateProducto)
                    const responseUpdate = await db.query(sqlResponseUpdateProducto)

                    //insertando en detalle pedido

                    const sqlSentenceDetallePedido = "INSERT INTO ?? SET ?";
                    const sqlPreparingDetallePedido = ["detalle_pedido", {
                        cantidadPedido: materiales[i].cantidad,
                        fk_pedido: idPedido,
                        fk_producto_almacen: materiales[i].idProducto,

                    }];
                    const sqlDetallePedido = await db.format(sqlSentenceDetallePedido, sqlPreparingDetallePedido);
                    httpResponse = await db.query(sqlDetallePedido);


                }

                let httpResponseApi = Object.assign(httpResponse, { idUsuario: fk_usuario, excede: false })

                return httpResponseApi
            }


        } catch (error) {
            console.log(error);
        }



    }

    static async exportarPedido(id) {
        const sentenceSql = `SELECT 
        producto.skuProducto as codigo,
        producto.nombreProducto as material,
        detalle_pedido.cantidadPedido as cantidad,
        producto.unidadProducto as unidad,
        DATE_FORMAT(pedido.create_date, "%d/%m/%Y") as fecha,
        pedido.gpo_articulo as gpo_articulo,
        pedido.centro as centro,
        pedido.codigo_almacen as codigo_almacen,
        pedido.grupo_compra as grupo_compra,
        usuario.nombrePersonalUsuario as usuario,
        pedido.tipoMantenimiento as tipo_Mantenimiento,
        pedido.maquinaDestino as maquina_Destino
        FROM detalle_pedido
        
        INNER JOIN pedido
        ON detalle_pedido.fk_pedido = pedido.idPedido
        
      
        INNER JOIN producto
        ON detalle_pedido.fk_producto_almacen = producto.idProducto
        
        INNER JOIN usuario
        ON pedido.fk_usuario = usuario.idUsuario
        WHERE ??=?`


        const sqlPreparing = ['fk_pedido', id];
        const sql = await db.format(sentenceSql, sqlPreparing);
        const response = await db.query(sql);
        return response;

    }

    static async getListPedidosUsuarioApi(idUsuario) {
        try {
            const sqlSentences = `SELECT 
                idPedido,
                DATE_FORMAT(create_date, "%d/%m/%Y") as fecha ,
                estado,
                nombrePersonalUsuario,
                nombreCeco,
                nombreSede,
                idCeco
                FROM ??
                JOIN usuario
                ON pedido.fk_usuario = usuario.idUsuario
                JOIN ceco
                ON pedido.fk_ceco = ceco.idCeco
                JOIN sede
                ON ceco.fk_sede= sede.idSede
                WHERE fk_usuario = ?
            `;

            const sqlPreparing = ["pedido", idUsuario];
            const sql = await db.format(sqlSentences, sqlPreparing);
            const pedidos = await db.query(sql);
            return pedidos;

        } catch (error) {
            return error;
        }
    }

    static async deletePedidoId(id) {
        try {
            const sqlSentence = "DELETE FROM ?? WHERE ??=?";
            const sqlPreparing = ['detalle_pedido', 'fk_pedido', id];
            const sql = await db.format(sqlSentence, sqlPreparing);
            const response = await db.query(sql);

            if (response.affectedRows) {
                const sqlSentence = "DELETE FROM ?? WHERE ??=?";
                const sqlPreparing = ['pedido', 'idPedido', id];
                const sql = await db.format(sqlSentence, sqlPreparing);
                const response = await db.query(sql);
                return response
            }

        } catch (error) {
            return error;
        }
    }
}


module.exports = Pedido;