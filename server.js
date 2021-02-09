const Discord = require("discord.js");
const client = new Discord.Client();
require("dotenv").config();

const random = require("random");

//JSON Loads discord bot key
//JSON has 1 value in it. "key" : "yourkey"
let token = process.env.TOKEN;

//Opens up database

const pgp = require("pg-promise")();
const db = pgp({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});
console.log("Connected to database");

db.none(
  `CREATE TABLE IF NOT EXISTS messages
     (
         messageID
         text
         primary
         key,
         postID
         text,
         guildName
         text,
         score
         integer
     )`
);
db.none(
  `CREATE TABLE IF NOT EXISTS tickLeaderboard
     (
         userID
         text
         primary
         key,
         given
         integer,
         received
         integer
     )`
);
db.none(
  `CREATE TABLE IF NOT EXISTS crossLeaderboard
     (
         userID
         text
         primary
         key,
         given
         integer,
         received
         integer
     )`
);

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  client.user.setActivity("developed by @DarthJarJar");
  client.on("ready", (client) => {
    client.channels.get("409382144838991893").send("Hello here!");
  });
});

function queryMessage(message, name, count, postID) {
  if (count > 0) {
    db.none(
      `INSERT INTO ` +
        `messages` +
        ` (messageID, postID, guildName, score) VALUES ('${message.id}','${postID}','${name}', ${count}) ` +
        `ON CONFLICT (messageID) DO UPDATE ` +
        `SET (postID, guildName, score) = ('${postID}','${name}', ${count})`
    );
  } else {
    db.none(`DELETE FROM messages WHERE messageID ='${message.id}'`);
  }
}

function addToLeaderboard(userID, dbName, given, x) {
  const param =
    `INSERT INTO ` +
    dbName +
    ` (userID, given, received) VALUES ('${userID}', ${given}, ${x}) ` +
    `ON CONFLICT (userID) DO UPDATE ` +
    `SET (given, received) = (${given}, ${x})`;
  db.none(param);
}

client.on("messageReactionAdd", (reaction, user) => {
  if (reaction.emoji.name == "❌") {
    const guild = GuildName(reaction.message.guild.name);
    const message = reaction.message;
    var postID = writePost(reaction, reaction.count);
    if (reaction.count >= 2) {
      queryMessage(message, guild, reaction.count, postID);
    }
    if (user == reaction.message.author) {
      var param = `SELECT * FROM crossLeaderboard WHERE userID='${user.id}'`;

      db.oneOrNone(param, [], (row, err) => {
        if (err) {
          console.error(err);
        }
        if (row) {
          addToLeaderboard(
            user.id,
            "crossLeaderboard",
            row["given"] + 1,
            row["received"] + 1
          );
        } else {
          addToLeaderboard(user.id, "crossLeaderboard", 1, 1);
        }
      });
    } else {
      var param = `SELECT * FROM crossLeaderboard WHERE userID='${reaction.message.author.id}'`;
      db.oneOrNone(param, [], (row, err) => {
        if (err) {
          console.error(err);
        }
        if (row) {
          addToLeaderboard(
            reaction.message.author.id,
            "crossLeaderboard",
            row["given"],
            row["received"] + 1
          );
        } else if (!row) {
          addToLeaderboard(
            reaction.message.author.id,
            "crossLeaderboard",
            0,
            1
          );
        }
      });
      param = `SELECT * FROM crossLeaderboard WHERE userID='${user.id}'`;
      db.oneOrNone(param, [], (row, err) => {
        if (err) {
          return console.error(err.message);
        }
        if (row) {
          addToLeaderboard(
            user.id,
            "crossLeaderboard",
            row["given"] + 1,
            row["received"]
          );
        } else if (!row) {
          addToLeaderboard(user.id, "crossLeaderboard", 1, 0);
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
              var param = `SELECT * FROM tickLeaderboard WHERE userID='${user.id}'`
              db.query(param, [], (err, row) => {
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
              var param = `SELECT * FROM tickLeaderboard WHERE userID='${reaction.message.author.id}'`
              db.query(param, [], (err, row) => {
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
              param = `SELECT * FROM tickLeaderboard WHERE userID='${user.id}'`
              db.query(param, [], (err, row) => {
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

client.on("messageReactionRemove", (reaction, user) => {
  if (reaction.emoji.name == "❌") {
    const guild = GuildName(reaction.message.guild.name);
    const message = reaction.message;
    var postID = writePost(reaction, reaction.count);
    queryMessage(message, guild, reaction.count, postID);
    db.none(
      `UPDATE crossLeaderboard SET received = received - 1 WHERE userID = '${reaction.message.author.id}'`
    );
    db.none(
      `UPDATE crossLeaderboard SET given = given - 1 WHERE userID = '${user.id}'`
    );
  }
  if (reaction.emoji.name == "✅") {
    const guild = GuildName(reaction.message.guild.name);
    const message = reaction.message;
    var postID = writePost(reaction, reaction.count);
    queryMessage(message, guild, reaction.count, postID);
    db.none(
      `UPDATE tickLeaderboard SET received = received - 1 WHERE userID = '${reaction.message.author.id}'`
    );
    db.none(
      `UPDATE tickLeaderboard SET given = given - 1 WHERE userID = '${user.id}'`
    );
  }
});

client.on("message", (msg) => {
  if (msg.author.bot) return; // Ignore bots.
  if (msg.channel.type === "dm") return; // Ignore DM channels.
  if (
    msg.author.id === "385840144273506307" &&
    (msg.content.toLowerCase().includes("rhino") ||
      msg.content.includes("coochie") || msg.content.includes("ewwww-lol.gif") || msg.content.includes("ace-ventura"))
  ) {
    let muterole = msg.guild.roles.find(
      (muterole) => muterole.name === "muted"
    );
    console.log(muterole);
    msg.member.addRole('742111372757958766');
    msg.channel.send("Tomas muted");
  }
  if (msg.content == "ping") {
    msg.channel.send("pong");
  }
  if (
    msg.content.toLowerCase() == "hello there" ||
    msg.content.toLowerCase() == "hello there!"
  ) {
    msg.channel.send(
      "https://media1.tenor.com/images/e60c1321d5acb1ff986d2dbb1560343e/tenor.gif?itemid=13024141"
    );
  }
  if (msg.content == "!antiboard") {
    getRanksReceived(getRanksGiven, "crossLeaderboard", msg);
  }
  if (msg.content == "!f" && msg.member.hasPermission("KICK_MEMBERS")) {
    msg.channel.send("Fuck Off");
  }
  if (msg.content == "!lightmode") {
    msg.channel.send("No.");
  }
  if (msg.content == "!darkmode") {
    msg.channel.send("Yes.");
  }
  if (msg.content == "!imperial") {
    msg.channel.send("Have fun socialising! Oh wait...");
  }
  if (msg.content == "!ucl") {
    msg.channel.send("Good luck with that student satisfaction");
  }
  if (msg.content == "!warwick") {
    msg.channel.send(
      "I can't diss WW without risking the wrath of half the server"
    );
  }
  if (msg.content == "!oxford") {
    msg.channel.send("Have fun learning in a posh basement!");
  }
  if (msg.content == "!birmingham") {
    msg.channel.send("mquay: idk");
  }
  if (msg.content == "!cambridge") {
    msg.channel.send("Ever made a compiler?");
  }
  if (msg.content == "!kings") {
    msg.channel.send("BTEC UCL. Wait are BTECs still a thing?");
  }
  if (msg.content == "!bristol") {
    msg.channel.send("Uni of Crossdressers or something");
  }
  if (msg.content == "!rat") {
    msg.channel.send("Rat clan is a dead cult");
  }
  if (msg.content == "!sith") {
    msg.channel.send("<a:sith_lord:755572923213021314>");
  }
  if (msg.content == "!tomas" && msg.member.hasPermission("KICK_MEMBERS")) {
    msg.channel.send("<@385840144273506307>");
  }
  if (msg.content == "!nonce" && msg.member.hasPermission("KICK_MEMBERS")) {
    msg.channel.send("<@&804494324204568607>");
  }
  /*let msgTimestamp = [];
    if (msg.content == "!order66") {
      if (typeof msgTimestamp[0] !== "undefined") {
        if (msgTimestamp[0] + 10000 < Date.now()) {
          msg.channel.send(
            "Did you ever hear the Tragedy of Darth Plagueis the wise? I thought not. It's not a story the Jedi would tell you. It's a Sith legend. Darth Plagueis was a Dark Lord of the Sith, so powerful and so wise he could use the Force to influence the midichlorians to create life... He had such a knowledge of the dark side that he could even keep the ones he cared about from dying. The dark side of the Force is a pathway to many abilities some consider to be unnatural. He became so powerful... the only thing he was afraid of was losing his power, which eventually, of course, he did. Unfortunately, he taught his apprentice everything he knew, then his apprentice killed him in his sleep. It's ironic he could save others from death, but not himself."
          );
          msgTimestamp = [];
        } else {
          message.channel.send("Wait some time before using this command again.");
        }
      } else {
        msgTimestamp.push(Date.now());
        msg.channel.send(
          "Did you ever hear the Tragedy of Darth Plagueis the wise? I thought not. It's not a story the Jedi would tell you. It's a Sith legend. Darth Plagueis was a Dark Lord of the Sith, so powerful and so wise he could use the Force to influence the midichlorians to create life... He had such a knowledge of the dark side that he could even keep the ones he cared about from dying. The dark side of the Force is a pathway to many abilities some consider to be unnatural. He became so powerful... the only thing he was afraid of was losing his power, which eventually, of course, he did. Unfortunately, he taught his apprentice everything he knew, then his apprentice killed him in his sleep. It's ironic he could save others from death, but not himself."
        );
      }
    }*/
  if (
    msg.content.length > 5 &&
    msg.content.substring(0, 5).toLowerCase() == "pick " &&
    msg.author.bot != true
  ) {
    if (
      msg.content.includes("@everyone") ||
      msg.content.includes("@here") ||
      checkRoleFromMessage(msg)
    ) {
      msg.channel.send(`Fuck you <@${msg.author.id}>`);
    } else if (msg.mentions.members.first()) {
      msg.channel.send("Double pings are just rude");
    } else {
      var words = msg.content.substring(5).split(",");
      var index = random.int(0, words.length - 1);
      msg.channel.send(words[index]);
    }
  }
  if (msg.content == "!carl") {
    msg.channel.send("Kill the turtle");
  }
});

function checkRoleFromMessage(message) {
  if (!message.content.includes("<@&")) {
    return false;
  }

  // The id is the first and only match found by the RegEx.
  const matches = message.content.match(/<@(&)!?(\d+)>/);

  // If supplied variable was not a mention, matches will be null instead of an array.
  if (!matches) return;

  // However the first element in the matches array will be the entire mention, not just the ID,
  // so use index 1.
  const id = matches[2];
  let role = message.guild.roles.find((x) => x.id === id);
  if (typeof role != undefined) {
    return true;
  } else {
    return false;
  }
}

function getDate() {
  var today = new Date();
  var dd = String(today.getDate()).padStart(2, "0");
  var mm = String(today.getMonth() + 1).padStart(2, "0");
  var yyyy = today.getFullYear();
  today = mm + "/" + dd + "/" + yyyy;
  return today;
}

function GuildName(guild) {
  return "Guild" + guild.replace(/[^a-zA-Z ]/g, "");
}

function getRanksReceived(callback, board, message) {
  var paramReceived = `SELECT * FROM ${board} ORDER BY received DESC LIMIT 3`;
  var ranksReceived = [];
  db.any(paramReceived).then((rows) => {
    rows.forEach((row) => {
      ranksReceived.push(`<@${row["userid"]}> (${row["received"]})`);
    });
    return callback(getEmbed, board, message, ranksReceived);
  });
}

function getRanksGiven(callback, board, message, ranks2) {
  var param = `SELECT * FROM ${board} ORDER BY given DESC LIMIT 3`;
  var ranks = [];
  db.any(param).then((rows) => {
    rows.forEach((row) => {
      ranks.push(`<@${row["userid"]}> (${row["given"]})`);
    });
    return callback(board, ranks, message, ranks2);
  });
}

function getRankFromMedal(rank) {
  if (rank == 1) {
    return ":first_place";
  } else if (rank == 2) {
    return ":second_place";
  } else if (rank == 3) {
    return ":third_place";
  }
}

function getEmbed(board, ranks, message, ranks2) {
  var out = "";
  var out2 = "";
  var title;
  var color;
  if (board == "crossLeaderboard") {
    title = "❌";
    color = "#FF0000";
  } else {
    title = "✅";
    color = "#008000";
  }
  for (i = 0; i < ranks.length; i++) {
    out = out + `${getRankFromMedal(i + 1)}: ${ranks[i]} \n`;
  }
  for (i = 0; i < ranks2.length; i++) {
    out2 = out2 + `${getRankFromMedal(i + 1)}: ${ranks2[i]} \n`;
  }
  db.oneOrNone(
    `SELECT * FROM crossLeaderboard WHERE userID='${message.author.id}'`,
    [],
    (row, err) => {
      if (err) {
        console.error(err.message);
      }
      if (row) {
        const line = `<@${row["userid"]}> (${row["given"]})`;
        if (!ranks.includes(line)) {
          out = out + `You: ${line} \n`;
        }
        const line2 = `<@${row["userid"]}> (${row["received"]})`;
        if (!ranks2.includes(line2)) {
          out2 = out2 + `You: ${line2} \n`;
        }
      } else {
        const line = `<@${message.author.id}> (0)`;

        if (!ranks.includes(line)) {
          out = out + `You: ${line} \n`;
        }
        const line2 = `<@${message.author.id}> (0)`;
        if (!ranks2.includes(line2)) {
          out2 = out2 + `You: ${line2} \n`;
        }
      }
      var embed = new Discord.RichEmbed()
        .setTitle("Server " + title + " Stats")
        .setDescription("X messages marked with a total of X reacts")
        .setColor(color);
      embed.addField("Top Givers", out, true);
      embed.addField("Top Receivers", out2, true);
      message.channel.send({ embed });
    }
  );
}

function writePost(reaction, count) {
  var postID = "";
  var starboard;
  if (reaction.emoji.name == "✅") {
    starboard = reaction.message.guild.channels.find("name", "tick-board");
  }
  if (reaction.emoji.name == "❌") {
    starboard = reaction.message.guild.channels.find("name", "anti-star");
  }
  if (!starboard) {
    console.log("Can't find board");
    return;
  }

  var url =
    "https://discord.com/channels/" +
    reaction.message.guild.id +
    "/" +
    reaction.message.channel.id +
    "/" +
    reaction.message.id;
  var embed = new Discord.RichEmbed()
    .setAuthor(
      reaction.message.member.user.username,
      reaction.message.author.avatarURL
    )
    .setDescription(reaction.message.content)
    .setFooter(reaction.message.id + "•" + getDate())
    .setColor("#FF0000");
  embed.addField("Source", "[Jump!](" + url + ")");
  var param = `SELECT postID FROM messages WHERE messageID='${reaction.message.id}'`;
  db.oneOrNone(param, [], (row, err) => {
    if (err) {
      console.error(err.message);
    }
    if (!row) {
      if (count > 1) {
        starboard
          .send(
            reaction.emoji +
              " **" +
              count +
              "**" +
              " <#" +
              reaction.message.channel.id +
              ">",
            { embed }
          )
          .then((post) => (postID = post.id));
      }
    } else if (row) {
      postID = row["postid"];
      if (count < 2) {
        starboard
          .fetchMessages({ around: row["postid"], limit: 1 })
          .then((msg) => msg.first().delete())
          .catch((error) => console.error("Error with message path"));
        db.none(
          `DELETE FROM messages WHERE messageID='${reaction.message.id}'`
        );
      } else {
        starboard
          .fetchMessages({ around: row["postid"], limit: 1 })
          .then((msg) =>
            msg
              .first()
              .edit(
                reaction.emoji +
                  " **" +
                  count +
                  "**" +
                  " <#" +
                  reaction.message.channel.id +
                  ">",
                { embed }
              )
          )
          .catch((error) => console.error("Error with message path"));
      }
    }
  });
  return postID;
}

client.login(token);
