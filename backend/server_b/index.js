// index.js

const express = require('express');
const bodyParser = require('body-parser');
const { Kafka } = require('kafkajs');

// -----------------------------------------------------
// 1) Configuration and initial setup
// -----------------------------------------------------

// By default, use environment variables (from docker-compose.yml or .env file)
// or fallback to hardcoded defaults (for local testing).
const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
const RAW_TOPIC =  'raw-emote-data';
const AGG_TOPIC = 'aggregated-emote-data';

// The "messageCountThreshold" controls how many raw emote messages
// we collect before performing the aggregation step.
let messageCountThreshold = 100;

// The "significantEmoteThreshold" is the fraction of total votes
// needed for an emote to count as significant (e.g., 0.2 = 20%).
let significantEmoteThreshold = 0.2;

// We accumulate raw emote messages in this array before analyzing.
let rawMessagesBatch = [];
// This is a list of emotes that we want to allow for analysis. hardcoded for now
let allowedEmotes = ['❤️', '👍', '😢', '😡'];
// -----------------------------------------------------
// 2) Set up Kafka (consumer + producer)
// -----------------------------------------------------
const kafka = new Kafka({
  clientId: 'server_b',
  brokers: [KAFKA_BROKER],
});

const consumer = kafka.consumer({ groupId: 'server_b_consumer' });
const producer = kafka.producer();
const analyzeEmotes = async emoteData => {
  const significantMoments = [];
  const emoteCounts = {};

  emoteData.forEach(record => {
    const timestamp = record.timestamp.slice(0, 16);
    const emote = record.emote;

    if (!emoteCounts[timestamp]) {
      emoteCounts[timestamp] = { total: 0 };
    }

    if (!emoteCounts[timestamp][emote]) {
      emoteCounts[timestamp][emote] = 0;
    }

    emoteCounts[timestamp][emote]++;
    emoteCounts[timestamp].total++;
  });

  for (const timestamp in emoteCounts) {
    const counts = emoteCounts[timestamp];
    const totalEmotes = counts.total;

    for (const emote in counts) {
      if (emote !== 'total' && counts[emote] / totalEmotes > significantEmoteThreshold) {
        significantMoments.push({
          timestamp,
          emote,
          count: counts[emote],
          totalEmotes
        });
      }
    }
  }

  return significantMoments;
};

// -----------------------------------------------------
// 4) Handling raw messages & batching
// -----------------------------------------------------
async function handleIncomingMessage(message) {
  // Convert Kafka message buffer to string, then parse
  // if (!allowedEmotes.includes(emote)) {
  //   return;
  // }
  const valueStr = message.value.toString();
  let record;
  try {
    record = JSON.parse(valueStr);
  } catch (err) {
    console.error('Invalid JSON in raw-emote-data:', valueStr);
    return;
  }
  // Filter by allowed emotes
  if (allowedEmotes.length > 0 && !allowedEmotes.includes(record.emote)) {
    return; // Skip message if emote not allowed
  }
  // Push received record into our batch
  rawMessagesBatch.push(record);

  // Check if we reached our threshold
  if (rawMessagesBatch.length >= messageCountThreshold) {
    console.log(`Reached ${messageCountThreshold} messages. Analyzing...`);

    // 1) Analyze
    const results = await analyzeEmotes(rawMessagesBatch);

    // If we have significant moments, produce them to the aggregated topic
    if (results.length > 0) {
      try {
        // produce each significant moment individually, or as a batch
        for (const moment of results) {
          await producer.send({
            topic: AGG_TOPIC,
            messages: [{ value: JSON.stringify(moment) }],
          });
        }
        console.log(`Produced ${results.length} aggregated messages to ${AGG_TOPIC}`);
      } catch (err) {
        console.error('Failed to produce aggregated data:', err);
      }
    }

    // 2) Reset the batch
    rawMessagesBatch = [];
  }
}

// -----------------------------------------------------
// 5) Kafka consumer logic
// -----------------------------------------------------
async function startKafka() {
  // setInterval(async () => {
    await consumer.connect();
    await producer.connect();

    // Subscribe to the raw data topic
    await consumer.subscribe({ topic: RAW_TOPIC, fromBeginning: true });

    // Start consuming messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        await handleIncomingMessage(message);
      },
    });

    console.log(`Server B is consuming from topic "${RAW_TOPIC}"`);
  // }, 5500);
}

// -----------------------------------------------------
// 6) REST API for managing settings
// -----------------------------------------------------
const app = express();
app.use(bodyParser.json());


// -- INTERVAL SETTINGS -- //
app.get('/settings/interval', (req, res) => {
  res.json({ messageCountThreshold });
});

app.put('/settings/interval', (req, res) => {
  const { interval } = req.body;
  if (typeof interval === 'number') {
    messageCountThreshold = interval;
    res.json({ success: true, messageCountThreshold });
  } else {
    res.status(400).json({ error: 'Invalid interval' });
  }
});

// -- THRESHOLD SETTINGS -- //
app.get('/settings/threshold', (req, res) => {
  res.json({ significantEmoteThreshold });
});
app.put('/settings/threshold', (req, res) => {
  const { threshold } = req.body;
  if (typeof threshold === 'number') {
    significantEmoteThreshold = threshold;
    res.json({ success: true, significantEmoteThreshold });
  } else {
    res.status(400).json({ error: 'Invalid threshold' });
  }
});

// -- ALLOWED EMOTES SETTINGS -- //
app.get('/settings/allowed-emotes', (req, res) => {
  res.json({ allowedEmotes });
});

app.put('/settings/allowed-emotes', (req, res) => {
  const { emotes } = req.body;
  if (Array.isArray(emotes)) {
    allowedEmotes = emotes;
    res.json({ success: true, allowedEmotes });
  } else {
    res.status(400).json({ error: 'Invalid emotes list' });
  }
});

// app.put('/settings', (req, res) => {
//   const { newThreshold, newSignificance } = req.body;

//   if (newThreshold != null) {
//     messageCountThreshold = parseInt(newThreshold, 10);
//   }
//   if (newSignificance != null) {
//     significantEmoteThreshold = parseFloat(newSignificance);
//   }

//   return res.json({
//     success: true,
//     messageCountThreshold,
//     significantEmoteThreshold,
//   });
// });

// For convenience, we’ll run on port 3001 in the container
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server B REST API is listening on port ${PORT}`);
});

// -----------------------------------------------------
// 7) Start the consumer and producer
// -----------------------------------------------------
startKafka().catch((err) => {
  console.error('Error starting Kafka in Server B:', err);
});