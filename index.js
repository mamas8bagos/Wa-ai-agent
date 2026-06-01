const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const GROK_API_KEY = process.env.GROK_API_KEY;

const TOKEN_PENJUAL = process.env.FONTE_TOKEN_PENJUAL;
const TOKEN_PEMBELI = process.env.FONTE_TOKEN_PEMBELI;

/* =========================
   PROMPT AGENT PENJUAL
========================= */

const PROMPT_PENJUAL = `
Kamu adalah admin penjual pulsa, paket data, token listrik dan produk digital.

Karakter:
- Ramah
- Sopan
- Profesional
- Aktif menawarkan produk

Aturan:
- Jawab singkat dan jelas.
- Jika pelanggan belum membeli, tawarkan produk yang relevan.
- Selalu bersikap baik.
- Gunakan bahasa Indonesia yang natural.
- Fokus membantu pelanggan melakukan pembelian.
`;

/* =========================
   PROMPT AGENT PEMBELI
========================= */

const PROMPT_PEMBELI = `
Kamu adalah calon pembeli yang sangat kritis.

Karakter:
- Tegas
- Kritis
- Banyak bertanya
- Tidak mudah percaya

Aturan:
- Jangan menggunakan kata kasar.
- Jangan menghina.
- Jangan mengancam.
- Selalu tanyakan detail produk.
- Selalu tanyakan harga.
- Selalu tanyakan kelebihan dan kekurangan produk.
- Jika jawaban lawan bicara kurang jelas, lanjutkan dengan pertanyaan baru.

Tujuan:
Menggali informasi sebanyak mungkin sebelum membeli.
`;

/* =========================
   GROK
========================= */

async function askGrok(prompt, userMessage) {
  const response = await axios.post(
    "https://api.x.ai/v1/chat/completions",
    {
      model: "grok-3",
      temperature: 0.8,
      messages: [
        {
          role: "system",
          content: prompt
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${GROK_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data.choices[0].message.content;
}

/* =========================
   FONTE SEND
========================= */

async function sendWhatsApp(target, message, token) {
  await axios.post(
    "https://api.fonte.id/send",
    {
      target: target,
      message: message
    },
    {
      headers: {
        Authorization: token
      }
    }
  );
}

/* =========================
   AGENT PENJUAL
========================= */

app.post("/penjual", async (req, res) => {
  try {
    const pesan =
      req.body.message ||
      req.body.content ||
      "";

    const pengirim =
      req.body.sender ||
      req.body.from ||
      "";

    if (!pesan || !pengirim) {
      return res.status(200).send("ignored");
    }

    const jawaban = await askGrok(
      PROMPT_PENJUAL,
      pesan
    );

    await sendWhatsApp(
      pengirim,
      jawaban,
      TOKEN_PENJUAL
    );

    res.status(200).send("ok");

  } catch (error) {
    console.error(error);
    res.status(500).send("error");
  }
});

/* =========================
   AGENT PEMBELI
========================= */

app.post("/pembeli", async (req, res) => {
  try {
    const pesan =
      req.body.message ||
      req.body.content ||
      "";

    const pengirim =
      req.body.sender ||
      req.body.from ||
      "";

    if (!pesan || !pengirim) {
      return res.status(200).send("ignored");
    }

    const jawaban = await askGrok(
      PROMPT_PEMBELI,
      pesan
    );

    await sendWhatsApp(
      pengirim,
      jawaban,
      TOKEN_PEMBELI
    );

    res.status(200).send("ok");

  } catch (error) {
    console.error(error);
    res.status(500).send("error");
  }
});

/* =========================
   STATUS
========================= */

app.get("/", (req, res) => {
  res.send("WA AI Agent Online");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
