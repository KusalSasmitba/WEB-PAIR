const mega = require("megajs");
const { Readable } = require("stream");

const auth = {
  email: "irene66226@mailbali.com",
  password: "Kusalsasmitha123",
  userAgent:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246",
};

const upload = (data, name) => {
  return new Promise((resolve, reject) => {
    const storage = new mega.Storage(auth);

    storage.on("ready", () => {
      console.log("Storage is ready. Proceeding with upload.");

      const uploadStream = storage.upload({ name, allowUploadBuffering: true });

      uploadStream.on("complete", (file) => {
        file.link((err, url) => {
          storage.close();
          if (err) {
            reject(err);
          } else {
            resolve(url);
          }
        });
      });

      uploadStream.on("error", (err) => {
        reject(err);
      });

      // ✅ Make sure `data` is a Buffer or Stream
      let inputStream;
      if (Buffer.isBuffer(data)) {
        inputStream = Readable.from(data);
      } else if (typeof data === "string") {
        inputStream = Readable.from(Buffer.from(data));
      } else if (data && typeof data.pipe === "function") {
        inputStream = data; // already a stream
      } else {
        return reject(
          new TypeError("Upload data must be Buffer, string, or Stream")
        );
      }

      inputStream.pipe(uploadStream);
    });

    storage.on("error", (err) => {
      reject(err);
    });
  });
};

module.exports = { upload };
