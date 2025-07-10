
function formatTimeStamp(timeStamp) {
    const now = new Date();
    const time = Math.floor((now - timeStamp) / 1000)
    const timeIntervals = [
        { interval: 'year', seconds: 31536000 },
        { interval: 'month', seconds: 2628000 },
        { interval: 'week', seconds: 604800 },
        { interval: 'day', seconds: 86400 },
        { interval: 'hour', seconds: 3600 },
        { interval: 'minute', seconds: 60 },
        { interval: 'second', seconds: 1},
    ];
    for( const timeInterval of timeIntervals) {
        const quotient = Math.floor(time / timeInterval.seconds);
        if(quotient > 0) {
            return `${quotient} ${timeInterval.interval}${quotient > 1 ? 's' : ''} ago`
        }
    };
    return 'just now';
}

export { formatTimeStamp };