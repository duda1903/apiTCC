const express = require('express');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');

const app = express();
const port = 3000;

// Configuração do CORS - permitindo apenas origens específicas
const corsOptions = {
  origin: 'http://localhost:*', // Aqui você pode adicionar o domínio ou lista de domínios que deseja permitir
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Métodos permitidos
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeçalhos permitidos
};

app.use(cors(corsOptions));  // Aplique o CORS em todas as rotas

app.use(bodyParser.json());
app.use('/api', routes);

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

app.use('/uploads', express.static(__dirname + '/uploads'));
