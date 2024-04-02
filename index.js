require('dotenv').config();

const{Client, IntentsBitField} = require('discord.js');
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

client.on('ready', ()=> {
    console.log('Bot is ready');
})

client.on('messageCreate', async (message) => {
    console.log('Message received:', message.content);
    console.log('Checking condition before sendTyping...');
    if(message.author.bot || message.channel.id !== process.env.CHANNEL_ID || message.content.startsWith("!")){
        console.log('Condition evaluated to true, skipping sendTyping.');
        return;
    } else {
        console.log('Condition evaluated to false, continuing with sendTyping.');
    };
    let conversationLog = [{role: 'system', content: 'I am your assistant'}];

    try{
        console.log('Sending request to OpenAI...');
        await message.channel.sendTyping();
        const prevMessages = await message.channel.messages.fetch({limit: 15});
        prevMessages.reverse().forEach((msg) => {
            
            if(msg.content.startsWith('!') || (msg.author.bot && msg.author.id !== client.user.id)){
                return;
            }
            const role = msg.author.id === client.user.id ? 'assistant' : 'user';
            const name = msg.author.username.replace(/_s+/g,'_').replace(/[^\w\s]/gi, '');

            conversationLog.push({role,content: msg.content, name});
        })
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: conversationLog,
        })
        console.log('Response from OpenAI:', completion);
        if(completion.choices.length > 0 && completion.choices[0].message){
            await message.reply(completion.choices[0].message);
        }
    }catch(error){
        console.error(`Error: ${error.message}`)
    }
}),

client.login(process.env.TOKEN)