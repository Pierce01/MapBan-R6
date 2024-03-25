const eris = require('eris')
const mapper = require('./map')
const config = require('./config.json')

const bot = new eris(config.token, {
  restMode: true,
  intents: config.intents
})

bot.on('ready', () => {
  console.log(`Connected to ${bot.user.username} - ${bot.user.id}`)
})

bot.on("messageCreate", (msg) => {
  if (msg.author.id == bot.user.id) return
  if (msg.cleanContent.startsWith(`${config.prefix}open`)) {
    const arguments = msg.content.split(" ")
    const roles = msg.content.split('"')
    const mp = new mapper(arguments[1], [roles[1], roles[3], roles[5]], bot, msg.channel.guild.roles, config)
    mp.start(msg.channel.id)
  }
})

bot.connect()