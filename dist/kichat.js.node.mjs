// src/lib/KiChannel.ts
var KiChannel = class {
  info;
  chatroom;
  connectionNotified = !1;
  constructor(info, chatroom) {
    this.info = info, this.chatroom = chatroom;
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
  get notified() {
    return this.connectionNotified;
  }
  set notified(value) {
    this.connectionNotified = value;
  }
  static toLogin(channelName) {
    let name = channelName.trim().toLowerCase();
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
    return this.listeners.has(event) || this.listeners.set(event, /* @__PURE__ */ new Set()), this.listeners.get(event).add(listener), this;
  }
  off(event, listener) {
    return this.listeners.get(event)?.delete(listener), this;
  }
  emit(event, ...args) {
    if (!this.listeners.has(event)) {
      if (event === "error")
        throw args[0] instanceof Error ? args[0] : new Error("Uncaught error emitted", { cause: args[0] });
      return !1;
    }
    for (let listener of this.listeners.get(event))
      listener(...args);
    return !0;
  }
};

// src/KiChatjs.ts
var parseJSON = (json) => {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}, BASE_URL = "wss://ws-us2.pusher.com/app/32cbd69e4b950bf97679", KiChatjs = class extends EventEmitter {
  socket;
  wasCloseCalled = !1;
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
  subscribePusher;
  constructor(options = {}) {
    super(), this.reconnectEnabled = options.reconnect ?? !0, this.reconnectMaxAttempts = options?.reconnectMaxAttempts ?? 1 / 0, this.reconnectInitialTimeout = options?.reconnectInitialTimeout ?? 1e3, this.reconnectMaxTimeout = options?.reconnectMaxTimeout ?? 6e4, this.subscribePusher = options?.subscribePusher ?? {
      channel: !0,
      chatRoom: !0,
      predictions: !0
    }, options.channels && options.channels.forEach((channel) => this.join(channel));
  }
  isConnected() {
    return this.socket?.readyState === 1;
  }
  connect() {
    if (this.isConnected())
      throw new Error("Client is already connected.");
    this.wasCloseCalled = !1, this.createWebSocket().catch((err) => this.emit("socketError", err));
  }
  async createWebSocket() {
    let urlParams = new URLSearchParams({
      protocol: "7",
      client: "js",
      version: "7.4.0",
      flash: "false"
    }), url = `${BASE_URL}?${urlParams.toString()}`;
    if (typeof window < "u" && typeof window.WebSocket < "u")
      this.socket = new window.WebSocket(url), this.socket.onopen = () => this.onSocketOpen(), this.socket.onmessage = (event) => this.onSocketMessage(event.data), this.socket.onclose = (event) => this.onSocketClose(event.code, event.reason), this.socket.onerror = () => this.onSocketError(new Error("WebSocket error"));
    else {
      let { default: NodeWebSocket } = await import("ws");
      this.socket = new NodeWebSocket(url), this.socket.on("open", () => this.onSocketOpen()), this.socket.on("message", (data) => this.onSocketMessage(data)), this.socket.on("close", (code, reason) => this.onSocketClose(code, reason.toString())), this.socket.on("socketError", (error) => this.onSocketError(error));
    }
  }
  close() {
    this.socket && (this.wasCloseCalled = !0, this.socket.close());
  }
  async reconnect() {
    if (this.isConnected() && this.socket.close(), this.reconnectAttempts >= this.reconnectMaxAttempts) {
      this.emit("socketError", new Error("Maximum reconnect attempts reached."));
      return;
    }
    this.reconnectAttempts++;
    let waitTime = Math.min(this.reconnectInitialTimeout * 1.23 ** this.reconnectAttempts, this.reconnectMaxTimeout);
    this.emit("reconnecting"), await new Promise((resolve) => setTimeout(resolve, waitTime)), this.connect();
  }
  onSocketOpen() {
    this.reconnectAttempts = 0, this.channels.forEach((channel) => this.subscribeToChannel(channel));
  }
  onSocketClose(code, reason) {
    clearInterval(this.pingInterval), !this.wasCloseCalled && this.reconnectEnabled ? this.reconnect() : this.emit("disconnected", reason || `Socket closed with code ${code}`);
  }
  onSocketError(error) {
    this.emit("socketError", error);
  }
  onSocketMessage(rawData) {
    let messageStr = rawData.toString();
    this.emit("raw", messageStr);
    let messageEvent = parseJSON(messageStr);
    if (!messageEvent) return;
    let channel;
    if (messageEvent.channel) {
      let match = messageEvent.channel.match(/(\d{5,})/);
      if (match) {
        let roomId = parseInt(match[1], 10);
        Array.from(this.channelsByChatroomId.entries()).forEach(([_, ch]) => {
          (ch.chatroomId == roomId || ch.id == roomId) && (channel = this.channelsByChatroomId.get(ch.chatroomId));
        });
      }
    }
    switch (messageEvent.event) {
      case "pusher:connection_established": {
        let data = parseJSON(messageEvent.data);
        data && (this.socketSession = data, this.startPing(), this.emit("connected"));
        break;
      }
      case "pusher_internal:subscription_succeeded": {
        channel?.notified == !1 && (this.channels.get(channel.slug).notified = !0, this.emit("join", channel));
        break;
      }
      case "pusher:pong":
        break;
      case "pusher:error": {
        parseJSON(messageEvent.data)?.code === 4200 && this.reconnect();
        break;
      }
      case "App\\Events\\ChatMessageEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("message", data, channel);
        break;
      }
      case "App\\Events\\SubscriptionEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("subscription", data, channel);
        break;
      }
      case "GiftedSubscriptionsEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("giftedSubscriptions", data, channel);
        break;
      }
      case "App\\Events\\StreamHostEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("streamHost", data, channel);
        break;
      }
      case "App\\Events\\UserBannedEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("userBanned", data, channel);
        break;
      }
      case "App\\Events\\UserUnbannedEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("userUnbanned", data, channel);
        break;
      }
      case "App\\Events\\MessageDeletedEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("messageDeleted", data, channel);
        break;
      }
      case "App\\Events\\PinnedMessageCreatedEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("pinnedMessageCreated", data, channel);
        break;
      }
      case "App\\Events\\PinnedMessageDeletedEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("pinnedMessageDeleted", data, channel);
        break;
      }
      case "App\\Events\\ChatroomUpdatedEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("chatroomUpdated", data, channel);
        break;
      }
      case "App\\Events\\PollUpdateEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("pollUpdate", data, channel);
        break;
      }
      case "App\\Events\\PollDeleteEvent": {
        channel && this.emit("pollDelete", channel);
        break;
      }
      case "App\\Events\\StreamerIsLive": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("streamerIsLive", data, channel);
        break;
      }
      case "App\\Events\\StopStreamBroadcast": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("stopStreamBroadcast", data, channel);
        break;
      }
      // From myold.ts
      case "GoalCreatedEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("goalCreated", data, channel);
        break;
      }
      case "GoalCanceledEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("goalCanceled", data, channel);
        break;
      }
      case "GoalProgressUpdateEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("goalProgressUpdate", data, channel);
        break;
      }
      case "App\\Events\\LivestreamUpdated": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("livestreamUpdated", data, channel);
        break;
      }
      case "PredictionCreated": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("predictionCreated", data, channel);
        break;
      }
      case "PredictionUpdated": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("predictionUpdated", data, channel);
        break;
      }
      case "RewardRedeemedEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("rewardRedeemed", data, channel);
        break;
      }
      case "App\\Events\\ChannelSubscriptionEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("channelSubscription", data, channel);
        break;
      }
      case "App\\Events\\LuckyUsersWhoGotGiftSubscriptionsEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("luckyUsersWhoGotGiftSubscriptions", data, channel);
        break;
      }
      case "App\\Events\\VideoPrivatedEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("videoPrivated", data, channel);
        break;
      }
      case "GiftsLeaderboardUpdated": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("giftsLeaderboardUpdated", data, channel);
        break;
      }
      case "App\\Events\\ChatMoveToSupportedChannelEvent": {
        let data = parseJSON(messageEvent.data);
        data && channel && this.emit("chatMoveToSupportedChannel", data, channel);
        break;
      }
    }
  }
  sendPusher(channel, type = "subscribe") {
    this.isConnected() && this.socket.send(JSON.stringify({
      event: `pusher:${type}`,
      data: { auth: "", channel }
    }));
  }
  startPing() {
    clearInterval(this.pingInterval), this.pingInterval = setInterval(() => {
      this.isConnected() && this.socket.send(JSON.stringify({ event: "pusher:ping", data: {} }));
    }, this.socketSession.activity_timeout * 1e3);
  }
  subscribeToChannel(channel) {
    this.subscribePusher?.chatRoom == !0 && this.sendPusher(`chatrooms.${channel.chatroomId}.v2`), this.subscribePusher?.chatRoom == !0 && this.sendPusher(`chatroom_${channel.chatroomId}`), this.subscribePusher?.channel == !0 && this.sendPusher(`channel_${channel.id}`), this.subscribePusher?.channel == !0 && this.sendPusher(`channel.${channel.id}`), this.subscribePusher?.predictions == !0 && this.sendPusher(`predictions-channel-${channel.id}`);
  }
  async fetchUserInfo(channelName) {
    let normalizedName = KiChannel.toLogin(channelName), infoRes = await fetch(`https://kick.com/api/v2/channels/${normalizedName}/info`, { cache: "no-cache" });
    if (infoRes.ok)
      return await infoRes.json();
  }
  async fetchChatRoom(channelName) {
    let normalizedName = KiChannel.toLogin(channelName), infoRes = await fetch(`https://kick.com/api/v2/channels/${normalizedName}/info`, { cache: "no-cache" });
    if (infoRes.ok)
      return await infoRes.json();
  }
  async join(channelName) {
    let normalizedName = KiChannel.toLogin(channelName);
    if (this.channels.has(normalizedName))
      return this.channels.get(normalizedName);
    try {
      let infoData = await this.fetchUserInfo(normalizedName);
      if (!infoData) throw new Error(`Failed to fetch channel info for ${normalizedName}`);
      let chatroomData = await this.fetchChatRoom(normalizedName);
      if (!chatroomData) throw new Error(`Failed to fetch chatroom info for ${normalizedName}`);
      let channel = new KiChannel(infoData, chatroomData);
      return this.channels.set(normalizedName, channel), this.channelsByChatroomId.set(channel.chatroomId, channel), this.isConnected() && this.subscribeToChannel(channel), await this.waitForEvent("join", (ch) => ch.slug === normalizedName);
    } catch (error) {
      this.channels.delete(normalizedName);
      let ch = Array.from(this.channelsByChatroomId.values()).find((c) => c.slug === normalizedName);
      throw ch && this.channelsByChatroomId.delete(ch.chatroomId), this.emit("socketError", error), error;
    }
  }
  leave(channelName) {
    let normalizedName = KiChannel.toLogin(channelName), channel = this.channels.get(normalizedName);
    channel && (this.isConnected() && (this.subscribePusher?.chatRoom == !0 && this.sendPusher(`chatrooms.${channel.chatroomId}.v2`, "unsubscribe"), this.subscribePusher?.chatRoom == !0 && this.sendPusher(`chatroom_${channel.chatroomId}`, "unsubscribe"), this.subscribePusher?.channel == !0 && this.sendPusher(`channel_${channel.id}`, "unsubscribe"), this.subscribePusher?.channel == !0 && this.sendPusher(`channel.${channel.id}`, "unsubscribe"), this.subscribePusher?.predictions == !0 && this.sendPusher(`predictions-channel-${channel.id}`, "unsubscribe")), this.channels.delete(normalizedName), this.channelsByChatroomId.delete(channel.chatroomId), this.emit("leave", channel, "Disconnected by user"));
  }
  waitForEvent(event, filter, timeoutMs = 1e4) {
    return new Promise((resolve, reject) => {
      let listener = (...args) => {
        filter(...args) && (this.off(event, listener), clearTimeout(timeout), resolve(args[0]));
      }, timeout = setTimeout(() => {
        this.off(event, listener), reject(new Error(`Timed out waiting for event: ${event}`));
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
//# sourceMappingURL=kichat.js.node.mjs.map
