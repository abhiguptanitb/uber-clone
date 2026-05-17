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
        socket.on("join", async (data) => {
        const { userId, userType } = data

        if (userType === "user") {
            await userModel.findByIdAndUpdate(userId, { socketId: socket.id })
        } else if (userType === "captain") {
            await captainModel.findByIdAndUpdate(userId, {
            socketId: socket.id,
            status: "active", // Set captain as active when they connect
            lastSeenAt: new Date(),
            })
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
        })

        socket.on("disconnect", async () => {
        // Set captain as inactive when they disconnect
        await captainModel.findOneAndUpdate({ socketId: socket.id }, { status: "inactive", socketId: null })

        // Clear user socket ID when they disconnect
        await userModel.findOneAndUpdate({ socketId: socket.id }, { socketId: null })
        })
    })
    }

    const sendMessageToSocketId = (socketId, messageObject) => {
    if (io) {
        io.to(socketId).emit(messageObject.event, messageObject.data)
    }
}

module.exports = { initializeSocket, sendMessageToSocketId }
