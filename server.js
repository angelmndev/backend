require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const app = express();
const port = process.env.APP_PORT;

//database
require('./database/db');
//middlewares
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

//routes
const sedes = require('./routes/sedes');
app.use('/sedes', sedes);

const fundos = require('./routes/fundos');
app.use('/fundos', fundos);

const areas = require('./routes/areas');
app.use('/areas', areas);

const fundosAreas = require('./routes/fundosAreas');
app.use('/fundosAreas', fundosAreas);

const roles = require('./routes/rols');
app.use('/roles', roles);

const usuarios = require('./routes/usuarios');
app.use('/usuarios', usuarios)

const productos = require('./routes/productos');
app.use('/productos', productos)



const categoriaProductos = require('./routes/categoriaProductos');
app.use('/categorias', categoriaProductos)


const pedidos = require('./routes/pedidos')
app.use('/pedidos', pedidos)



const cecos = require('./routes/ceco');
app.use('/cecos', cecos)


const inventario = require('./routes/inventario');
app.use('/inventarios', inventario)

const almacen = require('./routes/almacen');
app.use('/almacen', almacen)

//index
const index = require('./routes/index');
const { urlencoded } = require('express');
app.use('/', index)



//server init
app.listen(port, () => {
    console.log(`Aplicación en puerto: ${port}`);
});