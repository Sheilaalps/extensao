const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');

const app = express();
app.use(cors());
app.use(express.json());

let agendamentos = [];
let sock;

// 🔌 CONECTAR WHATSAPP
async function conectarWhatsApp() {
    try {
        const { state, saveCreds } = await useMultiFileAuthState('./auth');

        sock = makeWASocket({
            auth: state
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', ({ connection, qr }) => {

            if (qr) {
                console.log("📲 ESCANEIA O QR NO WHATSAPP");
            }

            if (connection === 'open') {
                console.log("✅ WHATSAPP CONECTADO!");
            }

            if (connection === 'close') {
                console.log("❌ WhatsApp desconectado, tentando reconectar...");
                setTimeout(conectarWhatsApp, 5000);
            }
        });

    } catch (err) {
        console.error("❌ erro ao conectar WhatsApp:", err);
    }
}

// inicia WhatsApp
conectarWhatsApp();

// 📤 ENVIAR MENSAGEM
async function enviarMensagem(contato, mensagem) {
    try {
        if (!sock) {
            console.log("❌ WhatsApp não conectado ainda");
            return;
        }

        const numero = contato + "@s.whatsapp.net";

        await sock.sendMessage(numero, { text: mensagem });

        console.log("📨 enviada para:", contato);

    } catch (err) {
        console.error("❌ erro ao enviar mensagem:", err);
    }
}

// ⏰ AGENDADOR
setInterval(async () => {
    const agora = Date.now();

    for (const item of agendamentos) {

        if (item.status !== "pendente") continue;

        const horario = new Date(item.horario).getTime();

        if (horario <= agora) {

            console.log("🚀 DISPARANDO:", item);

            await enviarMensagem(item.contato, item.mensagem);

            item.status = "enviado";
        }
    }
}, 5000);

// 📥 SALVAR AGENDAMENTO
app.post('/disparar', (req, res) => {
    const { mensagem, contato, horario } = req.body;

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

    res.json({ status: "Agendado", item: novo });
});

// 📋 HISTÓRICO
app.get('/historico', (req, res) => {
    res.json(agendamentos);
});

// ❌ DELETAR
app.delete('/deletar/:id', (req, res) => {
    agendamentos = agendamentos.filter(a => a.id != req.params.id);
    res.json({ status: "Removido" });
});

// ✏️ EDITAR
app.put('/editar/:id', (req, res) => {
    const item = agendamentos.find(a => a.id == req.params.id);

    if (!item) {
        return res.status(404).json({ erro: "Não encontrado" });
    }

    item.mensagem = req.body.mensagem || item.mensagem;
    item.horario = req.body.horario || item.horario;

    res.json({ status: "Atualizado", item });
});

// 🔥 TESTE
app.get('/', (req, res) => {
    res.send("API ONLINE 🚀");
});

// 🚀 START SERVER (IMPORTANTE PRA RAILWAY)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Servidor rodando na porta " + PORT);
});