import { BaseAgent } from '../base-agent';
import { Logger } from 'winston';
import { AgentOrchestrator, AgentMessage } from '../orchestrator';

interface Notification {
  notificationId: string;
  alertId?: string;
  disasterId?: string;
  channel: 'sms' | 'email' | 'push' | 'webhook' | 'social';
  recipient: {
    id: string;
    type: 'individual' | 'group' | 'broadcast';
    contact: string;
    preferences?: NotificationPreferences;
  };
  message: {
    title: string;
    body: string;
    priority: 'urgent' | 'high' | 'normal' | 'low';
    mediaAttachments?: string[];
    actionButtons?: { label: string; action: string }[];
  };
  status: 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'read';
  attempts: number;
  lastAttempt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  error?: string;
}

interface NotificationPreferences {
  channels: string[];
  quietHours?: { start: string; end: string };
  language: string;
  alertTypes: string[];
}

interface NotificationBatch {
  batchId: string;
  alertId: string;
  totalRecipients: number;
  successCount: number;
  failureCount: number;
  inProgressCount: number;
  startTime: Date;
  completionTime?: Date;
  channels: string[];
}

interface ChannelConfig {
  name: string;
  enabled: boolean;
  rateLimit: number; // messages per minute
  priority: number; // 1-5, lower is higher priority
  retryAttempts: number;
  timeout: number; // seconds
}

export class NotificationManagerAgent extends BaseAgent {
  private notificationQueue: Notification[] = [];
  private activeNotifications: Map<string, Notification> = new Map();
  private notificationBatches: Map<string, NotificationBatch> = new Map();
  private channelConfigs: Map<string, ChannelConfig> = new Map();
  private recipientRegistry: Map<string, NotificationPreferences> = new Map();
  private notificationStats = {
    totalSent: 0,
    totalDelivered: 0,
    totalFailed: 0,
    averageDeliveryTime: 0,
    channelSuccess: new Map<string, number>(),
  };

  constructor(logger: Logger, orchestrator: AgentOrchestrator) {
    super(
      'NotificationManager',
      'Manages multi-channel notification delivery',
      logger,
      orchestrator
    );
    this.initializeChannels();
    this.initializeRecipientRegistry();
  }

  protected async initialize(): Promise<void> {
    this.logger.info(`${this.name} initializing notification system...`);
    this.setupNotificationServices();
    this.logActivity('Notification system online');
  }

  private initializeChannels(): void {
    this.channelConfigs.set('sms', {
      name: 'SMS',
      enabled: true,
      rateLimit: 100,
      priority: 1,
      retryAttempts: 3,
      timeout: 30,
    });
    
    this.channelConfigs.set('email', {
      name: 'Email',
      enabled: true,
      rateLimit: 500,
      priority: 3,
      retryAttempts: 2,
      timeout: 60,
    });
    
    this.channelConfigs.set('push', {
      name: 'Push Notification',
      enabled: true,
      rateLimit: 1000,
      priority: 2,
      retryAttempts: 2,
      timeout: 10,
    });
    
    this.channelConfigs.set('webhook', {
      name: 'Webhook',
      enabled: true,
      rateLimit: 200,
      priority: 4,
      retryAttempts: 3,
      timeout: 30,
    });
    
    this.channelConfigs.set('social', {
      name: 'Social Media',
      enabled: true,
      rateLimit: 50,
      priority: 5,
      retryAttempts: 1,
      timeout: 30,
    });
  }

  private initializeRecipientRegistry(): void {
    // Simulate recipient preferences
    for (let i = 0; i < 100; i++) {
      this.recipientRegistry.set(`user_${i}`, {
        channels: ['sms', 'email', 'push'],
        language: 'en',
        alertTypes: ['emergency', 'warning', 'advisory'],
        quietHours: i % 3 === 0 ? { start: '22:00', end: '07:00' } : undefined,
      });
    }
    
    // Add broadcast groups
    this.recipientRegistry.set('broadcast_all', {
      channels: ['sms', 'email', 'push', 'social'],
      language: 'en',
      alertTypes: ['all'],
    });
    
    this.recipientRegistry.set('first_responders', {
      channels: ['sms', 'push', 'webhook'],
      language: 'en',
      alertTypes: ['emergency', 'warning'],
    });
  }

  private setupNotificationServices(): void {
    // Initialize connections to notification services
    // In production, this would setup Twilio, SendGrid, FCM, etc.
    this.logger.info(`${this.name} notification services configured`);
  }

  protected async process(): Promise<void> {
    try {
      // Process notification queue
      this.processNotificationQueue();
      
      // Retry failed notifications
      this.retryFailedNotifications();
      
      // Update notification statuses
      this.updateNotificationStatuses();
      
      // Process batch notifications
      this.processBatchNotifications();
      
      // Calculate statistics
      this.calculateStatistics();
      
      // Update status
      this.updateStatus({
        status: 'online',
        message: 'Processing notifications',
        metrics: {
          queueSize: this.notificationQueue.length,
          activeNotifications: this.activeNotifications.size,
          totalSent: this.notificationStats.totalSent,
          deliveryRate: this.calculateDeliveryRate(),
        },
      });
    } catch (error) {
      this.logger.error(`${this.name} processing error:`, error);
      this.updateStatus({
        status: 'warning',
        message: 'Notification processing error',
      });
    }
  }

  protected handleMessage(message: AgentMessage): void {
    switch (message.type) {
      case 'send_notifications':
        this.createNotificationBatch(message.data);
        break;
        
      case 'distribute_alert':
        this.distributeAlert(message.data);
        break;
        
      case 'execute_action':
        this.executeNotificationAction(message.data);
        break;
        
      case 'send_notification':
        this.sendSingleNotification(message.data);
        break;
        
      case 'update_preferences':
        this.updateRecipientPreferences(message.data);
        break;
        
      case 'cancel_batch':
        this.cancelNotificationBatch(message.data.batchId);
        break;
        
      case 'request_stats':
        this.provideStatistics(message.from);
        break;
        
      default:
        this.logger.debug(`${this.name} received unhandled message type: ${message.type}`);
    }
  }

  private createNotificationBatch(data: any): void {
    this.logger.info(`${this.name} creating notification batch for ${data.disasterId}`);
    
    const batch: NotificationBatch = {
      batchId: `batch_${Date.now()}`,
      alertId: data.alertId || data.disasterId,
      totalRecipients: 0,
      successCount: 0,
      failureCount: 0,
      inProgressCount: 0,
      startTime: new Date(),
      channels: data.channels || ['sms', 'email', 'push'],
    };
    
    // Identify recipients based on location and preferences
    const recipients = this.identifyRecipients(data);
    batch.totalRecipients = recipients.length;
    batch.inProgressCount = recipients.length;
    
    // Create notifications for each recipient
    for (const recipient of recipients) {
      const channels = this.selectChannelsForRecipient(recipient, data);
      
      for (const channel of channels) {
        const notification = this.createNotification(
          recipient,
          channel as Notification['channel'],
          data
        );
        
        this.notificationQueue.push(notification);
      }
    }
    
    this.notificationBatches.set(batch.batchId, batch);
    
    this.logActivity('Notification batch created', {
      batchId: batch.batchId,
      recipients: batch.totalRecipients,
      channels: batch.channels.join(', '),
    });
  }

  private identifyRecipients(data: any): any[] {
    const recipients: any[] = [];
    
    // Add affected area recipients
    if (data.affectedArea) {
      // Simulate geofenced recipients
      const affectedCount = Math.floor(Math.random() * 50) + 10;
      for (let i = 0; i < affectedCount; i++) {
        recipients.push({
          id: `user_${Math.floor(Math.random() * 100)}`,
          type: 'individual',
          contact: `+1555000${String(i).padStart(4, '0')}`,
        });
      }
    }
    
    // Add target audience groups
    if (data.audience) {
      for (const audienceType of data.audience) {
        if (audienceType === 'first_responders') {
          recipients.push({
            id: 'first_responders',
            type: 'group',
            contact: 'first_responders@emergency.gov',
          });
        }
        if (audienceType === 'residents') {
          recipients.push({
            id: 'broadcast_all',
            type: 'broadcast',
            contact: 'all',
          });
        }
      }
    }
    
    return recipients;
  }

  private selectChannelsForRecipient(recipient: any, data: any): string[] {
    const preferences = this.recipientRegistry.get(recipient.id);
    
    if (!preferences) {
      // Default channels for unknown recipients
      return data.priority === 'urgent' ? ['sms', 'push'] : ['email'];
    }
    
    // Check quiet hours
    if (preferences.quietHours && !this.isUrgent(data)) {
      const now = new Date();
      const currentTime = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      if (this.isInQuietHours(currentTime, preferences.quietHours)) {
        return ['email']; // Only email during quiet hours for non-urgent
      }
    }
    
    // Filter by alert type preferences
    const alertType = data.type || 'advisory';
    if (!preferences.alertTypes.includes(alertType) && !preferences.alertTypes.includes('all')) {
      return [];
    }
    
    // Return preferred channels that are available
    return preferences.channels.filter(ch => 
      this.channelConfigs.get(ch)?.enabled && 
      (data.channels ? data.channels.includes(ch) : true)
    );
  }

  private isUrgent(data: any): boolean {
    return data.priority === 'urgent' || 
           data.severity === 'critical' || 
           data.type === 'emergency';
  }

  private isInQuietHours(currentTime: string, quietHours: { start: string; end: string }): boolean {
    const [currentHour, currentMin] = currentTime.split(':').map(Number);
    const [startHour, startMin] = quietHours.start.split(':').map(Number);
    const [endHour, endMin] = quietHours.end.split(':').map(Number);
    
    const current = currentHour * 60 + currentMin;
    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;
    
    if (start <= end) {
      return current >= start && current <= end;
    } else {
      // Quiet hours span midnight
      return current >= start || current <= end;
    }
  }

  private createNotification(
    recipient: any,
    channel: Notification['channel'],
    data: any
  ): Notification {
    const notification: Notification = {
      notificationId: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      alertId: data.alertId,
      disasterId: data.disasterId,
      channel: channel,
      recipient: {
        id: recipient.id,
        type: recipient.type,
        contact: recipient.contact,
        preferences: this.recipientRegistry.get(recipient.id),
      },
      message: {
        title: data.alert?.title || data.title || 'Emergency Alert',
        body: this.formatMessageForChannel(data.alert?.message || data.message, channel),
        priority: this.determineMessagePriority(data),
        actionButtons: this.generateActionButtons(data, channel),
      },
      status: 'queued',
      attempts: 0,
    };
    
    return notification;
  }

  private formatMessageForChannel(message: string, channel: string): string {
    if (!message) return 'Emergency alert - follow official instructions';
    
    switch (channel) {
      case 'sms':
        // SMS has character limits
        return message.length > 160 ? message.substring(0, 157) + '...' : message;
        
      case 'email':
        // Email can have full content with formatting
        return `<html><body><h2>Emergency Alert</h2><p>${message}</p></body></html>`;
        
      case 'push':
        // Push notifications have moderate length
        return message.length > 250 ? message.substring(0, 247) + '...' : message;
        
      case 'social':
        // Social media posts
        return message.length > 280 ? message.substring(0, 277) + '...' : message;
        
      default:
        return message;
    }
  }

  private determineMessagePriority(data: any): 'urgent' | 'high' | 'normal' | 'low' {
    if (data.severity === 'critical' || data.priority === 1) return 'urgent';
    if (data.severity === 'high' || data.priority === 2) return 'high';
    if (data.severity === 'low' || data.priority >= 4) return 'low';
    return 'normal';
  }

  private generateActionButtons(data: any, channel: string): { label: string; action: string }[] {
    if (channel !== 'push' && channel !== 'email') return [];
    
    const buttons: { label: string; action: string }[] = [];
    
    if (data.type === 'evacuation') {
      buttons.push({ label: 'View Route', action: 'view_route' });
      buttons.push({ label: 'Find Shelter', action: 'find_shelter' });
    } else {
      buttons.push({ label: 'View Details', action: 'view_alert' });
      buttons.push({ label: 'Acknowledge', action: 'acknowledge' });
    }
    
    return buttons;
  }

  private distributeAlert(data: any): void {
    this.logger.info(`${this.name} distributing alert ${data.alert?.alertId}`);
    
    // Create batch notification for alert distribution
    this.createNotificationBatch({
      ...data,
      alertId: data.alert?.alertId,
      priority: 'urgent',
      message: data.alert?.message,
      title: data.alert?.title,
    });
  }

  private processNotificationQueue(): void {
    const channelLimits = new Map<string, number>();
    
    // Initialize rate limits
    for (const [channel, config] of this.channelConfigs) {
      channelLimits.set(channel, config.rateLimit / 4); // Per 15-second interval
    }
    
    // Process queue respecting rate limits
    const toProcess = [...this.notificationQueue];
    this.notificationQueue = [];
    
    for (const notification of toProcess) {
      const limit = channelLimits.get(notification.channel) || 0;
      
      if (limit > 0) {
        this.sendNotification(notification);
        channelLimits.set(notification.channel, limit - 1);
      } else {
        // Re-queue if rate limit exceeded
        this.notificationQueue.push(notification);
      }
    }
  }

  private sendNotification(notification: Notification): void {
    notification.status = 'sending';
    notification.attempts++;
    notification.lastAttempt = new Date();
    
    this.activeNotifications.set(notification.notificationId, notification);
    
    // Simulate sending via channel
    const success = this.simulateSend(notification);
    
    if (success) {
      notification.status = 'sent';
      notification.deliveredAt = new Date();
      this.notificationStats.totalSent++;
      
      // Update channel success stats
      const currentSuccess = this.notificationStats.channelSuccess.get(notification.channel) || 0;
      this.notificationStats.channelSuccess.set(notification.channel, currentSuccess + 1);
      
      this.logActivity('Notification sent', {
        notificationId: notification.notificationId,
        channel: notification.channel,
        recipient: notification.recipient.id,
      });
    } else {
      notification.status = 'failed';
      notification.error = 'Delivery failed';
      this.notificationStats.totalFailed++;
    }
    
    // Update batch statistics
    if (notification.alertId) {
      this.updateBatchStatistics(notification);
    }
  }

  private simulateSend(notification: Notification): boolean {
    // Simulate channel-specific success rates
    const successRates = {
      'sms': 0.95,
      'email': 0.98,
      'push': 0.92,
      'webhook': 0.99,
      'social': 0.90,
    };
    
    return Math.random() < (successRates[notification.channel] || 0.9);
  }

  private updateBatchStatistics(notification: Notification): void {
    for (const [batchId, batch] of this.notificationBatches) {
      if (batch.alertId === notification.alertId) {
        if (notification.status === 'sent' || notification.status === 'delivered') {
          batch.successCount++;
          batch.inProgressCount--;
        } else if (notification.status === 'failed') {
          batch.failureCount++;
          batch.inProgressCount--;
        }
        
        // Check if batch is complete
        if (batch.inProgressCount === 0 && !batch.completionTime) {
          batch.completionTime = new Date();
          this.logActivity('Notification batch completed', {
            batchId: batchId,
            successRate: (batch.successCount / batch.totalRecipients * 100).toFixed(1),
          });
        }
        
        break;
      }
    }
  }

  private retryFailedNotifications(): void {
    for (const [id, notification] of this.activeNotifications) {
      if (notification.status === 'failed') {
        const config = this.channelConfigs.get(notification.channel);
        
        if (config && notification.attempts < config.retryAttempts) {
          // Add back to queue for retry
          notification.status = 'queued';
          this.notificationQueue.push(notification);
          this.activeNotifications.delete(id);
        }
      }
    }
  }

  private updateNotificationStatuses(): void {
    for (const [id, notification] of this.activeNotifications) {
      if (notification.status === 'sent') {
        // Simulate delivery confirmation
        if (Math.random() > 0.05) {
          notification.status = 'delivered';
          notification.deliveredAt = new Date();
          this.notificationStats.totalDelivered++;
          
          // Simulate read receipts for some channels
          if ((notification.channel === 'email' || notification.channel === 'push') && Math.random() > 0.7) {
            notification.status = 'read';
            notification.readAt = new Date();
          }
        }
      }
    }
  }

  private processBatchNotifications(): void {
    // Clean up old completed batches
    const now = Date.now();
    for (const [batchId, batch] of this.notificationBatches) {
      if (batch.completionTime && (now - batch.completionTime.getTime() > 3600000)) {
        this.notificationBatches.delete(batchId);
      }
    }
  }

  private calculateStatistics(): void {
    if (this.notificationStats.totalSent > 0) {
      // Calculate average delivery time
      let totalDeliveryTime = 0;
      let deliveredCount = 0;
      
      for (const [id, notification] of this.activeNotifications) {
        if (notification.deliveredAt && notification.lastAttempt) {
          totalDeliveryTime += notification.deliveredAt.getTime() - notification.lastAttempt.getTime();
          deliveredCount++;
        }
      }
      
      if (deliveredCount > 0) {
        this.notificationStats.averageDeliveryTime = totalDeliveryTime / deliveredCount / 1000; // in seconds
      }
    }
  }

  private calculateDeliveryRate(): number {
    const total = this.notificationStats.totalSent;
    if (total === 0) return 0;
    
    const delivered = this.notificationStats.totalDelivered;
    return (delivered / total) * 100;
  }

  private executeNotificationAction(data: any): void {
    if (data.action?.description?.toLowerCase().includes('notif')) {
      this.createNotificationBatch({
        ...data,
        priority: data.priority,
      });
    }
  }

  private sendSingleNotification(data: any): void {
    const notification = this.createNotification(
      data.recipient,
      data.channel,
      data
    );
    
    this.notificationQueue.push(notification);
    
    this.logActivity('Single notification queued', {
      notificationId: notification.notificationId,
      channel: notification.channel,
    });
  }

  private updateRecipientPreferences(data: any): void {
    const { recipientId, preferences } = data;
    this.recipientRegistry.set(recipientId, preferences);
    
    this.logActivity('Recipient preferences updated', { recipientId });
  }

  private cancelNotificationBatch(batchId: string): void {
    const batch = this.notificationBatches.get(batchId);
    if (batch) {
      // Remove queued notifications for this batch
      this.notificationQueue = this.notificationQueue.filter(n => n.alertId !== batch.alertId);
      
      // Mark batch as canceled
      batch.completionTime = new Date();
      
      this.logActivity('Notification batch canceled', { batchId });
    }
  }

  private provideStatistics(requester: string): void {
    this.sendMessage(requester, 'notification_stats', {
      stats: this.notificationStats,
      activeBatches: this.notificationBatches.size,
      queueSize: this.notificationQueue.length,
      channelStatus: Array.from(this.channelConfigs.entries()).map(([channel, config]) => ({
        channel,
        enabled: config.enabled,
        successRate: (this.notificationStats.channelSuccess.get(channel) || 0) / 
                    (this.notificationStats.totalSent || 1) * 100,
      })),
    });
  }

  protected cleanup(): void {
    this.notificationQueue = [];
    this.activeNotifications.clear();
    this.notificationBatches.clear();
    this.notificationStats = {
      totalSent: 0,
      totalDelivered: 0,
      totalFailed: 0,
      averageDeliveryTime: 0,
      channelSuccess: new Map(),
    };
  }

  protected getProcessingInterval(): number {
    return 15000; // Process every 15 seconds for timely delivery
  }
}