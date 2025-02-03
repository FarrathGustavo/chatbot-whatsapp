const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

// Cria o cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

// Estado do chat para cada usuário
const userStates = {};

// Mensagem inicial
const welcomeMessage = `Bem-vindo(a) ao Consultório da Doutora Ana Paula Alencar! 😊
Como posso te ajudar hoje? Escolha uma opção abaixo e digite o número correspondente:

1️⃣ Agendar consulta
2️⃣ Particular ou Convênio?
3️⃣ Informações sobre tratamentos
4️⃣ Horários de funcionamento
5️⃣ Desmarcar ou remarcar consulta`;

// Gerar QR Code
client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
    console.log('QR Code gerado! Escaneie com seu WhatsApp.');
});

// Quando o cliente estiver pronto
client.on('ready', () => {
    console.log('Cliente WhatsApp conectado!');
});

// Manipulador de mensagens
client.on('message', async msg => {
    const chat = await msg.getChat();
    const userPhone = msg.from;
    const messageText = msg.body;

    // Inicializa estado do usuário se não existir
    if (!userStates[userPhone]) {
        userStates[userPhone] = {};
        await chat.sendMessage(welcomeMessage);
        return;
    }

    // Processa opções do menu
    switch(messageText) {
        case '1':
            if (!userStates[userPhone].dadosAgendamento) {
                await chat.sendMessage(`📅 Por favor, informe os seguintes dados:
* Nome completo
* Preferência por manhã ou tarde
* Tipo de atendimento (exemplo: avaliação, limpeza, clareamento doméstico, aparelhos ortodônticos)`);
                userStates[userPhone].dadosAgendamento = true;
            } else {
                await chat.sendMessage("Obrigado pelas informações! Entraremos em contato rapidamente para resolver sua solicitação.");
                userStates[userPhone] = {};
            }
            break;

        case '2':
            await chat.sendMessage("Você é cliente particular ou convênio?");
            userStates[userPhone].tipoCliente = true;
            break;

        case '3':
            await chat.sendMessage(`🦷 Oferecemos os seguintes procedimentos:
* Limpeza dentária
* Clareamento doméstico e de consultório
* Aparelhos ortodônticos e Invisalign
* Estética, harmonização facial, implante, próteses, facetas e lentes de contato`);
            break;

        case '4':
            await chat.sendMessage(`🕒 Nosso consultório está aberto nos seguintes dias e horários:
* ⏰ Terça a Quinta: 8h às 18h`);
            break;

        case '5':
            if (!userStates[userPhone].dadosRemarcacao) {
                await chat.sendMessage(`Por favor, informe os seguintes dados:
* Nome completo
* Data inicial e horário da consulta agendada`);
                userStates[userPhone].dadosRemarcacao = true;
            } else {
                await chat.sendMessage("Obrigado pelas informações! Entraremos em contato rapidamente para resolver sua solicitação.");
                userStates[userPhone] = {};
            }
            break;

        default:
            handleDefaultMessages(chat, messageText, userPhone);
            break;
    }
});

async function handleDefaultMessages(chat, messageText, userPhone) {
    const msg = messageText.toLowerCase();
    
    if (userStates[userPhone].tipoCliente) {
        if (msg.includes('particular')) {
            await chat.sendMessage("No consultório realizamos as seguintes atividades: limpeza, clareamento doméstico, aparelhos ortodônticos, estética, harmonização facial, implante, próteses, facetas e lentes de contato. Posso te ajudar?");
            userStates[userPhone].aguardandoServico = true;
        } else if (msg.includes('convenio') || msg.includes('convênio')) {
            await chat.sendMessage("Atendemos apenas os seguintes convênios: Amil, Porto Seguro, Unna, Bradesco, Odontoprev. Posso te ajudar?");
            userStates[userPhone].aguardandoConvenio = true;
        }
    } else if (userStates[userPhone].aguardandoServico || userStates[userPhone].aguardandoConvenio || userStates[userPhone].dadosAgendamento || userStates[userPhone].dadosRemarcacao) {
        await chat.sendMessage("Obrigado pelas informações! Entraremos em contato rapidamente para resolver sua solicitação.");
        userStates[userPhone] = {};
    } else {
        await chat.sendMessage("Desculpe, não entendi. Por favor, digite um número de 1 a 5 para escolher uma opção.");
    }
}

// Inicializa o cliente
client.initialize();