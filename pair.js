// ... previous code above
// Upload creds.json to Mega
const mega_url = await upload(
  fs.createReadStream(auth_path + "creds.json"),
  `${randomMegaId()}.json`
);

const string_session = mega_url.replace("https://mega.nz/file/", "");

// Construct caption (fixed)
const caption = `*𝐌𝐨𝐨𝐧𝐥𝐢𝐠𝐡𝐭 𝐌𝐃* 💙

${string_session} 🙌

*This is your Session ID, copy this id and paste into config.js*

*You can ask any question using this link*
> *https://wa.me/+94752425527*

*You can join my WhatsApp channel*
> *https://whatsapp.com/channel/0029Vb6SeNIADTOJO7xAQV12*

> ᴘᴏᴡᴇʀᴇᴅ ʙʏ 𝐌𝐨𝐨𝐧𝐥𝐢𝐠𝐡𝐭 🌓`;

const warning = `Do not share this code to anyone🧸`;

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
