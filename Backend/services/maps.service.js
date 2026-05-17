const axios = require("axios")
const captainModel = require("../models/captain.model")

const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN

module.exports.getAddressCoordinate = async (address) => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}`

    try {
        const response = await axios.get(url)
        if (response.data.features && response.data.features.length > 0) {
        const location = response.data.features[0].geometry.coordinates
        return {
            lng: location[0],
            lat: location[1], // Changed from 'ltd' to 'lat' for consistency
        }
        } else {
        throw new Error("Unable to fetch coordinates")
        }
    } catch (err) {
        throw err
    }
}

module.exports.getDistanceTime = async (originAddress, destinationAddress) => {
    if (!originAddress || !destinationAddress) {
        throw new Error("Origin and destination are required")
    }

    const origin = await module.exports.getAddressCoordinate(originAddress)
    const destination = await module.exports.getAddressCoordinate(destinationAddress)

    const originCoords = `${origin.lng},${origin.lat}` // Changed from 'ltd' to 'lat'
    const destinationCoords = `${destination.lng},${destination.lat}` // Changed from 'ltd' to 'lat'

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${originCoords};${destinationCoords}?access_token=${mapboxToken}&overview=full`

    try {
        const response = await axios.get(url)
        if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0]
        return {
            distance: route.distance, // in meters
            duration: route.duration, // in seconds
        }
        } else {
        throw new Error("No routes found")
        }
    } catch (err) {
        throw err
    }
}

module.exports.getAutoCompleteSuggestions = async (input) => {
    if (!input) {
        throw new Error("Query is required")
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json?access_token=${mapboxToken}&autocomplete=true`

    try {
        const response = await axios.get(url)
        if (response.data.features) {
        return response.data.features.map((feature) => feature.place_name).filter((value) => value)
        } else {
        throw new Error("Unable to fetch suggestions")
        }
    } catch (err) {
        throw err
    }
}

module.exports.getCaptainsInTheRadius = async (lat, lng, radius) => {
    // radius in km
    const captains = await captainModel.find({
        location: {
        $geoWithin: {
            $centerSphere: [[lng, lat], radius / 6371], // Note: longitude comes first in GeoJSON
        },
        },
    })

    return captains
}
