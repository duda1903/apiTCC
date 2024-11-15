const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./db');
const jwtSecret = process.env.JWT_SECRET;
const saltRounds = 10;

//lista as vagas
router.get('/vagas', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vagas');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//add vagas
router.post('/vagas', async (req, res) => {
  const { titulo, descricao, requisitos, cidade, dataPublicacao, administracao_idAdm, nomeEmpresa, emailEmpresa, telEmpresa, idEmpresa, modalidade } = req.body;
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

    // Inserir o estagiário no banco de dados
    const [result] = await db.query(
      'INSERT INTO estagiario (nome, cidade, habilidades, formacaoAcademica, telefone, email, links, curso, senha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nome, cidade, habilidades, formacaoAcademica, telefone, email, links, curso, hashedPassword]
    );

    const userId = result.insertId;

    const token = jwt.sign(
      { id: userId, email },
      jwtSecret,
      { expiresIn: '1h' }
    );
    await db.query(
      'UPDATE estagiario SET token = ? WHERE idEstagiario = ?',
      [token, userId]
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
        // Gere o token JWT com uma validade de 1 hora
        const token = jwt.sign({ id: estagiario.idEstagiario }, secretKey, { expiresIn: '1h' });
        res.json({ message: 'Login realizado com sucesso!', token });
      } else {
        res.status(401).json({ message: 'Dados inválidos' });
      }
    } else {
      res.status(401).json({ message: 'Dados inválidos' });
    }
  } 
  catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Rota para buscar os dados do perfil do usuário logado
router.get('/perfil', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({ message: 'Token não fornecido' });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Verificar o token JWT e extrair os dados do usuário
    const decoded = jwt.verify(token, jwtSecret);

    // Buscar o usuário no banco de dados com base no papel (estagiário, admin ou empresa)
    let query = '';
    let params = [];

    if (decoded.cpf) {
      // Usuário é administrador
      query = 'SELECT * FROM administracao WHERE idAdm = ?';
      params = [decoded.id];
    } else if (decoded.cnpj) {
      // Usuário é uma empresa
      query = 'SELECT * FROM empresas WHERE id = ?';
      params = [decoded.id];
    } else {
      // Usuário é um estagiário
      query = 'SELECT * FROM estagiario WHERE idEstagiario = ?';
      params = [decoded.id];
    }

    // Executar a consulta no banco de dados
    const [rows] = await db.query(query, params);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Retornar os dados do perfil do usuário
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao buscar o perfil do usuário', error: err.message });
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

    // Inserir o administrador no banco de dados
    const [result] = await db.query(
      'INSERT INTO administracao (email, nome, cpf, senha) VALUES (?, ?, ?, ?)',
      [email, nome, cpf, hashedPassword]
    );

    const adminId = result.insertId;

    // Gerar o token JWT
    const token = jwt.sign(
      { id: adminId, email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // Atualizar o administrador com o token gerado
    await db.query(
      'UPDATE administracao SET token = ? WHERE idAdm = ?',
      [token, adminId]
    );

    console.log('Administrador inserido com sucesso!');
    res.status(201).json({ message: 'Administrador inserido com sucesso!', token });
  } 
  catch (err) {
    console.log('Erro ocorreu:', err);
    res.status(500).json({ error: err.message });
  }
});

//login de adm

router.post('/administracao/login', async (req, res) => {
  const { cpf, senha } = req.body;
  console.log("CPF recebido:", cpf);
  console.log("Senha recebida:", senha);
  try {
    const [rows] = await db.query(
      'SELECT * FROM administracao WHERE cpf = ?',
      [cpf]
    );console.log("Resultados da busca no banco de dados:", rows);
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

// Cadastro de empresa
router.post('/empresas', async (req, res) => {
  const { nomeEmpresa, emailEmpresa, telEmpresa, cidade, descricao, cnpj, senha } = req.body;
  console.log('Dados recebidos:', req.body);
  try {
    const hashedPassword = await bcrypt.hash(senha, saltRounds);
    console.log('Senha criptografada:', hashedPassword);
    if (!hashedPassword) {
      throw new Error('Erro ao gerar o hash da senha');
    }

    // Inserir a empresa no banco de dados
    const [result] = await db.query(
      'INSERT INTO empresas (nomeEmpresa, emailEmpresa, telEmpresa, cidade, descricao, cnpj, senha) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nomeEmpresa, emailEmpresa, telEmpresa, cidade, descricao, cnpj, hashedPassword]
    );

    const companyId = result.insertId;

    // Gerar o token JWT
    const token = jwt.sign(
      { id: companyId, emailEmpresa },
      jwtSecret,
      { expiresIn: '1h' }
    );

    // Atualizar a empresa com o token gerado
    await db.query(
      'UPDATE empresas SET token = ? WHERE idEmpresa = ?',
      [token, companyId]
    );

    console.log('Empresa inserida com sucesso!');
    res.status(201).json({ message: 'Empresa inserida com sucesso!', token });
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