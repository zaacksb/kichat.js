var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/ws/browser.js
var require_browser = __commonJS({
  "node_modules/ws/browser.js"(exports, module) {
    "use strict";
    module.exports = function() {
      throw new Error(
        "ws does not work in the browser. Browser clients must use the native WebSocket object"
      );
    };
  }
});

// src/lib/KiChannel.ts
var KiChannel = class {
  info;
  chatroom;
  constructor(info, chatroom) {
    this.info = info;
    this.chatroom = chatroom;
  }
  get id() {
    return this.info.id;
  }
  get name() {
    return this.info.user.username;
  }
  get slug() {
    return this.info.slug;
  }
  get chatroomId() {
    return this.info.chatroom.id;
  }
  static toLogin(channelName) {
    const name = channelName.trim().toLowerCase();
    return name.startsWith("#") ? name.slice(1) : name;
  }
  toString() {
    return this.name;
  }
};

// src/lib/EventEmitter.ts
var EventEmitter = class {
  listeners = /* @__PURE__ */ new Map();
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    this.listeners.get(event).add(listener);
    return this;
  }
  off(event, listener) {
    this.listeners.get(event)?.delete(listener);
    return this;
  }
  emit(event, ...args) {
    if (!this.listeners.has(event)) {
      if (event === "error") {
        if (args[0] instanceof Error) {
          throw args[0];
        } else {
          const uncaughtError = new Error("Uncaught error emitted", { cause: args[0] });
          throw uncaughtError;
        }
      }
      return false;
    }
    for (const listener of this.listeners.get(event)) {
      listener(...args);
    }
    return true;
  }
};

// src/KiChatjs.ts
var parseJSON = (json) => {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
};
var BASE_URL = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679";
var KiChatjs = class extends EventEmitter {
  socket;
  wasCloseCalled = false;
  reconnectAttempts = 0;
  pingInterval;
  socketSession = { activity_timeout: 120, socket_id: "" };
  // Reconnect options
  reconnectEnabled;
  reconnectMaxAttempts;
  reconnectInitialTimeout;
  reconnectMaxTimeout;
  channels = /* @__PURE__ */ new Map();
  channelsByChatroomId = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    super();
    this.reconnectEnabled = options.reconnect ?? true;
    this.reconnectMaxAttempts = options.reconnectMaxAttempts ?? Infinity;
    this.reconnectInitialTimeout = options.reconnectInitialTimeout ?? 1e3;
    this.reconnectMaxTimeout = options.reconnectMaxTimeout ?? 6e4;
    if (options.channels) {
      options.channels.forEach((channel) => this.join(channel));
    }
  }
  isConnected() {
    return this.socket?.readyState === 1;
  }
  connect() {
    if (this.isConnected()) {
      throw new Error("Client is already connected.");
    }
    this.wasCloseCalled = false;
    this.createWebSocket().catch((err) => this.emit("socketError", err));
  }
  async createWebSocket() {
    const urlParams = new URLSearchParams({
      protocol: "7",
      client: "js",
      version: "7.4.0",
      flash: "false"
    });
    const url = `${BASE_URL}?${urlParams.toString()}`;
    if (typeof window !== "undefined" && typeof window.WebSocket !== "undefined") {
      this.socket = new window.WebSocket(url);
      this.socket.onopen = () => this.onSocketOpen();
      this.socket.onmessage = (event) => this.onSocketMessage(event.data);
      this.socket.onclose = (event) => this.onSocketClose(event.code, event.reason);
      this.socket.onerror = () => this.onSocketError(new Error("WebSocket error"));
    } else {
      const { default: NodeWebSocket } = await Promise.resolve().then(() => __toESM(require_browser(), 1));
      this.socket = new NodeWebSocket(url);
      this.socket.on("open", () => this.onSocketOpen());
      this.socket.on("message", (data) => this.onSocketMessage(data));
      this.socket.on("close", (code, reason) => this.onSocketClose(code, reason.toString()));
      this.socket.on("socketError", (error) => this.onSocketError(error));
    }
  }
  close() {
    if (this.socket) {
      this.wasCloseCalled = true;
      this.socket.close();
    }
  }
  async reconnect() {
    if (this.isConnected()) {
      this.socket.close();
    }
    if (this.reconnectAttempts >= this.reconnectMaxAttempts) {
      this.emit("socketError", new Error("Maximum reconnect attempts reached."));
      return;
    }
    this.reconnectAttempts++;
    const waitTime = Math.min(this.reconnectInitialTimeout * 1.23 ** this.reconnectAttempts, this.reconnectMaxTimeout);
    this.emit("reconnecting");
    await new Promise((resolve) => setTimeout(resolve, waitTime));
    this.connect();
  }
  onSocketOpen() {
    this.reconnectAttempts = 0;
    this.channels.forEach((channel) => this.subscribeToChannel(channel));
  }
  onSocketClose(code, reason) {
    clearInterval(this.pingInterval);
    if (!this.wasCloseCalled && this.reconnectEnabled) {
      this.reconnect();
    } else {
      this.emit("disconnected", reason || `Socket closed with code ${code}`);
    }
  }
  onSocketError(error) {
    this.emit("socketError", error);
  }
  onSocketMessage(rawData) {
    const messageStr = rawData.toString();
    this.emit("raw", messageStr);
    const messageEvent = parseJSON(messageStr);
    if (!messageEvent) return;
    let channel;
    if (messageEvent.channel) {
      const match = messageEvent.channel.match(/^chatrooms\.(\d+)\.v2$/);
      if (match) {
        const chatroomId = parseInt(match[1], 10);
        channel = this.channelsByChatroomId.get(chatroomId);
      }
    }
    switch (messageEvent.event) {
      case "pusher:connection_established": {
        const data = parseJSON(messageEvent.data);
        if (data) {
          this.socketSession = data;
          this.startPing();
          this.emit("connected");
        }
        break;
      }
      case "pusher_internal:subscription_succeeded": {
        if (channel) {
          this.emit("join", channel);
        }
        break;
      }
      case "pusher:pong":
        break;
      case "pusher:error": {
        const data = parseJSON(messageEvent.data);
        if (data?.code === 4200) {
          this.reconnect();
        }
        break;
      }
      case "App\\Events\\ChatMessageEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) {
          this.emit("message", data, channel);
        }
        break;
      }
      case "App\\Events\\SubscriptionEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("subscription", data, channel);
        break;
      }
      case "GiftedSubscriptionsEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("giftedSubscriptions", data, channel);
        break;
      }
      case "App\\Events\\StreamHostEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("streamHost", data, channel);
        break;
      }
      case "App\\Events\\UserBannedEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("userBanned", data, channel);
        break;
      }
      case "App\\Events\\UserUnbannedEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("userUnbanned", data, channel);
        break;
      }
      case "App\\Events\\MessageDeletedEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("messageDeleted", data, channel);
        break;
      }
      case "App\\Events\\PinnedMessageCreatedEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("pinnedMessageCreated", data, channel);
        break;
      }
      case "App\\Events\\PinnedMessageDeletedEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("pinnedMessageDeleted", data, channel);
        break;
      }
      case "App\\Events\\ChatroomUpdatedEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("chatroomUpdated", data, channel);
        break;
      }
      case "App\\Events\\PollUpdateEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("pollUpdate", data, channel);
        break;
      }
      case "App\\Events\\PollDeleteEvent": {
        if (channel) this.emit("pollDelete", channel);
        break;
      }
      case "App\\Events\\StreamerIsLive": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("streamerIsLive", data, channel);
        break;
      }
      case "App\\Events\\StopStreamBroadcast": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("stopStreamBroadcast", data, channel);
        break;
      }
      // From myold.ts
      case "GoalCreatedEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("goalCreated", data, channel);
        break;
      }
      case "GoalCanceledEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("goalCanceled", data, channel);
        break;
      }
      case "GoalProgressUpdateEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("goalProgressUpdate", data, channel);
        break;
      }
      case "App\\Events\\LivestreamUpdated": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("livestreamUpdated", data, channel);
        break;
      }
      case "PredictionCreated": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("predictionCreated", data, channel);
        break;
      }
      case "PredictionUpdated": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("predictionUpdated", data, channel);
        break;
      }
      case "RewardRedeemedEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("rewardRedeemed", data, channel);
        break;
      }
      case "App\\Events\\ChannelSubscriptionEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("channelSubscription", data, channel);
        break;
      }
      case "App\\Events\\LuckyUsersWhoGotGiftSubscriptionsEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("luckyUsersWhoGotGiftSubscriptions", data, channel);
        break;
      }
      case "App\\Events\\VideoPrivatedEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("videoPrivated", data, channel);
        break;
      }
      case "GiftsLeaderboardUpdated": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("giftsLeaderboardUpdated", data, channel);
        break;
      }
      case "App\\Events\\ChatMoveToSupportedChannelEvent": {
        const data = parseJSON(messageEvent.data);
        if (data && channel) this.emit("chatMoveToSupportedChannel", data, channel);
        break;
      }
    }
  }
  sendPusher(channel, type = "subscribe") {
    if (this.isConnected()) {
      this.socket.send(JSON.stringify({
        event: `pusher:${type}`,
        data: { auth: "", channel }
      }));
    }
  }
  startPing() {
    clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.socket.send(JSON.stringify({ event: "pusher:ping", data: {} }));
      }
    }, this.socketSession.activity_timeout * 1e3);
  }
  subscribeToChannel(channel) {
    this.sendPusher(`chatrooms.${channel.chatroomId}.v2`);
    this.sendPusher(`chatroom_${channel.chatroomId}`);
    this.sendPusher(`channel_${channel.id}`);
    this.sendPusher(`channel.${channel.id}`);
    this.sendPusher(`predictions-channel-${channel.id}`);
  }
  async fetchUserInfo(channelName) {
    const normalizedName = KiChannel.toLogin(channelName);
    const infoRes = await fetch(`https://kick.com/api/v2/channels/${normalizedName}/info`, { cache: "no-cache" });
    if (!infoRes.ok) return;
    return await infoRes.json();
  }
  async fetchChatRoom(channelName) {
    const normalizedName = KiChannel.toLogin(channelName);
    const infoRes = await fetch(`https://kick.com/api/v2/channels/${normalizedName}/info`, { cache: "no-cache" });
    if (!infoRes.ok) return;
    return await infoRes.json();
  }
  async join(channelName) {
    const normalizedName = KiChannel.toLogin(channelName);
    if (this.channels.has(normalizedName)) {
      return this.channels.get(normalizedName);
    }
    try {
      const infoData = await this.fetchUserInfo(normalizedName);
      if (!infoData) throw new Error(`Failed to fetch channel info for ${normalizedName}`);
      const chatroomData = await this.fetchChatRoom(normalizedName);
      if (!chatroomData) throw new Error(`Failed to fetch chatroom info for ${normalizedName}`);
      const channel = new KiChannel(infoData, chatroomData);
      this.channels.set(normalizedName, channel);
      this.channelsByChatroomId.set(channel.chatroomId, channel);
      if (this.isConnected()) {
        this.subscribeToChannel(channel);
      }
      const joinedChannel = await this.waitForEvent("join", (ch) => ch.slug === normalizedName);
      return joinedChannel;
    } catch (error) {
      this.channels.delete(normalizedName);
      const ch = Array.from(this.channelsByChatroomId.values()).find((c) => c.slug === normalizedName);
      if (ch) {
        this.channelsByChatroomId.delete(ch.chatroomId);
      }
      this.emit("socketError", error);
      throw error;
    }
  }
  leave(channelName) {
    const normalizedName = KiChannel.toLogin(channelName);
    const channel = this.channels.get(normalizedName);
    if (channel) {
      if (this.isConnected()) {
        this.sendPusher(`chatrooms.${channel.chatroomId}.v2`, "unsubscribe");
        this.sendPusher(`chatroom_${channel.chatroomId}`, "unsubscribe");
        this.sendPusher(`channel_${channel.id}`, "unsubscribe");
        this.sendPusher(`channel.${channel.id}`, "unsubscribe");
        this.sendPusher(`predictions-channel-${channel.id}`, "unsubscribe");
      }
      this.channels.delete(normalizedName);
      this.channelsByChatroomId.delete(channel.chatroomId);
      this.emit("leave", channel, "Disconnected by user");
    }
  }
  waitForEvent(event, filter, timeoutMs = 1e4) {
    return new Promise((resolve, reject) => {
      const listener = (...args) => {
        if (filter(...args)) {
          this.off(event, listener);
          clearTimeout(timeout);
          resolve(args[0]);
        }
      };
      const timeout = setTimeout(() => {
        this.off(event, listener);
        reject(new Error(`Timed out waiting for event: ${event}`));
      }, timeoutMs);
      this.on(event, listener);
    });
  }
};

// src/index.ts
var src_default = {
  KiChatjs
};
export {
  KiChannel,
  KiChatjs,
  src_default as default
};
//# sourceMappingURL=kichat.js.browser.mjs.map
