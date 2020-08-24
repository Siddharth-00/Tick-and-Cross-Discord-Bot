const Discord = require("discord.js");
const client = new Discord.Client();

//JSON Loads discord bot key
//JSON has 1 value in it. "key" : "yourkey"
const fs = require("fs");
let config = JSON.parse(fs.readFileSync("./config.json", "utf8"));
let token = config["key"]; 

//Opens up database
const sql = require('sqlite3').verbose();
let db = new sql.Database("./database.db", (err) => {
  if (err) {
    return console.error(err.message);
  }
  console.log('Connected to the database file');
});

db.run('CREATE TABLE IF NOT EXISTS messages(messageID text, postID text, guildName text, score integer)')


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.user.setActivity('developed by @DarthJarJar');
});

function queryMessage(message, name, count, postID) {
    if(count > 0) {
        db.run(`REPLACE INTO messages (messageID, postID, guildName, score) VALUES ("${message.id}","${postID}","${name}", "${count}")`);
    }
    else {
        db.run(`DELETE FROM messages WHERE messageID ="${message.id}"`)
    }
}

client.on('messageReactionAdd', reaction => {
    if (reaction.emoji.name == '❌') {
        const guild = GuildName(reaction.message.guild.name);
        const message = reaction.message;
        var postID = writePost(reaction, reaction.count);
        queryMessage(message, guild, reaction.count, postID);
        
    }
}); 

client.on('messageReactionRemove', reaction => {
    if (reaction.emoji.name == '❌') {
        const guild = GuildName(reaction.message.guild.name);
        const message = reaction.message;
        var postID = writePost(reaction, reaction.count);
        queryMessage(message, guild, reaction.count, postID);
    }
});

client.on('message', msg => {
    if (msg.author.bot) return; // Ignore bots.
    if (msg.channel.type === "dm") return; // Ignore DM channels.
    if(msg.content == 'ping') {
    	msg.channel.send('pong');
    }
});

function getDate() {
	var today = new Date();
	var dd = String(today.getDate()).padStart(2, '0');
	var mm = String(today.getMonth() + 1).padStart(2, '0'); 
	var yyyy = today.getFullYear();
	today = mm + '/' + dd + '/' + yyyy;
	return today;
}

function GuildName(guild) {
    return "Guild" + guild.replace(/[^a-zA-Z ]/g, "");
}

function writePost(reaction, count) {
    var postID = '';
    const starboard = reaction.message.guild.channels.find('name', 'hall-of-fame');
    var url = 'https://discord.com/channels/' + reaction.message.guild.id + '/' + reaction.message.channel.id + '/' + reaction.message.id;
    var embed = new Discord.RichEmbed()
        .setAuthor(reaction.message.member.user.username, reaction.message.author.avatarURL)
        .setDescription(reaction.message.content)
        .setFooter(reaction.message.id + '•' + getDate())
        .setColor('#FF0000')
    embed.addField("Source", "[Jump!](" + url + ")")
    var param = `SELECT postID FROM messages WHERE messageID="${reaction.message.id}"`
    db.get(param, [], (err, row) => {
      if (err) {
        return console.error(err.message);
      }
      if(!row) {
        starboard.send(reaction.emoji + " **" + count + "**" + " <#" + reaction.message.channel.id + ">", {embed}).then(post => postID = post.id);
      }
      else if(row) {
        postID = row.postID;
        if(count <= 0) {
            starboard.fetchMessages({around: row.postID, limit: 1}).then(msg => msg.first().delete()).catch(error => console.error("Error with message path"));
        }
        else {
        starboard.fetchMessages({around: row.postID, limit: 1}).then(msg => msg.first().edit(reaction.emoji + " **" + count + "**" + " <#" + reaction.message.channel.id + ">", {embed})).catch(error => console.error("Error with message path"));
        }
      }
    });
    return postID;
    
}



client.login(token);