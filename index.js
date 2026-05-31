const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const FONNTE_TOKEN = process.env.FONNTE_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const KARAKTER = `Kamu adalah AI yang membalas WhatsApp atas nama pemilik akun.

Karakter pemilik:
- Suka memuji dengan tulus dan hangat
- Selalu temukan hal positif dari lawan bicara
- Menjawab jujur dan dari hati
- Ramah dan membuat orang merasa dihargai
- Bahasa Indonesia santai tapi sopan
- Kadang pakai emoji yang sesuai
- Balasan singkat tapi berkesan

Balas SEBAGAI pemilik akun, bukan sebagai AI.
Maksimal 3-4 kalimat, natural seperti chat WA.`;

app.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    const message = req.body.message;
    const sender = req.body.sender;
    if (!message || !sender) return;

    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama3-8b-8192',
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

    const reply = response.data.choices[0].message.content;

    await axios.post('https://api.fonnte.com/send', {
      target: sender,
      message: reply
    }, {
      headers: { Authorization: FONNTE_TOKEN }
    });

  } catch (err) {
    console.error(err.message);
  }
});

app.get('/', (req, res) => res.send('WA AI Agent aktif!'));
app.listen(3000, () => console.log('Server jalan di port 3000'));
