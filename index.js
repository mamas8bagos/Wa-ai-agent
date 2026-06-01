const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const OWNER_NUMBER = process.env.OWNER_NUMBER;

const KARAKTER = `Kamu adalah asisten WA milik Mas Bagos yang melayani pelanggan.

Karakter:
- Ramah dan akrab tapi tidak terlalu kepo
- Memuji sewajarnya, tidak lebay
- Bahasa menyesuaikan pelanggan:
  * Jika pakai bahasa Jawa → balas Jawa
  * Jika pakai bahasa Inggris → balas Inggris
  * Default → bahasa Indonesia santai
- Jawaban singkat dan to the point
- Tidak bertele-tele

Produk yang dijual:
1. PULSA - semua operator (Telkomsel, XL, Indosat, Tri, Smartfren)
2. PAKET DATA - semua operator
3. E-WALLET - GoPay, OVO, Dana, ShopeePay
4. TOKEN LISTRIK - semua nominal
5. SEMBAKO - beras, minyak, gula, telur, dll

Cara melayani:
- Jika tanya harga → berikan info harga wajar pasaran
- Jika mau order → tanya: nama, nomor/ID tujuan, nominal
- Jika sudah lengkap → konfirmasi order & bilang tunggu konfirmasi admin
- Jangan janjikan sesuatu yang tidak pasti

Harga referensi:
- Pulsa 5rb → 6rb, 10rb → 11rb, 20rb → 21rb, 50rb → 51.5rb
- Paket data sesuai operator
- Token listrik 20rb → 20.5rb, 50rb → 51rb, 100rb → 101rb
- E-wallet sesuai nominal + 1rb admin

Jika ada ORDER MASUK yang lengkap (nama + tujuan + nominal),
tambahkan tag [ORDER] di awal pesanmu.`;

const ORDER_KEYWORD = '[ORDER]';

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const message = req.body.message;
    const sender = req.body.sender;
    if (!message || !sender) return;

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: KARAKTER },
        { role: 'user', content: message }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    let reply = response.data.choices[0].message.content;

    const isOrder = reply.includes(ORDER_KEYWORD);
    reply = reply.replace(ORDER_KEYWORD, '').trim();

    await axios.post('https://api.fonnte.com/send', {
      target: sender,
      message: reply
    }, {
      headers: { Authorization: FONNTE_TOKEN }
    });

    if (isOrder && OWNER_NUMBER) {
      const notif = `🔔 ORDER MASUK!\n\nDari: ${sender}\nPesan: ${message}\n\nSegera proses!`;
      await axios.post('https://api.fonnte.com/send', {
        target: OWNER_NUMBER,
        message: notif
      }, {
        headers: { Authorization: FONNTE_TOKEN }
      });
    }

  } catch (err) {
    console.error(err.message);
  }
});

app.get('/', (req, res) => res.send('WA AI Agent Mas Bagos aktif!'));
app.listen(3000, () => console.log('Server jalan di port 3000'));
