const {app, ipcMain} = require('electron')
const VdsRpc = require('../service/vdsrpc')
let vdsrpc = null
vdsrpc = new VdsRpc('127.0.0.1', 8232, 'aaaa', 'bbbb')
ipcMain.on('call-vds-rpc', async(event, {id, data}) => {
  try{
    let resp = await vdsrpc.callRpc(data)
    event.sender.send('call-vds-rpc-reply-success', {id, data: resp})
  }catch(e){
    event.sender.send('call-vds-rpc-reply-error', {id, data: event})
  }
})