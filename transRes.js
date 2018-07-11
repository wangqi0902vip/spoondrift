let fs = require('fs')
let path = require('path')
let fileList = []
let sounds = ['mp3', 'wav']

async function findFile (dir, dirname) {
  dir = path.resolve(dir)
  await fs.readdir(dir, (e, v) => {
    v.map((a, i) => {
      if (a.match(/\./)) {
        if (a.split('.')[0] === 'resource') return false
        fileList.push(JSON.stringify({
          name: sounds.includes(a.split('.')[1].toLowerCase()) ? 'sound_' + a.split('.')[0]:a.split('.')[0],
          group: dirname,
          src: './static/game/' + (dirname === undefined ? '' : (dirname + '/') ) + a
        }))
      } else {
        if (a.split('-')[0] === 'spine') {
          fileList.push(JSON.stringify({
            name: a.split('-')[1],
            group: dirname,
            src: './static/game/' + a + '/animate/' + a.split('-')[1] + '.json'
          }))
        } else {
          findFile(dir + '/' + a, a)
        }
      }

    })
  })
}

function trans (dir) {
  findFile(dir)
  setTimeout(() => {
    makeJson(dir + '/resource.json', '[' + fileList + ']')
  }, 1000)
}

function makeJson (dir, str) {
  if (fs.existsSync(dir)) {
    fs.unlinkSync(dir)
  }
  fs.appendFile(dir, str, (e) => {
    console.log(e)
  })
}

trans('./static/game/')
