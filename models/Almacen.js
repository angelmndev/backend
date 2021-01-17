const almacen = require('../controllers/almacen');
const db = require('../database/db');

class Almacen {
    static async obtenerAlmacenPorSede(fk_sede) {
        const query = `
        SELECT sede.nombreSede,codigoInventario,nombreInventario
        FROM ??
        JOIN sede
        ON inventario.fk_sede = sede.idSede
        WHERE inventario.fk_sede = ?
        `;

        const prepared = ['inventario', fk_sede]
        const ready = db.format(query, prepared)
        const response = db.query(ready)
        return response
    }

    static async obtenerMaterialesPorSede(fk_sede) {
        const query = `
        select idProducto,nombreProducto,fk_sede from ?? 
        join ceco  
        on producto.fk_ceco = ceco.idCeco
        where ceco.fk_sede = ?`;

        const prepared = ['producto', fk_sede]
        const ready = db.format(query, prepared)
        const response = db.query(ready)
        return response
    }

    static async obtenerMaterialesPorAlmacen(fk_almacen) {
        const query = `
        select producto.idProducto,producto.nombreProducto from ?? 
        join producto  
        on producto_almacen.fk_producto = producto.idProducto
        where producto_almacen.fk_inventario = ?`;
        console.log(fk_almacen);
        const prepared = ['producto_almacen', fk_almacen]
        const ready = db.format(query, prepared)
        const response = db.query(ready)
        return response
    }

    static async registrarInventarioInicial({ fecha, fk_inventario, materiales }) {
        try {
            let response = {};
            materiales.map(async (item) => {

                const sqlSentence = "INSERT INTO ?? SET ?";
                const sqlPreparing = ["producto_almacen", {
                    fecha: fecha,
                    fk_inventario: fk_inventario,
                    fk_producto: item.material,
                    costoProductoAlmacen: item.precio,
                    cantidadProductoAlmacen: item.cantidad,
                }];
                const sql = await db.format(sqlSentence, sqlPreparing);

                response = await db.query(sql);

                //UPDATE TABLE MATERIALES
                const sqlQueryMateriales = "UPDATE ?? SET precioReferencialProducto=? WHERE idProducto=?"
                const sqlProtectedMateriales = ["producto", item.precio, item.material]
                const sqlMateriales = db.format(sqlQueryMateriales, sqlProtectedMateriales)
                const sqlMaterialesResponse = db.query(sqlMateriales)

            });

            return response;

        } catch (error) {
            return error;
        }
    }

    static async validarProductoAlmacen(idProducto, idAlmacen) {
        const query = "SELECT*FROM ?? WHERE fk_producto = ? AND fk_inventario = ?"
        const queryProtected = ['producto_almacen', idProducto, idAlmacen]
        const ready = await db.format(query, queryProtected)
        const sql = await db.query(ready)

        return sql[0]
    }

    static async registrarIngresoMaterial({ movimiento, fecha, fk_inventario, codigoDocumento, responsable, materiales }) {
        try {
            let responseIngreso = {}
            //REGISTRAR INGRESO DE MOVIMIENTO
            const query = `INSERT INTO ?? SET ?`
            const queryProtected = ['movimiento', {
                tipoMovimiento: movimiento,
                fechaMovimiento: fecha,
                codigoDocumento: codigoDocumento,
                fk_inventario: fk_inventario,
                personaResponsable: responsable
            }]

            const ready = await db.format(query, queryProtected)
            const sql = await db.query(ready)

            //OBTENER EL ULTIMO REGISTRO DE MOVIMIENTO
            const ultimoInsertMovimiento = "SELECT @@identity AS id";
            const responseUltimoMovimiento = await db.query(ultimoInsertMovimiento);
            const obtenerUltimoMovimientoInsertado = responseUltimoMovimiento[0].id;

            //6- REGISTRAR INGRESO DE PRODUCTO EN KARDEX
            const sqlQueryKardex = `INSERT INTO ?? SET ?`
            const sqlProtectedKardex = ['kardex', {
                movimientoKardex: movimiento,
                descripcionMovimientoKardex: `${movimiento} - ${codigoDocumento}`,
                fechaMovimientoKardex: fecha
            }]

            const sqlReadyKardex = await db.format(sqlQueryKardex, sqlProtectedKardex)
            const sqlResponseKardex = await db.query(sqlReadyKardex)

            //OBTENER ULTIMO REGISTRO DE KARDEX INGRESADO
            const idLastInsertKardex = "SELECT @@identity AS id";
            const resKardexRegister = await db.query(idLastInsertKardex);
            const ultimoRegistroKardexIngresado = resKardexRegister[0].id;

            //---------------RECORRIENDO MATERIALES---------------------------//
            materiales.map(async (item, index) => {

                //1- OBTENER CANTIDADES INICIALES DE LOS MATERIALES
                const queryCantidadInicial = `SELECT*FROM ?? WHERE fk_producto=? AND fk_inventario=?`
                const queryProtectedCantidadInicial = ['producto_almacen', item.material, fk_inventario]
                const readySql = await db.format(queryCantidadInicial, queryProtectedCantidadInicial)
                const cantidadInicialResponse = await db.query(readySql)

                //2- REGISTRAR EN PRODUCTO_ALMACEN  
                const query = `
                UPDATE ?? SET
                cantidadProductoAlmacen=cantidadProductoAlmacen + ?,
                costoProductoAlmacen=? 
                WHERE fk_producto = ? AND fk_inventario = ?`

                const queryProtected = ['producto_almacen',
                    item.cantidad,
                    item.precio,
                    item.material,
                    fk_inventario

                ]

                const ready = await db.format(query, queryProtected)
                const sql = await db.query(ready)

                //3- OBTENEMOS EL ULTIMO REGISTRO PRODUCTO_ALMACEN ACTUALIZADO (AQUI ESTOY OBTENIENDO 2 REGISTROS )
                const idProductoUltimoActualizado = "SELECT idProductoAlmacen FROM producto_almacen ORDER BY ultimaModificacion DESC ";
                const ultimoProductoActualizado = await db.query(idProductoUltimoActualizado);
                const idProductoAlmacenActualizado = ultimoProductoActualizado[index].idProductoAlmacen


                //4- ACTUALIZAMOS LA TABLA MATERIALES
                const sqlQueryProducto = "UPDATE ?? SET precioReferencialProducto=? WHERE idProducto = ?"
                const sqlProtectedProducto = ["producto", item.precio, item.material]
                const sqlReadyProducto = await db.format(sqlQueryProducto, sqlProtectedProducto)
                const sqlResponseProducto = await db.query(sqlReadyProducto)


                //5- REGISTRAR TABLA MOVIMIENTO_DETALLE
                const sqlQueryMovimientoDetalle = "INSERT INTO ?? SET ?"
                const sqlProtectedMovimientoDetalle = ['detalle_movimiento_inventario', {
                    cantidad: item.cantidad,
                    fk_movimiento: obtenerUltimoMovimientoInsertado,
                    fk_productoAlmacen: idProductoAlmacenActualizado
                }]

                const sqlReadyMovimientoDetalle = await db.format(sqlQueryMovimientoDetalle, sqlProtectedMovimientoDetalle)
                const sqlResponseMovimientoDetalle = await db.query(sqlReadyMovimientoDetalle)

                //7- REGISTRAR KARDEX_DETALLE CANTIDAD INICIAL
                const sqlQueryKardexDetalle = "INSERT INTO ?? SET ?"
                const sqlProtectedKardexDetalle = ['kardex_detalle', {
                    cantidad: cantidadInicialResponse[0].cantidadProductoAlmacen,
                    costo: cantidadInicialResponse[0].costoProductoAlmacen,
                    estado: 'INICIAL',
                    fk_productoAlmacen: cantidadInicialResponse[0].idProductoAlmacen,
                    fk_kardex: ultimoRegistroKardexIngresado
                }]

                const sqlReadyKardexDetalle = await db.format(sqlQueryKardexDetalle, sqlProtectedKardexDetalle)
                const sqlResponseKardexDetalle = await db.query(sqlReadyKardexDetalle)


                //8- REGISTRAR KARDEX_DETALLE INGRESO
                const sqlQueryKardexDetalleIngreso = "INSERT INTO ?? SET ?"
                const sqlProtectedKardexDetalleIngreso = ["kardex_detalle", {
                    cantidad: item.cantidad,
                    costo: item.precio,
                    estado: movimiento,
                    fk_productoAlmacen: idProductoAlmacenActualizado,
                    fk_kardex: ultimoRegistroKardexIngresado
                }]

                const sqlReadyKardexDetalleIngreso = await db.format(sqlQueryKardexDetalleIngreso, sqlProtectedKardexDetalleIngreso)
                const responseModelKardexDetalleIngreso = await db.query(sqlReadyKardexDetalleIngreso)

            })

            return responseIngreso


        } catch (error) {

        }
    }

    static async registrarSalidaMaterial({ movimiento, fecha, fk_inventario, codigoDocumento, responsable, uso, materiales }) {

        try {
            let responseSalida = {}
            //REGISTRAR INGRESO DE MOVIMIENTO
            const query = `INSERT INTO ?? SET ?`
            const queryProtected = ['movimiento', {
                tipoMovimiento: movimiento,
                fechaMovimiento: fecha,
                codigoDocumento: codigoDocumento,
                fk_inventario: fk_inventario,
                personaResponsable: responsable,
                uso: uso
            }]


            const ready = await db.format(query, queryProtected)
            const sql = await db.query(ready)

            //OBTENER EL ULTIMO REGISTRO DE MOVIMIENTO
            const ultimoInsertMovimiento = "SELECT @@identity AS id";
            const responseUltimoMovimiento = await db.query(ultimoInsertMovimiento);
            const obtenerUltimoMovimientoInsertado = responseUltimoMovimiento[0].id;



            //6- REGISTRAR INGRESO DE PRODUCTO EN KARDEX
            const sqlQueryKardex = `INSERT INTO ?? SET ?`
            const sqlProtectedKardex = ['kardex', {
                movimientoKardex: movimiento,
                descripcionMovimientoKardex: `${movimiento} - ${codigoDocumento}`,
                fechaMovimientoKardex: fecha
            }]

            const sqlReadyKardex = await db.format(sqlQueryKardex, sqlProtectedKardex)
            const sqlResponseKardex = await db.query(sqlReadyKardex)

            //OBTENER ULTIMO REGISTRO DE KARDEX INGRESADO
            const idLastInsertKardex = "SELECT @@identity AS id";
            const resKardexRegister = await db.query(idLastInsertKardex);
            const ultimoRegistroKardexIngresado = resKardexRegister[0].id;

            //---------------RECORRIENDO MATERIALES---------------------------//
            materiales.map(async (item, index) => {

                //1- OBTENER CANTIDADES INICIALES DE LOS MATERIALES
                const queryCantidadInicial = "SELECT*FROM ?? WHERE fk_producto=? AND fk_inventario=? "
                const queryProtectedCantidadInicial = ['producto_almacen', item.material, fk_inventario]
                const readySql = await db.format(queryCantidadInicial, queryProtectedCantidadInicial)
                const cantidadInicialResponse = await db.query(readySql)

                //2- REGISTRAR EN PRODUCTO_ALMACEN  
                const query = "UPDATE ?? SET cantidadProductoAlmacen=cantidadProductoAlmacen - ? WHERE fk_producto=? AND fk_inventario=? "

                const queryProtected = ['producto_almacen',
                    item.cantidad,
                    item.material,
                    fk_inventario

                ]

                const ready = await db.format(query, queryProtected)
                const sql = await db.query(ready)

                //3- OBTENEMOS EL ULTIMO REGISTRO PRODUCTO_ALMACEN ACTUALIZADO (AQUI ESTOY OBTENIENDO 2 REGISTROS )
                const idProductoUltimoActualizado = "SELECT idProductoAlmacen FROM producto_almacen ORDER BY ultimaModificacion DESC ";
                const ultimoProductoActualizado = await db.query(idProductoUltimoActualizado);
                const idProductoAlmacenActualizado = ultimoProductoActualizado[index].idProductoAlmacen


                //4- ACTUALIZAMOS LA TABLA MATERIALES
                // const sqlQueryProducto = "UPDATE ?? SET precioReferencialProducto=? WHERE idProducto = ?"
                // const sqlProtectedProducto = ["producto", item.precio, item.material]
                // const sqlReadyProducto = await db.format(sqlQueryProducto, sqlProtectedProducto)
                // const sqlResponseProducto = await db.query(sqlReadyProducto)


                //5- REGISTRAR TABLA MOVIMIENTO_DETALLE
                const sqlQueryMovimientoDetalle = "INSERT INTO ?? SET ?"
                const sqlProtectedMovimientoDetalle = ['detalle_movimiento_inventario', {
                    cantidad: item.cantidad,
                    fk_movimiento: obtenerUltimoMovimientoInsertado,
                    fk_productoAlmacen: idProductoAlmacenActualizado
                }]

                const sqlReadyMovimientoDetalle = await db.format(sqlQueryMovimientoDetalle, sqlProtectedMovimientoDetalle)
                const sqlResponseMovimientoDetalle = await db.query(sqlReadyMovimientoDetalle)

                //7- REGISTRAR KARDEX_DETALLE CANTIDAD INICIAL
                const sqlQueryKardexDetalle = "INSERT INTO ?? SET ?"
                const sqlProtectedKardexDetalle = ['kardex_detalle', {
                    cantidad: cantidadInicialResponse[0].cantidadProductoAlmacen,
                    costo: cantidadInicialResponse[0].costoProductoAlmacen,
                    estado: 'INICIAL',
                    fk_productoAlmacen: cantidadInicialResponse[0].idProductoAlmacen,
                    fk_kardex: ultimoRegistroKardexIngresado
                }]

                const sqlReadyKardexDetalle = await db.format(sqlQueryKardexDetalle, sqlProtectedKardexDetalle)
                const sqlResponseKardexDetalle = await db.query(sqlReadyKardexDetalle)


                //8- REGISTRAR KARDEX_DETALLE INGRESO
                const sqlQueryKardexDetalleIngreso = "INSERT INTO ?? SET ?"
                const sqlProtectedKardexDetalleIngreso = ["kardex_detalle", {
                    cantidad: item.cantidad,
                    costo: item.precio,
                    estado: movimiento,
                    fk_productoAlmacen: idProductoAlmacenActualizado,
                    fk_kardex: ultimoRegistroKardexIngresado
                }]

                const sqlReadyKardexDetalleIngreso = await db.format(sqlQueryKardexDetalleIngreso, sqlProtectedKardexDetalleIngreso)
                const responseModelKardexDetalleIngreso = await db.query(sqlReadyKardexDetalleIngreso)
                responseSalida = responseModelKardexDetalleIngreso
            })

            return responseSalida


        } catch (error) {

        }
    }

    static async mostrarKardex() {
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
                inventario.abr,
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
        }
        catch (err) {

        }
    }

    static async filtrarKardexProductoFechas(fechaInicio, fechaFin, material) {
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
                DATE_FORMAT(kardex.create_date,"%d-%m-%Y") as fecha,
                sede.nombreSede,
                inventario.abr,
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
                ) tb1
                WHERE fecha BETWEEN '${fechaInicio}' AND '${fechaFin}' AND nombreProducto='${material}'`



            const response = await db.query(sqlSentences)

            return response
        }
        catch (err) {
            console.log(err)
        }
    }

    static async filtrarKardexPorFecha(fechaInicio, fechaFin) {
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
                DATE_FORMAT(kardex.create_date,"%d-%m-%Y") as fecha,
                sede.nombreSede,
                inventario.abr,
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
                ) tb1
                WHERE fecha BETWEEN '${fechaInicio}' AND '${fechaFin}' `



            const response = await db.query(sqlSentences)

            return response
        }
        catch (err) {
            console.log(err)
        }
    }
    static async mostrarMovimientos() {
        try {

            const sqlSentences = `SELECT 
            idMovimiento,
            DATE_FORMAT(fechaMovimiento, "%d/%m/%Y") as fecha,
            tipoMovimiento,
            nombreSede,
            codigoDocumento,
            personaResponsable,
            uso
            FROM ??
            JOIN inventario
            ON movimiento.fk_inventario = inventario.codigoInventario
            JOIN sede
            ON inventario.fk_sede = sede.idSede
           
             `

            const sqlPreparing = ["movimiento"]
            const sql = await db.format(sqlSentences, sqlPreparing)
            const response = await db.query(sql)
            return response

        } catch (error) {
            console.log(error);
        }
    }

    static async mostrarMovimientosDetalles(idMovimiento) {
        try {

            const sqlSentences = `SELECT 
            idDetalleMovimientoInventario,
            producto.nombreProducto,
            detalle_movimiento_inventario.cantidad,
            movimiento.tipoMovimiento,
            movimiento.codigoDocumento
            FROM ??
            JOIN movimiento
            ON detalle_movimiento_inventario.fk_movimiento = movimiento.idMovimiento
            JOIN producto_almacen
            ON detalle_movimiento_inventario.fk_productoAlmacen = producto_almacen.idProductoAlmacen
            JOIN producto
            ON producto_almacen.fk_producto = producto.idProducto
        
            WHERE fk_movimiento = ?`

            const sqlPreparing = ["detalle_movimiento_inventario", idMovimiento]
            const sql = await db.format(sqlSentences, sqlPreparing)
            const response = await db.query(sql)
            return response

        } catch (error) {
            console.log(error);
        }
    }


    static async obtenerDetalleMovimientoId(idMovimientoDetalle) {
        try {

            const sqlSentences = `SELECT 
            idDetalleMovimientoInventario,
            fk_productoAlmacen,
            producto.nombreProducto,
            detalle_movimiento_inventario.cantidad,
            movimiento.tipoMovimiento,
            movimiento.codigoDocumento
            FROM ??
            JOIN movimiento
            ON detalle_movimiento_inventario.fk_movimiento = movimiento.idMovimiento
            JOIN producto_almacen
            ON detalle_movimiento_inventario.fk_productoAlmacen = producto_almacen.idProductoAlmacen
            JOIN producto
            ON producto_almacen.fk_producto = producto.idProducto
        
            WHERE idDetalleMovimientoInventario = ?`

            const sqlPreparing = ["detalle_movimiento_inventario", idMovimientoDetalle]
            const sql = await db.format(sqlSentences, sqlPreparing)
            const response = await db.query(sql)

            return response[0]

        } catch (error) {
            console.log(error);
        }
    }

    static async actualizarCantidadMovimientoAndAlmacenId(idMovimientoDetalle, fk_productoAlmacen, cantidadProducto) {

        //1- OBTENER CANTIDAD ANTERIOR DEL DETALLE MOVIMIENTO
        const queryCantidadAnterior = "SELECT cantidad,fk_movimiento FROM ?? WHERE idDetalleMovimientoInventario=?"
        const queryCantidadPrepared = ["detalle_movimiento_inventario", idMovimientoDetalle]
        const queryCantidadReady = await db.format(queryCantidadAnterior, queryCantidadPrepared)
        const queryResponse = await db.query(queryCantidadReady)
        const cantidadAnterior = queryResponse[0].cantidad
        const idMovimiento = queryResponse[0].fk_movimiento

        //2- ACTUALIZAR CANTIDAD MOVIMIENTO DETALLE
        const query = "UPDATE ?? SET cantidad = ? WHERE idDetalleMovimientoInventario=?"
        const queryProtected = ["detalle_movimiento_inventario", cantidadProducto, idMovimientoDetalle]
        const queryReady = await db.format(query, queryProtected)
        const responseQuery = await db.query(queryReady)

        //1- OBTENER CANTIDADES INICIALES DE LOS MATERIALES
        const queryCantidadInicial = "SELECT*FROM ?? WHERE idProductoAlmacen=? "
        const queryProtectedCantidadInicial = ['producto_almacen', fk_productoAlmacen]
        const readySql = await db.format(queryCantidadInicial, queryProtectedCantidadInicial)
        const cantidadInicialResponse = await db.query(readySql)

        //4.- OBTENER DATOS DEL MOVIMIENTO
        const queryMovimiento = "SELECT * FROM ?? WHERE idMovimiento=?"
        const queryMovimientoPrepared = ["movimiento", idMovimiento]
        const queryMovimientoResponse = await db.query(queryMovimiento, queryMovimientoPrepared)
        const result = queryMovimientoResponse[0]

        //check if movimiento is INGRESO or SALIDA
        var qty = cantidadAnterior - cantidadProducto
        console.log(qty);
        if (qty != 0) {
            var registroKardexBase = null
            var registroKardexMovimiento = null
            // const m = null
            var m = null;
            var sqlQueryKardex = `INSERT INTO ?? SET ? `
            var sqlProtectedKardex = null;
            switch (result.tipoMovimiento) {
                case "INGRESO":
                    //10 -> 12 = -2 ; aumento la cantidad => INGRESO
                    m = qty > 0 ? "SALIDA" : "INGRESO"

                    sqlProtectedKardex = ['kardex', {
                        movimientoKardex: m,
                        descripcionMovimientoKardex: `Regularizacion ${m} - ${result.codigoDocumento}`
                    }]

                    //12 -> 10 = 2 ; disminuyo la cantidad => SALIDA
                    break;
                case "SALIDA":
                    m = qty > 0 ? "INGRESO" : "SALIDA"
                    //10 -> 12 = -2; aumento la cantidad => SALIDA
                    //12 -> 10 = 2; disminuyo la cantidad => INGRESO

                    sqlProtectedKardex = ['kardex', {
                        movimientoKardex: m,
                        descripcionMovimientoKardex: `Regularizacion ${m} - ${result.codigoDocumento}`
                    }]

                    break;
                default:
                    break;
            }
            const sqlReadyKardex = await db.format(sqlQueryKardex, sqlProtectedKardex)
            const sqlResponseKardex = await db.query(sqlReadyKardex)

            //OBTENER ULTIMO REGISTRO DE KARDEX INGRESADO
            const idLastInsertKardex = "SELECT @@identity AS id";
            const resKardexRegister = await db.query(idLastInsertKardex);
            const ultimoRegistroKardexIngresado = resKardexRegister[0].id;

            registroKardexBase = ["kardex_detalle", {
                cantidad: cantidadInicialResponse[0].cantidadProductoAlmacen,
                costo: cantidadInicialResponse[0].costoProductoAlmacen,
                estado: 'INICIAL',
                fk_productoAlmacen: cantidadInicialResponse[0].idProductoAlmacen,
                fk_kardex: ultimoRegistroKardexIngresado
            }]

            registroKardexMovimiento = ["kardex_detalle", {
                cantidad: Math.abs(qty),
                costo: cantidadInicialResponse[0].costoProductoAlmacen,
                estado: m,
                fk_productoAlmacen: fk_productoAlmacen,
                fk_kardex: ultimoRegistroKardexIngresado
            }]

            const queryInicialReady = await db.format(sqlQueryKardex, registroKardexBase)
            const queryInicialResponse = await db.query(queryInicialReady)

            const queryMovReady = await db.format(sqlQueryKardex, registroKardexMovimiento)
            const queryMovResponse = await db.query(queryMovReady)



            //3- ACTUALIZAR CANTIDAD PRODUCTO ALMACEN
            const queryProductoAlmacen = `UPDATE ?? SET cantidadProductoAlmacen=(cantidadProductoAlmacen-${cantidadAnterior})+ ? WHERE idProductoAlmacen=?`
            const queryProductoAlmacenPrepared = ["producto_almacen", cantidadProducto, fk_productoAlmacen]
            const queryProductoAlmacenReady = await db.format(queryProductoAlmacen, queryProductoAlmacenPrepared)
            const queryProductolmacenResponse = await db.query(queryProductoAlmacenReady)
        }

        return result;

    }

    static async moverEntreAlmacen({ materiales, almacenOrigen, almacenDestino, codigoDocumento, usuarioResponsable, fecha }) {
        try {

            const queryMovimientoAlmacen = "INSERT INTO ?? SET ?";
            const query_protected_almacen = ['movimiento_almacenes', {
                codigoDocumento: codigoDocumento,
                responsable: usuarioResponsable,
                fk_almacenOrigen: almacenOrigen,
                fk_almacenDestino: almacenDestino,
                fecha_create: fecha
            }]
            const readyQueryAlmacen = await db.format(queryMovimientoAlmacen, query_protected_almacen);
            const movimiento_almacen_response = await db.query(readyQueryAlmacen);

            const ultimoInsert = "SELECT @@identity AS id";
            const responseUltimoMovimiento = await db.query(ultimoInsert);
            const idMovimientoAlmacenes = responseUltimoMovimiento[0].id;

            const queryRetiroKardex = "INSERT INTO ?? SET ?";
            const query_protected_kardex = ['kardex', {
                movimientoKardex: "SALIDA",
                descripcionMovimientoKardex: "MATERIAL CAMBIO DE ALMACEN SALIDA - " + codigoDocumento,
                fechaMovimientoKardex: fecha
            }]
            const readyQueryKardex = await db.format(queryRetiroKardex, query_protected_kardex);
            const kardex_retiro_response = await db.query(readyQueryKardex)

            const responseRetiroKardex = await db.query(ultimoInsert);
            const id_kardex_retiro = responseRetiroKardex[0].id;

            const queryIngresoKardex = "INSERT INTO ?? SET ?";
            const query_protected_kardex_ingreso = ['kardex', {
                movimientoKardex: "INGRESO",
                descripcionMovimientoKardex: "MATERIAL CAMBIO DE ALMACEN INGRESO - " + codigoDocumento,
                fechaMovimientoKardex: fecha
            }]
            const readyQueryKardexIngreso = await db.format(queryIngresoKardex, query_protected_kardex_ingreso);
            const kardex_ingreso_response = await db.query(readyQueryKardexIngreso)

            const responseIngresoKardex = await db.query(ultimoInsert);
            const id_kardex_ingreso = responseIngresoKardex[0].id;

            materiales.map(async (item, index) => {
                //registrar materiales
                const query_movimiento_almacen_detalle = "INSERT INTO ?? SET ?"
                const query_protected_almacen_detalle = ['movimiento_destino_origen', {
                    cantidad: item.cantidad,
                    fk_movimiento_almacenes: idMovimientoAlmacenes,
                    fk_producto_almacen: item.material //cambio de fk_producto_almacen a fk_producto
                }]
                const ready_movimiento_almacen_detalle = await db.format(query_movimiento_almacen_detalle, query_protected_almacen_detalle)
                const response_movimiento_almacen_detalle = await db.query(ready_movimiento_almacen_detalle)

                //consutar cantidad inicial de productos de almacen origen
                const query_producto_almacen = "SELECT * FROM ?? WHERE fk_inventario = ? and fk_producto = ?"
                const query_protected_producto_almacen = ['producto_almacen', almacenOrigen, item.material];
                const ready_producto_almacen = await db.format(query_producto_almacen, query_protected_producto_almacen)
                const response_producto_almacen_origen = await db.query(ready_producto_almacen)
                const _query_protected_producto_almacen = ['producto_almacen', almacenDestino, item.material];
                const _ready_producto_almacen = await db.format(query_producto_almacen, _query_protected_producto_almacen)
                var response_producto_almacen_destino = await db.query(_ready_producto_almacen);
                console.log(response_producto_almacen_destino)
                // exit;
                if (response_producto_almacen_destino.length === 0) {
                    const queryNewProducto = "INSERT INTO ?? SET ?"
                    const newProductoAlmacen = ['producto_almacen', {
                        cantidadProductoAlmacen: 0,
                        costoProductoAlmacen: response_producto_almacen_origen[0].costoProductoAlmacen,
                        fecha: fecha,
                        fk_producto: response_producto_almacen_origen[0].fk_producto,
                        fk_inventario: almacenDestino
                    }]
                    const readyNewProducto = await db.format(queryNewProducto, newProductoAlmacen);
                    const responseNewProducto = await db.query(readyNewProducto);
                    response_producto_almacen_destino = await db.query(_ready_producto_almacen);
                    //si no encuentra agregamos como nuevo producto en el almacen y el stock inicial es 0
                }
                const query_updated_almacen_origen = `UPDATE producto_almacen SET cantidadProductoAlmacen=(cantidadProductoAlmacen-${item.cantidad}) where idProductoAlmacen=${response_producto_almacen_origen[0].idProductoAlmacen}`
                const query_updated_almacen_destino = `UPDATE producto_almacen SET cantidadProductoAlmacen=(cantidadProductoAlmacen+${item.cantidad}) where idProductoAlmacen=${response_producto_almacen_destino[0].idProductoAlmacen}`
                //descontamos de almacen origen
                db.query(query_updated_almacen_origen);
                db.query(query_updated_almacen_destino);
                //aumentamos en almacen destino

                //registrar material salida
                // const query_registro_kardex_detalle = "INSERT INTO ?? SET ?"
                const _query_protected_inicial_salida = ['kardex_detalle', {
                    cantidad: response_producto_almacen_origen[0].cantidadProductoAlmacen,
                    costo: response_producto_almacen_origen[0].costoProductoAlmacen,
                    estado: "INICIAL",
                    fk_productoAlmacen: response_producto_almacen_origen[0].idProductoAlmacen,
                    fk_kardex: id_kardex_retiro
                }]
                const _query_protected_kardex_salida = ['kardex_detalle', {
                    cantidad: item.cantidad,
                    costo: response_producto_almacen_origen[0].costoProductoAlmacen,
                    estado: "SALIDA",
                    fk_productoAlmacen: response_producto_almacen_origen[0].idProductoAlmacen,
                    fk_kardex: id_kardex_retiro
                }]

                const _query_protected_inicial_ingreso = ['kardex_detalle', {
                    cantidad: response_producto_almacen_destino[0].cantidadProductoAlmacen,
                    costo: response_producto_almacen_destino[0].costoProductoAlmacen,
                    estado: "INICIAL",
                    fk_productoAlmacen: response_producto_almacen_destino[0].idProductoAlmacen,
                    fk_kardex: id_kardex_ingreso
                }]
                const _query_protected_kardex_ingreso = ['kardex_detalle', {
                    cantidad: item.cantidad,
                    costo: response_producto_almacen_destino[0].costoProductoAlmacen,
                    estado: "INGRESO",
                    fk_productoAlmacen: response_producto_almacen_destino[0].idProductoAlmacen,
                    fk_kardex: id_kardex_ingreso
                }]
                //registrar material ingreso
                const ready_inicial_ingreso = await db.format(queryIngresoKardex, _query_protected_inicial_ingreso);
                db.query(ready_inicial_ingreso);
                const ready_inicial_salida = await db.format(queryIngresoKardex, _query_protected_inicial_salida);
                db.query(ready_inicial_salida);
                const ready_salida = await db.format(queryIngresoKardex, _query_protected_kardex_salida);
                db.query(ready_salida);
                const ready_ingreso = await db.format(queryIngresoKardex, _query_protected_kardex_ingreso);
                db.query(ready_ingreso);
            })
            return true;

        } catch (error) {
            return false;
        }

    }

    static async filtroProductoSedeAlmacen(sede, almacen) {
        try {
            // var inventarios = [];
            // var prepared = "";
            // console.log(sede);
            var query = `
            select inventario.nombreInventario,producto.idProducto,producto.nombreProducto,producto_almacen.cantidadProductoAlmacen as cantidadProductoAlmacen , producto_almacen.costoProductoAlmacen  from ?? 
            join producto  
            on producto_almacen.fk_producto = producto.idProducto
            join inventario
            on producto_almacen.fk_inventario = inventario.codigoInventario`
            if (almacen == null) {
                //obtener todos los almacenes por sede
                query += ` where inventario.fk_sede = ? AND producto_almacen.cantidadProductoAlmacen > 0 `;
                var prepared = ['producto_almacen', sede]
            } else {
                query += ` where producto_almacen.fk_inventario = ?  AND producto_almacen.cantidadProductoAlmacen > 0 `;
                var prepared = ['producto_almacen', almacen]
            }
            const ready = await db.format(query, prepared)

            const response = await db.query(ready)

            return { success: true, data: response }
        } catch (error) {
            return { success: false, message: error }
        }
        // return { success: true , message : response}
    }


    static async actualizarStockGeneral(materiales) {

        for (let index = 0; index < materiales.length; index++) {


            const query = `UPDATE producto_almacen
            INNER JOIN producto
            ON  producto_almacen.fk_producto = producto.idProducto
            SET
            producto_almacen.cantidadProductoAlmacen = ?,
            producto_almacen.costoProductoAlmacen =?,
            producto.precioReferencialProducto=?
            WHERE producto.skuProducto = ?`

            const queryProtected = [materiales[index].cantidad, materiales[index].precio, materiales[index].precio, materiales[index].sku]
            const queryReady = await db.format(query, queryProtected)
            const responseQuery = await db.query(queryReady)
            return responseQuery
        }
    }

    static async eliminarMaterialesInnecesarios() {

        let material = [
            { "fk_producto": "29" },
            { "fk_producto": "34" },
            { "fk_producto": "36" },
            { "fk_producto": "37" },
            { "fk_producto": "46" },
            { "fk_producto": "55" },
            { "fk_producto": "56" },
            { "fk_producto": "60" },
            { "fk_producto": "64" },
            { "fk_producto": "75" },
            { "fk_producto": "80" },
            { "fk_producto": "86" },
            { "fk_producto": "87" },
            { "fk_producto": "89" },
            { "fk_producto": "99" },
            { "fk_producto": "106" },
            { "fk_producto": "111" },
            { "fk_producto": "115" },
            { "fk_producto": "124" },
            { "fk_producto": "126" },
            { "fk_producto": "134" },
            { "fk_producto": "157" },
            { "fk_producto": "177" },
            { "fk_producto": "178" },
            { "fk_producto": "181" },
            { "fk_producto": "207" },
            { "fk_producto": "223" },
            { "fk_producto": "235" },
            { "fk_producto": "252" },
            { "fk_producto": "263" },
            { "fk_producto": "265" },
            { "fk_producto": "266" },
            { "fk_producto": "271" },
            { "fk_producto": "273" },
            { "fk_producto": "274" },
            { "fk_producto": "277" },
            { "fk_producto": "278" },
            { "fk_producto": "280" },
            { "fk_producto": "282" },
            { "fk_producto": "283" },
            { "fk_producto": "284" },
            { "fk_producto": "288" },
            { "fk_producto": "299" },
            { "fk_producto": "301" },
            { "fk_producto": "302" },
            { "fk_producto": "304" },
            { "fk_producto": "308" },
            { "fk_producto": "312" },
            { "fk_producto": "315" },
            { "fk_producto": "319" },
            { "fk_producto": "320" },
            { "fk_producto": "323" },
            { "fk_producto": "324" },
            { "fk_producto": "328" },
            { "fk_producto": "329" },
            { "fk_producto": "336" },
            { "fk_producto": "342" },
            { "fk_producto": "354" },
            { "fk_producto": "357" },
            { "fk_producto": "366" },
            { "fk_producto": "370" },
            { "fk_producto": "372" },
            { "fk_producto": "386" },
            { "fk_producto": "392" },
            { "fk_producto": "400" },
            { "fk_producto": "414" },
            { "fk_producto": "432" },
            { "fk_producto": "433" },
            { "fk_producto": "443" },
            { "fk_producto": "468" },
            { "fk_producto": "470" },
            { "fk_producto": "482" },
            { "fk_producto": "485" },
            { "fk_producto": "507" },
            { "fk_producto": "518" },
            { "fk_producto": "530" },
            { "fk_producto": "532" },
            { "fk_producto": "533" },
            { "fk_producto": "534" },
            { "fk_producto": "541" },
            { "fk_producto": "542" },
            { "fk_producto": "543" },
            { "fk_producto": "547" },
            { "fk_producto": "548" },
            { "fk_producto": "561" },
            { "fk_producto": "564" },
            { "fk_producto": "565" },
            { "fk_producto": "568" },
            { "fk_producto": "570" },
            { "fk_producto": "573" },
            { "fk_producto": "574" },
            { "fk_producto": "576" },
            { "fk_producto": "582" },
            { "fk_producto": "590" },
            { "fk_producto": "591" },
            { "fk_producto": "593" },
            { "fk_producto": "595" },
            { "fk_producto": "596" },
            { "fk_producto": "607" },
            { "fk_producto": "608" },
            { "fk_producto": "610" },
            { "fk_producto": "613" },
            { "fk_producto": "614" },
            { "fk_producto": "618" },
            { "fk_producto": "619" },
            { "fk_producto": "625" },
            { "fk_producto": "628" },
            { "fk_producto": "631" },
            { "fk_producto": "632" },
            { "fk_producto": "633" },
            { "fk_producto": "641" },
            { "fk_producto": "642" },
            { "fk_producto": "660" },
            { "fk_producto": "662" },
            { "fk_producto": "670" },
            { "fk_producto": "676" },
            { "fk_producto": "681" },
            { "fk_producto": "682" },
            { "fk_producto": "693" },
            { "fk_producto": "724" },
            { "fk_producto": "753" },
            { "fk_producto": "759" },
            { "fk_producto": "800" },
            { "fk_producto": "822" },
            { "fk_producto": "838" },
            { "fk_producto": "859" },
            { "fk_producto": "920" },
            { "fk_producto": "921" },
            { "fk_producto": "951" },
            { "fk_producto": "953" },
            { "fk_producto": "954" },
            { "fk_producto": "997" },
            { "fk_producto": "1003" },
            { "fk_producto": "1004" },
            { "fk_producto": "1005" },
            { "fk_producto": "1006" },
            { "fk_producto": "1007" },
            { "fk_producto": "1008" },
            { "fk_producto": "1009" },
            { "fk_producto": "1012" },
            { "fk_producto": "1013" },
            { "fk_producto": "1033" },
            { "fk_producto": "1034" },
            { "fk_producto": "1046" },
            { "fk_producto": "1048" },
            { "fk_producto": "1059" },
            { "fk_producto": "1064" },
            { "fk_producto": "1119" },
            { "fk_producto": "1121" },
            { "fk_producto": "1123" },
            { "fk_producto": "1205" },
            { "fk_producto": "1215" },
            { "fk_producto": "1227" },
            { "fk_producto": "1232" },
            { "fk_producto": "1233" },
            { "fk_producto": "1239" },
            { "fk_producto": "1245" },
            { "fk_producto": "1267" },
            { "fk_producto": "1321" },
            { "fk_producto": "1322" },
            { "fk_producto": "1342" },
            { "fk_producto": "1365" },
            { "fk_producto": "1369" },
            { "fk_producto": "1480" },
            { "fk_producto": "1501" },
            { "fk_producto": "1503" },
            { "fk_producto": "1518" },
            { "fk_producto": "1588" },
            { "fk_producto": "1590" },
            { "fk_producto": "1606" },
            { "fk_producto": "1607" },
            { "fk_producto": "1686" },
            { "fk_producto": "1690" },
            { "fk_producto": "1692" },
            { "fk_producto": "1695" },
            { "fk_producto": "1698" },
            { "fk_producto": "1699" },
            { "fk_producto": "1700" },
            { "fk_producto": "1707" },
            { "fk_producto": "1708" },
            { "fk_producto": "1712" },
            { "fk_producto": "1718" },
            { "fk_producto": "1724" },
            { "fk_producto": "1736" },
            { "fk_producto": "1738" },
            { "fk_producto": "1739" },
            { "fk_producto": "1749" },
            { "fk_producto": "1755" },
            { "fk_producto": "1756" },
            { "fk_producto": "1757" },
            { "fk_producto": "1768" },
            { "fk_producto": "1769" },
            { "fk_producto": "1770" },
            { "fk_producto": "1772" },
            { "fk_producto": "1773" },
            { "fk_producto": "1781" },
            { "fk_producto": "1784" },
            { "fk_producto": "1786" },
            { "fk_producto": "1787" },
            { "fk_producto": "1788" },
            { "fk_producto": "1792" },
            { "fk_producto": "1794" },
            { "fk_producto": "1799" },
            { "fk_producto": "1801" },
            { "fk_producto": "1803" },
            { "fk_producto": "1805" },
            { "fk_producto": "1808" },
            { "fk_producto": "1814" },
            { "fk_producto": "1815" },
            { "fk_producto": "1819" },
            { "fk_producto": "1837" },
            { "fk_producto": "1838" },
            { "fk_producto": "1839" },
            { "fk_producto": "1847" },
            { "fk_producto": "1848" },
            { "fk_producto": "1849" },
            { "fk_producto": "1850" },
            { "fk_producto": "1851" },
            { "fk_producto": "1859" },
            { "fk_producto": "1883" },
            { "fk_producto": "1891" },
            { "fk_producto": "1929" },
            { "fk_producto": "1930" },
            { "fk_producto": "1979" },
            { "fk_producto": "1990" },
            { "fk_producto": "1997" },
            { "fk_producto": "1998" },
            { "fk_producto": "2001" },
            { "fk_producto": "2002" },
            { "fk_producto": "2004" },
            { "fk_producto": "2010" },
            { "fk_producto": "2011" },
            { "fk_producto": "2025" },
            { "fk_producto": "2032" },
            { "fk_producto": "2038" },
            { "fk_producto": "2049" },
            { "fk_producto": "2050" },
            { "fk_producto": "2076" },
            { "fk_producto": "2108" },
            { "fk_producto": "2112" },
            { "fk_producto": "2113" },
            { "fk_producto": "2119" },
            { "fk_producto": "2120" },
            { "fk_producto": "2124" },
            { "fk_producto": "2149" },
            { "fk_producto": "2199" },
            { "fk_producto": "2202" },
            { "fk_producto": "2204" },
            { "fk_producto": "2205" },
            { "fk_producto": "2216" },
            { "fk_producto": "2218" },
            { "fk_producto": "2221" },
            { "fk_producto": "2224" },
            { "fk_producto": "2273" },
            { "fk_producto": "2285" },
            { "fk_producto": "2299" },
            { "fk_producto": "2306" },
            { "fk_producto": "2329" },
            { "fk_producto": "2330" },
            { "fk_producto": "2331" },
            { "fk_producto": "2332" },
            { "fk_producto": "2333" },
            { "fk_producto": "2335" },
            { "fk_producto": "2336" },
            { "fk_producto": "2337" },
            { "fk_producto": "2340" },
            { "fk_producto": "2349" },
            { "fk_producto": "2360" },
            { "fk_producto": "2370" },
            { "fk_producto": "2372" },
            { "fk_producto": "2378" },
            { "fk_producto": "2379" },
            { "fk_producto": "2380" },
            { "fk_producto": "2382" },
            { "fk_producto": "2385" },
            { "fk_producto": "2389" },
            { "fk_producto": "2390" },
            { "fk_producto": "2391" },
            { "fk_producto": "2396" },
            { "fk_producto": "2397" },
            { "fk_producto": "2400" },
            { "fk_producto": "2402" },
            { "fk_producto": "2405" },
            { "fk_producto": "2410" },
            { "fk_producto": "2411" },
            { "fk_producto": "2413" },
            { "fk_producto": "2419" },
            { "fk_producto": "2422" },
            { "fk_producto": "2423" },
            { "fk_producto": "2424" },
            { "fk_producto": "2425" },
            { "fk_producto": "2426" },
            { "fk_producto": "2427" },
            { "fk_producto": "2428" },
            { "fk_producto": "2429" },
            { "fk_producto": "2432" },
            { "fk_producto": "2433" },
            { "fk_producto": "2457" },
            { "fk_producto": "2461" },
            { "fk_producto": "2466" },
            { "fk_producto": "2468" },
            { "fk_producto": "2523" },
            { "fk_producto": "2530" },
            { "fk_producto": "2549" },
            { "fk_producto": "2559" },
            { "fk_producto": "2560" },
            { "fk_producto": "2566" },
            { "fk_producto": "2568" },
            { "fk_producto": "2573" },
            { "fk_producto": "2577" },
            { "fk_producto": "2581" },
            { "fk_producto": "2588" },
            { "fk_producto": "2593" },
            { "fk_producto": "2601" },
            { "fk_producto": "2605" },
            { "fk_producto": "2643" },
            { "fk_producto": "2648" },
            { "fk_producto": "2650" },
            { "fk_producto": "2651" },
            { "fk_producto": "2652" },
            { "fk_producto": "2657" },
            { "fk_producto": "2659" },
            { "fk_producto": "2682" },
            { "fk_producto": "2692" },
            { "fk_producto": "2696" },
            { "fk_producto": "2700" },
            { "fk_producto": "2701" },
            { "fk_producto": "2702" },
            { "fk_producto": "2704" },
            { "fk_producto": "2705" },
            { "fk_producto": "2706" },
            { "fk_producto": "2709" },
            { "fk_producto": "2711" },
            { "fk_producto": "2803" },
            { "fk_producto": "2822" },
            { "fk_producto": "2854" },
            { "fk_producto": "2870" },
            { "fk_producto": "2871" },
            { "fk_producto": "2874" },
            { "fk_producto": "2880" },
            { "fk_producto": "2883" },
            { "fk_producto": "2887" },
            { "fk_producto": "2904" },
            { "fk_producto": "2914" },
            { "fk_producto": "2920" },
            { "fk_producto": "2928" },
            { "fk_producto": "2938" },
            { "fk_producto": "2988" },
            { "fk_producto": "3005" },
            { "fk_producto": "3029" },
            { "fk_producto": "3075" },
            { "fk_producto": "3091" },
            { "fk_producto": "3112" },
            { "fk_producto": "3114" },
            { "fk_producto": "3123" },
            { "fk_producto": "3139" },
            { "fk_producto": "3152" },
            { "fk_producto": "3171" },
            { "fk_producto": "3176" },
            { "fk_producto": "3202" },
            { "fk_producto": "3326" },
            { "fk_producto": "3329" },
            { "fk_producto": "3334" },
            { "fk_producto": "3336" },
            { "fk_producto": "3343" },
            { "fk_producto": "3377" },
            { "fk_producto": "3380" },
            { "fk_producto": "3401" },
            { "fk_producto": "3406" },
            { "fk_producto": "3432" },
            { "fk_producto": "3439" },
            { "fk_producto": "3447" },
            { "fk_producto": "3453" },
            { "fk_producto": "3480" },
            { "fk_producto": "3487" },
            { "fk_producto": "3492" },
            { "fk_producto": "3493" },
            { "fk_producto": "3499" },
            { "fk_producto": "3543" },
            { "fk_producto": "3645" },
            { "fk_producto": "3669" },
            { "fk_producto": "3698" },
            { "fk_producto": "3711" },
            { "fk_producto": "3721" },
            { "fk_producto": "3727" },
            { "fk_producto": "3729" },
            { "fk_producto": "3749" },
            { "fk_producto": "3750" },
            { "fk_producto": "3774" },
            { "fk_producto": "3787" },
            { "fk_producto": "3816" },
            { "fk_producto": "3826" },
            { "fk_producto": "3849" },
            { "fk_producto": "3902" },
            { "fk_producto": "3903" },
            { "fk_producto": "3904" },
            { "fk_producto": "3905" },
            { "fk_producto": "3906" },
            { "fk_producto": "3913" },
            { "fk_producto": "3914" },
            { "fk_producto": "3929" },
            { "fk_producto": "3954" },
            { "fk_producto": "3968" },
            { "fk_producto": "3978" },
            { "fk_producto": "3979" },
            { "fk_producto": "3992" },
            { "fk_producto": "4000" },
            { "fk_producto": "4001" },
            { "fk_producto": "4005" },
            { "fk_producto": "4006" },
            { "fk_producto": "4048" },
            { "fk_producto": "4052" },
            { "fk_producto": "4106" },
            { "fk_producto": "4231" },
            { "fk_producto": "4256" },
            { "fk_producto": "4268" },
            { "fk_producto": "4439" },
            { "fk_producto": "4440" },
            { "fk_producto": "4458" },
            { "fk_producto": "4472" },
            { "fk_producto": "4473" },
            { "fk_producto": "4507" },
            { "fk_producto": "4511" },
            { "fk_producto": "4544" },
            { "fk_producto": "4558" },
            { "fk_producto": "4585" },
            { "fk_producto": "4598" },
            { "fk_producto": "4642" },
            { "fk_producto": "4780" },
            { "fk_producto": "4826" },
            { "fk_producto": "4867" },
            { "fk_producto": "5121" },
            { "fk_producto": "5129" },
            { "fk_producto": "5131" },
            { "fk_producto": "5134" },
            { "fk_producto": "5139" },
            { "fk_producto": "5141" },
            { "fk_producto": "5149" },
            { "fk_producto": "5150" },
            { "fk_producto": "5154" },
            { "fk_producto": "5170" },
            { "fk_producto": "5172" },
            { "fk_producto": "5247" },
            { "fk_producto": "5399" },
            { "fk_producto": "5513" },
            { "fk_producto": "5514" },
            { "fk_producto": "5519" },
            { "fk_producto": "5523" },
            { "fk_producto": "5530" },
            { "fk_producto": "5532" },
            { "fk_producto": "5549" },
            { "fk_producto": "5553" },
            { "fk_producto": "5554" },
            { "fk_producto": "5558" },
            { "fk_producto": "5571" },
            { "fk_producto": "5596" },
            { "fk_producto": "5603" },
            { "fk_producto": "5607" },
            { "fk_producto": "5608" },
            { "fk_producto": "5611" },
            { "fk_producto": "5617" },
            { "fk_producto": "5618" },
            { "fk_producto": "5623" },
            { "fk_producto": "5624" },
            { "fk_producto": "5631" },
            { "fk_producto": "5644" },
            { "fk_producto": "5647" },
            { "fk_producto": "5652" },
            { "fk_producto": "5653" },
            { "fk_producto": "5665" },
            { "fk_producto": "5675" },
            { "fk_producto": "5681" },
            { "fk_producto": "5687" },
            { "fk_producto": "5692" },
            { "fk_producto": "5703" },
            { "fk_producto": "5704" },
            { "fk_producto": "5708" },
            { "fk_producto": "5711" },
            { "fk_producto": "5712" },
            { "fk_producto": "5713" },
            { "fk_producto": "5718" },
            { "fk_producto": "5719" },
            { "fk_producto": "5721" },
            { "fk_producto": "5723" },
            { "fk_producto": "5724" },
            { "fk_producto": "5725" },
            { "fk_producto": "5728" },
            { "fk_producto": "5729" },
            { "fk_producto": "5730" },
            { "fk_producto": "5731" },
            { "fk_producto": "5732" },
            { "fk_producto": "5733" },
            { "fk_producto": "5734" },
            { "fk_producto": "5735" },
            { "fk_producto": "5736" },
            { "fk_producto": "5737" },
            { "fk_producto": "5738" },
            { "fk_producto": "5740" },
            { "fk_producto": "5741" },
            { "fk_producto": "5742" },
            { "fk_producto": "5743" },
            { "fk_producto": "5744" },
            { "fk_producto": "5745" },
            { "fk_producto": "5747" },
            { "fk_producto": "5749" },
            { "fk_producto": "5750" },
            { "fk_producto": "5751" },
            { "fk_producto": "5752" },
            { "fk_producto": "5753" },
            { "fk_producto": "5755" },
            { "fk_producto": "5756" },
            { "fk_producto": "5757" },
            { "fk_producto": "5758" },
            { "fk_producto": "5759" },
            { "fk_producto": "5760" },
            { "fk_producto": "5764" },
            { "fk_producto": "5768" },
            { "fk_producto": "5769" },
            { "fk_producto": "5773" },
            { "fk_producto": "5776" },
            { "fk_producto": "5777" },
            { "fk_producto": "5778" },
            { "fk_producto": "5780" },
            { "fk_producto": "5788" },
            { "fk_producto": "5795" },
            { "fk_producto": "5803" },
            { "fk_producto": "5805" },
            { "fk_producto": "5806" },
            { "fk_producto": "5821" },
            { "fk_producto": "5828" },
            { "fk_producto": "5829" },
            { "fk_producto": "5832" },
            { "fk_producto": "5833" },
            { "fk_producto": "5836" },
            { "fk_producto": "5837" },
            { "fk_producto": "5838" },
            { "fk_producto": "5850" },
            { "fk_producto": "5851" },
            { "fk_producto": "5858" },
            { "fk_producto": "5874" },
            { "fk_producto": "5875" },
            { "fk_producto": "5876" },
            { "fk_producto": "5894" },
            { "fk_producto": "5897" },
            { "fk_producto": "5898" },
            { "fk_producto": "5903" },
            { "fk_producto": "5904" },
            { "fk_producto": "5909" },
            { "fk_producto": "5911" },
            { "fk_producto": "5917" },
            { "fk_producto": "5918" },
            { "fk_producto": "5920" },
            { "fk_producto": "5922" },
            { "fk_producto": "5929" },
            { "fk_producto": "5930" },
            { "fk_producto": "5931" },
            { "fk_producto": "5934" },
            { "fk_producto": "5935" },
            { "fk_producto": "5940" },
            { "fk_producto": "5945" },
            { "fk_producto": "5952" },
            { "fk_producto": "5955" },
            { "fk_producto": "5961" },
            { "fk_producto": "5965" },
            { "fk_producto": "5966" },
            { "fk_producto": "5970" },
            { "fk_producto": "5972" },
            { "fk_producto": "5980" },
            { "fk_producto": "5981" },
            { "fk_producto": "5982" },
            { "fk_producto": "5988" },
            { "fk_producto": "5989" },
            { "fk_producto": "5991" },
            { "fk_producto": "5996" },
            { "fk_producto": "6009" },
            { "fk_producto": "6012" },
            { "fk_producto": "6017" },
            { "fk_producto": "6035" },
            { "fk_producto": "6085" },
            { "fk_producto": "6087" },
            { "fk_producto": "6090" },
            { "fk_producto": "6109" },
            { "fk_producto": "6137" },
            { "fk_producto": "6150" },
            { "fk_producto": "6180" },
            { "fk_producto": "6182" },
            { "fk_producto": "6194" },
            { "fk_producto": "6200" },
            { "fk_producto": "6205" },
            { "fk_producto": "6206" },
            { "fk_producto": "6211" },
            { "fk_producto": "6212" },
            { "fk_producto": "6213" },
            { "fk_producto": "6214" },
            { "fk_producto": "6215" },
            { "fk_producto": "6217" },
            { "fk_producto": "6319" },
            { "fk_producto": "6337" },
            { "fk_producto": "6362" },
            { "fk_producto": "6363" },
            { "fk_producto": "6369" },
            { "fk_producto": "6371" },
            { "fk_producto": "6372" },
            { "fk_producto": "6378" },
            { "fk_producto": "6409" },
            { "fk_producto": "6420" },
            { "fk_producto": "6425" },
            { "fk_producto": "6442" },
            { "fk_producto": "6455" },
            { "fk_producto": "6457" },
            { "fk_producto": "6472" },
            { "fk_producto": "6485" },
            { "fk_producto": "6496" },
            { "fk_producto": "6503" },
            { "fk_producto": "6504" },
            { "fk_producto": "6505" },
            { "fk_producto": "6506" },
            { "fk_producto": "6507" },
            { "fk_producto": "6512" },
            { "fk_producto": "6513" },
            { "fk_producto": "6536" },
            { "fk_producto": "6537" },
            { "fk_producto": "6562" },
            { "fk_producto": "6582" },
            { "fk_producto": "6591" },
            { "fk_producto": "6592" },
            { "fk_producto": "6595" },
            { "fk_producto": "6598" },
            { "fk_producto": "6624" },
            { "fk_producto": "6633" },
            { "fk_producto": "6634" },
            { "fk_producto": "6635" },
            { "fk_producto": "6636" },
            { "fk_producto": "6637" },
            { "fk_producto": "6639" },
            { "fk_producto": "6641" },
            { "fk_producto": "6642" },
            { "fk_producto": "6645" },
            { "fk_producto": "6646" },
            { "fk_producto": "6647" },
            { "fk_producto": "6649" },
            { "fk_producto": "6657" },
            { "fk_producto": "6658" },
            { "fk_producto": "6662" },
            { "fk_producto": "6663" },
            { "fk_producto": "6666" },
            { "fk_producto": "6672" },
            { "fk_producto": "6673" },
            { "fk_producto": "6674" },
            { "fk_producto": "6684" },
            { "fk_producto": "6783" },
            { "fk_producto": "6784" },
            { "fk_producto": "6794" },
            { "fk_producto": "6796" },
            { "fk_producto": "6797" },
            { "fk_producto": "6799" },
            { "fk_producto": "6816" },
            { "fk_producto": "6828" },
            { "fk_producto": "6829" },
            { "fk_producto": "6832" },
            { "fk_producto": "6833" },
            { "fk_producto": "6860" },
            { "fk_producto": "6861" },
            { "fk_producto": "6863" },
            { "fk_producto": "6864" },
            { "fk_producto": "6866" },
            { "fk_producto": "6867" },
            { "fk_producto": "6868" },
            { "fk_producto": "6875" },
            { "fk_producto": "6876" },
            { "fk_producto": "6886" },
            { "fk_producto": "6891" },
            { "fk_producto": "6892" },
            { "fk_producto": "6893" },
            { "fk_producto": "6896" },
            { "fk_producto": "6899" },
            { "fk_producto": "6900" },
            { "fk_producto": "6902" },
            { "fk_producto": "6914" },
            { "fk_producto": "6929" },
            { "fk_producto": "6943" },
            { "fk_producto": "6962" },
            { "fk_producto": "6965" },
            { "fk_producto": "6969" },
            { "fk_producto": "6970" },
            { "fk_producto": "6983" },
            { "fk_producto": "6991" },
            { "fk_producto": "6999" },
            { "fk_producto": "7008" },
            { "fk_producto": "7009" },
            { "fk_producto": "7012" },
            { "fk_producto": "7022" },
            { "fk_producto": "7028" },
            { "fk_producto": "7037" },
            { "fk_producto": "7041" },
            { "fk_producto": "7069" },
            { "fk_producto": "7084" },
            { "fk_producto": "7085" },
            { "fk_producto": "7090" },
            { "fk_producto": "7092" },
            { "fk_producto": "7098" },
            { "fk_producto": "7110" },
            { "fk_producto": "7118" },
            { "fk_producto": "7120" },
            { "fk_producto": "7121" },
            { "fk_producto": "7122" },
            { "fk_producto": "7123" },
            { "fk_producto": "7126" },
            { "fk_producto": "7127" },
            { "fk_producto": "7130" },
            { "fk_producto": "7132" },
            { "fk_producto": "7133" },
            { "fk_producto": "7177" },
            { "fk_producto": "7198" },
            { "fk_producto": "7203" },
            { "fk_producto": "7204" },
            { "fk_producto": "7206" },
            { "fk_producto": "7208" },
            { "fk_producto": "7210" },
            { "fk_producto": "7215" },
            { "fk_producto": "7219" },
            { "fk_producto": "7220" },
            { "fk_producto": "7221" },
            { "fk_producto": "7222" },
            { "fk_producto": "7226" },
            { "fk_producto": "7238" },
            { "fk_producto": "7239" },
            { "fk_producto": "7244" },
            { "fk_producto": "7246" },
            { "fk_producto": "7248" },
            { "fk_producto": "7249" },
            { "fk_producto": "7251" },
            { "fk_producto": "7252" },
            { "fk_producto": "7253" },
            { "fk_producto": "7256" },
            { "fk_producto": "7265" },
            { "fk_producto": "7273" },
            { "fk_producto": "7281" },
            { "fk_producto": "7287" },
            { "fk_producto": "7290" },
            { "fk_producto": "7296" },
            { "fk_producto": "7311" },
            { "fk_producto": "7315" },
            { "fk_producto": "7318" },
            { "fk_producto": "7338" },
            { "fk_producto": "7341" },
            { "fk_producto": "7353" },
            { "fk_producto": "7361" },
            { "fk_producto": "7362" },
            { "fk_producto": "7368" },
            { "fk_producto": "7371" },
            { "fk_producto": "7374" },
            { "fk_producto": "7375" },
            { "fk_producto": "7401" },
            { "fk_producto": "7406" },
            { "fk_producto": "7416" },
            { "fk_producto": "7437" },
            { "fk_producto": "7468" },
            { "fk_producto": "7476" },
            { "fk_producto": "7506" },
            { "fk_producto": "7522" },
            { "fk_producto": "7670" },
            { "fk_producto": "7673" },
            { "fk_producto": "7683" },
            { "fk_producto": "7688" },
            { "fk_producto": "7689" },
            { "fk_producto": "7692" },
            { "fk_producto": "7780" },
            { "fk_producto": "7781" },
            { "fk_producto": "7812" },
            { "fk_producto": "7813" },
            { "fk_producto": "7814" },
            { "fk_producto": "7815" },
            { "fk_producto": "7820" },
            { "fk_producto": "7821" },
            { "fk_producto": "7831" },
            { "fk_producto": "7845" },
            { "fk_producto": "7846" },
            { "fk_producto": "7847" },
            { "fk_producto": "7854" },
            { "fk_producto": "7856" },
            { "fk_producto": "7857" },
            { "fk_producto": "7901" },
            { "fk_producto": "7990" },
            { "fk_producto": "7991" },
            { "fk_producto": "8007" },
            { "fk_producto": "8008" },
            { "fk_producto": "8039" },
            { "fk_producto": "8063" },
            { "fk_producto": "8064" },
            { "fk_producto": "8102" },
            { "fk_producto": "8162" },
            { "fk_producto": "8164" },
            { "fk_producto": "8170" },
            { "fk_producto": "8214" },
            { "fk_producto": "8305" },
            { "fk_producto": "8324" },
            { "fk_producto": "8363" },
            { "fk_producto": "8411" },
            { "fk_producto": "8466" },
            { "fk_producto": "8473" },
            { "fk_producto": "8480" },
            { "fk_producto": "8481" },
            { "fk_producto": "8488" },
            { "fk_producto": "8490" },
            { "fk_producto": "8492" },
            { "fk_producto": "8493" },
            { "fk_producto": "8507" },
            { "fk_producto": "8509" },
            { "fk_producto": "8523" },
            { "fk_producto": "8610" },
            { "fk_producto": "8703" },
            { "fk_producto": "8704" },
            { "fk_producto": "8722" },
            { "fk_producto": "8767" },
            { "fk_producto": "8773" },
            { "fk_producto": "8774" },
            { "fk_producto": "8787" },
            { "fk_producto": "8791" },
            { "fk_producto": "8792" },
            { "fk_producto": "8811" },
            { "fk_producto": "8818" },
            { "fk_producto": "8829" },
            { "fk_producto": "8830" },
            { "fk_producto": "8831" },
            { "fk_producto": "8864" },
            { "fk_producto": "8879" },
            { "fk_producto": "8880" },
            { "fk_producto": "8881" },
            { "fk_producto": "8912" },
            { "fk_producto": "9000" },
            { "fk_producto": "9031" },
            { "fk_producto": "9044" },
            { "fk_producto": "9046" },
            { "fk_producto": "9047" },
            { "fk_producto": "9049" },
            { "fk_producto": "9050" },
            { "fk_producto": "9060" },
            { "fk_producto": "9070" },
            { "fk_producto": "9092" },
            { "fk_producto": "9186" },
            { "fk_producto": "9187" },
            { "fk_producto": "9241" },
            { "fk_producto": "9243" },
            { "fk_producto": "9249" },
            { "fk_producto": "9250" },
            { "fk_producto": "9253" },
            { "fk_producto": "9269" },
            { "fk_producto": "9436" },
            { "fk_producto": "9489" },
            { "fk_producto": "9579" },
            { "fk_producto": "9687" },
            { "fk_producto": "9689" },
            { "fk_producto": "9712" },
            { "fk_producto": "9768" },
            { "fk_producto": "9770" },
            { "fk_producto": "9777" },
            { "fk_producto": "9821" },
            { "fk_producto": "9847" },
            { "fk_producto": "10051" },
            { "fk_producto": "10200" },
            { "fk_producto": "10201" },
            { "fk_producto": "10235" },
            { "fk_producto": "10302" },
            { "fk_producto": "10398" },
            { "fk_producto": "10408" },
            { "fk_producto": "10472" },
            { "fk_producto": "10486" },
            { "fk_producto": "10548" },
            { "fk_producto": "10554" },
            { "fk_producto": "10649" },
            { "fk_producto": "10666" },
            { "fk_producto": "10667" },
            { "fk_producto": "10668" },
            { "fk_producto": "10671" },
            { "fk_producto": "10672" },
            { "fk_producto": "10675" },
            { "fk_producto": "10686" },
            { "fk_producto": "10687" },
            { "fk_producto": "10728" },
            { "fk_producto": "10733" },
            { "fk_producto": "10839" },
            { "fk_producto": "10866" },
            { "fk_producto": "10867" },
            { "fk_producto": "10876" },
            { "fk_producto": "10907" },
            { "fk_producto": "10927" },
            { "fk_producto": "10931" },
            { "fk_producto": "10990" },
            { "fk_producto": "10994" },
            { "fk_producto": "10995" },
            { "fk_producto": "11000" },
            { "fk_producto": "11003" },
            { "fk_producto": "11018" },
            { "fk_producto": "11023" },
            { "fk_producto": "11101" },
            { "fk_producto": "11180" },
            { "fk_producto": "11181" },
            { "fk_producto": "11197" },
            { "fk_producto": "11207" },
            { "fk_producto": "11209" },
            { "fk_producto": "11280" },
            { "fk_producto": "11284" },
            { "fk_producto": "11289" },
            { "fk_producto": "11359" },
            { "fk_producto": "11367" },
            { "fk_producto": "11374" },
            { "fk_producto": "11377" },
            { "fk_producto": "11378" },
            { "fk_producto": "11379" },
            { "fk_producto": "11383" },
            { "fk_producto": "11386" },
            { "fk_producto": "11388" },
            { "fk_producto": "11515" },
            { "fk_producto": "11522" },
            { "fk_producto": "11555" },
            { "fk_producto": "11556" },
            { "fk_producto": "11643" },
            { "fk_producto": "11644" },
            { "fk_producto": "11647" },
            { "fk_producto": "11648" },
            { "fk_producto": "11650" },
            { "fk_producto": "11653" },
            { "fk_producto": "11655" },
            { "fk_producto": "11668" },
            { "fk_producto": "11705" },
            { "fk_producto": "11707" },
            { "fk_producto": "11708" },
            { "fk_producto": "11771" },
            { "fk_producto": "11780" },
            { "fk_producto": "11853" },
            { "fk_producto": "11858" },
            { "fk_producto": "11926" },
            { "fk_producto": "12016" },
            { "fk_producto": "12017" },
            { "fk_producto": "12018" },
            { "fk_producto": "12019" },
            { "fk_producto": "12042" },
            { "fk_producto": "12046" },
            { "fk_producto": "12047" },
            { "fk_producto": "12122" },
            { "fk_producto": "12192" },
            { "fk_producto": "12347" },
            { "fk_producto": "12496" },
            { "fk_producto": "13838" },
            { "fk_producto": "13879" },
            { "fk_producto": "13925" },
            { "fk_producto": "13933" },
            { "fk_producto": "13938" },
            { "fk_producto": "13939" },
            { "fk_producto": "13941" },
            { "fk_producto": "13947" },
            { "fk_producto": "13949" },
            { "fk_producto": "13951" },
            { "fk_producto": "13954" },
            { "fk_producto": "13962" },
            { "fk_producto": "14015" },
            { "fk_producto": "14017" },
            { "fk_producto": "14018" },
            { "fk_producto": "14019" },
            { "fk_producto": "14020" },
            { "fk_producto": "14036" },
            { "fk_producto": "14040" },
            { "fk_producto": "14041" },
            { "fk_producto": "14042" },
            { "fk_producto": "14044" },
            { "fk_producto": "14045" },
            { "fk_producto": "14046" },
            { "fk_producto": "14047" },
            { "fk_producto": "14055" },
            { "fk_producto": "14066" },
            { "fk_producto": "14073" },
            { "fk_producto": "14084" },
            { "fk_producto": "14086" },
            { "fk_producto": "14095" },
            { "fk_producto": "14104" },
            { "fk_producto": "14110" },
            { "fk_producto": "14115" },
            { "fk_producto": "14118" },
            { "fk_producto": "14119" },
            { "fk_producto": "14122" },
            { "fk_producto": "14128" },
            { "fk_producto": "14129" },
            { "fk_producto": "14133" },
            { "fk_producto": "14134" },
            { "fk_producto": "14135" },
            { "fk_producto": "14136" },
            { "fk_producto": "14139" },
            { "fk_producto": "14143" },
            { "fk_producto": "14144" },
            { "fk_producto": "14145" },
            { "fk_producto": "14147" },
            { "fk_producto": "14158" },
            { "fk_producto": "14160" },
            { "fk_producto": "14164" },
            { "fk_producto": "14165" },
            { "fk_producto": "14168" },
            { "fk_producto": "14171" },
            { "fk_producto": "14172" },
            { "fk_producto": "14174" },
            { "fk_producto": "14175" },
            { "fk_producto": "14178" },
            { "fk_producto": "14179" },
            { "fk_producto": "14184" },
            { "fk_producto": "14185" },
            { "fk_producto": "14198" },
            { "fk_producto": "14200" },
            { "fk_producto": "14208" },
            { "fk_producto": "14209" },
            { "fk_producto": "14210" },
            { "fk_producto": "14215" },
            { "fk_producto": "14216" },
            { "fk_producto": "14224" },
            { "fk_producto": "14229" },
            { "fk_producto": "14234" },
            { "fk_producto": "14238" },
            { "fk_producto": "14242" },
            { "fk_producto": "14243" },
            { "fk_producto": "14251" },
            { "fk_producto": "14252" },
            { "fk_producto": "14281" },
            { "fk_producto": "14289" },
            { "fk_producto": "14292" },
            { "fk_producto": "14293" },
            { "fk_producto": "14295" },
            { "fk_producto": "14297" },
            { "fk_producto": "14299" },
            { "fk_producto": "14300" },
            { "fk_producto": "14305" },
            { "fk_producto": "14306" },
            { "fk_producto": "14311" },
            { "fk_producto": "14327" },
            { "fk_producto": "14328" },
            { "fk_producto": "14331" },
            { "fk_producto": "14332" },
            { "fk_producto": "14336" },
            { "fk_producto": "14338" },
            { "fk_producto": "14340" },
            { "fk_producto": "14341" },
            { "fk_producto": "14349" },
            { "fk_producto": "14350" },
            { "fk_producto": "14351" },
            { "fk_producto": "14352" },
            { "fk_producto": "14353" },
            { "fk_producto": "14360" },
            { "fk_producto": "14362" },
            { "fk_producto": "14364" },
            { "fk_producto": "14396" },
            { "fk_producto": "14397" },
            { "fk_producto": "14420" },
            { "fk_producto": "14473" },
            { "fk_producto": "14486" },
            { "fk_producto": "14489" },
            { "fk_producto": "14491" },
            { "fk_producto": "14495" },
            { "fk_producto": "14501" },
            { "fk_producto": "14504" },
            { "fk_producto": "14505" },
            { "fk_producto": "14515" },
            { "fk_producto": "14525" },
            { "fk_producto": "14536" },
            { "fk_producto": "14545" },
            { "fk_producto": "14554" },
            { "fk_producto": "14559" },
            { "fk_producto": "14567" },
            { "fk_producto": "14570" },
            { "fk_producto": "14586" },
            { "fk_producto": "14589" },
            { "fk_producto": "14600" },
            { "fk_producto": "14601" },
            { "fk_producto": "14621" },
            { "fk_producto": "14624" },
            { "fk_producto": "14626" },
            { "fk_producto": "14628" },
            { "fk_producto": "14637" },
            { "fk_producto": "14647" },
            { "fk_producto": "14648" },
            { "fk_producto": "14649" },
            { "fk_producto": "14654" },
            { "fk_producto": "14661" },
            { "fk_producto": "14672" },
            { "fk_producto": "14675" },
            { "fk_producto": "14677" },
            { "fk_producto": "14686" },
            { "fk_producto": "14687" },
            { "fk_producto": "14688" },
            { "fk_producto": "14689" },
            { "fk_producto": "14697" },
            { "fk_producto": "14700" },
            { "fk_producto": "14707" },
            { "fk_producto": "14717" },
            { "fk_producto": "14729" },
            { "fk_producto": "14732" },
            { "fk_producto": "14733" },
            { "fk_producto": "14740" },
            { "fk_producto": "14746" },
            { "fk_producto": "14758" },
            { "fk_producto": "14767" },
            { "fk_producto": "14773" },
            { "fk_producto": "14779" },
            { "fk_producto": "14794" },
            { "fk_producto": "14795" },
            { "fk_producto": "14803" },
            { "fk_producto": "14808" },
            { "fk_producto": "14810" },
            { "fk_producto": "14820" },
            { "fk_producto": "14821" },
            { "fk_producto": "14824" },
            { "fk_producto": "14830" },
            { "fk_producto": "14835" },
            { "fk_producto": "14839" },
            { "fk_producto": "14844" },
            { "fk_producto": "14850" },
            { "fk_producto": "14856" },
            { "fk_producto": "14857" },
            { "fk_producto": "14860" },
            { "fk_producto": "14871" },
            { "fk_producto": "14875" },
            { "fk_producto": "14889" },
            { "fk_producto": "14896" },
            { "fk_producto": "14897" },
            { "fk_producto": "14898" },
            { "fk_producto": "14900" },
            { "fk_producto": "14903" },
            { "fk_producto": "14911" },
            { "fk_producto": "14915" },
            { "fk_producto": "14924" },
            { "fk_producto": "14925" },
            { "fk_producto": "14926" },
            { "fk_producto": "14929" },
            { "fk_producto": "14931" },
            { "fk_producto": "14938" },
            { "fk_producto": "14940" },
            { "fk_producto": "14947" },
            { "fk_producto": "14948" },
            { "fk_producto": "14963" },
            { "fk_producto": "14966" },
            { "fk_producto": "14969" },
            { "fk_producto": "14971" },
            { "fk_producto": "14973" },
            { "fk_producto": "14974" },
            { "fk_producto": "14979" },
            { "fk_producto": "14993" },
            { "fk_producto": "14996" },
            { "fk_producto": "15003" },
            { "fk_producto": "15026" },
            { "fk_producto": "15027" },
            { "fk_producto": "15030" },
            { "fk_producto": "15031" },
            { "fk_producto": "15032" },
            { "fk_producto": "15045" },
            { "fk_producto": "15046" },
            { "fk_producto": "15047" },
            { "fk_producto": "15048" },
            { "fk_producto": "15049" },
            { "fk_producto": "15050" },
            { "fk_producto": "15057" },
            { "fk_producto": "15064" },
            { "fk_producto": "15066" },
            { "fk_producto": "15083" },
            { "fk_producto": "15092" },
            { "fk_producto": "15093" },
            { "fk_producto": "15094" },
            { "fk_producto": "15095" },
            { "fk_producto": "15106" },
            { "fk_producto": "15109" },
            { "fk_producto": "15114" },
            { "fk_producto": "15115" },
            { "fk_producto": "15120" },
            { "fk_producto": "15137" },
            { "fk_producto": "15147" },
            { "fk_producto": "15149" },
            { "fk_producto": "15152" },
            { "fk_producto": "15173" },
            { "fk_producto": "15186" },
            { "fk_producto": "15187" },
            { "fk_producto": "15203" },
            { "fk_producto": "15240" },
            { "fk_producto": "15241" },
            { "fk_producto": "15242" },
            { "fk_producto": "15243" },
            { "fk_producto": "15263" },
            { "fk_producto": "15266" },
            { "fk_producto": "15268" },
            { "fk_producto": "15275" },
            { "fk_producto": "15276" },
            { "fk_producto": "15293" },
            { "fk_producto": "15296" },
            { "fk_producto": "15298" },
            { "fk_producto": "15305" },
            { "fk_producto": "15306" },
            { "fk_producto": "15317" },
            { "fk_producto": "15318" },
            { "fk_producto": "15320" },
            { "fk_producto": "15339" },
            { "fk_producto": "15340" },
            { "fk_producto": "15342" },
            { "fk_producto": "15353" },
            { "fk_producto": "15356" },
            { "fk_producto": "15357" },
            { "fk_producto": "15358" },
            { "fk_producto": "15359" },
            { "fk_producto": "15360" },
            { "fk_producto": "15361" },
            { "fk_producto": "15363" },
            { "fk_producto": "15364" },
            { "fk_producto": "15366" },
            { "fk_producto": "15367" },
            { "fk_producto": "15368" },
            { "fk_producto": "15369" },
            { "fk_producto": "15370" },
            { "fk_producto": "15371" },
            { "fk_producto": "15372" },
            { "fk_producto": "15373" },
            { "fk_producto": "15376" },
            { "fk_producto": "15377" },
            { "fk_producto": "15381" },
            { "fk_producto": "15382" },
            { "fk_producto": "15383" },
            { "fk_producto": "15387" },
            { "fk_producto": "15393" },
            { "fk_producto": "15394" },
            { "fk_producto": "15412" },
            { "fk_producto": "15453" },
            { "fk_producto": "15629" },
            { "fk_producto": "15669" },
            { "fk_producto": "15725" },
            { "fk_producto": "15796" },
            { "fk_producto": "15798" },
            { "fk_producto": "15860" },
            { "fk_producto": "15906" },
            { "fk_producto": "15959" },
            { "fk_producto": "15993" },
            { "fk_producto": "16004" },
            { "fk_producto": "16022" },
            { "fk_producto": "16041" },
            { "fk_producto": "16057" },
            { "fk_producto": "16061" },
            { "fk_producto": "16231" },
            { "fk_producto": "16239" },
            { "fk_producto": "16309" },
            { "fk_producto": "16345" },
            { "fk_producto": "16347" },
            { "fk_producto": "16367" },
            { "fk_producto": "16387" },
            { "fk_producto": "16485" },
            { "fk_producto": "16502" },
            { "fk_producto": "16525" },
            { "fk_producto": "16526" },
            { "fk_producto": "16566" },
            { "fk_producto": "16706" },
            { "fk_producto": "16707" },
            { "fk_producto": "16762" },
            { "fk_producto": "16870" },
            { "fk_producto": "16897" },
            { "fk_producto": "16904" },
            { "fk_producto": "16932" },
            { "fk_producto": "16933" },
            { "fk_producto": "16953" },
            { "fk_producto": "17000" },
            { "fk_producto": "17001" },
            { "fk_producto": "17147" }
        ];

        let contador = 0;

        for (let i = 0; i < material.length; i++) {
            // const sqlSentence1 = "DELETE FROM ?? WHERE ??=?";
            // const sqlPreparing1 = ['producto_almacen', 'fk_producto', material[i].fk_producto];
            // const sql1 = await db.format(sqlSentence1, sqlPreparing1);
            // const response1 = await db.query(sql1);

            const sqlSentence2 = "DELETE FROM ?? WHERE ??=?";
            const sqlPreparing2 = ['producto', 'idProducto', material[i].fk_producto];
            const sql2 = await db.format(sqlSentence2, sqlPreparing2);
            const response2 = await db.query(sql2);

            contador++;
        }
        console.log(contador)
    }
}

module.exports = Almacen