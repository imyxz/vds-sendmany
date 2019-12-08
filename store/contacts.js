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
ipcRenderer.on('contract-reply-success', (event, {id, data}) => {
  resolveEvent(id, data)
})
ipcRenderer.on('contract-reply-error', (event, {id, data}) => {
  rejectEvent(id, data)
})
export const state = () => {
  return {
    contracts: []
  }
}
export const mutations = {
  update (state, payload) {
    state.contracts = payload
  },
  add(state, payload){
    state.contracts.push(payload)
  },
  del(state, {name, address}){
    state.contracts = state.contracts.filter(e => !(e.name == name && e.address == address))
  }
}
export const actions = {
  async loadContracts (context, payload = {}) {
    return new Promise((resolve, reject) => {
      let id = registerEvent((docs) => {
        context.commit('update', docs)
        resolve(docs)
      }, (data) => {
        reject(data)
      })
      ipcRenderer.send('load-contacts', {id})
    })
  },
  async addContract(context, {name, address}){
    context.commit('add', {name,address})
  },
  async delContract(context, {name,address}){
    context.commit('del', {name,address})
  },
  async saveContracts(context, payload){
    return new Promise((resolve, reject) => {
      let id = registerEvent((docs) => {
        context.commit('update', docs)
        resolve(docs)
      }, (data) => {
        reject(data)
      })
      ipcRenderer.send('save-contacts', {id, data: context.state.contracts})
    })
  },
  async loadFromJson(context, payload){
    return new Promise((resolve, reject) => {
      let id = registerEvent((data) => {
        resolve(data)
      }, (data) => {
        reject(data)
      })
      ipcRenderer.send('load-contact-json', {id})
    })
  },
  async saveToJson(context, payload){
    console.log(1)
    return new Promise((resolve, reject) => {
      let id = registerEvent((data) => {
        resolve(data)
      }, (data) => {
        reject(data)
      })
      ipcRenderer.send('save-contact-json', {id,data: payload})
    })
  }
}
export const getters = {

}