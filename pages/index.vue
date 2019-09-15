<template>
  <div class="container">
    <div class="info">
      钱包余额: {{walletInfo.balance}} (未确认: {{walletInfo.unconfirmed_balance}})
      <el-button @click="loadData">刷新</el-button>
    </div>
    <div
      class="info"
      style="width: 80%;"
    >
      <el-table :data="addressInfo">
        <el-table-column
          prop="address"
          label="地址"
        >
        </el-table-column>
        <el-table-column
          prop="amount"
          label="余额"
        >
        </el-table-column>
      </el-table>
    </div>
    <div class="row">
      <div class="title">
        收款人:
      </div>
      <div class="content">
        <div
          class="receiver-item"
          v-for="(receiver,index) in receivers"
          :key="index"
        >
          <template v-if="receiver.input">
            <el-input
              v-model="receiver.address"
              placeholder="收款地址"
            ></el-input>
          </template>
          <template v-else>
            <el-input
              value="`${receiver.name}(${receiver.address})`"
              disabled
            ></el-input>
          </template>
          <el-input
            v-model="receiver.amount"
            placeholder="付款金额"
            type="number"
						style="width: 300px;"
          ></el-input>
          <el-button
            @click="remove(index)"
            type="danger"
          >移除</el-button>
        </div>
        <el-button
          @click="add"
          type="primary"
        >增加</el-button>
      </div>
    </div>
    <div class="row">
      <div class="title">
        付款总额
      </div>
      <div class="content">
        {{totalAmount}}
      </div>
    </div>
    <div class="row">
      <div class="title">
        发款地址
      </div>
      <div class="content">
        <el-input v-model="fromAddress"></el-input>
      </div>
    </div>
    <div class="row">
      <div class="title">
        备注
      </div>
      <div class="content">
        <el-input v-model="markup"></el-input>
      </div>
    </div>
    <div class="row">
      <el-checkbox v-model="receiverPayFee">手续费从接收方扣除</el-checkbox>
    </div>
    <el-button
      @click="sendMoney"
      type="success"
    >发送</el-button>
  </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  data() {
    return {
      receivers: [],
      fromAddress: '',
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
      addressInfo: [],
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
        await this.$store.dispatch('vdsrpc/unlockWallet', password).catch(e => {
          this.$message.error('解锁钱包失败，请检查密码是否错误')
          throw e
        })
        let receivers = {}
        let fees = []
        for (let receiver of this.receivers) {
          receivers[receiver.address] = parseFloat(receiver.amount)
          if (isNaN(receivers[receiver.address])) {
            this.$message.error('金额输入错误，请检查')
            throw receivers
          }
          fees.push(receiver.address)
        }
        if (this.receiverPayFee === false) {
          fees = []
        }
        let transid = await this.$store.dispatch('vdsrpc/sendMany', {
          fromAddress: this.fromAddress,
          receivers: receivers,
          comment: this.markup,
          feeFrom: fees
        }).catch(e => {
          this.$message.error('发送交易失败！请仔细核对交易是否确实未发起再重试！' + e)
        })
        this.$alert("创建交易成功！交易id:" + transid)
      } catch (e) {
        console.log(e)
      }

    },
    async loadData() {
      try {
        await Promise.all([this.loadWalletInfo(), this.loadAddressesInfo()])

      }
      catch (e) {
        this.$alert("加载数据失败，请检查钱包rpc是否开启")
      }

    },
    remove(index) {
      this.receivers.splice(index, 1)
    },
    async add() {
      try {
        let { value: nums } = await this.$prompt('请输入要添加的地址个数', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
        })
        nums = parseInt(nums)
        for (let i = 0; i < nums; i++) {
          this.receivers.push({
            name: '',
            address: '',
            input: true,
            amount: ''
          })
        }
      } catch (e) {
        console.log(e)
      }

    },
    async loadWalletInfo() {
      let data = await this.$store.dispatch("vdsrpc/getWalletInfo")
      this.walletInfo = data
    },
    async loadAddressesInfo() {
      let data = await this.$store.dispatch("vdsrpc/getAddressesInfo")
      this.addressInfo = data
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