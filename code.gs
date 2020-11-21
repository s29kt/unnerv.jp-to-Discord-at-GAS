function RSSread() {
  var Mastodon = "https://unnerv.jp/" + "※1";　　　//https://unnerv.jp/about/more から※1を指定
  var feedURL  = Mastodon + ".atom";//取得したいRSSのURL化
  var now      = new Date();
  var nowdate  = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss')
  
  
  var message = "";
  var text    = "";
  
  var xml      = UrlFetchApp.fetch(feedURL).getContentText()
  var document = XmlService.parse(xml)
  var root     = document.getRootElement()
  var atom     = XmlService.getNamespace('http://www.w3.org/2005/Atom')
  
  var entries = root.getChildren('entry', atom)
  for (var i = 0; i < entries.length; i++) {
    var updated = entries[i].getChild('updated', atom).getText()
    var date    = Utilities.formatDate(new Date(updated), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss')
    
    var content = entries[i].getChild('content', atom).getText()
    content = content.substr(content.indexOf("【"))
    content = content.replace('<br />',"\n");
    var a   = content.substr(content.indexOf("<br />"))
    content = content.replace(a,"\n");
    
    
    var activity  = XmlService.getNamespace("http://activitystrea.ms/spec/1.0/")
    var links     = entries[i].getChild('object', activity).getChildren('link', atom)　　　//リンク集を引っ張ってくる
    var Imagelink = links[2].getAttribute('href').getValue()                              //画像リンクを引っ張ってくる
    if(Imagelink.slice(-4) !== ".png"){                                                   //画像があるトゥートか(引っ張ってきたURLは.pngなのか)の確認if
      Imagelink = "";
    }
    
    var URLlink   = links[0].getAttribute('href').getValue()                              //トゥートリンクを引っ張ってくる
    
    var difference = (new Date(nowdate) - new Date(date)) / 1000; //(Discordに配信する(プログラムが動く)時間 - NERVがトゥートした時間) / 1000 = 差分 
    Logger.log(difference); //ログを確認すると秒数が表示される
    if((60 <= difference)&&(difference < 120)){ //時限トリガーを一分毎にする
      if(text !== ""){
        text = "---------------------------------------\n"
      }
      var dateNERV = "NERV発信時間:" + date;  //NERVがトゥートした時間のテキスト
      text = text + content + "\n";
      message = text;
      Logger.log(message)
      Logger.log(Imagelink)
      Logger.log(URLlink)
      discord(message,Imagelink,URLlink,Mastodon,dateNERV);  //まとめてDiscordに
    }else{
      break
    }
  }
}

//Discord出力
function discord(message,Imagelink,URLlink,Mastodon,dateNERV) {//DiscordのWebhook
  
  // message = "test";
  const url        = 'Webhook URL';
  const token      = 'Webhook URL末尾';
  const text       = message;
  const parse      = 'full';
  const method     = 'post';
  
  const payload = {
    'token'      : token,
    "content"    : text,
    "embeds": [
      {
        "author": {
          "name"    : "特務機関NERV",
          "url"     : Mastodon,     
          "icon_url": "https://media.unnerv.jp/accounts/avatars/000/000/070/original/8111742fb6348b21.png"
        },
        "description": "[" + dateNERV + "]("+ URLlink +")",
        "image"      : { "url" : Imagelink},
      }]
  };
  
  const params = {
    'method'  : method,
    'payload' : JSON.stringify(payload),
    'headers' : { 'Content-type': 'application/json' },
    'muteHttpExceptions': true
    
  };
  
  response = UrlFetchApp.fetch(url, params);
  
}
