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


}

module.exports = Almacen