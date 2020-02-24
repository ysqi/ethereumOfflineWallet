walletHelp = {
    create: (option) => {
        return ethers.Wallet.createRandom();
    },
    randomVars: {
        x0: 0,
        y0: 0,
        sx0: 0,
        sy0: 0,
        cnt:0,
    },
    //  copy from http://www.russellcottrell.com/mousePointerRNG.htm
    randomHex: (e) => {
        e = (window.event ? window.event : e);

        x1 = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - e.currentTarget.offsetLeft; // mouse position
        y1 = e.clientY + document.body.scrollTop + document.documentElement.scrollTop - e.currentTarget.offsetTop;

        sx1 = x1 - walletHelp.randomVars.x0; // distance moved
        sy1 = y1 - walletHelp.randomVars.y0;

        var oStrSaved = "";

        if ((walletHelp.randomVars.sx0 * sx1 < 0) || (walletHelp.randomVars.sy0 * sy1 < 0)) { // direction change

            xStr = walletHelp.padString(x1.toString(2), 8);
            yStr = walletHelp.padString(y1.toString(2), 8);
            xyStr = xStr + yStr;

            jj = Math.ceil(Math.random() * 10); // random number of repeats each time

            for (var j = 0; j < jj; j++) { // repeat

                mR = Math.floor(Math.random() * 65536);

                pStr = walletHelp.padString((parseInt(xyStr, 2) ^ mR).toString(2), 16); // salt the random number with the mouse position

                oStr = "";
                // hexadecimal
                for (var i = 0; i < 16; i += 4) {
                    oStr += parseInt(pStr.substr(i, 4), 2).toString(16);
                }
                oStrSaved += oStr;
                xyStr = walletHelp.fyShuffle(xyStr); // shuffle the bit string for each repeat

            } // repeat
        } // direction change
        walletHelp.randomVars.x0 = x1;
        walletHelp.randomVars.y0 = y1;

        if (sx1 != 0)
            walletHelp.randomVars.sx0 = sx1;
        if (sy1 != 0)
            walletHelp.randomVars.sy0 = sy1;

        // https://www.namebase.io/
        // hs1qc9hxz5tmwdwwu5t78w6twegrx3xlfcwxhmswxs
        // https://www.namebase.io/settings
        return oStrSaved;
    },
    padString(str, n) {
        var len = str.length;
        for (var i = 0; i < n - len; i++)
            str = "0" + str;
        return str;
    },
    fyShuffle(str) {
        var a = str.split("");
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = a[i];
            a[i] = a[j];
            a[j] = temp;
        }
        str = a.join("");
        return str;
    }
}

App = {
    wallet: null,//当前钱包
    running: false,
    timers: [],
    config: {
        showPrivateKey: false,
        model: "random",
    },

    init: () => {
        App.switchWay();
        //创建方式按钮
        $(".menu > .item").on('click', function (e) {
            App.switchWay(e);
        })

        //创建钱包按钮
        $("[name=createWallet]").on("click", function (e) {
            App.createWallet()
        })
        //切换显示私钥
        $("#safeShowSwitch").on("click", function (e) {
            App.switchPrivateKey(!App.config.showPrivateKey);
        })
        $("#runFind").on('click', function (e) {
            App.switchFind(!App.running);
        })
        $("#randomDiv").on("mousemove", function (e) {
            txt = walletHelp.randomHex(e);
            $("#outputTxt").val(txt+$("#outputTxt").val());
        })
        $("#createKeystore").on('click',function(e){
            App.createKeystore(e);
        })
    },

    // 切换创建钱包模式
    switchWay: function (e) {
        $(".menu > .item").removeClass("active").attr("disabled", false);
        //当选择此模式时，该模式变亮
        let item = e ? $(e.currentTarget) : $(".menu > .item").first();

        item.addClass("active").attr("disabled", true);

        //显示对应的卡片
        let tab = item.data("tab")
        $(".settings-cfg > .item").hide();
        $("#" + tab).show();
        App.config.model = item.data("way");
    },

    switchPrivateKey: (show) => {
        App.config.showPrivateKey = show;
        let btn = $("#safeShowSwitch");
        if (show) {
            btn.find(".closeEye").hide();
            btn.find(".openEye").show();
            if (App.wallet) {
                $("#privateKey").text(App.wallet.privateKey);
            } else {
                $("#privateKey").text("");
            }
        } else {
            $("#privateKey").text("************************************************************************")
            btn.find(".closeEye").show();
            btn.find(".openEye").hide();
        }
    },
    createWallet: () => {
        var option = {
            model: App.config.model,
        }
        switch (App.config.model) {
            case "random":
                //无配置
                let wallet = walletHelp.create(option);
                App.setCurWallet(wallet);
                return;
            case "nice":
                //获取参数
                let str = $.trim($("#way2_str").val());
                if (str == "") {
                    alert("必须输入要匹配的内容")
                    $("#way2_str").val("").focus();
                    return false
                } else if (/[\da-fA-F]+/.test(str) == false) {
                    alert("只能输入数字和字母abcdef")
                    $("#way2_str").focus();
                    return false
                }
                //创建一个 Timer
                option.str = str;
                option.condition = $("#way2_condition").val()
                //并发线程量
                let threads = parseInt($("#way2_thread").val(), 10);
                for (var i = 0; i < threads; i++) {
                    App.timers.push(setInterval(function () {
                        App.findNiceWallet(option);
                    }, 600));
                }
                return true;
            case "high":
                let randomStr= $("#outputTxt").val();
                let pk = ethers.utils.id(randomStr);
                App.setCurWallet(new ethers.Wallet(pk));
                return;
        }
    },
    switchFind: (start) => {
        App.running = start;
        let startIcon = $("#runFind > .start")
        let stopIcon = $("#runFind > .stop")
        let process = $(".processing")

        clearInterval(App.timer)

        startIcon.show();
        stopIcon.hide();
        process.hide();
        //清理
        App.timers.forEach(timer => {
            clearInterval(timer)
        });
        while (App.timers.length > 0) {
            App.timers.pop();
        }
        if (start) {
            //开始调用
            stopIcon.show();
            startIcon.hide();
            process.show();

            let ok = App.createWallet();
            if (!ok) {
                App.switchFind(false);
            }
        }
    },
    findNiceWallet: (option) => {
        if (!App.running) {
            return
        }

        let w = walletHelp.create();
        let index = w.address.substr(2).toUpperCase().indexOf(option.str.toUpperCase())

        var find;
        switch (option.condition) {
            case "prefix":
                find = index == 0;
                break;
            case "contains":
                find = index >= 0;
                break;
            case "suffix":
                find = index == w.address.length - 1;
                break;
        }

        if (find && App.running) {
            App.setCurWallet(w);
            //可以停止
            App.switchFind(false);
        }
    },

    //设置当前有效钱包
    setCurWallet: (wallet) => {
        App.wallet = wallet;
        if (typeof wallet === 'undefined') {
            return
        }
        //清理数据
        $("#keystore").hide();
        $("#keystoreStr").val("");
        $(".wallet").show();
        var items = ["privateKey", "publicKey", "address"]

        //倒着清理
        for (var i = items.length - 1; i >= 0; i--) {
            let item = items[i];
            //隐藏显示
            $("." + item).hide();
            //清空内容
            $("#" + item).text("");
        }


        let key = wallet.signingKey;
        showNext = function (index) {
            if (index >= items.length) {
                return
            }
            let item = items[index];
            if (item == "privateKey" && !App.config.showPrivateKey) {
                App.switchPrivateKey(App.config.showPrivateKey);
            } else {
                $("#" + item).text(key[item]);
            }
            $("." + item).fadeIn(500, function () {
                showNext(++index)
            });
        }
        showNext(0);
    },

    //创建keystore 文件内容
    createKeystore:(e)=>{
        var password = prompt("请设置新密码(用于解密 keystore 文件)", "");
        if (password==null){
            return
        }
        if (password==""){
            alert("密码不能为空")
            return
        }
        $(e.currentTarget).attr("disabled",true);
        $("#keystoreStr").val("").hide();
        $("#keystore .loading").show();
        $("#keystore").show();
        App.wallet.encrypt(password).then(json=>{
            $(e.currentTarget).attr("disabled",false);
            $("#keystore .loading").hide();
            $("#keystoreStr").val(json).show().select();
        });
    }

}

$(document).ready(function () {
    App.init();
});