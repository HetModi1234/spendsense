import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      const serverUrl = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace('/api', '')
        : 'http://localhost:5000';

      const s = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5
      });

      setSocket(s);

      return () => {
        s.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    }
  }, [user]);

  const joinGroup = (groupId) => {
    if (socket && groupId) {
      socket.emit('join_group', groupId);
    }
  };

  const leaveGroup = (groupId) => {
    if (socket && groupId) {
      socket.emit('leave_group', groupId);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, joinGroup, leaveGroup }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
