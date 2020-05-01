(function(){
    var innerScript = function(){

        var injectOpen = function(xhr) {
            if (xhr[0] == 'GET' && xhr[1].startsWith('https://api.bilibili.com/x/player.so?')) {
                // console.log(xhr);
                xhr.onsuccess = function(xhr) {
                    var xml = xhr.response;

                    var settings = JSON.parse(localStorage['bilibili_player_settings']);

                    // 将全景设置更改为与视频相符的设定
                    if (xml.includes('"is_360":true') && !settings.video_status.panoramamode || xml.includes('"is_360":false') && settings.video_status.panoramamode){
                        var handle = setInterval(function(){
                            var btn = document.querySelector('.bilibili-player-video-btn-setting-panel-others-content-panoramamode .bui-checkbox-input');
                            if (btn) {
                                clearInterval(handle);
                                btn.click();
                                $('.bilibili-player-iconfont-setting').mouseout();
                            } else {
                                $('.bilibili-player-iconfont-setting').mouseover();
                            }
                        },0);
                    }

                    // 修改参数为全景视频，让播放器启动全景模式
                    xml = xml.replace('"is_360":false', '"is_360":true');
                    return {data: xml, text: xml};
                }
            }
            return xhr;
        };

        // 简单的XHR HOOK
        var xhropen = XMLHttpRequest.prototype.open;
        var xhrsend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function() {
            this.xhrorigin = arguments;
            this.xhrinject = injectOpen(Array.prototype.slice.apply(arguments));
            return xhropen.apply(this, this.xhrinject);
        };
        XMLHttpRequest.prototype.send = function(d) {
            if (this.xhrinject.onsuccess != null) {
                var self = this;
                var readystatechange = this.onreadystatechange;
                var rsc = function(e) {
                    if (self.readyState == self.DONE && self.status == 200) {
                        var obj = self.xhrinject.onsuccess(self);
                        if (obj) {
                            Object.defineProperty(self, 'response', {
                                get: function(){
                                    return obj.data;
                                }
                            });
                            Object.defineProperty(self, 'responseText', {
                                get: function(){
                                    return obj.text;
                                }
                            });
                        }
                    }
                    if (readystatechange)
                        return readystatechange.call(this, e);
                };
                if (readystatechange == null) {
                    self.addEventListener('readystatechange', rsc);
                    Object.defineProperty(self, 'onreadystatechange', {
                        set: function(v) {readystatechange = v;}
                    });
                } else
                    self.onreadystatechange = rsc;
            }
            return xhrsend.call(this, d);
        };
    };

    // 原生背景脚本不能访问页面本身的JavaScript对象，因此注入进去
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.innerHTML = '(' + innerScript.toString() + '());';
    document.documentElement.appendChild(s);
}());

