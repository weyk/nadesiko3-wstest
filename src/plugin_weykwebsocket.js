/**
 * file: plugin_weykwebsocket.js
 * WebSocketのためのプラグイン (wsをラップしたもの)
 */
const WebSocketServer = require('ws').Server
const WebSocketClient = require('ws').Client
const https = require('https')
const fs = require('fs')

let app = null

// 定数・変数
const ERROR_NO_INIT = '先に『WSサーバ起動』命令を実行してください。'

const PluginWebsocket = {
    '初期化': {
    type: 'func',
    josi: [],
    fn: function (sys) {
      // イベント変数を初期化
      sys.__v0['WSサーバ:ONSUCCESS'] = null
      sys.__v0['WSサーバ:ONERROR'] = null
      sys.__v0['WSサーバ:ONCLOSE'] = null
      sys.__v0['WSサーバ:ONMESSAGE'] = null
      sys.__v0['WSサーバ:ONPING'] = null
      sys.__v0['WSサーバ:ONPONG'] = null
      sys.__v0['WSサーバ:ONCONNECTION'] = null
      // サーバーのイベントを設定
      sys.__ws_setEvent = (app, sys) => {
        app.on('connection', (ws, req) => {
          const cbCon = sys.__v0['WSサーバ:ONCONNECTION']
          if (cbCon) {
            sys.__v0['対象'] = req
            sys.__v0['WSソケット'] = ws
            sys.__ws = ws;
            cbCon(sys)
          }
          ws.on('message', (msg) => {
            const cbMsg = sys.__v0['WSサーバ:ONMESSAGE']
            sys.__v0['対象'] = msg
            sys.__v0['WSサーバ相手'] = ws._socket._peername.address + ':' + ws._socket._peername.port
            sys.__v0['WSソケット'] = ws
            sys.__ws = ws;
            // console.log(Object.keys(ws._socket));
            // console.log(ws._socket._peername);
            if (cbMsg) cbMsg(sys)
          })
          ws.on('ping', (data) => {
            const cbPing = sys.__v0['WSサーバ:ONPING']
            sys.__v0['対象'] = data
            sys.__v0['WSサーバ相手'] = ws._socket._peername.address + ':' + ws._socket._peername.port
            sys.__v0['WSソケット'] = ws
            if (cbPing) cbPing(sys)
          })
          ws.on('pong', (data) => {
            const cbPong = sys.__v0['WSサーバ:ONPONG']
            sys.__v0['対象'] = data
            sys.__v0['WSサーバ相手'] = ws._socket._peername.address + ':' + ws._socket._peername.port
            sys.__v0['WSソケット'] = ws
            if (cbPong) cbPong(sys)
          })
          ws.on('close', () => {
            const cbClose = sys.__v0['WSサーバ:ONCLOSE']
            sys.__v0['WSサーバ相手'] = ws._socket._peername.address + ':' + ws._socket._peername.port
            sys.__v0['WSソケット'] = ws
            sys.__ws = ws;
            if (cbClose) cbClose(sys)
          })
        })
        app.on('close', (e) => {
          console.log('ws::close', e)
        })
        app.on('error', (e) => {
          const callback = sys.__v0['WSサーバ:ONERROR']
          if (callback) callback(e, sys)
        })
        // サーバの成功時
        const callback = sys.__v0['WSサーバ:ONSUCCESS']
        if (callback) callback(sys)
      }
    }
  },
  // @WebSocketサーバ
  'WSサーバ起動': { // @ポートPORTNOでサーバを起動して成功したら『WSサーバ起動成功した時』を実行する // @WSさーばきどう
    type: 'func',
    josi: [['の', 'で']],
    fn: function (portno, sys) {
      if (typeof portno === 'number') {
        app = new WebSocketServer({port: portno}) // WSを起動
      } else {
        app = new WebSocketServer({server: portno}) // WSを起動
      }
      sys.__ws_setEvent(app, sys) // イベントを設定
      return app
    }
  },
  'WSSサーバ起動': { // @設定CONF{cert:サーバ証明書,key:キーファイル,port:ポート番号}を指定してWSSサーバを起動して成功したら『WSサーバ起動成功した時』を実行する // @WSSさーばきどう
    type: 'func',
    josi: [['の', 'で']],
    fn: function (conf, sys) {
      // @see https://www.npmjs.com/package/ws#external-https-server
      // サーバー証明書など読み取り
      try {
        certBody = fs.readFileSync(conf.cert) // サーバ証明書
        keyBody = fs.readFileSync(conf.key) // キーファイル 
      } catch (e) {
        throw new Error('『WSSサーバ起動』でサーバ証明書ファイルが読み込めません。' + e.message)
      }
      // HTTPSサーバーの起動
      let web
      try {
        web = https.createServer({
          cert: certBody,
          key: keyBody
        })
      } catch (e) {
        throw new Error('『WSSサーバ起動』でHTTPSサーバが起動できません。証明書ファイルが間違っている可能性があります。ファイルを確認してください。' + e.message)
      }
      // WSSを起動
      app = new WebSocketServer({server: web})
      web.listen(conf.port)
      sys.__ws_setEvent(app, sys) // イベントを設定
      return app
    }
  },
  'WSサーバ起動成功時': { // @WSサーバ起動が成功した時にcallbackを実行 // @WSさーばきどうせいこうしたとき
    type: 'func',
    josi: [['を']],
    fn: function (callback, sys) {
      sys.__v0['WSサーバ:ONSUCCESS'] = callback
    },
    return_none: true
  },
  'WSサーバ起動失敗時': { // @WSサーバ起動が失敗した時にcallbackを実行 // @WSさーばきどうしっぱいしたとき
    type: 'func',
    josi: [['を']],
    fn: function (callback, sys) {
      sys.__v0['WSサーバ:ONERROR'] = callback
    },
    return_none: true
  },
  'WSサーバ接続時': { // @WSサーバにクライアントが接続してきた時callbackを実行。接続情報は、変数『対象』に入る // @WSさーばせつぞくしたとき
    type: 'func',
    josi: [['を']],
    fn: function (callback, sys) {
      sys.__v0['WSサーバ:ONCONNECTION'] = callback
    },
    return_none: true
  },
  'WSサーバ受信時': { // @WSサーバでメッセージを受信した時に実行される。クライアントのIPアドレスとポートは『WSサーバー相手』に受信データは『対象』に代入される // @WSさーばじゅしんしたとき
    type: 'func',
    josi: [['で']],
    fn: function (callback, sys) {
      sys.__v0['WSサーバ:ONMESSAGE'] = callback
    },
    return_none: true
  },
  'WSサーバピン時': { // @WSサーバでPINGを受信した時に実行される。クライアントのIPアドレスとポートは『WSサーバー相手』に受信データは『対象』に代入される // @WSさーばぴんしたとき
    type: 'func',
    josi: [['で']],
    fn: function (callback, sys) {
      sys.__v0['WSサーバ:ONPING'] = callback
    },
    return_none: true
  },
  'WSサーバポン時': { // @WSサーバでPONGを受信した時に実行される。クライアントのIPアドレスとポートは『WSサーバー相手』に受信データは『対象』に代入される // @WSさーばぽんしたとき
    type: 'func',
    josi: [['で']],
    fn: function (callback, sys) {
      sys.__v0['WSサーバ:ONPONG'] = callback
    },
    return_none: true
  },
  'WSサーバ閉時': { // @WSサーバでクライアントが閉じた時に実行される。クライアントのIPアドレスとポートは『WSサーバー相手』に代入される // @WSさーばとじたとき
    type: 'func',
    josi: [['で']],
    fn: function (callback, sys) {
      sys.__v0['WSサーバ:ONCLOSE'] = callback
    },
    return_none: true
  },
  'WSサーバ全送信': { // @WSサーバで全員にメッセージSを送信する // @WSさーばぜんそうしん
    type: 'func',
    josi: [['を']],
    fn: function (s, sys) {
      if (!app) throw new Error(ERROR_NO_INIT)
      app.clients.forEach((client) => {
        client.send(s)
      })
    },
    return_none: true
  },
  'WSサーバ相手': {type: 'const', value: ''}, // @WSさーばあいて
  'WSソケット': {type: 'const', value: ''}, // @WSそけっと
  'WSサーバ個別閉': { // @WSサーバで個別に閉じる // @WSさーばとじる
    type: 'func',
    josi: [['を','に']],
    fn: function (ws, sys) {
      if (!app) throw new Error(ERROR_NO_INIT)
      ws.close()
    },
    return_none: true
  },
  'WSサーバ個別送信': { // @WSサーバで個別にWSへメッセージSを送信する // @WSさーばこべつそうしん
    type: 'func',
    josi: [['へ','に'],['を']],
    fn: function (ws, s, sys) {
      if (!app) throw new Error(ERROR_NO_INIT)
      ws.send(s)
    },
    return_none: true
  },
  'WSサーバピン送信': { // @WSサーバで個別にWSへPINGを送信する // @WSさーばぴんそうしん
    type: 'func',
    josi: [['へ','に'],['を']],
    fn: function (ws, s, sys) {
      if (!app) throw new Error(ERROR_NO_INIT)
      ws.ping(s)
    },
    return_none: true
  },
  'WSサーバポン送信': { // @WSサーバで個別にWSへPONGを送信する // @WSさーばぽんそうしん
    type: 'func',
    josi: [['へ','に'],['を']],
    fn: function (ws, s, sys) {
      if (!app) throw new Error(ERROR_NO_INIT)
      ws.pong(s)
    },
    return_none: true
  },
  'WSクライアント一覧取得': { // @WSサーバに接続しているクライアントの一覧を返す // @WSくらいあんといちらんしゅとく
    type: 'func',
    josi: [['を']],
    fn: function (s, sys) {
      if (!app) throw new Error(ERROR_NO_INIT)
      return app.clients
    },
    return_none: true
  }
}

module.exports = PluginWebsocket
