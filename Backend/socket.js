const socketIo = require("socket.io")
const userModel = require("./models/user.model")
const captainModel = require("./models/captain.model")

let io

function initializeSocket(server) {
    io = socketIo(server, {
        cors: {
        origin: "*",
        methods: ["GET", "POST"],
        },
    })

    io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`)

        socket.on("join", async (data) => {
        const { userId, userType } = data
        console.log(`User joining: ${userId} as ${userType}`)

        if (userType === "user") {
            await userModel.findByIdAndUpdate(userId, { socketId: socket.id })
            console.log(`User ${userId} updated with socket ${socket.id}`)
        } else if (userType === "captain") {
            await captainModel.findByIdAndUpdate(userId, {
            socketId: socket.id,
            status: "active", // Set captain as active when they connect
            lastSeenAt: new Date(),
            })
            console.log(`Captain ${userId} updated with socket ${socket.id} and set to active`)
        }
        })

        socket.on("update-location-captain", async (data) => {
        const { userId, location } = data

        if (!location || !location.lat || !location.lng) {
            return socket.emit("error", { message: "Invalid location data" })
        }

        await captainModel.findByIdAndUpdate(userId, {
            location: {
            lat: location.lat,
            lng: location.lng,
            },
            status: "active", // Ensure captain stays active when updating location
            lastSeenAt: new Date(),
        })

        console.log(`Captain ${userId} location updated:`, location)
        })

        socket.on("captain-offline", async (data) => {
        const { userId } = data || {}

        if (!userId) {
            return
        }

        await captainModel.findByIdAndUpdate(userId, {
            status: "inactive",
            socketId: null,
            lastSeenAt: new Date(),
        })

        console.log(`Captain ${userId} set to inactive`)
        })

        socket.on("update-location-user", async (data) => {
        const { userId, location } = data

        if (!location || !location.lat || !location.lng) {
            return socket.emit("error", { message: "Invalid location data" })
        }

        await userModel.findByIdAndUpdate(userId, {
            location: {
            lat: location.lat,
            lng: location.lng,
            },
        })

        console.log(`User ${userId} location updated:`, location)
        })

        socket.on("disconnect", async () => {
        console.log(`Client disconnected: ${socket.id}`)

        // Set captain as inactive when they disconnect
        await captainModel.findOneAndUpdate({ socketId: socket.id }, { status: "inactive", socketId: null })

        // Clear user socket ID when they disconnect
        await userModel.findOneAndUpdate({ socketId: socket.id }, { socketId: null })
        })
    })
    }

    const sendMessageToSocketId = (socketId, messageObject) => {
    console.log(`Sending message to socket ${socketId}:`, messageObject.event)

    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data)
    } else {
        console.log("Socket.io not initialized.")
    }
}

module.exports = { initializeSocket, sendMessageToSocketId }
