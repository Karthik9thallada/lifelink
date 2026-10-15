import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useAuth();
  const [connected, setConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const stompClientRef = useRef(null);
  const subscriptionsRef = useRef(new Map());

  useEffect(() => {
    // Determine broker URL: explicit VITE_WS_BASE_URL, derived from VITE_API_BASE_URL, or current host
    let brokerUrl;
    if (import.meta.env.VITE_WS_BASE_URL) {
      brokerUrl = import.meta.env.VITE_WS_BASE_URL;
    } else if (import.meta.env.VITE_API_BASE_URL) {
      const base = import.meta.env.VITE_API_BASE_URL
        .replace(/^http:\/\//i, 'ws://')
        .replace(/^https:\/\//i, 'wss://')
        .replace(/\/api\/?$/i, '')
        .replace(/\/+$/, '');
      brokerUrl = `${base}/ws`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      brokerUrl = `${protocol}//${window.location.host}/ws`;
    }

    const client = new Client({
      brokerURL: brokerUrl,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        // Uncomment for debug logs: console.log('[STOMP]', str);
      },
      onConnect: () => {
        console.log('✅ LifeLink STOMP WebSocket Connected');
        setConnected(true);

        // Subscribe to global emergency requests feed
        client.subscribe('/topic/requests', (message) => {
          try {
            const body = JSON.parse(message.body);
            handleIncomingLiveEvent(body);
          } catch (e) {
            console.error('Failed to parse WS message:', e);
          }
        });
      },
      onDisconnect: () => {
        console.log('❌ LifeLink STOMP WebSocket Disconnected');
        setConnected(false);
      },
      onStompError: (frame) => {
        console.error('STOMP Broker error: ' + frame.headers['message']);
        setConnected(false);
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
      setConnected(false);
    };
  }, []);

  const handleIncomingLiveEvent = (event) => {
    setLiveEvents((prev) => [
      { ...event, id: Date.now() + Math.random() },
      ...prev.slice(0, 19), // Keep latest 20 events
    ]);
  };

  /**
   * Subscribe to a custom topic (e.g. /topic/requests/1 or /topic/donors/5)
   */
  const subscribeToTopic = (topic, onMessage) => {
    const client = stompClientRef.current;
    if (!client || !client.connected) {
      // If not yet connected, retry after short delay
      const timeout = setTimeout(() => {
        if (stompClientRef.current?.connected) {
          subscribeToTopic(topic, onMessage);
        }
      }, 1000);
      return () => clearTimeout(timeout);
    }

    const sub = client.subscribe(topic, (message) => {
      try {
        const body = JSON.parse(message.body);
        handleIncomingLiveEvent(body);
        if (onMessage) onMessage(body);
      } catch (e) {
        console.error('Error handling topic message:', e);
      }
    });

    return () => {
      try {
        sub.unsubscribe();
      } catch (e) {
        // Ignore unsubscription error on teardown
      }
    };
  };

  const clearEvents = () => setLiveEvents([]);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        liveEvents,
        subscribeToTopic,
        clearEvents,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
