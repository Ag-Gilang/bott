let fs = require('fs')
let path = require('path')
let fetch = require('node-fetch')
let levelling = require('../lib/levelling')
const thumb = fs.readFileSync('./src/thumb.jpeg')
let tags = {
  'main': 'Main',
  'game': 'Game Menu',
  'xp': 'Exp & Limit',
  'sticker': 'Sticker',
  'kerang': 'Kerang Ajaib',
  'quotes': 'Quotes',
  'admin': 'Admin',
  'group': 'Group',
  'premium': 'VVIP Menu',
  'internet': 'Internet',
  'anonymous': 'Anonymouse Chat',
  'nulis': 'MagerNulis & Logo',
  'downloader': 'Downloader',
  'tools': 'Tools',
  'fun': 'Fun',
  'database': 'Database',
  'vote': 'Voting',
  'absen': 'Absen',
  'quran': 'Al Quran',
  'jadibot': 'Jadi Bot',
  'owner': 'Owner Menu',
  'host': 'Host',
  'advanced': 'Advanced',
  'info': 'Ingfo',
  '': 'π½πΎ π²π°ππ΄πΆπΎππ',
}
const defaultMenu = {
  before: `
ββͺ ββ*γ ```%me``` γ*ββ
β β 
β ββ*Hai  : %name!*
β ββ*limit : %limit Limit*
β ββ*Role : %role*
β ββ*Level: %level (%exp / %maxexp)* 
β ββ*Total Xp : %totalexp*
β 
ββͺ *TIME β³*
β ββ*Hari: %week %weton*
β ββ*Tanggal : %date*
β ββ*Waktu: %time*
β
ββͺ *STATUS BOT*
β ββ*Uptime: %uptime (%muptime)*
β ββ*Database: %rtotalreg of %totalreg*
β ββ*${chats.length}* Total Chat
β
ββͺ *INFO OWNER BOT*
ββ
βββ wa.me/6289678391870
βββ *tele owner : @aryagilangg*
βββ *Ig owner : @_aryagilang*
βββ _*Β© Aryagilang*_
ββββββββββββββββββββββββ
%readmore`.trimStart(),
  header: 'βββ*γ ```%category``` γ*ββ',
  body: 'ββͺ %cmd %islimit %isPremium',
  footer: 'ββββββββββββββββββββββββ\n\n',
  after: `
*%npmname@^%version*
${'```%npmdesc```'}
`,
}
let handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    let package = JSON.parse(await fs.promises.readFile(path.join(__dirname, '../package.json')).catch(_ => '{}'))
    let { exp, limit, level, role } = global.db.data.users[m.sender]
    let { min, xp, max } = levelling.xpRange(level, global.multiplier)
    let name = conn.getName(m.sender)
    let d = new Date(new Date + 3600000)
    let locale = 'id'
    // d.getTimeZoneOffset()
    // Offset -420 is 18.00
    // Offset    0 is  0.00
    // Offset  420 is  7.00
    let weton = ['Pahing', 'Pon', 'Wage', 'Kliwon', 'Legi'][Math.floor(d / 84600000) % 5]
    let week = d.toLocaleDateString(locale, { weekday: 'long' })
    let date = d.toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    let dateIslamic = Intl.DateTimeFormat(locale + '-TN-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).format(d)
    let time = d.toLocaleTimeString(locale, {
      hour12: false
    })
    let _uptime = process.uptime() * 1000
    let _muptime
    if (process.send) {
      process.send('uptime')
      _muptime = await new Promise(resolve => {
        process.once('message', resolve)
        setTimeout(resolve, 1000)
      }) * 1000
    }
    let muptime = clockString(_muptime)
    let uptime = clockString(_uptime)
    let totalreg = Object.keys(global.db.data.users).length
    let rtotalreg = Object.values(global.db.data.users).filter(user => user.registered == true).length
    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
      return {
        help: Array.isArray(plugin.tags) ? plugin.help : [plugin.help],
        tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
        prefix: 'customPrefix' in plugin,
        limit: plugin.limit,
        premium: plugin.premium,
        enabled: !plugin.disabled,
      }
    })
    for (let plugin of help)
      if (plugin && 'tags' in plugin)
        for (let tag of plugin.tags)
          if (!(tag in tags) && tag) tags[tag] = tag
    conn.menu = conn.menu ? conn.menu : {}
    let before = conn.menu.before || defaultMenu.before
    let header = conn.menu.header || defaultMenu.header
    let body = conn.menu.body || defaultMenu.body
    let footer = conn.menu.footer || defaultMenu.footer
    let after = conn.menu.after || (conn.user.jid == global.conn.user.jid ? '' : `Powered by https://wa.me/${global.conn.user.jid.split`@`[0]}`) + defaultMenu.after
    let _text = [
      before,
      ...Object.keys(tags).map(tag => {
        return header.replace(/%category/g, tags[tag]) + '\n' + [
          ...help.filter(menu => menu.tags && menu.tags.includes(tag) && menu.help).map(menu => {
            return menu.help.map(help => {
              return body.replace(/%cmd/g, menu.prefix ? help : '%p' + help)
                .replace(/%islimit/g, menu.limit ? '(Limit)' : '')
                .replace(/%isPremium/g, menu.premium ? '(Premium)' : '')
                .trim()
            }).join('\n')
          }),
          footer
        ].join('\n')
      }),
      after
    ].join('\n')
    text = typeof conn.menu == 'string' ? conn.menu : typeof conn.menu == 'object' ? _text : ''
    let replace = {
      '%': '%',
      p: _p, uptime, muptime,
      me: conn.user.name,
      npmname: package.name,
      npmdesc: package.description,
      version: package.version,
      exp: exp - min,
      maxexp: xp,
      totalexp: exp,
      xp4levelup: max - exp,
      github: package.homepage ? package.homepage.url || package.homepage : '[unknown github url]',
      level, limit, name, weton, week, date, dateIslamic, time, totalreg, rtotalreg, role,
      readmore: readMore
    }
    text = text.replace(new RegExp(`%(${Object.keys(replace).sort((a, b) => b.length - a.length).join`|`})`, 'g'), (_, name) => '' + replace[name])
    //Iya bang sy nub
    const reply = {
    key: {
        participant: '0@s.whatsapp.net'
    },
    message: {
        orderMessage: {
            itemCount: 1122334455,
            itemCoun: 404,
            surface: 404,
            message: `Β© ${conn.user.name}`,
            orderTitle: 'B',
            thumbnail: thumb,
            sellerJid: '0@s.whatsapp.net'
        }
    }
}
let fkon = { key: { fromMe: false, participant: `0@s.whatsapp.net`, ...(m.chat ? { remoteJid: '16504228206@s.whatsapp.net' } : {}) }, message: { contactMessage: { displayName: `Relldev`, vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;a,;;;\nFN: Rlxfly UwU\nitem1.TEL;waid=6283820073017:6283820073017\nitem1.X-ABLabel:Ponsel\nEND:VCARD`}}}
conn.send3ButtonImg(m.chat, thumb, `Here My Menu...`, text.trim(), 'ping', '.ping', 'owner', '-owner', 'donasi', '.donasi', reply)
  } catch (e) {
    conn.reply(m.chat, 'Maaf, menu sedang error', m)
    throw e
  }
}
handler.help = ['menu', 'help', '?']
handler.tags = ['main']
handler.command = /^(menu|help|\?)$/i
handler.owner = false
handler.mods = false
handler.premium = false
handler.group = false
handler.private = false

handler.admin = false
handler.botAdmin = false

handler.fail = null
handler.exp = 3


module.exports = handler

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

function clockString(ms) {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}
