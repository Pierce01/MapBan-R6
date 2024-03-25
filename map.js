module.exports = class Mapper {
  constructor(type, teams, bot, guildRoles, config) {
    this.config = config
    this.type = type
    this.roles = {
      first: teams[0],
      second: teams[1],
      otRole: teams[2]
    }
    this.bot = bot
    this.guildRoles = guildRoles
    this.maps = [...this.config.maps]
    this.ban = []
    this.pick = []
    this.side = []
    this.turnLog = []
    this.turn = 0
    this.first = true
  }

  async start(channelId) {
    this.channelId = channelId
    let tempRoles = {}
    this.guildRoles.map(e => {
      tempRoles[e.name] = e.id
    })
    this.guildRoles = tempRoles

    if (!this.guildRoles[this.roles.first] || !this.guildRoles[this.roles.second]) {
      return await this.bot.createMessage(channelId, "Improper Team Roles.")
    }

    let initMessage = `Hey there folks, map bans are now opened for <@&${this.guildRoles[this.roles.first]}> and <@&${this.guildRoles[this.roles.second]}>\n\n**Anyone can use the \`ban\`, \`pick\`, and \`side\` commands.**`
    if (this.roles.otRole) initMessage += `\nAll OT side picks will be given to <@&${this.guildRoles[this.roles.otRole]}>`
    await this.bot.createMessage(channelId, initMessage)

    for (let letter of this.type.split('')) {
      const command = getCommand(letter)
      if (command === "decide") {
        const selectedMap = getMaps(this.maps)
        delete this.maps[this.maps.indexOf(selectedMap)]
        this.turnLog.push({
          type: 'Decider',
          name: this.roles[Object.keys(this.roles)[this.turn]],
          map: selectedMap
        })
        this.pick.push(selectedMap)
        await this.pickSide(selectedMap, true, false)
        break
      }
      this.bot.createMessage(channelId, this.createTurnMsg(command))
      const selectedMap = await this.waitFor(command)
      delete this.maps[this.maps.indexOf(selectedMap)]
      this[command].push(selectedMap)
      this.turnLog.push({
        type: command.charAt(0).toUpperCase() + command.slice(1),
        name: this.roles[Object.keys(this.roles)[this.turn]],
        map: selectedMap
      })
      await this.bot.createMessage(channelId, `**${this.roles[Object.keys(this.roles)[this.turn]]}** finished their \`${command}\`.`)
      this.updateTurn()
      if (command === "pick") await this.pickSide(selectedMap, false, false)
    }
  
    if (this.listener) {
      this.bot.removeListener('messageCreate', this.listener)
    }

    const header = `Map Bans for **${this.roles[Object.keys(this.roles)[0]]}** vs. **${this.roles[Object.keys(this.roles)[1]]}**`
    let bufferMessage = `${header}\n\n`,
      pinObj
    bufferMessage += this.turnLog.map(obj => `${obj.type} ${obj.map} - [${obj.name.toUpperCase()}]\n`).join('')
    bufferMessage += '\n'
    bufferMessage += this.side.join('\n')

    try {
      await this.bot.createMessage(this.config.log_channel, bufferMessage)
      pinObj = await this.bot.createMessage(channelId, bufferMessage)
    } catch (e) {
      const logMessage = {
        name: "log.txt",
        file: Buffer.from(bufferMessage)
      }
      await this.bot.createMessage(this.config.log_channel, header, logMessage)
      pinObj = await this.bot.createMessage(channelId, header, logMessage)
    }
    await pinMessage(pinObj)
    bufferMessage = ''
  }

  async pickSide(map, isDecider = false, finishedOT) {
    const tense = !finishedOT ? 'starting' : 'over time'
    const roleKeys = Object.keys(this.roles)
    if (isDecider && !this.roles.otRole) {
      this.turn = Math.floor(Math.random() * 2)
      this.bot.createMessage(this.channelId, `\nFlipped a coin and it landed in favor of __**${this.roles[roleKeys[this.turn]]}**__.`)
    }

    const savedTurn = this.turn
    if (this.roles.otRole && finishedOT) {
      this.turn = this.roles.otRole === this.roles.first ? 0 : 1
    }

    this.bot.createMessage(this.channelId, `**${this.roles[roleKeys[this.turn]]}**, please choose **${tense}** side for **${map}**. \`defend\` / \`attack\`` +
      `\n*ex: side attack*`)
    const selectedSide = await this.waitFor('side', ["ATTACK", "DEFEND"])
    const oppositeSide = selectedSide == "ATTACK" ? "DEFEND" : "ATTACK"
    this.side.push(`Map ${this.pick.length}${!finishedOT ? '' : ' (OT)'}: **${map}**. ${this.roles[roleKeys[this.turn]]}: **${selectedSide}**.` +
      ` ${this.roles[roleKeys[this.turn == 1 ? 0 : 1]]}: **${oppositeSide}**` +
      ` ${isDecider ? `(Coin flipped in favor of **${this.roles[roleKeys[this.turn]]}**` : ''}${!finishedOT ? '' : '\n'}`)
    await this.bot.createMessage(this.channelId, `**${this.roles[roleKeys[this.turn]]}** has choosen ${tense} side **${selectedSide}** on **${map}**`)
    this.turn = savedTurn
    if (!finishedOT) {
      this.updateTurn()
      await this.pickSide(map, false, true)
      this.updateTurn()
    }
  }

  waitFor(command, lookforStr) {
    return new Promise(resolve => {
      this.listener = async (msg) => {
        if (!msg.cleanContent.toLowerCase().startsWith(command)) return
        const member = await this.bot.getRESTGuildMember(msg.channel.guild.id, msg.author.id)
        if (!member.roles.includes(this.guildRoles[this.roles[Object.keys(this.roles)[this.turn]]])) {
          return await this.bot.createMessage(msg.channel.id, "Oops! Looks like it's not your turn.")
        }
        const input = msg.cleanContent.split(' ')[1].toUpperCase()
        const errorMessage = lookforStr 
          ? "Oops! Looks like you made a typo or entered an invalid side." 
          : "Oops! Looks like you made a typo or that map no longer exists in the map pool."
        if (!(lookforStr ? lookforStr.includes(input) : this.maps.includes(input))) {
            return await this.bot.createMessage(msg.channel.id, errorMessage)
        }
        this.bot.removeListener('messageCreate', this.listener)
        return resolve(input)
      }
      this.bot.on('messageCreate', this.listener)
    })
  }

  createTurnMsg(command) {
    const role = this.roles[Object.keys(this.roles)[this.turn]]
    const maps = getMaps(this.maps)
    const first = this.first ? ' first!' : '!'
    this.first = false
    return `**${role}**, please **__${command}__**${first}\n\n**Maps**: ${maps}.`
  }

  updateTurn() {
    this.turn = (this.turn + 1) % 2
  }
}

async function pinMessage(pinObj) {
  try {
    await pinObj.pin()
  } catch (e) {
    console.log("No pin perms...")
  }
}

function getCommand(letter) {
  return {
    'b': "ban",
    'p': "pick",
    'd': "decide"
  } [letter.toLowerCase()]
}

function getMaps(maps) {
  return maps.filter(Boolean).join(', ')
}