App = {

    init: () => {

        //按钮点击事件
        $(".menu .item").on("click", (e) => {
            //切换不同的 Tab
            App.switchWay(e)
        })
        $("[name='createWallet']").on("click",(e)=>{
            // 创建钱包
            App.createWallet(e);
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
    createWallet:(e)=>{
        // 随机钱包
        let wallet = ethers.Wallet.createRandom();

        $("#privateKey").text(wallet.signingKey.privateKey);
        $("#publicKey").text(wallet.signingKey.publicKey);
        $("#address").text(wallet.signingKey.address);
        $(".wallet").show();
    }
}

$(document).ready(() => {
    App.init()
})