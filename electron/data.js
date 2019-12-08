const {
  app,
  ipcMain,
  dialog
} = require('electron')
const path = require('path')
const dbPath = app.getPath('userData')
const fs = require('fs')
var Datastore = require('nedb')
var dbContract = new Datastore({
  filename: path.resolve(dbPath, "database.nedb")
});
dbContract.loadDatabase(function (err) {
  if (err) {
    console.log(err)
    app.exit(-1)
  }

});
ipcMain.on('load-contacts', (event, {
  id,
  data
}) => {
  dbContract.find({}, function (err, docs) {
    if (err) {
      console.log(err)
      app.exit(-2)
      return
    }
    event.sender.send('contract-reply-success', {
      id,
      data: docs
    })
  })
})
ipcMain.on('save-contacts', (event, {
  id,
  data
}) => {
  dbContract.remove({}, {
    multi: true
  }, (err, n) => {
    if (err) {
      console.log(err)
      app.exit(-3)
      return
    }
    dbContract.insert(data, (err, docs) => {
      if (err) {
        console.log(err)
        app.exit(-4)
        return
      }
      event.sender.send('contract-reply-success', {
        id,
        data: docs
      })
    })
  })
})
ipcMain.on('load-contact-json', async (event, {
  id,
  data
}) => {
  try {
    let result = dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{
        name: 'vds通讯录',
        extensions: ['vdscontact']
      }]
    })
    if (!result || result.length == 0) {
      throw '没有选择文件'
    }
    let filedata = fs.readFileSync(result[0])
    filedata = JSON.parse(filedata)
    event.sender.send('contract-reply-success', {
      id,
      data: filedata
    })
  } catch (e) {
    console.log(e)
    event.sender.send('contract-reply-error', {
      id,
      data: e
    })
  }

})
ipcMain.on('save-contact-json', async (event, {
  id,
  data
}) => {
  try {
    let result = dialog.showOpenDialog({
      properties: ['openFile', 'promptToCreate'],
      filters: [{
        name: 'vds通讯录',
        extensions: ['vdscontact']
      }],
      title: '另存为'
    })
    if (!result || result.length == 0) {
      throw '没有选择文件'
    }
    let json = JSON.stringify(data)
    fs.writeFileSync(result[0], json)
    console.log(json)
    event.sender.send('contract-reply-success', {
      id,
      data: ''
    })
  } catch (e) {
    event.sender.send('contract-reply-error', {
      id,
      data: e
    })
  }
})