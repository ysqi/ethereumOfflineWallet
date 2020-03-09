walletHelp = {
    randomVars: {
        x0: 0,
        y0: 0,
        sx0: 0,
        sy0: 0,
        cnt: 0,
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

    timers: [],//进行中的查找任务
    wallet: null,//当前创建的钱包账户
    config: {
        showPK: false,
        findRunning: false,//是否正在查找中
    },
    init: () => {

        //按钮点击事件
        $(".menu .item").on("click", (e) => {
            //切换不同的 Tab
            App.switchWay(e)
        })
        $("[name='createWallet']").on("click", (e) => {
            // 创建钱包
            App.createWallet(e);
        })
        $("#safeShowSwitch").on("click", (e) => {
            App.config.showPK = !App.config.showPK;
            App.switchPK();
        })
        $("#runFind").on("click", e => {
            App.findWallet();
        })
        $("#randomDiv").on("mousemove", e => {
            //生成随机数
            let str = walletHelp.randomHex();
            $("#outputTxt").val(str + $("#outputTxt").val());
            //显示到界面
        })
        $("#createKeystore").on("click",e=>{
            App.exportKeystore(e);
        })
    },
    // 查找靓号
    findWallet: () => {
        if (App.config.findRunning) {
            App.setRunStatus(false);
            return;
        }

        let str = $.trim($("#way2_str").val());
        if (str == "") {
            alert("必须输入匹配的内容")
            $("#way2_str").focus();
            return;
        } else if (/[\da-fA-F]/.test(str) == false) {
            alert("只能输入数字和字母 A-F");
            $("#way2_str").focus();
            return;
        }

        let threads = parseInt($("#way2_thread").val(), 10);
        let model = $("#way2_condition").val();
        App.setWallet(null);
        App.setRunStatus(true);
        for (var i = 0; i < threads; i++) {
            //并发查找
            id = setInterval(App.findOnce, 600, { str: str, model: model });
            App.timers.push(id);
        }
    },
    findOnce: (option) => {
        if (!App.config.findRunning) {
            return;
        }
        let w = ethers.Wallet.createRandom();
        let address = w.address.substr(2).toUpperCase();//大写的地址,无 0x
        let index = address.indexOf(option.str.toUpperCase());
        var find = false;
        switch (option.model) {
            case "prefix"://开头
                find = index == 0;
                break;
            case "suffix":
                find = index == address.length - 1;
                break;
            case "contains":
                find = index >= 0;
                break;
        }
        console.log(find, index, w.address);
        if (find && App.config.findRunning) {
            //显示钱包
            App.setWallet(w);
            // 停止查找
            App.setRunStatus(false);
        }
    },
    setRunStatus: (run) => {
        App.config.findRunning = run;
        App.timers.forEach(id => {
            clearInterval(id);
        });
        $("#runFind .start").toggle();
        $("#runFind .stop").toggle();
        $(".processing").toggle();
    },
    switchWay: (e) => {
        let item = $(e.currentTarget)

        $(".settings-cfg .item").hide()
        $("#" + item.data("tab")).show()//tab content div id
        $(".menu .item").removeClass("active")
            .attr("disabled", false)
        item.addClass("active").attr("disabled", true)
    },
    // 设置当前钱包账户
    setWallet: (w) => {
        App.wallet = w;
        if (w != null) {
            App.setPK();
            $("#publicKey").text(w.signingKey.publicKey);
            $("#address").text(w.signingKey.address);
            $(".wallet").show();
        } else {
            $(".wallet").hide();
        }
    },
    // 一键创建钱包账户
    createWallet: (e) => {
        let way = $(e.currentTarget).data("way");
        var w;
        switch (way) {
            case "random":
                w = ethers.Wallet.createRandom();
                break;
            case "custom":
                //随机内容-> Hash()->
                // 32 字节的 HASH 值作为 私钥
                let content = $("#outputTxt").val();
                let pk = ethers.utils.sha256("0x" + content);
                pk = ethers.utils.sha256(pk); //double
                w = new ethers.Wallet(pk);
                //私钥转换为账户对象?
                break;
            default:
                alert("尚未实现");
                return;
        }
        // 随机钱包
        App.setWallet(w);
    },
    setPK: () => {
        if (App.config.showPK) {
            $("#privateKey").text(App.wallet.signingKey.privateKey);
        } else {
            //0x+ 64个 * (私钥 32 字节,64 个十六进制的字符)
            $("#privateKey").text("*".repeat(64 + 2));
        }
    },
    // 切换显示私钥
    switchPK: () => {
        let btn = $("#safeShowSwitch")
        btn.find(".closeEye").toggle();//隐藏或显示
        btn.find(".openEye").toggle();
        App.setPK();
    },
    // 将当前账户私钥导出到 Keystore文件
    exportKeystore: (e) => {
        var password = prompt("请输入加密密码", "");
        if (password == null) {
            return;
        } else if (password == "") {
            alert("密码不能为空")
            return;
        }
        let btn = $(e.currentTarget);
        App.wallet.encrypt(password, { scrypt: { N: 2 ** 18 } }, (process) => {
            var p = Math.floor(process * 100);
            btn.find(".processing_bar").text(".".repeat(p));
        }).then(json => {
            btn.find(".processing_bar").text("");

            var file = new Blob([json], { type: "application/plain" });
            var a = document.createElement("a");
            a.href = URL.createObjectURL(file);
            document.body.appendChild(a);
            a.download = App.wallet.address + ".json";
            a.click();

            setTimeout(function () {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(a.href);
            }, 0);
        });
    }
}

$(document).ready(() => {
    App.init()
})