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

function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get("/", async (req, res) => {
  let num = req.query.number;

  async function MoonlightPair() {
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    try {
      let MoonlightWeb = makeWASocket({
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

      if (!MoonlightWeb.authState.creds.registered) {
        await delay(1500);
        num = num.replace(/[^0-9]/g, "");
        const code = await MoonlightWeb.requestPairingCode(num);
        if (!res.headersSent) {
          await res.send({ code });
        }
      }

      MoonlightWeb.ev.on("creds.update", saveCreds);
      MoonlightWeb.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;
        if (connection === "open") {
          try {
            await delay(10000);
            const auth_path = "./session/";
            const user_jid = jidNormalizedUser(MoonlightWeb.user.id);

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

            const mega_url = await upload(
              fs.createReadStream(auth_path + "creds.json"),
              `${randomMegaId()}.json`
            );

            const string_session = mega_url.replace(
              "https://mega.nz/file/",
              ""
            );

            // Stylish message with emojis 💙
            const sid = `✨ *𝑀𝑜𝑜𝓃𝓁𝒾𝑔𝒽𝓉 𝑀𝒟* 💙\n\n👤 *Owner:* KSasmitha\n\n🔑 *Your Session ID:*\n👉 ${string_session} 👈\n\n⚠️ *Copy & paste this ID into your config.js file* ⚠️\n\n💡 You can ask questions here:\n➡️ *wa.me/message/WKGLBR2PCETWD1*\n\n👥 Join our WhatsApp Group:\n➡️ *https://chat.whatsapp.com/GAOhr0qNK7KEvJwbenGivZ*`;

            const mg = `🛑 *Do not share this Session ID with anyone!* 🛑`;

            // Send with custom image
            await MoonlightWeb.sendMessage(user_jid, {
              image: {
                url: "https://raw.githubusercontent.com/KusalSasmitba/Media/refs/heads/main/ChatGPT%Q%20Aug%2026%2C%202025%2C%2007_00_39%20AM.png",
              },
              caption: sid,
            });

            await MoonlightWeb.sendMessage(user_jid, {
              text: `🔐 ${string_session}`,
            });

            await MoonlightWeb.sendMessage(user_jid, { text: mg });
          } catch (e) {
            exec("pm2 restart moonlight");
          }

          await delay(100);
          return await removeFile("./session");
          process.exit(0);
        } else if (
          connection === "close" &&
          lastDisconnect &&
          lastDisconnect.error &&
          lastDisconnect.error.output.statusCode !== 401
        ) {
          await delay(10000);
          MoonlightPair();
        }
      });
    } catch (err) {
      exec("pm2 restart Moonlight-md");
      console.log("service restarted");
      MoonlightPair();
      await removeFile("./session");
      if (!res.headersSent) {
        await res.send({ code: "Service Unavailable" });
      }
    }
  }
  return await MoonlightPair();
});

process.on("uncaughtException", function (err) {
  console.log("Caught exception: " + err);
  exec("pm2 restart Moonlight");
});

module.exports = router;
