// db.js
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql.infocimol.com.br',
  user: process.env.DB_USER || 'infocimol25',
  password: process.env.DB_PASSWORD || 'pecTCC2024',
  database: process.env.DB_NAME || 'infocimol25',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificando a conexão
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Erro na conexão com o banco de dados:', err.message);
  } else {
    connection.release();
    console.log('Conexão com o banco de dados bem-sucedida!');
  }
});

// Exportando o pool com promessas
module.exports = pool.promise();
