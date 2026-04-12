const express = require('express');
const cors = require('cors');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');

const app = express();
app.use(cors());
app.use(express.json());

let agendamentos = [];
let sock;

// 🔌 WHATSAPP (SEGURO)
async function conectarWhatsApp() {
    try {
        console.log("🔄 iniciando WhatsApp...");

        const { state, saveCreds } = await useMultiFileAuthState('./auth');

        sock = makeWASocket({
            auth: state
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update) => {
            const { connection, qr } = update;

            if (qr) {
                console.log("📲 ESCANEIA O QR CODE");
            }

            if (connection === 'open') {
                console.log("✅ WHATSAPP CONECTADO!");
            }

            if (connection === 'close') {
                console.log("⚠️ WhatsApp caiu, reconectando...");
                setTimeout(() => {
                    conectarWhatsApp();
                }, 5000);
            }
        });

    } catch (err) {
        console.error("💥 ERRO WHATSAPP:", err);
    }
}

// 🚀 START SEGURO (EVITA CRASH NO RAILWAY)
setTimeout(() => {
    conectarWhatsApp();
}, 3000);

// 📤 ENVIAR MENSAGEM
async function enviarMensagem(contato, mensagem) {
    try {
        if (!sock) {
            console.log("❌ WhatsApp ainda não conectado");
            return;
        }

        await sock.sendMessage(contato + "@s.whatsapp.net", {
            text: mensagem
        });

        console.log("📨 enviada:", contato);

    } catch (err) {
        console.error("❌ erro envio:", err);
    }
}

// ⏰ AGENDADOR
setInterval(async () => {
    const agora = Date.now();

    for (const item of agendamentos) {

        if (item.status !== "pendente") continue;

        if (new Date(item.horario).getTime() <= agora) {

            console.log("🚀 DISPARANDO:", item);

            await enviarMensagem(item.contato, item.mensagem);

            item.status = "enviado";
        }
    }

}, 5000);

// 📥 AGENDAR MENSAGEM
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

// 🚀 SERVER START (RAILWAY SAFE)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("🚀 Servidor rodando na porta " + PORT);
});