App = {
    init: () => {

        //按钮点击事件
        $(".menu .item").on("click", (e) => {
            //切换不同的 Tab
            App.switchWay(e)
        })
        $("[name='createWallet']").on("click",(e)=>{
            App.createWallet()
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
    // 实时创建一个钱包账户
    createWallet:()=>{
        let wallet=ethers.Wallet.createRandom();
        $(".wallet").show();
        $("#privateKey").text(wallet.privateKey);
        $("#publicKey").text(wallet.signingKey.publicKey);
        $("#address").text(wallet.address);
    }
}

$(document).ready(() => {
    App.init()
})