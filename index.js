const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const GROUP_ID = 409206944;

// Mapeamento completo baseado na sua hierarquia
const ROLES = {
    AGUPAMENTOS: {
        MILITARES: '1520549164230906035',
        PRACAS: '1521277666295021580',
        MILITARES_GRADUADOS: '1521277442088763452',
        PRACAS_ESPECIAIS: '1521276837659934812',
        OFICIAIS_SUBALTERNOS: '1520549164222513366',
        OFICIAIS_INTERMEDIARIOS: '1521274771172622467',
        OFICIAIS_SUPERIORES: '1520571675152744501',
        OFICIAIS_GERAIS: '1520549164214255756'
    },
    EXCECOES: [
        '1520549164230906031', // ADM-PG
        '1521279268070359040', // Sub-Criador
        '1521279475252334714'  // Desenvolvimento
    ],
    PATENTES_MAP: {
        'Recruta': '1520549164155404345',
        'Soldado': '1520549164155404346',
        'Cabo': '1520549164155404347',
        'Terceiro-Sargento': '1520549164159602909',
        'Segundo-Sargento': '1520549164159602910',
        'Primeiro-Sargento': '1520549164159602911',
        'Subtenente': '1520549164159602915',
        'Cadete': '1520549164205740164',
        'Aspirante a Oficial': '1520549164201541708',
        'Segundo-Tenente': '1520549164201541709',
        'Primeiro-Tenente': '1520549164201541710',
        'Capitão': '1521276326852558939',
        'Major': '1520571765078626496',
        'Tenente-Coronel': '1520571761228386425',
        'Coronel': '1520571757042597951'
    }
};

client.once('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}`);
});

async function getRobloxRank(userId) {
    try {
        const res = await axios.get(`https://groups.roblox.com/v1/users/${userId}/groups/roles`);
        const group = res.data.data.find(g => g.group.id === GROUP_ID);
        return group ? group.role : null;
    } catch {
        return null;
    }
}

// Comando para enviar o painel de verificação (apenas Administradores)
client.on('messageCreate', async msg => {
    if (msg.content === '!painel' && msg.member.permissions.has('Administrator')) {
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('verify_btn').setLabel('Verificar Patente').setStyle(ButtonStyle.Primary)
        );
        const embed = new EmbedBuilder()
            .setTitle('Verificação Militar')
            .setDescription('Clique no botão abaixo para vincular sua conta e receber os seus cargos automaticamente.');
        
        await msg.channel.send({ embeds: [embed], components: [row] });
    }
});

// Manipulador do clique no botão de verificação
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton() || interaction.customId !== 'verify_btn') return;

    await interaction.deferReply({ ephemeral: true });

    // Insira aqui a lógica de integração com o Roblox ID do usuário (ex: BloxLink)
    const robloxUserId = 12345678; 
    const rankData = await getRobloxRank(robloxUserId);

    if (!rankData) {
        return interaction.editReply('Você não está no grupo do Roblox configurado.');
    }

    const rankName = rankData.name;
    const member = interaction.member;

    let rolesToAdd = [ROLES.AGUPAMENTOS.MILITARES];

    if (['Recruta', 'Soldado', 'Cabo'].includes(rankName)) {
        rolesToAdd.push(ROLES.AGUPAMENTOS.PRACAS);
    } else if (['Cadete'].includes(rankName)) {
        rolesToAdd.push(ROLES.AGUPAMENTOS.PRACAS_ESPECIAIS);
    } else if (['Terceiro-Sargento', 'Segundo-Sargento', 'Primeiro-Sargento', 'Subtenente'].includes(rankName)) {
        rolesToAdd.push(ROLES.AGUPAMENTOS.MILITARES_GRADUADOS);
    } else if (['Aspirante a Oficial', 'Segundo-Tenente', 'Primeiro-Tenente'].includes(rankName)) {
        rolesToAdd.push(ROLES.AGUPAMENTOS.OFICIAIS_SUBALTERNOS);
    } else if (['Capitão'].includes(rankName)) {
        rolesToAdd.push(ROLES.AGUPAMENTOS.OFICIAIS_INTERMEDIARIOS);
    } else if (['Major', 'Tenente-Coronel', 'Coronel'].includes(rankName)) {
        rolesToAdd.push(ROLES.AGUPAMENTOS.OFICIAIS_SUPERIORES);
    }

    if (ROLES.PATENTES_MAP[rankName]) {
        rolesToAdd.push(ROLES.PATENTES_MAP[rankName]);
    }

    // Filtra cargos antigos para remoção, preservando as exceções e cargos essenciais
    const rolesToRemove = member.roles.cache.filter(role => 
        !ROLES.EXCECOES.includes(role.id) && 
        role.id !== interaction.guild.id &&
        !rolesToAdd.includes(role.id)
    );

    try {
        await member.roles.remove(rolesToRemove);
        await member.roles.add(rolesToAdd);
        await interaction.editReply(`Conta verificada com sucesso! Patente atualizada: **${rankName}**.`);
    } catch (e) {
        console.error(e);
        await interaction.editReply('Ocorreu um erro ao atualizar os seus cargos.');
    }
});

client.login('SEU_TOKEN');
