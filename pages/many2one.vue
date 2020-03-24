<template>
  <div class="container">
        <div class="info">
      <h2>币归集</h2>
      <nuxt-link to="/">前往批量打币</nuxt-link>
    </div>
    
    <div class="info">
      钱包余额: {{walletInfo.balance}} (未确认: {{walletInfo.unconfirmed_balance}})
      <el-button @click="loadData">刷新</el-button>
    </div>
    <div
      class="info"
      style="width: 80%;"
    >
      <el-table :data="toSpendUtxo">
        <el-table-column
          prop="txid"
          label="txid"
        >
        </el-table-column>
        <el-table-column
          prop="amount"
          label="金额"
        >
        </el-table-column>
      </el-table>
    </div>
    <div class="row">
      <div class="title">
        收款地址
      </div>
      <div class="content">
        <el-input v-model="toAddress"></el-input>
      </div>
    </div>
    <div class="row">
      <div class="title">
        手续费
      </div>
      <div class="content">
        <el-input v-model="fee"></el-input>
      </div>
    </div>
    <div class="row">
      <div class="title">
        总额(扣除手续费)
      </div>
      <div class="content">
        {{actualSend}}
      </div>
    </div>
    <el-button
      @click="sendMoney"
      type="success"
    >发送</el-button>
    <div>
      <pre>
{{debug}}
      </pre>
      
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  data() {
    return {
      fee: '0.01',
      toAddress: '',
      markup: '',
      walletInfo: {
        "balance": '载入中',
        "hdmasterkeyid": "",
        "immature_balance": 0,
        "keypoololdest": 0,
        "keypoolsize": 0,
        "paytxfee": 0,
        "txcount": 0,
        "unconfirmed_balance": 0,
        "unlocked_until": 0,
        "walletversion": 0
      },
      unspendInfo: [],
      debug: '',
      receiverPayFee: true
    }
  },
  async mounted() {
    this.loadData()
  },
  methods: {
    async sendMoney() {
      try {
        let { value: password } = await this.$prompt('请输入钱包密码', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
        })
        if(password){
          await this.$store.dispatch('vdsrpc/unlockWallet', password).catch(e => {
          this.$message.error('解锁钱包失败，请检查密码是否错误')
          throw e
        })
        }
        let transactions = []
        let receivers = {}
        for(let utxo of this.toSpendUtxo){
          transactions.push({
            txid: utxo.txid,
            vout: utxo.vout
          })
        }
        receivers[this.toAddress] = this.actualSend
        let rawtransaction = await this.$store.dispatch('vdsrpc/createrawtransaction', {
          transactions,
          receivers
        })
        this.debug = rawtransaction
        let signtransaction = await this.$store.dispatch('vdsrpc/signrawtransaction', rawtransaction)
        console.log(signtransaction)
        if(signtransaction.hex && (signtransaction.errors && signtransaction.errors.length > 0)){
          this.$message.error(JSON.stringify(signtransaction))
          throw transactions
        }
        signtransaction = signtransaction.hex
        let transid = await this.$store.dispatch('vdsrpc/sendrawtransaction', signtransaction).catch(e => {
          console.log(e)
          this.$message.error('发送交易失败！请仔细核对交易是否确实未发起再重试！' + JSON.stringify(e))
          throw e
        })
        this.$alert("创建交易成功！交易id:" + transid)
      } catch (e) {
        this.debug=this.debug+JSON.stringify(e)
        console.log(e)
      }

    },
    async loadData() {
      try {
        await Promise.all([this.loadWalletInfo(), this.loadUnspendTxInfo()])

      }
      catch (e) {
        this.$alert("加载数据失败，请检查钱包rpc是否开启")
      }

    },
    async loadWalletInfo() {
      let data = await this.$store.dispatch("vdsrpc/getWalletInfo")
      this.walletInfo = data
    },
    async loadUnspendTxInfo() {
      let data = await this.$store.dispatch("vdsrpc/listunspent")
      this.unspendInfo = data
    }
  },
  computed: {
    totalAmount() {
      let total = 0;

      for (let receiver of this.receivers) {
        if (!isNaN(parseFloat(receiver.amount))) {
          total += parseFloat(receiver.amount)
        }
      }
      return total.toFixed(8)
    },
    toSpendUtxo() {
      return this.unspendInfo.filter(e => e.locktime === 0 && e.amount<10000)
    },
    actualFee(){
      let tmp = parseFloat(this.fee)
      if(isNaN(tmp)){
        return 0
      }
      return tmp
    },
    actualTotal(){
      return this.toSpendUtxo.reduce((prev, cur) => {
        return prev + cur.amount
      }, 0)
    },
    actualSend(){
      return  parseFloat((this.actualTotal - this.actualFee).toFixed(8))
    }
  }
}
</script>

<style scoped>
.container {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-content: center;
  align-items: center;
}
.container > div {
  margin: 10px;
}
.info {
}
.container .row {
  display: flex;
  width: 80%;
}
.container .row .title {
  width: 20%;
  text-align: right;
  padding-right: 20px;
  box-sizing: border-box;
}
.container .row .content {
  width: 80%;
}
.receiver-item {
  display: flex;
  margin: 5px;
}
.receiver-item > * {
  margin: 5px;
}
</style>