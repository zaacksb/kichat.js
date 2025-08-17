# kichat.js

[![NPM Version](https://img.shields.io/npm/v/kichat.js.svg?style=flat)](https://www.npmjs.org/package/kichat.js)
[![NPM Downloads](https://img.shields.io/npm/dm/kichat.js.svg?style=flat)](https://www.npmjs.org/package/kichat.js)
<!-- [![Build Status](https://img.shields.io/github/actions/workflow/status/zaacksb/kickChat-gemini/test.yml?branch=main&style=flat)](https://github.com/zaacksb/kickChat-gemini/actions) -->

A robust JavaScript library to connect to Kick.com's chat, designed to work seamlessly in both Node.js and browser environments.

## Features

- **Isomorphic:** Works in Node.js and modern browsers out-of-the-box.
- **Robust Connections:** Automatic reconnection with configurable exponential backoff.
- **Event-Driven:** Clean, event-based architecture for handling chat interactions.
- **Fully Typed:** Written in TypeScript for a better developer experience.
- **Rich Data:** Provides detailed channel and chatroom information upon joining.

## Installation

### Node.js

```bash
npm i kichat.js
```

```javascript
import { KickChat } from 'kichat.js';

const client = new KickChat();

client.on('connected', () => {
	console.log('Successfully connected to Kick!');
	// Join a channel after connecting
	client.join('xqc');
});

client.on('join', (channel) => {
    console.log(`Joined channel: ${channel.slug}`)
});

client.on('message', (message, channel) => {
	console.log(`[${channel.slug}] ${message.sender.username}: ${message.content}`);
});

// Start the connection
client.connect();
```

### Browser

The library is available on the `window` object as `kickChat`.

```html
<script src="/dist/kickChat.browser-global.min.js"></script>
<script>
    const client = new kickChat.KickChat();
    client.on('connected', () => console.log('Connected!'));
    client.connect();
    client.join('xqc');
</script>
```

## API Reference

### `new KickChat(options)`

Creates a new client instance.

**Options:**

- `channels` (string[], optional): An array of channel slugs to automatically join upon connection.
- `reconnect` (boolean, optional, default: `true`): Whether the client should attempt to reconnect automatically if the connection is lost.
- `reconnectMaxAttempts` (number, optional, default: `Infinity`): Maximum number of reconnection attempts.
- `reconnectInitialTimeout` (number, optional, default: `1000`): The initial time to wait in milliseconds before the first reconnection attempt.
- `reconnectMaxTimeout` (number, optional, default: `60000`): The maximum time to wait in milliseconds between reconnection attempts.

### Methods

- **`.connect()`**: Establishes the connection to Kick's WebSocket server. This must be called to start receiving events.

- **`.close()`**: Cleanly disconnects the client.

- **`.isConnected()`**: Checks if the websocket is connected.

- **`.join(channelName)`**: Asynchronously joins a chat channel. Returns a `Promise` which resolves with the `Channel` object upon successful join confirmation from the server.
  - `channelName` (string): The slug of the channel to join (e.g., 'xqc').

- **`.leave(channelName)`**: Leaves a chat channel.
  - `channelName` (string): The slug of the channel to leave from.

### Events

Listen to events using `client.on('eventName', (arg1, arg2, ...) => { ... });`

#### Connection Events

- **`connected`**: Fired when the WebSocket connection is successfully established.
- **`disconnected`** `(reason: string)`: Fired when the client is disconnected.
- **`reconnecting`**: Fired when the client is attempting to reconnect after an unexpected disconnection.
- **`join`** `(channel: Channel)`: Fired when the client successfully subscribes to a channel's events.
- **`leave`** `(channel: Channel)`: Fired when the client leaves a channel.
- **`error`** `(error: Error)`: Fired when an error occurs.

#### Chat & Channel Events

All channel-specific events return the `Channel` object as the last parameter, which contains rich data about the channel and its chatroom settings.

- **`message`** `(message: MessageData, channel: Channel)`: A standard chat message was sent.
- **`subscription`** `(subscription: Subscription, channel: Channel)`: A user subscribed to the channel.
- **`giftedSubscriptions`** `(event: GiftedSubscriptionsEvent, channel: Channel)`: One or more gift subscriptions were sent in chat.
- **`streamHost`** `(event: StreamHostEvent, channel: Channel)`: The channel started hosting another channel.
- **`userBanned`** `(event: UserBannedEvent, channel: Channel)`: A user was banned from the chatroom.
- **`userUnbanned`** `(event: UserUnbannedEvent, channel: Channel)`: A user was unbanned.
- **`messageDeleted`** `(event: MessageDeletedEvent, channel: Channel)`: A single message was deleted.
- **`pinnedMessageCreated`** `(event: PinnedMessageCreatedEvent, channel: Channel)`: A message was pinned.
- **`pinnedMessageDeleted`** `(event: MessageDeletedEvent, channel: Channel)`: A pinned message was removed.
- **`chatroomUpdated`** `(event: ChatroomUpdatedEvent, channel: Channel)`: Chatroom settings (e.g., slow mode) were updated.
- **`pollUpdate`** `(event: PollUpdateEvent, channel: Channel)`: A poll was created or updated.
- **`pollDelete`** `(channel: Channel)`: A poll was deleted.
- **`streamerIsLive`** `(event: StreamerIsLiveEvent, channel: Channel)`: The streamer started a live broadcast.
- **`stopStreamBroadcast`** `(event: StopStreamBroadcastEvent, channel: Channel)`: The live broadcast has ended.
- **`goalCreated`** `(event: GoalEvent, channel: Channel)`: A new follower/sub goal was created.
- **`goalCanceled`** `(event: GoalEvent, channel: Channel)`: A goal was canceled.
- **`goalProgressUpdate`** `(event: GoalEvent, channel: Channel)`: A goal's progress was updated.
- **`livestreamUpdated`** `(event: LivestreamUpdatedEvent, channel: Channel)`: Livestream info (title, category) was updated.
- **`predictionCreated`** `(event: PredictionEvent, channel: Channel)`: A new prediction was started.
- **`predictionUpdated`** `(event: PredictionEvent, channel: Channel)`: A prediction was updated (locked, resolved, etc.).
- **`rewardRedeemed`** `(event: RewardRedeemedEvent, channel: Channel)`: A viewer redeemed a channel point reward.
- **`luckyUsersWhoGotGiftSubscriptions`** `(event: LuckyUsersWhoGotGiftSubscriptionsEvent, channel: Channel)`: A list of users who received gifted subscriptions.
- **`giftsLeaderboardUpdated`** `(event: GiftsLeaderboardUpdatedEvent, channel: Channel)`: The gift leaderboard was updated.

## Building from Source

If you wish to build the library from the source code, clone the repository and run the following commands:

```bash
git clone https://github.com/zaacksb/kickChat-gemini.git
cd kickChat-gemini
npm install
npm run build
```

## Contributing

Contributions are welcome! Please feel free to open an issue to discuss what you would like to change or submit a Pull Request.

## Future Work / TODO

Here are some features and improvements planned for the future:

- [ ] **Send Chat Messages:** Implement a `.say(channel, message)` method to send messages to a chatroom. This will likely require handling user authentication.
- [ ] **Authentication:** Add support for authenticating as a Kick user to perform actions on their behalf (like sending messages or performing moderation actions).
- [ ] **Moderation Methods:** Implement methods for moderators, such as `.ban()`, `.unban()`, `.timeout()`, and `.deleteMessage()`.
- [ ] **Add a Testing Framework:** Integrate a testing framework like Jest or Vitest to ensure code quality and stability.
- [ ] **CI/CD Workflow:** Set up a GitHub Actions workflow to automatically run tests and builds on push/pull request.
- [ ] **Complete TSDoc Documentation:** Add detailed TSDoc comments to all public methods and interfaces for improved IntelliSense and auto-generated documentation.
