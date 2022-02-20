<template>
	<el-form :inline="true" ref="form" :model="form" label-width="80px">
		<el-form-item
			prop="id"
			label="商品ID"
			:rules="[{ required: true, message: '请输入商品ID', trigger: 'blur' }, { type: 'number', message: '商品ID必须为数字值', trigger: 'blur'}]"
		>
			<el-input v-model.number="form.id" placeholder="商品ID"></el-input>
		</el-form-item>
		<el-form-item prop="price" label="最高价格" :rules="[{ type: 'number', message: '商品ID必须为数字值', trigger: 'blur'}]">
			<el-input v-model.number="form.price" placeholder="最高价格"></el-input>
		</el-form-item>
		<el-form-item>
			<el-button type="primary" @click="initBrowser">启动浏览器</el-button>
			<el-switch v-model="modeValue" active-text="自动加价" inactive-text="出最高价"></el-switch>
			<el-button type="primary" @click="searchItemInfo">查询价格</el-button>
			<el-button type="primary" @click="goToDid">开始抢购</el-button>
		</el-form-item>
	</el-form>
</template>

<script>
export default {
	name: "ItemInfo",
	data() {
		return {
			form: {
				id: undefined,
				price: undefined,
			},
			modeValue: true,
		}
	},
	methods: {
		searchItemInfo() {
			this.$emit("search", this.form.id)
		},
		goToDid() {
			this.$refs["form"].validate((valid) => {
				if (valid) {
					this.$emit("go-to-bid", this.form.id, this.form.price, this.modeValue);
				} else {
					return false;
				}
			});
		},
		initBrowser() {
			this.$emit("init-browser")
		}
	},
}
</script>

<style scoped>

</style>