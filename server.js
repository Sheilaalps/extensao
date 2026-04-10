const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// ROTA USADA PELA SUA EXTENSÃO
app.post('/disparar', (req, res) => {
    const { mensagem, contato, horario } = req.body;

    console.log("📩 BODY RECEBIDO:", req.body);

    if (!mensagem || !contato || !horario) {
        return res.status(400).json({ erro: "Dados inválidos" });
    }

    console.log("Mensagem:", mensagem);
    console.log("Contato:", contato);
    console.log("Horário:", horario);

    res.status(200).json({ status: "Agendamento realizado com sucesso!" });
});

// ROTA PRA TESTAR SE TA ONLINE
app.get('/', (req, res) => {
    res.send("API ONLINE 🚀");
});

// 🚨 IMPORTANTE PRO RAILWAY
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});