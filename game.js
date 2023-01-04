// 全クラスのエクスポート
// クラス登録された関数をグローバルにする
enchant();

window.onload = function () {
    // ゲームサイズ
    game =new Core(320, 320);
    // フレーム数/秒
    game.fps = 24;
    // スコアを保持するプロパティ
    game.score = 0;
    // ライフを保持するプロパティ
    game.life = 3;
    // ウェイトのカウンタ
    game.wait = 0;
    // プレイヤの被弾フラグ(被弾したときに「true」)
    game.lost = false;
    // ゲームオーバーフラグ(ゲームオーバー時に「true」)
    game.over = false;

    // ゲームで使用する画像ファイルを読み込む
    game.preload(
        // 画像 
        'spritesheet.png', 'spacebg.png', 'effect0.png', 'space0.png', 'space1.png', 'space2.png', 'icon0.png',
        // サウンド
        'sounds/bomb1.wav','sounds/bomb2.wav','sounds/bomb3.wav','sounds/shot3.wav','sounds/shot4.wav',
        'sounds/se1.wav','sounds/se4.wav','sounds/se6.wav','sounds/se8.wav','sounds/bgm08.wav'
    );
    game.onload = function() {

        // 背景を作成する
        background = new Background();

        // プレイヤを作成する
        player = new Player(144, 138);

        // スコアラベルを作成する
        var scoreLabel = new ScoreLabel(5, 0);
        scoreLabel.score = 0;
        scoreLabel.easing = 3;
        scoreLabel.scaleX = 0.8;
        scoreLabel.scaleY = 0.8;
        scoreLabel.width = 84;
        console.log("scoreLabelWidth:"+scoreLabel.width);
        game.rootScene.addChild(scoreLabel);

        // ライフラベルを作成する
        var lifeLabel = new LifeLabel(180, 0, 5);
        lifeLabel.scaleX = 0.8;
        lifeLabel.scaleY = 0.8;
        lifeLabel.life = game.life;
        game.rootScene.addChild(lifeLabel);

        // アナログバーチャルパッドを作成する
        apad = new APad();
        apad.x = 220;
        apad.y = 220;
        game.rootScene.addChild(apad);
        
        // 岩の出現フラグ
        game.isRockAppear = false;
        // ボスの出現フラグ
        game.isBossAppear = false;

        // 敵を格納する配列
        enemies = [];
        
        // サウンドの設定
        game.enemyDmgSD = game.assets['sounds/bomb1.wav'];
        game.playerDmgSD = game.assets['sounds/bomb3.wav'];
        game.gameOverSD = game.assets['sounds/bomb3.wav'];
        game.lifeUpSD = game.assets['sounds/se1.wav'];

        // rootSceneの「enterframe」イベントリスナ
        game.rootScene.addEventListener('enterframe', function() {

            // スコアを更新する
            scoreLabel.score = game.score;
            // ライフを更新する
            lifeLabel.life = game.life;
            // ゲームオーバーなら終了
            if (game.over) {
                game.gameOverSD.play();
                game.end();
            }
            // 被弾したら、一定の間、プレイヤを点滅表示する
            if (game.lost == true) {
                game.wait ++;
                //player.image = player.image == game.assets['space0.png'] ? game.assets['effect0.png'] : game.assets['space0.png'];
                player.visible = player.visible ? false : true;
                if (game.wait == game.fps * 4) { // ５秒間
                    game.lost = false;
                    player.visible = true;
                    game.wait = 0;
                }
            }
            // 敵をつくる
            // ランダムなタイミングでつくる
            // プレイヤが被弾して点滅している時は敵をつくらない
            if (rand(100) < 5 && game.lost == false) {
                // ボスを出現させる条件
                // ・スコア1000点ごと
                // ・スコア0点では出さない
                // ・もう出てたら出さない(ボスはひとつだけ)
                // 岩を出現させる条件
                // ・スコア700点ごと
                // ・スコア0点では出さない
                // ・もう出てたら出さない(岩はひとつだけ)
                var enemy = null; 
                if (game.score > 0 && !game.isBossAppear && game.score % 1000 === 0) {
                    enemy = new EnemyBoss(rand(256), 0,  32, 32, "boss");
                } else if (game.score > 0 && !game.isRockAppear && game.score % 700 === 0) {
                    game.isRockAppear = true;
                    enemy = new EnemyRock(rand(256), 0, 64, 64, "rock");
                } else {
                    enemy = new Enemy(rand(288), 0, 32, 32, rand(3));
                }
                // 敵を配列に入れる
                // ゲームのフレーム番号を連想配列のキーにする
                // 削除するときに特定できるよにしておく 
                enemy.id = game.frame;
                enemies[enemy.id] = enemy;
            }

        });
    }
    // ゲーム開始
    game.start();
}

// プレイヤのスプライトを作成するクラス
var Player = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y) {
        enchant.Sprite.call(this, 32, 32);
        // サーフィスを作成する
        var image = new Surface(32, 32);
        // 「spritesheet.png」の(0, 0)から128x32の領域の画像をサーフィスに描画する
        // 縦長の画像を正方形に描画しなおす 
        image.draw(game.assets['space0.png'], 0, 0, 32, 64, 0, 0, 32, 32);
        this.image = image;
        this.frame = 0;
        this.x = x;
        this.y = y;
        // 「enterframe」イベントリスナ
        this.addEventListener('enterframe', function() {
            // 被弾した後はしばらく動けないようにする
            if (game.lost == false) {
                // プレイヤの移動処理
                this.vx = this.vy = 0;
                if (game.input.left) {
                    this.vx = -5;
                } else if (game.input.right) {
                    this.vx = 5;
                } else if (game.input.up) {
                    this.vy = -5;
                } else if (game.input.down) {
                    this.vy = 5;
                }

                if ((this.vx === 0 && this.vy === 0) && (apad.vx !== 0 && apad.vy !== 0)) {
                    // アナログパッドの傾きをゲーム画面の座標系に変換する
                    this.x = apad.vx * game.width / 2  + x;
                    this.y = apad.vy * game.height / 2  + y;
                } else {
                    this.x += this.vx;
                    this.y += this.vy;
                    if (this.x < 0) {
                        this.x = 0;
                    } else if (this.x > game.width - 32) {
                        this.x = game.width -32;
                    }
                    if (this.y < 0) {
                        this.y = 0;
                    } else if (this.y > game.height - 32) {
                        this.y = game.height - 32;
                    }
                } 

                // 8フレーム毎に弾を発射する
                if (game.frame % 8 == 0) {
                    // 自弾を生成する
                    // 弾の大きさを8とする
                    var s = new PlayerBullet(this.x + 8, this.y - 8);
                }
            
                // 敵との当たり判定
                // 配列に入っている敵をひとつずつ調べる
                for (var i in enemies) {
                    // 敵に当たったら、
                    if (enemies[i].intersect(this)) {
                        if (enemies[i].type === "life") {
                            // ライフを1つ増やす
                            game.life++;
                            // サウンドを鳴らす
                            game.lifeUpSD.play();
                            // 一度だけしかライフを増やさないようにする
                            enemies[i].type = "";
                            console.log("life:"+game.life);
                        } else {
                            // ライフを1つ減らす
                            game.life--;
                            // 爆発エフェクトを表示する
                            var effect = new Explosion(this.x, this.y, 50);
                            // プレイヤーダメージSDを再生する
                            game.playerDmgSD.play();
                            game.lost = true;
                            // ライフが「0」ならゲームオーバーフラグを「true」にする
                            if (game.life == 0 ) game.over = true;
                        }
                        // 当たった敵を消去する
                        enemies[i].remove();
                    }
                }
            }
        });
        // プレイヤをシーンに追加する
        game.rootScene.addChild(this);
    }
});

// 背景のスプライトを作成するクラス
var Background = enchant.Class.create(enchant.Sprite, {
    initialize: function() {
        enchant.Sprite.call(this, 320, 640);
        this.x = 0;
        this.y = -320;
        this.frame = 0;
        this.image = game.assets['spacebg.png'];
        // 「enterframe」イベントリスナ
        this.addEventListener('enterframe', function() {
            // 背景をy方向にスクロールする
            this.y ++;
            // y座標が「0」以上になったら、y座標を最初の位置「-320」に戻す
            if (this.y >= 0) this.y = -320;
        });
        game.rootScene.addChild(this);
    }
});

// 敵のスプライトを作成するクラス
var Enemy = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y, w, h, type) {
        enchant.Sprite.call(this, w, h);
        this.x = x; 
        this.y = y;
        this.vx = 4;      // x方向の移動量
        this.type = type; // 敵の種類を設定するプロパティ
        this.image = game.assets[EnemyTable[this.type].imageFile];

        this.tick = 0;    // フレーム数のカウンタ
        this.angle = 0;   // 弾の発射角度を設定するプロパティ
        this.hp = EnemyTable[this.type].hp; //EnemyテーブルからHPを設定
        this.bulletCycle = EnemyTable[this.type].bulletCycle; //Enemyテーブルから弾を発車するサイクルを設定
        this.score = EnemyTable[this.type].score; //Enemyテーブルからscoreを設定

        // 「enterframe」イベントリスナ
        this.addEventListener('enterframe', function() {

            // 敵のタイプに応じて、表示するフレームと移動パターンを設定する
            this.frame = EnemyTable[this.type].frame(); 
            EnemyTable[this.type].position(this); 

            // 画面の外に出たら、
            if (this.y > 280 || this.x > 320 || this.x < -this.width || this.y < -this.height) {
                // 消す
                this.remove();
            } else if(this.tick++ % this.bulletCycle == 0 ) {
                // 画面内にいるなら、「32」フレーム毎に、次の弾を発射する処理を実行する
                if (rand(100) < 50) {
                    // プレイヤと敵の位置から弾の発射角度を求める
                    var sx = player.x + player.width / 2 - this.x;
                    var sy = player.y + player.height / 2- this.y;
                    // タンジェントはy座標/x座標であるため、90度変換する
                    var angle = Math.atan(sx / sy);
                    //console.log("sx:" + sx + " sy:" + sy + " angle:" + angle);
                    // 弾を発射する
                    var s = new EnemyBullet(this.x + this.width / 2, this.y + this.height / 2 ,angle);
                }
            }   
        });
        game.rootScene.addChild(this);
    },
    remove: function() {
        game.rootScene.removeChild(this);
        delete enemies[this.id];
        delete this;
    }
});

// 敵のスプライトを作成するクラス
var EnemyBoss = enchant.Class.create(Enemy, {
    initialize: function(x, y, w, h, type) {
        Enemy.call(this, 32, 32, w, h, type);
        this.scaleX = 2; // 敵の大きさを設定するプロパティ
        this.scaleY = 2; // 敵の大きさを設定するプロパティ
        game.isBossAppear = true;
    },
    remove: function() {
        setTimeout(function(){game.isBossAppear = false;}, 30000);
        game.rootScene.removeChild(this);
        delete enemies[this.id];
        delete this;
    }
});

// 敵のスプライトを作成するクラス
var EnemyRock = enchant.Class.create(Enemy, {
    initialize: function(x, y, w, h, type) {
        Enemy.call(this, x, y, w, h, type);
        game.isRockAppear = true;
    },
    remove: function() {
        setTimeout(function(){game.isRockAppear = false;}, 30000);
        game.rootScene.removeChild(this);
        delete enemies[this.id];
        delete this;
    }
});

// ライフのスプライトを作成するクラス
var EnemyLife = enchant.Class.create(Enemy, {
    initialize: function(x, y, w, h, type) {
        Enemy.call(this, x, y, w, h, type);
    },
    remove: function() {
        game.rootScene.removeChild(this);
        delete enemies[this.id];
        delete this;
    }
});

var EnemyTable = {
    0: {hp: 1, 
        imageFile: "space2.png",
        frame: function(){return game.frame % 4;}, 
        position: function(enemy){enemy.y += 3;},
        bulletCycle: 32, 
        score: 100},
    1: {hp: 1, 
        imageFile: "space2.png",
        frame: function(){return game.frame % 4;}, 
        position: function(enemy){enemy.y += 6;},
        bulletCycle: 32, 
        score: 100},
    2: {hp: 1,
        imageFile: "space2.png",
        frame: function(){return game.frame % 4;}, 
        position: function(enemy){
                    // プレイヤーから64以上離れていたら、横方向に近づける
                    // 縦方向は停止しておく
                    // 一度 vx が 0 になると二度と x座標は動かない
                    if (enemy.x < player.x - 64) {
                        enemy.x += enemy.vx 
                    } else if (enemy.x > player.x + 64) {
                        enemy.x -= enemy.vx;
                    } else {
                        enemy.vx = 0;
                        enemy.y += 8;
                    }
                },
        bulletCycle: 32, 
        score: 100},
    3: {hp: 1,
        imageFile: "space2.png",
        frame: function(){return game.frame % 4;}, 
        position: function(enemy){
                    // プレイヤーから64以上離れていたら、横方向に近づける
                    // 縦方向は停止しておく
                    if (enemy.x < player.x - 64) {
                        enemy.x += enemy.vx 
                    } else if (enemy.x > player.x + 64) {
                        enemy.x -= enemy.vx;
                    } else {
                        enemy.y += 8;
                    }
                },
        bulletCycle: 32, 
        score: 100},
    rock: {hp: 50,
        imageFile: "space1.png",
        frame: function(){return 0;}, 
        position: function(enemy){
                    // 360度を50フレームで回転させる
                    enemy.tl.rotateBy(360, 50);
                    enemy.y += 2;
                },
        bulletCycle: null, 
        score: 200},
    life: {hp: 1,
        imageFile: "icon0.png",
        frame: function(){return 10;}, 
        position: function(enemy){enemy.y += 3;},
        bulletCycle: null, 
        score: 0},
    boss: {hp: 25,
        imageFile: "space2.png",
        frame: function(){return game.frame % 4;}, 
        position: function(enemy){
                    // プレイヤーから64以上離れていたら、横方向に近づける
                    // 縦方向は停止しておく
                    if (enemy.x < player.x - 64) {
                        enemy.x += enemy.vx 
                    } else if (enemy.x > player.x + 64) {
                        enemy.x -= enemy.vx;
                    } else {
                       // enemy.vx = 0;
                        enemy.y += 1;
                    }
                },
        bulletCycle: 8, 
        score: 200}
}

// 弾のスプライトを作成するクラス
var Bullet = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y, angle) {
        enchant.Sprite.call(this, 16, 16);
        this.image = game.assets['icon0.png'];
        this.x = x;
        this.y = y;
        this.angle = angle; // 角度
        var deg = angle * 180 / Math.PI; // 角度
        this.rotate(-deg);
        this.speed = 10;    // スピード
        // 「enterframe」イベントリスナ
        this.addEventListener('enterframe', function() {
            // 弾の移動処理
            // 弾の発射角度からXY座標を求める
            // 自弾からは角度指定、敵弾からはXY座標から計算した角度
            // スピードに限りなくゼロに近い数をかける
            // 3時の角度を0として時計まわりの方向にπのsinを求めて、X方向の大きさを求めるかけて1当たりの大きさ
            // πのsin:0 cos:-1
            // sinの大きさをx座標にcosの大きさをy座標にする
            // +90度するためにsinをx座標にcosをy座標に足す
            this.x += this.speed * Math.sin(this.angle);
            this.y += this.speed * Math.cos(this.angle);
           // if (angle === Math.PI) {
               //console.log('angle:' + this.angle); 
           //    console.log('x:' + this.x + ' y:' + this.y); 
               //console.log('sin:' + Math.sin(this.angle) + ' cos:' + Math.cos(this.angle)); 
          //  }
            // 画面の外に出たら消去する(完全に隠れたら）
            if (this.y > 320 || this.x > 320 || this.x < -this.width || this.y < -this.height) {
                this.remove();
            }
        });
        game.rootScene.addChild(this);
    },
    remove: function() {
        game.rootScene.removeChild(this);
        delete this;
    }
});

// 自弾のスプライトを作成するクラス
var PlayerBullet = enchant.Class.create(Bullet, {
    initialize: function(x, y) {
        Bullet.call(this, x, y, Math.PI);
        this.frame = 48;
        // 「enterframe」イベントリスナ
        this.addEventListener('enterframe', function() {
            // 敵との当たり判定
            for (var i in enemies) {
                // 敵に当たったら、
                if (enemies[i].intersect(this)) {
                    //console.log('1:' + enemies[i].hp);
                    // 爆発エフェクトを表示する
                    // 敵と爆発の大きさは 32 違う。その半分の16だけ左上を指定する
                    var effect = new Explosion(this.x , this.y);
                    // プレイヤーダメージSDを再生する
                    game.enemyDmgSD.play();
                    if (enemies[i].type === "life") return;
                    if (--enemies[i].hp <= 0) {
                     //   console.log('2:' + enemies[i].hp);
                        if (enemies[i].type === "rock") {
                            enemy = new EnemyLife(enemies[i].x + enemies[i].width/2, enemies[i].y,  16, 16, "life");
                            enemy.id = game.frame;
                            enemies[enemy.id] = enemy;
                        }
                        // スコアを加算する
                        game.score += enemies[i].score;
                        // 当たった敵を消去する
                        enemies[i].remove();
                    }
                }
            }
        });
    }
});

// 敵弾のスプライトを作成するクラス
var EnemyBullet = enchant.Class.create(Bullet, {
    initialize: function(x, y, angle) {
        Bullet.call(this, x, y, angle);
        this.speed = 4; // スピード
        this.frame = 56;
        // 「enterframe」イベントリスナ
        this.addEventListener('enterframe', function() {
            // プレイヤとの当たり判定
            // プレイヤに当たったら
            if (player.within(this, 8) && game.lost == false) {
                // プレイヤーダメージSDを再生する
                game.playerDmgSD.play();
                // 爆発エフェクトを表示する
                var effect = new Explosion(player.x, player.y, 50);
                game.lost = true;
                player.visible = false;
                // ライフを1つ減らす
                game.life--;
                // ライフが「0」ならゲームオーバーフラグを「true」にする
                if (game.life == 0 ) {
                    game.over = true;
                }
            }
        });
    }
});


// 爆発エフェクトのスプライトを作成するクラス
var Explosion = enchant.Class.create(enchant.Sprite, {
    initialize: function(x, y, wait) {
        enchant.Sprite.call(this, 16, 16);
        this.x = x;
        this.y = y;
        this.scaleX = 2; // 敵の大きさを設定するプロパティ
        this.scaleY = 2; // 敵の大きさを設定するプロパティ
        this.frame = 0;
        this.tick = 0;
        this.image = game.assets['effect0.png'];
        // 「enterframe」イベントリスナ
        this.addEventListener('enterframe', function() {
            if (this.tick < wait) {
                // 爆発エフェクトをアニメーション表示する
                if (this.frame > 5) {
                    this.frame = 0;
                }
                this.frame = this.frame + game.frame % 2;
                this.tick++; 
            }
            else {
                this.tick = 0; 
                this.remove();
            }
        });
        game.rootScene.addChild(this);
    },
    remove: function() {
        game.rootScene.removeChild(this);
        delete this;
    }
});
