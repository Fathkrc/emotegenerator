
const { Kafka } = require('kafkajs');
const WebSocket = require('ws');

// Kafka client
const kafka = new Kafka({
  clientId: 'server_a',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'] 
});

async function startKafkaConsumer() {
  // setInterval(async () => {
    try {
      const consumer = kafka.consumer({ groupId: 'server_a_group' });
      await consumer.connect();
      await consumer.subscribe({ topic: 'aggregated-emote-data', fromBeginning: true });
  
      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          const msgValue = message.value.toString();
          console.log('Received from Kafka:', msgValue);
          // Broadcast 
          broadcastToAll(msgValue);
        },
      });
    } catch (err) {
      console.error('Kafka consumer error:', err);
    }
  // }
  // , 6000); // not connecting for the first time before kafka is awake
}


const wss = new WebSocket.Server({ port: 3000 });
let clients = [];

wss.on('connection', (ws) => {
  clients.push(ws);
  console.log('A new client connected.');


  ws.on('close', () => {
    clients = clients.filter(client => client !== ws);
    console.log('A client disconnected.');
  });
});

// Helper 
function broadcastToAll(msg) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

startKafkaConsumer();
console.log('Server A is listening on port 3000 for WebSocket connections');