import { KiChatjs } from './KiChatjs'

const client = new KiChatjs({
    // channels: ['xqc'], // Optionally join channels on startup
    reconnect: true, // default is true
    reconnectMaxAttempts: 5, // default is Infinity
    reconnectInitialTimeout: 1_000, 
    reconnectMaxTimeout: 30_000 // default is 60_000
})
client.connect()

client.on('connected', () => {
    console.log('Connected to Kick!')
})
client.on('disconnected', (reason) => {
    console.log(`Disconnected: ${reason}`)
})

client.on('reconnecting', () => {
    console.log('Reconnecting...')
})

client.on('socketError', (error) => {
    console.error('An error occurred:', error)
})

client.on('join', (data) => {
    console.log('joined ', data.info.slug)
})

client.on('leave', (data, reason) => {
    console.log('disconnected ', data.info.slug, reason)
})

client.on('message', (message, channel) => {
    const sender = message.sender.username
    const content = message.content
    const messageData = content.replace(
        /`\[emote:(\d+):(\w+)\]`/g,
        (_, __, emoteName) => emoteName,
    )
    console.log(`${client.channels.size}[${channel.slug}] ${sender}: ${messageData}`)
})

client.on('subscription', (sub, channel) => {
    console.log(`[${channel.name}] New subscription from ${sub.username} for ${sub.months} months!`)
})

client.on('giftedSubscriptions', (gift, channel) => {
    console.log(`[${channel.name}] ${gift.gifter_username} gifted ${gift.gifted_usernames.length} subs!`)
})

client.on('streamHost', (event, channel) => {
    console.log(`[${channel.slug}] Stream Host:`, event)
})

client.on('userBanned', (event, channel) => {
    console.log(`[${channel.slug}] User Banned:`, event)
})

client.on('userUnbanned', (event, channel) => {
    console.log(`[${channel.slug}] User Unbanned:`, event)
})

client.on('messageDeleted', (event, channel) => {
    console.log(`[${channel.slug}] Message Deleted:`, event)
})

client.on('pinnedMessageCreated', (event, channel) => {
    console.log(`[${channel.slug}] Pinned Message Created:`, event)
})

client.on('pinnedMessageDeleted', (event, channel) => {
    console.log(`[${channel.slug}] Pinned Message Deleted:`, event)
})

client.on('chatroomUpdated', (event, channel) => {
    console.log(`[${channel.slug}] Chatroom Updated:`, event)
})

client.on('pollUpdate', (event, channel) => {
    console.log(`[${channel.slug}] Poll Update:`, event)
})

client.on('pollDelete', (channel) => {
    console.log(`[${channel.slug}] Poll Delete`)
})

client.on('streamerIsLive', (event, channel) => {
    console.log(`[${channel.slug}] Streamer is Live:`, event)
})

client.on('stopStreamBroadcast', (event, channel) => {
    console.log(`[${channel.slug}] Stop Stream Broadcast:`, event)
})

client.on('goalCreated', (event, channel) => {
    console.log(`[${channel.slug}] Goal Created:`, event)
})

client.on('goalCanceled', (event, channel) => {
    console.log(`[${channel.slug}] Goal Canceled:`, event)
})

client.on('goalProgressUpdate', (event, channel) => {
    console.log(`[${channel.slug}] Goal Progress Update:`, event)
})

client.on('livestreamUpdated', (event, channel) => {
    console.log(`[${channel.slug}] Livestream Updated:`, event)
})

client.on('predictionCreated', (event, channel) => {
    console.log(`[${channel.slug}] Prediction Created:`, event)
})

client.on('predictionUpdated', (event, channel) => {
    console.log(`[${channel.slug}] Prediction Updated:`, event)
})

client.on('rewardRedeemed', (event, channel) => {
    console.log(`[${channel.slug}] Reward Redeemed:`, event)
})

client.on('channelSubscription', (event, channel) => {
    console.log(`[${channel.slug}] Channel Subscription:`, event)
})

client.on('luckyUsersWhoGotGiftSubscriptions', (event, channel) => {
    console.log(`[${channel.slug}] Lucky Users Who Got Gift Subscriptions:`, event)
})

client.on('videoPrivated', (event, channel) => {
    console.log(`[${channel.slug}] Video Privated:`, event)
})

client.on('giftsLeaderboardUpdated', (event, channel) => {
    console.log(`[${channel.slug}] Gifts Leaderboard Updated:`, event)
})

client.on('chatMoveToSupportedChannel', (event, channel) => {
    console.log(`[${channel.slug}] Chat Move to Supported Channel:`, event)
})

async function joinRandomChannels() {
    try {
        const req = await fetch('https://web.kick.com/api/v1/livestreams?limit=5&sort=viewer_count_desc')
        const data = await req.json()
        const channelsToJoin = data.data.livestreams.map((stream: any) => stream.channel.slug)

        console.log('Joining channels:', channelsToJoin.join(', '))
        channelsToJoin.forEach((slug: string) => {
            client.join(slug)
        })

    } catch (error) {
        console.error("Failed to fetch top streams, joining a default channel.", error)
    }
}

// joinRandomChannels()

