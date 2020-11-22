const db = require('../database/db');

class Inventario {
    static async obtenerInventarioId(idInventario) {
        const sqlQueryInventario = "SELECT*FROM ?? WHERE ??=?"
        const sqlProtectedInventario = ["inventario", "codigoInventario", idInventario]
        const sqlReady = await db.format(sqlQueryInventario, sqlProtectedInventario)
        const sqlSuccess = await db.query(sqlReady)
        return sqlSuccess[0]
    }

    static async obtenerProductosPorSede(fk_sede) {
        const sqlQueryProductos = `select idProducto,nombreProducto,fk_sede from ?? 
        join ceco  
        on producto.fk_ceco = ceco.idCeco
        where ceco.fk_sede = ?`
        const sqlProtectedProductos = ["producto", fk_sede]
        const sqlReady = await db.format(sqlQueryProductos, sqlProtectedProductos)
        const sqlSuccess = await db.query(sqlReady)
        return sqlSuccess;
    }

    static async obtenerPrecioReferencialProducto(fk_producto) {
        const sqlQueryProducto = "SELECT precioReferencialProducto FROM ?? where idProducto = ?"
        const sqlProtectedProducto = ["producto", fk_producto]
        const sqlReady = await db.format(sqlQueryProducto, sqlProtectedProducto);
        const sqlSuccess = await db.query(sqlReady)
        return sqlSuccess[0]
    }

    static async registrarInventarioInicial(material) {

        const { cantidadProductoAlmacen, costoProductoAlmacen, fechaCliente, fk_producto, fk_inventario } = material

        try {
            const sqlSentence = "INSERT INTO ?? SET ?";
            const sqlPreparing = ["producto_almacen", {
                cantidadProductoAlmacen,
                costoProductoAlmacen,
                fecha: fechaCliente,
                fk_producto,
                fk_inventario
            }];
            const sql = await db.format(sqlSentence, sqlPreparing);

            const response = await db.query(sql);

            return response;

        } catch (error) {
            return error;
        }
    }

    static async listarCodInventarioSedes() {
        try {

            const sqlSentences = `SELECT*FROM ?? JOIN sede ON inventario.fk_sede = sede.idSede`
            const sqlPreparing = ["inventario"]
            const sql = await db.format(sqlSentences, sqlPreparing)
            const response = await db.query(sql)
            return response

        } catch (error) {
            console.log(error);
        }
    }

    static async registrarIngresoInventarioModel(material) {

        const {
            movimiento,
            fk_inventario,
            codigoDocumento,
            fechaCliente,
            fk_producto,
            costoProductoAlmacen,
            cantidadProductoAlmacen,
            personaResponsable
        } = material;

        // esto no cambia
        //--------------------------------MOVIMIENTOS-----------------------------------//
        const sqlQueryMovimiento = "INSERT INTO ?? SET ?"
        const sqlProtectedMovimiento = ["movimiento", {
            tipoMovimiento: movimiento,
            fechaMovimiento: fechaCliente,
            codigoDocumento: codigoDocumento,
            fk_inventario: fk_inventario,
            personaResponsable: personaResponsable
        }]

        const sqlMovimientoPreparing = await db.format(sqlQueryMovimiento, sqlProtectedMovimiento)
        const responseModelMovimiento = await db.query(sqlMovimientoPreparing)

        // esto no cambia
        // obtenemos el ultimo movimiento
        const idLastInsertMovimiento = "SELECT @@identity AS id";
        const resMovimiento = await db.query(idLastInsertMovimiento);
        const idProducto_movimiento = resMovimiento[0].id;


        //--------------------------------PRODUCTO_ALMACEN-----------------------------------//

        //recorrer los materiales e insertarlos
        //SELECCIONANDO PRODUCTO ALMACEN PARA ESTADO INICIAL
        const sqlProductoAlmacenBaseQuery = "SELECT*FROM producto_almacen WHERE fk_producto = ?"
        const sqlProductoAlmacenBaseProtected = [fk_producto]
        const sqlReadyProductoAlmacenBase = await db.format(sqlProductoAlmacenBaseQuery, sqlProductoAlmacenBaseProtected)
        const productoBase = await db.query(sqlReadyProductoAlmacenBase)


        //update  table producto_almacen
        const sqlQuery = "UPDATE ?? SET cantidadProductoAlmacen=cantidadProductoAlmacen + ?, costoProductoAlmacen=?  WHERE fk_producto = ?";

        const sqlProtected = ["producto_almacen",
            cantidadProductoAlmacen,
            costoProductoAlmacen,
            fk_producto
        ]
        const sqlReady = await db.format(sqlQuery, sqlProtected)
        const response = await db.query(sqlReady)


        //obtener id ultimo registro actualizado
        const idProductoUltimoActualizado = "SELECT idProductoAlmacen FROM producto_almacen ORDER BY ultimaModificacion DESC LIMIT 1";
        const ultimoProductoActualizado = await db.query(idProductoUltimoActualizado);
        const idProductoAlmacenActualizado = ultimoProductoActualizado[0].idProductoAlmacen
        //update table producto
        const sqlQueryProducto = "UPDATE ?? SET precioReferencialProducto=? WHERE idProducto = ?"
        const sqlProtectedProducto = ["producto", costoProductoAlmacen, fk_producto]
        const sqlReadyProducto = await db.format(sqlQueryProducto, sqlProtectedProducto)
        const sqlResponseProducto = await db.query(sqlReadyProducto)





        //--------------------------------MOVIMIENTOS-DETALLE-----------------------------------//
        //recorrer los materiales y insertarlos aqui
        //con su respectivo movimiento
        const sqlQueryMovimientoInventario = "INSERT INTO ?? SET ?"
        const sqlProtectedMovimientoInventario = ["detalle_movimiento_inventario", {
            cantidad: cantidadProductoAlmacen,

            fk_movimiento: idProducto_movimiento,
            fk_productoAlmacen: idProductoAlmacenActualizado
        }]

        const sqlReadyMovimientoInventario = await db.format(sqlQueryMovimientoInventario, sqlProtectedMovimientoInventario)
        const responseModelMovimientoInventario = await db.query(sqlReadyMovimientoInventario)



        //--------------------------------KARDEX-----------------------------------//
        //insert kardex
        const sqlQueryKardex = "INSERT INTO ?? SET ?"
        const sqlProtectedKardex = ["kardex", {
            movimientoKardex: movimiento,
            descripcionMovimientoKardex: `${movimiento}-${codigoDocumento}`,
            fechaMovimientoKardex: fechaCliente
        }]

        const sqlReadyKardex = await db.format(sqlQueryKardex, sqlProtectedKardex)
        const responseModelKardex = await db.query(sqlReadyKardex)



        //obtener ultimo registro kardex insertado
        const idLastInsertKardex = "SELECT @@identity AS id";
        const resKardexRegister = await db.query(idLastInsertKardex);
        const idKardexRegister = resKardexRegister[0].id;


        //-------------------------INSERT-KARDEX-DETALLE-ESTADO INICIAL------------//
        const sqlQueryKardexDetalleInicial = "INSERT INTO ?? SET ?"

        const sqlProtectedKardexDetalleInicial = ["kardex_detalle", {
            cantidad: productoBase[0].cantidadProductoAlmacen,
            costo: productoBase[0].costoProductoAlmacen,
            estado: 'INICIAL',
            fk_productoAlmacen: productoBase[0].idProductoAlmacen,
            fk_kardex: idKardexRegister
        }]

        const sqlReadyKardexDetalleInicial = db.format(sqlQueryKardexDetalleInicial, sqlProtectedKardexDetalleInicial)
        const responseModelKardexDetalleInicial = db.query(sqlReadyKardexDetalleInicial)



        //---------------------------------KARDEX-DETALLE-----------------------------------//

        // //insert kardex_detalle
        const sqlQueryKardexDetalle = "INSERT INTO ?? SET ?"
        const sqlProtectedKardexDetalle = ["kardex_detalle", {
            cantidad: cantidadProductoAlmacen,
            costo: costoProductoAlmacen,
            estado: movimiento,
            fk_productoAlmacen: idProductoAlmacenActualizado,
            fk_kardex: idKardexRegister
        }]

        const sqlReadyKardexDetalle = await db.format(sqlQueryKardexDetalle, sqlProtectedKardexDetalle)
        const responseModelKardexDetalle = await db.query(sqlReadyKardexDetalle)
        return responseModelKardexDetalle


    }

    static async ListarKardexDetalles() {
        try {
            //consulta kardex con agrupacion de cantidad base,ingresos,salidas y total
            const sqlSentences = ` 
            select*,(tb1.inicial + tb1.ingresos - tb1.salidas) as total
             from (
                SELECT DISTINCT
                kardex.idKardex,
                kardex.fechaMovimientoKardex,
                kardex.movimientoKardex,
                kardex_detalle.fk_productoAlmacen,          
                DATE_FORMAT(kardex.create_date,"%d/%m/%Y") as fecha,
                sede.nombreSede,
                inventario.codigoInventario,
                kardex.descripcionMovimientoKardex,
                producto.nombreProducto,
                SUM(IF (kardex_detalle.estado = 'INICIAL',kardex_detalle.cantidad,0) ) as inicial,
                SUM(IF (kardex_detalle.estado = 'INGRESO',kardex_detalle.cantidad,0) )AS ingresos,
                SUM(IF (kardex_detalle.estado = 'SALIDA',kardex_detalle.cantidad,0) )AS salidas
                FROM kardex
                JOIN kardex_detalle
                ON  kardex.idKardex=kardex_detalle.fk_kardex
                JOIN producto_almacen
                ON kardex_detalle.fk_productoAlmacen = producto_almacen.idProductoAlmacen
                JOIN producto
                ON producto_almacen.fk_producto = producto.idProducto
                JOIN inventario
                ON producto_almacen.fk_inventario = inventario.codigoInventario
                JOIN sede
                ON inventario.fk_sede = sede.idSede
                GROUP BY kardex.idKardex,kardex_detalle.fk_productoAlmacen,kardex.create_date 
                ORDER by kardex.idKardex DESC
                ) tb1`

            const sqlPreparing = ["kardex"]
            const sql = await db.format(sqlSentences, sqlPreparing)
            const response = await db.query(sql)
            return response

        } catch (error) {
            console.log(error);
        }
    }

    static async ListarMovimientosInventarioModel() {
        try {

            const sqlSentences = `SELECT 
            idDetalleMovimientoInventario,
            DATE_FORMAT(fechaMovimiento, "%d/%m/%Y") as fecha,
            tipoMovimiento,
            nombreSede,
            codigoDocumento,
            personaResponsable
            FROM ??
            JOIN movimiento
            ON detalle_movimiento_inventario.fk_movimiento = movimiento.idMovimiento
            JOIN inventario
            ON movimiento.fk_inventario = inventario.codigoInventario
            JOIN sede
            ON inventario.fk_sede = sede.idSede
           
             `

            const sqlPreparing = ["detalle_movimiento_inventario"]
            const sql = await db.format(sqlSentences, sqlPreparing)
            const response = await db.query(sql)
            return response

        } catch (error) {
            console.log(error);
        }
    }

    static async registrarSalidaInventarioModel(material) {


        const {
            movimiento,
            fk_inventario,
            codigoDocumento,
            fechaCliente,
            fk_producto,
            costoProductoAlmacen,
            cantidadProductoAlmacen,
            personaResponsable
        } = material;

        //--------------------------------MOVIMIENTOS-----------------------------------//
        //insert movimiento
        const sqlQueryMovimiento = "INSERT INTO ?? SET ?"
        const sqlProtectedMovimiento = ["movimiento", {
            tipoMovimiento: movimiento,
            fechaMovimiento: fechaCliente,
            codigoDocumento: codigoDocumento,
            fk_inventario: fk_inventario,
            personaResponsable: personaResponsable
        }]

        const sqlMovimientoPreparing = await db.format(sqlQueryMovimiento, sqlProtectedMovimiento)
        const responseModelMovimiento = await db.query(sqlMovimientoPreparing)
        console.log(responseModelMovimiento);

        //get id last movimiento
        const idLastInsertMovimiento = "SELECT @@identity AS id";
        const resMovimiento = await db.query(idLastInsertMovimiento);
        const idProducto_movimiento = resMovimiento[0].id;
        console.log(idProducto_movimiento);



        //SELECCIONANDO EL PRODUCTOALMACEN PARA  INSERTAR ESTADO INICIAL
        const sqlProductoAlmacenBaseQuery = "SELECT*FROM producto_almacen WHERE fk_producto = ?"
        const sqlProductoAlmacenBaseProtected = [fk_producto]
        const sqlReadyProductoAlmacenBase = await db.format(sqlProductoAlmacenBaseQuery, sqlProductoAlmacenBaseProtected)
        const productoBase = await db.query(sqlReadyProductoAlmacenBase)


        //--------------------------------PRODUCTO_ALMACEN-----------------------------------//
        //update producto_almacen
        const sqlQuery = "UPDATE ?? SET cantidadProductoAlmacen=cantidadProductoAlmacen - ? WHERE fk_producto = ?";

        const sqlProtected = ["producto_almacen",
            cantidadProductoAlmacen,
            fk_producto
        ]
        const sqlReady = await db.format(sqlQuery, sqlProtected)
        const response = await db.query(sqlReady)





        //SELECCIONAMOS EL ULTIMO IDPRODUCTOALMACEN ACTUALIZADO
        const idProductoUltimoActualizado = "SELECT idProductoAlmacen FROM producto_almacen ORDER BY ultimaModificacion DESC LIMIT 1";
        const ultimoProductoActualizado = await db.query(idProductoUltimoActualizado);
        const idProductoAlmacenActualizado = ultimoProductoActualizado[0].idProductoAlmacen


        //--------------------------------MOVIMIENTOS-DETALLE-----------------------------------//
        //insert detalle_movimiento_inventario
        const sqlQueryMovimientoInventario = "INSERT INTO ?? SET ?"
        const sqlProtectedMovimientoInventario = ["detalle_movimiento_inventario", {
            cantidad: cantidadProductoAlmacen,
            costoMovimiento: costoProductoAlmacen,
            fk_movimiento: idProducto_movimiento,
            fk_productoAlmacen: idProductoAlmacenActualizado
        }]

        const sqlReadyMovimientoInventario = await db.format(sqlQueryMovimientoInventario, sqlProtectedMovimientoInventario)
        const responseModelMovimientoInventario = await db.query(sqlReadyMovimientoInventario)
        console.log(responseModelMovimientoInventario);




        //--------------------------------KARDEX-----------------------------------//
        const sqlQueryKardex = "INSERT INTO ?? SET ?"
        const sqlProtectedKardex = ["kardex", {
            movimientoKardex: movimiento,
            descripcionMovimientoKardex: `${movimiento}-${fk_inventario}`,
            fechaMovimientoKardex: fechaCliente
        }]

        const sqlReadyKardex = await db.format(sqlQueryKardex, sqlProtectedKardex)
        const responseModelKardex = await db.query(sqlReadyKardex)



        //OBTENER EL ULTIMO REGISTRO DE KARDEX INSERTADO
        const idLastInsertKardex = "SELECT @@identity AS id";
        const resKardexRegister = await db.query(idLastInsertKardex);
        const idKardexRegister = resKardexRegister[0].id;



        //-------------------------INSERT-KARDEX-DETALLE-ESTADO INICIAL------------//
        const sqlQueryKardexDetalleInicial = "INSERT INTO ?? SET ?"

        const sqlProtectedKardexDetalleInicial = ["kardex_detalle", {
            cantidad: productoBase[0].cantidadProductoAlmacen,
            costo: productoBase[0].costoProductoAlmacen,
            estado: 'INICIAL',
            fk_productoAlmacen: productoBase[0].idProductoAlmacen,
            fk_kardex: idKardexRegister
        }]

        const sqlReadyKardexDetalleInicial = db.format(sqlQueryKardexDetalleInicial, sqlProtectedKardexDetalleInicial)
        const responseModelKardexDetalleInicial = db.query(sqlReadyKardexDetalleInicial)



        //---------------------------------KARDEX-DETALLE-----------------------------------//

        // //insert kardex_detalle
        const sqlQueryKardexDetalle = "INSERT INTO ?? SET ?"
        const sqlProtectedKardexDetalle = ["kardex_detalle", {
            cantidad: cantidadProductoAlmacen,
            costo: costoProductoAlmacen,
            estado: movimiento,
            fk_productoAlmacen: idProductoAlmacenActualizado,
            fk_kardex: idKardexRegister
        }]

        const sqlReadyKardexDetalle = await db.format(sqlQueryKardexDetalle, sqlProtectedKardexDetalle)
        const responseModelKardexDetalle = await db.query(sqlReadyKardexDetalle)
        return responseModelKardexDetalle


    }


    static async obtenerCantidadProducto(fk_producto) {
        const sqlQueryProducto = "SELECT cantidadProductoAlmacen FROM ?? where fk_producto = ?"
        const sqlProtectedProducto = ["producto_almacen", fk_producto]
        const sqlReady = await db.format(sqlQueryProducto, sqlProtectedProducto);
        const sqlSuccess = await db.query(sqlReady)
        return sqlSuccess[0]
    }


    static async validarExistenciaProductoModel(fk_producto) {
        const sqlQueryProducto = "SELECT*FROM ?? where fk_producto = ?"
        const sqlProtectedProducto = ["producto_almacen", fk_producto]
        const sqlReady = await db.format(sqlQueryProducto, sqlProtectedProducto);
        const sqlSuccess = await db.query(sqlReady)
        return sqlSuccess[0]
    }

}


module.exports = Inventario;