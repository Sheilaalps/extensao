const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// 🧠 banco temporário
let agendamentos = [];

// ✅ SALVAR
app.post('/disparar', (req, res) => {
    const { mensagem, contato, horario } = req.body;

    console.log("📩 BODY RECEBIDO:", req.body);

    if (!mensagem || !contato || !horario) {
        return res.status(400).json({ erro: "Dados inválidos" });
    }

    const novo = {
        id: Date.now(),
        mensagem,
        contato,
        horario,
        status: "pendente"
    };

    agendamentos.push(novo);

    console.log("📦 SALVO:", novo);

    res.status(200).json({
        status: "Agendamento realizado com sucesso!",
        item: novo
    });
});

// ✅ HISTÓRICO
app.get('/historico', (req, res) => {
    res.json(agendamentos);
});

// ✅ EDITAR
app.put('/editar/:id', (req, res) => {
    const { id } = req.params;
    const { mensagem, horario } = req.body;

    const item = agendamentos.find(a => a.id == id);

    if (!item) {
        return res.status(404).json({ erro: "Não encontrado" });
    }

    if (mensagem) item.mensagem = mensagem;
    if (horario) item.horario = horario;

    res.json({ status: "Atualizado", item });
});

// ✅ DELETAR
app.delete('/deletar/:id', (req, res) => {
    agendamentos = agendamentos.filter(a => a.id != req.params.id);
    res.json({ status: "Removido" });
});

// ✅ LIMPAR TUDO
app.delete('/limpar', (req, res) => {
    agendamentos = [];
    res.json({ status: "Tudo apagado" });
});

// TESTE
app.get('/', (req, res) => {
    res.send("API ONLINE 🚀");
});

// PORTA
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});