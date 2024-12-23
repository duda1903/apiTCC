const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');  // Importe o pacote cors
const routes = require('./routes');

const app = express();
const port = 3000;

// Permitir requisições de qualquer origem (qualquer IP)
app.use(cors());  

app.use(bodyParser.json());
app.use('/api', routes);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

app.use('/uploads', express.static(__dirname + '/uploads'));