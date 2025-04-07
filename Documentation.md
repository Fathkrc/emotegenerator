Groups name:karaca
fatih karaca
fatih.karaca@tuni.fi


# Project Documentation

Component: server_a
server_a acts as a bridge between Kafka and WebSocket clients. Its main responsibilities are:

Consuming messages from a Kafka topic (aggregated-emote-data)
Broadcasting received messages to all connected WebSocket clients
Flow Diagram

graph TD
  Kafka -->|aggregated-emote-data| ServerA
  ServerA -->|WebSocket messages| Clients
Technologies Used

Node.js – the runtime for the server
kafkajs – Kafka client used to connect to Kafka broker, subscribe to topics, and receive messages
ws – WebSocket library used to set up real-time communication between server_a and clients
Code Location ./backend/server_a/index.js
This is the main entry point for server_a. It initializes the Kafka consumer, sets up the WebSocket server, and handles incoming messages.
It also manages the list of active WebSocket clients and broadcasts messages received from Kafka to all connected clients.


Kafka Configuration

Kafka broker: configurable via process.env.KAFKA_BROKER, defaults to localhost:9092
Consumer group: server_a_group
Subscribed topic: aggregated-emote-data
WebSocket Configuration

Listens on port 3000
Maintains a list of active WebSocket clients and broadcasts messages from Kafka to all of them
Component: server_b
Server B implementation is responsible for consuming messages from the raw-emote-data topic, analyzing them, and producing 
significant moments to the aggregated-emote-data topic. It also exposes a REST API to get and update the thresholds.:

Consuming from the raw-emote-data topic.
Batching messages until count hit messageCountThreshold.
Analyzing those messages by slicing the timestamp to minute-level granularity (record.timestamp.slice(0, 16)).
Producing “significant moments” to aggregated-emote-data.
Exposing a REST API to get and update the threshold (messageCountThreshold and significantEmoteThreshold).

I have tested the postman /get test and it is working.

I need to debug the /post test and then I will dockerize it.
I will start to frontend and dockerize them all .