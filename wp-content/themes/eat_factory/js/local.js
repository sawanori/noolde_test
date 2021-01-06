/*=====================================
* 変数の定義
=====================================*/
var map; // マップのインスタンスを格納する変数

var initOption = { // マップ初期表示用のオプション
	latLng: {
		lat: 25.032969,
		lng: 121.565418
	},
	zoom: 4
};
var messageTxt = document.getElementById('js-message');            // クリック訴求のメッセージ
var infoBox = document.getElementById('js-info');                  // クリックした役場の詳細情報を表示するエリア
var otherTable = document.getElementById('js-other');              // 同じ都道府県にあるその他役場を表示するテーブル
var otherTableTbody = document.querySelector('#js-other tbody');   // 上記テーブルのtbody

var jsonData;                                         // 取得したjsonデータ
var markersArray = [];                                // マーカーの配列
var navList = document.querySelectorAll('#js-nav a'); // ナビ
var newClearMarkersArray = [];                        // これから非表示にするマーカーの配列
var currentClearMarkersArray = [];                    // 非表示になっているマーカーの配列
var infoWindow;                                       // 店舗名を表示する吹き出し

var CLASS_HIDDEN = 'is-hidden'; // 非表示用のクラス名

var newAreaName;     // クリックしたナビのテキスト
var currentAreaName; // 比較するための変数


/*=====================================
* イベントの設定
=====================================*/

// ページの読み込みが完了後
window.addEventListener('load', function () {
	initMap();
});

// ナビをクリック時
for (var i = 0; i < navList.length; i++) {
	navList[i].addEventListener('click', function (e) {
		// デフォルトのイベントを無効化
		e.preventDefault();
		// クリックしたナビのテキストを保存
		var thisTxt = this.textContent;
		// マーカーの表示／非表示
		toggleShowMarkers(thisTxt);
		// 役場の詳細情報を非表示
		hideInfo(thisTxt);

		if (thisTxt === '全ての店舗表示') {
			// マーカーの吹き出しを非表示
			infoWindow.close();
			// 地図の表示位置を初期位置に戻す
			panZoomMap(initOption.latLng.lat, initOption.latLng.lng, initOption.zoom);
		} else {
			// 各々のdata属性の値を元に地図を拡大表示
			panZoomMap(this.dataset.lat, this.dataset.lng, this.dataset.zoom);
		}
	});
}



/*=====================================
* 関数群
=====================================*/

/**
* 初期表示用の関数
*/
function initMap() {
	// マップを作成（インスタンスを保存）
	map = new google.maps.Map(document.getElementById('js-map'), {
		center: initOption.latLng, // 表示位置の中心座標
		zoom: initOption.zoom // 表示倍率
	});
	// マーカーの初期設定
	initMaker();
}

/**
* マーカーの初期設定の関数
*/
function initMaker() {
	$.ajax({
		url: 'https://www.osaka-manmaru.com/wp-content/themes/eat_factory/js/data.json',
		dataType: 'json'
	})
	/* json取得できた際の処理
  ----------------------------------*/
		.done(function (data) {
		// 取得したjsonを変数に入れる
		jsonData = data;

		for (var i = 0; i < data.length; i++) {
			var element = data[i];
			

			// マーカーの作成
			var marker = new google.maps.Marker({
				position: {
					lat: Number(element['ido']), // 位置を設定
					lng: Number(element['keido'])
				},
				map: map, // 表示するマップを設定

				// 必要な情報を取得
				detail: {
					name: element['name'],
					areaName: element['area'],
					zipCode: element['number'],
					address: element['place'],
					tel: element['tel'],
					img:element['img'],
					time:element['time']
				}
			});

			// マーカーのオブジェクトを配列に格納
			markersArray.push(marker);

			// マーカーの情報を表示するウィンドウ
			infoWindow = new google.maps.InfoWindow();

			// マーカーをクリックした時の処理
			marker.addListener('click', function () {
				// 店舗情報を作成
				makeInfo(this.detail);
				// その他の店舗の情報を作成する
				makeOthers(this.detail.areaName, this.detail.name);
				// 作成した店舗情報を表示
				showInfo();
				// そのマーカーの地点を拡大表示
				panZoomMap(this.position.lat(), this.position.lng(), 16);
			});

			// マーカーをマウスオーバーした時の処理
			marker.addListener('mouseover', function () {
				infoWindow.setContent(this.detail.name);
				infoWindow.open(map, this);
			});
		}
	})
	/* json取得できなかった際の処理
  ----------------------------------*/
		.fail(function () {
		alert('データの読込に失敗しました。')
	});
}

/**
* 店舗情報を表示する関数
*/
function makeInfo(detailObj) {
	var htm = '<dl>';
	htm += '  <dt>' + detailObj.name + '</dt>';
	htm += '  <dd>〒' + detailObj.zipCode + '　' + detailObj.address + '</dd>';
	htm += '  <dd>電話番号：' + detailObj.tel + '</dd>';
	htm += '  <dd>営業時間：' + detailObj.time + '</dd>';
	htm += '</dl>';
	htm += '  <div class="shop-img-left"><img src="https://www.osaka-manmaru.com/wp-content/themes/eat_factory/img/shopimg/' + detailObj.img + '"></div>';
	infoBox.innerHTML = htm;
}

/**
* マーカーを表示／非表示する関数
*/
function toggleShowMarkers(areaName) {
	// 非表示になっているマーカーがあれば表示する
	if (currentClearMarkersArray.length !== 0) {
		for (var i = 0; i < currentClearMarkersArray.length; i++) {
			currentClearMarkersArray[i].setMap(map);
		}
	}
	// クリックしたテキストが全国だったら以降の処理を行わない
	if (areaName === '全ての店舗表示') {
		return;
	}
	// 同じ都道府県名ではない要素の配列を取得
	newClearMarkersArray = markersArray.filter(function (elm) {
		return elm.detail.areaName !== areaName;
	});
	// 取得した配列要素を非表示にする
	for (var i = 0; i < newClearMarkersArray.length; i++) {
		newClearMarkersArray[i].setMap(null);
	}
	// 新しく取得した配列を次に表示させるために代入
	currentClearMarkersArray = newClearMarkersArray;
}

/**
* 指定位置を中心に地図を拡大・移動する関数
*/
function panZoomMap(lat, lng, zoomNum) {
	map.panTo(new google.maps.LatLng(Number(lat), Number(lng)));
	map.setZoom(Number(zoomNum));
}

/**
* その他の店舗の情報を作成する関数
*/
function makeOthers(areaName, name) {
	// 同じ都道府県の要素の配列を取得
	var sameAreaArray = jsonData.filter(function (elm) {
		return (elm['area'] === areaName) && (elm['name'] !== name);
	});

  var htm = '';
  for (var i = 0; i < sameAreaArray.length; i++) {
    htm += '<tr>';
    htm += '  <td>' + sameAreaArray[i]['name'] + '</td>';
    htm += '  <td>' + sameAreaArray[i]['place'] + '</td>';
    htm += '  <td>' + sameAreaArray[i]['tel'] + '</td>';
    htm += '</tr>';
  }
  otherTableTbody.innerHTML = htm;
}

/**
* 店舗情報を非表示する関数
*/
function hideInfo(areaName) {
	newAreaName = areaName;
	// 同じナビをクリックしたら以降の処理を行わない
	if (newAreaName === currentAreaName) {
		return;
	}
	$(messageTxt).removeClass(CLASS_HIDDEN);
	$(otherTable).addClass(CLASS_HIDDEN);
	$(infoBox).addClass(CLASS_HIDDEN);
	currentAreaName = newAreaName;
}

/**
* 店舗情報を表示する関数
*/
function showInfo() {
	$(messageTxt).addClass(CLASS_HIDDEN);
	$(otherTable).removeClass(CLASS_HIDDEN);
	$(infoBox).removeClass(CLASS_HIDDEN);
}