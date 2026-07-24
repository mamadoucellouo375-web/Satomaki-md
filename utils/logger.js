// logger.js - Logging unifié et lisible pour NOVA REAPER MD

const COLORS = {
    reset: '\x1b[0m', dim: '\x1b[2m',
    red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
    blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m'
}

function timestamp() {
    return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function format(level, color, args) {
    return `${COLORS.dim}[${timestamp()}]${COLORS.reset} ${color}${level}${COLORS.reset} ${args.join(' ')}`
}

export const logger = {
    info: (...args) => console.log(format('INFO ', COLORS.cyan, args)),
    success: (...args) => console.log(format('OK   ', COLORS.green, args)),
    warn: (...args) => console.warn(format('WARN ', COLORS.yellow, args)),
    error: (...args) => console.error(format('ERROR', COLORS.red, args)),
    command: (cmd, user) => console.log(format('CMD  ', COLORS.magenta, [`.${cmd}`, COLORS.dim + `(${user})` + COLORS.reset])),
}

export default logger
