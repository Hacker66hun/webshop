import express from 'express';
import rendelesekRoutes from './routes/rendelesek.js';
import termekekRoutes from './routes/termekek.js';
import vasarlokRoutes from './routes/vasarlok.js';
import statisztikaRoutes from './routes/statisztika.js';
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use('/rendelesek', rendelesekRoutes);
app.use('/termekek', termekekRoutes);
app.use('/vasarlok', vasarlokRoutes);
app.use('/statisztika', statisztikaRoutes);
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
