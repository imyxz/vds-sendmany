const {ipcRenderer} = require('electron')
const events = {}
let eventId = 0
function resolveEvent(id, data){
  if(events[id]){
    events[id](data)
    delete events[id]
  }
}
function registerEvent(func){
  events[eventId] = func
  return eventId++
}
ipcRenderer.on('contract-reply', (event, {id, data}) => {
  resolveEvent(id, data)
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
      })
      ipcRenderer.send('save-contacts', {id, data: context.state.contracts})
    })
  }
}
export const getters = {

}