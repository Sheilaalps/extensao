const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const cors = require('cors');
const qrcode = require('qrcode-terminal'); // Adicionado para ver o QR no log

const app = express();
app.use(express.json());
app.use(cors());

// AJUSTE 1: Configuração para rodar em servidores (Linux/Nuvem)
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
    }
});

// AJUSTE 2: Exibir QR Code no terminal do Railway
client.on('qr', (qr) => {
    console.log('--- NOVO QR CODE GERADO ---');
    // A opção 'small: true' ajuda muito a não quebrar as linhas
    qrcode.generate(qr, {small: true});
    
    // Esse link abaixo você pode copiar e colar no navegador do seu celular
    // Ele gera uma imagem perfeita do QR Code para você escanear
    console.log('Caso não consiga escanear acima, acesse este link:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
});

client.on('ready', () => {
    console.log('✅ Bot logado com sucesso na nuvem!');
});

client.initialize();

app.post('/disparar', async (req, res) => {
    const { mensagem, contato, horario } = req.body;

    if (!mensagem || !contato || !horario) {
        return res.status(400).json({ status: 'Faltam dados!' });
    }

    console.log(`📅 Agendado para: ${contato} às ${horario}`);

    const tempoAteEnviar = new Date(horario) - new Date();

    if (tempoAteEnviar < 0) {
        return res.status(400).json({ status: 'Horário já passou!' });
    }

    setTimeout(async () => {
        try {
            // Se o contato for um nome, tentamos buscar o ID dele
            let chatId;
            if (contato.match(/^\d+$/)) {
                chatId = `${contato.replace(/\D/g, '')}@c.us`;
            } else {
                // Se for nome, busca nos contatos
                const chats = await client.getChats();
                const chat = chats.find(c => c.name === contato);
                chatId = chat ? chat.id._serialized : null;
            }

            if (chatId) {
                await client.sendMessage(chatId, mensagem);
                console.log(`🚀 Mensagem enviada para ${contato}`);
            } else {
                console.error(`❌ Não achei o chat de: ${contato}`);
            }
        } catch (err) {
            console.error(`❌ Erro no envio:`, err);
        }
    }, tempoAteEnviar);

    res.json({ status: 'Agendado na nuvem!' });
});

// AJUSTE 3: Porta dinâmica (O Railway escolhe a porta, não pode ser fixa 3001)
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌍 Servidor rodando na porta ${PORT}`);
});