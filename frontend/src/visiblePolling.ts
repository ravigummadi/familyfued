// Fetch immediately when visible, then poll until hidden or cleaned up.
export function startVisiblePolling(fetch: () => void, intervalMs: number): () => void {
    let interval: number | undefined;

    const stop = () => {
        window.clearInterval(interval);
        interval = undefined;
    };

    const fetchIfVisible = () => {
        if (!document.hidden) fetch();
    };

    const onVisibilityChange = () => {
        if (document.hidden) {
            stop();
        } else if (interval === undefined) {
            fetchIfVisible();
            interval = window.setInterval(fetchIfVisible, intervalMs);
        }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    onVisibilityChange();
    return () => {
        stop();
        document.removeEventListener('visibilitychange', onVisibilityChange);
    };
}
