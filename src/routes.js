const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');
const jwtSecret = process.env.JWT_SECRET;
const saltRounds = 10;

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


//cadastro de estagiario
router.post('/estagiario', async (req, res) => {
  const { nome, cidade, habilidades, formacaoAcademica, telefone, email, links, curso, senha } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(senha, saltRounds);

    if (!hashedPassword) {
      throw new Error('Erro ao gerar o hash da senha');
    }

    const result = await db.query(
      'INSERT INTO estagiario (nome, cidade, habilidades, formacaoAcademica, telefone, email, links, curso, senha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nome, cidade, habilidades, formacaoAcademica, telefone, email, links, curso, hashedPassword]
    );

    const userId = result.insertId;
    const token = jwt.sign(
      { id: userId, email },
      jwtSecret,
      { expiresIn: '1h' }
    );
    res.status(201).json({ message: 'Estagiário adicionado com sucesso!', token });
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
    const [rows] = await db.query('SELECT * FROM estagiario WHERE email = ?', [email]);
    if (rows.length > 0) {
      const estagiario = rows[0];
      const match = await bcrypt.compare(senha, estagiario.senha);
      if (match) {
        res.json({ message: 'Login realizado com sucesso!', estagiario });
      }
      else {
        res.status(401).json({ message: 'Dados inválidos' });
      }
    }
    else {
      res.status(401).json({ message: 'Dados inválidos' });
    }
  } 
  catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//cadastro de adm
router.post('/administracao/cadastro', async (req, res) => {
  const { email, nome, cpf, senha } = req.body;
  console.log('Dados recebidos:', req.body);

  try {
    const hashedPassword = await bcrypt.hash(senha, saltRounds);
    if (!hashedPassword) {
      throw new Error('Erro ao gerar o hash da senha');
    }
    await db.query(
      'INSERT INTO administracao (email, nome, cpf, senha) VALUES (?, ?, ?, ?)',
      [email, nome, cpf, hashedPassword]
    );
    console.log('Administrador inserido com sucesso!');
    res.status(201).json({ message: 'Administrador inserido com sucesso!' });
  } 
  catch (err) {
    console.log('Erro ocorreu:', err);
    res.status(500).json({ error: err.message });
  }
});

//login de adm

router.post('/administracao/login', async (req, res) => {
  const { cpf, senha } = req.body;
  try {
    const [rows] = await db.query(
      'SELECT * FROM administracao WHERE cpf = ?',
      [cpf]
    );
    if (rows.length === 0) {
      return res.status(401).json({ error: 'CPF ou senha incorretos' });
    }
    const usuario = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ error: 'CPF ou senha incorretos' });
    }
    const token = jwt.sign(
      { id: usuario.id, cpf: usuario.cpf },
      jwtSecret,
      { expiresIn: '1h' }
    );
    res.status(200).json({ message: 'Login realizado com sucesso!', token });
  } 
  catch (err) {
    console.log('Erro ocorreu:', err);
    res.status(500).json({ error: err.message });
  }
});

//login de empresa
router.post('/empresas/login', async (req, res) => {
  const { cnpj, senha } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM empresas WHERE cnpj = ?', [cnpj]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'CNPJ ou senha incorretos' });
    }
    const empresa = rows[0];
    const senhaCorreta = await bcrypt.compare(senha, empresa.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ message: 'CNPJ ou senha incorretos' });
    }
    const token = jwt.sign(
      { id: empresa.id, cnpj: empresa.cnpj },
      jwtSecret,
      { expiresIn: '1h' }
    );
    res.status(200).json({ message: 'Login realizado com sucesso!', token });
  } 
  catch (err) {
    console.error('Erro ocorreu:', err);
    res.status(500).json({ error: err.message });
  }
});

//cadastro de empresa
router.post('/empresas', async (req, res) => {
  const { nomeEmpresa, emailEmpresa, telEmpresa, cidade, descricao, cnpj, senha } = req.body;
  console.log('Dados recebidos:', req.body);
  try {
    const hashedPassword = await bcrypt.hash(senha, saltRounds);
    console.log('Senha criptografada:', hashedPassword);
    if (!hashedPassword) {
      throw new Error('Erro ao gerar o hash da senha');
    }
    await db.query(
      'INSERT INTO empresas (nomeEmpresa, emailEmpresa, telEmpresa, cidade, descricao, cnpj, senha) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nomeEmpresa, emailEmpresa, telEmpresa, cidade, descricao, cnpj, hashedPassword]
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