const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
let router = express.Router();
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");
const { upload } = require("./mega");

// Remove folder/file helper
function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get("/", async (req, res) => {
  let num = req.query.number;

  async function RobinPair() {
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    try {
      let RobinPairWeb = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: "fatal" }).child({ level: "fatal" })
          ),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        browser: Browsers.macOS("Safari"),
      });

      // Pairing if not registered
      if (!RobinPairWeb.authState.creds.registered) {
        await delay(1500);
        num = num.replace(/[^0-9]/g, "");
        const code = await RobinPairWeb.requestPairingCode(num);
        if (!res.headersSent) {
          await res.send({ code });
        }
      }

      RobinPairWeb.ev.on("creds.update", saveCreds);

      RobinPairWeb.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;
        if (connection === "open") {
          try {
            await delay(10000);

            const auth_path = "./session/";
            const user_jid = jidNormalizedUser(RobinPairWeb.user.id);

            function randomMegaId(length = 6, numberLength = 4) {
              const characters =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
              let result = "";
              for (let i = 0; i < length; i++) {
                result += characters.charAt(
                  Math.floor(Math.random() * characters.length)
                );
              }
              const number = Math.floor(
                Math.random() * Math.pow(10, numberLength)
              );
              return `${result}${number}`;
            }

            // Upload creds.json to Mega
            const mega_url = await upload(
              fs.createReadStream(auth_path + "creds.json"),
              `${randomMegaId()}.json`
            );

            const string_session = mega_url.replace("https://mega.nz/file/", "");

            // Construct caption
            const caption = `*𝑀𝑜𝑜𝓃𝓁𝒾𝑔𝒽𝓉 𝑀𝐷* 💙\n\n${string_session} 👈\n\n*This is your Session ID, copy this id and paste into config.js*\n\n*You can ask any question using this link*\n\n> *https://wa.me/+94752425527*\n\n*You can join my WhatsApp channel*\n\n> *https://whatsapp.com/channel/0029Vb6SeNIADTOJO7xAQV12*`;

            const warning = `🛑 *Do not share this code to anyone* 🛑`;

            // Send session image + caption + contextInfo
            await RobinPairWeb.sendMessage(user_jid, {
              image: { url: "https://files.catbox.moe/rv220b.jpg" },
              caption: caption,
              contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: "0029Vb6SeNIADTOJO7xAQV12@newsletter",
                  newsletterName: "𝐌𝐨𝐨𝐧𝐥𝐢𝐠𝐡𝐭 𝐌𝐃",
                  serverMessageId: 101,
                },
              },
            });

            // Send string_session text
            await RobinPairWeb.sendMessage(user_jid, { text: string_session });

            // Send warning message
            await RobinPairWeb.sendMessage(user_jid, { text: warning });
          } catch (e) {
            console.log("Error sending messages, restarting bot:", e);
            exec("pm2 restart prabath");
          }

          await delay(100);
          removeFile("./session");
          process.exit(0);
        } else if (
          connection === "close" &&
          lastDisconnect &&
          lastDisconnect.error &&
          lastDisconnect.error.output.statusCode !== 401
        ) {
          await delay(10000);
          RobinPair();
        }
      });
    } catch (err) {
      console.log("Service error, restarting:", err);
      exec("pm2 restart Robin-md");
      RobinPair();
      removeFile("./session");
      if (!res.headersSent) {
        await res.send({ code: "Service Unavailable" });
      }
    }
  }

  return await RobinPair();
});

process.on("uncaughtException", function (err) {
  console.log("Caught exception: " + err);
  exec("pm2 restart Robin");
});

module.exports = router;
