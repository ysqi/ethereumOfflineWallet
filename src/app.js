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
        // 随机钱包
        App.setWallet(ethers.Wallet.createRandom());
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
    }
}

$(document).ready(() => {
    App.init()
})