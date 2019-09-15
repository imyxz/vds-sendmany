const {app, ipcMain} = require('electron')
const path = require('path')
const dbPath = app.getPath('userData')
var Datastore = require('nedb')
var dbContract = new Datastore({ filename: path.resolve(dbPath, "database.nedb") });
dbContract.loadDatabase(function (err) {
  if(err){
    console.log(err)
    app.exit(-1)
  }

});
ipcMain.on('load-contacts', (event, {id, data}) => {
  dbContract.find({}, function(err, docs) {
    if(err){
      console.log(err)
      app.exit(-2)
      return
    }
    event.sender.send('contract-reply', {id, data:docs})
  })
})
ipcMain.on('save-contacts', (event, {id, data}) => {
  dbContract.remove({}, {multi: true}, (err ,n) => {
    if(err){
      console.log(err)
      app.exit(-3)
      return
    }
    dbContract.insert(data, (err, docs) => {
      if(err){
        console.log(err)
        app.exit(-4)
        return
      }
      event.sender.send('contract-reply', {id, data: docs})
    })
  })
})