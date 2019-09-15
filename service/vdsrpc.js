const Client = require('bitcoin-core')
module.exports = class VdsRpc {
  constructor (host, port, username, password) {
    this.client = new Client({
      username: username,
      host: host,
      port: port,
      password: password,
      timeout: 30000
    })
  }
  async getBlockByHeight (height) {
    return this.client.command('getblock', String(height))
  }
  async getTransaction (txid) {
    return this.client.command('getrawtransaction', String(txid), true)
  }
  async getBlockByHash (hash) {
    return this.client.command('getblock', String(hash))
  }
  async getInputAddresses (vin, vouts) {
    let addresses = []
    // from mining
    if (vin.coinbase) {
      let amount = vouts.reduce((val, cur) => {
        return val + parseFloat(cur.value)
      }, 0)
      addresses.push({
        hash: 'coinbase',
        amount
      })
    } else {
      // from tx
      let tx = await this.getTransaction(vin.txid)
      let prev_vouts = tx.vout
      for (let vout of prev_vouts) {
        if (vout.n === vin.vout) {
          if (vout.scriptPubKey.addresses) {
            addresses.push({
              hash: vout.scriptPubKey.addresses[0],
              amount: parseFloat(vout.value)
            })
          }
        }
      }
    }
    return addresses
  }
  async getVinsFromTx (tx) {
    let vins = []
    let existAddresses = {}
    for (let vin of tx.vin) {
      let addresses = await this.getInputAddresses(vin, tx.vout)
      for (let address of addresses) {
        let addr
        if (existAddresses[address.hash]) {
          addr = existAddresses[address.hash]
        } else {
          addr = {
            hash: address.hash,
            amount: 0
          }
          existAddresses[address.hash] = addr
          vins.push(addr)
        }
        addr.amount = addr.amount + address.amount
      }
    }
    return vins
  }
  async getVoutsFromTx (tx) {
    let vouts = []
    let existAddresses = {}
    for (let vout of tx.vout) {
      if (vout.scriptPubKey.addresses === undefined) {
        continue
      }
      if (vout.scriptPubKey.type !== 'nonstandard' && vout.scriptPubKey.type !== 'nulldata') {
        let address_hash = vout.scriptPubKey.addresses[0]
        let addr
        if (existAddresses[address_hash] === undefined) {
          addr = {
            hash: address_hash,
            amount: 0
          }
          existAddresses[address_hash] = addr
          vouts.push(addr)
        } else {
          addr = existAddresses[address_hash]
        }
        addr.amount = addr.amount + parseFloat(vout.value)
      }
    }
    return vouts
  }
  async getMasterNodeList () {
    let list = await this.client.command('masternodelist', 'full')
    list = Object.getOwnPropertyNames(list).map(key => {
      let info = list[key].split(' ').map(e => e.trim()).filter(e => e !== '')
      return {
        address: key,
        status: info[0],
        protocol: info[1],
        payee: info[2],
        lastseen: info[3],
        activeseconds: info[4],
        lastpaidtime: info[5],
        lastpaidblock: info[6],
        ip: info[7]
      }
    })
    return list
  }
  async getMasterNodeWinners () {
    let list = await this.client.command('masternode', 'winners')
    return list
  }
  async getMasterNodeWinner () {
    let list = await this.client.command('masternode', 'winner')
    return list
  }
  async getInfo () {
    let list = await this.client.command('getinfo')
    return list
  }
  async getMiningInfo () {
    let list = await this.client.command('getmininginfo')
    return list
  }
  async callRpc(args){
    return this.client.command.apply(this.client, args)
  }
}