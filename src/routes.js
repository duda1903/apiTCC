const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('./db');

// listar todas as vagas
router.get('/vagas', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vagas');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// adicionar nova vaga
router.post('/vagas', async (req, res) => {
  const { titulo, descricao, requisitos,cidade, dataPublicacao, administracao_idAdm, nomeEmpresa, emailEmpresa, telEmpresa,  idEmpresa, modalidade } = req.body;
  console.log('Dados recebidos:', req.body);
  try {
    await db.query(
      'INSERT INTO vagas (titulo, descricao, requisitos, cidade, dataPublicacao, administracao_idAdm, nomeEmpresa, emailEmpresa, telEmpresa, idEmpresa, modalidade) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [titulo, descricao, requisitos, cidade, dataPublicacao, administracao_idAdm, nomeEmpresa, emailEmpresa, telEmpresa, idEmpresa, modalidade]
    );
    console.log('Consulta executada com sucesso!');
    res.status(201).json({ message: 'Vaga inserida com sucesso!' });
  } 
  catch (err) {
    console.log('Erro ocorreu:', err);
    res.status(500).json({ error: err.message });
  }
});


//excluir vaga
router.delete('/vagas/:idVaga', async (req, res) => {
  const idVaga = req.params.idVaga;
  try {
    await db.query('DELETE FROM vagas WHERE idVaga = ?', idVaga);
    res.status(200).json({ message: 'Vaga excluída com sucesso!' });
  } 
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//cadastro estagiario
/*router.post('/estagiario', async (req, res) => {
  const { nome, cidade, habilidades, formacaoAcademica, telefone, email, links, curso, senha } = req.body;
  try {
    await db.query(
      'INSERT INTO estagiario (nome, cidade, habilidades, formacaoAcademica, telefone, email, links, curso, senha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nome, cidade, habilidades, formacaoAcademica, telefone, email, links, curso, senha]
    );
    res.status(201).json({ message: 'Estagiário adicionado com sucesso!' });
  } 
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});*/

const saltRounds = 10; // Define o número de rounds de salt

router.post('/estagiario', async (req, res) => {
  const { nome, cidade, habilidades, formacaoAcademica, telefone, email, links, curso, senha } = req.body;

  try {
    // Gera o hash da senha
    const hashedPassword = await bcrypt.hash(senha, saltRounds);

    // Verifica se o hash foi criado antes de prosseguir
    if (!hashedPassword) {
      throw new Error('Erro ao gerar o hash da senha');
    }

    // Executa a query para inserir o estagiário com a senha criptografada
    await db.query(
      'INSERT INTO estagiario (nome, cidade, habilidades, formacaoAcademica, telefone, email, links, curso, senha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nome, cidade, habilidades, formacaoAcademica, telefone, email, links, curso, hashedPassword] // Usa o hashedPassword aqui
    );

    res.status(201).json({ message: 'Estagiário adicionado com sucesso!' });
  } 
  catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//excluir estagiario
router.delete('/estagiarios/:idEstagiario', async (req, res) => {
  const idEstagiario = req.params.idEstagiario;
  try {
    await db.query('DELETE FROM estagiario WHERE idEstagiario = ?', idEstagiario);
    res.status(200).json({ message: 'Estagiário excluído com sucesso!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//listar estagiario por curso
router.get('/estagiario/:idEstagiario', async (req, res) => {
  const curso = req.params.idEstagiario;
  try {
    const [rows] = await db.query('SELECT * FROM estagiario WHERE curso = ?', [curso]);
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: 'Estagiário não encontrado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// listar todos os estagiários
router.get('/estagiarios', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM estagiario');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//login de estagiario
router.post('/estagiario/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM estagiario WHERE email = ? AND senha = ?', [email, senha]);
    if (rows.length > 0) {
      res.json({ message: 'Login realizado com sucesso!', empresa: rows[0] });
    } else {
      res.status(401).json({ message: 'Dados inválidos' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//cadastro de adm
router.post('/administracao/cadastro', async (req, res) => {
  const { email, nome, cpf, senha } = req.body;
  console.log('Dados recebidos:', req.body);
  try {
    await db.query(
      'INSERT INTO administracao (email, nome, cpf, senha) VALUES (?, ?, ?, ?)',
      [email, nome, cpf, senha]
    );
    console.log('Administrador inserido com sucesso!');
    res.status(201).json({ message: 'Administrador inserido com sucesso!' });
  } 
  catch (err) {
    console.log('Erro ocorreu:', err);
    res.status(500).json({ error: err.message });
  }
});

//login de empresa
router.post('/empresas/login', async (req, res) => {
  const {cnpj, senha } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM empresas WHERE cnpj = ? AND senha = ?', [cnpj, senha]);
    if (rows.length > 0) {
      res.json({ message: 'Login realizado com sucesso!', empresa: rows[0] });
    } else {
      res.status(401).json({ message: 'Credenciais inválidas' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//cadastro de empresa
router.post('/empresas', async (req, res) => {
  const { nomeEmpresa, emailEmpresa, telEmpresa, cidade, descricao, cnpj, senha} = req.body;
  console.log('Dados recebidos:', req.body);
  try {
    await db.query(
      'INSERT INTO empresas (nomeEmpresa, emailEmpresa, telEmpresa, cidade, descricao, cnpj, senha) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nomeEmpresa, emailEmpresa, telEmpresa, cidade, descricao, cnpj, senha]
    );
    console.log('Empresa inserida com sucesso!');
    res.status(201).json({ message: 'Empresa inserida com sucesso!' });
  } 
  catch (err) {
    console.log('Erro ocorreu:', err);
    res.status(500).json({ error: err.message });
  }
});

// listar todas as empresas
router.get('/empresas', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM empresas');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;