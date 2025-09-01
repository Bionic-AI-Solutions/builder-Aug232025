import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketMessage {
    type: string;
    data: any;
    timestamp: string;
}

export const useDashboardWebSocket = (userId?: string) => {
    const wsRef = useRef<WebSocket | null>(null);
    const queryClient = useQueryClient();

    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }

        // Use dynamic WebSocket URL based on current window location
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws/dashboard${userId ? `?userId=${userId}` : ''}`;

        console.log('Connecting to WebSocket:', wsUrl);
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => {
            console.log('Dashboard WebSocket connected');
        };

        wsRef.current.onmessage = (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);

                // Handle different message types
                switch (message.type) {
                    case 'dashboard_analytics_update':
                        queryClient.invalidateQueries({ queryKey: ['dashboard', 'analytics'] });
                        break;
                    case 'builder_dashboard_update':
                        if (userId) {
                            queryClient.invalidateQueries({ queryKey: ['dashboard', 'builder', userId] });
                        }
                        break;
                    case 'end_user_dashboard_update':
                        if (userId) {
                            queryClient.invalidateQueries({ queryKey: ['dashboard', 'end-user', userId] });
                        }
                        break;
                    case 'admin_users_update':
                        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
                        queryClient.invalidateQueries({ queryKey: ['admin', 'statistics'] });
                        break;
                    case 'user_approval_update':
                        queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
                        queryClient.invalidateQueries({ queryKey: ['admin', 'statistics'] });
                        break;
                    default:
                        console.log('Unknown WebSocket message type:', message.type);
                }
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        wsRef.current.onerror = (error) => {
            console.error('Dashboard WebSocket error:', error);
        };

        wsRef.current.onclose = () => {
            console.log('Dashboard WebSocket disconnected');
            // Attempt to reconnect after 5 seconds
            setTimeout(() => {
                if (wsRef.current?.readyState === WebSocket.CLOSED) {
                    connect();
                }
            }, 5000);
        };
    }, [userId, queryClient]);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    useEffect(() => {
        connect();

        return () => {
            disconnect();
        };
    }, [connect, disconnect]);

    return {
        isConnected: wsRef.current?.readyState === WebSocket.OPEN,
        sendMessage: (message: any) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify(message));
            }
        },
    };
};


