import { WebSocketServer, WebSocket } from 'ws';
import { client } from '../db';

export function setupDashboardWebSocket(wss: WebSocketServer) {
  wss.on('connection', (ws: WebSocket, req: any) => {
    console.log('Dashboard WebSocket connected');
    
    // Extract userId from query parameters
    const url = new URL(req.url, 'http://localhost');
    const userId = url.searchParams.get('userId');
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      timestamp: new Date().toISOString(),
      userId: userId
    }));
    
    // Handle dashboard subscriptions
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'subscribe_analytics':
            // Send real-time analytics updates
            const metrics = await getRealTimeMetrics();
            ws.send(JSON.stringify({
              type: 'dashboard_analytics_update',
              data: metrics,
              timestamp: new Date().toISOString()
            }));
            break;
            
          case 'subscribe_user_dashboard':
            // Send user-specific dashboard updates
            if (data.userId) {
              const userData = await getUserDashboardData(data.userId);
              ws.send(JSON.stringify({
                type: 'user_dashboard_update',
                data: userData,
                timestamp: new Date().toISOString()
              }));
            }
            break;
            
          case 'subscribe_builder_dashboard':
            // Send builder-specific dashboard updates
            if (data.userId) {
              const builderData = await getBuilderDashboardData(data.userId);
              ws.send(JSON.stringify({
                type: 'builder_dashboard_update',
                data: builderData,
                timestamp: new Date().toISOString()
              }));
            }
            break;
            
          case 'subscribe_end_user_dashboard':
            // Send end-user-specific dashboard updates
            if (data.userId) {
              const endUserData = await getEndUserDashboardData(data.userId);
              ws.send(JSON.stringify({
                type: 'end_user_dashboard_update',
                data: endUserData,
                timestamp: new Date().toISOString()
              }));
            }
            break;
            
          case 'subscribe_admin_updates':
            // Send admin-specific updates
            const adminData = await getAdminData();
            ws.send(JSON.stringify({
              type: 'admin_users_update',
              data: adminData,
              timestamp: new Date().toISOString()
            }));
            break;
            
          default:
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Unknown message type',
              timestamp: new Date().toISOString()
            }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          timestamp: new Date().toISOString()
        }));
      }
    });
    
    ws.on('close', () => {
      console.log('Dashboard WebSocket disconnected');
    });
    
    ws.on('error', (error) => {
      console.error('Dashboard WebSocket error:', error);
    });
  });
}

async function getRealTimeMetrics() {
  try {
    // Refresh materialized view
    await client`REFRESH MATERIALIZED VIEW dashboard_platform_metrics`;
    
    // Get updated metrics
    const metrics = await client`SELECT * FROM dashboard_platform_metrics`;
    return metrics[0] || {};
  } catch (error) {
    console.error('Error getting real-time metrics:', error);
    return {};
  }
}

async function getUserDashboardData(userId: string) {
  try {
    const userData = await client`
      SELECT * FROM users WHERE id = ${userId}
    `;
    return userData[0] || {};
  } catch (error) {
    console.error('Error getting user dashboard data:', error);
    return {};
  }
}

async function getBuilderDashboardData(userId: string) {
  try {
    const builderData = await client`
      SELECT * FROM builder_performance WHERE builder_id = ${userId}
    `;
    return builderData[0] || {};
  } catch (error) {
    console.error('Error getting builder dashboard data:', error);
    return {};
  }
}

async function getEndUserDashboardData(userId: string) {
  try {
    const endUserData = await client`
      SELECT * FROM end_user_activity WHERE user_id = ${userId}
    `;
    return endUserData[0] || {};
  } catch (error) {
    console.error('Error getting end user dashboard data:', error);
    return {};
  }
}

async function getAdminData() {
  try {
    const userStats = await client`
      SELECT 
        persona,
        approval_status,
        COUNT(*) as count
      FROM users
      GROUP BY persona, approval_status
      ORDER BY persona, approval_status
    `;
    
    const pendingApprovals = await client`
      SELECT COUNT(*) as count
      FROM users
      WHERE approval_status = 'pending'
    `;
    
    return {
      userStatistics: userStats,
      pendingApprovals: pendingApprovals[0]?.count || 0
    };
  } catch (error) {
    console.error('Error getting admin data:', error);
    return {};
  }
}

// Function to broadcast updates to all connected clients
export function broadcastUpdate(type: string, data: any) {
  if (wss) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString()
        }));
      }
    });
  }
}

// Store WebSocket server reference for broadcasting
let wss: WebSocketServer | null = null;

export function setWebSocketServer(server: WebSocketServer) {
  wss = server;
}
