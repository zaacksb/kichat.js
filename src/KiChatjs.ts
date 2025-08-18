
import EventEmitter from "./lib/EventEmitter";
import { KiChannel, ChannelInfo, ChatroomInfo } from "./lib/KiChannel";
import * as KickEvents from "./types/events";
import type { WebSocket as NodeWebSocket } from 'ws';

export const parseJSON = <T>(json: string): T | null => {
  try {
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
};

export interface ClientOptions {
  channels?: string[];
  reconnect?: boolean;
  reconnectMaxAttempts?: number;
  reconnectInitialTimeout?: number;
  reconnectMaxTimeout?: number;
}

export type ConnectionEvents = {
  connected: [];
  disconnected: [reason: string];
  reconnecting: [];
  socketError: [error: Error];
  join: [channel: KiChannel];
  leave: [channel: KiChannel, reason?: string];
};

export type ChatEvents = {
  message: [message: KickEvents.MessageData, channel: KiChannel];
  subscription: [message: KickEvents.Subscription, channel: KiChannel];
  giftedSubscriptions: [message: KickEvents.GiftedSubscriptionsEvent, channel: KiChannel];
  streamHost: [message: KickEvents.StreamHostEvent, channel: KiChannel];
  userBanned: [message: KickEvents.UserBannedEvent, channel: KiChannel];
  userUnbanned: [message: KickEvents.UserUnbannedEvent, channel: KiChannel];
  messageDeleted: [message: KickEvents.MessageDeletedEvent, channel: KiChannel];
  pinnedMessageCreated: [message: KickEvents.PinnedMessageCreatedEvent, channel: KiChannel];
  pinnedMessageDeleted: [message: KickEvents.MessageDeletedEvent, channel: KiChannel];
  chatroomUpdated: [message: KickEvents.ChatroomUpdatedEvent, channel: KiChannel];
  pollUpdate: [message: KickEvents.PollUpdateEvent, channel: KiChannel];
  pollDelete: [channel: KiChannel];
  streamerIsLive: [message: KickEvents.StreamerIsLiveEvent, channel: KiChannel];
  stopStreamBroadcast: [message: KickEvents.StopStreamBroadcastEvent, channel: KiChannel];
  goalCreated: [message: KickEvents.GoalEvent, channel: KiChannel];
  goalCanceled: [message: KickEvents.GoalEvent, channel: KiChannel];
  goalProgressUpdate: [message: KickEvents.GoalEvent, channel: KiChannel];
  livestreamUpdated: [message: KickEvents.LivestreamUpdatedEvent, channel: KiChannel];
  predictionCreated: [message: { prediction: KickEvents.PredictionBase & { state: "ACTIVE" } }, channel: KiChannel];
  predictionUpdated: [message: KickEvents.PredictionEvent, channel: KiChannel];
  rewardRedeemed: [message: KickEvents.RewardRedeemedEvent, channel: KiChannel];
  channelSubscription: [message: KickEvents.ChannelSubscriptionEvent, channel: KiChannel];
  luckyUsersWhoGotGiftSubscriptions: [message: KickEvents.LuckyUsersWhoGotGiftSubscriptionsEvent, channel: KiChannel];
  videoPrivated: [message: KickEvents.VideoPrivatedEvent, channel: KiChannel];
  giftsLeaderboardUpdated: [message: KickEvents.GiftsLeaderboardUpdatedEvent, channel: KiChannel];
  chatMoveToSupportedChannel: [message: KickEvents.ChatMoveToSupportedChannelEvent, channel: KiChannel];
};

export type ClientEvents = ConnectionEvents & ChatEvents & {
  raw: [data: string];
};

const BASE_URL = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679";

export class KiChatjs extends EventEmitter<ClientEvents> {
  public socket?: WebSocket | NodeWebSocket;
  private wasCloseCalled = false;
  private reconnectAttempts = 0;
  private pingInterval?: NodeJS.Timeout;
  private socketSession = { activity_timeout: 120, socket_id: '' };

  // Reconnect options
  private reconnectEnabled: boolean;
  private reconnectMaxAttempts: number;
  private reconnectInitialTimeout: number;
  private reconnectMaxTimeout: number;

  public channels = new Map<string, KiChannel>();
  public channelsByChatroomId = new Map<number, KiChannel>();

  constructor(options: ClientOptions = {}) {
    super();
    this.reconnectEnabled = options.reconnect ?? true;
    this.reconnectMaxAttempts = options.reconnectMaxAttempts ?? Infinity;
    this.reconnectInitialTimeout = options.reconnectInitialTimeout ?? 1000;
    this.reconnectMaxTimeout = options.reconnectMaxTimeout ?? 60000;

    if (options.channels) {
      options.channels.forEach(channel => this.join(channel));
    }
  }

  public isConnected(): this is { socket: WebSocket & { readyState: 1; }; } {
    return this.socket?.readyState === 1;
  }

  public connect() {
    if (this.isConnected()) {
      throw new Error("Client is already connected.");
    }
    this.wasCloseCalled = false;
    this.createWebSocket().catch(err => this.emit('socketError', err));
  }

  private async createWebSocket() {
    const urlParams = new URLSearchParams({
      protocol: "7",
      client: "js",
      version: "7.4.0",
      flash: "false",
    });
    const url = `${BASE_URL}?${urlParams.toString()}`;

    if (typeof window !== 'undefined' && typeof window.WebSocket !== 'undefined') {
      // Browser environment
      this.socket = new window.WebSocket(url);
      this.socket.onopen = () => this.onSocketOpen();
      this.socket.onmessage = (event) => this.onSocketMessage(event.data);
      this.socket.onclose = (event) => this.onSocketClose(event.code, event.reason);
      this.socket.onerror = () => this.onSocketError(new Error('WebSocket error'));
    } else {
      // Node.js environment
      const { default: NodeWebSocket } = await import('ws');
      this.socket = new NodeWebSocket(url);
      this.socket.on('open', () => this.onSocketOpen());
      this.socket.on('message', (data) => this.onSocketMessage(data));
      this.socket.on('close', (code, reason) => this.onSocketClose(code, reason.toString()));
      this.socket.on('socketError', (error) => this.onSocketError(error));
    }
  }

  public close() {
    if (this.socket) {
      this.wasCloseCalled = true;
      this.socket.close();
    }
  }

  private async reconnect() {
    if (this.isConnected()) {
      this.socket.close();
    }
    if (this.reconnectAttempts >= this.reconnectMaxAttempts) {
      this.emit('socketError', new Error('Maximum reconnect attempts reached.'));
      return;
    }
    this.reconnectAttempts++;
    const waitTime = Math.min(this.reconnectInitialTimeout * 1.23 ** this.reconnectAttempts, this.reconnectMaxTimeout);
    this.emit('reconnecting');
    await new Promise(resolve => setTimeout(resolve, waitTime));
    this.connect();
  }

  private onSocketOpen() {
    this.reconnectAttempts = 0;
    // Resubscribe to all channels on new connection
    this.channels.forEach(channel => this.subscribeToChannel(channel));
  }

  private onSocketClose(code: number, reason: string) {
    clearInterval(this.pingInterval);
    if (!this.wasCloseCalled && this.reconnectEnabled) {
      this.reconnect();
    } else {
      this.emit('disconnected', reason || `Socket closed with code ${code}`);
    }
  }

  private onSocketError(error: Error) {
    this.emit('socketError', error);
  }

  private onSocketMessage(rawData: any) {
    const messageStr = rawData.toString();
    this.emit('raw', messageStr);
    const messageEvent = parseJSON<KickEvents.MessageEvent>(messageStr);
    if (!messageEvent) return;

    let channel: KiChannel | undefined;
    if (messageEvent.channel) {
      const match = messageEvent.channel.match(/^chatrooms\.(\d+)\.v2$/);
      if (match) {
        const chatroomId = parseInt(match[1], 10);
        channel = this.channelsByChatroomId.get(chatroomId);
      }
    }

    switch (messageEvent.event) {
      case "pusher:connection_established": {
        const data = parseJSON<KickEvents.ConnectionEstablishedEvent>(messageEvent.data);
        if (data) {
          this.socketSession = data;
          this.startPing();
          this.emit('connected');
        }
        break;
      }
      case "pusher_internal:subscription_succeeded": {
        if (channel) {
          this.emit('join', channel);
        }
        break;
      }
      case "pusher:pong":
        // Keep-alive successful
        break;
      case 'pusher:error': {
        const data = parseJSON<KickEvents.PusherErrorEvent>(messageEvent.data);
        if (data?.code === 4200) {
          // Forced reconnect
          this.reconnect();
        }
        break;
      }
      case "App\\Events\\ChatMessageEvent": {
        const data = parseJSON<KickEvents.MessageData>(messageEvent.data);
        if (data && channel) {
          this.emit("message", data, channel);
        }
        break;
      }
      case "App\\Events\\SubscriptionEvent": {
        const data = parseJSON<KickEvents.Subscription>(messageEvent.data);
        if (data && channel) this.emit("subscription", data, channel);
        break;
      }
      case "GiftedSubscriptionsEvent": {
        const data = parseJSON<KickEvents.GiftedSubscriptionsEvent>(messageEvent.data);
        if (data && channel) this.emit("giftedSubscriptions", data, channel);
        break;
      }
      case "App\\Events\\StreamHostEvent": {
        const data = parseJSON<KickEvents.StreamHostEvent>(messageEvent.data);
        if (data && channel) this.emit("streamHost", data, channel);
        break;
      }
      case "App\\Events\\UserBannedEvent": {
        const data = parseJSON<KickEvents.UserBannedEvent>(messageEvent.data);
        if (data && channel) this.emit("userBanned", data, channel);
        break;
      }
      case "App\\Events\\UserUnbannedEvent": {
        const data = parseJSON<KickEvents.UserUnbannedEvent>(messageEvent.data);
        if (data && channel) this.emit("userUnbanned", data, channel);
        break;
      }
      case "App\\Events\\MessageDeletedEvent": {
        const data = parseJSON<KickEvents.MessageDeletedEvent>(messageEvent.data);
        if (data && channel) this.emit("messageDeleted", data, channel);
        break;
      }
      case "App\\Events\\PinnedMessageCreatedEvent": {
        const data = parseJSON<KickEvents.PinnedMessageCreatedEvent>(messageEvent.data);
        if (data && channel) this.emit("pinnedMessageCreated", data, channel);
        break;
      }
      case "App\\Events\\PinnedMessageDeletedEvent": {
        const data = parseJSON<KickEvents.MessageDeletedEvent>(messageEvent.data);
        if (data && channel) this.emit("pinnedMessageDeleted", data, channel);
        break;
      }
      case "App\\Events\\ChatroomUpdatedEvent": {
        const data = parseJSON<KickEvents.ChatroomUpdatedEvent>(messageEvent.data);
        if (data && channel) this.emit("chatroomUpdated", data, channel);
        break;
      }
      case "App\\Events\\PollUpdateEvent": {
        const data = parseJSON<KickEvents.PollUpdateEvent>(messageEvent.data);
        if (data && channel) this.emit("pollUpdate", data, channel);
        break;
      }
      case "App\\Events\\PollDeleteEvent": {
        if (channel) this.emit("pollDelete", channel);
        break;
      }
      case "App\\Events\\StreamerIsLive": {
        const data = parseJSON<KickEvents.StreamerIsLiveEvent>(messageEvent.data);
        if (data && channel) this.emit("streamerIsLive", data, channel);
        break;
      }
      case "App\\Events\\StopStreamBroadcast": {
        const data = parseJSON<KickEvents.StopStreamBroadcastEvent>(messageEvent.data);
        if (data && channel) this.emit("stopStreamBroadcast", data, channel);
        break;
      }
      // From myold.ts
      case "GoalCreatedEvent": {
        const data = parseJSON<KickEvents.GoalEvent>(messageEvent.data);
        if (data && channel) this.emit('goalCreated', data, channel);
        break;
      }
      case "GoalCanceledEvent": {
        const data = parseJSON<KickEvents.GoalEvent>(messageEvent.data);
        if (data && channel) this.emit('goalCanceled', data, channel);
        break;
      }
      case "GoalProgressUpdateEvent": {
        const data = parseJSON<KickEvents.GoalEvent>(messageEvent.data);
        if (data && channel) this.emit('goalProgressUpdate', data, channel);
        break;
      }
      case "App\\Events\\LivestreamUpdated": {
        const data = parseJSON<KickEvents.LivestreamUpdatedEvent>(messageEvent.data);
        if (data && channel) this.emit('livestreamUpdated', data, channel);
        break;
      }
      case "PredictionCreated": {
        const data = parseJSON<{ prediction: KickEvents.PredictionBase & { state: "ACTIVE" } }>(messageEvent.data);
        if (data && channel) this.emit('predictionCreated', data, channel);
        break;
      }
      case "PredictionUpdated": {
        const data = parseJSON<KickEvents.PredictionEvent>(messageEvent.data);
        if (data && channel) this.emit('predictionUpdated', data, channel);
        break;
      }
      case "RewardRedeemedEvent": {
        const data = parseJSON<KickEvents.RewardRedeemedEvent>(messageEvent.data);
        if (data && channel) this.emit('rewardRedeemed', data, channel);
        break;
      }
      case "App\\Events\\ChannelSubscriptionEvent": {
        const data = parseJSON<KickEvents.ChannelSubscriptionEvent>(messageEvent.data);
        if (data && channel) this.emit('channelSubscription', data, channel);
        break;
      }
      case "App\\Events\\LuckyUsersWhoGotGiftSubscriptionsEvent": {
        const data = parseJSON<KickEvents.LuckyUsersWhoGotGiftSubscriptionsEvent>(messageEvent.data);
        if (data && channel) this.emit('luckyUsersWhoGotGiftSubscriptions', data, channel);
        break;
      }
      case "App\\Events\\VideoPrivatedEvent": {
        const data = parseJSON<KickEvents.VideoPrivatedEvent>(messageEvent.data);
        if (data && channel) this.emit('videoPrivated', data, channel);
        break;
      }
      case "GiftsLeaderboardUpdated": {
        const data = parseJSON<KickEvents.GiftsLeaderboardUpdatedEvent>(messageEvent.data);
        if (data && channel) this.emit('giftsLeaderboardUpdated', data, channel);
        break;
      }
      case "App\\Events\\ChatMoveToSupportedChannelEvent": {
        const data = parseJSON<KickEvents.ChatMoveToSupportedChannelEvent>(messageEvent.data);
        if (data && channel) this.emit('chatMoveToSupportedChannel', data, channel);
        break;
      }
    }
  }

  private sendPusher(channel: string, type = 'subscribe') {
    if (this.isConnected()) {
      this.socket.send(JSON.stringify({
        event: `pusher:${type}`,
        data: { auth: "", channel },
      }));
    }
  }

  private startPing() {
    clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.socket.send(JSON.stringify({ event: "pusher:ping", data: {} }));
      }
    }, this.socketSession.activity_timeout * 1000);
  }

  private subscribeToChannel(channel: KiChannel) {
    this.sendPusher(`chatrooms.${channel.chatroomId}.v2`);
    this.sendPusher(`chatroom_${channel.chatroomId}`);
    this.sendPusher(`channel_${channel.id}`);
    this.sendPusher(`channel.${channel.id}`);
    this.sendPusher(`predictions-channel-${channel.id}`);
  }

  public async fetchUserInfo(channelName: string) {
    const normalizedName = KiChannel.toLogin(channelName);
    const infoRes = await fetch(`https://kick.com/api/v2/channels/${normalizedName}/info`, { cache: 'no-cache' });
    if (!infoRes.ok) return
    return await infoRes.json() as ChannelInfo;
  }
  public async fetchChatRoom(channelName: string) {
    const normalizedName = KiChannel.toLogin(channelName);
    const infoRes = await fetch(`https://kick.com/api/v2/channels/${normalizedName}/info`, { cache: 'no-cache' });
    if (!infoRes.ok) return
    return await infoRes.json() as ChatroomInfo;
  }

  public async join(channelName: string): Promise<KiChannel> {
    const normalizedName = KiChannel.toLogin(channelName);
    if (this.channels.has(normalizedName)) {
      return this.channels.get(normalizedName)!;
    }

    try {
      const infoData = await this.fetchUserInfo(normalizedName)
      if (!infoData) throw new Error(`Failed to fetch channel info for ${normalizedName}`);

      const chatroomData = await this.fetchChatRoom(normalizedName)
      if(!chatroomData) throw new Error(`Failed to fetch chatroom info for ${normalizedName}`);
      const channel = new KiChannel(infoData, chatroomData);

      this.channels.set(normalizedName, channel);
      this.channelsByChatroomId.set(channel.chatroomId, channel);

      if (this.isConnected()) {
        this.subscribeToChannel(channel);
      }

      // Wait for the join event as confirmation
      const joinedChannel = await this.waitForEvent('join', (ch) => ch.slug === normalizedName);
      return joinedChannel;

    } catch (error) {
      // Clean up if join fails
      this.channels.delete(normalizedName);
      // Also remove from the other map
      const ch = Array.from(this.channelsByChatroomId.values()).find(c => c.slug === normalizedName);
      if (ch) {
        this.channelsByChatroomId.delete(ch.chatroomId);
      }
      this.emit('socketError', error as Error);
      throw error;
    }
  }

  public leave(channelName: string): void {
    const normalizedName = KiChannel.toLogin(channelName);
    const channel = this.channels.get(normalizedName);
    if (channel) {
      if (this.isConnected()) {
        this.sendPusher(`chatrooms.${channel.chatroomId}.v2`, 'unsubscribe');
        this.sendPusher(`chatroom_${channel.chatroomId}`, 'unsubscribe');
        this.sendPusher(`channel_${channel.id}`, 'unsubscribe');
        this.sendPusher(`channel.${channel.id}`, 'unsubscribe');
        this.sendPusher(`predictions-channel-${channel.id}`, 'unsubscribe');
      }
      this.channels.delete(normalizedName);
      this.channelsByChatroomId.delete(channel.chatroomId);
      this.emit('leave', channel, 'Disconnected by user');
    }
  }

  private waitForEvent<T extends keyof ClientEvents>(
    event: T,
    filter: (...args: ClientEvents[T]) => boolean,
    timeoutMs = 10000
  ): Promise<ClientEvents[T][0]> {
    return new Promise((resolve, reject) => {
      const listener = (...args: ClientEvents[T]) => {
        if (filter(...args)) {
          this.off(event, listener as any);
          clearTimeout(timeout);
          resolve(args[0]);
        }
      };

      const timeout = setTimeout(() => {
        this.off(event, listener as any);
        reject(new Error(`Timed out waiting for event: ${event}`));
      }, timeoutMs);

      this.on(event, listener as any);
    });
  }
}
