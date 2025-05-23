# Server A

This directory is for the code and documentation of the _server A_. A starter Dockerfile has been added, it has some comments to get you started.

Server A acts as a consumer for at least the _aggregated-emote-data_ topic. You may want to consume also the _raw-emote-data_ topic. Consume the messages and publish those to each WebSocket client.

To get started you should run `npm init` in this directory to initialize the Node project. This will create a `package.json`-file, which is used to define the project's attributes, dependencies etc. You should next create the index.js file.
System Architecture

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