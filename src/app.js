App = {

    wallet: null,//当前创建的钱包账户
    config: {
        showPK: false,
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
    },
    switchWay: (e) => {
        let item = $(e.currentTarget)

        $(".settings-cfg .item").hide()
        $("#" + item.data("tab")).show()//tab content div id
        $(".menu .item").removeClass("active")
            .attr("disabled", false)
        item.addClass("active").attr("disabled", true)
    },
    // 一键创建钱包账户
    createWallet: (e) => {
        // 随机钱包
        let wallet = ethers.Wallet.createRandom();
        App.wallet = wallet;
        App.setPK();
        $("#publicKey").text(wallet.signingKey.publicKey);
        $("#address").text(wallet.signingKey.address);
        $(".wallet").show();
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