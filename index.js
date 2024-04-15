const express = require("express");
const bodyParser = require("body-parser");
const uuid = require("uuid");
const speakeasy = require("speakeasy");
var QRCode = require("qrcode");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api", (req, res) => {
  res.json({ message: "2FA" });
});

app.post("/api/register", (req, res) => {
  var data = Object.getOwnPropertyNames(req.body);
  const { username } = JSON.parse(data[0]);
  // Genera id utente
  const id = uuid.v4();
  try {
    // Crea una chiave segreta temporanea finché non viene verificato
    const temp_secret = speakeasy.generateSecret();

    const new_otpauth_url = temp_secret.otpauth_url.replace('SecretKey',`${username}-Key`);
    // Inserisce utente nel database
    //db.insert_utente(id, temp_secret.base32, temp_secret.otpauth_url);
    // Ottieni l'URL dei dati per l'autenticazione QR code
    QRCode.toDataURL(new_otpauth_url, function (err, data_url) {
      // Invia l'id utente e la chiave segreta all'utente
      res.json({ id, secret: temp_secret.base32, data_url });
    });
  } catch (e) {
    console.log(e);
    res
      .status(500)
      .json({ message: "Errore durante la generazione della chiave segreta" });
  }
});

app.post("/api/verify", (req, res) => {
  var data = Object.getOwnPropertyNames(req.body);
  const { secret, token } = JSON.parse(data[0]);

  const verified = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
  });
  if (verified) {
    res.json({ verified: "true" });
  } else {
    res.json({ verified: "false" });
  }
});

app.post("/api/validate", async (req, res) => {
  var data = Object.getOwnPropertyNames(req.body);
  const { secret, token } = JSON.parse(data[0]);

  const tokenValidates = speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });
  if (tokenValidates) {
    res.json({ validated: true });
  } else {
    res.json({ validated: false });
  }
});

const port = 3000;

app.listen(port, () => {
  console.log(`App is running on PORT: ${port}`);
});
