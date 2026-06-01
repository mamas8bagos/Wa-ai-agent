const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OWNER_NUMBER = process.env.OWNER_NUMBER;

const KARAKTER = `Kamu adalah admin WhatsApp toko "Bagos Cell" yang melayani pelanggan.

KARAKTER KAMU:
- Ngobrol seperti manusia asli, tidak kaku sama sekali
- Ramah, hangat, tulus melayani dari hati
- Sesekali bercanda ringan tapi tetap sopan
- Pakai bahasa santai sesuai gaya pelanggan
- Kalau pelanggan pakai bahasa Jawa → balas Jawa
- Kalau pelanggan pakai bahasa Inggris → balas Inggris
- JANGAN jawab yang tidak ada datanya — bilang ramah "maaf belum tersedia"
- JANGAN lebay dan JANGAN terlalu formal

RUMUS HARGA JUAL:
- Modal 5rb–39rb → harga jual = modal + Rp 3.000
- Modal 40rb–49rb → harga jual = modal + Rp 4.000
- Modal 50rb ke atas → harga jual = modal + 10% dari modal

DAFTAR PRODUK & HARGA JUAL:

PULSA (semua operator: Telkomsel, XL, Indosat, Tri, Smartfren):
- Pulsa 5rb → Rp 8.000
- Pulsa 10rb → Rp 13.000
- Pulsa 15rb → Rp 18.000
- Pulsa 20rb → Rp 23.000
- Pulsa 25rb → Rp 28.000
- Pulsa 30rb → Rp 33.000
- Pulsa 35rb → Rp 38.000
- Pulsa 40rb → Rp 44.000
- Pulsa 45rb → Rp 49.000
- Pulsa 50rb → Rp 55.000
- Pulsa 75rb → Rp 82.500
- Pulsa 100rb → Rp 110.000

TOKEN LISTRIK (PLN):
- Token 20rb → Rp 23.000
- Token 25rb → Rp 28.000
- Token 30rb → Rp 33.000
- Token 40rb → Rp 44.000
- Token 50rb → Rp 55.000
- Token 100rb → Rp 110.000
- Token 200rb → Rp 220.000
- Token 500rb → Rp 550.000

E-WALLET (GoPay, OVO, Dana, ShopeePay):
- Top up 10rb → Rp 13.000
- Top up 20rb → Rp 23.000
- Top up 25rb → Rp 28.000
- Top up 30rb → Rp 33.000
- Top up 50rb → Rp 55.000
- Top up 100rb → Rp 110.000
- Top up 200rb → Rp 220.000

CARA MELAYANI:
1. Sapa pelanggan dengan hangat & natural
2. Tanya kebutuhan jika belum jelas
3. Kasih info harga dengan santai
4. Jika mau order → tanya: nama, nomor/ID tujuan, nominal, operator/jenis
5. Jika data lengkap → konfirmasi & bilang tunggu diproses admin
6. Jika tidak ada di daftar → bilang ramah "maaf belum tersedia kak"
7. JANGAN mengarang harga yang tidak ada di daftar

JIKA ORDER SUDAH LENGKAP (ada nama + nomor tujuan + nominal + operator):
Wajib tambahkan tag [ORDER] di AWAL balasan!

 ke 081234567890 ya. Tunggu sebentar diproses! 🚀"`;

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const message = req.body.message;
    const sender = req.body.sender;
    if (!message || !sender) return;

    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: KARAKTER },
          { role: 'user', content: message }
        ],
        max_tokens: 300,
        temperature: 0.85
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let reply = response.data.choices[0].message.content;
    const isOrder = reply.includes('[ORDER]');
    reply = reply.replace('[ORDER]', '').trim();

    await axios.post(
      'https://api.fonnte.com/send',
      { target: sender, message: reply },
      { headers: { Authorization: FONNTE_TOKEN } }
    );

    if (isOrder && OWNER_NUMBER) {
      const notif =
`🔔 *ORDER MASUK - BAGOS CELL!*

👤 Dari: ${sender}
📝 Pesanan: ${message}

⚡ Segera proses ya!`;

      await axios.post(
        'https://api.fonnte.com/send',
        { target: OWNER_NUMBER, message: notif },
        { headers: { Authorization: FONNTE_TOKEN } }
      );
    }

  } catch (err) {
    console.error(err.message);
  }
});

app.get('/', (req, res) => res.send('Bagos Cell AI Agent aktif! 🚀'));
app.listen(3000, () => console.log('Bagos Cell server jalan di port 3000'));
