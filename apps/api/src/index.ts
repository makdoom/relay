import { app } from './app.js';

const PORT = Number(process.env.PORT || 8000);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
