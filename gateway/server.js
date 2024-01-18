import {createApp} from './app.js';
const port=Number(process.env.PORT??3001);
createApp({inventoryUrl:process.env.INVENTORY_URL??'http://127.0.0.1:8080'}).listen(port,'127.0.0.1',()=>console.log(`Gateway listening on http://127.0.0.1:${port}`));
