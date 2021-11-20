export function isDev() {
    return !'%NODE_ENV%' || '%NODE_ENV%' === 'development';
}