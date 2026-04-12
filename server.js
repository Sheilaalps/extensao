const express = require('express');
const cors = require('cors');

// ⚠️ se der erro de fetch, roda: npm install node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();

app.use(cors());
app.use(express.json());

// 🧠 banco temporário
let agendamentos = [];

// 🔥 CONFIG Z-API (COLOCA OS SEUS DADOS)
const ZAPI_URL = "https://api.z-api.io/instances/3F184AB1F43732F275DF9E648AE68DF9/token/0A6FC94D3A3FDF87B65EE45E/send-text";

// 📲 FUNÇÃO DE ENVIO REAL
async function enviarMensagem(contato, mensagem) {
    try {
        console.log(`📨 ENVIANDO → ${contato}: ${mensagem}`);

        const res = await fetch(ZAPI_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                phone: contato,
                message: mensagem
            })
        });

        const data = await res.json();

        console.log("📦 RESPOSTA Z-API:", data);

        if (!res.ok) throw new Error("Erro ao enviar");

        console.log("✅ enviada com sucesso");

    } catch (err) {
        console.error("❌ ERRO AO ENVIAR:", err.message);
    }
}

// ⏰ SCHEDULER (RODA A CADA 5 SEGUNDOS)
setInterval(async () => {
    const agora = Date.now();

    for (const item of agendamentos) {

        if (item.status !== "pendente") continue;

        const horario = new Date(item.horario).getTime();

        if (horario <= agora) {
            console.log("⏰ HORA DE ENVIAR:", item);

            await enviarMensagem(item.contato, item.mensagem);

            item.status = "enviado";

            console.log("🚀 DISPARADO:", item);
        }
    }
}, 5000);

// ✅ SALVAR AGENDAMENTO
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

    res.json({
        status: "Agendado com sucesso",
        item: novo
    });
});

// 📋 HISTÓRICO
app.get('/historico', (req, res) => {
    res.json(agendamentos);
});

// ✏️ EDITAR
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

// 🗑️ DELETAR
app.delete('/deletar/:id', (req, res) => {
    agendamentos = agendamentos.filter(a => a.id != req.params.id);
    res.json({ status: "Removido" });
});

// 🧪 TESTE
app.get('/', (req, res) => {
    res.send("API ONLINE 🚀");
});

// 🚀 PORTA
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});