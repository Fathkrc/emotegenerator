Group Project Documentation

Group Name: Karaca
Member: Fatih Karaca
Email: fatih.karaca@tuni.fi

Backend Components

Server A (server_a)

Role:
server_a acts as a bridge between Kafka and WebSocket clients.
Its main responsibilities are:

Consuming messages from a Kafka topic (aggregated-emote-data).
Broadcasting received messages to all connected WebSocket clients over WebSocket.
Flow Diagram:

Kafka -->|aggregated-emote-data| ServerA
ServerA -->|WebSocket messages| Clients
Technologies Used:


Technology	Purpose
Node.js	Runtime for server A
kafkajs	Kafka client library
ws	WebSocket server library
Configuration:

Kafka broker: Configurable via process.env.KAFKA_BROKER, defaults to localhost:9092.
Kafka consumer group: server_a_group.
Kafka topic subscribed: aggregated-emote-data.
WebSocket server: Listens on port 3000.
Code Location:
./backend/server_a/index.js

Key functionality:

Initializes a Kafka consumer.
Sets up a WebSocket server.
Receives messages from Kafka and broadcasts them to connected WebSocket clients.
Manages active client connections (adding/removing on connect/disconnect).

Server B (server_b)

Role:
server_b is responsible for:

Consuming raw emote data from the raw-emote-data topic.
Batching and analyzing incoming messages.
Publishing significant moments to the aggregated-emote-data topic.
Exposing a REST API for frontend interaction.
Workflow:

Consumes Kafka topic raw-emote-data.
Accumulates messages into a batch.
When messageCountThreshold is reached:
Groups messages by minute (timestamp sliced to minute granularity).
Calculates emote counts.
Marks emotes as "significant" if (count / totalEmotes) > significantEmoteThreshold.
Produces these significant moments to aggregated-emote-data.
Technologies Used:


Technology	Purpose
Node.js	Runtime for server B
kafkajs	Kafka consumer and producer
express	REST API server
body-parser	Middleware for parsing JSON
Configuration:

Kafka broker: From process.env.KAFKA_BROKER.
Listening Port: 3001 (inside container).
Topics:
Consuming: raw-emote-data
Producing: aggregated-emote-data
REST API Endpoints:


Endpoint	Method	Description
/settings/interval	GET/PUT	Get or update the message count threshold
/settings/threshold	GET/PUT	Get or update the significant emote threshold
/settings/allowed-emotes	GET/PUT	Get or update the list of allowed emotes
Testing:

The /settings GET endpoints were tested via Postman and working correctly.
POST/PUT endpoints are implemented and in progress for final debugging.
Code Location:
./backend/server_b/index.js

Frontend (frontend)

Role:
The frontend is a React application built with Vite. It:

Displays real-time significant moments received via WebSocket from Server A.
Allows users to view and update Server B settings through REST API calls.
Updates the page dynamically without full reloads.
Technologies Used:


Technology	Purpose
React (Vite)	Frontend framework
WebSocket API	Receiving live emote events
Fetch API	Communicating with Server B's REST API
Nginx	Serving the built frontend and proxying API calls
Docker	Containerization of frontend services
Key Features:

Live updates via WebSocket from ws://localhost:3000.
Settings are fetched from REST API endpoints at /api/settings/....
Form inputs allow modifying thresholds and allowed emotes.
Styled with simple but elegant CSS, using gradient backgrounds and responsive cards.
Frontend Deployment:

React app is built via Vite.
The built static files are served through Nginx.
Nginx is configured to:
Serve frontend files from /usr/share/nginx/html.
Proxy /api/ requests to Server B (running at http://server_b:3001 inside Docker).

Overall System Diagram

EmoteGen --> [Kafka raw-emote-data topic]
Server B --> [Kafka aggregated-emote-data topic]
Server A --> [WebSocket] --> Frontend (React)
Frontend --> [Fetch API /api/] --> Server B

Final Testing Status

✅ Kafka communication tested.
✅ WebSocket communication tested.
✅ REST API /settings GET tested.
✅ Frontend WebSocket live updates working.
🛠 Final POST/PUT API testing in progress.