// const NodeRSA = require('node-rsa')

module.exports = function worker(self) {
    self.addEventListener('message', (event) => {
        console.log('event', event.data)
        // let { length, type } = event.data
        // const key = new NodeRSA({
        //     b: length
        // })
        // console.log('key', key)
        // self.postMessage({
        //     public: key.exportKey(type + '-public'),
        //     private: key.exportKey(type),
        //     e: key.keyPair.e,
        //     d: key.keyPair.d.toString(),
        //     p: key.keyPair.p.toString(),
        //     q: key.keyPair.q.toString(),
        //     n: key.keyPair.n.toString(),
        // })
    })
}
