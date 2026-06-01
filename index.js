const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

const GROK_API_KEY = process.env.GROK_API_KEY;
const FONTE_TOKEN = process.env.FONTE_TOKEN;

async function kirimKeGrok(systemPrompt, pesanUser) {
  const response = await axios.post(
    "https://api.x.ai/v1/chat/completions",
    {
      model: "grok-3",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: pesanUser,
        },
      ],
      temperature: 0.8,
    },
    {
      headers: {
        Authorization: `Bearer ${GROK_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data.choices[0].message.content;
}

async function kirimWA(target, pesan) {
  await axios.post(
    "https://api.fonte.id/send",
    {
      target,
      message: pesan,
    },
    {
      headers: {
        Authorization: FONTE_TOKEN,
      },
    }
  );
}

/* =========================
   AGENT PENJUAL PULSA
========================= */

const PROMPT_PENJUAL = `
Kamu adalah admin penjualan pulsa dan paket data profesional.

Karakter:
- Ramah.
- Cepat merespon.
- Sopan.
- Fokus membantu pelanggan.

Tugas:
- Menjual pulsa semua operator.
- Menjual paket data.
- Menawarkan produk digital terkait.
- Jika pelanggan bertanya, jawab dengan jelas.
- Jika pelanggan belum membeli, tawarkan produk yang relevan.
- Jangan pernah marah.
- Gunakan bahasa Indonesia yang natural.
`;

/* =========================
   AGENT PEMBELI KRITIS
========================= */

const PROMPT_PEMBELI = `
Kamu adalah calon pembeli yang sangat kritis.

Karakter:
- Tegas.
- Curiga terhadap klaim berlebihan.
- Sering bertanya.
- Selalu meminta detail.
- Tidak mudah percaya.

Aturan:
- Jangan menggunakan kata kasar.
- Jangan mengancam.
- Jangan menghina.

Tujuan:
- Menggali informasi sebanyak mungkin.
- Menanyakan harga.
- Menanyakan kualitas.
- Menanyakan keunggulan produk.
- Menanyakan bukti dan testimoni.
- Menanyakan garansi.
- Menanyakan kelemahan produk.

Jika jawaban lawan bicara terlalu singkat,
lanjutkan dengan pertanyaan lanjutan.
`;

/* =========================
   WEBHOOK PENJUAL
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

    const jawaban = await kirimKeGrok(
      PROMPT_PENJUAL,
      pesan
    );

    await kirimWA(pengirim, jawaban);

    res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    res.status(500).send("ERROR");
  }
});

/* =========================
   WEBHOOK PEMBELI
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

    const jawaban = await kirimKeGrok(
      PROMPT_PEMBELI,
      pesan
    );

    await kirimWA(pengirim, jawaban);

    res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    res.status(500).send("ERROR");
  }
});

app.get("/", (req, res) => {
  res.send("WA AI Agent Online");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
