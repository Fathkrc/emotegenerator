import { useEffect, useState } from 'react';

function App() {
  const [emotes, setEmotes] = useState([]);
  const [settings, setSettings] = useState({
    messageCountThreshold: '',
    significantEmoteThreshold: '',
    allowedEmotes: []
  });
  const [newSettings, setNewSettings] = useState({
    interval: '',
    threshold: '',
    emotes: ''
  });
  // const baseUrl = '/api';

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3000');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received from WebSocket:', data);
      setEmotes(prev => [...prev, data]);
    };

    fetchAllSettings();

    return () => ws.close();
  }, []);

  const fetchAllSettings = async () => {
    try {
      const baseUrl = '/api';
      const [intervalRes, thresholdRes, emotesRes] = await Promise.all([
        fetch(`${baseUrl}/settings/interval`),
        fetch(`${baseUrl}/settings/threshold`),
        fetch(`${baseUrl}/settings/allowed-emotes`)
      ]);
      const intervalData = await intervalRes.json();
      const thresholdData = await thresholdRes.json();
      const emotesData = await emotesRes.json();
  
      setSettings({
        messageCountThreshold: intervalData.messageCountThreshold,
        significantEmoteThreshold: thresholdData.significantEmoteThreshold,
        allowedEmotes: emotesData.allowedEmotes
      });
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    }
  };
  

  const updateSettings = async () => {
    try {
      const baseUrl = '/api';
  
      if (newSettings.interval) {
        await fetch(`${baseUrl}/settings/interval`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interval: parseInt(newSettings.interval, 10) })
        });
      }
  
      if (newSettings.threshold) {
        await fetch(`${baseUrl}/settings/threshold`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threshold: parseFloat(newSettings.threshold) })
        });
      }
  
      if (newSettings.emotes) {
        const emotesList = newSettings.emotes.split(',').map(e => e.trim());
        await fetch(`${baseUrl}/settings/allowed-emotes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emotes: emotesList })
        });
      }
  
      await fetchAllSettings();
      setNewSettings({ interval: '', threshold: '', emotes: '' });
    } catch (err) {
      console.error('Failed to update settings:', err);
    }
  };

  return (
    <div style={{ 
      padding: '20px',
      fontFamily: 'Comic Sans MS, Arial, sans-serif',
      background: 'linear-gradient(to bottom,rgb(167, 221, 228),rgb(154, 161, 227))',
      minHeight: '100vh'
    }}>
      <h1 style={{
        textAlign: 'center',
        fontSize: '40px',
        marginBottom: '30px',
        color: 'black'
      }}>
         Live Emote Stream 
      </h1>

      {/* Settings */}
      <div style={{
        backgroundColor: 'rgb(97, 174, 184)',
        padding: '20px',
        borderRadius: '15px',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
        margin: '0 auto 40px',
        maxWidth: '600px'
      }}>
        <h2 style={{
          color: '#333333',
          fontSize: '28px',
          marginBottom: '10px'
        }}>🛠️ Settings</h2>

        <p>📈 Message Count Threshold: <strong>{settings.messageCountThreshold}</strong></p>
        <p>✨ Significant Emote Threshold: <strong>{settings.significantEmoteThreshold}</strong></p>
        <p>❤️ Allowed Emotes: <strong>{settings.allowedEmotes.join(' ')}</strong></p>

        <input
          type="number"
          placeholder="New Interval (number)"
          value={newSettings.interval}
          onChange={(e) => setNewSettings(prev => ({ ...prev, interval: e.target.value }))}
          style={{ width: '48%', padding: '10px', margin: '10px 1% 10px 0', borderRadius: '10px', border: '2px solid #00796B' }}
        />
        <input
          type="number"
          step="0.01"
          placeholder="New Threshold (0.0-1.0)"
          value={newSettings.threshold}
          onChange={(e) => setNewSettings(prev => ({ ...prev, threshold: e.target.value }))}
          style={{ width: '48%', padding: '10px', margin: '10px 0 10px 1%', borderRadius: '10px', border: '2px solid #00796B' }}
        />
        <input
          type="text"
          placeholder="New Allowed Emotes (comma separated)"
          value={newSettings.emotes}
          onChange={(e) => setNewSettings(prev => ({ ...prev, emotes: e.target.value }))}
          style={{ width: '100%', padding: '10px', marginTop: '10px', borderRadius: '10px', border: '2px solid #00796B' }}
        />
        <button
          onClick={updateSettings}
          style={{
            width: '100%',
            backgroundColor: '#00796B',
            color: 'white',
            padding: '12px',
            marginTop: '10px',
            fontSize: '16px',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer'
          }}
        >
          🔧 Update Settings
        </button>
      </div>

      {/* Emotes List */}
      <div style={{
        marginTop: '40px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        padding: '0 20px'
      }}>
        {emotes.map((emote, index) => (
          <div key={index} style={{
            backgroundColor: '#ffffff',
            padding: '20px',
            borderRadius: '15px',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
            textAlign: 'center',
            fontSize: '30px',
            transition: 'transform 0.2s',
          }}>
            <div style={{ fontSize: '50px' }}>{emote.emote}</div>
            <div style={{ fontSize: '16px', color: '#555' }}>{emote.timestamp}</div>
            <div style={{ fontSize: '18px', marginTop: '10px' }}>{emote.count}/{emote.totalEmotes}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
