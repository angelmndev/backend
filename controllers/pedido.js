const Pedido = require('../models/Pedido');
const Usuario = require('../models/Usuario')
const nodemailer = require('nodemailer');


const getPedidos = async (req, res) => {
    const pedidos = await Pedido.getPedidos();
    res.status(200).json(pedidos);

}


const getDetalles = async (req, res) => {
    const { idPedido } = req.params;

    const detalles = await Pedido.getDetalles(idPedido);
    res.status(200).json(detalles);
}

const getDetallesPedido = async (req, res) => {
    const { idPedido } = req.params;

    const detalles = await Pedido.getDetallesId(idPedido);
    res.status(200).json(detalles);
}

const updateDetallePedidoId = async (req, res) => {

    const { idPedido } = req.params
    const { cantidadPedido } = req.body

    const detalles = await Pedido.updateDetallePedidoId(idPedido, cantidadPedido);
    res.status(200).json(detalles);
}

const deleteDetallePedidoId = async (req, res) => {
    const { idPedido } = req.params

    const detalles = await Pedido.deleteDetallePedidoId(idPedido);
    res.status(200).json(detalles);
}

const aprobarPedidoId = async (req, res) => {
    const { idPedido } = req.params
    const { idCeco } = req.body
    const response = await Pedido.aprobarPedidoId(idPedido, idCeco)
    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'pedido aprobado con exito!' })

    } else if (response) {
        res.status(403).json({ success: false, message: 'Error al aprobar pedido!', error: response.sqlMessage })
    }

}

const rechazarPedidoId = async (req, res) => {
    const { idPedido } = req.params
    const response = await Pedido.rechazarPedidoId(idPedido)
    if (response.affectedRows) {
        res.status(200).json({ success: true, message: 'pedido aprobado con exito!' })

    } else if (response) {
        res.status(403).json({ success: false, message: 'Error al aprobar pedido!', error: response.sqlMessage })
    }
}

const obtenerProductosPorCecos = async (req, res) => {
    const { idCeco } = req.params
    const response = await Pedido.obtenerProductoPorCeco(idCeco)

    if (response) {
        res.status(200).json({ success: true, productos: response, message: 'productos con cecos listados!' })

    } else if (response) {
        res.status(403).json({ success: false, message: 'error al listar productos con ceco!', error: response.sqlMessage })
    }
}

const obtenerProductoPorCantidad = async (req, res) => {
    const { idProducto } = req.params
    const response = await Pedido.obtenerProductoPorCantidad(idProducto)

    if (response) {
        res.status(200).json({ success: true, producto: response, message: 'cantidad de producto mostrada!' })

    } else if (response) {
        res.status(403).json({ success: false, message: 'error cantidad de producto mostrada!', error: response.sqlMessage })
    }
}

const buscarProductoPorCodigo = async (req, res) => {
    const { producto } = req.params;
    const httpResponse = await Pedido.buscarProductoPorCodigo(producto)

    if (httpResponse.success) {
        res.status(200).json({ success: true, producto: httpResponse.response, message: 'producto encontrado!' })

    } else {
        res.status(403).json({ success: false, producto: 'vacio', message: 'error producto no encontrado!' })
    }
}

const crearPedidoApi = async (req, res) => {

    try {

        const httpResponse = await Pedido.crearPedidoApi(req.body)


        if (httpResponse.affectedRows === 1) {
            const { nombrePersonalUsuario, apellidoPersonalUsuario } = await Usuario.getUser(httpResponse.idUsuario)

            let templateCorreo = `<!doctype html><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><title>Discount Light</title><!--[if !mso]><!-- --><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]--><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style type="text/css">#outlook a { padding:0; }
            //     body { margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%; }
            //     table, td { border-collapse:collapse;mso-table-lspace:0pt;mso-table-rspace:0pt; }
            //     img { border:0;height:auto;line-height:100%; outline:none;text-decoration:none;-ms-interpolation-mode:bicubic; }
            //     p { display:block;margin:13px 0; }</style><!--[if mso]>
            //   <xml>
            //   <o:OfficeDocumentSettings>
            //     <o:AllowPNG/>
            //     <o:PixelsPerInch>96</o:PixelsPerInch>
            //   </o:OfficeDocumentSettings>
            //   </xml>
            //   <![endif]--><!--[if lte mso 11]>
            //   <style type="text/css">
            //     .mj-outlook-group-fix { width:100% !important; }
            //   </style>
            //   <![endif]--><style type="text/css">@media only screen and (min-width:480px) {
            //   .mj-column-per-100 { width:100% !important; max-width: 100%; }
            // }</style><style type="text/css">@media only screen and (max-width:480px) {
            // table.mj-full-width-mobile { width: 100% !important; }
            // td.mj-full-width-mobile { width: auto !important; }
            // }</style></head><body style="background-color:#E7E7E7;"><div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Pre-header Text</div><div style="background-color:#E7E7E7;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#412161;background-color:#412161;width:100%;"><tbody><tr><td><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;padding-bottom:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tr><td align="center" style="font-size:0px;padding:10px 25px;padding-bottom:30px;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;"><tbody><tr><td style="width:150px;"><img alt height="auto" src="https://www.beta.com.pe/imagenes/logo/6-beta-complejo-agroindustrial.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="150"></td></tr></tbody></table></td></tr></table></div><!--[if mso | IE]></td><td class="" style="" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="background:#ffffff;background-color:#ffffff;margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;background-color:#ffffff;width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="background:#ffffff;background-color:#ffffff;margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;background-color:#ffffff;width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tr><td align="center" style="font-size:0px;padding:0;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse;border-spacing:0px;"><tbody><tr><td style="width:300px;"><a href="https://google.com" target="_blank"><img alt height="auto" src="https://res.cloudinary.com/dbgne2jju/image/upload/v1603840917/Beta/logistics_xdxu4h.png" style="border:0;display:block;outline:none;text-decoration:none;height:auto;width:100%;font-size:13px;" width="300"></a></td></tr></tbody></table></td></tr></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;padding-bottom:0;padding-top:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="background:#ffffff;background-color:#ffffff;margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;background-color:#ffffff;width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;padding-left:15px;padding-right:15px;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:570px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="vertical-align:top;" width="100%"><tr><td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;"><div style="font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:20px;font-weight:bold;line-height:24px;text-align:left;color:#212b35;">Requerimiento de materiales</div></td></tr><tr><td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;"><div style="font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:16px;font-weight:bold;line-height:24px;text-align:left;color:#637381;">De: ${nombrePersonalUsuario} ${apellidoPersonalUsuario}</div></td></tr><tr><td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;"><div style="font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:16px;font-weight:400;line-height:24px;text-align:left;color:#637381;">Hola Rubén,</div></td></tr><tr><td align="left" style="font-size:0px;padding:10px 25px;word-break:break-word;"><div style="font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:16px;font-weight:400;line-height:24px;text-align:left;color:#637381;">Tienes una nueva solicitud de pedidos de materiales, revisa la sección de pedidos en la plataforma de logística.</div></td></tr><tr><td align="center" vertical-align="middle" style="font-size:0px;padding:10px 25px;word-break:break-word;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:separate;width:300px;line-height:100%;"><tr><td align="center" bgcolor="#7955a1" role="presentation" style="border:none;border-radius:3px;cursor:auto;mso-padding-alt:10px 25px;background:#7955a1;" valign="middle"><a href="http://logistica.devs-space.com/login" style="display:inline-block;width:250px;background:#7955a1;color:#ffffff;font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:17px;font-weight:bold;line-height:120%;margin:0;text-decoration:none;text-transform:none;padding:10px 25px;mso-padding-alt:0px;border-radius:3px;" target="_blank">Ingresar a la plataforma</a></td></tr></table></td></tr></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="background:#ffffff;background-color:#ffffff;margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;background-color:#ffffff;width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;padding-left:15px;padding-right:15px;padding-top:0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td><!--[if mso | IE]><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" width="600px" ><table align="center" border="0" cellpadding="0" cellspacing="0" class="" style="width:600px;" width="600" ><tr><td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;"><![endif]--><div style="margin:0px auto;max-width:600px;"><table align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;"><tbody><tr><td style="direction:ltr;font-size:0px;padding:20px 0;text-align:center;"><!--[if mso | IE]><table role="presentation" border="0" cellpadding="0" cellspacing="0"><tr><td class="" style="vertical-align:top;width:600px;" ><![endif]--><div class="mj-column-per-100 mj-outlook-group-fix" style="font-size:0px;text-align:left;direction:ltr;display:inline-block;vertical-align:top;width:100%;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tbody><tr><td style="vertical-align:top;padding:0;"><table border="0" cellpadding="0" cellspacing="0" role="presentation" width="100%"><tr><td align="center" style="font-size:0px;padding:10px 25px;word-break:break-word;"><div style="font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;font-size:11px;font-weight:400;line-height:16px;text-align:center;color:#445566;">&copy; DevSpace, All Rights Reserved.</div></td></tr></table></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table></td></tr></table><![endif]--></td></tr></tbody></table></div><!--[if mso | IE]></td></tr></table><![endif]--></td></tr></tbody></table></div></body></html>`



            let transporter = await nodemailer.createTransport({
                host: "mail.devs-space.com",
                port: 465,
                secure: true, // true for 465, false for other ports
                auth: {
                    user: process.env.MAIL_HOST_USER, // generated ethereal user
                    pass: process.env.MAIL_HOST_PASS, // generated ethereal password
                },
            });

            const info = await transporter.sendMail({
                from: `'Plataforma logistica' <${process.env.MAIL_HOST_USER}>`,
                to: process.env.MAIL_DESTINATARIO,
                subject: `Pedido de requerimientos ${nombrePersonalUsuario} ${apellidoPersonalUsuario}`,
                html: templateCorreo
            })


            res.status(200).json({ success: true, message: 'producto enviado!' })

        } else {
            res.status(403).json({ success: false, message: 'producto no enviado!' })
        }


    } catch (error) {
        console.log(error);
    }


}



const exportarExcel = async (req, res) => {
    const { id } = req.params;
    const httpResponse = await Pedido.exportarPedido(id)
    res.status(200).json({ pedidos: httpResponse })

}


const getListPedidosUsuarioApi = async (req, res) => {
    const { idUsuario } = req.params;
    const httpResponse = await Pedido.getListPedidosUsuarioApi(idUsuario)
    res.status(200).json({ pedidos: httpResponse })
}

module.exports = {
    getPedidos,
    getDetalles,
    getDetallesPedido,
    updateDetallePedidoId,
    deleteDetallePedidoId,
    aprobarPedidoId,
    rechazarPedidoId,
    obtenerProductosPorCecos,
    obtenerProductoPorCantidad,
    buscarProductoPorCodigo,
    crearPedidoApi,
    exportarExcel,
    getListPedidosUsuarioApi

}