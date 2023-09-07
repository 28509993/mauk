/**
 * Created by wangmin on 18/7/21.
 */


const redisLib = require('redis')

exports = module.exports = tuple('log!normal','setting', function redis(log,setting) {
	const settting  = JSON.parse(JSON.stringify(setting.redis))
	const  controller = this;
	if (!Array.isArray(settting)) throw new Error('redis  setting need array!');
	let clientCache = {};
	settting.forEach((item)=>{
		clientCache[item.sn] = item
	})
	function Client(client) {
		this.inner = client;
	}

	Client.prototype.get = async function (key) {
		const client = this.inner;
		return new Promise(function (resolve, reject) {
			client.get(key,(err,val)=>{
				if (err){
					return reject(err)
				} else {
					resolve(val)
				}
			})

		})
	}

  return function (sn) {
    let node = clientCache[sn] || clientCache[0];
		if (node._database){
			return Promise.resolve(node._database)
		}
		let p = new Promise((resolve, reject)=>{
			log.info('[redid]init redis!')
			//log.warn(`[redis]redis auth_pass:[${node.options.auth_pass}]`)
			let options = {...node.options,detect_buffers: true,retry_strategy: (opt)=>{
					if (opt.error && opt.error.code === "ECONNREFUSED") {
						return new Error("The server refused the connection");
					}
					return Math.min(opt.attempt * 1000, 3000);
				}}
			const client = redisLib.createClient(node.port, node.address,options );
			client.on('error', function (err) {
			});
			client.on('ready', function () {
				log.info('[redis]redis '+ node.db +' ready!')
				resolve(node._database)
			});
			client.on('quit', function (err) {
				log.warn('[redis]-------------close')
			})
			node.db && client.select(node.db);
			node._database = new Client(client);
		})
		return p;
  }
});
