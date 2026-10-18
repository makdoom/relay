import { app } from './app.js';
import { config } from './config/index.js';

app.listen(config.port, config.host, () => {
  console.log(`Server is running on http://${config.host}:${config.port}`);
});
