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

db.run(`CREATE TABLE IF NOT EXISTS messages(messageID text primary key, postID text, guildName text, score integer)`)
db.run(`CREATE TABLE IF NOT EXISTS tickLeaderboard(userID text primary key, given integer, received integer)`)
db.run(`CREATE TABLE IF NOT EXISTS crossLeaderboard(userID text primary key, given integer, received integer)`)


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

function addToLeaderboard(userID, dbName, given, x) {
    const param = `REPLACE INTO ` + dbName + ` (userID, given, received) VALUES ("${userID}", "${given}", "${x}")`;
    db.run(param);
}

client.on('messageReactionAdd', (reaction, user) => {
    if (reaction.emoji.name == '❌') {
        const guild = GuildName(reaction.message.guild.name);
        const message = reaction.message;
        var postID = writePost(reaction, reaction.count);
        queryMessage(message, guild, reaction.count, postID);
        if(user == reaction.message.author) {
            var param = `SELECT * FROM crossLeaderboard WHERE userID="${user.id}"`
            db.get(param, [], (err, row) => {
                if (err) {
                    return console.error(err.message);
                }
                if(row) {
                    addToLeaderboard(user.id, 'crossLeaderboard', row.given + 1, row.received + 1);
                }
                else if(!row) {
                    addToLeaderboard(user.id, 'crossLeaderboard', 1, 1);
                }
            });
        }
        else {
            var param = `SELECT * FROM crossLeaderboard WHERE userID="${reaction.message.author.id}"`
            db.get(param, [], (err, row) => {
                if (err) {
                    return console.error(err.message);
                }
                if(row) {
                    addToLeaderboard(reaction.message.author.id, 'crossLeaderboard', row.given, row.received + 1)
                }
                else if(!row) {
                    addToLeaderboard(reaction.message.author.id, 'crossLeaderboard', 0, 1)
                }
            });
            param = `SELECT * FROM crossLeaderboard WHERE userID="${user.id}"`
            db.get(param, [], (err, row) => {
                if (err) {
                    return console.error(err.message);
                }
                if(row) {
                    addToLeaderboard(user.id, 'crossLeaderboard', row.given + 1, row.received);
                }
                else if(!row) {
                    addToLeaderboard(user.id, 'crossLeaderboard', 1, 0);
                }
            });
        }
    }

    /*if (reaction.emoji.name == '✅') {
        const guild = GuildName(reaction.message.guild.name);
        const message = reaction.message;
        var postID = writePost(reaction, reaction.count);
        queryMessage(message, guild, reaction.count, postID);
        if(user == reaction.message.author) {
            var param = `SELECT * FROM tickLeaderboard WHERE userID="${user.id}"`
            db.get(param, [], (err, row) => {
                if (err) {
                    return console.error(err.message);
                }
                if(row) {
                    addToLeaderboard(user.id, 'tickLeaderboard', row.given + 1, row.received + 1);
                }
                else if(!row) {
                    addToLeaderboard(user.id, 'tickLeaderboard', 1, 1);
                }
            });
        }
        else {
            var param = `SELECT * FROM tickLeaderboard WHERE userID="${reaction.message.author.id}"`
            db.get(param, [], (err, row) => {
                if (err) {
                    return console.error(err.message);
                }
                if(row) {
                    addToLeaderboard(reaction.message.author.id, 'tickLeaderboard', row.given, row.received + 1)
                }
                else if(!row) {
                    addToLeaderboard(reaction.message.author.id, 'tickLeaderboard', 0, 1)
                }
            });
            param = `SELECT * FROM tickLeaderboard WHERE userID="${user.id}"`
            db.get(param, [], (err, row) => {
                if (err) {
                    return console.error(err.message);
                }
                if(row) {
                    addToLeaderboard(user.id, 'tickLeaderboard', row.given + 1, row.received);
                }
                else if(!row) {
                    addToLeaderboard(user.id, 'tickLeaderboard', 1, 0);
                }
            });
        }
    }*/
    
}); 

client.on('messageReactionRemove', (reaction, user) => {
    if (reaction.emoji.name == '❌') {
        const guild = GuildName(reaction.message.guild.name);
        const message = reaction.message;
        var postID = writePost(reaction, reaction.count);
        queryMessage(message, guild, reaction.count, postID);
        db.run(`UPDATE crossLeaderboard SET received = received - 1 WHERE userID = "${reaction.message.author.id}"`);
        db.run(`UPDATE crossLeaderboard SET given = given - 1 WHERE userID = "${user.id}"`);
    };
    if (reaction.emoji.name == '✅') {
        const guild = GuildName(reaction.message.guild.name);
        const message = reaction.message;
        var postID = writePost(reaction, reaction.count);
        queryMessage(message, guild, reaction.count, postID);
        db.run(`UPDATE tickLeaderboard SET received = received - 1 WHERE userID = "${reaction.message.author.id}"`);
        db.run(`UPDATE tickLeaderboard SET given = given - 1 WHERE userID = "${user.id}"`);
    };
});

client.on('message', msg => {
    if (msg.author.bot) return; // Ignore bots.
    if (msg.channel.type === "dm") return; // Ignore DM channels.
    if(msg.content == 'ping') {
    	msg.channel.send('pong');
    }
    if(msg.content.toLowerCase() == 'hello there' || msg.content.toLowerCase() == 'hello there!') {
        msg.channel.send('https://media1.tenor.com/images/e60c1321d5acb1ff986d2dbb1560343e/tenor.gif?itemid=13024141')
    }
    if(msg.content == '!antiboard') {
    	getRanksReceived(getRanksGiven, 'crossLeaderboard', msg);
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

function getRanksReceived(callback, board, message) {
	var paramReceived = `SELECT * FROM "${board}" ORDER BY received DESC LIMIT 3`;
	var ranksReceived = [];
	db.all(paramReceived, [], (err, rows) => {
		if (err) {
			console.error(err);
		}
		if(rows){
			rows.forEach((row) => {
				ranksReceived.push(`<@${row.userID}> (${row.received})`);
			});
			return callback(getEmbed, board, message, ranksReceived);
		}
	});
}

function getRanksGiven(callback, board, message, ranks2) {
	var param = `SELECT * FROM "${board}" ORDER BY given DESC LIMIT 3`;
	var ranks = [];
	db.all(param, [], (err, rows) => {
		if (err) {
			console.error(err);
		}
		if(rows){
			rows.forEach((row) => {
				ranks.push(`<@${row.userID}> (${row.given})`);
			});
			return callback(board, ranks, message, ranks2);
		}
	});
}

function getEmbed(board, ranks, message, ranks2) {
	var out = '';
	var out2 = '';
	var title;
	var color;
	if(board == 'crossLeaderboard') {
		title = '❌';
		color = '#FF0000';
	}
	else {
		title = '✅';
		color = '#008000';
	}
    for(i = 0; i < ranks.length; i++) {
    	out = out + `${i+1}: ${ranks[i]} \n`;
    }
    for(i = 0; i < ranks2.length; i++) {
    	out2 = out2 + `${i+1}: ${ranks2[i]} \n`;
    }
    var embed = new Discord.RichEmbed()
        .setTitle('Server ' + title + ' Stats')
        .setDescription('X messages marked with a total of X reacts')
        .setColor(color)
    embed.addField('Top Givers', out, true);
    embed.addField('Top Receivers', out2, true);
    message.channel.send( {embed} );
}
		


function writePost(reaction, count) {
    var postID = '';
    var starboard;
    if(reaction.emoji.name == '✅') {
    	starboard = reaction.message.guild.channels.find('name', 'tick-board');
    }
    if(reaction.emoji.name == '❌') {
    	starboard = reaction.message.guild.channels.find('name', 'anti-star');
    }
    
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
      	if(count > 2) {
        	starboard.send(reaction.emoji + " **" + count + "**" + " <#" + reaction.message.channel.id + ">", {embed}).then(post => postID = post.id);
      	}
      }
      else if(row) {
        postID = row.postID;
        console.log(count);
        if(count < 3) {
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