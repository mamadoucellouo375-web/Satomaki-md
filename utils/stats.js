// stats.js - Statistiques d'usage du bot (en mémoire + persistées)
import fs from 'fs'
import configmanager from './configmanager.js'

// Initialiser les stats dans config si absent
if (!configmanager.config.stats) {
    configmanager.config.stats = {
        totalCommands: 0,
        commandCounts: {},
        topUsers: {},
        startedAt: Date.now()
    }
}

const stats = configmanager.config.stats

export function trackCommand(command, userId) {
    stats.totalCommands++
    stats.commandCounts[command] = (stats.commandCounts[command] || 0) + 1
    stats.topUsers[userId] = (stats.topUsers[userId] || 0) + 1
    // Sauvegarder toutes les 50 commandes pour éviter trop d'I/O
    if (stats.totalCommands % 50 === 0) configmanager.save()
}

export function getTopCommands(n = 10) {
    return Object.entries(stats.commandCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
}

export function getTopUsers(n = 5) {
    return Object.entries(stats.topUsers)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
}

export function getUptimeFormatted() {
    const s = Math.floor((Date.now() - stats.startedAt) / 1000)
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
    return `${h}h ${m}m ${sec}s`
}

export function getStats() {
    return { ...stats, topCommands: getTopCommands(), topUsers: getTopUsers(5) }
}

export default { trackCommand, getTopCommands, getTopUsers, getStats, getUptimeFormatted }
