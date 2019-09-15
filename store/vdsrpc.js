import { iif } from 'rxjs'

const {ipcRenderer} = require('electron')
const events = {}
let eventId = 0
function resolveEvent(id, data){
  if(events[id]){
    events[id].resolve(data)
    delete events[id]
  }
}
function rejectEvent(id, data){
  if(events[id]){
    events[id].reject(data)
    delete events[id]
  }
}
function registerEvent(resolve,reject){
  events[eventId] = {
    resolve,reject
  }
  return eventId++
}
ipcRenderer.on('call-vds-rpc-reply-success', (event, {id, data}) => {
  resolveEvent(id, data)
})
ipcRenderer.on('call-vds-rpc-reply-error', (event, {id, data}) => {
  rejectEvent(id, data)
})
export const state = () => {
  return {
    contracts: []
  }
}
export const mutations = {

}
async function callRpc(...args){
  return new Promise((resolve,reject) => {
    let id = registerEvent(resolve, reject)
    ipcRenderer.send('call-vds-rpc', {id, data: args})
  })
}
function explainArray(arr){
  let result = []
  function doExplainArray(_arr){
    if(_arr instanceof Array){
      _arr.forEach(e => doExplainArray(e))
    }else{
      result.push(_arr)
    }
  }
  doExplainArray(arr)
  return result
}
export const actions = {
  async getWalletInfo(){
    return callRpc('getwalletinfo')
  },
  async getAddressesInfo(){
    let data = await callRpc('listaddressgroupings')
    data = explainArray(data)
    let result = []
    for(let i=0;i<data.length;i+=2){
      result.push({
        address: data[i],
        amount: data[i+1]
      })
    }
    return result
  },
  async unlockWallet(context, password){
    return callRpc('walletpassphrase', password, 60)
  },
  async sendMany(context, {
    fromAddress,
    receivers,
    comment,
    feeFrom
  }){
    return callRpc('sendmany', fromAddress, receivers, 1, comment, feeFrom)
  }
}
export const getters = {

}