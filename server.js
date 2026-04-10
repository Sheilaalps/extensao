const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const cors = require('cors');
const qrcode = require('qrcode-terminal');

const app = express();
app.use(express.json());
app.use(cors());

// Rota de teste para ver no navegador se o servidor está vivo
app.get('/', (req, res) => {
    res.send("Servidor do WhatsApp está Online e Rodando!");
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--no-zygote'
        ],
    }
});

client.on('qr', (qr) => {
    console.log('--- NOVO QR CODE GERADO ---');
    qrcode.generate(qr, {small: true});
    console.log('Acesse este link para ver o QR Code se o terminal bugar:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
});

client.on('ready', () => {
    console.log('✅ Bot logado com sucesso!');
});

client.initialize();

app.post('/disparar', async (req, res) => {
    const { mensagem, contato, horario } = req.body;

    if (!mensagem || !contato || !horario) {
        return res.status(400).json({ status: 'erro', mensagem: 'Faltam dados!' });
    }

    console.log(`📅 Recebido: ${contato} para às ${horario}`);

    const tempoAteEnviar = new Date(horario) - new Date();

    // Se o horário for muito curto ou já passou, enviamos um aviso
    if (tempoAteEnviar < -60000) { // tolerância de 1 minuto
        return res.status(400).json({ status: 'erro', mensagem: 'O horário já passou!' });
    }

    // Agenda o envio
    setTimeout(async () => {
        try {
            const chats = await client.getChats();
            const chat = chats.find(c => c.name === contato || c.id._serialized.includes(contato));
            
            if (chat) {
                await client.sendMessage(chat.id._serialized, mensagem);
                console.log(`🚀 Mensagem enviada para ${contato}`);
            } else {
                console.error(`❌ Chat não encontrado: ${contato}`);
            }
        } catch (err) {
            console.error(`❌ Erro no envio:`, err);
        }
    }, Math.max(tempoAteEnviar, 0));

    // RESPOSTA PARA A EXTENSÃO (Obrigatório para sumir o erro)
    res.status(200).json({ 
        status: 'sucesso', 
        mensagem: 'Agendado na nuvem!',
        detalhes: { contato, horario }
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌍 Servidor rodando na porta ${PORT}`);
});