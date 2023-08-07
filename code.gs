//----------キャッシュ------------------------------------------------------------------------------------
var cache = CacheService.getScriptCache();
//------------------------------------------------------------------------------------------------------


function RSSread() {
  var now = new Date();
  var nowdate = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss')
  var Cache_PostID = cache.get('Cache_PostID');
  Logger.log(Cache_PostID);


  if (Cache_PostID == null) {
    return;
  }

  var Write_data = [];

  var xml = UrlFetchApp.fetch("https://unnerv.jp/@UN_NERV.rss").getContentText()
  //Logger.log(xml);
  var document = XmlService.parse(xml)
  var root = document.getRootElement()

  var entries = root.getChild('channel').getChildren('item');
  var count = 0;


  for (var i = entries.length - 1; i >= 0; i--) {
    var date = Utilities.formatDate(new Date(entries[i].getChildText('pubDate')), 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

    count = 0;
    var URLlink = entries[i].getChildText('link');                           //トゥートリンクを引っ張ってくる
    var PostID = URLlink.replace("https://unnerv.jp/@UN_NERV/", "");

    Logger.log(PostID)
    if (parseInt(PostID) > parseInt(Cache_PostID)) { //時限トリガーを一分毎×2にする

      var content = entries[i].getChildText('description').replace(/<br \/>/g, "\n").replace(/<("[^"]*"|'[^']*'|[^'">])*>/g, '');

      /*Discord 発報文 抽出*/
      if (content.match(/#NHKニュース速報/) || content.match(/#緊急\s/m) || content.match(/#緊急$/)
        || content.match(/#ニュース/) || content.match(/#Jアラート/) || content.match(/#地震の震源要素更新/) || content.match(/#津波/)
        || content.match(/震度５弱/) || content.match(/震度５強/) || content.match(/震度６弱/) || content.match(/震度６強/) || content.match(/震度７/)
        || content.match(/震度5弱/) || content.match(/震度5強/) || content.match(/震度6弱/) || content.match(/震度6強/) || content.match(/震度7/)) {
        // 適宜ココの条件は変更する。
        Logger.log(content);
        Logger.log("更新対象です");

        

        var Imagelinks = [];
        var images = entries[i].getChildren('enclosure');
        for (var j = 0; j < images.length; j++) {
          Imagelinks.push(images[j].getAttribute('url').getValue());
        }

        Logger.log(Imagelinks)
        Logger.log(URLlink)
        var Write_data_array = [date, content, URLlink, nowdate, Imagelinks];
        Write_data.push(Write_data_array);

        var temp_PostID = 0;
        if (PostID > temp_PostID) {
          temp_PostID = PostID;
        }
      }


    } else {

    }
  }


  if (Write_data != "") {
    DiscordPost_write(Write_data);
    Cache_PostID = temp_PostID;
  }



  Logger.log(Write_data_array);
  cache.put('Cache_PostID', Cache_PostID, 60 * 60 * 6);
  Logger.log(Cache_PostID);
}

function DiscordPost_write(Write_data) {
  Logger.log(Write_data)
  var Write_data = Write_data.filter(function (e, index) {
    return !Write_data.some(function (e2, index2) {
      return index > index2 && e[0] == e2[0] && e[1] == e2[1] && e[2] == e2[2] && e[3] == e2[3] && e[4] == e2[4];
    });
  });
  Logger.log(Write_data)
  for (var v = 0; v < Write_data.length; v++) {
    //Sheet.insertRows(3) //行数増やして、最新順にするようにする
  }
  Write_data.sort(function (a, b) { return (b[2].replace("https://unnerv.jp/@UN_NERV/", "") - a[2].replace("https://unnerv.jp/@UN_NERV/", "")); });
  Logger.log(Write_data)
  Logger.log(Write_data.length)

  for (var w = Write_data.length - 1; w >= 0; w--) {
    var dateNERV = "NERV発信時刻:" + Write_data[w][0];  //NERVがトゥートした時間のテキスト
    var message = Write_data[w][1];
    var URLlink = Write_data[w][2];
    var Imagelink = Write_data[w][4][0];
    var Image_num = Write_data[w][4].length;
    Logger.log(w)


    Logger.log(message, Imagelink, URLlink, dateNERV, Image_num);
    discord(message, Imagelink, URLlink, dateNERV, Image_num);
  }
}



//Discord出力
function discord(message, Imagelink, URLlink, dateNERV, Image_num) {//DiscordのWebhook
  var secondImage = "";
  if (Image_num >= 2) {
    secondImage = "\n他画像データあり";
  }

  const Icon_url = 'https://media.unnerv.jp/accounts/avatars/000/000/070/original/8111742fb6348b21.png';
  const method = 'post';
  const username = '特務機関NERV';

  //message = "test";
  //if(Postserver == "sushiro" || Postserver == "ANY"){
  var url = '';    //webhookのURL
  var token = '';  //webhookのToken
  var payload = {
    'token': token,
    "content": message,
    'username': username,
    'avatar_url': Icon_url,
    "embeds": [
      {
        "author": {
          "name": username,
          "url": "https://unnerv.jp",
          "icon_url": Icon_url
        },
        "description": "[" + dateNERV + "](" + URLlink + ")" + secondImage,
        "image": { "url": Imagelink },
      }]
  };

  var params = {
    'method': method,
    'payload': JSON.stringify(payload),
    'headers': { 'Content-type': 'application/json' },
    'muteHttpExceptions': true
  };
  response = UrlFetchApp.fetch(url, params);
  //}


}

function clear() {
  cache.put('Cache_PostID', "0", 60 * 60 * 6);
  Logger.log("リセットしました。");
}
